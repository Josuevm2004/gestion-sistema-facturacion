package com.facturacion.controller;

import com.facturacion.request.ClienteUpdateRequest;
import com.facturacion.response.ApiResponse;
import com.facturacion.response.ClienteDashboardResponse;
import com.facturacion.response.DetalleClienteResponse;
import com.facturacion.service.ClienteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/admin/clientes", "/admin/clientes"})
@CrossOrigin(origins = "*")
public class ClienteController {

    @Autowired
    private ClienteService clienteService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ClienteDashboardResponse>>> listarClientes() {
        List<ClienteDashboardResponse> clientes = clienteService.listarClientes();
        return ResponseEntity.ok(ApiResponse.success("Listado de clientes obtenido", clientes));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DetalleClienteResponse>> obtenerClientePorId(@PathVariable Long id) {
        DetalleClienteResponse cliente = clienteService.obtenerPorId(id);
        return ResponseEntity.ok(ApiResponse.success("Detalle del cliente obtenido", cliente));
    }

    @PutMapping("/{id}")
    @PreAuthorize("isAuthenticated() and (hasRole('ADMIN') or #request.vendedorId == null)")
    public ResponseEntity<ApiResponse<ClienteDashboardResponse>> actualizarCliente(
            @PathVariable Long id,
            @RequestBody ClienteUpdateRequest request) {
        ClienteDashboardResponse cliente = clienteService.actualizarCliente(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cliente actualizado correctamente", cliente));
    }

    @RequestMapping(value = "/{id}/color-tag", method = {RequestMethod.PUT, RequestMethod.PATCH, RequestMethod.POST})
    public ResponseEntity<ApiResponse<ClienteDashboardResponse>> cambiarColorTag(
            @PathVariable Long id,
            @RequestParam Long colorTagId) {
        ClienteDashboardResponse cliente = clienteService.cambiarColorTag(id, colorTagId);
        return ResponseEntity.ok(ApiResponse.success("Etiqueta de color actualizada", cliente));
    }

    @RequestMapping(value = "/{id}/vendedor", method = {RequestMethod.PUT, RequestMethod.PATCH, RequestMethod.POST})
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ClienteDashboardResponse>> cambiarVendedor(
            @PathVariable Long id,
            @RequestParam Long vendedorId) {
        ClienteDashboardResponse cliente = clienteService.cambiarVendedor(id, vendedorId);
        return ResponseEntity.ok(ApiResponse.success("Vendedor asignado correctamente", cliente));
    }

    @PostMapping("/{id}/vendedor/asignarme")
    @PreAuthorize("hasAnyRole('ADMIN', 'VENDEDOR')")
    public ResponseEntity<ApiResponse<ClienteDashboardResponse>> asignarmeVendedor(
            @PathVariable Long id,
            Authentication authentication) {
        ClienteDashboardResponse cliente = clienteService.asignarmeVendedor(id, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Cliente asignado correctamente", cliente));
    }

    @RequestMapping(value = "/{id}/estado", method = {RequestMethod.PUT, RequestMethod.PATCH, RequestMethod.POST})
    public ResponseEntity<ApiResponse<ClienteDashboardResponse>> cambiarEstadoCliente(
            @PathVariable Long id,
            @RequestParam String nuevoEstado) {
        ClienteDashboardResponse cliente = clienteService.cambiarEstadoCliente(id, nuevoEstado);
        return ResponseEntity.ok(ApiResponse.success("Estado del cliente actualizado a " + nuevoEstado, cliente));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> eliminarCliente(@PathVariable Long id) {
        clienteService.eliminarClientePermanentemente(id);
        return ResponseEntity.ok(ApiResponse.success("Cliente eliminado permanentemente del sistema", null));
    }
}

