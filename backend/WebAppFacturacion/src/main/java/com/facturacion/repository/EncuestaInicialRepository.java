package com.facturacion.repository;

import com.facturacion.entity.EncuestaInicial;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EncuestaInicialRepository extends JpaRepository<EncuestaInicial, Long> {
    Optional<EncuestaInicial> findByClienteId(Long clienteId);
    void deleteByClienteId(Long clienteId);
}
