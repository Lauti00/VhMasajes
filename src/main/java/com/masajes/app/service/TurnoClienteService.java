package com.masajes.app.service;

import com.masajes.app.dto.TurnoCreateRequest;
import com.masajes.app.entity.User;
import com.masajes.app.exception.ResourceNotFoundException;
import com.masajes.app.exception.TurnoConflictException;
import com.masajes.app.exception.UnauthorizedException;
import com.masajes.app.model.HorarioAtencion;
import com.masajes.app.model.EstadoTurno;
import com.masajes.app.model.Turno;
import com.masajes.app.repository.HorarioAtencionRepository;
import com.masajes.app.repository.ServiceRepository;
import com.masajes.app.repository.TurnoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

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

    public List<Turno> getMisTurnos(User usuario) {
        return turnoRepository.findByUsuarioOrderByFechaDesc(usuario);
    }

    public List<String> getHorasDisponibles(LocalDate fecha) {
        // 1. Intentar obtener la configuración de la DB
        int diaSemana = fecha.getDayOfWeek().getValue();
        Optional<HorarioAtencion> configOpt = horarioRepository.findByDiaSemana(diaSemana);

        LocalTime apertura;
        LocalTime cierre;

        // 2. Si no hay configuración en la DB, usamos un horario por defecto para que no falle
        if (configOpt.isEmpty()) {
            apertura = LocalTime.of(9, 0);
            cierre = LocalTime.of(18, 0);
        } else {
            HorarioAtencion config = configOpt.get();
            if (!config.isLaborable()) return new ArrayList<>(); // Si es feriado/no laborable
            apertura = config.getHoraApertura();
            cierre = config.getHoraCierre();
        }

        // 3. Generar los slots de tiempo
        List<LocalTime> slots = new ArrayList<>();
        LocalTime horaActual = apertura;
        while (horaActual.isBefore(cierre)) {
            slots.add(horaActual);
            horaActual = horaActual.plusMinutes(60); // Intervalos de 1 hora
        }

        // 4. Buscar turnos ocupados ese día (usando el método corregido del repository)
        LocalDateTime inicioDia = fecha.atStartOfDay();
        LocalDateTime finDia = fecha.atTime(LocalTime.MAX);
        List<Turno> ocupados = turnoRepository.findByFechaBetween(inicioDia, finDia);

        // 5. Filtrar las horas ocupadas (ignorar los cancelados)
        List<LocalTime> horasOcupadas = ocupados.stream()
                .filter(t -> t.getEstado() != EstadoTurno.CANCELADO)
                .map(t -> t.getFecha().toLocalTime())
                .collect(Collectors.toList());

        // 6. Devolver solo las horas que NO están en la lista de ocupadas
        return slots.stream()
                .filter(s -> !horasOcupadas.contains(s))
                .map(s -> s.toString().substring(0, 5)) // Formato "HH:mm"
                .collect(Collectors.toList());
    }

    public Turno crearReserva(TurnoCreateRequest request, User usuario) {
        // Validar que no sea fecha pasada
        if (request.getFecha().isBefore(LocalDateTime.now())) {
            throw new TurnoConflictException("No puedes reservar en una fecha pasada.");
        }

        LocalDate fechaSolicitada = request.getFecha().toLocalDate();
        LocalTime horaSolicitada = request.getFecha().toLocalTime();

        // Verificar disponibilidad real antes de guardar
        List<String> disponibles = getHorasDisponibles(fechaSolicitada);
        String horaString = horaSolicitada.toString().substring(0, 5); 
        
        if (!disponibles.contains(horaString)) {
            throw new TurnoConflictException("El horario ya no está disponible.");
        }

        // Buscar el servicio para obtener el precio actual
        com.masajes.app.model.Service servicio = serviceRepository.findById(request.getServicioId())
            .orElseThrow(() -> new ResourceNotFoundException("Servicio no encontrado."));

        // Crear objeto Turno
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

    public Turno cancelarMiTurno(Long turnoId, User usuario) {
        Turno turno = turnoRepository.findById(turnoId)
            .orElseThrow(() -> new ResourceNotFoundException("Turno no encontrado"));

        // Seguridad: El turno debe pertenecer al usuario logueado
        if (!turno.getUsuario().getId().equals(usuario.getId())) {
            throw new UnauthorizedException("No tienes permiso para cancelar este turno.");
        }

        if (requestEsPasado(turno.getFecha())) {
            throw new TurnoConflictException("No puedes cancelar un turno que ya pasó.");
        }

        if (turno.getEstado() != EstadoTurno.PENDIENTE) {
            throw new TurnoConflictException("Solo puedes cancelar turnos en estado PENDIENTE.");
        }

        turno.setEstado(EstadoTurno.CANCELADO);
        return turnoRepository.save(turno);
    }

    private boolean requestEsPasado(LocalDateTime fecha) {
        return fecha.isBefore(LocalDateTime.now());
    }
}