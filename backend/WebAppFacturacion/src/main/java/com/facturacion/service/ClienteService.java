package com.facturacion.service;

import com.facturacion.enums.ColorTag;
import com.facturacion.enums.EstadoCapacitacion;
import com.facturacion.enums.EstadoCuenta;
import com.facturacion.request.ClienteUpdateRequest;
import com.facturacion.response.ClienteResponse;
import com.facturacion.response.DetalleClienteResponse;

import java.time.LocalDateTime;
import java.util.List;

public interface ClienteService {
    List<ClienteResponse> listarClientes();
    DetalleClienteResponse obtenerPorId(Long id);
    ClienteResponse actualizarCliente(Long id, ClienteUpdateRequest request);
    ClienteResponse cambiarEstadoCuenta(Long id, EstadoCuenta estadoCuenta);
    ClienteResponse cambiarEstadoCapacitacion(Long id, EstadoCapacitacion estadoCapacitacion);
    ClienteResponse cambiarColorTag(Long id, ColorTag colorTag);
    ClienteResponse cambiarVendedor(Long id, String vendedor);
    ClienteResponse programarCapacitacion(Long id, LocalDateTime fechaCapacitacion);
    ClienteResponse renovarPlanCliente(Long id, String nuevoPlan, String tipoSuscripcion);
    void eliminarCliente(Long id);
}
