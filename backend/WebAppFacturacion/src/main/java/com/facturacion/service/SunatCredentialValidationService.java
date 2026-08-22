package com.facturacion.service;

import com.facturacion.request.ValidarCredencialesSunatRequest;
import com.facturacion.response.ValidacionSunatResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.CookieManager;
import java.net.CookiePolicy;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Pattern;

@Service
public class SunatCredentialValidationService {

    private static final Pattern RUC_PATTERN = Pattern.compile("\\d{11}");

    private final String validationMode;
    private final String webLoginUrl;

    public SunatCredentialValidationService(
            @Value("${sunat.validation.mode:web}") String validationMode,
            @Value("${sunat.sol.web-login-url:}") String webLoginUrl) {
        this.validationMode = validationMode;
        this.webLoginUrl = webLoginUrl;
    }

    public ValidacionSunatResponse validar(ValidarCredencialesSunatRequest request) {
        if (!RUC_PATTERN.matcher(request.getRuc().trim()).matches()) {
            return new ValidacionSunatResponse(false, "RUC_INVALIDO");
        }

        if (!"web".equalsIgnoreCase(validationMode)) {
            return new ValidacionSunatResponse(false, "SUNAT_NO_CONFIGURADA");
        }

        return validarConLoginWeb(request);
    }

    /**
     * SUNAT muestra el formulario SOL y comprueba la clave en su propio login.
     * Se conserva la sesion/cookie solo durante esta peticion y nunca se guarda
     * la clave ni se escribe el HTML de SUNAT en los logs.
     */
    private ValidacionSunatResponse validarConLoginWeb(ValidarCredencialesSunatRequest request) {
        if (webLoginUrl.isBlank()) {
            return new ValidacionSunatResponse(false, "SUNAT_NO_CONFIGURADA");
        }

        try {
            String loginUrl = webLoginUrl.trim();
            CookieManager cookieManager = new CookieManager(null, CookiePolicy.ACCEPT_ALL);
            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(12))
                    .cookieHandler(cookieManager)
                    .followRedirects(HttpClient.Redirect.NEVER)
                    .build();

            HttpRequest loginPageRequest = HttpRequest.newBuilder(URI.create(loginUrl))
                    .timeout(Duration.ofSeconds(20))
                    .header("Accept", "text/html,application/xhtml+xml")
                    .header("User-Agent", "Mozilla/5.0")
                    .GET()
                    .build();
            HttpResponse<String> loginPage = client.send(
                    loginPageRequest,
                    HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));

            if (loginPage.statusCode() < 200 || loginPage.statusCode() >= 300) {
                return new ValidacionSunatResponse(false, "SUNAT_NO_DISPONIBLE");
            }

            Map<String, String> form = extractHiddenInputs(loginPage.body());
            form.put("tipo", "2");
            form.put("dni", "");
            form.put("custom_ruc", request.getRuc().trim());
            form.put("j_username", request.getUsuarioSol().trim().toUpperCase(Locale.ROOT));
            form.put("j_password", request.getClaveSol());
            form.put("captcha", "");

            URI submitUri = resolveFormAction(loginUrl, loginPage.body());
            HttpRequest submitRequest = HttpRequest.newBuilder(submitUri)
                    .timeout(Duration.ofSeconds(20))
                    .header("Accept", "text/html,application/xhtml+xml")
                    .header("User-Agent", "Mozilla/5.0")
                    .header("Referer", loginUrl)
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .POST(HttpRequest.BodyPublishers.ofString(formEncode(form)))
                    .build();
            HttpResponse<String> submitResponse = client.send(
                    submitRequest,
                    HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));

            return interpretarRespuestaLogin(submitResponse);
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            return new ValidacionSunatResponse(false, "SUNAT_NO_DISPONIBLE");
        } catch (Exception ex) {
            return new ValidacionSunatResponse(false, "SUNAT_NO_DISPONIBLE");
        }
    }

    private ValidacionSunatResponse interpretarRespuestaLogin(HttpResponse<String> response) {
        String location = response.headers().firstValue("Location").orElse("").toLowerCase(Locale.ROOT);
        String body = response.body() == null ? "" : response.body().toLowerCase(Locale.ROOT);

        if (location.contains("/error") || contieneCredencialesInvalidas(body)) {
            return new ValidacionSunatResponse(false, "CREDENCIALES_INVALIDAS");
        }
        if (contieneCaptcha(body)) {
            return new ValidacionSunatResponse(false, "SUNAT_REQUIERE_CAPTCHA");
        }
        if (response.statusCode() >= 300 && response.statusCode() < 400 && !location.isBlank()) {
            return new ValidacionSunatResponse(true, "CREDENCIALES_VALIDAS");
        }
        if (response.statusCode() == 400 || response.statusCode() == 401 || response.statusCode() == 403) {
            return new ValidacionSunatResponse(false, "CREDENCIALES_INVALIDAS");
        }
        return new ValidacionSunatResponse(false, "SUNAT_NO_DISPONIBLE");
    }

    private boolean contieneCredencialesInvalidas(String body) {
        return body.contains("ruc, usuario y/o contraseña son incorrectos")
                || body.contains("usuario sol, clave son incorrectos")
                || body.contains("incorrectos o no existen");
    }

    private boolean contieneCaptcha(String body) {
        return body.contains("marque la casilla de seguridad")
                || body.contains("ingrese el valor que aparece en la imagen")
                || body.contains("captcha.htm");
    }

    private Map<String, String> extractHiddenInputs(String html) {
        Map<String, String> values = new LinkedHashMap<>();
        var inputMatcher = Pattern.compile("(?is)<input\\b[^>]*>").matcher(html);
        while (inputMatcher.find()) {
            String input = inputMatcher.group();
            String type = attribute(input, "type");
            String name = attribute(input, "name");
            if ("hidden".equalsIgnoreCase(type) && !name.isBlank()) {
                values.put(name, attribute(input, "value"));
            }
        }
        return values;
    }

    private URI resolveFormAction(String loginUrl, String html) {
        var formMatcher = Pattern.compile("(?is)<form\\b[^>]*\\bname\\s*=\\s*[\\\"']LoginForm[\\\"'][^>]*>").matcher(html);
        String formTag = formMatcher.find() ? formMatcher.group() : "";
        String action = attribute(formTag, "action");
        return URI.create(loginUrl).resolve(action.isBlank() ? "j_security_check" : action);
    }

    private String attribute(String tag, String name) {
        if (tag == null || tag.isBlank()) {
            return "";
        }
        var matcher = Pattern.compile("(?is)\\b" + Pattern.quote(name) + "\\s*=\\s*(?:[\\\"']([^\\\"']*)[\\\"']|([^\\s>]+))").matcher(tag);
        if (!matcher.find()) {
            return "";
        }
        return matcher.group(1) != null ? matcher.group(1) : matcher.group(2);
    }

    private String formEncode(Map<String, String> form) {
        StringBuilder encoded = new StringBuilder();
        form.forEach((key, value) -> {
            if (encoded.length() > 0) {
                encoded.append('&');
            }
            encoded.append(URLEncoder.encode(key, StandardCharsets.UTF_8));
            encoded.append('=');
            encoded.append(URLEncoder.encode(value == null ? "" : value, StandardCharsets.UTF_8));
        });
        return encoded.toString();
    }

}
