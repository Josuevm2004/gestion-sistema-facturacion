package com.facturacion.impl;

import com.facturacion.entity.*;
import com.facturacion.enums.EstadoServicio;
import com.facturacion.enums.EstadoVenta;
import com.facturacion.enums.TipoNotificacion;
import com.facturacion.enums.TipoProrrateo;
import com.facturacion.enums.TipoSuscripcion;
import com.facturacion.enums.TipoVenta;
import com.facturacion.exception.ResourceNotFoundException;
import com.facturacion.repository.*;
import com.facturacion.request.CapacitacionRequest;
import com.facturacion.service.ServicioClienteService;
import com.facturacion.util.ProrrateoCalculatorUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Service
public class ServicioClienteServiceImpl implements ServicioClienteService {

    private static final LocalTime BILLING_CUTOFF_TIME = LocalTime.MIDNIGHT;

    @Autowired
    private ServicioClienteRepository servicioClienteRepository;
    @Autowired
    private ClienteRepository clienteRepository;
    @Autowired
    private EstadoClienteRepository estadoClienteRepository;
    @Autowired
    private HistorialEstadoClienteRepository historialEstadoClienteRepository;
    @Autowired
    private NotificacionRepository notificacionRepository;
    @Autowired
    private UsuarioAdminRepository usuarioAdminRepository;
    @Autowired
    private VentaRepository ventaRepository;

    @Value("${app.billing.monthly-billing-day:1}")
    private int monthlyBillingDay;

    @Override
    @Transactional
    public ServicioCliente capacitarCliente(Long clienteId, CapacitacionRequest request) {
        Cliente cliente = clienteRepository.findByIdAndActivoTrue(clienteId)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado"));

        ServicioCliente servicio = servicioClienteRepository.findTopByClienteIdOrderByFechaFinDesc(clienteId)
                .orElseThrow(() -> new ResourceNotFoundException("Servicio no encontrado para el cliente"));

        LocalDateTime fechaCap = request.getFechaCapacitacion() != null ? request.getFechaCapacitacion() : LocalDateTime.now();
        LocalDate fechaCapDate = fechaCap.toLocalDate();

        if (servicio.getVenta() == null || servicio.getVenta().getPrecioLista() == null) {
            throw new ResourceNotFoundException("La capacitación requiere una venta con precio registrada en la base de datos");
        }
        BigDecimal precioBase = servicio.getVenta().getPrecioLista();
        TipoSuscripcion tipoSub = (servicio.getVenta() != null && servicio.getVenta().getSuscripcion() != null)
                ? servicio.getVenta().getSuscripcion().getTipoSuscripcion()
                : TipoSuscripcion.MENSUAL;

        BigDecimal montoProrrateado = precioBase;
        int diasProrrateados = fechaCapDate.getDayOfMonth() - 1;
        LocalDateTime fechaFinCalculada;
        BigDecimal descuentoProrrateo = BigDecimal.ZERO;
        ProrrateoCalculatorUtil.ResultadoSegundoProrrateo resultadoSegundo = null;

        if (tipoSub == TipoSuscripcion.ANUAL) {
            fechaFinCalculada = fechaCap.plusYears(1);
            diasProrrateados = 365;
        } else if (correspondeSegundoProrrateo(fechaCapDate)) {
            resultadoSegundo = ProrrateoCalculatorUtil.calcularSegundoProrrateo(precioBase, fechaCapDate);
            LocalDate fechaFin = resultadoSegundo.fechaFin().plusDays(1);
            fechaFinCalculada = LocalDateTime.of(fechaFin, BILLING_CUTOFF_TIME);
            diasProrrateados = Math.max(1, (int) java.time.temporal.ChronoUnit.DAYS.between(
                    fechaCapDate,
                    fechaFin
            ));
        } else {
            ProrrateoCalculatorUtil.ResultadoProrrateo r = ProrrateoCalculatorUtil.calcularHastaDiaCobro(precioBase, fechaCapDate, monthlyBillingDay);
            montoProrrateado = r.montoFinal();
            descuentoProrrateo = r.descuento();
            LocalDate fechaFin = ProrrateoCalculatorUtil.calcularFechaFinMensual(fechaCapDate, monthlyBillingDay);
            fechaFinCalculada = LocalDateTime.of(fechaFin, BILLING_CUTOFF_TIME);
            diasProrrateados = Math.max(1, r.diasTotales() - r.diasNoConsumidos());
        }

        servicio.setFechaCapacitacion(fechaCap);
        servicio.setFechaInicio(fechaCap);
        servicio.setFechaFin(fechaFinCalculada);
        servicio.setMontoProrrateo(montoProrrateado);
        servicio.setDiasProrrateados(diasProrrateados);
        servicio.setEstado(EstadoServicio.ACTIVO);
        servicio.setFechaActualizacion(LocalDateTime.now());
        if (request.getObservaciones() != null) {
            servicio.setObservaciones(request.getObservaciones());
        }
        servicio = servicioClienteRepository.save(servicio);

        if (servicio.getVenta() != null) {
            if (tipoSub == TipoSuscripcion.MENSUAL) {
                if (resultadoSegundo != null) {
                    crearOActualizarRenovacionSegundoProrrateo(
                            servicio.getVenta(),
                            precioBase,
                            resultadoSegundo
                    );
                } else {
                    crearOActualizarRenovacionProrrateada(
                            servicio.getVenta(),
                            fechaCapDate,
                            precioBase,
                            descuentoProrrateo,
                            montoProrrateado
                    );
                }
            } else if (tipoSub == TipoSuscripcion.ANUAL) {
                crearOActualizarRenovacionAnual(servicio.getVenta(), fechaCapDate.plusYears(1), precioBase);
            }
        }

        // Actualizar estado del cliente a HABILITADO
        EstadoCliente viejoEstado = cliente.getEstado();
        EstadoCliente estadoHabilitado = estadoClienteRepository.findByNombreAndActivoTrue("HABILITADO")
                .orElseGet(() -> {
                    EstadoCliente e = new EstadoCliente();
                    e.setNombre("HABILITADO");
                    e.setDescripcion("Cliente capacitado y habilitado");
                    return estadoClienteRepository.save(e);
                });

        cliente.setEstado(estadoHabilitado);
        clienteRepository.save(cliente);

        HistorialEstadoCliente h = new HistorialEstadoCliente();
        h.setCliente(cliente);
        h.setEstadoAnterior(viejoEstado);
        h.setEstadoNuevo(estadoHabilitado);
        h.setMotivo("Capacitación completada. Inicio de plan y prorrateo Mcobro = S/ " + montoProrrateado);
        h.setFechaCambio(LocalDateTime.now());
        historialEstadoClienteRepository.save(h);

        return servicio;
    }

