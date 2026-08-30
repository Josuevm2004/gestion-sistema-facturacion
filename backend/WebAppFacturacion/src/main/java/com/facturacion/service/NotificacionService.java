package com.facturacion.service;

import com.facturacion.response.NotificacionResponse;

import java.util.List;

public interface NotificacionService {
    List<NotificacionResponse> listarNotificaciones();
    void marcarComoLeida(Long id);
    void marcarTodasComoLeidas();
}
