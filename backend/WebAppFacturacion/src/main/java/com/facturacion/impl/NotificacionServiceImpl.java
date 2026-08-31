package com.facturacion.impl;

import com.facturacion.entity.Notificacion;
import com.facturacion.exception.ResourceNotFoundException;
import com.facturacion.repository.NotificacionRepository;
import com.facturacion.response.NotificacionResponse;
import com.facturacion.service.NotificacionService;
import com.facturacion.service.ServicioClienteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class NotificacionServiceImpl implements NotificacionService {

    @Autowired
    private NotificacionRepository notificacionRepository;

    @Autowired
    private ServicioClienteService servicioClienteService;

    @Override
    @Transactional
    public List<NotificacionResponse> listarNotificaciones() {
        try {
            servicioClienteService.revisarVencimientos();
        } catch (Exception ignored) {
        }
        List<Notificacion> list = notificacionRepository.findTop50ByOrderByFechaCreacionDesc();
        List<NotificacionResponse> res = new ArrayList<>();
        for (Notificacion n : list) {
            NotificacionResponse dto = new NotificacionResponse();
            dto.setId(n.getId());
            dto.setTipo(n.getTipo() != null ? n.getTipo().name() : "OTRA");
            dto.setTitulo(n.getTitulo());
            dto.setMensaje(n.getMensaje());
            dto.setLeida(Boolean.TRUE.equals(n.getLeida()));
            dto.setFechaCreacion(n.getFechaCreacion());
            if (n.getCliente() != null) {
                dto.setClienteId(n.getCliente().getId());
                dto.setClienteRazonSocial(n.getCliente().getRazonSocial());
            }
            res.add(dto);
        }
        return res;
    }

    @Override
    @Transactional
    public void marcarComoLeida(Long id) {
        Notificacion n = notificacionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notificación no encontrada"));
        n.setLeida(true);
        n.setFechaLectura(LocalDateTime.now());
        notificacionRepository.save(n);
    }

    @Override
    @Transactional
    public void marcarTodasComoLeidas() {
        notificacionRepository.marcarTodasComoLeidas(LocalDateTime.now());
    }
}
