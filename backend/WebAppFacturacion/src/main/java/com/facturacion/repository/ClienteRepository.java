package com.facturacion.repository;

import com.facturacion.entity.Cliente;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClienteRepository extends JpaRepository<Cliente, Long> {
    @EntityGraph(attributePaths = {"estado", "colorTag", "entorno"})
    List<Cliente> findByActivoTrue();

    @EntityGraph(attributePaths = {"estado", "colorTag", "entorno"})
    Optional<Cliente> findByIdAndActivoTrue(Long id);

    @EntityGraph(attributePaths = {"estado", "colorTag", "entorno"})
    Optional<Cliente> findByRucAndActivoTrue(String ruc);

    @EntityGraph(attributePaths = {"estado", "colorTag", "entorno"})
    List<Cliente> findByEstadoNombreAndActivoTrue(String estadoNombre);
}
