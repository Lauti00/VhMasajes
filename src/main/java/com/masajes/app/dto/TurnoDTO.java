package com.masajes.app.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TurnoDTO {
    private Long id;
    private String cliente;
    private String servicio;
    private LocalDateTime fecha;
    private LocalDateTime fin;
    private String estado;
    private BigDecimal precio;
    private String notas;
    private LocalDateTime createdAt;
}
