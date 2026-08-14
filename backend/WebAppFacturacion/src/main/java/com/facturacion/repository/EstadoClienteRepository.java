package com.facturacion.repository;

import com.facturacion.entity.EstadoCliente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EstadoClienteRepository extends JpaRepository<EstadoCliente, Long> {
    Optional<EstadoCliente> findByNombreAndActivoTrue(String nombre);
    List<EstadoCliente> findByActivoTrue();
}
