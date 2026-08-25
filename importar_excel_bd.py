"""
=============================================================================
IMPORTACIÓN AUTOMÁTICA DE EXCEL A COCKROACHDB
Basado exactamente en la lógica SQL de 9 bloques de CockroachDB.
=============================================================================
"""

import sys
import os
import re
from datetime import datetime, date
import pandas as pd

# =============================================================================
# 1. CONFIGURACIÓN DE CONEXIÓN A COCKROACHDB
# =============================================================================
def cargar_env_local():
    """Lee el archivo .env local si existe (ignorado por git)."""
    for path in [".env", "../.env", "../../.env"]:
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        k, v = line.split("=", 1)
                        os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))
            break

cargar_env_local()

# Conexión vía variables de entorno o archivo .env
COCKROACH_URL = os.environ.get("COCKROACH_URL", os.environ.get("DB_URL", os.environ.get("DATABASE_URL", "")))

DB_CONFIG = {
    "host": os.environ.get("DB_HOST", "localhost"),
    "port": int(os.environ.get("DB_PORT", "26257")),
    "user": os.environ.get("DB_USER", "root"),
    "password": os.environ.get("DB_PASS", ""),
    "database": os.environ.get("DB_NAME", "defaultdb"),
    "sslmode": os.environ.get("DB_SSLMODE", "require")
}

# Archivo Excel de origen y archivo SQL de respaldo
EXCEL_FILE = "plantilla_importacion_clientes.xlsx"
OUTPUT_SQL_FILE = "importacion_cockroachdb.sql"


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
    """Parsea una fecha a objeto datetime."""
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


def sumar_un_mes(fecha):
    """Calcula el primer día del mes siguiente."""
    if fecha.month == 12:
        return datetime(fecha.year + 1, 1, 1)
    else:
        return datetime(fecha.year, fecha.month + 1, 1)


def extraer_meses_pagados(row):
    """Extrae las fechas de los meses con pago registrado en las columnas del Excel."""
    meses_pagados = []
    
    # Mapa ordenado de detección por columna
    # Permite nombres estándar, con año o con sufijo .1 de pandas
    for col in row.index:
        col_clean = str(col).strip().upper()
        val = row[col]
        
        # Si la celda no tiene monto válido, omitir
        if pd.isna(val) or str(val).strip() in ["", "0", "0.00", "0.0", "NAN", "NONE", "NULL"]:
            continue
        
        # 1. Meses de 2025 (primera aparición de JULIO a DICIEMBRE sin .1)
        if col_clean == "JULIO":
            meses_pagados.append(datetime(2025, 7, 1))
        elif col_clean == "AGOSTO":
            meses_pagados.append(datetime(2025, 8, 1))
        elif "SEPTIEMBRE" in col_clean or "SETIEMBRE" in col_clean:
            meses_pagados.append(datetime(2025, 9, 1))
        elif "OCTUBRE" in col_clean:
            meses_pagados.append(datetime(2025, 10, 1))
        elif "NOVIEMBRE" in col_clean:
            meses_pagados.append(datetime(2025, 11, 1))
        elif "DICIEMBRE" in col_clean:
            meses_pagados.append(datetime(2025, 12, 1))
            
        # 2. Meses de 2026
        elif "ENERO" in col_clean:
            meses_pagados.append(datetime(2026, 1, 1))
        elif "FEBRERO" in col_clean:
            meses_pagados.append(datetime(2026, 2, 1))
        elif "MARZO" in col_clean:
            meses_pagados.append(datetime(2026, 3, 1))
        elif "ABRIL" in col_clean:
            meses_pagados.append(datetime(2026, 4, 1))
        elif "MAYO" in col_clean:
            meses_pagados.append(datetime(2026, 5, 1))
        elif "JUNIO" in col_clean:
            meses_pagados.append(datetime(2026, 6, 1))
        elif col_clean in ["JULIO.1", "JULIO 2026", "JULIO 26", "JULIO_2026"]:
            meses_pagados.append(datetime(2026, 7, 1))
        elif col_clean in ["AGOSTO.1", "AGOSTO 2026", "AGOSTO 26", "AGOSTO_2026"]:
            meses_pagados.append(datetime(2026, 8, 1))

    f_inicio = parsear_fecha(row.get("F.INICIO"))
    if not f_inicio:
        f_inicio = datetime(2025, 11, 1)

    if not meses_pagados:
        meses_pagados = [datetime(f_inicio.year, f_inicio.month, 1)]

    meses_pagados = sorted(list(set(meses_pagados)))
    return f_inicio, meses_pagados


