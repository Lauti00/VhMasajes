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
    //  MÉTODO PARA EDITAR EL TURNO
    // ==========================================
   
    public Turno editarTurno(Long id, TurnoDTO turnoEditado) {
        // 1. Buscamos el turno existente
        Turno turno = obtenerTurnoPorId(id);
        
        // 2.  Verificar si YA EXISTE otro turno en esa misma fecha y hora
        // Excluimos el mismo turno que estamos editando (t.id != :id)
        Long turnosDuplicados = entityManager.createQuery(
                "SELECT COUNT(t) FROM Turno t WHERE t.fecha = :fecha AND t.id != :id", Long.class)
                .setParameter("fecha", turnoEditado.getFecha())
                .setParameter("id", id)
                .getSingleResult();

        if (turnosDuplicados > 0) {
            // Lanza un error si el horario ya está ocupado
            throw new IllegalArgumentException("Horario no disponible: Ya existe un turno reservado para esa fecha y hora.");
        }
        
        // 3. Si el horario está libre, procedemos a modificar los datos
        turno.setFecha(turnoEditado.getFecha());
        turno.setPrecioCobrado(turnoEditado.getPrecio());
        
        // 4. Buscamos la entidad Servicio por su nombre en la BD
        com.masajes.app.model.Service servicioEntity = entityManager.createQuery(
                "SELECT s FROM Service s WHERE s.nombre = :nombre", com.masajes.app.model.Service.class)
                .setParameter("nombre", turnoEditado.getServicio())
                .getResultList()
                .stream()
                .findFirst()
                .orElseThrow(() -> new RuntimeException("No se encontró un servicio registrado con el nombre: " + turnoEditado.getServicio()));

        turno.setServicio(servicioEntity);
        
        // 5. Guardamos y retornamos el turno actualizado
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