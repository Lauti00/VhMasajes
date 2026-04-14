package com.masajes.app.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegisterRequest {
    
    @NotBlank(message = "El nombre es requerido")
    @Size(min = 3, message = "El nombre debe tener al menos 3 caracteres")
    private String nombre;
    
    @Email(message = "El email debe ser válido")
    @NotBlank(message = "El email es requerido")
    private String email;
    
    @NotBlank(message = "La contraseña es requerida")
    @Size(min = 6, message = "La contraseña debe tener al menos 6 caracteres")
    private String password;
    
    @NotBlank(message = "La confirmación de contraseña es requerida")
    private String passwordConfirm;
    
    private String telefono;
}
