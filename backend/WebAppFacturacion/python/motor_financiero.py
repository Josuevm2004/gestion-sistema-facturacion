#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
=============================================================================
MOTOR FINANCIERO, DE PRORRATEO Y REPORTERÍA EN PYTHON (BACKEND INTEGRADO)
=============================================================================
Ejecutado desde Spring Boot (PythonMotorService) o por CLI:
  python3 motor_financiero.py proyeccion-mes
  python3 motor_financiero.py auditoria-cartera
  python3 motor_financiero.py calcular-prorrateo '{"precio_plan":29,"fecha_inicio":"2026-08-15","tipo_suscripcion":"MENSUAL","dia_cobro":1}'
  python3 motor_financiero.py reporte-excel-oficial
"""

import sys
import os
import io
import json
import calendar
from decimal import Decimal, ROUND_HALF_UP
from datetime import datetime, date, timedelta
from urllib.parse import urlparse, parse_qs

SECOND_PRORATION_TRANSITION_DAY = 10


def _build_dsn_from_env():
    """Construye la cadena de conexión PostgreSQL/CockroachDB desde las variables de entorno del backend."""
    raw_url = (
        os.environ.get("SPRING_DATASOURCE_URL")
        or os.environ.get("DB_URL")
        or os.environ.get("COCKROACH_URL")
        or "jdbc:postgresql://brass-ogress-19371.jxf.gcp-us-east1.cockroachlabs.cloud:26257/brass-ogress-19371.defaultdb?sslmode=require"
    )
    if raw_url.startswith("jdbc:"):
        raw_url = raw_url[len("jdbc:"):]

    db_user = os.environ.get("SPRING_DATASOURCE_USERNAME") or os.environ.get("DB_USER") or "josuevm18"
    db_pass = os.environ.get("SPRING_DATASOURCE_PASSWORD") or os.environ.get("DB_PASS") or "WPNJgnM0BWMzDqt-hnWz3g"

    parsed = urlparse(raw_url)
    host = parsed.hostname or "brass-ogress-19371.jxf.gcp-us-east1.cockroachlabs.cloud"
    port = parsed.port or 26257
    dbname = (parsed.path or "/defaultdb").lstrip("/") or "defaultdb"
    user = parsed.username or db_user
    password = parsed.password or db_pass
    qs = parse_qs(parsed.query)
    sslmode = qs.get("sslmode", ["require"])[0]

    return {
        "host": host,
        "port": port,
        "dbname": dbname,
        "user": user,
        "password": password,
        "sslmode": sslmode,
    }


def get_db_connection():
    """Conecta a CockroachDB probando las credenciales configuradas y el fallback del clúster."""
    import psycopg2

    cfg = _build_dsn_from_env()
    candidates = [
        cfg,
        {
            **cfg,
            "dbname": "brass-ogress-19371.defaultdb",
            "password": "WPNJgnM0BWMzDqt-hnWz3g",
        },
        {
            **cfg,
            "dbname": "defaultdb",
            "password": "yK9b7gYvRHi6oZMYCKQllw",
        },
    ]

    last_err = None
    for cand in candidates:
        try:
            conn = psycopg2.connect(
                host=cand["host"],
                port=cand["port"],
                dbname=cand["dbname"],
                user=cand["user"],
                password=cand["password"],
                sslmode=cand["sslmode"],
                connect_timeout=10,
            )
            return conn
        except Exception as exc:
            last_err = exc
    raise RuntimeError(f"No se pudo conectar a CockroachDB: {last_err}")


# ===========================================================================
# 1. MOTOR MATEMÁTICO DE PRORRATEOS Y CICLOS DE FACTURACIÓN
# ===========================================================================
def add_months(d: date, months: int) -> date:
    month_zero = d.month - 1 + months
    year = d.year + month_zero // 12
    month = month_zero % 12 + 1
    last_day = calendar.monthrange(year, month)[1]
    return date(year, month, min(d.day, last_day))


def billing_date(d: date, dia_cobro: int) -> date:
    last_day = calendar.monthrange(d.year, d.month)[1]
    return date(d.year, d.month, min(max(1, dia_cobro), last_day))


def calcular_fecha_fin_mensual(fecha_inicio: date, dia_cobro: int = 1) -> date:
    if dia_cobro <= 0:
        last_day = calendar.monthrange(fecha_inicio.year, fecha_inicio.month)[1]
        return date(fecha_inicio.year, fecha_inicio.month, last_day)
    candidato = billing_date(fecha_inicio, dia_cobro)
    if fecha_inicio >= candidato:
        candidato = billing_date(add_months(fecha_inicio, 1), dia_cobro)
    return candidato


def calcular_prorrateo(payload: dict) -> dict:
    """
    Calcula el prorrateo exacto (1.° Prorrateo, 2.° Prorrateo o Anual):
    - Días 1 al 9 (PRIMER_PRORRATEO):
      Cobra los días efectivos desde fecha_inicio hasta el día 1 del mes siguiente.
      Redondeo comercial a entero (ROUND_HALF_UP).
    - Días 10 al 31 (SEGUNDO_PRORRATEO):
      El primer pago cubre del día X del mes M al día X del mes M+1.
      Calcula los días adicionales desde el aniversario (día X del mes M+1) hasta fin del mes M+1,
      y programa el cobro unificado (precio_plan + monto_adicional) para el día 1 del mes M+2.
    """
    precio_raw = payload.get("precio_plan", 29)
    precio_plan = Decimal(str(precio_raw))
    fecha_str = str(payload.get("fecha_inicio") or date.today().isoformat()).split("T")[0].split(" ")[0]
    fecha_inicio = date.fromisoformat(fecha_str)
    tipo_suscripcion = str(payload.get("tipo_suscripcion") or "MENSUAL").upper().strip()
    dia_cobro = int(payload.get("dia_cobro", 1))

    if tipo_suscripcion == "ANUAL":
        try:
            fecha_fin = date(fecha_inicio.year + 1, fecha_inicio.month, fecha_inicio.day)
        except ValueError:
            fecha_fin = date(fecha_inicio.year + 1, fecha_inicio.month, 28)
        monto_final = precio_plan.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        return {
            "tipoProrrateo": "NINGUNO",
            "tipoSuscripcion": "ANUAL",
            "precioPlan": float(precio_plan),
            "fechaInicio": fecha_inicio.isoformat(),
            "fechaFin": fecha_fin.isoformat(),
            "fechaCobroSiguiente": fecha_fin.isoformat(),
            "diasTotales": 365,
            "diaCapacitacion": fecha_inicio.day,
            "diasCobrados": 365,
            "diasNoConsumidos": 0,
            "descuento": 0.0,
            "montoProrrateado": float(monto_final),
            "montoAdicional": 0.0,
            "diasProrrateoAdicional": 0,
            "fechaInicioProrrateoAdicional": None,
            "fechaFinProrrateoAdicional": None,
            "montoTotal": float(monto_final),
        }

    if fecha_inicio.day >= SECOND_PRORATION_TRANSITION_DAY:
        fecha_inicio_adicional = add_months(fecha_inicio, 1)
        dias_mes_adicional = calendar.monthrange(fecha_inicio_adicional.year, fecha_inicio_adicional.month)[1]
        fecha_fin_adicional = date(fecha_inicio_adicional.year, fecha_inicio_adicional.month, dias_mes_adicional)
        fecha_fin_exclusiva = fecha_fin_adicional + timedelta(days=1)
        dias_adicionales = max(0, (fecha_fin_exclusiva - fecha_inicio_adicional).days)

        precio_diario = (precio_plan / Decimal(dias_mes_adicional)).quantize(
            Decimal("0.0000000001"), rounding=ROUND_HALF_UP
        )
        monto_adicional = (precio_diario * Decimal(dias_adicionales)).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )
        monto_total = (precio_plan + monto_adicional).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        dias_ciclo_inicial = max(1, (fecha_fin_exclusiva - fecha_inicio).days)

        return {
            "tipoProrrateo": "SEGUNDO_PRORRATEO",
            "tipoSuscripcion": "MENSUAL",
            "precioPlan": float(precio_plan),
            "fechaInicio": fecha_inicio.isoformat(),
            "fechaFin": fecha_fin_exclusiva.isoformat(),
            "fechaCobroSiguiente": fecha_fin_exclusiva.isoformat(),
            "diasTotales": dias_mes_adicional,
            "diaCapacitacion": fecha_inicio.day,
            "diasCobrados": dias_ciclo_inicial,
            "diasNoConsumidos": 0,
            "descuento": 0.0,
            "montoProrrateado": float(monto_total),
            "montoAdicional": float(monto_adicional),
            "diasProrrateoAdicional": dias_adicionales,
            "fechaInicioProrrateoAdicional": fecha_inicio_adicional.isoformat(),
            "fechaFinProrrateoAdicional": fecha_fin_adicional.isoformat(),
            "montoTotal": float(monto_total),
        }

    # PRIMER_PRORRATEO (días 1 al 9)
    fecha_fin_ciclo = calcular_fecha_fin_mensual(fecha_inicio, dia_cobro)
    fecha_inicio_ciclo = billing_date(add_months(fecha_fin_ciclo, -1), dia_cobro)
    dias_totales = max(1, (fecha_fin_ciclo - fecha_inicio_ciclo).days)
    dias_cobrados = max(1, (fecha_fin_ciclo - fecha_inicio).days)
    dias_no_consumidos = max(0, dias_totales - dias_cobrados)

    precio_diario = (precio_plan / Decimal(dias_totales)).quantize(
        Decimal("0.0000000001"), rounding=ROUND_HALF_UP
    )
    monto_calculado = precio_diario * Decimal(dias_cobrados)
    monto_final_redondeado = monto_calculado.quantize(Decimal("1"), rounding=ROUND_HALF_UP)
    descuento = (precio_plan - monto_calculado).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    return {
        "tipoProrrateo": "PRIMER_PRORRATEO",
        "tipoSuscripcion": "MENSUAL",
        "precioPlan": float(precio_plan),
        "fechaInicio": fecha_inicio.isoformat(),
        "fechaFin": fecha_fin_ciclo.isoformat(),
        "fechaCobroSiguiente": fecha_fin_ciclo.isoformat(),
        "diasTotales": dias_totales,
        "diaCapacitacion": fecha_inicio.day,
        "diasCobrados": dias_cobrados,
        "diasNoConsumidos": dias_no_consumidos,
        "descuento": float(descuento),
        "montoProrrateado": float(monto_final_redondeado),
        "montoAdicional": 0.0,
        "diasProrrateoAdicional": 0,
        "fechaInicioProrrateoAdicional": None,
        "fechaFinProrrateoAdicional": None,
        "montoTotal": float(monto_final_redondeado),
    }


# ===========================================================================
# 2. PROYECCIÓN DE FACTURACIÓN PRÓXIMO MES (SIN BLOQUEADOS)
# ===========================================================================
def calcular_proyeccion_siguiente_mes() -> dict:
    from psycopg2.extras import RealDictCursor

    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT 
                    c.id,
                    c.ruc,
                    c.razon_social,
                    ec.nombre as estado_cuenta,
                    COALESCE(sp.tipo_suscripcion, sv.tipo_suscripcion, 'MENSUAL') as tipo_suscripcion,
                    COALESCE(sp.precio, sv.precio, 29.0) as precio_plan,
                    COALESCE(pp.nombre_plan, pv.nombre_plan, 'Plan Emprende') as nombre_plan,
                    vp.id as venta_pendiente_id,
                    vp.tipo_prorrateo as pend_tipo_prorrateo,
                    vp.monto_prorrateado as pend_descuento_prorrateo,
                    vp.monto_prorrateo_adicional as pend_monto_adicional,
                    vp.monto_total as pend_monto_total,
                    vp.fecha_venta as pend_fecha_venta,
                    v_last.tipo_prorrateo as last_tipo_prorrateo,
                    v_last.monto_prorrateo_adicional as last_monto_adicional,
                    v_last.monto_total as last_monto_total,
                    v_last.observaciones as last_obs,
                    p_last.observaciones as last_pago_obs,
                    sc.fecha_inicio as serv_inicio,
                    sc.fecha_fin as serv_fin,
                    sc.monto_prorrateo as serv_monto_prorr,
                    sc.estado as serv_estado
                FROM cliente c
                JOIN estado_cliente ec ON ec.id = c.estado_id
                LEFT JOIN venta vp ON vp.id = (
                    SELECT v2.id FROM venta v2 
                    WHERE v2.cliente_id = c.id AND v2.estado_venta = 'PENDIENTE_PAGO'
                    ORDER BY v2.fecha_venta ASC LIMIT 1
                )
                LEFT JOIN suscripcion sp ON sp.id = vp.suscripcion_id
                LEFT JOIN plan pp ON pp.id = sp.plan_id
                LEFT JOIN venta v_last ON v_last.id = (
                    SELECT v3.id FROM venta v3 
                    WHERE v3.cliente_id = c.id AND v3.estado_venta = 'PAGADA'
                    ORDER BY v3.fecha_venta DESC LIMIT 1
                )
                LEFT JOIN pago p_last ON p_last.id = (
                    SELECT p3.id FROM pago p3
                    JOIN venta vp3 ON vp3.id = p3.venta_id
                    WHERE vp3.cliente_id = c.id AND p3.estado_pago = 'PAGADO'
                    ORDER BY p3.fecha_pago DESC LIMIT 1
                )
                LEFT JOIN suscripcion sv ON sv.id = v_last.suscripcion_id
                LEFT JOIN plan pv ON pv.id = sv.plan_id
                LEFT JOIN servicio_cliente sc ON sc.id = (
                    SELECT sc2.id FROM servicio_cliente sc2 
                    WHERE sc2.cliente_id = c.id 
                    ORDER BY sc2.fecha_fin DESC LIMIT 1
                )
                WHERE c.activo = true 
                  AND ec.nombre != 'BLOQUEADO'
                ORDER BY c.razon_social ASC;
            """)
            clientes = cur.fetchall()
    finally:
        conn.close()

    total_proyectado = 0.0
    total_regulares = 0.0
    total_prorrateados = 0.0
    total_adelantos = 0.0
    count_regulares = 0
    count_prorrateados = 0
    count_adelantos = 0
    count_anuales_sin_cobro = 0
    desglose_clientes = []

    ahora = datetime.now()
    meses_nombres = [
        "", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ]
    if ahora.month == 12:
        next_month_name = "Enero"
        next_month_year = ahora.year + 1
        first_next_month = datetime(ahora.year + 1, 1, 1)
    else:
        next_month_name = meses_nombres[ahora.month + 1]
        next_month_year = ahora.year
        first_next_month = datetime(ahora.year, ahora.month + 1, 1)

    for c in clientes:
        tipo_sub = (c["tipo_suscripcion"] or "MENSUAL").upper()
        tarifa_base = float(c["precio_plan"] or 29.0)
        serv_inicio = c["serv_inicio"]
        serv_fin = c["serv_fin"]

        if tipo_sub == "ANUAL" or tarifa_base >= 150.0:
            # Un plan anual solo se cobra una vez al año (en su mes de inicio).
            # Si inició hace menos de 300 días, su anualidad sigue vigente y no se vuelve a cobrar el próximo mes.
            if not serv_inicio or serv_inicio > ahora - timedelta(days=300):
                count_anuales_sin_cobro += 1
                continue
            if serv_fin and serv_fin > ahora + timedelta(days=32):
                count_anuales_sin_cobro += 1
                continue

        pend_prorr = (c["pend_tipo_prorrateo"] or "NINGUNO").upper()
        last_prorr = (c["last_tipo_prorrateo"] or "NINGUNO").upper()
        tipo_prorr = pend_prorr if pend_prorr != "NINGUNO" else last_prorr

        monto_adic = float(c["pend_monto_adicional"] or c["last_monto_adicional"] or 0.0)
        pend_total = float(c["pend_monto_total"] or 0.0)
        last_total = float(c["last_monto_total"] or 0.0)
        serv_prorr = float(c["serv_monto_prorr"] or 0.0)

        obs_combined = f"{c.get('last_obs') or ''} {c.get('last_pago_obs') or ''}".lower()
        es_adelanto = False
        if serv_inicio and serv_inicio >= first_next_month:
            es_adelanto = True
        elif "adelanto" in obs_combined and serv_fin and serv_fin > first_next_month + timedelta(days=20):
            es_adelanto = True

        monto_a_cobrar = tarifa_base
        es_prorrateado = False
        concepto = f"Tarifa Base ({c['nombre_plan'] or 'Plan Emprende'})"

        if tipo_prorr == "SEGUNDO_PRORRATEO":
            if pend_total > tarifa_base:
                monto_a_cobrar = pend_total
                adic_real = round(pend_total - tarifa_base, 2)
                es_prorrateado = True
                concepto = f"Segundo Prorrateo (Mes S/ {tarifa_base:.2f} + Adic. S/ {adic_real:.2f})"
            elif monto_adic > 0:
                monto_a_cobrar = tarifa_base + monto_adic
                es_prorrateado = True
                concepto = f"Segundo Prorrateo (Mes S/ {tarifa_base:.2f} + Adic. S/ {monto_adic:.2f})"
            elif last_total > tarifa_base:
                monto_a_cobrar = last_total
                adic_real = round(last_total - tarifa_base, 2)
                es_prorrateado = True
                concepto = f"Segundo Prorrateo (Mes S/ {tarifa_base:.2f} + Adic. S/ {adic_real:.2f})"
        elif tipo_prorr == "PRIMER_PRORRATEO" and 0 < pend_total < tarifa_base:
            monto_a_cobrar = pend_total
            es_prorrateado = True
            concepto = f"Primer Prorrateo (S/ {pend_total:.2f})"
        elif tipo_prorr == "PRIMER_PRORRATEO" and 0 < serv_prorr < tarifa_base and not c["venta_pendiente_id"]:
            monto_a_cobrar = serv_prorr
            es_prorrateado = True
            concepto = f"Primer Prorrateo (S/ {serv_prorr:.2f})"
        elif es_adelanto:
            monto_a_cobrar = last_total if last_total > 0 else tarifa_base
            concepto = f"Adelanto Pagado ({c['nombre_plan'] or 'Plan Emprende'})"

        total_proyectado += monto_a_cobrar
        if es_prorrateado:
            total_prorrateados += monto_a_cobrar
            count_prorrateados += 1
        elif es_adelanto:
            total_adelantos += monto_a_cobrar
            count_adelantos += 1
        else:
            total_regulares += monto_a_cobrar
            count_regulares += 1

        desglose_clientes.append({
            "id": str(c["id"]),
            "ruc": c["ruc"],
            "razon_social": c["razon_social"] or "",
            "monto": round(monto_a_cobrar, 2),
            "es_prorrateado": es_prorrateado,
            "es_adelanto": es_adelanto,
            "concepto": concepto,
            "tarifa_base": tarifa_base,
            "estado_cuenta": c["estado_cuenta"],
        })

    return {
        "periodo_proyectado": f"{next_month_name} {next_month_year}",
        "total_proyectado": round(total_proyectado, 2),
        "total_regulares": round(total_regulares, 2),
        "total_prorrateados": round(total_prorrateados, 2),
        "total_adelantos": round(total_adelantos, 2),
        "clientes_no_bloqueados": len(clientes),
        "count_regulares": count_regulares,
        "count_prorrateados": count_prorrateados,
        "count_adelantos": count_adelantos,
        "count_anuales_sin_cobro": count_anuales_sin_cobro,
        "desglose": desglose_clientes,
    }


