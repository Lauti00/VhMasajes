package com.masajes.app.model; 
import jakarta.persistence.*;
import lombok.Data; 
import java.time.LocalTime;

@Entity
@Table(name = "horarios_atencion")
@Data
public class HorarioAtencion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Guardaremos el día de la semana (1 = Lunes, 2 = Martes, ..., 7 = Domingo)
    @Column(nullable = false, unique = true)
    private int diaSemana; 

    // ¿El centro está abierto este día?
    @Column(nullable = false)
    private boolean laborable; 

    // Hora a la que abre
    private LocalTime horaApertura; 

    // Hora a la que cierra
    private LocalTime horaCierre; 
    
    
}