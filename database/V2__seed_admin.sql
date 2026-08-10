-- Semilla de Usuario Administrador por defecto
-- Contraseña en claro: admin123 (Cifrada con BCrypt)

IF NOT EXISTS (SELECT * FROM usuario_admin WHERE username = 'admin')
BEGIN
    INSERT INTO usuario_admin (username, password, nombre, email, rol, fecha_creacion)
    VALUES (
        'admin',
        '$2a$10$8.UnVuG9HHgffUDAlk8qfOUVGkqRzgVymGe07xd00DMxs.AQvq4aO', -- admin123
        'Administrador Facturación',
        'admin@facturacion.com',
        'ADMIN',
        GETDATE()
    );
END;

-- Ubigeos de prueba (Lima, Arequipa, Trujillo)
IF NOT EXISTS (SELECT * FROM ubigeo WHERE codigo = '150101')
BEGIN
    INSERT INTO ubigeo (codigo, departamento, provincia, distrito) VALUES ('150101', 'LIMA', 'LIMA', 'LIMA');
    INSERT INTO ubigeo (codigo, departamento, provincia, distrito) VALUES ('150114', 'LIMA', 'LIMA', 'MIRAFLORES');
    INSERT INTO ubigeo (codigo, departamento, provincia, distrito) VALUES ('150130', 'LIMA', 'LIMA', 'SAN ISIDRO');
    INSERT INTO ubigeo (codigo, departamento, provincia, distrito) VALUES ('040101', 'AREQUIPA', 'AREQUIPA', 'AREQUIPA');
    INSERT INTO ubigeo (codigo, departamento, provincia, distrito) VALUES ('130101', 'LA LIBERTAD', 'TRUJILLO', 'TRUJILLO');
END;
