package com.masajes.app.config; // Ajusta el paquete si es necesario

import com.masajes.app.entity.User;
import com.masajes.app.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class AdminSeeder implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // 1. Definimos el correo oficial del administrador
        String adminEmail = "admin@masajes.com";

        // 2. Buscamos si ya existe (para no crearlo duplicado cada vez que reinicias el backend)
        if (userRepository.findByEmail(adminEmail).isEmpty()) {
            
            // 3. Si no existe, lo creamos con el Rol ADMIN
            User admin = new User();
            admin.setNombre("Administrador Principal");
            admin.setEmail(adminEmail);
            // ¡OJO! Encriptamos la contraseña para que Spring Security te deje iniciar sesión
            admin.setPassword(passwordEncoder.encode("Admin123!")); 
            admin.setTelefono("1122334455");
            admin.setRol(User.Role.ADMIN); // Le asignamos tu Enum de ADMIN
            admin.setActivo(true);

            userRepository.save(admin);
            
            System.out.println("✅ SEMBRADOR: Cuenta de Administrador creada con éxito.");
            System.out.println("📧 Correo: " + adminEmail);
            System.out.println("🔑 Contraseña: Admin123!");
        } else {
            System.out.println("✅ SEMBRADOR: El Administrador ya existe en la base de datos. Saltando creación.");
        }
    }
}