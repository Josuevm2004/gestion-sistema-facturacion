package com.facturacion.enums;

public enum PlanContratado {
    INICIA(19.00),
    EMPRENDE(29.00),
    IMPULSA(39.00),
    EMPRESARIAL(59.00),
    LIDER(89.00),
    EMPRENDEDOR(19.00),
    PYME(29.00),
    CORPORATIVO(39.00);

    private final double precioMensual;

    PlanContratado(double precioMensual) {
        this.precioMensual = precioMensual;
    }

    public double getPrecioMensual() {
        return precioMensual;
    }
}
