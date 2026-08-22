-- ============================================================
-- SINCRONIZACION COCKROACHDB A MODELO ACTUAL
--
-- Usar este script cuando la base ya existe y viene de una
-- version antigua. No recrea toda la BD; elimina columnas/tablas
-- heredadas que ya no existen en el backend actual.
--
-- Problema que corrige:
-- cliente.estado_capacitacion NOT NULL bloqueando inserts nuevos.
-- ============================================================

-- No se fija una base de datos aquí a propósito. El script debe ejecutarse
-- sobre la base seleccionada en CockroachDB (en producción: defaultdb).

CREATE TABLE IF NOT EXISTS public.entorno (
    id BIGINT PRIMARY KEY DEFAULT unique_rowid(),
    nombre VARCHAR(50) NOT NULL UNIQUE,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT current_timestamp()
);

CREATE INDEX IF NOT EXISTS idx_entorno_activo ON public.entorno (activo);

UPSERT INTO public.entorno (id, nombre)
VALUES (1, 'Producción'), (2, 'Control Interno');

-- Tablas heredadas del modelo anterior. En el modelo actual estos
-- datos viven en cliente / venta / servicio_cliente.
DROP TABLE IF EXISTS public.acceso_sistema CASCADE;
DROP TABLE IF EXISTS public.credencial_sol CASCADE;
DROP TABLE IF EXISTS public.ubigeo CASCADE;

-- Columnas antiguas en cliente que no existen en Cliente.java ni en
-- COCKROACHDB_FINAL.sql. Si alguna tiene NOT NULL, puede romper inserts.
ALTER TABLE IF EXISTS public.cliente DROP COLUMN IF EXISTS estado_capacitacion CASCADE;
ALTER TABLE IF EXISTS public.cliente DROP COLUMN IF EXISTS estado_cuenta CASCADE;
ALTER TABLE IF EXISTS public.cliente DROP COLUMN IF EXISTS estado_pago CASCADE;
ALTER TABLE IF EXISTS public.cliente DROP COLUMN IF EXISTS regimen_tributario CASCADE;
ALTER TABLE IF EXISTS public.cliente DROP COLUMN IF EXISTS plan_contratado CASCADE;
ALTER TABLE IF EXISTS public.cliente DROP COLUMN IF EXISTS tipo_suscripcion CASCADE;
ALTER TABLE IF EXISTS public.cliente DROP COLUMN IF EXISTS monto_mensual CASCADE;
ALTER TABLE IF EXISTS public.cliente DROP COLUMN IF EXISTS fecha_vencimiento_mensual CASCADE;
ALTER TABLE IF EXISTS public.cliente DROP COLUMN IF EXISTS fecha_capacitacion CASCADE;
ALTER TABLE IF EXISTS public.cliente DROP COLUMN IF EXISTS vendedor CASCADE;
ALTER TABLE IF EXISTS public.cliente DROP COLUMN IF EXISTS color_tag CASCADE;

-- Columnas esperadas por el backend actual. Se agregan solo si faltan.
ALTER TABLE IF EXISTS public.cliente ADD COLUMN IF NOT EXISTS usuario_admin_facturador VARCHAR(50);
ALTER TABLE IF EXISTS public.cliente ADD COLUMN IF NOT EXISTS clave_temporal VARCHAR(100);
ALTER TABLE IF EXISTS public.cliente ADD COLUMN IF NOT EXISTS url_acceso VARCHAR(255);
ALTER TABLE IF EXISTS public.cliente ADD COLUMN IF NOT EXISTS estado_id BIGINT NULL;
ALTER TABLE IF EXISTS public.cliente ADD COLUMN IF NOT EXISTS color_tag_id BIGINT NULL;
ALTER TABLE IF EXISTS public.cliente ADD COLUMN IF NOT EXISTS usuario_wsp VARCHAR(20) NULL;
ALTER TABLE IF EXISTS public.cliente ADD COLUMN IF NOT EXISTS entorno_id BIGINT NULL;
ALTER TABLE IF EXISTS public.cliente ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE IF EXISTS public.cliente ADD COLUMN IF NOT EXISTS fecha_eliminacion TIMESTAMP NULL;
ALTER TABLE IF EXISTS public.cliente ADD COLUMN IF NOT EXISTS fecha_registro TIMESTAMP NOT NULL DEFAULT current_timestamp();
ALTER TABLE IF EXISTS public.cliente ADD COLUMN IF NOT EXISTS fecha_actualizacion TIMESTAMP NOT NULL DEFAULT current_timestamp();

ALTER TABLE IF EXISTS public.cliente DROP CONSTRAINT IF EXISTS fk_cliente_entorno;
ALTER TABLE IF EXISTS public.cliente ADD CONSTRAINT fk_cliente_entorno
FOREIGN KEY (entorno_id) REFERENCES public.entorno(id)
ON DELETE SET NULL ON UPDATE CASCADE;

-- Tipo de venta agregado para mejorar un plan activo sin reiniciar fechas.
ALTER TABLE IF EXISTS public.venta DROP CONSTRAINT IF EXISTS chk_venta_tipo;
ALTER TABLE IF EXISTS public.venta ADD CONSTRAINT chk_venta_tipo
CHECK (tipo_venta IN ('ALTA', 'RENOVACION', 'CAMBIO_PLAN', 'MEJORA_PLAN'));

-- Semillas idempotentes.
UPSERT INTO public.plan (id, nombre_plan)
VALUES
(1, 'Plan Inicial'),
(2, 'Plan Emprende'),
(3, 'Plan Impulsa'),
(4, 'Plan Empresarial'),
(5, 'Plan Lider');

UPSERT INTO public.suscripcion (plan_id, tipo_suscripcion, precio)
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

UPSERT INTO public.estado_cliente (id, nombre, descripcion)
VALUES
(1, 'POR_COBRAR', 'Cliente registrado pero pendiente de pago'),
(2, 'POR_CAPACITAR', 'Pago realizado pero pendiente de capacitacion'),
(3, 'HABILITADO', 'Cliente con servicio activo'),
(4, 'VENCIDO', 'Periodo de servicio terminado'),
(5, 'BLOQUEADO', 'Cliente bloqueado');

UPSERT INTO public.color_tag (id, codigo, hex)
VALUES
(1, 'Verde', '#198754'),
(2, 'Amarillo', '#FFC107'),
(3, 'Rojo', '#DC3545'),
(4, 'Azul', '#0D6EFD');

SELECT 'COCKROACHDB SINCRONIZADA AL MODELO ACTUAL' AS mensaje;
