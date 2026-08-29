package com.facturacion.impl;

import com.facturacion.entity.Cliente;
import com.facturacion.entity.EstadoCliente;
import com.facturacion.entity.HistorialEstadoCliente;
import com.facturacion.entity.Pago;
import com.facturacion.entity.ServicioCliente;
import com.facturacion.entity.Venta;
import com.facturacion.enums.EstadoPago;
import com.facturacion.enums.EstadoServicio;
import com.facturacion.enums.EstadoVenta;
import com.facturacion.enums.MedioPago;
import com.facturacion.enums.TipoProrrateo;
import com.facturacion.enums.TipoSuscripcion;
import com.facturacion.enums.TipoVenta;
import com.facturacion.exception.ResourceNotFoundException;
import com.facturacion.repository.EstadoClienteRepository;
import com.facturacion.repository.HistorialEstadoClienteRepository;
import com.facturacion.repository.ClienteRepository;
import com.facturacion.repository.PagoRepository;
import com.facturacion.repository.ServicioClienteRepository;
import com.facturacion.repository.VentaRepository;
import com.facturacion.request.RegistrarPagoRequest;
import com.facturacion.service.PagoService;
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

@Service
public class PagoServiceImpl implements PagoService {

    private static final LocalTime BILLING_CUTOFF_TIME = LocalTime.MIDNIGHT;

    @Autowired
    private PagoRepository pagoRepository;
    @Autowired
    private VentaRepository ventaRepository;
    @Autowired
    private EstadoClienteRepository estadoClienteRepository;
    @Autowired
    private ClienteRepository clienteRepository;
    @Autowired
    private HistorialEstadoClienteRepository historialEstadoClienteRepository;
    @Autowired
    private ServicioClienteRepository servicioClienteRepository;

    @Value("${app.billing.monthly-billing-day:1}")
    private int monthlyBillingDay;

    private record AjusteCobro(
            LocalDateTime fechaInicio,
            LocalDateTime fechaFin,
            BigDecimal descuentoProrrateo,
            BigDecimal montoTotal,
            int diasProrrateados
    ) {}

    @Override
    @Transactional
    public Pago registrarPago(RegistrarPagoRequest request) {
        Venta venta = ventaRepository.findById(request.getVentaId())
                .orElseThrow(() -> new ResourceNotFoundException("Venta no encontrada"));
        LocalDateTime fechaOperacion = LocalDateTime.now();

        Pago pagoExistente = pagoRepository.findTopByVentaIdAndEstadoPagoOrderByFechaRegistroDesc(venta.getId(), EstadoPago.PAGADO)
                .orElse(null);
        if (pagoExistente != null) {
            if (venta.getEstadoVenta() != EstadoVenta.PAGADA) {
                venta.setEstadoVenta(EstadoVenta.PAGADA);
                venta.setFechaActualizacion(fechaOperacion);
                ventaRepository.save(venta);
            }
            return pagoExistente;
        }

        AjusteCobro ajusteCobro = null;
        if (venta.getTipoVenta() != TipoVenta.ALTA) {
            ajusteCobro = debeUsarMontoPendienteProgramado(venta, fechaOperacion)
                    ? construirAjusteDesdeVentaPendiente(venta, fechaOperacion)
                    : calcularAjusteCobro(venta, fechaOperacion);
            venta.setMontoProrrateado(ajusteCobro.descuentoProrrateo());
            venta.setMontoTotal(ajusteCobro.montoTotal());
        }

        Pago pago = new Pago();
        pago.setVenta(venta);
        pago.setCodigoOperacion(request.getCodigoOperacion());
        // El monto comercial siempre sale de venta, que a su vez se resolvió
        // desde suscripcion.precio en la base de datos. El cliente no puede
        // alterar el total enviando otro valor desde el navegador.
        pago.setMonto(venta.getMontoTotal());
        pago.setMedioPago(request.getMedioPago() != null ? request.getMedioPago() : MedioPago.OTRO);
        pago.setEstadoPago(EstadoPago.PAGADO);
        pago.setFechaPago(fechaOperacion);
        pago.setFechaRegistro(fechaOperacion);
        pago.setComprobanteUrl(request.getComprobanteUrl());
        pago.setObservaciones(request.getObservaciones());
        pago = pagoRepository.save(pago);

        venta.setEstadoVenta(EstadoVenta.PAGADA);
        venta.setFechaActualizacion(fechaOperacion);
        ventaRepository.save(venta);

        Cliente cliente = venta.getCliente();
        if (cliente != null && venta.getTipoVenta() == TipoVenta.ALTA) {
            pasarClienteAPorCapacitar(cliente, venta, fechaOperacion);
        } else if (cliente != null) {
            cancelarOtrasVentasPendientes(cliente.getId(), venta, fechaOperacion);
            activarServicioPorVentaPagada(cliente, venta, ajusteCobro, fechaOperacion);
        }

        return pago;
    }

