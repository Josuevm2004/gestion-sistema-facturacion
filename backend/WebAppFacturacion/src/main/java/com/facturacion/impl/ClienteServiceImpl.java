package com.facturacion.impl;

import com.facturacion.entity.*;
import com.facturacion.enums.EstadoServicio;
import com.facturacion.enums.EstadoVenta;
import com.facturacion.enums.TipoSuscripcion;
import com.facturacion.enums.TipoVenta;
import com.facturacion.exception.ResourceNotFoundException;
import com.facturacion.repository.*;
import com.facturacion.request.ClienteUpdateRequest;
import com.facturacion.request.RegistroFormularioRequest;
import com.facturacion.response.ClienteDashboardResponse;
import com.facturacion.response.DetalleClienteResponse;
import com.facturacion.response.OperacionHistorialResponse;
import com.facturacion.service.ClienteService;
import com.facturacion.util.ProrrateoCalculatorUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class ClienteServiceImpl implements ClienteService {

    private static final LocalTime BILLING_CUTOFF_TIME = LocalTime.MIDNIGHT;

    @Autowired
    private ClienteRepository clienteRepository;
    @Autowired
    private EstadoClienteRepository estadoClienteRepository;
    @Autowired
    private ColorTagRepository colorTagRepository;
    @Autowired
    private EntornoRepository entornoRepository;
    @Autowired
    private UsuarioAdminRepository usuarioAdminRepository;
    @Autowired
    private PlanRepository planRepository;
    @Autowired
    private SuscripcionRepository suscripcionRepository;
    @Autowired
    private VentaRepository ventaRepository;
    @Autowired
    private ServicioClienteRepository servicioClienteRepository;
    @Autowired
    private PagoRepository pagoRepository;
    @Autowired
    private EncuestaInicialRepository encuestaInicialRepository;
    @Autowired
    private HistorialEstadoClienteRepository historialEstadoClienteRepository;
    @Autowired
    private NotificacionRepository notificacionRepository;

    @Value("${app.billing.monthly-billing-day:1}")
    private int monthlyBillingDay;

    @Override
    @Transactional
    public ClienteDashboardResponse registrarFormulario(RegistroFormularioRequest request) {
        LocalDateTime fechaOperacion = LocalDateTime.now();

        // 1. Obtener o asignar estado POR_COBRAR
        EstadoCliente estadoPorCobrar = estadoClienteRepository.findByNombreAndActivoTrue("POR_COBRAR")
                .orElseGet(() -> {
                    EstadoCliente nuevo = new EstadoCliente();
                    nuevo.setNombre("POR_COBRAR");
                    nuevo.setDescripcion("Cliente registrado pero pendiente de pago");
                    return estadoClienteRepository.save(nuevo);
                });

        // 2. Crear Cliente
        Cliente cliente = new Cliente();
        cliente.setRuc(request.getRuc());
        cliente.setUsuarioSol(request.getUsuarioSol() != null ? request.getUsuarioSol() : "SIN_USUARIO");
        cliente.setClaveSolCifrada(request.getClaveSol() != null ? request.getClaveSol() : "SIN_CLAVE");
        cliente.setRazonSocial(request.getRazonSocial());
        cliente.setNombreComercial(request.getNombreComercial());
        cliente.setDireccion(request.getDireccion());
        cliente.setTelefono(request.getTelefono());
        cliente.setEmail(request.getEmail());
        cliente.setNombres(request.getNombres());
        cliente.setApellidos(request.getApellidos());
        cliente.setDni(request.getDni());
        cliente.setEmailPersonal(request.getEmailPersonal());
        cliente.setTelefonoPersonal(request.getTelefonoPersonal());
        cliente.setDepartamento(request.getDepartamento());
        cliente.setProvincia(request.getProvincia());
        cliente.setDistrito(request.getDistrito());
        cliente.setEstado(estadoPorCobrar);
        cliente.setFechaRegistro(fechaOperacion);
        cliente.setFechaActualizacion(fechaOperacion);
        cliente = clienteRepository.save(cliente);

        // 3. Registrar Encuesta Inicial
        if (request.getComoNosConocio() != null || request.getComentarios() != null) {
            EncuestaInicial encuesta = new EncuestaInicial();
            encuesta.setCliente(cliente);
            encuesta.setComoNosConocio(request.getComoNosConocio());
            encuesta.setUsoSistemaAnterior(Boolean.TRUE.equals(request.getUsoSistemaAnterior()));
            encuesta.setVolumenFacturacionEstimado(request.getVolumenFacturacionEstimado());
            encuesta.setComentarios(request.getComentarios());
            encuesta.setFechaRespuesta(fechaOperacion);
            encuestaInicialRepository.save(encuesta);
        }

        // 4. Obtener Suscripción elegida
        Long planId = request.getPlanId() != null ? request.getPlanId() : resolverPlanId(request.getPlanContratado());
        TipoSuscripcion tipoSub = request.getTipoSuscripcion() != null ? request.getTipoSuscripcion() : TipoSuscripcion.MENSUAL;

        if (planId == null) {
            throw new ResourceNotFoundException("El plan seleccionado no es valido");
        }

        Suscripcion suscripcion = suscripcionRepository.findByPlanIdAndTipoSuscripcionAndActivoTrue(planId, tipoSub)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No existe una suscripcion activa para el plan y modalidad seleccionados"));

        // 5. Vendedor nulo inicialmente (Por asignar)
        UsuarioAdmin vendedor = null;

        // 6. Crear Venta ALTA
        Venta venta = new Venta();
        venta.setCliente(cliente);
        venta.setVendedor(vendedor);
        venta.setSuscripcion(suscripcion);
        venta.setTipoVenta(TipoVenta.ALTA);
        venta.setPrecioLista(suscripcion.getPrecio());
        venta.setMontoProrrateado(BigDecimal.ZERO);
        venta.setMontoTotal(suscripcion.getPrecio());
        venta.setEstadoVenta(EstadoVenta.PENDIENTE_PAGO);
        venta.setObservaciones("Venta inicial generada desde el formulario onboarding");
        venta.setFechaVenta(fechaOperacion);
        venta.setFechaActualizacion(fechaOperacion);
        venta = ventaRepository.save(venta);

        // 7. Crear ServicioCliente PENDIENTE_CAPACITACION
        ServicioCliente servicio = new ServicioCliente();
        servicio.setCliente(cliente);
        servicio.setVenta(venta);
        servicio.setFechaInicio(fechaOperacion);
        if (tipoSub == TipoSuscripcion.ANUAL) {
            servicio.setFechaFin(fechaOperacion.plusYears(1));
        } else {
            LocalDate fechaFinMensual = ProrrateoCalculatorUtil.calcularFechaFinMensual(fechaOperacion.toLocalDate(), monthlyBillingDay);
            servicio.setFechaFin(LocalDateTime.of(fechaFinMensual, BILLING_CUTOFF_TIME));
        }
        servicio.setEstado(EstadoServicio.PENDIENTE_CAPACITACION);
        servicio.setObservaciones("Servicio registrado desde formulario de onboarding");
        servicio.setFechaCreacion(fechaOperacion);
        servicio.setFechaActualizacion(fechaOperacion);
        servicioClienteRepository.save(servicio);

        // 8. Historial de Estado
        registrarHistorial(cliente, null, estadoPorCobrar, vendedor, "Registro inicial vía encuesta onboarding");

        return mapToDashboardResponse(cliente);
    }

    private Long resolverPlanId(String planContratado) {
        String rawPlan = planContratado == null ? "" : planContratado;
        String normalized = java.text.Normalizer.normalize(rawPlan, java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toUpperCase()
                .replace("PLAN ", "")
                .trim();

        return switch (normalized) {
            case "EMPRENDE" -> 2L;
            case "IMPULSA" -> 3L;
            case "EMPRESARIAL" -> 4L;
            case "LIDER" -> 5L;
            case "INICIAL", "INICIA" -> 1L;
            default -> null;
        };
    }

    @Override
    @Transactional(readOnly = true)
    public List<ClienteDashboardResponse> listarClientes() {
        List<Cliente> clientes = clienteRepository.findByActivoTrue();
        List<ClienteDashboardResponse> list = new ArrayList<>();
        for (Cliente c : clientes) {
            try {
                list.add(mapToDashboardResponse(c));
            } catch (RuntimeException ex) {
                list.add(mapToDashboardResponseBasico(c));
            }
        }
        return list;
    }

    @Override
    @Transactional(readOnly = true)
    public DetalleClienteResponse obtenerPorId(Long id) {
        Cliente cliente = clienteRepository.findByIdAndActivoTrue(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado con ID: " + id));

        DetalleClienteResponse detalle = new DetalleClienteResponse();
        detalle.setCliente(mapToDashboardResponse(cliente));

        List<Venta> ventas = ventaRepository.findByClienteIdOrderByFechaVentaDesc(id);
        detalle.setVentasHistorial(mapVentasHistorial(ventas));

        List<Pago> pagos = pagoRepository.findByVentaClienteIdOrderByFechaRegistroDesc(id);
        detalle.setPagosHistorial(mapPagosHistorial(pagos));

        List<ServicioCliente> servicios = servicioClienteRepository.findByClienteIdOrderByFechaInicioDesc(id);
        detalle.setOperacionesHistorial(construirHistorialOperaciones(ventas, pagos, servicios));

        List<HistorialEstadoCliente> historico = historialEstadoClienteRepository.findByClienteIdOrderByFechaCambioDesc(id);
        detalle.setEstadosHistorial(mapEstadosHistorial(historico));

        return detalle;
    }

    private List<Object> mapVentasHistorial(List<Venta> ventas) {
        List<Object> result = new ArrayList<>();
        for (Venta v : ventas) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", v.getId());
            item.put("ventaId", v.getId());
            item.put("clienteId", v.getCliente() != null ? v.getCliente().getId() : null);
            item.put("tipoVenta", v.getTipoVenta() != null ? v.getTipoVenta().name() : null);
            item.put("tipoOperacion", v.getTipoVenta() != null ? v.getTipoVenta().name() : null);
            item.put("estadoVenta", v.getEstadoVenta() != null ? v.getEstadoVenta().name() : null);
            item.put("fechaVenta", v.getFechaVenta());
            item.put("fechaOperacion", v.getFechaVenta());
            item.put("precioLista", v.getPrecioLista());
            item.put("montoTotal", v.getMontoTotal());
            item.put("montoVenta", v.getMontoTotal());
            item.put("montoProrrateado", v.getMontoProrrateado());
            item.put("observaciones", v.getObservaciones());
            if (v.getSuscripcion() != null) {
                item.put("suscripcionId", v.getSuscripcion().getId());
                item.put("tipoSuscripcion", v.getSuscripcion().getTipoSuscripcion() != null ? v.getSuscripcion().getTipoSuscripcion().name() : null);
                if (v.getSuscripcion().getPlan() != null) {
                    item.put("planId", v.getSuscripcion().getPlan().getId());
                    item.put("plan", v.getSuscripcion().getPlan().getNombrePlan());
                    item.put("planNombre", v.getSuscripcion().getPlan().getNombrePlan());
                }
            }
            result.add(item);
        }
        return result;
    }

    private List<Object> mapPagosHistorial(List<Pago> pagos) {
        List<Object> result = new ArrayList<>();
        for (Pago p : pagos) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", p.getId());
            item.put("pagoId", p.getId());
            item.put("ventaId", p.getVenta() != null ? p.getVenta().getId() : null);
            item.put("clienteId", p.getVenta() != null && p.getVenta().getCliente() != null ? p.getVenta().getCliente().getId() : null);
            item.put("codigoOperacion", p.getCodigoOperacion());
            item.put("monto", p.getMonto());
            item.put("medioPago", p.getMedioPago() != null ? p.getMedioPago().name() : null);
            item.put("estadoPago", p.getEstadoPago() != null ? p.getEstadoPago().name() : null);
            item.put("fechaPago", p.getFechaPago());
            item.put("fechaRegistro", p.getFechaRegistro());
            item.put("comprobanteUrl", p.getComprobanteUrl());
            item.put("observaciones", p.getObservaciones());

            if (p.getVenta() != null) {
                Map<String, Object> venta = new LinkedHashMap<>();
                venta.put("id", p.getVenta().getId());
                venta.put("clienteId", p.getVenta().getCliente() != null ? p.getVenta().getCliente().getId() : null);
                venta.put("montoTotal", p.getVenta().getMontoTotal());
                venta.put("estadoVenta", p.getVenta().getEstadoVenta() != null ? p.getVenta().getEstadoVenta().name() : null);
                venta.put("tipoVenta", p.getVenta().getTipoVenta() != null ? p.getVenta().getTipoVenta().name() : null);
                venta.put("fechaVenta", p.getVenta().getFechaVenta());
                if (p.getVenta().getSuscripcion() != null) {
                    venta.put("tipoSuscripcion", p.getVenta().getSuscripcion().getTipoSuscripcion() != null
                            ? p.getVenta().getSuscripcion().getTipoSuscripcion().name()
                            : null);
                    if (p.getVenta().getSuscripcion().getPlan() != null) {
                        venta.put("plan", p.getVenta().getSuscripcion().getPlan().getNombrePlan());
                        venta.put("planNombre", p.getVenta().getSuscripcion().getPlan().getNombrePlan());
                    }
                }
                item.put("venta", venta);
            }

            result.add(item);
        }
        return result;
    }

    private List<Object> mapEstadosHistorial(List<HistorialEstadoCliente> historico) {
        List<Object> result = new ArrayList<>();
        for (HistorialEstadoCliente h : historico) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", h.getId());
            item.put("estadoAnterior", h.getEstadoAnterior() != null ? h.getEstadoAnterior().getNombre() : null);
            item.put("estadoNuevo", h.getEstadoNuevo() != null ? h.getEstadoNuevo().getNombre() : null);
            item.put("motivo", h.getMotivo());
            item.put("fechaCambio", h.getFechaCambio());
            item.put("usuarioAdmin", h.getUsuarioAdmin() != null ? h.getUsuarioAdmin().getNombre() : null);
            result.add(item);
        }
        return result;
    }

    private List<OperacionHistorialResponse> construirHistorialOperaciones(
            List<Venta> ventas,
            List<Pago> pagos,
            List<ServicioCliente> servicios) {
        Map<Long, Pago> pagoPorVenta = new HashMap<>();
        for (Pago p : pagos) {
            if (p.getVenta() != null && p.getVenta().getId() != null) {
                pagoPorVenta.putIfAbsent(p.getVenta().getId(), p);
            }
        }

        Map<Long, ServicioCliente> servicioPorVenta = new HashMap<>();
        for (ServicioCliente s : servicios) {
            if (s.getVenta() != null && s.getVenta().getId() != null) {
                servicioPorVenta.put(s.getVenta().getId(), s);
            }
        }

        List<OperacionHistorialResponse> operaciones = new ArrayList<>();
        for (Venta v : ventas) {
            Pago p = pagoPorVenta.get(v.getId());
            ServicioCliente s = servicioPorVenta.get(v.getId());

            OperacionHistorialResponse op = new OperacionHistorialResponse();
            op.setVentaId(v.getId());
            op.setFechaOperacion(v.getFechaVenta());
            op.setTipoOperacion(v.getTipoVenta() != null ? v.getTipoVenta().name() : null);
            op.setEstadoVenta(v.getEstadoVenta() != null ? v.getEstadoVenta().name() : null);
            op.setPrecioLista(v.getPrecioLista());
            op.setMontoVenta(v.getMontoTotal());
            op.setDescuentoProrrateo(v.getMontoProrrateado());
            op.setObservaciones(v.getObservaciones());

            if (v.getSuscripcion() != null) {
                op.setTipoSuscripcion(v.getSuscripcion().getTipoSuscripcion() != null ? v.getSuscripcion().getTipoSuscripcion().name() : null);
                op.setPrecioPlan(v.getSuscripcion().getPrecio());
                if (v.getSuscripcion().getPlan() != null) {
                    op.setPlan(v.getSuscripcion().getPlan().getNombrePlan());
                }
            }

            if (p != null) {
                op.setPagoId(p.getId());
                op.setFechaPago(p.getFechaPago());
                op.setEstadoPago(p.getEstadoPago() != null ? p.getEstadoPago().name() : null);
                op.setMontoPagado(p.getMonto());
            }

            if (s != null) {
                op.setServicioId(s.getId());
                op.setFechaInicioServicio(s.getFechaInicio());
                op.setFechaFinServicio(s.getFechaFin());
                op.setEstadoServicio(s.getEstado() != null ? s.getEstado().name() : null);
                op.setMontoProrrateado(s.getMontoProrrateo());
                op.setDiasProrrateados(s.getDiasProrrateados());
            }

            operaciones.add(op);
        }

        operaciones.sort(Comparator.comparing(OperacionHistorialResponse::getFechaOperacion, Comparator.nullsLast(Comparator.reverseOrder())));
        return operaciones;
    }

    @Override
    @Transactional
    public ClienteDashboardResponse actualizarCliente(Long id, ClienteUpdateRequest request) {
        Cliente cliente = clienteRepository.findByIdAndActivoTrue(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado con ID: " + id));

        if (request.getRazonSocial() != null) cliente.setRazonSocial(request.getRazonSocial());
        if (request.getRuc() != null) cliente.setRuc(request.getRuc());
        if (request.getUsuarioSol() != null) cliente.setUsuarioSol(request.getUsuarioSol());
        if (request.getClaveSol() != null) cliente.setClaveSolCifrada(request.getClaveSol());
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

        if (request.getUsuarioAdminFacturador() != null) cliente.setUsuarioAdminFacturador(request.getUsuarioAdminFacturador());
        if (request.getClaveTemporal() != null) cliente.setClaveTemporal(request.getClaveTemporal());
        if (request.getUrlAcceso() != null) cliente.setUrlAcceso(request.getUrlAcceso());
        if (request.getUsuarioWsp() != null) {
            String usuarioWsp = request.getUsuarioWsp().trim();
            cliente.setUsuarioWsp(usuarioWsp.isBlank() ? null : usuarioWsp);
        }

        if (request.getColorTagId() != null) {
            ColorTag colorTag = colorTagRepository.findById(request.getColorTagId()).orElse(null);
            cliente.setColorTag(colorTag);
        }

        if (request.getEntornoId() != null) {
            Entorno entorno = entornoRepository.findByIdAndActivoTrue(request.getEntornoId())
                    .orElseThrow(() -> new ResourceNotFoundException("Entorno no encontrado"));
            cliente.setEntorno(entorno);
        }

        if (request.getEstadoId() != null) {
            EstadoCliente nuevoEstado = estadoClienteRepository.findById(request.getEstadoId()).orElse(null);
            if (nuevoEstado != null && !nuevoEstado.equals(cliente.getEstado())) {
                EstadoCliente viejo = cliente.getEstado();
                cliente.setEstado(nuevoEstado);
                registrarHistorial(cliente, viejo, nuevoEstado, null, "Actualización de estado manual");
            }
        }

        clienteRepository.save(cliente);
        if (request.getVendedorId() != null) {
            asignarVendedorAVentasExistentes(cliente.getId(), request.getVendedorId());
        }
        return mapToDashboardResponse(cliente);
    }

    @Override
    @Transactional
    public ClienteDashboardResponse cambiarColorTag(Long clienteId, Long colorTagId) {
        Cliente cliente = clienteRepository.findByIdAndActivoTrue(clienteId)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado"));
        ColorTag color = colorTagRepository.findById(colorTagId)
                .orElseThrow(() -> new ResourceNotFoundException("Color no encontrado"));
        cliente.setColorTag(color);
        clienteRepository.save(cliente);
        return mapToDashboardResponse(cliente);
    }

    @Override
    @Transactional
    public ClienteDashboardResponse cambiarVendedor(Long clienteId, Long vendedorId) {
        Cliente cliente = clienteRepository.findByIdAndActivoTrue(clienteId)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado"));
        List<Venta> ventasCliente = ventaRepository.findByClienteIdOrderByFechaVentaDesc(clienteId);
        if (ventasCliente.isEmpty()) {
            return mapToDashboardResponse(cliente);
        }
        asignarVendedorAVentasExistentes(clienteId, vendedorId);
        return mapToDashboardResponse(cliente);
    }

    @Override
    @Transactional
    public ClienteDashboardResponse asignarmeVendedor(Long clienteId, String username) {
        Cliente cliente = clienteRepository.findByIdAndActivoTrue(clienteId)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado"));
        UsuarioAdmin vendedor = usuarioAdminRepository.findByUsernameAndActivoTrue(username)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario vendedor no encontrado"));
        List<Venta> ventasCliente = ventaRepository.findByClienteIdOrderByFechaVentaDesc(clienteId);

        if (ventasCliente.isEmpty()) {
            throw new IllegalStateException("El cliente todavía no tiene una venta asignable");
        }
        boolean yaAsignado = ventasCliente.stream().anyMatch(venta -> venta.getVendedor() != null);
        if (yaAsignado) {
            throw new IllegalStateException("Este cliente ya tiene un vendedor asignado");
        }

        ventasCliente.forEach(venta -> venta.setVendedor(vendedor));
        ventaRepository.saveAll(ventasCliente);
        return mapToDashboardResponse(cliente);
    }

    private void asignarVendedorAVentasExistentes(Long clienteId, Long vendedorId) {
        UsuarioAdmin vendedor = usuarioAdminRepository.findById(vendedorId)
                .orElseThrow(() -> new ResourceNotFoundException("Vendedor no encontrado"));
        List<Venta> ventasCliente = ventaRepository.findByClienteIdOrderByFechaVentaDesc(clienteId);
        if (ventasCliente.isEmpty()) {
            return;
        }
        ventasCliente.forEach(venta -> venta.setVendedor(vendedor));
        ventaRepository.saveAll(ventasCliente);
    }

    @Override
    @Transactional
    public ClienteDashboardResponse cambiarEstadoCliente(Long clienteId, String nuevoEstadoNombre) {
        Cliente cliente = clienteRepository.findByIdAndActivoTrue(clienteId)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado"));

        EstadoCliente viejoEstado = cliente.getEstado();
        EstadoCliente nuevoEstado = estadoClienteRepository.findByNombreAndActivoTrue(nuevoEstadoNombre)
                .orElseGet(() -> {
                    EstadoCliente e = new EstadoCliente();
                    e.setNombre(nuevoEstadoNombre);
                    e.setDescripcion("Estado " + nuevoEstadoNombre);
                    return estadoClienteRepository.save(e);
                });

        cliente.setEstado(nuevoEstado);
        clienteRepository.save(cliente);

        HistorialEstadoCliente h = new HistorialEstadoCliente();
        h.setCliente(cliente);
        h.setEstadoAnterior(viejoEstado);
        h.setEstadoNuevo(nuevoEstado);
        h.setMotivo("Cambio de estado a " + nuevoEstadoNombre);
        h.setFechaCambio(LocalDateTime.now());
        historialEstadoClienteRepository.save(h);

        return mapToDashboardResponse(cliente);
    }

    @Override
    @Transactional
    public void eliminarClientePermanentemente(Long clienteId) {
        Cliente cliente = clienteRepository.findByIdAndActivoTrue(clienteId)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado"));

        // Se elimina en orden explícito para que también funcione con bases
        // antiguas cuyas claves foráneas todavía no tienen CASCADE.
        notificacionRepository.deleteByClienteId(clienteId);
        historialEstadoClienteRepository.deleteByClienteId(clienteId);
        encuestaInicialRepository.deleteByClienteId(clienteId);

        List<Venta> ventas = ventaRepository.findByClienteIdOrderByFechaVentaDesc(clienteId);
        for (Venta venta : ventas) {
            ventaRepository.findByVentaAnteriorId(venta.getId()).forEach(dependiente -> {
                dependiente.setVentaAnterior(null);
                ventaRepository.save(dependiente);
            });
            pagoRepository.deleteAll(pagoRepository.findByVentaId(venta.getId()));
        }

        servicioClienteRepository.deleteAll(servicioClienteRepository.findByClienteIdOrderByFechaInicioDesc(clienteId));
        ventaRepository.deleteAll(ventas);
        clienteRepository.delete(cliente);
    }

    private void registrarHistorial(Cliente cliente, EstadoCliente viejo, EstadoCliente nuevo, UsuarioAdmin usuario, String motivo) {
        HistorialEstadoCliente h = new HistorialEstadoCliente();
        h.setCliente(cliente);
        h.setEstadoAnterior(viejo);
        h.setEstadoNuevo(nuevo);
        h.setUsuarioAdmin(usuario);
        h.setMotivo(motivo);
        h.setFechaCambio(LocalDateTime.now());
        historialEstadoClienteRepository.save(h);
    }

    public ClienteDashboardResponse mapToDashboardResponse(Cliente c) {
        ClienteDashboardResponse res = new ClienteDashboardResponse();
        res.setId(c.getId());
        res.setRuc(c.getRuc());
        res.setUsuarioSol(c.getUsuarioSol());
        res.setClaveSolCifrada(c.getClaveSolCifrada());
        res.setRazonSocial(c.getRazonSocial());
        res.setNombreComercial(c.getNombreComercial());
        res.setDireccion(c.getDireccion());
        res.setTelefono(c.getTelefono());
        res.setEmail(c.getEmail());
        res.setNombres(c.getNombres());
        res.setApellidos(c.getApellidos());
        res.setDni(c.getDni());
        res.setEmailPersonal(c.getEmailPersonal());
        res.setTelefonoPersonal(c.getTelefonoPersonal());
        res.setDepartamento(c.getDepartamento());
        res.setProvincia(c.getProvincia());
        res.setDistrito(c.getDistrito());

        res.setUsuarioAdminFacturador(c.getUsuarioAdminFacturador());
        res.setClaveTemporal(c.getClaveTemporal());
        res.setUrlAcceso(c.getUrlAcceso());
        res.setUsuarioWsp(c.getUsuarioWsp());

        String estadoNombre = c.getEstado() != null ? c.getEstado().getNombre() : null;
        if (c.getEstado() != null) {
            res.setEstadoId(c.getEstado().getId());
            res.setEstadoNombre(estadoNombre);
        }

        if (c.getColorTag() != null) {
            res.setColorTagId(c.getColorTag().getId());
            res.setColorCodigo(c.getColorTag().getCodigo());
            res.setColorHex(c.getColorTag().getHex());
        }

        if (c.getEntorno() != null) {
            res.setEntornoId(c.getEntorno().getId());
            res.setEntornoNombre(c.getEntorno().getNombre());
        }

        ServicioCliente servicio = servicioClienteRepository.findTopByClienteIdOrderByFechaFinDesc(c.getId()).orElse(null);
        List<Venta> ventasCliente = ventaRepository.findByClienteIdOrderByFechaVentaDesc(c.getId());
        LocalDateTime ahora = LocalDateTime.now();
        Venta ventaPendiente = ventasCliente.stream()
                .filter(v -> v.getEstadoVenta() == EstadoVenta.PENDIENTE_PAGO)
                .filter(v -> !esPendienteObsoletaPorServicioActivo(v, servicio))
                .sorted(Comparator.comparing(Venta::getFechaVenta, Comparator.nullsLast(Comparator.naturalOrder())))
                .findFirst()
                .orElse(null);
        Venta ventaPendienteVencida = ventasCliente.stream()
                .filter(v -> v.getEstadoVenta() == EstadoVenta.PENDIENTE_PAGO)
                .filter(v -> !esPendienteObsoletaPorServicioActivo(v, servicio))
                .filter(v -> v.getFechaVenta() == null || !v.getFechaVenta().toLocalDate().isAfter(ahora.toLocalDate()))
                .sorted(Comparator.comparing(Venta::getFechaVenta, Comparator.nullsLast(Comparator.naturalOrder())))
                .findFirst()
                .orElse(null);
        Venta ventaPlan = ventasCliente.stream()
                .filter(v -> v.getEstadoVenta() == EstadoVenta.PAGADA)
                .findFirst()
                .orElse(ventasCliente.isEmpty() ? null : ventasCliente.get(0));
        Venta ventaParaCobro = ventaPendienteVencida != null ? ventaPendienteVencida : ventaPendiente;

        if (ventaParaCobro != null) {
            res.setVentaId(ventaParaCobro.getId());
            res.setMontoSiguienteCobro(ventaParaCobro.getMontoTotal());
            if (ventaPendienteVencida != null
                    && !"BLOQUEADO".equals(estadoNombre)
                    && !"POR_CAPACITAR".equals(estadoNombre)
                    && !"VENCIDO".equals(estadoNombre)) {
                res.setEstadoNombre("POR_COBRAR");
            }
        } else if (ventaPlan != null) {
            res.setVentaId(ventaPlan.getId());
        }

        Venta ventaConVendedor = ventaPlan != null && ventaPlan.getVendedor() != null
                ? ventaPlan
                : ventasCliente.stream()
                        .filter(v -> v.getVendedor() != null)
                        .findFirst()
                        .orElse(null);
        if (ventaConVendedor != null) {
            res.setVendedorId(ventaConVendedor.getVendedor().getId());
            res.setVendedorNombre(ventaConVendedor.getVendedor().getNombre());
        } else {
            res.setVendedorNombre("Por asignar");
        }

        if (ventaPlan != null) {
            if (ventaPlan.getSuscripcion() != null) {
                res.setPrecioPlan(ventaPlan.getSuscripcion().getPrecio());
                if (ventaPlan.getSuscripcion().getPlan() != null) {
                    res.setPlanId(ventaPlan.getSuscripcion().getPlan().getId());
                    res.setPlanNombre(ventaPlan.getSuscripcion().getPlan().getNombrePlan());
                }
                res.setTipoSuscripcion(ventaPlan.getSuscripcion().getTipoSuscripcion() != null
                        ? ventaPlan.getSuscripcion().getTipoSuscripcion().name()
                        : null);
            }
        }

        if (servicio != null) {
            res.setServicioId(servicio.getId());
            res.setFechaCapacitacion(servicio.getFechaCapacitacion());
            res.setFechaInicioServicio(servicio.getFechaInicio());
            res.setFechaFinServicio(servicio.getFechaFin());
            res.setEstadoServicio(servicio.getEstado() != null ? servicio.getEstado().name() : null);
            if (res.getMontoSiguienteCobro() == null) {
                res.setMontoSiguienteCobro(servicio.getMontoProrrateo());
            }
            res.setDiasProrrateados(servicio.getDiasProrrateados());
        }

        res.setFechaRegistro(c.getFechaRegistro());
        return res;
    }

    private ClienteDashboardResponse mapToDashboardResponseBasico(Cliente c) {
        ClienteDashboardResponse res = new ClienteDashboardResponse();
        res.setId(c.getId());
        res.setRuc(c.getRuc());
        res.setUsuarioSol(c.getUsuarioSol());
        res.setClaveSolCifrada(c.getClaveSolCifrada());
        res.setRazonSocial(c.getRazonSocial());
        res.setNombreComercial(c.getNombreComercial());
        res.setDireccion(c.getDireccion());
        res.setTelefono(c.getTelefono());
        res.setEmail(c.getEmail());
        res.setNombres(c.getNombres());
        res.setApellidos(c.getApellidos());
        res.setDni(c.getDni());
        res.setEmailPersonal(c.getEmailPersonal());
        res.setTelefonoPersonal(c.getTelefonoPersonal());
        res.setDepartamento(c.getDepartamento());
        res.setProvincia(c.getProvincia());
        res.setDistrito(c.getDistrito());
        res.setUsuarioAdminFacturador(c.getUsuarioAdminFacturador());
        res.setClaveTemporal(c.getClaveTemporal());
        res.setUrlAcceso(c.getUrlAcceso());
        res.setUsuarioWsp(c.getUsuarioWsp());
        if (c.getEntorno() != null) {
            res.setEntornoId(c.getEntorno().getId());
            res.setEntornoNombre(c.getEntorno().getNombre());
        }
        res.setEstadoNombre(c.getEstado() != null ? c.getEstado().getNombre() : null);
        res.setVendedorNombre("Por asignar");
        res.setFechaRegistro(c.getFechaRegistro());
        return res;
    }

    private boolean esPendienteObsoletaPorServicioActivo(Venta venta, ServicioCliente servicio) {
        return venta != null
                && venta.getFechaVenta() != null
                && servicio != null
                && servicio.getEstado() == EstadoServicio.ACTIVO
                && servicio.getFechaInicio() != null
                && venta.getFechaVenta().isBefore(servicio.getFechaInicio());
    }
}
