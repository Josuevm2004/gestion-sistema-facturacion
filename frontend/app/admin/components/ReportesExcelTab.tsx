'use client';

import React, { useMemo, useState } from 'react';
import {
  FileSpreadsheet,
  RefreshCw,
  Calendar,
  Search,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Users,
  DollarSign,
  TrendingDown,
  CreditCard,
  Phone,
  UserCheck,
  Building,
  ArrowUpDown,
  Download,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Client } from './ClientesTodosTab';

interface ReportesExcelTabProps {
  clients?: Client[];
  payments?: any[];
  sellerMetrics?: any[];
  handleExportExcel?: () => void;
  loadData?: (token?: string | null, showNotice?: boolean) => void;
  isSyncing?: boolean;
  token?: string | null;
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
  periodoIngresoTipo?: string;
  setPeriodoIngresoTipo?: (v: any) => void;
  fechaCustomFilter?: string;
  setFechaCustomFilter?: (v: string) => void;
  filterClientUnified?: (c: Client) => boolean;
  setEditingClient?: (client: Client) => void;
  setHistoryClient?: (client: Client | null) => void;
  COLOR_MAP?: any;
}

const MESES = [
  { value: 'ALL', label: 'Todo el Año (Acumulado)' },
  { value: '01', label: 'Enero' },
  { value: '02', label: 'Febrero' },
  { value: '03', label: 'Marzo' },
  { value: '04', label: 'Abril' },
  { value: '05', label: 'Mayo' },
  { value: '06', label: 'Junio' },
  { value: '07', label: 'Julio' },
  { value: '08', label: 'Agosto' },
  { value: '09', label: 'Septiembre' },
  { value: '10', label: 'Octubre' },
  { value: '11', label: 'Noviembre' },
  { value: '12', label: 'Diciembre' },
];

