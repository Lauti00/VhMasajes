package com.masajes.app.repository; // Ajusta a tu paquete

import com.masajes.app.model.HorarioAtencion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface HorarioAtencionRepository extends JpaRepository<HorarioAtencion, Long> {
    
    // Método clave para buscar la configuración de un día específico (ej: buscar el Lunes)
    Optional<HorarioAtencion> findByDiaSemana(int diaSemana);
}