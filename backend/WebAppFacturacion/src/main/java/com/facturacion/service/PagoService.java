package com.facturacion.service;

import com.facturacion.request.RegistrarPagoRequest;
import com.facturacion.response.EstadoPagoResponse;

import java.util.List;

public interface PagoService {
    EstadoPagoResponse marcarPagarLuego(Long clienteId);
    EstadoPagoResponse registrarPagoManual(RegistrarPagoRequest request);
    EstadoPagoResponse obtenerEstadoPagoCliente(Long clienteId);
    List<EstadoPagoResponse> listarPagos();
}
