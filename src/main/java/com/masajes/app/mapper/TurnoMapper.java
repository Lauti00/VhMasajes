package com.masajes.app.mapper;

import com.masajes.app.dto.TurnoDTO;
import com.masajes.app.model.Turno;
import org.springframework.stereotype.Component;
import java.time.LocalDateTime;

@Component
public class TurnoMapper {
    
    public TurnoDTO toDTO(Turno turno) {
        if (turno == null) {
            return null;
        }
        
        TurnoDTO dto = new TurnoDTO();
        
        // 1. Datos básicos de identificación
        dto.setId(turno.getId());
        dto.setCliente(turno.getCliente());
        dto.setFecha(turno.getFecha());
        dto.setNotas(turno.getNotas());
        dto.setPrecio(turno.getPrecioCobrado());

        // 2. Mapeo del Servicio con cálculos de tiempo
        if (turno.getServicio() != null) {
            // Guardamos el nombre (importante para que se vea en el calendario)
            dto.setServicio(turno.getServicio().getNombre());
            
            // Calculamos la fecha de fin. 
            // Si el servicio no tiene duración, por defecto ponemos 60 minutos.
            if (turno.getFecha() != null) {
                int duracion = (turno.getServicio().getDuracionMinutos() > 0) 
                               ? turno.getServicio().getDuracionMinutos() 
                               : 60;
                dto.setFin(turno.getFecha().plusMinutes(duracion));
            }
        } else {
            dto.setServicio("Servicio no especificado");
            // Fallback para el fin si no hay servicio
            if (turno.getFecha() != null) {
                dto.setFin(turno.getFecha().plusHours(1));
            }
        }

        // 3. Estado (Manejo seguro del Enum)
        if (turno.getEstado() != null) {
            dto.setEstado(turno.getEstado().name());
        } else {
            dto.setEstado("PENDIENTE");
        }

        // 4. Auditoría (CreatedAt)
        // Usamos una fecha actual si por alguna razón el objeto no la tiene todavía
        dto.setCreatedAt(turno.getCreatedAt() != null ? turno.getCreatedAt() : LocalDateTime.now());
        
        return dto;
    }
}