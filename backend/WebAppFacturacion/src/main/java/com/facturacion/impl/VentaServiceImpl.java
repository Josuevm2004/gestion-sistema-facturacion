package com.facturacion.impl;

import com.facturacion.entity.Cliente;
import com.facturacion.entity.EstadoCliente;
import com.facturacion.entity.HistorialEstadoCliente;
import com.facturacion.entity.Pago;
import com.facturacion.entity.ServicioCliente;
import com.facturacion.entity.Suscripcion;
import com.facturacion.entity.UsuarioAdmin;
import com.facturacion.entity.Venta;
import com.facturacion.enums.EstadoPago;
import com.facturacion.enums.EstadoServicio;
import com.facturacion.enums.EstadoVenta;
import com.facturacion.enums.MedioPago;
import com.facturacion.enums.TipoProrrateo;
import com.facturacion.enums.TipoSuscripcion;
import com.facturacion.enums.TipoVenta;
import com.facturacion.exception.ResourceNotFoundException;
import com.facturacion.repository.ClienteRepository;
import com.facturacion.repository.EstadoClienteRepository;
import com.facturacion.repository.HistorialEstadoClienteRepository;
import com.facturacion.repository.PagoRepository;
import com.facturacion.repository.ServicioClienteRepository;
import com.facturacion.repository.SuscripcionRepository;
import com.facturacion.repository.UsuarioAdminRepository;
import com.facturacion.repository.VentaRepository;
import com.facturacion.request.ProcesarOperacionVentaRequest;
import com.facturacion.service.VentaService;
import com.facturacion.util.ProrrateoCalculatorUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Comparator;
import java.util.List;

@Service
public class VentaServiceImpl implements VentaService {

    private static final LocalTime BILLING_CUTOFF_TIME = LocalTime.MIDNIGHT;

    @Autowired
    private VentaRepository ventaRepository;
    @Autowired
    private ClienteRepository clienteRepository;
    @Autowired
    private UsuarioAdminRepository usuarioAdminRepository;
    @Autowired
    private SuscripcionRepository suscripcionRepository;
    @Autowired
    private ServicioClienteRepository servicioClienteRepository;
    @Autowired
    private EstadoClienteRepository estadoClienteRepository;
    @Autowired
    private HistorialEstadoClienteRepository historialEstadoClienteRepository;
    @Autowired
    private PagoRepository pagoRepository;

    @Value("${app.billing.monthly-billing-day:1}")
    private int monthlyBillingDay;

