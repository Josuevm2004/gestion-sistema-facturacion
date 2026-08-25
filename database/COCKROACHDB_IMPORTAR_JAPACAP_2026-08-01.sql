-- ============================================================
-- IMPORTACION HISTORICA EN COCKROACHDB
-- Cliente: 20614429501
-- Ultimo pago: 2026-08-01
-- Plan: Plan Empresarial mensual - S/ 59.00
--
-- Ejecutar conectado a la base de datos donde existen las tablas
-- public.cliente, public.venta, public.pago y public.servicio_cliente.
-- No usa BEGIN/COMMIT para que funcione en el editor SQL de CockroachDB.
-- ============================================================

-- ============================================================
-- 1. CLIENTE
-- ============================================================
INSERT INTO public.cliente (
    ruc, usuario_sol, clave_sol_cifrada, razon_social, nombre_comercial,
    direccion, departamento, provincia, distrito, telefono, email,
    nombres, apellidos, dni, telefono_personal, email_personal,
    usuario_admin_facturador, clave_temporal, url_acceso, usuario_wsp,
    estado_id, color_tag_id, entorno_id, activo,
    fecha_registro, fecha_actualizacion
)
VALUES (
    '20614429501',
    'SWOVENRO',
    '__CLAVE_SOL__',
    'INVERSIONES Y EDIFICACIONES JAPACAP SAC',
    'JAPACAP SAC',
    'calle las anécdotas N°290 p.j. 9 de octubre',
    NULL, NULL, NULL,
    '987418822',
    'jhairemanuelportocarreroparede@gmail.com',
    NULL, NULL, '71932604',
    '987418822',
    'jhairemanuelportocarreroparede@gmail.com',
    'jhairemanuelportocarreroparede@gmail.com',
    '__CLAVE_SISTEMA__',
    'https://japacapsac.cpe.webzary.pe/login',
    NULL,
    (SELECT id FROM public.estado_cliente WHERE nombre = 'HABILITADO' AND activo = true LIMIT 1),
    (SELECT id FROM public.color_tag WHERE codigo = 'Amarillo' AND activo = true LIMIT 1),
    (SELECT id FROM public.entorno WHERE nombre = 'Producción' AND activo = true LIMIT 1),
    true,
    TIMESTAMP '2025-11-01 00:00:00',
    TIMESTAMP '2026-08-01 00:00:00'
)
ON CONFLICT (ruc) DO UPDATE SET
    usuario_sol = EXCLUDED.usuario_sol,
    clave_sol_cifrada = EXCLUDED.clave_sol_cifrada,
    razon_social = EXCLUDED.razon_social,
    nombre_comercial = EXCLUDED.nombre_comercial,
    direccion = EXCLUDED.direccion,
    telefono = EXCLUDED.telefono,
    email = EXCLUDED.email,
    dni = EXCLUDED.dni,
    telefono_personal = EXCLUDED.telefono_personal,
    email_personal = EXCLUDED.email_personal,
    usuario_admin_facturador = EXCLUDED.usuario_admin_facturador,
    clave_temporal = EXCLUDED.clave_temporal,
    url_acceso = EXCLUDED.url_acceso,
    usuario_wsp = EXCLUDED.usuario_wsp,
    estado_id = EXCLUDED.estado_id,
    color_tag_id = EXCLUDED.color_tag_id,
    entorno_id = EXCLUDED.entorno_id,
    activo = true,
    fecha_actualizacion = EXCLUDED.fecha_actualizacion;

-- ============================================================
-- 2. VENTA INICIAL: 01/11/2025
-- ============================================================
INSERT INTO public.venta (
    cliente_id, vendedor_id, suscripcion_id, tipo_venta, venta_anterior_id,
    precio_lista, monto_prorrateado, monto_total, estado_venta,
    observaciones, fecha_venta, fecha_actualizacion
)
SELECT c.id, NULL, s.id, 'ALTA', NULL,
       s.precio, 0, s.precio, 'PAGADA',
       'Importación de registro histórico desde Excel',
       TIMESTAMP '2025-11-01 00:00:00', TIMESTAMP '2025-11-01 00:00:00'
