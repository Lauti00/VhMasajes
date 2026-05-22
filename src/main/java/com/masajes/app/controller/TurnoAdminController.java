package com.masajes.app.controller;

import com.masajes.app.dto.TurnoDTO;
import com.masajes.app.entity.User;
import com.masajes.app.mapper.TurnoMapper;
import com.masajes.app.model.EstadoTurno;
import com.masajes.app.model.Turno;
import com.masajes.app.repository.TurnoRepository;
import com.masajes.app.service.TurnoAdminService;

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
@Tag(name = "Turnos Admin", description = "Endpoints administrativos")
@SecurityRequirement(name = "bearerAuth")
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('ADMIN')")
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
            throw new RuntimeException("Usuario no autenticado");
        }
        return (User) auth.getPrincipal();
    }

    @GetMapping
    public ResponseEntity<List<TurnoDTO>> listarTodos() {
        List<TurnoDTO> turnos = turnoAdminService.obtenerTodosLosTurnos()
                .stream()
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
            @RequestParam EstadoTurno nuevoEstado
    ) {
        Turno actualizado = turnoAdminService.cambiarEstadoTurno(id, nuevoEstado);
        return ResponseEntity.ok(turnoMapper.toDTO(actualizado));
    }

    // ==========================================
    // NUEVO: EDITAR TURNO (REPROGRAMAR / CAMBIAR SERVICIO)
    // ==========================================
    @PutMapping("/{id}")
    public ResponseEntity<TurnoDTO> editarTurno(
            @PathVariable Long id,
            @RequestBody TurnoDTO turnoEditado
    ) {
        // Asumimos que vas a agregar el método 'editarTurno' en tu TurnoAdminService
        Turno actualizado = turnoAdminService.editarTurno(id, turnoEditado);
        return ResponseEntity.ok(turnoMapper.toDTO(actualizado));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarDefinitivo(@PathVariable Long id) {
        User admin = getUsuarioAutenticado();
        turnoAdminService.eliminarTurnoDefinitivo(id, admin);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("ganancias", turnoRepository.sumarGananciasTotales());
        stats.put("totalTurnos", turnoRepository.countByEstado(EstadoTurno.ATENDIDO));
        stats.put("ausencias", turnoRepository.countByEstado(EstadoTurno.AUSENTE));
        return ResponseEntity.ok(stats);
    }
}