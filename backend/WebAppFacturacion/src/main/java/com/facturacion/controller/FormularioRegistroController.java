package com.facturacion.controller;

import com.facturacion.request.RegistroFormularioRequest;
import com.facturacion.response.ApiResponse;
import com.facturacion.response.DetalleClienteResponse;
import com.facturacion.service.FormularioRegistroService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/public/registro")
public class FormularioRegistroController {

    @Autowired
    private FormularioRegistroService registroService;

    @PostMapping
    public ResponseEntity<ApiResponse<DetalleClienteResponse>> registrarCliente(@Valid @RequestBody RegistroFormularioRequest request) {
        DetalleClienteResponse response = registroService.registrarCliente(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Cliente registrado con éxito. Credenciales de acceso generadas.", response));
    }
}
