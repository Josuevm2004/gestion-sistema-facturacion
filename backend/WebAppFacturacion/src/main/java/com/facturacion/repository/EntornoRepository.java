package com.facturacion.repository;

import com.facturacion.entity.Entorno;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EntornoRepository extends JpaRepository<Entorno, Long> {
    List<Entorno> findByActivoTrueOrderByIdAsc();
    Optional<Entorno> findByIdAndActivoTrue(Long id);
}
