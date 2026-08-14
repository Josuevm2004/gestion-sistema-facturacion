package com.facturacion.controller;

import com.facturacion.request.CapacitacionRequest;
import com.facturacion.response.ApiResponse;
import com.facturacion.service.ServicioClienteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/api/admin/servicios", "/admin/servicios"})
@CrossOrigin(origins = "*")
public class ServicioClienteController {

    @Autowired
    private ServicioClienteService servicioClienteService;

    @PostMapping({"/capacitar/{clienteId}", "/capacitacion/{clienteId}"})
    public ResponseEntity<ApiResponse<Void>> capacitarCliente(
            @PathVariable Long clienteId,
            @RequestBody CapacitacionRequest request) {
        servicioClienteService.capacitarCliente(clienteId, request);
        return ResponseEntity.ok(ApiResponse.success("Capacitacion registrada. Plan y prorrateo Mcobro activados.", null));
    }

    @PutMapping("/cliente/{clienteId}/bloquear")
    public ResponseEntity<ApiResponse<Void>> bloquearCliente(
            @PathVariable Long clienteId,
            @RequestParam(required = false) String motivo) {
        servicioClienteService.bloquearCliente(clienteId, motivo);
        return ResponseEntity.ok(ApiResponse.success("Cliente bloqueado exitosamente", null));
    }

    @PutMapping("/cliente/{clienteId}/devolver-acceso")
    public ResponseEntity<ApiResponse<Void>> devolverAcceso(@PathVariable Long clienteId) {
        servicioClienteService.devolverAcceso(clienteId);
        return ResponseEntity.ok(ApiResponse.success("Acceso devuelto. Cliente restaurado a estado VENCIDO para gestionar su plan.", null));
    }

    @PostMapping("/revisar-vencimientos")
    public ResponseEntity<ApiResponse<Void>> revisarVencimientosManualmente() {
        servicioClienteService.revisarVencimientos();
        return ResponseEntity.ok(ApiResponse.success("Revision de vencimientos ejecutada con exito", null));
    }
}