    private void pasarClienteAPorCapacitar(Cliente cliente, Venta venta, LocalDateTime fechaOperacion) {
        EstadoCliente viejoEstado = cliente.getEstado();
        EstadoCliente estadoPorCapacitar = estadoClienteRepository.findByNombreAndActivoTrue("POR_CAPACITAR")
                .orElseGet(() -> {
                    EstadoCliente e = new EstadoCliente();
                    e.setNombre("POR_CAPACITAR");
                    e.setDescripcion("Pago realizado, pendiente de capacitacion");
                    return estadoClienteRepository.save(e);
                });

        cliente.setEstado(estadoPorCapacitar);
        clienteRepository.save(cliente);
        historialEstadoClienteRepository.save(crearHistorial(cliente, viejoEstado, estadoPorCapacitar,
                "Pago verificado para Venta de ALTA #" + venta.getId(), fechaOperacion));
    }

    private AjusteCobro calcularAjusteCobro(Venta venta, LocalDateTime fechaOperacion) {
        BigDecimal precioLista = venta.getPrecioLista() != null
                ? venta.getPrecioLista()
                : venta.getSuscripcion() != null ? venta.getSuscripcion().getPrecio() : venta.getMontoTotal();
        venta.setPrecioLista(precioLista);

        LocalDate fechaInicioDate = resolverFechaInicioOperacion(venta, fechaOperacion);
        LocalDateTime fechaInicio = fechaInicioDate.equals(fechaOperacion.toLocalDate())
                ? fechaOperacion
                : LocalDateTime.of(fechaInicioDate, LocalTime.NOON);

        if (venta.getSuscripcion() != null && venta.getSuscripcion().getTipoSuscripcion() == TipoSuscripcion.ANUAL) {
            return new AjusteCobro(fechaInicio, fechaInicio.plusYears(1), BigDecimal.ZERO, precioLista, 365);
        }

        if (venta.getTipoVenta() == TipoVenta.CAMBIO_PLAN) {
            LocalDateTime fechaFinMes = fechaInicio.plusMonths(1);
            int dias = Math.max(1, (int) java.time.temporal.ChronoUnit.DAYS.between(fechaInicioDate, fechaFinMes.toLocalDate()));
            return new AjusteCobro(fechaInicio, fechaFinMes, BigDecimal.ZERO, precioLista, dias);
        }

        ProrrateoCalculatorUtil.ResultadoProrrateo r =
                ProrrateoCalculatorUtil.calcularHastaDiaCobro(precioLista, fechaInicioDate, monthlyBillingDay);
        LocalDate fechaFinMensual = ProrrateoCalculatorUtil.calcularFechaFinMensual(fechaInicioDate, monthlyBillingDay);
        LocalDateTime fechaFin = LocalDateTime.of(fechaFinMensual, BILLING_CUTOFF_TIME);
        int diasProrrateados = Math.max(1, r.diasTotales() - r.diasNoConsumidos());

        return new AjusteCobro(fechaInicio, fechaFin, r.descuento(), r.montoFinal(), diasProrrateados);
    }

    private boolean debeUsarMontoPendienteProgramado(Venta venta, LocalDateTime fechaOperacion) {
        return venta != null
                && venta.getMontoTotal() != null
                && venta.getFechaVenta() != null
                && (venta.getTipoProrrateo() == TipoProrrateo.SEGUNDO_PRORRATEO
                    || !fechaOperacion.toLocalDate().isAfter(venta.getFechaVenta().toLocalDate()));
    }

    private AjusteCobro construirAjusteDesdeVentaPendiente(Venta venta, LocalDateTime fechaOperacion) {
        LocalDate fechaInicioDate = resolverFechaInicioOperacion(venta, fechaOperacion);
        LocalDateTime fechaInicio = fechaInicioDate.equals(fechaOperacion.toLocalDate())
                ? fechaOperacion
                : LocalDateTime.of(fechaInicioDate, LocalTime.NOON);

        if (venta.getSuscripcion() != null && venta.getSuscripcion().getTipoSuscripcion() == TipoSuscripcion.ANUAL) {
            return new AjusteCobro(
                    fechaInicio,
                    fechaInicio.plusYears(1),
                    BigDecimal.ZERO,
                    venta.getMontoTotal(),
                    365
            );
        }

        LocalDate fechaFinMensual = ProrrateoCalculatorUtil.calcularFechaFinMensual(fechaInicioDate, monthlyBillingDay);
        LocalDateTime fechaFin = LocalDateTime.of(fechaFinMensual, BILLING_CUTOFF_TIME);
        int diasProrrateados = Math.max(1, (int) java.time.temporal.ChronoUnit.DAYS.between(fechaInicioDate, fechaFinMensual));

        return new AjusteCobro(
                fechaInicio,
                fechaFin,
                venta.getMontoProrrateado() != null ? venta.getMontoProrrateado() : BigDecimal.ZERO,
                venta.getMontoTotal(),
                diasProrrateados
        );
    }

