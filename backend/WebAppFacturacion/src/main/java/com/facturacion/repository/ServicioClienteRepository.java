package com.facturacion.repository;

import com.facturacion.entity.ServicioCliente;
import com.facturacion.enums.EstadoServicio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ServicioClienteRepository extends JpaRepository<ServicioCliente, Long> {

    Optional<ServicioCliente> findByVentaId(Long ventaId);

    Optional<ServicioCliente> findTopByClienteIdOrderByFechaFinDesc(Long clienteId);

    List<ServicioCliente> findByClienteIdOrderByFechaInicioDesc(Long clienteId);

    List<ServicioCliente> findByClienteIdInOrderByFechaFinDesc(List<Long> clienteIds);

    List<ServicioCliente> findByEstado(EstadoServicio estado);

    @Query("SELECT s FROM ServicioCliente s WHERE s.estado = 'ACTIVO' AND s.fechaFin BETWEEN :start AND :end")
    List<ServicioCliente> findActivosQueVencenEntre(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT s FROM ServicioCliente s WHERE s.estado = 'ACTIVO' AND s.fechaFin <= :now")
    List<ServicioCliente> findActivosVencidos(@Param("now") LocalDateTime now);
}
