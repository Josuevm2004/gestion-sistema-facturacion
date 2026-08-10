package com.facturacion.scheduler;

import com.facturacion.entity.Cliente;
import com.facturacion.enums.EstadoCuenta;
import com.facturacion.repository.ClienteRepository;
import com.facturacion.service.NotificacionEmailService;
import com.facturacion.service.NotificacionWhatsAppService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Component
public class AlertaCobranzaScheduler {

    private static final Logger log = LoggerFactory.getLogger(AlertaCobranzaScheduler.class);

    @Autowired
    private ClienteRepository clienteRepository;

    @Autowired
    private NotificacionEmailService emailService;

    @Autowired
    private NotificacionWhatsAppService whatsAppService;

    @Scheduled(cron = "${scheduler.cron.cobranza:0 0 8 * * ?}")
    public void ejecutarAlertasCobranza() {
        log.info("Iniciando tarea programada AlertaCobranzaScheduler...");

        LocalDateTime limiteProximosDias = LocalDateTime.now().plusDays(3);
        List<Cliente> clientesAVencer = clienteRepository.findByFechaVencimientoMensualBefore(limiteProximosDias);

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");

        for (Cliente cliente : clientesAVencer) {
            String fechaVenc = cliente.getFechaVencimientoMensual().format(formatter);
            log.info("Generando alerta de cobranza para cliente: {} (RUC: {})", cliente.getRazonSocial(), cliente.getRuc());

            emailService.enviarAlertaVencimiento(cliente.getEmail(), cliente.getRazonSocial(), fechaVenc, cliente.getMontoMensual());

            String msjWhatsApp = String.format("📢 Hola %s, tu servicio de Facturación Electrónica vence el %s. Recuerda renovar abonando S/ %.2f mediante transferencia bancaria para evitar la interrupción del servicio.",
                    cliente.getRazonSocial(), fechaVenc, cliente.getMontoMensual());
            whatsAppService.enviarMensajeWhatsApp(cliente.getTelefono(), msjWhatsApp);

            if (cliente.getFechaVencimientoMensual().isBefore(LocalDateTime.now().minusDays(5))) {
                cliente.setEstadoCuenta(EstadoCuenta.BLOQUEADO);
                clienteRepository.save(cliente);
                log.warn("Cliente {} bloqueado automáticamente por mora superior a 5 días.", cliente.getRazonSocial());
            }
        }

        log.info("Tarea programada AlertaCobranzaScheduler finalizada con éxito.");
    }
}
