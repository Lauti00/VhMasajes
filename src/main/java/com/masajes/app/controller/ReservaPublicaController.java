package com.masajes.app.controller;

import com.masajes.app.dto.ActualizarReservaPublicaRequest;
import com.masajes.app.dto.ReservaPublicaCreada;
import com.masajes.app.dto.ReservaPublicaRequest;
import com.masajes.app.dto.TurnoDTO;
import com.masajes.app.mapper.TurnoMapper;
import com.masajes.app.model.Turno;
import com.masajes.app.service.ReservaPublicaService;
import com.masajes.app.service.WhatsappConfirmationService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/reservas")
public class ReservaPublicaController {
    private final ReservaPublicaService reservaService;
    private final TurnoMapper turnoMapper;
    private final WhatsappConfirmationService whatsappService;

    public ReservaPublicaController(ReservaPublicaService reservaService, TurnoMapper turnoMapper, WhatsappConfirmationService whatsappService) {
        this.reservaService = reservaService;
        this.turnoMapper = turnoMapper;
        this.whatsappService = whatsappService;
    }

    @PostMapping
    public ResponseEntity<ReservaPublicaCreada> crear(@Valid @RequestBody ReservaPublicaRequest request) {
        ReservaPublicaService.ReservaCreada creada = reservaService.crear(request);
        boolean whatsappEnviado = whatsappService.enviarConfirmacion(request, creada.turno().getServicio(), creada.turno().getFecha(), creada.token());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ReservaPublicaCreada(turnoMapper.toDTO(creada.turno()), creada.token(), whatsappEnviado));
    }

    @GetMapping("/gestion")
    public ResponseEntity<TurnoDTO> consultar(@RequestHeader("X-Turno-Token") String token) {
        Turno turno = reservaService.consultar(token);
        return ResponseEntity.ok(turnoMapper.toDTO(turno));
    }

    @GetMapping("/gestion/disponibilidad")
    public ResponseEntity<java.util.List<String>> disponibilidad(
            @RequestHeader("X-Turno-Token") String token,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha,
            @RequestParam Long servicioId) {
        return ResponseEntity.ok(reservaService.disponibilidad(token, fecha, servicioId));
    }

    @PutMapping("/gestion")
    public ResponseEntity<TurnoDTO> actualizar(
            @RequestHeader("X-Turno-Token") String token,
            @Valid @RequestBody ActualizarReservaPublicaRequest request) {
        Turno turno = reservaService.actualizar(token, request.fecha(), request.servicioId(), request.notas());
        return ResponseEntity.ok(turnoMapper.toDTO(turno));
    }

    @DeleteMapping("/gestion")
    public ResponseEntity<Void> cancelar(@RequestHeader("X-Turno-Token") String token) {
        reservaService.cancelar(token);
        return ResponseEntity.noContent().build();
    }
}
