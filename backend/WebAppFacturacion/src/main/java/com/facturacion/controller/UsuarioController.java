package com.facturacion.controller;

import com.facturacion.entity.UsuarioAdmin;
import com.facturacion.exception.ResourceNotFoundException;
import com.facturacion.repository.UsuarioAdminRepository;
import com.facturacion.response.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping({"/api/admin/usuarios", "/admin/usuarios"})
@CrossOrigin(origins = "*")
public class UsuarioController {

    @Autowired
    private UsuarioAdminRepository usuarioAdminRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @GetMapping
    public ResponseEntity<ApiResponse<List<UsuarioAdmin>>> listarUsuarios() {
        List<UsuarioAdmin> usuarios = usuarioAdminRepository.findByActivoTrue();
        return ResponseEntity.ok(ApiResponse.success("Lista de usuarios obtenida", usuarios));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<UsuarioAdmin>> crearUsuario(@RequestBody UsuarioAdmin usuario) {
        if (usuarioAdminRepository.findByUsernameAndActivoTrue(usuario.getUsername()).isPresent()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("El nombre de usuario '" + usuario.getUsername() + "' ya está registrado."));
        }

        usuario.setPassword(passwordEncoder.encode(usuario.getPassword() != null ? usuario.getPassword() : "vendedor123"));
        if (usuario.getRol() == null) usuario.setRol("VENDEDOR");
        usuario.setActivo(true);
        usuario.setFechaCreacion(LocalDateTime.now());
        UsuarioAdmin guardado = usuarioAdminRepository.save(usuario);
        return ResponseEntity.ok(ApiResponse.success("Usuario registrado exitosamente", guardado));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<UsuarioAdmin>> actualizarUsuario(@PathVariable Long id, @RequestBody UsuarioAdmin request) {
        UsuarioAdmin user = usuarioAdminRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado con ID: " + id));

        if (request.getNombre() != null) user.setNombre(request.getNombre());
        if (request.getEmail() != null) user.setEmail(request.getEmail());
        if (request.getRol() != null) user.setRol(request.getRol());
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        UsuarioAdmin actualizado = usuarioAdminRepository.save(user);
        return ResponseEntity.ok(ApiResponse.success("Usuario actualizado correctamente", actualizado));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> eliminarUsuario(@PathVariable Long id) {
        UsuarioAdmin user = usuarioAdminRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado con ID: " + id));
        user.setActivo(false);
        usuarioAdminRepository.save(user);
        return ResponseEntity.ok(ApiResponse.success("Usuario eliminado lógicamente", null));
    }
}
