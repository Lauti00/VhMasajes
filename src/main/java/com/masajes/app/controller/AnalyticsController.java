package com.masajes.app.controller; // Asegúrate de que coincida con tu paquete

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
@CrossOrigin(origins = "*") // Permite que React se conecte sin problemas de CORS
public class AnalyticsController {

    @GetMapping("/resumen")
    public ResponseEntity<Map<String, Object>> getResumen() {
        Map<String, Object> stats = new HashMap<>();
        // TODO: Más adelante calcularemos esto con la Base de Datos
        stats.put("ganancias", 25000); 
        stats.put("totalTurnos", 15);
        stats.put("ausencias", 2);
        
        return ResponseEntity.ok(stats);
    }
}