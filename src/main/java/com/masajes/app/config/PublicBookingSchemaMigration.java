package com.masajes.app.config;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/** Idempotent bridge for existing PostgreSQL deployments using Hibernate ddl-auto=update. */
@Component
public class PublicBookingSchemaMigration implements ApplicationRunner {
    private final JdbcTemplate jdbcTemplate;

    public PublicBookingSchemaMigration(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        jdbcTemplate.execute("ALTER TABLE turnos ALTER COLUMN usuario_id DROP NOT NULL");
        jdbcTemplate.execute("ALTER TABLE turnos ADD COLUMN IF NOT EXISTS token_gestion_hash VARCHAR(64)");
        jdbcTemplate.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_turno_token_gestion ON turnos (token_gestion_hash)");
    }
}
