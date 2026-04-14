package com.masajes.app;

import com.masajes.app.model.Service;
import com.masajes.app.repository.ServiceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import java.math.BigDecimal;

@SpringBootApplication(scanBasePackages = "com.masajes")
public class AppApplication {

    public static void main(String[] args) {
        SpringApplication.run(AppApplication.class, args);
    }

    @Bean
    CommandLineRunner initData(ServiceRepository serviceRepository) {
        return args -> {
            if (serviceRepository.count() == 0) {
                // Crear servicios de ejemplo usando setters (Sin Lombok)
                
                Service masajeRelajante = new Service();
                masajeRelajante.setNombre("Masaje Relajante");
                masajeRelajante.setDescripcion("Masaje suave para relajación completa");
                masajeRelajante.setDuracionMinutos(60);
                masajeRelajante.setPrecio(new BigDecimal("50.00"));
                masajeRelajante.setActivo(true);

                Service masajeDescontracturante = new Service();
                masajeDescontracturante.setNombre("Masaje Descontracturante");
                masajeDescontracturante.setDescripcion("Masaje profundo para eliminar contracturas");
                masajeDescontracturante.setDuracionMinutos(90);
                masajeDescontracturante.setPrecio(new BigDecimal("75.00"));
                masajeDescontracturante.setActivo(true);

                Service masajePiedras = new Service();
                masajePiedras.setNombre("Masaje con Piedras Calientes");
                masajePiedras.setDescripcion("Masaje terapéutico con piedras volcánicas");
                masajePiedras.setDuracionMinutos(75);
                masajePiedras.setPrecio(new BigDecimal("85.00"));
                masajePiedras.setActivo(true);

                serviceRepository.save(masajeRelajante);
                serviceRepository.save(masajeDescontracturante);
                serviceRepository.save(masajePiedras);

                System.out.println("✅ Servicios de ejemplo creados:");
                System.out.println("  - Masaje Relajante (ID: 1)");
                System.out.println("  - Masaje Descontracturante (ID: 2)");
                System.out.println("  - Masaje con Piedras Calientes (ID: 3)");
            }
        };
    }
}