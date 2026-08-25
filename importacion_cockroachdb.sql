-- ============================================================
-- IMPORTACION AUTOMATICA DESDE EXCEL A COCKROACHDB
-- Fecha: 2026-08-24 23:42:10
-- ============================================================


-- ============================================================
-- CLIENTE: 20614429501 - INVERSIONES Y EDIFICACIONES JAPACAP SAC
-- ============================================================

-- 1. CLIENTE
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
    'ruichiney',
    'INVERSIONES Y EDIFICACIONES JAPACAP SAC',
    'JAPACAP SAC',
    'calle las anécdotas N°290 p.j. 9 de octubre',
    'Lambayeque', 'Chiclayo', 'Chiclayo',
    NULL,
    'jhairemanuelportocarreroparede@gmail.com',
    NULL, NULL, '71932604',
    NULL,
    'jhairemanuelportocarreroparede@gmail.com',
    'jhairemanuelportocarreroparede@gmail.com',
    NULL,
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

-- 2. VENTA INICIAL
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

-- 3. RENOVACIONES PAGADAS
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

-- 4. PAGOS HISTORICOS
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

-- 5. SERVICIOS PERIODOS
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

-- 6. SERVICIO ACTUAL
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

-- 7. COBRO SIGUIENTE
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

-- 8. ESTADO ACTUAL E HISTORIAL
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
-- CLIENTE: 20608439413 - HELAMAN DANNFERT GONZALES GAMARRA
-- ============================================================

