package com.masajes.app.controller;

import com.masajes.app.model.EstadoTurno;
import com.masajes.app.repository.TurnoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    @Autowired
    private TurnoRepository turnoRepository;

    @GetMapping("/resumen")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getResumen() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("ganancias", turnoRepository.sumarGananciasTotales());
        stats.put("totalTurnos", turnoRepository.count());
        stats.put("ausencias", turnoRepository.countByEstado(EstadoTurno.AUSENTE));
        
        return ResponseEntity.ok(stats);
    }
}
