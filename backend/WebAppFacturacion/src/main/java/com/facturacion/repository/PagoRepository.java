package com.facturacion.repository;

import com.facturacion.entity.Pago;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import com.facturacion.enums.EstadoPago;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Query;

@Repository
public interface PagoRepository extends JpaRepository<Pago, Long> {
    List<Pago> findByVentaId(Long ventaId);

    @EntityGraph(attributePaths = {
            "venta",
            "venta.cliente",
            "venta.vendedor",
            "venta.suscripcion",
            "venta.suscripcion.plan"
    })
    @Query("SELECT p FROM Pago p ORDER BY p.fechaRegistro DESC")
    List<Pago> findAllWithDetails();

    @EntityGraph(attributePaths = {
            "venta",
            "venta.cliente",
            "venta.vendedor",
            "venta.suscripcion",
            "venta.suscripcion.plan"
    })
    List<Pago> findByVentaClienteIdOrderByFechaRegistroDesc(Long clienteId);
    Optional<Pago> findTopByVentaIdAndEstadoPagoOrderByFechaRegistroDesc(Long ventaId, EstadoPago estadoPago);
}
