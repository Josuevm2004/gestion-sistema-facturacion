package com.facturacion.response;

import com.facturacion.enums.*;
import java.time.LocalDateTime;

public class ClienteResponse {
    private Long id;
    private String ruc;
    private String razonSocial;
    private String nombreComercial;
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
    private String ubigeoCodigo;
    private String direccion;
    private String nombres;
    private String apellidos;
    private String dni;
    private String emailPersonal;
    private String telefonoPersonal;
    private String departamento;
    private String provincia;
    private String distrito;
    private String usuarioSol;
    private String claveSolCifrada;
    private String vendedor;
    private String linkSistema;
    private String usuarioSistema;
    private String claveSistema;

    public ClienteResponse() {
    }

    public String getLinkSistema() { return linkSistema; }
    public void setLinkSistema(String linkSistema) { this.linkSistema = linkSistema; }
    public String getUsuarioSistema() { return usuarioSistema; }
    public void setUsuarioSistema(String usuarioSistema) { this.usuarioSistema = usuarioSistema; }
    public String getClaveSistema() { return claveSistema; }
    public void setClaveSistema(String claveSistema) { this.claveSistema = claveSistema; }

    public String getVendedor() { return vendedor; }
    public void setVendedor(String vendedor) { this.vendedor = vendedor; }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getRuc() { return ruc; }
    public void setRuc(String ruc) { this.ruc = ruc; }
    public String getRazonSocial() { return razonSocial; }
    public void setRazonSocial(String razonSocial) { this.razonSocial = razonSocial; }
    public String getNombreComercial() { return nombreComercial; }
    public void setNombreComercial(String nombreComercial) { this.nombreComercial = nombreComercial; }
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
    public String getUbigeoCodigo() { return ubigeoCodigo; }
    public void setUbigeoCodigo(String ubigeoCodigo) { this.ubigeoCodigo = ubigeoCodigo; }
    public String getDireccion() { return direccion; }
    public void setDireccion(String direccion) { this.direccion = direccion; }
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
    public String getUsuarioSol() { return usuarioSol; }
    public void setUsuarioSol(String usuarioSol) { this.usuarioSol = usuarioSol; }
    public String getClaveSolCifrada() { return claveSolCifrada; }
    public void setClaveSolCifrada(String claveSolCifrada) { this.claveSolCifrada = claveSolCifrada; }
}
