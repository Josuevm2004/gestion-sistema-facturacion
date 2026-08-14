package com.facturacion.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "encuesta_inicial")
public class EncuestaInicial {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    @Column(name = "como_nos_conocio", length = 100)
    private String comoNosConocio;

    @Column(name = "uso_sistema_anterior", nullable = false)
    private Boolean usoSistemaAnterior = false;

    @Column(name = "volumen_facturacion_estimado", length = 50)
    private String volumenFacturacionEstimado;

    @Column(length = 500)
    private String comentarios;

    @Column(name = "fecha_respuesta", nullable = false, updatable = false)
    private LocalDateTime fechaRespuesta = LocalDateTime.now();

    public EncuestaInicial() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Cliente getCliente() { return cliente; }
    public void setCliente(Cliente cliente) { this.cliente = cliente; }
    public String getComoNosConocio() { return comoNosConocio; }
    public void setComoNosConocio(String comoNosConocio) { this.comoNosConocio = comoNosConocio; }
    public Boolean getUsoSistemaAnterior() { return usoSistemaAnterior; }
    public void setUsoSistemaAnterior(Boolean usoSistemaAnterior) { this.usoSistemaAnterior = usoSistemaAnterior; }
    public String getVolumenFacturacionEstimado() { return volumenFacturacionEstimado; }
    public void setVolumenFacturacionEstimado(String volumenFacturacionEstimado) { this.volumenFacturacionEstimado = volumenFacturacionEstimado; }
    public String getComentarios() { return comentarios; }
    public void setComentarios(String comentarios) { this.comentarios = comentarios; }
    public LocalDateTime getFechaRespuesta() { return fechaRespuesta; }
    public void setFechaRespuesta(LocalDateTime fechaRespuesta) { this.fechaRespuesta = fechaRespuesta; }
}
