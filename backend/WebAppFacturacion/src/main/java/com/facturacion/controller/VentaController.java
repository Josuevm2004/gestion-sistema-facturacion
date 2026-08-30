package com.facturacion.controller;

import com.facturacion.entity.Venta;
import com.facturacion.request.ProcesarOperacionVentaRequest;
import com.facturacion.response.ApiResponse;
import com.facturacion.service.VentaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/admin/ventas", "/admin/ventas"})
@CrossOrigin(origins = "*")
public class VentaController {

    @Autowired
    private VentaService ventaService;

    @PostMapping({"/procesar-operacion", "/renovar-plan", "/cambiar-plan"})
    public ResponseEntity<ApiResponse<Map<String, Object>>> procesarOperacionVenta(@RequestBody ProcesarOperacionVentaRequest request) {
        Venta venta = ventaService.procesarOperacion(request);

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("id", venta.getId());
        data.put("ventaId", venta.getId());
        data.put("clienteId", venta.getCliente() != null ? venta.getCliente().getId() : null);
        data.put("tipoVenta", venta.getTipoVenta() != null ? venta.getTipoVenta().name() : null);
        data.put("estadoVenta", venta.getEstadoVenta() != null ? venta.getEstadoVenta().name() : null);
        data.put("tipoProrrateo", venta.getTipoProrrateo() != null ? venta.getTipoProrrateo().name() : null);
        data.put("montoProrrateoAdicional", venta.getMontoProrrateoAdicional());
        data.put("diasProrrateoAdicional", venta.getDiasProrrateoAdicional());
        data.put("fechaInicioProrrateoAdicional", venta.getFechaInicioProrrateoAdicional());
        data.put("fechaFinProrrateoAdicional", venta.getFechaFinProrrateoAdicional());
        data.put("montoTotal", venta.getMontoTotal());
        data.put("fechaVenta", venta.getFechaVenta());

        return ResponseEntity.ok(ApiResponse.success("Operacion comercial procesada con exito (" + venta.getTipoVenta() + ")", data));
    }

    @PostMapping("/adelanto-pago")
    public ResponseEntity<ApiResponse<Map<String, Object>>> procesarAdelantoPago(@RequestBody ProcesarOperacionVentaRequest request) {
        Venta venta = ventaService.procesarAdelantoPago(request);
        Map<String, Object> data = mapVentaResumen(venta);
        return ResponseEntity.ok(ApiResponse.success("Adelanto de pago procesado con exito", data));
    }

    @GetMapping("/cliente/{clienteId}")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> listarVentasPorCliente(@PathVariable Long clienteId) {
        List<Venta> ventas = ventaService.listarVentasPorCliente(clienteId);
        List<Map<String, Object>> data = ventas.stream().map(this::mapVentaResumen).toList();
        return ResponseEntity.ok(ApiResponse.success("Historial de ventas del cliente obtenido", data));
    }

    private Map<String, Object> mapVentaResumen(Venta venta) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("id", venta.getId());
        data.put("ventaId", venta.getId());
        data.put("clienteId", venta.getCliente() != null ? venta.getCliente().getId() : null);
        data.put("vendedorId", venta.getVendedor() != null ? venta.getVendedor().getId() : null);
        data.put("vendedorNombre", venta.getVendedor() != null ? venta.getVendedor().getNombre() : null);
        data.put("suscripcionId", venta.getSuscripcion() != null ? venta.getSuscripcion().getId() : null);
        data.put("planId", venta.getSuscripcion() != null && venta.getSuscripcion().getPlan() != null ? venta.getSuscripcion().getPlan().getId() : null);
        data.put("planNombre", venta.getSuscripcion() != null && venta.getSuscripcion().getPlan() != null ? venta.getSuscripcion().getPlan().getNombrePlan() : null);
        data.put("tipoSuscripcion", venta.getSuscripcion() != null && venta.getSuscripcion().getTipoSuscripcion() != null ? venta.getSuscripcion().getTipoSuscripcion().name() : null);
        data.put("tipoVenta", venta.getTipoVenta() != null ? venta.getTipoVenta().name() : null);
        data.put("estadoVenta", venta.getEstadoVenta() != null ? venta.getEstadoVenta().name() : null);
        data.put("precioLista", venta.getPrecioLista());
        data.put("montoProrrateado", venta.getMontoProrrateado());
        data.put("tipoProrrateo", venta.getTipoProrrateo() != null ? venta.getTipoProrrateo().name() : null);
        data.put("montoProrrateoAdicional", venta.getMontoProrrateoAdicional());
        data.put("diasProrrateoAdicional", venta.getDiasProrrateoAdicional());
        data.put("fechaInicioProrrateoAdicional", venta.getFechaInicioProrrateoAdicional());
        data.put("fechaFinProrrateoAdicional", venta.getFechaFinProrrateoAdicional());
        data.put("montoTotal", venta.getMontoTotal());
        data.put("fechaVenta", venta.getFechaVenta());
        data.put("observaciones", venta.getObservaciones());
        return data;
    }
}
