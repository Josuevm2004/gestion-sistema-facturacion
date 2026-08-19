-- ============================================================
-- SISTEMA DE FACTURACIÓN
-- Gestión de Clientes, Ventas, Suscripciones, Pagos,
-- Capacitación, Prorrateo, Renovaciones, Cambios de Plan
-- y Eliminación Lógica
--
-- Base de Datos: sistema_facturacion
-- MySQL / phpMyAdmin
-- ============================================================

CREATE DATABASE IF NOT EXISTS sistema_facturacion
DEFAULT CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE sistema_facturacion;

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- ELIMINACIÓN DE TABLAS PARA RECREAR EL MODELO
-- ============================================================

DROP TABLE IF EXISTS notificacion;
DROP TABLE IF EXISTS pago;
DROP TABLE IF EXISTS servicio_cliente;
DROP TABLE IF EXISTS historial_estado_cliente;
DROP TABLE IF EXISTS venta;
DROP TABLE IF EXISTS encuesta_inicial;
DROP TABLE IF EXISTS cliente;
DROP TABLE IF EXISTS color_tag;
DROP TABLE IF EXISTS estado_cliente;
DROP TABLE IF EXISTS suscripcion;
DROP TABLE IF EXISTS plan;
DROP TABLE IF EXISTS usuario_admin;

SET FOREIGN_KEY_CHECKS = 1;


-- ============================================================
-- 1. USUARIOS ADMINISTRADORES / VENDEDORES
-- ============================================================

