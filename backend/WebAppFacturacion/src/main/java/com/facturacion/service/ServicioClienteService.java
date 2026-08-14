package com.facturacion.service;

import com.facturacion.entity.ServicioCliente;
import com.facturacion.request.CapacitacionRequest;

public interface ServicioClienteService {
    ServicioCliente capacitarCliente(Long clienteId, CapacitacionRequest request);
    ServicioCliente bloquearCliente(Long clienteId, String motivo);
    ServicioCliente devolverAcceso(Long clienteId);
    void revisarVencimientos();
}
