package com.facturacion.repository;

import com.facturacion.entity.Suscripcion;
import com.facturacion.enums.TipoSuscripcion;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SuscripcionRepository extends JpaRepository<Suscripcion, Long> {
    @EntityGraph(attributePaths = {"plan"})
    List<Suscripcion> findByActivoTrue();

    @EntityGraph(attributePaths = {"plan"})
    Optional<Suscripcion> findByPlanIdAndTipoSuscripcionAndActivoTrue(Long planId, TipoSuscripcion tipoSuscripcion);
}
