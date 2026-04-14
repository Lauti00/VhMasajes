package com.masajes.app.controller;

import com.masajes.app.model.Service;
import com.masajes.app.repository.ServiceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/servicios")

public class ServiceController {

    @Autowired
    private ServiceRepository serviceRepository;

    // 🔓 Público: Cualquier usuario logueado puede ver la lista de servicios para pedir un turno
    @GetMapping
    public List<Service> listarServicios() {
        return serviceRepository.findAll();
    }

    // 🔒 Privado: Solo el ADMIN puede crear nuevos servicios (ej: Masaje de Piedras Calientes)
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<Service> crearServicio(@RequestBody Service servicio) {
        Service nuevo = serviceRepository.save(servicio);
        return ResponseEntity.ok(nuevo);
    }

    // 🔒 Privado: Solo el ADMIN puede editar precios o duraciones
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<Service> actualizarServicio(@PathVariable Long id, @RequestBody Service detalles) {
        Service servicio = serviceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Servicio no encontrado"));
        
        servicio.setNombre(detalles.getNombre());
        servicio.setPrecio(detalles.getPrecio());
        servicio.setDuracionMinutos(detalles.getDuracionMinutos());
        servicio.setDescripcion(detalles.getDescripcion());
        
        return ResponseEntity.ok(serviceRepository.save(servicio));
    }

    // 🔒 Privado: Solo el ADMIN puede eliminar
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarServicio(@PathVariable Long id) {
        serviceRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}