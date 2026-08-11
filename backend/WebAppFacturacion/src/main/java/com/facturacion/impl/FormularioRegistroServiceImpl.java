package com.facturacion.impl;

import com.facturacion.entity.*;
import com.facturacion.enums.EstadoCuenta;
import com.facturacion.enums.EstadoPago;
import com.facturacion.enums.MedioPago;
import com.facturacion.repository.*;
import com.facturacion.request.RegistroFormularioRequest;
import com.facturacion.response.DetalleClienteResponse;
import com.facturacion.service.FormularioRegistroService;
import com.facturacion.service.NotificacionEmailService;
import com.facturacion.service.NotificacionWhatsAppService;
import com.facturacion.util.AESEncryptionUtil;
import com.facturacion.util.DateUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class FormularioRegistroServiceImpl implements FormularioRegistroService {

    @Autowired
    private ClienteRepository clienteRepository;

    @Autowired
    private PagoRepository pagoRepository;

    @Autowired(required = false)
    private UbigeoRepository ubigeoRepository;

    @Autowired
    private CredencialSolRepository credencialSolRepository;

    @Autowired
    private EncuestaInicialRepository encuestaInicialRepository;

    @Autowired
    private AccesoSistemaRepository accesoSistemaRepository;

    @Autowired
    private AESEncryptionUtil aesEncryptionUtil;



    @Override
    @Transactional
    public DetalleClienteResponse registrarCliente(RegistroFormularioRequest request) {
        if (clienteRepository.findByRuc(request.getRuc()).isPresent()) {
            throw new IllegalArgumentException("El RUC " + request.getRuc() + " ya se encuentra registrado en la plataforma.");
        }

        Cliente cliente = Cliente.builder()
                .ruc(request.getRuc())
                .razonSocial(request.getRazonSocial())
                .nombreComercial(request.getNombreComercial())
                .direccion(request.getDireccion())
                .telefono(request.getTelefono())
                .email(request.getEmail())
                .regimenTributario(request.getRegimenTributario())
                .planContratado(request.getPlanContratado())
                .montoMensual(request.getPlanContratado().getPrecioMensual())
                .estadoCuenta(EstadoCuenta.POR_COBRAR)
                .fechaVencimientoMensual(LocalDateTime.now().plusMonths(1))
                .build();
        cliente.setTipoSuscripcion(request.getTipoSuscripcion() != null ? request.getTipoSuscripcion() : com.facturacion.enums.TipoSuscripcion.MENSUAL);
        cliente.setColorTag(com.facturacion.enums.ColorTag.VERDE);
        cliente.setNombres(request.getNombres());
        cliente.setApellidos(request.getApellidos());
        cliente.setDni(request.getDni());
        cliente.setEmailPersonal(request.getEmailPersonal());
        cliente.setTelefonoPersonal(request.getTelefonoPersonal());
        cliente.setDepartamento(request.getDepartamento());
        cliente.setProvincia(request.getProvincia());
        cliente.setDistrito(request.getDistrito());

        cliente = clienteRepository.save(cliente);

        String claveSolCifrada = aesEncryptionUtil.encrypt(request.getClaveSol());
        CredencialSol credencialSol = CredencialSol.builder()
                .cliente(cliente)
                .usuarioSol(request.getUsuarioSol())
                .claveSolCifrada(claveSolCifrada)
                .build();
        credencialSolRepository.save(credencialSol);

        EncuestaInicial encuesta = EncuestaInicial.builder()
                .cliente(cliente)
                .comoNosConocio(request.getComoNosConocio())
                .usoSistemaAnterior(request.getUsoSistemaAnterior())
                .volumenFacturacionEstimado(request.getVolumenFacturacionEstimado())
                .comentarios(request.getComentarios())
                .build();
        encuestaInicialRepository.save(encuesta);

        String subdominioBase = request.getRazonSocial() != null
                ? request.getRazonSocial().replaceAll("[^a-zA-Z0-9]", "").toLowerCase()
                : "factura";
        if (subdominioBase.length() < 3) {
            subdominioBase = "factura" + (cliente.getId() != null ? cliente.getId() : System.currentTimeMillis());
        }

        String subdominioSanitizado = subdominioBase;
        int counter = 1;
        while (accesoSistemaRepository.findBySubdominio(subdominioSanitizado).isPresent()) {
            subdominioSanitizado = subdominioBase + counter;
            counter++;
        }

        String claveTemporal = UUID.randomUUID().toString().substring(0, 8);
        String urlAcceso = "https://" + subdominioSanitizado + ".facturacionperu.pe";

        AccesoSistema acceso = AccesoSistema.builder()
                .cliente(cliente)
                .subdominio(subdominioSanitizado)
                .usuarioAdminFacturador("admin@" + subdominioSanitizado)
                .claveTemporal(claveTemporal)
                .urlAcceso(urlAcceso)
                .activo(true)
                .build();
        accesoSistemaRepository.save(acceso);

        Pago pagoInicial = Pago.builder()
                .cliente(cliente)
                .monto(cliente.getMontoMensual())
                .medioPago(MedioPago.OTRO)
                .estadoPago(EstadoPago.PENDIENTE_PAGO)
                .periodoMesAno(DateUtils.getCurrentPeriod())
                .observaciones("Pago inicial de suscripción al plan " + cliente.getPlanContratado().name())
                .build();

        pagoRepository.save(pagoInicial);



        return DetalleClienteResponse.builder()
                .id(cliente.getId())
                .ruc(cliente.getRuc())
                .razonSocial(cliente.getRazonSocial())
                .nombreComercial(cliente.getNombreComercial())
                .direccion(cliente.getDireccion())
                .telefono(cliente.getTelefono())
                .email(cliente.getEmail())
                .regimenTributario(cliente.getRegimenTributario())
                .planContratado(cliente.getPlanContratado())
                .montoMensual(cliente.getMontoMensual())
                .estadoCuenta(cliente.getEstadoCuenta())
                .estadoCapacitacion(cliente.getEstadoCapacitacion())
                .fechaRegistro(cliente.getFechaRegistro())
                .fechaVencimientoMensual(cliente.getFechaVencimientoMensual())
                .subdominio(acceso.getSubdominio())
                .urlAcceso(acceso.getUrlAcceso())
                .usuarioAdminFacturador(acceso.getUsuarioAdminFacturador())
                .comoNosConocio(encuesta.getComoNosConocio())
                .usoSistemaAnterior(encuesta.getUsoSistemaAnterior())
                .volumenFacturacionEstimado(encuesta.getVolumenFacturacionEstimado())
                .comentarios(encuesta.getComentarios())
                .build();
    }
}
