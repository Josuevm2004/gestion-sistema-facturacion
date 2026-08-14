package com.facturacion.controller;

import com.facturacion.entity.Venta;
import com.facturacion.request.ProcesarOperacionVentaRequest;
import com.facturacion.response.ApiResponse;
import com.facturacion.service.VentaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/admin/ventas", "/admin/ventas"})
@CrossOrigin(origins = "*")
public class VentaController {

    @Autowired
    private VentaService ventaService;

    @PostMapping({"/procesar-operacion", "/renovar-plan", "/cambiar-plan"})
    public ResponseEntity<ApiResponse<Venta>> procesarOperacionVenta(@RequestBody ProcesarOperacionVentaRequest request) {
        Venta venta = ventaService.procesarOperacion(request);
        return ResponseEntity.ok(ApiResponse.success("Operación comercial procesada con éxito (" + venta.getTipoVenta() + ")", venta));
    }

    @GetMapping("/cliente/{clienteId}")
    public ResponseEntity<ApiResponse<List<Venta>>> listarVentasPorCliente(@PathVariable Long clienteId) {
        List<Venta> ventas = ventaService.listarVentasPorCliente(clienteId);
        return ResponseEntity.ok(ApiResponse.success("Historial de ventas del cliente obtenido", ventas));
    }
}
