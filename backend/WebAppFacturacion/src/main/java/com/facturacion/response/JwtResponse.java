package com.facturacion.response;

public class JwtResponse {
    private String token;
    private String type = "Bearer";
    private String username;
    private String email;
    private String nombre;
    private String rol;

    public JwtResponse() {
    }

    public JwtResponse(String token, String type, String username, String email, String nombre, String rol) {
        this.token = token;
        this.type = type != null ? type : "Bearer";
        this.username = username;
        this.email = email;
        this.nombre = nombre;
        this.rol = rol;
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public String getRol() { return rol; }
    public void setRol(String rol) { this.rol = rol; }

    public static JwtResponseBuilder builder() { return new JwtResponseBuilder(); }

    public static class JwtResponseBuilder {
        private String token;
        private String type = "Bearer";
        private String username;
        private String email;
        private String nombre;
        private String rol;

        public JwtResponseBuilder token(String token) { this.token = token; return this; }
        public JwtResponseBuilder type(String type) { this.type = type; return this; }
        public JwtResponseBuilder username(String username) { this.username = username; return this; }
        public JwtResponseBuilder email(String email) { this.email = email; return this; }
        public JwtResponseBuilder nombre(String nombre) { this.nombre = nombre; return this; }
        public JwtResponseBuilder rol(String rol) { this.rol = rol; return this; }
        public JwtResponse build() { return new JwtResponse(token, type, username, email, nombre, rol); }
    }
}
