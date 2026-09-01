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
      { key: 'INICIA', label: 'Básico / Inicia', color: '#0d6efd' },
      { key: 'EMPRENDE', label: 'Emprende', color: '#198754' },
      { key: 'IMPULSA', label: 'Impulsa', color: '#fd7e14' },
      { key: 'EMPRESARIAL', label: 'Empresarial', color: '#6f42c1' },
      { key: 'LIDER', label: 'Líder', color: '#20c997' },
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
      {/* Header Principal */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4 bg-white p-3.5 rounded-4 shadow-sm border">
        <div>
          <h1 className="h5 fw-bold text-dark mb-1">Reporte general</h1>
          <p className="text-muted small mb-0">Reporte consolidado de ventas, recaudación y comisiones</p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <button
            onClick={exportToExcelLocal}
            className="btn btn-success btn-sm px-3 py-2 fw-semibold d-inline-flex align-items-center gap-2 shadow-sm rounded-3"
          >
            <FileSpreadsheet size={16} />
            <span>Exportar Excel</span>
          </button>
          <button
            onClick={() => loadData(token, true)}
            disabled={isSyncing}
            className="btn btn-outline-secondary btn-sm px-3 py-2 fw-semibold d-inline-flex align-items-center gap-2 shadow-sm rounded-3 bg-white"
          >
            <RefreshCw size={15} className={isSyncing ? 'spin-anim' : ''} />
            <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar'}</span>
          </button>
        </div>
      </div>

      {/* SECCIÓN 1: REPORTE DE VENTAS */}
      <div className="mb-5">
        <h2 className="h6 fw-bold text-dark mb-3">Reporte de ventas</h2>

        {/* Tarjeta de Filtros de Ventas */}
        <div className="bg-white p-3.5 rounded-4 shadow-sm border mb-4">
          <div className="small fw-bold text-muted mb-3 text-uppercase tracking-wider" style={{ fontSize: '0.75rem' }}>
            Filtros de ventas
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
                <option value="ALL">Todos</option>
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
                <option value="ALL">Todos</option>
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
                <option value="ALL">Todos</option>
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
                <option value="ALL">Todos</option>
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
              <label className="form-label small fw-semibold text-muted mb-1">Tipo de suscripción</label>
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
                <option value="ALL">Todos</option>
                <option value="MYPE">MYPE Tributario</option>
                <option value="GENERAL">General</option>
                <option value="ESPECIAL">Especial / RER</option>
                <option value="RUS">Nuevo RUS</option>
              </select>
            </div>
            <div className="col-12 col-md-4 col-lg-4 d-flex gap-2">
              <button
                type="button"
                className="btn btn-primary btn-sm px-3 py-1.5 fw-semibold d-inline-flex align-items-center justify-content-center gap-1.5 flex-grow-1 rounded-3 shadow-sm"
                onClick={() => setVentasPage(1)}
              >
                <Search size={14} />
                <span>Buscar</span>
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm px-3 py-1.5 fw-semibold d-inline-flex align-items-center justify-content-center gap-1.5 rounded-3 bg-white"
                onClick={resetFilters}
              >
                <RotateCcw size={14} />
                <span>Limpiar filtros</span>
              </button>
            </div>
          </div>
        </div>

        {/* 4 KPI Stat Cards */}
        <div className="row g-3 mb-4">
          <div className="col-12 col-sm-6 col-lg-3">
            <div className="bg-white p-3.5 rounded-4 shadow-sm border d-flex align-items-center gap-3">
              <div
                className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
                style={{ width: '48px', height: '48px', backgroundColor: '#EFF6FF', color: '#2563EB' }}
              >
                <ShoppingCart size={22} />
              </div>
              <div>
                <small className="text-muted fw-semibold d-block">Ventas totales</small>
                <strong className="fs-5 text-dark fw-bold d-block" style={{ lineHeight: '1.2' }}>
                  S/ {totalVentas.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </strong>
                <small className="text-muted" style={{ fontSize: '0.75rem' }}>{totalVentasCount} ventas</small>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <div className="bg-white p-3.5 rounded-4 shadow-sm border d-flex align-items-center gap-3">
              <div
                className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
                style={{ width: '48px', height: '48px', backgroundColor: '#ECFDF5', color: '#059669' }}
              >
                <DollarSign size={22} />
              </div>
              <div>
                <small className="text-muted fw-semibold d-block">Ingresos generados</small>
                <strong className="fs-5 text-dark fw-bold d-block" style={{ lineHeight: '1.2' }}>
                  S/ {totalIngresos.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </strong>
                <small className="text-muted" style={{ fontSize: '0.75rem' }}>Monto cobrado</small>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <div className="bg-white p-3.5 rounded-4 shadow-sm border d-flex align-items-center gap-3">
              <div
                className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
                style={{ width: '48px', height: '48px', backgroundColor: '#FEF2F2', color: '#DC2626' }}
              >
                <AlertCircle size={22} />
              </div>
              <div>
                <small className="text-muted fw-semibold d-block">Pagos pendientes</small>
                <strong className="fs-5 fw-bold d-block text-danger" style={{ lineHeight: '1.2' }}>
                  S/ {totalPendiente.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </strong>
                <small className="text-muted" style={{ fontSize: '0.75rem' }}>{totalPendienteCount} ventas pendientes</small>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <div className="bg-white p-3.5 rounded-4 shadow-sm border d-flex align-items-center gap-3">
              <div
                className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
                style={{ width: '48px', height: '48px', backgroundColor: '#FAF5FF', color: '#9333EA' }}
              >
                <Ticket size={22} />
              </div>
              <div>
                <small className="text-muted fw-semibold d-block">Ticket promedio</small>
                <strong className="fs-5 text-dark fw-bold d-block" style={{ lineHeight: '1.2' }}>
                  S/ {ticketPromedio.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </strong>
                <small className="text-muted" style={{ fontSize: '0.75rem' }}>Por venta</small>
              </div>
            </div>
          </div>
        </div>

        {/* Gráficos: Ventas e Ingresos por Periodo + Ventas por Plan */}
        <div className="row g-3 mb-4">
          {/* Gráfico de Líneas: Ventas e Ingresos */}
          <div className="col-12 col-lg-7">
            <div className="bg-white p-3.5 rounded-4 shadow-sm border h-100 d-flex flex-column justify-content-between">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <strong className="small text-dark fw-bold">Ventas e ingresos por periodo</strong>
                <div className="d-flex align-items-center gap-3" style={{ fontSize: '0.75rem' }}>
                  <span className="d-inline-flex align-items-center gap-1.5 text-muted fw-semibold">
                    <span className="d-inline-block rounded-circle" style={{ width: '8px', height: '8px', backgroundColor: '#2563EB' }}></span>
                    Ventas (S/)
                  </span>
                  <span className="d-inline-flex align-items-center gap-1.5 text-muted fw-semibold">
                    <span className="d-inline-block rounded-circle" style={{ width: '8px', height: '8px', backgroundColor: '#059669' }}></span>
                    Ingresos (S/)
                  </span>
                </div>
              </div>

              {/* Renderizado de gráfico SVG estilizado */}
              <div className="w-100" style={{ height: '180px' }}>
                {timelineData.length === 0 ? (
                  <div className="d-flex align-items-center justify-content-center h-100 text-muted small">
                    Sin datos en el periodo seleccionado
                  </div>
                ) : (
                  <svg viewBox="0 0 500 160" className="w-100 h-100" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2563EB" stopOpacity="0.18" />
                        <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    {/* Líneas de cuadrícula */}
                    <line x1="30" y1="20" x2="490" y2="20" stroke="#F1F5F9" strokeWidth="1" />
                    <line x1="30" y1="60" x2="490" y2="60" stroke="#F1F5F9" strokeWidth="1" />
                    <line x1="30" y1="100" x2="490" y2="100" stroke="#F1F5F9" strokeWidth="1" />
                    <line x1="30" y1="140" x2="490" y2="140" stroke="#E2E8F0" strokeWidth="1" />

                    {(() => {
                      const maxVal = Math.max(...timelineData.map((d) => Math.max(d.ventas, d.ingresos)), 100);
                      const pointsVentas = timelineData.map((d, i) => {
                        const x = 40 + (i / Math.max(timelineData.length - 1, 1)) * 440;
                        const y = 140 - (d.ventas / maxVal) * 115;
                        return `${x},${y}`;
                      });
                      const pointsIngresos = timelineData.map((d, i) => {
                        const x = 40 + (i / Math.max(timelineData.length - 1, 1)) * 440;
                        const y = 140 - (d.ingresos / maxVal) * 115;
                        return `${x},${y}`;
                      });

                      return (
                        <>
                          <polyline fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={pointsVentas.join(' ')} />
                          <polyline fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={pointsIngresos.join(' ')} />

                          {timelineData.map((d, i) => {
                            const x = 40 + (i / Math.max(timelineData.length - 1, 1)) * 440;
                            const yVentas = 140 - (d.ventas / maxVal) * 115;
                            const yIngresos = 140 - (d.ingresos / maxVal) * 115;
                            return (
                              <g key={i}>
                                <circle cx={x} cy={yVentas} r="3.5" fill="#FFFFFF" stroke="#2563EB" strokeWidth="2" />
                                <circle cx={x} cy={yIngresos} r="3.5" fill="#FFFFFF" stroke="#059669" strokeWidth="2" />
                              </g>
                            );
                          })}
                        </>
                      );
                    })()}
                  </svg>
                )}
              </div>

              {/* Eje X Fechas */}
              <div className="d-flex justify-content-between text-muted mt-2" style={{ fontSize: '0.68rem' }}>
                {timelineData.slice(0, 7).map((d, i) => (
                  <span key={i}>{d.label}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Gráfico Donut + Tabla: Ventas por Plan */}
          <div className="col-12 col-lg-5">
            <div className="bg-white p-3.5 rounded-4 shadow-sm border h-100 d-flex flex-column">
              <strong className="small text-dark fw-bold mb-3">Ventas por plan</strong>

              <div className="row align-items-center g-3 flex-grow-1">
                {/* Donut SVG */}
                <div className="col-5 d-flex justify-content-center">
                  <div style={{ width: '110px', height: '110px', position: 'relative' }}>
                    <svg viewBox="0 0 36 36" className="w-100 h-100">
                      {(() => {
                        let accum = 0;
                        return planDistribution.map((p, idx) => {
                          const pct = parseFloat(p.percentage) || 0;
                          const strokeDasharray = `${pct} ${100 - pct}`;
                          const strokeDashoffset = 100 - accum + 25;
                          accum += pct;
                          return (
                            <circle
                              key={idx}
                              cx="18"
                              cy="18"
                              r="15.915"
                              fill="transparent"
                              stroke={p.color}
                              strokeWidth="4.2"
                              strokeDasharray={strokeDasharray}
                              strokeDashoffset={strokeDashoffset}
                            />
                          );
                        });
                      })()}
                    </svg>
                  </div>
                </div>

                {/* Tabla de desglose */}
                <div className="col-7">
                  <div className="d-flex flex-column gap-1.5" style={{ fontSize: '0.75rem' }}>
                    {planDistribution.map((p, idx) => (
                      <div key={idx} className="d-flex justify-content-between align-items-center">
                        <span className="d-inline-flex align-items-center gap-1.5 text-muted fw-semibold">
                          <span className="rounded-circle d-inline-block flex-shrink-0" style={{ width: '7px', height: '7px', backgroundColor: p.color }}></span>
                          <span className="text-truncate" style={{ maxWidth: '75px' }}>{p.label}</span>
                        </span>
                        <span className="text-muted fw-medium">{p.percentage}%</span>
                        <strong className="text-dark fw-bold">S/ {p.amount.toFixed(2)}</strong>
                      </div>
                    ))}
                    <div className="d-flex justify-content-between align-items-center pt-1.5 mt-1 border-top fw-bold text-dark">
                      <span>Total</span>
                      <span>100%</span>
                      <span>S/ {totalVentas.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabla: Detalle de Ventas */}
        <div className="bg-white p-3.5 rounded-4 shadow-sm border">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <strong className="small text-dark fw-bold">Detalle de ventas</strong>
            <small className="text-muted fw-semibold">
              Mostrando {displayedVentas.length} de {filteredTransactions.length} registros
            </small>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.78rem' }}>
              <thead>
                <tr className="text-muted border-bottom" style={{ fontSize: '0.72rem' }}>
                  <th className="fw-semibold">Fecha</th>
                  <th className="fw-semibold">Cliente</th>
                  <th className="fw-semibold">RUC</th>
                  <th className="fw-semibold">Plan</th>
                  <th className="fw-semibold">Vendedor</th>
                  <th className="fw-semibold">Monto</th>
                  <th className="fw-semibold">Método de pago</th>
                  <th className="fw-semibold text-end">Estado</th>
                </tr>
              </thead>
              <tbody>
                {displayedVentas.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center text-muted py-4">
                      No se encontraron ventas con los filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  displayedVentas.map((t) => (
                    <tr key={t.id}>
                      <td className="text-muted">
                        {t.fechaObj.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })}{' '}
                        <span className="text-muted opacity-75">{t.fechaObj.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</span>
                      </td>
                      <td className="fw-bold text-dark">{t.cliente}</td>
                      <td className="text-muted">{t.ruc}</td>
                      <td>
                        <span className="badge bg-light text-dark border px-2 py-1">{t.plan}</span>
                      </td>
                      <td className="text-dark fw-medium">{t.vendedor}</td>
                      <td className="fw-bold text-dark">S/ {t.monto.toFixed(2)}</td>
                      <td className="text-muted capitalize">{t.metodoPago.toLowerCase()}</td>
                      <td className="text-end">
                        <span
                          className={`badge rounded-pill px-2.5 py-1 ${
                            t.estado === 'PAGADO'
                              ? 'bg-success bg-opacity-10 text-success border border-success border-opacity-25'
                              : 'bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25'
                          }`}
                        >
                          {t.estado === 'PAGADO' ? 'Pagado' : 'Pendiente'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
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
        <h2 className="h6 fw-bold text-dark mb-3">Mis comisiones por venta de sistema</h2>

        {/* 4 KPI Stat Cards Comisiones */}
        <div className="row g-3 mb-4">
          <div className="col-12 col-sm-6 col-lg-3">
            <div className="bg-white p-3.5 rounded-4 shadow-sm border d-flex align-items-center gap-3">
              <div
                className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
                style={{ width: '48px', height: '48px', backgroundColor: '#EFF6FF', color: '#2563EB' }}
              >
                <Coins size={22} />
              </div>
              <div>
                <small className="text-muted fw-semibold d-block">Comisión acumulada</small>
                <strong className="fs-5 text-primary fw-bold d-block" style={{ lineHeight: '1.2' }}>
                  S/ {comisionAcumulada.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </strong>
                <small className="text-muted" style={{ fontSize: '0.75rem' }}>{totalAltasCount} afiliaciones</small>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <div className="bg-white p-3.5 rounded-4 shadow-sm border d-flex align-items-center gap-3">
              <div
                className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
                style={{ width: '48px', height: '48px', backgroundColor: '#ECFDF5', color: '#059669' }}
              >
                <TrendingUp size={22} />
              </div>
              <div>
                <small className="text-muted fw-semibold d-block">Ventas realizadas</small>
                <strong className="fs-5 text-dark fw-bold d-block" style={{ lineHeight: '1.2' }}>
                  {totalAltasCount}
                </strong>
                <small className="text-muted" style={{ fontSize: '0.75rem' }}>Afiliaciones de sistema</small>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <div className="bg-white p-3.5 rounded-4 shadow-sm border d-flex align-items-center gap-3">
              <div
                className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
                style={{ width: '48px', height: '48px', backgroundColor: '#FAF5FF', color: '#9333EA' }}
              >
                <Percent size={22} />
              </div>
              <div>
                <small className="text-muted fw-semibold d-block">Tasa de comisión</small>
                <strong className="fs-5 text-dark fw-bold d-block" style={{ lineHeight: '1.2' }}>
                  S/ 9.00
                </strong>
                <small className="text-muted" style={{ fontSize: '0.75rem' }}>Por afiliación (ALTA)</small>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <div className="bg-white p-3.5 rounded-4 shadow-sm border d-flex align-items-center gap-3">
              <div
                className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
                style={{ width: '48px', height: '48px', backgroundColor: '#FFFBEB', color: '#D97706' }}
              >
                <Clock size={22} />
              </div>
              <div>
                <small className="text-muted fw-semibold d-block">Pendiente de pago</small>
                <strong className="fs-5 fw-bold d-block" style={{ lineHeight: '1.2', color: '#D97706' }}>
                  S/ {comisionPendiente.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </strong>
                <small className="text-muted" style={{ fontSize: '0.75rem' }}>{altasPendientesCount} por liquidar</small>
              </div>
            </div>
          </div>
        </div>

        {/* Gráfico Comisiones por Mes + Detalle de Comisiones */}
        <div className="row g-3">
          {/* Gráfico de Barras Comisiones */}
          <div className="col-12 col-lg-5">
            <div className="bg-white p-3.5 rounded-4 shadow-sm border h-100 d-flex flex-column justify-content-between">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <strong className="small text-dark fw-bold">Comisiones por mes</strong>
                <span className="d-inline-flex align-items-center gap-1.5 text-muted fw-semibold" style={{ fontSize: '0.72rem' }}>
                  <span className="d-inline-block rounded" style={{ width: '10px', height: '10px', backgroundColor: '#2563EB' }}></span>
                  Comisión (S/)
                </span>
              </div>

              {/* Render de Barras */}
              <div className="d-flex align-items-end justify-content-between gap-1.5 pt-4 pb-2" style={{ height: '180px' }}>
                {(() => {
                  const maxCom = Math.max(...monthlyCommissions.map((m) => m.comision), 50);
                  return monthlyCommissions.map((m, idx) => {
                    const barHeight = Math.max((m.comision / maxCom) * 120, 6);
                    return (
                      <div key={idx} className="d-flex flex-column align-items-center flex-grow-1" style={{ minWidth: 0 }}>
                        {m.comision > 0 && (
                          <span className="text-dark fw-bold mb-1" style={{ fontSize: '0.62rem' }}>
                            {m.comision.toFixed(0)}
                          </span>
                        )}
                        <div
                          className="w-100 rounded-top"
                          style={{
                            height: `${barHeight}px`,
                            backgroundColor: m.comision > 0 ? '#2563EB' : '#E2E8F0',
                            maxWidth: '28px',
                            transition: 'height 0.3s ease',
                          }}
                        ></div>
                        <span className="text-muted mt-1.5" style={{ fontSize: '0.68rem' }}>
                          {m.month}
                        </span>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>

          {/* Tabla: Detalle de Comisiones */}
          <div className="col-12 col-lg-7">
            <div className="bg-white p-3.5 rounded-4 shadow-sm border h-100 d-flex flex-column justify-content-between">
              <div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <strong className="small text-dark fw-bold">Detalle de comisiones</strong>
                  <small className="text-muted fw-semibold">
                    Mostrando {displayedComisiones.length} de {altasTransactions.length} afiliaciones
                  </small>
                </div>

                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.78rem' }}>
                    <thead>
                      <tr className="text-muted border-bottom" style={{ fontSize: '0.72rem' }}>
                        <th className="fw-semibold">Fecha</th>
                        <th className="fw-semibold">Cliente</th>
                        <th className="fw-semibold">Plan</th>
                        <th className="fw-semibold">Monto venta</th>
                        <th className="fw-semibold">% Comisión</th>
                        <th className="fw-semibold">Comisión</th>
                        <th className="fw-semibold text-end">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedComisiones.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center text-muted py-4">
                            No se encontraron afiliaciones en el periodo filtrado.
                          </td>
                        </tr>
                      ) : (
                        displayedComisiones.map((t) => (
                          <tr key={t.id}>
                            <td className="text-muted">
                              {t.fechaObj.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                            </td>
                            <td className="fw-bold text-dark">{t.cliente}</td>
                            <td>
                              <span className="badge bg-light text-dark border px-2 py-0.5">{t.plan}</span>
                            </td>
                            <td className="fw-bold text-dark">S/ {t.monto.toFixed(2)}</td>
                            <td className="text-muted">Fija / ALTA</td>
                            <td className="fw-bold text-primary">S/ {TASA_COMISION_ALTA.toFixed(2)}</td>
                            <td className="text-end">
                              <span
                                className={`badge rounded-pill px-2.5 py-1 ${
                                  t.estado === 'PAGADO'
                                    ? 'bg-success bg-opacity-10 text-success border border-success border-opacity-25'
                                    : 'bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25'
                                }`}
                              >
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
