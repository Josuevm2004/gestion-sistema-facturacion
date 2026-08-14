package com.facturacion.entity;

import com.facturacion.enums.EstadoVenta;
import com.facturacion.enums.TipoVenta;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "venta")
public class Venta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "vendedor_id")
    private UsuarioAdmin vendedor;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "suscripcion_id", nullable = false)
    private Suscripcion suscripcion;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_venta", nullable = false)
    private TipoVenta tipoVenta;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "venta_anterior_id")
    private Venta ventaAnterior;

    @Column(name = "precio_lista", nullable = false, precision = 10, scale = 2)
    private BigDecimal precioLista;

    @Column(name = "monto_prorrateado", nullable = false, precision = 10, scale = 2)
    private BigDecimal montoProrrateado = BigDecimal.ZERO;

    @Column(name = "monto_total", nullable = false, precision = 10, scale = 2)
    private BigDecimal montoTotal;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado_venta", nullable = false)
    private EstadoVenta estadoVenta = EstadoVenta.PENDIENTE_PAGO;

    @Column(length = 500)
    private String observaciones;

    @Column(name = "fecha_venta", nullable = false, updatable = false)
    private LocalDateTime fechaVenta = LocalDateTime.now();

    @Column(name = "fecha_actualizacion", nullable = false)
    private LocalDateTime fechaActualizacion = LocalDateTime.now();

    @PreUpdate
    public void onUpdate() {
        this.fechaActualizacion = LocalDateTime.now();
    }

    public Venta() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Cliente getCliente() { return cliente; }
    public void setCliente(Cliente cliente) { this.cliente = cliente; }
    public UsuarioAdmin getVendedor() { return vendedor; }
    public void setVendedor(UsuarioAdmin vendedor) { this.vendedor = vendedor; }
    public Suscripcion getSuscripcion() { return suscripcion; }
    public void setSuscripcion(Suscripcion suscripcion) { this.suscripcion = suscripcion; }
    public TipoVenta getTipoVenta() { return tipoVenta; }
    public void setTipoVenta(TipoVenta tipoVenta) { this.tipoVenta = tipoVenta; }
    public Venta getVentaAnterior() { return ventaAnterior; }
    public void setVentaAnterior(Venta ventaAnterior) { this.ventaAnterior = ventaAnterior; }
    public BigDecimal getPrecioLista() { return precioLista; }
    public void setPrecioLista(BigDecimal precioLista) { this.precioLista = precioLista; }
    public BigDecimal getMontoProrrateado() { return montoProrrateado; }
    public void setMontoProrrateado(BigDecimal montoProrrateado) { this.montoProrrateado = montoProrrateado; }
    public BigDecimal getMontoTotal() { return montoTotal; }
    public void setMontoTotal(BigDecimal montoTotal) { this.montoTotal = montoTotal; }
    public EstadoVenta getEstadoVenta() { return estadoVenta; }
    public void setEstadoVenta(EstadoVenta estadoVenta) { this.estadoVenta = estadoVenta; }
    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }
    public LocalDateTime getFechaVenta() { return fechaVenta; }
    public void setFechaVenta(LocalDateTime fechaVenta) { this.fechaVenta = fechaVenta; }
    public LocalDateTime getFechaActualizacion() { return fechaActualizacion; }
    public void setFechaActualizacion(LocalDateTime fechaActualizacion) { this.fechaActualizacion = fechaActualizacion; }
}
