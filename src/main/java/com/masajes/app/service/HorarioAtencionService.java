package com.masajes.app.service; 

import com.masajes.app.model.HorarioAtencion;
import com.masajes.app.repository.HorarioAtencionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class HorarioAtencionService {

    @Autowired
    private HorarioAtencionRepository repository;

    // Devuelve la configuración de toda la semana
    public List<HorarioAtencion> obtenerTodos() {
        return repository.findAll();
    }

    // Recibe una lista de horarios (toda la semana) y la guarda o actualiza
    public List<HorarioAtencion> guardarHorarios(List<HorarioAtencion> horarios) {
        return repository.saveAll(horarios);
    }
}