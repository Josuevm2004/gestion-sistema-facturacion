package com.facturacion.repository;

import com.facturacion.entity.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClienteRepository extends JpaRepository<Cliente, Long> {
    List<Cliente> findByActivoTrue();
    Optional<Cliente> findByIdAndActivoTrue(Long id);
    Optional<Cliente> findByRucAndActivoTrue(String ruc);
    List<Cliente> findByEstadoNombreAndActivoTrue(String estadoNombre);
}
