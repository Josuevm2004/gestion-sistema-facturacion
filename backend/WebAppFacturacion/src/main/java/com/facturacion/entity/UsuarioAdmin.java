package com.facturacion.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "usuario_admin")
public class UsuarioAdmin {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @Column(nullable = false, length = 255)
    private String password;

    @Column(nullable = false, length = 100)
    private String nombre;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(length = 20)
    private String rol = "ADMIN";

    @Column(name = "fecha_creacion")
    private LocalDateTime fechaCreacion;

    public UsuarioAdmin() {
    }

    public UsuarioAdmin(Long id, String username, String password, String nombre, String email, String rol, LocalDateTime fechaCreacion) {
        this.id = id;
        this.username = username;
        this.password = password;
        this.nombre = nombre;
        this.email = email;
        this.rol = rol != null ? rol : "ADMIN";
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
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getRol() { return rol; }
    public void setRol(String rol) { this.rol = rol; }
    public LocalDateTime getFechaCreacion() { return fechaCreacion; }
    public void setFechaCreacion(LocalDateTime fechaCreacion) { this.fechaCreacion = fechaCreacion; }

    public static UsuarioAdminBuilder builder() { return new UsuarioAdminBuilder(); }

    public static class UsuarioAdminBuilder {
        private Long id;
        private String username;
        private String password;
        private String nombre;
        private String email;
        private String rol = "ADMIN";
        private LocalDateTime fechaCreacion;

        public UsuarioAdminBuilder id(Long id) { this.id = id; return this; }
        public UsuarioAdminBuilder username(String username) { this.username = username; return this; }
        public UsuarioAdminBuilder password(String password) { this.password = password; return this; }
        public UsuarioAdminBuilder nombre(String nombre) { this.nombre = nombre; return this; }
        public UsuarioAdminBuilder email(String email) { this.email = email; return this; }
        public UsuarioAdminBuilder rol(String rol) { this.rol = rol; return this; }
        public UsuarioAdminBuilder fechaCreacion(LocalDateTime fechaCreacion) { this.fechaCreacion = fechaCreacion; return this; }
        public UsuarioAdmin build() { return new UsuarioAdmin(id, username, password, nombre, email, rol, fechaCreacion); }
    }
}