-- 1. CLIENTE
INSERT INTO public.cliente (
    ruc, usuario_sol, clave_sol_cifrada, razon_social, nombre_comercial,
    direccion, departamento, provincia, distrito, telefono, email,
    nombres, apellidos, dni, telefono_personal, email_personal,
    usuario_admin_facturador, clave_temporal, url_acceso, usuario_wsp,
    estado_id, color_tag_id, entorno_id, activo,
    fecha_registro, fecha_actualizacion
)
VALUES (
    '20608439413',
    '73754029',
    'Ger@l1995',
    'HELAMAN DANNFERT GONZALES GAMARRA',
    'OBSTMEDIC SAC',
    NULL,
    NULL, NULL, NULL,
    '922717723',
    'obstmedic.centro.medico@gmail.com',
    NULL, NULL, '73754029',
    '922717723',
    'obstmedic.centro.medico@gmail.com',
    'obstmedic.centro.medico@gmail.com',
    '20608439413',
    'https://obstmedic.miquipu.net/',
    NULL,
    (SELECT id FROM public.estado_cliente WHERE nombre = 'HABILITADO' AND activo = true LIMIT 1),
    (SELECT id FROM public.color_tag WHERE codigo = 'Rojo' AND activo = true LIMIT 1),
    (SELECT id FROM public.entorno WHERE nombre = 'Producción' AND activo = true LIMIT 1),
    true,
    TIMESTAMP '2025-07-01 00:00:00',
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

-- 2. VENTA INICIAL
INSERT INTO public.venta (
    cliente_id, vendedor_id, suscripcion_id, tipo_venta, venta_anterior_id,
    precio_lista, monto_prorrateado, monto_total, estado_venta,
    observaciones, fecha_venta, fecha_actualizacion
)
SELECT c.id, NULL, s.id, 'ALTA', NULL,
       s.precio, 0, s.precio, 'PAGADA',
       'Importación de registro histórico desde Excel',
       TIMESTAMP '2025-07-01 00:00:00', TIMESTAMP '2025-07-01 00:00:00'
FROM public.cliente c
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Impulsa'
WHERE c.ruc = '20608439413'
  AND NOT EXISTS (
      SELECT 1 FROM public.venta v
      WHERE v.cliente_id = c.id
        AND v.tipo_venta = 'ALTA'
        AND v.fecha_venta = TIMESTAMP '2025-07-01 00:00:00'
  );

-- 3. RENOVACIONES PAGADAS
WITH fechas(fecha) AS (
    VALUES
        (TIMESTAMP '2025-08-01 00:00:00'),
        (TIMESTAMP '2025-09-01 00:00:00'),
        (TIMESTAMP '2025-10-01 00:00:00'),
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
JOIN public.cliente c ON c.ruc = '20608439413'
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Impulsa'
WHERE NOT EXISTS (
    SELECT 1 FROM public.venta v
    WHERE v.cliente_id = c.id
      AND v.tipo_venta = 'RENOVACION'
      AND v.fecha_venta = fechas.fecha
);

-- 4. PAGOS HISTORICOS
WITH fechas(fecha) AS (
    VALUES
        (TIMESTAMP '2025-07-01 00:00:00'),
        (TIMESTAMP '2025-08-01 00:00:00'),
        (TIMESTAMP '2025-09-01 00:00:00'),
        (TIMESTAMP '2025-10-01 00:00:00'),
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
JOIN public.cliente c ON c.ruc = '20608439413'
JOIN public.venta v ON v.cliente_id = c.id
                    AND v.fecha_venta = fechas.fecha
                    AND v.estado_venta = 'PAGADA'
WHERE NOT EXISTS (
    SELECT 1 FROM public.pago px
    WHERE px.venta_id = v.id
      AND px.fecha_pago = fechas.fecha
);

-- 5. SERVICIOS PERIODOS
WITH periodos(fecha_inicio, fecha_fin, estado) AS (
    VALUES
        (TIMESTAMP '2025-07-01 00:00:00', TIMESTAMP '2025-08-01 00:00:00', 'VENCIDO'),
        (TIMESTAMP '2025-08-01 00:00:00', TIMESTAMP '2025-09-01 00:00:00', 'VENCIDO'),
        (TIMESTAMP '2025-09-01 00:00:00', TIMESTAMP '2025-10-01 00:00:00', 'VENCIDO'),
        (TIMESTAMP '2025-10-01 00:00:00', TIMESTAMP '2025-11-01 00:00:00', 'VENCIDO'),
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
       TIMESTAMP '2025-07-01 00:00:00', periodos.estado,
       0, 0, 'Servicio histórico importado desde Excel',
       periodos.fecha_inicio, periodos.fecha_inicio
FROM periodos
JOIN public.cliente c ON c.ruc = '20608439413'
JOIN public.venta v ON v.cliente_id = c.id
                    AND v.fecha_venta = periodos.fecha_inicio
WHERE NOT EXISTS (
    SELECT 1 FROM public.servicio_cliente sc
    WHERE sc.venta_id = v.id
);

-- 6. SERVICIO ACTUAL
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
  AND c.ruc = '20608439413';

-- 7. COBRO SIGUIENTE
UPDATE public.venta v
SET precio_lista = s.precio,
    monto_prorrateado = 0,
    monto_total = s.precio,
    estado_venta = 'PENDIENTE_PAGO',
    observaciones = 'Renovación siguiente: cobro mensual normal desde el día 01',
    fecha_actualizacion = TIMESTAMP '2026-08-01 00:00:00'
FROM public.cliente c
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Impulsa'
WHERE v.cliente_id = c.id
  AND v.tipo_venta = 'RENOVACION'
  AND v.estado_venta = 'PENDIENTE_PAGO'
  AND v.fecha_venta = TIMESTAMP '2026-09-01 00:00:00'
  AND c.ruc = '20608439413';

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
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Impulsa'
JOIN public.venta v ON v.cliente_id = c.id
                   AND v.fecha_venta = TIMESTAMP '2026-08-01 00:00:00'
                   AND v.estado_venta = 'PAGADA'
WHERE c.ruc = '20608439413'
  AND NOT EXISTS (
      SELECT 1 FROM public.venta pendiente
      WHERE pendiente.cliente_id = c.id
        AND pendiente.tipo_venta = 'RENOVACION'
        AND pendiente.estado_venta = 'PENDIENTE_PAGO'
        AND pendiente.fecha_venta = TIMESTAMP '2026-09-01 00:00:00'
  );

-- 8. ESTADO ACTUAL E HISTORIAL
UPDATE public.cliente
SET estado_id = (SELECT id FROM public.estado_cliente
                 WHERE nombre = 'HABILITADO' AND activo = true LIMIT 1),
    fecha_actualizacion = TIMESTAMP '2026-08-01 00:00:00'
WHERE ruc = '20608439413';

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, NULL, pc.id, NULL,
       'Registro histórico importado desde Excel',
       TIMESTAMP '2025-07-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pc ON pc.nombre = 'POR_COBRAR'
WHERE c.ruc = '20608439413'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Registro histórico importado desde Excel');

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, pc.id, pcap.id, NULL,
       'Pago histórico confirmado desde Excel',
       TIMESTAMP '2025-07-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pc ON pc.nombre = 'POR_COBRAR'
JOIN public.estado_cliente pcap ON pcap.nombre = 'POR_CAPACITAR'
WHERE c.ruc = '20608439413'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Pago histórico confirmado desde Excel');

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, pcap.id, hab.id, NULL,
       'Capacitación histórica confirmada desde Excel',
       TIMESTAMP '2025-07-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pcap ON pcap.nombre = 'POR_CAPACITAR'
JOIN public.estado_cliente hab ON hab.nombre = 'HABILITADO'
WHERE c.ruc = '20608439413'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Capacitación histórica confirmada desde Excel');


-- ============================================================
-- CLIENTE: 10449275051 - Juarez Juarez Ramos Elver
-- ============================================================

-- 1. CLIENTE
INSERT INTO public.cliente (
    ruc, usuario_sol, clave_sol_cifrada, razon_social, nombre_comercial,
    direccion, departamento, provincia, distrito, telefono, email,
    nombres, apellidos, dni, telefono_personal, email_personal,
    usuario_admin_facturador, clave_temporal, url_acceso, usuario_wsp,
    estado_id, color_tag_id, entorno_id, activo,
    fecha_registro, fecha_actualizacion
)
VALUES (
    '10449275051',
    NULL,
    NULL,
    'Juarez Juarez Ramos Elver',
    'JUAREZ JUAREZ RAMOS ELVER',
    NULL,
    NULL, NULL, NULL,
    '997057825',
    NULL,
    NULL, NULL, '44927505',
    '997057825',
    NULL,
    'ramoselver09@gmail.com',
    '10449275051',
    'https://juarezramos.miquipu.net/',
    NULL,
    (SELECT id FROM public.estado_cliente WHERE nombre = 'HABILITADO' AND activo = true LIMIT 1),
    (SELECT id FROM public.color_tag WHERE codigo = 'Rojo' AND activo = true LIMIT 1),
    (SELECT id FROM public.entorno WHERE nombre = 'Producción' AND activo = true LIMIT 1),
    true,
    TIMESTAMP '2025-07-01 00:00:00',
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

-- 2. VENTA INICIAL
INSERT INTO public.venta (
    cliente_id, vendedor_id, suscripcion_id, tipo_venta, venta_anterior_id,
    precio_lista, monto_prorrateado, monto_total, estado_venta,
    observaciones, fecha_venta, fecha_actualizacion
)
SELECT c.id, NULL, s.id, 'ALTA', NULL,
       s.precio, 0, s.precio, 'PAGADA',
       'Importación de registro histórico desde Excel',
       TIMESTAMP '2025-07-01 00:00:00', TIMESTAMP '2025-07-01 00:00:00'
FROM public.cliente c
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Emprende'
WHERE c.ruc = '10449275051'
  AND NOT EXISTS (
      SELECT 1 FROM public.venta v
      WHERE v.cliente_id = c.id
        AND v.tipo_venta = 'ALTA'
        AND v.fecha_venta = TIMESTAMP '2025-07-01 00:00:00'
  );

-- 3. RENOVACIONES PAGADAS
WITH fechas(fecha) AS (
    VALUES
        (TIMESTAMP '2025-08-01 00:00:00'),
        (TIMESTAMP '2025-09-01 00:00:00'),
        (TIMESTAMP '2025-10-01 00:00:00'),
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
JOIN public.cliente c ON c.ruc = '10449275051'
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Emprende'
WHERE NOT EXISTS (
    SELECT 1 FROM public.venta v
    WHERE v.cliente_id = c.id
      AND v.tipo_venta = 'RENOVACION'
      AND v.fecha_venta = fechas.fecha
);

-- 4. PAGOS HISTORICOS
WITH fechas(fecha) AS (
    VALUES
        (TIMESTAMP '2025-07-01 00:00:00'),
        (TIMESTAMP '2025-08-01 00:00:00'),
        (TIMESTAMP '2025-09-01 00:00:00'),
        (TIMESTAMP '2025-10-01 00:00:00'),
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
JOIN public.cliente c ON c.ruc = '10449275051'
JOIN public.venta v ON v.cliente_id = c.id
                    AND v.fecha_venta = fechas.fecha
                    AND v.estado_venta = 'PAGADA'
WHERE NOT EXISTS (
    SELECT 1 FROM public.pago px
    WHERE px.venta_id = v.id
      AND px.fecha_pago = fechas.fecha
);

-- 5. SERVICIOS PERIODOS
WITH periodos(fecha_inicio, fecha_fin, estado) AS (
    VALUES
        (TIMESTAMP '2025-07-01 00:00:00', TIMESTAMP '2025-08-01 00:00:00', 'VENCIDO'),
        (TIMESTAMP '2025-08-01 00:00:00', TIMESTAMP '2025-09-01 00:00:00', 'VENCIDO'),
        (TIMESTAMP '2025-09-01 00:00:00', TIMESTAMP '2025-10-01 00:00:00', 'VENCIDO'),
        (TIMESTAMP '2025-10-01 00:00:00', TIMESTAMP '2025-11-01 00:00:00', 'VENCIDO'),
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
       TIMESTAMP '2025-07-01 00:00:00', periodos.estado,
       0, 0, 'Servicio histórico importado desde Excel',
       periodos.fecha_inicio, periodos.fecha_inicio
FROM periodos
JOIN public.cliente c ON c.ruc = '10449275051'
JOIN public.venta v ON v.cliente_id = c.id
                    AND v.fecha_venta = periodos.fecha_inicio
WHERE NOT EXISTS (
    SELECT 1 FROM public.servicio_cliente sc
    WHERE sc.venta_id = v.id
);

-- 6. SERVICIO ACTUAL
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
  AND c.ruc = '10449275051';

-- 7. COBRO SIGUIENTE
UPDATE public.venta v
SET precio_lista = s.precio,
    monto_prorrateado = 0,
    monto_total = s.precio,
    estado_venta = 'PENDIENTE_PAGO',
    observaciones = 'Renovación siguiente: cobro mensual normal desde el día 01',
    fecha_actualizacion = TIMESTAMP '2026-08-01 00:00:00'
FROM public.cliente c
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Emprende'
WHERE v.cliente_id = c.id
  AND v.tipo_venta = 'RENOVACION'
  AND v.estado_venta = 'PENDIENTE_PAGO'
  AND v.fecha_venta = TIMESTAMP '2026-09-01 00:00:00'
  AND c.ruc = '10449275051';

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
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Emprende'
JOIN public.venta v ON v.cliente_id = c.id
                   AND v.fecha_venta = TIMESTAMP '2026-08-01 00:00:00'
                   AND v.estado_venta = 'PAGADA'
WHERE c.ruc = '10449275051'
  AND NOT EXISTS (
      SELECT 1 FROM public.venta pendiente
      WHERE pendiente.cliente_id = c.id
        AND pendiente.tipo_venta = 'RENOVACION'
        AND pendiente.estado_venta = 'PENDIENTE_PAGO'
        AND pendiente.fecha_venta = TIMESTAMP '2026-09-01 00:00:00'
  );

-- 8. ESTADO ACTUAL E HISTORIAL
UPDATE public.cliente
SET estado_id = (SELECT id FROM public.estado_cliente
                 WHERE nombre = 'HABILITADO' AND activo = true LIMIT 1),
    fecha_actualizacion = TIMESTAMP '2026-08-01 00:00:00'
WHERE ruc = '10449275051';

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, NULL, pc.id, NULL,
       'Registro histórico importado desde Excel',
       TIMESTAMP '2025-07-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pc ON pc.nombre = 'POR_COBRAR'
WHERE c.ruc = '10449275051'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Registro histórico importado desde Excel');

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, pc.id, pcap.id, NULL,
       'Pago histórico confirmado desde Excel',
       TIMESTAMP '2025-07-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pc ON pc.nombre = 'POR_COBRAR'
JOIN public.estado_cliente pcap ON pcap.nombre = 'POR_CAPACITAR'
WHERE c.ruc = '10449275051'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Pago histórico confirmado desde Excel');

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, pcap.id, hab.id, NULL,
       'Capacitación histórica confirmada desde Excel',
       TIMESTAMP '2025-07-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pcap ON pcap.nombre = 'POR_CAPACITAR'
JOIN public.estado_cliente hab ON hab.nombre = 'HABILITADO'
WHERE c.ruc = '10449275051'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Capacitación histórica confirmada desde Excel');


-- ============================================================
-- CLIENTE: 10073457411 - Concepcion Morocho Quillama
-- ============================================================

-- 1. CLIENTE
INSERT INTO public.cliente (
    ruc, usuario_sol, clave_sol_cifrada, razon_social, nombre_comercial,
    direccion, departamento, provincia, distrito, telefono, email,
    nombres, apellidos, dni, telefono_personal, email_personal,
    usuario_admin_facturador, clave_temporal, url_acceso, usuario_wsp,
    estado_id, color_tag_id, entorno_id, activo,
    fecha_registro, fecha_actualizacion
)
VALUES (
    '10073457411',
    NULL,
    NULL,
    'Concepcion Morocho Quillama',
    'Chifa Ericka y Jessica',
    'Malecon Checa 141 - Zarate - San Juan de Lurigancho',
    NULL, NULL, NULL,
    '920 049 040',
    'ericahm81@gmail.com',
    NULL, NULL, '7345741',
    '920 049 040',
    'ericahm81@gmail.com',
    'ericahm81@gmail.com',
    '10073457411',
    'chifaerickayjessica.miquipu.net',
    NULL,
    (SELECT id FROM public.estado_cliente WHERE nombre = 'HABILITADO' AND activo = true LIMIT 1),
    (SELECT id FROM public.color_tag WHERE codigo = 'Rojo' AND activo = true LIMIT 1),
    (SELECT id FROM public.entorno WHERE nombre = 'Producción' AND activo = true LIMIT 1),
    true,
    TIMESTAMP '2025-07-01 00:00:00',
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

-- 2. VENTA INICIAL
INSERT INTO public.venta (
    cliente_id, vendedor_id, suscripcion_id, tipo_venta, venta_anterior_id,
    precio_lista, monto_prorrateado, monto_total, estado_venta,
    observaciones, fecha_venta, fecha_actualizacion
)
SELECT c.id, NULL, s.id, 'ALTA', NULL,
       s.precio, 0, s.precio, 'PAGADA',
       'Importación de registro histórico desde Excel',
       TIMESTAMP '2025-07-01 00:00:00', TIMESTAMP '2025-07-01 00:00:00'
FROM public.cliente c
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Emprende'
WHERE c.ruc = '10073457411'
  AND NOT EXISTS (
      SELECT 1 FROM public.venta v
      WHERE v.cliente_id = c.id
        AND v.tipo_venta = 'ALTA'
        AND v.fecha_venta = TIMESTAMP '2025-07-01 00:00:00'
  );

-- 3. RENOVACIONES PAGADAS
WITH fechas(fecha) AS (
    VALUES
        (TIMESTAMP '2025-08-01 00:00:00'),
        (TIMESTAMP '2025-09-01 00:00:00'),
        (TIMESTAMP '2025-10-01 00:00:00'),
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
JOIN public.cliente c ON c.ruc = '10073457411'
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Emprende'
WHERE NOT EXISTS (
    SELECT 1 FROM public.venta v
    WHERE v.cliente_id = c.id
      AND v.tipo_venta = 'RENOVACION'
      AND v.fecha_venta = fechas.fecha
);

-- 4. PAGOS HISTORICOS
WITH fechas(fecha) AS (
    VALUES
        (TIMESTAMP '2025-07-01 00:00:00'),
        (TIMESTAMP '2025-08-01 00:00:00'),
        (TIMESTAMP '2025-09-01 00:00:00'),
        (TIMESTAMP '2025-10-01 00:00:00'),
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
JOIN public.cliente c ON c.ruc = '10073457411'
JOIN public.venta v ON v.cliente_id = c.id
                    AND v.fecha_venta = fechas.fecha
                    AND v.estado_venta = 'PAGADA'
WHERE NOT EXISTS (
    SELECT 1 FROM public.pago px
    WHERE px.venta_id = v.id
      AND px.fecha_pago = fechas.fecha
);

-- 5. SERVICIOS PERIODOS
WITH periodos(fecha_inicio, fecha_fin, estado) AS (
    VALUES
        (TIMESTAMP '2025-07-01 00:00:00', TIMESTAMP '2025-08-01 00:00:00', 'VENCIDO'),
        (TIMESTAMP '2025-08-01 00:00:00', TIMESTAMP '2025-09-01 00:00:00', 'VENCIDO'),
        (TIMESTAMP '2025-09-01 00:00:00', TIMESTAMP '2025-10-01 00:00:00', 'VENCIDO'),
        (TIMESTAMP '2025-10-01 00:00:00', TIMESTAMP '2025-11-01 00:00:00', 'VENCIDO'),
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
       TIMESTAMP '2025-07-01 00:00:00', periodos.estado,
       0, 0, 'Servicio histórico importado desde Excel',
       periodos.fecha_inicio, periodos.fecha_inicio
FROM periodos
JOIN public.cliente c ON c.ruc = '10073457411'
JOIN public.venta v ON v.cliente_id = c.id
                    AND v.fecha_venta = periodos.fecha_inicio
WHERE NOT EXISTS (
    SELECT 1 FROM public.servicio_cliente sc
    WHERE sc.venta_id = v.id
);

-- 6. SERVICIO ACTUAL
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
  AND c.ruc = '10073457411';

-- 7. COBRO SIGUIENTE
UPDATE public.venta v
SET precio_lista = s.precio,
    monto_prorrateado = 0,
    monto_total = s.precio,
    estado_venta = 'PENDIENTE_PAGO',
    observaciones = 'Renovación siguiente: cobro mensual normal desde el día 01',
    fecha_actualizacion = TIMESTAMP '2026-08-01 00:00:00'
FROM public.cliente c
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Emprende'
WHERE v.cliente_id = c.id
  AND v.tipo_venta = 'RENOVACION'
  AND v.estado_venta = 'PENDIENTE_PAGO'
  AND v.fecha_venta = TIMESTAMP '2026-09-01 00:00:00'
  AND c.ruc = '10073457411';

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
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Emprende'
JOIN public.venta v ON v.cliente_id = c.id
                   AND v.fecha_venta = TIMESTAMP '2026-08-01 00:00:00'
                   AND v.estado_venta = 'PAGADA'
WHERE c.ruc = '10073457411'
  AND NOT EXISTS (
      SELECT 1 FROM public.venta pendiente
      WHERE pendiente.cliente_id = c.id
        AND pendiente.tipo_venta = 'RENOVACION'
        AND pendiente.estado_venta = 'PENDIENTE_PAGO'
        AND pendiente.fecha_venta = TIMESTAMP '2026-09-01 00:00:00'
  );

-- 8. ESTADO ACTUAL E HISTORIAL
UPDATE public.cliente
SET estado_id = (SELECT id FROM public.estado_cliente
                 WHERE nombre = 'HABILITADO' AND activo = true LIMIT 1),
    fecha_actualizacion = TIMESTAMP '2026-08-01 00:00:00'
WHERE ruc = '10073457411';

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, NULL, pc.id, NULL,
       'Registro histórico importado desde Excel',
       TIMESTAMP '2025-07-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pc ON pc.nombre = 'POR_COBRAR'
WHERE c.ruc = '10073457411'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Registro histórico importado desde Excel');

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, pc.id, pcap.id, NULL,
       'Pago histórico confirmado desde Excel',
       TIMESTAMP '2025-07-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pc ON pc.nombre = 'POR_COBRAR'
JOIN public.estado_cliente pcap ON pcap.nombre = 'POR_CAPACITAR'
WHERE c.ruc = '10073457411'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Pago histórico confirmado desde Excel');

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, pcap.id, hab.id, NULL,
       'Capacitación histórica confirmada desde Excel',
       TIMESTAMP '2025-07-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pcap ON pcap.nombre = 'POR_CAPACITAR'
JOIN public.estado_cliente hab ON hab.nombre = 'HABILITADO'
WHERE c.ruc = '10073457411'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Capacitación histórica confirmada desde Excel');


-- ============================================================
-- CLIENTE: 10454572471 - LAZARO RAMIREZ SICELA NANCY
-- ============================================================

-- 1. CLIENTE
INSERT INTO public.cliente (
    ruc, usuario_sol, clave_sol_cifrada, razon_social, nombre_comercial,
    direccion, departamento, provincia, distrito, telefono, email,
    nombres, apellidos, dni, telefono_personal, email_personal,
    usuario_admin_facturador, clave_temporal, url_acceso, usuario_wsp,
    estado_id, color_tag_id, entorno_id, activo,
    fecha_registro, fecha_actualizacion
)
VALUES (
    '10454572471',
    NULL,
    NULL,
    'LAZARO RAMIREZ SICELA NANCY',
    'SODA SOLANCH',
    NULL,
    NULL, NULL, NULL,
    '997690975',
    NULL,
    NULL, NULL, NULL,
    '997690975',
    NULL,
    NULL,
    NULL,
    'sodasolanch.miquipu.net',
    NULL,
    (SELECT id FROM public.estado_cliente WHERE nombre = 'HABILITADO' AND activo = true LIMIT 1),
    (SELECT id FROM public.color_tag WHERE codigo = 'Rojo' AND activo = true LIMIT 1),
    (SELECT id FROM public.entorno WHERE nombre = 'Producción' AND activo = true LIMIT 1),
    true,
    TIMESTAMP '2025-07-01 00:00:00',
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

-- 2. VENTA INICIAL
INSERT INTO public.venta (
    cliente_id, vendedor_id, suscripcion_id, tipo_venta, venta_anterior_id,
    precio_lista, monto_prorrateado, monto_total, estado_venta,
    observaciones, fecha_venta, fecha_actualizacion
)
SELECT c.id, NULL, s.id, 'ALTA', NULL,
       s.precio, 0, s.precio, 'PAGADA',
       'Importación de registro histórico desde Excel',
       TIMESTAMP '2025-07-01 00:00:00', TIMESTAMP '2025-07-01 00:00:00'
FROM public.cliente c
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Emprende'
WHERE c.ruc = '10454572471'
  AND NOT EXISTS (
      SELECT 1 FROM public.venta v
      WHERE v.cliente_id = c.id
        AND v.tipo_venta = 'ALTA'
        AND v.fecha_venta = TIMESTAMP '2025-07-01 00:00:00'
  );

-- 3. RENOVACIONES PAGADAS
WITH fechas(fecha) AS (
    VALUES
        (TIMESTAMP '2025-08-01 00:00:00'),
        (TIMESTAMP '2025-09-01 00:00:00'),
        (TIMESTAMP '2025-10-01 00:00:00'),
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
JOIN public.cliente c ON c.ruc = '10454572471'
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Emprende'
WHERE NOT EXISTS (
    SELECT 1 FROM public.venta v
    WHERE v.cliente_id = c.id
      AND v.tipo_venta = 'RENOVACION'
      AND v.fecha_venta = fechas.fecha
);

-- 4. PAGOS HISTORICOS
WITH fechas(fecha) AS (
    VALUES
        (TIMESTAMP '2025-07-01 00:00:00'),
        (TIMESTAMP '2025-08-01 00:00:00'),
        (TIMESTAMP '2025-09-01 00:00:00'),
        (TIMESTAMP '2025-10-01 00:00:00'),
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
JOIN public.cliente c ON c.ruc = '10454572471'
JOIN public.venta v ON v.cliente_id = c.id
                    AND v.fecha_venta = fechas.fecha
                    AND v.estado_venta = 'PAGADA'
WHERE NOT EXISTS (
    SELECT 1 FROM public.pago px
    WHERE px.venta_id = v.id
      AND px.fecha_pago = fechas.fecha
);

-- 5. SERVICIOS PERIODOS
WITH periodos(fecha_inicio, fecha_fin, estado) AS (
    VALUES
        (TIMESTAMP '2025-07-01 00:00:00', TIMESTAMP '2025-08-01 00:00:00', 'VENCIDO'),
        (TIMESTAMP '2025-08-01 00:00:00', TIMESTAMP '2025-09-01 00:00:00', 'VENCIDO'),
        (TIMESTAMP '2025-09-01 00:00:00', TIMESTAMP '2025-10-01 00:00:00', 'VENCIDO'),
        (TIMESTAMP '2025-10-01 00:00:00', TIMESTAMP '2025-11-01 00:00:00', 'VENCIDO'),
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
       TIMESTAMP '2025-07-01 00:00:00', periodos.estado,
       0, 0, 'Servicio histórico importado desde Excel',
       periodos.fecha_inicio, periodos.fecha_inicio
FROM periodos
JOIN public.cliente c ON c.ruc = '10454572471'
JOIN public.venta v ON v.cliente_id = c.id
                    AND v.fecha_venta = periodos.fecha_inicio
WHERE NOT EXISTS (
    SELECT 1 FROM public.servicio_cliente sc
    WHERE sc.venta_id = v.id
);

-- 6. SERVICIO ACTUAL
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
  AND c.ruc = '10454572471';

-- 7. COBRO SIGUIENTE
UPDATE public.venta v
SET precio_lista = s.precio,
    monto_prorrateado = 0,
    monto_total = s.precio,
    estado_venta = 'PENDIENTE_PAGO',
    observaciones = 'Renovación siguiente: cobro mensual normal desde el día 01',
    fecha_actualizacion = TIMESTAMP '2026-08-01 00:00:00'
FROM public.cliente c
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Emprende'
WHERE v.cliente_id = c.id
  AND v.tipo_venta = 'RENOVACION'
  AND v.estado_venta = 'PENDIENTE_PAGO'
  AND v.fecha_venta = TIMESTAMP '2026-09-01 00:00:00'
  AND c.ruc = '10454572471';

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
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Emprende'
JOIN public.venta v ON v.cliente_id = c.id
                   AND v.fecha_venta = TIMESTAMP '2026-08-01 00:00:00'
                   AND v.estado_venta = 'PAGADA'
WHERE c.ruc = '10454572471'
  AND NOT EXISTS (
      SELECT 1 FROM public.venta pendiente
      WHERE pendiente.cliente_id = c.id
        AND pendiente.tipo_venta = 'RENOVACION'
        AND pendiente.estado_venta = 'PENDIENTE_PAGO'
        AND pendiente.fecha_venta = TIMESTAMP '2026-09-01 00:00:00'
  );

-- 8. ESTADO ACTUAL E HISTORIAL
UPDATE public.cliente
SET estado_id = (SELECT id FROM public.estado_cliente
                 WHERE nombre = 'HABILITADO' AND activo = true LIMIT 1),
    fecha_actualizacion = TIMESTAMP '2026-08-01 00:00:00'
WHERE ruc = '10454572471';

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, NULL, pc.id, NULL,
       'Registro histórico importado desde Excel',
       TIMESTAMP '2025-07-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pc ON pc.nombre = 'POR_COBRAR'
WHERE c.ruc = '10454572471'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Registro histórico importado desde Excel');

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, pc.id, pcap.id, NULL,
       'Pago histórico confirmado desde Excel',
       TIMESTAMP '2025-07-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pc ON pc.nombre = 'POR_COBRAR'
JOIN public.estado_cliente pcap ON pcap.nombre = 'POR_CAPACITAR'
WHERE c.ruc = '10454572471'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Pago histórico confirmado desde Excel');

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, pcap.id, hab.id, NULL,
       'Capacitación histórica confirmada desde Excel',
       TIMESTAMP '2025-07-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pcap ON pcap.nombre = 'POR_CAPACITAR'
JOIN public.estado_cliente hab ON hab.nombre = 'HABILITADO'
WHERE c.ruc = '10454572471'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Capacitación histórica confirmada desde Excel');


-- ============================================================
-- CLIENTE: 10436464288 - DELGADILLO MUÑOZ EDGAR
-- ============================================================

-- 1. CLIENTE
INSERT INTO public.cliente (
    ruc, usuario_sol, clave_sol_cifrada, razon_social, nombre_comercial,
    direccion, departamento, provincia, distrito, telefono, email,
    nombres, apellidos, dni, telefono_personal, email_personal,
    usuario_admin_facturador, clave_temporal, url_acceso, usuario_wsp,
    estado_id, color_tag_id, entorno_id, activo,
    fecha_registro, fecha_actualizacion
)
VALUES (
    '10436464288',
    NULL,
    NULL,
    'DELGADILLO MUÑOZ EDGAR',
    'ESTILOS HOGAR',
    NULL,
    NULL, NULL, NULL,
    '997842711',
    NULL,
    NULL, NULL, NULL,
    '997842711',
    NULL,
    NULL,
    NULL,
    'estiloshogar.miquipu.net',
    NULL,
    (SELECT id FROM public.estado_cliente WHERE nombre = 'HABILITADO' AND activo = true LIMIT 1),
    (SELECT id FROM public.color_tag WHERE codigo = 'Rojo' AND activo = true LIMIT 1),
    (SELECT id FROM public.entorno WHERE nombre = 'Producción' AND activo = true LIMIT 1),
    true,
    TIMESTAMP '2025-08-01 00:00:00',
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

-- 2. VENTA INICIAL
INSERT INTO public.venta (
    cliente_id, vendedor_id, suscripcion_id, tipo_venta, venta_anterior_id,
    precio_lista, monto_prorrateado, monto_total, estado_venta,
    observaciones, fecha_venta, fecha_actualizacion
)
SELECT c.id, NULL, s.id, 'ALTA', NULL,
       s.precio, 0, s.precio, 'PAGADA',
       'Importación de registro histórico desde Excel',
       TIMESTAMP '2025-08-01 00:00:00', TIMESTAMP '2025-08-01 00:00:00'
FROM public.cliente c
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Emprende'
WHERE c.ruc = '10436464288'
  AND NOT EXISTS (
      SELECT 1 FROM public.venta v
      WHERE v.cliente_id = c.id
        AND v.tipo_venta = 'ALTA'
        AND v.fecha_venta = TIMESTAMP '2025-08-01 00:00:00'
  );

-- 3. RENOVACIONES PAGADAS
WITH fechas(fecha) AS (
    VALUES
        (TIMESTAMP '2025-09-01 00:00:00'),
        (TIMESTAMP '2025-10-01 00:00:00'),
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
JOIN public.cliente c ON c.ruc = '10436464288'
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Emprende'
WHERE NOT EXISTS (
    SELECT 1 FROM public.venta v
    WHERE v.cliente_id = c.id
      AND v.tipo_venta = 'RENOVACION'
      AND v.fecha_venta = fechas.fecha
);

-- 4. PAGOS HISTORICOS
WITH fechas(fecha) AS (
    VALUES
        (TIMESTAMP '2025-08-01 00:00:00'),
        (TIMESTAMP '2025-09-01 00:00:00'),
        (TIMESTAMP '2025-10-01 00:00:00'),
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
JOIN public.cliente c ON c.ruc = '10436464288'
JOIN public.venta v ON v.cliente_id = c.id
                    AND v.fecha_venta = fechas.fecha
                    AND v.estado_venta = 'PAGADA'
WHERE NOT EXISTS (
    SELECT 1 FROM public.pago px
    WHERE px.venta_id = v.id
      AND px.fecha_pago = fechas.fecha
);

-- 5. SERVICIOS PERIODOS
WITH periodos(fecha_inicio, fecha_fin, estado) AS (
    VALUES
        (TIMESTAMP '2025-08-01 00:00:00', TIMESTAMP '2025-09-01 00:00:00', 'VENCIDO'),
        (TIMESTAMP '2025-09-01 00:00:00', TIMESTAMP '2025-10-01 00:00:00', 'VENCIDO'),
        (TIMESTAMP '2025-10-01 00:00:00', TIMESTAMP '2025-11-01 00:00:00', 'VENCIDO'),
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
       TIMESTAMP '2025-08-01 00:00:00', periodos.estado,
       0, 0, 'Servicio histórico importado desde Excel',
       periodos.fecha_inicio, periodos.fecha_inicio
FROM periodos
JOIN public.cliente c ON c.ruc = '10436464288'
JOIN public.venta v ON v.cliente_id = c.id
                    AND v.fecha_venta = periodos.fecha_inicio
WHERE NOT EXISTS (
    SELECT 1 FROM public.servicio_cliente sc
    WHERE sc.venta_id = v.id
);

-- 6. SERVICIO ACTUAL
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
  AND c.ruc = '10436464288';

-- 7. COBRO SIGUIENTE
UPDATE public.venta v
SET precio_lista = s.precio,
    monto_prorrateado = 0,
    monto_total = s.precio,
    estado_venta = 'PENDIENTE_PAGO',
    observaciones = 'Renovación siguiente: cobro mensual normal desde el día 01',
    fecha_actualizacion = TIMESTAMP '2026-08-01 00:00:00'
FROM public.cliente c
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Emprende'
WHERE v.cliente_id = c.id
  AND v.tipo_venta = 'RENOVACION'
  AND v.estado_venta = 'PENDIENTE_PAGO'
  AND v.fecha_venta = TIMESTAMP '2026-09-01 00:00:00'
  AND c.ruc = '10436464288';

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
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Emprende'
JOIN public.venta v ON v.cliente_id = c.id
                   AND v.fecha_venta = TIMESTAMP '2026-08-01 00:00:00'
                   AND v.estado_venta = 'PAGADA'
WHERE c.ruc = '10436464288'
  AND NOT EXISTS (
      SELECT 1 FROM public.venta pendiente
      WHERE pendiente.cliente_id = c.id
        AND pendiente.tipo_venta = 'RENOVACION'
        AND pendiente.estado_venta = 'PENDIENTE_PAGO'
        AND pendiente.fecha_venta = TIMESTAMP '2026-09-01 00:00:00'
  );

-- 8. ESTADO ACTUAL E HISTORIAL
UPDATE public.cliente
SET estado_id = (SELECT id FROM public.estado_cliente
                 WHERE nombre = 'HABILITADO' AND activo = true LIMIT 1),
    fecha_actualizacion = TIMESTAMP '2026-08-01 00:00:00'
WHERE ruc = '10436464288';

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, NULL, pc.id, NULL,
       'Registro histórico importado desde Excel',
       TIMESTAMP '2025-08-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pc ON pc.nombre = 'POR_COBRAR'
WHERE c.ruc = '10436464288'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Registro histórico importado desde Excel');

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, pc.id, pcap.id, NULL,
       'Pago histórico confirmado desde Excel',
       TIMESTAMP '2025-08-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pc ON pc.nombre = 'POR_COBRAR'
JOIN public.estado_cliente pcap ON pcap.nombre = 'POR_CAPACITAR'
WHERE c.ruc = '10436464288'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Pago histórico confirmado desde Excel');

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, pcap.id, hab.id, NULL,
       'Capacitación histórica confirmada desde Excel',
       TIMESTAMP '2025-08-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pcap ON pcap.nombre = 'POR_CAPACITAR'
JOIN public.estado_cliente hab ON hab.nombre = 'HABILITADO'
WHERE c.ruc = '10436464288'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Capacitación histórica confirmada desde Excel');


-- ============================================================
-- CLIENTE: 10752390709 - Barbara romani Rioja
-- ============================================================

-- 1. CLIENTE
INSERT INTO public.cliente (
    ruc, usuario_sol, clave_sol_cifrada, razon_social, nombre_comercial,
    direccion, departamento, provincia, distrito, telefono, email,
    nombres, apellidos, dni, telefono_personal, email_personal,
    usuario_admin_facturador, clave_temporal, url_acceso, usuario_wsp,
    estado_id, color_tag_id, entorno_id, activo,
    fecha_registro, fecha_actualizacion
)
VALUES (
    '10752390709',
    NULL,
    NULL,
    'Barbara romani Rioja',
    'LA CASA DE LOS COJINES',
    NULL,
    NULL, NULL, NULL,
    '937041706',
    'lacasadeloscojines@miquipu.net',
    NULL, NULL, NULL,
    '937041706',
    'lacasadeloscojines@miquipu.net',
    NULL,
    NULL,
    'lacasadeloscojines.miquipu.net',
    NULL,
    (SELECT id FROM public.estado_cliente WHERE nombre = 'HABILITADO' AND activo = true LIMIT 1),
    (SELECT id FROM public.color_tag WHERE codigo = 'Amarillo' AND activo = true LIMIT 1),
    (SELECT id FROM public.entorno WHERE nombre = 'Producción' AND activo = true LIMIT 1),
    true,
    TIMESTAMP '2025-08-01 00:00:00',
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

-- 2. VENTA INICIAL
INSERT INTO public.venta (
    cliente_id, vendedor_id, suscripcion_id, tipo_venta, venta_anterior_id,
    precio_lista, monto_prorrateado, monto_total, estado_venta,
    observaciones, fecha_venta, fecha_actualizacion
)
SELECT c.id, NULL, s.id, 'ALTA', NULL,
       s.precio, 0, s.precio, 'PAGADA',
       'Importación de registro histórico desde Excel',
       TIMESTAMP '2025-08-01 00:00:00', TIMESTAMP '2025-08-01 00:00:00'
FROM public.cliente c
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Inicial'
WHERE c.ruc = '10752390709'
  AND NOT EXISTS (
      SELECT 1 FROM public.venta v
      WHERE v.cliente_id = c.id
        AND v.tipo_venta = 'ALTA'
        AND v.fecha_venta = TIMESTAMP '2025-08-01 00:00:00'
  );

-- 3. RENOVACIONES PAGADAS
WITH fechas(fecha) AS (
    VALUES
        (TIMESTAMP '2025-09-01 00:00:00'),
        (TIMESTAMP '2025-10-01 00:00:00'),
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
JOIN public.cliente c ON c.ruc = '10752390709'
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Inicial'
WHERE NOT EXISTS (
    SELECT 1 FROM public.venta v
    WHERE v.cliente_id = c.id
      AND v.tipo_venta = 'RENOVACION'
      AND v.fecha_venta = fechas.fecha
);

-- 4. PAGOS HISTORICOS
WITH fechas(fecha) AS (
    VALUES
        (TIMESTAMP '2025-08-01 00:00:00'),
        (TIMESTAMP '2025-09-01 00:00:00'),
        (TIMESTAMP '2025-10-01 00:00:00'),
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
JOIN public.cliente c ON c.ruc = '10752390709'
JOIN public.venta v ON v.cliente_id = c.id
                    AND v.fecha_venta = fechas.fecha
                    AND v.estado_venta = 'PAGADA'
WHERE NOT EXISTS (
    SELECT 1 FROM public.pago px
    WHERE px.venta_id = v.id
      AND px.fecha_pago = fechas.fecha
);

-- 5. SERVICIOS PERIODOS
WITH periodos(fecha_inicio, fecha_fin, estado) AS (
    VALUES
        (TIMESTAMP '2025-08-01 00:00:00', TIMESTAMP '2025-09-01 00:00:00', 'VENCIDO'),
        (TIMESTAMP '2025-09-01 00:00:00', TIMESTAMP '2025-10-01 00:00:00', 'VENCIDO'),
        (TIMESTAMP '2025-10-01 00:00:00', TIMESTAMP '2025-11-01 00:00:00', 'VENCIDO'),
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
       TIMESTAMP '2025-08-01 00:00:00', periodos.estado,
       0, 0, 'Servicio histórico importado desde Excel',
       periodos.fecha_inicio, periodos.fecha_inicio
FROM periodos
JOIN public.cliente c ON c.ruc = '10752390709'
JOIN public.venta v ON v.cliente_id = c.id
                    AND v.fecha_venta = periodos.fecha_inicio
WHERE NOT EXISTS (
    SELECT 1 FROM public.servicio_cliente sc
    WHERE sc.venta_id = v.id
);

-- 6. SERVICIO ACTUAL
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
  AND c.ruc = '10752390709';

-- 7. COBRO SIGUIENTE
UPDATE public.venta v
SET precio_lista = s.precio,
    monto_prorrateado = 0,
    monto_total = s.precio,
    estado_venta = 'PENDIENTE_PAGO',
    observaciones = 'Renovación siguiente: cobro mensual normal desde el día 01',
    fecha_actualizacion = TIMESTAMP '2026-08-01 00:00:00'
FROM public.cliente c
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Inicial'
WHERE v.cliente_id = c.id
  AND v.tipo_venta = 'RENOVACION'
  AND v.estado_venta = 'PENDIENTE_PAGO'
  AND v.fecha_venta = TIMESTAMP '2026-09-01 00:00:00'
  AND c.ruc = '10752390709';

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
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Inicial'
JOIN public.venta v ON v.cliente_id = c.id
                   AND v.fecha_venta = TIMESTAMP '2026-08-01 00:00:00'
                   AND v.estado_venta = 'PAGADA'
WHERE c.ruc = '10752390709'
  AND NOT EXISTS (
      SELECT 1 FROM public.venta pendiente
      WHERE pendiente.cliente_id = c.id
        AND pendiente.tipo_venta = 'RENOVACION'
        AND pendiente.estado_venta = 'PENDIENTE_PAGO'
        AND pendiente.fecha_venta = TIMESTAMP '2026-09-01 00:00:00'
  );

-- 8. ESTADO ACTUAL E HISTORIAL
UPDATE public.cliente
SET estado_id = (SELECT id FROM public.estado_cliente
                 WHERE nombre = 'HABILITADO' AND activo = true LIMIT 1),
    fecha_actualizacion = TIMESTAMP '2026-08-01 00:00:00'
WHERE ruc = '10752390709';

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, NULL, pc.id, NULL,
       'Registro histórico importado desde Excel',
       TIMESTAMP '2025-08-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pc ON pc.nombre = 'POR_COBRAR'
WHERE c.ruc = '10752390709'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Registro histórico importado desde Excel');

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, pc.id, pcap.id, NULL,
       'Pago histórico confirmado desde Excel',
       TIMESTAMP '2025-08-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pc ON pc.nombre = 'POR_COBRAR'
JOIN public.estado_cliente pcap ON pcap.nombre = 'POR_CAPACITAR'
WHERE c.ruc = '10752390709'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Pago histórico confirmado desde Excel');

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, pcap.id, hab.id, NULL,
       'Capacitación histórica confirmada desde Excel',
       TIMESTAMP '2025-08-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pcap ON pcap.nombre = 'POR_CAPACITAR'
JOIN public.estado_cliente hab ON hab.nombre = 'HABILITADO'
WHERE c.ruc = '10752390709'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Capacitación histórica confirmada desde Excel');


-- ============================================================
-- CLIENTE: 10754275702 - RAMOS GARCIA KENYI JHOAN
-- ============================================================

-- 1. CLIENTE
INSERT INTO public.cliente (
    ruc, usuario_sol, clave_sol_cifrada, razon_social, nombre_comercial,
    direccion, departamento, provincia, distrito, telefono, email,
    nombres, apellidos, dni, telefono_personal, email_personal,
    usuario_admin_facturador, clave_temporal, url_acceso, usuario_wsp,
    estado_id, color_tag_id, entorno_id, activo,
    fecha_registro, fecha_actualizacion
)
VALUES (
    '10754275702',
    'KENYIJHO',
    'Ra75427570',
    'RAMOS GARCIA KENYI JHOAN',
    'JHOKEN IMPORT',
    NULL,
    NULL, NULL, NULL,
    '910547491',
    'ramsjhoan@gmail.com',
    NULL, NULL, NULL,
    '910547491',
    'ramsjhoan@gmail.com',
    NULL,
    NULL,
    'RUS',
    NULL,
    (SELECT id FROM public.estado_cliente WHERE nombre = 'HABILITADO' AND activo = true LIMIT 1),
    (SELECT id FROM public.color_tag WHERE codigo = 'Amarillo' AND activo = true LIMIT 1),
    (SELECT id FROM public.entorno WHERE nombre = 'Producción' AND activo = true LIMIT 1),
    true,
    TIMESTAMP '2025-09-01 00:00:00',
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

-- 2. VENTA INICIAL
INSERT INTO public.venta (
    cliente_id, vendedor_id, suscripcion_id, tipo_venta, venta_anterior_id,
    precio_lista, monto_prorrateado, monto_total, estado_venta,
    observaciones, fecha_venta, fecha_actualizacion
)
SELECT c.id, NULL, s.id, 'ALTA', NULL,
       s.precio, 0, s.precio, 'PAGADA',
       'Importación de registro histórico desde Excel',
       TIMESTAMP '2025-09-01 00:00:00', TIMESTAMP '2025-09-01 00:00:00'
FROM public.cliente c
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Emprende'
WHERE c.ruc = '10754275702'
  AND NOT EXISTS (
      SELECT 1 FROM public.venta v
      WHERE v.cliente_id = c.id
        AND v.tipo_venta = 'ALTA'
        AND v.fecha_venta = TIMESTAMP '2025-09-01 00:00:00'
  );

-- 3. RENOVACIONES PAGADAS
WITH fechas(fecha) AS (
    VALUES
        (TIMESTAMP '2025-10-01 00:00:00'),
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
JOIN public.cliente c ON c.ruc = '10754275702'
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Emprende'
WHERE NOT EXISTS (
    SELECT 1 FROM public.venta v
    WHERE v.cliente_id = c.id
      AND v.tipo_venta = 'RENOVACION'
      AND v.fecha_venta = fechas.fecha
);

-- 4. PAGOS HISTORICOS
WITH fechas(fecha) AS (
    VALUES
        (TIMESTAMP '2025-09-01 00:00:00'),
        (TIMESTAMP '2025-10-01 00:00:00'),
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
JOIN public.cliente c ON c.ruc = '10754275702'
JOIN public.venta v ON v.cliente_id = c.id
                    AND v.fecha_venta = fechas.fecha
                    AND v.estado_venta = 'PAGADA'
WHERE NOT EXISTS (
    SELECT 1 FROM public.pago px
    WHERE px.venta_id = v.id
      AND px.fecha_pago = fechas.fecha
);

-- 5. SERVICIOS PERIODOS
WITH periodos(fecha_inicio, fecha_fin, estado) AS (
    VALUES
        (TIMESTAMP '2025-09-01 00:00:00', TIMESTAMP '2025-10-01 00:00:00', 'VENCIDO'),
        (TIMESTAMP '2025-10-01 00:00:00', TIMESTAMP '2025-11-01 00:00:00', 'VENCIDO'),
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
       TIMESTAMP '2025-09-01 00:00:00', periodos.estado,
       0, 0, 'Servicio histórico importado desde Excel',
       periodos.fecha_inicio, periodos.fecha_inicio
FROM periodos
JOIN public.cliente c ON c.ruc = '10754275702'
JOIN public.venta v ON v.cliente_id = c.id
                    AND v.fecha_venta = periodos.fecha_inicio
WHERE NOT EXISTS (
    SELECT 1 FROM public.servicio_cliente sc
    WHERE sc.venta_id = v.id
);

-- 6. SERVICIO ACTUAL
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
  AND c.ruc = '10754275702';

-- 7. COBRO SIGUIENTE
UPDATE public.venta v
SET precio_lista = s.precio,
    monto_prorrateado = 0,
    monto_total = s.precio,
    estado_venta = 'PENDIENTE_PAGO',
    observaciones = 'Renovación siguiente: cobro mensual normal desde el día 01',
    fecha_actualizacion = TIMESTAMP '2026-08-01 00:00:00'
FROM public.cliente c
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Emprende'
WHERE v.cliente_id = c.id
  AND v.tipo_venta = 'RENOVACION'
  AND v.estado_venta = 'PENDIENTE_PAGO'
  AND v.fecha_venta = TIMESTAMP '2026-09-01 00:00:00'
  AND c.ruc = '10754275702';

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
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Emprende'
JOIN public.venta v ON v.cliente_id = c.id
                   AND v.fecha_venta = TIMESTAMP '2026-08-01 00:00:00'
                   AND v.estado_venta = 'PAGADA'
WHERE c.ruc = '10754275702'
  AND NOT EXISTS (
      SELECT 1 FROM public.venta pendiente
      WHERE pendiente.cliente_id = c.id
        AND pendiente.tipo_venta = 'RENOVACION'
        AND pendiente.estado_venta = 'PENDIENTE_PAGO'
        AND pendiente.fecha_venta = TIMESTAMP '2026-09-01 00:00:00'
  );

-- 8. ESTADO ACTUAL E HISTORIAL
UPDATE public.cliente
SET estado_id = (SELECT id FROM public.estado_cliente
                 WHERE nombre = 'HABILITADO' AND activo = true LIMIT 1),
    fecha_actualizacion = TIMESTAMP '2026-08-01 00:00:00'
WHERE ruc = '10754275702';

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, NULL, pc.id, NULL,
       'Registro histórico importado desde Excel',
       TIMESTAMP '2025-09-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pc ON pc.nombre = 'POR_COBRAR'
WHERE c.ruc = '10754275702'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Registro histórico importado desde Excel');

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, pc.id, pcap.id, NULL,
       'Pago histórico confirmado desde Excel',
       TIMESTAMP '2025-09-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pc ON pc.nombre = 'POR_COBRAR'
JOIN public.estado_cliente pcap ON pcap.nombre = 'POR_CAPACITAR'
WHERE c.ruc = '10754275702'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Pago histórico confirmado desde Excel');

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, pcap.id, hab.id, NULL,
       'Capacitación histórica confirmada desde Excel',
       TIMESTAMP '2025-09-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pcap ON pcap.nombre = 'POR_CAPACITAR'
JOIN public.estado_cliente hab ON hab.nombre = 'HABILITADO'
WHERE c.ruc = '10754275702'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Capacitación histórica confirmada desde Excel');


-- ============================================================
-- CLIENTE: 10702601041 - VELASQUEZ TRANCA ARNOLD WILLIAM
-- ============================================================

-- 1. CLIENTE
INSERT INTO public.cliente (
    ruc, usuario_sol, clave_sol_cifrada, razon_social, nombre_comercial,
    direccion, departamento, provincia, distrito, telefono, email,
    nombres, apellidos, dni, telefono_personal, email_personal,
    usuario_admin_facturador, clave_temporal, url_acceso, usuario_wsp,
    estado_id, color_tag_id, entorno_id, activo,
    fecha_registro, fecha_actualizacion
)
VALUES (
    '10702601041',
    '70260104',
    'vesticepe',
    'VELASQUEZ TRANCA ARNOLD WILLIAM',
    'MINIMARKET EL DRAGON',
    NULL,
    NULL, NULL, NULL,
    '942 138 935',
    'avelasquez1410@gmail.com',
    NULL, NULL, NULL,
    '942 138 935',
    'avelasquez1410@gmail.com',
    NULL,
    NULL,
    'minimarketeldragon.miquipu.net',
    NULL,
    (SELECT id FROM public.estado_cliente WHERE nombre = 'HABILITADO' AND activo = true LIMIT 1),
    (SELECT id FROM public.color_tag WHERE codigo = 'Amarillo' AND activo = true LIMIT 1),
    (SELECT id FROM public.entorno WHERE nombre = 'Producción' AND activo = true LIMIT 1),
    true,
    TIMESTAMP '2025-09-01 00:00:00',
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

-- 2. VENTA INICIAL
INSERT INTO public.venta (
    cliente_id, vendedor_id, suscripcion_id, tipo_venta, venta_anterior_id,
    precio_lista, monto_prorrateado, monto_total, estado_venta,
    observaciones, fecha_venta, fecha_actualizacion
)
SELECT c.id, NULL, s.id, 'ALTA', NULL,
       s.precio, 0, s.precio, 'PAGADA',
       'Importación de registro histórico desde Excel',
       TIMESTAMP '2025-09-01 00:00:00', TIMESTAMP '2025-09-01 00:00:00'
FROM public.cliente c
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Emprende'
WHERE c.ruc = '10702601041'
  AND NOT EXISTS (
      SELECT 1 FROM public.venta v
      WHERE v.cliente_id = c.id
        AND v.tipo_venta = 'ALTA'
        AND v.fecha_venta = TIMESTAMP '2025-09-01 00:00:00'
  );

-- 3. RENOVACIONES PAGADAS
WITH fechas(fecha) AS (
    VALUES
        (TIMESTAMP '2025-10-01 00:00:00'),
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
JOIN public.cliente c ON c.ruc = '10702601041'
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Emprende'
WHERE NOT EXISTS (
    SELECT 1 FROM public.venta v
    WHERE v.cliente_id = c.id
      AND v.tipo_venta = 'RENOVACION'
      AND v.fecha_venta = fechas.fecha
);

-- 4. PAGOS HISTORICOS
WITH fechas(fecha) AS (
    VALUES
        (TIMESTAMP '2025-09-01 00:00:00'),
        (TIMESTAMP '2025-10-01 00:00:00'),
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
JOIN public.cliente c ON c.ruc = '10702601041'
JOIN public.venta v ON v.cliente_id = c.id
                    AND v.fecha_venta = fechas.fecha
                    AND v.estado_venta = 'PAGADA'
WHERE NOT EXISTS (
    SELECT 1 FROM public.pago px
    WHERE px.venta_id = v.id
      AND px.fecha_pago = fechas.fecha
);

-- 5. SERVICIOS PERIODOS
WITH periodos(fecha_inicio, fecha_fin, estado) AS (
    VALUES
        (TIMESTAMP '2025-09-01 00:00:00', TIMESTAMP '2025-10-01 00:00:00', 'VENCIDO'),
        (TIMESTAMP '2025-10-01 00:00:00', TIMESTAMP '2025-11-01 00:00:00', 'VENCIDO'),
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
       TIMESTAMP '2025-09-01 00:00:00', periodos.estado,
       0, 0, 'Servicio histórico importado desde Excel',
       periodos.fecha_inicio, periodos.fecha_inicio
FROM periodos
JOIN public.cliente c ON c.ruc = '10702601041'
JOIN public.venta v ON v.cliente_id = c.id
                    AND v.fecha_venta = periodos.fecha_inicio
WHERE NOT EXISTS (
    SELECT 1 FROM public.servicio_cliente sc
    WHERE sc.venta_id = v.id
);

-- 6. SERVICIO ACTUAL
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
  AND c.ruc = '10702601041';

-- 7. COBRO SIGUIENTE
UPDATE public.venta v
SET precio_lista = s.precio,
    monto_prorrateado = 0,
    monto_total = s.precio,
    estado_venta = 'PENDIENTE_PAGO',
    observaciones = 'Renovación siguiente: cobro mensual normal desde el día 01',
    fecha_actualizacion = TIMESTAMP '2026-08-01 00:00:00'
FROM public.cliente c
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Emprende'
WHERE v.cliente_id = c.id
  AND v.tipo_venta = 'RENOVACION'
  AND v.estado_venta = 'PENDIENTE_PAGO'
  AND v.fecha_venta = TIMESTAMP '2026-09-01 00:00:00'
  AND c.ruc = '10702601041';

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
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Emprende'
JOIN public.venta v ON v.cliente_id = c.id
                   AND v.fecha_venta = TIMESTAMP '2026-08-01 00:00:00'
                   AND v.estado_venta = 'PAGADA'
WHERE c.ruc = '10702601041'
  AND NOT EXISTS (
      SELECT 1 FROM public.venta pendiente
      WHERE pendiente.cliente_id = c.id
        AND pendiente.tipo_venta = 'RENOVACION'
        AND pendiente.estado_venta = 'PENDIENTE_PAGO'
        AND pendiente.fecha_venta = TIMESTAMP '2026-09-01 00:00:00'
  );

-- 8. ESTADO ACTUAL E HISTORIAL
UPDATE public.cliente
SET estado_id = (SELECT id FROM public.estado_cliente
                 WHERE nombre = 'HABILITADO' AND activo = true LIMIT 1),
    fecha_actualizacion = TIMESTAMP '2026-08-01 00:00:00'
WHERE ruc = '10702601041';

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, NULL, pc.id, NULL,
       'Registro histórico importado desde Excel',
       TIMESTAMP '2025-09-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pc ON pc.nombre = 'POR_COBRAR'
WHERE c.ruc = '10702601041'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Registro histórico importado desde Excel');

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, pc.id, pcap.id, NULL,
       'Pago histórico confirmado desde Excel',
       TIMESTAMP '2025-09-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pc ON pc.nombre = 'POR_COBRAR'
JOIN public.estado_cliente pcap ON pcap.nombre = 'POR_CAPACITAR'
WHERE c.ruc = '10702601041'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Pago histórico confirmado desde Excel');

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, pcap.id, hab.id, NULL,
       'Capacitación histórica confirmada desde Excel',
       TIMESTAMP '2025-09-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pcap ON pcap.nombre = 'POR_CAPACITAR'
JOIN public.estado_cliente hab ON hab.nombre = 'HABILITADO'
WHERE c.ruc = '10702601041'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Capacitación histórica confirmada desde Excel');


-- ============================================================
-- CLIENTE: 10759603686 - TOLEDO MARLY
-- ============================================================

-- 1. CLIENTE
INSERT INTO public.cliente (
    ruc, usuario_sol, clave_sol_cifrada, razon_social, nombre_comercial,
    direccion, departamento, provincia, distrito, telefono, email,
    nombres, apellidos, dni, telefono_personal, email_personal,
    usuario_admin_facturador, clave_temporal, url_acceso, usuario_wsp,
    estado_id, color_tag_id, entorno_id, activo,
    fecha_registro, fecha_actualizacion
)
VALUES (
    '10759603686',
    NULL,
    NULL,
    'TOLEDO MARLY',
    'TOLEDO VILLANUEVA MARLY YASMIN',
    NULL,
    NULL, NULL, NULL,
    '904 517 094',
    'yt6684197@gmail.com',
    NULL, NULL, NULL,
    '904 517 094',
    'yt6684197@gmail.com',
    NULL,
    NULL,
    'toledomarly.miquipu.net',
    NULL,
    (SELECT id FROM public.estado_cliente WHERE nombre = 'HABILITADO' AND activo = true LIMIT 1),
    (SELECT id FROM public.color_tag WHERE codigo = 'Amarillo' AND activo = true LIMIT 1),
    (SELECT id FROM public.entorno WHERE nombre = 'Producción' AND activo = true LIMIT 1),
    true,
    TIMESTAMP '2025-09-01 00:00:00',
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

-- 2. VENTA INICIAL
INSERT INTO public.venta (
    cliente_id, vendedor_id, suscripcion_id, tipo_venta, venta_anterior_id,
    precio_lista, monto_prorrateado, monto_total, estado_venta,
    observaciones, fecha_venta, fecha_actualizacion
)
SELECT c.id, NULL, s.id, 'ALTA', NULL,
       s.precio, 0, s.precio, 'PAGADA',
       'Importación de registro histórico desde Excel',
       TIMESTAMP '2025-09-01 00:00:00', TIMESTAMP '2025-09-01 00:00:00'
FROM public.cliente c
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Inicial'
WHERE c.ruc = '10759603686'
  AND NOT EXISTS (
      SELECT 1 FROM public.venta v
      WHERE v.cliente_id = c.id
        AND v.tipo_venta = 'ALTA'
        AND v.fecha_venta = TIMESTAMP '2025-09-01 00:00:00'
  );

-- 3. RENOVACIONES PAGADAS
WITH fechas(fecha) AS (
    VALUES
        (TIMESTAMP '2025-10-01 00:00:00'),
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
JOIN public.cliente c ON c.ruc = '10759603686'
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Inicial'
WHERE NOT EXISTS (
    SELECT 1 FROM public.venta v
    WHERE v.cliente_id = c.id
      AND v.tipo_venta = 'RENOVACION'
      AND v.fecha_venta = fechas.fecha
);

-- 4. PAGOS HISTORICOS
WITH fechas(fecha) AS (
    VALUES
        (TIMESTAMP '2025-09-01 00:00:00'),
        (TIMESTAMP '2025-10-01 00:00:00'),
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
JOIN public.cliente c ON c.ruc = '10759603686'
JOIN public.venta v ON v.cliente_id = c.id
                    AND v.fecha_venta = fechas.fecha
                    AND v.estado_venta = 'PAGADA'
WHERE NOT EXISTS (
    SELECT 1 FROM public.pago px
    WHERE px.venta_id = v.id
      AND px.fecha_pago = fechas.fecha
);

-- 5. SERVICIOS PERIODOS
WITH periodos(fecha_inicio, fecha_fin, estado) AS (
    VALUES
        (TIMESTAMP '2025-09-01 00:00:00', TIMESTAMP '2025-10-01 00:00:00', 'VENCIDO'),
        (TIMESTAMP '2025-10-01 00:00:00', TIMESTAMP '2025-11-01 00:00:00', 'VENCIDO'),
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
       TIMESTAMP '2025-09-01 00:00:00', periodos.estado,
       0, 0, 'Servicio histórico importado desde Excel',
       periodos.fecha_inicio, periodos.fecha_inicio
FROM periodos
JOIN public.cliente c ON c.ruc = '10759603686'
JOIN public.venta v ON v.cliente_id = c.id
                    AND v.fecha_venta = periodos.fecha_inicio
WHERE NOT EXISTS (
    SELECT 1 FROM public.servicio_cliente sc
    WHERE sc.venta_id = v.id
);

-- 6. SERVICIO ACTUAL
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
  AND c.ruc = '10759603686';

-- 7. COBRO SIGUIENTE
UPDATE public.venta v
SET precio_lista = s.precio,
    monto_prorrateado = 0,
    monto_total = s.precio,
    estado_venta = 'PENDIENTE_PAGO',
    observaciones = 'Renovación siguiente: cobro mensual normal desde el día 01',
    fecha_actualizacion = TIMESTAMP '2026-08-01 00:00:00'
FROM public.cliente c
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Inicial'
WHERE v.cliente_id = c.id
  AND v.tipo_venta = 'RENOVACION'
  AND v.estado_venta = 'PENDIENTE_PAGO'
  AND v.fecha_venta = TIMESTAMP '2026-09-01 00:00:00'
  AND c.ruc = '10759603686';

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
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Inicial'
JOIN public.venta v ON v.cliente_id = c.id
                   AND v.fecha_venta = TIMESTAMP '2026-08-01 00:00:00'
                   AND v.estado_venta = 'PAGADA'
WHERE c.ruc = '10759603686'
  AND NOT EXISTS (
      SELECT 1 FROM public.venta pendiente
      WHERE pendiente.cliente_id = c.id
        AND pendiente.tipo_venta = 'RENOVACION'
        AND pendiente.estado_venta = 'PENDIENTE_PAGO'
        AND pendiente.fecha_venta = TIMESTAMP '2026-09-01 00:00:00'
  );

-- 8. ESTADO ACTUAL E HISTORIAL
UPDATE public.cliente
SET estado_id = (SELECT id FROM public.estado_cliente
                 WHERE nombre = 'HABILITADO' AND activo = true LIMIT 1),
    fecha_actualizacion = TIMESTAMP '2026-08-01 00:00:00'
WHERE ruc = '10759603686';

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, NULL, pc.id, NULL,
       'Registro histórico importado desde Excel',
       TIMESTAMP '2025-09-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pc ON pc.nombre = 'POR_COBRAR'
WHERE c.ruc = '10759603686'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Registro histórico importado desde Excel');

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, pc.id, pcap.id, NULL,
       'Pago histórico confirmado desde Excel',
       TIMESTAMP '2025-09-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pc ON pc.nombre = 'POR_COBRAR'
JOIN public.estado_cliente pcap ON pcap.nombre = 'POR_CAPACITAR'
WHERE c.ruc = '10759603686'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Pago histórico confirmado desde Excel');

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, pcap.id, hab.id, NULL,
       'Capacitación histórica confirmada desde Excel',
       TIMESTAMP '2025-09-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pcap ON pcap.nombre = 'POR_CAPACITAR'
JOIN public.estado_cliente hab ON hab.nombre = 'HABILITADO'
WHERE c.ruc = '10759603686'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Capacitación histórica confirmada desde Excel');


-- ============================================================
-- CLIENTE: 10462212548 - CARRASCO CARRASCO KLEIBER ADAIN
-- ============================================================

-- 1. CLIENTE
INSERT INTO public.cliente (
    ruc, usuario_sol, clave_sol_cifrada, razon_social, nombre_comercial,
    direccion, departamento, provincia, distrito, telefono, email,
    nombres, apellidos, dni, telefono_personal, email_personal,
    usuario_admin_facturador, clave_temporal, url_acceso, usuario_wsp,
    estado_id, color_tag_id, entorno_id, activo,
    fecha_registro, fecha_actualizacion
)
VALUES (
    '10462212548',
    NULL,
    NULL,
    'CARRASCO CARRASCO KLEIBER ADAIN',
    'Kleicars motors',
    NULL,
    NULL, NULL, NULL,
    '902 241 865',
    'Kleibercarrasco2290@gmail.com',
    NULL, NULL, '46221254',
    '902 241 865',
    'Kleibercarrasco2290@gmail.com',
    NULL,
    NULL,
    'https://kleicarsmotors.miquipu.net/login',
    NULL,
    (SELECT id FROM public.estado_cliente WHERE nombre = 'HABILITADO' AND activo = true LIMIT 1),
    (SELECT id FROM public.color_tag WHERE codigo = 'Verde' AND activo = true LIMIT 1),
    (SELECT id FROM public.entorno WHERE nombre = 'Producción' AND activo = true LIMIT 1),
    true,
    TIMESTAMP '2025-09-01 00:00:00',
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

-- 2. VENTA INICIAL
INSERT INTO public.venta (
    cliente_id, vendedor_id, suscripcion_id, tipo_venta, venta_anterior_id,
    precio_lista, monto_prorrateado, monto_total, estado_venta,
    observaciones, fecha_venta, fecha_actualizacion
)
SELECT c.id, NULL, s.id, 'ALTA', NULL,
       s.precio, 0, s.precio, 'PAGADA',
       'Importación de registro histórico desde Excel',
       TIMESTAMP '2025-09-01 00:00:00', TIMESTAMP '2025-09-01 00:00:00'
FROM public.cliente c
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Emprende'
WHERE c.ruc = '10462212548'
  AND NOT EXISTS (
      SELECT 1 FROM public.venta v
      WHERE v.cliente_id = c.id
        AND v.tipo_venta = 'ALTA'
        AND v.fecha_venta = TIMESTAMP '2025-09-01 00:00:00'
  );

-- 3. RENOVACIONES PAGADAS
WITH fechas(fecha) AS (
    VALUES
        (TIMESTAMP '2025-10-01 00:00:00'),
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
JOIN public.cliente c ON c.ruc = '10462212548'
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Emprende'
WHERE NOT EXISTS (
    SELECT 1 FROM public.venta v
    WHERE v.cliente_id = c.id
      AND v.tipo_venta = 'RENOVACION'
      AND v.fecha_venta = fechas.fecha
);

-- 4. PAGOS HISTORICOS
WITH fechas(fecha) AS (
    VALUES
        (TIMESTAMP '2025-09-01 00:00:00'),
        (TIMESTAMP '2025-10-01 00:00:00'),
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
JOIN public.cliente c ON c.ruc = '10462212548'
JOIN public.venta v ON v.cliente_id = c.id
                    AND v.fecha_venta = fechas.fecha
                    AND v.estado_venta = 'PAGADA'
WHERE NOT EXISTS (
    SELECT 1 FROM public.pago px
    WHERE px.venta_id = v.id
      AND px.fecha_pago = fechas.fecha
);

-- 5. SERVICIOS PERIODOS
WITH periodos(fecha_inicio, fecha_fin, estado) AS (
    VALUES
        (TIMESTAMP '2025-09-01 00:00:00', TIMESTAMP '2025-10-01 00:00:00', 'VENCIDO'),
        (TIMESTAMP '2025-10-01 00:00:00', TIMESTAMP '2025-11-01 00:00:00', 'VENCIDO'),
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
       TIMESTAMP '2025-09-01 00:00:00', periodos.estado,
       0, 0, 'Servicio histórico importado desde Excel',
       periodos.fecha_inicio, periodos.fecha_inicio
FROM periodos
JOIN public.cliente c ON c.ruc = '10462212548'
JOIN public.venta v ON v.cliente_id = c.id
                    AND v.fecha_venta = periodos.fecha_inicio
WHERE NOT EXISTS (
    SELECT 1 FROM public.servicio_cliente sc
    WHERE sc.venta_id = v.id
);

-- 6. SERVICIO ACTUAL
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
  AND c.ruc = '10462212548';

-- 7. COBRO SIGUIENTE
UPDATE public.venta v
SET precio_lista = s.precio,
    monto_prorrateado = 0,
    monto_total = s.precio,
    estado_venta = 'PENDIENTE_PAGO',
    observaciones = 'Renovación siguiente: cobro mensual normal desde el día 01',
    fecha_actualizacion = TIMESTAMP '2026-08-01 00:00:00'
FROM public.cliente c
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Emprende'
WHERE v.cliente_id = c.id
  AND v.tipo_venta = 'RENOVACION'
  AND v.estado_venta = 'PENDIENTE_PAGO'
  AND v.fecha_venta = TIMESTAMP '2026-09-01 00:00:00'
  AND c.ruc = '10462212548';

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
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Emprende'
JOIN public.venta v ON v.cliente_id = c.id
                   AND v.fecha_venta = TIMESTAMP '2026-08-01 00:00:00'
                   AND v.estado_venta = 'PAGADA'
WHERE c.ruc = '10462212548'
  AND NOT EXISTS (
      SELECT 1 FROM public.venta pendiente
      WHERE pendiente.cliente_id = c.id
        AND pendiente.tipo_venta = 'RENOVACION'
        AND pendiente.estado_venta = 'PENDIENTE_PAGO'
        AND pendiente.fecha_venta = TIMESTAMP '2026-09-01 00:00:00'
  );

-- 8. ESTADO ACTUAL E HISTORIAL
UPDATE public.cliente
SET estado_id = (SELECT id FROM public.estado_cliente
                 WHERE nombre = 'HABILITADO' AND activo = true LIMIT 1),
    fecha_actualizacion = TIMESTAMP '2026-08-01 00:00:00'
WHERE ruc = '10462212548';

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, NULL, pc.id, NULL,
       'Registro histórico importado desde Excel',
       TIMESTAMP '2025-09-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pc ON pc.nombre = 'POR_COBRAR'
WHERE c.ruc = '10462212548'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Registro histórico importado desde Excel');

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, pc.id, pcap.id, NULL,
       'Pago histórico confirmado desde Excel',
       TIMESTAMP '2025-09-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pc ON pc.nombre = 'POR_COBRAR'
JOIN public.estado_cliente pcap ON pcap.nombre = 'POR_CAPACITAR'
WHERE c.ruc = '10462212548'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Pago histórico confirmado desde Excel');

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, pcap.id, hab.id, NULL,
       'Capacitación histórica confirmada desde Excel',
       TIMESTAMP '2025-09-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pcap ON pcap.nombre = 'POR_CAPACITAR'
JOIN public.estado_cliente hab ON hab.nombre = 'HABILITADO'
WHERE c.ruc = '10462212548'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Capacitación histórica confirmada desde Excel');


-- ============================================================
-- CLIENTE: 20614632144 - DISTRIBUIDORA MUNDO PELUDO SAC
-- ============================================================

-- 1. CLIENTE
INSERT INTO public.cliente (
    ruc, usuario_sol, clave_sol_cifrada, razon_social, nombre_comercial,
    direccion, departamento, provincia, distrito, telefono, email,
    nombres, apellidos, dni, telefono_personal, email_personal,
    usuario_admin_facturador, clave_temporal, url_acceso, usuario_wsp,
    estado_id, color_tag_id, entorno_id, activo,
    fecha_registro, fecha_actualizacion
)
VALUES (
    '20614632144',
    '70339399',
    'Lupita14',
    'DISTRIBUIDORA MUNDO PELUDO SAC',
    'Mundo Peludo',
    'Av. san martin 580',
    'LIMA', 'LIMA', 'LURIN',
    '944123854',
    'distribuidoramundopeludo@gmail.com',
    NULL, NULL, '70339399',
    '944123854',
    'distribuidoramundopeludo@gmail.com',
    NULL,
    NULL,
    'https://mundopeludo.miquipu.net/dashboard',
    NULL,
    (SELECT id FROM public.estado_cliente WHERE nombre = 'HABILITADO' AND activo = true LIMIT 1),
    (SELECT id FROM public.color_tag WHERE codigo = 'Verde' AND activo = true LIMIT 1),
    (SELECT id FROM public.entorno WHERE nombre = 'Producción' AND activo = true LIMIT 1),
    true,
    TIMESTAMP '2025-09-01 00:00:00',
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

-- 2. VENTA INICIAL
INSERT INTO public.venta (
    cliente_id, vendedor_id, suscripcion_id, tipo_venta, venta_anterior_id,
    precio_lista, monto_prorrateado, monto_total, estado_venta,
    observaciones, fecha_venta, fecha_actualizacion
)
SELECT c.id, NULL, s.id, 'ALTA', NULL,
       s.precio, 0, s.precio, 'PAGADA',
       'Importación de registro histórico desde Excel',
       TIMESTAMP '2025-09-01 00:00:00', TIMESTAMP '2025-09-01 00:00:00'
FROM public.cliente c
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Emprende'
WHERE c.ruc = '20614632144'
  AND NOT EXISTS (
      SELECT 1 FROM public.venta v
      WHERE v.cliente_id = c.id
        AND v.tipo_venta = 'ALTA'
        AND v.fecha_venta = TIMESTAMP '2025-09-01 00:00:00'
  );

-- 3. RENOVACIONES PAGADAS
WITH fechas(fecha) AS (
    VALUES
        (TIMESTAMP '2025-10-01 00:00:00'),
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
JOIN public.cliente c ON c.ruc = '20614632144'
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Emprende'
WHERE NOT EXISTS (
    SELECT 1 FROM public.venta v
    WHERE v.cliente_id = c.id
      AND v.tipo_venta = 'RENOVACION'
      AND v.fecha_venta = fechas.fecha
);

-- 4. PAGOS HISTORICOS
WITH fechas(fecha) AS (
    VALUES
        (TIMESTAMP '2025-09-01 00:00:00'),
        (TIMESTAMP '2025-10-01 00:00:00'),
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
JOIN public.cliente c ON c.ruc = '20614632144'
JOIN public.venta v ON v.cliente_id = c.id
                    AND v.fecha_venta = fechas.fecha
                    AND v.estado_venta = 'PAGADA'
WHERE NOT EXISTS (
    SELECT 1 FROM public.pago px
    WHERE px.venta_id = v.id
      AND px.fecha_pago = fechas.fecha
);

-- 5. SERVICIOS PERIODOS
WITH periodos(fecha_inicio, fecha_fin, estado) AS (
    VALUES
        (TIMESTAMP '2025-09-01 00:00:00', TIMESTAMP '2025-10-01 00:00:00', 'VENCIDO'),
        (TIMESTAMP '2025-10-01 00:00:00', TIMESTAMP '2025-11-01 00:00:00', 'VENCIDO'),
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
       TIMESTAMP '2025-09-01 00:00:00', periodos.estado,
       0, 0, 'Servicio histórico importado desde Excel',
       periodos.fecha_inicio, periodos.fecha_inicio
FROM periodos
JOIN public.cliente c ON c.ruc = '20614632144'
JOIN public.venta v ON v.cliente_id = c.id
                    AND v.fecha_venta = periodos.fecha_inicio
WHERE NOT EXISTS (
    SELECT 1 FROM public.servicio_cliente sc
    WHERE sc.venta_id = v.id
);

-- 6. SERVICIO ACTUAL
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
  AND c.ruc = '20614632144';

-- 7. COBRO SIGUIENTE
UPDATE public.venta v
SET precio_lista = s.precio,
    monto_prorrateado = 0,
    monto_total = s.precio,
    estado_venta = 'PENDIENTE_PAGO',
    observaciones = 'Renovación siguiente: cobro mensual normal desde el día 01',
    fecha_actualizacion = TIMESTAMP '2026-08-01 00:00:00'
FROM public.cliente c
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Emprende'
WHERE v.cliente_id = c.id
  AND v.tipo_venta = 'RENOVACION'
  AND v.estado_venta = 'PENDIENTE_PAGO'
  AND v.fecha_venta = TIMESTAMP '2026-09-01 00:00:00'
  AND c.ruc = '20614632144';

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
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Emprende'
JOIN public.venta v ON v.cliente_id = c.id
                   AND v.fecha_venta = TIMESTAMP '2026-08-01 00:00:00'
                   AND v.estado_venta = 'PAGADA'
WHERE c.ruc = '20614632144'
  AND NOT EXISTS (
      SELECT 1 FROM public.venta pendiente
      WHERE pendiente.cliente_id = c.id
        AND pendiente.tipo_venta = 'RENOVACION'
        AND pendiente.estado_venta = 'PENDIENTE_PAGO'
        AND pendiente.fecha_venta = TIMESTAMP '2026-09-01 00:00:00'
  );

-- 8. ESTADO ACTUAL E HISTORIAL
UPDATE public.cliente
SET estado_id = (SELECT id FROM public.estado_cliente
                 WHERE nombre = 'HABILITADO' AND activo = true LIMIT 1),
    fecha_actualizacion = TIMESTAMP '2026-08-01 00:00:00'
WHERE ruc = '20614632144';

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, NULL, pc.id, NULL,
       'Registro histórico importado desde Excel',
       TIMESTAMP '2025-09-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pc ON pc.nombre = 'POR_COBRAR'
WHERE c.ruc = '20614632144'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Registro histórico importado desde Excel');

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, pc.id, pcap.id, NULL,
       'Pago histórico confirmado desde Excel',
       TIMESTAMP '2025-09-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pc ON pc.nombre = 'POR_COBRAR'
JOIN public.estado_cliente pcap ON pcap.nombre = 'POR_CAPACITAR'
WHERE c.ruc = '20614632144'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Pago histórico confirmado desde Excel');

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, pcap.id, hab.id, NULL,
       'Capacitación histórica confirmada desde Excel',
       TIMESTAMP '2025-09-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pcap ON pcap.nombre = 'POR_CAPACITAR'
JOIN public.estado_cliente hab ON hab.nombre = 'HABILITADO'
WHERE c.ruc = '20614632144'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Capacitación histórica confirmada desde Excel');


-- ============================================================
-- CLIENTE: 10448786752 - Maritza Edith Balvin Vilcapoma
-- ============================================================

-- 1. CLIENTE
INSERT INTO public.cliente (
    ruc, usuario_sol, clave_sol_cifrada, razon_social, nombre_comercial,
    direccion, departamento, provincia, distrito, telefono, email,
    nombres, apellidos, dni, telefono_personal, email_personal,
    usuario_admin_facturador, clave_temporal, url_acceso, usuario_wsp,
    estado_id, color_tag_id, entorno_id, activo,
    fecha_registro, fecha_actualizacion
)
VALUES (
    '10448786752',
    'ENTORTIC',
    'Wareentic',
    'Maritza Edith Balvin Vilcapoma',
    'Kumi kumi',
    'Calle San Francisco 109',
    'LIMA', 'LIMA', 'EL AGUSTINO',
    '971766500',
    'balvinvilcapoma@gmail.com',
    NULL, NULL, '44878675',
    '971766500',
    'balvinvilcapoma@gmail.com',
    NULL,
    NULL,
    'https://kumikumi.miquipu.net/login',
    NULL,
    (SELECT id FROM public.estado_cliente WHERE nombre = 'HABILITADO' AND activo = true LIMIT 1),
    (SELECT id FROM public.color_tag WHERE codigo = 'Amarillo' AND activo = true LIMIT 1),
    (SELECT id FROM public.entorno WHERE nombre = 'Producción' AND activo = true LIMIT 1),
    true,
    TIMESTAMP '2025-10-01 00:00:00',
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

-- 2. VENTA INICIAL
INSERT INTO public.venta (
    cliente_id, vendedor_id, suscripcion_id, tipo_venta, venta_anterior_id,
    precio_lista, monto_prorrateado, monto_total, estado_venta,
    observaciones, fecha_venta, fecha_actualizacion
)
SELECT c.id, NULL, s.id, 'ALTA', NULL,
       s.precio, 0, s.precio, 'PAGADA',
       'Importación de registro histórico desde Excel',
       TIMESTAMP '2025-10-01 00:00:00', TIMESTAMP '2025-10-01 00:00:00'
FROM public.cliente c
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Emprende'
WHERE c.ruc = '10448786752'
  AND NOT EXISTS (
      SELECT 1 FROM public.venta v
      WHERE v.cliente_id = c.id
        AND v.tipo_venta = 'ALTA'
        AND v.fecha_venta = TIMESTAMP '2025-10-01 00:00:00'
  );

-- 3. RENOVACIONES PAGADAS
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
JOIN public.cliente c ON c.ruc = '10448786752'
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Emprende'
WHERE NOT EXISTS (
    SELECT 1 FROM public.venta v
    WHERE v.cliente_id = c.id
      AND v.tipo_venta = 'RENOVACION'
      AND v.fecha_venta = fechas.fecha
);

-- 4. PAGOS HISTORICOS
WITH fechas(fecha) AS (
    VALUES
        (TIMESTAMP '2025-10-01 00:00:00'),
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
JOIN public.cliente c ON c.ruc = '10448786752'
JOIN public.venta v ON v.cliente_id = c.id
                    AND v.fecha_venta = fechas.fecha
                    AND v.estado_venta = 'PAGADA'
WHERE NOT EXISTS (
    SELECT 1 FROM public.pago px
    WHERE px.venta_id = v.id
      AND px.fecha_pago = fechas.fecha
);

-- 5. SERVICIOS PERIODOS
WITH periodos(fecha_inicio, fecha_fin, estado) AS (
    VALUES
        (TIMESTAMP '2025-10-01 00:00:00', TIMESTAMP '2025-11-01 00:00:00', 'VENCIDO'),
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
       TIMESTAMP '2025-10-01 00:00:00', periodos.estado,
       0, 0, 'Servicio histórico importado desde Excel',
       periodos.fecha_inicio, periodos.fecha_inicio
FROM periodos
JOIN public.cliente c ON c.ruc = '10448786752'
JOIN public.venta v ON v.cliente_id = c.id
                    AND v.fecha_venta = periodos.fecha_inicio
WHERE NOT EXISTS (
    SELECT 1 FROM public.servicio_cliente sc
    WHERE sc.venta_id = v.id
);

-- 6. SERVICIO ACTUAL
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
  AND c.ruc = '10448786752';

-- 7. COBRO SIGUIENTE
UPDATE public.venta v
SET precio_lista = s.precio,
    monto_prorrateado = 0,
    monto_total = s.precio,
    estado_venta = 'PENDIENTE_PAGO',
    observaciones = 'Renovación siguiente: cobro mensual normal desde el día 01',
    fecha_actualizacion = TIMESTAMP '2026-08-01 00:00:00'
FROM public.cliente c
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Emprende'
WHERE v.cliente_id = c.id
  AND v.tipo_venta = 'RENOVACION'
  AND v.estado_venta = 'PENDIENTE_PAGO'
  AND v.fecha_venta = TIMESTAMP '2026-09-01 00:00:00'
  AND c.ruc = '10448786752';

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
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Emprende'
JOIN public.venta v ON v.cliente_id = c.id
                   AND v.fecha_venta = TIMESTAMP '2026-08-01 00:00:00'
                   AND v.estado_venta = 'PAGADA'
WHERE c.ruc = '10448786752'
  AND NOT EXISTS (
      SELECT 1 FROM public.venta pendiente
      WHERE pendiente.cliente_id = c.id
        AND pendiente.tipo_venta = 'RENOVACION'
        AND pendiente.estado_venta = 'PENDIENTE_PAGO'
        AND pendiente.fecha_venta = TIMESTAMP '2026-09-01 00:00:00'
  );

-- 8. ESTADO ACTUAL E HISTORIAL
UPDATE public.cliente
SET estado_id = (SELECT id FROM public.estado_cliente
                 WHERE nombre = 'HABILITADO' AND activo = true LIMIT 1),
    fecha_actualizacion = TIMESTAMP '2026-08-01 00:00:00'
WHERE ruc = '10448786752';

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, NULL, pc.id, NULL,
       'Registro histórico importado desde Excel',
       TIMESTAMP '2025-10-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pc ON pc.nombre = 'POR_COBRAR'
WHERE c.ruc = '10448786752'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Registro histórico importado desde Excel');

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, pc.id, pcap.id, NULL,
       'Pago histórico confirmado desde Excel',
       TIMESTAMP '2025-10-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pc ON pc.nombre = 'POR_COBRAR'
JOIN public.estado_cliente pcap ON pcap.nombre = 'POR_CAPACITAR'
WHERE c.ruc = '10448786752'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Pago histórico confirmado desde Excel');

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, pcap.id, hab.id, NULL,
       'Capacitación histórica confirmada desde Excel',
       TIMESTAMP '2025-10-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pcap ON pcap.nombre = 'POR_CAPACITAR'
JOIN public.estado_cliente hab ON hab.nombre = 'HABILITADO'
WHERE c.ruc = '10448786752'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Capacitación histórica confirmada desde Excel');


-- ============================================================
-- CLIENTE: 10464029198 - Lener hermiliano vasquez Aquino
-- ============================================================

-- 1. CLIENTE
INSERT INTO public.cliente (
    ruc, usuario_sol, clave_sol_cifrada, razon_social, nombre_comercial,
    direccion, departamento, provincia, distrito, telefono, email,
    nombres, apellidos, dni, telefono_personal, email_personal,
    usuario_admin_facturador, clave_temporal, url_acceso, usuario_wsp,
    estado_id, color_tag_id, entorno_id, activo,
    fecha_registro, fecha_actualizacion
)
VALUES (
    '10464029198',
    '46402919',
    'Vasquez01',
    'Lener hermiliano vasquez Aquino',
    'Novedades L&V Import',
    NULL,
    NULL, NULL, NULL,
    '957190442',
    'vasquezlener20@gmail.com',
    NULL, NULL, '46402919',
    '957190442',
    'vasquezlener20@gmail.com',
    NULL,
    NULL,
    'https://novedadeslvimport.miquipu.net/login',
    NULL,
    (SELECT id FROM public.estado_cliente WHERE nombre = 'HABILITADO' AND activo = true LIMIT 1),
    (SELECT id FROM public.color_tag WHERE codigo = 'Amarillo' AND activo = true LIMIT 1),
    (SELECT id FROM public.entorno WHERE nombre = 'Producción' AND activo = true LIMIT 1),
    true,
    TIMESTAMP '2025-10-01 00:00:00',
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

-- 2. VENTA INICIAL
INSERT INTO public.venta (
    cliente_id, vendedor_id, suscripcion_id, tipo_venta, venta_anterior_id,
    precio_lista, monto_prorrateado, monto_total, estado_venta,
    observaciones, fecha_venta, fecha_actualizacion
)
SELECT c.id, NULL, s.id, 'ALTA', NULL,
       s.precio, 0, s.precio, 'PAGADA',
       'Importación de registro histórico desde Excel',
       TIMESTAMP '2025-10-01 00:00:00', TIMESTAMP '2025-10-01 00:00:00'
FROM public.cliente c
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Inicial'
WHERE c.ruc = '10464029198'
  AND NOT EXISTS (
      SELECT 1 FROM public.venta v
      WHERE v.cliente_id = c.id
        AND v.tipo_venta = 'ALTA'
        AND v.fecha_venta = TIMESTAMP '2025-10-01 00:00:00'
  );

-- 3. RENOVACIONES PAGADAS
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
JOIN public.cliente c ON c.ruc = '10464029198'
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Inicial'
WHERE NOT EXISTS (
    SELECT 1 FROM public.venta v
    WHERE v.cliente_id = c.id
      AND v.tipo_venta = 'RENOVACION'
      AND v.fecha_venta = fechas.fecha
);

-- 4. PAGOS HISTORICOS
WITH fechas(fecha) AS (
    VALUES
        (TIMESTAMP '2025-10-01 00:00:00'),
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
JOIN public.cliente c ON c.ruc = '10464029198'
JOIN public.venta v ON v.cliente_id = c.id
                    AND v.fecha_venta = fechas.fecha
                    AND v.estado_venta = 'PAGADA'
WHERE NOT EXISTS (
    SELECT 1 FROM public.pago px
    WHERE px.venta_id = v.id
      AND px.fecha_pago = fechas.fecha
);

-- 5. SERVICIOS PERIODOS
WITH periodos(fecha_inicio, fecha_fin, estado) AS (
    VALUES
        (TIMESTAMP '2025-10-01 00:00:00', TIMESTAMP '2025-11-01 00:00:00', 'VENCIDO'),
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
       TIMESTAMP '2025-10-01 00:00:00', periodos.estado,
       0, 0, 'Servicio histórico importado desde Excel',
       periodos.fecha_inicio, periodos.fecha_inicio
FROM periodos
JOIN public.cliente c ON c.ruc = '10464029198'
JOIN public.venta v ON v.cliente_id = c.id
                    AND v.fecha_venta = periodos.fecha_inicio
WHERE NOT EXISTS (
    SELECT 1 FROM public.servicio_cliente sc
    WHERE sc.venta_id = v.id
);

-- 6. SERVICIO ACTUAL
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
  AND c.ruc = '10464029198';

-- 7. COBRO SIGUIENTE
UPDATE public.venta v
SET precio_lista = s.precio,
    monto_prorrateado = 0,
    monto_total = s.precio,
    estado_venta = 'PENDIENTE_PAGO',
    observaciones = 'Renovación siguiente: cobro mensual normal desde el día 01',
    fecha_actualizacion = TIMESTAMP '2026-08-01 00:00:00'
FROM public.cliente c
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Inicial'
WHERE v.cliente_id = c.id
  AND v.tipo_venta = 'RENOVACION'
  AND v.estado_venta = 'PENDIENTE_PAGO'
  AND v.fecha_venta = TIMESTAMP '2026-09-01 00:00:00'
  AND c.ruc = '10464029198';

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
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Inicial'
JOIN public.venta v ON v.cliente_id = c.id
                   AND v.fecha_venta = TIMESTAMP '2026-08-01 00:00:00'
                   AND v.estado_venta = 'PAGADA'
WHERE c.ruc = '10464029198'
  AND NOT EXISTS (
      SELECT 1 FROM public.venta pendiente
      WHERE pendiente.cliente_id = c.id
        AND pendiente.tipo_venta = 'RENOVACION'
        AND pendiente.estado_venta = 'PENDIENTE_PAGO'
        AND pendiente.fecha_venta = TIMESTAMP '2026-09-01 00:00:00'
  );

-- 8. ESTADO ACTUAL E HISTORIAL
UPDATE public.cliente
SET estado_id = (SELECT id FROM public.estado_cliente
                 WHERE nombre = 'HABILITADO' AND activo = true LIMIT 1),
    fecha_actualizacion = TIMESTAMP '2026-08-01 00:00:00'
WHERE ruc = '10464029198';

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, NULL, pc.id, NULL,
       'Registro histórico importado desde Excel',
       TIMESTAMP '2025-10-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pc ON pc.nombre = 'POR_COBRAR'
WHERE c.ruc = '10464029198'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Registro histórico importado desde Excel');

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, pc.id, pcap.id, NULL,
       'Pago histórico confirmado desde Excel',
       TIMESTAMP '2025-10-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pc ON pc.nombre = 'POR_COBRAR'
JOIN public.estado_cliente pcap ON pcap.nombre = 'POR_CAPACITAR'
WHERE c.ruc = '10464029198'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Pago histórico confirmado desde Excel');

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, pcap.id, hab.id, NULL,
       'Capacitación histórica confirmada desde Excel',
       TIMESTAMP '2025-10-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pcap ON pcap.nombre = 'POR_CAPACITAR'
JOIN public.estado_cliente hab ON hab.nombre = 'HABILITADO'
WHERE c.ruc = '10464029198'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Capacitación histórica confirmada desde Excel');


-- ============================================================
-- CLIENTE: 10158421637 - PERCY ANTONIO HIDALGO SANTIAGO
-- ============================================================

-- 1. CLIENTE
INSERT INTO public.cliente (
    ruc, usuario_sol, clave_sol_cifrada, razon_social, nombre_comercial,
    direccion, departamento, provincia, distrito, telefono, email,
    nombres, apellidos, dni, telefono_personal, email_personal,
    usuario_admin_facturador, clave_temporal, url_acceso, usuario_wsp,
    estado_id, color_tag_id, entorno_id, activo,
    fecha_registro, fecha_actualizacion
)
VALUES (
    '10158421637',
    '15842163',
    'Martina1972Hs22',
    'PERCY ANTONIO HIDALGO SANTIAGO',
    'WUJIBYFAN',
    'OLIVAR MZ "U" LT 5 - PARAMONGA',
    'LIMA', 'BARRANCA', 'PARAMONGA',
    '986324631',
    ':JEKARY22@GMAIL.COM',
    NULL, NULL, '15842163',
    '986324631',
    ':JEKARY22@GMAIL.COM',
    NULL,
    NULL,
    'https://wujibyfan.miquipu.net/login',
    NULL,
    (SELECT id FROM public.estado_cliente WHERE nombre = 'HABILITADO' AND activo = true LIMIT 1),
    (SELECT id FROM public.color_tag WHERE codigo = 'Rojo' AND activo = true LIMIT 1),
    (SELECT id FROM public.entorno WHERE nombre = 'Producción' AND activo = true LIMIT 1),
    true,
    TIMESTAMP '2025-10-01 00:00:00',
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

-- 2. VENTA INICIAL
INSERT INTO public.venta (
    cliente_id, vendedor_id, suscripcion_id, tipo_venta, venta_anterior_id,
    precio_lista, monto_prorrateado, monto_total, estado_venta,
    observaciones, fecha_venta, fecha_actualizacion
)
SELECT c.id, NULL, s.id, 'ALTA', NULL,
       s.precio, 0, s.precio, 'PAGADA',
       'Importación de registro histórico desde Excel',
       TIMESTAMP '2025-10-01 00:00:00', TIMESTAMP '2025-10-01 00:00:00'
FROM public.cliente c
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Emprende'
WHERE c.ruc = '10158421637'
  AND NOT EXISTS (
      SELECT 1 FROM public.venta v
      WHERE v.cliente_id = c.id
        AND v.tipo_venta = 'ALTA'
        AND v.fecha_venta = TIMESTAMP '2025-10-01 00:00:00'
  );

-- 3. RENOVACIONES PAGADAS
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
JOIN public.cliente c ON c.ruc = '10158421637'
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Emprende'
WHERE NOT EXISTS (
    SELECT 1 FROM public.venta v
    WHERE v.cliente_id = c.id
      AND v.tipo_venta = 'RENOVACION'
      AND v.fecha_venta = fechas.fecha
);

-- 4. PAGOS HISTORICOS
WITH fechas(fecha) AS (
    VALUES
        (TIMESTAMP '2025-10-01 00:00:00'),
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
JOIN public.cliente c ON c.ruc = '10158421637'
JOIN public.venta v ON v.cliente_id = c.id
                    AND v.fecha_venta = fechas.fecha
                    AND v.estado_venta = 'PAGADA'
WHERE NOT EXISTS (
    SELECT 1 FROM public.pago px
    WHERE px.venta_id = v.id
      AND px.fecha_pago = fechas.fecha
);

-- 5. SERVICIOS PERIODOS
WITH periodos(fecha_inicio, fecha_fin, estado) AS (
    VALUES
        (TIMESTAMP '2025-10-01 00:00:00', TIMESTAMP '2025-11-01 00:00:00', 'VENCIDO'),
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
       TIMESTAMP '2025-10-01 00:00:00', periodos.estado,
       0, 0, 'Servicio histórico importado desde Excel',
       periodos.fecha_inicio, periodos.fecha_inicio
FROM periodos
JOIN public.cliente c ON c.ruc = '10158421637'
JOIN public.venta v ON v.cliente_id = c.id
                    AND v.fecha_venta = periodos.fecha_inicio
WHERE NOT EXISTS (
    SELECT 1 FROM public.servicio_cliente sc
    WHERE sc.venta_id = v.id
);

-- 6. SERVICIO ACTUAL
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
  AND c.ruc = '10158421637';

-- 7. COBRO SIGUIENTE
UPDATE public.venta v
SET precio_lista = s.precio,
    monto_prorrateado = 0,
    monto_total = s.precio,
    estado_venta = 'PENDIENTE_PAGO',
    observaciones = 'Renovación siguiente: cobro mensual normal desde el día 01',
    fecha_actualizacion = TIMESTAMP '2026-08-01 00:00:00'
FROM public.cliente c
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Emprende'
WHERE v.cliente_id = c.id
  AND v.tipo_venta = 'RENOVACION'
  AND v.estado_venta = 'PENDIENTE_PAGO'
  AND v.fecha_venta = TIMESTAMP '2026-09-01 00:00:00'
  AND c.ruc = '10158421637';

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
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Emprende'
JOIN public.venta v ON v.cliente_id = c.id
                   AND v.fecha_venta = TIMESTAMP '2026-08-01 00:00:00'
                   AND v.estado_venta = 'PAGADA'
WHERE c.ruc = '10158421637'
  AND NOT EXISTS (
      SELECT 1 FROM public.venta pendiente
      WHERE pendiente.cliente_id = c.id
        AND pendiente.tipo_venta = 'RENOVACION'
        AND pendiente.estado_venta = 'PENDIENTE_PAGO'
        AND pendiente.fecha_venta = TIMESTAMP '2026-09-01 00:00:00'
  );

-- 8. ESTADO ACTUAL E HISTORIAL
UPDATE public.cliente
SET estado_id = (SELECT id FROM public.estado_cliente
                 WHERE nombre = 'HABILITADO' AND activo = true LIMIT 1),
    fecha_actualizacion = TIMESTAMP '2026-08-01 00:00:00'
WHERE ruc = '10158421637';

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, NULL, pc.id, NULL,
       'Registro histórico importado desde Excel',
       TIMESTAMP '2025-10-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pc ON pc.nombre = 'POR_COBRAR'
WHERE c.ruc = '10158421637'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Registro histórico importado desde Excel');

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, pc.id, pcap.id, NULL,
       'Pago histórico confirmado desde Excel',
       TIMESTAMP '2025-10-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pc ON pc.nombre = 'POR_COBRAR'
JOIN public.estado_cliente pcap ON pcap.nombre = 'POR_CAPACITAR'
WHERE c.ruc = '10158421637'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Pago histórico confirmado desde Excel');

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, pcap.id, hab.id, NULL,
       'Capacitación histórica confirmada desde Excel',
       TIMESTAMP '2025-10-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pcap ON pcap.nombre = 'POR_CAPACITAR'
JOIN public.estado_cliente hab ON hab.nombre = 'HABILITADO'
WHERE c.ruc = '10158421637'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Capacitación histórica confirmada desde Excel');


-- ============================================================
-- CLIENTE: 20614350751 - SPC MEDIC
-- ============================================================

-- 1. CLIENTE
INSERT INTO public.cliente (
    ruc, usuario_sol, clave_sol_cifrada, razon_social, nombre_comercial,
    direccion, departamento, provincia, distrito, telefono, email,
    nombres, apellidos, dni, telefono_personal, email_personal,
    usuario_admin_facturador, clave_temporal, url_acceso, usuario_wsp,
    estado_id, color_tag_id, entorno_id, activo,
    fecha_registro, fecha_actualizacion
)
VALUES (
    '20614350751',
    'BEGRANIC',
    'nspillath',
    'SPC MEDIC',
    'CENTRO MÉDICO ESPECIALIZADO CHILCA SALUD',
    'Calle San Francisco 109',
    'LIMA', 'CAÑETE', 'CHILCA',
    '915252842',
    'apuertasf@gmail.com',
    NULL, NULL, '45275793',
    '915252842',
    'apuertasf@gmail.com',
    NULL,
    NULL,
    'https://chilcasalud.miquipu.net/login',
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

-- 2. VENTA INICIAL
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
WHERE c.ruc = '20614350751'
  AND NOT EXISTS (
      SELECT 1 FROM public.venta v
      WHERE v.cliente_id = c.id
        AND v.tipo_venta = 'ALTA'
        AND v.fecha_venta = TIMESTAMP '2025-11-01 00:00:00'
  );

-- 3. RENOVACIONES PAGADAS
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
JOIN public.cliente c ON c.ruc = '20614350751'
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Empresarial'
WHERE NOT EXISTS (
    SELECT 1 FROM public.venta v
    WHERE v.cliente_id = c.id
      AND v.tipo_venta = 'RENOVACION'
      AND v.fecha_venta = fechas.fecha
);

-- 4. PAGOS HISTORICOS
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
JOIN public.cliente c ON c.ruc = '20614350751'
JOIN public.venta v ON v.cliente_id = c.id
                    AND v.fecha_venta = fechas.fecha
                    AND v.estado_venta = 'PAGADA'
WHERE NOT EXISTS (
    SELECT 1 FROM public.pago px
    WHERE px.venta_id = v.id
      AND px.fecha_pago = fechas.fecha
);

-- 5. SERVICIOS PERIODOS
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
JOIN public.cliente c ON c.ruc = '20614350751'
JOIN public.venta v ON v.cliente_id = c.id
                    AND v.fecha_venta = periodos.fecha_inicio
WHERE NOT EXISTS (
    SELECT 1 FROM public.servicio_cliente sc
    WHERE sc.venta_id = v.id
);

-- 6. SERVICIO ACTUAL
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
  AND c.ruc = '20614350751';

-- 7. COBRO SIGUIENTE
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
  AND c.ruc = '20614350751';

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
WHERE c.ruc = '20614350751'
  AND NOT EXISTS (
      SELECT 1 FROM public.venta pendiente
      WHERE pendiente.cliente_id = c.id
        AND pendiente.tipo_venta = 'RENOVACION'
        AND pendiente.estado_venta = 'PENDIENTE_PAGO'
        AND pendiente.fecha_venta = TIMESTAMP '2026-09-01 00:00:00'
  );

-- 8. ESTADO ACTUAL E HISTORIAL
UPDATE public.cliente
SET estado_id = (SELECT id FROM public.estado_cliente
                 WHERE nombre = 'HABILITADO' AND activo = true LIMIT 1),
    fecha_actualizacion = TIMESTAMP '2026-08-01 00:00:00'
WHERE ruc = '20614350751';

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, NULL, pc.id, NULL,
       'Registro histórico importado desde Excel',
       TIMESTAMP '2025-11-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pc ON pc.nombre = 'POR_COBRAR'
WHERE c.ruc = '20614350751'
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
WHERE c.ruc = '20614350751'
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
WHERE c.ruc = '20614350751'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Capacitación histórica confirmada desde Excel');


-- ============================================================
-- CLIENTE: 10094889010 - SANCHEZ CHACCHI VICTOR ENRIQUE
-- ============================================================

-- 1. CLIENTE
INSERT INTO public.cliente (
    ruc, usuario_sol, clave_sol_cifrada, razon_social, nombre_comercial,
    direccion, departamento, provincia, distrito, telefono, email,
    nombres, apellidos, dni, telefono_personal, email_personal,
    usuario_admin_facturador, clave_temporal, url_acceso, usuario_wsp,
    estado_id, color_tag_id, entorno_id, activo,
    fecha_registro, fecha_actualizacion
)
VALUES (
    '10094889010',
    '9488901',
    'Victor253023',
    'SANCHEZ CHACCHI VICTOR ENRIQUE',
    'LA CASA DE CASTI',
    ': Marcavilca Jr. Sebastian de Luna #105 Chorrillos',
    NULL, NULL, NULL,
    '948 841 093 / 912178855',
    'lacasadecasti@gmail.com',
    NULL, NULL, '9488901',
    '948 841 093 / 912178855',
    'lacasadecasti@gmail.com',
    'lacasadecasti@gmail.com',
    '10094889010',
    'https://lacasadecasti.cpe.webzary.pe/login',
    NULL,
    (SELECT id FROM public.estado_cliente WHERE nombre = 'HABILITADO' AND activo = true LIMIT 1),
    (SELECT id FROM public.color_tag WHERE codigo = 'Amarillo' AND activo = true LIMIT 1),
    (SELECT id FROM public.entorno WHERE nombre = 'Producción' AND activo = true LIMIT 1),
    true,
    TIMESTAMP '2025-10-01 00:00:00',
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

-- 2. VENTA INICIAL
INSERT INTO public.venta (
    cliente_id, vendedor_id, suscripcion_id, tipo_venta, venta_anterior_id,
    precio_lista, monto_prorrateado, monto_total, estado_venta,
    observaciones, fecha_venta, fecha_actualizacion
)
SELECT c.id, NULL, s.id, 'ALTA', NULL,
       s.precio, 0, s.precio, 'PAGADA',
       'Importación de registro histórico desde Excel',
       TIMESTAMP '2025-10-01 00:00:00', TIMESTAMP '2025-10-01 00:00:00'
FROM public.cliente c
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Inicial'
WHERE c.ruc = '10094889010'
  AND NOT EXISTS (
      SELECT 1 FROM public.venta v
      WHERE v.cliente_id = c.id
        AND v.tipo_venta = 'ALTA'
        AND v.fecha_venta = TIMESTAMP '2025-10-01 00:00:00'
  );

-- 3. RENOVACIONES PAGADAS
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
JOIN public.cliente c ON c.ruc = '10094889010'
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Inicial'
WHERE NOT EXISTS (
    SELECT 1 FROM public.venta v
    WHERE v.cliente_id = c.id
      AND v.tipo_venta = 'RENOVACION'
      AND v.fecha_venta = fechas.fecha
);

-- 4. PAGOS HISTORICOS
WITH fechas(fecha) AS (
    VALUES
        (TIMESTAMP '2025-10-01 00:00:00'),
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
JOIN public.cliente c ON c.ruc = '10094889010'
JOIN public.venta v ON v.cliente_id = c.id
                    AND v.fecha_venta = fechas.fecha
                    AND v.estado_venta = 'PAGADA'
WHERE NOT EXISTS (
    SELECT 1 FROM public.pago px
    WHERE px.venta_id = v.id
      AND px.fecha_pago = fechas.fecha
);

-- 5. SERVICIOS PERIODOS
WITH periodos(fecha_inicio, fecha_fin, estado) AS (
    VALUES
        (TIMESTAMP '2025-10-01 00:00:00', TIMESTAMP '2025-11-01 00:00:00', 'VENCIDO'),
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
       TIMESTAMP '2025-10-01 00:00:00', periodos.estado,
       0, 0, 'Servicio histórico importado desde Excel',
       periodos.fecha_inicio, periodos.fecha_inicio
FROM periodos
JOIN public.cliente c ON c.ruc = '10094889010'
JOIN public.venta v ON v.cliente_id = c.id
                    AND v.fecha_venta = periodos.fecha_inicio
WHERE NOT EXISTS (
    SELECT 1 FROM public.servicio_cliente sc
    WHERE sc.venta_id = v.id
);

-- 6. SERVICIO ACTUAL
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
  AND c.ruc = '10094889010';

-- 7. COBRO SIGUIENTE
UPDATE public.venta v
SET precio_lista = s.precio,
    monto_prorrateado = 0,
    monto_total = s.precio,
    estado_venta = 'PENDIENTE_PAGO',
    observaciones = 'Renovación siguiente: cobro mensual normal desde el día 01',
    fecha_actualizacion = TIMESTAMP '2026-08-01 00:00:00'
FROM public.cliente c
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Inicial'
WHERE v.cliente_id = c.id
  AND v.tipo_venta = 'RENOVACION'
  AND v.estado_venta = 'PENDIENTE_PAGO'
  AND v.fecha_venta = TIMESTAMP '2026-09-01 00:00:00'
  AND c.ruc = '10094889010';

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
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Inicial'
JOIN public.venta v ON v.cliente_id = c.id
                   AND v.fecha_venta = TIMESTAMP '2026-08-01 00:00:00'
                   AND v.estado_venta = 'PAGADA'
WHERE c.ruc = '10094889010'
  AND NOT EXISTS (
      SELECT 1 FROM public.venta pendiente
      WHERE pendiente.cliente_id = c.id
        AND pendiente.tipo_venta = 'RENOVACION'
        AND pendiente.estado_venta = 'PENDIENTE_PAGO'
        AND pendiente.fecha_venta = TIMESTAMP '2026-09-01 00:00:00'
  );

-- 8. ESTADO ACTUAL E HISTORIAL
UPDATE public.cliente
SET estado_id = (SELECT id FROM public.estado_cliente
                 WHERE nombre = 'HABILITADO' AND activo = true LIMIT 1),
    fecha_actualizacion = TIMESTAMP '2026-08-01 00:00:00'
WHERE ruc = '10094889010';

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, NULL, pc.id, NULL,
       'Registro histórico importado desde Excel',
       TIMESTAMP '2025-10-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pc ON pc.nombre = 'POR_COBRAR'
WHERE c.ruc = '10094889010'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Registro histórico importado desde Excel');

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, pc.id, pcap.id, NULL,
       'Pago histórico confirmado desde Excel',
       TIMESTAMP '2025-10-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pc ON pc.nombre = 'POR_COBRAR'
JOIN public.estado_cliente pcap ON pcap.nombre = 'POR_CAPACITAR'
WHERE c.ruc = '10094889010'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Pago histórico confirmado desde Excel');

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, pcap.id, hab.id, NULL,
       'Capacitación histórica confirmada desde Excel',
       TIMESTAMP '2025-10-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pcap ON pcap.nombre = 'POR_CAPACITAR'
JOIN public.estado_cliente hab ON hab.nombre = 'HABILITADO'
WHERE c.ruc = '10094889010'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Capacitación histórica confirmada desde Excel');


-- ============================================================
-- CLIENTE: 15614811363 - RIVAS ALCALA CARLOS JOSE
-- ============================================================

-- 1. CLIENTE
INSERT INTO public.cliente (
    ruc, usuario_sol, clave_sol_cifrada, razon_social, nombre_comercial,
    direccion, departamento, provincia, distrito, telefono, email,
    nombres, apellidos, dni, telefono_personal, email_personal,
    usuario_admin_facturador, clave_temporal, url_acceso, usuario_wsp,
    estado_id, color_tag_id, entorno_id, activo,
    fecha_registro, fecha_actualizacion
)
VALUES (
    '15614811363',
    'APTRINTU',
    '26220578aA',
    'RIVAS ALCALA CARLOS JOSE',
    'Taller C&R',
    'Jr Piura 461 - HUANCAYO',
    NULL, NULL, NULL,
    '927982170',
    'Carlosalcalarivas2622@gmail.com',
    NULL, NULL, '7996311',
    '927982170',
    'Carlosalcalarivas2622@gmail.com',
    'carlosalcalarivas2622@gmail.com',
    '15614811363',
    'https://tallercr.cpe.webzary.pe/login',
    NULL,
    (SELECT id FROM public.estado_cliente WHERE nombre = 'HABILITADO' AND activo = true LIMIT 1),
    (SELECT id FROM public.color_tag WHERE codigo = 'Amarillo' AND activo = true LIMIT 1),
    (SELECT id FROM public.entorno WHERE nombre = 'Producción' AND activo = true LIMIT 1),
    true,
    TIMESTAMP '2025-10-01 00:00:00',
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

-- 2. VENTA INICIAL
INSERT INTO public.venta (
    cliente_id, vendedor_id, suscripcion_id, tipo_venta, venta_anterior_id,
    precio_lista, monto_prorrateado, monto_total, estado_venta,
    observaciones, fecha_venta, fecha_actualizacion
)
SELECT c.id, NULL, s.id, 'ALTA', NULL,
       s.precio, 0, s.precio, 'PAGADA',
       'Importación de registro histórico desde Excel',
       TIMESTAMP '2025-10-01 00:00:00', TIMESTAMP '2025-10-01 00:00:00'
FROM public.cliente c
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Empresarial'
WHERE c.ruc = '15614811363'
  AND NOT EXISTS (
      SELECT 1 FROM public.venta v
      WHERE v.cliente_id = c.id
        AND v.tipo_venta = 'ALTA'
        AND v.fecha_venta = TIMESTAMP '2025-10-01 00:00:00'
  );

-- 3. RENOVACIONES PAGADAS
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
JOIN public.cliente c ON c.ruc = '15614811363'
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Empresarial'
WHERE NOT EXISTS (
    SELECT 1 FROM public.venta v
    WHERE v.cliente_id = c.id
      AND v.tipo_venta = 'RENOVACION'
      AND v.fecha_venta = fechas.fecha
);

-- 4. PAGOS HISTORICOS
WITH fechas(fecha) AS (
    VALUES
        (TIMESTAMP '2025-10-01 00:00:00'),
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
JOIN public.cliente c ON c.ruc = '15614811363'
JOIN public.venta v ON v.cliente_id = c.id
                    AND v.fecha_venta = fechas.fecha
                    AND v.estado_venta = 'PAGADA'
WHERE NOT EXISTS (
    SELECT 1 FROM public.pago px
    WHERE px.venta_id = v.id
      AND px.fecha_pago = fechas.fecha
);

-- 5. SERVICIOS PERIODOS
WITH periodos(fecha_inicio, fecha_fin, estado) AS (
    VALUES
        (TIMESTAMP '2025-10-01 00:00:00', TIMESTAMP '2025-11-01 00:00:00', 'VENCIDO'),
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
       TIMESTAMP '2025-10-01 00:00:00', periodos.estado,
       0, 0, 'Servicio histórico importado desde Excel',
       periodos.fecha_inicio, periodos.fecha_inicio
FROM periodos
JOIN public.cliente c ON c.ruc = '15614811363'
JOIN public.venta v ON v.cliente_id = c.id
                    AND v.fecha_venta = periodos.fecha_inicio
WHERE NOT EXISTS (
    SELECT 1 FROM public.servicio_cliente sc
    WHERE sc.venta_id = v.id
);

-- 6. SERVICIO ACTUAL
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
  AND c.ruc = '15614811363';

-- 7. COBRO SIGUIENTE
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
  AND c.ruc = '15614811363';

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
WHERE c.ruc = '15614811363'
  AND NOT EXISTS (
      SELECT 1 FROM public.venta pendiente
      WHERE pendiente.cliente_id = c.id
        AND pendiente.tipo_venta = 'RENOVACION'
        AND pendiente.estado_venta = 'PENDIENTE_PAGO'
        AND pendiente.fecha_venta = TIMESTAMP '2026-09-01 00:00:00'
  );

-- 8. ESTADO ACTUAL E HISTORIAL
UPDATE public.cliente
SET estado_id = (SELECT id FROM public.estado_cliente
                 WHERE nombre = 'HABILITADO' AND activo = true LIMIT 1),
    fecha_actualizacion = TIMESTAMP '2026-08-01 00:00:00'
WHERE ruc = '15614811363';

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, NULL, pc.id, NULL,
       'Registro histórico importado desde Excel',
       TIMESTAMP '2025-10-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pc ON pc.nombre = 'POR_COBRAR'
WHERE c.ruc = '15614811363'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Registro histórico importado desde Excel');

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, pc.id, pcap.id, NULL,
       'Pago histórico confirmado desde Excel',
       TIMESTAMP '2025-10-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pc ON pc.nombre = 'POR_COBRAR'
JOIN public.estado_cliente pcap ON pcap.nombre = 'POR_CAPACITAR'
WHERE c.ruc = '15614811363'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Pago histórico confirmado desde Excel');

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, pcap.id, hab.id, NULL,
       'Capacitación histórica confirmada desde Excel',
       TIMESTAMP '2025-10-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pcap ON pcap.nombre = 'POR_CAPACITAR'
JOIN public.estado_cliente hab ON hab.nombre = 'HABILITADO'
WHERE c.ruc = '15614811363'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Capacitación histórica confirmada desde Excel');


-- ============================================================
-- CLIENTE: 10704658503 - Joel Alexander Vela Portocarrero
-- ============================================================

-- 1. CLIENTE
INSERT INTO public.cliente (
    ruc, usuario_sol, clave_sol_cifrada, razon_social, nombre_comercial,
    direccion, departamento, provincia, distrito, telefono, email,
    nombres, apellidos, dni, telefono_personal, email_personal,
    usuario_admin_facturador, clave_temporal, url_acceso, usuario_wsp,
    estado_id, color_tag_id, entorno_id, activo,
    fecha_registro, fecha_actualizacion
)
VALUES (
    '10704658503',
    '70465850',
    '11141601Fr',
    'Joel Alexander Vela Portocarrero',
    'Majo Grill',
    'Urb. MARTINEZ DE CONPAGÑON H-17',
    NULL, NULL, NULL,
    '999556790',
    'joelvepo1601@gmail.com',
    NULL, NULL, '70465850',
    '999556790',
    'joelvepo1601@gmail.com',
    'joelvepo1601@gmail.com',
    '10704658503',
    'https://majogrill.cpe.webzary.pe/login',
    NULL,
    (SELECT id FROM public.estado_cliente WHERE nombre = 'HABILITADO' AND activo = true LIMIT 1),
    (SELECT id FROM public.color_tag WHERE codigo = 'Amarillo' AND activo = true LIMIT 1),
    (SELECT id FROM public.entorno WHERE nombre = 'Producción' AND activo = true LIMIT 1),
    true,
    TIMESTAMP '2025-10-01 00:00:00',
    TIMESTAMP '2026-07-01 00:00:00'
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

-- 2. VENTA INICIAL
INSERT INTO public.venta (
    cliente_id, vendedor_id, suscripcion_id, tipo_venta, venta_anterior_id,
    precio_lista, monto_prorrateado, monto_total, estado_venta,
    observaciones, fecha_venta, fecha_actualizacion
)
SELECT c.id, NULL, s.id, 'ALTA', NULL,
       s.precio, 0, s.precio, 'PAGADA',
       'Importación de registro histórico desde Excel',
       TIMESTAMP '2025-10-01 00:00:00', TIMESTAMP '2025-10-01 00:00:00'
FROM public.cliente c
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Emprende'
WHERE c.ruc = '10704658503'
  AND NOT EXISTS (
      SELECT 1 FROM public.venta v
      WHERE v.cliente_id = c.id
        AND v.tipo_venta = 'ALTA'
        AND v.fecha_venta = TIMESTAMP '2025-10-01 00:00:00'
  );

-- 3. RENOVACIONES PAGADAS
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
        (TIMESTAMP '2026-07-01 00:00:00')
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
JOIN public.cliente c ON c.ruc = '10704658503'
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Emprende'
WHERE NOT EXISTS (
    SELECT 1 FROM public.venta v
    WHERE v.cliente_id = c.id
      AND v.tipo_venta = 'RENOVACION'
      AND v.fecha_venta = fechas.fecha
);

-- 4. PAGOS HISTORICOS
WITH fechas(fecha) AS (
    VALUES
        (TIMESTAMP '2025-10-01 00:00:00'),
        (TIMESTAMP '2025-11-01 00:00:00'),
        (TIMESTAMP '2025-12-01 00:00:00'),
        (TIMESTAMP '2026-01-01 00:00:00'),
        (TIMESTAMP '2026-02-01 00:00:00'),
        (TIMESTAMP '2026-03-01 00:00:00'),
        (TIMESTAMP '2026-04-01 00:00:00'),
        (TIMESTAMP '2026-05-01 00:00:00'),
        (TIMESTAMP '2026-06-01 00:00:00'),
        (TIMESTAMP '2026-07-01 00:00:00')
)
INSERT INTO public.pago (
    venta_id, codigo_operacion, monto, medio_pago, estado_pago,
    fecha_pago, fecha_registro, observaciones
)
SELECT v.id, NULL, v.monto_total, 'YAPE', 'PAGADO',
       fechas.fecha, fechas.fecha,
       'Pago histórico importado desde Excel'
FROM fechas
JOIN public.cliente c ON c.ruc = '10704658503'
JOIN public.venta v ON v.cliente_id = c.id
                    AND v.fecha_venta = fechas.fecha
                    AND v.estado_venta = 'PAGADA'
WHERE NOT EXISTS (
    SELECT 1 FROM public.pago px
    WHERE px.venta_id = v.id
      AND px.fecha_pago = fechas.fecha
);

-- 5. SERVICIOS PERIODOS
WITH periodos(fecha_inicio, fecha_fin, estado) AS (
    VALUES
        (TIMESTAMP '2025-10-01 00:00:00', TIMESTAMP '2025-11-01 00:00:00', 'VENCIDO'),
        (TIMESTAMP '2025-11-01 00:00:00', TIMESTAMP '2025-12-01 00:00:00', 'VENCIDO'),
        (TIMESTAMP '2025-12-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00', 'VENCIDO'),
        (TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-02-01 00:00:00', 'VENCIDO'),
        (TIMESTAMP '2026-02-01 00:00:00', TIMESTAMP '2026-03-01 00:00:00', 'VENCIDO'),
        (TIMESTAMP '2026-03-01 00:00:00', TIMESTAMP '2026-04-01 00:00:00', 'VENCIDO'),
        (TIMESTAMP '2026-04-01 00:00:00', TIMESTAMP '2026-05-01 00:00:00', 'VENCIDO'),
        (TIMESTAMP '2026-05-01 00:00:00', TIMESTAMP '2026-06-01 00:00:00', 'VENCIDO'),
        (TIMESTAMP '2026-06-01 00:00:00', TIMESTAMP '2026-07-01 00:00:00', 'VENCIDO'),
        (TIMESTAMP '2026-07-01 00:00:00', TIMESTAMP '2026-08-01 00:00:00', 'ACTIVO')
)
INSERT INTO public.servicio_cliente (
    cliente_id, venta_id, fecha_inicio, fecha_fin, fecha_capacitacion,
    estado, monto_prorrateo, dias_prorrateados, observaciones,
    fecha_creacion, fecha_actualizacion
)
SELECT c.id, v.id, periodos.fecha_inicio, periodos.fecha_fin,
       TIMESTAMP '2025-10-01 00:00:00', periodos.estado,
       0, 0, 'Servicio histórico importado desde Excel',
       periodos.fecha_inicio, periodos.fecha_inicio
FROM periodos
JOIN public.cliente c ON c.ruc = '10704658503'
JOIN public.venta v ON v.cliente_id = c.id
                    AND v.fecha_venta = periodos.fecha_inicio
WHERE NOT EXISTS (
    SELECT 1 FROM public.servicio_cliente sc
    WHERE sc.venta_id = v.id
);

-- 6. SERVICIO ACTUAL
UPDATE public.servicio_cliente sc
SET fecha_inicio = TIMESTAMP '2026-07-01 00:00:00',
    fecha_fin = TIMESTAMP '2026-08-01 00:00:00',
    estado = 'ACTIVO',
    monto_prorrateo = 0,
    dias_prorrateados = 0,
    fecha_actualizacion = TIMESTAMP '2026-07-01 00:00:00'
FROM public.cliente c
JOIN public.venta v ON v.cliente_id = c.id
                   AND v.fecha_venta = TIMESTAMP '2026-07-01 00:00:00'
                   AND v.estado_venta = 'PAGADA'
WHERE sc.cliente_id = c.id
  AND sc.venta_id = v.id
  AND c.ruc = '10704658503';

-- 7. COBRO SIGUIENTE
UPDATE public.venta v
SET precio_lista = s.precio,
    monto_prorrateado = 0,
    monto_total = s.precio,
    estado_venta = 'PENDIENTE_PAGO',
    observaciones = 'Renovación siguiente: cobro mensual normal desde el día 01',
    fecha_actualizacion = TIMESTAMP '2026-07-01 00:00:00'
FROM public.cliente c
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Emprende'
WHERE v.cliente_id = c.id
  AND v.tipo_venta = 'RENOVACION'
  AND v.estado_venta = 'PENDIENTE_PAGO'
  AND v.fecha_venta = TIMESTAMP '2026-08-01 00:00:00'
  AND c.ruc = '10704658503';

INSERT INTO public.venta (
    cliente_id, vendedor_id, suscripcion_id, tipo_venta, venta_anterior_id,
    precio_lista, monto_prorrateado, monto_total, estado_venta,
    observaciones, fecha_venta, fecha_actualizacion
)
SELECT c.id, v.vendedor_id, s.id, 'RENOVACION', v.id,
       s.precio, 0, s.precio, 'PENDIENTE_PAGO',
       'Renovación siguiente: cobro mensual normal desde el día 01',
       TIMESTAMP '2026-08-01 00:00:00', TIMESTAMP '2026-07-01 00:00:00'
FROM public.cliente c
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Emprende'
JOIN public.venta v ON v.cliente_id = c.id
                   AND v.fecha_venta = TIMESTAMP '2026-07-01 00:00:00'
                   AND v.estado_venta = 'PAGADA'
WHERE c.ruc = '10704658503'
  AND NOT EXISTS (
      SELECT 1 FROM public.venta pendiente
      WHERE pendiente.cliente_id = c.id
        AND pendiente.tipo_venta = 'RENOVACION'
        AND pendiente.estado_venta = 'PENDIENTE_PAGO'
        AND pendiente.fecha_venta = TIMESTAMP '2026-08-01 00:00:00'
  );

-- 8. ESTADO ACTUAL E HISTORIAL
UPDATE public.cliente
SET estado_id = (SELECT id FROM public.estado_cliente
                 WHERE nombre = 'HABILITADO' AND activo = true LIMIT 1),
    fecha_actualizacion = TIMESTAMP '2026-07-01 00:00:00'
WHERE ruc = '10704658503';

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, NULL, pc.id, NULL,
       'Registro histórico importado desde Excel',
       TIMESTAMP '2025-10-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pc ON pc.nombre = 'POR_COBRAR'
WHERE c.ruc = '10704658503'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Registro histórico importado desde Excel');

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, pc.id, pcap.id, NULL,
       'Pago histórico confirmado desde Excel',
       TIMESTAMP '2025-10-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pc ON pc.nombre = 'POR_COBRAR'
JOIN public.estado_cliente pcap ON pcap.nombre = 'POR_CAPACITAR'
WHERE c.ruc = '10704658503'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Pago histórico confirmado desde Excel');

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, pcap.id, hab.id, NULL,
       'Capacitación histórica confirmada desde Excel',
       TIMESTAMP '2025-10-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pcap ON pcap.nombre = 'POR_CAPACITAR'
JOIN public.estado_cliente hab ON hab.nombre = 'HABILITADO'
WHERE c.ruc = '10704658503'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Capacitación histórica confirmada desde Excel');


-- ============================================================
-- CLIENTE: 10407302821 - Martín Walter Mamáni Paredes
-- ============================================================

-- 1. CLIENTE
INSERT INTO public.cliente (
    ruc, usuario_sol, clave_sol_cifrada, razon_social, nombre_comercial,
    direccion, departamento, provincia, distrito, telefono, email,
    nombres, apellidos, dni, telefono_personal, email_personal,
    usuario_admin_facturador, clave_temporal, url_acceso, usuario_wsp,
    estado_id, color_tag_id, entorno_id, activo,
    fecha_registro, fecha_actualizacion
)
VALUES (
    '10407302821',
    '40730282',
    'Martin1977',
    'Martín Walter Mamáni Paredes',
    'Restaurante y Pollería',
    'Av. Los próceres s/n',
    'PUNO', 'AZANGARO', 'AZANGARO',
    '951892715',
    'Martinwaltermamaniparedes@gmail.com',
    NULL, NULL, '40730282',
    '951892715',
    'Martinwaltermamaniparedes@gmail.com',
    'martinwaltermamaniparedes@gmail.com',
    '10407302821',
    'https://restauranteypolleria.cpe.webzary.pe/login',
    NULL,
    (SELECT id FROM public.estado_cliente WHERE nombre = 'HABILITADO' AND activo = true LIMIT 1),
    (SELECT id FROM public.color_tag WHERE codigo = 'Verde' AND activo = true LIMIT 1),
    (SELECT id FROM public.entorno WHERE nombre = 'Producción' AND activo = true LIMIT 1),
    true,
    TIMESTAMP '2025-10-01 00:00:00',
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

-- 2. VENTA INICIAL
INSERT INTO public.venta (
    cliente_id, vendedor_id, suscripcion_id, tipo_venta, venta_anterior_id,
    precio_lista, monto_prorrateado, monto_total, estado_venta,
    observaciones, fecha_venta, fecha_actualizacion
)
SELECT c.id, NULL, s.id, 'ALTA', NULL,
       s.precio, 0, s.precio, 'PAGADA',
       'Importación de registro histórico desde Excel',
       TIMESTAMP '2025-10-01 00:00:00', TIMESTAMP '2025-10-01 00:00:00'
FROM public.cliente c
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Emprende'
WHERE c.ruc = '10407302821'
  AND NOT EXISTS (
      SELECT 1 FROM public.venta v
      WHERE v.cliente_id = c.id
        AND v.tipo_venta = 'ALTA'
        AND v.fecha_venta = TIMESTAMP '2025-10-01 00:00:00'
  );

-- 3. RENOVACIONES PAGADAS
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
JOIN public.cliente c ON c.ruc = '10407302821'
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Emprende'
WHERE NOT EXISTS (
    SELECT 1 FROM public.venta v
    WHERE v.cliente_id = c.id
      AND v.tipo_venta = 'RENOVACION'
      AND v.fecha_venta = fechas.fecha
);

-- 4. PAGOS HISTORICOS
WITH fechas(fecha) AS (
    VALUES
        (TIMESTAMP '2025-10-01 00:00:00'),
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
JOIN public.cliente c ON c.ruc = '10407302821'
JOIN public.venta v ON v.cliente_id = c.id
                    AND v.fecha_venta = fechas.fecha
                    AND v.estado_venta = 'PAGADA'
WHERE NOT EXISTS (
    SELECT 1 FROM public.pago px
    WHERE px.venta_id = v.id
      AND px.fecha_pago = fechas.fecha
);

-- 5. SERVICIOS PERIODOS
WITH periodos(fecha_inicio, fecha_fin, estado) AS (
    VALUES
        (TIMESTAMP '2025-10-01 00:00:00', TIMESTAMP '2025-11-01 00:00:00', 'VENCIDO'),
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
       TIMESTAMP '2025-10-01 00:00:00', periodos.estado,
       0, 0, 'Servicio histórico importado desde Excel',
       periodos.fecha_inicio, periodos.fecha_inicio
FROM periodos
JOIN public.cliente c ON c.ruc = '10407302821'
JOIN public.venta v ON v.cliente_id = c.id
                    AND v.fecha_venta = periodos.fecha_inicio
WHERE NOT EXISTS (
    SELECT 1 FROM public.servicio_cliente sc
    WHERE sc.venta_id = v.id
);

-- 6. SERVICIO ACTUAL
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
  AND c.ruc = '10407302821';

-- 7. COBRO SIGUIENTE
UPDATE public.venta v
SET precio_lista = s.precio,
    monto_prorrateado = 0,
    monto_total = s.precio,
    estado_venta = 'PENDIENTE_PAGO',
    observaciones = 'Renovación siguiente: cobro mensual normal desde el día 01',
    fecha_actualizacion = TIMESTAMP '2026-08-01 00:00:00'
FROM public.cliente c
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Emprende'
WHERE v.cliente_id = c.id
  AND v.tipo_venta = 'RENOVACION'
  AND v.estado_venta = 'PENDIENTE_PAGO'
  AND v.fecha_venta = TIMESTAMP '2026-09-01 00:00:00'
  AND c.ruc = '10407302821';

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
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Emprende'
JOIN public.venta v ON v.cliente_id = c.id
                   AND v.fecha_venta = TIMESTAMP '2026-08-01 00:00:00'
                   AND v.estado_venta = 'PAGADA'
WHERE c.ruc = '10407302821'
  AND NOT EXISTS (
      SELECT 1 FROM public.venta pendiente
      WHERE pendiente.cliente_id = c.id
        AND pendiente.tipo_venta = 'RENOVACION'
        AND pendiente.estado_venta = 'PENDIENTE_PAGO'
        AND pendiente.fecha_venta = TIMESTAMP '2026-09-01 00:00:00'
  );

-- 8. ESTADO ACTUAL E HISTORIAL
UPDATE public.cliente
SET estado_id = (SELECT id FROM public.estado_cliente
                 WHERE nombre = 'HABILITADO' AND activo = true LIMIT 1),
    fecha_actualizacion = TIMESTAMP '2026-08-01 00:00:00'
WHERE ruc = '10407302821';

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, NULL, pc.id, NULL,
       'Registro histórico importado desde Excel',
       TIMESTAMP '2025-10-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pc ON pc.nombre = 'POR_COBRAR'
WHERE c.ruc = '10407302821'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Registro histórico importado desde Excel');

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, pc.id, pcap.id, NULL,
       'Pago histórico confirmado desde Excel',
       TIMESTAMP '2025-10-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pc ON pc.nombre = 'POR_COBRAR'
JOIN public.estado_cliente pcap ON pcap.nombre = 'POR_CAPACITAR'
WHERE c.ruc = '10407302821'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Pago histórico confirmado desde Excel');

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, pcap.id, hab.id, NULL,
       'Capacitación histórica confirmada desde Excel',
       TIMESTAMP '2025-10-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pcap ON pcap.nombre = 'POR_CAPACITAR'
JOIN public.estado_cliente hab ON hab.nombre = 'HABILITADO'
WHERE c.ruc = '10407302821'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Capacitación histórica confirmada desde Excel');


-- ============================================================
-- CLIENTE: 20615368041 - GROUP KALE STORE E.I.R.L
-- ============================================================

-- 1. CLIENTE
INSERT INTO public.cliente (
    ruc, usuario_sol, clave_sol_cifrada, razon_social, nombre_comercial,
    direccion, departamento, provincia, distrito, telefono, email,
    nombres, apellidos, dni, telefono_personal, email_personal,
    usuario_admin_facturador, clave_temporal, url_acceso, usuario_wsp,
    estado_id, color_tag_id, entorno_id, activo,
    fecha_registro, fecha_actualizacion
)
VALUES (
    '20615368041',
    'CULIALLM',
    'uebrister',
    'GROUP KALE STORE E.I.R.L',
    'GROUP KALE STORE',
    'MZ O5 lote 26, los licenciados ventanilla',
    NULL, NULL, NULL,
    '939253807',
    'luis.r.q@hotmail.com',
    NULL, NULL, '74135788',
    '939253807',
    'luis.r.q@hotmail.com',
    'luis.r.q@hotmail.com',
    'groUPKAE@#984',
    'https://groupkalestore.cpe.webzary.pe/login',
    NULL,
    (SELECT id FROM public.estado_cliente WHERE nombre = 'HABILITADO' AND activo = true LIMIT 1),
    (SELECT id FROM public.color_tag WHERE codigo = 'Verde' AND activo = true LIMIT 1),
    (SELECT id FROM public.entorno WHERE nombre = 'Producción' AND activo = true LIMIT 1),
    true,
    TIMESTAMP '2025-10-01 00:00:00',
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

-- 2. VENTA INICIAL
INSERT INTO public.venta (
    cliente_id, vendedor_id, suscripcion_id, tipo_venta, venta_anterior_id,
    precio_lista, monto_prorrateado, monto_total, estado_venta,
    observaciones, fecha_venta, fecha_actualizacion
)
SELECT c.id, NULL, s.id, 'ALTA', NULL,
       s.precio, 0, s.precio, 'PAGADA',
       'Importación de registro histórico desde Excel',
       TIMESTAMP '2025-10-01 00:00:00', TIMESTAMP '2025-10-01 00:00:00'
FROM public.cliente c
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Emprende'
WHERE c.ruc = '20615368041'
  AND NOT EXISTS (
      SELECT 1 FROM public.venta v
      WHERE v.cliente_id = c.id
        AND v.tipo_venta = 'ALTA'
        AND v.fecha_venta = TIMESTAMP '2025-10-01 00:00:00'
  );

-- 3. RENOVACIONES PAGADAS
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
JOIN public.cliente c ON c.ruc = '20615368041'
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Emprende'
WHERE NOT EXISTS (
    SELECT 1 FROM public.venta v
    WHERE v.cliente_id = c.id
      AND v.tipo_venta = 'RENOVACION'
      AND v.fecha_venta = fechas.fecha
);

-- 4. PAGOS HISTORICOS
WITH fechas(fecha) AS (
    VALUES
        (TIMESTAMP '2025-10-01 00:00:00'),
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
JOIN public.cliente c ON c.ruc = '20615368041'
JOIN public.venta v ON v.cliente_id = c.id
                    AND v.fecha_venta = fechas.fecha
                    AND v.estado_venta = 'PAGADA'
WHERE NOT EXISTS (
    SELECT 1 FROM public.pago px
    WHERE px.venta_id = v.id
      AND px.fecha_pago = fechas.fecha
);

-- 5. SERVICIOS PERIODOS
WITH periodos(fecha_inicio, fecha_fin, estado) AS (
    VALUES
        (TIMESTAMP '2025-10-01 00:00:00', TIMESTAMP '2025-11-01 00:00:00', 'VENCIDO'),
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
       TIMESTAMP '2025-10-01 00:00:00', periodos.estado,
       0, 0, 'Servicio histórico importado desde Excel',
       periodos.fecha_inicio, periodos.fecha_inicio
FROM periodos
JOIN public.cliente c ON c.ruc = '20615368041'
JOIN public.venta v ON v.cliente_id = c.id
                    AND v.fecha_venta = periodos.fecha_inicio
WHERE NOT EXISTS (
    SELECT 1 FROM public.servicio_cliente sc
    WHERE sc.venta_id = v.id
);

-- 6. SERVICIO ACTUAL
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
  AND c.ruc = '20615368041';

-- 7. COBRO SIGUIENTE
UPDATE public.venta v
SET precio_lista = s.precio,
    monto_prorrateado = 0,
    monto_total = s.precio,
    estado_venta = 'PENDIENTE_PAGO',
    observaciones = 'Renovación siguiente: cobro mensual normal desde el día 01',
    fecha_actualizacion = TIMESTAMP '2026-08-01 00:00:00'
FROM public.cliente c
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Emprende'
WHERE v.cliente_id = c.id
  AND v.tipo_venta = 'RENOVACION'
  AND v.estado_venta = 'PENDIENTE_PAGO'
  AND v.fecha_venta = TIMESTAMP '2026-09-01 00:00:00'
  AND c.ruc = '20615368041';

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
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Emprende'
JOIN public.venta v ON v.cliente_id = c.id
                   AND v.fecha_venta = TIMESTAMP '2026-08-01 00:00:00'
                   AND v.estado_venta = 'PAGADA'
WHERE c.ruc = '20615368041'
  AND NOT EXISTS (
      SELECT 1 FROM public.venta pendiente
      WHERE pendiente.cliente_id = c.id
        AND pendiente.tipo_venta = 'RENOVACION'
        AND pendiente.estado_venta = 'PENDIENTE_PAGO'
        AND pendiente.fecha_venta = TIMESTAMP '2026-09-01 00:00:00'
  );

-- 8. ESTADO ACTUAL E HISTORIAL
UPDATE public.cliente
SET estado_id = (SELECT id FROM public.estado_cliente
                 WHERE nombre = 'HABILITADO' AND activo = true LIMIT 1),
    fecha_actualizacion = TIMESTAMP '2026-08-01 00:00:00'
WHERE ruc = '20615368041';

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, NULL, pc.id, NULL,
       'Registro histórico importado desde Excel',
       TIMESTAMP '2025-10-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pc ON pc.nombre = 'POR_COBRAR'
WHERE c.ruc = '20615368041'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Registro histórico importado desde Excel');

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, pc.id, pcap.id, NULL,
       'Pago histórico confirmado desde Excel',
       TIMESTAMP '2025-10-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pc ON pc.nombre = 'POR_COBRAR'
JOIN public.estado_cliente pcap ON pcap.nombre = 'POR_CAPACITAR'
WHERE c.ruc = '20615368041'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Pago histórico confirmado desde Excel');

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, pcap.id, hab.id, NULL,
       'Capacitación histórica confirmada desde Excel',
       TIMESTAMP '2025-10-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pcap ON pcap.nombre = 'POR_CAPACITAR'
JOIN public.estado_cliente hab ON hab.nombre = 'HABILITADO'
WHERE c.ruc = '20615368041'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Capacitación histórica confirmada desde Excel');


-- ============================================================
-- CLIENTE: 20615087158 - FABRICACIONES Y IMPORTACIONES DALU EIRL
-- ============================================================

-- 1. CLIENTE
INSERT INTO public.cliente (
    ruc, usuario_sol, clave_sol_cifrada, razon_social, nombre_comercial,
    direccion, departamento, provincia, distrito, telefono, email,
    nombres, apellidos, dni, telefono_personal, email_personal,
    usuario_admin_facturador, clave_temporal, url_acceso, usuario_wsp,
    estado_id, color_tag_id, entorno_id, activo,
    fecha_registro, fecha_actualizacion
)
VALUES (
    '20615087158',
    'POLDENDW',
    'Dalu2026',
    'FABRICACIONES Y IMPORTACIONES DALU EIRL',
    'DALU EIRL',
    'Mza.B Lt 19 A.H los álamos Callao callao ventanilla',
    NULL, NULL, NULL,
    '949924443',
    'chavarriad635@gmail.com',
    NULL, NULL, '72325096',
    '949924443',
    'chavarriad635@gmail.com',
    'chavarriad635@gmail.com',
    'imporDAL@#2761',
    'https://dalu.cpe.webzary.pe/login',
    NULL,
    (SELECT id FROM public.estado_cliente WHERE nombre = 'HABILITADO' AND activo = true LIMIT 1),
    (SELECT id FROM public.color_tag WHERE codigo = 'Verde' AND activo = true LIMIT 1),
    (SELECT id FROM public.entorno WHERE nombre = 'Producción' AND activo = true LIMIT 1),
    true,
    TIMESTAMP '2026-01-01 00:00:00',
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

-- 2. VENTA INICIAL
INSERT INTO public.venta (
    cliente_id, vendedor_id, suscripcion_id, tipo_venta, venta_anterior_id,
    precio_lista, monto_prorrateado, monto_total, estado_venta,
    observaciones, fecha_venta, fecha_actualizacion
)
SELECT c.id, NULL, s.id, 'ALTA', NULL,
       s.precio, 0, s.precio, 'PAGADA',
       'Importación de registro histórico desde Excel',
       TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00'
FROM public.cliente c
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Empresarial'
WHERE c.ruc = '20615087158'
  AND NOT EXISTS (
      SELECT 1 FROM public.venta v
      WHERE v.cliente_id = c.id
        AND v.tipo_venta = 'ALTA'
        AND v.fecha_venta = TIMESTAMP '2026-01-01 00:00:00'
  );

-- 3. RENOVACIONES PAGADAS
WITH fechas(fecha) AS (
    VALUES
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
JOIN public.cliente c ON c.ruc = '20615087158'
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Empresarial'
WHERE NOT EXISTS (
    SELECT 1 FROM public.venta v
    WHERE v.cliente_id = c.id
      AND v.tipo_venta = 'RENOVACION'
      AND v.fecha_venta = fechas.fecha
);

-- 4. PAGOS HISTORICOS
WITH fechas(fecha) AS (
    VALUES
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
JOIN public.cliente c ON c.ruc = '20615087158'
JOIN public.venta v ON v.cliente_id = c.id
                    AND v.fecha_venta = fechas.fecha
                    AND v.estado_venta = 'PAGADA'
WHERE NOT EXISTS (
    SELECT 1 FROM public.pago px
    WHERE px.venta_id = v.id
      AND px.fecha_pago = fechas.fecha
);

-- 5. SERVICIOS PERIODOS
WITH periodos(fecha_inicio, fecha_fin, estado) AS (
    VALUES
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
       TIMESTAMP '2026-01-01 00:00:00', periodos.estado,
       0, 0, 'Servicio histórico importado desde Excel',
       periodos.fecha_inicio, periodos.fecha_inicio
FROM periodos
JOIN public.cliente c ON c.ruc = '20615087158'
JOIN public.venta v ON v.cliente_id = c.id
                    AND v.fecha_venta = periodos.fecha_inicio
WHERE NOT EXISTS (
    SELECT 1 FROM public.servicio_cliente sc
    WHERE sc.venta_id = v.id
);

-- 6. SERVICIO ACTUAL
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
  AND c.ruc = '20615087158';

-- 7. COBRO SIGUIENTE
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
  AND c.ruc = '20615087158';

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
WHERE c.ruc = '20615087158'
  AND NOT EXISTS (
      SELECT 1 FROM public.venta pendiente
      WHERE pendiente.cliente_id = c.id
        AND pendiente.tipo_venta = 'RENOVACION'
        AND pendiente.estado_venta = 'PENDIENTE_PAGO'
        AND pendiente.fecha_venta = TIMESTAMP '2026-09-01 00:00:00'
  );

-- 8. ESTADO ACTUAL E HISTORIAL
UPDATE public.cliente
SET estado_id = (SELECT id FROM public.estado_cliente
                 WHERE nombre = 'HABILITADO' AND activo = true LIMIT 1),
    fecha_actualizacion = TIMESTAMP '2026-08-01 00:00:00'
WHERE ruc = '20615087158';

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, NULL, pc.id, NULL,
       'Registro histórico importado desde Excel',
       TIMESTAMP '2026-01-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pc ON pc.nombre = 'POR_COBRAR'
WHERE c.ruc = '20615087158'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Registro histórico importado desde Excel');

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, pc.id, pcap.id, NULL,
       'Pago histórico confirmado desde Excel',
       TIMESTAMP '2026-01-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pc ON pc.nombre = 'POR_COBRAR'
JOIN public.estado_cliente pcap ON pcap.nombre = 'POR_CAPACITAR'
WHERE c.ruc = '20615087158'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Pago histórico confirmado desde Excel');

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, pcap.id, hab.id, NULL,
       'Capacitación histórica confirmada desde Excel',
       TIMESTAMP '2026-01-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pcap ON pcap.nombre = 'POR_CAPACITAR'
JOIN public.estado_cliente hab ON hab.nombre = 'HABILITADO'
WHERE c.ruc = '20615087158'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Capacitación histórica confirmada desde Excel');


-- ============================================================
-- CLIENTE: 20610435557 - ESPERANZA TV E.I.R.L.
-- ============================================================

-- 1. CLIENTE
INSERT INTO public.cliente (
    ruc, usuario_sol, clave_sol_cifrada, razon_social, nombre_comercial,
    direccion, departamento, provincia, distrito, telefono, email,
    nombres, apellidos, dni, telefono_personal, email_personal,
    usuario_admin_facturador, clave_temporal, url_acceso, usuario_wsp,
    estado_id, color_tag_id, entorno_id, activo,
    fecha_registro, fecha_actualizacion
)
VALUES (
    '20610435557',
    '71341437',
    'Saul17',
    'ESPERANZA TV E.I.R.L.',
    'ESPERANZA TV E.I.R.L.',
    NULL,
    NULL, NULL, NULL,
    '916 054 663',
    NULL,
    NULL, NULL, NULL,
    '916 054 663',
    NULL,
    NULL,
    NULL,
    'esperanzatv.miquipu.net',
    NULL,
    (SELECT id FROM public.estado_cliente WHERE nombre = 'HABILITADO' AND activo = true LIMIT 1),
    (SELECT id FROM public.color_tag WHERE codigo = 'Rojo' AND activo = true LIMIT 1),
    (SELECT id FROM public.entorno WHERE nombre = 'Producción' AND activo = true LIMIT 1),
    true,
    TIMESTAMP '2025-08-01 00:00:00',
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

-- 2. VENTA INICIAL
INSERT INTO public.venta (
    cliente_id, vendedor_id, suscripcion_id, tipo_venta, venta_anterior_id,
    precio_lista, monto_prorrateado, monto_total, estado_venta,
    observaciones, fecha_venta, fecha_actualizacion
)
SELECT c.id, NULL, s.id, 'ALTA', NULL,
       s.precio, 0, s.precio, 'PAGADA',
       'Importación de registro histórico desde Excel',
       TIMESTAMP '2025-08-01 00:00:00', TIMESTAMP '2025-08-01 00:00:00'
FROM public.cliente c
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Emprende'
WHERE c.ruc = '20610435557'
  AND NOT EXISTS (
      SELECT 1 FROM public.venta v
      WHERE v.cliente_id = c.id
        AND v.tipo_venta = 'ALTA'
        AND v.fecha_venta = TIMESTAMP '2025-08-01 00:00:00'
  );

-- 3. RENOVACIONES PAGADAS
WITH fechas(fecha) AS (
    VALUES
        (TIMESTAMP '2025-09-01 00:00:00'),
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
JOIN public.cliente c ON c.ruc = '20610435557'
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Emprende'
WHERE NOT EXISTS (
    SELECT 1 FROM public.venta v
    WHERE v.cliente_id = c.id
      AND v.tipo_venta = 'RENOVACION'
      AND v.fecha_venta = fechas.fecha
);

-- 4. PAGOS HISTORICOS
WITH fechas(fecha) AS (
    VALUES
        (TIMESTAMP '2025-08-01 00:00:00'),
        (TIMESTAMP '2025-09-01 00:00:00'),
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
JOIN public.cliente c ON c.ruc = '20610435557'
JOIN public.venta v ON v.cliente_id = c.id
                    AND v.fecha_venta = fechas.fecha
                    AND v.estado_venta = 'PAGADA'
WHERE NOT EXISTS (
    SELECT 1 FROM public.pago px
    WHERE px.venta_id = v.id
      AND px.fecha_pago = fechas.fecha
);

-- 5. SERVICIOS PERIODOS
WITH periodos(fecha_inicio, fecha_fin, estado) AS (
    VALUES
        (TIMESTAMP '2025-08-01 00:00:00', TIMESTAMP '2025-09-01 00:00:00', 'VENCIDO'),
        (TIMESTAMP '2025-09-01 00:00:00', TIMESTAMP '2025-10-01 00:00:00', 'VENCIDO'),
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
       TIMESTAMP '2025-08-01 00:00:00', periodos.estado,
       0, 0, 'Servicio histórico importado desde Excel',
       periodos.fecha_inicio, periodos.fecha_inicio
FROM periodos
JOIN public.cliente c ON c.ruc = '20610435557'
JOIN public.venta v ON v.cliente_id = c.id
                    AND v.fecha_venta = periodos.fecha_inicio
WHERE NOT EXISTS (
    SELECT 1 FROM public.servicio_cliente sc
    WHERE sc.venta_id = v.id
);

-- 6. SERVICIO ACTUAL
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
  AND c.ruc = '20610435557';

-- 7. COBRO SIGUIENTE
UPDATE public.venta v
SET precio_lista = s.precio,
    monto_prorrateado = 0,
    monto_total = s.precio,
    estado_venta = 'PENDIENTE_PAGO',
    observaciones = 'Renovación siguiente: cobro mensual normal desde el día 01',
    fecha_actualizacion = TIMESTAMP '2026-08-01 00:00:00'
FROM public.cliente c
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Emprende'
WHERE v.cliente_id = c.id
  AND v.tipo_venta = 'RENOVACION'
  AND v.estado_venta = 'PENDIENTE_PAGO'
  AND v.fecha_venta = TIMESTAMP '2026-09-01 00:00:00'
  AND c.ruc = '20610435557';

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
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Emprende'
JOIN public.venta v ON v.cliente_id = c.id
                   AND v.fecha_venta = TIMESTAMP '2026-08-01 00:00:00'
                   AND v.estado_venta = 'PAGADA'
WHERE c.ruc = '20610435557'
  AND NOT EXISTS (
      SELECT 1 FROM public.venta pendiente
      WHERE pendiente.cliente_id = c.id
        AND pendiente.tipo_venta = 'RENOVACION'
        AND pendiente.estado_venta = 'PENDIENTE_PAGO'
        AND pendiente.fecha_venta = TIMESTAMP '2026-09-01 00:00:00'
  );

-- 8. ESTADO ACTUAL E HISTORIAL
UPDATE public.cliente
SET estado_id = (SELECT id FROM public.estado_cliente
                 WHERE nombre = 'HABILITADO' AND activo = true LIMIT 1),
    fecha_actualizacion = TIMESTAMP '2026-08-01 00:00:00'
WHERE ruc = '20610435557';

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, NULL, pc.id, NULL,
       'Registro histórico importado desde Excel',
       TIMESTAMP '2025-08-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pc ON pc.nombre = 'POR_COBRAR'
WHERE c.ruc = '20610435557'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Registro histórico importado desde Excel');

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, pc.id, pcap.id, NULL,
       'Pago histórico confirmado desde Excel',
       TIMESTAMP '2025-08-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pc ON pc.nombre = 'POR_COBRAR'
JOIN public.estado_cliente pcap ON pcap.nombre = 'POR_CAPACITAR'
WHERE c.ruc = '20610435557'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Pago histórico confirmado desde Excel');

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, pcap.id, hab.id, NULL,
       'Capacitación histórica confirmada desde Excel',
       TIMESTAMP '2025-08-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pcap ON pcap.nombre = 'POR_CAPACITAR'
JOIN public.estado_cliente hab ON hab.nombre = 'HABILITADO'
WHERE c.ruc = '20610435557'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Capacitación histórica confirmada desde Excel');


-- ============================================================
-- CLIENTE: 20512180354 - José Luis Alvarado paucar
-- ============================================================

-- 1. CLIENTE
INSERT INTO public.cliente (
    ruc, usuario_sol, clave_sol_cifrada, razon_social, nombre_comercial,
    direccion, departamento, provincia, distrito, telefono, email,
    nombres, apellidos, dni, telefono_personal, email_personal,
    usuario_admin_facturador, clave_temporal, url_acceso, usuario_wsp,
    estado_id, color_tag_id, entorno_id, activo,
    fecha_registro, fecha_actualizacion
)
VALUES (
    '20512180354',
    'LNAKDKLE',
    'eUecAm6eb',
    'José Luis Alvarado paucar',
    'El BUEN PORTE',
    NULL,
    NULL, NULL, NULL,
    '976611521',
    'elbuenporte66@gmail.com',
    NULL, NULL, '9252166',
    '976611521',
    'elbuenporte66@gmail.com',
    'elbuenporte66@gmail.com',
    '20512180354',
    'https://elbuenporte.miquipu.net/',
    NULL,
    (SELECT id FROM public.estado_cliente WHERE nombre = 'HABILITADO' AND activo = true LIMIT 1),
    (SELECT id FROM public.color_tag WHERE codigo = 'Amarillo' AND activo = true LIMIT 1),
    (SELECT id FROM public.entorno WHERE nombre = 'Producción' AND activo = true LIMIT 1),
    true,
    TIMESTAMP '2025-07-01 00:00:00',
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

-- 2. VENTA INICIAL
INSERT INTO public.venta (
    cliente_id, vendedor_id, suscripcion_id, tipo_venta, venta_anterior_id,
    precio_lista, monto_prorrateado, monto_total, estado_venta,
    observaciones, fecha_venta, fecha_actualizacion
)
SELECT c.id, NULL, s.id, 'ALTA', NULL,
       s.precio, 0, s.precio, 'PAGADA',
       'Importación de registro histórico desde Excel',
       TIMESTAMP '2025-07-01 00:00:00', TIMESTAMP '2025-07-01 00:00:00'
FROM public.cliente c
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Emprende'
WHERE c.ruc = '20512180354'
  AND NOT EXISTS (
      SELECT 1 FROM public.venta v
      WHERE v.cliente_id = c.id
        AND v.tipo_venta = 'ALTA'
        AND v.fecha_venta = TIMESTAMP '2025-07-01 00:00:00'
  );

-- 3. RENOVACIONES PAGADAS
WITH fechas(fecha) AS (
    VALUES
        (TIMESTAMP '2025-08-01 00:00:00'),
        (TIMESTAMP '2025-09-01 00:00:00'),
        (TIMESTAMP '2025-10-01 00:00:00'),
        (TIMESTAMP '2025-11-01 00:00:00'),
        (TIMESTAMP '2025-12-01 00:00:00'),
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
JOIN public.cliente c ON c.ruc = '20512180354'
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Emprende'
WHERE NOT EXISTS (
    SELECT 1 FROM public.venta v
    WHERE v.cliente_id = c.id
      AND v.tipo_venta = 'RENOVACION'
      AND v.fecha_venta = fechas.fecha
);

-- 4. PAGOS HISTORICOS
WITH fechas(fecha) AS (
    VALUES
        (TIMESTAMP '2025-07-01 00:00:00'),
        (TIMESTAMP '2025-08-01 00:00:00'),
        (TIMESTAMP '2025-09-01 00:00:00'),
        (TIMESTAMP '2025-10-01 00:00:00'),
        (TIMESTAMP '2025-11-01 00:00:00'),
        (TIMESTAMP '2025-12-01 00:00:00'),
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
JOIN public.cliente c ON c.ruc = '20512180354'
JOIN public.venta v ON v.cliente_id = c.id
                    AND v.fecha_venta = fechas.fecha
                    AND v.estado_venta = 'PAGADA'
WHERE NOT EXISTS (
    SELECT 1 FROM public.pago px
    WHERE px.venta_id = v.id
      AND px.fecha_pago = fechas.fecha
);

-- 5. SERVICIOS PERIODOS
WITH periodos(fecha_inicio, fecha_fin, estado) AS (
    VALUES
        (TIMESTAMP '2025-07-01 00:00:00', TIMESTAMP '2025-08-01 00:00:00', 'VENCIDO'),
        (TIMESTAMP '2025-08-01 00:00:00', TIMESTAMP '2025-09-01 00:00:00', 'VENCIDO'),
        (TIMESTAMP '2025-09-01 00:00:00', TIMESTAMP '2025-10-01 00:00:00', 'VENCIDO'),
        (TIMESTAMP '2025-10-01 00:00:00', TIMESTAMP '2025-11-01 00:00:00', 'VENCIDO'),
        (TIMESTAMP '2025-11-01 00:00:00', TIMESTAMP '2025-12-01 00:00:00', 'VENCIDO'),
        (TIMESTAMP '2025-12-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00', 'VENCIDO'),
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
       TIMESTAMP '2025-07-01 00:00:00', periodos.estado,
       0, 0, 'Servicio histórico importado desde Excel',
       periodos.fecha_inicio, periodos.fecha_inicio
FROM periodos
JOIN public.cliente c ON c.ruc = '20512180354'
JOIN public.venta v ON v.cliente_id = c.id
                    AND v.fecha_venta = periodos.fecha_inicio
WHERE NOT EXISTS (
    SELECT 1 FROM public.servicio_cliente sc
    WHERE sc.venta_id = v.id
);

-- 6. SERVICIO ACTUAL
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
  AND c.ruc = '20512180354';

-- 7. COBRO SIGUIENTE
UPDATE public.venta v
SET precio_lista = s.precio,
    monto_prorrateado = 0,
    monto_total = s.precio,
    estado_venta = 'PENDIENTE_PAGO',
    observaciones = 'Renovación siguiente: cobro mensual normal desde el día 01',
    fecha_actualizacion = TIMESTAMP '2026-08-01 00:00:00'
FROM public.cliente c
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Emprende'
WHERE v.cliente_id = c.id
  AND v.tipo_venta = 'RENOVACION'
  AND v.estado_venta = 'PENDIENTE_PAGO'
  AND v.fecha_venta = TIMESTAMP '2026-09-01 00:00:00'
  AND c.ruc = '20512180354';

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
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Emprende'
JOIN public.venta v ON v.cliente_id = c.id
                   AND v.fecha_venta = TIMESTAMP '2026-08-01 00:00:00'
                   AND v.estado_venta = 'PAGADA'
WHERE c.ruc = '20512180354'
  AND NOT EXISTS (
      SELECT 1 FROM public.venta pendiente
      WHERE pendiente.cliente_id = c.id
        AND pendiente.tipo_venta = 'RENOVACION'
        AND pendiente.estado_venta = 'PENDIENTE_PAGO'
        AND pendiente.fecha_venta = TIMESTAMP '2026-09-01 00:00:00'
  );

-- 8. ESTADO ACTUAL E HISTORIAL
UPDATE public.cliente
SET estado_id = (SELECT id FROM public.estado_cliente
                 WHERE nombre = 'HABILITADO' AND activo = true LIMIT 1),
    fecha_actualizacion = TIMESTAMP '2026-08-01 00:00:00'
WHERE ruc = '20512180354';

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, NULL, pc.id, NULL,
       'Registro histórico importado desde Excel',
       TIMESTAMP '2025-07-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pc ON pc.nombre = 'POR_COBRAR'
WHERE c.ruc = '20512180354'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Registro histórico importado desde Excel');

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, pc.id, pcap.id, NULL,
       'Pago histórico confirmado desde Excel',
       TIMESTAMP '2025-07-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pc ON pc.nombre = 'POR_COBRAR'
JOIN public.estado_cliente pcap ON pcap.nombre = 'POR_CAPACITAR'
WHERE c.ruc = '20512180354'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Pago histórico confirmado desde Excel');

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, pcap.id, hab.id, NULL,
       'Capacitación histórica confirmada desde Excel',
       TIMESTAMP '2025-07-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pcap ON pcap.nombre = 'POR_CAPACITAR'
JOIN public.estado_cliente hab ON hab.nombre = 'HABILITADO'
WHERE c.ruc = '20512180354'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Capacitación histórica confirmada desde Excel');


-- ============================================================
-- CLIENTE: 20615059553 - Paraíso verde encantado
-- ============================================================

-- 1. CLIENTE
INSERT INTO public.cliente (
    ruc, usuario_sol, clave_sol_cifrada, razon_social, nombre_comercial,
    direccion, departamento, provincia, distrito, telefono, email,
    nombres, apellidos, dni, telefono_personal, email_personal,
    usuario_admin_facturador, clave_temporal, url_acceso, usuario_wsp,
    estado_id, color_tag_id, entorno_id, activo,
    fecha_registro, fecha_actualizacion
)
VALUES (
    '20615059553',
    '40074338',
    'Ramos12',
    'Paraíso verde encantado',
    'Paraíso verde encantado',
    'Caserío de nuevo Unión sin número Tingo María',
    NULL, NULL, NULL,
    '925 601 187',
    'leninramos1190@gmail.com',
    NULL, NULL, '40074338',
    '925 601 187',
    'leninramos1190@gmail.com',
    'leninramos1190@gmail.com',
    'paraiSOV@#9489',
    'https://paraisoverdeencantado.cpe.webzary.pe/login',
    NULL,
    (SELECT id FROM public.estado_cliente WHERE nombre = 'HABILITADO' AND activo = true LIMIT 1),
    (SELECT id FROM public.color_tag WHERE codigo = 'Rojo' AND activo = true LIMIT 1),
    (SELECT id FROM public.entorno WHERE nombre = 'Producción' AND activo = true LIMIT 1),
    true,
    TIMESTAMP '2026-05-01 00:00:00',
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

-- 2. VENTA INICIAL
INSERT INTO public.venta (
    cliente_id, vendedor_id, suscripcion_id, tipo_venta, venta_anterior_id,
    precio_lista, monto_prorrateado, monto_total, estado_venta,
    observaciones, fecha_venta, fecha_actualizacion
)
SELECT c.id, NULL, s.id, 'ALTA', NULL,
       s.precio, 0, s.precio, 'PAGADA',
       'Importación de registro histórico desde Excel',
       TIMESTAMP '2026-05-01 00:00:00', TIMESTAMP '2026-05-01 00:00:00'
FROM public.cliente c
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Inicial'
WHERE c.ruc = '20615059553'
  AND NOT EXISTS (
      SELECT 1 FROM public.venta v
      WHERE v.cliente_id = c.id
        AND v.tipo_venta = 'ALTA'
        AND v.fecha_venta = TIMESTAMP '2026-05-01 00:00:00'
  );

-- 3. RENOVACIONES PAGADAS
WITH fechas(fecha) AS (
    VALUES
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
JOIN public.cliente c ON c.ruc = '20615059553'
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Inicial'
WHERE NOT EXISTS (
    SELECT 1 FROM public.venta v
    WHERE v.cliente_id = c.id
      AND v.tipo_venta = 'RENOVACION'
      AND v.fecha_venta = fechas.fecha
);

-- 4. PAGOS HISTORICOS
WITH fechas(fecha) AS (
    VALUES
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
JOIN public.cliente c ON c.ruc = '20615059553'
JOIN public.venta v ON v.cliente_id = c.id
                    AND v.fecha_venta = fechas.fecha
                    AND v.estado_venta = 'PAGADA'
WHERE NOT EXISTS (
    SELECT 1 FROM public.pago px
    WHERE px.venta_id = v.id
      AND px.fecha_pago = fechas.fecha
);

-- 5. SERVICIOS PERIODOS
WITH periodos(fecha_inicio, fecha_fin, estado) AS (
    VALUES
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
       TIMESTAMP '2026-05-01 00:00:00', periodos.estado,
       0, 0, 'Servicio histórico importado desde Excel',
       periodos.fecha_inicio, periodos.fecha_inicio
FROM periodos
JOIN public.cliente c ON c.ruc = '20615059553'
JOIN public.venta v ON v.cliente_id = c.id
                    AND v.fecha_venta = periodos.fecha_inicio
WHERE NOT EXISTS (
    SELECT 1 FROM public.servicio_cliente sc
    WHERE sc.venta_id = v.id
);

-- 6. SERVICIO ACTUAL
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
  AND c.ruc = '20615059553';

-- 7. COBRO SIGUIENTE
UPDATE public.venta v
SET precio_lista = s.precio,
    monto_prorrateado = 0,
    monto_total = s.precio,
    estado_venta = 'PENDIENTE_PAGO',
    observaciones = 'Renovación siguiente: cobro mensual normal desde el día 01',
    fecha_actualizacion = TIMESTAMP '2026-08-01 00:00:00'
FROM public.cliente c
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Inicial'
WHERE v.cliente_id = c.id
  AND v.tipo_venta = 'RENOVACION'
  AND v.estado_venta = 'PENDIENTE_PAGO'
  AND v.fecha_venta = TIMESTAMP '2026-09-01 00:00:00'
  AND c.ruc = '20615059553';

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
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Inicial'
JOIN public.venta v ON v.cliente_id = c.id
                   AND v.fecha_venta = TIMESTAMP '2026-08-01 00:00:00'
                   AND v.estado_venta = 'PAGADA'
WHERE c.ruc = '20615059553'
  AND NOT EXISTS (
      SELECT 1 FROM public.venta pendiente
      WHERE pendiente.cliente_id = c.id
        AND pendiente.tipo_venta = 'RENOVACION'
        AND pendiente.estado_venta = 'PENDIENTE_PAGO'
        AND pendiente.fecha_venta = TIMESTAMP '2026-09-01 00:00:00'
  );

-- 8. ESTADO ACTUAL E HISTORIAL
UPDATE public.cliente
SET estado_id = (SELECT id FROM public.estado_cliente
                 WHERE nombre = 'HABILITADO' AND activo = true LIMIT 1),
    fecha_actualizacion = TIMESTAMP '2026-08-01 00:00:00'
WHERE ruc = '20615059553';

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, NULL, pc.id, NULL,
       'Registro histórico importado desde Excel',
       TIMESTAMP '2026-05-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pc ON pc.nombre = 'POR_COBRAR'
WHERE c.ruc = '20615059553'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Registro histórico importado desde Excel');

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, pc.id, pcap.id, NULL,
       'Pago histórico confirmado desde Excel',
       TIMESTAMP '2026-05-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pc ON pc.nombre = 'POR_COBRAR'
JOIN public.estado_cliente pcap ON pcap.nombre = 'POR_CAPACITAR'
WHERE c.ruc = '20615059553'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Pago histórico confirmado desde Excel');

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, pcap.id, hab.id, NULL,
       'Capacitación histórica confirmada desde Excel',
       TIMESTAMP '2026-05-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pcap ON pcap.nombre = 'POR_CAPACITAR'
JOIN public.estado_cliente hab ON hab.nombre = 'HABILITADO'
WHERE c.ruc = '20615059553'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Capacitación histórica confirmada desde Excel');


-- ============================================================
-- CLIENTE: 10476208276 - Henrry Alfonso pariona pichiuza
-- ============================================================

-- 1. CLIENTE
INSERT INTO public.cliente (
    ruc, usuario_sol, clave_sol_cifrada, razon_social, nombre_comercial,
    direccion, departamento, provincia, distrito, telefono, email,
    nombres, apellidos, dni, telefono_personal, email_personal,
    usuario_admin_facturador, clave_temporal, url_acceso, usuario_wsp,
    estado_id, color_tag_id, entorno_id, activo,
    fecha_registro, fecha_actualizacion
)
VALUES (
    '10476208276',
    '47620827',
    'Pariona12',
    'Henrry Alfonso pariona pichiuza',
    'Henry jeans',
    'Mz 16a lote01 a.h Laura caller iberico',
    'LIMA', 'LIMA', 'LOS OLIVOS',
    '976 352 802',
    'hpphenry88@gmail.com',
    NULL, NULL, '47620827',
    '976 352 802',
    'hpphenry88@gmail.com',
    'hpphenry88@gmail.com',
    'henrYJE@#1394',
    'https://henryjeans.cpe.webzary.pe/login',
    NULL,
    (SELECT id FROM public.estado_cliente WHERE nombre = 'HABILITADO' AND activo = true LIMIT 1),
    (SELECT id FROM public.color_tag WHERE codigo = 'Rojo' AND activo = true LIMIT 1),
    (SELECT id FROM public.entorno WHERE nombre = 'Producción' AND activo = true LIMIT 1),
    true,
    TIMESTAMP '2026-05-01 00:00:00',
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

-- 2. VENTA INICIAL
INSERT INTO public.venta (
    cliente_id, vendedor_id, suscripcion_id, tipo_venta, venta_anterior_id,
    precio_lista, monto_prorrateado, monto_total, estado_venta,
    observaciones, fecha_venta, fecha_actualizacion
)
SELECT c.id, NULL, s.id, 'ALTA', NULL,
       s.precio, 0, s.precio, 'PAGADA',
       'Importación de registro histórico desde Excel',
       TIMESTAMP '2026-05-01 00:00:00', TIMESTAMP '2026-05-01 00:00:00'
FROM public.cliente c
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Empresarial'
WHERE c.ruc = '10476208276'
  AND NOT EXISTS (
      SELECT 1 FROM public.venta v
      WHERE v.cliente_id = c.id
        AND v.tipo_venta = 'ALTA'
        AND v.fecha_venta = TIMESTAMP '2026-05-01 00:00:00'
  );

-- 3. RENOVACIONES PAGADAS
WITH fechas(fecha) AS (
    VALUES
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
JOIN public.cliente c ON c.ruc = '10476208276'
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Empresarial'
WHERE NOT EXISTS (
    SELECT 1 FROM public.venta v
    WHERE v.cliente_id = c.id
      AND v.tipo_venta = 'RENOVACION'
      AND v.fecha_venta = fechas.fecha
);

-- 4. PAGOS HISTORICOS
WITH fechas(fecha) AS (
    VALUES
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
JOIN public.cliente c ON c.ruc = '10476208276'
JOIN public.venta v ON v.cliente_id = c.id
                    AND v.fecha_venta = fechas.fecha
                    AND v.estado_venta = 'PAGADA'
WHERE NOT EXISTS (
    SELECT 1 FROM public.pago px
    WHERE px.venta_id = v.id
      AND px.fecha_pago = fechas.fecha
);

-- 5. SERVICIOS PERIODOS
WITH periodos(fecha_inicio, fecha_fin, estado) AS (
    VALUES
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
       TIMESTAMP '2026-05-01 00:00:00', periodos.estado,
       0, 0, 'Servicio histórico importado desde Excel',
       periodos.fecha_inicio, periodos.fecha_inicio
FROM periodos
JOIN public.cliente c ON c.ruc = '10476208276'
JOIN public.venta v ON v.cliente_id = c.id
                    AND v.fecha_venta = periodos.fecha_inicio
WHERE NOT EXISTS (
    SELECT 1 FROM public.servicio_cliente sc
    WHERE sc.venta_id = v.id
);

-- 6. SERVICIO ACTUAL
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
  AND c.ruc = '10476208276';

-- 7. COBRO SIGUIENTE
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
  AND c.ruc = '10476208276';

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
WHERE c.ruc = '10476208276'
  AND NOT EXISTS (
      SELECT 1 FROM public.venta pendiente
      WHERE pendiente.cliente_id = c.id
        AND pendiente.tipo_venta = 'RENOVACION'
        AND pendiente.estado_venta = 'PENDIENTE_PAGO'
        AND pendiente.fecha_venta = TIMESTAMP '2026-09-01 00:00:00'
  );

-- 8. ESTADO ACTUAL E HISTORIAL
UPDATE public.cliente
SET estado_id = (SELECT id FROM public.estado_cliente
                 WHERE nombre = 'HABILITADO' AND activo = true LIMIT 1),
    fecha_actualizacion = TIMESTAMP '2026-08-01 00:00:00'
WHERE ruc = '10476208276';

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, NULL, pc.id, NULL,
       'Registro histórico importado desde Excel',
       TIMESTAMP '2026-05-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pc ON pc.nombre = 'POR_COBRAR'
WHERE c.ruc = '10476208276'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Registro histórico importado desde Excel');

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, pc.id, pcap.id, NULL,
       'Pago histórico confirmado desde Excel',
       TIMESTAMP '2026-05-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pc ON pc.nombre = 'POR_COBRAR'
JOIN public.estado_cliente pcap ON pcap.nombre = 'POR_CAPACITAR'
WHERE c.ruc = '10476208276'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Pago histórico confirmado desde Excel');

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, pcap.id, hab.id, NULL,
       'Capacitación histórica confirmada desde Excel',
       TIMESTAMP '2026-05-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pcap ON pcap.nombre = 'POR_CAPACITAR'
JOIN public.estado_cliente hab ON hab.nombre = 'HABILITADO'
WHERE c.ruc = '10476208276'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Capacitación histórica confirmada desde Excel');


-- ============================================================
-- CLIENTE: 10463190751 - Diana Carolina Castañeda Vargas
-- ============================================================

-- 1. CLIENTE
INSERT INTO public.cliente (
    ruc, usuario_sol, clave_sol_cifrada, razon_social, nombre_comercial,
    direccion, departamento, provincia, distrito, telefono, email,
    nombres, apellidos, dni, telefono_personal, email_personal,
    usuario_admin_facturador, clave_temporal, url_acceso, usuario_wsp,
    estado_id, color_tag_id, entorno_id, activo,
    fecha_registro, fecha_actualizacion
)
VALUES (
    '10463190751',
    '46319075',
    'Dicava36*',
    'Diana Carolina Castañeda Vargas',
    'NOVUS CLEAN',
    'Av. URUGUAY 960 - HUANCAYO',
    'JUNIN', 'HUANCAYO', 'HUANCAYO',
    '968 023 045',
    'diancavargas434@gmail.com',
    NULL, NULL, '46319075',
    '968 023 045',
    'diancavargas434@gmail.com',
    'diancavargas434@gmail.com',
    'novUSCL@#1249',
    'https://novusclean.cpe.webzary.pe/login',
    NULL,
    (SELECT id FROM public.estado_cliente WHERE nombre = 'HABILITADO' AND activo = true LIMIT 1),
    (SELECT id FROM public.color_tag WHERE codigo = 'Rojo' AND activo = true LIMIT 1),
    (SELECT id FROM public.entorno WHERE nombre = 'Producción' AND activo = true LIMIT 1),
    true,
    TIMESTAMP '2026-05-01 00:00:00',
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

-- 2. VENTA INICIAL
INSERT INTO public.venta (
    cliente_id, vendedor_id, suscripcion_id, tipo_venta, venta_anterior_id,
    precio_lista, monto_prorrateado, monto_total, estado_venta,
    observaciones, fecha_venta, fecha_actualizacion
)
SELECT c.id, NULL, s.id, 'ALTA', NULL,
       s.precio, 0, s.precio, 'PAGADA',
       'Importación de registro histórico desde Excel',
       TIMESTAMP '2026-05-01 00:00:00', TIMESTAMP '2026-05-01 00:00:00'
FROM public.cliente c
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Inicial'
WHERE c.ruc = '10463190751'
  AND NOT EXISTS (
      SELECT 1 FROM public.venta v
      WHERE v.cliente_id = c.id
        AND v.tipo_venta = 'ALTA'
        AND v.fecha_venta = TIMESTAMP '2026-05-01 00:00:00'
  );

-- 3. RENOVACIONES PAGADAS
WITH fechas(fecha) AS (
    VALUES
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
JOIN public.cliente c ON c.ruc = '10463190751'
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Inicial'
WHERE NOT EXISTS (
    SELECT 1 FROM public.venta v
    WHERE v.cliente_id = c.id
      AND v.tipo_venta = 'RENOVACION'
      AND v.fecha_venta = fechas.fecha
);

-- 4. PAGOS HISTORICOS
WITH fechas(fecha) AS (
    VALUES
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
JOIN public.cliente c ON c.ruc = '10463190751'
JOIN public.venta v ON v.cliente_id = c.id
                    AND v.fecha_venta = fechas.fecha
                    AND v.estado_venta = 'PAGADA'
WHERE NOT EXISTS (
    SELECT 1 FROM public.pago px
    WHERE px.venta_id = v.id
      AND px.fecha_pago = fechas.fecha
);

-- 5. SERVICIOS PERIODOS
WITH periodos(fecha_inicio, fecha_fin, estado) AS (
    VALUES
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
       TIMESTAMP '2026-05-01 00:00:00', periodos.estado,
       0, 0, 'Servicio histórico importado desde Excel',
       periodos.fecha_inicio, periodos.fecha_inicio
FROM periodos
JOIN public.cliente c ON c.ruc = '10463190751'
JOIN public.venta v ON v.cliente_id = c.id
                    AND v.fecha_venta = periodos.fecha_inicio
WHERE NOT EXISTS (
    SELECT 1 FROM public.servicio_cliente sc
    WHERE sc.venta_id = v.id
);

-- 6. SERVICIO ACTUAL
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
  AND c.ruc = '10463190751';

-- 7. COBRO SIGUIENTE
UPDATE public.venta v
SET precio_lista = s.precio,
    monto_prorrateado = 0,
    monto_total = s.precio,
    estado_venta = 'PENDIENTE_PAGO',
    observaciones = 'Renovación siguiente: cobro mensual normal desde el día 01',
    fecha_actualizacion = TIMESTAMP '2026-08-01 00:00:00'
FROM public.cliente c
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Inicial'
WHERE v.cliente_id = c.id
  AND v.tipo_venta = 'RENOVACION'
  AND v.estado_venta = 'PENDIENTE_PAGO'
  AND v.fecha_venta = TIMESTAMP '2026-09-01 00:00:00'
  AND c.ruc = '10463190751';

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
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Inicial'
JOIN public.venta v ON v.cliente_id = c.id
                   AND v.fecha_venta = TIMESTAMP '2026-08-01 00:00:00'
                   AND v.estado_venta = 'PAGADA'
WHERE c.ruc = '10463190751'
  AND NOT EXISTS (
      SELECT 1 FROM public.venta pendiente
      WHERE pendiente.cliente_id = c.id
        AND pendiente.tipo_venta = 'RENOVACION'
        AND pendiente.estado_venta = 'PENDIENTE_PAGO'
        AND pendiente.fecha_venta = TIMESTAMP '2026-09-01 00:00:00'
  );

-- 8. ESTADO ACTUAL E HISTORIAL
UPDATE public.cliente
SET estado_id = (SELECT id FROM public.estado_cliente
                 WHERE nombre = 'HABILITADO' AND activo = true LIMIT 1),
    fecha_actualizacion = TIMESTAMP '2026-08-01 00:00:00'
WHERE ruc = '10463190751';

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, NULL, pc.id, NULL,
       'Registro histórico importado desde Excel',
       TIMESTAMP '2026-05-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pc ON pc.nombre = 'POR_COBRAR'
WHERE c.ruc = '10463190751'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Registro histórico importado desde Excel');

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, pc.id, pcap.id, NULL,
       'Pago histórico confirmado desde Excel',
       TIMESTAMP '2026-05-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pc ON pc.nombre = 'POR_COBRAR'
JOIN public.estado_cliente pcap ON pcap.nombre = 'POR_CAPACITAR'
WHERE c.ruc = '10463190751'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Pago histórico confirmado desde Excel');

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, pcap.id, hab.id, NULL,
       'Capacitación histórica confirmada desde Excel',
       TIMESTAMP '2026-05-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pcap ON pcap.nombre = 'POR_CAPACITAR'
JOIN public.estado_cliente hab ON hab.nombre = 'HABILITADO'
WHERE c.ruc = '10463190751'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Capacitación histórica confirmada desde Excel');


-- ============================================================
-- CLIENTE: 20610336591 - Construferre Zuazu Eirl
-- ============================================================

-- 1. CLIENTE
INSERT INTO public.cliente (
    ruc, usuario_sol, clave_sol_cifrada, razon_social, nombre_comercial,
    direccion, departamento, provincia, distrito, telefono, email,
    nombres, apellidos, dni, telefono_personal, email_personal,
    usuario_admin_facturador, clave_temporal, url_acceso, usuario_wsp,
    estado_id, color_tag_id, entorno_id, activo,
    fecha_registro, fecha_actualizacion
)
VALUES (
    '20610336591',
    '45359142',
    'David1010',
    'Construferre Zuazu Eirl',
    'Zuazu',
    'Jr. Jose de la Riva Aguero 249 San Agustín comas',
    'LIMA', 'LIMA', 'COMAS',
    '918362616',
    'construferrezuazu@gmail.com',
    NULL, NULL, '45359142',
    '918362616',
    'construferrezuazu@gmail.com',
    'construferrezuazu@gmail.com',
    'zuaZU@#95030',
    'https://zuazu.cpe.webzary.pe/login',
    NULL,
    (SELECT id FROM public.estado_cliente WHERE nombre = 'HABILITADO' AND activo = true LIMIT 1),
    (SELECT id FROM public.color_tag WHERE codigo = 'Verde' AND activo = true LIMIT 1),
    (SELECT id FROM public.entorno WHERE nombre = 'Producción' AND activo = true LIMIT 1),
    true,
    TIMESTAMP '2026-05-01 00:00:00',
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

-- 2. VENTA INICIAL
INSERT INTO public.venta (
    cliente_id, vendedor_id, suscripcion_id, tipo_venta, venta_anterior_id,
    precio_lista, monto_prorrateado, monto_total, estado_venta,
    observaciones, fecha_venta, fecha_actualizacion
)
SELECT c.id, NULL, s.id, 'ALTA', NULL,
       s.precio, 0, s.precio, 'PAGADA',
       'Importación de registro histórico desde Excel',
       TIMESTAMP '2026-05-01 00:00:00', TIMESTAMP '2026-05-01 00:00:00'
FROM public.cliente c
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Inicial'
WHERE c.ruc = '20610336591'
  AND NOT EXISTS (
      SELECT 1 FROM public.venta v
      WHERE v.cliente_id = c.id
        AND v.tipo_venta = 'ALTA'
        AND v.fecha_venta = TIMESTAMP '2026-05-01 00:00:00'
  );

-- 3. RENOVACIONES PAGADAS
WITH fechas(fecha) AS (
    VALUES
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
JOIN public.cliente c ON c.ruc = '20610336591'
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Inicial'
WHERE NOT EXISTS (
    SELECT 1 FROM public.venta v
    WHERE v.cliente_id = c.id
      AND v.tipo_venta = 'RENOVACION'
      AND v.fecha_venta = fechas.fecha
);

-- 4. PAGOS HISTORICOS
WITH fechas(fecha) AS (
    VALUES
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
JOIN public.cliente c ON c.ruc = '20610336591'
JOIN public.venta v ON v.cliente_id = c.id
                    AND v.fecha_venta = fechas.fecha
                    AND v.estado_venta = 'PAGADA'
WHERE NOT EXISTS (
    SELECT 1 FROM public.pago px
    WHERE px.venta_id = v.id
      AND px.fecha_pago = fechas.fecha
);

-- 5. SERVICIOS PERIODOS
WITH periodos(fecha_inicio, fecha_fin, estado) AS (
    VALUES
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
       TIMESTAMP '2026-05-01 00:00:00', periodos.estado,
       0, 0, 'Servicio histórico importado desde Excel',
       periodos.fecha_inicio, periodos.fecha_inicio
FROM periodos
JOIN public.cliente c ON c.ruc = '20610336591'
JOIN public.venta v ON v.cliente_id = c.id
                    AND v.fecha_venta = periodos.fecha_inicio
WHERE NOT EXISTS (
    SELECT 1 FROM public.servicio_cliente sc
    WHERE sc.venta_id = v.id
);

-- 6. SERVICIO ACTUAL
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
  AND c.ruc = '20610336591';

-- 7. COBRO SIGUIENTE
UPDATE public.venta v
SET precio_lista = s.precio,
    monto_prorrateado = 0,
    monto_total = s.precio,
    estado_venta = 'PENDIENTE_PAGO',
    observaciones = 'Renovación siguiente: cobro mensual normal desde el día 01',
    fecha_actualizacion = TIMESTAMP '2026-08-01 00:00:00'
FROM public.cliente c
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Inicial'
WHERE v.cliente_id = c.id
  AND v.tipo_venta = 'RENOVACION'
  AND v.estado_venta = 'PENDIENTE_PAGO'
  AND v.fecha_venta = TIMESTAMP '2026-09-01 00:00:00'
  AND c.ruc = '20610336591';

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
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Inicial'
JOIN public.venta v ON v.cliente_id = c.id
                   AND v.fecha_venta = TIMESTAMP '2026-08-01 00:00:00'
                   AND v.estado_venta = 'PAGADA'
WHERE c.ruc = '20610336591'
  AND NOT EXISTS (
      SELECT 1 FROM public.venta pendiente
      WHERE pendiente.cliente_id = c.id
        AND pendiente.tipo_venta = 'RENOVACION'
        AND pendiente.estado_venta = 'PENDIENTE_PAGO'
        AND pendiente.fecha_venta = TIMESTAMP '2026-09-01 00:00:00'
  );

-- 8. ESTADO ACTUAL E HISTORIAL
UPDATE public.cliente
SET estado_id = (SELECT id FROM public.estado_cliente
                 WHERE nombre = 'HABILITADO' AND activo = true LIMIT 1),
    fecha_actualizacion = TIMESTAMP '2026-08-01 00:00:00'
WHERE ruc = '20610336591';

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, NULL, pc.id, NULL,
       'Registro histórico importado desde Excel',
       TIMESTAMP '2026-05-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pc ON pc.nombre = 'POR_COBRAR'
WHERE c.ruc = '20610336591'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Registro histórico importado desde Excel');

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, pc.id, pcap.id, NULL,
       'Pago histórico confirmado desde Excel',
       TIMESTAMP '2026-05-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pc ON pc.nombre = 'POR_COBRAR'
JOIN public.estado_cliente pcap ON pcap.nombre = 'POR_CAPACITAR'
WHERE c.ruc = '20610336591'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Pago histórico confirmado desde Excel');

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, pcap.id, hab.id, NULL,
       'Capacitación histórica confirmada desde Excel',
       TIMESTAMP '2026-05-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pcap ON pcap.nombre = 'POR_CAPACITAR'
JOIN public.estado_cliente hab ON hab.nombre = 'HABILITADO'
WHERE c.ruc = '20610336591'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Capacitación histórica confirmada desde Excel');


-- ============================================================
-- CLIENTE: 10753569087 - Ederson Raúl loro rojas
-- ============================================================

-- 1. CLIENTE
INSERT INTO public.cliente (
    ruc, usuario_sol, clave_sol_cifrada, razon_social, nombre_comercial,
    direccion, departamento, provincia, distrito, telefono, email,
    nombres, apellidos, dni, telefono_personal, email_personal,
    usuario_admin_facturador, clave_temporal, url_acceso, usuario_wsp,
    estado_id, color_tag_id, entorno_id, activo,
    fecha_registro, fecha_actualizacion
)
VALUES (
    '10753569087',
    'MENRIDGE',
    'wertwolav',
    'Ederson Raúl loro rojas',
    'La casa de los cojines',
    'Jr Ricardo Herrera cercado de lima 499',
    NULL, NULL, NULL,
    '956391022',
    'edersonraul@gmail.com',
    NULL, NULL, '75356908',
    '956391022',
    'edersonraul@gmail.com',
    NULL,
    NULL,
    NULL,
    NULL,
    (SELECT id FROM public.estado_cliente WHERE nombre = 'HABILITADO' AND activo = true LIMIT 1),
    (SELECT id FROM public.color_tag WHERE codigo = 'Amarillo' AND activo = true LIMIT 1),
    (SELECT id FROM public.entorno WHERE nombre = 'Producción' AND activo = true LIMIT 1),
    true,
    TIMESTAMP '2026-06-01 00:00:00',
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

-- 2. VENTA INICIAL
INSERT INTO public.venta (
    cliente_id, vendedor_id, suscripcion_id, tipo_venta, venta_anterior_id,
    precio_lista, monto_prorrateado, monto_total, estado_venta,
    observaciones, fecha_venta, fecha_actualizacion
)
SELECT c.id, NULL, s.id, 'ALTA', NULL,
       s.precio, 0, s.precio, 'PAGADA',
       'Importación de registro histórico desde Excel',
       TIMESTAMP '2026-06-01 00:00:00', TIMESTAMP '2026-06-01 00:00:00'
FROM public.cliente c
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Inicial'
WHERE c.ruc = '10753569087'
  AND NOT EXISTS (
      SELECT 1 FROM public.venta v
      WHERE v.cliente_id = c.id
        AND v.tipo_venta = 'ALTA'
        AND v.fecha_venta = TIMESTAMP '2026-06-01 00:00:00'
  );

-- 3. RENOVACIONES PAGADAS
WITH fechas(fecha) AS (
    VALUES
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
JOIN public.cliente c ON c.ruc = '10753569087'
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Inicial'
WHERE NOT EXISTS (
    SELECT 1 FROM public.venta v
    WHERE v.cliente_id = c.id
      AND v.tipo_venta = 'RENOVACION'
      AND v.fecha_venta = fechas.fecha
);

-- 4. PAGOS HISTORICOS
WITH fechas(fecha) AS (
    VALUES
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
JOIN public.cliente c ON c.ruc = '10753569087'
JOIN public.venta v ON v.cliente_id = c.id
                    AND v.fecha_venta = fechas.fecha
                    AND v.estado_venta = 'PAGADA'
WHERE NOT EXISTS (
    SELECT 1 FROM public.pago px
    WHERE px.venta_id = v.id
      AND px.fecha_pago = fechas.fecha
);

-- 5. SERVICIOS PERIODOS
WITH periodos(fecha_inicio, fecha_fin, estado) AS (
    VALUES
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
       TIMESTAMP '2026-06-01 00:00:00', periodos.estado,
       0, 0, 'Servicio histórico importado desde Excel',
       periodos.fecha_inicio, periodos.fecha_inicio
FROM periodos
JOIN public.cliente c ON c.ruc = '10753569087'
JOIN public.venta v ON v.cliente_id = c.id
                    AND v.fecha_venta = periodos.fecha_inicio
WHERE NOT EXISTS (
    SELECT 1 FROM public.servicio_cliente sc
    WHERE sc.venta_id = v.id
);

-- 6. SERVICIO ACTUAL
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
  AND c.ruc = '10753569087';

-- 7. COBRO SIGUIENTE
UPDATE public.venta v
SET precio_lista = s.precio,
    monto_prorrateado = 0,
    monto_total = s.precio,
    estado_venta = 'PENDIENTE_PAGO',
    observaciones = 'Renovación siguiente: cobro mensual normal desde el día 01',
    fecha_actualizacion = TIMESTAMP '2026-08-01 00:00:00'
FROM public.cliente c
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Inicial'
WHERE v.cliente_id = c.id
  AND v.tipo_venta = 'RENOVACION'
  AND v.estado_venta = 'PENDIENTE_PAGO'
  AND v.fecha_venta = TIMESTAMP '2026-09-01 00:00:00'
  AND c.ruc = '10753569087';

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
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Inicial'
JOIN public.venta v ON v.cliente_id = c.id
                   AND v.fecha_venta = TIMESTAMP '2026-08-01 00:00:00'
                   AND v.estado_venta = 'PAGADA'
WHERE c.ruc = '10753569087'
  AND NOT EXISTS (
      SELECT 1 FROM public.venta pendiente
      WHERE pendiente.cliente_id = c.id
        AND pendiente.tipo_venta = 'RENOVACION'
        AND pendiente.estado_venta = 'PENDIENTE_PAGO'
        AND pendiente.fecha_venta = TIMESTAMP '2026-09-01 00:00:00'
  );

-- 8. ESTADO ACTUAL E HISTORIAL
UPDATE public.cliente
SET estado_id = (SELECT id FROM public.estado_cliente
                 WHERE nombre = 'HABILITADO' AND activo = true LIMIT 1),
    fecha_actualizacion = TIMESTAMP '2026-08-01 00:00:00'
WHERE ruc = '10753569087';

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, NULL, pc.id, NULL,
       'Registro histórico importado desde Excel',
       TIMESTAMP '2026-06-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pc ON pc.nombre = 'POR_COBRAR'
WHERE c.ruc = '10753569087'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Registro histórico importado desde Excel');

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, pc.id, pcap.id, NULL,
       'Pago histórico confirmado desde Excel',
       TIMESTAMP '2026-06-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pc ON pc.nombre = 'POR_COBRAR'
JOIN public.estado_cliente pcap ON pcap.nombre = 'POR_CAPACITAR'
WHERE c.ruc = '10753569087'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Pago histórico confirmado desde Excel');

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, pcap.id, hab.id, NULL,
       'Capacitación histórica confirmada desde Excel',
       TIMESTAMP '2026-06-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pcap ON pcap.nombre = 'POR_CAPACITAR'
JOIN public.estado_cliente hab ON hab.nombre = 'HABILITADO'
WHERE c.ruc = '10753569087'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Capacitación histórica confirmada desde Excel');


-- ============================================================
-- CLIENTE: 10425104735 - Mónica Pilar Quispe Taquila
-- ============================================================

-- 1. CLIENTE
INSERT INTO public.cliente (
    ruc, usuario_sol, clave_sol_cifrada, razon_social, nombre_comercial,
    direccion, departamento, provincia, distrito, telefono, email,
    nombres, apellidos, dni, telefono_personal, email_personal,
    usuario_admin_facturador, clave_temporal, url_acceso, usuario_wsp,
    estado_id, color_tag_id, entorno_id, activo,
    fecha_registro, fecha_actualizacion
)
VALUES (
    '10425104735',
    '42510473',
    'MO262906ca',
    'Mónica Pilar Quispe Taquila',
    'SMK - Sumak',
    'Filiberto Romero Mz K lt.13-A',
    'LIMA', 'LIMA', 'SAN JUAN DE MIRAFLORES',
    '986848680',
    'monicapilar36@gmail.com',
    NULL, NULL, '42510473',
    '986848680',
    'monicapilar36@gmail.com',
    NULL,
    NULL,
    NULL,
    NULL,
    (SELECT id FROM public.estado_cliente WHERE nombre = 'HABILITADO' AND activo = true LIMIT 1),
    (SELECT id FROM public.color_tag WHERE codigo = 'Amarillo' AND activo = true LIMIT 1),
    (SELECT id FROM public.entorno WHERE nombre = 'Producción' AND activo = true LIMIT 1),
    true,
    TIMESTAMP '2026-06-01 00:00:00',
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

-- 2. VENTA INICIAL
INSERT INTO public.venta (
    cliente_id, vendedor_id, suscripcion_id, tipo_venta, venta_anterior_id,
    precio_lista, monto_prorrateado, monto_total, estado_venta,
    observaciones, fecha_venta, fecha_actualizacion
)
SELECT c.id, NULL, s.id, 'ALTA', NULL,
       s.precio, 0, s.precio, 'PAGADA',
       'Importación de registro histórico desde Excel',
       TIMESTAMP '2026-06-01 00:00:00', TIMESTAMP '2026-06-01 00:00:00'
FROM public.cliente c
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Inicial'
WHERE c.ruc = '10425104735'
  AND NOT EXISTS (
      SELECT 1 FROM public.venta v
      WHERE v.cliente_id = c.id
        AND v.tipo_venta = 'ALTA'
        AND v.fecha_venta = TIMESTAMP '2026-06-01 00:00:00'
  );

-- 3. RENOVACIONES PAGADAS
WITH fechas(fecha) AS (
    VALUES
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
JOIN public.cliente c ON c.ruc = '10425104735'
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Inicial'
WHERE NOT EXISTS (
    SELECT 1 FROM public.venta v
    WHERE v.cliente_id = c.id
      AND v.tipo_venta = 'RENOVACION'
      AND v.fecha_venta = fechas.fecha
);

-- 4. PAGOS HISTORICOS
WITH fechas(fecha) AS (
    VALUES
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
JOIN public.cliente c ON c.ruc = '10425104735'
JOIN public.venta v ON v.cliente_id = c.id
                    AND v.fecha_venta = fechas.fecha
                    AND v.estado_venta = 'PAGADA'
WHERE NOT EXISTS (
    SELECT 1 FROM public.pago px
    WHERE px.venta_id = v.id
      AND px.fecha_pago = fechas.fecha
);

-- 5. SERVICIOS PERIODOS
WITH periodos(fecha_inicio, fecha_fin, estado) AS (
    VALUES
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
       TIMESTAMP '2026-06-01 00:00:00', periodos.estado,
       0, 0, 'Servicio histórico importado desde Excel',
       periodos.fecha_inicio, periodos.fecha_inicio
FROM periodos
JOIN public.cliente c ON c.ruc = '10425104735'
JOIN public.venta v ON v.cliente_id = c.id
                    AND v.fecha_venta = periodos.fecha_inicio
WHERE NOT EXISTS (
    SELECT 1 FROM public.servicio_cliente sc
    WHERE sc.venta_id = v.id
);

-- 6. SERVICIO ACTUAL
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
  AND c.ruc = '10425104735';

-- 7. COBRO SIGUIENTE
UPDATE public.venta v
SET precio_lista = s.precio,
    monto_prorrateado = 0,
    monto_total = s.precio,
    estado_venta = 'PENDIENTE_PAGO',
    observaciones = 'Renovación siguiente: cobro mensual normal desde el día 01',
    fecha_actualizacion = TIMESTAMP '2026-08-01 00:00:00'
FROM public.cliente c
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Inicial'
WHERE v.cliente_id = c.id
  AND v.tipo_venta = 'RENOVACION'
  AND v.estado_venta = 'PENDIENTE_PAGO'
  AND v.fecha_venta = TIMESTAMP '2026-09-01 00:00:00'
  AND c.ruc = '10425104735';

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
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Inicial'
JOIN public.venta v ON v.cliente_id = c.id
                   AND v.fecha_venta = TIMESTAMP '2026-08-01 00:00:00'
                   AND v.estado_venta = 'PAGADA'
WHERE c.ruc = '10425104735'
  AND NOT EXISTS (
      SELECT 1 FROM public.venta pendiente
      WHERE pendiente.cliente_id = c.id
        AND pendiente.tipo_venta = 'RENOVACION'
        AND pendiente.estado_venta = 'PENDIENTE_PAGO'
        AND pendiente.fecha_venta = TIMESTAMP '2026-09-01 00:00:00'
  );

-- 8. ESTADO ACTUAL E HISTORIAL
UPDATE public.cliente
SET estado_id = (SELECT id FROM public.estado_cliente
                 WHERE nombre = 'HABILITADO' AND activo = true LIMIT 1),
    fecha_actualizacion = TIMESTAMP '2026-08-01 00:00:00'
WHERE ruc = '10425104735';

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, NULL, pc.id, NULL,
       'Registro histórico importado desde Excel',
       TIMESTAMP '2026-06-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pc ON pc.nombre = 'POR_COBRAR'
WHERE c.ruc = '10425104735'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Registro histórico importado desde Excel');

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, pc.id, pcap.id, NULL,
       'Pago histórico confirmado desde Excel',
       TIMESTAMP '2026-06-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pc ON pc.nombre = 'POR_COBRAR'
JOIN public.estado_cliente pcap ON pcap.nombre = 'POR_CAPACITAR'
WHERE c.ruc = '10425104735'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Pago histórico confirmado desde Excel');

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, pcap.id, hab.id, NULL,
       'Capacitación histórica confirmada desde Excel',
       TIMESTAMP '2026-06-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pcap ON pcap.nombre = 'POR_CAPACITAR'
JOIN public.estado_cliente hab ON hab.nombre = 'HABILITADO'
WHERE c.ruc = '10425104735'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Capacitación histórica confirmada desde Excel');


-- ============================================================
-- CLIENTE: 10749999271 - GERALDINE VICENTINA GONZALES GAMARRA
-- ============================================================

-- 1. CLIENTE
INSERT INTO public.cliente (
    ruc, usuario_sol, clave_sol_cifrada, razon_social, nombre_comercial,
    direccion, departamento, provincia, distrito, telefono, email,
    nombres, apellidos, dni, telefono_personal, email_personal,
    usuario_admin_facturador, clave_temporal, url_acceso, usuario_wsp,
    estado_id, color_tag_id, entorno_id, activo,
    fecha_registro, fecha_actualizacion
)
VALUES (
    '10749999271',
    '74999927',
    'Ger@l1995',
    'GERALDINE VICENTINA GONZALES GAMARRA',
    'OBSTMEDIC SALUD INTEGRAL',
    'JR. CASTILLA 260 - DISTRITO DE LURIN',
    'LIMA', 'LIMA', 'LURIN',
    '922717723',
    'obstmedicsedelurin@gmail.com',
    NULL, NULL, '74999927',
    '922717723',
    'obstmedicsedelurin@gmail.com',
    'obstmedicsedelurin@gmail.com',
    'obsRMED@#62165',
    'https://obstmedicsaludintegral.cpe.webzary.pe/login',
    NULL,
    (SELECT id FROM public.estado_cliente WHERE nombre = 'HABILITADO' AND activo = true LIMIT 1),
    (SELECT id FROM public.color_tag WHERE codigo = 'Amarillo' AND activo = true LIMIT 1),
    (SELECT id FROM public.entorno WHERE nombre = 'Producción' AND activo = true LIMIT 1),
    true,
    TIMESTAMP '2026-06-01 00:00:00',
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

-- 2. VENTA INICIAL
INSERT INTO public.venta (
    cliente_id, vendedor_id, suscripcion_id, tipo_venta, venta_anterior_id,
    precio_lista, monto_prorrateado, monto_total, estado_venta,
    observaciones, fecha_venta, fecha_actualizacion
)
SELECT c.id, NULL, s.id, 'ALTA', NULL,
       s.precio, 0, s.precio, 'PAGADA',
       'Importación de registro histórico desde Excel',
       TIMESTAMP '2026-06-01 00:00:00', TIMESTAMP '2026-06-01 00:00:00'
FROM public.cliente c
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Emprende'
WHERE c.ruc = '10749999271'
  AND NOT EXISTS (
      SELECT 1 FROM public.venta v
      WHERE v.cliente_id = c.id
        AND v.tipo_venta = 'ALTA'
        AND v.fecha_venta = TIMESTAMP '2026-06-01 00:00:00'
  );

-- 3. RENOVACIONES PAGADAS
WITH fechas(fecha) AS (
    VALUES
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
JOIN public.cliente c ON c.ruc = '10749999271'
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Emprende'
WHERE NOT EXISTS (
    SELECT 1 FROM public.venta v
    WHERE v.cliente_id = c.id
      AND v.tipo_venta = 'RENOVACION'
      AND v.fecha_venta = fechas.fecha
);

-- 4. PAGOS HISTORICOS
WITH fechas(fecha) AS (
    VALUES
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
JOIN public.cliente c ON c.ruc = '10749999271'
JOIN public.venta v ON v.cliente_id = c.id
                    AND v.fecha_venta = fechas.fecha
                    AND v.estado_venta = 'PAGADA'
WHERE NOT EXISTS (
    SELECT 1 FROM public.pago px
    WHERE px.venta_id = v.id
      AND px.fecha_pago = fechas.fecha
);

-- 5. SERVICIOS PERIODOS
WITH periodos(fecha_inicio, fecha_fin, estado) AS (
    VALUES
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
       TIMESTAMP '2026-06-01 00:00:00', periodos.estado,
       0, 0, 'Servicio histórico importado desde Excel',
       periodos.fecha_inicio, periodos.fecha_inicio
FROM periodos
JOIN public.cliente c ON c.ruc = '10749999271'
JOIN public.venta v ON v.cliente_id = c.id
                    AND v.fecha_venta = periodos.fecha_inicio
WHERE NOT EXISTS (
    SELECT 1 FROM public.servicio_cliente sc
    WHERE sc.venta_id = v.id
);

-- 6. SERVICIO ACTUAL
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
  AND c.ruc = '10749999271';

-- 7. COBRO SIGUIENTE
UPDATE public.venta v
SET precio_lista = s.precio,
    monto_prorrateado = 0,
    monto_total = s.precio,
    estado_venta = 'PENDIENTE_PAGO',
    observaciones = 'Renovación siguiente: cobro mensual normal desde el día 01',
    fecha_actualizacion = TIMESTAMP '2026-08-01 00:00:00'
FROM public.cliente c
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Emprende'
WHERE v.cliente_id = c.id
  AND v.tipo_venta = 'RENOVACION'
  AND v.estado_venta = 'PENDIENTE_PAGO'
  AND v.fecha_venta = TIMESTAMP '2026-09-01 00:00:00'
  AND c.ruc = '10749999271';

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
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Emprende'
JOIN public.venta v ON v.cliente_id = c.id
                   AND v.fecha_venta = TIMESTAMP '2026-08-01 00:00:00'
                   AND v.estado_venta = 'PAGADA'
WHERE c.ruc = '10749999271'
  AND NOT EXISTS (
      SELECT 1 FROM public.venta pendiente
      WHERE pendiente.cliente_id = c.id
        AND pendiente.tipo_venta = 'RENOVACION'
        AND pendiente.estado_venta = 'PENDIENTE_PAGO'
        AND pendiente.fecha_venta = TIMESTAMP '2026-09-01 00:00:00'
  );

-- 8. ESTADO ACTUAL E HISTORIAL
UPDATE public.cliente
SET estado_id = (SELECT id FROM public.estado_cliente
                 WHERE nombre = 'HABILITADO' AND activo = true LIMIT 1),
    fecha_actualizacion = TIMESTAMP '2026-08-01 00:00:00'
WHERE ruc = '10749999271';

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, NULL, pc.id, NULL,
       'Registro histórico importado desde Excel',
       TIMESTAMP '2026-06-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pc ON pc.nombre = 'POR_COBRAR'
WHERE c.ruc = '10749999271'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Registro histórico importado desde Excel');

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, pc.id, pcap.id, NULL,
       'Pago histórico confirmado desde Excel',
       TIMESTAMP '2026-06-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pc ON pc.nombre = 'POR_COBRAR'
JOIN public.estado_cliente pcap ON pcap.nombre = 'POR_CAPACITAR'
WHERE c.ruc = '10749999271'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Pago histórico confirmado desde Excel');

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, pcap.id, hab.id, NULL,
       'Capacitación histórica confirmada desde Excel',
       TIMESTAMP '2026-06-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pcap ON pcap.nombre = 'POR_CAPACITAR'
JOIN public.estado_cliente hab ON hab.nombre = 'HABILITADO'
WHERE c.ruc = '10749999271'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Capacitación histórica confirmada desde Excel');


-- ============================================================
-- CLIENTE: 20616023072 - ARENADOS Y SERVICIOS GENERALES ODV INDUSTRIAL E.I.R.L.
-- ============================================================

-- 1. CLIENTE
INSERT INTO public.cliente (
    ruc, usuario_sol, clave_sol_cifrada, razon_social, nombre_comercial,
    direccion, departamento, provincia, distrito, telefono, email,
    nombres, apellidos, dni, telefono_personal, email_personal,
    usuario_admin_facturador, clave_temporal, url_acceso, usuario_wsp,
    estado_id, color_tag_id, entorno_id, activo,
    fecha_registro, fecha_actualizacion
)
VALUES (
    '20616023072',
    '25766207',
    'ODVadm2026',
    'ARENADOS Y SERVICIOS GENERALES ODV INDUSTRIAL E.I.R.L.',
    'ODV INDUSTRIAL',
    'AV. NESTOR GAMBETTA MZA. D6 LOTE. 13 A.H. DANIEL ALCIDES CARRION (CARRET. NESTOR GAMBETA FRANJA RANSA COME) PROV. CONST. DEL CALLAO - PROV. CONST. DEL CALLAO - CALLAO',
    NULL, NULL, NULL,
    '979 829 786',
    NULL,
    NULL, NULL, '25766207',
    '979 829 786',
    NULL,
    'informes@odvindustrial.com',
    'odviNDUS@#35654',
    'https://odvindustrial.cpe.webzary.pe/login',
    NULL,
    (SELECT id FROM public.estado_cliente WHERE nombre = 'HABILITADO' AND activo = true LIMIT 1),
    (SELECT id FROM public.color_tag WHERE codigo = 'Verde' AND activo = true LIMIT 1),
    (SELECT id FROM public.entorno WHERE nombre = 'Producción' AND activo = true LIMIT 1),
    true,
    TIMESTAMP '2026-06-01 00:00:00',
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

-- 2. VENTA INICIAL
INSERT INTO public.venta (
    cliente_id, vendedor_id, suscripcion_id, tipo_venta, venta_anterior_id,
    precio_lista, monto_prorrateado, monto_total, estado_venta,
    observaciones, fecha_venta, fecha_actualizacion
)
SELECT c.id, NULL, s.id, 'ALTA', NULL,
       s.precio, 0, s.precio, 'PAGADA',
       'Importación de registro histórico desde Excel',
       TIMESTAMP '2026-06-01 00:00:00', TIMESTAMP '2026-06-01 00:00:00'
FROM public.cliente c
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Empresarial'
WHERE c.ruc = '20616023072'
  AND NOT EXISTS (
      SELECT 1 FROM public.venta v
      WHERE v.cliente_id = c.id
        AND v.tipo_venta = 'ALTA'
        AND v.fecha_venta = TIMESTAMP '2026-06-01 00:00:00'
  );

-- 3. RENOVACIONES PAGADAS
WITH fechas(fecha) AS (
    VALUES
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
JOIN public.cliente c ON c.ruc = '20616023072'
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Empresarial'
WHERE NOT EXISTS (
    SELECT 1 FROM public.venta v
    WHERE v.cliente_id = c.id
      AND v.tipo_venta = 'RENOVACION'
      AND v.fecha_venta = fechas.fecha
);

-- 4. PAGOS HISTORICOS
WITH fechas(fecha) AS (
    VALUES
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
JOIN public.cliente c ON c.ruc = '20616023072'
JOIN public.venta v ON v.cliente_id = c.id
                    AND v.fecha_venta = fechas.fecha
                    AND v.estado_venta = 'PAGADA'
WHERE NOT EXISTS (
    SELECT 1 FROM public.pago px
    WHERE px.venta_id = v.id
      AND px.fecha_pago = fechas.fecha
);

-- 5. SERVICIOS PERIODOS
WITH periodos(fecha_inicio, fecha_fin, estado) AS (
    VALUES
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
       TIMESTAMP '2026-06-01 00:00:00', periodos.estado,
       0, 0, 'Servicio histórico importado desde Excel',
       periodos.fecha_inicio, periodos.fecha_inicio
FROM periodos
JOIN public.cliente c ON c.ruc = '20616023072'
JOIN public.venta v ON v.cliente_id = c.id
                    AND v.fecha_venta = periodos.fecha_inicio
WHERE NOT EXISTS (
    SELECT 1 FROM public.servicio_cliente sc
    WHERE sc.venta_id = v.id
);

-- 6. SERVICIO ACTUAL
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
  AND c.ruc = '20616023072';

-- 7. COBRO SIGUIENTE
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
  AND c.ruc = '20616023072';

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
WHERE c.ruc = '20616023072'
  AND NOT EXISTS (
      SELECT 1 FROM public.venta pendiente
      WHERE pendiente.cliente_id = c.id
        AND pendiente.tipo_venta = 'RENOVACION'
        AND pendiente.estado_venta = 'PENDIENTE_PAGO'
        AND pendiente.fecha_venta = TIMESTAMP '2026-09-01 00:00:00'
  );

-- 8. ESTADO ACTUAL E HISTORIAL
UPDATE public.cliente
SET estado_id = (SELECT id FROM public.estado_cliente
                 WHERE nombre = 'HABILITADO' AND activo = true LIMIT 1),
    fecha_actualizacion = TIMESTAMP '2026-08-01 00:00:00'
WHERE ruc = '20616023072';

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, NULL, pc.id, NULL,
       'Registro histórico importado desde Excel',
       TIMESTAMP '2026-06-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pc ON pc.nombre = 'POR_COBRAR'
WHERE c.ruc = '20616023072'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Registro histórico importado desde Excel');

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, pc.id, pcap.id, NULL,
       'Pago histórico confirmado desde Excel',
       TIMESTAMP '2026-06-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pc ON pc.nombre = 'POR_COBRAR'
JOIN public.estado_cliente pcap ON pcap.nombre = 'POR_CAPACITAR'
WHERE c.ruc = '20616023072'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Pago histórico confirmado desde Excel');

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, pcap.id, hab.id, NULL,
       'Capacitación histórica confirmada desde Excel',
       TIMESTAMP '2026-06-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pcap ON pcap.nombre = 'POR_CAPACITAR'
JOIN public.estado_cliente hab ON hab.nombre = 'HABILITADO'
WHERE c.ruc = '20616023072'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Capacitación histórica confirmada desde Excel');


-- ============================================================
-- CLIENTE: 20614969050 - M&G INFRAESTRUCTURA Y SERVICIOS EIRL
-- ============================================================

-- 1. CLIENTE
INSERT INTO public.cliente (
    ruc, usuario_sol, clave_sol_cifrada, razon_social, nombre_comercial,
    direccion, departamento, provincia, distrito, telefono, email,
    nombres, apellidos, dni, telefono_personal, email_personal,
    usuario_admin_facturador, clave_temporal, url_acceso, usuario_wsp,
    estado_id, color_tag_id, entorno_id, activo,
    fecha_registro, fecha_actualizacion
)
VALUES (
    '20614969050',
    'INTERNO',
    '46144485',
    'M&G INFRAESTRUCTURA Y SERVICIOS EIRL',
    'M&G INFRAESTRUCTURA Y SERVICIOS EIRL',
    'AV. INAMBARI S/N KM. 0 OTR. MAZUCO (FRENTE AL GRIFO HOROSCOPO)',
    NULL, NULL, NULL,
    '913763898',
    'vickytagq2015@gmail.com',
    NULL, NULL, '46144485',
    '913763898',
    'vickytagq2015@gmail.com',
    'vickytagq2015@gmail.com',
    'mygINFRAES@#95953',
    'https://myginfraestructurayservicios.cpe.webzary.pe/login',
    NULL,
    (SELECT id FROM public.estado_cliente WHERE nombre = 'HABILITADO' AND activo = true LIMIT 1),
    (SELECT id FROM public.color_tag WHERE codigo = 'Amarillo' AND activo = true LIMIT 1),
    (SELECT id FROM public.entorno WHERE nombre = 'Producción' AND activo = true LIMIT 1),
    true,
    TIMESTAMP '2026-06-01 00:00:00',
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

-- 2. VENTA INICIAL
INSERT INTO public.venta (
    cliente_id, vendedor_id, suscripcion_id, tipo_venta, venta_anterior_id,
    precio_lista, monto_prorrateado, monto_total, estado_venta,
    observaciones, fecha_venta, fecha_actualizacion
)
SELECT c.id, NULL, s.id, 'ALTA', NULL,
       s.precio, 0, s.precio, 'PAGADA',
       'Importación de registro histórico desde Excel',
       TIMESTAMP '2026-06-01 00:00:00', TIMESTAMP '2026-06-01 00:00:00'
FROM public.cliente c
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Emprende'
WHERE c.ruc = '20614969050'
  AND NOT EXISTS (
      SELECT 1 FROM public.venta v
      WHERE v.cliente_id = c.id
        AND v.tipo_venta = 'ALTA'
        AND v.fecha_venta = TIMESTAMP '2026-06-01 00:00:00'
  );

-- 3. RENOVACIONES PAGADAS
WITH fechas(fecha) AS (
    VALUES
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
JOIN public.cliente c ON c.ruc = '20614969050'
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Emprende'
WHERE NOT EXISTS (
    SELECT 1 FROM public.venta v
    WHERE v.cliente_id = c.id
      AND v.tipo_venta = 'RENOVACION'
      AND v.fecha_venta = fechas.fecha
);

-- 4. PAGOS HISTORICOS
WITH fechas(fecha) AS (
    VALUES
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
JOIN public.cliente c ON c.ruc = '20614969050'
JOIN public.venta v ON v.cliente_id = c.id
                    AND v.fecha_venta = fechas.fecha
                    AND v.estado_venta = 'PAGADA'
WHERE NOT EXISTS (
    SELECT 1 FROM public.pago px
    WHERE px.venta_id = v.id
      AND px.fecha_pago = fechas.fecha
);

-- 5. SERVICIOS PERIODOS
WITH periodos(fecha_inicio, fecha_fin, estado) AS (
    VALUES
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
       TIMESTAMP '2026-06-01 00:00:00', periodos.estado,
       0, 0, 'Servicio histórico importado desde Excel',
       periodos.fecha_inicio, periodos.fecha_inicio
FROM periodos
JOIN public.cliente c ON c.ruc = '20614969050'
JOIN public.venta v ON v.cliente_id = c.id
                    AND v.fecha_venta = periodos.fecha_inicio
WHERE NOT EXISTS (
    SELECT 1 FROM public.servicio_cliente sc
    WHERE sc.venta_id = v.id
);

-- 6. SERVICIO ACTUAL
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
  AND c.ruc = '20614969050';

-- 7. COBRO SIGUIENTE
UPDATE public.venta v
SET precio_lista = s.precio,
    monto_prorrateado = 0,
    monto_total = s.precio,
    estado_venta = 'PENDIENTE_PAGO',
    observaciones = 'Renovación siguiente: cobro mensual normal desde el día 01',
    fecha_actualizacion = TIMESTAMP '2026-08-01 00:00:00'
FROM public.cliente c
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Emprende'
WHERE v.cliente_id = c.id
  AND v.tipo_venta = 'RENOVACION'
  AND v.estado_venta = 'PENDIENTE_PAGO'
  AND v.fecha_venta = TIMESTAMP '2026-09-01 00:00:00'
  AND c.ruc = '20614969050';

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
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Emprende'
JOIN public.venta v ON v.cliente_id = c.id
                   AND v.fecha_venta = TIMESTAMP '2026-08-01 00:00:00'
                   AND v.estado_venta = 'PAGADA'
WHERE c.ruc = '20614969050'
  AND NOT EXISTS (
      SELECT 1 FROM public.venta pendiente
      WHERE pendiente.cliente_id = c.id
        AND pendiente.tipo_venta = 'RENOVACION'
        AND pendiente.estado_venta = 'PENDIENTE_PAGO'
        AND pendiente.fecha_venta = TIMESTAMP '2026-09-01 00:00:00'
  );

-- 8. ESTADO ACTUAL E HISTORIAL
UPDATE public.cliente
SET estado_id = (SELECT id FROM public.estado_cliente
                 WHERE nombre = 'HABILITADO' AND activo = true LIMIT 1),
    fecha_actualizacion = TIMESTAMP '2026-08-01 00:00:00'
WHERE ruc = '20614969050';

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, NULL, pc.id, NULL,
       'Registro histórico importado desde Excel',
       TIMESTAMP '2026-06-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pc ON pc.nombre = 'POR_COBRAR'
WHERE c.ruc = '20614969050'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Registro histórico importado desde Excel');

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, pc.id, pcap.id, NULL,
       'Pago histórico confirmado desde Excel',
       TIMESTAMP '2026-06-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pc ON pc.nombre = 'POR_COBRAR'
JOIN public.estado_cliente pcap ON pcap.nombre = 'POR_CAPACITAR'
WHERE c.ruc = '20614969050'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Pago histórico confirmado desde Excel');

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, pcap.id, hab.id, NULL,
       'Capacitación histórica confirmada desde Excel',
       TIMESTAMP '2026-06-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pcap ON pcap.nombre = 'POR_CAPACITAR'
JOIN public.estado_cliente hab ON hab.nombre = 'HABILITADO'
WHERE c.ruc = '20614969050'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Capacitación histórica confirmada desde Excel');


-- ============================================================
-- CLIENTE: 10762971611 - MONTALVO SINCA LUCERO MARIANA
-- ============================================================

-- 1. CLIENTE
INSERT INTO public.cliente (
    ruc, usuario_sol, clave_sol_cifrada, razon_social, nombre_comercial,
    direccion, departamento, provincia, distrito, telefono, email,
    nombres, apellidos, dni, telefono_personal, email_personal,
    usuario_admin_facturador, clave_temporal, url_acceso, usuario_wsp,
    estado_id, color_tag_id, entorno_id, activo,
    fecha_registro, fecha_actualizacion
)
VALUES (
    '10762971611',
    'INTERNO',
    '76297161',
    'MONTALVO SINCA LUCERO MARIANA',
    'Vidrieria Santiago',
    'Pampa km 110 - km 108',
    NULL, NULL, NULL,
    '913763898',
    'oscarmontalvo280178@gmail.com',
    NULL, NULL, '76297161',
    '913763898',
    'oscarmontalvo280178@gmail.com',
    'oscarmontalvo280178@gmail.com',
    'vidriERIASA@#58433',
    'https://vidrieriasantiago.cpe.webzary.pe/login',
    NULL,
    (SELECT id FROM public.estado_cliente WHERE nombre = 'HABILITADO' AND activo = true LIMIT 1),
    (SELECT id FROM public.color_tag WHERE codigo = 'Amarillo' AND activo = true LIMIT 1),
    (SELECT id FROM public.entorno WHERE nombre = 'Producción' AND activo = true LIMIT 1),
    true,
    TIMESTAMP '2026-06-01 00:00:00',
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

-- 2. VENTA INICIAL
INSERT INTO public.venta (
    cliente_id, vendedor_id, suscripcion_id, tipo_venta, venta_anterior_id,
    precio_lista, monto_prorrateado, monto_total, estado_venta,
    observaciones, fecha_venta, fecha_actualizacion
)
SELECT c.id, NULL, s.id, 'ALTA', NULL,
       s.precio, 0, s.precio, 'PAGADA',
       'Importación de registro histórico desde Excel',
       TIMESTAMP '2026-06-01 00:00:00', TIMESTAMP '2026-06-01 00:00:00'
FROM public.cliente c
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Emprende'
WHERE c.ruc = '10762971611'
  AND NOT EXISTS (
      SELECT 1 FROM public.venta v
      WHERE v.cliente_id = c.id
        AND v.tipo_venta = 'ALTA'
        AND v.fecha_venta = TIMESTAMP '2026-06-01 00:00:00'
  );

-- 3. RENOVACIONES PAGADAS
WITH fechas(fecha) AS (
    VALUES
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
JOIN public.cliente c ON c.ruc = '10762971611'
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Emprende'
WHERE NOT EXISTS (
    SELECT 1 FROM public.venta v
    WHERE v.cliente_id = c.id
      AND v.tipo_venta = 'RENOVACION'
      AND v.fecha_venta = fechas.fecha
);

-- 4. PAGOS HISTORICOS
WITH fechas(fecha) AS (
    VALUES
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
JOIN public.cliente c ON c.ruc = '10762971611'
JOIN public.venta v ON v.cliente_id = c.id
                    AND v.fecha_venta = fechas.fecha
                    AND v.estado_venta = 'PAGADA'
WHERE NOT EXISTS (
    SELECT 1 FROM public.pago px
    WHERE px.venta_id = v.id
      AND px.fecha_pago = fechas.fecha
);

-- 5. SERVICIOS PERIODOS
WITH periodos(fecha_inicio, fecha_fin, estado) AS (
    VALUES
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
       TIMESTAMP '2026-06-01 00:00:00', periodos.estado,
       0, 0, 'Servicio histórico importado desde Excel',
       periodos.fecha_inicio, periodos.fecha_inicio
FROM periodos
JOIN public.cliente c ON c.ruc = '10762971611'
JOIN public.venta v ON v.cliente_id = c.id
                    AND v.fecha_venta = periodos.fecha_inicio
WHERE NOT EXISTS (
    SELECT 1 FROM public.servicio_cliente sc
    WHERE sc.venta_id = v.id
);

-- 6. SERVICIO ACTUAL
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
  AND c.ruc = '10762971611';

-- 7. COBRO SIGUIENTE
UPDATE public.venta v
SET precio_lista = s.precio,
    monto_prorrateado = 0,
    monto_total = s.precio,
    estado_venta = 'PENDIENTE_PAGO',
    observaciones = 'Renovación siguiente: cobro mensual normal desde el día 01',
    fecha_actualizacion = TIMESTAMP '2026-08-01 00:00:00'
FROM public.cliente c
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Emprende'
WHERE v.cliente_id = c.id
  AND v.tipo_venta = 'RENOVACION'
  AND v.estado_venta = 'PENDIENTE_PAGO'
  AND v.fecha_venta = TIMESTAMP '2026-09-01 00:00:00'
  AND c.ruc = '10762971611';

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
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Emprende'
JOIN public.venta v ON v.cliente_id = c.id
                   AND v.fecha_venta = TIMESTAMP '2026-08-01 00:00:00'
                   AND v.estado_venta = 'PAGADA'
WHERE c.ruc = '10762971611'
  AND NOT EXISTS (
      SELECT 1 FROM public.venta pendiente
      WHERE pendiente.cliente_id = c.id
        AND pendiente.tipo_venta = 'RENOVACION'
        AND pendiente.estado_venta = 'PENDIENTE_PAGO'
        AND pendiente.fecha_venta = TIMESTAMP '2026-09-01 00:00:00'
  );

-- 8. ESTADO ACTUAL E HISTORIAL
UPDATE public.cliente
SET estado_id = (SELECT id FROM public.estado_cliente
                 WHERE nombre = 'HABILITADO' AND activo = true LIMIT 1),
    fecha_actualizacion = TIMESTAMP '2026-08-01 00:00:00'
WHERE ruc = '10762971611';

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, NULL, pc.id, NULL,
       'Registro histórico importado desde Excel',
       TIMESTAMP '2026-06-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pc ON pc.nombre = 'POR_COBRAR'
WHERE c.ruc = '10762971611'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Registro histórico importado desde Excel');

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, pc.id, pcap.id, NULL,
       'Pago histórico confirmado desde Excel',
       TIMESTAMP '2026-06-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pc ON pc.nombre = 'POR_COBRAR'
JOIN public.estado_cliente pcap ON pcap.nombre = 'POR_CAPACITAR'
WHERE c.ruc = '10762971611'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Pago histórico confirmado desde Excel');

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, pcap.id, hab.id, NULL,
       'Capacitación histórica confirmada desde Excel',
       TIMESTAMP '2026-06-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pcap ON pcap.nombre = 'POR_CAPACITAR'
JOIN public.estado_cliente hab ON hab.nombre = 'HABILITADO'
WHERE c.ruc = '10762971611'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Capacitación histórica confirmada desde Excel');


-- ============================================================
-- CLIENTE: 20611528745 - Makuña market
-- ============================================================

-- 1. CLIENTE
INSERT INTO public.cliente (
    ruc, usuario_sol, clave_sol_cifrada, razon_social, nombre_comercial,
    direccion, departamento, provincia, distrito, telefono, email,
    nombres, apellidos, dni, telefono_personal, email_personal,
    usuario_admin_facturador, clave_temporal, url_acceso, usuario_wsp,
    estado_id, color_tag_id, entorno_id, activo,
    fecha_registro, fecha_actualizacion
)
VALUES (
    '20611528745',
    '71420111',
    'pbd3cF947i$',
    'Makuña market',
    'Makuña',
    'Av.manuel prado 302 Junín',
    'JUNIN', 'JUNIN', 'JUNIN',
    '969646619 / 983 734 041',
    'makunamarket@gmail.com',
    NULL, NULL, '71420111',
    '969646619 / 983 734 041',
    'makunamarket@gmail.com',
    'makunamarket@gmail.com',
    'makUNA@#45613',
    'https://makunamarket.cpe.webzary.pe/login',
    NULL,
    (SELECT id FROM public.estado_cliente WHERE nombre = 'HABILITADO' AND activo = true LIMIT 1),
    (SELECT id FROM public.color_tag WHERE codigo = 'Verde' AND activo = true LIMIT 1),
    (SELECT id FROM public.entorno WHERE nombre = 'Producción' AND activo = true LIMIT 1),
    true,
    TIMESTAMP '2026-06-01 00:00:00',
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

-- 2. VENTA INICIAL
INSERT INTO public.venta (
    cliente_id, vendedor_id, suscripcion_id, tipo_venta, venta_anterior_id,
    precio_lista, monto_prorrateado, monto_total, estado_venta,
    observaciones, fecha_venta, fecha_actualizacion
)
SELECT c.id, NULL, s.id, 'ALTA', NULL,
       s.precio, 0, s.precio, 'PAGADA',
       'Importación de registro histórico desde Excel',
       TIMESTAMP '2026-06-01 00:00:00', TIMESTAMP '2026-06-01 00:00:00'
FROM public.cliente c
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Inicial'
WHERE c.ruc = '20611528745'
  AND NOT EXISTS (
      SELECT 1 FROM public.venta v
      WHERE v.cliente_id = c.id
        AND v.tipo_venta = 'ALTA'
        AND v.fecha_venta = TIMESTAMP '2026-06-01 00:00:00'
  );

-- 3. RENOVACIONES PAGADAS
WITH fechas(fecha) AS (
    VALUES
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
JOIN public.cliente c ON c.ruc = '20611528745'
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Inicial'
WHERE NOT EXISTS (
    SELECT 1 FROM public.venta v
    WHERE v.cliente_id = c.id
      AND v.tipo_venta = 'RENOVACION'
      AND v.fecha_venta = fechas.fecha
);

-- 4. PAGOS HISTORICOS
WITH fechas(fecha) AS (
    VALUES
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
JOIN public.cliente c ON c.ruc = '20611528745'
JOIN public.venta v ON v.cliente_id = c.id
                    AND v.fecha_venta = fechas.fecha
                    AND v.estado_venta = 'PAGADA'
WHERE NOT EXISTS (
    SELECT 1 FROM public.pago px
    WHERE px.venta_id = v.id
      AND px.fecha_pago = fechas.fecha
);

-- 5. SERVICIOS PERIODOS
WITH periodos(fecha_inicio, fecha_fin, estado) AS (
    VALUES
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
       TIMESTAMP '2026-06-01 00:00:00', periodos.estado,
       0, 0, 'Servicio histórico importado desde Excel',
       periodos.fecha_inicio, periodos.fecha_inicio
FROM periodos
JOIN public.cliente c ON c.ruc = '20611528745'
JOIN public.venta v ON v.cliente_id = c.id
                    AND v.fecha_venta = periodos.fecha_inicio
WHERE NOT EXISTS (
    SELECT 1 FROM public.servicio_cliente sc
    WHERE sc.venta_id = v.id
);

-- 6. SERVICIO ACTUAL
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
  AND c.ruc = '20611528745';

-- 7. COBRO SIGUIENTE
UPDATE public.venta v
SET precio_lista = s.precio,
    monto_prorrateado = 0,
    monto_total = s.precio,
    estado_venta = 'PENDIENTE_PAGO',
    observaciones = 'Renovación siguiente: cobro mensual normal desde el día 01',
    fecha_actualizacion = TIMESTAMP '2026-08-01 00:00:00'
FROM public.cliente c
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Inicial'
WHERE v.cliente_id = c.id
  AND v.tipo_venta = 'RENOVACION'
  AND v.estado_venta = 'PENDIENTE_PAGO'
  AND v.fecha_venta = TIMESTAMP '2026-09-01 00:00:00'
  AND c.ruc = '20611528745';

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
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Inicial'
JOIN public.venta v ON v.cliente_id = c.id
                   AND v.fecha_venta = TIMESTAMP '2026-08-01 00:00:00'
                   AND v.estado_venta = 'PAGADA'
WHERE c.ruc = '20611528745'
  AND NOT EXISTS (
      SELECT 1 FROM public.venta pendiente
      WHERE pendiente.cliente_id = c.id
        AND pendiente.tipo_venta = 'RENOVACION'
        AND pendiente.estado_venta = 'PENDIENTE_PAGO'
        AND pendiente.fecha_venta = TIMESTAMP '2026-09-01 00:00:00'
  );

-- 8. ESTADO ACTUAL E HISTORIAL
UPDATE public.cliente
SET estado_id = (SELECT id FROM public.estado_cliente
                 WHERE nombre = 'HABILITADO' AND activo = true LIMIT 1),
    fecha_actualizacion = TIMESTAMP '2026-08-01 00:00:00'
WHERE ruc = '20611528745';

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, NULL, pc.id, NULL,
       'Registro histórico importado desde Excel',
       TIMESTAMP '2026-06-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pc ON pc.nombre = 'POR_COBRAR'
WHERE c.ruc = '20611528745'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Registro histórico importado desde Excel');

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, pc.id, pcap.id, NULL,
       'Pago histórico confirmado desde Excel',
       TIMESTAMP '2026-06-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pc ON pc.nombre = 'POR_COBRAR'
JOIN public.estado_cliente pcap ON pcap.nombre = 'POR_CAPACITAR'
WHERE c.ruc = '20611528745'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Pago histórico confirmado desde Excel');

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, pcap.id, hab.id, NULL,
       'Capacitación histórica confirmada desde Excel',
       TIMESTAMP '2026-06-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pcap ON pcap.nombre = 'POR_CAPACITAR'
JOIN public.estado_cliente hab ON hab.nombre = 'HABILITADO'
WHERE c.ruc = '20611528745'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Capacitación histórica confirmada desde Excel');


-- ============================================================
-- CLIENTE: 20613354949 - SOIR IMPORT E.I.R.L.
-- ============================================================

-- 1. CLIENTE
INSERT INTO public.cliente (
    ruc, usuario_sol, clave_sol_cifrada, razon_social, nombre_comercial,
    direccion, departamento, provincia, distrito, telefono, email,
    nombres, apellidos, dni, telefono_personal, email_personal,
    usuario_admin_facturador, clave_temporal, url_acceso, usuario_wsp,
    estado_id, color_tag_id, entorno_id, activo,
    fecha_registro, fecha_actualizacion
)
VALUES (
    '20613354949',
    NULL,
    NULL,
    'SOIR IMPORT E.I.R.L.',
    NULL,
    'mz ñ lote 11 urb.san isidro ii etapa 3er piso',
    NULL, NULL, NULL,
    '903289922',
    'soir.import@gmail.com',
    NULL, NULL, NULL,
    '903289922',
    'soir.import@gmail.com',
    NULL,
    NULL,
    'http://soirimport.cpe.webzary.pe',
    NULL,
    (SELECT id FROM public.estado_cliente WHERE nombre = 'HABILITADO' AND activo = true LIMIT 1),
    (SELECT id FROM public.color_tag WHERE codigo = 'Verde' AND activo = true LIMIT 1),
    (SELECT id FROM public.entorno WHERE nombre = 'Producción' AND activo = true LIMIT 1),
    true,
    TIMESTAMP '2026-04-01 00:00:00',
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

-- 2. VENTA INICIAL
INSERT INTO public.venta (
    cliente_id, vendedor_id, suscripcion_id, tipo_venta, venta_anterior_id,
    precio_lista, monto_prorrateado, monto_total, estado_venta,
    observaciones, fecha_venta, fecha_actualizacion
)
SELECT c.id, NULL, s.id, 'ALTA', NULL,
       s.precio, 0, s.precio, 'PAGADA',
       'Importación de registro histórico desde Excel',
       TIMESTAMP '2026-04-01 00:00:00', TIMESTAMP '2026-04-01 00:00:00'
FROM public.cliente c
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Emprende'
WHERE c.ruc = '20613354949'
  AND NOT EXISTS (
      SELECT 1 FROM public.venta v
      WHERE v.cliente_id = c.id
        AND v.tipo_venta = 'ALTA'
        AND v.fecha_venta = TIMESTAMP '2026-04-01 00:00:00'
  );

-- 3. RENOVACIONES PAGADAS
WITH fechas(fecha) AS (
    VALUES
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
JOIN public.cliente c ON c.ruc = '20613354949'
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Emprende'
WHERE NOT EXISTS (
    SELECT 1 FROM public.venta v
    WHERE v.cliente_id = c.id
      AND v.tipo_venta = 'RENOVACION'
      AND v.fecha_venta = fechas.fecha
);

-- 4. PAGOS HISTORICOS
WITH fechas(fecha) AS (
    VALUES
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
JOIN public.cliente c ON c.ruc = '20613354949'
JOIN public.venta v ON v.cliente_id = c.id
                    AND v.fecha_venta = fechas.fecha
                    AND v.estado_venta = 'PAGADA'
WHERE NOT EXISTS (
    SELECT 1 FROM public.pago px
    WHERE px.venta_id = v.id
      AND px.fecha_pago = fechas.fecha
);

-- 5. SERVICIOS PERIODOS
WITH periodos(fecha_inicio, fecha_fin, estado) AS (
    VALUES
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
       TIMESTAMP '2026-04-01 00:00:00', periodos.estado,
       0, 0, 'Servicio histórico importado desde Excel',
       periodos.fecha_inicio, periodos.fecha_inicio
FROM periodos
JOIN public.cliente c ON c.ruc = '20613354949'
JOIN public.venta v ON v.cliente_id = c.id
                    AND v.fecha_venta = periodos.fecha_inicio
WHERE NOT EXISTS (
    SELECT 1 FROM public.servicio_cliente sc
    WHERE sc.venta_id = v.id
);

-- 6. SERVICIO ACTUAL
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
  AND c.ruc = '20613354949';

-- 7. COBRO SIGUIENTE
UPDATE public.venta v
SET precio_lista = s.precio,
    monto_prorrateado = 0,
    monto_total = s.precio,
    estado_venta = 'PENDIENTE_PAGO',
    observaciones = 'Renovación siguiente: cobro mensual normal desde el día 01',
    fecha_actualizacion = TIMESTAMP '2026-08-01 00:00:00'
FROM public.cliente c
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Emprende'
WHERE v.cliente_id = c.id
  AND v.tipo_venta = 'RENOVACION'
  AND v.estado_venta = 'PENDIENTE_PAGO'
  AND v.fecha_venta = TIMESTAMP '2026-09-01 00:00:00'
  AND c.ruc = '20613354949';

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
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Emprende'
JOIN public.venta v ON v.cliente_id = c.id
                   AND v.fecha_venta = TIMESTAMP '2026-08-01 00:00:00'
                   AND v.estado_venta = 'PAGADA'
WHERE c.ruc = '20613354949'
  AND NOT EXISTS (
      SELECT 1 FROM public.venta pendiente
      WHERE pendiente.cliente_id = c.id
        AND pendiente.tipo_venta = 'RENOVACION'
        AND pendiente.estado_venta = 'PENDIENTE_PAGO'
        AND pendiente.fecha_venta = TIMESTAMP '2026-09-01 00:00:00'
  );

-- 8. ESTADO ACTUAL E HISTORIAL
UPDATE public.cliente
SET estado_id = (SELECT id FROM public.estado_cliente
                 WHERE nombre = 'HABILITADO' AND activo = true LIMIT 1),
    fecha_actualizacion = TIMESTAMP '2026-08-01 00:00:00'
WHERE ruc = '20613354949';

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, NULL, pc.id, NULL,
       'Registro histórico importado desde Excel',
       TIMESTAMP '2026-04-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pc ON pc.nombre = 'POR_COBRAR'
WHERE c.ruc = '20613354949'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Registro histórico importado desde Excel');

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, pc.id, pcap.id, NULL,
       'Pago histórico confirmado desde Excel',
       TIMESTAMP '2026-04-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pc ON pc.nombre = 'POR_COBRAR'
JOIN public.estado_cliente pcap ON pcap.nombre = 'POR_CAPACITAR'
WHERE c.ruc = '20613354949'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Pago histórico confirmado desde Excel');

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, pcap.id, hab.id, NULL,
       'Capacitación histórica confirmada desde Excel',
       TIMESTAMP '2026-04-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pcap ON pcap.nombre = 'POR_CAPACITAR'
JOIN public.estado_cliente hab ON hab.nombre = 'HABILITADO'
WHERE c.ruc = '20613354949'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Capacitación histórica confirmada desde Excel');


-- ============================================================
-- CLIENTE: 20616050002 - MANUFARMA E.I.R.L
-- ============================================================

-- 1. CLIENTE
INSERT INTO public.cliente (
    ruc, usuario_sol, clave_sol_cifrada, razon_social, nombre_comercial,
    direccion, departamento, provincia, distrito, telefono, email,
    nombres, apellidos, dni, telefono_personal, email_personal,
    usuario_admin_facturador, clave_temporal, url_acceso, usuario_wsp,
    estado_id, color_tag_id, entorno_id, activo,
    fecha_registro, fecha_actualizacion
)
VALUES (
    '20616050002',
    'TONNIMAS',
    'misilynos',
    'MANUFARMA E.I.R.L',
    'MANUFARMA',
    'HUANUCO - HUANUCO- AMARILIS',
    'HUANUCO', 'HUANUCO', 'AMARILIS',
    '917052556',
    'ortegarojasmary5@gmail.com',
    NULL, NULL, '71609968',
    '917052556',
    'ortegarojasmary5@gmail.com',
    'ortegarojasmary5@gmail.com',
    'manuFARM@#9853',
    'https://manufarma.cpe.webzary.pe/login',
    NULL,
    (SELECT id FROM public.estado_cliente WHERE nombre = 'HABILITADO' AND activo = true LIMIT 1),
    (SELECT id FROM public.color_tag WHERE codigo = 'Amarillo' AND activo = true LIMIT 1),
    (SELECT id FROM public.entorno WHERE nombre = 'Producción' AND activo = true LIMIT 1),
    true,
    TIMESTAMP '2026-08-01 00:00:00',
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

-- 2. VENTA INICIAL
INSERT INTO public.venta (
    cliente_id, vendedor_id, suscripcion_id, tipo_venta, venta_anterior_id,
    precio_lista, monto_prorrateado, monto_total, estado_venta,
    observaciones, fecha_venta, fecha_actualizacion
)
SELECT c.id, NULL, s.id, 'ALTA', NULL,
       s.precio, 0, s.precio, 'PAGADA',
       'Importación de registro histórico desde Excel',
       TIMESTAMP '2026-08-01 00:00:00', TIMESTAMP '2026-08-01 00:00:00'
FROM public.cliente c
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Inicial'
WHERE c.ruc = '20616050002'
  AND NOT EXISTS (
      SELECT 1 FROM public.venta v
      WHERE v.cliente_id = c.id
        AND v.tipo_venta = 'ALTA'
        AND v.fecha_venta = TIMESTAMP '2026-08-01 00:00:00'
  );

-- 4. PAGOS HISTORICOS
WITH fechas(fecha) AS (
    VALUES
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
JOIN public.cliente c ON c.ruc = '20616050002'
JOIN public.venta v ON v.cliente_id = c.id
                    AND v.fecha_venta = fechas.fecha
                    AND v.estado_venta = 'PAGADA'
WHERE NOT EXISTS (
    SELECT 1 FROM public.pago px
    WHERE px.venta_id = v.id
      AND px.fecha_pago = fechas.fecha
);

-- 5. SERVICIOS PERIODOS
WITH periodos(fecha_inicio, fecha_fin, estado) AS (
    VALUES
        (TIMESTAMP '2026-08-01 00:00:00', TIMESTAMP '2026-09-01 00:00:00', 'ACTIVO')
)
INSERT INTO public.servicio_cliente (
    cliente_id, venta_id, fecha_inicio, fecha_fin, fecha_capacitacion,
    estado, monto_prorrateo, dias_prorrateados, observaciones,
    fecha_creacion, fecha_actualizacion
)
SELECT c.id, v.id, periodos.fecha_inicio, periodos.fecha_fin,
       TIMESTAMP '2026-08-01 00:00:00', periodos.estado,
       0, 0, 'Servicio histórico importado desde Excel',
       periodos.fecha_inicio, periodos.fecha_inicio
FROM periodos
JOIN public.cliente c ON c.ruc = '20616050002'
JOIN public.venta v ON v.cliente_id = c.id
                    AND v.fecha_venta = periodos.fecha_inicio
WHERE NOT EXISTS (
    SELECT 1 FROM public.servicio_cliente sc
    WHERE sc.venta_id = v.id
);

-- 6. SERVICIO ACTUAL
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
  AND c.ruc = '20616050002';

-- 7. COBRO SIGUIENTE
UPDATE public.venta v
SET precio_lista = s.precio,
    monto_prorrateado = 0,
    monto_total = s.precio,
    estado_venta = 'PENDIENTE_PAGO',
    observaciones = 'Renovación siguiente: cobro mensual normal desde el día 01',
    fecha_actualizacion = TIMESTAMP '2026-08-01 00:00:00'
FROM public.cliente c
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Inicial'
WHERE v.cliente_id = c.id
  AND v.tipo_venta = 'RENOVACION'
  AND v.estado_venta = 'PENDIENTE_PAGO'
  AND v.fecha_venta = TIMESTAMP '2026-09-01 00:00:00'
  AND c.ruc = '20616050002';

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
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Inicial'
JOIN public.venta v ON v.cliente_id = c.id
                   AND v.fecha_venta = TIMESTAMP '2026-08-01 00:00:00'
                   AND v.estado_venta = 'PAGADA'
WHERE c.ruc = '20616050002'
  AND NOT EXISTS (
      SELECT 1 FROM public.venta pendiente
      WHERE pendiente.cliente_id = c.id
        AND pendiente.tipo_venta = 'RENOVACION'
        AND pendiente.estado_venta = 'PENDIENTE_PAGO'
        AND pendiente.fecha_venta = TIMESTAMP '2026-09-01 00:00:00'
  );

-- 8. ESTADO ACTUAL E HISTORIAL
UPDATE public.cliente
SET estado_id = (SELECT id FROM public.estado_cliente
                 WHERE nombre = 'HABILITADO' AND activo = true LIMIT 1),
    fecha_actualizacion = TIMESTAMP '2026-08-01 00:00:00'
WHERE ruc = '20616050002';

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, NULL, pc.id, NULL,
       'Registro histórico importado desde Excel',
       TIMESTAMP '2026-08-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pc ON pc.nombre = 'POR_COBRAR'
WHERE c.ruc = '20616050002'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Registro histórico importado desde Excel');

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, pc.id, pcap.id, NULL,
       'Pago histórico confirmado desde Excel',
       TIMESTAMP '2026-08-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pc ON pc.nombre = 'POR_COBRAR'
JOIN public.estado_cliente pcap ON pcap.nombre = 'POR_CAPACITAR'
WHERE c.ruc = '20616050002'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Pago histórico confirmado desde Excel');

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, pcap.id, hab.id, NULL,
       'Capacitación histórica confirmada desde Excel',
       TIMESTAMP '2026-08-01 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pcap ON pcap.nombre = 'POR_CAPACITAR'
JOIN public.estado_cliente hab ON hab.nombre = 'HABILITADO'
WHERE c.ruc = '20616050002'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Capacitación histórica confirmada desde Excel');


-- ============================================================
-- CLIENTE: 10422152844 - VALER MENDOZA JOSE LUIS
-- ============================================================

-- 1. CLIENTE
INSERT INTO public.cliente (
    ruc, usuario_sol, clave_sol_cifrada, razon_social, nombre_comercial,
    direccion, departamento, provincia, distrito, telefono, email,
    nombres, apellidos, dni, telefono_personal, email_personal,
    usuario_admin_facturador, clave_temporal, url_acceso, usuario_wsp,
    estado_id, color_tag_id, entorno_id, activo,
    fecha_registro, fecha_actualizacion
)
VALUES (
    '10422152844',
    '42215284',
    'Jose05',
    'VALER MENDOZA JOSE LUIS',
    'BAZAR PIÑATERÍA "JOSUE"',
    'Jr. Ferreñafe 226-Lima-Lima',
    'LIMA', 'LIMA', 'LIMA',
    '924002776',
    'joseluisvalermendoza@gmail.com',
    NULL, NULL, '42215284',
    '924002776',
    'joseluisvalermendoza@gmail.com',
    'joseluisvalermendoza@gmail.com',
    '- bazaRPINA@#546398',
    'https://bazarpinateriajosue.cpe.webzary.pe/login',
    NULL,
    (SELECT id FROM public.estado_cliente WHERE nombre = 'HABILITADO' AND activo = true LIMIT 1),
    (SELECT id FROM public.color_tag WHERE codigo = 'Amarillo' AND activo = true LIMIT 1),
    (SELECT id FROM public.entorno WHERE nombre = 'Producción' AND activo = true LIMIT 1),
    true,
    TIMESTAMP '2026-08-04 00:00:00',
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

-- 2. VENTA INICIAL
INSERT INTO public.venta (
    cliente_id, vendedor_id, suscripcion_id, tipo_venta, venta_anterior_id,
    precio_lista, monto_prorrateado, monto_total, estado_venta,
    observaciones, fecha_venta, fecha_actualizacion
)
SELECT c.id, NULL, s.id, 'ALTA', NULL,
       s.precio, 0, s.precio, 'PAGADA',
       'Importación de registro histórico desde Excel',
       TIMESTAMP '2026-08-01 00:00:00', TIMESTAMP '2026-08-01 00:00:00'
FROM public.cliente c
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Inicial'
WHERE c.ruc = '10422152844'
  AND NOT EXISTS (
      SELECT 1 FROM public.venta v
      WHERE v.cliente_id = c.id
        AND v.tipo_venta = 'ALTA'
        AND v.fecha_venta = TIMESTAMP '2026-08-01 00:00:00'
  );

-- 4. PAGOS HISTORICOS
WITH fechas(fecha) AS (
    VALUES
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
JOIN public.cliente c ON c.ruc = '10422152844'
JOIN public.venta v ON v.cliente_id = c.id
                    AND v.fecha_venta = fechas.fecha
                    AND v.estado_venta = 'PAGADA'
WHERE NOT EXISTS (
    SELECT 1 FROM public.pago px
    WHERE px.venta_id = v.id
      AND px.fecha_pago = fechas.fecha
);

-- 5. SERVICIOS PERIODOS
WITH periodos(fecha_inicio, fecha_fin, estado) AS (
    VALUES
        (TIMESTAMP '2026-08-01 00:00:00', TIMESTAMP '2026-09-01 00:00:00', 'ACTIVO')
)
INSERT INTO public.servicio_cliente (
    cliente_id, venta_id, fecha_inicio, fecha_fin, fecha_capacitacion,
    estado, monto_prorrateo, dias_prorrateados, observaciones,
    fecha_creacion, fecha_actualizacion
)
SELECT c.id, v.id, periodos.fecha_inicio, periodos.fecha_fin,
       TIMESTAMP '2026-08-04 00:00:00', periodos.estado,
       0, 0, 'Servicio histórico importado desde Excel',
       periodos.fecha_inicio, periodos.fecha_inicio
FROM periodos
JOIN public.cliente c ON c.ruc = '10422152844'
JOIN public.venta v ON v.cliente_id = c.id
                    AND v.fecha_venta = periodos.fecha_inicio
WHERE NOT EXISTS (
    SELECT 1 FROM public.servicio_cliente sc
    WHERE sc.venta_id = v.id
);

-- 6. SERVICIO ACTUAL
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
  AND c.ruc = '10422152844';

-- 7. COBRO SIGUIENTE
UPDATE public.venta v
SET precio_lista = s.precio,
    monto_prorrateado = 0,
    monto_total = s.precio,
    estado_venta = 'PENDIENTE_PAGO',
    observaciones = 'Renovación siguiente: cobro mensual normal desde el día 01',
    fecha_actualizacion = TIMESTAMP '2026-08-01 00:00:00'
FROM public.cliente c
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Inicial'
WHERE v.cliente_id = c.id
  AND v.tipo_venta = 'RENOVACION'
  AND v.estado_venta = 'PENDIENTE_PAGO'
  AND v.fecha_venta = TIMESTAMP '2026-09-01 00:00:00'
  AND c.ruc = '10422152844';

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
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = 'Plan Inicial'
JOIN public.venta v ON v.cliente_id = c.id
                   AND v.fecha_venta = TIMESTAMP '2026-08-01 00:00:00'
                   AND v.estado_venta = 'PAGADA'
WHERE c.ruc = '10422152844'
  AND NOT EXISTS (
      SELECT 1 FROM public.venta pendiente
      WHERE pendiente.cliente_id = c.id
        AND pendiente.tipo_venta = 'RENOVACION'
        AND pendiente.estado_venta = 'PENDIENTE_PAGO'
        AND pendiente.fecha_venta = TIMESTAMP '2026-09-01 00:00:00'
  );

-- 8. ESTADO ACTUAL E HISTORIAL
UPDATE public.cliente
SET estado_id = (SELECT id FROM public.estado_cliente
                 WHERE nombre = 'HABILITADO' AND activo = true LIMIT 1),
    fecha_actualizacion = TIMESTAMP '2026-08-01 00:00:00'
WHERE ruc = '10422152844';

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, NULL, pc.id, NULL,
       'Registro histórico importado desde Excel',
       TIMESTAMP '2026-08-04 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pc ON pc.nombre = 'POR_COBRAR'
WHERE c.ruc = '10422152844'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Registro histórico importado desde Excel');

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, pc.id, pcap.id, NULL,
       'Pago histórico confirmado desde Excel',
       TIMESTAMP '2026-08-04 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pc ON pc.nombre = 'POR_COBRAR'
JOIN public.estado_cliente pcap ON pcap.nombre = 'POR_CAPACITAR'
WHERE c.ruc = '10422152844'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Pago histórico confirmado desde Excel');

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, pcap.id, hab.id, NULL,
       'Capacitación histórica confirmada desde Excel',
       TIMESTAMP '2026-08-04 00:00:00'
FROM public.cliente c
JOIN public.estado_cliente pcap ON pcap.nombre = 'POR_CAPACITAR'
JOIN public.estado_cliente hab ON hab.nombre = 'HABILITADO'
WHERE c.ruc = '10422152844'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Capacitación histórica confirmada desde Excel');