    private void crearOActualizarRenovacionProrrateada(
            Venta ventaInicial,
            LocalDate fechaCapacitacion,
            BigDecimal precioBase,
            BigDecimal descuentoProrrateo,
            BigDecimal montoProrrateado) {
        LocalDate fechaCobroProrrateo = ProrrateoCalculatorUtil.calcularFechaFinMensual(fechaCapacitacion, monthlyBillingDay);
        LocalDateTime fechaCobro = LocalDateTime.of(fechaCobroProrrateo, LocalTime.NOON);

        Venta ventaProrrateada = encontrarRenovacionPendienteExistente(ventaInicial.getId()).orElseGet(Venta::new);

        ventaProrrateada.setCliente(ventaInicial.getCliente());
        ventaProrrateada.setVendedor(ventaInicial.getVendedor());
        ventaProrrateada.setSuscripcion(ventaInicial.getSuscripcion());
        ventaProrrateada.setTipoVenta(TipoVenta.RENOVACION);
        ventaProrrateada.setVentaAnterior(ventaInicial);
        ventaProrrateada.setPrecioLista(precioBase);
        ventaProrrateada.setMontoProrrateado(descuentoProrrateo);
        ventaProrrateada.setTipoProrrateo(TipoProrrateo.PRIMER_PRORRATEO);
        ventaProrrateada.setMontoProrrateoAdicional(BigDecimal.ZERO);
        ventaProrrateada.setDiasProrrateoAdicional(0);
        ventaProrrateada.setFechaInicioProrrateoAdicional(null);
        ventaProrrateada.setFechaFinProrrateoAdicional(null);
        ventaProrrateada.setMontoTotal(montoProrrateado);
        ventaProrrateada.setEstadoVenta(EstadoVenta.PENDIENTE_PAGO);
        ventaProrrateada.setObservaciones("Renovacion prorrateada generada por capacitacion del " + fechaCapacitacion);
        ventaProrrateada.setFechaVenta(fechaCobro);
        ventaProrrateada.setFechaActualizacion(LocalDateTime.now());
        ventaRepository.save(ventaProrrateada);
    }

