package com.masajes.app.service;

import com.masajes.app.dto.TurnoCreateRequest;
import com.masajes.app.entity.User;
import com.masajes.app.exception.ResourceNotFoundException;
import com.masajes.app.exception.TurnoConflictException;
import com.masajes.app.exception.UnauthorizedException;
import com.masajes.app.model.EstadoTurno;
import com.masajes.app.model.HorarioAtencion;
import com.masajes.app.model.Turno;
import com.masajes.app.repository.HorarioAtencionRepository;
import com.masajes.app.repository.ServiceRepository;
import com.masajes.app.repository.TurnoRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class TurnoClienteService {

    @Autowired
    private TurnoRepository turnoRepository;

    @Autowired
    private HorarioAtencionRepository horarioRepository;

    @Autowired
    private ServiceRepository serviceRepository;

    // =========================================
    // OBTENER MIS TURNOS
    // =========================================

    public List<Turno> getMisTurnos(User usuario) {
        return turnoRepository.findByUsuarioOrderByFechaDesc(usuario);
    }

    // =========================================
    // OBTENER HORARIOS DISPONIBLES
    // =========================================

    public List<String> getHorasDisponibles(LocalDate fecha) {

        int diaSemana = fecha.getDayOfWeek().getValue();

        Optional<HorarioAtencion> configOpt =
                horarioRepository.findByDiaSemana(diaSemana);

        LocalTime apertura;
        LocalTime cierre;

        // Si no hay configuración
        if (configOpt.isEmpty()) {

            apertura = LocalTime.of(9, 0);
            cierre = LocalTime.of(18, 0);

        } else {

            HorarioAtencion config = configOpt.get();

            // Día no laborable
            if (!config.isLaborable()) {
                return new ArrayList<>();
            }

            apertura = config.getHoraApertura();
            cierre = config.getHoraCierre();
        }

        // =========================================
        // GENERAR HORARIOS
        // =========================================

        List<LocalTime> slots = new ArrayList<>();

        LocalTime horaActual = apertura;

        while (horaActual.isBefore(cierre)) {

            slots.add(horaActual);

            horaActual = horaActual.plusMinutes(60);
        }

        // =========================================
        // OBTENER TURNOS OCUPADOS
        // =========================================

        LocalDateTime inicioDia = fecha.atStartOfDay();

        LocalDateTime finDia = fecha.atTime(LocalTime.MAX);

        List<Turno> ocupados =
                turnoRepository.buscarTurnosDelDia(inicioDia, finDia);

        // =========================================
        // FILTRAR HORAS OCUPADAS
        // =========================================

        List<LocalTime> horasOcupadas = ocupados.stream()

                .filter(t -> t.getEstado() != EstadoTurno.CANCELADO)

                .map(t -> t.getFecha().toLocalTime())

                .collect(Collectors.toList());

        // =========================================
        // DEVOLVER SOLO DISPONIBLES
        // =========================================

        return slots.stream()

                .filter(slot -> !horasOcupadas.contains(slot))

                .map(slot -> slot.toString().substring(0, 5))

                .collect(Collectors.toList());
    }

    // =========================================
    // CREAR RESERVA
    // =========================================

    @Transactional
    public Turno crearReserva(
            TurnoCreateRequest request,
            User usuario
    ) {

        // =========================================
        // VALIDAR FECHA PASADA
        // =========================================

        if (request.getFecha().isBefore(LocalDateTime.now())) {

            throw new TurnoConflictException(
                    "No puedes reservar en una fecha pasada."
            );
        }

        // =========================================
        // VALIDAR DOBLE RESERVA REAL
        // =========================================

        boolean ocupado = turnoRepository.existsByFechaAndEstadoNot(
                request.getFecha(),
                EstadoTurno.CANCELADO
        );

        if (ocupado) {

            throw new TurnoConflictException(
                    "Ese horario ya fue reservado."
            );
        }

        // =========================================
        // BUSCAR SERVICIO
        // =========================================

        com.masajes.app.model.Service servicio =
                serviceRepository.findById(request.getServicioId())

                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Servicio no encontrado."
                        )
                );

        // =========================================
        // CREAR TURNO
        // =========================================

        Turno turno = new Turno();

        turno.setFecha(request.getFecha());

        turno.setCliente(usuario.getNombre());

        turno.setNotas(request.getNotas());

        turno.setUsuario(usuario);

        turno.setServicio(servicio);

        turno.setEstado(EstadoTurno.PENDIENTE);

        turno.setPrecioCobrado(servicio.getPrecio());

        return turnoRepository.save(turno);
    }

    // =========================================
    // CANCELAR TURNO
    // =========================================

    @Transactional
    public Turno cancelarMiTurno(
            Long turnoId,
            User usuario
    ) {

        Turno turno = turnoRepository.findById(turnoId)

                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Turno no encontrado"
                        )
                );

        // =========================================
        // VALIDAR PROPIETARIO
        // =========================================

        if (!turno.getUsuario().getId().equals(usuario.getId())) {

            throw new UnauthorizedException(
                    "No tienes permiso para cancelar este turno."
            );
        }

        // =========================================
        // VALIDAR FECHA
        // =========================================

        if (requestEsPasado(turno.getFecha())) {

            throw new TurnoConflictException(
                    "No puedes cancelar un turno que ya pasó."
            );
        }

        // =========================================
        // VALIDAR ESTADO
        // =========================================

        if (turno.getEstado() != EstadoTurno.PENDIENTE) {

            throw new TurnoConflictException(
                    "Solo puedes cancelar turnos pendientes."
            );
        }

        // =========================================
        // CANCELAR
        // =========================================

        turno.setEstado(EstadoTurno.CANCELADO);

        return turnoRepository.save(turno);
    }

    // =========================================
    // VALIDAR FECHA PASADA
    // =========================================

    private boolean requestEsPasado(LocalDateTime fecha) {

        return fecha.isBefore(LocalDateTime.now());
    }
}