package com.masajes.app.service;

import com.masajes.app.dto.ReservaPublicaRequest;
import com.masajes.app.exception.ResourceNotFoundException;
import com.masajes.app.exception.TurnoConflictException;
import com.masajes.app.model.EstadoTurno;
import com.masajes.app.model.HorarioAtencion;
import com.masajes.app.model.Service;
import com.masajes.app.model.Turno;
import com.masajes.app.repository.HorarioAtencionRepository;
import com.masajes.app.repository.ServiceRepository;
import com.masajes.app.repository.TurnoRepository;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;
import java.util.Base64;

@org.springframework.stereotype.Service
public class ReservaPublicaService {
    private final TurnoRepository turnoRepository;
    private final HorarioAtencionRepository horarioRepository;
    private final ServiceRepository serviceRepository;
    private final Clock businessClock;
    private final SecureRandom secureRandom = new SecureRandom();

    public ReservaPublicaService(TurnoRepository turnoRepository,
                                 HorarioAtencionRepository horarioRepository,
                                 ServiceRepository serviceRepository,
                                 Clock businessClock) {
        this.turnoRepository = turnoRepository;
        this.horarioRepository = horarioRepository;
        this.serviceRepository = serviceRepository;
        this.businessClock = businessClock;
    }

    @Transactional
    public ReservaCreada crear(ReservaPublicaRequest request) {
        String token = crearToken();
        Service servicio = servicioActivo(request.servicioId());
        validarHorario(request.fecha(), servicio, null, true);

        Turno turno = new Turno();
        turno.setCliente((request.nombre().trim() + " " + request.apellido().trim()).trim());
        turno.setServicio(servicio);
        turno.setFecha(request.fecha());
        turno.setPrecioCobrado(servicio.getPrecio());
        turno.setNotas(request.notas() == null ? null : request.notas().trim());
        turno.setEstado(EstadoTurno.PENDIENTE);
        turno.setTokenGestionHash(hashToken(token));
        return new ReservaCreada(turnoRepository.save(turno), token);
    }

    @Transactional(readOnly = true)
    public Turno consultar(String token) {
        return buscarPorToken(token);
    }

    @Transactional(readOnly = true)
    public List<String> disponibilidad(String token, LocalDate fecha, Long servicioId) {
        Turno turnoActual = buscarPorToken(token);
        Service servicio = servicioActivo(servicioId);
        Optional<HorarioAtencion> configOpt = horarioRepository.findByDiaSemana(fecha.getDayOfWeek().getValue());
        if (configOpt.isEmpty() || !configOpt.get().isLaborable()) return List.of();
        HorarioAtencion config = configOpt.get();
        LocalTime apertura = config.getHoraApertura();
        LocalTime cierre = config.getHoraCierre();
        if (apertura == null || cierre == null || !apertura.isBefore(cierre)) return List.of();

        List<Turno> ocupados = turnoRepository.findByFechaBetween(fecha.atStartOfDay(), fecha.atTime(LocalTime.MAX));
        LocalDateTime candidato = fecha.atTime(apertura);
        LocalDateTime finAtencion = fecha.atTime(cierre);
        LocalDateTime ahora = LocalDateTime.now(businessClock);
        List<String> disponibles = new ArrayList<>();
        int duracion = servicio.getDuracionMinutos() == null || servicio.getDuracionMinutos() <= 0 ? 60 : servicio.getDuracionMinutos();
        while (!candidato.plusMinutes(duracion).isAfter(finAtencion)) {
            LocalDateTime inicio = candidato;
            LocalDateTime fin = inicio.plusMinutes(duracion);
            boolean ocupado = ocupados.stream()
                    .filter(t -> !t.getId().equals(turnoActual.getId()) && t.getEstado() != EstadoTurno.CANCELADO)
                    .anyMatch(t -> seSuperpone(inicio, fin, t));
            if (!inicio.isBefore(ahora) && !ocupado) disponibles.add(inicio.toLocalTime().toString());
            candidato = candidato.plusMinutes(15);
        }
        return disponibles;
    }

    @Transactional
    public Turno actualizar(String token, LocalDateTime fecha, Long servicioId, String notas) {
        Turno turno = buscarPorToken(token);
        validarEditable(turno);
        Service servicio = servicioActivo(servicioId);
        validarHorario(fecha, servicio, turno.getId(), true);
        turno.setFecha(fecha);
        turno.setServicio(servicio);
        turno.setPrecioCobrado(servicio.getPrecio());
        turno.setNotas(notas == null ? null : notas.trim());
        return turnoRepository.save(turno);
    }