def normalizar_color(val):
    """Normaliza el color del tag según los valores de la BD (Verde, Amarillo, Rojo, Azul)."""
    if val is None or pd.isna(val):
        return "Amarillo"
    v = str(val).strip().lower()
    if "ver" in v:
        return "Verde"
    elif "ama" in v or "yel" in v:
        return "Amarillo"
    elif "roj" in v or "red" in v:
        return "Rojo"
    elif "azu" in v or "blu" in v:
        return "Azul"
    return "Amarillo"


def normalizar_entorno(val):
    """Normaliza el entorno según la BD (Producción, Control Interno)."""
    if val is None or pd.isna(val):
        return "Producción"
    v = str(val).strip().lower()
    if "cont" in v or "int" in v:
        return "Control Interno"
    return "Producción"


def normalizar_plan(val, monto=None):
    """Normaliza el nombre exacto del plan según la tabla 'plan' de la BD."""
    v = str(val).strip().lower() if (val is not None and not pd.isna(val)) else ""
    m_str = str(monto).strip() if (monto is not None and not pd.isna(monto)) else ""

    if "ini" in v or "19" in m_str:
        return "Plan Inicial"
    elif "empren" in v or "29" in m_str:
        return "Plan Emprende"
    elif "impul" in v or "39" in m_str:
        return "Plan Impulsa"
    elif "lider" in v or "líder" in v or "89" in m_str:
        return "Plan Lider"
    elif "empre" in v or "59" in m_str:
        return "Plan Empresarial"
    
    return "Plan Empresarial"


def normalizar_monto(val, plan_nombre=""):
    """Limpia y convierte montos (ej. 'S/ 59.00', '59,00', 59) a float."""
    if val is None or pd.isna(val):
        precios_defecto = {
            "Plan Inicial": 19.00,
            "Plan Emprende": 29.00,
            "Plan Impulsa": 39.00,
            "Plan Empresarial": 59.00,
            "Plan Lider": 89.00
        }
        return precios_defecto.get(plan_nombre, 59.00)
    
    v = str(val).replace("S/", "").replace("s/", "").replace("$", "").replace(",", ".").strip()
    try:
        return float(v)
    except ValueError:
        return 59.00


