package com.masajes.app.repository; // Ajusta a tu paquete

import com.masajes.app.model.HorarioAtencion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;

@Repository
public interface HorarioAtencionRepository extends JpaRepository<HorarioAtencion, Long> {
    
    // Método clave para buscar la configuración de un día específico (ej: buscar el Lunes)
    Optional<HorarioAtencion> findByDiaSemana(int diaSemana);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT h FROM HorarioAtencion h WHERE h.diaSemana = :diaSemana")
    Optional<HorarioAtencion> findByDiaSemanaForUpdate(@Param("diaSemana") int diaSemana);
}
