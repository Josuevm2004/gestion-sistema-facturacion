-- ============================================================
-- SINCRONIZACION MYSQL A MODELO ACTUAL
--
-- Usar cuando la base MySQL ya existe y no quieres recrearla.
-- ============================================================

USE sistema_facturacion;

ALTER TABLE venta
MODIFY tipo_venta ENUM(
    'ALTA',
    'RENOVACION',
    'CAMBIO_PLAN',
    'MEJORA_PLAN'
) NOT NULL;

SELECT 'MYSQL SINCRONIZADA AL MODELO ACTUAL' AS mensaje;
