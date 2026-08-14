package com.facturacion.controller;

import com.facturacion.request.RegistroFormularioRequest;
import com.facturacion.response.ApiResponse;
import com.facturacion.response.ClienteDashboardResponse;
import com.facturacion.service.ClienteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/api/public/registro", "/public/registro"})
@CrossOrigin(origins = "*")
public class FormularioRegistroController {

    @Autowired
    private ClienteService clienteService;

    @PostMapping
    public ResponseEntity<ApiResponse<ClienteDashboardResponse>> registrarEncuestaYCliente(@RequestBody RegistroFormularioRequest request) {
        ClienteDashboardResponse cliente = clienteService.registrarFormulario(request);
        return ResponseEntity.ok(ApiResponse.success("Cliente registrado con éxito en estado POR_COBRAR", cliente));
    }
}