    private void crearOActualizarRenovacionSegundoProrrateo(
            Venta ventaInicial,
            BigDecimal precioBase,
            ProrrateoCalculatorUtil.ResultadoSegundoProrrateo resultado) {
        // The additional period finishes at the end of the calendar month;
        // the combined charge is scheduled for the first day of the next one.
        LocalDate fechaCobro = resultado.fechaFin().plusDays(1);
        Venta ventaSegundo = encontrarRenovacionPendienteExistente(ventaInicial.getId())
                .orElseGet(Venta::new);

        ventaSegundo.setCliente(ventaInicial.getCliente());
        ventaSegundo.setVendedor(ventaInicial.getVendedor());
        ventaSegundo.setSuscripcion(ventaInicial.getSuscripcion());
        ventaSegundo.setTipoVenta(TipoVenta.RENOVACION);
        ventaSegundo.setVentaAnterior(ventaInicial);
        ventaSegundo.setPrecioLista(precioBase);
        ventaSegundo.setMontoProrrateado(BigDecimal.ZERO);
        ventaSegundo.setTipoProrrateo(TipoProrrateo.SEGUNDO_PRORRATEO);
        ventaSegundo.setMontoProrrateoAdicional(resultado.montoAdicional());
        ventaSegundo.setDiasProrrateoAdicional(resultado.diasProrrateados());
        ventaSegundo.setFechaInicioProrrateoAdicional(
                LocalDateTime.of(resultado.fechaInicio(), LocalTime.NOON)
        );
        ventaSegundo.setFechaFinProrrateoAdicional(
                LocalDateTime.of(resultado.fechaFin(), LocalTime.NOON)
        );
        ventaSegundo.setMontoTotal(precioBase.add(resultado.montoAdicional()));
        ventaSegundo.setEstadoVenta(EstadoVenta.PENDIENTE_PAGO);
        ventaSegundo.setObservaciones(
                "Renovacion con segundo prorrateo del "
                        + resultado.fechaInicio() + " al " + resultado.fechaFin()
        );
        ventaSegundo.setFechaVenta(LocalDateTime.of(fechaCobro, LocalTime.NOON));
        ventaSegundo.setFechaActualizacion(LocalDateTime.now());
        ventaRepository.save(ventaSegundo);
    }

    private boolean correspondeSegundoProrrateo(LocalDate fechaCapacitacion) {
        return fechaCapacitacion != null
                && fechaCapacitacion.getDayOfMonth()
                >= ProrrateoCalculatorUtil.SECOND_PRORATION_TRANSITION_DAY;
    }

    private void crearOActualizarRenovacionAnual(
            Venta ventaInicial,
            LocalDate fechaCobroAnual,
            BigDecimal precioAnual) {
        LocalDateTime fechaCobro = LocalDateTime.of(fechaCobroAnual, LocalTime.NOON);

        Venta ventaAnual = encontrarRenovacionPendienteExistente(ventaInicial.getId()).orElseGet(Venta::new);

        ventaAnual.setCliente(ventaInicial.getCliente());
        ventaAnual.setVendedor(ventaInicial.getVendedor());
        ventaAnual.setSuscripcion(ventaInicial.getSuscripcion());
        ventaAnual.setTipoVenta(TipoVenta.RENOVACION);
        ventaAnual.setVentaAnterior(ventaInicial);
        ventaAnual.setPrecioLista(precioAnual);
        ventaAnual.setMontoProrrateado(BigDecimal.ZERO);
        ventaAnual.setTipoProrrateo(TipoProrrateo.NINGUNO);
        ventaAnual.setMontoProrrateoAdicional(BigDecimal.ZERO);
        ventaAnual.setDiasProrrateoAdicional(0);
        ventaAnual.setFechaInicioProrrateoAdicional(null);
        ventaAnual.setFechaFinProrrateoAdicional(null);
        ventaAnual.setMontoTotal(precioAnual);
        ventaAnual.setEstadoVenta(EstadoVenta.PENDIENTE_PAGO);
        ventaAnual.setObservaciones("Renovacion anual generada por capacitacion para " + fechaCobroAnual);
        ventaAnual.setFechaVenta(fechaCobro);
        ventaAnual.setFechaActualizacion(LocalDateTime.now());
        ventaRepository.save(ventaAnual);
    }

    @Override
    @Transactional
    public ServicioCliente bloquearCliente(Long clienteId, String motivo) {
        Cliente cliente = clienteRepository.findByIdAndActivoTrue(clienteId)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado"));

        EstadoCliente viejoEstado = cliente.getEstado();
        EstadoCliente estadoBloqueado = estadoClienteRepository.findByNombreAndActivoTrue("BLOQUEADO")
                .orElseGet(() -> {
                    EstadoCliente e = new EstadoCliente();
                    e.setNombre("BLOQUEADO");
                    e.setDescripcion("Cliente bloqueado");
                    return estadoClienteRepository.save(e);
                });

        cliente.setEstado(estadoBloqueado);
        clienteRepository.save(cliente);

        ServicioCliente servicio = servicioClienteRepository.findTopByClienteIdOrderByFechaFinDesc(clienteId).orElse(null);
        if (servicio != null) {
            servicio.setEstado(EstadoServicio.BLOQUEADO);
            servicioClienteRepository.save(servicio);
        }

        HistorialEstadoCliente h = new HistorialEstadoCliente();
        h.setCliente(cliente);
        h.setEstadoAnterior(viejoEstado);
        h.setEstadoNuevo(estadoBloqueado);
        h.setMotivo(motivo != null ? motivo : "Cliente bloqueado desde dashboard");
        h.setFechaCambio(LocalDateTime.now());
        historialEstadoClienteRepository.save(h);

        return servicio;
    }

