package com.facturacion.impl;

import com.facturacion.entity.AccesoSistema;
import com.facturacion.entity.Cliente;
import com.facturacion.entity.CredencialSol;
import com.facturacion.entity.EncuestaInicial;
import com.facturacion.entity.Pago;
import com.facturacion.enums.ColorTag;
import com.facturacion.enums.EstadoCapacitacion;
import com.facturacion.enums.EstadoCuenta;
import com.facturacion.enums.PlanContratado;
import com.facturacion.enums.TipoSuscripcion;
import com.facturacion.exception.ResourceNotFoundException;
import com.facturacion.repository.ClienteRepository;
import com.facturacion.repository.CredencialSolRepository;
import com.facturacion.request.ClienteUpdateRequest;
import com.facturacion.response.ClienteResponse;
import com.facturacion.response.DetalleClienteResponse;
import com.facturacion.service.ClienteService;
import com.facturacion.util.AESEncryptionUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ClienteServiceImpl implements ClienteService {

    @Autowired
    private ClienteRepository clienteRepository;

    @Autowired
    private CredencialSolRepository credencialSolRepository;

    @Autowired
    private com.facturacion.repository.PagoRepository pagoRepository;

    @Autowired
    private com.facturacion.repository.AccesoSistemaRepository accesoSistemaRepository;

    @Autowired
    private com.facturacion.repository.EncuestaInicialRepository encuestaInicialRepository;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @Autowired
    private AESEncryptionUtil aesEncryptionUtil;

    @Override
    public List<ClienteResponse> listarClientes() {
        return clienteRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public DetalleClienteResponse obtenerPorId(Long id) {
        Cliente cliente = clienteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado con ID: " + id));

        CredencialSol credencialSol = cliente.getCredencialSol() != null ? cliente.getCredencialSol() : credencialSolRepository.findByClienteId(cliente.getId()).orElse(null);

        DetalleClienteResponse response = new DetalleClienteResponse();
        response.setId(cliente.getId());
        response.setRuc(cliente.getRuc());
        response.setRazonSocial(cliente.getRazonSocial());
        response.setNombreComercial(cliente.getNombreComercial());
        response.setDireccion(cliente.getDireccion());
        response.setTelefono(cliente.getTelefono());
        response.setEmail(cliente.getEmail());
        response.setRegimenTributario(cliente.getRegimenTributario());
        response.setPlanContratado(cliente.getPlanContratado());
        response.setTipoSuscripcion(cliente.getTipoSuscripcion());
        response.setColorTag(cliente.getColorTag());
        response.setMontoMensual(cliente.getMontoMensual());
        response.setMontoSiguienteCobro(cliente.getMontoSiguienteCobro());
        response.setEstadoCuenta(cliente.getEstadoCuenta());
        response.setEstadoCapacitacion(cliente.getEstadoCapacitacion());
        response.setFechaRegistro(cliente.getFechaRegistro());
        response.setFechaVencimientoMensual(cliente.getFechaVencimientoMensual());
        response.setFechaCapacitacion(cliente.getFechaCapacitacion());
        
        String subdominio = cliente.getRazonSocial() != null ? cliente.getRazonSocial().replaceAll("[^a-zA-Z0-9]", "").toLowerCase() : "";
        response.setSubdominio(subdominio);
        response.setUrlAcceso("https://" + subdominio + ".facturacionperu.pe");
        
        if (credencialSol != null) {
            response.setUsuarioSol(credencialSol.getUsuarioSol());
            try {
                response.setClaveSolCifrada(aesEncryptionUtil.decrypt(credencialSol.getClaveSolCifrada()));
            } catch (Exception e) {
                response.setClaveSolCifrada(credencialSol.getClaveSolCifrada());
            }
        }

        return response;
    }

    @Override
    @Transactional
    public ClienteResponse actualizarCliente(Long id, ClienteUpdateRequest request) {
        Cliente cliente = clienteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado con ID: " + id));

        if (request.getRuc() != null) cliente.setRuc(request.getRuc());
        if (request.getRazonSocial() != null) cliente.setRazonSocial(request.getRazonSocial());
        if (request.getNombreComercial() != null) cliente.setNombreComercial(request.getNombreComercial());
        if (request.getDireccion() != null) cliente.setDireccion(request.getDireccion());
        if (request.getTelefono() != null) cliente.setTelefono(request.getTelefono());
        if (request.getEmail() != null) cliente.setEmail(request.getEmail());
        if (request.getNombres() != null) cliente.setNombres(request.getNombres());
        if (request.getApellidos() != null) cliente.setApellidos(request.getApellidos());
        if (request.getDni() != null) cliente.setDni(request.getDni());
        if (request.getEmailPersonal() != null) cliente.setEmailPersonal(request.getEmailPersonal());
        if (request.getTelefonoPersonal() != null) cliente.setTelefonoPersonal(request.getTelefonoPersonal());
        if (request.getDepartamento() != null) cliente.setDepartamento(request.getDepartamento());
        if (request.getProvincia() != null) cliente.setProvincia(request.getProvincia());
        if (request.getDistrito() != null) cliente.setDistrito(request.getDistrito());
        if (request.getRegimenTributario() != null) cliente.setRegimenTributario(request.getRegimenTributario());
        if (request.getPlanContratado() != null) {
            cliente.setPlanContratado(request.getPlanContratado());
            cliente.setMontoMensual(request.getPlanContratado().getPrecioMensual());
        }
        if (request.getTipoSuscripcion() != null) cliente.setTipoSuscripcion(request.getTipoSuscripcion());
        if (request.getColorTag() != null) cliente.setColorTag(request.getColorTag());
        if (request.getVendedor() != null) cliente.setVendedor(request.getVendedor());
        if (request.getEstadoCuenta() != null) {
            cliente.setEstadoCuenta(request.getEstadoCuenta());
            if (request.getEstadoCuenta() == EstadoCuenta.HABILITADO) {
                LocalDateTime baseDate = (cliente.getFechaVencimientoMensual() != null && cliente.getFechaVencimientoMensual().isAfter(LocalDateTime.now()))
                        ? cliente.getFechaVencimientoMensual()
                        : LocalDateTime.now();
                if (cliente.getTipoSuscripcion() == TipoSuscripcion.ANUAL) {
                    cliente.setFechaVencimientoMensual(baseDate.plusYears(1));
                } else {
                    cliente.setFechaVencimientoMensual(baseDate.plusMonths(1));
                }
            }
        }
        if (request.getEstadoCapacitacion() != null) cliente.setEstadoCapacitacion(request.getEstadoCapacitacion());
        if (request.getFechaVencimientoMensual() != null) cliente.setFechaVencimientoMensual(request.getFechaVencimientoMensual());
        if (request.getFechaCapacitacion() != null) {
            this.aplicarProgramacionCapacitacion(cliente, request.getFechaCapacitacion());
        }

        if (request.getUsuarioSol() != null || request.getClaveSol() != null) {
            CredencialSol credencialSol = cliente.getCredencialSol() != null ? cliente.getCredencialSol() : credencialSolRepository.findByClienteId(cliente.getId()).orElse(null);
            if (credencialSol == null) {
                credencialSol = CredencialSol.builder().cliente(cliente).build();
            }
            if (request.getUsuarioSol() != null) credencialSol.setUsuarioSol(request.getUsuarioSol());
            if (request.getClaveSol() != null) credencialSol.setClaveSolCifrada(aesEncryptionUtil.encrypt(request.getClaveSol()));
            credencialSolRepository.save(credencialSol);
        }

        if (request.getLinkSistema() != null) cliente.setLinkSistema(request.getLinkSistema());
        if (request.getUsuarioSistema() != null) cliente.setUsuarioSistema(request.getUsuarioSistema());
        if (request.getClaveSistema() != null) cliente.setClaveSistema(request.getClaveSistema());

        clienteRepository.save(cliente);
        return mapToResponse(cliente);
    }

    @Override
    @Transactional
    public ClienteResponse cambiarEstadoCuenta(Long id, EstadoCuenta estadoCuenta) {
        Cliente cliente = clienteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado con ID: " + id));
        cliente.setEstadoCuenta(estadoCuenta);
        clienteRepository.save(cliente);
        return mapToResponse(cliente);
    }

    @Override
    @Transactional
    public ClienteResponse cambiarEstadoCapacitacion(Long id, EstadoCapacitacion estadoCapacitacion) {
        Cliente cliente = clienteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado con ID: " + id));
        cliente.setEstadoCapacitacion(estadoCapacitacion);
        clienteRepository.save(cliente);
        return mapToResponse(cliente);
    }

    @Override
    @Transactional
    public ClienteResponse cambiarColorTag(Long id, ColorTag colorTag) {
        Cliente cliente = clienteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado con ID: " + id));
        cliente.setColorTag(colorTag);
        clienteRepository.save(cliente);
        return mapToResponse(cliente);
    }

    @Override
    @Transactional
    public ClienteResponse cambiarVendedor(Long id, String vendedor) {
        Cliente cliente = clienteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado con ID: " + id));
        cliente.setVendedor(vendedor);
        clienteRepository.save(cliente);
        return mapToResponse(cliente);
    }

    @Override
    @Transactional
    public ClienteResponse programarCapacitacion(Long id, LocalDateTime fechaCapacitacion) {
        Cliente cliente = clienteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado con ID: " + id));
        this.aplicarProgramacionCapacitacion(cliente, fechaCapacitacion);
        clienteRepository.save(cliente);
        return mapToResponse(cliente);
    }

    @Override
    @Transactional
    public ClienteResponse renovarPlanCliente(Long id, String nuevoPlanStr, String tipoSuscripcionStr) {
        Cliente cliente = clienteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado con ID: " + id));

        if (nuevoPlanStr != null && !nuevoPlanStr.trim().isEmpty()) {
            try {
                PlanContratado nuevoPlan = PlanContratado.valueOf(nuevoPlanStr.trim().toUpperCase());
                cliente.setPlanContratado(nuevoPlan);
                cliente.setMontoMensual(nuevoPlan.getPrecioMensual());
            } catch (Exception ignored) {}
        }

        if (tipoSuscripcionStr != null && !tipoSuscripcionStr.trim().isEmpty()) {
            try {
                cliente.setTipoSuscripcion(TipoSuscripcion.valueOf(tipoSuscripcionStr.trim().toUpperCase()));
            } catch (Exception ignored) {}
        }

        cliente.setEstadoCuenta(EstadoCuenta.HABILITADO);

        LocalDateTime baseDate = (cliente.getFechaVencimientoMensual() != null && cliente.getFechaVencimientoMensual().isAfter(LocalDateTime.now()))
                ? cliente.getFechaVencimientoMensual()
                : LocalDateTime.now();

        if (cliente.getTipoSuscripcion() == TipoSuscripcion.ANUAL) {
            cliente.setFechaVencimientoMensual(baseDate.plusYears(1));
        } else {
            cliente.setFechaVencimientoMensual(baseDate.plusMonths(1));
        }

        clienteRepository.save(cliente);
        return mapToResponse(cliente);
    }

    @Override
    @Transactional
    public void eliminarCliente(Long id) {
        Cliente cliente = clienteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado con ID: " + id));

        // 1. Borrar directamente con SQL nativo en CockroachDB cualquier registro vinculado
        try { jdbcTemplate.update("DELETE FROM credencial_sol WHERE cliente_id = ?", id); } catch (Exception ignored) {}
        try { jdbcTemplate.update("DELETE FROM acceso_sistema WHERE cliente_id = ?", id); } catch (Exception ignored) {}
        try { jdbcTemplate.update("DELETE FROM encuesta_inicial WHERE cliente_id = ?", id); } catch (Exception ignored) {}
        try { jdbcTemplate.update("DELETE FROM pago WHERE cliente_id = ?", id); } catch (Exception ignored) {}

        // 2. Borrar por repositorios JPA
        try { credencialSolRepository.findByClienteId(id).ifPresent(credencialSolRepository::delete); } catch (Exception ignored) {}
        try { accesoSistemaRepository.findByClienteId(id).ifPresent(accesoSistemaRepository::delete); } catch (Exception ignored) {}
        try { encuestaInicialRepository.findByClienteId(id).ifPresent(encuestaInicialRepository::delete); } catch (Exception ignored) {}
        try {
            List<Pago> pagos = pagoRepository.findByClienteId(id);
            if (pagos != null && !pagos.isEmpty()) {
                pagoRepository.deleteAll(pagos);
            }
        } catch (Exception ignored) {}

        // 3. Eliminar entidad Cliente
        clienteRepository.delete(cliente);
    }

    private void aplicarProgramacionCapacitacion(Cliente cliente, LocalDateTime fechaCapacitacion) {
        cliente.setFechaCapacitacion(fechaCapacitacion);
        cliente.setEstadoCapacitacion(EstadoCapacitacion.PROGRAMADA);
        cliente.setEstadoCuenta(EstadoCuenta.HABILITADO);

        double P = cliente.getMontoMensual() != null ? cliente.getMontoMensual() : 29.0;

        if (cliente.getTipoSuscripcion() == TipoSuscripcion.ANUAL) {
            cliente.setFechaVencimientoMensual(fechaCapacitacion.plusYears(1));
            cliente.setMontoSiguienteCobro(P * 12.0);
        } else {
            int D_total = fechaCapacitacion.toLocalDate().lengthOfMonth();
            int D_cap = fechaCapacitacion.getDayOfMonth();
            double costoDiario = P / (double) D_total;
            double descuento = costoDiario * (D_cap - 1);
            double montoSiguienteCobro = Math.round(P - descuento);

            cliente.setMontoSiguienteCobro(montoSiguienteCobro);
            cliente.setFechaVencimientoMensual(
                    fechaCapacitacion.with(TemporalAdjusters.lastDayOfMonth())
                            .withHour(23).withMinute(59).withSecond(59)
            );
        }
    }

    private ClienteResponse mapToResponse(Cliente cliente) {
        CredencialSol credencialSol = cliente.getCredencialSol() != null ? cliente.getCredencialSol() : credencialSolRepository.findByClienteId(cliente.getId()).orElse(null);

        ClienteResponse response = new ClienteResponse();
        response.setId(cliente.getId());
        response.setRuc(cliente.getRuc());
        response.setRazonSocial(cliente.getRazonSocial());
        response.setNombreComercial(cliente.getNombreComercial());
        response.setTelefono(cliente.getTelefono());
        response.setEmail(cliente.getEmail());
        response.setRegimenTributario(cliente.getRegimenTributario());
        response.setPlanContratado(cliente.getPlanContratado());
        response.setTipoSuscripcion(cliente.getTipoSuscripcion());
        response.setColorTag(cliente.getColorTag());
        response.setVendedor(cliente.getVendedor());
        response.setMontoMensual(cliente.getMontoMensual());
        response.setMontoSiguienteCobro(cliente.getMontoSiguienteCobro());
        response.setEstadoCuenta(cliente.getEstadoCuenta());
        response.setEstadoCapacitacion(cliente.getEstadoCapacitacion());
        response.setFechaRegistro(cliente.getFechaRegistro());
        response.setFechaVencimientoMensual(cliente.getFechaVencimientoMensual());
        response.setFechaCapacitacion(cliente.getFechaCapacitacion());
        response.setUbigeoCodigo(cliente.getUbigeo() != null ? cliente.getUbigeo().getCodigo() : null);
        response.setDireccion(cliente.getDireccion());
        response.setNombres(cliente.getNombres());
        response.setApellidos(cliente.getApellidos());
        response.setDni(cliente.getDni());
        response.setEmailPersonal(cliente.getEmailPersonal());
        response.setTelefonoPersonal(cliente.getTelefonoPersonal());
        response.setDepartamento(cliente.getDepartamento());
        response.setProvincia(cliente.getProvincia());
        response.setDistrito(cliente.getDistrito());
        response.setLinkSistema(cliente.getLinkSistema());
        response.setUsuarioSistema(cliente.getUsuarioSistema());
        response.setClaveSistema(cliente.getClaveSistema());

        if (credencialSol != null) {
            response.setUsuarioSol(credencialSol.getUsuarioSol());
            try {
                response.setClaveSolCifrada(aesEncryptionUtil.decrypt(credencialSol.getClaveSolCifrada()));
            } catch (Exception e) {
                response.setClaveSolCifrada(credencialSol.getClaveSolCifrada());
            }
        }

        return response;
    }
}
