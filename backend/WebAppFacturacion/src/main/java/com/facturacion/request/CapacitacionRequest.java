package com.facturacion.request;

import java.time.LocalDateTime;
import java.time.LocalTime;

public class CapacitacionRequest {

    private String fechaCapacitacion;
    private String observaciones;

    public CapacitacionRequest() {}

    public LocalDateTime getFechaCapacitacion() {
        if (fechaCapacitacion == null || fechaCapacitacion.isBlank()) return null;
        String value = fechaCapacitacion.trim();
        if (!value.contains("T")) {
            return java.time.LocalDate.parse(value).atTime(LocalTime.NOON);
        }
        if (value.length() == 16) {
            value = value + ":00";
        }
        return LocalDateTime.parse(value);
    }

    public void setFechaCapacitacion(String fechaCapacitacion) {
        this.fechaCapacitacion = fechaCapacitacion;
    }

    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }
}
