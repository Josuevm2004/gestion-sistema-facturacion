package com.facturacion.controller;

import com.facturacion.entity.UsuarioAdmin;
import com.facturacion.exception.ResourceNotFoundException;
import com.facturacion.repository.UsuarioAdminRepository;
import com.facturacion.response.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/usuarios")
public class UsuarioController {

    @Autowired
    private UsuarioAdminRepository usuarioAdminRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @GetMapping
    public ResponseEntity<ApiResponse<List<UsuarioAdmin>>> listarUsuarios() {
        List<UsuarioAdmin> usuarios = usuarioAdminRepository.findAll();
        return ResponseEntity.ok(ApiResponse.success("Listado de usuarios obtenido", usuarios));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<UsuarioAdmin>> crearUsuario(@RequestBody UsuarioAdmin usuario) {
        if (usuarioAdminRepository.findByUsername(usuario.getUsername()).isPresent()) {
            throw new IllegalArgumentException("El nombre de usuario '" + usuario.getUsername() + "' ya está registrado.");
        }
        if (usuario.getEmail() != null && usuarioAdminRepository.findByEmail(usuario.getEmail()).isPresent()) {
            throw new IllegalArgumentException("El email '" + usuario.getEmail() + "' ya está registrado.");
        }

        usuario.setPassword(passwordEncoder.encode(usuario.getPassword()));
        if (usuario.getRol() == null || usuario.getRol().trim().isEmpty()) {
            usuario.setRol("VENDEDOR");
        }

        UsuarioAdmin nuevo = usuarioAdminRepository.save(usuario);
        return ResponseEntity.ok(ApiResponse.success("Usuario creado exitosamente", nuevo));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<UsuarioAdmin>> actualizarUsuario(@PathVariable Long id, @RequestBody UsuarioAdmin request) {
        UsuarioAdmin usuario = usuarioAdminRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado con ID: " + id));

        if (request.getNombre() != null) usuario.setNombre(request.getNombre());
        if (request.getEmail() != null) usuario.setEmail(request.getEmail());
        if (request.getRol() != null) usuario.setRol(request.getRol());
        if (request.getPassword() != null && !request.getPassword().trim().isEmpty()) {
            usuario.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        UsuarioAdmin actualizado = usuarioAdminRepository.save(usuario);
        return ResponseEntity.ok(ApiResponse.success("Usuario actualizado correctamente", actualizado));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> eliminarUsuario(@PathVariable Long id) {
        UsuarioAdmin usuario = usuarioAdminRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado con ID: " + id));
        usuarioAdminRepository.delete(usuario);
        return ResponseEntity.ok(ApiResponse.success("Usuario eliminado correctamente", null));
    }
}
