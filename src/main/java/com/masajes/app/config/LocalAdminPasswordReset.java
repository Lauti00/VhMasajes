package com.masajes.app.config;

import com.masajes.app.entity.User;
import com.masajes.app.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@Profile("local")
@ConditionalOnProperty(name = "local.admin.reset-password")
public class LocalAdminPasswordReset implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${LOCAL_ADMIN_EMAIL:admin@masajes.local}")
    private String adminEmail;

    @Value("${local.admin.reset-password}")
    private String newPassword;

    public LocalAdminPasswordReset(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (newPassword.length() < 12) {
            throw new IllegalArgumentException("La nueva contraseña debe tener al menos 12 caracteres.");
        }

        User admin = userRepository.findByEmail(adminEmail)
                .filter(user -> user.getRol() == User.Role.ADMIN)
                .orElseThrow(() -> new IllegalStateException(
                        "No existe una cuenta administradora local con el correo configurado."));

        admin.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(admin);
        System.out.println("Contraseña del administrador local restablecida. Ya podés iniciar sesión.");
    }
}
