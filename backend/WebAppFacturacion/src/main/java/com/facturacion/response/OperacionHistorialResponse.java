package com.facturacion.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class OperacionHistorialResponse {

    private Long ventaId;
    private Long pagoId;
    private Long servicioId;
    private LocalDateTime fechaOperacion;
    private LocalDateTime fechaPago;
    private LocalDateTime fechaInicioServicio;
    private LocalDateTime fechaFinServicio;
    private String tipoOperacion;
    private String estadoVenta;
    private String estadoPago;
    private String estadoServicio;
    private String plan;
    private String tipoSuscripcion;
    private BigDecimal precioLista;
    private BigDecimal montoVenta;
    private BigDecimal montoPagado;
    private BigDecimal descuentoProrrateo;
    private BigDecimal montoProrrateado;
    private Integer diasProrrateados;
    private String observaciones;

    public OperacionHistorialResponse() {}

    public Long getVentaId() { return ventaId; }
    public void setVentaId(Long ventaId) { this.ventaId = ventaId; }
    public Long getPagoId() { return pagoId; }
    public void setPagoId(Long pagoId) { this.pagoId = pagoId; }
    public Long getServicioId() { return servicioId; }
    public void setServicioId(Long servicioId) { this.servicioId = servicioId; }
    public LocalDateTime getFechaOperacion() { return fechaOperacion; }
    public void setFechaOperacion(LocalDateTime fechaOperacion) { this.fechaOperacion = fechaOperacion; }
    public LocalDateTime getFechaPago() { return fechaPago; }
    public void setFechaPago(LocalDateTime fechaPago) { this.fechaPago = fechaPago; }
    public LocalDateTime getFechaInicioServicio() { return fechaInicioServicio; }
    public void setFechaInicioServicio(LocalDateTime fechaInicioServicio) { this.fechaInicioServicio = fechaInicioServicio; }
    public LocalDateTime getFechaFinServicio() { return fechaFinServicio; }
    public void setFechaFinServicio(LocalDateTime fechaFinServicio) { this.fechaFinServicio = fechaFinServicio; }
    public String getTipoOperacion() { return tipoOperacion; }
    public void setTipoOperacion(String tipoOperacion) { this.tipoOperacion = tipoOperacion; }
    public String getEstadoVenta() { return estadoVenta; }
    public void setEstadoVenta(String estadoVenta) { this.estadoVenta = estadoVenta; }
    public String getEstadoPago() { return estadoPago; }
    public void setEstadoPago(String estadoPago) { this.estadoPago = estadoPago; }
    public String getEstadoServicio() { return estadoServicio; }
    public void setEstadoServicio(String estadoServicio) { this.estadoServicio = estadoServicio; }
    public String getPlan() { return plan; }
    public void setPlan(String plan) { this.plan = plan; }
    public String getTipoSuscripcion() { return tipoSuscripcion; }
    public void setTipoSuscripcion(String tipoSuscripcion) { this.tipoSuscripcion = tipoSuscripcion; }
    public BigDecimal getPrecioLista() { return precioLista; }
    public void setPrecioLista(BigDecimal precioLista) { this.precioLista = precioLista; }
    public BigDecimal getMontoVenta() { return montoVenta; }
    public void setMontoVenta(BigDecimal montoVenta) { this.montoVenta = montoVenta; }
    public BigDecimal getMontoPagado() { return montoPagado; }
    public void setMontoPagado(BigDecimal montoPagado) { this.montoPagado = montoPagado; }
    public BigDecimal getDescuentoProrrateo() { return descuentoProrrateo; }
    public void setDescuentoProrrateo(BigDecimal descuentoProrrateo) { this.descuentoProrrateo = descuentoProrrateo; }
    public BigDecimal getMontoProrrateado() { return montoProrrateado; }
    public void setMontoProrrateado(BigDecimal montoProrrateado) { this.montoProrrateado = montoProrrateado; }
    public Integer getDiasProrrateados() { return diasProrrateados; }
    public void setDiasProrrateados(Integer diasProrrateados) { this.diasProrrateados = diasProrrateados; }
    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }
}
