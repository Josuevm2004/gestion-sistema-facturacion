package com.facturacion.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "acceso_sistema")
public class AccesoSistema {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cliente_id", nullable = false, unique = true)
    private Cliente cliente;

    @Column(nullable = false, unique = true, length = 50)
    private String subdominio;

    @Column(name = "usuario_admin_facturador", nullable = false, length = 50)
    private String usuarioAdminFacturador;

    @Column(name = "clave_temporal", nullable = false, length = 100)
    private String claveTemporal;

    @Column(name = "url_acceso", nullable = false, length = 255)
    private String urlAcceso;

    private Boolean activo = true;

    @Column(name = "fecha_creacion")
    private LocalDateTime fechaCreacion;

    public AccesoSistema() {
    }

    public AccesoSistema(Long id, Cliente cliente, String subdominio, String usuarioAdminFacturador, String claveTemporal, String urlAcceso, Boolean activo, LocalDateTime fechaCreacion) {
        this.id = id;
        this.cliente = cliente;
        this.subdominio = subdominio;
        this.usuarioAdminFacturador = usuarioAdminFacturador;
        this.claveTemporal = claveTemporal;
        this.urlAcceso = urlAcceso;
        this.activo = activo != null ? activo : true;
        this.fechaCreacion = fechaCreacion;
    }

    @PrePersist
    public void prePersist() {
        if (this.fechaCreacion == null) {
            this.fechaCreacion = LocalDateTime.now();
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Cliente getCliente() { return cliente; }
    public void setCliente(Cliente cliente) { this.cliente = cliente; }
    public String getSubdominio() { return subdominio; }
    public void setSubdominio(String subdominio) { this.subdominio = subdominio; }
    public String getUsuarioAdminFacturador() { return usuarioAdminFacturador; }
    public void setUsuarioAdminFacturador(String usuarioAdminFacturador) { this.usuarioAdminFacturador = usuarioAdminFacturador; }
    public String getClaveTemporal() { return claveTemporal; }
    public void setClaveTemporal(String claveTemporal) { this.claveTemporal = claveTemporal; }
    public String getUrlAcceso() { return urlAcceso; }
    public void setUrlAcceso(String urlAcceso) { this.urlAcceso = urlAcceso; }
    public Boolean getActivo() { return activo; }
    public void setActivo(Boolean activo) { this.activo = activo; }
    public LocalDateTime getFechaCreacion() { return fechaCreacion; }
    public void setFechaCreacion(LocalDateTime fechaCreacion) { this.fechaCreacion = fechaCreacion; }

    public static AccesoSistemaBuilder builder() { return new AccesoSistemaBuilder(); }

    public static class AccesoSistemaBuilder {
        private Long id;
        private Cliente cliente;
        private String subdominio;
        private String usuarioAdminFacturador;
        private String claveTemporal;
        private String urlAcceso;
        private Boolean activo = true;
        private LocalDateTime fechaCreacion;

        public AccesoSistemaBuilder id(Long id) { this.id = id; return this; }
        public AccesoSistemaBuilder cliente(Cliente cliente) { this.cliente = cliente; return this; }
        public AccesoSistemaBuilder subdominio(String subdominio) { this.subdominio = subdominio; return this; }
        public AccesoSistemaBuilder usuarioAdminFacturador(String usuarioAdminFacturador) { this.usuarioAdminFacturador = usuarioAdminFacturador; return this; }
        public AccesoSistemaBuilder claveTemporal(String claveTemporal) { this.claveTemporal = claveTemporal; return this; }
        public AccesoSistemaBuilder urlAcceso(String urlAcceso) { this.urlAcceso = urlAcceso; return this; }
        public AccesoSistemaBuilder activo(Boolean activo) { this.activo = activo; return this; }
        public AccesoSistemaBuilder fechaCreacion(LocalDateTime fechaCreacion) { this.fechaCreacion = fechaCreacion; return this; }
        public AccesoSistema build() { return new AccesoSistema(id, cliente, subdominio, usuarioAdminFacturador, claveTemporal, urlAcceso, activo, fechaCreacion); }
    }
}