FROM public.cliente c
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Empresarial'
WHERE c.ruc = '20614429501'
  AND NOT EXISTS (
      SELECT 1 FROM public.venta v
      WHERE v.cliente_id = c.id
        AND v.tipo_venta = 'ALTA'
        AND v.fecha_venta = TIMESTAMP '2025-11-01 00:00:00'
  );

-- ============================================================
-- 3. RENOVACIONES PAGADAS, TODAS EL DIA 01
-- ============================================================
WITH fechas(fecha) AS (
    VALUES
        (TIMESTAMP '2025-12-01 00:00:00'),
        (TIMESTAMP '2026-01-01 00:00:00'),
        (TIMESTAMP '2026-02-01 00:00:00'),
        (TIMESTAMP '2026-03-01 00:00:00'),
        (TIMESTAMP '2026-04-01 00:00:00'),
        (TIMESTAMP '2026-05-01 00:00:00'),
        (TIMESTAMP '2026-06-01 00:00:00'),
        (TIMESTAMP '2026-07-01 00:00:00'),
        (TIMESTAMP '2026-08-01 00:00:00')
)
INSERT INTO public.venta (
    cliente_id, vendedor_id, suscripcion_id, tipo_venta, venta_anterior_id,
    precio_lista, monto_prorrateado, monto_total, estado_venta,
    observaciones, fecha_venta, fecha_actualizacion
)
SELECT c.id, NULL, s.id, 'RENOVACION',
       (SELECT anterior.id FROM public.venta anterior
        WHERE anterior.cliente_id = c.id
          AND anterior.estado_venta = 'PAGADA'
          AND anterior.fecha_venta < fechas.fecha
        ORDER BY anterior.fecha_venta DESC LIMIT 1),
       s.precio, 0, s.precio, 'PAGADA',
       'Renovación histórica importada desde Excel',
       fechas.fecha, fechas.fecha
FROM fechas
JOIN public.cliente c ON c.ruc = '20614429501'
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Empresarial'
WHERE NOT EXISTS (
    SELECT 1 FROM public.venta v
    WHERE v.cliente_id = c.id
      AND v.tipo_venta = 'RENOVACION'
      AND v.fecha_venta = fechas.fecha
);

-- ============================================================
-- 4. PAGOS HISTORICOS EN YAPE, TODOS EL DIA 01
-- ============================================================
WITH fechas(fecha) AS (
    VALUES
        (TIMESTAMP '2025-11-01 00:00:00'),
        (TIMESTAMP '2025-12-01 00:00:00'),
        (TIMESTAMP '2026-01-01 00:00:00'),
        (TIMESTAMP '2026-02-01 00:00:00'),
        (TIMESTAMP '2026-03-01 00:00:00'),
        (TIMESTAMP '2026-04-01 00:00:00'),
        (TIMESTAMP '2026-05-01 00:00:00'),
        (TIMESTAMP '2026-06-01 00:00:00'),
        (TIMESTAMP '2026-07-01 00:00:00'),
        (TIMESTAMP '2026-08-01 00:00:00')
)
INSERT INTO public.pago (
    venta_id, codigo_operacion, monto, medio_pago, estado_pago,
    fecha_pago, fecha_registro, observaciones
)
SELECT v.id, NULL, v.monto_total, 'YAPE', 'PAGADO',
       fechas.fecha, fechas.fecha,
       'Pago histórico importado desde Excel'
FROM fechas
JOIN public.cliente c ON c.ruc = '20614429501'
JOIN public.venta v ON v.cliente_id = c.id
                    AND v.fecha_venta = fechas.fecha
                    AND v.estado_venta = 'PAGADA'
WHERE NOT EXISTS (
    SELECT 1 FROM public.pago px
    WHERE px.venta_id = v.id
      AND px.fecha_pago = fechas.fecha
);

