package com.facturacion.controller;

import com.facturacion.entity.Cliente;
import com.facturacion.entity.Pago;
import com.facturacion.entity.ServicioCliente;
import com.facturacion.entity.Venta;
import com.facturacion.enums.EstadoPago;
import com.facturacion.enums.EstadoServicio;
import com.facturacion.enums.EstadoVenta;
import com.facturacion.enums.TipoProrrateo;
import com.facturacion.enums.TipoSuscripcion;
import com.facturacion.repository.ClienteRepository;
import com.facturacion.repository.PagoRepository;
import com.facturacion.repository.ServicioClienteRepository;
import com.facturacion.repository.VentaRepository;
import com.facturacion.response.ApiResponse;
import com.facturacion.util.ProrrateoCalculatorUtil;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.InputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping({"/api/admin/motor-python", "/admin/motor-python"})
@CrossOrigin(origins = "*")
public class PythonMotorController {

    private static final String[] MESES_NOMBRES = {
            "", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
            "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    };

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ClienteRepository clienteRepository;

    @Autowired
    private VentaRepository ventaRepository;

    @Autowired
    private ServicioClienteRepository servicioClienteRepository;

    @Autowired
    private PagoRepository pagoRepository;

    @Value("${app.billing.monthly-billing-day:1}")
    private int monthlyBillingDay;

    @GetMapping("/proyeccion-mes")
    public ResponseEntity<ApiResponse<Map<String, Object>>> obtenerProyeccionMes() {
        try {
            byte[] stdout = ejecutarScriptPython("proyeccion-mes", null);
            Map<String, Object> result = objectMapper.readValue(stdout, new TypeReference<>() {});
            return ResponseEntity.ok(ApiResponse.success("Proyección calculada con motor Python", result));
        } catch (Exception ex) {
            Map<String, Object> fallback = calcularProyeccionFallback();
            return ResponseEntity.ok(ApiResponse.success("Proyección calculada", fallback));
        }
    }

    @GetMapping("/auditoria-cartera")
    public ResponseEntity<Map<String, Object>> auditarCartera() {
        List<Map<String, Object>> data;
        try {
            byte[] stdout = ejecutarScriptPython("auditoria-cartera", null);
            data = objectMapper.readValue(stdout, new TypeReference<>() {});
        } catch (Exception ex) {
            data = auditarCarteraFallback();
        }
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("success", true);
        body.put("count", data.size());
        body.put("data", data);
        return ResponseEntity.ok(body);
    }

    @PostMapping("/calcular-prorrateo")
    public ResponseEntity<ApiResponse<Map<String, Object>>> calcularProrrateoPython(@RequestBody Map<String, Object> payload) {
        try {
            String jsonArgs = objectMapper.writeValueAsString(payload);
            byte[] stdout = ejecutarScriptPython("calcular-prorrateo", jsonArgs);
            Map<String, Object> result = objectMapper.readValue(stdout, new TypeReference<>() {});
            return ResponseEntity.ok(ApiResponse.success("Prorrateo calculado con motor Python", result));
        } catch (Exception ex) {
            Map<String, Object> fallback = calcularProrrateoFallback(payload);
            return ResponseEntity.ok(ApiResponse.success("Prorrateo calculado", fallback));
        }
    }

    @GetMapping("/reporte-excel-oficial")
    public ResponseEntity<byte[]> generarReporteExcelOficial() {
        try {
            byte[] excelBytes = ejecutarScriptPython("reporte-excel-oficial", null);
            String dateStr = LocalDate.now().toString();
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"Reporte_Oficial_Consolidado_" + dateStr + ".xlsx\"")
                    .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                    .body(excelBytes);
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().build();
        }
    }

