package com.facturacion.response;

public class JwtResponse {

    private String token;
    private String type = "Bearer";
    private String username;
    private String email;
    private String rol;

    public JwtResponse() {}

    public JwtResponse(String token, String username, String email, String rol) {
        this.token = token;
        this.username = username;
        this.email = email;
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
    public String getRol() { return rol; }
    public void setRol(String rol) { this.rol = rol; }
}
