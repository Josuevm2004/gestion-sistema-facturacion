package com.facturacion.request;

import com.facturacion.enums.MedioPago;
import jakarta.validation.constraints.NotNull;
public class RegistrarPagoRequest {

    @NotNull(message = "El ID de cliente es obligatorio")
    private Long clienteId;

    private String codigoOperacion;

    @NotNull(message = "El monto es obligatorio")
    private Double monto;

    @NotNull(message = "El medio de pago es obligatorio")
    private MedioPago medioPago;

    private String periodoMesAno;
    private String comprobanteUrl;
    private String observaciones;

    public RegistrarPagoRequest() { }
    public Long getClienteId() { return clienteId; }
    public void setClienteId(Long clienteId) { this.clienteId = clienteId; }
    public String getCodigoOperacion() { return codigoOperacion; }
    public void setCodigoOperacion(String codigoOperacion) { this.codigoOperacion = codigoOperacion; }
    public Double getMonto() { return monto; }
    public void setMonto(Double monto) { this.monto = monto; }
    public MedioPago getMedioPago() { return medioPago; }
    public void setMedioPago(MedioPago medioPago) { this.medioPago = medioPago; }
    public String getPeriodoMesAno() { return periodoMesAno; }
    public void setPeriodoMesAno(String periodoMesAno) { this.periodoMesAno = periodoMesAno; }
    public String getComprobanteUrl() { return comprobanteUrl; }
    public void setComprobanteUrl(String comprobanteUrl) { this.comprobanteUrl = comprobanteUrl; }
    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }
}