    @Override
    @Transactional
    public Venta procesarOperacion(ProcesarOperacionVentaRequest request) {
        Cliente cliente = clienteRepository.findByIdAndActivoTrue(request.getClienteId())
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado"));

        UsuarioAdmin vendedor = resolverVendedor(request.getVendedorId());
        Suscripcion suscripcion = resolverSuscripcion(request);
        TipoVenta tipo = request.getTipoVenta() != null ? request.getTipoVenta() : TipoVenta.RENOVACION;
        LocalDateTime fechaRef = LocalDateTime.now();

        List<Venta> ventasCliente = ventaRepository.findByClienteIdOrderByFechaVentaDesc(cliente.getId());
        if (tipo == TipoVenta.MEJORA_PLAN) {
            return procesarMejoraPlan(cliente, vendedor, suscripcion, request, ventasCliente, fechaRef);
        }

        Venta operacionReciente = encontrarOperacionPagadaReciente(ventasCliente, tipo, suscripcion, fechaRef);
        if (operacionReciente != null) {
            return operacionReciente;
        }

        ServicioCliente servicioActual = servicioClienteRepository.findTopByClienteIdOrderByFechaFinDesc(cliente.getId()).orElse(null);
        validarOperacionVencida(tipo, cliente, servicioActual, fechaRef);
        Venta ventaPendiente = encontrarVentaPendienteParaOperacion(ventasCliente, tipo, suscripcion, servicioActual);
        Venta ventaAnterior = ventasCliente.stream()
                .filter(v -> v.getEstadoVenta() == EstadoVenta.PAGADA)
                .findFirst()
                .orElse(ventasCliente.isEmpty() ? null : ventasCliente.get(0));

        if (tipo == TipoVenta.RENOVACION
                && ventaAnterior != null
                && ventaAnterior.getSuscripcion() != null
                && !mismaSuscripcion(ventaAnterior, suscripcion)) {
            throw new ResourceNotFoundException(
                    "La renovación debe conservar el plan y la modalidad vigentes. Usa Cambio de Plan para modificarlos");
        }

        boolean usarMontoPendienteProgramado = debeUsarMontoPendienteProgramado(ventaPendiente, fechaRef);
        LocalDate fechaInicioDate = resolverFechaInicioOperacion(ventaPendiente, fechaRef);
        LocalDateTime fechaInicio = fechaInicioDate.equals(fechaRef.toLocalDate())
                ? fechaRef
                : LocalDateTime.of(fechaInicioDate, LocalTime.NOON);

        BigDecimal precioLista = suscripcion.getPrecio();
        BigDecimal descuentoProrrateo = BigDecimal.ZERO;
        BigDecimal montoTotal = precioLista;
        LocalDateTime fechaFin;
        int diasProrrateados;

        if (suscripcion.getTipoSuscripcion() == TipoSuscripcion.ANUAL) {
            fechaFin = fechaInicio.plusYears(1);
            diasProrrateados = 365;
            descuentoProrrateo = BigDecimal.ZERO;
            montoTotal = precioLista;
        } else if (tipo == TipoVenta.CAMBIO_PLAN) {
            if (correspondeSegundoProrrateo(fechaInicioDate)) {
                ProrrateoCalculatorUtil.ResultadoSegundoProrrateo resultado =
                        ProrrateoCalculatorUtil.calcularSegundoProrrateo(precioLista, fechaInicioDate);
                LocalDate fechaCobroSegundo = resultado.fechaFin().plusDays(1);
                fechaFin = LocalDateTime.of(fechaCobroSegundo, BILLING_CUTOFF_TIME);
                diasProrrateados = Math.max(1, (int) java.time.temporal.ChronoUnit.DAYS.between(fechaInicioDate, fechaCobroSegundo));
            } else {
                fechaFin = fechaInicio.plusMonths(1);
                diasProrrateados = Math.max(1, (int) java.time.temporal.ChronoUnit.DAYS.between(fechaInicioDate, fechaFin.toLocalDate()));
            }
            descuentoProrrateo = BigDecimal.ZERO;
            montoTotal = precioLista;
        } else if (usarMontoPendienteProgramado) {
            descuentoProrrateo = ventaPendiente.getMontoProrrateado() != null ? ventaPendiente.getMontoProrrateado() : BigDecimal.ZERO;
            montoTotal = ventaPendiente.getMontoTotal() != null ? ventaPendiente.getMontoTotal() : precioLista;
            LocalDate fechaFinMensual = ProrrateoCalculatorUtil.calcularFechaFinMensual(fechaInicioDate, monthlyBillingDay);
            fechaFin = LocalDateTime.of(fechaFinMensual, BILLING_CUTOFF_TIME);
            diasProrrateados = Math.max(1, (int) java.time.temporal.ChronoUnit.DAYS.between(fechaInicioDate, fechaFinMensual));
        } else {
            if (correspondeSegundoProrrateo(fechaInicioDate)) {
                ProrrateoCalculatorUtil.ResultadoSegundoProrrateo resultado =
                        ProrrateoCalculatorUtil.calcularSegundoProrrateo(precioLista, fechaInicioDate);
                LocalDate fechaCobroSegundo = resultado.fechaFin().plusDays(1);
                fechaFin = LocalDateTime.of(fechaCobroSegundo, BILLING_CUTOFF_TIME);
                diasProrrateados = Math.max(1, (int) java.time.temporal.ChronoUnit.DAYS.between(fechaInicioDate, fechaCobroSegundo));
            } else {
                fechaFin = fechaInicio.plusMonths(1);
                diasProrrateados = Math.max(1, (int) java.time.temporal.ChronoUnit.DAYS.between(fechaInicioDate, fechaFin.toLocalDate()));
            }
            descuentoProrrateo = BigDecimal.ZERO;
            montoTotal = precioLista;
        }

        if (tipo == TipoVenta.CAMBIO_PLAN) {
            cancelarVentasPendientesCliente(cliente.getId(), null, fechaRef);
        } else {
            cancelarVentasPendientesCliente(cliente.getId(), ventaPendiente, fechaRef);
        }

        marcarServicioAnteriorComoVencido(servicioActual, fechaRef);

        Venta ventaProcesada = ventaPendiente != null && tipo == TipoVenta.RENOVACION ? ventaPendiente : new Venta();
        ventaProcesada.setCliente(cliente);
        ventaProcesada.setVendedor(vendedor);
        ventaProcesada.setSuscripcion(suscripcion);
        ventaProcesada.setTipoVenta(tipo);
        if (ventaProcesada.getVentaAnterior() == null) {
            ventaProcesada.setVentaAnterior(ventaAnterior);
        }
        ventaProcesada.setPrecioLista(precioLista);
        ventaProcesada.setMontoProrrateado(descuentoProrrateo);
        ventaProcesada.setMontoTotal(montoTotal);
        ventaProcesada.setEstadoVenta(EstadoVenta.PAGADA);
        ventaProcesada.setObservaciones(request.getObservaciones() != null
                ? request.getObservaciones()
                : "Operacion de " + tipo.name());
        ventaProcesada.setFechaVenta(fechaRef);
        ventaProcesada.setFechaActualizacion(fechaRef);
        ventaProcesada = ventaRepository.save(ventaProcesada);

        registrarPagoSiNoExiste(cliente, ventaProcesada, tipo, montoTotal, fechaRef);
        activarServicio(cliente, ventaProcesada, fechaInicio, fechaFin, montoTotal, diasProrrateados, fechaRef);
        crearSiguienteRenovacionPendiente(ventaProcesada, fechaFin);
        habilitarCliente(cliente, vendedor, tipo, montoTotal, fechaRef);

        return ventaProcesada;
    }

