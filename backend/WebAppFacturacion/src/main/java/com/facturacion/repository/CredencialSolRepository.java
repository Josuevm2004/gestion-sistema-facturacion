package com.facturacion.repository;

import com.facturacion.entity.CredencialSol;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CredencialSolRepository extends JpaRepository<CredencialSol, Long> {
    Optional<CredencialSol> findByClienteId(Long clienteId);
    void deleteByClienteId(Long clienteId);
}
