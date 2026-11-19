package com.masajes.app.model;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "servicios")
public class Service {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nombre;

    private String descripcion;

    @Column(nullable = false)
    private Integer duracionMinutos; // Para que el calendario sepa cuánto bloquear

    @Column(nullable = false)
    private BigDecimal precio; // Para las analíticas de ganancias

    private Boolean activo = true; // Para "borrar" servicios sin romper turnos viejos

    // CONSTRUCTOR VACÍO (Obligatorio para Spring/JPA)
    public Service() {
    }

    // GETTERS Y SETTERS MANUALES (Reemplazan a @Data)
    
    public Long getId() { 
        return id; 
    }
    
    public void setId(Long id) { 
        this.id = id; 
    }

    public String getNombre() { 
        return nombre; 
    }
    
    public void setNombre(String nombre) { 
        this.nombre = nombre; 
    }

    public String getDescripcion() { 
        return descripcion; 
    }
    
    public void setDescripcion(String descripcion) { 
        this.descripcion = descripcion; 
    }

    public Integer getDuracionMinutos() { 
        return duracionMinutos; 
    }
    
    public void setDuracionMinutos(Integer duracionMinutos) { 
        this.duracionMinutos = duracionMinutos; 
    }

    public BigDecimal getPrecio() { 
        return precio; 
    }
    
    public void setPrecio(BigDecimal precio) { 
        this.precio = precio; 
    }

    public Boolean getActivo() { 
        return activo; 
    }
    
    public void setActivo(Boolean activo) { 
        this.activo = activo; 
    }
}