    @Override
    @Transactional
    public Venta procesarAdelantoPago(ProcesarOperacionVentaRequest request) {
        Cliente cliente = clienteRepository.findByIdAndActivoTrue(request.getClienteId())
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado"));

        List<Venta> ventasCliente = ventaRepository.findByClienteIdOrderByFechaVentaDesc(cliente.getId());
        Venta ventaAnterior = ventasCliente.stream()
                .filter(v -> v.getEstadoVenta() == EstadoVenta.PAGADA)
                .findFirst()
                .orElse(ventasCliente.isEmpty() ? null : ventasCliente.get(0));

        ServicioCliente servicioActual = servicioClienteRepository.findTopByClienteIdOrderByFechaFinDesc(cliente.getId()).orElse(null);

        UsuarioAdmin vendedor = resolverVendedor(request.getVendedorId());
        if (vendedor == null && ventaAnterior != null && ventaAnterior.getVendedor() != null) {
            vendedor = ventaAnterior.getVendedor();
        }

        Suscripcion suscripcion = null;
        if (request.getSuscripcionId() != null || (request.getPlanId() != null && request.getTipoSuscripcion() != null)) {
            try {
                suscripcion = resolverSuscripcion(request);
            } catch (Exception ignored) {}
        }
        if (suscripcion == null) {
            suscripcion = ventasCliente.stream()
                    .filter(v -> v.getSuscripcion() != null)
                    .map(Venta::getSuscripcion)
                    .findFirst()
                    .orElse(null);
        }
        if (suscripcion == null && servicioActual != null && servicioActual.getVenta() != null && servicioActual.getVenta().getSuscripcion() != null) {
            suscripcion = servicioActual.getVenta().getSuscripcion();
        }
        if (suscripcion == null) {
            suscripcion = suscripcionRepository.findByPlanIdAndTipoSuscripcionAndActivoTrue(1L, TipoSuscripcion.MENSUAL)
                    .orElseGet(() -> suscripcionRepository.findAll().stream().filter(s -> Boolean.TRUE.equals(s.getActivo())).findFirst()
                            .orElseThrow(() -> new ResourceNotFoundException("No se encontró suscripción para procesar el adelanto")));
        }

        LocalDateTime fechaRef = LocalDateTime.now();

        // Fecha de inicio del nuevo ciclo: Si el servicio actual vence en el futuro, inicia exactamente en esa fecha de vencimiento
        LocalDateTime fechaInicio;
        if (servicioActual != null && servicioActual.getFechaFin() != null && servicioActual.getFechaFin().isAfter(fechaRef)) {
            fechaInicio = servicioActual.getFechaFin();
        } else {
            fechaInicio = fechaRef;
        }

        Venta ventaPendiente = ventasCliente.stream()
                .filter(v -> v.getEstadoVenta() == EstadoVenta.PENDIENTE_PAGO)
                .findFirst()
                .orElse(null);

        BigDecimal precioLista = suscripcion.getPrecio();
        BigDecimal montoTotal = request.getMonto() != null && request.getMonto().compareTo(BigDecimal.ZERO) > 0
                ? request.getMonto()
                : (ventaPendiente != null && ventaPendiente.getMontoTotal() != null ? ventaPendiente.getMontoTotal() : precioLista);

        LocalDateTime fechaFin;
        int diasProrrateados;
        if (suscripcion.getTipoSuscripcion() == TipoSuscripcion.ANUAL) {
            fechaFin = fechaInicio.plusYears(1);
            diasProrrateados = 365;
        } else {
            fechaFin = fechaInicio.plusMonths(1);
            diasProrrateados = Math.max(1, (int) java.time.temporal.ChronoUnit.DAYS.between(fechaInicio.toLocalDate(), fechaFin.toLocalDate()));
        }

        // Cancelar ventas pendientes anteriores para evitar duplicados
        cancelarVentasPendientesCliente(cliente.getId(), null, fechaRef);

        Venta ventaAdelanto = new Venta();
        ventaAdelanto.setCliente(cliente);
        ventaAdelanto.setVendedor(vendedor);
        ventaAdelanto.setSuscripcion(suscripcion);
        ventaAdelanto.setTipoVenta(TipoVenta.RENOVACION);
        ventaAdelanto.setVentaAnterior(ventaAnterior);
        ventaAdelanto.setPrecioLista(precioLista);
        ventaAdelanto.setMontoProrrateado(BigDecimal.ZERO);
        ventaAdelanto.setMontoTotal(montoTotal);
        ventaAdelanto.setEstadoVenta(EstadoVenta.PAGADA);
        ventaAdelanto.setObservaciones(request.getObservaciones() != null && !request.getObservaciones().isBlank()
                ? request.getObservaciones()
                : "Adelanto de Pago para el ciclo " + fechaInicio.toLocalDate() + " al " + fechaFin.toLocalDate());
        ventaAdelanto.setFechaVenta(fechaRef); // Fecha real de ingreso del dinero
        ventaAdelanto.setFechaActualizacion(fechaRef);
        ventaAdelanto = ventaRepository.save(ventaAdelanto);

        registrarPagoSiNoExiste(cliente, ventaAdelanto, TipoVenta.RENOVACION, montoTotal, fechaRef);

        // Extender o crear el servicio activo con la nueva fechaFin
        if (servicioActual != null && servicioActual.getEstado() == EstadoServicio.ACTIVO) {
            servicioActual.setFechaFin(fechaFin);
            servicioActual.setFechaActualizacion(fechaRef);
            servicioClienteRepository.save(servicioActual);
        } else {
            activarServicio(cliente, ventaAdelanto, fechaInicio, fechaFin, montoTotal, diasProrrateados, fechaRef);
        }

        crearSiguienteRenovacionPendiente(ventaAdelanto, fechaFin);
        habilitarCliente(cliente, vendedor, TipoVenta.RENOVACION, montoTotal, fechaRef);
        cliente.setAvisado(false);
        clienteRepository.save(cliente);

        return ventaAdelanto;
    }

