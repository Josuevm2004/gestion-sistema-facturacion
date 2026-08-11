package com.facturacion.impl;

import com.facturacion.entity.Cliente;
import com.facturacion.entity.Pago;
import com.facturacion.enums.EstadoCuenta;
import com.facturacion.enums.EstadoPago;
import com.facturacion.exception.ResourceNotFoundException;
import com.facturacion.repository.ClienteRepository;
import com.facturacion.repository.PagoRepository;
import com.facturacion.request.RegistrarPagoRequest;
import com.facturacion.response.EstadoPagoResponse;
import com.facturacion.service.NotificacionEmailService;
import com.facturacion.service.PagoService;
import com.facturacion.util.DateUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class PagoServiceImpl implements PagoService {

    @Autowired
    private ClienteRepository clienteRepository;

    @Autowired
    private PagoRepository pagoRepository;



    @Override
    @Transactional
    public EstadoPagoResponse marcarPagarLuego(Long clienteId) {
        Cliente cliente = clienteRepository.findById(clienteId)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado con ID: " + clienteId));

        String periodoActual = DateUtils.getCurrentPeriod();
        Optional<Pago> pagoOpt = pagoRepository.findTopByClienteIdAndPeriodoMesAnoOrderByFechaRegistroDesc(clienteId, periodoActual);

        Pago pago;
        if (pagoOpt.isPresent()) {
            pago = pagoOpt.get();
        } else {
            pago = Pago.builder()
                    .cliente(cliente)
                    .monto(cliente.getMontoMensual())
                    .periodoMesAno(periodoActual)
                    .build();
        }

        pago.setEstadoPago(EstadoPago.PAGAR_LUEGO);
        pago.setObservaciones("Cliente seleccionó la opción de pagar luego vía transferencia bancaria.");
        pagoRepository.save(pago);

        return EstadoPagoResponse.builder()
                .clienteId(cliente.getId())
                .ruc(cliente.getRuc())
                .razonSocial(cliente.getRazonSocial())
                .estadoPago(pago.getEstadoPago())
                .monto(pago.getMonto())
                .build();
    }

    @Override
    @Transactional
    public EstadoPagoResponse registrarPagoManual(RegistrarPagoRequest request) {
        Cliente cliente = clienteRepository.findById(request.getClienteId())
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado con ID: " + request.getClienteId()));

        String periodo = request.getPeriodoMesAno() != null ? request.getPeriodoMesAno() : DateUtils.getCurrentPeriod();

        Pago pago = Pago.builder()
                .cliente(cliente)
                .codigoOperacion(request.getCodigoOperacion())
                .monto(request.getMonto())
                .medioPago(request.getMedioPago())
                .estadoPago(EstadoPago.PAGO)
                .fechaPago(LocalDateTime.now())
                .periodoMesAno(periodo)
                .comprobanteUrl(request.getComprobanteUrl())
                .observaciones(request.getObservaciones() != null ? request.getObservaciones() : "Confirmación manual por Administrador")
                .build();

        pagoRepository.save(pago);

        if (cliente.getEstadoCuenta() == EstadoCuenta.POR_COBRAR) {
            cliente.setEstadoCuenta(EstadoCuenta.PAGO_REALIZADO);
        } else {
            cliente.setEstadoCuenta(EstadoCuenta.HABILITADO);
        }
        cliente.setFechaVencimientoMensual(LocalDateTime.now().plusMonths(1));
        clienteRepository.save(cliente);



        return EstadoPagoResponse.builder()
                .clienteId(cliente.getId())
                .ruc(cliente.getRuc())
                .razonSocial(cliente.getRazonSocial())
                .estadoPago(pago.getEstadoPago())
                .codigoOperacion(pago.getCodigoOperacion())
                .monto(pago.getMonto())
                .fechaPago(pago.getFechaPago())
                .build();
    }

    @Override
    public EstadoPagoResponse obtenerEstadoPagoCliente(Long clienteId) {
        Cliente cliente = clienteRepository.findById(clienteId)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado con ID: " + clienteId));

        String periodoActual = DateUtils.getCurrentPeriod();
        Optional<Pago> pagoOpt = pagoRepository.findTopByClienteIdAndPeriodoMesAnoOrderByFechaRegistroDesc(clienteId, periodoActual);

        EstadoPago estado = pagoOpt.map(Pago::getEstadoPago).orElse(EstadoPago.PENDIENTE_PAGO);
        String codOp = pagoOpt.map(Pago::getCodigoOperacion).orElse(null);
        Double monto = pagoOpt.map(Pago::getMonto).orElse(cliente.getMontoMensual());
        LocalDateTime fecha = pagoOpt.map(Pago::getFechaPago).orElse(null);

        String razonClean = cliente.getRazonSocial() != null ? cliente.getRazonSocial().replaceAll("[^a-zA-Z0-9]", "").toLowerCase() : "cliente";

        return EstadoPagoResponse.builder()
                .clienteId(cliente.getId())
                .ruc(cliente.getRuc())
                .razonSocial(cliente.getRazonSocial())
                .estadoPago(estado)
                .codigoOperacion(codOp)
                .monto(monto)
                .fechaPago(fecha)
                .subdominioUrl("https://" + razonClean + ".facturacionperu.pe")
                .build();
    }

    @Override
    public List<EstadoPagoResponse> listarPagos() {
        return pagoRepository.findAll().stream()
                .map(pago -> EstadoPagoResponse.builder()
                        .clienteId(pago.getCliente().getId())
                        .ruc(pago.getCliente().getRuc())
                        .razonSocial(pago.getCliente().getRazonSocial())
                        .estadoPago(pago.getEstadoPago())
                        .codigoOperacion(pago.getCodigoOperacion())
                        .monto(pago.getMonto())
                        .fechaPago(pago.getFechaPago())
                        .build())
                .collect(Collectors.toList());
    }
}
