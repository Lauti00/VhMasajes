package com.masajes.app.service;

import com.masajes.app.model.HorarioAtencion;
import com.masajes.app.repository.HorarioAtencionRepository;

import jakarta.annotation.PostConstruct;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class HorarioAtencionService {

    @Autowired
    private HorarioAtencionRepository repository;

    // =========================
    // CREA HORARIOS POR DEFECTO
    // =========================
    @PostConstruct
    public void inicializarHorarios() {

        if (repository.count() == 0) {

            List<HorarioAtencion> horarios =
                    new ArrayList<>();

            for (int i = 1; i <= 7; i++) {

                HorarioAtencion h =
                        new HorarioAtencion();

                h.setDiaSemana(i);

                // Lunes a viernes
                if (i <= 5) {

                    h.setLaborable(true);

                    h.setHoraApertura(
                            LocalTime.of(9, 0)
                    );

                    h.setHoraCierre(
                            LocalTime.of(18, 0)
                    );

                } else {

                    // Sábado y domingo
                    h.setLaborable(false);

                    h.setHoraApertura(
                            LocalTime.of(9, 0)
                    );

                    h.setHoraCierre(
                            LocalTime.of(18, 0)
                    );
                }

                horarios.add(h);
            }

            repository.saveAll(horarios);

            System.out.println(
                    "✅ Horarios inicializados"
            );
        }
    }

    // =========================
    // OBTENER TODOS
    // =========================
    public List<HorarioAtencion> obtenerTodos() {

        return repository.findAll()
                .stream()
                .sorted((a, b) ->
                        Integer.compare(
                                a.getDiaSemana(),
                                b.getDiaSemana()
                        )
                )
                .toList();
    }

    // =========================
    // GUARDAR
    // =========================
    public List<HorarioAtencion> guardarHorarios(
            List<HorarioAtencion> horarios
    ) {

        return repository.saveAll(horarios);
    }
}