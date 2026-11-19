package com.masajes.app.dto;

import java.util.List;
import java.util.Map;

public class DashboardStatsDTO {
    private Double gananciasTotales;
    private long turnosHoy;
    private long totalClientes;
    private List<Map<String, Object>> gananciasMensuales;
    private List<Map<String, Object>> popularidadServicios;

    // Constructor vacío necesario para Jackson
    public DashboardStatsDTO() {}

    // --- GETTERS Y SETTERS (Indispensables) ---
    public Double getGananciasTotales() { return gananciasTotales; }
    public void setGananciasTotales(Double gananciasTotales) { this.gananciasTotales = gananciasTotales; }

    public long getTurnosHoy() { return turnosHoy; }
    public void setTurnosHoy(long turnosHoy) { this.turnosHoy = turnosHoy; }

    public long getTotalClientes() { return totalClientes; }
    public void setTotalClientes(long totalClientes) { this.totalClientes = totalClientes; }

    public List<Map<String, Object>> getGananciasMensuales() { return gananciasMensuales; }
    public void setGananciasMensuales(List<Map<String, Object>> gananciasMensuales) { this.gananciasMensuales = gananciasMensuales; }

    public List<Map<String, Object>> getPopularidadServicios() { return popularidadServicios; }
    public void setPopularidadServicios(List<Map<String, Object>> popularidadServicios) { this.popularidadServicios = popularidadServicios; }
}