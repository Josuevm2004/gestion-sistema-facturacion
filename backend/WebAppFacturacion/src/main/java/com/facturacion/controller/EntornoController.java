package com.facturacion.controller;

import com.facturacion.entity.Entorno;
import com.facturacion.repository.EntornoRepository;
import com.facturacion.response.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping({"/api/admin/entornos", "/admin/entornos"})
@CrossOrigin(origins = "*")
public class EntornoController {

    @Autowired
    private EntornoRepository entornoRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Entorno>>> listarEntornos() {
        return ResponseEntity.ok(ApiResponse.success(
                "Listado de entornos obtenido",
                entornoRepository.findByActivoTrueOrderByIdAsc()));
    }
}
