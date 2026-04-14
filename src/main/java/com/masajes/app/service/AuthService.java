package com.masajes.app.service;

import com.masajes.app.dto.*;
import com.masajes.app.entity.User;
import com.masajes.app.exception.UnauthorizedException;
import com.masajes.app.mapper.UserMapper;
import com.masajes.app.repository.UserRepository;
import com.masajes.app.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class AuthService {
    
    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Autowired
    private AuthenticationManager authenticationManager;
    
    @Autowired
    private JwtTokenProvider jwtTokenProvider;
    
    @Autowired
    private UserMapper userMapper;
    
    public AuthResponse register(RegisterRequest request) {
        // Validar que las contraseñas coincidan
        if (!request.getPassword().equals(request.getPasswordConfirm())) {
            throw new UnauthorizedException("Las contraseñas no coinciden");
        }
        
        // Verificar si el email ya existe
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new UnauthorizedException("El email ya está registrado");
        }
        
        // Crear nuevo usuario
        User user = User.builder()
            .nombre(request.getNombre())
            .email(request.getEmail())
            .password(passwordEncoder.encode(request.getPassword()))
            .telefono(request.getTelefono())
            .rol(User.Role.USER)
            .activo(true)
            .build();
        
        userRepository.save(user);
        logger.info("Nuevo usuario registrado: {}", request.getEmail());
        
        // Generar token
        String token = jwtTokenProvider.generateTokenFromEmail(user.getEmail());
        
        return AuthResponse.builder()
            .token(token)
            .usuario(userMapper.toDTO(user))
            .build();
    }
    
    public AuthResponse login(LoginRequest request) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                    request.getEmail(),
                    request.getPassword()
                )
            );
            
            String token = jwtTokenProvider.generateToken(authentication);
            User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UnauthorizedException("Usuario no encontrado"));
            
            logger.info("Login exitoso: {}", request.getEmail());
            
            return AuthResponse.builder()
                .token(token)
                .usuario(userMapper.toDTO(user))
                .build();
                
        } catch (Exception e) {
            logger.error("Error en login: {}", e.getMessage());
            throw new UnauthorizedException("Email o contraseña incorrectos");
        }
    }
}
