'use client';

import React, { useMemo } from 'react';
import { FileSpreadsheet, RefreshCw, User } from 'lucide-react';
import { Client } from './ClientesTodosTab';

export type SellerMetric = {
  vendedor: string;
  totalClientes: number;
  ventasDia: number;
  ventasMes: number;
  ventasAno: number;
};

interface ReportesExcelTabProps {
  clients?: Client[];
  payments?: any[];
  sellerMetrics?: SellerMetric[];
  handleExportExcel?: () => void;
  loadData?: (token?: string | null, showNotice?: boolean) => void;
  isSyncing?: boolean;
  token?: string | null;
  periodoIngresoTipo?: string;
  setPeriodoIngresoTipo?: (v: any) => void;
  fechaCustomFilter?: string;
  setFechaCustomFilter?: (v: string) => void;
  search?: string;
  setSearch?: (v: string) => void;
  sellerFilter?: string;
  setSellerFilter?: (v: string) => void;
  uniqueSellers?: string[];
  colorFilter?: string;
  setColorFilter?: (v: string) => void;
  regimenFilter?: string;
  setRegimenFilter?: (v: string) => void;
  planFilter?: string;
  setPlanFilter?: (v: string) => void;
  estadoCuentaFilter?: string;
  setEstadoCuentaFilter?: (v: string) => void;
  capacitacionFilter?: string;
  setCapacitacionFilter?: (v: string) => void;
  suscripcionFilter?: string;
  setSuscripcionFilter?: (v: string) => void;
  filterClientUnified?: (c: Client) => boolean;
  setEditingClient?: (client: Client) => void;
  COLOR_MAP?: any;
}

