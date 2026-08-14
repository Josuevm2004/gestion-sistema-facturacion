package com.facturacion.response;

import java.math.BigDecimal;

public class ProrrateoCalculadoResponse {

    private BigDecimal precioPlan;
    private int diasTotales;
    private int diaCapacitacion;
    private int diasNoConsumidos;
    private BigDecimal descuento;
    private BigDecimal montoFinal;

    public ProrrateoCalculadoResponse() {}

    public ProrrateoCalculadoResponse(BigDecimal precioPlan, int diasTotales, int diaCapacitacion, int diasNoConsumidos, BigDecimal descuento, BigDecimal montoFinal) {
        this.precioPlan = precioPlan;
        this.diasTotales = diasTotales;
        this.diaCapacitacion = diaCapacitacion;
        this.diasNoConsumidos = diasNoConsumidos;
        this.descuento = descuento;
        this.montoFinal = montoFinal;
    }

    public BigDecimal getPrecioPlan() { return precioPlan; }
    public void setPrecioPlan(BigDecimal precioPlan) { this.precioPlan = precioPlan; }
    public int getDiasTotales() { return diasTotales; }
    public void setDiasTotales(int diasTotales) { this.diasTotales = diasTotales; }
    public int getDiaCapacitacion() { return diaCapacitacion; }
    public void setDiaCapacitacion(int diaCapacitacion) { this.diaCapacitacion = diaCapacitacion; }
    public int getDiasNoConsumidos() { return diasNoConsumidos; }
    public void setDiasNoConsumidos(int diasNoConsumidos) { this.diasNoConsumidos = diasNoConsumidos; }
    public BigDecimal getDescuento() { return descuento; }
    public void setDescuento(BigDecimal descuento) { this.descuento = descuento; }
    public BigDecimal getMontoFinal() { return montoFinal; }
    public void setMontoFinal(BigDecimal montoFinal) { this.montoFinal = montoFinal; }
}
