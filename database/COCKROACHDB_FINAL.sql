-- ============================================================
-- SISTEMA DE FACTURACION
-- Schema compatible con CockroachDB
--
-- Basado en MYSQL_FINAL.sql.
-- Nota: CockroachDB no usa AUTO_INCREMENT, ENGINE, CHARSET,
-- FOREIGN_KEY_CHECKS, ENUM MySQL ni ON UPDATE CURRENT_TIMESTAMP.
-- ============================================================

CREATE DATABASE IF NOT EXISTS sistema_facturacion;
USE sistema_facturacion;

-- ============================================================
-- ELIMINACION DE TABLAS PARA RECREAR EL MODELO
-- ============================================================

DROP TABLE IF EXISTS notificacion CASCADE;
DROP TABLE IF EXISTS pago CASCADE;
DROP TABLE IF EXISTS servicio_cliente CASCADE;
DROP TABLE IF EXISTS historial_estado_cliente CASCADE;
DROP TABLE IF EXISTS venta CASCADE;
DROP TABLE IF EXISTS encuesta_inicial CASCADE;
DROP TABLE IF EXISTS cliente CASCADE;
DROP TABLE IF EXISTS color_tag CASCADE;
DROP TABLE IF EXISTS estado_cliente CASCADE;
DROP TABLE IF EXISTS suscripcion CASCADE;
DROP TABLE IF EXISTS plan CASCADE;
DROP TABLE IF EXISTS usuario_admin CASCADE;

-- ============================================================
-- 1. USUARIOS ADMINISTRADORES / VENDEDORES
-- ============================================================

CREATE TABLE usuario_admin (
    id BIGINT PRIMARY KEY DEFAULT unique_rowid(),
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    rol VARCHAR(20) NOT NULL DEFAULT 'ADMIN',
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_eliminacion TIMESTAMP NULL,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT current_timestamp()
);

CREATE INDEX idx_usuario_activo ON usuario_admin (activo);

-- ============================================================
-- 2. PLANES
-- ============================================================

CREATE TABLE plan (
    id BIGINT PRIMARY KEY DEFAULT unique_rowid(),
    nombre_plan VARCHAR(50) NOT NULL UNIQUE,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_eliminacion TIMESTAMP NULL,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT current_timestamp()
);

CREATE INDEX idx_plan_activo ON plan (activo);

-- ============================================================
-- 3. SUSCRIPCIONES
-- ============================================================