def generar_bloques_sql(row):
    """
    Genera la lista de sentencias SQL exactas según la especificación de CockroachDB.
    """
    ruc = str(row.get("RUC", "")).strip()
    if not ruc or ruc.lower() in ["nan", "null", "none"]:
        return None, []

    usuario_sol = sql_val(row.get("USUARIO"))
    clave_sol = sql_val(row.get("CLAVE SOL", "__CLAVE_SOL__"))
    razon_social = sql_val(row.get("RAZÓN SOCIAL", row.get("RAZON SOCIAL")))
    nombre_comercial = sql_val(row.get("NOMBRE COMERCIAL"))
    direccion = sql_val(row.get("DIRECCION FISCAL", row.get("DIRECCION")))
    departamento = sql_val(row.get("DEPARTAMENTO"))
    provincia = sql_val(row.get("PROVINCIA"))
    distrito = sql_val(row.get("DISTRITO"))
    telefono = sql_val(row.get("TELEFONO"))
    email = sql_val(row.get("CORREO", row.get("EMAIL")))
    dni = sql_val(row.get("DNI"))
    telefono_personal = telefono
    email_personal = email
    usuario_admin = sql_val(row.get("ACCESO", email))
    clave_temp = sql_val(row.get("CONTRASEÑA", row.get("CONTRASE\u00d1A", "__CLAVE_SISTEMA__")))
    url_acceso = sql_val(row.get("LINK"))

    # Normalización inteligente y tolerante a fallos
    color_tag = normalizar_color(row.get("COLOR CELULAR"))
    entorno = normalizar_entorno(row.get("ENTORNO CAPACITADO"))
    plan_nombre = normalizar_plan(row.get("PLAN"), row.get("MONTO"))
    monto_plan = normalizar_monto(row.get("MONTO"), plan_nombre)

    medio_pago = str(row.get("PAGOS", "YAPE")).strip()
    if not medio_pago or medio_pago.lower() == "nan":
        medio_pago = "YAPE"

    f_inicio, meses_pagados = extraer_meses_pagados(row)
    f_inicio_str = f_inicio.strftime("%Y-%m-%d 00:00:00")
    
    primera_fecha_pago = meses_pagados[0]
    primera_fecha_str = primera_fecha_pago.strftime("%Y-%m-%d 00:00:00")

    renovaciones_pagadas = meses_pagados[1:]
    ultima_fecha_pago = meses_pagados[-1]
    ultima_fecha_str = ultima_fecha_pago.strftime("%Y-%m-%d 00:00:00")

    proximo_mes_pago = sumar_un_mes(ultima_fecha_pago)
    proximo_mes_str = proximo_mes_pago.strftime("%Y-%m-%d 00:00:00")

    statements = []

    # ============================================================
    # 1. CLIENTE
    # ============================================================
    sql_1 = f"""
INSERT INTO public.cliente (
    ruc, usuario_sol, clave_sol_cifrada, razon_social, nombre_comercial,
    direccion, departamento, provincia, distrito, telefono, email,
    nombres, apellidos, dni, telefono_personal, email_personal,
    usuario_admin_facturador, clave_temporal, url_acceso, usuario_wsp,
    estado_id, color_tag_id, entorno_id, activo,
    fecha_registro, fecha_actualizacion
)
VALUES (
    '{ruc}',
    {usuario_sol},
    {clave_sol},
    {razon_social},
    {nombre_comercial},
    {direccion},
    {departamento}, {provincia}, {distrito},
    {telefono},
    {email},
    NULL, NULL, {dni},
    {telefono_personal},
    {email_personal},
    {usuario_admin},
    {clave_temp},
    {url_acceso},
    NULL,
    (SELECT id FROM public.estado_cliente WHERE nombre = 'HABILITADO' AND activo = true LIMIT 1),
    (SELECT id FROM public.color_tag WHERE codigo = '{color_tag}' AND activo = true LIMIT 1),
    (SELECT id FROM public.entorno WHERE nombre = '{entorno}' AND activo = true LIMIT 1),
    true,
    TIMESTAMP '{f_inicio_str}',
    TIMESTAMP '{ultima_fecha_str}'
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
"""
    statements.append(("-- 1. CLIENTE", sql_1.strip()))

    # ============================================================
    # 2. VENTA INICIAL: ALTA
    # ============================================================
    sql_2 = f"""
INSERT INTO public.venta (
    cliente_id, vendedor_id, suscripcion_id, tipo_venta, venta_anterior_id,
    precio_lista, monto_prorrateado, monto_total, estado_venta,
    observaciones, fecha_venta, fecha_actualizacion
)
SELECT c.id, NULL, s.id, 'ALTA', NULL,
       s.precio, 0, s.precio, 'PAGADA',
       'Importación de registro histórico desde Excel',
       TIMESTAMP '{primera_fecha_str}', TIMESTAMP '{primera_fecha_str}'
FROM public.cliente c
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = '{plan_nombre}'
WHERE c.ruc = '{ruc}'
  AND NOT EXISTS (
      SELECT 1 FROM public.venta v
      WHERE v.cliente_id = c.id
        AND v.tipo_venta = 'ALTA'
        AND v.fecha_venta = TIMESTAMP '{primera_fecha_str}'
  );
"""
    statements.append(("-- 2. VENTA INICIAL", sql_2.strip()))

    # ============================================================
    # 3. RENOVACIONES PAGADAS
    # ============================================================
    if renovaciones_pagadas:
        values_fechas = ",\n        ".join([f"(TIMESTAMP '{f.strftime('%Y-%m-%d 00:00:00')}')" for f in renovaciones_pagadas])
        sql_3 = f"""
WITH fechas(fecha) AS (
    VALUES
        {values_fechas}
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
JOIN public.cliente c ON c.ruc = '{ruc}'
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = '{plan_nombre}'
WHERE NOT EXISTS (
    SELECT 1 FROM public.venta v
    WHERE v.cliente_id = c.id
      AND v.tipo_venta = 'RENOVACION'
      AND v.fecha_venta = fechas.fecha
);
"""
        statements.append(("-- 3. RENOVACIONES PAGADAS", sql_3.strip()))

    # ============================================================
    # 4. PAGOS HISTÓRICOS
    # ============================================================
    values_pagos = ",\n        ".join([f"(TIMESTAMP '{f.strftime('%Y-%m-%d 00:00:00')}')" for f in meses_pagados])
    sql_4 = f"""
WITH fechas(fecha) AS (
    VALUES
        {values_pagos}
)
INSERT INTO public.pago (
    venta_id, codigo_operacion, monto, medio_pago, estado_pago,
    fecha_pago, fecha_registro, observaciones
)
SELECT v.id, NULL, v.monto_total, '{medio_pago}', 'PAGADO',
       fechas.fecha, fechas.fecha,
       'Pago histórico importado desde Excel'
FROM fechas
JOIN public.cliente c ON c.ruc = '{ruc}'
JOIN public.venta v ON v.cliente_id = c.id
                    AND v.fecha_venta = fechas.fecha
                    AND v.estado_venta = 'PAGADA'
WHERE NOT EXISTS (
    SELECT 1 FROM public.pago px
    WHERE px.venta_id = v.id
      AND px.fecha_pago = fechas.fecha
);
"""
    statements.append(("-- 4. PAGOS HISTORICOS", sql_4.strip()))

    # ============================================================
    # 5. SERVICIOS: PERIODOS
    # ============================================================
    periodos_values = []
    for idx, f_ini in enumerate(meses_pagados):
        f_fin = sumar_un_mes(f_ini)
        estado = "ACTIVO" if idx == len(meses_pagados) - 1 else "VENCIDO"
        periodos_values.append(
            f"(TIMESTAMP '{f_ini.strftime('%Y-%m-%d 00:00:00')}', TIMESTAMP '{f_fin.strftime('%Y-%m-%d 00:00:00')}', '{estado}')"
        )
    values_periodos_str = ",\n        ".join(periodos_values)

    sql_5 = f"""
WITH periodos(fecha_inicio, fecha_fin, estado) AS (
    VALUES
        {values_periodos_str}
)
INSERT INTO public.servicio_cliente (
    cliente_id, venta_id, fecha_inicio, fecha_fin, fecha_capacitacion,
    estado, monto_prorrateo, dias_prorrateados, observaciones,
    fecha_creacion, fecha_actualizacion
)
SELECT c.id, v.id, periodos.fecha_inicio, periodos.fecha_fin,
       TIMESTAMP '{f_inicio_str}', periodos.estado,
       0, 0, 'Servicio histórico importado desde Excel',
       periodos.fecha_inicio, periodos.fecha_inicio
FROM periodos
JOIN public.cliente c ON c.ruc = '{ruc}'
JOIN public.venta v ON v.cliente_id = c.id
                    AND v.fecha_venta = periodos.fecha_inicio
WHERE NOT EXISTS (
    SELECT 1 FROM public.servicio_cliente sc
    WHERE sc.venta_id = v.id
);
"""
    statements.append(("-- 5. SERVICIOS PERIODOS", sql_5.strip()))

    # ============================================================
    # 6. SERVICIO ACTUAL
    # ============================================================
    sql_6 = f"""
UPDATE public.servicio_cliente sc
SET fecha_inicio = TIMESTAMP '{ultima_fecha_str}',
    fecha_fin = TIMESTAMP '{proximo_mes_str}',
    estado = 'ACTIVO',
    monto_prorrateo = 0,
    dias_prorrateados = 0,
    fecha_actualizacion = TIMESTAMP '{ultima_fecha_str}'
FROM public.cliente c
JOIN public.venta v ON v.cliente_id = c.id
                   AND v.fecha_venta = TIMESTAMP '{ultima_fecha_str}'
                   AND v.estado_venta = 'PAGADA'
WHERE sc.cliente_id = c.id
  AND sc.venta_id = v.id
  AND c.ruc = '{ruc}';
"""
    statements.append(("-- 6. SERVICIO ACTUAL", sql_6.strip()))

    # ============================================================
    # 7. COBRO SIGUIENTE
    # ============================================================
    sql_7 = f"""
UPDATE public.venta v
SET precio_lista = s.precio,
    monto_prorrateado = 0,
    monto_total = s.precio,
    estado_venta = 'PENDIENTE_PAGO',
    observaciones = 'Renovación siguiente: cobro mensual normal desde el día 01',
    fecha_actualizacion = TIMESTAMP '{ultima_fecha_str}'
FROM public.cliente c
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = '{plan_nombre}'
WHERE v.cliente_id = c.id
  AND v.tipo_venta = 'RENOVACION'
  AND v.estado_venta = 'PENDIENTE_PAGO'
  AND v.fecha_venta = TIMESTAMP '{proximo_mes_str}'
  AND c.ruc = '{ruc}';

INSERT INTO public.venta (
    cliente_id, vendedor_id, suscripcion_id, tipo_venta, venta_anterior_id,
    precio_lista, monto_prorrateado, monto_total, estado_venta,
    observaciones, fecha_venta, fecha_actualizacion
)
SELECT c.id, v.vendedor_id, s.id, 'RENOVACION', v.id,
       s.precio, 0, s.precio, 'PENDIENTE_PAGO',
       'Renovación siguiente: cobro mensual normal desde el día 01',
       TIMESTAMP '{proximo_mes_str}', TIMESTAMP '{ultima_fecha_str}'
FROM public.cliente c
JOIN public.suscripcion s ON s.tipo_suscripcion = 'MENSUAL' AND s.activo = true
JOIN public.plan p ON p.id = s.plan_id AND p.nombre_plan = '{plan_nombre}'
JOIN public.venta v ON v.cliente_id = c.id
                   AND v.fecha_venta = TIMESTAMP '{ultima_fecha_str}'
                   AND v.estado_venta = 'PAGADA'
WHERE c.ruc = '{ruc}'
  AND NOT EXISTS (
      SELECT 1 FROM public.venta pendiente
      WHERE pendiente.cliente_id = c.id
        AND pendiente.tipo_venta = 'RENOVACION'
        AND pendiente.estado_venta = 'PENDIENTE_PAGO'
        AND pendiente.fecha_venta = TIMESTAMP '{proximo_mes_str}'
  );
"""
    statements.append(("-- 7. COBRO SIGUIENTE", sql_7.strip()))

    # ============================================================
    # 8. ESTADO ACTUAL E HISTORIAL
    # ============================================================
    sql_8 = f"""
UPDATE public.cliente
SET estado_id = (SELECT id FROM public.estado_cliente
                 WHERE nombre = 'HABILITADO' AND activo = true LIMIT 1),
    fecha_actualizacion = TIMESTAMP '{ultima_fecha_str}'
WHERE ruc = '{ruc}';

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, NULL, pc.id, NULL,
       'Registro histórico importado desde Excel',
       TIMESTAMP '{f_inicio_str}'
FROM public.cliente c
JOIN public.estado_cliente pc ON pc.nombre = 'POR_COBRAR'
WHERE c.ruc = '{ruc}'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Registro histórico importado desde Excel');

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, pc.id, pcap.id, NULL,
       'Pago histórico confirmado desde Excel',
       TIMESTAMP '{f_inicio_str}'
FROM public.cliente c
JOIN public.estado_cliente pc ON pc.nombre = 'POR_COBRAR'
JOIN public.estado_cliente pcap ON pcap.nombre = 'POR_CAPACITAR'
WHERE c.ruc = '{ruc}'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Pago histórico confirmado desde Excel');

INSERT INTO public.historial_estado_cliente
    (cliente_id, estado_anterior_id, estado_nuevo_id, usuario_admin_id, motivo, fecha_cambio)
SELECT c.id, pcap.id, hab.id, NULL,
       'Capacitación histórica confirmada desde Excel',
       TIMESTAMP '{f_inicio_str}'
FROM public.cliente c
JOIN public.estado_cliente pcap ON pcap.nombre = 'POR_CAPACITAR'
JOIN public.estado_cliente hab ON hab.nombre = 'HABILITADO'
WHERE c.ruc = '{ruc}'
  AND NOT EXISTS (SELECT 1 FROM public.historial_estado_cliente h
                  WHERE h.cliente_id = c.id
                    AND h.motivo = 'Capacitación histórica confirmada desde Excel');
"""
    statements.append(("-- 8. ESTADO ACTUAL E HISTORIAL", sql_8.strip()))

    return ruc, statements


