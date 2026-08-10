package com.facturacion.service;

import com.facturacion.request.RegistroFormularioRequest;
import com.facturacion.response.DetalleClienteResponse;

public interface FormularioRegistroService {
    DetalleClienteResponse registrarCliente(RegistroFormularioRequest request);
}
