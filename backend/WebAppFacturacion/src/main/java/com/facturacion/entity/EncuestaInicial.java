package com.facturacion.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "encuesta_inicial")
public class EncuestaInicial {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cliente_id", nullable = false, unique = true)
    @org.hibernate.annotations.OnDelete(action = org.hibernate.annotations.OnDeleteAction.CASCADE)
    private Cliente cliente;

    @Column(name = "como_nos_conocio", length = 100)
    private String comoNosConocio;

    @Column(name = "uso_sistema_anterior")
    private Boolean usoSistemaAnterior;

    @Column(name = "volumen_facturacion_estimado", length = 50)
    private String volumenFacturacionEstimado;

    @Column(length = 500)
    private String comentarios;

    @Column(name = "fecha_respuesta")
    private LocalDateTime fechaRespuesta;

    public EncuestaInicial() {
    }

    public EncuestaInicial(Long id, Cliente cliente, String comoNosConocio, Boolean usoSistemaAnterior, String volumenFacturacionEstimado, String comentarios, LocalDateTime fechaRespuesta) {
        this.id = id;
        this.cliente = cliente;
        this.comoNosConocio = comoNosConocio;
        this.usoSistemaAnterior = usoSistemaAnterior;
        this.volumenFacturacionEstimado = volumenFacturacionEstimado;
        this.comentarios = comentarios;
        this.fechaRespuesta = fechaRespuesta;
    }

    @PrePersist
    public void prePersist() {
        if (this.fechaRespuesta == null) {
            this.fechaRespuesta = LocalDateTime.now();
        }
    }

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

    public static EncuestaInicialBuilder builder() { return new EncuestaInicialBuilder(); }

    public static class EncuestaInicialBuilder {
        private Long id;
        private Cliente cliente;
        private String comoNosConocio;
        private Boolean usoSistemaAnterior;
        private String volumenFacturacionEstimado;
        private String comentarios;
        private LocalDateTime fechaRespuesta;

        public EncuestaInicialBuilder id(Long id) { this.id = id; return this; }
        public EncuestaInicialBuilder cliente(Cliente cliente) { this.cliente = cliente; return this; }
        public EncuestaInicialBuilder comoNosConocio(String comoNosConocio) { this.comoNosConocio = comoNosConocio; return this; }
        public EncuestaInicialBuilder usoSistemaAnterior(Boolean usoSistemaAnterior) { this.usoSistemaAnterior = usoSistemaAnterior; return this; }
        public EncuestaInicialBuilder volumenFacturacionEstimado(String volumenFacturacionEstimado) { this.volumenFacturacionEstimado = volumenFacturacionEstimado; return this; }
        public EncuestaInicialBuilder comentarios(String comentarios) { this.comentarios = comentarios; return this; }
        public EncuestaInicialBuilder fechaRespuesta(LocalDateTime fechaRespuesta) { this.fechaRespuesta = fechaRespuesta; return this; }
        public EncuestaInicial build() { return new EncuestaInicial(id, cliente, comoNosConocio, usoSistemaAnterior, volumenFacturacionEstimado, comentarios, fechaRespuesta); }
    }
}
