package com.facturacion.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "historial_estado_cliente")
public class HistorialEstadoCliente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "estado_anterior_id")
    private EstadoCliente estadoAnterior;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "estado_nuevo_id", nullable = false)
    private EstadoCliente estadoNuevo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_admin_id")
    private UsuarioAdmin usuarioAdmin;

    @Column(length = 255)
    private String motivo;

    @Column(name = "fecha_cambio", nullable = false, updatable = false)
    private LocalDateTime fechaCambio = LocalDateTime.now();

    public HistorialEstadoCliente() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Cliente getCliente() { return cliente; }
    public void setCliente(Cliente cliente) { this.cliente = cliente; }
    public EstadoCliente getEstadoAnterior() { return estadoAnterior; }
    public void setEstadoAnterior(EstadoCliente estadoAnterior) { this.estadoAnterior = estadoAnterior; }
    public EstadoCliente getEstadoNuevo() { return estadoNuevo; }
    public void setEstadoNuevo(EstadoCliente estadoNuevo) { this.estadoNuevo = estadoNuevo; }
    public UsuarioAdmin getUsuarioAdmin() { return usuarioAdmin; }
    public void setUsuarioAdmin(UsuarioAdmin usuarioAdmin) { this.usuarioAdmin = usuarioAdmin; }
    public String getMotivo() { return motivo; }
    public void setMotivo(String motivo) { this.motivo = motivo; }
    public LocalDateTime getFechaCambio() { return fechaCambio; }
    public void setFechaCambio(LocalDateTime fechaCambio) { this.fechaCambio = fechaCambio; }
}
