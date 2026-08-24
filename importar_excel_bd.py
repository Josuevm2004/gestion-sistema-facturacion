"""
=============================================================================
SCRIPT DE IMPORTACIÓN AUTOMÁTICA: EXCEL A BASE DE DATOS
Sistema de Facturación - Modelo de 9 Bloques con Prorrateo Automático
=============================================================================
"""

import sys
import os
import calendar
from datetime import datetime, date
import pandas as pd

# =============================================================================
# 1. CONFIGURACIÓN DE CONEXIÓN A LA BASE DE DATOS
# (Pega aquí las credenciales de tu base de datos)
# =============================================================================
DB_CONFIG = {
    "engine": "postgresql",    # "postgresql" / "cockroachdb" o "mysql"
    "host": "localhost",       # Host (ej. aws / cloud / localhost)
    "port": 26257,             # 5432 (PostgreSQL) o 26257 (CockroachDB) o 3306 (MySQL)
    "user": "root",            # Usuario de la BD
    "password": "",            # Contraseña de la BD
    "database": "sistema_facturacion", # Nombre de la base de datos
    "sslmode": "prefer"        # "require", "verify-full" o "disable"
}

# Nombre del archivo Excel de entrada
EXCEL_FILE = "plantilla_importacion_clientes.xlsx"
OUTPUT_SQL_FILE = "importacion_clientes.sql"

# Mapa de columnas de meses en orden cronológico a fechas (Año, Mes)
MAPA_MESES = [
    ("JULIO", (2025, 7)),
    ("AGOSTO", (2025, 8)),
    ("SEPTIEMBRE", (2025, 9)),
    ("OCTUBRE", (2025, 10)),
    ("NOVIEMBRE", (2025, 11)),
    ("DICIEMBRE", (2025, 12)),
    ("enero 2026", (2026, 1)),
    ("FEBRERO", (2026, 2)),
    ("MARZO", (2026, 3)),
    ("ABRIL", (2026, 4)),
    ("MAYO", (2026, 5)),
    ("JUNIO", (2026, 6)),
    ("JULIO.1", (2026, 7)),     # Segundo Julio en el Excel (2026)
    ("AGOSTO.1", (2026, 8)),    # Segundo Agosto en el Excel (2026)
]


def sql_val(val):
    """Convierte cualquier valor a formato seguro SQL (o NULL)."""
    if val is None or pd.isna(val):
        return "NULL"
    val_str = str(val).strip()
    if val_str == "" or val_str.upper() in ["NONE", "NAN", "NULL"]:
        return "NULL"
    val_str = val_str.replace("'", "''")
    return f"'{val_str}'"


def parsear_fecha(val):
    """Parsea una fecha de celda a objeto datetime."""
    if val is None or pd.isna(val):
        return None
    if isinstance(val, (datetime, date)):
        return datetime(val.year, val.month, val.day)
    val_str = str(val).strip()
    for fmt in ["%Y-%m-%d", "%d/%m/%Y", "%Y/%m/%d", "%d-%m-%Y"]:
        try:
            return datetime.strptime(val_str, fmt)
        except ValueError:
            pass
    return None


def calcular_prorrateo_sistema(precio_plan, fecha_cobro):
    """
    Calcula el prorrateo exacto según ProrrateoCalculatorUtil.java:
    M_cobro = precio_plan - ((precio_plan / dias_totales) * (dia_pago - 1))
    """
    dias_totales = calendar.monthrange(fecha_cobro.year, fecha_cobro.month)[1]
    dia_pago = fecha_cobro.day
    dias_no_consumidos = max(0, dia_pago - 1)
    
    precio_diario = precio_plan / dias_totales
    descuento = round(precio_diario * dias_no_consumidos, 2)
    monto_cobro = round(precio_plan - descuento)
    dias_cubiertos = max(1, dias_totales - dias_no_consumidos)
    
    return {
        "dias_totales": dias_totales,
        "dias_no_consumidos": dias_no_consumidos,
        "descuento": descuento,
        "monto_cobro": monto_cobro,
        "dias_cubiertos": dias_cubiertos
    }


