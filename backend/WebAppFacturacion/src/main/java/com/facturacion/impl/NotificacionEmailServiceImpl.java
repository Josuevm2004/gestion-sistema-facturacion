package com.facturacion.impl;

import com.facturacion.service.NotificacionEmailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class NotificacionEmailServiceImpl implements NotificacionEmailService {

    private static final Logger log = LoggerFactory.getLogger(NotificacionEmailServiceImpl.class);

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Override
    public void enviarCorreoBienvenida(String destinatario, String razonSocial, String urlAcceso, String usuario, String clave) {
        String asunto = "¡Bienvenido a Facturación Electrónica Perú! Accesos a su Sistema";
        String mensaje = String.format("""
                Estimado(a) %s,

                ¡Gracias por registrarte en nuestro Sistema de Facturación Electrónica!

                Sus credenciales de acceso son:
                - URL de Sistema: %s
                - Usuario: %s
                - Clave Temporal: %s

                Por favor inicie sesión y cambie su contraseña.

                Atentamente,
                Equipo de Soporte y Facturación.
                """, razonSocial, urlAcceso, usuario, clave);

        enviarCorreo(destinatario, asunto, mensaje);
    }

    @Override
    public void enviarAlertaVencimiento(String destinatario, String razonSocial, String fechaVencimiento, Double monto) {
        String asunto = "Recordatorio de Pago de Mensualidad - Facturación Electrónica";
        String mensaje = String.format("""
                Estimado(a) %s,

                Le recordamos que su mensualidad del servicio de Facturación Electrónica por un monto de S/ %.2f vence el %s.

                Puede realizar su pago mediante Transferencia Bancaria a nuestras cuentas para mantener su servicio HABILITADO.

                Atentamente,
                Equipo de Cobranzas.
                """, razonSocial, monto, fechaVencimiento);

        enviarCorreo(destinatario, asunto, mensaje);
    }

    @Override
    public void enviarConfirmacionPago(String destinatario, String razonSocial, String periodo, String codigoOperacion) {
        String asunto = "Pago Confirmado con Éxito - Periodo " + periodo;
        String mensaje = String.format("""
                Estimado(a) %s,

                Hemos confirmado con éxito la recepción de su pago para el periodo %s.
                - Código de Operación: %s

                Su servicio se encuentra activo y HABILITADO.

                Atentamente,
                Equipo de Cobranzas.
                """, razonSocial, periodo, codigoOperacion);

        enviarCorreo(destinatario, asunto, mensaje);
    }

    private void enviarCorreo(String destinatario, String asunto, String contenido) {
        try {
            if (mailSender != null) {
                SimpleMailMessage mailMessage = new SimpleMailMessage();
                mailMessage.setTo(destinatario);
                mailMessage.setSubject(asunto);
                mailMessage.setText(contenido);
                mailSender.send(mailMessage);
                log.info("Correo enviado exitosamente a: {}", destinatario);
            } else {
                log.info("[SIMULACIÓN CORREO] Para: {} | Asunto: {}\nContenido:\n{}", destinatario, asunto, contenido);
            }
        } catch (Exception e) {
            log.error("Error enviando correo a {}: {}", destinatario, e.getMessage());
        }
    }
}
