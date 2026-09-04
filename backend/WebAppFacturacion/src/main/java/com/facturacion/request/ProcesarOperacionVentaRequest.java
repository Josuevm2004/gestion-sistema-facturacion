package com.facturacion.request;

import com.facturacion.enums.TipoVenta;
import com.facturacion.enums.TipoSuscripcion;

public class ProcesarOperacionVentaRequest {

    private Long clienteId;
    private Long vendedorId;
    private Long suscripcionId;
    private Long planId;
    private TipoSuscripcion tipoSuscripcion;
    private TipoVenta tipoVenta; // RENOVACION, CAMBIO_PLAN
    private java.math.BigDecimal monto;
    private String observaciones;

    private String fechaPago;
    private String medioPago;
    private String codigoOperacion;
    private Boolean conProrrateo;

    public ProcesarOperacionVentaRequest() {}

    public Long getClienteId() { return clienteId; }
    public void setClienteId(Long clienteId) { this.clienteId = clienteId; }
    public Long getVendedorId() { return vendedorId; }
    public void setVendedorId(Long vendedorId) { this.vendedorId = vendedorId; }
    public Long getSuscripcionId() { return suscripcionId; }
    public void setSuscripcionId(Long suscripcionId) { this.suscripcionId = suscripcionId; }
    public Long getPlanId() { return planId; }
    public void setPlanId(Long planId) { this.planId = planId; }
    public TipoSuscripcion getTipoSuscripcion() { return tipoSuscripcion; }
    public void setTipoSuscripcion(TipoSuscripcion tipoSuscripcion) { this.tipoSuscripcion = tipoSuscripcion; }
    public TipoVenta getTipoVenta() { return tipoVenta; }
    public void setTipoVenta(TipoVenta tipoVenta) { this.tipoVenta = tipoVenta; }
    public java.math.BigDecimal getMonto() { return monto; }
    public void setMonto(java.math.BigDecimal monto) { this.monto = monto; }
    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }
    public String getFechaPago() { return fechaPago; }
    public void setFechaPago(String fechaPago) { this.fechaPago = fechaPago; }
    public String getMedioPago() { return medioPago; }
    public void setMedioPago(String medioPago) { this.medioPago = medioPago; }
    public String getCodigoOperacion() { return codigoOperacion; }
    public void setCodigoOperacion(String codigoOperacion) { this.codigoOperacion = codigoOperacion; }
    public Boolean getConProrrateo() { return conProrrateo; }
    public void setConProrrateo(Boolean conProrrateo) { this.conProrrateo = conProrrateo; }
}

