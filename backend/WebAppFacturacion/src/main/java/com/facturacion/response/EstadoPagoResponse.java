package com.facturacion.response;

import com.facturacion.enums.EstadoPago;
import java.time.LocalDateTime;

public class EstadoPagoResponse {
    private Long clienteId;
    private String ruc;
    private String razonSocial;
    private EstadoPago estadoPago;
    private String codigoOperacion;
    private Double monto;
    private LocalDateTime fechaPago;
    private String subdominioUrl;

    public EstadoPagoResponse() {
    }

    public Long getClienteId() { return clienteId; }
    public void setClienteId(Long clienteId) { this.clienteId = clienteId; }
    public String getRuc() { return ruc; }
    public void setRuc(String ruc) { this.ruc = ruc; }
    public String getRazonSocial() { return razonSocial; }
    public void setRazonSocial(String razonSocial) { this.razonSocial = razonSocial; }
    public EstadoPago getEstadoPago() { return estadoPago; }
    public void setEstadoPago(EstadoPago estadoPago) { this.estadoPago = estadoPago; }
    public String getCodigoOperacion() { return codigoOperacion; }
    public void setCodigoOperacion(String codigoOperacion) { this.codigoOperacion = codigoOperacion; }
    public Double getMonto() { return monto; }
    public void setMonto(Double monto) { this.monto = monto; }
    public LocalDateTime getFechaPago() { return fechaPago; }
    public void setFechaPago(LocalDateTime fechaPago) { this.fechaPago = fechaPago; }
    public String getSubdominioUrl() { return subdominioUrl; }
    public void setSubdominioUrl(String subdominioUrl) { this.subdominioUrl = subdominioUrl; }

    public static EstadoPagoResponseBuilder builder() { return new EstadoPagoResponseBuilder(); }

    public static class EstadoPagoResponseBuilder {
        private Long clienteId;
        private String ruc;
        private String razonSocial;
        private EstadoPago estadoPago;
        private String codigoOperacion;
        private Double monto;
        private LocalDateTime fechaPago;
        private String subdominioUrl;

        public EstadoPagoResponseBuilder clienteId(Long clienteId) { this.clienteId = clienteId; return this; }
        public EstadoPagoResponseBuilder ruc(String ruc) { this.ruc = ruc; return this; }
        public EstadoPagoResponseBuilder razonSocial(String razonSocial) { this.razonSocial = razonSocial; return this; }
        public EstadoPagoResponseBuilder estadoPago(EstadoPago estadoPago) { this.estadoPago = estadoPago; return this; }
        public EstadoPagoResponseBuilder codigoOperacion(String codigoOperacion) { this.codigoOperacion = codigoOperacion; return this; }
        public EstadoPagoResponseBuilder monto(Double monto) { this.monto = monto; return this; }
        public EstadoPagoResponseBuilder fechaPago(LocalDateTime fechaPago) { this.fechaPago = fechaPago; return this; }
        public EstadoPagoResponseBuilder subdominioUrl(String subdominioUrl) { this.subdominioUrl = subdominioUrl; return this; }

        public EstadoPagoResponse build() {
            EstadoPagoResponse r = new EstadoPagoResponse();
            r.clienteId = clienteId; r.ruc = ruc; r.razonSocial = razonSocial;
            r.estadoPago = estadoPago; r.codigoOperacion = codigoOperacion;
            r.monto = monto; r.fechaPago = fechaPago; r.subdominioUrl = subdominioUrl;
            return r;
        }
    }
}
