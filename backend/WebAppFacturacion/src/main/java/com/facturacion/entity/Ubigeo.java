package com.facturacion.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "ubigeo")
public class Ubigeo {

    @Id
    @Column(length = 6)
    private String codigo;

    @Column(nullable = false, length = 50)
    private String departamento;

    @Column(nullable = false, length = 50)
    private String provincia;

    @Column(nullable = false, length = 50)
    private String distrito;

    public Ubigeo() {
    }

    public Ubigeo(String codigo, String departamento, String provincia, String distrito) {
        this.codigo = codigo;
        this.departamento = departamento;
        this.provincia = provincia;
        this.distrito = distrito;
    }

    public String getCodigo() {
        return codigo;
    }

    public void setCodigo(String codigo) {
        this.codigo = codigo;
    }

    public String getDepartamento() {
        return departamento;
    }

    public void setDepartamento(String departamento) {
        this.departamento = departamento;
    }

    public String getProvincia() {
        return provincia;
    }

    public void setProvincia(String provincia) {
        this.provincia = provincia;
    }

    public String getDistrito() {
        return distrito;
    }

    public void setDistrito(String distrito) {
        this.distrito = distrito;
    }

    public static UbigeoBuilder builder() {
        return new UbigeoBuilder();
    }

    public static class UbigeoBuilder {
        private String codigo;
        private String departamento;
        private String provincia;
        private String distrito;

        public UbigeoBuilder codigo(String codigo) {
            this.codigo = codigo;
            return this;
        }

        public UbigeoBuilder departamento(String departamento) {
            this.departamento = departamento;
            return this;
        }

        public UbigeoBuilder provincia(String provincia) {
            this.provincia = provincia;
            return this;
        }

        public UbigeoBuilder distrito(String distrito) {
            this.distrito = distrito;
            return this;
        }

        public Ubigeo build() {
            return new Ubigeo(codigo, departamento, provincia, distrito);
        }
    }
}
