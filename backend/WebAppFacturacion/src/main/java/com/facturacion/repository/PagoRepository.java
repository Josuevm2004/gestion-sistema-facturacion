package com.facturacion.repository;

import com.facturacion.entity.Pago;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import com.facturacion.enums.EstadoPago;

@Repository
public interface PagoRepository extends JpaRepository<Pago, Long> {
    List<Pago> findByVentaId(Long ventaId);
    List<Pago> findByVentaClienteIdOrderByFechaRegistroDesc(Long clienteId);
    Optional<Pago> findTopByVentaIdAndEstadoPagoOrderByFechaRegistroDesc(Long ventaId, EstadoPago estadoPago);
}