    @Override
    @Transactional
    public ServicioCliente devolverAcceso(Long clienteId) {
        Cliente cliente = clienteRepository.findByIdAndActivoTrue(clienteId)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado"));

        EstadoCliente viejoEstado = cliente.getEstado();
        EstadoCliente estadoVencido = estadoClienteRepository.findByNombreAndActivoTrue("VENCIDO")
                .orElseGet(() -> {
                    EstadoCliente e = new EstadoCliente();
                    e.setNombre("VENCIDO");
                    e.setDescripcion("Cliente en estado vencido preparado para renovación");
                    return estadoClienteRepository.save(e);
                });

        cliente.setEstado(estadoVencido);
        clienteRepository.save(cliente);

        ServicioCliente servicio = servicioClienteRepository.findTopByClienteIdOrderByFechaFinDesc(clienteId).orElse(null);
        if (servicio != null) {
            servicio.setEstado(EstadoServicio.VENCIDO);
            servicioClienteRepository.save(servicio);
        }

        HistorialEstadoCliente h = new HistorialEstadoCliente();
        h.setCliente(cliente);
        h.setEstadoAnterior(viejoEstado);
        h.setEstadoNuevo(estadoVencido);
        h.setFechaCambio(LocalDateTime.now());
        h.setMotivo("Acceso devuelto - Cliente pasa a estado VENCIDO para gestionar Renovación o Cambio de Plan");
        historialEstadoClienteRepository.save(h);

        return servicio;
    }

    @Override
    @Transactional
    public void revisarVencimientos() {
        asegurarServiciosParaVentasPagadas();
        realinearServiciosMensualesActivosAlDiaCobro();

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime hoyStart = now.with(LocalTime.MIN);
        LocalDateTime hoyEnd = now.with(LocalTime.MAX);
        LocalDateTime mananaStart = now.plusDays(1).with(LocalTime.MIN);
        LocalDateTime mananaEnd = now.plusDays(1).with(LocalTime.MAX);

        UsuarioAdmin admin = usuarioAdminRepository.findAll().stream().findFirst().orElse(null);
        if (admin == null) return;

        LocalDateTime diaInicio = now.with(LocalTime.MIN);
        LocalDateTime diaFin = now.with(LocalTime.MAX);

        List<ServicioCliente> vencenHoy = servicioClienteRepository.findActivosQueVencenEntre(hoyStart, hoyEnd);
        for (ServicioCliente s : vencenHoy) {
            if (!notificacionRepository.existsByClienteIdAndTipoAndFechaCreacionBetween(
                    s.getCliente().getId(), TipoNotificacion.VENCE_HOY, diaInicio, diaFin)) {
                Notificacion n = new Notificacion();
                n.setUsuarioAdmin(admin);
                n.setCliente(s.getCliente());
                n.setTipo(TipoNotificacion.VENCE_HOY);
                n.setTitulo("Servicio vence hoy");
                n.setMensaje("El servicio de " + s.getCliente().getRazonSocial() + " vence hoy (" + s.getFechaFin().toLocalDate() + ").");
                n.setFechaCreacion(LocalDateTime.now());
                notificacionRepository.save(n);
            }
        }

        // 1. Alertas VENCIMIENTO_MANANA
        List<ServicioCliente> vencenManana = servicioClienteRepository.findActivosQueVencenEntre(mananaStart, mananaEnd);
        for (ServicioCliente s : vencenManana) {
            if (!notificacionRepository.existsByClienteIdAndTipoAndFechaCreacionBetween(
                    s.getCliente().getId(), TipoNotificacion.VENCIMIENTO_MANANA, diaInicio, diaFin)) {
                Notificacion n = new Notificacion();
                n.setUsuarioAdmin(admin);
                n.setCliente(s.getCliente());
                n.setTipo(TipoNotificacion.VENCIMIENTO_MANANA);
                n.setTitulo("⚠️ Vencimiento Próximo Mañana");
                n.setMensaje("El servicio de " + s.getCliente().getRazonSocial() + " vencerá mañana (" + s.getFechaFin().toLocalDate() + ").");
                n.setFechaCreacion(LocalDateTime.now());
                notificacionRepository.save(n);
            }
        }

        // 2. Alertas VENCE_HOY y VENCIDO
        // La fecha de vencimiento es el primer instante del dia sin acceso.
        List<ServicioCliente> vencidos = servicioClienteRepository.findActivosVencidos(now);
        EstadoCliente estadoVencido = estadoClienteRepository.findByNombreAndActivoTrue("VENCIDO").orElse(null);

        for (ServicioCliente s : vencidos) {
            s.setEstado(EstadoServicio.VENCIDO);
            s.setFechaActualizacion(LocalDateTime.now());
            servicioClienteRepository.save(s);

            if (estadoVencido != null && !estadoVencido.equals(s.getCliente().getEstado())) {
                EstadoCliente viejo = s.getCliente().getEstado();
                s.getCliente().setEstado(estadoVencido);
                clienteRepository.save(s.getCliente());

                HistorialEstadoCliente h = new HistorialEstadoCliente();
                h.setCliente(s.getCliente());
                h.setEstadoAnterior(viejo);
                h.setEstadoNuevo(estadoVencido);
                h.setMotivo("Servicio vencido automáticamente por fecha fin (" + s.getFechaFin().toLocalDate() + ")");
                h.setFechaCambio(LocalDateTime.now());
                historialEstadoClienteRepository.save(h);
            }

            if (s.getFechaFin() != null
                    && !s.getFechaFin().isAfter(now)
                    && !notificacionRepository.existsByClienteIdAndTipoAndFechaCreacionBetween(
                    s.getCliente().getId(), TipoNotificacion.VENCIDO, diaInicio, diaFin)) {
                Notificacion n = new Notificacion();
                n.setUsuarioAdmin(admin);
                n.setCliente(s.getCliente());
                n.setTipo(TipoNotificacion.VENCIDO);
                n.setTitulo("🔴 Servicio Vencido");
                n.setMensaje("El período del cliente " + s.getCliente().getRazonSocial() + " ha finalizado.");
                n.setFechaCreacion(LocalDateTime.now());
                notificacionRepository.save(n);
            }
        }
    }

