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
        } else if (usarMontoPendienteProgramado) {
            descuentoProrrateo = ventaPendiente.getMontoProrrateado() != null ? ventaPendiente.getMontoProrrateado() : BigDecimal.ZERO;
            montoTotal = ventaPendiente.getMontoTotal() != null ? ventaPendiente.getMontoTotal() : precioLista;
            LocalDate fechaFinMensual = ProrrateoCalculatorUtil.calcularFechaFinMensual(fechaInicioDate, monthlyBillingDay);
            fechaFin = LocalDateTime.of(fechaFinMensual, BILLING_CUTOFF_TIME);
            diasProrrateados = Math.max(1, (int) java.time.temporal.ChronoUnit.DAYS.between(fechaInicioDate, fechaFinMensual));
        } else {
            ProrrateoCalculatorUtil.ResultadoProrrateo r =
                    ProrrateoCalculatorUtil.calcularHastaDiaCobro(precioLista, fechaInicioDate, monthlyBillingDay);
            descuentoProrrateo = r.descuento();
            montoTotal = r.montoFinal();
            LocalDate fechaFinMensual = ProrrateoCalculatorUtil.calcularFechaFinMensual(fechaInicioDate, monthlyBillingDay);
            fechaFin = LocalDateTime.of(fechaFinMensual, BILLING_CUTOFF_TIME);
            diasProrrateados = Math.max(1, r.diasTotales() - r.diasNoConsumidos());
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
        BigDecimal montoMejora = calcularDiferenciaProporcional(
                diferenciaLista,
                fechaRef.toLocalDate(),
                servicioActual.getFechaInicio().toLocalDate(),
                servicioActual.getFechaFin().toLocalDate()
        );

        Venta mejora = new Venta();
        mejora.setCliente(cliente);
        mejora.setVendedor(vendedor != null ? vendedor : ventaActual.getVendedor());
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
        servicioActual.setObservaciones("Plan mejorado a "
                + (nuevaSuscripcion.getPlan() != null ? nuevaSuscripcion.getPlan().getNombrePlan() : "nuevo plan")
                + " sin modificar vencimiento");
        servicioClienteRepository.save(servicioActual);
        actualizarRenovacionPendientePorMejora(cliente.getId(), nuevaSuscripcion, mejora, servicioActual.getFechaFin(), fechaRef);

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
            LocalDateTime fechaFinServicio,
            LocalDateTime fechaRef) {
        Venta pendiente = ventaRepository.findByClienteIdOrderByFechaVentaDesc(clienteId).stream()
                .filter(v -> v.getEstadoVenta() == EstadoVenta.PENDIENTE_PAGO)
                .filter(v -> v.getTipoVenta() == TipoVenta.RENOVACION)
                .filter(v -> v.getFechaVenta() == null || !v.getFechaVenta().toLocalDate().isBefore(fechaRef.toLocalDate()))
                .min(Comparator.comparing(Venta::getFechaVenta, Comparator.nullsLast(Comparator.naturalOrder())))
                .orElse(null);

        if (pendiente == null) {
            crearSiguienteRenovacionPendiente(mejora, fechaFinServicio);
            return;
        }

        pendiente.setVentaAnterior(mejora);
        pendiente.setSuscripcion(nuevaSuscripcion);
        pendiente.setVendedor(mejora.getVendedor());
        pendiente.setPrecioLista(nuevaSuscripcion.getPrecio());
        pendiente.setMontoProrrateado(BigDecimal.ZERO);
        pendiente.setMontoTotal(nuevaSuscripcion.getPrecio());
        pendiente.setFechaVenta(LocalDateTime.of(fechaFinServicio.toLocalDate(), LocalTime.NOON));
        pendiente.setFechaActualizacion(fechaRef);
        pendiente.setObservaciones("Renovacion pendiente actualizada por mejora de plan para " + fechaFinServicio.toLocalDate());
        ventaRepository.save(pendiente);
    }

    private BigDecimal calcularDiferenciaProporcional(
            BigDecimal diferenciaLista,
            LocalDate fechaOperacion,
            LocalDate fechaInicioServicio,
            LocalDate fechaFinServicio) {
        int diasTotales = Math.max(1, (int) java.time.temporal.ChronoUnit.DAYS.between(fechaInicioServicio, fechaFinServicio));
        int diasRestantes = Math.max(1, (int) java.time.temporal.ChronoUnit.DAYS.between(fechaOperacion, fechaFinServicio));
        if (diasRestantes > diasTotales) {
            diasRestantes = diasTotales;
        }

        return diferenciaLista
                .divide(BigDecimal.valueOf(diasTotales), 10, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(diasRestantes))
                .setScale(0, RoundingMode.HALF_UP);
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
                && !fechaRef.toLocalDate().isAfter(ventaPendiente.getFechaVenta().toLocalDate());
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

        LocalDate fechaCobroDate = fechaFinServicio.toLocalDate();
        LocalDateTime fechaCobro = LocalDateTime.of(fechaCobroDate, LocalTime.NOON);

        Venta siguienteVenta = new Venta();
        siguienteVenta.setCliente(ventaActual.getCliente());
        siguienteVenta.setVendedor(ventaActual.getVendedor());
        siguienteVenta.setSuscripcion(ventaActual.getSuscripcion());
        siguienteVenta.setTipoVenta(TipoVenta.RENOVACION);
        siguienteVenta.setVentaAnterior(ventaActual);
        siguienteVenta.setPrecioLista(ventaActual.getSuscripcion().getPrecio());
        siguienteVenta.setMontoProrrateado(BigDecimal.ZERO);
        siguienteVenta.setMontoTotal(ventaActual.getSuscripcion().getPrecio());
        siguienteVenta.setEstadoVenta(EstadoVenta.PENDIENTE_PAGO);
        siguienteVenta.setObservaciones("Renovacion pendiente generada automaticamente para " + fechaCobroDate);
        siguienteVenta.setFechaVenta(fechaCobro);
        siguienteVenta.setFechaActualizacion(LocalDateTime.now());
        ventaRepository.save(siguienteVenta);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Venta> listarVentasPorCliente(Long clienteId) {
        return ventaRepository.findByClienteIdOrderByFechaVentaDesc(clienteId);
    }
}
