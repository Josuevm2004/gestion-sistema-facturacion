package com.facturacion.request;

import com.facturacion.enums.*;
import java.time.LocalDateTime;

public class ClienteUpdateRequest {
    private String ruc;
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
    private RegimenTributario regimenTributario;
    private PlanContratado planContratado;
    private TipoSuscripcion tipoSuscripcion;
    private ColorTag colorTag;
    private EstadoCuenta estadoCuenta;
    private EstadoCapacitacion estadoCapacitacion;
    private LocalDateTime fechaVencimientoMensual;
    private LocalDateTime fechaCapacitacion;
    private String usuarioSol;
    private String claveSol;
    private String vendedor;
    private String linkSistema;
    private String usuarioSistema;
    private String claveSistema;

    public ClienteUpdateRequest() { }

    public String getLinkSistema() { return linkSistema; }
    public void setLinkSistema(String linkSistema) { this.linkSistema = linkSistema; }
    public String getUsuarioSistema() { return usuarioSistema; }
    public void setUsuarioSistema(String usuarioSistema) { this.usuarioSistema = usuarioSistema; }
    public String getClaveSistema() { return claveSistema; }
    public void setClaveSistema(String claveSistema) { this.claveSistema = claveSistema; }

    public String getVendedor() { return vendedor; }
    public void setVendedor(String vendedor) { this.vendedor = vendedor; }

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
    public RegimenTributario getRegimenTributario() { return regimenTributario; }
    public void setRegimenTributario(RegimenTributario regimenTributario) { this.regimenTributario = regimenTributario; }
    public PlanContratado getPlanContratado() { return planContratado; }
    public void setPlanContratado(PlanContratado planContratado) { this.planContratado = planContratado; }
    public TipoSuscripcion getTipoSuscripcion() { return tipoSuscripcion; }
    public void setTipoSuscripcion(TipoSuscripcion tipoSuscripcion) { this.tipoSuscripcion = tipoSuscripcion; }
    public ColorTag getColorTag() { return colorTag; }
    public void setColorTag(ColorTag colorTag) { this.colorTag = colorTag; }
    public EstadoCuenta getEstadoCuenta() { return estadoCuenta; }
    public void setEstadoCuenta(EstadoCuenta estadoCuenta) { this.estadoCuenta = estadoCuenta; }
    public EstadoCapacitacion getEstadoCapacitacion() { return estadoCapacitacion; }
    public void setEstadoCapacitacion(EstadoCapacitacion estadoCapacitacion) { this.estadoCapacitacion = estadoCapacitacion; }
    public LocalDateTime getFechaVencimientoMensual() { return fechaVencimientoMensual; }
    public void setFechaVencimientoMensual(LocalDateTime fechaVencimientoMensual) { this.fechaVencimientoMensual = fechaVencimientoMensual; }
    public LocalDateTime getFechaCapacitacion() { return fechaCapacitacion; }
    public void setFechaCapacitacion(LocalDateTime fechaCapacitacion) { this.fechaCapacitacion = fechaCapacitacion; }
    public String getUsuarioSol() { return usuarioSol; }
    public void setUsuarioSol(String usuarioSol) { this.usuarioSol = usuarioSol; }
    public String getClaveSol() { return claveSol; }
    public void setClaveSol(String claveSol) { this.claveSol = claveSol; }
}