    private byte[] ejecutarScriptPython(String comando, String jsonPayload) throws Exception {
        File scriptFile = resolverRutaScriptPython();
        if (scriptFile == null || !scriptFile.exists()) {
            throw new IllegalStateException("Script motor_financiero.py no encontrado");
        }

        List<String> pythonBins = List.of("python3", "python");
        Exception lastException = null;

        for (String bin : pythonBins) {
            try {
                List<String> cmd = new ArrayList<>();
                cmd.add(bin);
                cmd.add(scriptFile.getAbsolutePath());
                cmd.add(comando);
                if (jsonPayload != null && !jsonPayload.isBlank()) {
                    cmd.add(jsonPayload);
                }

                ProcessBuilder pb = new ProcessBuilder(cmd);
                pb.directory(scriptFile.getParentFile());
                Process process = pb.start();

                ByteArrayOutputStream stdoutBuf = new ByteArrayOutputStream();
                ByteArrayOutputStream stderrBuf = new ByteArrayOutputStream();

                try (InputStream out = process.getInputStream(); InputStream err = process.getErrorStream()) {
                    out.transferTo(stdoutBuf);
                    err.transferTo(stderrBuf);
                }

                boolean finished = process.waitFor(25, TimeUnit.SECONDS);
                if (!finished) {
                    process.destroyForcibly();
                    throw new IllegalStateException("Timeout ejecutando motor Python");
                }

                if (process.exitValue() == 0 && stdoutBuf.size() > 0) {
                    return stdoutBuf.toByteArray();
                } else {
                    lastException = new IllegalStateException(stderrBuf.toString(StandardCharsets.UTF_8));
                }
            } catch (Exception e) {
                lastException = e;
            }
        }
        throw lastException != null ? lastException : new IllegalStateException("No se pudo ejecutar Python");
    }

    private File resolverRutaScriptPython() {
        String[] candidates = {
                "/app/python/motor_financiero.py",
                "python/motor_financiero.py",
                "backend/WebAppFacturacion/python/motor_financiero.py"
        };
        for (String path : candidates) {
            File f = new File(path);
            if (f.exists()) {
                return f;
            }
        }
        return null;
    }

