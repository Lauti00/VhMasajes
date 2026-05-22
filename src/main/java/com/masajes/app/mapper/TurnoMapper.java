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

        // =========================
        // DATOS BÁSICOS
        // =========================
        dto.setId(turno.getId());
        dto.setCliente(turno.getCliente());
        dto.setFecha(turno.getFecha());
        dto.setNotas(turno.getNotas());
        dto.setPrecio(turno.getPrecioCobrado());

        // =========================
        // SERVICIO
        // =========================
        if (turno.getServicio() != null) {

            // Nombre del servicio
            dto.setServicio(turno.getServicio().getNombre());

            // Calcular fecha fin
            if (turno.getFecha() != null) {

                Integer duracion = turno.getServicio().getDuracionMinutos();

                // Si no tiene duración definida -> 60 min por defecto
                if (duracion == null || duracion <= 0) {
                    duracion = 60;
                }

                dto.setFin(turno.getFecha().plusMinutes(duracion));
            }

        } else {

            dto.setServicio("Servicio no especificado");

            // Fallback de 1 hora
            if (turno.getFecha() != null) {
                dto.setFin(turno.getFecha().plusHours(1));
            }
        }

        // =========================
        // ESTADO
        // =========================
        if (turno.getEstado() != null) {
            dto.setEstado(turno.getEstado().name());
        } else {
            dto.setEstado("PENDIENTE");
        }

        // =========================
        // CREATED AT
        // =========================
        dto.setCreatedAt(
                turno.getCreatedAt() != null
                        ? turno.getCreatedAt()
                        : LocalDateTime.now()
        );

        return dto;
    }
}