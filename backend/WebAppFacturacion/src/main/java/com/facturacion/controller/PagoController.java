package com.facturacion.controller;

import com.facturacion.entity.Pago;
import com.facturacion.request.RegistrarPagoRequest;
import com.facturacion.response.ApiResponse;
import com.facturacion.service.PagoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/admin/pagos", "/admin/pagos"})
@CrossOrigin(origins = "*")
public class PagoController {

    @Autowired
    private PagoService pagoService;

    @PostMapping({"/registrar", "/confirmar"})
    public ResponseEntity<ApiResponse<Map<String, Object>>> registrarPago(@RequestBody RegistrarPagoRequest request) {
        Pago pago = pagoService.registrarPago(request);
        return ResponseEntity.ok(ApiResponse.success("Pago registrado exitosamente", mapPago(pago)));
    }

    @GetMapping({"", "/"})
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> listarTodosPagos() {
        List<Pago> pagos = pagoService.listarTodosPagos();
        return ResponseEntity.ok(ApiResponse.success("Listado de pagos obtenido", pagos.stream().map(this::mapPago).toList()));
    }

    @GetMapping("/cliente/{clienteId}")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> listarPagosPorCliente(@PathVariable Long clienteId) {
        List<Pago> pagos = pagoService.listarPagosPorCliente(clienteId);
        return ResponseEntity.ok(ApiResponse.success("Historial de pagos obtenido", pagos.stream().map(this::mapPago).toList()));
    }

    private Map<String, Object> mapPago(Pago pago) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("id", pago.getId());
        data.put("pagoId", pago.getId());
        data.put("ventaId", pago.getVenta() != null ? pago.getVenta().getId() : null);
        data.put("clienteId", pago.getVenta() != null && pago.getVenta().getCliente() != null ? pago.getVenta().getCliente().getId() : null);
        data.put("codigoOperacion", pago.getCodigoOperacion());
        data.put("monto", pago.getMonto());
        data.put("medioPago", pago.getMedioPago() != null ? pago.getMedioPago().name() : null);
        data.put("estadoPago", pago.getEstadoPago() != null ? pago.getEstadoPago().name() : null);
        data.put("fechaPago", pago.getFechaPago());
        data.put("fechaRegistro", pago.getFechaRegistro());
        data.put("comprobanteUrl", pago.getComprobanteUrl());
        data.put("observaciones", pago.getObservaciones());

        if (pago.getVenta() != null) {
            Map<String, Object> venta = new LinkedHashMap<>();
            venta.put("id", pago.getVenta().getId());
            venta.put("clienteId", pago.getVenta().getCliente() != null ? pago.getVenta().getCliente().getId() : null);
            venta.put("montoTotal", pago.getVenta().getMontoTotal());
            venta.put("tipoProrrateo", pago.getVenta().getTipoProrrateo() != null
                    ? pago.getVenta().getTipoProrrateo().name()
                    : null);
            venta.put("montoProrrateoAdicional", pago.getVenta().getMontoProrrateoAdicional());
            venta.put("diasProrrateoAdicional", pago.getVenta().getDiasProrrateoAdicional());
            venta.put("fechaInicioProrrateoAdicional", pago.getVenta().getFechaInicioProrrateoAdicional());
            venta.put("fechaFinProrrateoAdicional", pago.getVenta().getFechaFinProrrateoAdicional());
            venta.put("estadoVenta", pago.getVenta().getEstadoVenta() != null ? pago.getVenta().getEstadoVenta().name() : null);
            if (pago.getVenta().getTipoVenta() != null) {
                venta.put("tipoVenta", pago.getVenta().getTipoVenta().name());
                data.put("tipoVenta", pago.getVenta().getTipoVenta().name());
            }
            if (pago.getVenta().getSuscripcion() != null) {
                if (pago.getVenta().getSuscripcion().getPlan() != null) {
                    venta.put("plan", pago.getVenta().getSuscripcion().getPlan().getNombrePlan());
                    venta.put("planNombre", pago.getVenta().getSuscripcion().getPlan().getNombrePlan());
                    data.put("planNombre", pago.getVenta().getSuscripcion().getPlan().getNombrePlan());
                }
                venta.put("tipoSuscripcion", pago.getVenta().getSuscripcion().getTipoSuscripcion() != null ? pago.getVenta().getSuscripcion().getTipoSuscripcion().name() : null);
                data.put("tipoSuscripcion", pago.getVenta().getSuscripcion().getTipoSuscripcion() != null ? pago.getVenta().getSuscripcion().getTipoSuscripcion().name() : null);
            }
            if (pago.getVenta().getCliente() != null) {
                Map<String, Object> cli = new LinkedHashMap<>();
                cli.put("id", pago.getVenta().getCliente().getId());
                cli.put("ruc", pago.getVenta().getCliente().getRuc());
                cli.put("razonSocial", pago.getVenta().getCliente().getRazonSocial());
                cli.put("regimenTributario", pago.getVenta().getCliente().getRegimenTributario() != null ? pago.getVenta().getCliente().getRegimenTributario().name() : "GENERAL");
                venta.put("cliente", cli);
                data.put("clienteRuc", pago.getVenta().getCliente().getRuc());
                data.put("clienteRazonSocial", pago.getVenta().getCliente().getRazonSocial());
            }
            if (pago.getVenta().getVendedor() != null) {
                Map<String, Object> vendedor = new LinkedHashMap<>();
                vendedor.put("id", pago.getVenta().getVendedor().getId());
                vendedor.put("nombre", pago.getVenta().getVendedor().getNombre());
                vendedor.put("username", pago.getVenta().getVendedor().getUsername());
                venta.put("vendedor", vendedor);
                data.put("vendedorNombre", pago.getVenta().getVendedor().getNombre());
            }
            data.put("venta", venta);
        }

        return data;
    }
}
