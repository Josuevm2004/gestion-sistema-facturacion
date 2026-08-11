package com.facturacion.repository;

import com.facturacion.entity.Pago;
import com.facturacion.enums.EstadoPago;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PagoRepository extends JpaRepository<Pago, Long> {
    List<Pago> findByClienteId(Long clienteId);
    void deleteByClienteId(Long clienteId);
    Optional<Pago> findByCodigoOperacion(String codigoOperacion);
    Optional<Pago> findTopByClienteIdAndPeriodoMesAnoOrderByFechaRegistroDesc(Long clienteId, String periodoMesAno);
    List<Pago> findByEstadoPago(EstadoPago estadoPago);
}
