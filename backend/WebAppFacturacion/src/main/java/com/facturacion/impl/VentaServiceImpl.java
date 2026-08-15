package com.facturacion.impl;

import com.facturacion.entity.*;
import com.facturacion.enums.EstadoPago;
import com.facturacion.enums.EstadoServicio;
import com.facturacion.enums.EstadoVenta;
import com.facturacion.enums.MedioPago;
import com.facturacion.enums.TipoSuscripcion;
import com.facturacion.enums.TipoVenta;
import com.facturacion.exception.ResourceNotFoundException;
import com.facturacion.exception.VentaInvalidaException;
import com.facturacion.repository.*;
import com.facturacion.request.ProcesarOperacionVentaRequest;
import com.facturacion.service.VentaService;
import com.facturacion.util.ProrrateoCalculatorUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.TemporalAdjusters;
import java.util.List;

@Service
public class VentaServiceImpl implements VentaService {

    private static final LocalTime END_OF_BILLING_DAY = LocalTime.of(23, 59, 59);

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

    @Value("${app.billing.monthly-billing-day:15}")
    private int monthlyBillingDay;

    @Override
    @Transactional
    public Venta procesarOperacion(ProcesarOperacionVentaRequest request) {
        Cliente cliente = clienteRepository.findByIdAndActivoTrue(request.getClienteId())
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado"));

        UsuarioAdmin vendedor = resolverVendedor(request.getVendedorId());

        Suscripcion suscripcion = resolverSuscripcion(request);

        Venta ventaAnterior = ventaRepository.findTopByClienteIdOrderByFechaVentaDesc(cliente.getId()).orElse(null);
        EstadoCliente viejoEstado = cliente.getEstado();

        TipoVenta tipo = request.getTipoVenta() != null ? request.getTipoVenta() : TipoVenta.RENOVACION;

        BigDecimal precioLista = suscripcion.getPrecio();
        BigDecimal montoProrrateado = BigDecimal.ZERO;
        BigDecimal montoTotal = precioLista;

        LocalDateTime fechaRef = LocalDateTime.now();

        boolean retornoDesdeBloqueado = viejoEstado != null && "BLOQUEADO".equals(viejoEstado.getNombre());
        if (retornoDesdeBloqueado && suscripcion.getTipoSuscripcion() == TipoSuscripcion.MENSUAL && fechaRef.getDayOfMonth() > 1) {
            ProrrateoCalculatorUtil.ResultadoProrrateo r = ProrrateoCalculatorUtil.calcularHastaDiaCobro(precioLista, fechaRef.toLocalDate(), monthlyBillingDay);
            montoProrrateado = r.descuento();
            montoTotal = r.montoFinal();
        }

        Venta nuevaVenta = new Venta();
        nuevaVenta.setCliente(cliente);
        nuevaVenta.setVendedor(vendedor);
        nuevaVenta.setSuscripcion(suscripcion);
        nuevaVenta.setTipoVenta(tipo);
        nuevaVenta.setVentaAnterior(ventaAnterior);
        nuevaVenta.setPrecioLista(precioLista);
        nuevaVenta.setMontoProrrateado(montoProrrateado);
        nuevaVenta.setMontoTotal(montoTotal);
        nuevaVenta.setEstadoVenta(EstadoVenta.PAGADA);
        nuevaVenta.setObservaciones(request.getObservaciones() != null ? request.getObservaciones() : "Operación de " + tipo.name());
        nuevaVenta.setFechaVenta(fechaRef);
        nuevaVenta.setFechaActualizacion(fechaRef);
        nuevaVenta = ventaRepository.save(nuevaVenta);

        Pago pago = new Pago();
        pago.setVenta(nuevaVenta);
        pago.setCodigoOperacion(tipo.name() + "-" + cliente.getId() + "-" + System.currentTimeMillis());
        pago.setMonto(montoTotal);
        pago.setMedioPago(MedioPago.OTRO);
        pago.setEstadoPago(EstadoPago.PAGADO);
        pago.setFechaPago(fechaRef);
        pago.setFechaRegistro(fechaRef);
        pago.setObservaciones("Pago registrado automaticamente por " + tipo.name());
        pagoRepository.save(pago);

        // Actualizar Servicio
        LocalDateTime fechaInicio = fechaRef;
        LocalDateTime fechaFin;

        if (suscripcion.getTipoSuscripcion() == TipoSuscripcion.ANUAL) {
            fechaFin = fechaInicio.plusYears(1);
        } else {
            LocalDate fechaFinMensual = ProrrateoCalculatorUtil.calcularFechaFinMensual(fechaInicio.toLocalDate(), monthlyBillingDay);
            fechaFin = LocalDateTime.of(fechaFinMensual, END_OF_BILLING_DAY);
        }

        ServicioCliente servicio = new ServicioCliente();
        servicio.setCliente(cliente);
        servicio.setVenta(nuevaVenta);
        servicio.setFechaInicio(fechaInicio);
        servicio.setFechaFin(fechaFin);
        servicio.setFechaCapacitacion(fechaInicio);
        servicio.setEstado(EstadoServicio.ACTIVO);
        servicio.setMontoProrrateo(montoTotal);
        servicio.setDiasProrrateados(fechaInicio.getDayOfMonth() - 1);
        servicio.setObservaciones("Servicio activado por " + tipo.name());
        servicio.setFechaCreacion(fechaRef);
        servicio.setFechaActualizacion(fechaRef);
        servicioClienteRepository.save(servicio);
        crearSiguienteRenovacionPendiente(nuevaVenta, fechaFin);

        // Actualizar Estado Cliente a HABILITADO
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
        h.setMotivo("Operación realizada: " + tipo.name());
        h.setFechaCambio(fechaRef);
        historialEstadoClienteRepository.save(h);

        return nuevaVenta;
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
                || ventaRepository.existsByVentaAnteriorIdAndTipoVenta(ventaActual.getId(), TipoVenta.RENOVACION)) {
            return;
        }

        LocalDate fechaCobroDate = ventaActual.getSuscripcion().getTipoSuscripcion() == TipoSuscripcion.ANUAL
                ? fechaFinServicio.toLocalDate()
                : fechaFinServicio.toLocalDate();
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
