'use client';

import React, { useMemo, useState } from 'react';
import {
  FileSpreadsheet,
  RefreshCw,
  User,
  ShoppingCart,
  DollarSign,
  AlertCircle,
  Ticket,
  Coins,
  TrendingUp,
  Percent,
  Clock,
  Search,
  RotateCcw,
} from 'lucide-react';
import { Client } from './ClientesTodosTab';
import { SalesTimelineChart, PlanDoughnutChart, CommissionsBarChart } from './ReportCharts';

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
    const operationMonthSource = (op: any, _client?: Client) =>
      op?.fechaInicioServicio || op?.fechaPago || op?.fechaOperacion;
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

      const vencKey = monthKeyFromDate(c.fechaVencimientoMensual);
      if (vencKey) monthKeysSet.add(vencKey);

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

      // Consolidar pagos y operaciones confirmadas de forma única por ID de transacción
      const seenTransactionKeys = new Set<string>();
      const rawOps = operacionesByClient.get(idKey(c.id)) || [];
      const rawClPayments = paymentsByClient.get(idKey(c.id)) || [];

      // 1. Procesar operaciones de ventas pagadas
      rawOps.filter(isPaidOperation).forEach((op) => {
        const ventaId = idKey(op?.ventaId ?? op?.id);
        const uniqueKey = `venta-${ventaId || op?.fechaOperacion || op?.fechaPago}-${op?.montoTotal || op?.montoPagado}`;
        if (seenTransactionKeys.has(uniqueKey)) return;
        seenTransactionKeys.add(uniqueKey);

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

      // 2. Procesar pagos de caja que no hayan sido cubiertos por las operaciones
      rawClPayments.forEach((p) => {
        const ventaId = paymentVentaId(p);
        const pagoId = idKey(p?.id ?? p?.pagoId);
        const uniqueKey = pagoId ? `pago-${pagoId}` : `venta-${ventaId}`;
        if (seenTransactionKeys.has(uniqueKey) || (ventaId && seenTransactionKeys.has(`venta-${ventaId}`))) return;
        seenTransactionKeys.add(uniqueKey);

        const key = paymentMonthKey(p);
        if (!key) return;
        const montoPago = paymentAmount(p);
        monthlySums.set(key, (monthlySums.get(key) || 0) + montoPago);
      });

      // Una mejora anual actualiza el monto del tramo anual vigente,
      // conservando las mismas fechas y sus doce meses de cobertura.
      rawOps
        .filter(isPaidOperation)
        .filter((op) => isAnnualUpgradeOperation(op, c))
        .sort((a: any, b: any) => {
          const aKey = monthKeyFromDate(a?.fechaPago || a?.fechaOperacion) || '';
          const bKey = monthKeyFromDate(b?.fechaPago || b?.fechaOperacion) || '';
          return monthIndexFromKey(aKey) - monthIndexFromKey(bKey);
        })
        .forEach((op: any) => {
          const upgradeKey = monthKeyFromDate(op?.fechaPago || op?.fechaOperacion);
          const updatedPlanAmount = Number(op?.precioPlan ?? c.montoMensual ?? 0);
          if (!upgradeKey || updatedPlanAmount <= 0) return;

          const upgradeIndex = monthIndexFromKey(upgradeKey);
          const activeSpan = annualSpans
            .filter((span: { startKey: string; amount: number; monthsCovered: number }) => {
              const startIndex = monthIndexFromKey(span.startKey);
              return upgradeIndex >= startIndex && upgradeIndex < startIndex + span.monthsCovered;
            })
            .sort((a: { startKey: string }, b: { startKey: string }) => monthIndexFromKey(b.startKey) - monthIndexFromKey(a.startKey))[0];

          if (activeSpan) activeSpan.amount = updatedPlanAmount;
        });

      annualSpans.sort((a: { startKey: string }, b: { startKey: string }) => monthIndexFromKey(a.startKey) - monthIndexFromKey(b.startKey));

      let totalCobros = 0;
      monthlySums.forEach((val: number) => {
        totalCobros += val;
      });
      annualSpans.forEach((span: { amount: number }) => {
        totalCobros += span.amount;
      });

      const formatExcelDate = (val?: string) => {
        if (!val) return '';
        const d = new Date(val);
        if (isNaN(d.getTime())) return String(val);
        return d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
      };

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
        formatExcelDate(c.fechaCapacitacion),
        formatExcelDate(c.fechaVencimientoMensual),
        Number(c.montoSiguienteCobro || 0).toFixed(2),
        c.diasProrrateados || 0,
        c.tipoProrrateo || 'NINGUNO',
        Number(c.montoProrrateoAdicional || 0).toFixed(2),
        c.diasProrrateoAdicional || 0,
        formatExcelDate(c.fechaInicioProrrateoAdicional),
        formatExcelDate(c.fechaFinProrrateoAdicional),
        formatExcelDate(c.fechaRegistro),
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
          if (amount > 0) {
            monthCellsXml.push(
              `<Cell ss:StyleID="NumberStyle"><Data ss:Type="Number">${amount.toFixed(2)}</Data></Cell>`
            );
          } else {
            monthCellsXml.push(
              '<Cell ss:StyleID="DataStyle"><Data ss:Type="String">-</Data></Cell>'
            );
          }
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
  <Style ss:ID="PendingRedStyle">
   <Font ss:Size="10" ss:FontName="Calibri" ss:Bold="1" ss:Color="#991B1B"/>
   <Interior ss:Color="#FEE2E2" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <NumberFormat ss:Format="#,##0.00"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FCA5A5"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FCA5A5"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FCA5A5"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FCA5A5"/>
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

  // Cálculo de comisiones y métricas a partir de datos reales de la base de datos
  const [fechaDesde, setFechaDesde] = React.useState<string>('');
  const [fechaHasta, setFechaHasta] = React.useState<string>('');
  const [selectedMes, setSelectedMes] = React.useState<string>('ALL');
  const [selectedEstadoPago, setSelectedEstadoPago] = React.useState<string>('ALL');
  const [selectedPlan, setSelectedPlan] = React.useState<string>('ALL');
  const [selectedVendedor, setSelectedVendedor] = React.useState<string>('ALL');
  const [selectedCliente, setSelectedCliente] = React.useState<string>('');
  const [selectedMetodoPago, setSelectedMetodoPago] = React.useState<string>('ALL');
  const [selectedTipoSub, setSelectedTipoSub] = React.useState<string>('ALL');
  const [selectedRegimen, setSelectedRegimen] = React.useState<string>('ALL');

  // Paginación de tablas
  const [ventasPage, setVentasPage] = React.useState<number>(1);
  const [comisionesPage, setComisionesPage] = React.useState<number>(1);
  const [showAllVentas, setShowAllVentas] = React.useState<boolean>(false);
  const [showAllComisiones, setShowAllComisiones] = React.useState<boolean>(false);
  const ITEMS_PER_PAGE = 8;

  // Extraer todas las transacciones reales desde la base de datos (Pagos y Clientes)
  const rawTransactions = useMemo(() => {
    const list: Array<{
      id: string;
      fecha: string;
      fechaObj: Date;
      cliente: string;
      ruc: string;
      plan: string;
      planNormalizado: string;
      vendedor: string;
      monto: number;
      metodoPago: string;
      estado: 'PAGADO' | 'PENDIENTE' | 'CANCELADO';
      tipoVenta: 'ALTA' | 'RENOVACION' | 'CAMBIO_PLAN' | 'MEJORA_PLAN';
      tipoSuscripcion: string;
      regimen: string;
    }> = [];

    const clientMap = new Map<string, Client>();
    safeClients.forEach((c) => {
      if (c.id) clientMap.set(String(c.id), c);
      if (c.ruc) clientMap.set(String(c.ruc), c);
    });

    const seenKeys = new Set<string>();

    // 1. Incorporar pagos registrados en la base de datos
    (Array.isArray(payments) ? payments : []).forEach((p, idx) => {
      const cliId = String(p?.venta?.cliente?.id ?? p?.clienteId ?? p?.venta?.clienteId ?? '');
      const cli = clientMap.get(cliId);
      const fechaRaw = p?.fechaPago || p?.fechaRegistro || p?.venta?.fechaVenta || cli?.fechaRegistro;
      const d = fechaRaw ? new Date(fechaRaw) : new Date();
      if (isNaN(d.getTime())) return;

      const rawPlan = p?.planNombre || p?.venta?.suscripcion?.plan?.nombrePlan || p?.venta?.plan || cli?.planContratado || 'Plan Inicia';
      const planNorm = rawPlan.toUpperCase().replace(/^PLAN\s+/, '').trim();
      const estadoVenta = (p?.venta?.estadoVenta || p?.estadoVenta || '').toUpperCase();
      const estadoPago = (p?.estadoPago || '').toUpperCase();
      const estado: 'PAGADO' | 'PENDIENTE' | 'CANCELADO' =
        estadoVenta === 'CANCELADA' ? 'CANCELADO' : (estadoPago === 'PAGADO' || estadoVenta === 'PAGADA' ? 'PAGADO' : 'PENDIENTE');

      const tipoVenta: 'ALTA' | 'RENOVACION' | 'CAMBIO_PLAN' | 'MEJORA_PLAN' =
        (p?.tipoVenta || p?.venta?.tipoVenta || (p?.venta?.ventaAnterior ? 'RENOVACION' : 'ALTA')).toUpperCase() as any;

      const uniqueKey = `pay-${p?.id || idx}-${p?.monto}-${fechaRaw}`;
      if (seenKeys.has(uniqueKey)) return;
      seenKeys.add(uniqueKey);

      list.push({
        id: String(p?.id || `p-${idx}`),
        fecha: d.toISOString(),
        fechaObj: d,
        cliente: p?.clienteRazonSocial || p?.venta?.cliente?.razonSocial || cli?.razonSocial || 'Cliente General',
        ruc: p?.clienteRuc || p?.venta?.cliente?.ruc || cli?.ruc || '—',
        plan: rawPlan,
        planNormalizado: planNorm || 'INICIA',
        vendedor: p?.vendedorNombre || p?.venta?.vendedor?.nombre || p?.venta?.vendedor?.username || cli?.vendedor || 'Por asignar',
        monto: Number(p?.monto || p?.venta?.montoTotal || cli?.montoMensual || 19),
        metodoPago: p?.medioPago ? String(p.medioPago).toUpperCase() : 'TRANSFERENCIA',
        estado,
        tipoVenta,
        tipoSuscripcion: (p?.tipoSuscripcion || p?.venta?.suscripcion?.tipoSuscripcion || cli?.tipoSuscripcion || 'MENSUAL').toUpperCase(),
        regimen: (cli?.regimenTributario || p?.venta?.cliente?.regimenTributario || 'GENERAL').toUpperCase(),
      });
    });

    // 2. Incorporar cobros pendientes de clientes que no tienen pago registrado aún
    safeClients.forEach((c, idx) => {
      const hasPayment = list.some((t) => t.ruc === c.ruc);
      if (!hasPayment && c.fechaRegistro) {
        const d = new Date(c.fechaRegistro);
        const rawPlan = c.planContratado || 'Plan Inicia';
        const planNorm = rawPlan.toUpperCase().replace(/^PLAN\s+/, '').trim();
        list.push({
          id: `cli-${c.id || idx}`,
          fecha: d.toISOString(),
          fechaObj: d,
          cliente: c.razonSocial || 'Cliente General',
          ruc: c.ruc || '—',
          plan: rawPlan,
          planNormalizado: planNorm || 'INICIA',
          vendedor: c.vendedor || 'Por asignar',
          monto: Number(c.montoSiguienteCobro || c.montoMensual || 19),
          metodoPago: 'TRANSFERENCIA',
          estado: (c.estadoCuenta || '').toUpperCase() === 'HABILITADO' ? 'PAGADO' : 'PENDIENTE',
          tipoVenta: 'ALTA',
          tipoSuscripcion: (c.tipoSuscripcion || 'MENSUAL').toUpperCase(),
          regimen: (c.regimenTributario || 'GENERAL').toUpperCase(),
        });
      }
    });

    return list.sort((a, b) => b.fechaObj.getTime() - a.fechaObj.getTime());
  }, [safeClients, payments]);

  // Lista de meses disponibles para el selector
  const availableMonths = useMemo(() => {
    const map = new Map<string, string>();
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Setiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    rawTransactions.forEach((t) => {
      const year = t.fechaObj.getFullYear();
      const month = t.fechaObj.getMonth();
      const key = `${year}-${String(month + 1).padStart(2, '0')}`;
      if (!map.has(key)) {
        map.set(key, `${monthNames[month]} ${year}`);
      }
    });
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [rawTransactions]);

  // Filtrar transacciones según los controles del formulario
  const filteredTransactions = useMemo(() => {
    return rawTransactions.filter((t) => {
      // Filtro fecha desde
      if (fechaDesde) {
        const fDesde = new Date(fechaDesde);
        fDesde.setHours(0, 0, 0, 0);
        if (t.fechaObj < fDesde) return false;
      }
      // Filtro fecha hasta
      if (fechaHasta) {
        const fHasta = new Date(fechaHasta);
        fHasta.setHours(23, 59, 59, 999);
        if (t.fechaObj > fHasta) return false;
      }
      // Filtro mes
      if (selectedMes !== 'ALL') {
        const [y, m] = selectedMes.split('-').map(Number);
        if (t.fechaObj.getFullYear() !== y || t.fechaObj.getMonth() + 1 !== m) return false;
      }
      // Filtro estado de pago
      if (selectedEstadoPago !== 'ALL') {
        if (t.estado !== selectedEstadoPago) return false;
      }
      // Filtro plan
      if (selectedPlan !== 'ALL') {
        if (!t.planNormalizado.includes(selectedPlan.toUpperCase())) return false;
      }
      // Filtro vendedor
      if (selectedVendedor !== 'ALL') {
        if (t.vendedor !== selectedVendedor) return false;
      }
      // Filtro cliente (RUC o Razón Social)
      if (selectedCliente.trim() !== '') {
        const q = selectedCliente.toLowerCase();
        if (!t.cliente.toLowerCase().includes(q) && !t.ruc.includes(q)) return false;
      }
      // Filtro método de pago
      if (selectedMetodoPago !== 'ALL') {
        if (!t.metodoPago.includes(selectedMetodoPago.toUpperCase())) return false;
      }
      // Filtro tipo de suscripción
      if (selectedTipoSub !== 'ALL') {
        if (t.tipoSuscripcion !== selectedTipoSub.toUpperCase()) return false;
      }
      // Filtro régimen
      if (selectedRegimen !== 'ALL') {
        if (!t.regimen.includes(selectedRegimen.toUpperCase())) return false;
      }
      return true;
    });
  }, [
    rawTransactions,
    fechaDesde,
    fechaHasta,
    selectedMes,
    selectedEstadoPago,
    selectedPlan,
    selectedVendedor,
    selectedCliente,
    selectedMetodoPago,
    selectedTipoSub,
    selectedRegimen,
  ]);

  // Cálculos de KPI de Ventas (extraídos 100% de base de datos)
  const totalVentas = useMemo(() => filteredTransactions.reduce((acc, t) => acc + t.monto, 0), [filteredTransactions]);
  const totalVentasCount = filteredTransactions.length;
  const totalIngresos = useMemo(
    () => filteredTransactions.filter((t) => t.estado === 'PAGADO').reduce((acc, t) => acc + t.monto, 0),
    [filteredTransactions]
  );
  const totalPendiente = useMemo(
    () => filteredTransactions.filter((t) => t.estado === 'PENDIENTE').reduce((acc, t) => acc + t.monto, 0),
    [filteredTransactions]
  );
  const totalPendienteCount = useMemo(
    () => filteredTransactions.filter((t) => t.estado === 'PENDIENTE').length,
    [filteredTransactions]
  );
  const ticketPromedio = totalVentasCount > 0 ? totalVentas / totalVentasCount : 0;

  // Desglose de Ventas por Plan
  const planDistribution = useMemo(() => {
    const plans = [
      { key: 'INICIA', label: 'Plan Inicia', color: '#0284C7' },
      { key: 'EMPRENDE', label: 'Plan Emprende', color: '#0866FF' },
      { key: 'IMPULSA', label: 'Plan Impulsa', color: '#8B5CF6' },
      { key: 'EMPRESARIAL', label: 'Plan Empresarial', color: '#059669' },
      { key: 'LIDER', label: 'Plan Líder', color: '#EA580C' },
    ];

    const counts = new Map<string, { label: string; color: string; amount: number; count: number }>();
    plans.forEach((p) => counts.set(p.key, { label: p.label, color: p.color, amount: 0, count: 0 }));

    filteredTransactions.forEach((t) => {
      let matchedKey = 'INICIA';
      for (const p of plans) {
        if (t.planNormalizado.includes(p.key)) {
          matchedKey = p.key;
          break;
        }
      }
      const cur = counts.get(matchedKey)!;
      cur.amount += t.monto;
      cur.count += 1;
    });

    const activeList = Array.from(counts.values()).filter((p) => p.amount > 0 || p.count > 0);
    const sumAmount = activeList.reduce((acc, p) => acc + p.amount, 0) || 1;

    return activeList.map((p) => ({
      ...p,
      percentage: ((p.amount / sumAmount) * 100).toFixed(1),
    }));
  }, [filteredTransactions]);

  // Línea temporal para gráfico de Ventas e Ingresos por Periodo
  const timelineData = useMemo(() => {
    const dayMap = new Map<string, { label: string; ventas: number; ingresos: number }>();
    const sorted = [...filteredTransactions].sort((a, b) => a.fechaObj.getTime() - b.fechaObj.getTime());

    if (sorted.length === 0) {
      return [
        { label: 'Sin datos', ventas: 0, ingresos: 0 },
      ];
    }

    sorted.forEach((t) => {
      const d = t.fechaObj;
      const key = `${d.getDate()} ${d.toLocaleDateString('es-PE', { month: 'short' })}`;
      if (!dayMap.has(key)) {
        dayMap.set(key, { label: key, ventas: 0, ingresos: 0 });
      }
      const item = dayMap.get(key)!;
      item.ventas += t.monto;
      if (t.estado === 'PAGADO') {
        item.ingresos += t.monto;
      }
    });

    return Array.from(dayMap.values());
  }, [filteredTransactions]);

  // CÁLCULO DE COMISIONES (EXCLUSIVAMENTE POR ALTA = S/ 9.00 POR AFILIACIÓN SEGÚN REGLA DEL USUARIO)
  const altasTransactions = useMemo(() => {
    return filteredTransactions.filter((t) => t.tipoVenta === 'ALTA');
  }, [filteredTransactions]);

  const totalAltasCount = altasTransactions.length;
  const TASA_COMISION_ALTA = 9.0;
  const comisionAcumulada = totalAltasCount * TASA_COMISION_ALTA;
  const altasPendientesCount = useMemo(
    () => altasTransactions.filter((t) => t.estado === 'PENDIENTE').length,
    [altasTransactions]
  );
  const comisionPendiente = altasPendientesCount * TASA_COMISION_ALTA;

  // Comisiones por mes (Gráfico de barras)
  const monthlyCommissions = useMemo(() => {
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic'];
    const counts = new Array(12).fill(0);

    altasTransactions.forEach((t) => {
      const m = t.fechaObj.getMonth();
      counts[m] += TASA_COMISION_ALTA;
    });

    return monthNames.map((name, idx) => ({
      month: name,
      comision: counts[idx],
    }));
  }, [altasTransactions]);

  const resetFilters = () => {
    setFechaDesde('');
    setFechaHasta('');
    setSelectedMes('ALL');
    setSelectedEstadoPago('ALL');
    setSelectedPlan('ALL');
    setSelectedVendedor('ALL');
    setSelectedCliente('');
    setSelectedMetodoPago('ALL');
    setSelectedTipoSub('ALL');
    setSelectedRegimen('ALL');
    setVentasPage(1);
    setComisionesPage(1);
  };

  const displayedVentas = showAllVentas ? filteredTransactions : filteredTransactions.slice((ventasPage - 1) * ITEMS_PER_PAGE, ventasPage * ITEMS_PER_PAGE);
  const totalVentasPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE) || 1;

  const displayedComisiones = showAllComisiones ? altasTransactions : altasTransactions.slice((comisionesPage - 1) * ITEMS_PER_PAGE, comisionesPage * ITEMS_PER_PAGE);
  const totalComisionesPages = Math.ceil(altasTransactions.length / ITEMS_PER_PAGE) || 1;

  return (
    <div className="reporte-general-container pb-5">
      {/* Header Principal con Icono de Sección */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4 custom-card p-3.5">
        <div className="d-flex align-items-center gap-3">
          <div className="section-header-icon section-header-icon-primary">
            <FileSpreadsheet size={24} strokeWidth={2.2} />
          </div>
          <div>
            <h1 className="h5 fw-bold text-dark mb-0.5">Reporte General</h1>
            <p className="text-muted small mb-0">Reporte consolidado de ventas, recaudación y comisiones</p>
          </div>
        </div>
        <div className="d-flex align-items-center gap-2">
          <button
            onClick={exportToExcelLocal}
            className="btn-meta-action btn-meta-action-success"
            title="Exportar reporte consolidado a formato Excel"
          >
            <FileSpreadsheet size={16} />
            <span>Exportar Excel</span>
          </button>
          <button
            onClick={() => loadData(token, true)}
            disabled={isSyncing}
            className="btn-meta-action btn-meta-action-secondary"
            title="Sincronizar datos"
          >
            <RefreshCw size={15} className={isSyncing ? 'spin-anim' : ''} />
            <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar'}</span>
          </button>
        </div>
      </div>

      {/* SECCIÓN 1: REPORTE DE VENTAS */}
      <div className="mb-5">
        <div className="d-flex align-items-center gap-2.5 mb-3">
          <div className="section-header-icon section-header-icon-primary" style={{ width: '36px', height: '36px' }}>
            <ShoppingCart size={18} strokeWidth={2.2} />
          </div>
          <div>
            <h2 className="h6 fw-bold text-dark mb-0">Reporte de Ventas</h2>
            <small className="text-muted">Métricas de facturación, ingresos y transacciones</small>
          </div>
        </div>

        {/* Tarjeta de Filtros de Ventas (Stitch Facebook Design) */}
        <div className="custom-card p-3.5 mb-4">
          <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
            <div className="d-flex align-items-center gap-2">
              <span className="badge-tag badge-plan-tag">
                <Search size={12} />
                Filtros de Ventas
              </span>
            </div>
            <span className="cell-subtext">
              Filtrado dinámico en tiempo real
            </span>
          </div>

          <div className="row g-2.5 mb-2.5">
            <div className="col-12 col-md-4 col-lg-2">
              <label className="form-label small fw-semibold text-muted mb-1">Fecha desde</label>
              <input
                type="date"
                className="form-control form-control-sm rounded-3"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
              />
            </div>
            <div className="col-12 col-md-4 col-lg-2">
              <label className="form-label small fw-semibold text-muted mb-1">Fecha hasta</label>
              <input
                type="date"
                className="form-control form-control-sm rounded-3"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
              />
            </div>
            <div className="col-12 col-md-4 col-lg-2">
              <label className="form-label small fw-semibold text-muted mb-1">Mes</label>
              <select
                className="form-select form-select-sm rounded-3"
                value={selectedMes}
                onChange={(e) => setSelectedMes(e.target.value)}
              >
                <option value="ALL">Todos los meses</option>
                {availableMonths.map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-12 col-md-4 col-lg-2">
              <label className="form-label small fw-semibold text-muted mb-1">Estado de pago</label>
              <select
                className="form-select form-select-sm rounded-3"
                value={selectedEstadoPago}
                onChange={(e) => setSelectedEstadoPago(e.target.value)}
              >
                <option value="ALL">Todos los estados</option>
                <option value="PAGADO">Pagado</option>
                <option value="PENDIENTE">Pendiente</option>
              </select>
            </div>
            <div className="col-12 col-md-4 col-lg-2">
              <label className="form-label small fw-semibold text-muted mb-1">Plan</label>
              <select
                className="form-select form-select-sm rounded-3"
                value={selectedPlan}
                onChange={(e) => setSelectedPlan(e.target.value)}
              >
                <option value="ALL">Todos los planes</option>
                <option value="INICIA">Plan Inicia</option>
                <option value="EMPRENDE">Plan Emprende</option>
                <option value="IMPULSA">Plan Impulsa</option>
                <option value="EMPRESARIAL">Plan Empresarial</option>
                <option value="LIDER">Plan Líder</option>
              </select>
            </div>
            <div className="col-12 col-md-4 col-lg-2">
              <label className="form-label small fw-semibold text-muted mb-1">Vendedor</label>
              <select
                className="form-select form-select-sm rounded-3"
                value={selectedVendedor}
                onChange={(e) => setSelectedVendedor(e.target.value)}
              >
                <option value="ALL">Todos los asesores</option>
                {uniqueSellers.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="row g-2.5 align-items-end">
            <div className="col-12 col-md-4 col-lg-2">
              <label className="form-label small fw-semibold text-muted mb-1">Cliente</label>
              <input
                type="text"
                placeholder="RUC o Razón Social"
                className="form-control form-control-sm rounded-3"
                value={selectedCliente}
                onChange={(e) => setSelectedCliente(e.target.value)}
              />
            </div>
            <div className="col-12 col-md-4 col-lg-2">
              <label className="form-label small fw-semibold text-muted mb-1">Método de pago</label>
              <select
                className="form-select form-select-sm rounded-3"
                value={selectedMetodoPago}
                onChange={(e) => setSelectedMetodoPago(e.target.value)}
              >
                <option value="ALL">Todos</option>
                <option value="YAPE">Yape</option>
                <option value="PLIN">Plin</option>
                <option value="TRANSFERENCIA">Transferencia</option>
                <option value="TARJETA">Tarjeta de crédito</option>
                <option value="EFECTIVO">Efectivo</option>
              </select>
            </div>
            <div className="col-12 col-md-4 col-lg-2">
              <label className="form-label small fw-semibold text-muted mb-1">Tipo suscripción</label>
              <select
                className="form-select form-select-sm rounded-3"
                value={selectedTipoSub}
                onChange={(e) => setSelectedTipoSub(e.target.value)}
              >
                <option value="ALL">Todos</option>
                <option value="MENSUAL">Mensual</option>
                <option value="ANUAL">Anual</option>
              </select>
            </div>
            <div className="col-12 col-md-4 col-lg-2">
              <label className="form-label small fw-semibold text-muted mb-1">Régimen</label>
              <select
                className="form-select form-select-sm rounded-3"
                value={selectedRegimen}
                onChange={(e) => setSelectedRegimen(e.target.value)}
              >
                <option value="ALL">Todos los regímenes</option>
                <option value="MYPE">MYPE Tributario</option>
                <option value="GENERAL">General</option>
                <option value="ESPECIAL">Especial / RER</option>
                <option value="RUS">Nuevo RUS</option>
              </select>
            </div>
            <div className="col-12 col-md-4 col-lg-4 d-flex gap-2">
              <button
                type="button"
                className="btn-meta-action btn-meta-action-primary flex-grow-1"
                onClick={() => setVentasPage(1)}
              >
                <Search size={14} />
                <span>Buscar</span>
              </button>
              <button
                type="button"
                className="btn-meta-action btn-meta-action-secondary"
                onClick={resetFilters}
              >
                <RotateCcw size={14} />
                <span>Limpiar</span>
              </button>
            </div>
          </div>
        </div>

        {/* 4 KPI Stat Cards Rediseñadas (Alineadas a Resumen) */}
        <div className="row g-3 mb-4">
          <div className="col-12 col-sm-6 col-lg-3">
            <div className="custom-card p-3.5 h-100 shadow-sm rounded-4 border bg-white">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div className="d-flex align-items-center gap-2.5">
                  <div className="section-header-icon section-header-icon-primary" style={{ width: '38px', height: '38px' }}>
                    <ShoppingCart size={18} strokeWidth={2.2} />
                  </div>
                  <span className="text-secondary small fw-bold text-uppercase" style={{ letterSpacing: '0.4px', fontSize: '0.72rem' }}>
                    Ventas Totales
                  </span>
                </div>
                <span className="badge-tag" style={{ backgroundColor: '#E7F3FF', color: '#0866FF' }}>
                  Total
                </span>
              </div>
              <div className="fs-4 fw-bolder text-dark mb-1 mt-2" style={{ letterSpacing: '-0.5px' }}>
                S/ {totalVentas.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <small className="text-muted d-block fw-semibold" style={{ fontSize: '0.78rem' }}>
                {totalVentasCount} ventas registradas
              </small>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <div className="custom-card p-3.5 h-100 shadow-sm rounded-4 border bg-white">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div className="d-flex align-items-center gap-2.5">
                  <div className="section-header-icon section-header-icon-success" style={{ width: '38px', height: '38px' }}>
                    <DollarSign size={18} strokeWidth={2.2} />
                  </div>
                  <span className="text-secondary small fw-bold text-uppercase" style={{ letterSpacing: '0.4px', fontSize: '0.72rem' }}>
                    Ingresos Cobrados
                  </span>
                </div>
                <span className="badge-tag" style={{ backgroundColor: '#ECFDF5', color: '#065F46' }}>
                  Cobrado
                </span>
              </div>
              <div className="fs-4 fw-bolder text-dark mb-1 mt-2" style={{ letterSpacing: '-0.5px' }}>
                S/ {totalIngresos.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <small className="text-muted d-block fw-semibold" style={{ fontSize: '0.78rem' }}>
                Monto efectivamente recaudado
              </small>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <div className="custom-card p-3.5 h-100 shadow-sm rounded-4 border bg-white">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div className="d-flex align-items-center gap-2.5">
                  <div className="section-header-icon section-header-icon-danger" style={{ width: '38px', height: '38px' }}>
                    <AlertCircle size={18} strokeWidth={2.2} />
                  </div>
                  <span className="text-secondary small fw-bold text-uppercase" style={{ letterSpacing: '0.4px', fontSize: '0.72rem' }}>
                    Por Cobrar
                  </span>
                </div>
                <span className="badge-tag" style={{ backgroundColor: '#FEF2F2', color: '#B91C1C' }}>
                  Pendiente
                </span>
              </div>
              <div className="fs-4 fw-bolder text-danger mb-1 mt-2" style={{ letterSpacing: '-0.5px' }}>
                S/ {totalPendiente.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <small className="text-muted d-block fw-semibold" style={{ fontSize: '0.78rem' }}>
                {totalPendienteCount} transacciones pendientes
              </small>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <div className="custom-card p-3.5 h-100 shadow-sm rounded-4 border bg-white">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div className="d-flex align-items-center gap-2.5">
                  <div className="section-header-icon section-header-icon-indigo" style={{ width: '38px', height: '38px' }}>
                    <Ticket size={18} strokeWidth={2.2} />
                  </div>
                  <span className="text-secondary small fw-bold text-uppercase" style={{ letterSpacing: '0.4px', fontSize: '0.72rem' }}>
                    Ticket Promedio
                  </span>
                </div>
                <span className="badge-tag" style={{ backgroundColor: '#EDE9FE', color: '#6D28D9' }}>
                  Promedio
                </span>
              </div>
              <div className="fs-4 fw-bolder text-dark mb-1 mt-2" style={{ letterSpacing: '-0.5px' }}>
                S/ {ticketPromedio.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <small className="text-muted d-block fw-semibold" style={{ fontSize: '0.78rem' }}>
                Monto medio por operación
              </small>
            </div>
          </div>
        </div>

        {/* Gráficos con Chart.js: Evolución Temporal Interactiva + Donut por Plan */}
        <div className="row g-3 mb-4">
          {/* Gráfico 1: Área y Tendencia de Ventas e Ingresos con Chart.js */}
          <div className="col-12 col-lg-7">
            <div className="custom-card p-4 h-100 d-flex flex-column justify-content-between">
              <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2 mb-3 pb-2 border-bottom">
                <div>
                  <strong className="text-dark fw-bold d-block" style={{ fontSize: '0.92rem' }}>
                    Evolución de Facturación y Cobranza
                  </strong>
                  <small className="text-muted" style={{ fontSize: '0.74rem' }}>
                    Comparativa de ventas generadas vs recaudación efectiva en Soles (S/)
                  </small>
                </div>
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <span className="badge-tag" style={{ backgroundColor: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}>
                    <span className="badge-dot badge-dot-info" />
                    Ventas Facturadas
                  </span>
                  <span className="badge-tag" style={{ backgroundColor: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0' }}>
                    <span className="badge-dot badge-dot-success" />
                    Cobrado Efectivo
                  </span>
                </div>
              </div>

              {/* Componente Gráfico Chart.js interactivo con Tooltips */}
              <SalesTimelineChart data={timelineData} />

              {/* Resumen Humano Explicativo al pie del gráfico */}
              <div className="d-flex flex-wrap justify-content-between align-items-center pt-2.5 mt-2 border-top gap-2" style={{ fontSize: '0.75rem' }}>
                <span className="text-muted fw-semibold">
                  Efectividad de Cobro:{' '}
                  <strong className="text-success fw-bold">
                    {totalVentas > 0 ? `${((ingresosCobrados / totalVentas) * 100).toFixed(1)}%` : '100%'}
                  </strong>
                </span>
                <span className="text-muted fw-semibold">
                  Ticket Promedio:{' '}
                  <strong className="text-dark fw-bold">S/ {ticketPromedio.toFixed(2)}</strong>
                </span>
                <span className="text-muted fw-semibold">
                  Transacciones:{' '}
                  <strong className="text-primary fw-bold">{filteredTransactions.length} operaciones</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Gráfico 2: Donut Radial con Chart.js + Desglose por Plan */}
          <div className="col-12 col-lg-5">
            <div className="custom-card p-4 h-100 d-flex flex-column justify-content-between">
              <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                <div>
                  <strong className="text-dark fw-bold d-block" style={{ fontSize: '0.92rem' }}>
                    Distribución por Plan
                  </strong>
                  <small className="text-muted" style={{ fontSize: '0.74rem' }}>
                    Proporción de ingresos generados por cada paquete
                  </small>
                </div>
                <span className="badge-tag badge-plan-tag">
                  {planDistribution.length} planes
                </span>
              </div>

              <div className="row align-items-center g-3 flex-grow-1">
                {/* Donut Chart.js con Centro Métrico */}
                <div className="col-5 d-flex justify-content-center">
                  <PlanDoughnutChart data={planDistribution} totalVentas={totalVentas} />
                </div>

                {/* Desglose con barras y badges estructurados */}
                <div className="col-7">
                  <div className="d-flex flex-column gap-2" style={{ fontSize: '0.75rem' }}>
                    {planDistribution.map((p, idx) => (
                      <div key={idx} className="p-1.5 rounded-3" style={{ backgroundColor: '#F8FAFC' }}>
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span className="d-inline-flex align-items-center gap-1.5 fw-bold text-dark">
                            <span className="rounded-circle d-inline-block flex-shrink-0" style={{ width: '8px', height: '8px', backgroundColor: p.color }}></span>
                            <span className="text-truncate" style={{ maxWidth: '85px' }}>{p.label}</span>
                          </span>
                          <span className="badge-tag" style={{ backgroundColor: '#FFFFFF', color: p.color, border: `1px solid ${p.color}40`, fontSize: '0.66rem', padding: '0.1rem 0.4rem' }}>
                            {p.percentage}%
                          </span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center">
                          <div className="progress flex-grow-1 me-2" style={{ height: '4px', backgroundColor: '#E2E8F0' }}>
                            <div
                              className="progress-bar rounded-pill"
                              role="progressbar"
                              style={{ width: `${p.percentage}%`, backgroundColor: p.color }}
                            />
                          </div>
                          <strong className="text-dark fw-bold" style={{ fontSize: '0.78rem' }}>
                            S/ {p.amount.toFixed(2)}
                          </strong>
                        </div>
                      </div>
                    ))}
                    {planDistribution.length === 0 && (
                      <div className="text-muted small py-2 text-center">Sin ventas de planes</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabla: Detalle de Ventas */}
        <div className="custom-card p-3.5">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <strong className="small text-dark fw-bold">Detalle de ventas</strong>
            <small className="text-muted fw-semibold">
              Mostrando {displayedVentas.length} de {filteredTransactions.length} registros
            </small>
          </div>

          <div className="table-card-meta mb-3">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 table-meta">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Cliente</th>
                  <th>RUC</th>
                  <th>Plan</th>
                  <th>Vendedor</th>
                  <th>Monto</th>
                  <th>Método de pago</th>
                  <th className="text-end">Estado</th>
                </tr>
              </thead>
              <tbody>
                {displayedVentas.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center text-muted py-5 fw-semibold">
                      No se encontraron ventas con los filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  displayedVentas.map((t) => (
                    <tr key={t.id}>
                      <td className="text-muted fw-semibold">
                        {t.fechaObj.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })}{' '}
                        <span className="text-muted opacity-75">{t.fechaObj.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</span>
                      </td>
                      <td>
                        <span className="cell-title">{t.cliente}</span>
                      </td>
                      <td className="text-muted font-monospace">{t.ruc}</td>
                      <td>
                        <span className="badge-tag badge-plan-tag">{t.plan}</span>
                      </td>
                      <td className="text-dark fw-semibold">{t.vendedor}</td>
                      <td>
                        <span className="cell-amount text-dark">S/ {t.monto.toFixed(2)}</span>
                      </td>
                      <td className="text-muted text-capitalize fw-semibold">{t.metodoPago.toLowerCase()}</td>
                      <td className="text-end">
                        <span
                          className={`badge-fb ${
                            t.estado === 'PAGADO' ? 'badge-fb-success' : 'badge-fb-warning'
                          }`}
                        >
                          <span
                            className={`badge-dot ${
                              t.estado === 'PAGADO' ? 'badge-dot-success' : 'badge-dot-warning'
                            }`}
                          />
                          {t.estado === 'PAGADO' ? 'Pagado' : 'Pendiente'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          </div>

          {/* Paginación */}
          {filteredTransactions.length > ITEMS_PER_PAGE && (
            <div className="d-flex justify-content-between align-items-center pt-3 border-top mt-2">
              <button
                type="button"
                className="btn btn-link btn-sm text-primary fw-semibold p-0 text-decoration-none"
                onClick={() => setShowAllVentas(!showAllVentas)}
              >
                {showAllVentas ? 'Ver paginado' : 'Ver todas las ventas'}
              </button>
              {!showAllVentas && (
                <div className="d-flex align-items-center gap-1.5">
                  <button
                    className="btn btn-outline-secondary btn-sm px-2 py-1"
                    disabled={ventasPage <= 1}
                    onClick={() => setVentasPage((p) => Math.max(p - 1, 1))}
                  >
                    Anterior
                  </button>
                  <span className="small text-muted px-1">
                    {ventasPage} / {totalVentasPages}
                  </span>
                  <button
                    className="btn btn-outline-secondary btn-sm px-2 py-1"
                    disabled={ventasPage >= totalVentasPages}
                    onClick={() => setVentasPage((p) => Math.min(p + 1, totalVentasPages))}
                  >
                    Siguiente
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* SECCIÓN 2: MIS COMISIONES POR VENTA DE SISTEMA */}
      <div>
        <div className="d-flex align-items-center gap-2 mb-3">
          <div className="section-header-icon section-header-icon-indigo">
            <Coins size={18} strokeWidth={2.2} />
          </div>
          <div>
            <h2 className="fs-6 fw-bold text-dark mb-0">Mis comisiones por venta de sistema</h2>
            <p className="text-muted small mb-0">Liquidación y balance de comisiones por altas y activaciones de clientes</p>
          </div>
        </div>

        {/* 4 KPI Stat Cards Comisiones */}
        <div className="row g-3 mb-4">
          <div className="col-12 col-sm-6 col-lg-3">
            <div className="custom-card p-3.5 h-100 d-flex flex-column justify-content-between">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div className="section-header-icon section-header-icon-primary">
                  <Coins size={18} strokeWidth={2.2} />
                </div>
                <span className="badge-tag">Total</span>
              </div>
              <div>
                <span className="text-muted fw-semibold small d-block mb-1">Comisión acumulada</span>
                <strong className="fs-4 text-primary fw-bolder d-block" style={{ lineHeight: '1.2' }}>
                  S/ {comisionAcumulada.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </strong>
                <small className="text-muted" style={{ fontSize: '0.75rem' }}>{totalAltasCount} afiliaciones registradas</small>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <div className="custom-card p-3.5 h-100 d-flex flex-column justify-content-between">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div className="section-header-icon section-header-icon-success">
                  <TrendingUp size={18} strokeWidth={2.2} />
                </div>
                <span className="badge-tag">Altas</span>
              </div>
              <div>
                <span className="text-muted fw-semibold small d-block mb-1">Ventas realizadas</span>
                <strong className="fs-4 text-dark fw-bolder d-block" style={{ lineHeight: '1.2' }}>
                  {totalAltasCount}
                </strong>
                <small className="text-muted" style={{ fontSize: '0.75rem' }}>Afiliaciones de sistema</small>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <div className="custom-card p-3.5 h-100 d-flex flex-column justify-content-between">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div className="section-header-icon section-header-icon-indigo">
                  <Percent size={18} strokeWidth={2.2} />
                </div>
                <span className="badge-tag">Por alta</span>
              </div>
              <div>
                <span className="text-muted fw-semibold small d-block mb-1">Tasa de comisión</span>
                <strong className="fs-4 text-dark fw-bolder d-block" style={{ lineHeight: '1.2' }}>
                  S/ {TASA_COMISION_ALTA.toFixed(2)}
                </strong>
                <small className="text-muted" style={{ fontSize: '0.75rem' }}>Comisión fija por cliente</small>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <div className="custom-card p-3.5 h-100 d-flex flex-column justify-content-between">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div className="section-header-icon section-header-icon-warning">
                  <Clock size={18} strokeWidth={2.2} />
                </div>
                <span className="badge-tag" style={{ color: '#D97706', borderColor: '#FDE68A', backgroundColor: '#FFFBEB' }}>
                  {altasPendientesCount} pendientes
                </span>
              </div>
              <div>
                <span className="text-muted fw-semibold small d-block mb-1">Pendiente de pago</span>
                <strong className="fs-4 fw-bolder d-block" style={{ lineHeight: '1.2', color: '#D97706' }}>
                  S/ {comisionPendiente.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </strong>
                <small className="text-muted" style={{ fontSize: '0.75rem' }}>Por conciliar y liquidar</small>
              </div>
            </div>
          </div>
        </div>

        {/* Gráfico Comisiones por Mes + Detalle de Comisiones */}
        <div className="row g-3">
          {/* Gráfico de Barras Comisiones Moderno */}
          <div className="col-12 col-lg-5">
            <div className="custom-card p-3.5 h-100 d-flex flex-column justify-content-between">
              <div>
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <strong className="small text-dark fw-bold">Comisiones por mes</strong>
                  <span className="badge-tag" style={{ color: '#0866FF', borderColor: '#BFDBFE', backgroundColor: '#EFF6FF' }}>
                    S/ {comisionAcumulada.toFixed(2)} acumulado
                  </span>
                </div>
                <p className="text-muted small mb-3" style={{ fontSize: '0.75rem' }}>Rendimiento mensual de comisiones ganadas</p>

                {/* Gráfico interactivo con Chart.js */}
                <div className="pt-2 pb-1">
                  <CommissionsBarChart data={monthlyCommissions} />
                </div>
              </div>

              {/* Pie con métricas clave */}
              <div className="d-flex justify-content-between align-items-center pt-2.5 mt-2 border-top" style={{ fontSize: '0.74rem' }}>
                <span className="text-muted fw-semibold">
                  Promedio: <strong className="text-dark">S/ {(comisionAcumulada / Math.max(monthlyCommissions.filter(m => m.comision > 0).length, 1)).toFixed(1)}/mes</strong>
                </span>
                <span className="text-muted fw-semibold">
                  Pico máx: <strong className="text-primary">S/ {Math.max(...monthlyCommissions.map(m => m.comision), 0).toFixed(0)}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Tabla: Detalle de Comisiones */}
          <div className="col-12 col-lg-7">
            <div className="custom-card p-3.5 h-100 d-flex flex-column justify-content-between">
              <div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <strong className="small text-dark fw-bold">Detalle de comisiones</strong>
                  <small className="text-muted fw-semibold">
                    Mostrando {displayedComisiones.length} de {altasTransactions.length} afiliaciones
                  </small>
                </div>

                <div className="table-card-meta mb-3">
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0 table-meta">
                      <thead>
                        <tr>
                          <th>Fecha</th>
                          <th>Cliente</th>
                          <th>Plan</th>
                          <th>Monto venta</th>
                          <th>% Comisión</th>
                          <th>Comisión</th>
                          <th className="text-end">Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayedComisiones.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="text-center text-muted py-5 fw-semibold">
                              No se encontraron afiliaciones en el periodo filtrado.
                            </td>
                          </tr>
                        ) : (
                          displayedComisiones.map((t) => (
                            <tr key={t.id}>
                              <td className="text-muted fw-semibold">
                                {t.fechaObj.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                              </td>
                              <td>
                                <span className="cell-title">{t.cliente}</span>
                              </td>
                              <td>
                                <span className="badge-tag badge-plan-tag">{t.plan}</span>
                              </td>
                              <td>
                                <span className="cell-amount text-dark">S/ {t.monto.toFixed(2)}</span>
                              </td>
                              <td className="text-muted fw-semibold">Fija / ALTA</td>
                              <td>
                                <span className="cell-amount text-primary">S/ {TASA_COMISION_ALTA.toFixed(2)}</span>
                              </td>
                              <td className="text-end">
                                <span
                                  className={`badge-fb ${
                                    t.estado === 'PAGADO' ? 'badge-fb-success' : 'badge-fb-primary'
                                  }`}
                                >
                                  <span
                                    className={`badge-dot ${
                                      t.estado === 'PAGADO' ? 'badge-dot-success' : 'badge-dot-info'
                                    }`}
                                  />
                                  {t.estado === 'PAGADO' ? 'Pagado' : 'Generada'}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Paginación Comisiones */}
              {altasTransactions.length > ITEMS_PER_PAGE && (
                <div className="d-flex justify-content-between align-items-center pt-3 border-top mt-2">
                  <button
                    type="button"
                    className="btn btn-link btn-sm text-primary fw-semibold p-0 text-decoration-none"
                    onClick={() => setShowAllComisiones(!showAllComisiones)}
                  >
                    {showAllComisiones ? 'Ver paginado' : 'Ver todas mis comisiones'}
                  </button>
                  {!showAllComisiones && (
                    <div className="d-flex align-items-center gap-1.5">
                      <button
                        className="btn btn-outline-secondary btn-sm px-2 py-1"
                        disabled={comisionesPage <= 1}
                        onClick={() => setComisionesPage((p) => Math.max(p - 1, 1))}
                      >
                        Anterior
                      </button>
                      <span className="small text-muted px-1">
                        {comisionesPage} / {totalComisionesPages}
                      </span>
                      <button
                        className="btn btn-outline-secondary btn-sm px-2 py-1"
                        disabled={comisionesPage >= totalComisionesPages}
                        onClick={() => setComisionesPage((p) => Math.min(p + 1, totalComisionesPages))}
                      >
                        Siguiente
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
