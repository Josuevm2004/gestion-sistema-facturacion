package com.facturacion;

import com.facturacion.entity.UsuarioAdmin;
import com.facturacion.repository.UsuarioAdminRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
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
	public CommandLineRunner initData(UsuarioAdminRepository usuarioAdminRepository, PasswordEncoder passwordEncoder) {
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
		};
	}
}