    private void asegurarServiciosParaVentasPagadas() {
        List<Venta> ventasPagadas = ventaRepository.findAll().stream()
                .filter(v -> v.getEstadoVenta() == EstadoVenta.PAGADA)
                .filter(v -> v.getCliente() != null && Boolean.TRUE.equals(v.getCliente().getActivo()))
                .sorted(java.util.Comparator.comparing(Venta::getFechaVenta, java.util.Comparator.nullsLast(java.util.Comparator.naturalOrder())))
                .toList();

        LocalDateTime ahora = LocalDateTime.now();

        for (Venta venta : ventasPagadas) {
            Optional<ServicioCliente> servicioOpt = servicioClienteRepository.findByVentaId(venta.getId());
            if (servicioOpt.isEmpty()) {
                LocalDateTime fechaInicio;
                LocalDateTime fechaFin;

                String obs = venta.getObservaciones() != null ? venta.getObservaciones() : "";
                java.util.regex.Matcher m = java.util.regex.Pattern.compile("(\\d{2}/\\d{2}/\\d{4})\\s+al\\s+(\\d{2}/\\d{2}/\\d{4})").matcher(obs);
                if (m.find()) {
                    String[] p1 = m.group(1).split("/");
                    String[] p2 = m.group(2).split("/");
                    fechaInicio = LocalDateTime.of(Integer.parseInt(p1[2]), Integer.parseInt(p1[1]), Integer.parseInt(p1[0]), 0, 0);
                    fechaFin = LocalDateTime.of(Integer.parseInt(p2[2]), Integer.parseInt(p2[1]), Integer.parseInt(p2[0]), 0, 0);
                } else {
                    ServicioCliente servicioPrevio = servicioClienteRepository.findTopByClienteIdOrderByFechaFinDesc(venta.getCliente().getId()).orElse(null);
                    if (servicioPrevio != null && servicioPrevio.getFechaFin() != null) {
                        fechaInicio = servicioPrevio.getFechaFin();
                    } else if (venta.getFechaVenta() != null) {
                        fechaInicio = venta.getFechaVenta();
                    } else {
                        fechaInicio = ahora;
                    }
                    TipoSuscripcion tipoSub = venta.getSuscripcion() != null ? venta.getSuscripcion().getTipoSuscripcion() : TipoSuscripcion.MENSUAL;
                    if (tipoSub == TipoSuscripcion.ANUAL) {
                        fechaFin = fechaInicio.plusYears(1);
                    } else {
                        fechaFin = fechaInicio.plusMonths(1);
                    }
                }

                ServicioCliente nuevoServicio = new ServicioCliente();
                nuevoServicio.setCliente(venta.getCliente());
                nuevoServicio.setVenta(venta);
                nuevoServicio.setFechaInicio(fechaInicio);
                nuevoServicio.setFechaFin(fechaFin);
                nuevoServicio.setFechaCapacitacion(fechaInicio);
                nuevoServicio.setEstado(EstadoServicio.ACTIVO);
                nuevoServicio.setMontoProrrateo(venta.getMontoTotal() != null ? venta.getMontoTotal() : BigDecimal.ZERO);
                nuevoServicio.setDiasProrrateados(30);
                nuevoServicio.setObservaciones("Servicio regularizado para venta " + venta.getTipoVenta());
                nuevoServicio.setFechaCreacion(venta.getFechaVenta() != null ? venta.getFechaVenta() : ahora);
                nuevoServicio.setFechaActualizacion(ahora);
                servicioClienteRepository.save(nuevoServicio);
            }
        }
    }

