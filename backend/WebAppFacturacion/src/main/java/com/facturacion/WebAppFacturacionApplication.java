package com.facturacion;

import com.facturacion.entity.UsuarioAdmin;
import com.facturacion.repository.UsuarioAdminRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.TimeZone;

@SpringBootApplication
@EnableScheduling
public class WebAppFacturacionApplication {

	@PostConstruct
	public void init() {
		TimeZone.setDefault(TimeZone.getTimeZone("America/Lima"));
	}

	public static void main(String[] args) {
		TimeZone.setDefault(TimeZone.getTimeZone("America/Lima"));
		SpringApplication.run(WebAppFacturacionApplication.class, args);
	}

	@Bean
	public CommandLineRunner initData(UsuarioAdminRepository usuarioAdminRepository, PasswordEncoder passwordEncoder, JdbcTemplate jdbcTemplate) {
		return args -> {
			if (usuarioAdminRepository.findByUsername("admin").isEmpty()) {
				UsuarioAdmin admin = new UsuarioAdmin();
				admin.setUsername("admin");
				admin.setPassword(passwordEncoder.encode("admin123"));
				admin.setNombre("Administrador Sistema");
				admin.setEmail("admin@facturacion.com");
				admin.setRol("ADMIN");
				admin.setFechaCreacion(LocalDateTime.now(ZoneId.of("America/Lima")));
				usuarioAdminRepository.save(admin);
			}

			// Configurar ON DELETE CASCADE nativo en CockroachDB para pago y credencial_sol
			try {
				jdbcTemplate.execute("ALTER TABLE pago DROP CONSTRAINT IF EXISTS fkb15ggnkpjecemrcsb6bgarseg");
				jdbcTemplate.execute("ALTER TABLE pago DROP CONSTRAINT IF EXISTS fk_pago_cliente");
				jdbcTemplate.execute("ALTER TABLE pago ADD CONSTRAINT fk_pago_cliente FOREIGN KEY (cliente_id) REFERENCES cliente(id) ON DELETE CASCADE");
			} catch (Exception ignored) {}

			try {
				jdbcTemplate.execute("ALTER TABLE credencial_sol DROP CONSTRAINT IF EXISTS fk_credencial_sol_cliente");
				jdbcTemplate.execute("ALTER TABLE credencial_sol ADD CONSTRAINT fk_credencial_sol_cliente FOREIGN KEY (cliente_id) REFERENCES cliente(id) ON DELETE CASCADE");
			} catch (Exception ignored) {}
		};
	}
}
