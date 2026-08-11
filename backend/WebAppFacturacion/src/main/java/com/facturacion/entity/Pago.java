package com.facturacion.entity;

import com.facturacion.enums.EstadoPago;
import com.facturacion.enums.MedioPago;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "pago")
public class Pago {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cliente_id", nullable = false)
    @org.hibernate.annotations.OnDelete(action = org.hibernate.annotations.OnDeleteAction.CASCADE)
    private Cliente cliente;

    @Column(name = "codigo_operacion", length = 100)
    private String codigoOperacion;

    @Column(nullable = false)
    private Double monto;

    @Enumerated(EnumType.STRING)
    @Column(name = "medio_pago", nullable = false, length = 30)
    private MedioPago medioPago;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado_pago", nullable = false, length = 20)
    private EstadoPago estadoPago = EstadoPago.PENDIENTE_PAGO;

    @Column(name = "fecha_pago")
    private LocalDateTime fechaPago;

    @Column(name = "fecha_registro")
    private LocalDateTime fechaRegistro;

    @Column(name = "periodo_mes_ano", nullable = false, length = 7)
    private String periodoMesAno;

    @Column(name = "comprobante_url", length = 500)
    private String comprobanteUrl;

    @Column(length = 255)
    private String observaciones;

    public Pago() {
    }

    public Pago(Long id, Cliente cliente, String codigoOperacion, Double monto, MedioPago medioPago, EstadoPago estadoPago, LocalDateTime fechaPago, LocalDateTime fechaRegistro, String periodoMesAno, String comprobanteUrl, String observaciones) {
        this.id = id;
        this.cliente = cliente;
        this.codigoOperacion = codigoOperacion;
        this.monto = monto;
        this.medioPago = medioPago;
        this.estadoPago = estadoPago != null ? estadoPago : EstadoPago.PENDIENTE_PAGO;
        this.fechaPago = fechaPago;
        this.fechaRegistro = fechaRegistro;
        this.periodoMesAno = periodoMesAno;
        this.comprobanteUrl = comprobanteUrl;
        this.observaciones = observaciones;
    }

    @PrePersist
    public void prePersist() {
        if (this.fechaRegistro == null) {
            this.fechaRegistro = LocalDateTime.now();
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Cliente getCliente() { return cliente; }
    public void setCliente(Cliente cliente) { this.cliente = cliente; }
    public String getCodigoOperacion() { return codigoOperacion; }
    public void setCodigoOperacion(String codigoOperacion) { this.codigoOperacion = codigoOperacion; }
    public Double getMonto() { return monto; }
    public void setMonto(Double monto) { this.monto = monto; }
    public MedioPago getMedioPago() { return medioPago; }
    public void setMedioPago(MedioPago medioPago) { this.medioPago = medioPago; }
    public EstadoPago getEstadoPago() { return estadoPago; }
    public void setEstadoPago(EstadoPago estadoPago) { this.estadoPago = estadoPago; }
    public LocalDateTime getFechaPago() { return fechaPago; }
    public void setFechaPago(LocalDateTime fechaPago) { this.fechaPago = fechaPago; }
    public LocalDateTime getFechaRegistro() { return fechaRegistro; }
    public void setFechaRegistro(LocalDateTime fechaRegistro) { this.fechaRegistro = fechaRegistro; }
    public String getPeriodoMesAno() { return periodoMesAno; }
    public void setPeriodoMesAno(String periodoMesAno) { this.periodoMesAno = periodoMesAno; }
    public String getComprobanteUrl() { return comprobanteUrl; }
    public void setComprobanteUrl(String comprobanteUrl) { this.comprobanteUrl = comprobanteUrl; }
    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }

    public static PagoBuilder builder() { return new PagoBuilder(); }

    public static class PagoBuilder {
        private Long id;
        private Cliente cliente;
        private String codigoOperacion;
        private Double monto;
        private MedioPago medioPago;
        private EstadoPago estadoPago = EstadoPago.PENDIENTE_PAGO;
        private LocalDateTime fechaPago;
        private LocalDateTime fechaRegistro;
        private String periodoMesAno;
        private String comprobanteUrl;
        private String observaciones;

        public PagoBuilder id(Long id) { this.id = id; return this; }
        public PagoBuilder cliente(Cliente cliente) { this.cliente = cliente; return this; }
        public PagoBuilder codigoOperacion(String codigoOperacion) { this.codigoOperacion = codigoOperacion; return this; }
        public PagoBuilder monto(Double monto) { this.monto = monto; return this; }
        public PagoBuilder medioPago(MedioPago medioPago) { this.medioPago = medioPago; return this; }
        public PagoBuilder estadoPago(EstadoPago estadoPago) { this.estadoPago = estadoPago; return this; }
        public PagoBuilder fechaPago(LocalDateTime fechaPago) { this.fechaPago = fechaPago; return this; }
        public PagoBuilder fechaRegistro(LocalDateTime fechaRegistro) { this.fechaRegistro = fechaRegistro; return this; }
        public PagoBuilder periodoMesAno(String periodoMesAno) { this.periodoMesAno = periodoMesAno; return this; }
        public PagoBuilder comprobanteUrl(String comprobanteUrl) { this.comprobanteUrl = comprobanteUrl; return this; }
        public PagoBuilder observaciones(String observaciones) { this.observaciones = observaciones; return this; }
        public Pago build() { return new Pago(id, cliente, codigoOperacion, monto, medioPago, estadoPago, fechaPago, fechaRegistro, periodoMesAno, comprobanteUrl, observaciones); }
    }
}
