package com.masajes.app.repository;

import com.masajes.app.entity.User;
import com.masajes.app.model.EstadoTurno;
import com.masajes.app.model.Turno;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TurnoRepository extends JpaRepository<Turno, Long> {

    // =========================================
    // TURNOS POR FECHA
    // =========================================

    List<Turno> findByFechaBetween(
        LocalDateTime inicio,
        LocalDateTime fin
    );

    // =========================================
    // TURNOS DEL USUARIO
    // =========================================

    List<Turno> findByUsuarioOrderByFechaDesc(
        User usuario
    );

    // =========================================
    // CONTAR TURNOS POR ESTADO
    // =========================================

    long countByEstado(
        EstadoTurno estado
    );

    // =========================================
    // VALIDAR SI YA EXISTE UN TURNO
    // EN ESA FECHA Y HORA
    // =========================================

    boolean existsByFechaAndEstadoNot(
        LocalDateTime fecha,
        EstadoTurno estado
    );

    // =========================================
    // GANANCIAS TOTALES
    // =========================================

    @Query("""
        SELECT COALESCE(SUM(t.precioCobrado), 0.0)
        FROM Turno t
        WHERE t.estado = com.masajes.app.model.EstadoTurno.ATENDIDO
    """)
    Double sumarGananciasTotales();

    // =========================================
    // GANANCIAS POR MES
    // =========================================

    @Query(value = """
        SELECT 
            EXTRACT(MONTH FROM t.fecha) AS numero_mes,
            TRIM(TO_CHAR(t.fecha, 'Month')) AS mes,
            SUM(t.precio_cobrado) AS total
        FROM turnos t
        WHERE t.estado = 'ATENDIDO'
        GROUP BY numero_mes, mes
        ORDER BY numero_mes
    """, nativeQuery = true)
    List<Object[]> obtenerGananciasPorMes();

    // =========================================
    // POPULARIDAD DE SERVICIOS
    // =========================================

    @Query("""
        SELECT s.nombre, COUNT(t)
        FROM Turno t
        JOIN t.servicio s
        GROUP BY s.nombre
    """)
    List<Object[]> obtenerPopularidadServicios();

    // =========================================
    // PRÓXIMOS 5 TURNOS
    // =========================================

    List<Turno> findTop5ByFechaAfterOrderByFechaAsc(
        LocalDateTime ahora
    );

    // =========================================
    // TURNOS DE UN DÍA ESPECÍFICO
    // =========================================

    @Query("""
        SELECT t
        FROM Turno t
        WHERE t.fecha >= :inicio
        AND t.fecha <= :fin
    """)
    List<Turno> buscarTurnosDelDia(
        @Param("inicio") LocalDateTime inicio,
        @Param("fin") LocalDateTime fin
    );

    // =========================================
    // TURNOS FUTUROS DEL USUARIO
    // =========================================

    List<Turno> findByUsuarioAndFechaAfterOrderByFechaAsc(
        User usuario,
        LocalDateTime fecha
    );

    // =========================================
    // TURNOS PASADOS DEL USUARIO
    // =========================================

    List<Turno> findByUsuarioAndFechaBeforeOrderByFechaDesc(
        User usuario,
        LocalDateTime fecha
    );
}