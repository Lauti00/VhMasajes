package com.masajes.app.config;

import java.time.Clock;
import java.time.ZoneId;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class TimeConfig {

    @Bean
    public Clock businessClock(@Value("${app.time-zone:America/Argentina/Buenos_Aires}") String timeZone) {
        return Clock.system(ZoneId.of(timeZone));
    }
}
