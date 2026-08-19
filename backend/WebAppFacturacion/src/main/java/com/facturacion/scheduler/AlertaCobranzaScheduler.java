package com.facturacion.scheduler;

import com.facturacion.service.ServicioClienteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class AlertaCobranzaScheduler {

    @Autowired
    private ServicioClienteService servicioClienteService;

    // Ejecuta la revisión al comenzar cada día y mantiene una segunda
    // ejecución de respaldo a las 08:00. La zona evita depender del UTC del servidor.
    @Scheduled(cron = "0 0 0,8 * * *", zone = "America/Lima")
    public void revisarVencimientosYNotificaciones() {
        servicioClienteService.revisarVencimientos();
    }
}