def obtener_conexion():
    """
    Intenta obtener conexión a CockroachDB usando el driver disponible (psycopg2, psycopg o pg8000).
    """
    import importlib
    errores = []

    # 1. Intentar psycopg2
    try:
        psycopg2 = importlib.import_module("psycopg2")
        print("🔗 Conectando a CockroachDB vía psycopg2...")
        if COCKROACH_URL and COCKROACH_URL.strip():
            conn = psycopg2.connect(COCKROACH_URL)
        else:
            conn = psycopg2.connect(
                host=DB_CONFIG["host"],
                port=DB_CONFIG["port"],
                user=DB_CONFIG["user"],
                password=DB_CONFIG["password"],
                database=DB_CONFIG["database"],
                sslmode=DB_CONFIG["sslmode"]
            )
        conn.autocommit = True
        return conn
    except ModuleNotFoundError:
        errores.append("psycopg2 no instalado")
    except Exception as e:
        errores.append(f"psycopg2: {e}")

    # 2. Intentar psycopg (v3)
    try:
        psycopg = importlib.import_module("psycopg")
        print("🔗 Conectando a CockroachDB vía psycopg (v3)...")
        if COCKROACH_URL and COCKROACH_URL.strip():
            conn = psycopg.connect(COCKROACH_URL, autocommit=True)
            return conn
    except ModuleNotFoundError:
        errores.append("psycopg v3 no instalado")
    except Exception as e:
        errores.append(f"psycopg v3: {e}")

    # 3. Intentar pg8000 (driver nativo de Python puro)
    try:
        pg8000_native = importlib.import_module("pg8000.native")
        import ssl
        ssl_context = ssl.create_default_context()
        print("🔗 Conectando a CockroachDB vía pg8000...")
        if COCKROACH_URL and COCKROACH_URL.strip():
            m = re.match(r"postgresql://([^:]+):([^@]+)@([^:/]+):?(\d+)?/(.+)", COCKROACH_URL)
            if m:
                u, p, h, prt, db = m.groups()
                prt = int(prt) if prt else 26257
                db_clean = db.split("?")[0]
                conn = pg8000_native.Connection(user=u, password=p, host=h, port=prt, database=db_clean, ssl_context=ssl_context)
                return conn
        else:
            conn = pg8000_native.Connection(
                user=DB_CONFIG["user"],
                password=DB_CONFIG["password"],
                host=DB_CONFIG["host"],
                port=int(DB_CONFIG["port"]),
                database=DB_CONFIG["database"],
                ssl_context=ssl_context
            )
            return conn
    except ModuleNotFoundError:
        errores.append("pg8000 no instalado")
    except Exception as e:
        errores.append(f"pg8000: {e}")

    print("\n⚠️  DETALLE DE CONEXIÓN:")
    for err in errores:
        print(f"   • {err}")
    print("\n👉 Para habilitar la conexión directa en esta versión de Python, ejecuta en tu terminal:")
    print(f'   & "{sys.executable}" -m pip install pg8000 psycopg2-binary\n')

    return None