    @Transactional
    public Turno cancelar(String token) {
        Turno turno = buscarPorToken(token);
        validarEditable(turno);
        turno.setEstado(EstadoTurno.CANCELADO);
        return turnoRepository.save(turno);
    }

    private void validarEditable(Turno turno) {
        if (turno.getEstado() != EstadoTurno.PENDIENTE) {
            throw new TurnoConflictException("Este turno ya no se puede modificar.");
        }
        if (turno.getFecha().isBefore(LocalDateTime.now(businessClock))) {
            throw new TurnoConflictException("Este turno ya pasó y no se puede modificar.");
        }
    }

    private Service servicioActivo(Long servicioId) {
        return serviceRepository.findById(servicioId)
                .filter(s -> !Boolean.FALSE.equals(s.getActivo()))
                .orElseThrow(() -> new ResourceNotFoundException("El servicio seleccionado no está disponible."));
    }

    private void validarHorario(LocalDateTime fecha, Service servicio, Long turnoIgnorado, boolean bloquearHorario) {
        if (fecha == null || fecha.isBefore(LocalDateTime.now(businessClock))) {
            throw new TurnoConflictException("Elegí una fecha y hora futura.");
        }
        int diaSemana = fecha.getDayOfWeek().getValue();
        Optional<HorarioAtencion> config = (bloquearHorario
                ? horarioRepository.findByDiaSemanaForUpdate(diaSemana)
                : horarioRepository.findByDiaSemana(diaSemana))
                .filter(HorarioAtencion::isLaborable);
        HorarioAtencion horario = config.orElseThrow(() -> new TurnoConflictException("No hay atención configurada para ese día."));
        LocalTime apertura = horario.getHoraApertura();
        LocalTime cierre = horario.getHoraCierre();
        if (apertura == null || cierre == null || !apertura.isBefore(cierre)) {
            throw new TurnoConflictException("El horario del consultorio no está configurado correctamente.");
        }
        LocalTime hora = fecha.toLocalTime();
        int duracion = servicio.getDuracionMinutos() == null || servicio.getDuracionMinutos() <= 0 ? 60 : servicio.getDuracionMinutos();
        LocalDateTime fin = fecha.plusMinutes(duracion);
        LocalDateTime finAtencion = fecha.toLocalDate().atTime(cierre);
        if (fecha.isBefore(fecha.toLocalDate().atTime(apertura)) || fin.isAfter(finAtencion)
                || hora.getSecond() != 0 || hora.getNano() != 0
                || Duration.between(apertura, hora).toMinutes() % 15 != 0) {
            throw new TurnoConflictException("Ese horario no está dentro de la disponibilidad del consultorio.");
        }

        boolean ocupado = turnoRepository.findByFechaBetween(fecha.toLocalDate().atStartOfDay(), fecha.toLocalDate().atTime(LocalTime.MAX))
                .stream()
                .filter(t -> !t.getId().equals(turnoIgnorado) && t.getEstado() != EstadoTurno.CANCELADO)
                .anyMatch(t -> seSuperpone(fecha, fin, t));
        if (ocupado) throw new TurnoConflictException("Ese horario acaba de ser reservado. Elegí otro disponible.");
    }

    private boolean seSuperpone(LocalDateTime inicio, LocalDateTime fin, Turno existente) {
        int duracion = existente.getServicio() == null || existente.getServicio().getDuracionMinutos() == null
                ? 60 : existente.getServicio().getDuracionMinutos();
        LocalDateTime finExistente = existente.getFecha().plusMinutes(duracion);
        return inicio.isBefore(finExistente) && fin.isAfter(existente.getFecha());
    }

    private Turno buscarPorToken(String token) {
        if (token == null || token.isBlank()) throw enlaceInvalido();
        return turnoRepository.findByTokenGestionHash(hashToken(token))
                .orElseThrow(ReservaPublicaService::enlaceInvalido);
    }

    private static ResourceNotFoundException enlaceInvalido() {
        return new ResourceNotFoundException("El enlace de gestión no es válido.");
    }

    private String crearToken() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String hashToken(String token) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (Exception e) {
            throw new IllegalStateException("No se pudo verificar el enlace de gestión.", e);
        }
    }

    public record ReservaCreada(Turno turno, String token) {}
}
