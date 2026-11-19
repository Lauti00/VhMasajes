package com.masajes.app.config;

import com.masajes.app.entity.User;
import com.masajes.app.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Value;

@Component
public class AdminSeeder implements CommandLineRunner {

    @Value("${INITIAL_ADMIN_EMAIL:}")
    private String adminEmail;

    @Value("${INITIAL_ADMIN_PASSWORD:}")
    private String adminPassword;

    @Value("${INITIAL_ADMIN_NAME:Administrador}")
    private String adminName;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {

        if (adminEmail.isBlank() && adminPassword.isBlank()) return;
        if (adminEmail.isBlank() || adminPassword.isBlank()) {
            throw new IllegalStateException("Configura INITIAL_ADMIN_EMAIL e INITIAL_ADMIN_PASSWORD juntos.");
        }
        if (userRepository.existsByEmail(adminEmail)) return;

        // Creamos nuevamente el administrador
        User admin = new User();

        admin.setNombre(adminName);
        admin.setEmail(adminEmail);
        admin.setPassword(passwordEncoder.encode(adminPassword));
        admin.setRol(User.Role.ADMIN);
        admin.setActivo(true);

        userRepository.save(admin);

        System.out.println("Administrador inicial creado.");
    }
}