export default function ReportesExcelTab({
  clients = [],
  payments = [],
  loadData = () => {},
  isSyncing = false,
  uniqueSellers = [],
}: ReportesExcelTabProps) {
  const currentYear = new Date().getFullYear();
  const currentMonthNum = String(new Date().getMonth() + 1).padStart(2, '0');

  // Estados de Filtros Principales
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL'); // 'ALL' o '01'..'12'
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterVendedor, setFilterVendedor] = useState<string>('ALL');
  const [filterTipoSuscripcion, setFilterTipoSuscripcion] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'PAGOS' | 'IMPAGOS' | 'EVOLUCION'>('PAGOS');

  // Paginación de tablas
  const [pagePagos, setPagePagos] = useState<number>(1);
  const [pageImpagos, setPageImpagos] = useState<number>(1);
  const ITEMS_PER_PAGE = 20;

  const [isExportingExcel, setIsExportingExcel] = useState<boolean>(false);

  const safeClients = useMemo(() => (Array.isArray(clients) ? clients : []), [clients]);
  const safePayments = useMemo(() => (Array.isArray(payments) ? payments : []), [payments]);

  // Mapa de Clientes por ID y RUC para enriquecer pagos
  const clientMap = useMemo(() => {
    const map = new Map<string, Client>();
    safeClients.forEach((c) => {
      if (c.id) map.set(String(c.id), c);
      if (c.ruc) map.set(`ruc-${c.ruc}`, c);
    });
    return map;
  }, [safeClients]);

  // Helper de parseo de fechas robusto
  const parseDateSafe = (val: any): Date | null => {
    if (!val) return null;
    if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
    const str = String(val).trim().split('T')[0].split(' ')[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      const [y, m, d] = str.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  };

  // 1. PROCESAR HISTORIAL DE PAGOS CON METADATOS LIMPIOS
  const allParsedPayments = useMemo(() => {
    const list: Array<{
      id: string;
      ruc: string;
      razonSocial: string;
      nombreComercial: string;
      asesor: string;
      planNombre: string;
      tipoSuscripcion: string;
      monto: number;
      fechaPagoDate: Date | null;
      fechaPagoStr: string;
      year: number;
      monthStr: string;
      periodoStr: string;
      medioPago: string;
      codigoOperacion: string;
      tipoOperacion: string;
    }> = [];

    const seenIds = new Set<string>();

    safePayments.forEach((p, idx) => {
      const pId = String(p?.id ?? p?.pagoId ?? `p-${idx}`);
      if (seenIds.has(pId)) return;
      seenIds.add(pId);

      const rawCId = p?.venta?.cliente?.id ?? p?.clienteId ?? p?.venta?.clienteId;
      const rawRuc = p?.clienteRuc || p?.venta?.cliente?.ruc;
      const matchedClient = (rawCId && clientMap.get(String(rawCId))) || (rawRuc && clientMap.get(`ruc-${rawRuc}`)) || null;

      const fPago = parseDateSafe(p?.fechaPago || p?.fechaRegistro || p?.periodoInicio);
      const fInicio = parseDateSafe(p?.periodoInicio);
      const fFin = parseDateSafe(p?.periodoFin);

      const year = fPago ? fPago.getFullYear() : currentYear;
      const monthStr = fPago ? String(fPago.getMonth() + 1).padStart(2, '0') : currentMonthNum;

      let periodoStr = '—';
      if (fInicio && fFin) {
        periodoStr = `${fInicio.toLocaleDateString('es-PE')} al ${fFin.toLocaleDateString('es-PE')}`;
      } else if (fInicio) {
        periodoStr = `Desde ${fInicio.toLocaleDateString('es-PE')}`;
      }

      const tipoSub = (p?.tipoSuscripcion || p?.venta?.suscripcion?.tipoSuscripcion || matchedClient?.tipoSuscripcion || 'MENSUAL').toUpperCase();
      const obs = String(p?.observaciones || '').toLowerCase();
      let tipoOperacion = 'Renovación';
      if (obs.includes('alta') || p?.tipoVenta === 'ALTA') tipoOperacion = 'Alta / Afiliación';
      else if (obs.includes('prorrat') || p?.tipoProrrateo === 'SEGUNDO_PRORRATEO') tipoOperacion = 'Prorrateo';
      else if (obs.includes('adelant')) tipoOperacion = 'Adelanto';

      list.push({
        id: pId,
        ruc: rawRuc || matchedClient?.ruc || '—',
        razonSocial: p?.clienteRazonSocial || matchedClient?.razonSocial || matchedClient?.nombreComercial || 'Cliente General',
        nombreComercial: matchedClient?.nombreComercial || '',
        asesor: p?.vendedorNombre || p?.venta?.vendedor?.nombre || matchedClient?.vendedor || 'Por asignar',
        planNombre: p?.planNombre || p?.venta?.suscripcion?.plan?.nombrePlan || matchedClient?.planContratado || 'Plan Estándar',
        tipoSuscripcion: tipoSub,
        monto: Number(p?.monto || 0),
        fechaPagoDate: fPago,
        fechaPagoStr: fPago ? fPago.toLocaleDateString('es-PE') : '—',
        year,
        monthStr,
        periodoStr,
        medioPago: p?.medioPago || 'TRANSFERENCIA',
        codigoOperacion: p?.codigoOperacion || '—',
        tipoOperacion,
      });
    });

    list.sort((a, b) => {
      const tA = a.fechaPagoDate ? a.fechaPagoDate.getTime() : 0;
      const tB = b.fechaPagoDate ? b.fechaPagoDate.getTime() : 0;
      return tB - tA;
    });

    return list;
  }, [safePayments, clientMap, currentYear, currentMonthNum]);

  // Lista de años disponibles para el selector
  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>();
    yearsSet.add(currentYear);
    yearsSet.add(currentYear - 1);
    allParsedPayments.forEach((p) => {
      if (p.year) yearsSet.add(p.year);
    });
    safeClients.forEach((c) => {
      const f = parseDateSafe(c.fechaRegistro || c.fechaCreacion);
      if (f) yearsSet.add(f.getFullYear());
    });
    return Array.from(yearsSet).sort().reverse();
  }, [allParsedPayments, safeClients, currentYear]);

  // Pagos filtrados por Año y Mes
  const paymentsByPeriod = useMemo(() => {
    return allParsedPayments.filter((p) => {
      if (p.year !== selectedYear) return false;
      if (selectedMonth !== 'ALL' && p.monthStr !== selectedMonth) return false;
      return true;
    });
  }, [allParsedPayments, selectedYear, selectedMonth]);

  // Métricas del período seleccionado
  const metrics = useMemo(() => {
    const totalCobrado = paymentsByPeriod.reduce((acc, p) => acc + p.monto, 0);
    const countPagos = paymentsByPeriod.length;

    const pagosMensuales = paymentsByPeriod.filter((p) => p.tipoSuscripcion === 'MENSUAL');
    const pagosAnuales = paymentsByPeriod.filter((p) => p.tipoSuscripcion === 'ANUAL');
    const cobradoMensual = pagosMensuales.reduce((acc, p) => acc + p.monto, 0);
    const cobradoAnual = pagosAnuales.reduce((acc, p) => acc + p.monto, 0);

    // Clientes activos en la cartera
    const activosHabilitados = safeClients.filter((c) => {
      const st = (c.estadoCuenta || '').toUpperCase();
      return st !== 'BLOQUEADO' && st !== 'SUSPENDIDO';
    });

    return {
      totalCobrado,
      countPagos,
      cobradoMensual,
      countMensuales: pagosMensuales.length,
      cobradoAnual,
      countAnuales: pagosAnuales.length,
      totalClientesActivos: activosHabilitados.length,
      clientesMensualesActivos: activosHabilitados.filter((c) => (c.tipoSuscripcion || '').toUpperCase() !== 'ANUAL').length,
      clientesAnualesActivos: activosHabilitados.filter((c) => (c.tipoSuscripcion || '').toUpperCase() === 'ANUAL').length,
    };
  }, [paymentsByPeriod, safeClients]);

  // Cartera con Deuda / Impagos (Vencidos y Bloqueados)
  const lossDebtAnalysis = useMemo(() => {
    let totalDeuda = 0;
    let deudaBloqueados = 0;
    let deudaVencidos = 0;
    let countBloqueados = 0;
    let countVencidos = 0;

    const list: Array<{
      id: string;
      ruc: string;
      razonSocial: string;
      telefono: string;
      plan: string;
      tipoSuscripcion: string;
      estadoCuenta: 'BLOQUEADO' | 'VENCIDO';
      montoDeuda: number;
      fechaVencimiento: string;
      asesor: string;
    }> = [];

    safeClients.forEach((c) => {
      const st = (c.estadoCuenta || '').toUpperCase();
      if (st !== 'BLOQUEADO' && st !== 'SUSPENDIDO' && st !== 'VENCIDO') return;

      const deuda = c.montoSiguienteCobro && Number(c.montoSiguienteCobro) > 0
        ? Number(c.montoSiguienteCobro)
        : Number(c.montoMensual || c.precioPlan || 29);

      const isBloq = st === 'BLOQUEADO' || st === 'SUSPENDIDO';
      if (isBloq) {
        deudaBloqueados += deuda;
        countBloqueados++;
      } else {
        deudaVencidos += deuda;
        countVencidos++;
      }
      totalDeuda += deuda;

      const fVenc = parseDateSafe(c.fechaVencimientoMensual);

      list.push({
        id: String(c.id || c.ruc),
        ruc: c.ruc || '—',
        razonSocial: c.razonSocial || c.nombreComercial || `Cliente ${c.ruc || ''}`,
        telefono: c.telefono || c.telefonoPersonal || '—',
        plan: c.planContratado || 'Plan Estándar',
        tipoSuscripcion: c.tipoSuscripcion || 'MENSUAL',
        estadoCuenta: isBloq ? 'BLOQUEADO' : 'VENCIDO',
        montoDeuda: deuda,
        fechaVencimiento: fVenc ? fVenc.toLocaleDateString('es-PE') : '—',
        asesor: c.vendedor || 'Por asignar',
      });
    });

    list.sort((a, b) => b.montoDeuda - a.montoDeuda);

    return {
      totalDeuda,
      deudaBloqueados,
      deudaVencidos,
      countTotal: countBloqueados + countVencidos,
      countBloqueados,
      countVencidos,
      list,
    };
  }, [safeClients]);

  // Evolución mensual comparativa (de Enero a Diciembre del año seleccionado)
  const monthlyEvolution = useMemo(() => {
    return MESES.filter((m) => m.value !== 'ALL').map((m) => {
      const pagosDelMes = allParsedPayments.filter(
        (p) => p.year === selectedYear && p.monthStr === m.value
      );
      const totalMes = pagosDelMes.reduce((acc, p) => acc + p.monto, 0);
      const count = pagosDelMes.length;
      const clientesUnicos = new Set(pagosDelMes.map((p) => p.ruc)).size;
      return {
        monthCode: m.value,
        monthName: m.label,
        totalRecaudado: totalMes,
        cantidadOperaciones: count,
        clientesAtendidos: clientesUnicos,
        promedioTicket: count > 0 ? totalMes / count : 0,
      };
    });
  }, [allParsedPayments, selectedYear]);

  // Filtro de la tabla de pagos
  const filteredPagosTable = useMemo(() => {
    return paymentsByPeriod.filter((p) => {
      if (filterVendedor !== 'ALL' && p.asesor !== filterVendedor) return false;
      if (filterTipoSuscripcion !== 'ALL' && p.tipoSuscripcion !== filterTipoSuscripcion) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match =
          p.ruc.toLowerCase().includes(q) ||
          p.razonSocial.toLowerCase().includes(q) ||
          p.planNombre.toLowerCase().includes(q) ||
          p.codigoOperacion.toLowerCase().includes(q) ||
          p.asesor.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [paymentsByPeriod, filterVendedor, filterTipoSuscripcion, searchQuery]);

  // Filtro de la tabla de deudas
  const filteredImpagosTable = useMemo(() => {
    return lossDebtAnalysis.list.filter((item) => {
      if (filterVendedor !== 'ALL' && item.asesor !== filterVendedor) return false;
      if (filterTipoSuscripcion !== 'ALL' && item.tipoSuscripcion !== filterTipoSuscripcion) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match =
          item.ruc.toLowerCase().includes(q) ||
          item.razonSocial.toLowerCase().includes(q) ||
          item.plan.toLowerCase().includes(q) ||
          item.asesor.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [lossDebtAnalysis.list, filterVendedor, filterTipoSuscripcion, searchQuery]);

  // Paginación
  const totalPagesPagos = Math.max(1, Math.ceil(filteredPagosTable.length / ITEMS_PER_PAGE));
  const paginatedPagos = useMemo(() => {
    const start = (pagePagos - 1) * ITEMS_PER_PAGE;
    return filteredPagosTable.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredPagosTable, pagePagos]);

  const totalPagesImpagos = Math.max(1, Math.ceil(filteredImpagosTable.length / ITEMS_PER_PAGE));
  const paginatedImpagos = useMemo(() => {
    const start = (pageImpagos - 1) * ITEMS_PER_PAGE;
    return filteredImpagosTable.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredImpagosTable, pageImpagos]);

  // Exportar a Excel (Intenta Python primero; si falla, genera descarga local limpia en CSV/Excel)
  const handleExport = async () => {
    setIsExportingExcel(true);
    try {
      const res = await fetch('/api/admin/reporte-excel-oficial');
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Reporte_Facturacion_${selectedYear}_${selectedMonth}_${new Date().toISOString().slice(0, 10)}.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        return;
      }
    } catch (e) {
      console.warn('Fallback a exportación web local:', e);
    }

    // Exportación local de respaldo
    try {
      let csv = '\uFEFF';
      csv += 'RUC,Cliente / Razon Social,Plan,Suscripcion,Monto Pagado,Fecha Pago,Periodo,Medio Pago,Operacion,Asesor\n';
      filteredPagosTable.forEach((p) => {
        csv += `"${p.ruc}","${p.razonSocial.replace(/"/g, '""')}","${p.planNombre}","${p.tipoSuscripcion}",${p.monto.toFixed(2)},"${p.fechaPagoStr}","${p.periodoStr}","${p.medioPago}","${p.codigoOperacion}","${p.asesor}"\n`;
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Reporte_Facturacion_${selectedYear}_${selectedMonth}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } finally {
      setIsExportingExcel(false);
    }
  };

  // Etiqueta del período actual seleccionado
  const currentPeriodLabel = useMemo(() => {
    const monthObj = MESES.find((m) => m.value === selectedMonth);
    const mLabel = monthObj ? monthObj.label : 'Período';
    return selectedMonth === 'ALL' ? `Año ${selectedYear} (Consolidado)` : `${mLabel} ${selectedYear}`;
  }, [selectedYear, selectedMonth]);

  return (
    <div className="admin-module admin-module--reportes p-2">
      {/* 1. BARRA SUPERIOR: ENCABEZADO Y SELECTOR DE PERÍODO */}
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4 pb-3 border-bottom">
        <div>
          <h4 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
            <FileSpreadsheet className="text-primary" size={24} />
            <span>Reporte General de Facturación y Cobranzas</span>
          </h4>
          <p className="text-muted small mb-0">
            Auditoría de ingresos por mes, estado de la cartera activa y seguimiento de cuentas en deuda.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2 flex-wrap">
          {/* Selector de Año */}
          <div className="d-flex align-items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-3 border shadow-xs">
            <span className="small fw-semibold text-muted">Año:</span>
            <select
              className="form-select form-select-sm border-0 fw-bold text-dark shadow-none ps-1 pe-4"
              style={{ fontSize: '0.88rem', cursor: 'pointer' }}
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(Number(e.target.value));
                setPagePagos(1);
              }}
            >
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>

          {/* Selector de Mes Completo */}
          <div className="d-flex align-items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-3 border shadow-xs">
            <Calendar size={15} className="text-primary" />
            <span className="small fw-semibold text-muted">Mes:</span>
            <select
              className="form-select form-select-sm border-0 fw-bold text-primary shadow-none ps-1 pe-4"
              style={{ fontSize: '0.88rem', cursor: 'pointer' }}
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                setPagePagos(1);
              }}
            >
              {MESES.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* Actualizar Datos */}
          <button
            onClick={() => loadData(null, true)}
            disabled={isSyncing}
            className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1.5 px-3 py-1.5 rounded-3 shadow-xs"
            title="Recargar datos del servidor"
          >
            <RefreshCw size={14} className={isSyncing ? 'spin-anim' : ''} />
            <span>{isSyncing ? 'Actualizando...' : 'Actualizar'}</span>
          </button>

          {/* Exportar Excel */}
          <button
            onClick={handleExport}
            disabled={isExportingExcel}
            className="btn btn-success btn-sm d-flex align-items-center gap-1.5 px-3 py-1.5 rounded-3 shadow-xs fw-semibold"
            title="Descargar reporte oficial en formato Excel"
          >
            <Download size={14} />
            <span>{isExportingExcel ? 'Generando...' : 'Exportar Excel'}</span>
          </button>
        </div>
      </div>

      {/* 2. TARJETAS DE INDICADORES CLAVE DEL PERÍODO */}
      <div className="row g-3 mb-4">
        {/* Card 1: Total Recaudado en el Período */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card h-100 shadow-sm border-0 p-3 bg-white" style={{ borderRadius: '12px', borderLeft: '4px solid #2563EB' }}>
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="text-muted small fw-semibold">Recaudado ({currentPeriodLabel})</span>
              <span className="p-1.5 rounded-3 bg-primary-subtle text-primary">
                <DollarSign size={16} />
              </span>
            </div>
            <div className="fw-bold text-dark fs-4 mb-2">
              S/ {metrics.totalCobrado.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-muted small pt-2 border-top d-flex justify-content-between align-items-center" style={{ fontSize: '0.78rem' }}>
              <span>{metrics.countPagos} pagos registrados</span>
              <span className="text-primary fw-semibold">
                Mensual: S/ {metrics.cobradoMensual.toFixed(0)} | Anual: S/ {metrics.cobradoAnual.toFixed(0)}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Clientes Activos */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card h-100 shadow-sm border-0 p-3 bg-white" style={{ borderRadius: '12px', borderLeft: '4px solid #16A34A' }}>
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="text-muted small fw-semibold">Clientes Activos</span>
              <span className="p-1.5 rounded-3 bg-success-subtle text-success">
                <Users size={16} />
              </span>
            </div>
            <div className="fw-bold text-dark fs-4 mb-2">
              {metrics.totalClientesActivos} <span className="fs-6 text-muted fw-normal">cuentas al día</span>
            </div>
            <div className="text-muted small pt-2 border-top d-flex justify-content-between align-items-center" style={{ fontSize: '0.78rem' }}>
              <span>{metrics.clientesMensualesActivos} mensuales</span>
              <span>·</span>
              <span>{metrics.clientesAnualesActivos} anuales</span>
            </div>
          </div>
        </div>

        {/* Card 3: Deuda Pendiente por Cobrar */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card h-100 shadow-sm border-0 p-3 bg-white" style={{ borderRadius: '12px', borderLeft: '4px solid #DC2626' }}>
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="text-muted small fw-semibold">Deuda en Cartera</span>
              <span className="p-1.5 rounded-3 bg-danger-subtle text-danger">
                <TrendingDown size={16} />
              </span>
            </div>
            <div className="fw-bold text-danger fs-4 mb-2">
              S/ {lossDebtAnalysis.totalDeuda.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-muted small pt-2 border-top d-flex justify-content-between align-items-center" style={{ fontSize: '0.78rem' }}>
              <span>{lossDebtAnalysis.countBloqueados} bloqueados</span>
              <span>·</span>
              <span>{lossDebtAnalysis.countVencidos} vencidos</span>
            </div>
          </div>
        </div>

        {/* Card 4: Promedio por Operación */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card h-100 shadow-sm border-0 p-3 bg-white" style={{ borderRadius: '12px', borderLeft: '4px solid #4F46E5' }}>
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="text-muted small fw-semibold">Ticket Promedio</span>
              <span className="p-1.5 rounded-3 bg-indigo-subtle text-indigo" style={{ backgroundColor: '#EEF2FF', color: '#4F46E5' }}>
                <CreditCard size={16} />
              </span>
            </div>
            <div className="fw-bold text-dark fs-4 mb-2">
              S/ {metrics.countPagos > 0 ? (metrics.totalCobrado / metrics.countPagos).toFixed(2) : '0.00'}
            </div>
            <div className="text-muted small pt-2 border-top d-flex justify-content-between align-items-center" style={{ fontSize: '0.78rem' }}>
              <span>Base en transacciones confirmadas</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. PESTAÑAS DE VISTA: PAGOS DEL MES / DEUDAS / EVOLUCIÓN MENSUAL */}
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
        <ul className="nav nav-pills bg-light p-1 rounded-3 border" style={{ fontSize: '0.86rem' }}>
          <li className="nav-item">
            <button
              className={`nav-link py-1.5 px-3 rounded-2 fw-semibold ${activeTab === 'PAGOS' ? 'active shadow-sm' : 'text-muted'}`}
              onClick={() => setActiveTab('PAGOS')}
            >
              1. Pagos Recibidos ({filteredPagosTable.length})
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link py-1.5 px-3 rounded-2 fw-semibold ${activeTab === 'IMPAGOS' ? 'active shadow-sm' : 'text-muted'}`}
              onClick={() => setActiveTab('IMPAGOS')}
            >
              2. Cartera con Deuda ({filteredImpagosTable.length})
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link py-1.5 px-3 rounded-2 fw-semibold ${activeTab === 'EVOLUCION' ? 'active shadow-sm' : 'text-muted'}`}
              onClick={() => setActiveTab('EVOLUCION')}
            >
              3. Resumen Mes a Mes ({selectedYear})
            </button>
          </li>
        </ul>

        {/* Buscador y Filtros Rápidos (Para Pagos e Impagos) */}
        {activeTab !== 'EVOLUCION' && (
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <div className="input-group input-group-sm" style={{ width: '220px' }}>
              <span className="input-group-text bg-white border-end-0">
                <Search size={13} className="text-muted" />
              </span>
              <input
                type="text"
                className="form-control bg-white border-start-0"
                placeholder="Buscar cliente, RUC..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPagePagos(1);
                  setPageImpagos(1);
                }}
              />
            </div>

            <select
              className="form-select form-select-sm"
              style={{ width: '160px', fontSize: '0.82rem' }}
              value={filterVendedor}
              onChange={(e) => {
                setFilterVendedor(e.target.value);
                setPagePagos(1);
                setPageImpagos(1);
              }}
            >
              <option value="ALL">Todos los Asesores</option>
              {uniqueSellers.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>

            <select
              className="form-select form-select-sm"
              style={{ width: '130px', fontSize: '0.82rem' }}
              value={filterTipoSuscripcion}
              onChange={(e) => {
                setFilterTipoSuscripcion(e.target.value);
                setPagePagos(1);
                setPageImpagos(1);
              }}
            >
              <option value="ALL">Modalidad</option>
              <option value="MENSUAL">Mensual</option>
              <option value="ANUAL">Anual</option>
            </select>

            {(searchQuery || filterVendedor !== 'ALL' || filterTipoSuscripcion !== 'ALL') && (
              <button
                className="btn btn-outline-secondary btn-sm p-1.5"
                onClick={() => {
                  setSearchQuery('');
                  setFilterVendedor('ALL');
                  setFilterTipoSuscripcion('ALL');
                  setPagePagos(1);
                  setPageImpagos(1);
                }}
                title="Limpiar filtros"
              >
                <RotateCcw size={13} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* 4. CONTENIDO DE LAS PESTAÑAS */}

      {/* TAB 1: TABLA DE PAGOS RECIBIDOS */}
      {activeTab === 'PAGOS' && (
        <div className="card shadow-sm border-0 rounded-3 overflow-hidden">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.85rem' }}>
              <thead className="table-light text-muted small text-uppercase" style={{ letterSpacing: '0.5px' }}>
                <tr>
                  <th className="ps-3 py-2.5">Cliente / Razón Social</th>
                  <th className="py-2.5">RUC</th>
                  <th className="py-2.5">Plan Contratado</th>
                  <th className="py-2.5 text-center">Fecha Pago</th>
                  <th className="py-2.5">Período Cubierto</th>
                  <th className="py-2.5">Medio / Operación</th>
                  <th className="py-2.5">Asesor</th>
                  <th className="py-2.5 text-end pe-3">Monto Pagado</th>
                </tr>
              </thead>
              <tbody>
                {paginatedPagos.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-5 text-muted">
                      <AlertTriangle size={24} className="mb-2 text-warning d-block mx-auto" />
                      <span>No se encontraron pagos registrados para {currentPeriodLabel}.</span>
                    </td>
                  </tr>
                ) : (
                  paginatedPagos.map((p) => (
                    <tr key={p.id}>
                      <td className="ps-3 py-2.5">
                        <div className="fw-semibold text-dark">{p.razonSocial}</div>
                        {p.nombreComercial && (
                          <small className="text-muted d-block" style={{ fontSize: '0.74rem' }}>
                            {p.nombreComercial}
                          </small>
                        )}
                      </td>
                      <td className="py-2.5 text-secondary fw-semibold">{p.ruc}</td>
                      <td className="py-2.5">
                        <span className="text-dark fw-semibold">{p.planNombre}</span>{' '}
                        <span
                          className={`badge rounded-pill ${
                            p.tipoSuscripcion === 'ANUAL'
                              ? 'bg-warning-subtle text-warning-emphasis'
                              : 'bg-light text-muted border'
                          }`}
                          style={{ fontSize: '0.68rem' }}
                        >
                          {p.tipoSuscripcion}
                        </span>
                      </td>
                      <td className="py-2.5 text-center text-muted">{p.fechaPagoStr}</td>
                      <td className="py-2.5 text-muted small">{p.periodoStr}</td>
                      <td className="py-2.5">
                        <span className="badge bg-light text-dark border px-2 py-0.5" style={{ fontSize: '0.72rem' }}>
                          {p.medioPago}
                        </span>
                        {p.codigoOperacion !== '—' && (
                          <small className="d-block text-muted" style={{ fontSize: '0.7rem' }}>
                            Op: {p.codigoOperacion}
                          </small>
                        )}
                      </td>
                      <td className="py-2.5 text-muted">{p.asesor}</td>
                      <td className="py-2.5 text-end pe-3 fw-bold text-dark" style={{ fontSize: '0.92rem' }}>
                        S/ {p.monto.toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {filteredPagosTable.length > 0 && (
                <tfoot className="table-light border-top">
                  <tr className="fw-bold">
                    <td colSpan={7} className="ps-3 py-2.5 text-uppercase small text-muted">
                      Total Recaudado en {currentPeriodLabel}:
                    </td>
                    <td className="text-end pe-3 py-2.5 text-primary fs-6">
                      S/ {filteredPagosTable.reduce((acc, p) => acc + p.monto, 0).toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* Paginador */}
          {totalPagesPagos > 1 && (
            <div className="d-flex justify-content-between align-items-center p-2.5 bg-light border-top small">
              <span className="text-muted">
                Página {pagePagos} de {totalPagesPagos} ({filteredPagosTable.length} pagos)
              </span>
              <div className="d-flex gap-1">
                <button
                  className="btn btn-sm btn-outline-secondary px-2 py-1"
                  disabled={pagePagos === 1}
                  onClick={() => setPagePagos((prev) => Math.max(1, prev - 1))}
                >
                  <ChevronLeft size={14} /> Anterior
                </button>
                <button
                  className="btn btn-sm btn-outline-secondary px-2 py-1"
                  disabled={pagePagos === totalPagesPagos}
                  onClick={() => setPagePagos((prev) => Math.min(totalPagesPagos, prev + 1))}
                >
                  Siguiente <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: TABLA DE CARTERA CON DEUDA (VENCIDOS Y BLOQUEADOS) */}
      {activeTab === 'IMPAGOS' && (
        <div className="card shadow-sm border-0 rounded-3 overflow-hidden">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.85rem' }}>
              <thead className="table-light text-muted small text-uppercase" style={{ letterSpacing: '0.5px' }}>
                <tr>
                  <th className="ps-3 py-2.5">Cliente en Deuda</th>
                  <th className="py-2.5">RUC</th>
                  <th className="py-2.5">Plan / Modalidad</th>
                  <th className="py-2.5 text-center">Estado de Cuenta</th>
                  <th className="py-2.5 text-center">Fecha Vencimiento</th>
                  <th className="py-2.5">Teléfono Contacto</th>
                  <th className="py-2.5">Asesor Asignado</th>
                  <th className="py-2.5 text-end pe-3">Monto Deuda</th>
                </tr>
              </thead>
              <tbody>
                {paginatedImpagos.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-5 text-muted">
                      <CheckCircle2 size={24} className="mb-2 text-success d-block mx-auto" />
                      <span>No hay cuentas impagas con los filtros seleccionados. Cartera al día.</span>
                    </td>
                  </tr>
                ) : (
                  paginatedImpagos.map((item) => (
                    <tr key={item.id}>
                      <td className="ps-3 py-2.5">
                        <div className="fw-semibold text-dark">{item.razonSocial}</div>
                      </td>
                      <td className="py-2.5 text-secondary fw-semibold">{item.ruc}</td>
                      <td className="py-2.5">
                        <span className="text-dark fw-semibold">{item.plan}</span>{' '}
                        <small className="text-muted">({item.tipoSuscripcion})</small>
                      </td>
                      <td className="py-2.5 text-center">
                        <span
                          className={`badge rounded-pill px-2.5 py-1 ${
                            item.estadoCuenta === 'BLOQUEADO'
                              ? 'bg-danger text-white'
                              : 'bg-warning-subtle text-warning-emphasis'
                          }`}
                          style={{ fontSize: '0.72rem' }}
                        >
                          {item.estadoCuenta}
                        </span>
                      </td>
                      <td className="py-2.5 text-center text-muted">{item.fechaVencimiento}</td>
                      <td className="py-2.5 text-muted">{item.telefono}</td>
                      <td className="py-2.5 text-muted">{item.asesor}</td>
                      <td className="py-2.5 text-end pe-3 fw-bold text-danger" style={{ fontSize: '0.92rem' }}>
                        S/ {item.montoDeuda.toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {filteredImpagosTable.length > 0 && (
                <tfoot className="table-light border-top">
                  <tr className="fw-bold">
                    <td colSpan={7} className="ps-3 py-2.5 text-uppercase small text-danger">
                      Total Deuda Acumulada en Cartera:
                    </td>
                    <td className="text-end pe-3 py-2.5 text-danger fs-6">
                      S/ {filteredImpagosTable.reduce((acc, i) => acc + i.montoDeuda, 0).toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* Paginador Impagos */}
          {totalPagesImpagos > 1 && (
            <div className="d-flex justify-content-between align-items-center p-2.5 bg-light border-top small">
              <span className="text-muted">
                Página {pageImpagos} de {totalPagesImpagos} ({filteredImpagosTable.length} clientes)
              </span>
              <div className="d-flex gap-1">
                <button
                  className="btn btn-sm btn-outline-secondary px-2 py-1"
                  disabled={pageImpagos === 1}
                  onClick={() => setPageImpagos((prev) => Math.max(1, prev - 1))}
                >
                  <ChevronLeft size={14} /> Anterior
                </button>
                <button
                  className="btn btn-sm btn-outline-secondary px-2 py-1"
                  disabled={pageImpagos === totalPagesImpagos}
                  onClick={() => setPageImpagos((prev) => Math.min(totalPagesImpagos, prev + 1))}
                >
                  Siguiente <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: RESUMEN MENSUAL COMPARATIVO DE ENERO A DICIEMBRE */}
      {activeTab === 'EVOLUCION' && (
        <div className="card shadow-sm border-0 rounded-3 overflow-hidden">
          <div className="p-3 bg-white border-bottom d-flex justify-content-between align-items-center">
            <div>
              <h6 className="fw-bold text-dark mb-0">Evolución de Ingresos Mensuales ({selectedYear})</h6>
              <small className="text-muted">Comparativo mes a mes de recaudación y volumen de transacciones</small>
            </div>
            <span className="badge bg-primary-subtle text-primary fw-semibold px-2.5 py-1">
              Año {selectedYear}
            </span>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.86rem' }}>
              <thead className="table-light text-muted small text-uppercase" style={{ letterSpacing: '0.5px' }}>
                <tr>
                  <th className="ps-3 py-2.5">Mes</th>
                  <th className="py-2.5 text-center">Operaciones</th>
                  <th className="py-2.5 text-center">Clientes Únicos</th>
                  <th className="py-2.5 text-end">Ticket Promedio</th>
                  <th className="py-2.5 text-end pe-3">Total Recaudado (S/)</th>
                </tr>
              </thead>
              <tbody>
                {monthlyEvolution.map((m) => (
                  <tr
                    key={m.monthCode}
                    style={{
                      backgroundColor: m.monthCode === selectedMonth ? '#F0F9FF' : undefined,
                      cursor: 'pointer',
                    }}
                    onClick={() => {
                      setSelectedMonth(m.monthCode);
                      setActiveTab('PAGOS');
                    }}
                    title="Click para ver el detalle de pagos de este mes"
                  >
                    <td className="ps-3 py-2.5 fw-semibold text-dark d-flex align-items-center gap-2">
                      <Calendar size={14} className="text-primary" />
                      <span>{m.monthName}</span>
                      {m.monthCode === selectedMonth && (
                        <span className="badge bg-primary text-white" style={{ fontSize: '0.65rem' }}>
                          Seleccionado
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 text-center text-muted">{m.cantidadOperaciones}</td>
                    <td className="py-2.5 text-center text-muted">{m.clientesAtendidos}</td>
                    <td className="py-2.5 text-end text-muted">
                      S/ {m.promedioTicket.toFixed(2)}
                    </td>
                    <td className="py-2.5 text-end pe-3 fw-bold text-dark" style={{ fontSize: '0.94rem' }}>
                      {m.totalRecaudado > 0 ? (
                        <span className="text-primary">
                          S/ {m.totalRecaudado.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      ) : (
                        <span className="text-muted fw-normal">S/ 0.00</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="table-light border-top">
                <tr className="fw-bold">
                  <td className="ps-3 py-2.5 text-uppercase small text-dark">
                    Total Acumulado del Año {selectedYear}:
                  </td>
                  <td className="text-center py-2.5 text-dark">
                    {monthlyEvolution.reduce((acc, m) => acc + m.cantidadOperaciones, 0)}
                  </td>
                  <td className="text-center py-2.5 text-muted">—</td>
                  <td className="text-end py-2.5 text-muted">—</td>
                  <td className="text-end pe-3 py-2.5 text-success fs-6">
                    S/ {monthlyEvolution.reduce((acc, m) => acc + m.totalRecaudado, 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
