"""
=============================================================================
MOTOR AVANZADO DE FACTURACIÓN Y PROYECCIÓN FINANCIERA EN PYTHON
=============================================================================
"""

import os
import io
import math
from datetime import datetime, date, timedelta
import psycopg2
from psycopg2.extras import RealDictCursor
import pandas as pd
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

def get_db_connection():
    db_url = os.environ.get(
        "COCKROACH_URL",
        os.environ.get(
            "DB_URL",
            "postgresql://josuevm18:yK9b7gYvRHi6oZMYCKQllw@brass-ogress-19371.jxf.gcp-us-east1.cockroachlabs.cloud:26257/defaultdb?sslmode=require"
        )
    )
    if db_url.startswith("jdbc:"):
        db_url = db_url.replace("jdbc:", "")
    return psycopg2.connect(db_url)

# ---------------------------------------------------------------------------
# 1. CÁLCULO PRECISO DE PROYECCIÓN DE FACTURACIÓN PRÓXIMO MES (SIN BLOQUEADOS)
# ---------------------------------------------------------------------------
def calcular_proyeccion_siguiente_mes():
    """
    Calcula exactamente cuánto se debe facturar el próximo mes:
    - Excluye clientes con estado 'BLOQUEADO'.
    - Distingue si corresponde el monto regular (tarifa mensual base) o monto prorrateado.
    - Maneja suscripciones anuales (si están vigentes no facturan el mes entrante).
    """
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT 
                    c.id,
                    c.ruc,
                    c.razon_social,
                    ec.nombre as estado_cuenta,
                    s.tipo_suscripcion,
                    s.precio as precio_plan,
                    p.nombre_plan,
                    v.tipo_prorrateo,
                    v.monto_prorrateado,
                    v.monto_prorrateo_adicional,
                    v.monto_total as monto_venta,
                    sc.fecha_inicio as serv_inicio,
                    sc.fecha_fin as serv_fin,
                    sc.monto_prorrateo as serv_monto_prorr,
                    sc.estado as serv_estado
                FROM cliente c
                JOIN estado_cliente ec ON ec.id = c.estado_id
                LEFT JOIN venta v ON v.id = (
                    SELECT v2.id FROM venta v2 
                    WHERE v2.cliente_id = c.id 
                    ORDER BY v2.fecha_venta DESC LIMIT 1
                )
                LEFT JOIN suscripcion s ON s.id = v.suscripcion_id
                LEFT JOIN plan p ON p.id = s.plan_id
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
    count_regulares = 0
    count_prorrateados = 0
    count_anuales_sin_cobro = 0
    desglose_clientes = []

    ahora = datetime.now()
    if ahora.month == 12:
        next_month_name = "Enero"
        next_month_year = ahora.year + 1
    else:
        meses_nombres = ["", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]
        next_month_name = meses_nombres[ahora.month + 1]
        next_month_year = ahora.year

    for c in clientes:
        tipo_sub = (c["tipo_suscripcion"] or "MENSUAL").upper()
        tarifa_base = float(c["precio_plan"] or 29.0)
        tipo_prorr = (c["tipo_prorrateo"] or "NINGUNO").upper()
        monto_adic = float(c["monto_prorrateo_adicional"] or 0.0)
        monto_prorr = float(c["monto_prorrateado"] or c["serv_monto_prorr"] or 0.0)
        serv_fin = c["serv_fin"]

        if tipo_sub == "ANUAL":
            if serv_fin and serv_fin > ahora + timedelta(days=32):
                count_anuales_sin_cobro += 1
                continue

        monto_a_cobrar = tarifa_base
        es_prorrateado = False
        concepto = "Tarifa Mensual Regular"

        if tipo_prorr == "SEGUNDO_PRORRATEO" and monto_adic > 0:
            monto_a_cobrar = monto_adic
            es_prorrateado = True
            concepto = f"Segundo Prorrateo (Fracción S/ {monto_adic:.2f})"
        elif tipo_prorr == "PRIMER_PRORRATEO" and monto_prorr > 0 and serv_fin and serv_fin <= ahora:
            monto_a_cobrar = monto_prorr
            es_prorrateado = True
            concepto = f"Primer Prorrateo (S/ {monto_prorr:.2f})"
        else:
            monto_a_cobrar = tarifa_base
            concepto = f"Tarifa Base ({c['nombre_plan'] or 'Plan Emprende'})"

        total_proyectado += monto_a_cobrar
        if es_prorrateado:
            total_prorrateados += monto_a_cobrar
            count_prorrateados += 1
        else:
            total_regulares += monto_a_cobrar
            count_regulares += 1

        desglose_clientes.append({
            "id": c["id"],
            "ruc": c["ruc"],
            "razon_social": c["razon_social"] or "",
            "monto": round(monto_a_cobrar, 2),
            "es_prorrateado": es_prorrateado,
            "concepto": concepto,
            "tarifa_base": tarifa_base,
            "estado_cuenta": c["estado_cuenta"]
        })

    return {
        "periodo_proyectado": f"{next_month_name} {next_month_year}",
        "total_proyectado": round(total_proyectado, 2),
        "total_regulares": round(total_regulares, 2),
        "total_prorrateados": round(total_prorrateados, 2),
        "clientes_no_bloqueados": len(clientes),
        "count_regulares": count_regulares,
        "count_prorrateados": count_prorrateados,
        "count_anuales_sin_cobro": count_anuales_sin_cobro,
        "desglose": desglose_clientes
    }

