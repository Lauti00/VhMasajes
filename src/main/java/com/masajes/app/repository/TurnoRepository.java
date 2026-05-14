package com.masajes.app.repository;

import com.masajes.app.model.Turno;
import com.masajes.app.model.EstadoTurno;
import com.masajes.app.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TurnoRepository extends JpaRepository<Turno, Long> {

    List<Turno> findByFechaBetween(LocalDateTime inicio, LocalDateTime fin);

    List<Turno> findByUsuarioOrderByFechaDesc(User usuario);

    long countByEstado(EstadoTurno estado);

    @Query("SELECT COALESCE(SUM(t.precioCobrado), 0.0) FROM Turno t WHERE t.estado = com.masajes.app.model.EstadoTurno.ATENDIDO")
    Double sumarGananciasTotales();

   @Query(value = """
    SELECT 
        EXTRACT(MONTH FROM t.fecha) AS numero_mes,
        TO_CHAR(t.fecha, 'Month') AS mes,
        SUM(t.precio_cobrado) AS total
    FROM turnos t
    WHERE t.estado = 'ATENDIDO'
    GROUP BY numero_mes, mes
    ORDER BY numero_mes
    """, nativeQuery = true)
List<Object[]> obtenerGananciasPorMes();

    @Query("SELECT s.nombre, COUNT(t) FROM Turno t JOIN t.servicio s " +
           "GROUP BY s.nombre")
    List<Object[]> obtenerPopularidadServicios();

    List<Turno> findTop5ByFechaAfterOrderByFechaAsc(LocalDateTime ahora);

    // NUEVO: Para filtrar turnos ocupados en un día específico y ver disponibilidad
    @Query("SELECT t FROM Turno t WHERE t.fecha >= :inicio AND t.fecha <= :fin")
    List<Turno> buscarTurnosDelDia(@Param("inicio") LocalDateTime inicio, @Param("fin") LocalDateTime fin);
}