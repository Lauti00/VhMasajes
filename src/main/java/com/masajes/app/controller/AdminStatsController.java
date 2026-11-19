package com.masajes.app.controller;

import com.masajes.app.dto.DashboardStatsDTO;
import com.masajes.app.model.EstadoTurno;
import com.masajes.app.repository.TurnoRepository;
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
import java.time.LocalDate;
import java.time.Month;
import java.time.format.TextStyle;
import java.util.Locale;
import java.time.Clock;

@RestController
@RequestMapping("/api/admin/stats")
public class AdminStatsController {

    @Autowired
    private TurnoRepository turnoRepository;

    @Autowired
    private Clock businessClock;

    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DashboardStatsDTO> getDashboardStats(
            @org.springframework.web.bind.annotation.RequestParam(required = false) Integer anio) {
        DashboardStatsDTO dto = new DashboardStatsDTO();
        int anioConsulta = anio == null ? LocalDate.now(businessClock).getYear() : anio;

        // 1. KPIs Simples
        dto.setGananciasTotales(turnoRepository.sumarGananciasTotales());
        
        LocalDateTime inicioHoy = LocalDate.now(businessClock).atStartOfDay();
        LocalDateTime finHoy = LocalDate.now(businessClock).atTime(LocalTime.MAX);
        dto.setTurnosHoy(turnoRepository.findByFechaBetween(inicioHoy, finHoy).size());
        
        dto.setTotalClientes(turnoRepository.countDistinctPatientsWithBookings());

        // 2. Mapear Ganancias Mensuales para Recharts
        Map<Integer, Double> totalesPorMes = turnoRepository.obtenerGananciasPorMes(anioConsulta).stream().collect(Collectors.toMap(
            obj -> ((Number) obj[0]).intValue(),
            obj -> ((Number) obj[1]).doubleValue()
        ));
        List<Map<String, Object>> gananciasMes = java.util.Arrays.stream(Month.values()).map(mes -> {
            Map<String, Object> map = new HashMap<>();
            map.put("name", mes.getDisplayName(TextStyle.SHORT, Locale.forLanguageTag("es-AR")));
            map.put("total", totalesPorMes.getOrDefault(mes.getValue(), 0.0));
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
