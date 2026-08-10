package com.facturacion.impl;

import com.facturacion.service.NotificacionWhatsAppService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class NotificacionWhatsAppServiceImpl implements NotificacionWhatsAppService {

    private static final Logger log = LoggerFactory.getLogger(NotificacionWhatsAppServiceImpl.class);

    @Override
    public void enviarMensajeWhatsApp(String telefono, String mensaje) {
        log.info("[WHATSAPP API SIMULATOR] Enviando mensaje a celular: {} -> {}", telefono, mensaje);
    }
}
