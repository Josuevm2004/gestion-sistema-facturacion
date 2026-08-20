package com.facturacion.service;

import com.facturacion.request.ClienteUpdateRequest;
import com.facturacion.request.RegistroFormularioRequest;
import com.facturacion.response.ClienteDashboardResponse;
import com.facturacion.response.DetalleClienteResponse;

import java.util.List;

public interface ClienteService {
    ClienteDashboardResponse registrarFormulario(RegistroFormularioRequest request);
    List<ClienteDashboardResponse> listarClientes();
    DetalleClienteResponse obtenerPorId(Long id);
    ClienteDashboardResponse actualizarCliente(Long id, ClienteUpdateRequest request);
    ClienteDashboardResponse cambiarColorTag(Long clienteId, Long colorTagId);
    ClienteDashboardResponse cambiarVendedor(Long clienteId, Long vendedorId);
    ClienteDashboardResponse asignarmeVendedor(Long clienteId, String username);
    ClienteDashboardResponse cambiarEstadoCliente(Long clienteId, String nuevoEstadoNombre);
    void eliminarClientePermanentemente(Long clienteId);
}
