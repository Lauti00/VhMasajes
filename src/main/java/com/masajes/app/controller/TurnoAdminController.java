package com.masajes.app.controller;

import com.masajes.app.dto.TurnoDTO;
import com.masajes.app.entity.User;
import com.masajes.app.mapper.TurnoMapper;
import com.masajes.app.model.EstadoTurno;
import com.masajes.app.model.Turno;
import com.masajes.app.service.TurnoAdminService;
import com.masajes.app.repository.TurnoRepository;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/turnos")
@Tag(name = "Turnos Admin", description = "Endpoints administrativos para gestión de turnos")
@SecurityRequirement(name = "bearerAuth")
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('ADMIN')") // Protege TODO el controlador de una vez
public class TurnoAdminController {

    @Autowired
    private TurnoAdminService turnoAdminService;

    @Autowired
    private TurnoRepository turnoRepository;

    @Autowired
    private TurnoMapper turnoMapper;

    private User getUsuarioAutenticado() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof User)) {
            throw new RuntimeException("Error: No se encontró sesión de usuario válida.");
        }
        return (User) auth.getPrincipal();
    }

    @GetMapping
    public ResponseEntity<List<TurnoDTO>> listarTodos() {
        List<TurnoDTO> turnos = turnoAdminService.obtenerTodosLosTurnos().stream()
            .map(turnoMapper::toDTO)
            .collect(Collectors.toList());
        return ResponseEntity.ok(turnos);
    }

    @GetMapping("/{id}")
    public ResponseEntity<TurnoDTO> obtenerTurno(@PathVariable Long id) {
        Turno turno = turnoAdminService.obtenerTurnoPorId(id);
        return ResponseEntity.ok(turnoMapper.toDTO(turno));
    }

    @PatchMapping("/{id}/estado")
    public ResponseEntity<TurnoDTO> actualizarEstado(
            @PathVariable Long id, 
            @RequestParam("nuevoEstado") EstadoTurno nuevoEstado) {
        Turno actualizado = turnoAdminService.cambiarEstadoTurno(id, nuevoEstado);
        return ResponseEntity.ok(turnoMapper.toDTO(actualizado));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarDefinitivo(@PathVariable Long id) {
        User adminUser = getUsuarioAutenticado();
        turnoAdminService.eliminarTurnoDefinitivo(id, adminUser);
        return ResponseEntity.noContent().build();
    }

    // 📊 Endpoint de estadísticas rápidas
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("ganancias", turnoRepository.sumarGananciasTotales());
        stats.put("totalTurnos", turnoRepository.countByEstado(EstadoTurno.ATENDIDO));
        stats.put("ausencias", turnoRepository.countByEstado(EstadoTurno.AUSENTE));
        return ResponseEntity.ok(stats);
    }
}