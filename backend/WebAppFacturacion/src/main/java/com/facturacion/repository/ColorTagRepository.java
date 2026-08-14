package com.facturacion.repository;

import com.facturacion.entity.ColorTag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ColorTagRepository extends JpaRepository<ColorTag, Long> {
    Optional<ColorTag> findByCodigoAndActivoTrue(String codigo);
    List<ColorTag> findByActivoTrue();
}
