package com.facturacion.repository;

import com.facturacion.entity.UsuarioAdmin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UsuarioAdminRepository extends JpaRepository<UsuarioAdmin, Long> {
    Optional<UsuarioAdmin> findByUsername(String username);
    Optional<UsuarioAdmin> findByEmail(String email);
}
