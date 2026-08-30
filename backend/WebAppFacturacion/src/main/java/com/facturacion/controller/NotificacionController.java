package com.facturacion.controller;

import com.facturacion.response.ApiResponse;
import com.facturacion.response.NotificacionResponse;
import com.facturacion.service.NotificacionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/admin/notificaciones", "/admin/notificaciones"})
@CrossOrigin(origins = "*")
public class NotificacionController {

    @Autowired
    private NotificacionService notificacionService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<NotificacionResponse>>> listarNotificaciones() {
        List<NotificacionResponse> notificaciones = notificacionService.listarNotificaciones();
        return ResponseEntity.ok(ApiResponse.success("Notificaciones obtenidas con éxito", notificaciones));
    }

    @PutMapping("/{id}/leida")
    public ResponseEntity<ApiResponse<Void>> marcarComoLeida(@PathVariable Long id) {
        notificacionService.marcarComoLeida(id);
        return ResponseEntity.ok(ApiResponse.success("Notificación marcada como leída", null));
    }

    @PutMapping("/marcar-todas-leidas")
    public ResponseEntity<ApiResponse<Void>> marcarTodasComoLeidas() {
        notificacionService.marcarTodasComoLeidas();
        return ResponseEntity.ok(ApiResponse.success("Todas las notificaciones marcadas como leídas", null));
    }
}