-- ============================================================
-- 5. SERVICIOS: PERIODOS DEL DIA 01 AL DIA 01
-- ============================================================
WITH periodos(fecha_inicio, fecha_fin, estado) AS (
    VALUES
        (TIMESTAMP '2025-11-01 00:00:00', TIMESTAMP '2025-12-01 00:00:00', 'VENCIDO'),
        (TIMESTAMP '2025-12-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00', 'VENCIDO'),
        (TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-02-01 00:00:00', 'VENCIDO'),
        (TIMESTAMP '2026-02-01 00:00:00', TIMESTAMP '2026-03-01 00:00:00', 'VENCIDO'),
        (TIMESTAMP '2026-03-01 00:00:00', TIMESTAMP '2026-04-01 00:00:00', 'VENCIDO'),
        (TIMESTAMP '2026-04-01 00:00:00', TIMESTAMP '2026-05-01 00:00:00', 'VENCIDO'),
        (TIMESTAMP '2026-05-01 00:00:00', TIMESTAMP '2026-06-01 00:00:00', 'VENCIDO'),
        (TIMESTAMP '2026-06-01 00:00:00', TIMESTAMP '2026-07-01 00:00:00', 'VENCIDO'),
        (TIMESTAMP '2026-07-01 00:00:00', TIMESTAMP '2026-08-01 00:00:00', 'VENCIDO'),
        (TIMESTAMP '2026-08-01 00:00:00', TIMESTAMP '2026-09-01 00:00:00', 'ACTIVO')
)
INSERT INTO public.servicio_cliente (
    cliente_id, venta_id, fecha_inicio, fecha_fin, fecha_capacitacion,
    estado, monto_prorrateo, dias_prorrateados, observaciones,
    fecha_creacion, fecha_actualizacion
)
SELECT c.id, v.id, periodos.fecha_inicio, periodos.fecha_fin,
       TIMESTAMP '2025-11-01 00:00:00', periodos.estado,
       0, 0, 'Servicio histórico importado desde Excel',
       periodos.fecha_inicio, periodos.fecha_inicio
FROM periodos
JOIN public.cliente c ON c.ruc = '20614429501'
JOIN public.venta v ON v.cliente_id = c.id
                    AND v.fecha_venta = periodos.fecha_inicio
WHERE NOT EXISTS (
    SELECT 1 FROM public.servicio_cliente sc
    WHERE sc.venta_id = v.id
);

-- ============================================================
-- 6. SERVICIO ACTUAL
-- ============================================================
UPDATE public.servicio_cliente sc
SET fecha_inicio = TIMESTAMP '2026-08-01 00:00:00',
    fecha_fin = TIMESTAMP '2026-09-01 00:00:00',
    estado = 'ACTIVO',
    monto_prorrateo = 0,
    dias_prorrateados = 0,
    fecha_actualizacion = TIMESTAMP '2026-08-01 00:00:00'
FROM public.cliente c
JOIN public.venta v ON v.cliente_id = c.id
                   AND v.fecha_venta = TIMESTAMP '2026-08-01 00:00:00'
                   AND v.estado_venta = 'PAGADA'
WHERE sc.cliente_id = c.id
  AND sc.venta_id = v.id
  AND c.ruc = '20614429501';

-- ============================================================
-- 7. COBRO SIGUIENTE
-- ============================================================
UPDATE public.venta v
SET precio_lista = s.precio,
    monto_prorrateado = 0,
    monto_total = s.precio,
    estado_venta = 'PENDIENTE_PAGO',
    observaciones = 'Renovación siguiente: cobro mensual normal desde el día 01',
    fecha_actualizacion = TIMESTAMP '2026-08-01 00:00:00'
FROM public.cliente c
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Empresarial'
WHERE v.cliente_id = c.id
  AND v.tipo_venta = 'RENOVACION'
  AND v.estado_venta = 'PENDIENTE_PAGO'
  AND v.fecha_venta = TIMESTAMP '2026-09-01 00:00:00'
  AND c.ruc = '20614429501';

INSERT INTO public.venta (
    cliente_id, vendedor_id, suscripcion_id, tipo_venta, venta_anterior_id,
    precio_lista, monto_prorrateado, monto_total, estado_venta,
    observaciones, fecha_venta, fecha_actualizacion
)
SELECT c.id, v.vendedor_id, s.id, 'RENOVACION', v.id,
       s.precio, 0, s.precio, 'PENDIENTE_PAGO',
       'Renovación siguiente: cobro mensual normal desde el día 01',
       TIMESTAMP '2026-09-01 00:00:00', TIMESTAMP '2026-08-01 00:00:00'
FROM public.cliente c
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Empresarial'
JOIN public.venta v ON v.cliente_id = c.id
                   AND v.fecha_venta = TIMESTAMP '2026-08-01 00:00:00'
                   AND v.estado_venta = 'PAGADA'
WHERE c.ruc = '20614429501'
  AND NOT EXISTS (
      SELECT 1 FROM public.venta pendiente
      WHERE pendiente.cliente_id = c.id
        AND pendiente.tipo_venta = 'RENOVACION'
        AND pendiente.estado_venta = 'PENDIENTE_PAGO'
        AND pendiente.fecha_venta = TIMESTAMP '2026-09-01 00:00:00'
  );

-- ============================================================
-- ============================================================
-- 8. ESTADO ACTUAL E HISTORIAL
-- ============================================================
-- ============================================================
UPDATE public.cliente
SET estado_id = (SELECT id FROM public.estado_cliente
                 WHERE nombre = 'HABILITADO' AND activo = true LIMIT 1),
    fecha_actualizacion = TIMESTAMP '2026-08-01 00:00:00'
WHERE ruc = '20614429501';

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, NULL, pc.id, NULL,
       'Registro histórico importado desde Excel',
       TIMESTAMP '2025-11-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pc ON pc.nombre = 'POR_COBRAR'
WHERE c.ruc = '20614429501'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Registro histórico importado desde Excel');

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, pc.id, pcap.id, NULL,
       'Pago histórico confirmado desde Excel',
       TIMESTAMP '2025-11-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pc ON pc.nombre = 'POR_COBRAR'
JOIN public.estado_cliente pcap ON pcap.nombre = 'POR_CAPACITAR'
WHERE c.ruc = '20614429501'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Pago histórico confirmado desde Excel');

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, pcap.id, hab.id, NULL,
       'Capacitación histórica confirmada desde Excel',
       TIMESTAMP '2025-11-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pcap ON pcap.nombre = 'POR_CAPACITAR'
JOIN public.estado_cliente hab ON hab.nombre = 'HABILITADO'
WHERE c.ruc = '20614429501'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Capacitación histórica confirmada desde Excel');

-- ============================================================
-- ============================================================
-- 9. VERIFICACION
-- ============================================================
-- ============================================================
SELECT c.ruc, c.razon_social, ec.nombre AS estado
FROM public.cliente c
LEFT JOIN public.estado_cliente ec ON ec.id = c.estado_id
WHERE c.ruc = '20614429501';

SELECT v.tipo_venta, v.fecha_venta, v.precio_lista,
       v.monto_prorrateado, v.monto_total, v.estado_venta
FROM public.venta v
JOIN public.cliente c ON c.id = v.cliente_id
WHERE c.ruc = '20614429501'
ORDER BY v.fecha_venta;

SELECT p.monto, p.medio_pago, p.estado_pago, p.fecha_pago
FROM public.pago p
JOIN public.venta v ON v.id = p.venta_id
JOIN public.cliente c ON c.id = v.cliente_id
WHERE c.ruc = '20614429501'
ORDER BY p.fecha_pago;

SELECT sc.fecha_inicio, sc.fecha_fin, sc.estado,
       sc.monto_prorrateo, sc.dias_prorrateados
FROM public.servicio_cliente sc
JOIN public.cliente c ON c.id = sc.cliente_id
WHERE c.ruc = '20614429501'
ORDER BY sc.fecha_inicio;
