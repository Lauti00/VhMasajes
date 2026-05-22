package com.masajes.app.service;

import com.masajes.app.dto.TurnoDTO;
import com.masajes.app.entity.User;
import com.masajes.app.exception.ResourceNotFoundException;
import com.masajes.app.exception.UnauthorizedException;
import com.masajes.app.model.EstadoTurno;
import com.masajes.app.model.Turno;
import com.masajes.app.repository.TurnoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import jakarta.persistence.EntityManager; // 🆕 Para buscar el servicio por texto
import jakarta.persistence.PersistenceContext; // 🆕 Para inyectar el EntityManager
import java.util.List;

@Service
public class TurnoAdminService {

    @Autowired
    private TurnoRepository turnoRepository;

    @PersistenceContext
    private EntityManager entityManager; // 🆕 Manejador de entidad de JPA

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

    // ==========================================
    // CORREGIDO: MÉTODO PARA EDITAR EL TURNO
    // ==========================================
    public Turno editarTurno(Long id, TurnoDTO turnoEditado) {
        // 1. Buscamos el turno existente
        Turno turno = obtenerTurnoPorId(id);
        
        // 2. Modificamos la fecha
        turno.setFecha(turnoEditado.getFecha());
        
        
        turno.setPrecioCobrado(turnoEditado.getPrecio());
        
        
        com.masajes.app.model.Service servicioEntity = entityManager.createQuery(
                "SELECT s FROM Service s WHERE s.nombre = :nombre", com.masajes.app.model.Service.class)
                .setParameter("nombre", turnoEditado.getServicio())
                .getResultList()
                .stream()
                .findFirst()
                .orElseThrow(() -> new RuntimeException("No se encontró un servicio registrado con el nombre: " + turnoEditado.getServicio()));

        turno.setServicio(servicioEntity);
        
        // 5. Guardamos y retornamos
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