    private void validarOperacionVencida(
            TipoVenta tipo,
            Cliente cliente,
            ServicioCliente servicio,
            LocalDateTime fechaRef) {
        if (tipo != TipoVenta.RENOVACION && tipo != TipoVenta.CAMBIO_PLAN) {
            return;
        }
        if (servicio == null || servicio.getFechaFin() == null) {
            throw new ResourceNotFoundException("No existe un servicio vencido para procesar esta operacion");
        }
        boolean vencidoPorFecha = !servicio.getFechaFin().toLocalDate().isAfter(fechaRef.toLocalDate());
        boolean estadoPermiteOperacion = servicio.getEstado() == EstadoServicio.VENCIDO
                || servicio.getEstado() == EstadoServicio.BLOQUEADO;
        if (!vencidoPorFecha && !estadoPermiteOperacion) {
            throw new ResourceNotFoundException(
                    "Renovacion y cambio de plan solo estan disponibles cuando el servicio esta vencido o bloqueado");
        }
        if (servicio.getEstado() == EstadoServicio.PENDIENTE_CAPACITACION) {
            throw new ResourceNotFoundException("El cliente aun esta pendiente de capacitacion");
        }
    }

    private void marcarServicioAnteriorComoVencido(ServicioCliente servicio, LocalDateTime fechaRef) {
        if (servicio != null
                && servicio.getEstado() == EstadoServicio.ACTIVO
                && servicio.getFechaFin() != null
                && !servicio.getFechaFin().toLocalDate().isAfter(fechaRef.toLocalDate())) {
            servicio.setEstado(EstadoServicio.VENCIDO);
            servicio.setFechaActualizacion(fechaRef);
            servicioClienteRepository.save(servicio);
        }
    }

