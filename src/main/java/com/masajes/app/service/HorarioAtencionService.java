package com.masajes.app.service; 

import com.masajes.app.model.HorarioAtencion;
import com.masajes.app.repository.HorarioAtencionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import jakarta.annotation.PostConstruct;

import java.util.List;

@Service
public class HorarioAtencionService {

    @Autowired
    private HorarioAtencionRepository repository;

    @PostConstruct
    public void inicializarHorariosSemanales() {
        if (repository.count() > 0) return;
        List<HorarioAtencion> horariosIniciales = new java.util.ArrayList<>();
        for (int dia = 1; dia <= 7; dia++) {
            HorarioAtencion horario = new HorarioAtencion();
            horario.setDiaSemana(dia);
            horario.setLaborable(dia <= 5);
            horario.setHoraApertura(dia <= 5 ? java.time.LocalTime.of(8, 0) : null);
            horario.setHoraCierre(dia <= 5 ? java.time.LocalTime.of(18, 0) : null);
            horariosIniciales.add(horario);
        }
        repository.saveAll(horariosIniciales);
    }

    // Devuelve la configuración de toda la semana
    public List<HorarioAtencion> obtenerTodos() {
        return repository.findAll();
    }

    // Recibe una lista de horarios (toda la semana) y la guarda o actualiza
    public List<HorarioAtencion> guardarHorarios(List<HorarioAtencion> horarios) {
        return repository.saveAll(horarios);
    }
}
