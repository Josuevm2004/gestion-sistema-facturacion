package com.facturacion.request;

import com.facturacion.enums.TipoSuscripcion;

public class RegistroFormularioRequest {

    private String ruc;
    private String usuarioSol;
    private String claveSol;
    private String razonSocial;
    private String nombreComercial;
    private String direccion;
    private String telefono;
    private String email;
    private String nombres;
    private String apellidos;
    private String dni;
    private String emailPersonal;
    private String telefonoPersonal;
    private String departamento;
    private String provincia;
    private String distrito;

    private Long planId;
    private TipoSuscripcion tipoSuscripcion;

    private String comoNosConocio;
    private Boolean usoSistemaAnterior;
    private String volumenFacturacionEstimado;
    private String comentarios;

    public RegistroFormularioRequest() {}

    public String getRuc() { return ruc; }
    public void setRuc(String ruc) { this.ruc = ruc; }
    public String getUsuarioSol() { return usuarioSol; }
    public void setUsuarioSol(String usuarioSol) { this.usuarioSol = usuarioSol; }
    public String getClaveSol() { return claveSol; }
    public void setClaveSol(String claveSol) { this.claveSol = claveSol; }
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
    public String getNombres() { return nombres; }
    public void setNombres(String nombres) { this.nombres = nombres; }
    public String getApellidos() { return apellidos; }
    public void setApellidos(String apellidos) { this.apellidos = apellidos; }
    public String getDni() { return dni; }
    public void setDni(String dni) { this.dni = dni; }
    public String getEmailPersonal() { return emailPersonal; }
    public void setEmailPersonal(String emailPersonal) { this.emailPersonal = emailPersonal; }
    public String getTelefonoPersonal() { return telefonoPersonal; }
    public void setTelefonoPersonal(String telefonoPersonal) { this.telefonoPersonal = telefonoPersonal; }
    public String getDepartamento() { return departamento; }
    public void setDepartamento(String departamento) { this.departamento = departamento; }
    public String getProvincia() { return provincia; }
    public void setProvincia(String provincia) { this.provincia = provincia; }
    public String getDistrito() { return distrito; }
    public void setDistrito(String distrito) { this.distrito = distrito; }
    public Long getPlanId() { return planId; }
    public void setPlanId(Long planId) { this.planId = planId; }
    public TipoSuscripcion getTipoSuscripcion() { return tipoSuscripcion; }
    public void setTipoSuscripcion(TipoSuscripcion tipoSuscripcion) { this.tipoSuscripcion = tipoSuscripcion; }
    public String getComoNosConocio() { return comoNosConocio; }
    public void setComoNosConocio(String comoNosConocio) { this.comoNosConocio = comoNosConocio; }
    public Boolean getUsoSistemaAnterior() { return usoSistemaAnterior; }
    public void setUsoSistemaAnterior(Boolean usoSistemaAnterior) { this.usoSistemaAnterior = usoSistemaAnterior; }
    public String getVolumenFacturacionEstimado() { return volumenFacturacionEstimado; }
    public void setVolumenFacturacionEstimado(String volumenFacturacionEstimado) { this.volumenFacturacionEstimado = volumenFacturacionEstimado; }
    public String getComentarios() { return comentarios; }
    public void setComentarios(String comentarios) { this.comentarios = comentarios; }
}
