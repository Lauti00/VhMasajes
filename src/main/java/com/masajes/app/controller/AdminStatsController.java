package com.masajes.app.controller;

import com.masajes.app.dto.DashboardStatsDTO;
import com.masajes.app.model.EstadoTurno;
import com.masajes.app.repository.TurnoRepository;
import com.masajes.app.repository.UserRepository; // Necesitarás este para contar clientes
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/stats")
public class AdminStatsController {

    @Autowired
    private TurnoRepository turnoRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DashboardStatsDTO> getDashboardStats() {
        DashboardStatsDTO dto = new DashboardStatsDTO();

        // 1. KPIs Simples
        dto.setGananciasTotales(turnoRepository.sumarGananciasTotales());
        
        LocalDateTime inicioHoy = LocalDateTime.now().with(LocalTime.MIN);
        LocalDateTime finHoy = LocalDateTime.now().with(LocalTime.MAX);
        dto.setTurnosHoy(turnoRepository.findByFechaBetween(inicioHoy, finHoy).size());
        
        dto.setTotalClientes(userRepository.count()); // Cuenta todos los usuarios registrados

        // 2. Mapear Ganancias Mensuales para Recharts
        List<Map<String, Object>> gananciasMes = turnoRepository.obtenerGananciasPorMes().stream().map(obj -> {
            Map<String, Object> map = new HashMap<>();
            map.put("name", obj[0]);  // Nombre del mes
            map.put("total", obj[1]); // Suma
            return map;
        }).collect(Collectors.toList());
        dto.setGananciasMensuales(gananciasMes);

        // 3. Mapear Popularidad de Servicios
        List<Map<String, Object>> popularidad = turnoRepository.obtenerPopularidadServicios().stream().map(obj -> {
            Map<String, Object> map = new HashMap<>();
            map.put("name", obj[0]);  // Nombre del servicio
            map.put("value", obj[1]); // Cantidad
            return map;
        }).collect(Collectors.toList());
        dto.setPopularidadServicios(popularidad);

        return ResponseEntity.ok(dto);
    }
}