CREATE TABLE suscripcion (
    id BIGINT PRIMARY KEY DEFAULT unique_rowid(),
    plan_id BIGINT NOT NULL,
    tipo_suscripcion VARCHAR(20) NOT NULL,
    precio DECIMAL(10,2) NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_eliminacion TIMESTAMP NULL,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT current_timestamp(),

    CONSTRAINT fk_suscripcion_plan
        FOREIGN KEY (plan_id)
        REFERENCES plan(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT uk_plan_tipo
        UNIQUE (plan_id, tipo_suscripcion),

    CONSTRAINT chk_suscripcion_tipo
        CHECK (tipo_suscripcion IN ('MENSUAL', 'ANUAL')),

    CONSTRAINT chk_suscripcion_precio
        CHECK (precio >= 0)
);

CREATE INDEX idx_suscripcion_plan ON suscripcion (plan_id);
CREATE INDEX idx_suscripcion_activo ON suscripcion (activo);

-- ============================================================
-- 4. ESTADOS DEL CLIENTE
-- ============================================================

CREATE TABLE estado_cliente (
    id BIGINT PRIMARY KEY DEFAULT unique_rowid(),
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion VARCHAR(255),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_eliminacion TIMESTAMP NULL
);

CREATE INDEX idx_estado_activo ON estado_cliente (activo);

-- ============================================================
-- 5. ETIQUETAS DE COLOR
-- ============================================================

CREATE TABLE color_tag (
    id BIGINT PRIMARY KEY DEFAULT unique_rowid(),
    codigo VARCHAR(50) NOT NULL UNIQUE,
    hex VARCHAR(10) NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_eliminacion TIMESTAMP NULL
);

CREATE INDEX idx_color_activo ON color_tag (activo);

-- ============================================================
-- 6. CLIENTES
-- ============================================================

CREATE TABLE cliente (
    id BIGINT PRIMARY KEY DEFAULT unique_rowid(),

    ruc VARCHAR(11) NOT NULL UNIQUE,
    usuario_sol VARCHAR(50) NOT NULL,
    clave_sol_cifrada VARCHAR(500) NOT NULL,

    razon_social VARCHAR(150) NOT NULL,
    nombre_comercial VARCHAR(150),
    direccion VARCHAR(255),
    telefono VARCHAR(20),
    email VARCHAR(100),

    nombres VARCHAR(100),
    apellidos VARCHAR(100),
    dni VARCHAR(8),
    email_personal VARCHAR(100),
    telefono_personal VARCHAR(20),

    departamento VARCHAR(50),
    provincia VARCHAR(50),
    distrito VARCHAR(50),

    usuario_admin_facturador VARCHAR(50),
    clave_temporal VARCHAR(100),
    url_acceso VARCHAR(255),

    estado_id BIGINT NULL,
    color_tag_id BIGINT NULL,

    activo BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_eliminacion TIMESTAMP NULL,
    fecha_registro TIMESTAMP NOT NULL DEFAULT current_timestamp(),
    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT current_timestamp(),

    CONSTRAINT fk_cliente_estado
        FOREIGN KEY (estado_id)
        REFERENCES estado_cliente(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_cliente_color
        FOREIGN KEY (color_tag_id)
        REFERENCES color_tag(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

CREATE INDEX idx_cliente_estado ON cliente (estado_id);
CREATE INDEX idx_cliente_color ON cliente (color_tag_id);
CREATE INDEX idx_cliente_activo ON cliente (activo);
CREATE INDEX idx_cliente_razon_social ON cliente (razon_social);
CREATE INDEX idx_cliente_email ON cliente (email);

-- ============================================================
-- 7. ENCUESTA INICIAL
-- ============================================================

CREATE TABLE encuesta_inicial (
    id BIGINT PRIMARY KEY DEFAULT unique_rowid(),
    cliente_id BIGINT NOT NULL,
    como_nos_conocio VARCHAR(100),
    uso_sistema_anterior BOOLEAN NOT NULL DEFAULT FALSE,
    volumen_facturacion_estimado VARCHAR(50),
    comentarios VARCHAR(500),
    fecha_respuesta TIMESTAMP NOT NULL DEFAULT current_timestamp(),

    CONSTRAINT fk_encuesta_cliente
        FOREIGN KEY (cliente_id)
        REFERENCES cliente(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE INDEX idx_encuesta_cliente ON encuesta_inicial (cliente_id);
CREATE INDEX idx_encuesta_fecha ON encuesta_inicial (fecha_respuesta);

-- ============================================================
-- 8. VENTAS
-- ============================================================

CREATE TABLE venta (
    id BIGINT PRIMARY KEY DEFAULT unique_rowid(),
    cliente_id BIGINT NOT NULL,
    vendedor_id BIGINT NULL,
    suscripcion_id BIGINT NOT NULL,
    tipo_venta VARCHAR(30) NOT NULL,
    venta_anterior_id BIGINT NULL,

    precio_lista DECIMAL(10,2) NOT NULL,
    monto_prorrateado DECIMAL(10,2) NOT NULL DEFAULT 0,
    monto_total DECIMAL(10,2) NOT NULL,

    estado_venta VARCHAR(30) NOT NULL DEFAULT 'PENDIENTE_PAGO',
    observaciones VARCHAR(500),
    fecha_venta TIMESTAMP NOT NULL DEFAULT current_timestamp(),
    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT current_timestamp(),

    CONSTRAINT fk_venta_cliente
        FOREIGN KEY (cliente_id)
        REFERENCES cliente(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_venta_vendedor
        FOREIGN KEY (vendedor_id)
        REFERENCES usuario_admin(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_venta_suscripcion
        FOREIGN KEY (suscripcion_id)
        REFERENCES suscripcion(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_venta_anterior
        FOREIGN KEY (venta_anterior_id)
        REFERENCES venta(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT chk_venta_tipo
        CHECK (tipo_venta IN ('ALTA', 'RENOVACION', 'CAMBIO_PLAN')),

    CONSTRAINT chk_venta_estado
        CHECK (estado_venta IN ('PENDIENTE_PAGO', 'PAGADA', 'CANCELADA')),

    CONSTRAINT chk_venta_precio
        CHECK (precio_lista >= 0),

    CONSTRAINT chk_venta_prorrateo
        CHECK (monto_prorrateado >= 0),

    CONSTRAINT chk_venta_total
        CHECK (monto_total >= 0)
);

CREATE INDEX idx_venta_cliente ON venta (cliente_id);
CREATE INDEX idx_venta_vendedor ON venta (vendedor_id);
CREATE INDEX idx_venta_suscripcion ON venta (suscripcion_id);
CREATE INDEX idx_venta_tipo ON venta (tipo_venta);
CREATE INDEX idx_venta_estado ON venta (estado_venta);
CREATE INDEX idx_venta_fecha ON venta (fecha_venta);

-- ============================================================
-- 9. SERVICIOS DEL CLIENTE
-- ============================================================

CREATE TABLE servicio_cliente (
    id BIGINT PRIMARY KEY DEFAULT unique_rowid(),
    cliente_id BIGINT NOT NULL,
    venta_id BIGINT NOT NULL UNIQUE,

    fecha_inicio TIMESTAMP NOT NULL,
    fecha_fin TIMESTAMP NOT NULL,
    fecha_capacitacion TIMESTAMP NULL,

    estado VARCHAR(30) NOT NULL DEFAULT 'PENDIENTE_CAPACITACION',
    monto_prorrateo DECIMAL(10,2) NOT NULL DEFAULT 0,
    dias_prorrateados INT NOT NULL DEFAULT 0,
    observaciones VARCHAR(500),
    fecha_creacion TIMESTAMP NOT NULL DEFAULT current_timestamp(),
    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT current_timestamp(),

    CONSTRAINT fk_servicio_cliente
        FOREIGN KEY (cliente_id)
        REFERENCES cliente(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_servicio_venta
        FOREIGN KEY (venta_id)
        REFERENCES venta(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT chk_servicio_estado
        CHECK (estado IN ('PENDIENTE_CAPACITACION', 'ACTIVO', 'VENCIDO', 'BLOQUEADO')),

    CONSTRAINT chk_servicio_prorrateo
        CHECK (monto_prorrateo >= 0),

    CONSTRAINT chk_servicio_dias_prorrateados
        CHECK (dias_prorrateados >= 0)
);

CREATE INDEX idx_servicio_cliente ON servicio_cliente (cliente_id);
CREATE INDEX idx_servicio_estado ON servicio_cliente (estado);
CREATE INDEX idx_servicio_fecha_inicio ON servicio_cliente (fecha_inicio);
CREATE INDEX idx_servicio_fecha_fin ON servicio_cliente (fecha_fin);

-- ============================================================
-- 10. HISTORIAL DE ESTADOS
-- ============================================================

CREATE TABLE historial_estado_cliente (
    id BIGINT PRIMARY KEY DEFAULT unique_rowid(),
    cliente_id BIGINT NOT NULL,
    estado_anterior_id BIGINT NULL,
    estado_nuevo_id BIGINT NOT NULL,
    usuario_admin_id BIGINT NULL,
    motivo VARCHAR(255),
    fecha_cambio TIMESTAMP NOT NULL DEFAULT current_timestamp(),

    CONSTRAINT fk_historial_cliente
        FOREIGN KEY (cliente_id)
        REFERENCES cliente(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_historial_estado_anterior
        FOREIGN KEY (estado_anterior_id)
        REFERENCES estado_cliente(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_historial_estado_nuevo
        FOREIGN KEY (estado_nuevo_id)
        REFERENCES estado_cliente(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_historial_usuario
        FOREIGN KEY (usuario_admin_id)
        REFERENCES usuario_admin(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

CREATE INDEX idx_historial_cliente ON historial_estado_cliente (cliente_id);
CREATE INDEX idx_historial_fecha ON historial_estado_cliente (fecha_cambio);

-- ============================================================
-- 11. PAGOS
-- ============================================================

CREATE TABLE pago (
    id BIGINT PRIMARY KEY DEFAULT unique_rowid(),
    venta_id BIGINT NOT NULL,
    codigo_operacion VARCHAR(100),
    monto DECIMAL(10,2) NOT NULL,
    medio_pago VARCHAR(30) NOT NULL,
    estado_pago VARCHAR(30) NOT NULL DEFAULT 'PENDIENTE',
    fecha_pago TIMESTAMP NULL,
    fecha_registro TIMESTAMP NOT NULL DEFAULT current_timestamp(),
    comprobante_url VARCHAR(500),
    observaciones VARCHAR(255),

    CONSTRAINT fk_pago_venta
        FOREIGN KEY (venta_id)
        REFERENCES venta(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT chk_pago_medio
        CHECK (medio_pago IN ('YAPE', 'PLIN', 'TRANSFERENCIA', 'EFECTIVO', 'OTRO')),

    CONSTRAINT chk_pago_estado
        CHECK (estado_pago IN ('PENDIENTE', 'PAGADO', 'RECHAZADO')),

    CONSTRAINT chk_pago_monto
        CHECK (monto >= 0)
);

CREATE INDEX idx_pago_venta ON pago (venta_id);
CREATE INDEX idx_pago_estado ON pago (estado_pago);
CREATE INDEX idx_pago_fecha ON pago (fecha_pago);
CREATE INDEX idx_pago_codigo_operacion ON pago (codigo_operacion);

-- ============================================================
-- 12. NOTIFICACIONES
-- ============================================================

CREATE TABLE notificacion (
    id BIGINT PRIMARY KEY DEFAULT unique_rowid(),
    usuario_admin_id BIGINT NOT NULL,
    cliente_id BIGINT NULL,
    tipo VARCHAR(30) NOT NULL,
    titulo VARCHAR(150) NOT NULL,
    mensaje VARCHAR(500) NOT NULL,
    leida BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT current_timestamp(),
    fecha_lectura TIMESTAMP NULL,

    CONSTRAINT fk_notificacion_usuario
        FOREIGN KEY (usuario_admin_id)
        REFERENCES usuario_admin(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_notificacion_cliente
        FOREIGN KEY (cliente_id)
        REFERENCES cliente(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT chk_notificacion_tipo
        CHECK (tipo IN ('VENCIMIENTO_MANANA', 'VENCE_HOY', 'VENCIDO', 'OTRA'))
);

CREATE INDEX idx_notificacion_usuario ON notificacion (usuario_admin_id);
CREATE INDEX idx_notificacion_cliente ON notificacion (cliente_id);
CREATE INDEX idx_notificacion_leida ON notificacion (leida);
CREATE INDEX idx_notificacion_fecha ON notificacion (fecha_creacion);

-- ============================================================
-- 13. DATOS SEMILLA
-- ============================================================

INSERT INTO plan
(id, nombre_plan)
VALUES
(1, 'Plan Inicial'),
(2, 'Plan Emprende'),
(3, 'Plan Impulsa'),
(4, 'Plan Empresarial'),
(5, 'Plan Lider');

INSERT INTO suscripcion
(plan_id, tipo_suscripcion, precio)
VALUES
(1, 'MENSUAL', 19.00),
(1, 'ANUAL',   190.00),
(2, 'MENSUAL', 29.00),
(2, 'ANUAL',   290.00),
(3, 'MENSUAL', 39.00),
(3, 'ANUAL',   390.00),
(4, 'MENSUAL', 59.00),
(4, 'ANUAL',   590.00),
(5, 'MENSUAL', 89.00),
(5, 'ANUAL',   890.00);

INSERT INTO estado_cliente
(id, nombre, descripcion)
VALUES
(1, 'POR_COBRAR', 'Cliente registrado pero pendiente de pago'),
(2, 'POR_CAPACITAR', 'Pago realizado pero pendiente de capacitacion'),
(3, 'HABILITADO', 'Cliente con servicio activo'),
(4, 'VENCIDO', 'Periodo de servicio terminado'),
(5, 'BLOQUEADO', 'Cliente bloqueado');

INSERT INTO color_tag
(id, codigo, hex)
VALUES
(1, 'Verde', '#198754'),
(2, 'Amarillo', '#FFC107'),
(3, 'Rojo', '#DC3545'),
(4, 'Azul', '#0D6EFD');

INSERT INTO usuario_admin
(
    username,
    password,
    nombre,
    email,
    rol,
    activo
)
VALUES
(
    'admin',
    '$2a$10$8.UnVuG9HHgffUDAlk8qfOUVGkqRzgVymGe07xd00DMxs.AQvq4aO',
    'Administrador General',
    'admin@facturacion.com',
    'ADMIN',
    TRUE
);

-- ============================================================
-- 14. CONSULTAS DE VERIFICACION
-- ============================================================

SELECT
    p.id,
    p.nombre_plan,
    s.id AS suscripcion_id,
    s.tipo_suscripcion,
    s.precio,
    s.activo AS suscripcion_activa
FROM plan p
INNER JOIN suscripcion s
    ON s.plan_id = p.id
WHERE p.activo = TRUE
ORDER BY p.id, s.tipo_suscripcion;

SELECT
    id,
    nombre,
    descripcion,
    activo
FROM estado_cliente
ORDER BY id;

SELECT
    id,
    codigo,
    hex,
    activo
FROM color_tag
ORDER BY id;

SELECT
    id,
    username,
    nombre,
    email,
    rol,
    activo
FROM usuario_admin
ORDER BY id;

SELECT 'BASE DE DATOS COCKROACHDB CREADA CORRECTAMENTE' AS mensaje;
