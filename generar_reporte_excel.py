"""
=============================================================================
GENERADOR OFICIAL DE REPORTE EXCEL (COCKROACHDB -> XLSX)
Conciliación matemática 1:1 con el historial de clientes y pagos reales.
=============================================================================
"""

import os
import io
import re
from datetime import datetime
import psycopg2
from psycopg2.extras import RealDictCursor
import pandas as pd
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

# Cargar variables de entorno
def get_db_connection():
    db_url = os.environ.get(
        "COCKROACH_URL",
        os.environ.get(
            "DB_URL",
            "postgresql://josuevm18:yK9b7gYvRHi6oZMYCKQllw@brass-ogress-19371.jxf.gcp-us-east1.cockroachlabs.cloud:26257/defaultdb?sslmode=require"
        )
    )
    # Sanitizar prefijo jdbc si viene configurado así
    if db_url.startswith("jdbc:"):
        db_url = db_url.replace("jdbc:", "")
    
    # Manejar caso de cockroachdb cloud
    return psycopg2.connect(db_url)

def generar_excel_oficial_bytes():
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # 1. Obtener todos los clientes con su metadata
            cur.execute("""
                SELECT 
                    c.id,
                    c.ruc,
                    c.razon_social,
                    c.nombre_comercial,
                    c.telefono,
                    c.email,
                    c.direccion,
                    c.departamento,
                    c.provincia,
                    c.distrito,
                    c.nombres,
                    c.apellidos,
                    c.dni,
                    c.usuario_sol,
                    c.url_acceso,
                    c.fecha_registro,
                    ec.nombre as estado_cuenta,
                    ct.codigo as color_tag,
                    e.nombre as entorno,
                    u.nombre as vendedor,
                    p.nombre_plan as plan_nombre,
                    s.tipo_suscripcion,
                    s.precio as precio_plan
                FROM cliente c
                LEFT JOIN estado_cliente ec ON ec.id = c.estado_id
                LEFT JOIN color_tag ct ON ct.id = c.color_tag_id
                LEFT JOIN entorno e ON e.id = c.entorno_id
                LEFT JOIN venta v ON v.id = (
                    SELECT v2.id FROM venta v2 
                    WHERE v2.cliente_id = c.id 
                    ORDER BY v2.fecha_venta DESC LIMIT 1
                )
                LEFT JOIN usuario_admin u ON u.id = v.vendedor_id
                LEFT JOIN suscripcion s ON s.id = v.suscripcion_id
                LEFT JOIN plan p ON p.id = s.plan_id
                ORDER BY c.fecha_registro ASC;
            """)
            clientes = cur.fetchall()

            # 2. Obtener todos los pagos confirmados reales con su periodo y fecha
            cur.execute("""
                SELECT 
                    p.id as pago_id,
                    v.cliente_id,
                    p.monto,
                    p.fecha_pago,
                    p.estado_pago,
                    COALESCE(sc.fecha_inicio, p.fecha_pago, v.fecha_venta) as periodo_inicio
                FROM pago p
                JOIN venta v ON v.id = p.venta_id
                LEFT JOIN servicio_cliente sc ON sc.venta_id = v.id
                WHERE (p.estado_pago = 'PAGADO' OR p.estado_pago = 'CONFIRMADO')
                  AND v.estado_venta != 'CANCELADA'
                ORDER BY periodo_inicio ASC;
            """)
            pagos = cur.fetchall()

    finally:
        conn.close()

    # Procesar pagos en matriz mensual por cliente
    # month_key format: 'YYYY-MM'
    pagos_por_cliente_mes = {}
    meses_set = set()

    for p in pagos:
        c_id = p["cliente_id"]
        fecha_ref = p["periodo_inicio"] or p["fecha_pago"]
        if not fecha_ref:
            continue
        m_key = fecha_ref.strftime("%Y-%m")
        meses_set.add(m_key)
        
        if c_id not in pagos_por_cliente_mes:
            pagos_por_cliente_mes[c_id] = {}
        
        monto = float(p["monto"] or 0)
        pagos_por_cliente_mes[c_id][m_key] = pagos_por_cliente_mes[c_id].get(m_key, 0.0) + monto

    meses_ordenados = sorted(list(meses_set))
    if not meses_ordenados:
        meses_ordenados = [datetime.now().strftime("%Y-%m")]

    nombres_meses = {
        "01": "Ene", "02": "Feb", "03": "Mar", "04": "Abr",
        "05": "May", "06": "Jun", "07": "Jul", "08": "Ago",
        "09": "Set", "10": "Oct", "11": "Nov", "12": "Dic"
    }

    # Armar lista de registros planos
    rows = []
    for c in clientes:
        c_id = c["id"]
        nombre_completo = f"{c['nombres'] or ''} {c['apellidos'] or ''}".strip() or "—"
        
        row_data = {
            "RUC": c["ruc"],
            "Razón Social": c["razon_social"] or "",
            "Nombre Comercial": c["nombre_comercial"] or "",
            "Teléfono": c["telefono"] or "",
            "Email": c["email"] or "",
            "Representante": nombre_completo,
            "DNI": c["dni"] or "",
            "Plan": c["plan_nombre"] or "Plan Emprende",
            "Suscripción": c["tipo_suscripcion"] or "MENSUAL",
            "Tarifa Base": float(c["precio_plan"] or 29.0),
            "Asesor Comercial": c["vendedor"] or "Por asignar",
            "Estado Cuenta": c["estado_cuenta"] or "HABILITADO",
            "Entorno": c["entorno"] or "Producción",
            "Fecha Registro": c["fecha_registro"].strftime("%d/%m/%Y") if c["fecha_registro"] else "",
        }

        total_cliente = 0.0
        c_pagos = pagos_por_cliente_mes.get(c_id, {})
        for m in meses_ordenados:
            y, month_num = m.split("-")
            label_mes = f"{nombres_meses.get(month_num, month_num)} {y}"
            val = c_pagos.get(m, 0.0)
            row_data[label_mes] = val if val > 0 else ""
            total_cliente += val

        row_data["TOTAL COBRADO (S/)"] = total_cliente
        rows.append(row_data)

    df = pd.DataFrame(rows)

    # Exportar a Excel con formato profesional vía openpyxl
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, sheet_name="Reporte Oficial", index=False)
        workbook = writer.book
        worksheet = writer.sheets["Reporte Oficial"]

        # Estilos corporativos
        header_fill = PatternFill(start_color="1F2937", end_color="1F2937", fill_type="solid")
        header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
        border_thin = Border(
            left=Side(style="thin", color="E5E7EB"),
            right=Side(style="thin", color="E5E7EB"),
            top=Side(style="thin", color="E5E7EB"),
            bottom=Side(style="thin", color="E5E7EB")
        )
        total_fill = PatternFill(start_color="F0FDF4", end_color="F0FDF4", fill_type="solid")
        total_font = Font(name="Calibri", size=11, bold=True, color="166534")

        # Formatear encabezados
        for col_idx in range(1, len(df.columns) + 1):
            cell = worksheet.cell(row=1, column=col_idx)
            cell.fill = header_fill
            cell.font = header_font
            cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)

        # Formatear celdas y ajustar anchos
        for row in worksheet.iter_rows(min_row=2, max_row=len(rows) + 1, min_col=1, max_col=len(df.columns)):
            for cell in row:
                cell.border = border_thin
                col_name = df.columns[cell.column - 1]
                if "TOTAL" in col_name:
                    cell.fill = total_fill
                    cell.font = total_font
                    cell.number_format = '"S/ " #,##0.00'
                elif any(col_name.startswith(m) for m in nombres_meses.values()) or col_name == "Tarifa Base":
                    if isinstance(cell.value, (int, float)):
                        cell.number_format = '"S/ " #,##0.00'
                        cell.alignment = Alignment(horizontal="right")

        for col in worksheet.columns:
            max_len = max(len(str(cell.value or '')) for cell in col)
            col_letter = get_column_letter(col[0].column)
            worksheet.column_dimensions[col_letter].width = max(max_len + 4, 12)

    output.seek(0)
    return output.getvalue()

if __name__ == "__main__":
    data = generar_excel_oficial_bytes()
    with open("reporte_oficial_clientes.xlsx", "wb") as f:
        f.write(data)
    print(f"Excel oficial generado con éxito: {len(data)} bytes")
