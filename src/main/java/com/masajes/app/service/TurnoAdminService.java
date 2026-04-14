package com.masajes.app.service;

import com.masajes.app.entity.User;
import com.masajes.app.exception.ResourceNotFoundException;
import com.masajes.app.exception.UnauthorizedException;
import com.masajes.app.model.EstadoTurno;
import com.masajes.app.model.Turno;
import com.masajes.app.repository.TurnoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TurnoAdminService {

    @Autowired
    private TurnoRepository turnoRepository;

    public List<Turno> obtenerTodosLosTurnos() {
        return turnoRepository.findAll();
    }

    public Turno obtenerTurnoPorId(Long id) {
        return turnoRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Turno no encontrado con id: " + id));
    }

    public Turno cambiarEstadoTurno(Long id, EstadoTurno nuevoEstado) {
        Turno turno = obtenerTurnoPorId(id);
        turno.setEstado(nuevoEstado);
        return turnoRepository.save(turno);
    }

    public void eliminarTurnoDefinitivo(Long id, User adminUser) {
        if (!adminUser.getRol().name().equals("ADMIN")) {
            throw new UnauthorizedException("Acceso denegado: Solo administradores pueden eliminar registros.");
        }
        
        Turno turno = obtenerTurnoPorId(id);
        turnoRepository.delete(turno);
    }
}