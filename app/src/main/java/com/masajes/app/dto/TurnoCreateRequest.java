package com.masajes.app.dto;

import com.fasterxml.jackson.annotation.JsonFormat;

import jakarta.validation.constraints.NotNull;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TurnoCreateRequest {

    @NotNull(message = "La fecha es requerida")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime fecha;

    @NotNull(message = "El ID del servicio es requerido")
    private Long servicioId;

    private String notas;
}