    private Venta procesarMejoraPlan(
            Cliente cliente,
            UsuarioAdmin vendedor,
            Suscripcion nuevaSuscripcion,
            ProcesarOperacionVentaRequest request,
            List<Venta> ventasCliente,
            LocalDateTime fechaRef) {
        EstadoCliente estadoActual = cliente.getEstado();
        if (estadoActual == null || !"HABILITADO".equals(estadoActual.getNombre())) {
            throw new ResourceNotFoundException("La mejora de plan solo aplica a clientes con cuenta HABILITADA");
        }

        ServicioCliente servicioActual = servicioClienteRepository.findTopByClienteIdOrderByFechaFinDesc(cliente.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Servicio activo no encontrado para mejorar plan"));
        if (servicioActual.getEstado() != EstadoServicio.ACTIVO
                || servicioActual.getFechaInicio() == null
                || servicioActual.getFechaFin() == null
                || !servicioActual.getFechaFin().toLocalDate().isAfter(fechaRef.toLocalDate())) {
            throw new ResourceNotFoundException("El cliente no tiene un servicio activo vigente para mejorar plan");
        }

        Venta ventaActual = ventasCliente.stream()
                .filter(v -> v.getEstadoVenta() == EstadoVenta.PAGADA)
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("No existe una venta vigente pagada para mejorar plan"));
        if (ventaActual.getSuscripcion() == null) {
            throw new ResourceNotFoundException("La venta vigente no tiene suscripción registrada");
        }
        if (nuevaSuscripcion.getTipoSuscripcion() != ventaActual.getSuscripcion().getTipoSuscripcion()) {
            throw new ResourceNotFoundException("Mejorar plan no cambia mensual/anual. Usa Cambio de Plan cuando el servicio venza");
        }

        BigDecimal precioActual = ventaActual.getSuscripcion().getPrecio();
        BigDecimal precioNuevo = nuevaSuscripcion.getPrecio();
        if (precioNuevo == null || precioActual == null || precioNuevo.compareTo(precioActual) <= 0) {
            throw new ResourceNotFoundException("La mejora debe ser hacia un plan de mayor precio");
        }

        BigDecimal diferenciaLista = precioNuevo.subtract(precioActual);
        LocalDate fechaBaseProrrateo = servicioActual.getFechaCapacitacion() != null
                ? servicioActual.getFechaCapacitacion().toLocalDate()
                : servicioActual.getFechaInicio().toLocalDate();
        // La mejora se cobra siempre por la diferencia completa entre planes.
        // El prorrateo del nuevo plan se actualiza por separado desde la capacitación.
        BigDecimal montoMejora = diferenciaLista;

        Venta mejora = new Venta();
        mejora.setCliente(cliente);
        // La mejora conserva el vendedor de la venta vigente. Solo se usa
        // otro vendedor cuando la operacion lo solicita explicitamente.
        UsuarioAdmin vendedorMejora = vendedor;
        if (request.getVendedorId() == null) {
            vendedorMejora = ventasCliente.stream()
                    .filter(v -> v.getTipoVenta() != TipoVenta.MEJORA_PLAN)
                    .filter(v -> v.getVendedor() != null)
                    .map(Venta::getVendedor)
                    .findFirst()
                    .orElse(ventaActual.getVendedor());
        }
        mejora.setVendedor(vendedorMejora);
        mejora.setSuscripcion(nuevaSuscripcion);
        mejora.setTipoVenta(TipoVenta.MEJORA_PLAN);
        mejora.setVentaAnterior(ventaActual);
        mejora.setPrecioLista(diferenciaLista);
        mejora.setMontoProrrateado(diferenciaLista.subtract(montoMejora).max(BigDecimal.ZERO));
        mejora.setMontoTotal(montoMejora);
        mejora.setEstadoVenta(EstadoVenta.PAGADA);
        mejora.setObservaciones(request.getObservaciones() != null
                ? request.getObservaciones()
                : "Mejora de plan sin modificar fecha de inicio ni vencimiento del servicio");
        mejora.setFechaVenta(fechaRef);
        mejora.setFechaActualizacion(fechaRef);
        mejora = ventaRepository.save(mejora);

        registrarPagoSiNoExiste(cliente, mejora, TipoVenta.MEJORA_PLAN, montoMejora, fechaRef);

        servicioActual.setFechaActualizacion(fechaRef);
        actualizarProrrateoVigente(servicioActual, precioNuevo, nuevaSuscripcion.getTipoSuscripcion(), fechaBaseProrrateo);
        servicioActual.setObservaciones("Plan mejorado a "
                + (nuevaSuscripcion.getPlan() != null ? nuevaSuscripcion.getPlan().getNombrePlan() : "nuevo plan")
                + " sin modificar vencimiento");
        servicioClienteRepository.save(servicioActual);
        actualizarRenovacionPendientePorMejora(
                cliente.getId(),
                nuevaSuscripcion,
                mejora,
                servicioActual,
                servicioActual.getFechaFin(),
                fechaRef
        );

        HistorialEstadoCliente h = new HistorialEstadoCliente();
        h.setCliente(cliente);
        h.setEstadoAnterior(estadoActual);
        h.setEstadoNuevo(estadoActual);
        h.setUsuarioAdmin(mejora.getVendedor());
        h.setMotivo("Mejora de plan registrada por S/ " + montoMejora + ". Fechas del servicio conservadas.");
        h.setFechaCambio(fechaRef);
        historialEstadoClienteRepository.save(h);

        return mejora;
    }

    private void actualizarRenovacionPendientePorMejora(
            Long clienteId,
            Suscripcion nuevaSuscripcion,
            Venta mejora,
            ServicioCliente servicioActual,
            LocalDateTime fechaFinServicio,
            LocalDateTime fechaRef) {
        Venta pendiente = ventaRepository.findByClienteIdOrderByFechaVentaDesc(clienteId).stream()
                .filter(v -> v.getEstadoVenta() == EstadoVenta.PENDIENTE_PAGO)
                .filter(v -> v.getTipoVenta() == TipoVenta.RENOVACION)
                .filter(v -> v.getFechaVenta() == null || !v.getFechaVenta().toLocalDate().isBefore(fechaRef.toLocalDate()))
                .min(Comparator.comparing(Venta::getFechaVenta, Comparator.nullsLast(Comparator.naturalOrder())))
                .orElse(null);

        if (pendiente == null) {
            pendiente = new Venta();
            pendiente.setCliente(mejora.getCliente());
            pendiente.setTipoVenta(TipoVenta.RENOVACION);
            pendiente.setEstadoVenta(EstadoVenta.PENDIENTE_PAGO);
        }

        pendiente.setVentaAnterior(mejora);
        pendiente.setSuscripcion(nuevaSuscripcion);
        pendiente.setVendedor(mejora.getVendedor());
        BigDecimal precioNuevo = nuevaSuscripcion.getPrecio();

        // En una mejora de plan, la siguiente renovación es el mes completo regular del nuevo plan sin prorrateos
        pendiente.setTipoProrrateo(TipoProrrateo.NINGUNO);
        pendiente.setMontoProrrateado(BigDecimal.ZERO);
        pendiente.setMontoProrrateoAdicional(BigDecimal.ZERO);
        pendiente.setDiasProrrateoAdicional(0);
        pendiente.setFechaInicioProrrateoAdicional(null);
        pendiente.setFechaFinProrrateoAdicional(null);
        pendiente.setPrecioLista(precioNuevo);
        pendiente.setMontoTotal(precioNuevo);
        LocalDate fechaCobro = fechaFinServicio != null ? fechaFinServicio.toLocalDate() : fechaRef.toLocalDate().plusMonths(1);
        pendiente.setFechaVenta(LocalDateTime.of(fechaCobro, LocalTime.NOON));
        pendiente.setFechaActualizacion(fechaRef);
        pendiente.setObservaciones("Renovacion mensual regular del " + (nuevaSuscripcion.getPlan() != null ? nuevaSuscripcion.getPlan().getNombrePlan() : "nuevo plan") + " para " + fechaCobro);
        ventaRepository.save(pendiente);
    }

