package com.facturacion.repository;

import com.facturacion.entity.Venta;
import com.facturacion.enums.EstadoVenta;
import com.facturacion.enums.TipoVenta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VentaRepository extends JpaRepository<Venta, Long> {
    List<Venta> findByClienteIdOrderByFechaVentaDesc(Long clienteId);
    List<Venta> findByVentaAnteriorId(Long ventaAnteriorId);
    Optional<Venta> findTopByClienteIdOrderByFechaVentaDesc(Long clienteId);
    Optional<Venta> findByVentaAnteriorIdAndTipoVenta(Long ventaAnteriorId, TipoVenta tipoVenta);
    List<Venta> findByVentaAnteriorIdAndTipoVentaOrderByFechaVentaDesc(Long ventaAnteriorId, TipoVenta tipoVenta);
    boolean existsByVentaAnteriorIdAndTipoVenta(Long ventaAnteriorId, TipoVenta tipoVenta);
    boolean existsByVentaAnteriorIdAndTipoVentaAndEstadoVenta(Long ventaAnteriorId, TipoVenta tipoVenta, EstadoVenta estadoVenta);
}
