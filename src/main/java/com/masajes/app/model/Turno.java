package com.masajes.app.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import com.masajes.app.entity.User;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "turnos", indexes = {
    @Index(name = "idx_fecha", columnList = "fecha"),
    @Index(name = "idx_usuario", columnList = "usuario_id"),
    @Index(name = "idx_estado", columnList = "estado")
})
public class Turno {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    private String cliente;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "servicio_id", nullable = false)
    @NotNull
    private com.masajes.app.model.Service servicio;

    @NotNull
    private LocalDateTime fecha;

    @Enumerated(EnumType.STRING)
    private EstadoTurno estado = EstadoTurno.PENDIENTE;

    @NotNull
    private BigDecimal precioCobrado = BigDecimal.ZERO;

    private String notas;

    // 🔴 CAMBIO IMPORTANTE (antes era LAZY)
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "usuario_id", nullable = false)
    private User usuario;

    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt;

    public Turno() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCliente() { return cliente; }
    public void setCliente(String cliente) { this.cliente = cliente; }

    public com.masajes.app.model.Service getServicio() { return servicio; }
    public void setServicio(com.masajes.app.model.Service servicio) { this.servicio = servicio; }

    public LocalDateTime getFecha() { return fecha; }
    public void setFecha(LocalDateTime fecha) { this.fecha = fecha; }

    public EstadoTurno getEstado() { return estado; }
    public void setEstado(EstadoTurno estado) { this.estado = estado; }

    public BigDecimal getPrecioCobrado() { return precioCobrado; }
    public void setPrecioCobrado(BigDecimal precioCobrado) { this.precioCobrado = precioCobrado; }

    public String getNotas() { return notas; }
    public void setNotas(String notas) { this.notas = notas; }

    public User getUsuario() { return usuario; }
    public void setUsuario(User usuario) { this.usuario = usuario; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}