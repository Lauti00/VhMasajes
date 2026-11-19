package com.masajes.app.service;

import com.masajes.app.model.ConfiguracionHorario;
import com.masajes.app.repository.ConfiguracionHorarioRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.List;

@Service
public class ConfiguracionHorarioService {

    @Autowired
    private ConfiguracionHorarioRepository repository;

    // Magia: Se ejecuta automáticamente al arrancar Spring Boot
    @PostConstruct
    public void inicializarHorariosPorDefecto() {
        if (repository.count() == 0) {
            for (DayOfWeek dia : DayOfWeek.values()) {
                ConfiguracionHorario config = new ConfiguracionHorario();
                config.setDiaSemana(dia);
                
                // Lunes a Viernes (1 a 5) trabajan. Sábado (6) y Domingo (7) descansan.
                if (dia.getValue() >= 1 && dia.getValue() <= 5) {
                    config.setHoraInicio(LocalTime.of(8, 0));
                    config.setHoraFin(LocalTime.of(18, 0));
                    config.setInicioAlmuerzo(LocalTime.of(13, 0));
                    config.setFinAlmuerzo(LocalTime.of(14, 0));
                    config.setActivo(true);
                } else {
                    config.setActivo(false);
                }
                repository.save(config);
            }
            System.out.println("✅ Horarios por defecto creados con éxito.");
        }
    }

    // Método para ver todos los horarios (Lo usará React para mostrar el panel)
    public List<ConfiguracionHorario> obtenerTodos() {
        return repository.findAll();
    }

    // Método para buscar un día específico (Lo usaremos para calcular disponibilidad)
    public ConfiguracionHorario obtenerPorDia(DayOfWeek dia) {
        return repository.findByDiaSemana(dia);
    }

    // Método para que el Médico guarde sus cambios desde React
    public List<ConfiguracionHorario> actualizarHorarios(List<ConfiguracionHorario> nuevosHorarios) {
        return repository.saveAll(nuevosHorarios);
    }
}