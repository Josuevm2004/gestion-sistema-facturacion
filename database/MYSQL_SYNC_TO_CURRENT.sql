-- ============================================================
-- SINCRONIZACION MYSQL A MODELO ACTUAL
--
-- Usar cuando la base MySQL ya existe y no quieres recrearla.
-- ============================================================

USE sistema_facturacion;

CREATE TABLE IF NOT EXISTS entorno (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_entorno_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO entorno (id, nombre)
VALUES (1, 'Producción'), (2, 'Control Interno');

ALTER TABLE cliente
    ADD COLUMN IF NOT EXISTS usuario_wsp VARCHAR(20) NULL,
    ADD COLUMN IF NOT EXISTS entorno_id BIGINT NULL;

ALTER TABLE cliente
    ADD INDEX idx_cliente_entorno (entorno_id),
    ADD CONSTRAINT fk_cliente_entorno
        FOREIGN KEY (entorno_id) REFERENCES entorno(id)
        ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE venta
MODIFY tipo_venta ENUM(
    'ALTA',
    'RENOVACION',
    'CAMBIO_PLAN',
    'MEJORA_PLAN'
) NOT NULL;

SELECT 'MYSQL SINCRONIZADA AL MODELO ACTUAL' AS mensaje;
