-- ============================================================
-- SCRIPT COMPLETO: LIMPIAR BD EXISTENTE + CREAR ESQUEMA NUEVO
-- Sistema de Gestión de Cobros, Onboarding y Facturación Electrónica
-- Para Azure SQL Database (MS SQL Server)
-- ============================================================

-- ============================================================
-- PASO 1: ELIMINAR TODOS LOS OBJETOS EXISTENTES
-- ============================================================

-- 1.1 Eliminar todas las Foreign Keys de TODAS las tablas
DECLARE @sql NVARCHAR(MAX) = '';

SELECT @sql += 'ALTER TABLE [' + OBJECT_SCHEMA_NAME(parent_object_id) + '].[' 
    + OBJECT_NAME(parent_object_id) + '] DROP CONSTRAINT [' + name + '];' + CHAR(13)
FROM sys.foreign_keys;

IF LEN(@sql) > 0
    EXEC sp_executesql @sql;

PRINT '✅ Todas las Foreign Keys eliminadas.';

-- 1.2 Eliminar todas las vistas
SET @sql = '';
SELECT @sql += 'DROP VIEW IF EXISTS [' + TABLE_SCHEMA + '].[' + TABLE_NAME + '];' + CHAR(13)
FROM INFORMATION_SCHEMA.VIEWS
WHERE TABLE_SCHEMA = 'dbo';

IF LEN(@sql) > 0
    EXEC sp_executesql @sql;

PRINT '✅ Todas las vistas eliminadas.';

-- 1.3 Eliminar todos los procedimientos almacenados (excepto los del sistema)
SET @sql = '';
SELECT @sql += 'DROP PROCEDURE IF EXISTS [' + SCHEMA_NAME(schema_id) + '].[' + name + '];' + CHAR(13)
FROM sys.procedures
WHERE is_ms_shipped = 0;

IF LEN(@sql) > 0
    EXEC sp_executesql @sql;

PRINT '✅ Todos los procedimientos almacenados eliminados.';

-- 1.4 Eliminar todas las funciones
SET @sql = '';
SELECT @sql += 'DROP FUNCTION IF EXISTS [' + SCHEMA_NAME(schema_id) + '].[' + name + '];' + CHAR(13)
FROM sys.objects
WHERE type IN ('FN', 'IF', 'TF') AND is_ms_shipped = 0;

IF LEN(@sql) > 0
    EXEC sp_executesql @sql;

PRINT '✅ Todas las funciones eliminadas.';

-- 1.5 Eliminar TODAS las tablas
SET @sql = '';
SELECT @sql += 'DROP TABLE IF EXISTS [' + TABLE_SCHEMA + '].[' + TABLE_NAME + '];' + CHAR(13)
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_TYPE = 'BASE TABLE' AND TABLE_SCHEMA = 'dbo';

IF LEN(@sql) > 0
    EXEC sp_executesql @sql;

PRINT '✅ Todas las tablas eliminadas.';
PRINT '================================================';
PRINT '   BASE DE DATOS LIMPIA - CREANDO ESQUEMA NUEVO';
PRINT '================================================';

-- ============================================================
-- PASO 2: CREAR TABLAS DEL SISTEMA DE FACTURACIÓN
-- ============================================================

-- 2.1 Tabla de administradores
CREATE TABLE usuario_admin (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    rol VARCHAR(20) DEFAULT 'ADMIN',
    fecha_creacion DATETIME2 DEFAULT GETDATE()
);
PRINT '✅ Tabla usuario_admin creada.';

-- 2.2 Tabla de ubigeos (códigos geográficos Perú)
CREATE TABLE ubigeo (
    codigo VARCHAR(6) PRIMARY KEY,
    departamento VARCHAR(50) NOT NULL,
    provincia VARCHAR(50) NOT NULL,
    distrito VARCHAR(50) NOT NULL
);
PRINT '✅ Tabla ubigeo creada.';

-- 2.3 Tabla de clientes
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
PRINT '✅ Tabla cliente creada.';

-- 2.4 Tabla de credenciales SOL (SUNAT)
CREATE TABLE credencial_sol (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    cliente_id BIGINT NOT NULL UNIQUE,
    usuario_sol VARCHAR(50) NOT NULL,
    clave_sol_cifrada VARCHAR(500) NOT NULL, -- AES-256 (Ley N° 29733)
    fecha_actualizacion DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT FK_CredencialSOL_Cliente FOREIGN KEY (cliente_id) REFERENCES cliente(id) ON DELETE CASCADE
);
PRINT '✅ Tabla credencial_sol creada.';

-- 2.5 Tabla de encuestas iniciales
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
PRINT '✅ Tabla encuesta_inicial creada.';

-- 2.6 Tabla de accesos al sistema
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
PRINT '✅ Tabla acceso_sistema creada.';

-- 2.7 Tabla de pagos
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
PRINT '✅ Tabla pago creada.';

-- ============================================================
-- PASO 3: CREAR ÍNDICES DE ALTO RENDIMIENTO
-- ============================================================

CREATE INDEX IX_Cliente_Ruc ON cliente(ruc);
CREATE INDEX IX_Cliente_Estado ON cliente(estado_cuenta);
CREATE INDEX IX_Pago_Cliente_Estado ON pago(cliente_id, estado_pago);
CREATE INDEX IX_Pago_CodigoOp ON pago(codigo_operacion);

PRINT '✅ Índices creados.';

-- ============================================================
-- PASO 4: DATOS INICIALES (SEED)
-- ============================================================

-- 4.1 Usuario administrador por defecto
-- Contraseña en claro: admin123 (Cifrada con BCrypt)
INSERT INTO usuario_admin (username, password, nombre, email, rol, fecha_creacion)
VALUES (
    'admin',
    '$2a$10$8.UnVuG9HHgffUDAlk8qfOUVGkqRzgVymGe07xd00DMxs.AQvq4aO', -- admin123
    'Administrador Facturación',
    'admin@facturacion.com',
    'ADMIN',
    GETDATE()
);
PRINT '✅ Usuario admin creado (usuario: admin / contraseña: admin123).';

-- 4.2 Ubigeos de prueba
INSERT INTO ubigeo (codigo, departamento, provincia, distrito) VALUES ('150101', 'LIMA', 'LIMA', 'LIMA');
INSERT INTO ubigeo (codigo, departamento, provincia, distrito) VALUES ('150114', 'LIMA', 'LIMA', 'MIRAFLORES');
INSERT INTO ubigeo (codigo, departamento, provincia, distrito) VALUES ('150130', 'LIMA', 'LIMA', 'SAN ISIDRO');
INSERT INTO ubigeo (codigo, departamento, provincia, distrito) VALUES ('040101', 'AREQUIPA', 'AREQUIPA', 'AREQUIPA');
INSERT INTO ubigeo (codigo, departamento, provincia, distrito) VALUES ('130101', 'LA LIBERTAD', 'TRUJILLO', 'TRUJILLO');

PRINT '✅ Ubigeos de prueba insertados (5 registros).';

PRINT '================================================';
PRINT '   ¡BASE DE DATOS LISTA PARA USAR! 🚀';
PRINT '================================================';
