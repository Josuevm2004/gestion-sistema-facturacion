package com.facturacion.response;

public class ValidacionSunatResponse {

    private boolean valido;
    private String codigo;

    public ValidacionSunatResponse() {}

    public ValidacionSunatResponse(boolean valido, String codigo) {
        this.valido = valido;
        this.codigo = codigo;
    }

    public boolean isValido() { return valido; }
    public void setValido(boolean valido) { this.valido = valido; }
    public String getCodigo() { return codigo; }
    public void setCodigo(String codigo) { this.codigo = codigo; }
}
