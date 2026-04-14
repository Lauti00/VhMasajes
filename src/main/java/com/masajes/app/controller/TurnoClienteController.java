package com.masajes.app.controller;

import com.masajes.app.dto.TurnoCreateRequest;
import com.masajes.app.dto.TurnoDTO;
import com.masajes.app.entity.User;
import com.masajes.app.mapper.TurnoMapper;
import com.masajes.app.model.Turno;
import com.masajes.app.service.TurnoClienteService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/turnos")
@Tag(name = "Turnos Cliente", description = "Endpoints para que los clientes gestionen sus reservas")
@SecurityRequirement(name = "bearerAuth")
@CrossOrigin(origins = "*")
public class TurnoClienteController {

    @Autowired
    private TurnoClienteService turnoClienteService;

    @Autowired
    private TurnoMapper turnoMapper;

    private User getUsuarioAutenticado() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof User)) {
            throw new RuntimeException("Error: No se encontró sesión de usuario válida.");
        }
        return (User) auth.getPrincipal();
    }

    @PostMapping
    public ResponseEntity<TurnoDTO> crear(@Valid @RequestBody TurnoCreateRequest request) {
        User usuario = getUsuarioAutenticado();
        Turno turnoCreado = turnoClienteService.crearReserva(request, usuario);
        return ResponseEntity.status(HttpStatus.CREATED).body(turnoMapper.toDTO(turnoCreado));
    }

    @GetMapping("/mis-turnos")
    public ResponseEntity<List<TurnoDTO>> misTurnos() {
        User usuario = getUsuarioAutenticado();
        List<TurnoDTO> turnos = turnoClienteService.getMisTurnos(usuario).stream()
            .map(turnoMapper::toDTO)
            .collect(Collectors.toList());
        return ResponseEntity.ok(turnos);
    }

    @GetMapping("/disponibilidad/{fecha}")
    public ResponseEntity<List<String>> obtenerDisponibilidad(
        @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) {
        List<String> horasLibres = turnoClienteService.getHorasDisponibles(fecha);
        return ResponseEntity.ok(horasLibres);
    }

    @PutMapping("/{id}/cancelar")
    public ResponseEntity<TurnoDTO> cancelarMiTurno(@PathVariable Long id) {
        User usuario = getUsuarioAutenticado();
        Turno cancelado = turnoClienteService.cancelarMiTurno(id, usuario);
        return ResponseEntity.ok(turnoMapper.toDTO(cancelado));
    }
}