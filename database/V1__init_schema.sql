-- Esquema Inicial para Azure SQL Database (MS SQL Server)
-- Sistema de Gestión de Cobros, Onboarding y Facturación Electrónica

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'usuario_admin')
BEGIN
    CREATE TABLE usuario_admin (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        nombre VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        rol VARCHAR(20) DEFAULT 'ADMIN',
        fecha_creacion DATETIME2 DEFAULT GETDATE()
    );
END;

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ubigeo')
BEGIN
    CREATE TABLE ubigeo (
        codigo VARCHAR(6) PRIMARY KEY,
        departamento VARCHAR(50) NOT NULL,
        provincia VARCHAR(50) NOT NULL,
        distrito VARCHAR(50) NOT NULL
    );
END;

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'cliente')
BEGIN
    CREATE TABLE cliente (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        ruc VARCHAR(11) NOT NULL UNIQUE,
        razon_social VARCHAR(150) NOT NULL,
        nombre_comercial VARCHAR(150),
        direccion VARCHAR(255),
        telefono VARCHAR(20) NOT NULL,
        email VARCHAR(100) NOT NULL,
        regimen_tributario VARCHAR(30) NOT NULL,
        plan_contratado VARCHAR(30) NOT NULL,
        monto_mensual DECIMAL(10, 2) NOT NULL,
        estado_cuenta VARCHAR(20) NOT NULL DEFAULT 'HABILITADO',
        estado_capacitacion VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
        fecha_registro DATETIME2 DEFAULT GETDATE(),
        fecha_vencimiento_mensual DATETIME2 NOT NULL,
        codigo_ubigeo VARCHAR(6),
        CONSTRAINT FK_Cliente_Ubigeo FOREIGN KEY (codigo_ubigeo) REFERENCES ubigeo(codigo)
    );
END;

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'credencial_sol')
BEGIN
    CREATE TABLE credencial_sol (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        cliente_id BIGINT NOT NULL UNIQUE,
        usuario_sol VARCHAR(50) NOT NULL,
        clave_sol_cifrada VARCHAR(500) NOT NULL, -- AES-256 (Ley N° 29733)
        fecha_actualizacion DATETIME2 DEFAULT GETDATE(),
        CONSTRAINT FK_CredencialSOL_Cliente FOREIGN KEY (cliente_id) REFERENCES cliente(id) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'encuesta_inicial')
BEGIN
    CREATE TABLE encuesta_inicial (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        cliente_id BIGINT NOT NULL UNIQUE,
        como_nos_conocio VARCHAR(100),
        uso_sistema_anterior BIT DEFAULT 0,
        volumen_facturacion_estimado VARCHAR(50),
        comentarios VARCHAR(500),
        fecha_respuesta DATETIME2 DEFAULT GETDATE(),
        CONSTRAINT FK_Encuesta_Cliente FOREIGN KEY (cliente_id) REFERENCES cliente(id) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'acceso_sistema')
BEGIN
    CREATE TABLE acceso_sistema (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        cliente_id BIGINT NOT NULL UNIQUE,
        subdominio VARCHAR(50) NOT NULL UNIQUE,
        usuario_admin_facturador VARCHAR(50) NOT NULL,
        clave_temporal VARCHAR(100) NOT NULL,
        url_acceso VARCHAR(255) NOT NULL,
        activo BIT DEFAULT 1,
        fecha_creacion DATETIME2 DEFAULT GETDATE(),
        CONSTRAINT FK_Acceso_Cliente FOREIGN KEY (cliente_id) REFERENCES cliente(id) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'pago')
BEGIN
    CREATE TABLE pago (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        cliente_id BIGINT NOT NULL,
        codigo_operacion VARCHAR(100),
        monto DECIMAL(10,2) NOT NULL,
        medio_pago VARCHAR(30) NOT NULL,
        estado_pago VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE_PAGO',
        fecha_pago DATETIME2,
        fecha_registro DATETIME2 DEFAULT GETDATE(),
        periodo_mes_ano VARCHAR(7) NOT NULL, -- e.g. "2026-08"
        comprobante_url VARCHAR(500),
        observaciones VARCHAR(255),
        CONSTRAINT FK_Pago_Cliente FOREIGN KEY (cliente_id) REFERENCES cliente(id)
    );
END;

-- Índices de alto rendimiento
CREATE INDEX IX_Cliente_Ruc ON cliente(ruc);
CREATE INDEX IX_Cliente_Estado ON cliente(estado_cuenta);
CREATE INDEX IX_Pago_Cliente_Estado ON pago(cliente_id, estado_pago);
CREATE INDEX IX_Pago_CodigoOp ON pago(codigo_operacion);
