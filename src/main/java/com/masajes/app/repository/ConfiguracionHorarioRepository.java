package com.masajes.app.repository;

import com.masajes.app.model.ConfiguracionHorario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.DayOfWeek;

@Repository
public interface ConfiguracionHorarioRepository extends JpaRepository<ConfiguracionHorario, Long> {
    
    // Este método es crucial para que el TurnoService busque las reglas de un día específico
    ConfiguracionHorario findByDiaSemana(DayOfWeek diaSemana);
}