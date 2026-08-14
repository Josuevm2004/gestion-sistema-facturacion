package com.facturacion.controller;

import com.facturacion.entity.Pago;
import com.facturacion.request.RegistrarPagoRequest;
import com.facturacion.response.ApiResponse;
import com.facturacion.service.PagoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/admin/pagos", "/admin/pagos"})
@CrossOrigin(origins = "*")
public class PagoController {

    @Autowired
    private PagoService pagoService;

    @PostMapping({"/registrar", "/confirmar"})
    public ResponseEntity<ApiResponse<Pago>> registrarPago(@RequestBody RegistrarPagoRequest request) {
        Pago pago = pagoService.registrarPago(request);
        return ResponseEntity.ok(ApiResponse.success("Pago registrado exitosamente", pago));
    }

    @GetMapping({"", "/"})
    public ResponseEntity<ApiResponse<List<Pago>>> listarTodosPagos() {
        List<Pago> pagos = pagoService.listarTodosPagos();
        return ResponseEntity.ok(ApiResponse.success("Listado de pagos obtenido", pagos));
    }

    @GetMapping("/cliente/{clienteId}")
    public ResponseEntity<ApiResponse<List<Pago>>> listarPagosPorCliente(@PathVariable Long clienteId) {
        List<Pago> pagos = pagoService.listarPagosPorCliente(clienteId);
        return ResponseEntity.ok(ApiResponse.success("Historial de pagos obtenido", pagos));
    }
}