    private Map<String, Object> calcularProyeccionFallback() {
        List<Cliente> clientes = clienteRepository.findByActivoTrue();
        List<Long> ids = clientes.stream().map(Cliente::getId).filter(Objects::nonNull).toList();

        Map<Long, ServicioCliente> servicioMap = new HashMap<>();
        if (!ids.isEmpty()) {
            for (ServicioCliente s : servicioClienteRepository.findByClienteIdInOrderByFechaFinDesc(ids)) {
                if (s.getCliente() != null && s.getCliente().getId() != null) {
                    servicioMap.putIfAbsent(s.getCliente().getId(), s);
                }
            }
        }

        Map<Long, List<Venta>> ventasMap = new HashMap<>();
        if (!ids.isEmpty()) {
            for (Venta v : ventaRepository.findByClienteIdInOrderByFechaVentaDesc(ids)) {
                if (v.getCliente() != null && v.getCliente().getId() != null) {
                    ventasMap.computeIfAbsent(v.getCliente().getId(), k -> new ArrayList<>()).add(v);
                }
            }
        }

        LocalDate hoy = LocalDate.now();
        int nextMonth = hoy.getMonthValue() == 12 ? 1 : hoy.getMonthValue() + 1;
        int nextYear = hoy.getMonthValue() == 12 ? hoy.getYear() + 1 : hoy.getYear();
        String periodoProyectado = MESES_NOMBRES[nextMonth] + " " + nextYear;

        BigDecimal totalProyectado = BigDecimal.ZERO;
        BigDecimal totalRegulares = BigDecimal.ZERO;
        BigDecimal totalProrrateados = BigDecimal.ZERO;
        int countRegulares = 0;
        int countProrrateados = 0;
        int countAnualesSinCobro = 0;
        int clientesNoBloqueados = 0;
        List<Map<String, Object>> desglose = new ArrayList<>();

        for (Cliente c : clientes) {
            String estadoNombre = c.getEstado() != null ? c.getEstado().getNombre() : "HABILITADO";
            if ("BLOQUEADO".equalsIgnoreCase(estadoNombre)) {
                continue;
            }
            clientesNoBloqueados++;

            List<Venta> ventas = ventasMap.getOrDefault(c.getId(), List.of());
            Venta ventaPendiente = ventas.stream()
                    .filter(v -> v.getEstadoVenta() == EstadoVenta.PENDIENTE_PAGO)
                    .min(Comparator.comparing(Venta::getFechaVenta, Comparator.nullsLast(Comparator.naturalOrder())))
                    .orElse(null);
            Venta ventaPagada = ventas.stream()
                    .filter(v -> v.getEstadoVenta() == EstadoVenta.PAGADA)
                    .findFirst()
                    .orElse(ventas.isEmpty() ? null : ventas.get(0));
            Venta refVenta = ventaPendiente != null ? ventaPendiente : ventaPagada;

            TipoSuscripcion tipoSub = (refVenta != null && refVenta.getSuscripcion() != null && refVenta.getSuscripcion().getTipoSuscripcion() != null)
                    ? refVenta.getSuscripcion().getTipoSuscripcion()
                    : TipoSuscripcion.MENSUAL;
            BigDecimal tarifaBase = (refVenta != null && refVenta.getSuscripcion() != null && refVenta.getSuscripcion().getPrecio() != null)
                    ? refVenta.getSuscripcion().getPrecio()
                    : BigDecimal.valueOf(29);
            String nombrePlan = (refVenta != null && refVenta.getSuscripcion() != null && refVenta.getSuscripcion().getPlan() != null)
                    ? refVenta.getSuscripcion().getPlan().getNombrePlan()
                    : "Plan Emprende";

            ServicioCliente sc = servicioMap.get(c.getId());
            if (tipoSub == TipoSuscripcion.ANUAL) {
                if (sc != null && sc.getFechaFin() != null && sc.getFechaFin().toLocalDate().isAfter(hoy.plusDays(32))) {
                    countAnualesSinCobro++;
                    continue;
                }
            }

            TipoProrrateo tipoProrr = refVenta != null && refVenta.getTipoProrrateo() != null
                    ? refVenta.getTipoProrrateo()
                    : TipoProrrateo.NINGUNO;
            BigDecimal montoAdic = refVenta != null && refVenta.getMontoProrrateoAdicional() != null
                    ? refVenta.getMontoProrrateoAdicional()
                    : BigDecimal.ZERO;

            BigDecimal montoACobrar = tarifaBase;
            boolean esProrrateado = false;
            String concepto = "Tarifa Base (" + nombrePlan + ")";

            if (tipoProrr == TipoProrrateo.SEGUNDO_PRORRATEO && montoAdic.compareTo(BigDecimal.ZERO) > 0) {
                montoACobrar = (ventaPendiente != null && ventaPendiente.getMontoTotal() != null && ventaPendiente.getMontoTotal().compareTo(tarifaBase) > 0)
                        ? ventaPendiente.getMontoTotal()
                        : tarifaBase.add(montoAdic);
                esProrrateado = true;
                concepto = "Segundo Prorrateo (Mes S/ " + tarifaBase.setScale(2, RoundingMode.HALF_UP) + " + Adic. S/ " + montoAdic.setScale(2, RoundingMode.HALF_UP) + ")";
            } else if (tipoProrr == TipoProrrateo.PRIMER_PRORRATEO && ventaPendiente != null && ventaPendiente.getMontoTotal() != null
                    && ventaPendiente.getMontoTotal().compareTo(BigDecimal.ZERO) > 0
                    && ventaPendiente.getMontoTotal().compareTo(tarifaBase) < 0) {
                montoACobrar = ventaPendiente.getMontoTotal();
                esProrrateado = true;
                concepto = "Primer Prorrateo (S/ " + montoACobrar.setScale(2, RoundingMode.HALF_UP) + ")";
            }

            totalProyectado = totalProyectado.add(montoACobrar);
            if (esProrrateado) {
                totalProrrateados = totalProrrateados.add(montoACobrar);
                countProrrateados++;
            } else {
                totalRegulares = totalRegulares.add(montoACobrar);
                countRegulares++;
            }

            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", String.valueOf(c.getId()));
            item.put("ruc", c.getRuc());
            item.put("razon_social", c.getRazonSocial() != null ? c.getRazonSocial() : "");
            item.put("monto", montoACobrar.setScale(2, RoundingMode.HALF_UP).doubleValue());
            item.put("es_prorrateado", esProrrateado);
            item.put("concepto", concepto);
            item.put("tarifa_base", tarifaBase.setScale(2, RoundingMode.HALF_UP).doubleValue());
            item.put("estado_cuenta", estadoNombre);
            desglose.add(item);
        }

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("periodo_proyectado", periodoProyectado);
        res.put("total_proyectado", totalProyectado.setScale(2, RoundingMode.HALF_UP).doubleValue());
        res.put("total_regulares", totalRegulares.setScale(2, RoundingMode.HALF_UP).doubleValue());
        res.put("total_prorrateados", totalProrrateados.setScale(2, RoundingMode.HALF_UP).doubleValue());
        res.put("clientes_no_bloqueados", clientesNoBloqueados);
        res.put("count_regulares", countRegulares);
        res.put("count_prorrateados", countProrrateados);
        res.put("count_anuales_sin_cobro", countAnualesSinCobro);
        res.put("desglose", desglose);
        return res;
    }

