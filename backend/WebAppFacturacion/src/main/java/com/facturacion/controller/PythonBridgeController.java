package com.facturacion.controller;

import com.facturacion.response.ApiResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.BufferedReader;
import java.io.File;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import com.fasterxml.jackson.databind.ObjectMapper;

@RestController
@RequestMapping({"/api/admin/motor-python", "/admin/motor-python"})
@CrossOrigin(origins = "*")
public class PythonBridgeController {

    private final ObjectMapper objectMapper = new ObjectMapper();

    private String getPythonExecutable() {
        String[] candidates = {
            "python3",
            "python",
            "../.venv/bin/python",
            "../.venv/Scripts/python.exe",
            ".venv/Scripts/python.exe",
            ".venv/bin/python"
        };
        for (String c : candidates) {
            File f = new File(c);
            if (f.exists()) return f.getAbsolutePath();
        }
        return "python3";
    }

    private File getScriptFile() {
        String[] paths = {
            "motor_financiero_python.py",
            "../motor_financiero_python.py",
            "../../motor_financiero_python.py"
        };
        for (String p : paths) {
            File f = new File(p);
            if (f.exists()) return f;
        }
        return new File("motor_financiero_python.py");
    }

    @GetMapping("/proyeccion-mes")
    public ResponseEntity<ApiResponse<Map<String, Object>>> obtenerProyeccion() {
        try {
            File script = getScriptFile();
            File workDir = script.getParentFile() != null ? script.getParentFile() : new File(".");
            ProcessBuilder pb = new ProcessBuilder(
                getPythonExecutable(),
                "-c",
                "import sys, json; sys.path.append('.'); from motor_financiero_python import calcular_proyeccion_siguiente_mes; print(json.dumps(calcular_proyeccion_siguiente_mes()))"
            );
            pb.directory(workDir);
            pb.redirectErrorStream(true);
            Process process = pb.start();

            StringBuilder output = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    output.append(line);
                }
            }
            int exitCode = process.waitFor();
            if (exitCode != 0) {
                return ResponseEntity.status(500).body(ApiResponse.error("Error al ejecutar motor Python: " + output));
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> data = objectMapper.readValue(output.toString().trim(), Map.class);
            return ResponseEntity.ok(ApiResponse.success("Proyección calculada correctamente con Python", data));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(ApiResponse.error("Error interno en bridge Python: " + e.getMessage()));
        }
    }

    @GetMapping("/reporte-excel-oficial")
    public ResponseEntity<byte[]> descargarExcelOficial() {
        try {
            File script = getScriptFile();
            File workDir = script.getParentFile() != null ? script.getParentFile() : new File(".");
            ProcessBuilder pb = new ProcessBuilder(
                getPythonExecutable(),
                "-c",
                "import sys; sys.path.append('.'); from motor_financiero_python import generar_suite_financiera_excel; sys.stdout.buffer.write(generar_suite_financiera_excel())"
            );
            pb.directory(workDir);
            Process process = pb.start();

            byte[] bytes = process.getInputStream().readAllBytes();
            int exitCode = process.waitFor();
            if (exitCode != 0) {
                return ResponseEntity.status(500).build();
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
            headers.setContentDispositionFormData("attachment", "Reporte_Oficial_Consolidado.xlsx");

            return ResponseEntity.ok().headers(headers).body(bytes);
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }
}

