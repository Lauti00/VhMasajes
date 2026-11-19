package com.masajes.app.controller;

import com.masajes.app.model.ConfiguracionHorario;
import com.masajes.app.service.ConfiguracionHorarioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/configuracion/horarios")
public class ConfiguracionHorarioController {

    @Autowired
    private ConfiguracionHorarioService service;

    // 🔒 Privado: Solo el Admin (médico) puede ver la configuración de sus horarios
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public ResponseEntity<List<ConfiguracionHorario>> obtenerHorarios() {
        return ResponseEntity.ok(service.obtenerTodos());
    }

    // 🔒 Privado: Solo el Admin (médico) puede modificar sus horarios
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping
    public ResponseEntity<List<ConfiguracionHorario>> actualizarHorarios(@RequestBody List<ConfiguracionHorario> horarios) {
        List<ConfiguracionHorario> actualizados = service.actualizarHorarios(horarios);
        return ResponseEntity.ok(actualizados);
    }
}