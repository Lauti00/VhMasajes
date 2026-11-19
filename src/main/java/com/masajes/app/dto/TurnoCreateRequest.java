package com.masajes.app.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotBlank;
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
    // Esto es CLAVE para que acepte el formato de React (yyyy-MM-ddTHH:mm:ss)
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime fecha;

    @NotBlank(message = "El cliente es requerido")
    private String cliente;

    @NotNull(message = "El ID del servicio es requerido")
    private Long servicioId;

    private String notas;
}