# ---------------------------------------------------------------------------
# 2. MOTOR DE AUDITORÍA Y DETECCIÓN DE ANOMALÍAS EN CARTERA
# ---------------------------------------------------------------------------
def auditar_cartera_completa():
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
                LEFT JOIN servicio_cliente sc ON sc.cliente_id = c.id
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
                "cliente_id": r["id"],
                "ruc": r["ruc"],
                "razon_social": r["razon_social"] or "",
                "telefono": r["telefono"] or "",
                "plan": r["nombre_plan"] or "Plan Emprende",
                "tarifa": precio,
                "total_recaudado": recaudado,
                "ultimo_pago": r["ultimo_pago"].strftime("%d/%m/%Y") if r["ultimo_pago"] else "Nunca",
                "fecha_fin_servicio": serv_fin.strftime("%d/%m/%Y") if serv_fin else "Sin asignar",
                "anomalias": ", ".join(anomalias),
                "criticidad": "ALTA" if "SERVICIO_ACTIVO_SIN_PAGOS" in anomalias else "MEDIA"
            })

    return hallazgos

# ---------------------------------------------------------------------------
# 3. GENERADOR EJECUTIVO MULTI-HOJA CON PROYECCIÓN AUTOMÁTICA DEL PRÓXIMO MES
# ---------------------------------------------------------------------------
def generar_suite_financiera_excel():
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
    finally:
        conn.close()

    proyeccion = calcular_proyeccion_siguiente_mes()
    proy_map = {item["id"]: item for item in proyeccion["desglose"]}

    pagos_map = {}
    meses_set = set()
    for pg in pagos:
        cid = pg["cliente_id"]
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
        cid = c["id"]
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
        proyeccion_rows.append({
            "RUC": p_item["ruc"],
            "Razón Social": p_item["razon_social"],
            "Estado Cuenta": p_item["estado_cuenta"],
            "Tipo Cobro": "Prorrateado" if p_item["es_prorrateado"] else "Tarifa Regular",
            "Detalle / Concepto": p_item["concepto"],
            "Tarifa Base (S/)": p_item["tarifa_base"],
            f"Monto a Facturar ({proyeccion['periodo_proyectado']})": p_item["monto"]
        })
    df_proyeccion = pd.DataFrame(proyeccion_rows)

    alertas = auditar_cartera_completa()
    df_alertas = pd.DataFrame(alertas if alertas else [{
        "RUC": "-", "Razón Social": "Sin alertas críticas detectadas", "Anomalías": "Cartera en orden", "Criticidad": "BAJA"
    }])

    resumen_asesor = df_matriz.groupby("Asesor")["TOTAL HISTÓRICO (S/)"].agg(["count", "sum"]).reset_index()
    resumen_asesor.columns = ["Asesor Comercial", "Clientes Asignados", "Monto Total Cobrado (S/)"]

    buf = io.BytesIO()
    with pd.ExcelWriter(buf, engine="openpyxl") as writer:
        df_matriz.to_excel(writer, sheet_name="Matriz de Cobros", index=False)
        df_proyeccion.to_excel(writer, sheet_name=f"Proyección {proyeccion['periodo_proyectado']}", index=False)
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
                m_len = max(len(str(c.value or '')) for c in col)
                col_letter = get_column_letter(col[0].column)
                ws.column_dimensions[col_letter].width = max(m_len + 3, 12)

    buf.seek(0)
    return buf.getvalue()

if __name__ == "__main__":
    p = calcular_proyeccion_siguiente_mes()
    print(f"Período: {p['periodo_proyectado']}")
    print(f"Total Proyectado: S/ {p['total_proyectado']}")
    print(f"Regulares: S/ {p['total_regulares']} ({p['count_regulares']} clientes)")
    print(f"Prorrateados: S/ {p['total_prorrateados']} ({p['count_prorrateados']} clientes)")
    print(f"Clientes no bloqueados evaluados: {p['clientes_no_bloqueados']}")
