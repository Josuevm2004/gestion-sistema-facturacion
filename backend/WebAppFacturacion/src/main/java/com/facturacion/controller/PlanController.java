package com.facturacion.controller;

import com.facturacion.entity.Plan;
import com.facturacion.entity.Suscripcion;
import com.facturacion.repository.PlanRepository;
import com.facturacion.repository.SuscripcionRepository;
import com.facturacion.response.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/admin/planes", "/admin/planes"})
@CrossOrigin(origins = "*")
public class PlanController {

    @Autowired
    private PlanRepository planRepository;
    @Autowired
    private SuscripcionRepository suscripcionRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Plan>>> listarPlanes() {
        List<Plan> planes = planRepository.findByActivoTrue();
        return ResponseEntity.ok(ApiResponse.success("Listado de planes obtenido", planes));
    }

    @GetMapping("/suscripciones")
    public ResponseEntity<ApiResponse<List<Suscripcion>>> listarSuscripciones() {
        List<Suscripcion> suscripciones = suscripcionRepository.findByActivoTrue();
        return ResponseEntity.ok(ApiResponse.success("Listado de suscripciones y precios obtenido", suscripciones));
    }
}