    private List<Map<String, Object>> auditarCarteraFallback() {
        List<Cliente> clientes = clienteRepository.findByActivoTrue();
        List<Long> ids = clientes.stream().map(Cliente::getId).filter(Objects::nonNull).toList();
        if (ids.isEmpty()) return List.of();

        Map<Long, ServicioCliente> servicioMap = new HashMap<>();
        for (ServicioCliente s : servicioClienteRepository.findByClienteIdInOrderByFechaFinDesc(ids)) {
            if (s.getCliente() != null && s.getCliente().getId() != null) {
                servicioMap.putIfAbsent(s.getCliente().getId(), s);
            }
        }

        List<Pago> todosPagos = pagoRepository.findAllWithDetails();
        Map<Long, List<Pago>> pagosPorCliente = new HashMap<>();
        for (Pago p : todosPagos) {
            if (p.getEstadoPago() == EstadoPago.PAGADO && p.getVenta() != null && p.getVenta().getCliente() != null) {
                pagosPorCliente.computeIfAbsent(p.getVenta().getCliente().getId(), k -> new ArrayList<>()).add(p);
            }
        }

        LocalDateTime ahora = LocalDateTime.now();
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        List<Map<String, Object>> hallazgos = new ArrayList<>();

        for (Cliente c : clientes) {
            ServicioCliente sc = servicioMap.get(c.getId());
            List<Pago> pagos = pagosPorCliente.getOrDefault(c.getId(), List.of());
            String estadoCuenta = c.getEstado() != null ? c.getEstado().getNombre() : "HABILITADO";

            List<String> anomalias = new ArrayList<>();
            if (sc != null && sc.getEstado() == EstadoServicio.ACTIVO && pagos.isEmpty()) {
                anomalias.add("SERVICIO_ACTIVO_SIN_PAGOS");
            }
            if (sc != null && sc.getFechaFin() != null && sc.getFechaFin().isBefore(ahora) && "HABILITADO".equalsIgnoreCase(estadoCuenta)) {
                anomalias.add("VENCIDO_NO_SUSPENDIDO");
            }
            if (sc == null) {
                anomalias.add("SIN_SERVICIO_PROGRAMADO");
            }

            if (!anomalias.isEmpty()) {
                BigDecimal totalRecaudado = pagos.stream()
                        .map(Pago::getMonto)
                        .filter(Objects::nonNull)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
                LocalDateTime ultimoPago = pagos.stream()
                        .map(Pago::getFechaPago)
                        .filter(Objects::nonNull)
                        .max(LocalDateTime::compareTo)
                        .orElse(null);

                Map<String, Object> item = new LinkedHashMap<>();
                item.put("cliente_id", String.valueOf(c.getId()));
                item.put("ruc", c.getRuc());
                item.put("razon_social", c.getRazonSocial() != null ? c.getRazonSocial() : "");
                item.put("telefono", c.getTelefono() != null ? c.getTelefono() : "");
                item.put("plan", "Plan Emprende");
                item.put("tarifa", 29.0);
                item.put("total_recaudado", totalRecaudado.doubleValue());
                item.put("ultimo_pago", ultimoPago != null ? ultimoPago.format(fmt) : "Nunca");
                item.put("fecha_fin_servicio", sc != null && sc.getFechaFin() != null ? sc.getFechaFin().format(fmt) : "Sin asignar");
                item.put("anomalias", String.join(", ", anomalias));
                item.put("criticidad", anomalias.contains("SERVICIO_ACTIVO_SIN_PAGOS") ? "ALTA" : "MEDIA");
                hallazgos.add(item);
            }
        }
        return hallazgos;
    }

