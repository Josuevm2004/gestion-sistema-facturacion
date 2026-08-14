package com.facturacion.repository;

import com.facturacion.entity.Venta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VentaRepository extends JpaRepository<Venta, Long> {
    List<Venta> findByClienteIdOrderByFechaVentaDesc(Long clienteId);
    Optional<Venta> findTopByClienteIdOrderByFechaVentaDesc(Long clienteId);
    Optional<Venta> findByVentaAnteriorIdAndTipoVenta(Long ventaAnteriorId, com.facturacion.enums.TipoVenta tipoVenta);
    boolean existsByVentaAnteriorIdAndTipoVenta(Long ventaAnteriorId, com.facturacion.enums.TipoVenta tipoVenta);
}
