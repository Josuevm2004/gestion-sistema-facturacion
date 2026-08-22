package com.facturacion.controller;

import com.facturacion.request.ValidarCredencialesSunatRequest;
import com.facturacion.response.ApiResponse;
import com.facturacion.response.ValidacionSunatResponse;
import com.facturacion.service.SunatCredentialValidationService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({"/api/public/sunat", "/public/sunat"})
@CrossOrigin(origins = "*")
public class SunatValidationController {

    @Autowired
    private SunatCredentialValidationService sunatCredentialValidationService;

    @PostMapping("/validar-credenciales")
    public ResponseEntity<ApiResponse<ValidacionSunatResponse>> validarCredenciales(
            @Valid @RequestBody ValidarCredencialesSunatRequest request) {
        ValidacionSunatResponse resultado = sunatCredentialValidationService.validar(request);
        String mensaje = resultado.isValido()
                ? "Credenciales SUNAT verificadas correctamente"
                : "No se pudieron verificar las credenciales SUNAT";
        return ResponseEntity.ok(ApiResponse.success(mensaje, resultado));
    }
}