CREATE TABLE usuario_admin (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,

    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,

    rol VARCHAR(20) NOT NULL DEFAULT 'ADMIN',

    -- Eliminación lógica
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_eliminacion DATETIME NULL,

    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_usuario_activo (activo)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- 2. PLANES
-- ============================================================
--
-- Aquí solamente se define el producto.
--
-- No se guardan precios ni mensual/anual.
--
-- Plan Inicial
-- Plan Emprende
-- Plan Impulsa
-- Plan Empresarial
-- Plan Líder
--
-- Si un plan se "elimina" desde el sistema:
--
-- activo = FALSE
--
-- NO se borra físicamente.
-- ============================================================

CREATE TABLE plan (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    nombre_plan VARCHAR(50) NOT NULL UNIQUE,

    activo BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_eliminacion DATETIME NULL,

    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_plan_activo (activo)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- 3. SUSCRIPCIONES
-- ============================================================
--
-- Relaciona:
--
-- PLAN + TIPO DE SUSCRIPCIÓN + PRECIO
--
-- Ejemplo:
--
-- Plan Inicial / Mensual / 19
-- Plan Inicial / Anual   / 190
--
-- La eliminación también es lógica.
-- ============================================================

CREATE TABLE suscripcion (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    plan_id BIGINT NOT NULL,

    tipo_suscripcion ENUM(
        'MENSUAL',
        'ANUAL'
    ) NOT NULL,

    precio DECIMAL(10,2) NOT NULL,

    activo BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_eliminacion DATETIME NULL,

    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_suscripcion_plan
        FOREIGN KEY (plan_id)
        REFERENCES plan(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT uk_plan_tipo
        UNIQUE (plan_id, tipo_suscripcion),

    CONSTRAINT chk_suscripcion_precio
        CHECK (precio >= 0),

    INDEX idx_suscripcion_plan (plan_id),
    INDEX idx_suscripcion_activo (activo)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- 4. ESTADOS DEL CLIENTE
-- ============================================================
--
-- POR_COBRAR
-- POR_CAPACITAR
-- HABILITADO
-- VENCIDO
-- BLOQUEADO
--
-- Los estados también utilizan eliminación lógica.
-- ============================================================

CREATE TABLE estado_cliente (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    nombre VARCHAR(50) NOT NULL UNIQUE,

    descripcion VARCHAR(255),

    activo BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_eliminacion DATETIME NULL,

    INDEX idx_estado_activo (activo)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- 5. ETIQUETAS DE COLOR
-- ============================================================

CREATE TABLE color_tag (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    codigo VARCHAR(50) NOT NULL UNIQUE,

    hex VARCHAR(10) NOT NULL,

    activo BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_eliminacion DATETIME NULL,

    INDEX idx_color_activo (activo)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- 6. CLIENTES
-- ============================================================
--
-- El cliente puede nacer desde una encuesta.
--
-- Al principio puede estar:
--
-- POR_COBRAR
--
-- Posteriormente se puede completar:
--
-- color
-- usuario del sistema
-- clave
-- URL
--
-- El vendedor se registra en la VENTA,
-- porque puede cambiar entre operaciones.
--
-- IMPORTANTE:
-- id es la única PRIMARY KEY.
-- RUC es UNIQUE.
--
-- La eliminación es lógica.
-- ============================================================

CREATE TABLE cliente (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    -- ========================================================
    -- DATOS TRIBUTARIOS
    -- ========================================================

    ruc VARCHAR(11) NOT NULL UNIQUE,

    usuario_sol VARCHAR(50) NOT NULL,

    clave_sol_cifrada VARCHAR(500) NOT NULL,

    -- ========================================================
    -- DATOS DE EMPRESA
    -- ========================================================

    razon_social VARCHAR(150) NOT NULL,

    nombre_comercial VARCHAR(150),

    direccion VARCHAR(255),

    telefono VARCHAR(20),

    email VARCHAR(100),

    -- ========================================================
    -- DATOS DEL CONTACTO
    -- ========================================================

    nombres VARCHAR(100),

    apellidos VARCHAR(100),

    dni VARCHAR(8),

    email_personal VARCHAR(100),

    telefono_personal VARCHAR(20),

    -- ========================================================
    -- UBICACIÓN
    -- ========================================================

    departamento VARCHAR(50),

    provincia VARCHAR(50),

    distrito VARCHAR(50),

    -- ========================================================
    -- DATOS DEL SISTEMA VENDIDO
    -- ========================================================
    --
    -- Estos datos pueden estar NULL porque se completan
    -- posteriormente desde el sistema.
    -- ========================================================

    usuario_admin_facturador VARCHAR(50),

    clave_temporal VARCHAR(100),

    url_acceso VARCHAR(255),

    -- ========================================================
    -- ESTADO ACTUAL
    -- ========================================================

    estado_id BIGINT NULL,

    -- ========================================================
    -- COLOR
    -- ========================================================

    color_tag_id BIGINT NULL,

    -- ========================================================
    -- ELIMINACIÓN LÓGICA
    -- ========================================================

    activo BOOLEAN NOT NULL DEFAULT TRUE,

    fecha_eliminacion DATETIME NULL,

    -- ========================================================
    -- FECHAS
    -- ========================================================

    fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    fecha_actualizacion DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    -- ========================================================
    -- FOREIGN KEYS
    -- ========================================================

    CONSTRAINT fk_cliente_estado
        FOREIGN KEY (estado_id)
        REFERENCES estado_cliente(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_cliente_color
        FOREIGN KEY (color_tag_id)
        REFERENCES color_tag(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    INDEX idx_cliente_estado (estado_id),
    INDEX idx_cliente_color (color_tag_id),
    INDEX idx_cliente_activo (activo),
    INDEX idx_cliente_razon_social (razon_social),
    INDEX idx_cliente_email (email)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- 7. ENCUESTA INICIAL
-- ============================================================
--
-- La encuesta genera / pertenece a un cliente.
--
-- Si el cliente se elimina físicamente por algún motivo,
-- la encuesta puede eliminarse.
--
-- Pero normalmente el cliente se eliminará lógicamente.
-- ============================================================

CREATE TABLE encuesta_inicial (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    cliente_id BIGINT NOT NULL,

    como_nos_conocio VARCHAR(100),

    uso_sistema_anterior BOOLEAN NOT NULL DEFAULT FALSE,

    volumen_facturacion_estimado VARCHAR(50),

    comentarios VARCHAR(500),

    fecha_respuesta DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_encuesta_cliente
        FOREIGN KEY (cliente_id)
        REFERENCES cliente(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    INDEX idx_encuesta_cliente (cliente_id),
    INDEX idx_encuesta_fecha (fecha_respuesta)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- 8. VENTAS
-- ============================================================
--
-- CADA OPERACIÓN ES UNA NUEVA VENTA.
--
-- ALTA
-- RENOVACION
-- CAMBIO_PLAN
-- MEJORA_PLAN
--
-- Nunca se modifica una venta histórica para convertirla
-- en otra.
--
-- Ejemplo:
--
-- Venta 1 -> ALTA -> Plan Inicial
-- Venta 2 -> RENOVACION -> Plan Inicial
-- Venta 3 -> CAMBIO_PLAN -> Plan Emprende
-- Venta 4 -> RENOVACION -> Plan Emprende
--
-- El vendedor pertenece a la venta.
-- ============================================================

CREATE TABLE venta (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    cliente_id BIGINT NOT NULL,

    vendedor_id BIGINT NULL,

    suscripcion_id BIGINT NOT NULL,

    tipo_venta ENUM(
        'ALTA',
        'RENOVACION',
        'CAMBIO_PLAN',
        'MEJORA_PLAN'
    ) NOT NULL,

    -- Venta anterior
    venta_anterior_id BIGINT NULL,

    -- ========================================================
    -- DATOS ECONÓMICOS
    -- ========================================================

    precio_lista DECIMAL(10,2) NOT NULL,

    -- Monto descontado por prorrateo
    monto_prorrateado DECIMAL(10,2) NOT NULL DEFAULT 0,

    -- Total final a cobrar
    monto_total DECIMAL(10,2) NOT NULL,

    -- ========================================================
    -- ESTADO DE LA VENTA
    -- ========================================================

    estado_venta ENUM(
        'PENDIENTE_PAGO',
        'PAGADA',
        'CANCELADA'
    ) NOT NULL DEFAULT 'PENDIENTE_PAGO',

    observaciones VARCHAR(500),

    fecha_venta DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    fecha_actualizacion DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    -- ========================================================
    -- FOREIGN KEYS
    -- ========================================================

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

    CONSTRAINT chk_venta_precio
        CHECK (precio_lista >= 0),

    CONSTRAINT chk_venta_prorrateo
        CHECK (monto_prorrateado >= 0),

    CONSTRAINT chk_venta_total
        CHECK (monto_total >= 0),

    INDEX idx_venta_cliente (cliente_id),
    INDEX idx_venta_vendedor (vendedor_id),
    INDEX idx_venta_suscripcion (suscripcion_id),
    INDEX idx_venta_tipo (tipo_venta),
    INDEX idx_venta_estado (estado_venta),
    INDEX idx_venta_fecha (fecha_venta)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- 9. SERVICIOS DEL CLIENTE
-- ============================================================
--
-- Representa el PERIODO DE SERVICIO generado por una venta.
--
-- Venta ≠ Servicio
--
-- La venta representa la operación comercial.
--
-- El servicio representa el período durante el cual
-- el cliente tiene derecho a utilizar el sistema.
--
-- En el alta:
--
-- PAGO
--   ↓
-- POR_CAPACITAR
--   ↓
-- CAPACITACIÓN
--   ↓
-- fecha_inicio
--   ↓
-- HABILITADO
--
-- El prorrateo se calcula desde la fecha real de inicio.
-- ============================================================

CREATE TABLE servicio_cliente (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    cliente_id BIGINT NOT NULL,

    -- Una venta genera un servicio
    venta_id BIGINT NOT NULL UNIQUE,

    -- ========================================================
    -- FECHAS
    -- ========================================================

    fecha_inicio DATETIME NOT NULL,

    fecha_fin DATETIME NOT NULL,

    fecha_capacitacion DATETIME NULL,

    -- ========================================================
    -- ESTADO DEL SERVICIO
    -- ========================================================

    estado ENUM(
        'PENDIENTE_CAPACITACION',
        'ACTIVO',
        'VENCIDO',
        'BLOQUEADO'
    ) NOT NULL DEFAULT 'PENDIENTE_CAPACITACION',

    -- ========================================================
    -- PRORRATEO
    -- ========================================================

    monto_prorrateo DECIMAL(10,2) NOT NULL DEFAULT 0,

    dias_prorrateados INT NOT NULL DEFAULT 0,

    observaciones VARCHAR(500),

    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    fecha_actualizacion DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

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

    CONSTRAINT chk_servicio_prorrateo
        CHECK (monto_prorrateo >= 0),

    CONSTRAINT chk_servicio_dias_prorrateados
        CHECK (dias_prorrateados >= 0),

    INDEX idx_servicio_cliente (cliente_id),
    INDEX idx_servicio_estado (estado),
    INDEX idx_servicio_fecha_inicio (fecha_inicio),
    INDEX idx_servicio_fecha_fin (fecha_fin)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- 10. HISTORIAL DE ESTADOS
-- ============================================================
--
-- Guarda cada cambio de estado.
--
-- Ejemplo:
--
-- POR_COBRAR
--      ↓
-- POR_CAPACITAR
--      ↓
-- HABILITADO
--      ↓
-- VENCIDO
--      ↓
-- BLOQUEADO
--      ↓
-- VENCIDO
--      ↓
-- HABILITADO
--
-- IMPORTANTE:
-- El historial NO se elimina normalmente.
-- ============================================================

CREATE TABLE historial_estado_cliente (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    cliente_id BIGINT NOT NULL,

    estado_anterior_id BIGINT NULL,

    estado_nuevo_id BIGINT NOT NULL,

    usuario_admin_id BIGINT NULL,

    motivo VARCHAR(255),

    fecha_cambio DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

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
        ON UPDATE CASCADE,

    INDEX idx_historial_cliente (cliente_id),
    INDEX idx_historial_fecha (fecha_cambio)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- 11. PAGOS
-- ============================================================
--
-- Un pago pertenece a una VENTA.
--
-- Esto permite conocer exactamente qué operación fue pagada.
-- ============================================================

CREATE TABLE pago (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    venta_id BIGINT NOT NULL,

    codigo_operacion VARCHAR(100),

    monto DECIMAL(10,2) NOT NULL,

    medio_pago ENUM(
        'YAPE',
        'PLIN',
        'TRANSFERENCIA',
        'EFECTIVO',
        'OTRO'
    ) NOT NULL,

    estado_pago ENUM(
        'PENDIENTE',
        'PAGADO',
        'RECHAZADO'
    ) NOT NULL DEFAULT 'PENDIENTE',

    fecha_pago DATETIME NULL,

    fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    comprobante_url VARCHAR(500),

    observaciones VARCHAR(255),

    CONSTRAINT fk_pago_venta
        FOREIGN KEY (venta_id)
        REFERENCES venta(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT chk_pago_monto
        CHECK (monto >= 0),

    INDEX idx_pago_venta (venta_id),
    INDEX idx_pago_estado (estado_pago),
    INDEX idx_pago_fecha (fecha_pago),
    INDEX idx_pago_codigo_operacion (codigo_operacion)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- 12. NOTIFICACIONES
-- ============================================================
--
-- Alertas del sistema:
--
-- VENCIMIENTO_MANANA
-- VENCE_HOY
-- VENCIDO
--
-- El backend puede generarlas automáticamente.
-- JavaScript las muestra en el dashboard.
-- ============================================================

CREATE TABLE notificacion (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    usuario_admin_id BIGINT NOT NULL,

    cliente_id BIGINT NULL,

    tipo ENUM(
        'VENCIMIENTO_MANANA',
        'VENCE_HOY',
        'VENCIDO',
        'OTRA'
    ) NOT NULL,

    titulo VARCHAR(150) NOT NULL,

    mensaje VARCHAR(500) NOT NULL,

    leida BOOLEAN NOT NULL DEFAULT FALSE,

    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    fecha_lectura DATETIME NULL,

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

    INDEX idx_notificacion_usuario (usuario_admin_id),
    INDEX idx_notificacion_cliente (cliente_id),
    INDEX idx_notificacion_leida (leida),
    INDEX idx_notificacion_fecha (fecha_creacion)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- 13. DATOS SEMILLA
-- ============================================================


-- ============================================================
-- 13.1 PLANES
-- ============================================================

INSERT INTO plan
(id, nombre_plan)
VALUES
(1, 'Plan Inicial'),
(2, 'Plan Emprende'),
(3, 'Plan Impulsa'),
(4, 'Plan Empresarial'),
(5, 'Plan Líder');


-- ============================================================
-- 13.2 SUSCRIPCIONES
-- ============================================================

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


-- ============================================================
-- 13.3 ESTADOS DEL CLIENTE
-- ============================================================

INSERT INTO estado_cliente
(id, nombre, descripcion)
VALUES
(
    1,
    'POR_COBRAR',
    'Cliente registrado pero pendiente de pago'
),
(
    2,
    'POR_CAPACITAR',
    'Pago realizado pero pendiente de capacitación'
),
(
    3,
    'HABILITADO',
    'Cliente con servicio activo'
),
(
    4,
    'VENCIDO',
    'Periodo de servicio terminado'
),
(
    5,
    'BLOQUEADO',
    'Cliente bloqueado'
);


-- ============================================================
-- 13.4 COLORES
-- ============================================================

INSERT INTO color_tag
(id, codigo, hex)
VALUES
(1, 'Verde', '#198754'),
(2, 'Amarillo', '#FFC107'),
(3, 'Rojo', '#DC3545'),
(4, 'Azul', '#0D6EFD');


-- ============================================================
-- 13.5 USUARIO ADMINISTRADOR PRINCIPAL
-- ============================================================
--
-- Usuario:
-- admin
--
-- Password:
-- admin123
--
-- Se almacena el hash BCrypt.
-- ============================================================

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
-- 14. CONSULTAS DE VERIFICACIÓN
-- ============================================================


-- PLANES Y PRECIOS
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


-- ESTADOS
SELECT
    id,
    nombre,
    descripcion,
    activo
FROM estado_cliente
ORDER BY id;


-- COLORES
SELECT
    id,
    codigo,
    hex,
    activo
FROM color_tag
ORDER BY id;


-- USUARIOS
SELECT
    id,
    username,
    nombre,
    email,
    rol,
    activo
FROM usuario_admin
ORDER BY id;


-- MENSAJE FINAL
SELECT
    'BASE DE DATOS CREADA CORRECTAMENTE' AS mensaje;
