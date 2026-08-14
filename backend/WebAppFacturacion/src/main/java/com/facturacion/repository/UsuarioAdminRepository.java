package com.facturacion.repository;

import com.facturacion.entity.UsuarioAdmin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UsuarioAdminRepository extends JpaRepository<UsuarioAdmin, Long> {
    Optional<UsuarioAdmin> findByUsernameAndActivoTrue(String username);
    Optional<UsuarioAdmin> findByEmailAndActivoTrue(String email);
    List<UsuarioAdmin> findByActivoTrue();
}
