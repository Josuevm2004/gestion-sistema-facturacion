package com.facturacion.request;

import com.facturacion.enums.PlanContratado;
import com.facturacion.enums.RegimenTributario;
import jakarta.validation.constraints.*;
public class RegistroFormularioRequest {

    @NotBlank(message = "El RUC es obligatorio")
    @Pattern(regexp = "^(10|20)\\d{9}$", message = "El RUC debe tener 11 dígitos numéricos y comenzar con 10 o 20")
    private String ruc;

    @NotBlank(message = "La Razón Social es obligatoria")
    @Size(max = 150, message = "La Razón Social no puede superar los 150 caracteres")
    private String razonSocial;

    private String nombreComercial;

    @NotBlank(message = "La dirección fiscal es obligatoria")
    private String direccion;

    @NotBlank(message = "El teléfono de contacto es obligatorio")
    @Pattern(regexp = "^9\\d{8}$", message = "El teléfono debe ser un celular válido de 9 dígitos")
    private String telefono;

    @NotBlank(message = "El correo electrónico es obligatorio")
    @Email(message = "Debe proporcionar un correo electrónico válido")
    private String email;

    private String nombres;
    private String apellidos;
    private String dni;
    private String emailPersonal;
    private String telefonoPersonal;

    private String departamento;
    private String provincia;
    private String distrito;

    @NotNull(message = "El régimen tributario es obligatorio")
    private RegimenTributario regimenTributario;

    @NotNull(message = "El plan contratado es obligatorio")
    private PlanContratado planContratado;

    private com.facturacion.enums.TipoSuscripcion tipoSuscripcion = com.facturacion.enums.TipoSuscripcion.MENSUAL;

    @NotBlank(message = "El usuario SOL es obligatorio")
    private String usuarioSol;

    @NotBlank(message = "La clave SOL es obligatoria")
    private String claveSol;

    @NotBlank(message = "El código de ubigeo o ubicación es obligatorio")
    @Size(max = 255, message = "El ubigeo no puede superar los 255 caracteres")
    private String codigoUbigeo;

    private String comoNosConocio;
    private Boolean usoSistemaAnterior;
    private String volumenFacturacionEstimado;
    private String comentarios;

    public RegistroFormularioRequest() { }
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
    public com.facturacion.enums.TipoSuscripcion getTipoSuscripcion() { return tipoSuscripcion; }
    public void setTipoSuscripcion(com.facturacion.enums.TipoSuscripcion tipoSuscripcion) { this.tipoSuscripcion = tipoSuscripcion; }
    public String getUsuarioSol() { return usuarioSol; }
    public void setUsuarioSol(String usuarioSol) { this.usuarioSol = usuarioSol; }
    public String getClaveSol() { return claveSol; }
    public void setClaveSol(String claveSol) { this.claveSol = claveSol; }
    public String getCodigoUbigeo() { return codigoUbigeo; }
    public void setCodigoUbigeo(String codigoUbigeo) { this.codigoUbigeo = codigoUbigeo; }
    public String getComoNosConocio() { return comoNosConocio; }
    public void setComoNosConocio(String comoNosConocio) { this.comoNosConocio = comoNosConocio; }
    public Boolean getUsoSistemaAnterior() { return usoSistemaAnterior; }
    public void setUsoSistemaAnterior(Boolean usoSistemaAnterior) { this.usoSistemaAnterior = usoSistemaAnterior; }
    public String getVolumenFacturacionEstimado() { return volumenFacturacionEstimado; }
    public void setVolumenFacturacionEstimado(String volumenFacturacionEstimado) { this.volumenFacturacionEstimado = volumenFacturacionEstimado; }
    public String getComentarios() { return comentarios; }
    public void setComentarios(String comentarios) { this.comentarios = comentarios; }
}
