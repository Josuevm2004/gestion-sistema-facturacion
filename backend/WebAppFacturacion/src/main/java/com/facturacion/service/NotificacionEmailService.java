package com.facturacion.service;

public interface NotificacionEmailService {
    void enviarCorreoBienvenida(String destinatario, String razonSocial, String urlAcceso, String usuario, String clave);
    void enviarAlertaVencimiento(String destinatario, String razonSocial, String fechaVencimiento, Double monto);
    void enviarConfirmacionPago(String destinatario, String razonSocial, String periodo, String codigoOperacion);
}
