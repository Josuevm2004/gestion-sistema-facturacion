package com.facturacion.entity;

import com.facturacion.enums.*;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "cliente")
public class Cliente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 11)
    private String ruc;

    @Column(name = "razon_social", nullable = false, length = 150)
    private String razonSocial;

    @Column(name = "nombre_comercial", length = 150)
    private String nombreComercial;

    @Column(length = 255)
    private String direccion;

    @Column(nullable = false, length = 20)
    private String telefono;

    @Column(nullable = false, length = 100)
    private String email;

    @Column(length = 100)
    private String nombres;

    @Column(length = 100)
    private String apellidos;

    @Column(length = 8)
    private String dni;

    @Column(name = "email_personal", length = 100)
    private String emailPersonal;

    @Column(name = "telefono_personal", length = 20)
    private String telefonoPersonal;

    @Column(length = 100)
    private String departamento;

    @Column(length = 100)
    private String provincia;

    @Column(length = 100)
    private String distrito;

    @Enumerated(EnumType.STRING)
    @Column(name = "regimen_tributario", nullable = false, length = 30)
    private RegimenTributario regimenTributario;

    @Enumerated(EnumType.STRING)
    @Column(name = "plan_contratado", nullable = false, length = 30)
    private PlanContratado planContratado;

    @Column(name = "monto_mensual", nullable = false)
    private Double montoMensual;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado_cuenta", nullable = false, length = 20)
    private EstadoCuenta estadoCuenta = EstadoCuenta.HABILITADO;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado_capacitacion", nullable = false, length = 20)
    private EstadoCapacitacion estadoCapacitacion = EstadoCapacitacion.PENDIENTE;

    @Column(name = "fecha_registro")
    private LocalDateTime fechaRegistro;

    @Column(name = "fecha_vencimiento_mensual", nullable = false)
    private LocalDateTime fechaVencimientoMensual;

    @Enumerated(EnumType.STRING)
    @Column(name = "color_tag", length = 10)
    private ColorTag colorTag = ColorTag.VERDE;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_suscripcion", length = 10)
    private TipoSuscripcion tipoSuscripcion = TipoSuscripcion.MENSUAL;

    @Column(name = "fecha_capacitacion")
    private LocalDateTime fechaCapacitacion;

    @Column(name = "monto_siguiente_cobro")
    private Double montoSiguienteCobro;

    @Column(name = "vendedor", length = 100)
    private String vendedor;

    @Column(name = "link_sistema", length = 255)
    private String linkSistema;

    @Column(name = "usuario_sistema", length = 100)
    private String usuarioSistema;

    @Column(name = "clave_sistema", length = 100)
    private String claveSistema;



    @OneToOne(mappedBy = "cliente", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private CredencialSol credencialSol;

    @OneToMany(mappedBy = "cliente", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private java.util.List<Pago> pagos = new java.util.ArrayList<>();

    public Cliente() {
    }

    public Cliente(Long id, String ruc, String razonSocial, String nombreComercial, String direccion, String telefono, String email, RegimenTributario regimenTributario, PlanContratado planContratado, Double montoMensual, EstadoCuenta estadoCuenta, EstadoCapacitacion estadoCapacitacion, LocalDateTime fechaRegistro, LocalDateTime fechaVencimientoMensual) {
        this.id = id;
        this.ruc = ruc;
        this.razonSocial = razonSocial;
        this.nombreComercial = nombreComercial;
        this.direccion = direccion;
        this.telefono = telefono;
        this.email = email;
        this.regimenTributario = regimenTributario;
        this.planContratado = planContratado;
        this.montoMensual = montoMensual;
        this.estadoCuenta = estadoCuenta != null ? estadoCuenta : EstadoCuenta.HABILITADO;
        this.estadoCapacitacion = estadoCapacitacion != null ? estadoCapacitacion : EstadoCapacitacion.PENDIENTE;
        this.fechaRegistro = fechaRegistro;
        this.fechaVencimientoMensual = fechaVencimientoMensual;
    }

    @PrePersist
    public void prePersist() {
        if (this.fechaRegistro == null) {
            this.fechaRegistro = LocalDateTime.now();
        }
        if (this.fechaVencimientoMensual == null) {
            this.fechaVencimientoMensual = LocalDateTime.now().plusMonths(1);
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getRuc() {
        return ruc;
    }

    public void setRuc(String ruc) {
        this.ruc = ruc;
    }

    public String getRazonSocial() {
        return razonSocial;
    }

    public void setRazonSocial(String razonSocial) {
        this.razonSocial = razonSocial;
    }

    public String getNombreComercial() {
        return nombreComercial;
    }

    public void setNombreComercial(String nombreComercial) {
        this.nombreComercial = nombreComercial;
    }

    public String getDireccion() {
        return direccion;
    }

    public void setDireccion(String direccion) {
        this.direccion = direccion;
    }

    public String getTelefono() {
        return telefono;
    }

    public void setTelefono(String telefono) {
        this.telefono = telefono;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

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

    public RegimenTributario getRegimenTributario() {
        return regimenTributario;
    }

    public void setRegimenTributario(RegimenTributario regimenTributario) {
        this.regimenTributario = regimenTributario;
    }

    public PlanContratado getPlanContratado() {
        return planContratado;
    }

    public void setPlanContratado(PlanContratado planContratado) {
        this.planContratado = planContratado;
    }

    public Double getMontoMensual() {
        return montoMensual;
    }

    public void setMontoMensual(Double montoMensual) {
        this.montoMensual = montoMensual;
    }

    public String getVendedor() {
        return vendedor;
    }

    public void setVendedor(String vendedor) {
        this.vendedor = vendedor;
    }

    public EstadoCuenta getEstadoCuenta() {
        return estadoCuenta;
    }

    public void setEstadoCuenta(EstadoCuenta estadoCuenta) {
        this.estadoCuenta = estadoCuenta;
    }

    public EstadoCapacitacion getEstadoCapacitacion() {
        return estadoCapacitacion;
    }

    public void setEstadoCapacitacion(EstadoCapacitacion estadoCapacitacion) {
        this.estadoCapacitacion = estadoCapacitacion;
    }

    public LocalDateTime getFechaRegistro() {
        return fechaRegistro;
    }

    public void setFechaRegistro(LocalDateTime fechaRegistro) {
        this.fechaRegistro = fechaRegistro;
    }

    public LocalDateTime getFechaVencimientoMensual() {
        return fechaVencimientoMensual;
    }

    public void setFechaVencimientoMensual(LocalDateTime fechaVencimientoMensual) {
        this.fechaVencimientoMensual = fechaVencimientoMensual;
    }



    public CredencialSol getCredencialSol() {
        return credencialSol;
    }

    public void setCredencialSol(CredencialSol credencialSol) {
        this.credencialSol = credencialSol;
    }

    public ColorTag getColorTag() {
        return colorTag;
    }

    public void setColorTag(ColorTag colorTag) {
        this.colorTag = colorTag;
    }

    public TipoSuscripcion getTipoSuscripcion() {
        return tipoSuscripcion;
    }

    public void setTipoSuscripcion(TipoSuscripcion tipoSuscripcion) {
        this.tipoSuscripcion = tipoSuscripcion;
    }

    public LocalDateTime getFechaCapacitacion() {
        return fechaCapacitacion;
    }

    public void setFechaCapacitacion(LocalDateTime fechaCapacitacion) {
        this.fechaCapacitacion = fechaCapacitacion;
    }

    public Double getMontoSiguienteCobro() {
        return montoSiguienteCobro;
    }

    public void setMontoSiguienteCobro(Double montoSiguienteCobro) {
        this.montoSiguienteCobro = montoSiguienteCobro;
    }

    public String getLinkSistema() {
        return linkSistema;
    }

    public void setLinkSistema(String linkSistema) {
        this.linkSistema = linkSistema;
    }

    public String getUsuarioSistema() {
        return usuarioSistema;
    }

    public void setUsuarioSistema(String usuarioSistema) {
        this.usuarioSistema = usuarioSistema;
    }

    public String getClaveSistema() {
        return claveSistema;
    }

    public void setClaveSistema(String claveSistema) {
        this.claveSistema = claveSistema;
    }

    public static ClienteBuilder builder() {
        return new ClienteBuilder();
    }

    public static class ClienteBuilder {
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
        private EstadoCuenta estadoCuenta = EstadoCuenta.HABILITADO;
        private EstadoCapacitacion estadoCapacitacion = EstadoCapacitacion.PENDIENTE;
        private LocalDateTime fechaRegistro;
        private LocalDateTime fechaVencimientoMensual;

        public ClienteBuilder id(Long id) {
            this.id = id;
            return this;
        }

        public ClienteBuilder ruc(String ruc) {
            this.ruc = ruc;
            return this;
        }

        public ClienteBuilder razonSocial(String razonSocial) {
            this.razonSocial = razonSocial;
            return this;
        }

        public ClienteBuilder nombreComercial(String nombreComercial) {
            this.nombreComercial = nombreComercial;
            return this;
        }

        public ClienteBuilder direccion(String direccion) {
            this.direccion = direccion;
            return this;
        }

        public ClienteBuilder telefono(String telefono) {
            this.telefono = telefono;
            return this;
        }

        public ClienteBuilder email(String email) {
            this.email = email;
            return this;
        }

        public ClienteBuilder regimenTributario(RegimenTributario regimenTributario) {
            this.regimenTributario = regimenTributario;
            return this;
        }

        public ClienteBuilder planContratado(PlanContratado planContratado) {
            this.planContratado = planContratado;
            return this;
        }

        public ClienteBuilder montoMensual(Double montoMensual) {
            this.montoMensual = montoMensual;
            return this;
        }

        public ClienteBuilder estadoCuenta(EstadoCuenta estadoCuenta) {
            this.estadoCuenta = estadoCuenta;
            return this;
        }

        public ClienteBuilder estadoCapacitacion(EstadoCapacitacion estadoCapacitacion) {
            this.estadoCapacitacion = estadoCapacitacion;
            return this;
        }

        public ClienteBuilder fechaRegistro(LocalDateTime fechaRegistro) {
            this.fechaRegistro = fechaRegistro;
            return this;
        }

        public ClienteBuilder fechaVencimientoMensual(LocalDateTime fechaVencimientoMensual) {
            this.fechaVencimientoMensual = fechaVencimientoMensual;
            return this;
        }

        public Cliente build() {
            return new Cliente(id, ruc, razonSocial, nombreComercial, direccion, telefono, email, regimenTributario, planContratado, montoMensual, estadoCuenta, estadoCapacitacion, fechaRegistro, fechaVencimientoMensual);
        }
    }
}