    private Map<String, Object> calcularProrrateoFallback(Map<String, Object> payload) {
        BigDecimal precio = payload.get("precio_plan") != null
                ? new BigDecimal(String.valueOf(payload.get("precio_plan")))
                : BigDecimal.valueOf(29);
        String fechaStr = payload.get("fecha_inicio") != null
                ? String.valueOf(payload.get("fecha_inicio")).split("T")[0]
                : LocalDate.now().toString();
        LocalDate fechaInicio = LocalDate.parse(fechaStr);
        String tipoSub = payload.get("tipo_suscripcion") != null
                ? String.valueOf(payload.get("tipo_suscripcion")).toUpperCase()
                : "MENSUAL";

        Map<String, Object> res = new LinkedHashMap<>();
        if ("ANUAL".equals(tipoSub)) {
            LocalDate fechaFin = fechaInicio.plusYears(1);
            res.put("tipoProrrateo", "NINGUNO");
            res.put("tipoSuscripcion", "ANUAL");
            res.put("precioPlan", precio.doubleValue());
            res.put("fechaInicio", fechaInicio.toString());
            res.put("fechaFin", fechaFin.toString());
            res.put("fechaCobroSiguiente", fechaFin.toString());
            res.put("diasTotales", 365);
            res.put("diaCapacitacion", fechaInicio.getDayOfMonth());
            res.put("diasCobrados", 365);
            res.put("diasNoConsumidos", 0);
            res.put("descuento", 0.0);
            res.put("montoProrrateado", precio.doubleValue());
            res.put("montoAdicional", 0.0);
            res.put("diasProrrateoAdicional", 0);
            res.put("montoTotal", precio.doubleValue());
            return res;
        }

        if (fechaInicio.getDayOfMonth() >= ProrrateoCalculatorUtil.SECOND_PRORATION_TRANSITION_DAY) {
            ProrrateoCalculatorUtil.ResultadoSegundoProrrateo seg = ProrrateoCalculatorUtil.calcularSegundoProrrateo(precio, fechaInicio);
            LocalDate fechaCobro = seg.fechaFin().plusDays(1);
            BigDecimal total = precio.add(seg.montoAdicional());
            res.put("tipoProrrateo", "SEGUNDO_PRORRATEO");
            res.put("tipoSuscripcion", "MENSUAL");
            res.put("precioPlan", precio.doubleValue());
            res.put("fechaInicio", fechaInicio.toString());
            res.put("fechaFin", fechaCobro.toString());
            res.put("fechaCobroSiguiente", fechaCobro.toString());
            res.put("diasTotales", seg.fechaInicio().lengthOfMonth());
            res.put("diaCapacitacion", fechaInicio.getDayOfMonth());
            res.put("diasCobrados", seg.diasProrrateados());
            res.put("diasNoConsumidos", 0);
            res.put("descuento", 0.0);
            res.put("montoProrrateado", total.doubleValue());
            res.put("montoAdicional", seg.montoAdicional().doubleValue());
            res.put("diasProrrateoAdicional", seg.diasProrrateados());
            res.put("fechaInicioProrrateoAdicional", seg.fechaInicio().toString());
            res.put("fechaFinProrrateoAdicional", seg.fechaFin().toString());
            res.put("montoTotal", total.doubleValue());
            return res;
        }

        ProrrateoCalculatorUtil.ResultadoProrrateo pri = ProrrateoCalculatorUtil.calcularHastaDiaCobro(precio, fechaInicio, monthlyBillingDay);
        LocalDate fechaFin = ProrrateoCalculatorUtil.calcularFechaFinMensual(fechaInicio, monthlyBillingDay);
        res.put("tipoProrrateo", "PRIMER_PRORRATEO");
        res.put("tipoSuscripcion", "MENSUAL");
        res.put("precioPlan", precio.doubleValue());
        res.put("fechaInicio", fechaInicio.toString());
        res.put("fechaFin", fechaFin.toString());
        res.put("fechaCobroSiguiente", fechaFin.toString());
        res.put("diasTotales", pri.diasTotales());
        res.put("diaCapacitacion", pri.diaCapacitacion());
        res.put("diasCobrados", Math.max(1, pri.diasTotales() - pri.diasNoConsumidos()));
        res.put("diasNoConsumidos", pri.diasNoConsumidos());
        res.put("descuento", pri.descuento().doubleValue());
        res.put("montoProrrateado", pri.montoFinal().doubleValue());
        res.put("montoAdicional", 0.0);
        res.put("diasProrrateoAdicional", 0);
        res.put("montoTotal", pri.montoFinal().doubleValue());
        return res;
    }
}