    private void realinearServiciosMensualesActivosAlDiaCobro() {
        List<ServicioCliente> serviciosActivos = servicioClienteRepository.findByEstado(EstadoServicio.ACTIVO);
        LocalDateTime ahora = LocalDateTime.now();

        for (ServicioCliente servicio : serviciosActivos) {
            if (servicio.getObservaciones() != null && servicio.getObservaciones().toLowerCase().contains("adelanto")) {
                continue;
            }
            if (servicio.getVenta() != null && servicio.getVenta().getObservaciones() != null && servicio.getVenta().getObservaciones().toLowerCase().contains("adelanto")) {
                continue;
            }
            // Proteger servicios con ciclos adelantados o fechas futuras del recálculo automático del cron
            if (servicio.getFechaFin() != null && servicio.getFechaFin().toLocalDate().isAfter(ahora.toLocalDate().plusMonths(1).withDayOfMonth(1))) {
                continue;
            }

            Venta ventaServicio = resolverVentaVigente(servicio);
            if (servicio.getFechaInicio() == null
                    || ventaServicio == null
                    || ventaServicio.getSuscripcion() == null
                    || ventaServicio.getSuscripcion().getPrecio() == null) {
                continue;
            }

            LocalDate fechaInicio = servicio.getFechaInicio().toLocalDate();
            TipoSuscripcion tipoSuscripcion = ventaServicio.getSuscripcion().getTipoSuscripcion();

            if (tipoSuscripcion == TipoSuscripcion.ANUAL) {
                LocalDate fechaFinAnual = servicio.getFechaFin() != null
                        ? servicio.getFechaFin().toLocalDate()
                        : fechaInicio.plusYears(1);
                asegurarRenovacionPendiente(servicio, ventaServicio, fechaFinAnual, ahora);
                continue;
            }

            Optional<Venta> pendiente = encontrarRenovacionPendienteExistente(ventaServicio.getId());
            if (correspondeSegundoProrrateo(fechaInicio)) {
                ProrrateoCalculatorUtil.ResultadoSegundoProrrateo resultado =
                        ProrrateoCalculatorUtil.calcularSegundoProrrateo(ventaServicio.getSuscripcion().getPrecio(), fechaInicio);
                LocalDate fechaCobroSegundo = resultado.fechaFin().plusDays(1);
                LocalDateTime fechaFinCalculada = LocalDateTime.of(fechaCobroSegundo, BILLING_CUTOFF_TIME);
                if (!fechaFinCalculada.equals(servicio.getFechaFin())) {
                    servicio.setFechaFin(fechaFinCalculada);
                    servicio.setFechaActualizacion(ahora);
                    servicioClienteRepository.save(servicio);
                }
                continue;
            }

            LocalDate fechaFinMensual = ProrrateoCalculatorUtil.calcularFechaFinMensual(fechaInicio, monthlyBillingDay);
            LocalDateTime fechaFinCalculada = LocalDateTime.of(fechaFinMensual, BILLING_CUTOFF_TIME);

            if (!fechaFinCalculada.equals(servicio.getFechaFin())) {
                servicio.setFechaFin(fechaFinCalculada);
                servicio.setFechaActualizacion(ahora);
                servicioClienteRepository.save(servicio);
            }

            if (pendiente.isPresent()) {
                realinearVentaPendienteMensual(servicio, pendiente.get(), fechaFinMensual, ahora);
            } else {
                // También repara clientes importados o registros antiguos que
                // tienen servicio activo, pero no tienen su renovación futura.
                asegurarRenovacionPendiente(servicio, ventaServicio, fechaFinMensual, ahora);
            }
        }
    }

    private Venta resolverVentaVigente(ServicioCliente servicio) {
        if (servicio == null || servicio.getCliente() == null) {
            return null;
        }

        return ventaRepository.findByClienteIdOrderByFechaVentaDesc(servicio.getCliente().getId()).stream()
                .filter(v -> v.getEstadoVenta() == EstadoVenta.PAGADA)
                .filter(v -> v.getSuscripcion() != null)
                .findFirst()
                .orElse(servicio.getVenta());
    }

