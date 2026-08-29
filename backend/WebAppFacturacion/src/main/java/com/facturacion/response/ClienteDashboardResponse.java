package com.facturacion.response;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class ClienteDashboardResponse {

    @JsonSerialize(using = ToStringSerializer.class)
    private Long id;
    private String ruc;
    private String usuarioSol;
    private String claveSolCifrada;
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

    @JsonSerialize(using = ToStringSerializer.class)
    private Long estadoId;
    private String estadoNombre; // POR_COBRAR, POR_CAPACITAR, HABILITADO, VENCIDO, BLOQUEADO
    private Boolean avisado = false;

    @JsonSerialize(using = ToStringSerializer.class)
    private Long colorTagId;
    private String colorCodigo;
    private String colorHex;

    @JsonSerialize(using = ToStringSerializer.class)
    private Long entornoId;
    private String entornoNombre;

    @JsonSerialize(using = ToStringSerializer.class)
    private Long vendedorId;
    private String vendedorNombre;

    @JsonSerialize(using = ToStringSerializer.class)
    private Long planId;
    private String planNombre;
    private String tipoSuscripcion;
    private BigDecimal precioPlan;

    @JsonSerialize(using = ToStringSerializer.class)
    private Long ventaId;
    @JsonSerialize(using = ToStringSerializer.class)
    private Long servicioId;

    private LocalDateTime fechaCapacitacion;
    private LocalDateTime fechaInicioServicio;
    private LocalDateTime fechaFinServicio;
    private String estadoServicio;

    private BigDecimal montoSiguienteCobro;
    private Integer diasProrrateados;
    private String tipoProrrateo;
    private BigDecimal montoProrrateoAdicional;
    private Integer diasProrrateoAdicional;
    private LocalDateTime fechaInicioProrrateoAdicional;
    private LocalDateTime fechaFinProrrateoAdicional;
    private LocalDateTime fechaRegistro;

    public ClienteDashboardResponse() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getRuc() { return ruc; }
    public void setRuc(String ruc) { this.ruc = ruc; }
    public String getUsuarioSol() { return usuarioSol; }
    public void setUsuarioSol(String usuarioSol) { this.usuarioSol = usuarioSol; }
    public String getClaveSolCifrada() { return claveSolCifrada; }
    public void setClaveSolCifrada(String claveSolCifrada) { this.claveSolCifrada = claveSolCifrada; }
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
    public Long getEstadoId() { return estadoId; }
    public void setEstadoId(Long estadoId) { this.estadoId = estadoId; }
    public String getEstadoNombre() { return estadoNombre; }
    public void setEstadoNombre(String estadoNombre) { this.estadoNombre = estadoNombre; }
    public Long getColorTagId() { return colorTagId; }
    public void setColorTagId(Long colorTagId) { this.colorTagId = colorTagId; }
    public String getColorCodigo() { return colorCodigo; }
    public void setColorCodigo(String colorCodigo) { this.colorCodigo = colorCodigo; }
    public String getColorHex() { return colorHex; }
    public void setColorHex(String colorHex) { this.colorHex = colorHex; }
    public Long getEntornoId() { return entornoId; }
    public void setEntornoId(Long entornoId) { this.entornoId = entornoId; }
    public String getEntornoNombre() { return entornoNombre; }
    public void setEntornoNombre(String entornoNombre) { this.entornoNombre = entornoNombre; }
    public Long getVendedorId() { return vendedorId; }
    public void setVendedorId(Long vendedorId) { this.vendedorId = vendedorId; }
    public String getVendedorNombre() { return vendedorNombre; }
    public void setVendedorNombre(String vendedorNombre) { this.vendedorNombre = vendedorNombre; }
    public Long getPlanId() { return planId; }
    public void setPlanId(Long planId) { this.planId = planId; }
    public String getPlanNombre() { return planNombre; }
    public void setPlanNombre(String planNombre) { this.planNombre = planNombre; }
    public String getTipoSuscripcion() { return tipoSuscripcion; }
    public void setTipoSuscripcion(String tipoSuscripcion) { this.tipoSuscripcion = tipoSuscripcion; }
    public BigDecimal getPrecioPlan() { return precioPlan; }
    public void setPrecioPlan(BigDecimal precioPlan) { this.precioPlan = precioPlan; }
    public Long getVentaId() { return ventaId; }
    public void setVentaId(Long ventaId) { this.ventaId = ventaId; }
    public Long getServicioId() { return servicioId; }
    public void setServicioId(Long servicioId) { this.servicioId = servicioId; }
    public LocalDateTime getFechaCapacitacion() { return fechaCapacitacion; }
    public void setFechaCapacitacion(LocalDateTime fechaCapacitacion) { this.fechaCapacitacion = fechaCapacitacion; }
    public LocalDateTime getFechaInicioServicio() { return fechaInicioServicio; }
    public void setFechaInicioServicio(LocalDateTime fechaInicioServicio) { this.fechaInicioServicio = fechaInicioServicio; }
    public LocalDateTime getFechaFinServicio() { return fechaFinServicio; }
    public void setFechaFinServicio(LocalDateTime fechaFinServicio) { this.fechaFinServicio = fechaFinServicio; }
    public String getEstadoServicio() { return estadoServicio; }
    public void setEstadoServicio(String estadoServicio) { this.estadoServicio = estadoServicio; }
    public BigDecimal getMontoSiguienteCobro() { return montoSiguienteCobro; }
    public void setMontoSiguienteCobro(BigDecimal montoSiguienteCobro) { this.montoSiguienteCobro = montoSiguienteCobro; }
    public Integer getDiasProrrateados() { return diasProrrateados; }
    public void setDiasProrrateados(Integer diasProrrateados) { this.diasProrrateados = diasProrrateados; }
    public String getTipoProrrateo() { return tipoProrrateo; }
    public void setTipoProrrateo(String tipoProrrateo) { this.tipoProrrateo = tipoProrrateo; }
    public BigDecimal getMontoProrrateoAdicional() { return montoProrrateoAdicional; }
    public void setMontoProrrateoAdicional(BigDecimal montoProrrateoAdicional) { this.montoProrrateoAdicional = montoProrrateoAdicional; }
    public Integer getDiasProrrateoAdicional() { return diasProrrateoAdicional; }
    public void setDiasProrrateoAdicional(Integer diasProrrateoAdicional) { this.diasProrrateoAdicional = diasProrrateoAdicional; }
    public LocalDateTime getFechaInicioProrrateoAdicional() { return fechaInicioProrrateoAdicional; }
    public void setFechaInicioProrrateoAdicional(LocalDateTime fechaInicioProrrateoAdicional) { this.fechaInicioProrrateoAdicional = fechaInicioProrrateoAdicional; }
    public LocalDateTime getFechaFinProrrateoAdicional() { return fechaFinProrrateoAdicional; }
    public void setFechaFinProrrateoAdicional(LocalDateTime fechaFinProrrateoAdicional) { this.fechaFinProrrateoAdicional = fechaFinProrrateoAdicional; }
    public LocalDateTime getFechaRegistro() { return fechaRegistro; }
    public void setFechaRegistro(LocalDateTime fechaRegistro) { this.fechaRegistro = fechaRegistro; }
    public Boolean getAvisado() { return avisado != null ? avisado : false; }
    public void setAvisado(Boolean avisado) { this.avisado = avisado; }
}
