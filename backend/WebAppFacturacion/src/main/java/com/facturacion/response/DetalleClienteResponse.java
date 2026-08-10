package com.facturacion.response;

import com.facturacion.enums.*;
import java.time.LocalDateTime;

public class DetalleClienteResponse {
    private Long id;
    private String ruc;
    private String razonSocial;
    private String nombreComercial;
    private String direccion;
    private String telefono;
    private String email;
    private RegimenTributario regimenTributario;
    private PlanContratado planContratado;
    private TipoSuscripcion tipoSuscripcion;
    private ColorTag colorTag;
    private Double montoMensual;
    private Double montoSiguienteCobro;
    private EstadoCuenta estadoCuenta;
    private EstadoCapacitacion estadoCapacitacion;
    private LocalDateTime fechaRegistro;
    private LocalDateTime fechaVencimientoMensual;
    private LocalDateTime fechaCapacitacion;
    private String subdominio;
    private String urlAcceso;
    private String usuarioAdminFacturador;
    private String usuarioSol;
    private String claveSolCifrada;
    private String comoNosConocio;
    private Boolean usoSistemaAnterior;
    private String volumenFacturacionEstimado;
    private String comentarios;

    public DetalleClienteResponse() {
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getRuc() { return ruc; }
    public void setRuc(String ruc) { this.ruc = ruc; }
    public String getRazonSocial() { return razonSocial; }
    public void setRazonSocial(String razonSocial) { this.razonSocial = razonSocial; }
    public String getNombreComercial() { return nombreComercial; }
    public void setNombreComercial(String nombreComercial) { this.nombreComercial = nombreComercial; }
    public String getDireccion() { return direccion; }
    public void setDireccion(String direccion) { this.direccion = direccion; }
    public String getTelefono() { return telefono; }
    public void setTelefono(String telefono) { this.telefono = telefono; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public RegimenTributario getRegimenTributario() { return regimenTributario; }
    public void setRegimenTributario(RegimenTributario regimenTributario) { this.regimenTributario = regimenTributario; }
    public PlanContratado getPlanContratado() { return planContratado; }
    public void setPlanContratado(PlanContratado planContratado) { this.planContratado = planContratado; }
    public TipoSuscripcion getTipoSuscripcion() { return tipoSuscripcion; }
    public void setTipoSuscripcion(TipoSuscripcion tipoSuscripcion) { this.tipoSuscripcion = tipoSuscripcion; }
    public ColorTag getColorTag() { return colorTag; }
    public void setColorTag(ColorTag colorTag) { this.colorTag = colorTag; }
    public Double getMontoMensual() { return montoMensual; }
    public void setMontoMensual(Double montoMensual) { this.montoMensual = montoMensual; }
    public Double getMontoSiguienteCobro() { return montoSiguienteCobro; }
    public void setMontoSiguienteCobro(Double montoSiguienteCobro) { this.montoSiguienteCobro = montoSiguienteCobro; }
    public EstadoCuenta getEstadoCuenta() { return estadoCuenta; }
    public void setEstadoCuenta(EstadoCuenta estadoCuenta) { this.estadoCuenta = estadoCuenta; }
    public EstadoCapacitacion getEstadoCapacitacion() { return estadoCapacitacion; }
    public void setEstadoCapacitacion(EstadoCapacitacion estadoCapacitacion) { this.estadoCapacitacion = estadoCapacitacion; }
    public LocalDateTime getFechaRegistro() { return fechaRegistro; }
    public void setFechaRegistro(LocalDateTime fechaRegistro) { this.fechaRegistro = fechaRegistro; }
    public LocalDateTime getFechaVencimientoMensual() { return fechaVencimientoMensual; }
    public void setFechaVencimientoMensual(LocalDateTime fechaVencimientoMensual) { this.fechaVencimientoMensual = fechaVencimientoMensual; }
    public LocalDateTime getFechaCapacitacion() { return fechaCapacitacion; }
    public void setFechaCapacitacion(LocalDateTime fechaCapacitacion) { this.fechaCapacitacion = fechaCapacitacion; }
    public String getSubdominio() { return subdominio; }
    public void setSubdominio(String subdominio) { this.subdominio = subdominio; }
    public String getUrlAcceso() { return urlAcceso; }
    public void setUrlAcceso(String urlAcceso) { this.urlAcceso = urlAcceso; }
    public String getUsuarioAdminFacturador() { return usuarioAdminFacturador; }
    public void setUsuarioAdminFacturador(String usuarioAdminFacturador) { this.usuarioAdminFacturador = usuarioAdminFacturador; }
    public String getUsuarioSol() { return usuarioSol; }
    public void setUsuarioSol(String usuarioSol) { this.usuarioSol = usuarioSol; }
    public String getClaveSolCifrada() { return claveSolCifrada; }
    public void setClaveSolCifrada(String claveSolCifrada) { this.claveSolCifrada = claveSolCifrada; }
    public String getComoNosConocio() { return comoNosConocio; }
    public void setComoNosConocio(String comoNosConocio) { this.comoNosConocio = comoNosConocio; }
    public Boolean getUsoSistemaAnterior() { return usoSistemaAnterior; }
    public void setUsoSistemaAnterior(Boolean usoSistemaAnterior) { this.usoSistemaAnterior = usoSistemaAnterior; }
    public String getVolumenFacturacionEstimado() { return volumenFacturacionEstimado; }
    public void setVolumenFacturacionEstimado(String volumenFacturacionEstimado) { this.volumenFacturacionEstimado = volumenFacturacionEstimado; }
    public String getComentarios() { return comentarios; }
    public void setComentarios(String comentarios) { this.comentarios = comentarios; }

    public static DetalleClienteResponseBuilder builder() { return new DetalleClienteResponseBuilder(); }

    public static class DetalleClienteResponseBuilder {
        private Long id;
        private String ruc;
        private String razonSocial;
        private String nombreComercial;
        private String direccion;
        private String telefono;
        private String email;
        private RegimenTributario regimenTributario;
        private PlanContratado planContratado;
        private Double montoMensual;
        private EstadoCuenta estadoCuenta;
        private EstadoCapacitacion estadoCapacitacion;
        private LocalDateTime fechaRegistro;
        private LocalDateTime fechaVencimientoMensual;
        private String subdominio;
        private String urlAcceso;
        private String usuarioAdminFacturador;
        private String usuarioSol;
        private String claveSolCifrada;
        private String comoNosConocio;
        private Boolean usoSistemaAnterior;
        private String volumenFacturacionEstimado;
        private String comentarios;

        public DetalleClienteResponseBuilder id(Long id) { this.id = id; return this; }
        public DetalleClienteResponseBuilder ruc(String ruc) { this.ruc = ruc; return this; }
        public DetalleClienteResponseBuilder razonSocial(String razonSocial) { this.razonSocial = razonSocial; return this; }
        public DetalleClienteResponseBuilder nombreComercial(String nombreComercial) { this.nombreComercial = nombreComercial; return this; }
        public DetalleClienteResponseBuilder direccion(String direccion) { this.direccion = direccion; return this; }
        public DetalleClienteResponseBuilder telefono(String telefono) { this.telefono = telefono; return this; }
        public DetalleClienteResponseBuilder email(String email) { this.email = email; return this; }
        public DetalleClienteResponseBuilder regimenTributario(RegimenTributario r) { this.regimenTributario = r; return this; }
        public DetalleClienteResponseBuilder planContratado(PlanContratado p) { this.planContratado = p; return this; }
        public DetalleClienteResponseBuilder montoMensual(Double montoMensual) { this.montoMensual = montoMensual; return this; }
        public DetalleClienteResponseBuilder estadoCuenta(EstadoCuenta estadoCuenta) { this.estadoCuenta = estadoCuenta; return this; }
        public DetalleClienteResponseBuilder estadoCapacitacion(EstadoCapacitacion estadoCapacitacion) { this.estadoCapacitacion = estadoCapacitacion; return this; }
        public DetalleClienteResponseBuilder fechaRegistro(LocalDateTime fechaRegistro) { this.fechaRegistro = fechaRegistro; return this; }
        public DetalleClienteResponseBuilder fechaVencimientoMensual(LocalDateTime fechaVencimientoMensual) { this.fechaVencimientoMensual = fechaVencimientoMensual; return this; }
        public DetalleClienteResponseBuilder subdominio(String subdominio) { this.subdominio = subdominio; return this; }
        public DetalleClienteResponseBuilder urlAcceso(String urlAcceso) { this.urlAcceso = urlAcceso; return this; }
        public DetalleClienteResponseBuilder usuarioAdminFacturador(String usuarioAdminFacturador) { this.usuarioAdminFacturador = usuarioAdminFacturador; return this; }
        public DetalleClienteResponseBuilder usuarioSol(String usuarioSol) { this.usuarioSol = usuarioSol; return this; }
        public DetalleClienteResponseBuilder claveSolCifrada(String claveSolCifrada) { this.claveSolCifrada = claveSolCifrada; return this; }
        public DetalleClienteResponseBuilder comoNosConocio(String comoNosConocio) { this.comoNosConocio = comoNosConocio; return this; }
        public DetalleClienteResponseBuilder usoSistemaAnterior(Boolean usoSistemaAnterior) { this.usoSistemaAnterior = usoSistemaAnterior; return this; }
        public DetalleClienteResponseBuilder volumenFacturacionEstimado(String v) { this.volumenFacturacionEstimado = v; return this; }
        public DetalleClienteResponseBuilder comentarios(String comentarios) { this.comentarios = comentarios; return this; }

        public DetalleClienteResponse build() {
            DetalleClienteResponse r = new DetalleClienteResponse();
            r.id = id; r.ruc = ruc; r.razonSocial = razonSocial; r.nombreComercial = nombreComercial;
            r.direccion = direccion; r.telefono = telefono; r.email = email;
            r.regimenTributario = regimenTributario; r.planContratado = planContratado;
            r.montoMensual = montoMensual; r.estadoCuenta = estadoCuenta; r.estadoCapacitacion = estadoCapacitacion;
            r.fechaRegistro = fechaRegistro; r.fechaVencimientoMensual = fechaVencimientoMensual;
            r.subdominio = subdominio; r.urlAcceso = urlAcceso; r.usuarioAdminFacturador = usuarioAdminFacturador;
            r.usuarioSol = usuarioSol; r.claveSolCifrada = claveSolCifrada;
            r.comoNosConocio = comoNosConocio; r.usoSistemaAnterior = usoSistemaAnterior;
            r.volumenFacturacionEstimado = volumenFacturacionEstimado; r.comentarios = comentarios;
            return r;
        }
    }
}