    private BigDecimal calcularMontoProrrateadoPlan(
            BigDecimal precioPlan,
            LocalDate fechaBaseProrrateo,
            TipoSuscripcion tipoSuscripcion) {
        if (tipoSuscripcion == TipoSuscripcion.ANUAL) {
            return precioPlan.setScale(0, RoundingMode.HALF_UP);
        }

        ProrrateoCalculatorUtil.ResultadoProrrateo resultado =
                ProrrateoCalculatorUtil.calcularHastaDiaCobro(precioPlan, fechaBaseProrrateo, monthlyBillingDay);
        return resultado.montoFinal();
    }

    private boolean correspondeSegundoProrrateo(LocalDate fechaBaseProrrateo) {
        return fechaBaseProrrateo != null
                && fechaBaseProrrateo.getDayOfMonth()
                >= ProrrateoCalculatorUtil.SECOND_PRORATION_TRANSITION_DAY;
    }

    private void actualizarProrrateoVigente(
            ServicioCliente servicio,
            BigDecimal precioNuevo,
            TipoSuscripcion tipoSuscripcion,
            LocalDate fechaBaseProrrateo) {
        servicio.setMontoProrrateo(precioNuevo);
        servicio.setDiasProrrateados(tipoSuscripcion == TipoSuscripcion.ANUAL ? 365 : 30);
        servicioClienteRepository.save(servicio);
    }

    private Venta encontrarVentaPendienteParaOperacion(
            List<Venta> ventasCliente,
            TipoVenta tipo,
            Suscripcion suscripcion,
            ServicioCliente servicioActual) {
        if (tipo != TipoVenta.RENOVACION) {
            return null;
        }

        Venta mismaSuscripcion = ventasCliente.stream()
                .filter(v -> v.getEstadoVenta() == EstadoVenta.PENDIENTE_PAGO)
                .filter(v -> v.getTipoVenta() == TipoVenta.RENOVACION)
                .filter(v -> !esPendienteObsoleta(v, servicioActual))
                .filter(v -> mismaSuscripcion(v, suscripcion))
                .sorted(Comparator.comparing(Venta::getFechaVenta, Comparator.nullsLast(Comparator.naturalOrder())))
                .findFirst()
                .orElse(null);

        if (mismaSuscripcion != null) {
            return mismaSuscripcion;
        }

        return ventasCliente.stream()
                .filter(v -> v.getEstadoVenta() == EstadoVenta.PENDIENTE_PAGO)
                .filter(v -> v.getTipoVenta() == TipoVenta.RENOVACION)
                .filter(v -> !esPendienteObsoleta(v, servicioActual))
                .sorted(Comparator.comparing(Venta::getFechaVenta, Comparator.nullsLast(Comparator.naturalOrder())))
                .findFirst()
                .orElse(null);
    }

    private boolean esPendienteObsoleta(Venta venta, ServicioCliente servicioActual) {
        return venta != null
                && venta.getFechaVenta() != null
                && servicioActual != null
                && servicioActual.getEstado() == EstadoServicio.ACTIVO
                && servicioActual.getFechaInicio() != null
                && venta.getFechaVenta().isBefore(servicioActual.getFechaInicio());
    }

    private boolean mismaSuscripcion(Venta venta, Suscripcion suscripcion) {
        return venta.getSuscripcion() != null
                && suscripcion != null
                && venta.getSuscripcion().getId() != null
                && venta.getSuscripcion().getId().equals(suscripcion.getId());
    }

    private Venta encontrarOperacionPagadaReciente(
            List<Venta> ventasCliente,
            TipoVenta tipo,
            Suscripcion suscripcion,
            LocalDateTime fechaRef) {
        return ventasCliente.stream()
                .filter(v -> v.getEstadoVenta() == EstadoVenta.PAGADA)
                .filter(v -> v.getTipoVenta() == tipo)
                .filter(v -> mismaSuscripcion(v, suscripcion))
                .filter(v -> v.getFechaVenta() != null && !v.getFechaVenta().isBefore(fechaRef.minusMinutes(2)))
                .findFirst()
                .orElse(null);
    }

    private boolean debeUsarMontoPendienteProgramado(Venta ventaPendiente, LocalDateTime fechaRef) {
        return ventaPendiente != null
                && ventaPendiente.getMontoTotal() != null
                && ventaPendiente.getFechaVenta() != null
                && (ventaPendiente.getTipoProrrateo() == TipoProrrateo.SEGUNDO_PRORRATEO
                    || !fechaRef.toLocalDate().isAfter(ventaPendiente.getFechaVenta().toLocalDate()));
    }

