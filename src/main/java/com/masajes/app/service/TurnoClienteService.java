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
import java.time.Duration;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.time.Clock;

@Service
public class TurnoClienteService {

    @Autowired
    private TurnoRepository turnoRepository;

    @Autowired
    private HorarioAtencionRepository horarioRepository;

    @Autowired
    private ServiceRepository serviceRepository;

    @Autowired
    private Clock businessClock;

    // =========================================
    // OBTENER MIS TURNOS
    // =========================================

    public List<Turno> getMisTurnos(User usuario) {
        return turnoRepository.findByUsuarioOrderByFechaDesc(usuario);
    }

    // =========================================
    // OBTENER HORARIOS DISPONIBLES
    // =========================================

    public List<String> getHorasDisponibles(LocalDate fecha, Long servicioId) {
        com.masajes.app.model.Service servicio = serviceRepository.findById(servicioId)
                .filter(s -> !Boolean.FALSE.equals(s.getActivo()))
                .orElseThrow(() -> new ResourceNotFoundException("Servicio no encontrado."));

        Optional<HorarioAtencion> configOpt = horarioRepository.findByDiaSemana(fecha.getDayOfWeek().getValue());
        if (configOpt.isEmpty() || !configOpt.get().isLaborable()) return new ArrayList<>();

        HorarioAtencion config = configOpt.get();
        LocalTime apertura = config.getHoraApertura();
        LocalTime cierre = config.getHoraCierre();
        if (apertura == null || cierre == null || !apertura.isBefore(cierre)) return new ArrayList<>();

        LocalDateTime inicioDia = fecha.atStartOfDay();
        LocalDateTime finDia = fecha.atTime(LocalTime.MAX);
        List<Turno> ocupados = turnoRepository.findByFechaBetween(inicioDia, finDia).stream()
                .filter(t -> t.getEstado() != EstadoTurno.CANCELADO)
                .collect(Collectors.toList());

        List<String> disponibles = new ArrayList<>();
        int duracion = servicio.getDuracionMinutos();
        LocalDateTime candidato = fecha.atTime(apertura);
        LocalDateTime finAtencion = fecha.atTime(cierre);
        LocalDateTime ahora = LocalDateTime.now(businessClock);
        while (!candidato.plusMinutes(duracion).isAfter(finAtencion)) {
            LocalDateTime inicio = candidato;
            LocalDateTime fin = inicio.plusMinutes(duracion);
            boolean seSuperpone = ocupados.stream().anyMatch(t -> {
                LocalDateTime turnoFin = t.getFecha().plusMinutes(
                        t.getServicio() == null || t.getServicio().getDuracionMinutos() == null
                                ? 60 : t.getServicio().getDuracionMinutos());
                return inicio.isBefore(turnoFin) && fin.isAfter(t.getFecha());
            });
            if (!inicio.isBefore(ahora) && !seSuperpone) disponibles.add(candidato.toLocalTime().toString());
            candidato = candidato.plusMinutes(15);
        }
        return disponibles;
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

        if (request.getFecha().isBefore(LocalDateTime.now(businessClock))) {

            throw new TurnoConflictException(
                    "No puedes reservar en una fecha pasada."
            );
        }

        // =========================================
        // VALIDAR DOBLE RESERVA REAL
        // =========================================

        // =========================================
        // BUSCAR SERVICIO
        // =========================================

        com.masajes.app.model.Service servicio =
                serviceRepository.findById(request.getServicioId())
                .filter(s -> !Boolean.FALSE.equals(s.getActivo()))

                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Servicio no encontrado."
                        )
                );

        int diaSemana = request.getFecha().getDayOfWeek().getValue();
        HorarioAtencion horario = horarioRepository.findByDiaSemanaForUpdate(diaSemana)
                .filter(HorarioAtencion::isLaborable)
                .orElseThrow(() -> new TurnoConflictException("No hay atención configurada para ese día."));
        if (horario.getHoraApertura() == null || horario.getHoraCierre() == null
                || !horario.getHoraApertura().isBefore(horario.getHoraCierre())) {
            throw new TurnoConflictException("El horario de atención de ese día no es válido.");
        }
        LocalTime horaInicio = request.getFecha().toLocalTime();
        LocalDateTime inicioAtencion = request.getFecha().toLocalDate().atTime(horario.getHoraApertura());
        LocalDateTime finAtencion = request.getFecha().toLocalDate().atTime(horario.getHoraCierre());
        LocalDateTime finSolicitado = request.getFecha().plusMinutes(servicio.getDuracionMinutos());
        if (request.getFecha().isBefore(inicioAtencion) || finSolicitado.isAfter(finAtencion)
                || horaInicio.getSecond() != 0 || horaInicio.getNano() != 0
                || Duration.between(horario.getHoraApertura(), horaInicio).toMinutes() % 15 != 0) {
            throw new TurnoConflictException("El horario no está dentro de la agenda disponible.");
        }
        boolean ocupado = turnoRepository.findByFechaBetween(
                request.getFecha().toLocalDate().atStartOfDay(), request.getFecha().toLocalDate().atTime(LocalTime.MAX)
        ).stream().filter(t -> t.getEstado() != EstadoTurno.CANCELADO).anyMatch(t -> {
            int duracionExistente = t.getServicio() == null || t.getServicio().getDuracionMinutos() == null
                    ? 60 : t.getServicio().getDuracionMinutos();
            LocalDateTime finExistente = t.getFecha().plusMinutes(duracionExistente);
            return request.getFecha().isBefore(finExistente) && finSolicitado.isAfter(t.getFecha());
        });
        if (ocupado) throw new TurnoConflictException("Ese horario ya no está disponible.");

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

        return fecha.isBefore(LocalDateTime.now(businessClock));
    }
}
