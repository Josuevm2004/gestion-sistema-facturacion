'use client';

import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  RefreshCw,
  Search,
  RotateCcw,
  ShoppingCart,
  DollarSign,
  AlertCircle,
  Receipt,
  Coins,
  TrendingUp,
  Percent,
  Clock,
  ChevronLeft,
  ChevronRight,
  Calendar,
  CreditCard,
  CheckCircle,
  Filter,
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
  ventas?: any[];
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
  ventas = [],
  handleExportExcel,
  loadData = () => {},
  isSyncing = false,
  token,
  uniqueSellers = [],
}: ReportesExcelTabProps) {
  // Safe Arrays
  const safeClients = useMemo(() => (Array.isArray(clients) ? clients : []), [clients]);
  const safePayments = useMemo(() => (Array.isArray(payments) ? payments : []), [payments]);
  const safeVentas = useMemo(() => (Array.isArray(ventas) ? ventas : []), [ventas]);

  // Clients Map by ID and RUC
  const clientMap = useMemo(() => {
    const map = new Map<string, Client>();
    safeClients.forEach((c) => {
      if (c.id) map.set(String(c.id), c);
      if (c.ruc) map.set(String(c.ruc), c);
    });
    return map;
  }, [safeClients]);

  // Payment Map by Venta ID
  const paymentByVentaMap = useMemo(() => {
    const map = new Map<string, any>();
    safePayments.forEach((p) => {
      const vId = p.ventaId || p.venta?.id;
      if (vId) map.set(String(vId), p);
      if (p.id) map.set(String(p.id), p);
    });
    return map;
  }, [safePayments]);

  // Filters State
  const [filterFechaDesde, setFilterFechaDesde] = useState<string>('');
  const [filterFechaHasta, setFilterFechaHasta] = useState<string>('');
  const [filterMes, setFilterMes] = useState<string>('TODOS');
  const [filterEstadoPago, setFilterEstadoPago] = useState<string>('TODOS');
  const [filterPlan, setFilterPlan] = useState<string>('TODOS');
  const [filterVendedor, setFilterVendedor] = useState<string>('TODOS');
  const [filterCliente, setFilterCliente] = useState<string>('');
  const [filterMetodoPago, setFilterMetodoPago] = useState<string>('TODOS');
  const [filterTipoSuscripcion, setFilterTipoSuscripcion] = useState<string>('TODOS');
  const [filterRegimen, setFilterRegimen] = useState<string>('TODOS');

  // Pagination states
  const [salesPage, setSalesPage] = useState<number>(1);
  const [salesPageSize, setSalesPageSize] = useState<number>(10);
  const [comisionesPage, setComisionesPage] = useState<number>(1);
  const [comisionesPageSize, setComisionesPageSize] = useState<number>(10);
  const [hoveredPoint, setHoveredPoint] = useState<{ day: string; ventas: number; ingresos: number; x: number; y: number } | null>(null);
  const [isExportingExcel, setIsExportingExcel] = useState<boolean>(false);

  // Helper normalizers
  const normalizePlan = (name?: string) => {
    const n = (name || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/^PLAN\s+/, '').trim();
    if (n.includes('INICI')) return 'Plan Inicia';
    if (n.includes('EMPRENDE')) return 'Plan Emprende';
    if (n.includes('IMPULSA')) return 'Plan Impulsa';
    if (n.includes('EMPRESARIAL')) return 'Plan Empresarial';
    if (n.includes('LIDER')) return 'Plan Líder';
    return name ? `Plan ${name}` : 'Plan Inicia';
  };

  // Build Real Database Sales Dataset (100% deduplicated, 1:1 with CockroachDB rows)
  const realDatabaseSales = useMemo(() => {
    const list: Array<{
      id: string;
      fecha: string;
      fechaDate: Date;
      clienteId?: string;
      clienteNombre: string;
      ruc: string;
      planNombre: string;
      tipoSuscripcion: string;
      vendedor: string;
      monto: number;
      metodoPago: string;
      estado: 'PAGADO' | 'PENDIENTE' | 'CANCELADA';
      tipoOperacion: string;
      regimen: string;
    }> = [];

    const seenIds = new Set<string>();

    // 1. If backend ventas list is loaded, use it as primary truth
    if (safeVentas.length > 0) {
      safeVentas.forEach((v) => {
        const vId = String(v.id || v.ventaId || '');
        if (!vId || seenIds.has(vId)) return;
        seenIds.add(vId);

        const fechaStr = v.fechaVenta || v.fechaOperacion || v.fechaActualizacion;
        const d = fechaStr ? new Date(fechaStr) : new Date();
        const validDate = isNaN(d.getTime()) ? new Date() : d;

        const cId = String(v.clienteId || v.cliente?.id || '');
        const clientObj = clientMap.get(cId) || v.cliente;

        const estadoVenta = (v.estadoVenta || 'PENDIENTE_PAGO').toUpperCase();
        const finalEstado =
          estadoVenta === 'PAGADA' ? 'PAGADO' : estadoVenta === 'CANCELADA' ? 'CANCELADA' : 'PENDIENTE';

        const associatedPayment = paymentByVentaMap.get(vId);
        const metodo = associatedPayment?.medioPago || 'TRANSFERENCIA';

        const planName = normalizePlan(
          v.planNombre || v.suscripcion?.plan?.nombrePlan || clientObj?.planContratado || 'Plan Inicia'
        );
        const vendedorName =
          v.vendedorNombre || v.vendedor?.nombre || clientObj?.vendedor || 'Por asignar';

        list.push({
          id: vId,
          fecha: validDate.toISOString(),
          fechaDate: validDate,
          clienteId: cId,
          clienteNombre: clientObj?.razonSocial || v.cliente?.razonSocial || 'Cliente no especificado',
          ruc: clientObj?.ruc || v.cliente?.ruc || '-',
          planNombre: planName,
          tipoSuscripcion: (v.tipoSuscripcion || clientObj?.tipoSuscripcion || 'MENSUAL').toUpperCase(),
          vendedor: vendedorName,
          monto: Number(v.montoTotal || v.precioLista || 0),
          metodoPago: metodo,
          estado: finalEstado,
          tipoOperacion: (v.tipoVenta || 'RENOVACION').toUpperCase(),
          regimen: clientObj?.regimenTributario || 'GENERAL',
        });
      });
    } else if (safePayments.length > 0) {
      // 2. Fallback to payments if ventas endpoint was not loaded
      safePayments.forEach((p) => {
        const pId = String(p.id || p.pagoId || '');
        if (!pId || seenIds.has(pId)) return;
        seenIds.add(pId);

        const fechaStr = p.fechaPago || p.fechaRegistro || p.venta?.fechaVenta;
        const d = fechaStr ? new Date(fechaStr) : new Date();
        const validDate = isNaN(d.getTime()) ? new Date() : d;

        const cId = String(p.venta?.cliente?.id ?? p.clienteId ?? p.venta?.clienteId ?? '');
        const clientObj = clientMap.get(cId) || p.venta?.cliente;

        const estadoPago = (p.estadoPago || 'PAGADO').toUpperCase();
        const estadoVenta = (p.venta?.estadoVenta || p.estadoVenta || '').toUpperCase();
        const finalEstado =
          estadoVenta === 'CANCELADA' ? 'CANCELADA' : estadoPago === 'PAGADO' ? 'PAGADO' : 'PENDIENTE';

        const planName = normalizePlan(
          p.venta?.suscripcion?.plan?.nombrePlan || p.venta?.planNombre || clientObj?.planContratado || 'Plan Inicia'
        );
        const vendedorName =
          p.venta?.vendedor?.nombre || p.vendedorNombre || clientObj?.vendedor || 'Por asignar';

        list.push({
          id: pId,
          fecha: validDate.toISOString(),
          fechaDate: validDate,
          clienteId: cId,
          clienteNombre: clientObj?.razonSocial || p.venta?.cliente?.razonSocial || 'Cliente no especificado',
          ruc: clientObj?.ruc || p.venta?.cliente?.ruc || '-',
          planNombre: planName,
          tipoSuscripcion: (p.venta?.suscripcion?.tipoSuscripcion || clientObj?.tipoSuscripcion || 'MENSUAL').toUpperCase(),
          vendedor: vendedorName,
          monto: Number(p.monto || p.venta?.montoTotal || 0),
          metodoPago: p.medioPago || 'TRANSFERENCIA',
          estado: finalEstado,
          tipoOperacion: (p.venta?.tipoVenta || p.tipoOperacion || 'RENOVACION').toUpperCase(),
          regimen: clientObj?.regimenTributario || 'GENERAL',
        });
      });
    }

    // Sort by date descending
    return list.sort((a, b) => b.fechaDate.getTime() - a.fechaDate.getTime());
  }, [safeVentas, safePayments, clientMap, paymentByVentaMap]);

  // Generate Available Months for Filter Dropdown from Real Dates
  const availableMonthOptions = useMemo(() => {
    const monthMap = new Map<string, string>();
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
    realDatabaseSales.forEach((t) => {
      const y = t.fechaDate.getFullYear();
      const m = t.fechaDate.getMonth();
      const key = `${y}-${String(m + 1).padStart(2, '0')}`;
      const label = `${monthNames[m]} ${y}`;
      if (!monthMap.has(key)) monthMap.set(key, label);
    });

    const now = new Date();
    const curKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    if (!monthMap.has(curKey)) monthMap.set(curKey, `${monthNames[now.getMonth()]} ${now.getFullYear()}`);

    return Array.from(monthMap.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [realDatabaseSales]);

  // Filtered Sales Dataset
  const filteredSales = useMemo(() => {
    return realDatabaseSales.filter((item) => {
      if (filterFechaDesde) {
        const fromDate = new Date(`${filterFechaDesde}T00:00:00`);
        if (item.fechaDate < fromDate) return false;
      }
      if (filterFechaHasta) {
        const toDate = new Date(`${filterFechaHasta}T23:59:59`);
        if (item.fechaDate > toDate) return false;
      }

      if (filterMes !== 'TODOS') {
        const itemMonthKey = `${item.fechaDate.getFullYear()}-${String(item.fechaDate.getMonth() + 1).padStart(2, '0')}`;
        if (itemMonthKey !== filterMes) return false;
      }

      if (filterEstadoPago !== 'TODOS') {
        if (item.estado !== filterEstadoPago) return false;
      }

      if (filterPlan !== 'TODOS') {
        if (!item.planNombre.toLowerCase().includes(filterPlan.toLowerCase())) return false;
      }

      if (filterVendedor !== 'TODOS') {
        if (item.vendedor.toLowerCase() !== filterVendedor.toLowerCase()) return false;
      }

      if (filterCliente.trim()) {
        const q = filterCliente.toLowerCase().trim();
        const matches = item.clienteNombre.toLowerCase().includes(q) || item.ruc.toLowerCase().includes(q);
        if (!matches) return false;
      }

      if (filterMetodoPago !== 'TODOS') {
        if (item.metodoPago.toLowerCase() !== filterMetodoPago.toLowerCase()) return false;
      }

      if (filterTipoSuscripcion !== 'TODOS') {
        if (item.tipoSuscripcion !== filterTipoSuscripcion) return false;
      }

      if (filterRegimen !== 'TODOS') {
        if (item.regimen !== filterRegimen) return false;
      }

      return true;
    });
  }, [
    realDatabaseSales,
    filterFechaDesde,
    filterFechaHasta,
    filterMes,
    filterEstadoPago,
    filterPlan,
    filterVendedor,
    filterCliente,
    filterMetodoPago,
    filterTipoSuscripcion,
    filterRegimen,
  ]);

  // Reset Filters
  const handleResetFilters = () => {
    setFilterFechaDesde('');
    setFilterFechaHasta('');
    setFilterMes('TODOS');
    setFilterEstadoPago('TODOS');
    setFilterPlan('TODOS');
    setFilterVendedor('TODOS');
    setFilterCliente('');
    setFilterMetodoPago('TODOS');
    setFilterTipoSuscripcion('TODOS');
    setFilterRegimen('TODOS');
    setSalesPage(1);
    setComisionesPage(1);
  };

  // Section 1: KPI Metrics
  const kpiVentasTotales = useMemo(() => {
    return filteredSales.reduce((acc, cur) => acc + cur.monto, 0);
  }, [filteredSales]);

  const kpiIngresosGenerados = useMemo(() => {
    return filteredSales
      .filter((t) => t.estado === 'PAGADO')
      .reduce((acc, cur) => acc + cur.monto, 0);
  }, [filteredSales]);

  const kpiPagosPendientes = useMemo(() => {
    return filteredSales
      .filter((t) => t.estado === 'PENDIENTE')
      .reduce((acc, cur) => acc + cur.monto, 0);
  }, [filteredSales]);

  const countVentasTotales = filteredSales.length;
  const countVentasPendientes = filteredSales.filter((t) => t.estado === 'PENDIENTE').length;
  const kpiTicketPromedio = countVentasTotales > 0 ? kpiVentasTotales / countVentasTotales : 0;

  // Plan Distribution Breakdown
  const planBreakdown = useMemo(() => {
    const map = new Map<string, { count: number; monto: number; color: string }>();
    const planColors: Record<string, string> = {
      'Plan Inicia': '#3b82f6',
      'Plan Emprende': '#10b981',
      'Plan Impulsa': '#8b5cf6',
      'Plan Empresarial': '#06b6d4',
      'Plan Líder': '#f59e0b',
    };

    filteredSales.forEach((t) => {
      const p = t.planNombre;
      if (!map.has(p)) {
        map.set(p, { count: 0, monto: 0, color: planColors[p] || '#64748b' });
      }
      const item = map.get(p)!;
      item.count += 1;
      item.monto += t.monto;
    });

    const totalMonto = kpiVentasTotales || 1;
    return Array.from(map.entries()).map(([plan, data]) => ({
      plan,
      monto: data.monto,
      color: data.color,
      percent: (data.monto / totalMonto) * 100,
    }));
  }, [filteredSales, kpiVentasTotales]);

  // Daily Chart Points for "Ventas e ingresos por periodo"
  const chartPeriodPoints = useMemo(() => {
    const dailyMap = new Map<string, { ventas: number; ingresos: number; label: string }>();

    const sortedAsc = [...filteredSales].sort((a, b) => a.fechaDate.getTime() - b.fechaDate.getTime());
    sortedAsc.forEach((t) => {
      const dayKey = `${t.fechaDate.getFullYear()}-${String(t.fechaDate.getMonth() + 1).padStart(2, '0')}-${String(t.fechaDate.getDate()).padStart(2, '0')}`;
      const dayLabel = `${String(t.fechaDate.getDate()).padStart(2, '0')} ${t.fechaDate.toLocaleDateString('es-PE', { month: 'short' })}`;
      if (!dailyMap.has(dayKey)) {
        dailyMap.set(dayKey, { ventas: 0, ingresos: 0, label: dayLabel });
      }
      const entry = dailyMap.get(dayKey)!;
      entry.ventas += t.monto;
      if (t.estado === 'PAGADO') {
        entry.ingresos += t.monto;
      }
    });

    if (dailyMap.size === 0) {
      return [
        { label: '01', ventas: 0, ingresos: 0 },
        { label: '15', ventas: 0, ingresos: 0 },
        { label: '30', ventas: 0, ingresos: 0 },
      ];
    }

    return Array.from(dailyMap.values());
  }, [filteredSales]);

  // Section 2: Affiliation Commissions (S/ 9.00 fixed per ALTA)
  const COMMISSION_PER_ALTA = 9.0;

  const affiliationRecords = useMemo(() => {
    return filteredSales.filter(
      (t) => t.tipoOperacion === 'ALTA' || t.tipoOperacion === 'AFILIACION' || t.tipoOperacion.includes('ALTA')
    );
  }, [filteredSales]);

  const totalComisionAcumulada = useMemo(() => {
    return affiliationRecords.filter((t) => t.estado === 'PAGADO').length * COMMISSION_PER_ALTA;
  }, [affiliationRecords]);

  const totalComisionPendiente = useMemo(() => {
    return affiliationRecords.filter((t) => t.estado === 'PENDIENTE').length * COMMISSION_PER_ALTA;
  }, [affiliationRecords]);

  const countAltasRealizadas = affiliationRecords.length;
  const countAltasPendientes = affiliationRecords.filter((t) => t.estado === 'PENDIENTE').length;

  // Monthly Commissions Breakdown (Bar Chart)
  const monthlyCommissionsData = useMemo(() => {
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic'];
    const monthlySum = new Array(12).fill(0);

    affiliationRecords.forEach((t) => {
      if (t.estado === 'PAGADO') {
        const m = t.fechaDate.getMonth();
        monthlySum[m] += COMMISSION_PER_ALTA;
      }
    });

    return monthNames.map((name, index) => ({
      month: name,
      comision: monthlySum[index],
    }));
  }, [affiliationRecords]);

  // Paginated Sales Table
  const paginatedSales = useMemo(() => {
    const start = (salesPage - 1) * salesPageSize;
    return filteredSales.slice(start, start + salesPageSize);
  }, [filteredSales, salesPage, salesPageSize]);

  const totalSalesPages = Math.ceil(filteredSales.length / salesPageSize) || 1;

  // Paginated Commissions Table
  const paginatedComisiones = useMemo(() => {
    const start = (comisionesPage - 1) * comisionesPageSize;
    return affiliationRecords.slice(start, start + comisionesPageSize);
  }, [affiliationRecords, comisionesPage, comisionesPageSize]);

  const totalComisionesPages = Math.ceil(affiliationRecords.length / comisionesPageSize) || 1;

  // Format Helpers
  const formatCurrency = (val: number) =>
    `S/ ${Number(val || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const formatTableDate = (isoStr: string) => {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Chart Geometry Calculations
  const maxChartVal = useMemo(() => {
    let max = 100;
    chartPeriodPoints.forEach((p) => {
      if (p.ventas > max) max = p.ventas;
      if (p.ingresos > max) max = p.ingresos;
    });
    return max * 1.18;
  }, [chartPeriodPoints]);

  const maxCommissionVal = useMemo(() => {
    let max = 50;
    monthlyCommissionsData.forEach((m) => {
      if (m.comision > max) max = m.comision;
    });
    return max * 1.3;
  }, [monthlyCommissionsData]);

  // Excel XML Matrix Export
  const exportToExcelLocal = async () => {
    if (handleExportExcel) {
      handleExportExcel();
      return;
    }

    setIsExportingExcel(true);
    try {
      const monthNames = [
        'ENERO',
        'FEBRERO',
        'MARZO',
        'ABRIL',
        'MAYO',
        'JUNIO',
        'JULIO',
        'AGOSTO',
        'SETIEMBRE',
        'OCTUBRE',
        'NOVIEMBRE',
        'DICIEMBRE',
      ];

      const detailResults = await Promise.all(
        safeClients.map(async (c) => {
          if (!token) return { clientId: c.id, operaciones: [] as any[], pagos: [] as any[] };
          try {
            const res = await fetch(`/api/admin/clientes/${c.id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            const clienteData = data?.data || data || {};
            return {
              clientId: c.id,
              operaciones: clienteData.operacionesHistorial || [],
              pagos: clienteData.pagosHistorial || [],
            };
          } catch (e) {
            return { clientId: c.id, operaciones: [] as any[], pagos: [] as any[] };
          }
        })
      );

      const clientHistorialMap = new Map<string, { operaciones: any[]; pagos: any[] }>();
      detailResults.forEach((r) => {
        clientHistorialMap.set(String(r.clientId), { operaciones: r.operaciones, pagos: r.pagos });
      });

      const currentYear = new Date().getFullYear();
      const headers = [
        'RUC',
        'RAZÓN SOCIAL',
        'NOMBRE COMERCIAL',
        'TELÉFONO',
        'EMAIL',
        'DEPARTAMENTO',
        'PROVINCIA',
        'DISTRITO',
        'RÉGIMEN',
        'PLAN CONTRATADO',
        'TIPO SUSCRIPCIÓN',
        'MONTO MENSUAL',
        'FECHA REGISTRO',
        'FECHA VENCIMIENTO',
        'ESTADO CUENTA',
        'COLOR TAG',
        'VENDEDOR',
        'USUARIO SOL',
        'CLAVE SOL',
        'LINK SISTEMA',
        'USUARIO SISTEMA',
        'CLAVE SISTEMA',
        'ENTORNO',
        ...monthNames.map((m) => `${m} ${currentYear}`),
        'TOTAL RECAUDADO (S/)',
      ];

      const xmlRows: string[] = [];

      safeClients.forEach((c) => {
        const hData = clientHistorialMap.get(String(c.id)) || { operaciones: [], pagos: [] };
        const monthlyCollections = new Array(12).fill(0);
        let totalClientCollected = 0;

        hData.operaciones.forEach((op: any) => {
          const estadoVenta = (op.estadoVenta || '').toUpperCase();
          if (estadoVenta === 'CANCELADA') return;

          const operationMonthSource = op.fechaInicioServicio || op.fechaPago || op.fechaOperacion || op.fechaVenta;
          if (!operationMonthSource) return;

          const opDate = new Date(operationMonthSource);
          if (isNaN(opDate.getTime())) return;

          if (opDate.getFullYear() === currentYear && op.montoTotal) {
            const mIndex = opDate.getMonth();
            const montoOp = Number(op.montoTotal) || 0;
            monthlyCollections[mIndex] += montoOp;
            totalClientCollected += montoOp;
          }
        });

        const escapeXml = (unsafe: any) => {
          if (unsafe === undefined || unsafe === null) return '';
          return String(unsafe)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
        };

        const cells = [
          `<Cell ss:StyleID="DataCenterStyle"><Data ss:Type="String">${escapeXml(c.ruc)}</Data></Cell>`,
          `<Cell ss:StyleID="DataStyle"><Data ss:Type="String">${escapeXml(c.razonSocial)}</Data></Cell>`,
          `<Cell ss:StyleID="DataStyle"><Data ss:Type="String">${escapeXml(c.nombreComercial)}</Data></Cell>`,
          `<Cell ss:StyleID="DataCenterStyle"><Data ss:Type="String">${escapeXml(c.telefono)}</Data></Cell>`,
          `<Cell ss:StyleID="DataStyle"><Data ss:Type="String">${escapeXml(c.email)}</Data></Cell>`,
          `<Cell ss:StyleID="DataCenterStyle"><Data ss:Type="String">${escapeXml(c.departamento)}</Data></Cell>`,
          `<Cell ss:StyleID="DataCenterStyle"><Data ss:Type="String">${escapeXml(c.provincia)}</Data></Cell>`,
          `<Cell ss:StyleID="DataCenterStyle"><Data ss:Type="String">${escapeXml(c.distrito)}</Data></Cell>`,
          `<Cell ss:StyleID="DataCenterStyle"><Data ss:Type="String">${escapeXml(c.regimenTributario)}</Data></Cell>`,
          `<Cell ss:StyleID="DataCenterStyle"><Data ss:Type="String">${escapeXml(c.planContratado)}</Data></Cell>`,
          `<Cell ss:StyleID="DataCenterStyle"><Data ss:Type="String">${escapeXml(c.tipoSuscripcion)}</Data></Cell>`,
          `<Cell ss:StyleID="CurrencyStyle"><Data ss:Type="Number">${Number(c.montoMensual || 0).toFixed(2)}</Data></Cell>`,
          `<Cell ss:StyleID="DataCenterStyle"><Data ss:Type="String">${escapeXml(c.fechaRegistro ? c.fechaRegistro.slice(0, 10) : '')}</Data></Cell>`,
          `<Cell ss:StyleID="DataCenterStyle"><Data ss:Type="String">${escapeXml(c.fechaVencimientoMensual ? c.fechaVencimientoMensual.slice(0, 10) : '')}</Data></Cell>`,
          `<Cell ss:StyleID="DataCenterStyle"><Data ss:Type="String">${escapeXml(c.estadoCuenta)}</Data></Cell>`,
          `<Cell ss:StyleID="DataCenterStyle"><Data ss:Type="String">${escapeXml(c.colorTag)}</Data></Cell>`,
          `<Cell ss:StyleID="DataCenterStyle"><Data ss:Type="String">${escapeXml(c.vendedor)}</Data></Cell>`,
          `<Cell ss:StyleID="DataCenterStyle"><Data ss:Type="String">${escapeXml(c.usuarioSol)}</Data></Cell>`,
          `<Cell ss:StyleID="DataCenterStyle"><Data ss:Type="String">${escapeXml(c.claveSolCifrada)}</Data></Cell>`,
          `<Cell ss:StyleID="DataStyle"><Data ss:Type="String">${escapeXml(c.linkSistema)}</Data></Cell>`,
          `<Cell ss:StyleID="DataCenterStyle"><Data ss:Type="String">${escapeXml(c.usuarioSistema)}</Data></Cell>`,
          `<Cell ss:StyleID="DataCenterStyle"><Data ss:Type="String">${escapeXml(c.claveSistema)}</Data></Cell>`,
          `<Cell ss:StyleID="DataCenterStyle"><Data ss:Type="String">${escapeXml(c.entornoNombre)}</Data></Cell>`,
          ...monthlyCollections.map((mVal) =>
            mVal > 0
              ? `<Cell ss:StyleID="MonthPaidStyle"><Data ss:Type="Number">${mVal.toFixed(2)}</Data></Cell>`
              : `<Cell ss:StyleID="MonthEmptyStyle"><Data ss:Type="String">-</Data></Cell>`
          ),
          `<Cell ss:StyleID="TotalCollectedStyle"><Data ss:Type="Number">${totalClientCollected.toFixed(2)}</Data></Cell>`,
        ];

        xmlRows.push(`<Row>${cells.join('')}</Row>`);
      });

      const excelTemplate = `<?xml version="1.0" encoding="utf-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#000000"/>
  </Style>
  <Style ss:ID="HeaderStyle">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#001838"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#001838"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#001838"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#001838"/>
   </Borders>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#FFFFFF" ss:Bold="1"/>
   <Interior ss:Color="#002D62" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="DataStyle">
   <Alignment ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9D9D9"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9D9D9"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9D9D9"/>
   </Borders>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="10" ss:Color="#212529"/>
  </Style>
  <Style ss:ID="DataCenterStyle">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9D9D9"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9D9D9"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9D9D9"/>
   </Borders>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="10" ss:Color="#212529"/>
  </Style>
  <Style ss:ID="CurrencyStyle">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9D9D9"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9D9D9"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9D9D9"/>
   </Borders>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="10" ss:Color="#0D6EFD" ss:Bold="1"/>
   <NumberFormat ss:Format="&quot;S/&quot;\ #,##0.00"/>
  </Style>
  <Style ss:ID="MonthPaidStyle">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9D9D9"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9D9D9"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9D9D9"/>
   </Borders>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="10" ss:Color="#198754" ss:Bold="1"/>
   <Interior ss:Color="#E8F5E9" ss:Pattern="Solid"/>
   <NumberFormat ss:Format="&quot;S/&quot;\ #,##0.00"/>
  </Style>
  <Style ss:ID="MonthEmptyStyle">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9D9D9"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9D9D9"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9D9D9"/>
   </Borders>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="10" ss:Color="#999999"/>
  </Style>
  <Style ss:ID="TotalCollectedStyle">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9D9D9"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9D9D9"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9D9D9"/>
   </Borders>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="10" ss:Color="#0047FF" ss:Bold="1"/>
   <Interior ss:Color="#E7F1FF" ss:Pattern="Solid"/>
   <NumberFormat ss:Format="&quot;S/&quot;\ #,##0.00"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Consolidado Clientes">
  <Table>
   <Row ss:Height="26">
    ${headers.map((h) => `<Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">${h}</Data></Cell>`).join('')}
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
    } finally {
      setIsExportingExcel(false);
    }
  };

  return (
    <div className="container-fluid px-0 px-md-3 reporte-general-container d-flex flex-column gap-3 gap-md-4 pb-5">
      {/* 1. Header Principal */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 bg-white p-3.5 p-md-4 rounded-4 shadow-sm border">
        <div>
          <h1 className="h4 fw-bold text-dark mb-1">Reporte general</h1>
          <p className="text-muted small mb-0">Reporte consolidado de ventas, recaudación y comisiones</p>
        </div>
        <div className="d-flex align-items-center gap-2 w-100 w-md-auto justify-content-start justify-content-md-end">
          <button
            onClick={exportToExcelLocal}
            disabled={isExportingExcel}
            className="btn btn-success fw-bold px-3 px-md-3.5 py-2 shadow-sm d-inline-flex align-items-center gap-2 rounded-3"
            style={{ backgroundColor: '#16a34a', borderColor: '#16a34a' }}
          >
            <FileSpreadsheet size={17} />
            <span>{isExportingExcel ? 'Generando Excel...' : 'Exportar Excel'}</span>
          </button>
          <button
            onClick={() => loadData(token, true)}
            disabled={isSyncing}
            className="btn btn-outline-secondary fw-semibold px-3 px-md-3.5 py-2 rounded-3 shadow-sm d-inline-flex align-items-center gap-2 bg-white"
          >
            <RefreshCw size={15} className={isSyncing ? 'spin-anim' : ''} />
            <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar'}</span>
          </button>
        </div>
      </div>

      {/* 2. Sección Principal: Reporte de Ventas */}
      <div className="card border-0 shadow-sm rounded-4 p-3.5 p-md-4 bg-white d-flex flex-column gap-3 gap-md-4">
        <div>
          <h2 className="h5 fw-bold text-dark mb-0">Reporte de ventas</h2>
        </div>

        {/* Bloque de Filtros de Ventas */}
        <div className="p-3 p-md-3.5 bg-light rounded-4 border">
          <div className="small fw-bold text-muted mb-2.5">Filtros de ventas</div>
          <div className="row g-2 g-md-2.5">
            <div className="col-12 col-sm-6 col-md-4 col-lg-2">
              <label className="form-label text-muted fw-semibold" style={{ fontSize: '0.75rem' }}>
                Fecha desde
              </label>
              <input
                type="date"
                className="form-control form-control-sm rounded-3 bg-white"
                value={filterFechaDesde}
                onChange={(e) => {
                  setFilterFechaDesde(e.target.value);
                  setSalesPage(1);
                  setComisionesPage(1);
                }}
              />
            </div>
            <div className="col-12 col-sm-6 col-md-4 col-lg-2">
              <label className="form-label text-muted fw-semibold" style={{ fontSize: '0.75rem' }}>
                Fecha hasta
              </label>
              <input
                type="date"
                className="form-control form-control-sm rounded-3 bg-white"
                value={filterFechaHasta}
                onChange={(e) => {
                  setFilterFechaHasta(e.target.value);
                  setSalesPage(1);
                  setComisionesPage(1);
                }}
              />
            </div>
            <div className="col-12 col-sm-6 col-md-4 col-lg-2">
              <label className="form-label text-muted fw-semibold" style={{ fontSize: '0.75rem' }}>
                Mes
              </label>
              <select
                className="form-select form-select-sm rounded-3 bg-white"
                value={filterMes}
                onChange={(e) => {
                  setFilterMes(e.target.value);
                  setSalesPage(1);
                  setComisionesPage(1);
                }}
              >
                <option value="TODOS">Todos los meses</option>
                {availableMonthOptions.map(([val, label]) => (
                  <option key={val} value={val}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-12 col-sm-6 col-md-4 col-lg-2">
              <label className="form-label text-muted fw-semibold" style={{ fontSize: '0.75rem' }}>
                Estado de pago
              </label>
              <select
                className="form-select form-select-sm rounded-3 bg-white"
                value={filterEstadoPago}
                onChange={(e) => {
                  setFilterEstadoPago(e.target.value);
                  setSalesPage(1);
                  setComisionesPage(1);
                }}
              >
                <option value="TODOS">Todos</option>
                <option value="PAGADO">Pagado</option>
                <option value="PENDIENTE">Pendiente</option>
              </select>
            </div>
            <div className="col-12 col-sm-6 col-md-4 col-lg-2">
              <label className="form-label text-muted fw-semibold" style={{ fontSize: '0.75rem' }}>
                Plan
              </label>
              <select
                className="form-select form-select-sm rounded-3 bg-white"
                value={filterPlan}
                onChange={(e) => {
                  setFilterPlan(e.target.value);
                  setSalesPage(1);
                  setComisionesPage(1);
                }}
              >
                <option value="TODOS">Todos</option>
                <option value="Inicia">Plan Inicia</option>
                <option value="Emprende">Plan Emprende</option>
                <option value="Impulsa">Plan Impulsa</option>
                <option value="Empresarial">Plan Empresarial</option>
                <option value="Lider">Plan Líder</option>
              </select>
            </div>
            <div className="col-12 col-sm-6 col-md-4 col-lg-2">
              <label className="form-label text-muted fw-semibold" style={{ fontSize: '0.75rem' }}>
                Vendedor
              </label>
              <select
                className="form-select form-select-sm rounded-3 bg-white"
                value={filterVendedor}
                onChange={(e) => {
                  setFilterVendedor(e.target.value);
                  setSalesPage(1);
                  setComisionesPage(1);
                }}
              >
                <option value="TODOS">Todos</option>
                {uniqueSellers.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            {/* Segunda fila de filtros */}
            <div className="col-12 col-sm-6 col-md-3">
              <label className="form-label text-muted fw-semibold" style={{ fontSize: '0.75rem' }}>
                Cliente / RUC
              </label>
              <input
                type="text"
                placeholder="Buscar cliente o RUC..."
                className="form-control form-control-sm rounded-3 bg-white"
                value={filterCliente}
                onChange={(e) => {
                  setFilterCliente(e.target.value);
                  setSalesPage(1);
                  setComisionesPage(1);
                }}
              />
            </div>
            <div className="col-12 col-sm-6 col-md-3">
              <label className="form-label text-muted fw-semibold" style={{ fontSize: '0.75rem' }}>
                Método de pago
              </label>
              <select
                className="form-select form-select-sm rounded-3 bg-white"
                value={filterMetodoPago}
                onChange={(e) => {
                  setFilterMetodoPago(e.target.value);
                  setSalesPage(1);
                  setComisionesPage(1);
                }}
              >
                <option value="TODOS">Todos</option>
                <option value="TRANSFERENCIA">Transferencia</option>
                <option value="YAPE">Yape</option>
                <option value="PLIN">Plin</option>
                <option value="TARJETA">Tarjeta de crédito</option>
                <option value="EFECTIVO">Efectivo</option>
                <option value="OTRO">Otro</option>
              </select>
            </div>
            <div className="col-12 col-sm-6 col-md-2">
              <label className="form-label text-muted fw-semibold" style={{ fontSize: '0.75rem' }}>
                Tipo de suscripción
              </label>
              <select
                className="form-select form-select-sm rounded-3 bg-white"
                value={filterTipoSuscripcion}
                onChange={(e) => {
                  setFilterTipoSuscripcion(e.target.value);
                  setSalesPage(1);
                  setComisionesPage(1);
                }}
              >
                <option value="TODOS">Todos</option>
                <option value="MENSUAL">Mensual</option>
                <option value="ANUAL">Anual</option>
              </select>
            </div>
            <div className="col-12 col-sm-6 col-md-2">
              <label className="form-label text-muted fw-semibold" style={{ fontSize: '0.75rem' }}>
                Régimen
              </label>
              <select
                className="form-select form-select-sm rounded-3 bg-white"
                value={filterRegimen}
                onChange={(e) => {
                  setFilterRegimen(e.target.value);
                  setSalesPage(1);
                  setComisionesPage(1);
                }}
              >
                <option value="TODOS">Todos</option>
                <option value="GENERAL">General</option>
                <option value="ESPECIAL">Especial</option>
                <option value="MYPE TRIBUTARIO">Mype Tributario</option>
                <option value="RUS">RUS</option>
              </select>
            </div>
            <div className="col-12 col-md-2 d-flex align-items-end gap-2">
              <button
                type="button"
                onClick={handleResetFilters}
                className="btn btn-outline-secondary btn-sm rounded-3 w-100 fw-semibold d-inline-flex align-items-center justify-content-center gap-1"
                title="Limpiar todos los filtros"
              >
                <RotateCcw size={13} />
                <span>Limpiar</span>
              </button>
            </div>
          </div>
        </div>

        {/* 4 KPI Metrics Cards */}
        <div className="row g-3">
          {/* Card 1: Ventas Totales */}
          <div className="col-12 col-sm-6 col-xl-3">
            <div className="p-3.5 bg-white border rounded-4 shadow-sm h-100 d-flex align-items-center gap-3">
              <div
                className="p-3 rounded-4 d-flex align-items-center justify-content-center flex-shrink-0"
                style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}
              >
                <ShoppingCart size={24} />
              </div>
              <div className="overflow-hidden">
                <div className="text-muted fw-bold" style={{ fontSize: '0.8rem' }}>
                  Ventas totales
                </div>
                <div className="h4 fw-bold mb-0 text-truncate" style={{ color: '#1d4ed8' }}>
                  {formatCurrency(kpiVentasTotales)}
                </div>
                <small className="text-muted fw-semibold">{countVentasTotales} ventas</small>
              </div>
            </div>
          </div>

          {/* Card 2: Ingresos Generados */}
          <div className="col-12 col-sm-6 col-xl-3">
            <div className="p-3.5 bg-white border rounded-4 shadow-sm h-100 d-flex align-items-center gap-3">
              <div
                className="p-3 rounded-4 d-flex align-items-center justify-content-center flex-shrink-0"
                style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}
              >
                <DollarSign size={24} />
              </div>
              <div className="overflow-hidden">
                <div className="text-muted fw-bold" style={{ fontSize: '0.8rem' }}>
                  Ingresos generados
                </div>
                <div className="h4 fw-bold mb-0 text-truncate" style={{ color: '#15803d' }}>
                  {formatCurrency(kpiIngresosGenerados)}
                </div>
                <small className="text-muted fw-semibold">Monto cobrado</small>
              </div>
            </div>
          </div>

          {/* Card 3: Pagos Pendientes */}
          <div className="col-12 col-sm-6 col-xl-3">
            <div className="p-3.5 bg-white border rounded-4 shadow-sm h-100 d-flex align-items-center gap-3">
              <div
                className="p-3 rounded-4 d-flex align-items-center justify-content-center flex-shrink-0"
                style={{ backgroundColor: '#fef2f2', color: '#dc2626' }}
              >
                <AlertCircle size={24} />
              </div>
              <div className="overflow-hidden">
                <div className="text-muted fw-bold" style={{ fontSize: '0.8rem' }}>
                  Pagos pendientes
                </div>
                <div className="h4 fw-bold mb-0 text-truncate" style={{ color: '#b91c1c' }}>
                  {formatCurrency(kpiPagosPendientes)}
                </div>
                <small className="text-muted fw-semibold">{countVentasPendientes} ventas pendientes</small>
              </div>
            </div>
          </div>

          {/* Card 4: Ticket Promedio */}
          <div className="col-12 col-sm-6 col-xl-3">
            <div className="p-3.5 bg-white border rounded-4 shadow-sm h-100 d-flex align-items-center gap-3">
              <div
                className="p-3 rounded-4 d-flex align-items-center justify-content-center flex-shrink-0"
                style={{ backgroundColor: '#faf5ff', color: '#9333ea' }}
              >
                <Receipt size={24} />
              </div>
              <div className="overflow-hidden">
                <div className="text-muted fw-bold" style={{ fontSize: '0.8rem' }}>
                  Ticket promedio
                </div>
                <div className="h4 fw-bold mb-0 text-truncate" style={{ color: '#7e22ce' }}>
                  {formatCurrency(kpiTicketPromedio)}
                </div>
                <small className="text-muted fw-semibold">Por venta</small>
              </div>
            </div>
          </div>
        </div>

        {/* Gráficos e Información Visual (2 Columnas) */}
        <div className="row g-3">
          {/* Gráfico 1: Ventas e ingresos por periodo (SVG Line Chart con curvas Bezier) */}
          <div className="col-12 col-xl-7">
            <div className="p-3.5 p-md-4 bg-white border rounded-4 shadow-sm h-100 d-flex flex-column justify-content-between">
              <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2 mb-3">
                <h6 className="fw-bold text-dark mb-0">Ventas e ingresos por periodo</h6>
                <div className="d-flex align-items-center gap-3 small fw-semibold">
                  <div className="d-flex align-items-center gap-1.5">
                    <span className="d-inline-block rounded-circle" style={{ width: 10, height: 10, backgroundColor: '#2563eb' }}></span>
                    <span className="text-muted">Ventas (S/)</span>
                  </div>
                  <div className="d-flex align-items-center gap-1.5">
                    <span className="d-inline-block rounded-circle" style={{ width: 10, height: 10, backgroundColor: '#16a34a' }}></span>
                    <span className="text-muted">Ingresos (S/)</span>
                  </div>
                </div>
              </div>

              {/* Contenedor SVG Interactivo */}
              <div className="position-relative w-100" style={{ height: 210 }}>
                <svg className="w-100 h-100" viewBox="0 0 500 200" preserveAspectRatio="none">
                  {/* Grid Lines */}
                  <line x1="0" y1="35" x2="500" y2="35" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                  <line x1="0" y1="85" x2="500" y2="85" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                  <line x1="0" y1="135" x2="500" y2="135" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                  <line x1="0" y1="180" x2="500" y2="180" stroke="#e2e8f0" strokeWidth="1" />

                  {/* Gradient Area Defs */}
                  <defs>
                    <linearGradient id="gradVentasPolished" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity="0.22" />
                      <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
                    </linearGradient>
                    <linearGradient id="gradIngresosPolished" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#16a34a" stopOpacity="0.22" />
                      <stop offset="100%" stopColor="#16a34a" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Bezier Curved Splines */}
                  {(() => {
                    const count = chartPeriodPoints.length;
                    if (count === 0) return null;
                    const step = 500 / Math.max(count - 1, 1);

                    const vPoints = chartPeriodPoints.map((p, i) => ({
                      x: i * step,
                      y: 180 - (p.ventas / maxChartVal) * 145,
                    }));

                    const iPoints = chartPeriodPoints.map((p, i) => ({
                      x: i * step,
                      y: 180 - (p.ingresos / maxChartVal) * 145,
                    }));

                    // Helper to create smooth Bezier curve string
                    const getCurvePath = (pts: Array<{ x: number; y: number }>) => {
                      if (pts.length <= 1) return pts.length === 1 ? `M ${pts[0].x} ${pts[0].y}` : '';
                      let d = `M ${pts[0].x} ${pts[0].y}`;
                      for (let i = 0; i < pts.length - 1; i++) {
                        const curr = pts[i];
                        const next = pts[i + 1];
                        const mx = (curr.x + next.x) / 2;
                        d += ` C ${mx} ${curr.y}, ${mx} ${next.y}, ${next.x} ${next.y}`;
                      }
                      return d;
                    };

                    const vPath = getCurvePath(vPoints);
                    const iPath = getCurvePath(iPoints);

                    const vArea = `${vPath} L 500 180 L 0 180 Z`;
                    const iArea = `${iPath} L 500 180 L 0 180 Z`;

                    return (
                      <>
                        <path d={vArea} fill="url(#gradVentasPolished)" />
                        <path d={iArea} fill="url(#gradIngresosPolished)" />
                        <path d={vPath} fill="none" stroke="#2563eb" strokeWidth="2.8" strokeLinecap="round" />
                        <path d={iPath} fill="none" stroke="#16a34a" strokeWidth="2.8" strokeLinecap="round" />

                        {vPoints.map((c, idx) => (
                          <circle
                            key={`vc-${idx}`}
                            cx={c.x}
                            cy={c.y}
                            r="4.5"
                            fill="#ffffff"
                            stroke="#2563eb"
                            strokeWidth="2.5"
                            style={{ cursor: 'pointer', transition: 'transform 0.15s ease' }}
                            onMouseEnter={() =>
                              setHoveredPoint({
                                day: chartPeriodPoints[idx].label,
                                ventas: chartPeriodPoints[idx].ventas,
                                ingresos: chartPeriodPoints[idx].ingresos,
                                x: c.x,
                                y: c.y,
                              })
                            }
                            onMouseLeave={() => setHoveredPoint(null)}
                          />
                        ))}

                        {iPoints.map((c, idx) => (
                          <circle
                            key={`ic-${idx}`}
                            cx={c.x}
                            cy={c.y}
                            r="4.5"
                            fill="#ffffff"
                            stroke="#16a34a"
                            strokeWidth="2.5"
                            style={{ cursor: 'pointer', transition: 'transform 0.15s ease' }}
                            onMouseEnter={() =>
                              setHoveredPoint({
                                day: chartPeriodPoints[idx].label,
                                ventas: chartPeriodPoints[idx].ventas,
                                ingresos: chartPeriodPoints[idx].ingresos,
                                x: c.x,
                                y: c.y,
                              })
                            }
                            onMouseLeave={() => setHoveredPoint(null)}
                          />
                        ))}
                      </>
                    );
                  })()}
                </svg>

                {/* Tooltip Hover Display */}
                {hoveredPoint && (
                  <div
                    className="position-absolute bg-dark text-white rounded-3 shadow-lg px-3 py-2 small pointer-events-none"
                    style={{
                      left: `clamp(20px, ${(hoveredPoint.x / 500) * 100}%, 75%)`,
                      top: '10px',
                      transform: 'translateX(-50%)',
                      fontSize: '0.78rem',
                      zIndex: 10,
                      backdropFilter: 'blur(6px)',
                      border: '1px solid rgba(255,255,255,0.15)',
                    }}
                  >
                    <div className="fw-bold border-bottom border-secondary pb-1 mb-1">{hoveredPoint.day}</div>
                    <div style={{ color: '#93c5fd' }}>Ventas: S/ {hoveredPoint.ventas.toFixed(2)}</div>
                    <div style={{ color: '#86efac' }}>Ingresos: S/ {hoveredPoint.ingresos.toFixed(2)}</div>
                  </div>
                )}
              </div>

              {/* Labels Eje X */}
              <div className="d-flex justify-content-between text-muted fw-semibold mt-2" style={{ fontSize: '0.72rem' }}>
                {chartPeriodPoints.length <= 10 ? (
                  chartPeriodPoints.map((p, i) => <span key={i}>{p.label}</span>)
                ) : (
                  <>
                    <span>{chartPeriodPoints[0]?.label}</span>
                    <span>{chartPeriodPoints[Math.floor(chartPeriodPoints.length / 4)]?.label}</span>
                    <span>{chartPeriodPoints[Math.floor(chartPeriodPoints.length / 2)]?.label}</span>
                    <span>{chartPeriodPoints[Math.floor((chartPeriodPoints.length * 3) / 4)]?.label}</span>
                    <span>{chartPeriodPoints[chartPeriodPoints.length - 1]?.label}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Gráfico 2: Ventas por Plan (Donut Chart + Tabla) */}
          <div className="col-12 col-xl-5">
            <div className="p-3.5 p-md-4 bg-white border rounded-4 shadow-sm h-100 d-flex flex-column">
              <h6 className="fw-bold text-dark mb-3">Ventas por plan</h6>

              <div className="d-flex flex-column flex-sm-row align-items-center justify-content-center gap-4 my-auto">
                {/* SVG Donut Chart */}
                <div className="position-relative flex-shrink-0" style={{ width: 145, height: 145 }}>
                  <svg className="w-100 h-100" viewBox="0 0 42 42">
                    <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#f8fafc" strokeWidth="5.5" />
                    {(() => {
                      let accumulatedPercent = 0;
                      return planBreakdown.map((item, idx) => {
                        const dashArray = `${item.percent} ${100 - item.percent}`;
                        const dashOffset = 100 - accumulatedPercent + 25;
                        accumulatedPercent += item.percent;
                        return (
                          <circle
                            key={idx}
                            cx="21"
                            cy="21"
                            r="15.915"
                            fill="transparent"
                            stroke={item.color}
                            strokeWidth="5.5"
                            strokeDasharray={dashArray}
                            strokeDashoffset={dashOffset}
                            style={{ transition: 'all 0.3s ease' }}
                          />
                        );
                      });
                    })()}
                  </svg>
                  <div className="position-absolute top-50 start-50 translate-middle text-center">
                    <span className="small text-muted fw-bold d-block" style={{ fontSize: '0.65rem' }}>
                      TOTAL
                    </span>
                    <span className="fw-bold text-dark fs-6">
                      {countVentasTotales}
                    </span>
                  </div>
                </div>

                {/* Plan Breakdown List */}
                <div className="w-100">
                  <table className="table table-sm table-borderless align-middle mb-0" style={{ fontSize: '0.8rem' }}>
                    <tbody>
                      {planBreakdown.map((p, idx) => (
                        <tr key={idx} className="border-bottom border-light">
                          <td className="py-1 px-0">
                            <div className="d-flex align-items-center gap-2">
                              <span className="d-inline-block rounded-circle" style={{ width: 8, height: 8, backgroundColor: p.color }}></span>
                              <span className="fw-semibold text-dark">{p.plan.replace('Plan ', '')}</span>
                            </div>
                          </td>
                          <td className="py-1 text-end text-muted fw-semibold">{p.percent.toFixed(1)}%</td>
                          <td className="py-1 text-end fw-bold text-dark">{formatCurrency(p.monto)}</td>
                        </tr>
                      ))}
                      <tr className="fw-bold text-dark border-top">
                        <td className="py-1 px-0">Total</td>
                        <td className="py-1 text-end text-primary">100%</td>
                        <td className="py-1 text-end text-primary">{formatCurrency(kpiVentasTotales)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detalle de Ventas (Tabla) */}
        <div className="border rounded-4 overflow-hidden shadow-sm">
          <div className="bg-light p-3 border-bottom d-flex justify-content-between align-items-center">
            <h6 className="fw-bold text-dark mb-0">Detalle de ventas</h6>
            <small className="text-muted fw-semibold">{filteredSales.length} ventas en base de datos</small>
          </div>
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.85rem' }}>
              <thead className="bg-light text-muted fw-bold">
                <tr>
                  <th className="ps-3 py-2.5">Fecha</th>
                  <th className="py-2.5">Cliente</th>
                  <th className="py-2.5">RUC</th>
                  <th className="py-2.5">Plan</th>
                  <th className="py-2.5">Vendedor</th>
                  <th className="py-2.5 text-end">Monto</th>
                  <th className="py-2.5">Método de pago</th>
                  <th className="pe-3 py-2.5 text-center">Estado</th>
                </tr>
              </thead>
              <tbody>
                {paginatedSales.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-4 text-muted">
                      No se encontraron registros de ventas con los filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  paginatedSales.map((sale) => (
                    <tr key={sale.id}>
                      <td className="ps-3 py-2.5 text-muted fw-semibold">{formatTableDate(sale.fecha)}</td>
                      <td className="py-2.5 fw-bold text-dark">{sale.clienteNombre}</td>
                      <td className="py-2.5 text-muted">{sale.ruc}</td>
                      <td className="py-2.5">
                        <span className="badge bg-light text-dark border px-2 py-1">{sale.planNombre}</span>
                      </td>
                      <td className="py-2.5 text-muted fw-semibold">{sale.vendedor}</td>
                      <td className="py-2.5 text-end fw-bold text-dark">{formatCurrency(sale.monto)}</td>
                      <td className="py-2.5 text-muted">{sale.metodoPago}</td>
                      <td className="pe-3 py-2.5 text-center">
                        {sale.estado === 'PAGADO' ? (
                          <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2.5 py-1">
                            Pagado
                          </span>
                        ) : sale.estado === 'CANCELADA' ? (
                          <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 px-2.5 py-1">
                            Cancelada
                          </span>
                        ) : (
                          <span className="badge bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25 px-2.5 py-1">
                            Pendiente
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación de Ventas */}
          {totalSalesPages > 1 && (
            <div className="p-3 bg-light border-top d-flex justify-content-between align-items-center">
              <small className="text-muted fw-semibold">
                Página {salesPage} de {totalSalesPages}
              </small>
              <div className="d-flex gap-1">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary px-2.5 py-1 rounded-2"
                  disabled={salesPage <= 1}
                  onClick={() => setSalesPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary px-2.5 py-1 rounded-2"
                  disabled={salesPage >= totalSalesPages}
                  onClick={() => setSalesPage((p) => Math.min(totalSalesPages, p + 1))}
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Sección: Mis Comisiones por Venta de Sistema (Validado por Afiliación / ALTA = S/ 9.00) */}
      <div className="card border-0 shadow-sm rounded-4 p-3.5 p-md-4 bg-white d-flex flex-column gap-3 gap-md-4">
        <div>
          <h2 className="h5 fw-bold text-dark mb-1">Mis comisiones por venta de sistema</h2>
          <p className="text-muted small mb-0">Comisiones generadas por afiliación de nuevos sistemas (S/ 9.00 por ALTA)</p>
        </div>

        {/* 4 KPI Metrics Cards de Comisiones */}
        <div className="row g-3">
          {/* Card 1: Comisión Acumulada */}
          <div className="col-12 col-sm-6 col-xl-3">
            <div className="p-3.5 bg-white border rounded-4 shadow-sm h-100 d-flex align-items-center gap-3">
              <div
                className="p-3 rounded-4 d-flex align-items-center justify-content-center flex-shrink-0"
                style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}
              >
                <Coins size={24} />
              </div>
              <div className="overflow-hidden">
                <div className="text-muted fw-bold" style={{ fontSize: '0.8rem' }}>
                  Comisión acumulada
                </div>
                <div className="h4 fw-bold mb-0 text-truncate" style={{ color: '#1d4ed8' }}>
                  {formatCurrency(totalComisionAcumulada)}
                </div>
                <small className="text-muted fw-semibold">S/ 9.00 por cada alta pagada</small>
              </div>
            </div>
          </div>

          {/* Card 2: Ventas Realizadas (Altas) */}
          <div className="col-12 col-sm-6 col-xl-3">
            <div className="p-3.5 bg-white border rounded-4 shadow-sm h-100 d-flex align-items-center gap-3">
              <div
                className="p-3 rounded-4 d-flex align-items-center justify-content-center flex-shrink-0"
                style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}
              >
                <TrendingUp size={24} />
              </div>
              <div className="overflow-hidden">
                <div className="text-muted fw-bold" style={{ fontSize: '0.8rem' }}>
                  Ventas realizadas
                </div>
                <div className="h4 fw-bold mb-0 text-success text-truncate">{countAltasRealizadas}</div>
                <small className="text-muted fw-semibold">Sistemas afiliados (ALTAS)</small>
              </div>
            </div>
          </div>

          {/* Card 3: Tasa de Comisión */}
          <div className="col-12 col-sm-6 col-xl-3">
            <div className="p-3.5 bg-white border rounded-4 shadow-sm h-100 d-flex align-items-center gap-3">
              <div
                className="p-3 rounded-4 d-flex align-items-center justify-content-center flex-shrink-0"
                style={{ backgroundColor: '#faf5ff', color: '#9333ea' }}
              >
                <Percent size={24} />
              </div>
              <div className="overflow-hidden">
                <div className="text-muted fw-bold" style={{ fontSize: '0.8rem' }}>
                  Tasa de comisión
                </div>
                <div className="h4 fw-bold mb-0 text-truncate" style={{ color: '#7e22ce' }}>
                  S/ 9.00
                </div>
                <small className="text-muted fw-semibold">Por cada alta registrada</small>
              </div>
            </div>
          </div>

          {/* Card 4: Pendiente de Pago */}
          <div className="col-12 col-sm-6 col-xl-3">
            <div className="p-3.5 bg-white border rounded-4 shadow-sm h-100 d-flex align-items-center gap-3">
              <div
                className="p-3 rounded-4 d-flex align-items-center justify-content-center flex-shrink-0"
                style={{ backgroundColor: '#fef3c7', color: '#d97706' }}
              >
                <Clock size={24} />
              </div>
              <div className="overflow-hidden">
                <div className="text-muted fw-bold" style={{ fontSize: '0.8rem' }}>
                  Pendiente de pago
                </div>
                <div className="h4 fw-bold mb-0 text-truncate" style={{ color: '#d97706' }}>
                  {formatCurrency(totalComisionPendiente)}
                </div>
                <small className="text-muted fw-semibold">{countAltasPendientes} altas pendientes</small>
              </div>
            </div>
          </div>
        </div>

        {/* Gráfico de Comisiones por Mes + Detalle de Comisiones (2 Columnas) */}
        <div className="row g-3">
          {/* Gráfico: Comisiones por Mes (Bar Chart Estilizado) */}
          <div className="col-12 col-xl-5">
            <div className="p-3.5 p-md-4 bg-white border rounded-4 shadow-sm h-100 d-flex flex-column justify-content-between">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-bold text-dark mb-0">Comisiones por mes</h6>
                <span className="badge bg-primary px-2.5 py-1 text-white" style={{ backgroundColor: '#2563eb' }}>
                  Comisión (S/)
                </span>
              </div>

              {/* Bar Chart Container */}
              <div className="w-100 my-auto" style={{ height: 190 }}>
                <svg className="w-100 h-100" viewBox="0 0 360 180">
                  {monthlyCommissionsData.map((m, idx) => {
                    const barWidth = 16;
                    const gap = 360 / 12;
                    const x = idx * gap + (gap - barWidth) / 2;
                    const barHeight = maxCommissionVal > 0 ? (m.comision / maxCommissionVal) * 115 : 0;
                    const y = 145 - barHeight;

                    return (
                      <g key={idx}>
                        <rect
                          x={x}
                          y={y}
                          width={barWidth}
                          height={barHeight}
                          fill="#3b82f6"
                          rx="4"
                          style={{ transition: 'all 0.2s ease' }}
                        />
                        {m.comision > 0 && (
                          <text x={x + barWidth / 2} y={y - 5} textAnchor="middle" fontSize="8.5" fill="#1d4ed8" fontWeight="bold">
                            {m.comision}
                          </text>
                        )}
                        <text x={x + barWidth / 2} y={165} textAnchor="middle" fontSize="9" fill="#64748b" fontWeight="600">
                          {m.month}
                        </text>
                      </g>
                    );
                  })}
                  <line x1="0" y1="145" x2="360" y2="145" stroke="#e2e8f0" strokeWidth="1" />
                </svg>
              </div>
            </div>
          </div>

          {/* Tabla: Detalle de Comisiones */}
          <div className="col-12 col-xl-7">
            <div className="border rounded-4 overflow-hidden shadow-sm h-100 d-flex flex-column">
              <div className="bg-light p-3 border-bottom d-flex justify-content-between align-items-center">
                <h6 className="fw-bold text-dark mb-0">Detalle de comisiones</h6>
                <small className="text-muted fw-semibold">{affiliationRecords.length} altas en base de datos</small>
              </div>
              <div className="table-responsive flex-grow-1">
                <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.85rem' }}>
                  <thead className="bg-light text-muted fw-bold">
                    <tr>
                      <th className="ps-3 py-2.5">Fecha</th>
                      <th className="py-2.5">Cliente</th>
                      <th className="py-2.5">Plan</th>
                      <th className="py-2.5 text-end">Monto venta</th>
                      <th className="py-2.5 text-center">% Comisión</th>
                      <th className="py-2.5 text-end">Comisión</th>
                      <th className="pe-3 py-2.5 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedComisiones.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-4 text-muted">
                          No hay registros de afiliaciones / altas para mostrar.
                        </td>
                      </tr>
                    ) : (
                      paginatedComisiones.map((c) => (
                        <tr key={c.id}>
                          <td className="ps-3 py-2 text-muted fw-semibold">{c.fechaDate.toLocaleDateString('es-PE')}</td>
                          <td className="py-2 fw-bold text-dark">{c.clienteNombre}</td>
                          <td className="py-2">
                            <span className="badge bg-light text-dark border">{c.planNombre}</span>
                          </td>
                          <td className="py-2 text-end fw-semibold text-dark">{formatCurrency(c.monto)}</td>
                          <td className="py-2 text-center text-muted fw-semibold">S/ 9.00</td>
                          <td className="py-2 text-end fw-bold" style={{ color: '#1d4ed8' }}>
                            S/ 9.00
                          </td>
                          <td className="pe-3 py-2 text-center">
                            {c.estado === 'PAGADO' ? (
                              <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-2.5 py-0.5">
                                Generada
                              </span>
                            ) : (
                              <span className="badge bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25 px-2.5 py-0.5">
                                Pendiente
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Paginación de Comisiones */}
              {totalComisionesPages > 1 && (
                <div className="p-2.5 bg-light border-top d-flex justify-content-between align-items-center">
                  <small className="text-muted fw-semibold">
                    Página {comisionesPage} de {totalComisionesPages}
                  </small>
                  <div className="d-flex gap-1">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary px-2 py-0.5 rounded-2"
                      disabled={comisionesPage <= 1}
                      onClick={() => setComisionesPage((p) => Math.max(1, p - 1))}
                    >
                      <ChevronLeft size={13} />
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary px-2 py-0.5 rounded-2"
                      disabled={comisionesPage >= totalComisionesPages}
                      onClick={() => setComisionesPage((p) => Math.min(totalComisionesPages, p + 1))}
                    >
                      <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