def generar_sql_cliente(row):
    """Genera los 9 bloques SQL para una fila de cliente."""
    ruc = str(row.get("RUC", "")).strip()
    if not ruc or ruc.lower() in ["nan", "null", "none"]:
        return ""

    usuario_sol = sql_val(row.get("USUARIO"))
    clave_sol = sql_val(row.get("CLAVE SOL", "__CLAVE_SOL__"))
    razon_social = sql_val(row.get("RAZÓN SOCIAL", row.get("RAZON SOCIAL")))
    nombre_comercial = sql_val(row.get("NOMBRE COMERCIAL"))
    direccion = sql_val(row.get("DIRECCION FISCAL"))
    departamento = sql_val(row.get("DEPARTAMENTO"))
    provincia = sql_val(row.get("PROVINCIA"))
    distrito = sql_val(row.get("DISTRITO"))
    telefono = sql_val(row.get("TELEFONO"))
    email = sql_val(row.get("CORREO"))
    dni = sql_val(row.get("DNI"))
    telefono_personal = telefono
    email_personal = email
    usuario_admin = sql_val(row.get("ACCESO", email))
    clave_temp = sql_val(row.get("CONTRASEÑA", row.get("CONTRASE\u00d1A", "__CLAVE_SISTEMA__")))
    url_acceso = sql_val(row.get("LINK"))
    
    color_tag = str(row.get("COLOR CELULAR", "Amarillo")).strip()
    if not color_tag or color_tag.lower() == "nan":
        color_tag = "Amarillo"
        
    entorno = str(row.get("ENTORNO CAPACITADO", "Producción")).strip()
    if not entorno or entorno.lower() == "nan":
        entorno = "Producción"
        
    plan_nombre = str(row.get("PLAN", "Plan Empresarial")).strip()
    if not plan_nombre or plan_nombre.lower() == "nan":
        plan_nombre = "Plan Empresarial"
        
    medio_pago = str(row.get("PAGOS", "YAPE")).strip()
    if not medio_pago or medio_pago.lower() == "nan":
        medio_pago = "YAPE"

    try:
        precio_plan = float(row.get("MONTO", 59.00))
    except (ValueError, TypeError):
        precio_plan = 59.00

    f_inicio = parsear_fecha(row.get("F.INICIO"))
    if not f_inicio:
        f_inicio = datetime(2025, 11, 1)
    f_inicio_str = f_inicio.strftime("%Y-%m-%d %H:%M:%S")

    # Extraer historial de pagos desde las columnas de meses
    meses_pagados = []
    
    # Manejar nombres de columnas duplicados (como JULIO y AGOSTO para 2025 y 2026)
    cols = list(row.index)
    col_idx_map = {}
    for idx, col_name in enumerate(cols):
        col_idx_map.setdefault(col_name.strip(), []).append(idx)

    # Revisar pagos 2025
    for mes_nombre, anio in [("JULIO", 2025), ("AGOSTO", 2025), ("SEPTIEMBRE", 2025), 
                            ("OCTUBRE", 2025), ("NOVIEMBRE", 2025), ("DICIEMBRE", 2025)]:
        indices = col_idx_map.get(mes_nombre, [])
        if indices:
            val = row.iloc[indices[0]]
            if pd.notna(val) and str(val).strip() not in ["", "0", "0.00", "0.0"]:
                meses_pagados.append(datetime(anio, [7,8,9,10,11,12][["JULIO","AGOSTO","SEPTIEMBRE","OCTUBRE","NOVIEMBRE","DICIEMBRE"].index(mes_nombre)], 1))

    # Revisar pagos 2026
    for mes_nombre, num_mes in [("enero 2026", 1), ("FEBRERO", 2), ("MARZO", 3), 
                                ("ABRIL", 4), ("MAYO", 5), ("JUNIO", 6), ("JULIO", 7), ("AGOSTO", 8)]:
        indices = col_idx_map.get(mes_nombre, [])
        if indices:
            # Si es JULIO o AGOSTO, tomar el segundo índice (2026) si existe
            idx = indices[-1] if len(indices) > 1 and mes_nombre in ["JULIO", "AGOSTO"] else indices[0]
            val = row.iloc[idx]
            if pd.notna(val) and str(val).strip() not in ["", "0", "0.00", "0.0"]:
                meses_pagados.append(datetime(2026, num_mes, 1))

    if not meses_pagados:
        meses_pagados = [f_inicio]

    meses_pagados = sorted(list(set(meses_pagados)))
    fecha_alta = meses_pagados[0]
    renovaciones_pagadas = meses_pagados[1:]
    ultima_fecha_pago = meses_pagados[-1]

    # Calcular mes de corte siguiente
    if ultima_fecha_pago.month == 12:
        siguiente_mes = datetime(ultima_fecha_pago.year + 1, 1, 1)
    else:
        siguiente_mes = datetime(ultima_fecha_pago.year, ultima_fecha_pago.month + 1, 1)

    # Prorrateo del último servicio
    prorrateo_ultimo = calcular_prorrateo_sistema(precio_plan, ultima_fecha_pago)

    # -------------------------------------------------------------
    # CONSTRUCCIÓN DE LOS 9 BLOQUES
    # -------------------------------------------------------------
    sql = f"""-- ============================================================
-- CLIENTE: {ruc} - {row.get('RAZÓN SOCIAL', row.get('RAZON SOCIAL'))}
-- ============================================================

-- BLOQUE 1: CLIENTE
INSERT INTO public.cliente (
    ruc, usuario_sol, clave_sol_cifrada, razon_social, nombre_comercial,
    direccion, departamento, provincia, distrito, telefono, email,
    nombres, apellidos, dni, telefono_personal, email_personal,
    usuario_admin_facturador, clave_temporal, url_acceso, usuario_wsp,
    estado_id, color_tag_id, entorno_id, activo, fecha_registro, fecha_actualizacion
) VALUES (
    '{ruc}', {usuario_sol}, {clave_sol}, {razon_social}, {nombre_comercial},
    {direccion}, {departamento}, {provincia}, {distrito}, {telefono}, {email},
    NULL, NULL, {dni}, {telefono_personal}, {email_personal},
    {usuario_admin}, {clave_temp}, {url_acceso}, NULL,
    (SELECT id FROM public.estado_cliente WHERE nombre = 'HABILITADO' AND activo = TRUE LIMIT 1),
    (SELECT id FROM public.color_tag WHERE codigo = '{color_tag}' AND activo = TRUE LIMIT 1),
    (SELECT id FROM public.entorno WHERE nombre = '{entorno}' AND activo = TRUE LIMIT 1),
    TRUE, TIMESTAMP '{f_inicio_str}', TIMESTAMP '{f_inicio_str}'
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
    estado_id = EXCLUDED.estado_id,
    color_tag_id = EXCLUDED.color_tag_id,
    entorno_id = EXCLUDED.entorno_id,
    activo = TRUE,
    fecha_actualizacion = current_timestamp();

-- BLOQUE 2: VENTA INICIAL (ALTA)
INSERT INTO public.venta (
    cliente_id, vendedor_id, suscripcion_id, tipo_venta, venta_anterior_id,
    precio_lista, monto_prorrateado, monto_total, estado_venta,
    observaciones, fecha_venta, fecha_actualizacion
)
SELECT
    c.id, NULL, s.id, 'ALTA', NULL, s.precio, 0.00, s.precio, 'PAGADA',
    'Importación de registro histórico desde Excel',
    TIMESTAMP '{fecha_alta.strftime("%Y-%m-%d 00:00:00")}',
    TIMESTAMP '{fecha_alta.strftime("%Y-%m-%d 00:00:00")}'
FROM public.cliente c
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL'
JOIN public.plan p ON p.id = s.plan_id
WHERE c.ruc = '{ruc}' AND p.nombre_plan = '{plan_nombre}' AND s.activo = TRUE
AND NOT EXISTS (
    SELECT 1 FROM public.venta v WHERE v.cliente_id = c.id AND v.tipo_venta = 'ALTA'
);
"""

    # BLOQUE 3: RENOVACIONES
    if renovaciones_pagadas:
        fechas_val_list = []
        for r_fecha in renovaciones_pagadas:
            if r_fecha == ultima_fecha_pago:
                fechas_val_list.append(f"        (TIMESTAMP '{r_fecha.strftime('%Y-%m-%d 00:00:00')}', {prorrateo_ultimo['descuento']:.2f}, {prorrateo_ultimo['monto_cobro']:.2f})")
            else:
                fechas_val_list.append(f"        (TIMESTAMP '{r_fecha.strftime('%Y-%m-%d 00:00:00')}', 0.00, NULL)")
        
        fechas_values = ",\n".join(fechas_val_list)

        sql += f"""
-- BLOQUE 3: RENOVACIONES HISTÓRICAS
WITH fechas(fecha, descuento_prorrateo, monto_total) AS (
    VALUES
{fechas_values}
)
INSERT INTO public.venta (
    cliente_id, vendedor_id, suscripcion_id, tipo_venta, venta_anterior_id,
    precio_lista, monto_prorrateado, monto_total, estado_venta,
    observaciones, fecha_venta, fecha_actualizacion
)
SELECT
    c.id, NULL, s.id, 'RENOVACION',
    (SELECT anterior.id FROM public.venta anterior WHERE anterior.cliente_id = c.id AND anterior.estado_venta = 'PAGADA' AND anterior.fecha_venta < fechas.fecha ORDER BY anterior.fecha_venta DESC LIMIT 1),
    s.precio, fechas.descuento_prorrateo, COALESCE(fechas.monto_total, s.precio), 'PAGADA',
    'Renovación histórica importada desde Excel', fechas.fecha, fechas.fecha
FROM fechas
JOIN public.cliente c ON c.ruc = '{ruc}'
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL'
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = '{plan_nombre}'
WHERE s.activo = TRUE
AND NOT EXISTS (
    SELECT 1 FROM public.venta v WHERE v.cliente_id = c.id AND v.tipo_venta = 'RENOVACION' AND v.fecha_venta = fechas.fecha
);
"""

    # BLOQUE 4: PAGOS
    pagos_val_list = [f"        (TIMESTAMP '{p_fecha.strftime('%Y-%m-%d 00:00:00')}')" for p_fecha in meses_pagados]
    pagos_values = ",\n".join(pagos_val_list)
    sql += f"""
-- BLOQUE 4: PAGOS HISTÓRICOS
WITH fechas(fecha) AS (
    VALUES
{pagos_values}
)
INSERT INTO public.pago (
    venta_id, codigo_operacion, monto, medio_pago, estado_pago,
    fecha_pago, fecha_registro, observaciones
)
SELECT
    v.id, NULL, v.monto_total, '{medio_pago}', 'PAGADO',
    fechas.fecha, fechas.fecha, 'Pago histórico importado desde Excel'
FROM fechas
JOIN public.cliente c ON c.ruc = '{ruc}'
JOIN public.venta v ON v.cliente_id = c.id AND v.fecha_venta = fechas.fecha AND v.estado_venta = 'PAGADA'
WHERE NOT EXISTS (
    SELECT 1 FROM public.pago p WHERE p.venta_id = v.id AND p.fecha_pago = fechas.fecha
);
"""

    # BLOQUE 5: SERVICIOS
    periodos_list = []
    for i, p_fecha in enumerate(meses_pagados):
        if p_fecha.month == 12:
            p_fin = datetime(p_fecha.year + 1, 1, 1)
        else:
            p_fin = datetime(p_fecha.year, p_fecha.month + 1, 1)

        if p_fecha == ultima_fecha_pago:
            # Servicio Activo
            periodos_list.append(
                f"        (TIMESTAMP '{p_fecha.strftime('%Y-%m-%d 00:00:00')}', TIMESTAMP '{p_fin.strftime('%Y-%m-%d 00:00:00')}', 'ACTIVO', {prorrateo_ultimo['monto_cobro']:.2f}, {prorrateo_ultimo['dias_cubiertos']})"
            )
        else:
            periodos_list.append(
                f"        (TIMESTAMP '{p_fecha.strftime('%Y-%m-%d 00:00:00')}', TIMESTAMP '{p_fin.strftime('%Y-%m-%d 00:00:00')}', 'VENCIDO', 0.00, 0)"
            )

    periodos_values = ",\n".join(periodos_list)
    sql += f"""
-- BLOQUE 5: SERVICIOS HISTÓRICOS
WITH periodos(fecha_inicio, fecha_fin, estado, monto_prorrateo, dias_prorrateados) AS (
    VALUES
{periodos_values}
)
INSERT INTO public.servicio_cliente (
    cliente_id, venta_id, fecha_inicio, fecha_fin, fecha_capacitacion,
    estado, monto_prorrateo, dias_prorrateados, observaciones,
    fecha_creacion, fecha_actualizacion
)
SELECT
    c.id, v.id, periodos.fecha_inicio, periodos.fecha_fin,
    TIMESTAMP '{f_inicio_str}', periodos.estado, periodos.monto_prorrateo,
    periodos.dias_prorrateados, 'Servicio histórico importado desde Excel',
    periodos.fecha_inicio, periodos.fecha_inicio
FROM periodos
JOIN public.cliente c ON c.ruc = '{ruc}'
JOIN public.venta v ON v.cliente_id = c.id AND v.fecha_venta = periodos.fecha_inicio AND v.estado_venta = 'PAGADA'
WHERE NOT EXISTS (
    SELECT 1 FROM public.servicio_cliente sc WHERE sc.venta_id = v.id
);
"""

    # BLOQUE 6: PRÓXIMA RENOVACIÓN PROGRAMADA
    sql += f"""
-- BLOQUE 6: PRÓXIMA RENOVACIÓN PROGRAMADA
INSERT INTO public.venta (
    cliente_id, vendedor_id, suscripcion_id, tipo_venta, venta_anterior_id,
    precio_lista, monto_prorrateado, monto_total, estado_venta,
    observaciones, fecha_venta, fecha_actualizacion
)
SELECT
    c.id, ultima.vendedor_id, ultima.suscripcion_id, 'RENOVACION', ultima.id,
    s.precio, 0.00, s.precio, 'PENDIENTE_PAGO',
    'Próxima renovación regular mensual',
    TIMESTAMP '{siguiente_mes.strftime("%Y-%m-%d 00:00:00")}',
    TIMESTAMP '{siguiente_mes.strftime("%Y-%m-%d 00:00:00")}'
FROM public.cliente c
JOIN public.venta ultima ON ultima.id = (
    SELECT v2.id FROM public.venta v2 WHERE v2.cliente_id = c.id AND v2.estado_venta = 'PAGADA' ORDER BY v2.fecha_venta DESC LIMIT 1
)
JOIN public.suscripcion s ON s.id = ultima.suscripcion_id
WHERE c.ruc = '{ruc}'
AND NOT EXISTS (
    SELECT 1 FROM public.venta pendiente WHERE pendiente.cliente_id = c.id AND pendiente.tipo_venta = 'RENOVACION' AND pendiente.estado_venta = 'PENDIENTE_PAGO'
);

-- BLOQUE 7: ESTADO ACTUAL DEL CLIENTE
UPDATE public.cliente
SET estado_id = (SELECT id FROM public.estado_cliente WHERE nombre = 'HABILITADO' AND activo = TRUE LIMIT 1),
    activo = TRUE, fecha_actualizacion = current_timestamp()
WHERE ruc = '{ruc}';

-- BLOQUE 8: HISTORIAL DE ESTADOS
INSERT INTO public.historial_estado_cliente (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, NULL, pc.id, NULL, 'Registro histórico importado desde Excel', TIMESTAMP '{f_inicio_str}'
FROM public.cliente c JOIN public.estado_cliente pc ON pc.nombre = 'POR_COBRAR'
WHERE c.ruc = '{ruc}' AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h WHERE h.cliente_id = c.id AND h.motivo = 'Registro histórico importado desde Excel');

INSERT INTO public.historial_estado_cliente (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, pc.id, pcap.id, NULL, 'Pago histórico confirmado desde Excel', TIMESTAMP '{f_inicio_str}'
FROM public.cliente c JOIN public.estado_cliente pc ON pc.nombre = 'POR_COBRAR' JOIN public.estado_cliente pcap ON pcap.nombre = 'POR_CAPACITAR'
WHERE c.ruc = '{ruc}' AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h WHERE h.cliente_id = c.id AND h.motivo = 'Pago histórico confirmado desde Excel');

INSERT INTO public.historial_estado_cliente (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, pcap.id, hab.id, NULL, 'Capacitación histórica confirmada desde Excel', TIMESTAMP '{f_inicio_str}'
FROM public.cliente c JOIN public.estado_cliente pcap ON pcap.nombre = 'POR_CAPACITAR' JOIN public.estado_cliente hab ON hab.nombre = 'HABILITADO'
WHERE c.ruc = '{ruc}' AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h WHERE h.cliente_id = c.id AND h.motivo = 'Capacitación histórica confirmada desde Excel');

-- BLOQUE 9: VERIFICACIÓN
SELECT c.ruc, c.razon_social, ec.nombre AS estado_cliente, v.tipo_venta, v.estado_venta, v.fecha_venta, v.monto_total
FROM public.cliente c
LEFT JOIN public.estado_cliente ec ON ec.id = c.estado_id
LEFT JOIN public.venta v ON v.cliente_id = c.id
WHERE c.ruc = '{ruc}' ORDER BY v.fecha_venta;
"""
    return sql


