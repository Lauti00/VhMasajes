package com.masajes.app.mapper;

import com.masajes.app.dto.UserDTO;
import com.masajes.app.entity.User;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {
    
    public UserDTO toDTO(User user) {
        if (user == null) {
            return null;
        }
        
        // Usamos el builder que ya tenías, pero con protecciones extra
        return UserDTO.builder()
            .id(user.getId())
            .nombre(user.getNombre())
            .email(user.getEmail())
            .telefono(user.getTelefono())
            // Verificamos que el rol no sea nulo antes de llamar a .name()
            .rol(user.getRol() != null ? user.getRol().name() : null)
            .createdAt(user.getCreatedAt())
            .build();
    }

    /**
     * Mapeo inverso: Útil para cuando el usuario quiera editar su perfil
     * desde la web (nombre, teléfono, etc).
     */
    public User toEntity(UserDTO dto) {
        if (dto == null) {
            return null;
        }

        User user = new User();
        user.setId(dto.getId());
        user.setNombre(dto.getNombre());
        user.setEmail(dto.getEmail());
        user.setTelefono(dto.getTelefono());
        // El rol y el password no suelen mapearse aquí por seguridad 
        // (se manejan en el Service de Auth)
        
        return user;
    }
}