export default function ReportesExcelTab({
  clients = [],
  payments = [],
  sellerMetrics,
  handleExportExcel,
  loadData = () => {},
  isSyncing = false,
  token,
  periodoIngresoTipo = 'TODOS',
  setPeriodoIngresoTipo = () => {},
  fechaCustomFilter = '',
  setFechaCustomFilter = () => {},
  search = '',
  setSearch = () => {},
  sellerFilter = '',
  setSellerFilter = () => {},
  uniqueSellers = [],
  colorFilter = '',
  setColorFilter = () => {},
  regimenFilter = '',
  setRegimenFilter = () => {},
  planFilter = '',
  setPlanFilter = () => {},
  estadoCuentaFilter = '',
  setEstadoCuentaFilter = () => {},
  capacitacionFilter = '',
  setCapacitacionFilter = () => {},
  suscripcionFilter = '',
  setSuscripcionFilter = () => {},
  filterClientUnified,
  setEditingClient = () => {},
  COLOR_MAP,
}: ReportesExcelTabProps) {
  const safeClients = useMemo(() => (Array.isArray(clients) ? clients : []), [clients]);
  const filterFn = filterClientUnified || (() => true);
  const reportFilteredList = safeClients.filter((c) => filterFn(c));

  // Generador avanzado de Excel en formato Excel XML (Diseño con estilos, colores y fuentes formateadas)
  const exportToExcelLocal = async () => {
    if (handleExportExcel) {
      handleExportExcel();
      return;
    }

    const detailResults = await Promise.all(
      reportFilteredList.map(async (c) => {
        if (!token) return { clientId: c.id, operaciones: [] as any[], pagos: [] as any[] };
        try {
          const res = await fetch(`/api/admin/clientes/${c.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          return {
            clientId: c.id,
            operaciones: data?.data?.operacionesHistorial || [],
            pagos: data?.data?.pagosHistorial || [],
          };
        } catch (e) {
          return { clientId: c.id, operaciones: [] as any[], pagos: [] as any[] };
        }
      })
    );
    const idKey = (value: any) => (value === undefined || value === null || value === '' ? '' : String(value));
    const operacionesByClient = new Map<string, any[]>();
    detailResults.forEach((item) => operacionesByClient.set(idKey(item.clientId), item.operaciones));
    const detailPayments = detailResults.flatMap((item) =>
      (item.pagos || []).map((p: any) => ({ ...p, clienteId: item.clientId }))
    );
    const rawPaymentsForExcel = [...(Array.isArray(payments) ? payments : []), ...detailPayments];
    const paidPayments = rawPaymentsForExcel.filter((p) => {
      const estadoPago = (p?.estadoPago || '').toUpperCase();
      const estadoVenta = (p?.venta?.estadoVenta || p?.estadoVenta || '').toUpperCase();
      return estadoPago === 'PAGADO' && estadoVenta !== 'CANCELADA' && (p?.fechaPago || p?.fechaRegistro);
    });
    const paymentClientId = (p: any) => idKey(p?.venta?.cliente?.id ?? p?.clienteId ?? p?.venta?.clienteId);
    const paymentVentaId = (p: any) => idKey(p?.venta?.id ?? p?.ventaId);
    const paymentsByClient = new Map<string, any[]>();
    const paymentsByVenta = new Map<string, any>();
    const seenPaymentKeys = new Set<string>();
    paidPayments.forEach((p) => {
      const clienteId = paymentClientId(p);
      const ventaId = paymentVentaId(p);
      const uniquePaymentKey = String(p?.id ?? p?.pagoId ?? (ventaId ? `venta-${ventaId}` : `${p?.fechaPago || p?.fechaRegistro}-${p?.monto}`));
      if (seenPaymentKeys.has(uniquePaymentKey)) return;
      seenPaymentKeys.add(uniquePaymentKey);
      if (clienteId) {
        const list = paymentsByClient.get(clienteId) || [];
        list.push(p);
        paymentsByClient.set(clienteId, list);
      }
      if (ventaId && !paymentsByVenta.has(ventaId)) {
        paymentsByVenta.set(ventaId, p);
      }
    });

    const monthKeyFromDate = (rawDate?: string) => {
      if (!rawDate) return null;
      const d = new Date(rawDate);
      if (isNaN(d.getTime())) return null;
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    };

    const addMonthsToKey = (key: string, monthsToAdd: number) => {
      const [year, month] = key.split('-').map(Number);
      const d = new Date(year, month - 1 + monthsToAdd, 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    };

    const normalizeSubscription = (value?: string) => (value || '').toUpperCase().trim();
    const normalizePlanKey = (value?: string) => {
      const normalized = (value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .replace(/^PLAN\s+/, '')
        .trim();
      if (normalized === 'INICIAL' || normalized === 'INICIA') return 'INICIA';
      if (normalized === 'LIDER') return 'LIDER';
      return normalized;
    };
    const isUpgradeOperation = (op: any) => (op?.tipoVenta || op?.tipoOperacion || '').toUpperCase() === 'MEJORA_PLAN';
    const isAnnualSubscriptionOperation = (op: any, client?: Client) =>
      normalizeSubscription(op?.tipoSuscripcion || client?.tipoSuscripcion) === 'ANUAL';
    const isAnnualOperation = (op: any, client?: Client) =>
      !isUpgradeOperation(op) && isAnnualSubscriptionOperation(op, client);
    const isAnnualUpgradeOperation = (op: any, client?: Client) =>
      isUpgradeOperation(op) && isAnnualSubscriptionOperation(op, client);
    const isAnnualClient = (client?: Client) => normalizeSubscription(client?.tipoSuscripcion) === 'ANUAL';
    const operationAmount = (op: any) => {
      const ventaId = idKey(op?.ventaId ?? op?.venta?.id);
      const paymentForVenta = ventaId ? paymentsByVenta.get(ventaId) : null;
      return Number(op?.montoPagado ?? paymentForVenta?.monto ?? op?.montoVenta ?? op?.montoTotal ?? op?.precioLista ?? 0);
    };
    const operationMonthSource = (op: any, client?: Client) =>
      isAnnualOperation(op, client)
        ? op?.fechaInicioServicio || op?.fechaPago || op?.fechaOperacion
        : op?.fechaPago || op?.fechaOperacion;
    const annualClientAmount = (client: Client) => {
      const directAmount = Number(client.montoMensual || client.montoSiguienteCobro || 0);
      return directAmount;
    };
    const annualOperationAmount = (op: any, client: Client) => {
      const planAmount = annualClientAmount(client);
      const listAmount = Number(op?.precioLista || 0);
      const rawAmount = operationAmount(op);
      return rawAmount || listAmount || planAmount;
    };
    const excelOperationAmount = (op: any, client: Client) =>
      isAnnualOperation(op, client) ? annualOperationAmount(op, client) : operationAmount(op);
    const paymentMonthKey = (p: any) => monthKeyFromDate(p?.fechaPago || p?.fechaRegistro);
    const paymentAmount = (p: any) => Number(p?.monto ?? p?.venta?.montoTotal ?? 0);
    const isPaidOperation = (op: any) => {
      const estadoPago = (op?.estadoPago || '').toUpperCase();
      const estadoVenta = (op?.estadoVenta || '').toUpperCase();
      return estadoPago === 'PAGADO' || estadoVenta === 'PAGADA';
    };
    const operationCoversPayment = (op: any, p: any) => {
      const pagoId = idKey(p?.id ?? p?.pagoId);
      const ventaId = paymentVentaId(p);
      return Boolean((pagoId && idKey(op?.pagoId) === pagoId) || (ventaId && idKey(op?.ventaId) === ventaId));
    };
    const shouldUsePaymentFallback = (p: any, client: Client, operaciones: any[]) => {
      if (isAnnualClient(client)) return false;
      return !operaciones.some((op) => operationCoversPayment(op, p));
    };
    const monthIndexFromKey = (key: string) => {
      const [year, month] = key.split('-').map(Number);
      return year * 12 + month - 1;
    };
    const addMonthRangeToSet = (startKey: string, endKey: string) => {
      const startIndex = monthIndexFromKey(startKey);
      const endIndex = monthIndexFromKey(endKey);
      if (!Number.isFinite(startIndex) || !Number.isFinite(endIndex)) return;

      const first = Math.min(startIndex, endIndex);
      const last = Math.max(startIndex, endIndex);
      for (let index = first; index <= last; index += 1) {
        const year = Math.floor(index / 12);
        const month = (index % 12) + 1;
        monthKeysSet.add(`${year}-${String(month).padStart(2, '0')}`);
      }
    };
    const annualMonthsCovered = (op: any) => {
      const startKey = monthKeyFromDate(op?.fechaInicioServicio || op?.fechaPago || op?.fechaOperacion);
      const endKey = monthKeyFromDate(op?.fechaFinServicio);
      if (!startKey || !endKey) return 12;

      const diff = monthIndexFromKey(endKey) - monthIndexFromKey(startKey);
      return diff >= 1 ? diff : 12;
    };

    const monthNames = [
      'Enero',
      'Febrero',
      'Marzo',
      'Abril',
      'Mayo',
      'Junio',
      'Julio',
      'Agosto',
      'Setiembre',
      'Octubre',
      'Noviembre',
      'Diciembre',
    ];

    const monthKeysSet = new Set<string>();
    const today = new Date();
    const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    reportFilteredList.forEach((c) => {
      const registroKey = monthKeyFromDate(c.fechaRegistro);
      if (registroKey) addMonthRangeToSet(registroKey, currentMonthKey);

      const operaciones = (operacionesByClient.get(idKey(c.id)) || []).filter(isPaidOperation);
      operaciones.forEach((op) => {
        const key = monthKeyFromDate(operationMonthSource(op, c));
        if (!key) return;
        if (isAnnualOperation(op, c)) {
          const monthsCovered = annualMonthsCovered(op);
          for (let i = 0; i < monthsCovered; i += 1) {
            monthKeysSet.add(addMonthsToKey(key, i));
          }
        } else {
          addMonthRangeToSet(key, currentMonthKey);
        }
      });
      (paymentsByClient.get(idKey(c.id)) || []).forEach((p) => {
        if (!shouldUsePaymentFallback(p, c, operaciones)) return;
        const key = paymentMonthKey(p);
        if (key) monthKeysSet.add(key);
      });

    });

    if (monthKeysSet.size === 0) {
      monthKeysSet.add(currentMonthKey);
    }

    const monthKeys = Array.from(monthKeysSet).sort();
    const monthHeaders = monthKeys.map((key) => {
      const [year, month] = key.split('-').map(Number);
      return `${monthNames[month - 1]} ${year} (S/)`;
    });

    const headers = [
      'RUC',
      'Razón Social',
      'Nombre Comercial',
      'Dirección',
      'Departamento',
      'Provincia',
      'Distrito',
      'Teléfono WhatsApp',
      'Email Empresa',
      'Representante Legal',
      'DNI',
      'Teléfono Personal',
      'Email Personal',
      'Régimen Tributario',
      'Plan Contratado',
      'Tipo Suscripción',
      'Tarifa Mensual (S/)',
      'Vendedor Asignado',
      'Color Atención',
      'Estado Comercial',
      'Estado Capacitación',
      'Fecha Capacitación',
      'Fecha Vencimiento',
      'Monto Prorrateado Vigente (S/)',
      'Dias Prorrateados',
      'Tipo Prorrateo',
      'Prorrateo Adicional (S/)',
      'Dias Prorrateo Adicional',
      'Inicio Prorrateo Adicional',
      'Fin Prorrateo Adicional',
      'Fecha Alta / Registro',
      'Usuario SOL',
      'Usuario Sistema',
      'Clave Sistema',
      'URL Sistema',
      ...monthHeaders,
      'TOTAL COBROS (S/)',
    ];

    const xmlRows = reportFilteredList.map((c) => {
      const repNombre = `${c.nombres || ''} ${c.apellidos || ''}`.trim() || '—';
      const monthlySums = new Map<string, number>();
      monthKeys.forEach((key) => monthlySums.set(key, 0));
      const annualSpans: Array<{ startKey: string; amount: number; monthsCovered: number }> = [];

      const operaciones = (operacionesByClient.get(idKey(c.id)) || []).filter(isPaidOperation);
      operaciones.forEach((op) => {
        const rawDate = operationMonthSource(op, c);
        const key = monthKeyFromDate(rawDate);
        if (key) {
          const montoOperacion = excelOperationAmount(op, c);
          if (isAnnualOperation(op, c)) {
            annualSpans.push({ startKey: key, amount: montoOperacion || annualClientAmount(c), monthsCovered: annualMonthsCovered(op) });
          } else {
            monthlySums.set(key, (monthlySums.get(key) || 0) + montoOperacion);
          }
        }
      });

      // Una mejora anual actualiza el monto del tramo anual vigente,
      // conservando las mismas fechas y sus doce meses de cobertura.
      operaciones
        .filter((op) => isAnnualUpgradeOperation(op, c))
        .sort((a, b) => {
          const aKey = monthKeyFromDate(a?.fechaPago || a?.fechaOperacion) || '';
          const bKey = monthKeyFromDate(b?.fechaPago || b?.fechaOperacion) || '';
          return monthIndexFromKey(aKey) - monthIndexFromKey(bKey);
        })
        .forEach((op) => {
          const upgradeKey = monthKeyFromDate(op?.fechaPago || op?.fechaOperacion);
          const updatedPlanAmount = Number(op?.precioPlan ?? c.montoMensual ?? 0);
          if (!upgradeKey || updatedPlanAmount <= 0) return;

          const upgradeIndex = monthIndexFromKey(upgradeKey);
          const activeSpan = annualSpans
            .filter((span) => {
              const startIndex = monthIndexFromKey(span.startKey);
              return upgradeIndex >= startIndex && upgradeIndex < startIndex + span.monthsCovered;
            })
            .sort((a, b) => monthIndexFromKey(b.startKey) - monthIndexFromKey(a.startKey))[0];

          if (activeSpan) activeSpan.amount = updatedPlanAmount;
        });
      let fallbackPaymentsTotal = 0;
      (paymentsByClient.get(idKey(c.id)) || []).forEach((p) => {
        if (!shouldUsePaymentFallback(p, c, operaciones)) return;
        const key = paymentMonthKey(p);
        if (!key) return;
        const montoPago = paymentAmount(p);
        monthlySums.set(key, (monthlySums.get(key) || 0) + montoPago);
        fallbackPaymentsTotal += montoPago;
      });
      annualSpans.sort((a, b) => monthIndexFromKey(a.startKey) - monthIndexFromKey(b.startKey));

      const totalOperaciones = operaciones.reduce((acc, op) => acc + excelOperationAmount(op, c), 0);
      const totalCobros = totalOperaciones + fallbackPaymentsTotal;

      const cells = [
        c.ruc,
        c.razonSocial || '',
        c.nombreComercial || '',
        c.direccion || '',
        c.departamento || '',
        c.provincia || '',
        c.distrito || '',
        c.telefono || '',
        c.email || '',
        repNombre,
        c.dni || '',
        c.telefonoPersonal || '',
        c.emailPersonal || '',
        c.regimenTributario || '',
        c.planContratado || '',
        c.tipoSuscripcion || '',
        Number(c.montoMensual || 0).toFixed(2),
        c.vendedor || '',
        c.colorTag || '',
        c.estadoCuenta || '',
        c.estadoCapacitacion || '',
        c.fechaCapacitacion || '',
        c.fechaVencimientoMensual || '',
        Number(c.montoSiguienteCobro || 0).toFixed(2),
        c.diasProrrateados || 0,
        c.tipoProrrateo || 'NINGUNO',
        Number(c.montoProrrateoAdicional || 0).toFixed(2),
        c.diasProrrateoAdicional || 0,
        c.fechaInicioProrrateoAdicional || '',
        c.fechaFinProrrateoAdicional || '',
        c.fechaRegistro || '',
        c.usuarioSol || '',
        c.usuarioSistema || '',
        c.claveSistema || '',
        c.linkSistema || '',
      ];

      const numericBaseCellIndexes = new Set([16, 23, 24, 26, 27]);
      const baseCellsXml = cells
        .map(
          (val, idx) => {
            const isNumberCell = numericBaseCellIndexes.has(idx);
            return `<Cell ss:StyleID="${isNumberCell ? 'NumberStyle' : 'DataStyle'}"><Data ss:Type="${
              isNumberCell ? 'Number' : 'String'
            }">${String(val).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</Data></Cell>`;
          }
        )
        .join('');

      const monthCellsXml: string[] = [];
      for (let i = 0; i < monthKeys.length; i += 1) {
        const key = monthKeys[i];
        const annualSpan = annualSpans.find((span) => span.startKey === key);
        if (annualSpan) {
          const remainingColumns = monthKeys.length - i;
          const mergeCount = Math.min(Math.max(annualSpan.monthsCovered - 1, 0), remainingColumns - 1);
          monthCellsXml.push(
            `<Cell ss:StyleID="AnnualStyle" ss:MergeAcross="${mergeCount}"><Data ss:Type="Number">${annualSpan.amount.toFixed(2)}</Data></Cell>`
          );
          i += mergeCount;
        } else {
          const amount = monthlySums.get(key) || 0;
          monthCellsXml.push(
            amount > 0
              ? `<Cell ss:StyleID="NumberStyle"><Data ss:Type="Number">${amount.toFixed(2)}</Data></Cell>`
              : '<Cell ss:StyleID="DataStyle"><Data ss:Type="String">-</Data></Cell>'
          );
        }
      }

      const totalCellXml = `<Cell ss:StyleID="NumberStyle"><Data ss:Type="Number">${totalCobros.toFixed(2)}</Data></Cell>`;

      return `<Row>${baseCellsXml}${monthCellsXml.join('')}${totalCellXml}</Row>`;
    });

    const excelTemplate = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="HeaderStyle">
   <Font ss:Bold="1" ss:Color="#FFFFFF" ss:Size="11" ss:FontName="Calibri"/>
   <Interior ss:Color="#0047FF" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#002DB3"/>
   </Borders>
  </Style>
  <Style ss:ID="DataStyle">
   <Font ss:Size="10" ss:FontName="Calibri"/>
   <Alignment ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="NumberStyle">
   <Font ss:Size="10" ss:FontName="Calibri" ss:Bold="1"/>
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <NumberFormat ss:Format="#,##0.00"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="AnnualStyle">
   <Font ss:Size="10" ss:FontName="Calibri" ss:Bold="1" ss:Color="#0F5132"/>
   <Interior ss:Color="#D1E7DD" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <NumberFormat ss:Format="#,##0.00"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#BADBCC"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#BADBCC"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#BADBCC"/>
   </Borders>
  </Style>
 </Styles>
 <Worksheet ss:Name="Consolidado Clientes">
  <Table>
   <Row ss:Height="26">
    ${headers
      .map((h) => `<Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">${h}</Data></Cell>`)
      .join('')}
   </Row>
   ${xmlRows.join('\n')}
  </Table>
 </Worksheet>
</Workbook>`;

    const blob = new Blob([excelTemplate], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Reporte_Consolidado_Clientes_${new Date().toISOString().slice(0, 10)}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Cálculo exacto en hora local de Perú para Ventas de Hoy, Mes y Año
  const calculatedSellerMetrics: SellerMetric[] = useMemo(() => {
    if (sellerMetrics && sellerMetrics.length > 0) return sellerMetrics;

    const now = new Date();
    const todayLocalStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const sMap = new Map<string, { totalClientes: number; ventasDia: number; ventasMes: number; ventasAno: number }>();

    safeClients.forEach((c) => {
      const v = c.vendedor || 'Por asignar';
      if (!sMap.has(v)) {
        sMap.set(v, { totalClientes: 0, ventasDia: 0, ventasMes: 0, ventasAno: 0 });
      }
      const data = sMap.get(v)!;
      data.totalClientes += 1;
    });

    const countedPaymentIds = new Set<string>();
    (payments || []).forEach((p) => {
      const estadoPago = (p?.estadoPago || '').toUpperCase();
      const estadoVenta = (p?.venta?.estadoVenta || p?.estadoVenta || '').toUpperCase();
      const paymentKey = String(p?.venta?.id || p?.ventaId || p?.id || p?.codigoOperacion || `${p?.fechaPago || p?.fechaRegistro}-${p?.monto}`);
      if (estadoPago !== 'PAGADO' || estadoVenta === 'CANCELADA' || countedPaymentIds.has(paymentKey) || !p?.fechaPago) return;

      const payDate = new Date(p.fechaPago);
      if (isNaN(payDate.getTime())) return;

      const vendedor = p?.venta?.vendedor?.nombre || p?.venta?.vendedor?.username || p?.vendedorNombre || 'Por asignar';
      if (!sMap.has(vendedor)) {
        sMap.set(vendedor, { totalClientes: 0, ventasDia: 0, ventasMes: 0, ventasAno: 0 });
      }

      const data = sMap.get(vendedor)!;
      const monto = Number(p.monto) || 0;
      const payLocalStr = `${payDate.getFullYear()}-${String(payDate.getMonth() + 1).padStart(2, '0')}-${String(payDate.getDate()).padStart(2, '0')}`;

      countedPaymentIds.add(paymentKey);
      if (payLocalStr === todayLocalStr) data.ventasDia += monto;
      if (payDate.getMonth() === currentMonth && payDate.getFullYear() === currentYear) data.ventasMes += monto;
      if (payDate.getFullYear() === currentYear) data.ventasAno += monto;
    });

    return Array.from(sMap.entries()).map(([vendedor, data]) => ({
      vendedor,
      ...data,
    }));
  }, [clients, payments, sellerMetrics]);

  const defaultColorMap: Record<string, { hex: string; label: string }> = {
    VERDE: { hex: '#198754', label: '🟢 Verde' },
    ROJO: { hex: '#dc3545', label: '🔴 Rojo' },
    AMARILLO: { hex: '#ffc107', label: '🟡 Amarillo' },
    AZUL: { hex: '#0d6efd', label: '🔵 Azul' },
  };

  const getColorInfo = (tag?: string) => {
    const key = tag || 'VERDE';
    if (COLOR_MAP && COLOR_MAP[key]) return COLOR_MAP[key];
    return defaultColorMap[key] || defaultColorMap.VERDE;
  };

  return (
    <div className="custom-card p-4">
      <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
        <div>
          <h2 className="h6 fw-bold text-dark mb-1">Centro de Reportes General y Rendimiento Comercial</h2>
          <p className="text-muted small mb-0">Consolidado general de ventas, recaudación e historial exportable a Excel.</p>
        </div>
        <div className="d-flex gap-2">
          <button onClick={exportToExcelLocal} className="btn btn-success btn-sm fw-semibold d-flex align-items-center gap-1 shadow-sm">
            <FileSpreadsheet size={15} />
            <span>Exportar Excel de Clientes</span>
          </button>
          <button
            onClick={() => loadData(token, true)}
            disabled={isSyncing}
            className="btn btn-outline-secondary btn-sm rounded-pill px-3 fw-semibold d-inline-flex align-items-center gap-1 shadow-sm"
          >
            <RefreshCw size={14} className={isSyncing ? 'spin-anim' : ''} />
            <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar'}</span>
          </button>
        </div>
      </div>

      {/* Tarjetas de Rendimiento por Vendedor (Día, Mes y Año) */}
      <h6 className="fw-bold text-dark mb-3">Resumen de Ventas por Vendedor (Día, Mes y Año)</h6>
      {calculatedSellerMetrics.length === 0 ? (
        <div className="text-center text-muted py-3 border rounded bg-light mb-4 small">
          No hay vendedores asignados a cuentas registradas actualmente.
        </div>
      ) : (
        <div className="row g-3 mb-4">
          {calculatedSellerMetrics.map((sm) => (
            <div key={sm.vendedor} className="col-md-6 col-lg-4">
              <div className="custom-card p-3 border-top border-3 border-primary shadow-sm bg-light">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <strong className="text-dark d-flex align-items-center gap-2">
                    <User size={16} className="text-primary" />
                    <span>{sm.vendedor}</span>
                  </strong>
                  <span className="badge bg-primary rounded-pill px-2.5 py-1">{sm.totalClientes} Clientes</span>
                </div>
                <div className="row text-center g-2 pt-2 border-top">
                  <div className="col-4 border-end">
                    <small className="text-muted d-block" style={{ fontSize: '0.7rem' }}>Ventas Día</small>
                    <strong className="text-dark small">S/ {sm.ventasDia.toFixed(2)}</strong>
                  </div>
                  <div className="col-4 border-end">
                    <small className="text-muted d-block" style={{ fontSize: '0.7rem' }}>Ventas Mes</small>
                    <strong className="text-success small">S/ {sm.ventasMes.toFixed(2)}</strong>
                  </div>
                  <div className="col-4">
                    <small className="text-muted d-block" style={{ fontSize: '0.7rem' }}>Ventas Año</small>
                    <strong className="text-primary small">S/ {sm.ventasAno.toFixed(2)}</strong>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filtros de Reportes */}
      <div className="row g-2 mb-4 p-3 bg-light rounded-3 border">
        <div className="col-md-3">
          <label className="form-label small fw-semibold text-muted mb-1">Periodo Venta (Ingresos)</label>
          <select
            className="form-select form-select-sm fw-bold border-primary"
            value={periodoIngresoTipo}
            onChange={(e) => setPeriodoIngresoTipo(e.target.value)}
          >
            <option value="TODOS">Todos los Periodos</option>
            <option value="HOY">Ventas de Hoy (Día)</option>
            <option value="MES_ACTUAL">Ventas del Mes Actual</option>
            <option value="ANO_ACTUAL">Ventas del Año (2026)</option>
            <option value="FECHA_CUSTOM">Seleccionar Fecha Específica...</option>
          </select>
        </div>

        {periodoIngresoTipo === 'FECHA_CUSTOM' && (
          <div className="col-md-2">
            <label className="form-label small fw-semibold text-muted mb-1">Seleccionar Fecha</label>
            <input
              type="date"
              className="form-control form-control-sm"
              value={fechaCustomFilter}
              onChange={(e) => setFechaCustomFilter(e.target.value)}
            />
          </div>
        )}
        <div className="col-md-3">
          <label className="form-label small fw-semibold text-muted mb-1">Búsqueda General</label>
          <input
            className="form-control form-control-sm"
            placeholder="RUC, Razón Social, Teléfono, Vendedor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="col-md-2">
          <label className="form-label small fw-semibold text-muted mb-1">Vendedor</label>
          <select className="form-select form-select-sm" value={sellerFilter} onChange={(e) => setSellerFilter(e.target.value)}>
            <option value="">Todos los Vendedores</option>
            {uniqueSellers.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-2">
          <label className="form-label small fw-semibold text-muted mb-1">Color Atención</label>
          <select className="form-select form-select-sm" value={colorFilter} onChange={(e) => setColorFilter(e.target.value)}>
            <option value="">Todos los Colores</option>
            <option value="VERDE">🟢 Verde</option>
            <option value="ROJO">🔴 Rojo</option>
            <option value="AMARILLO">🟡 Amarillo</option>
            <option value="AZUL">🔵 Azul</option>
          </select>
        </div>
        <div className="col-md-2">
          <label className="form-label small fw-semibold text-muted mb-1">Régimen</label>
          <select className="form-select form-select-sm" value={regimenFilter} onChange={(e) => setRegimenFilter(e.target.value)}>
            <option value="">Todos los Regímenes</option>
            <option value="MYPE_TRIBUTARIO">MYPE Tributario</option>
            <option value="REGIMEN_GENERAL">Régimen General</option>
            <option value="RER">Régimen Especial - RER</option>
            <option value="NRUS">Nuevo RUS - NRUS</option>
          </select>
        </div>
        <div className="col-md-2">
          <label className="form-label small fw-semibold text-muted mb-1">Plan</label>
          <select className="form-select form-select-sm" value={planFilter} onChange={(e) => setPlanFilter(e.target.value)}>
            <option value="">Todos los Planes</option>
            <option value="INICIA">Plan Inicia</option>
            <option value="EMPRENDE">Plan Emprende</option>
            <option value="IMPULSA">Plan Impulsa</option>
            <option value="EMPRESARIAL">Plan Empresarial</option>
            <option value="LIDER">Plan Líder</option>
          </select>
        </div>
        <div className="col-md-2">
          <label className="form-label small fw-semibold text-muted mb-1">Estado Cuenta</label>
          <select className="form-select form-select-sm" value={estadoCuentaFilter} onChange={(e) => setEstadoCuentaFilter(e.target.value)}>
            <option value="">Todos los Estados</option>
            <option value="POR_COBRAR">POR_COBRAR</option>
            <option value="POR_CAPACITAR">POR_CAPACITAR</option>
            <option value="HABILITADO">HABILITADO</option>
            <option value="VENCIDO">VENCIDO</option>
            <option value="BLOQUEADO">BLOQUEADO</option>
          </select>
        </div>
        <div className="col-md-2">
          <label className="form-label small fw-semibold text-muted mb-1">Capacitación</label>
          <select className="form-select form-select-sm" value={capacitacionFilter} onChange={(e) => setCapacitacionFilter(e.target.value)}>
            <option value="">Todos</option>
            <option value="PENDIENTE">PENDIENTE</option>
            <option value="REALIZADA">REALIZADA</option>
          </select>
        </div>
        <div className="col-md-2">
          <label className="form-label small fw-semibold text-muted mb-1">Suscripción</label>
          <select className="form-select form-select-sm" value={suscripcionFilter} onChange={(e) => setSuscripcionFilter(e.target.value)}>
            <option value="TODOS">Todas Suscripciones</option>
            <option value="MENSUAL">Mensual</option>
            <option value="ANUAL">Anual</option>
          </select>
        </div>
      </div>

      {/* Tabla de Resultados del Reporte */}
      <div className="table-responsive">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <small className="text-muted fw-semibold">Mostrando {reportFilteredList.length} registros filtrados</small>
        </div>
        <table className="table table-hover align-middle mb-0 small">
          <thead className="table-secondary">
            <tr>
              <th>Color</th>
              <th>Régimen</th>
              <th>RUC / Razón Social</th>
              <th>Teléfono / Correo</th>
              <th>Plan / Monto</th>
              <th>Vendedor</th>
              <th>Estado Cuenta</th>
              <th>Capacitación</th>
            </tr>
          </thead>
          <tbody>
            {reportFilteredList.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center text-muted py-4">
                  No hay resultados con los filtros seleccionados.
                </td>
              </tr>
            ) : (
              reportFilteredList.map((c) => {
                const colorInfo = getColorInfo(c.colorTag);
                return (
                  <tr key={c.id}>
                    <td>
                      <span
                        className="d-inline-block rounded-circle border shadow-sm"
                        style={{ width: '16px', height: '16px', backgroundColor: colorInfo?.hex || '#198754' }}
                        title={colorInfo?.label || 'Verde'}
                      ></span>
                    </td>
                    <td>
                      <span className="badge bg-light text-dark border">{c.regimenTributario || '—'}</span>
                    </td>
                    <td>
                      <strong className="text-dark d-block">{c.razonSocial}</strong>
                      <span className="text-muted small">RUC: {c.ruc}</span>
                    </td>
                    <td>
                      <div>{c.telefono}</div>
                      <small className="text-muted">{c.email || '—'}</small>
                    </td>
                    <td>
                      <strong className="text-primary">{c.planContratado}</strong>
                      <div>
                        S/ {c.montoMensual} ({c.tipoSuscripcion || 'MENSUAL'})
                      </div>
                    </td>
                    <td>
                      <span className="badge bg-secondary text-white">{c.vendedor || 'Por asignar'}</span>
                    </td>
                    <td>
                      <span className={`badge ${c.estadoCuenta === 'HABILITADO' ? 'bg-success' : 'bg-danger'}`}>{c.estadoCuenta}</span>
                    </td>
                    <td>
                      <span className="badge bg-info text-dark">{c.estadoCapacitacion}</span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
