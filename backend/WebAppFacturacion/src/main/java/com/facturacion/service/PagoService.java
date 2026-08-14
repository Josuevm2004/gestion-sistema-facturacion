package com.facturacion.service;

import com.facturacion.entity.Pago;
import com.facturacion.request.RegistrarPagoRequest;

import java.util.List;

public interface PagoService {
    Pago registrarPago(RegistrarPagoRequest request);
    List<Pago> listarPagosPorCliente(Long clienteId);
    List<Pago> listarTodosPagos();
}
