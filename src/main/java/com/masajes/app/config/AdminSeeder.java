package com.masajes.app.config;

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

        // Eliminamos el admin viejo si existe
        userRepository.findByEmail("admin@masajes.com")
                .ifPresent(userRepository::delete);

        // Creamos nuevamente el administrador
        User admin = new User();

        admin.setNombre("Administrador Principal");
        admin.setEmail("admin@masajes.com");
        admin.setPassword(passwordEncoder.encode("Admin123!"));
        admin.setTelefono("1122334455");
        admin.setRol(User.Role.ADMIN);
        admin.setActivo(true);

        userRepository.save(admin);

        System.out.println("✅ ADMIN RECREADO CORRECTAMENTE");
        System.out.println("📧 Correo: admin@masajes.com");
        System.out.println("🔑 Contraseña: Admin123!");
    }
}