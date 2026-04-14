package com.masajes.app.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HomeController {

    @GetMapping("/")
    public String home() {
        return "✅ Backend VhMasajes funcionando correctamente";
    }

    @GetMapping("/health")
    public String health() {
        return "OK";
    }
}