    private LocalDate resolverFechaInicioOperacion(Venta ventaPendiente, LocalDateTime fechaRef) {
        LocalDate hoy = fechaRef.toLocalDate();
        if (ventaPendiente != null && ventaPendiente.getFechaVenta() != null) {
            LocalDate fechaProgramada = ventaPendiente.getFechaVenta().toLocalDate();
            if (hoy.isBefore(fechaProgramada)) {
                return fechaProgramada;
            }
        }
        return hoy;
    }

    private void cancelarVentasPendientesCliente(Long clienteId, Venta ventaExceptuada, LocalDateTime fechaRef) {
        List<Venta> pendientes = ventaRepository.findByClienteIdOrderByFechaVentaDesc(clienteId).stream()
                .filter(v -> v.getEstadoVenta() == EstadoVenta.PENDIENTE_PAGO)
                .filter(v -> ventaExceptuada == null || v.getId() == null || !v.getId().equals(ventaExceptuada.getId()))
                .toList();

        for (Venta pendiente : pendientes) {
            pendiente.setEstadoVenta(EstadoVenta.CANCELADA);
            pendiente.setFechaActualizacion(fechaRef);
        }
        if (!pendientes.isEmpty()) {
            ventaRepository.saveAll(pendientes);
        }
    }

    private void registrarPagoSiNoExiste(Cliente cliente, Venta venta, TipoVenta tipo, BigDecimal montoTotal, LocalDateTime fechaRef) {
        Pago pagoExistente = pagoRepository.findTopByVentaIdAndEstadoPagoOrderByFechaRegistroDesc(venta.getId(), EstadoPago.PAGADO)
                .orElse(null);
        if (pagoExistente != null) {
            return;
        }

        Pago pago = new Pago();
        pago.setVenta(venta);
        pago.setCodigoOperacion(tipo.name() + "-" + cliente.getId() + "-" + System.currentTimeMillis());
        pago.setMonto(montoTotal);
        pago.setMedioPago(MedioPago.OTRO);
        pago.setEstadoPago(EstadoPago.PAGADO);
        pago.setFechaPago(fechaRef);
        pago.setFechaRegistro(fechaRef);
        pago.setObservaciones("Pago registrado automaticamente por " + tipo.name());
        pagoRepository.save(pago);
    }

    private void activarServicio(
            Cliente cliente,
            Venta venta,
            LocalDateTime fechaInicio,
            LocalDateTime fechaFin,
            BigDecimal montoTotal,
            int diasProrrateados,
            LocalDateTime fechaRef) {
        ServicioCliente servicio = servicioClienteRepository.findByVentaId(venta.getId()).orElseGet(ServicioCliente::new);
        servicio.setCliente(cliente);
        servicio.setVenta(venta);
        servicio.setFechaInicio(fechaInicio);
        servicio.setFechaFin(fechaFin);
        servicio.setFechaCapacitacion(fechaInicio);
        servicio.setEstado(EstadoServicio.ACTIVO);
        servicio.setMontoProrrateo(montoTotal);
        servicio.setDiasProrrateados(diasProrrateados);
        servicio.setObservaciones("Servicio activado por " + venta.getTipoVenta());
        if (servicio.getId() == null) {
            servicio.setFechaCreacion(fechaRef);
        }
        servicio.setFechaActualizacion(fechaRef);
        servicioClienteRepository.save(servicio);
    }

    private void habilitarCliente(Cliente cliente, UsuarioAdmin vendedor, TipoVenta tipo, BigDecimal montoTotal, LocalDateTime fechaRef) {
        EstadoCliente viejoEstado = cliente.getEstado();
        EstadoCliente estadoHabilitado = estadoClienteRepository.findByNombreAndActivoTrue("HABILITADO")
                .orElseGet(() -> {
                    EstadoCliente e = new EstadoCliente();
                    e.setNombre("HABILITADO");
                    e.setDescripcion("Cliente habilitado");
                    return estadoClienteRepository.save(e);
                });

        cliente.setEstado(estadoHabilitado);
        cliente.setAvisado(false);
        cliente.setFechaActualizacion(fechaRef);
        clienteRepository.save(cliente);

        HistorialEstadoCliente h = new HistorialEstadoCliente();
        h.setCliente(cliente);
        h.setEstadoAnterior(viejoEstado);
        h.setEstadoNuevo(estadoHabilitado);
        h.setUsuarioAdmin(vendedor);
        h.setMotivo("Operacion realizada: " + tipo.name() + " por S/ " + montoTotal);
        h.setFechaCambio(fechaRef);
        historialEstadoClienteRepository.save(h);
    }

    private UsuarioAdmin resolverVendedor(Long vendedorId) {
        if (vendedorId != null) {
            UsuarioAdmin vendedor = usuarioAdminRepository.findById(vendedorId).orElse(null);
            if (vendedor != null) {
                return vendedor;
            }
        }
        return usuarioAdminRepository.findAll().stream().findFirst().orElse(null);
    }

