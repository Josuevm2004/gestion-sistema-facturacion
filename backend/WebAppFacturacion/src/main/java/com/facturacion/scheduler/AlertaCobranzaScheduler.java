package com.facturacion.scheduler;

import com.facturacion.service.ServicioClienteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class AlertaCobranzaScheduler {

    @Autowired
    private ServicioClienteService servicioClienteService;

    // Se ejecuta automáticamente todos los días a las 08:00 AM
    @Scheduled(cron = "0 0 8 * * *")
    public void revisarVencimientosYNotificaciones() {
        servicioClienteService.revisarVencimientos();
    }
}
