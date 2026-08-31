package com.facturacion.service;

import com.facturacion.entity.Venta;
import com.facturacion.request.ProcesarOperacionVentaRequest;

import java.util.List;

public interface VentaService {
    Venta procesarOperacion(ProcesarOperacionVentaRequest request);
    Venta procesarAdelantoPago(ProcesarOperacionVentaRequest request);
    List<Venta> listarVentasPorCliente(Long clienteId);
}
