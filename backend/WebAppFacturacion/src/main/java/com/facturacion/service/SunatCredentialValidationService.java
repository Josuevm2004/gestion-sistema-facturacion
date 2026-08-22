package com.facturacion.service;

import com.facturacion.request.ValidarCredencialesSunatRequest;
import com.facturacion.response.ValidacionSunatResponse;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.util.regex.Pattern;

@Service
public class SunatCredentialValidationService {

    private static final Pattern RUC_PATTERN = Pattern.compile("\\d{11}");

    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final String clientId;
    private final String clientSecret;
    private final String scope;

    public SunatCredentialValidationService(
            RestClient.Builder restClientBuilder,
            @Value("${sunat.gre.auth-base-url:https://api-seguridad.sunat.gob.pe/v1}") String authBaseUrl,
            @Value("${sunat.gre.client-id:}") String clientId,
            @Value("${sunat.gre.client-secret:}") String clientSecret,
            @Value("${sunat.gre.scope:https://api-cpe.sunat.gob.pe}") String scope,
            ObjectMapper objectMapper) {
        this.restClient = restClientBuilder.baseUrl(authBaseUrl).build();
        this.objectMapper = objectMapper;
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.scope = scope;
    }

    public ValidacionSunatResponse validar(ValidarCredencialesSunatRequest request) {
        if (!RUC_PATTERN.matcher(request.getRuc().trim()).matches()) {
            return new ValidacionSunatResponse(false, "RUC_INVALIDO");
        }
        if (clientId.isBlank() || clientSecret.isBlank()) {
            return new ValidacionSunatResponse(false, "SUNAT_NO_CONFIGURADA");
        }

        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", "password");
        form.add("scope", scope);
        form.add("client_id", clientId);
        form.add("client_secret", clientSecret);
        // GRE utiliza la concatenación RUC + Usuario SOL, sin espacio.
        form.add("username", request.getRuc().trim() + request.getUsuarioSol().trim());
        form.add("password", request.getClaveSol());

        try {
            String token = restClient.post()
                    .uri(uriBuilder -> uriBuilder
                            .path("/clientessol/{clientId}/oauth2/token/")
                            .build(clientId))
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .accept(MediaType.APPLICATION_JSON)
                    .body(form)
                    .retrieve()
                    .body(String.class);

            JsonNode respuesta = token == null ? null : objectMapper.readTree(token);
            boolean tokenObtenido = respuesta != null && respuesta.hasNonNull("access_token");
            return new ValidacionSunatResponse(tokenObtenido,
                    tokenObtenido ? "CREDENCIALES_VALIDAS" : "RESPUESTA_SUNAT_INVALIDA");
        } catch (RestClientResponseException ex) {
            int status = ex.getStatusCode().value();
            if (status == 400 || status == 401 || status == 403) {
                return new ValidacionSunatResponse(false, "CREDENCIALES_INVALIDAS");
            }
            return new ValidacionSunatResponse(false, "SUNAT_NO_DISPONIBLE");
        } catch (Exception ex) {
            return new ValidacionSunatResponse(false, "SUNAT_NO_DISPONIBLE");
        }
    }
}
