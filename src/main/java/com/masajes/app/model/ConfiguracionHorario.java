package com.masajes.app.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.DayOfWeek;
import java.time.LocalTime;

@Entity
@Table(name = "configuracion_horarios")
@Data // Genera los getters y setters automáticamente (requiere Lombok)
@NoArgsConstructor
@AllArgsConstructor
public class ConfiguracionHorario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    private DayOfWeek diaSemana; // Lunes a Domingo

    private LocalTime horaInicio;
    private LocalTime horaFin;
    
    private LocalTime inicioAlmuerzo;
    private LocalTime finAlmuerzo;
    
    private boolean activo; // true si atiende ese día, false si es su día libre
}