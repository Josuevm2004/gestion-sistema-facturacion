package com.facturacion.request;

public class ClienteUpdateRequest {

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

    private String usuarioAdminFacturador;
    private String claveTemporal;
    private String urlAcceso;
    private String usuarioWsp;

    private Long colorTagId;
    private Long entornoId;
    private Long vendedorId;
    private Long estadoId;

    public ClienteUpdateRequest() {}

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
    public String getUsuarioAdminFacturador() { return usuarioAdminFacturador; }
    public void setUsuarioAdminFacturador(String usuarioAdminFacturador) { this.usuarioAdminFacturador = usuarioAdminFacturador; }
    public String getClaveTemporal() { return claveTemporal; }
    public void setClaveTemporal(String claveTemporal) { this.claveTemporal = claveTemporal; }
    public String getUrlAcceso() { return urlAcceso; }
    public void setUrlAcceso(String urlAcceso) { this.urlAcceso = urlAcceso; }
    public String getUsuarioWsp() { return usuarioWsp; }
    public void setUsuarioWsp(String usuarioWsp) { this.usuarioWsp = usuarioWsp; }
    public Long getColorTagId() { return colorTagId; }
    public void setColorTagId(Long colorTagId) { this.colorTagId = colorTagId; }
    public Long getEntornoId() { return entornoId; }
    public void setEntornoId(Long entornoId) { this.entornoId = entornoId; }
    public Long getVendedorId() { return vendedorId; }
    public void setVendedorId(Long vendedorId) { this.vendedorId = vendedorId; }
    public Long getEstadoId() { return estadoId; }
    public void setEstadoId(Long estadoId) { this.estadoId = estadoId; }
}
