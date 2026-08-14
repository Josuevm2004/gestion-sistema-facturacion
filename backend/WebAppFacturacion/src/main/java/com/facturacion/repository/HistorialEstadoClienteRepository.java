package com.facturacion.repository;

import com.facturacion.entity.HistorialEstadoCliente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HistorialEstadoClienteRepository extends JpaRepository<HistorialEstadoCliente, Long> {
    List<HistorialEstadoCliente> findByClienteIdOrderByFechaCambioDesc(Long clienteId);
}
