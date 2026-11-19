package com.masajes.app.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.masajes.app.dto.ReservaPublicaRequest;
import com.masajes.app.model.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@org.springframework.stereotype.Service
public class WhatsappConfirmationService {
    private static final Logger log = LoggerFactory.getLogger(WhatsappConfirmationService.class);
    private static final DateTimeFormatter FECHA = DateTimeFormatter.ofPattern("EEEE d 'de' MMMM", Locale.forLanguageTag("es-AR"));
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    @Value("${whatsapp.access-token:}") private String accessToken;
    @Value("${whatsapp.phone-number-id:}") private String phoneNumberId;
    @Value("${whatsapp.api-version:v27.0}") private String apiVersion;
    @Value("${whatsapp.template-name:vhmasajes_confirmacion_turno}") private String templateName;
    @Value("${whatsapp.template-language:es_AR}") private String templateLanguage;
    @Value("${app.public-url:http://localhost:5173}") private String publicUrl;

    public WhatsappConfirmationService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(8)).build();
    }

    public boolean enviarConfirmacion(ReservaPublicaRequest request, Service servicio, LocalDateTime fecha, String tokenGestion) {
        if (accessToken.isBlank() || phoneNumberId.isBlank()) {
            log.info("WhatsApp no está configurado; se confirma la reserva sin enviar mensaje.");
            return false;
        }
        try {
            String telefono = request.telefono().replaceAll("\\D", "");
            String enlaceGestion = publicUrl.replaceAll("/$", "") + "/gestionar-turno#" + tokenGestion;
            ObjectNode payload = objectMapper.createObjectNode();
            payload.put("messaging_product", "whatsapp");
            payload.put("to", telefono);
            payload.put("type", "template");
            ObjectNode template = payload.putObject("template");
            template.put("name", templateName);
            template.putObject("language").put("code", templateLanguage);
            ArrayNode components = template.putArray("components");

            ObjectNode body = components.addObject();
            body.put("type", "body");
            ArrayNode parameters = body.putArray("parameters");
            agregarParametro(parameters, request.nombre().trim());
            agregarParametro(parameters, servicio.getNombre());
            agregarParametro(parameters, fecha.format(FECHA));
            agregarParametro(parameters, fecha.toLocalTime().format(DateTimeFormatter.ofPattern("HH:mm")));
            agregarParametro(parameters, "$" + servicio.getPrecio().toPlainString());

            ObjectNode button = components.addObject();
            button.put("type", "button");
            button.put("sub_type", "url");
            button.put("index", "0");
            button.putArray("parameters").addObject().put("type", "text").put("text", tokenGestion);

            HttpRequest httpRequest = HttpRequest.newBuilder()
                    .uri(URI.create("https://graph.facebook.com/" + apiVersion + "/" + phoneNumberId + "/messages"))
                    .timeout(Duration.ofSeconds(20))
                    .header("Authorization", "Bearer " + accessToken)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(payload)))
                    .build();
            HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                log.info("Confirmación de WhatsApp enviada para reserva a teléfono terminado en {}.", telefono.substring(Math.max(0, telefono.length() - 4)));
                return true;
            }
            log.warn("Meta rechazó el mensaje de confirmación de WhatsApp (HTTP {}).", response.statusCode());
        } catch (Exception error) {
            log.warn("No se pudo enviar la confirmación de WhatsApp: {}", error.getClass().getSimpleName());
        }
        return false;
    }

    private void agregarParametro(ArrayNode parameters, String valor) {
        parameters.addObject().put("type", "text").put("text", valor);
    }
}
