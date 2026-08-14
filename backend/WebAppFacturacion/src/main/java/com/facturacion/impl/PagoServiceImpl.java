package com.facturacion.impl;

import com.facturacion.entity.*;
import com.facturacion.enums.EstadoPago;
import com.facturacion.enums.EstadoServicio;
import com.facturacion.enums.EstadoVenta;
import com.facturacion.enums.MedioPago;
import com.facturacion.enums.TipoSuscripcion;
import com.facturacion.enums.TipoVenta;
import com.facturacion.exception.ResourceNotFoundException;
import com.facturacion.repository.*;
import com.facturacion.request.RegistrarPagoRequest;
import com.facturacion.service.PagoService;
import com.facturacion.util.ProrrateoCalculatorUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.TemporalAdjusters;
import java.util.List;

@Service
public class PagoServiceImpl implements PagoService {

    private static final LocalTime END_OF_BILLING_DAY = LocalTime.of(23, 59, 59);

    @Autowired
    private PagoRepository pagoRepository;
    @Autowired
    private VentaRepository ventaRepository;
    @Autowired
    private ClienteRepository clienteRepository;
    @Autowired
    private EstadoClienteRepository estadoClienteRepository;
    @Autowired
    private HistorialEstadoClienteRepository historialEstadoClienteRepository;
    @Autowired
    private ServicioClienteRepository servicioClienteRepository;

    @Value("${app.billing.monthly-billing-day:15}")
    private int monthlyBillingDay;

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

        Pago pago = new Pago();
        pago.setVenta(venta);
        pago.setCodigoOperacion(request.getCodigoOperacion());
        pago.setMonto(request.getMonto() != null ? request.getMonto() : venta.getMontoTotal());
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
            EstadoCliente viejoEstado = cliente.getEstado();
            EstadoCliente estadoPorCapacitar = estadoClienteRepository.findByNombreAndActivoTrue("POR_CAPACITAR")
                    .orElseGet(() -> {
                        EstadoCliente e = new EstadoCliente();
                        e.setNombre("POR_CAPACITAR");
                        e.setDescripcion("Pago realizado, pendiente de capacitación");
                        return estadoClienteRepository.save(e);
                    });

            cliente.setEstado(estadoPorCapacitar);
            clienteRepository.save(cliente);

            HistorialEstadoCliente h = new HistorialEstadoCliente();
            h.setCliente(cliente);
            h.setEstadoAnterior(viejoEstado);
            h.setEstadoNuevo(estadoPorCapacitar);
            h.setMotivo("Pago verificado para Venta de ALTA #" + venta.getId());
            h.setFechaCambio(fechaOperacion);
            historialEstadoClienteRepository.save(h);
        } else if (cliente != null) {
            activarServicioPorVentaPagada(cliente, venta, fechaOperacion);
        }

        return pago;
    }

    private void activarServicioPorVentaPagada(Cliente cliente, Venta venta, LocalDateTime fechaOperacion) {
        ServicioCliente servicio = servicioClienteRepository.findByVentaId(venta.getId()).orElse(null);
        if (servicio == null) {
            LocalDateTime fechaInicio = venta.getFechaVenta() != null ? venta.getFechaVenta() : fechaOperacion;
            LocalDateTime fechaFin;
            if (venta.getSuscripcion() != null && venta.getSuscripcion().getTipoSuscripcion() == TipoSuscripcion.ANUAL) {
                fechaFin = fechaInicio.plusYears(1);
            } else {
                LocalDate fechaFinMensual = ProrrateoCalculatorUtil.calcularFechaFinMensual(fechaInicio.toLocalDate(), monthlyBillingDay);
                fechaFin = LocalDateTime.of(fechaFinMensual, END_OF_BILLING_DAY);
            }

            servicio = new ServicioCliente();
            servicio.setCliente(cliente);
            servicio.setVenta(venta);
            servicio.setFechaInicio(fechaInicio);
            servicio.setFechaFin(fechaFin);
            servicio.setFechaCapacitacion(fechaInicio);
            servicio.setEstado(EstadoServicio.ACTIVO);
            servicio.setMontoProrrateo(venta.getMontoTotal());
            servicio.setDiasProrrateados(0);
            servicio.setObservaciones("Servicio activado por pago de " + venta.getTipoVenta());
            servicio.setFechaCreacion(fechaOperacion);
            servicio.setFechaActualizacion(fechaOperacion);
            servicioClienteRepository.save(servicio);
        }
        crearSiguienteRenovacionPendiente(venta, servicio.getFechaFin());

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
        h.setMotivo("Pago verificado para Venta #" + venta.getId() + " (" + venta.getTipoVenta() + ")");
        h.setFechaCambio(fechaOperacion);
        historialEstadoClienteRepository.save(h);
    }

    private void crearSiguienteRenovacionPendiente(Venta ventaActual, LocalDateTime fechaFinServicio) {
        if (fechaFinServicio == null
                || ventaActual.getId() == null
                || ventaActual.getSuscripcion() == null
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
    public List<Pago> listarPagosPorCliente(Long clienteId) {
        return pagoRepository.findByVentaClienteIdOrderByFechaRegistroDesc(clienteId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Pago> listarTodosPagos() {
        return pagoRepository.findAll();
    }
}
