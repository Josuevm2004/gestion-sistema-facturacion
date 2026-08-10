package com.facturacion;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class WebAppFacturacionApplication {

	public static void main(String[] args) {
		SpringApplication.run(WebAppFacturacionApplication.class, args);
	}

}