# ===========================================================================
# 3. AUDITORÍA DE CARTERA Y ANOMALÍAS
# ===========================================================================
def auditar_cartera_completa() -> list:
    from psycopg2.extras import RealDictCursor

    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT 
                    c.id, c.ruc, c.razon_social, c.telefono,
                    ec.nombre as estado_cuenta,
                    s.tipo_suscripcion, s.precio as precio_plan,
                    p.nombre_plan,
                    u.nombre as vendedor,
                    c.fecha_registro,
                    sc.id as servicio_id, sc.fecha_inicio as serv_inicio, sc.fecha_fin as serv_fin, sc.estado as serv_estado,
                    COUNT(pg.id) as total_pagos,
                    COALESCE(SUM(pg.monto), 0) as total_recaudado,
                    MAX(pg.fecha_pago) as ultimo_pago
                FROM cliente c
                LEFT JOIN estado_cliente ec ON ec.id = c.estado_id
                LEFT JOIN venta v ON v.cliente_id = c.id
                LEFT JOIN suscripcion s ON s.id = v.suscripcion_id
                LEFT JOIN plan p ON p.id = s.plan_id
                LEFT JOIN usuario_admin u ON u.id = v.vendedor_id
                LEFT JOIN servicio_cliente sc ON sc.id = (
                    SELECT sc2.id FROM servicio_cliente sc2 WHERE sc2.cliente_id = c.id ORDER BY sc2.fecha_fin DESC LIMIT 1
                )
                LEFT JOIN pago pg ON pg.venta_id = v.id AND (pg.estado_pago = 'PAGADO' OR pg.estado_pago = 'CONFIRMADO')
                WHERE c.activo = true
                GROUP BY c.id, c.ruc, c.razon_social, c.telefono, ec.nombre, s.tipo_suscripcion, 
                         s.precio, p.nombre_plan, u.nombre, c.fecha_registro, sc.id, sc.fecha_inicio, sc.fecha_fin, sc.estado;
            """)
            rows = cur.fetchall()
    finally:
        conn.close()

    ahora = datetime.now()
    hallazgos = []

    for r in rows:
        anomalias = []
        precio = float(r["precio_plan"] or 29.0)
        recaudado = float(r["total_recaudado"] or 0.0)
        total_p = int(r["total_pagos"] or 0)
        serv_fin = r["serv_fin"]

        if r["serv_estado"] == "ACTIVO" and total_p == 0:
            anomalias.append("SERVICIO_ACTIVO_SIN_PAGOS")

        if serv_fin and serv_fin < ahora and r["estado_cuenta"] == "HABILITADO":
            anomalias.append("VENCIDO_NO_SUSPENDIDO")

        if not r["servicio_id"]:
            anomalias.append("SIN_SERVICIO_PROGRAMADO")

        if anomalias:
            hallazgos.append({
                "cliente_id": str(r["id"]),
                "ruc": r["ruc"],
                "razon_social": r["razon_social"] or "",
                "telefono": r["telefono"] or "",
                "plan": r["nombre_plan"] or "Plan Emprende",
                "tarifa": precio,
                "total_recaudado": recaudado,
                "ultimo_pago": r["ultimo_pago"].strftime("%d/%m/%Y") if r["ultimo_pago"] else "Nunca",
                "fecha_fin_servicio": serv_fin.strftime("%d/%m/%Y") if serv_fin else "Sin asignar",
                "anomalias": ", ".join(anomalias),
                "criticidad": "ALTA" if "SERVICIO_ACTIVO_SIN_PAGOS" in anomalias else "MEDIA",
            })

    return hallazgos


# ===========================================================================
# 4. GENERADOR DE EXCEL EJECUTIVO MULTI-HOJA
# ===========================================================================
def generar_suite_financiera_excel() -> bytes:
    from psycopg2.extras import RealDictCursor
    import pandas as pd
    from openpyxl.styles import Font, PatternFill, Alignment
    from openpyxl.utils import get_column_letter

    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT 
                    c.id, c.ruc, c.razon_social, c.telefono, c.email,
                    ec.nombre as estado_cuenta,
                    u.nombre as vendedor,
                    p.nombre_plan,
                    s.tipo_suscripcion,
                    s.precio as tarifa,
                    c.fecha_registro
                FROM cliente c
                LEFT JOIN estado_cliente ec ON ec.id = c.estado_id
                LEFT JOIN venta v ON v.id = (
                    SELECT id FROM venta v2 WHERE v2.cliente_id = c.id ORDER BY fecha_venta DESC LIMIT 1
                )
                LEFT JOIN suscripcion s ON s.id = v.suscripcion_id
                LEFT JOIN plan p ON p.id = s.plan_id
                LEFT JOIN usuario_admin u ON u.id = v.vendedor_id
                WHERE c.activo = true
                ORDER BY c.razon_social ASC;
            """)
            clientes = cur.fetchall()

            cur.execute("""
                SELECT 
                    v.cliente_id,
                    p.monto,
                    COALESCE(sc.fecha_inicio, p.fecha_pago) as fecha_ref
                FROM pago p
                JOIN venta v ON v.id = p.venta_id
                LEFT JOIN servicio_cliente sc ON sc.venta_id = v.id
                WHERE (p.estado_pago = 'PAGADO' OR p.estado_pago = 'CONFIRMADO')
                  AND v.estado_venta != 'CANCELADA';
            """)
            pagos = cur.fetchall()

            cur.execute("""
                SELECT 
                    c.ruc as "RUC",
                    COALESCE(c.razon_social, c.nombre_comercial, '') as "Razón Social",
                    COALESCE(c.telefono, '') as "Teléfono",
                    COALESCE(u.nombre, 'Por asignar') as "Asesor",
                    COALESCE(p.nombre_plan, 'Plan Emprende') as "Plan",
                    COALESCE(s.tipo_suscripcion, 'MENSUAL') as "Modalidad",
                    'Pendiente de Capacitación' as "Estado",
                    COALESCE(pg.monto, s.precio, 29.0) as "Monto Pagado (S/)",
                    TO_CHAR(pg.fecha_pago, 'DD/MM/YYYY') as "Fecha Pago",
                    TO_CHAR(c.fecha_registro, 'DD/MM/YYYY') as "Fecha Registro"
                FROM cliente c
                JOIN estado_cliente ec ON ec.id = c.estado_id
                LEFT JOIN venta v ON v.id = (
                    SELECT id FROM venta v2 WHERE v2.cliente_id = c.id ORDER BY fecha_venta DESC LIMIT 1
                )
                LEFT JOIN suscripcion s ON s.id = v.suscripcion_id
                LEFT JOIN plan p ON p.id = s.plan_id
                LEFT JOIN usuario_admin u ON u.id = v.vendedor_id
                LEFT JOIN pago pg ON pg.venta_id = v.id AND (pg.estado_pago = 'PAGADO' OR pg.estado_pago = 'CONFIRMADO')
                WHERE c.activo = true 
                  AND ec.nombre = 'POR_CAPACITAR'
                ORDER BY c.fecha_registro DESC;
            """)
            por_capacitar_rows = cur.fetchall()
    finally:
        conn.close()

    proyeccion = calcular_proyeccion_siguiente_mes()
    proy_map = {str(item["id"]): item for item in proyeccion["desglose"]}

    pagos_map = {}
    meses_set = set()
    for pg in pagos:
        cid = str(pg["cliente_id"])
        f = pg["fecha_ref"]
        if not f:
            continue
        m_key = f.strftime("%Y-%m")
        meses_set.add(m_key)
        if cid not in pagos_map:
            pagos_map[cid] = {}
        pagos_map[cid][m_key] = pagos_map[cid].get(m_key, 0.0) + float(pg["monto"] or 0)

    meses = sorted(list(meses_set))
    mes_nombres = {
        "01": "Ene", "02": "Feb", "03": "Mar", "04": "Abr",
        "05": "May", "06": "Jun", "07": "Jul", "08": "Ago",
        "09": "Set", "10": "Oct", "11": "Nov", "12": "Dic"
    }

    matriz_rows = []
    for c in clientes:
        cid = str(c["id"])
        proy_cliente = proy_map.get(cid)
        proy_monto = proy_cliente["monto"] if (proy_cliente and c["estado_cuenta"] != "BLOQUEADO") else 0.0
        proy_detalle = proy_cliente["concepto"] if (proy_cliente and c["estado_cuenta"] != "BLOQUEADO") else "BLOQUEADO (Sin facturación)"

        item = {
            "RUC": c["ruc"],
            "Razón Social": c["razon_social"] or "",
            "Teléfono": c["telefono"] or "",
            "Asesor": c["vendedor"] or "Por asignar",
            "Plan": c["nombre_plan"] or "Plan Emprende",
            "Suscripción": c["tipo_suscripcion"] or "MENSUAL",
            "Tarifa": float(c["tarifa"] or 29.0),
            "Estado": c["estado_cuenta"] or "HABILITADO",
        }
        tot = 0.0
        c_p = pagos_map.get(cid, {})
        for m in meses:
            y, mn = m.split("-")
            header = f"{mes_nombres.get(mn, mn)} {y}"
            val = c_p.get(m, 0.0)
            item[header] = val if val > 0 else ""
            tot += val
        item["TOTAL HISTÓRICO (S/)"] = tot
        item[f"FACTURAR {proyeccion['periodo_proyectado'].upper()} (S/)"] = proy_monto
        item["TIPO COBRO SIGUIENTE"] = proy_detalle
        matriz_rows.append(item)

    df_matriz = pd.DataFrame(matriz_rows)

    proyeccion_rows = []
    for p_item in proyeccion["desglose"]:
        tipo_cobro_lbl = (
            "Prorrateado"
            if p_item["es_prorrateado"]
            else ("Adelanto Pagado" if p_item.get("es_adelanto") else "Tarifa Regular")
        )
        proyeccion_rows.append({
            "RUC": p_item["ruc"],
            "Razón Social": p_item["razon_social"],
            "Estado Cuenta": p_item["estado_cuenta"],
            "Tipo Cobro": tipo_cobro_lbl,
            "Detalle / Concepto": p_item["concepto"],
            "Tarifa Base (S/)": p_item["tarifa_base"],
            f"Monto a Facturar ({proyeccion['periodo_proyectado']})": p_item["monto"],
        })
    df_proyeccion = pd.DataFrame(proyeccion_rows)

    alertas = auditar_cartera_completa()
    df_alertas = pd.DataFrame(alertas if alertas else [{
        "RUC": "-", "Razón Social": "Sin alertas críticas detectadas", "Anomalías": "Cartera en orden", "Criticidad": "BAJA"
    }])

    df_por_capacitar = pd.DataFrame(por_capacitar_rows if por_capacitar_rows else [{
        "RUC": "-", "Razón Social": "Sin clientes por capacitar", "Plan": "-", "Modalidad": "-", "Estado": "-", "Monto Pagado (S/)": 0.0
    }])

    resumen_asesor = (
        df_matriz.groupby("Asesor")["TOTAL HISTÓRICO (S/)"].agg(["count", "sum"]).reset_index()
        if not df_matriz.empty
        else pd.DataFrame(columns=["Asesor Comercial", "Clientes Asignados", "Monto Total Cobrado (S/)"])
    )
    if not resumen_asesor.empty:
        resumen_asesor.columns = ["Asesor Comercial", "Clientes Asignados", "Monto Total Cobrado (S/)"]

    buf = io.BytesIO()
    with pd.ExcelWriter(buf, engine="openpyxl") as writer:
        df_matriz.to_excel(writer, sheet_name="Matriz de Cobros", index=False)
        df_proyeccion.to_excel(writer, sheet_name=f"Proyección {proyeccion['periodo_proyectado']}"[:31], index=False)
        df_por_capacitar.to_excel(writer, sheet_name="Por Capacitar", index=False)
        df_alertas.to_excel(writer, sheet_name="Auditoría y Alertas", index=False)
        resumen_asesor.to_excel(writer, sheet_name="Resumen por Asesor", index=False)

        wb = writer.book
        for ws in wb.worksheets:
            h_fill = PatternFill(start_color="111827", end_color="111827", fill_type="solid")
            h_font = Font(name="Segoe UI", size=10, bold=True, color="FFFFFF")
            for col in range(1, ws.max_column + 1):
                c = ws.cell(row=1, column=col)
                c.fill = h_fill
                c.font = h_font
                c.alignment = Alignment(horizontal="center", vertical="center")

            for col in ws.columns:
                m_len = max(len(str(c.value or "")) for c in col)
                col_letter = get_column_letter(col[0].column)
                ws.column_dimensions[col_letter].width = max(m_len + 3, 12)

    buf.seek(0)
    return buf.getvalue()


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "proyeccion-mes"
    if cmd == "calcular-prorrateo":
        raw_payload = sys.argv[2] if len(sys.argv) > 2 else "{}"
        payload = json.loads(raw_payload)
        res = calcular_prorrateo(payload)
        print(json.dumps(res, ensure_ascii=False))
    elif cmd == "proyeccion-mes":
        res = calcular_proyeccion_siguiente_mes()
        print(json.dumps(res, ensure_ascii=False))
    elif cmd == "auditoria-cartera":
        res = auditar_cartera_completa()
        print(json.dumps(res[:100], ensure_ascii=False))
    elif cmd == "reporte-excel-oficial":
        sys.stdout.buffer.write(generar_suite_financiera_excel())
    else:
        raise ValueError(f"Comando desconocido: {cmd}")


if __name__ == "__main__":
    main()