def ejecutar_importacion(ejecutar_en_bd=True):
    """Procesa el archivo Excel y aplica los cambios en CockroachDB."""
    if not os.path.exists(EXCEL_FILE):
        print(f"❌ Error: No se encontró el archivo '{EXCEL_FILE}' en la raíz del proyecto.")
        return

    print(f"📖 Leyendo archivo Excel: {EXCEL_FILE}...")
    df = pd.read_excel(EXCEL_FILE, dtype=str)
    total_filas = len(df)
    print(f"📊 Registros encontrados en el Excel: {total_filas}\n")

    conn = None
    if ejecutar_en_bd:
        conn = obtener_conexion()
        if conn:
            print("✅ Conexión establecida exitosamente con CockroachDB.\n")
        else:
            print("⚠️ No se pudo conectar directamente a la BD (o faltan drivers). Se generará el script .SQL de respaldo.")

    sql_file_lines = [
        "-- ============================================================",
        "-- IMPORTACION AUTOMATICA DESDE EXCEL A COCKROACHDB",
        f"-- Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
        "-- ============================================================\n"
    ]

    exitosos = 0
    errores = 0

    for idx, row in df.iterrows():
        ruc, statements = generar_bloques_sql(row)
        if not ruc or not statements:
            continue

        razon = str(row.get("RAZÓN SOCIAL", row.get("RAZON SOCIAL", "")))
        print(f"⚡ [{idx + 1}/{total_filas}] Procesando RUC: {ruc} | {razon}")

        cliente_sql_text = f"\n-- ============================================================\n-- CLIENTE: {ruc} - {razon}\n-- ============================================================\n"
        for label, stmt in statements:
            cliente_sql_text += f"\n{label}\n{stmt}\n"

        sql_file_lines.append(cliente_sql_text)

        if conn:
            try:
                for label, stmt in statements:
                    # Dividir en sub-sentencias si contiene varias separadas por punto y coma
                    for single_query in stmt.strip().split(";"):
                        sq = single_query.strip()
                        if sq:
                            if hasattr(conn, "cursor"):
                                with conn.cursor() as cur:
                                    cur.execute(sq)
                            elif hasattr(conn, "run"):
                                conn.run(sq)
                print(f"   ✅ RUC {ruc} importado exitosamente en CockroachDB.")
                exitosos += 1
            except Exception as e:
                print(f"   ❌ Error importando RUC {ruc}: {e}")
                errores += 1
        else:
            exitosos += 1

    # Guardar archivo .sql
    with open(OUTPUT_SQL_FILE, "w", encoding="utf-8") as f:
        f.write("\n".join(sql_file_lines))

    print(f"\n============================================================")
    print(f"🎉 Proceso finalizado:")
    print(f"   - Clientes procesados: {exitosos}")
    if errores > 0:
        print(f"   - Clientes con error: {errores}")
    print(f"   - Archivo SQL generado: {OUTPUT_SQL_FILE}")
    print(f"============================================================")


if __name__ == "__main__":
    ejecutar_importacion(ejecutar_en_bd=True)