def procesar_excel():
    """Lee el Excel y genera el archivo SQL completo."""
    if not os.path.exists(EXCEL_FILE):
        print(f"❌ Error: No se encuentra el archivo {EXCEL_FILE}")
        return

    print(f"📖 Leyendo archivo: {EXCEL_FILE}...")
    df = pd.read_excel(EXCEL_FILE, dtype=str)
    
    total_filas = len(df)
    print(f"📊 Se encontraron {total_filas} registros en el Excel.")

    sql_completo = []
    sql_completo.append("-- ============================================================")
    sql_completo.append("-- SCRIPT DE IMPORTACIÓN GENERADO AUTOMÁTICAMENTE DESDE EXCEL")
    sql_completo.append(f"-- Total de clientes: {total_filas}")
    sql_completo.append(f"-- Fecha de generación: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    sql_completo.append("-- ============================================================\n\n")

    for idx, row in df.iterrows():
        ruc = str(row.get("RUC", "")).strip()
        if not ruc or ruc.lower() in ["nan", "none", ""]:
            continue
        print(f"  ⚡ Procesando cliente [{idx+1}/{total_filas}]: RUC {ruc} - {row.get('RAZÓN SOCIAL', row.get('RAZON SOCIAL'))}")
        sql_cliente = generar_sql_cliente(row)
        if sql_cliente:
            sql_completo.append(sql_cliente)
            sql_completo.append("\n-- ------------------------------------------------------------\n")

    with open(OUTPUT_SQL_FILE, "w", encoding="utf-8") as f:
        f.write("\n".join(sql_completo))

    print(f"\n✅ Archivo SQL generado exitosamente: {OUTPUT_SQL_FILE}")


if __name__ == "__main__":
    procesar_excel()