    private Suscripcion resolverSuscripcion(ProcesarOperacionVentaRequest request) {
        if (request.getPlanId() != null && request.getTipoSuscripcion() != null) {
            return suscripcionRepository.findByPlanIdAndTipoSuscripcionAndActivoTrue(request.getPlanId(), request.getTipoSuscripcion())
                    .orElseThrow(() -> new ResourceNotFoundException("Suscripcion no encontrada para el plan seleccionado"));
        }

        if (request.getSuscripcionId() != null) {
            Suscripcion suscripcion = suscripcionRepository.findById(request.getSuscripcionId()).orElse(null);
            if (suscripcion != null) {
                return suscripcion;
            }

            Suscripcion legacy = resolverSuscripcionLegacy(request.getSuscripcionId());
            if (legacy != null) {
                return legacy;
            }
        }

        throw new ResourceNotFoundException("Suscripcion no encontrada");
    }

    private Suscripcion resolverSuscripcionLegacy(Long legacySuscripcionId) {
        if (legacySuscripcionId == null || legacySuscripcionId < 1 || legacySuscripcionId > 10) {
            return null;
        }

        long planId = ((legacySuscripcionId - 1) / 2) + 1;
        TipoSuscripcion tipo = legacySuscripcionId % 2 == 0 ? TipoSuscripcion.ANUAL : TipoSuscripcion.MENSUAL;
        return suscripcionRepository.findByPlanIdAndTipoSuscripcionAndActivoTrue(planId, tipo).orElse(null);
    }

    private void crearSiguienteRenovacionPendiente(Venta ventaActual, LocalDateTime fechaFinServicio) {
        if (ventaActual.getId() == null
                || ventaActual.getSuscripcion() == null
                || fechaFinServicio == null
                || ventaRepository.existsByVentaAnteriorIdAndTipoVentaAndEstadoVenta(
                        ventaActual.getId(), TipoVenta.RENOVACION, EstadoVenta.PENDIENTE_PAGO)) {
            return;
        }

        BigDecimal precioLista = ventaActual.getSuscripcion().getPrecio();
        LocalDate fechaInicioServicio = ventaActual.getFechaVenta() != null ? ventaActual.getFechaVenta().toLocalDate() : fechaFinServicio.toLocalDate().minusMonths(1);

        Venta siguienteVenta = new Venta();
        siguienteVenta.setCliente(ventaActual.getCliente());
        siguienteVenta.setVendedor(ventaActual.getVendedor());
        siguienteVenta.setSuscripcion(ventaActual.getSuscripcion());
        siguienteVenta.setTipoVenta(TipoVenta.RENOVACION);
        siguienteVenta.setVentaAnterior(ventaActual);
        siguienteVenta.setPrecioLista(precioLista);
        siguienteVenta.setEstadoVenta(EstadoVenta.PENDIENTE_PAGO);

        boolean esNuevoProrrateo = ventaActual.getTipoVenta() == TipoVenta.ALTA;
        if (esNuevoProrrateo
                && ventaActual.getSuscripcion().getTipoSuscripcion() == TipoSuscripcion.MENSUAL
                && correspondeSegundoProrrateo(fechaInicioServicio)) {
            ProrrateoCalculatorUtil.ResultadoSegundoProrrateo resultado =
                    ProrrateoCalculatorUtil.calcularSegundoProrrateo(precioLista, fechaInicioServicio);
            siguienteVenta.setTipoProrrateo(TipoProrrateo.SEGUNDO_PRORRATEO);
            siguienteVenta.setMontoProrrateado(BigDecimal.ZERO);
            siguienteVenta.setMontoProrrateoAdicional(resultado.montoAdicional());
            siguienteVenta.setDiasProrrateoAdicional(resultado.diasProrrateados());
            siguienteVenta.setFechaInicioProrrateoAdicional(LocalDateTime.of(resultado.fechaInicio(), LocalTime.NOON));
            siguienteVenta.setFechaFinProrrateoAdicional(LocalDateTime.of(resultado.fechaFin(), LocalTime.NOON));
            siguienteVenta.setMontoTotal(precioLista.add(resultado.montoAdicional()));
            LocalDate fechaCobroDate = resultado.fechaFin().plusDays(1);
            siguienteVenta.setFechaVenta(LocalDateTime.of(fechaCobroDate, LocalTime.NOON));
            siguienteVenta.setObservaciones("Renovacion con segundo prorrateo del " + resultado.fechaInicio() + " al " + resultado.fechaFin());
        } else {
            LocalDate fechaCobroDate = fechaFinServicio.toLocalDate();
            siguienteVenta.setTipoProrrateo(TipoProrrateo.NINGUNO);
            siguienteVenta.setMontoProrrateado(BigDecimal.ZERO);
            siguienteVenta.setMontoTotal(precioLista);
            siguienteVenta.setFechaVenta(LocalDateTime.of(fechaCobroDate, LocalTime.NOON));
            siguienteVenta.setObservaciones("Renovacion pendiente generada automaticamente para " + fechaCobroDate);
        }

        siguienteVenta.setFechaActualizacion(LocalDateTime.now());
        ventaRepository.save(siguienteVenta);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Venta> listarVentasPorCliente(Long clienteId) {
        return ventaRepository.findByClienteIdOrderByFechaVentaDesc(clienteId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Venta> listarTodasVentas() {
        return ventaRepository.findAll(org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "fechaVenta"));
    }
}
