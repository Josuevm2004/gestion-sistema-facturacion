package com.facturacion.response;

import java.util.List;

public class DetalleClienteResponse {

    private ClienteDashboardResponse cliente;
    private List<Object> ventasHistorial;
    private List<Object> pagosHistorial;
    private List<OperacionHistorialResponse> operacionesHistorial;
    private List<Object> estadosHistorial;

    public DetalleClienteResponse() {}

    public ClienteDashboardResponse getCliente() { return cliente; }
    public void setCliente(ClienteDashboardResponse cliente) { this.cliente = cliente; }
    public List<Object> getVentasHistorial() { return ventasHistorial; }
    public void setVentasHistorial(List<Object> ventasHistorial) { this.ventasHistorial = ventasHistorial; }
    public List<Object> getPagosHistorial() { return pagosHistorial; }
    public void setPagosHistorial(List<Object> pagosHistorial) { this.pagosHistorial = pagosHistorial; }
    public List<OperacionHistorialResponse> getOperacionesHistorial() { return operacionesHistorial; }
    public void setOperacionesHistorial(List<OperacionHistorialResponse> operacionesHistorial) { this.operacionesHistorial = operacionesHistorial; }
    public List<Object> getEstadosHistorial() { return estadosHistorial; }
    public void setEstadosHistorial(List<Object> estadosHistorial) { this.estadosHistorial = estadosHistorial; }
}
