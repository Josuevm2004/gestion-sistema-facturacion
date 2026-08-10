package com.facturacion.controller;

import com.facturacion.request.RegistrarPagoRequest;
import com.facturacion.response.ApiResponse;
import com.facturacion.response.EstadoPagoResponse;
import com.facturacion.service.PagoService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class PagoController {

    @Autowired
    private PagoService pagoService;

    @PostMapping("/api/public/pagos/pagar-luego/{clienteId}")
    public ResponseEntity<ApiResponse<EstadoPagoResponse>> marcarPagarLuego(@PathVariable Long clienteId) {
        EstadoPagoResponse response = pagoService.marcarPagarLuego(clienteId);
        return ResponseEntity.ok(ApiResponse.success("Estado actualizado a PAGAR_LUEGO. Registraremos tu pago manualmente tras verificar la transferencia.", response));
    }

    @GetMapping("/api/public/pagos/estado/{clienteId}")
    public ResponseEntity<ApiResponse<EstadoPagoResponse>> consultarEstadoPago(@PathVariable Long clienteId) {
        EstadoPagoResponse response = pagoService.obtenerEstadoPagoCliente(clienteId);
        return ResponseEntity.ok(ApiResponse.success("Estado de pago consultado con éxito", response));
    }

    @PostMapping("/api/admin/pagos/registrar")
    public ResponseEntity<ApiResponse<EstadoPagoResponse>> registrarPagoManual(@Valid @RequestBody RegistrarPagoRequest request) {
        EstadoPagoResponse response = pagoService.registrarPagoManual(request);
        return ResponseEntity.ok(ApiResponse.success("Pago registrado y verificado exitosamente por Administrador", response));
    }

    @GetMapping("/api/admin/pagos")
    public ResponseEntity<ApiResponse<List<EstadoPagoResponse>>> listarPagos() {
        List<EstadoPagoResponse> response = pagoService.listarPagos();
        return ResponseEntity.ok(ApiResponse.success("Listado de pagos obtenido", response));
    }
}
