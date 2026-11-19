package com.masajes.app.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public record ActualizarReservaPublicaRequest(
        @NotNull(message = "Elegí un horario")
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
        LocalDateTime fecha,

        @NotNull(message = "Elegí un servicio")
        Long servicioId,

        @Size(max = 500, message = "La nota no puede superar 500 caracteres")
        String notas
) {}
