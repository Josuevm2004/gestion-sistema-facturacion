package com.facturacion.repository;

import com.facturacion.entity.Plan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PlanRepository extends JpaRepository<Plan, Long> {
    Optional<Plan> findByNombrePlanAndActivoTrue(String nombrePlan);
    List<Plan> findByActivoTrue();
}