    private LocalDate resolverFechaInicioOperacion(Venta venta, LocalDateTime fechaOperacion) {
        LocalDate hoy = fechaOperacion.toLocalDate();
        if (venta.getFechaVenta() != null) {
            LocalDate fechaProgramada = venta.getFechaVenta().toLocalDate();
            if (hoy.isBefore(fechaProgramada)) {
                return fechaProgramada;
            }
        }
        return hoy;
    }

    private void activarServicioPorVentaPagada(Cliente cliente, Venta venta, AjusteCobro ajusteCobro, LocalDateTime fechaOperacion) {
        AjusteCobro ajuste = ajusteCobro != null ? ajusteCobro : calcularAjusteCobro(venta, fechaOperacion);
        ServicioCliente servicio = servicioClienteRepository.findByVentaId(venta.getId()).orElseGet(ServicioCliente::new);

        servicio.setCliente(cliente);
        servicio.setVenta(venta);
        servicio.setFechaInicio(ajuste.fechaInicio());
        servicio.setFechaFin(ajuste.fechaFin());
        servicio.setFechaCapacitacion(ajuste.fechaInicio());
        servicio.setEstado(EstadoServicio.ACTIVO);
        servicio.setMontoProrrateo(ajuste.montoTotal());
        servicio.setDiasProrrateados(ajuste.diasProrrateados());
        servicio.setObservaciones("Servicio activado por pago de " + venta.getTipoVenta());
        if (servicio.getId() == null) {
            servicio.setFechaCreacion(fechaOperacion);
        }
        servicio.setFechaActualizacion(fechaOperacion);
        servicioClienteRepository.save(servicio);

        crearSiguienteRenovacionPendiente(venta, servicio.getFechaFin());
        habilitarCliente(cliente, venta, fechaOperacion);
    }

    private void habilitarCliente(Cliente cliente, Venta venta, LocalDateTime fechaOperacion) {
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
        historialEstadoClienteRepository.save(crearHistorial(cliente, viejoEstado, estadoHabilitado,
                "Pago verificado para Venta #" + venta.getId() + " (" + venta.getTipoVenta() + ")", fechaOperacion));
    }

    private HistorialEstadoCliente crearHistorial(
            Cliente cliente,
            EstadoCliente estadoAnterior,
            EstadoCliente estadoNuevo,
            String motivo,
            LocalDateTime fechaOperacion) {
        HistorialEstadoCliente h = new HistorialEstadoCliente();
        h.setCliente(cliente);
        h.setEstadoAnterior(estadoAnterior);
        h.setEstadoNuevo(estadoNuevo);
        h.setMotivo(motivo);
        h.setFechaCambio(fechaOperacion);
        return h;
    }

    private void cancelarOtrasVentasPendientes(Long clienteId, Venta ventaPagada, LocalDateTime fechaOperacion) {
        List<Venta> pendientes = ventaRepository.findByClienteIdOrderByFechaVentaDesc(clienteId).stream()
                .filter(v -> v.getEstadoVenta() == EstadoVenta.PENDIENTE_PAGO)
                .filter(v -> v.getId() == null || !v.getId().equals(ventaPagada.getId()))
                .toList();

        for (Venta pendiente : pendientes) {
            pendiente.setEstadoVenta(EstadoVenta.CANCELADA);
            pendiente.setFechaActualizacion(fechaOperacion);
        }
        if (!pendientes.isEmpty()) {
            ventaRepository.saveAll(pendientes);
        }
    }

    private void crearSiguienteRenovacionPendiente(Venta ventaActual, LocalDateTime fechaFinServicio) {
        if (fechaFinServicio == null
                || ventaActual.getId() == null
                || ventaActual.getSuscripcion() == null
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

        if (ventaActual.getSuscripcion().getTipoSuscripcion() == TipoSuscripcion.MENSUAL
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

    private boolean correspondeSegundoProrrateo(LocalDate fecha) {
        return fecha != null && fecha.getDayOfMonth() >= ProrrateoCalculatorUtil.SECOND_PRORATION_TRANSITION_DAY;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Pago> listarPagosPorCliente(Long clienteId) {
        return pagoRepository.findByVentaClienteIdOrderByFechaRegistroDesc(clienteId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Pago> listarTodosPagos() {
        return pagoRepository.findAllWithDetails();
    }
}
