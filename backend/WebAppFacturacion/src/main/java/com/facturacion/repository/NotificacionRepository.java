package com.facturacion.repository;

import com.facturacion.entity.Notificacion;
import com.facturacion.enums.TipoNotificacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.time.LocalDateTime;

@Repository
public interface NotificacionRepository extends JpaRepository<Notificacion, Long> {
    List<Notificacion> findByUsuarioAdminIdOrderByFechaCreacionDesc(Long usuarioAdminId);
    List<Notificacion> findTop20ByOrderByFechaCreacionDesc();
    boolean existsByClienteIdAndTipoAndLeidaFalse(Long clienteId, TipoNotificacion tipo);
    boolean existsByClienteIdAndTipoAndFechaCreacionBetween(
            Long clienteId,
            TipoNotificacion tipo,
            LocalDateTime inicio,
            LocalDateTime fin);
    void deleteByClienteId(Long clienteId);
}
