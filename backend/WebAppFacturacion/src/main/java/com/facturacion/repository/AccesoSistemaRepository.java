package com.facturacion.repository;

import com.facturacion.entity.AccesoSistema;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AccesoSistemaRepository extends JpaRepository<AccesoSistema, Long> {
    Optional<AccesoSistema> findByClienteId(Long clienteId);
    Optional<AccesoSistema> findBySubdominio(String subdominio);
}