    /**
     * Guarantees one next renewal for every active service. The first ALTA
     * keeps the prorated amount calculated from training; later cycles and
     * annual subscriptions use the regular plan price.
     */
    private void asegurarRenovacionPendiente(
            ServicioCliente servicio,
            Venta ventaServicio,
            LocalDate fechaCobro,
            LocalDateTime ahora) {
        if (ventaServicio.getId() == null
                || ventaServicio.getSuscripcion() == null
                || ventaServicio.getSuscripcion().getPrecio() == null
                || encontrarRenovacionPendienteExistente(ventaServicio.getId()).isPresent()) {
            return;
        }

        BigDecimal precioBase = ventaServicio.getSuscripcion().getPrecio();
        BigDecimal descuentoProrrateo = BigDecimal.ZERO;
        BigDecimal montoTotal = precioBase;
        int diasProrrateados = ventaServicio.getSuscripcion().getTipoSuscripcion() == TipoSuscripcion.ANUAL
                ? 365
                : 30;

        if (ventaServicio.getSuscripcion().getTipoSuscripcion() == TipoSuscripcion.MENSUAL
                && ventaServicio.getTipoVenta() == TipoVenta.ALTA
                && servicio.getFechaInicio() != null) {
            LocalDate fechaBase = servicio.getFechaInicio().toLocalDate();
            if (correspondeSegundoProrrateo(fechaBase)) {
                ProrrateoCalculatorUtil.ResultadoSegundoProrrateo resultado =
                        ProrrateoCalculatorUtil.calcularSegundoProrrateo(precioBase, fechaBase);
                montoTotal = precioBase.add(resultado.montoAdicional());
                diasProrrateados = resultado.diasProrrateados();
                descuentoProrrateo = BigDecimal.ZERO;
            } else {
                ProrrateoCalculatorUtil.ResultadoProrrateo resultado =
                        ProrrateoCalculatorUtil.calcularHastaDiaCobro(
                                precioBase,
                                fechaBase,
                                monthlyBillingDay
                        );
                descuentoProrrateo = resultado.descuento();
                montoTotal = resultado.montoFinal();
                diasProrrateados = Math.max(1, resultado.diasTotales() - resultado.diasNoConsumidos());
            }
        } else if (ventaServicio.getSuscripcion().getTipoSuscripcion() == TipoSuscripcion.MENSUAL
                && servicio.getMontoProrrateo() != null
                && servicio.getMontoProrrateo().compareTo(BigDecimal.ZERO) > 0
                && servicio.getMontoProrrateo().compareTo(precioBase) < 0) {
            // Una renovación pagada tarde puede dejar un siguiente cobro
            // prorrateado ya registrado en el servicio. No lo sobrescribas
            // con la tarifa completa durante la sincronización automática.
            montoTotal = servicio.getMontoProrrateo();
            descuentoProrrateo = precioBase.subtract(montoTotal).max(BigDecimal.ZERO);
            if (servicio.getDiasProrrateados() != null && servicio.getDiasProrrateados() > 0) {
                diasProrrateados = servicio.getDiasProrrateados();
            }
        }

        Venta siguiente = new Venta();
        siguiente.setCliente(ventaServicio.getCliente());
        siguiente.setVendedor(ventaServicio.getVendedor());
        siguiente.setSuscripcion(ventaServicio.getSuscripcion());
        siguiente.setTipoVenta(TipoVenta.RENOVACION);
        siguiente.setVentaAnterior(ventaServicio);
        siguiente.setPrecioLista(precioBase);
        siguiente.setMontoProrrateado(descuentoProrrateo);
        LocalDate fechaBaseServicio = servicio.getFechaInicio() != null
                ? servicio.getFechaInicio().toLocalDate()
                : null;
        boolean segundo = fechaBaseServicio != null
                && correspondeSegundoProrrateo(fechaBaseServicio)
                && ventaServicio.getSuscripcion().getTipoSuscripcion() == TipoSuscripcion.MENSUAL;
        boolean anual = ventaServicio.getSuscripcion().getTipoSuscripcion() == TipoSuscripcion.ANUAL;
        siguiente.setTipoProrrateo(anual
                ? TipoProrrateo.NINGUNO
                : segundo ? TipoProrrateo.SEGUNDO_PRORRATEO : TipoProrrateo.PRIMER_PRORRATEO);
        if (segundo) {
            ProrrateoCalculatorUtil.ResultadoSegundoProrrateo resultado =
                    ProrrateoCalculatorUtil.calcularSegundoProrrateo(
                            precioBase,
                            fechaBaseServicio
                    );
            siguiente.setMontoProrrateoAdicional(resultado.montoAdicional());
            siguiente.setDiasProrrateoAdicional(resultado.diasProrrateados());
            siguiente.setFechaInicioProrrateoAdicional(LocalDateTime.of(resultado.fechaInicio(), LocalTime.NOON));
            siguiente.setFechaFinProrrateoAdicional(LocalDateTime.of(resultado.fechaFin(), LocalTime.NOON));
            siguiente.setFechaVenta(LocalDateTime.of(resultado.fechaFin().plusDays(1), LocalTime.NOON));
        } else {
            siguiente.setMontoProrrateoAdicional(BigDecimal.ZERO);
            siguiente.setDiasProrrateoAdicional(0);
            siguiente.setFechaInicioProrrateoAdicional(null);
            siguiente.setFechaFinProrrateoAdicional(null);
        }
        siguiente.setMontoTotal(montoTotal);
        siguiente.setEstadoVenta(EstadoVenta.PENDIENTE_PAGO);
        siguiente.setObservaciones(segundo
                ? "Renovacion pendiente con segundo prorrateo del "
                        + siguiente.getFechaInicioProrrateoAdicional().toLocalDate()
                        + " al "
                        + siguiente.getFechaFinProrrateoAdicional().toLocalDate()
                : "Renovacion pendiente sincronizada para " + fechaCobro);
        if (!segundo) {
            siguiente.setFechaVenta(LocalDateTime.of(fechaCobro, LocalTime.NOON));
        }
        siguiente.setFechaActualizacion(ahora);
        ventaRepository.save(siguiente);

        servicio.setMontoProrrateo(montoTotal);
        servicio.setDiasProrrateados(diasProrrateados);
        servicio.setFechaActualizacion(ahora);
        servicioClienteRepository.save(servicio);
    }

