package com.masajes.app.controller; 

import com.masajes.app.model.HorarioAtencion;
import com.masajes.app.service.HorarioAtencionService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/horarios")
@Tag(name = "Horarios", description = "Gestión de días y horarios de atención del centro")
@SecurityRequirement(name = "bearerAuth")
@CrossOrigin(origins = "*") // Para evitar bloqueos de React
public class HorarioAtencionController {

    @Autowired
    private HorarioAtencionService horarioService;

    // CUALQUIERA puede ver los horarios (para que el cliente sepa cuándo hay atención)
    @GetMapping
    public ResponseEntity<List<HorarioAtencion>> obtenerHorarios() {
        return ResponseEntity.ok(horarioService.obtenerTodos());
    }

    // SOLO EL ADMIN puede modificar los horarios de atención
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<HorarioAtencion>> guardarHorarios(@RequestBody List<HorarioAtencion> horarios) {
        List<HorarioAtencion> horariosGuardados = horarioService.guardarHorarios(horarios);
        return ResponseEntity.ok(horariosGuardados);
    }
}