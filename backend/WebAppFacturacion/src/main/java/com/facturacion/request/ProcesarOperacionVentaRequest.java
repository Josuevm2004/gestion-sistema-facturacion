package com.facturacion.request;

import com.facturacion.enums.TipoVenta;

public class ProcesarOperacionVentaRequest {

    private Long clienteId;
    private Long vendedorId;
    private Long suscripcionId;
    private TipoVenta tipoVenta; // RENOVACION, CAMBIO_PLAN
    private String observaciones;

    public ProcesarOperacionVentaRequest() {}

    public Long getClienteId() { return clienteId; }
    public void setClienteId(Long clienteId) { this.clienteId = clienteId; }
    public Long getVendedorId() { return vendedorId; }
    public void setVendedorId(Long vendedorId) { this.vendedorId = vendedorId; }
    public Long getSuscripcionId() { return suscripcionId; }
    public void setSuscripcionId(Long suscripcionId) { this.suscripcionId = suscripcionId; }
    public TipoVenta getTipoVenta() { return tipoVenta; }
    public void setTipoVenta(TipoVenta tipoVenta) { this.tipoVenta = tipoVenta; }
    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }
}