    private Optional<Venta> encontrarRenovacionPendienteExistente(Long ventaAnteriorId) {
        if (ventaAnteriorId == null) {
            return Optional.empty();
        }
        return ventaRepository.findByVentaAnteriorIdAndTipoVentaOrderByFechaVentaDesc(ventaAnteriorId, TipoVenta.RENOVACION)
                .stream()
                .filter(v -> v.getEstadoVenta() == EstadoVenta.PENDIENTE_PAGO)
                .findFirst();
    }

    private void realinearVentaPendienteMensual(
            ServicioCliente servicio,
            Venta pendiente,
            LocalDate fechaCobro,
            LocalDateTime ahora) {
        if (pendiente.getTipoProrrateo() == TipoProrrateo.SEGUNDO_PRORRATEO) {
            return;
        }

        Venta ventaServicio = servicio.getVenta();
        BigDecimal precioBase = pendiente.getPrecioLista() != null
                ? pendiente.getPrecioLista()
                : ventaServicio.getSuscripcion().getPrecio();

        pendiente.setFechaVenta(LocalDateTime.of(fechaCobro, LocalTime.NOON));
        pendiente.setPrecioLista(precioBase);
        if (ventaServicio.getTipoVenta() == TipoVenta.ALTA) {
            ProrrateoCalculatorUtil.ResultadoProrrateo r =
                    ProrrateoCalculatorUtil.calcularHastaDiaCobro(precioBase, servicio.getFechaInicio().toLocalDate(), monthlyBillingDay);
            pendiente.setMontoProrrateado(r.descuento());
            pendiente.setMontoTotal(r.montoFinal());
            servicio.setMontoProrrateo(r.montoFinal());
            servicio.setDiasProrrateados(Math.max(1, r.diasTotales() - r.diasNoConsumidos()));
            servicio.setFechaActualizacion(ahora);
            servicioClienteRepository.save(servicio);
        } else {
            // La venta pendiente es la fuente de verdad del siguiente cobro.
            // Así un prorrateo importado se conserva, pero una nueva
            // renovación normal ya creada por el sistema conserva su tarifa.
            BigDecimal montoSiguiente = pendiente.getMontoTotal() != null
                    && pendiente.getMontoTotal().compareTo(BigDecimal.ZERO) > 0
                    ? pendiente.getMontoTotal()
                    : precioBase;
            pendiente.setMontoProrrateado(precioBase.subtract(montoSiguiente).max(BigDecimal.ZERO));
            pendiente.setMontoTotal(montoSiguiente);
            servicio.setMontoProrrateo(montoSiguiente);
            servicio.setDiasProrrateados(Math.max(1, (int) java.time.temporal.ChronoUnit.DAYS.between(
                    servicio.getFechaInicio().toLocalDate(),
                    fechaCobro
            )));
            servicio.setFechaActualizacion(ahora);
            servicioClienteRepository.save(servicio);
        }
        pendiente.setFechaActualizacion(ahora);
        ventaRepository.save(pendiente);
    }
}
