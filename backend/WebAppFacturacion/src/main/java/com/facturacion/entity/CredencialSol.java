package com.facturacion.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "credencial_sol")
public class CredencialSol {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cliente_id", nullable = false, unique = true)
    private Cliente cliente;

    @Column(name = "usuario_sol", nullable = false, length = 50)
    private String usuarioSol;

    @Column(name = "clave_sol_cifrada", nullable = false, length = 500)
    private String claveSolCifrada;

    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion;

    public CredencialSol() {
    }

    public CredencialSol(Long id, Cliente cliente, String usuarioSol, String claveSolCifrada, LocalDateTime fechaActualizacion) {
        this.id = id;
        this.cliente = cliente;
        this.usuarioSol = usuarioSol;
        this.claveSolCifrada = claveSolCifrada;
        this.fechaActualizacion = fechaActualizacion;
    }

    @PrePersist
    @PreUpdate
    public void onUpdate() {
        this.fechaActualizacion = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Cliente getCliente() { return cliente; }
    public void setCliente(Cliente cliente) { this.cliente = cliente; }
    public String getUsuarioSol() { return usuarioSol; }
    public void setUsuarioSol(String usuarioSol) { this.usuarioSol = usuarioSol; }
    public String getClaveSolCifrada() { return claveSolCifrada; }
    public void setClaveSolCifrada(String claveSolCifrada) { this.claveSolCifrada = claveSolCifrada; }
    public LocalDateTime getFechaActualizacion() { return fechaActualizacion; }
    public void setFechaActualizacion(LocalDateTime fechaActualizacion) { this.fechaActualizacion = fechaActualizacion; }

    public static CredencialSolBuilder builder() { return new CredencialSolBuilder(); }

    public static class CredencialSolBuilder {
        private Long id;
        private Cliente cliente;
        private String usuarioSol;
        private String claveSolCifrada;
        private LocalDateTime fechaActualizacion;

        public CredencialSolBuilder id(Long id) { this.id = id; return this; }
        public CredencialSolBuilder cliente(Cliente cliente) { this.cliente = cliente; return this; }
        public CredencialSolBuilder usuarioSol(String usuarioSol) { this.usuarioSol = usuarioSol; return this; }
        public CredencialSolBuilder claveSolCifrada(String claveSolCifrada) { this.claveSolCifrada = claveSolCifrada; return this; }
        public CredencialSolBuilder fechaActualizacion(LocalDateTime fechaActualizacion) { this.fechaActualizacion = fechaActualizacion; return this; }
        public CredencialSol build() { return new CredencialSol(id, cliente, usuarioSol, claveSolCifrada, fechaActualizacion); }
    }
}
