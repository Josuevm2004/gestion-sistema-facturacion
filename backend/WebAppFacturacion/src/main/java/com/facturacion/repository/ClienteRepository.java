package com.facturacion.repository;

import com.facturacion.entity.Cliente;
import com.facturacion.enums.EstadoCuenta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ClienteRepository extends JpaRepository<Cliente, Long> {
    Optional<Cliente> findByRuc(String ruc);
    Optional<Cliente> findByTelefono(String telefono);
    Optional<Cliente> findByEmail(String email);
    List<Cliente> findByEstadoCuenta(EstadoCuenta estadoCuenta);
    List<Cliente> findByFechaVencimientoMensualBefore(LocalDateTime fecha);
}
