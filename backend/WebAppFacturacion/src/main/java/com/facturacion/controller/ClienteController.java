package com.facturacion.controller;

import com.facturacion.enums.ColorTag;
import com.facturacion.enums.EstadoCapacitacion;
import com.facturacion.enums.EstadoCuenta;
import com.facturacion.request.ClienteUpdateRequest;
import com.facturacion.response.ApiResponse;
import com.facturacion.response.ClienteResponse;
import com.facturacion.response.DetalleClienteResponse;
import com.facturacion.service.ClienteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/admin/clientes")
public class ClienteController {

    @Autowired
    private ClienteService clienteService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ClienteResponse>>> listarClientes() {
        List<ClienteResponse> clientes = clienteService.listarClientes();
        return ResponseEntity.ok(ApiResponse.success("Listado de clientes obtenido", clientes));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DetalleClienteResponse>> obtenerClientePorId(@PathVariable Long id) {
        DetalleClienteResponse cliente = clienteService.obtenerPorId(id);
        return ResponseEntity.ok(ApiResponse.success("Detalle del cliente obtenido", cliente));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ClienteResponse>> actualizarCliente(
            @PathVariable Long id,
            @RequestBody ClienteUpdateRequest request) {
        ClienteResponse cliente = clienteService.actualizarCliente(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cliente actualizado correctamente", cliente));
    }

    @PatchMapping("/{id}/estado-cuenta")
    public ResponseEntity<ApiResponse<ClienteResponse>> cambiarEstadoCuenta(
            @PathVariable Long id,
            @RequestParam EstadoCuenta estado) {
        ClienteResponse cliente = clienteService.cambiarEstadoCuenta(id, estado);
        return ResponseEntity.ok(ApiResponse.success("Estado de cuenta actualizado a " + estado, cliente));
    }

    @PatchMapping("/{id}/estado-capacitacion")
    public ResponseEntity<ApiResponse<ClienteResponse>> cambiarEstadoCapacitacion(
            @PathVariable Long id,
            @RequestParam EstadoCapacitacion estado) {
        ClienteResponse cliente = clienteService.cambiarEstadoCapacitacion(id, estado);
        return ResponseEntity.ok(ApiResponse.success("Estado de capacitación actualizado a " + estado, cliente));
    }

    @PatchMapping("/{id}/color-tag")
    public ResponseEntity<ApiResponse<ClienteResponse>> cambiarColorTag(
            @PathVariable Long id,
            @RequestParam ColorTag color) {
        ClienteResponse cliente = clienteService.cambiarColorTag(id, color);
        return ResponseEntity.ok(ApiResponse.success("Etiqueta de color actualizada a " + color, cliente));
    }

    @PatchMapping("/{id}/vendedor")
    public ResponseEntity<ApiResponse<ClienteResponse>> cambiarVendedor(
            @PathVariable Long id,
            @RequestParam String vendedor) {
        ClienteResponse cliente = clienteService.cambiarVendedor(id, vendedor);
        return ResponseEntity.ok(ApiResponse.success("Vendedor asignado a " + vendedor, cliente));
    }

    @PatchMapping("/{id}/fecha-capacitacion")
    public ResponseEntity<ApiResponse<ClienteResponse>> programarCapacitacion(
            @PathVariable Long id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fecha) {
        ClienteResponse cliente = clienteService.programarCapacitacion(id, fecha);
        return ResponseEntity.ok(ApiResponse.success("Capacitación programada y prorrateo calculado con éxito", cliente));
    }

    @PatchMapping("/{id}/renovar-plan")
    public ResponseEntity<ApiResponse<ClienteResponse>> renovarPlan(
            @PathVariable Long id,
            @RequestParam(required = false) String nuevoPlan,
            @RequestParam(required = false) String tipoSuscripcion) {
        ClienteResponse cliente = clienteService.renovarPlanCliente(id, nuevoPlan, tipoSuscripcion);
        return ResponseEntity.ok(ApiResponse.success("Plan renovado exitosamente", cliente));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> eliminarCliente(@PathVariable Long id) {
        clienteService.eliminarCliente(id);
        return ResponseEntity.ok(ApiResponse.success("Cliente eliminado permanentemente de la base de datos", null));
    }
}
