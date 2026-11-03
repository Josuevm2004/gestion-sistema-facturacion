'use client';

import React, { useMemo, useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  RefreshCw,
  Calendar,
  Search,
  RotateCcw,
  Check,
  AlertTriangle,
  Users,
  TrendingDown,
  CreditCard,
  ShieldAlert,
  ArrowUpRight
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
  setEditingClient?: (client: Client) => void;
  setHistoryClient?: (client: Client | null) => void;
}

export default function ReportesExcelTab({
  clients = [],
  payments = [],
  loadData = () => {},
  isSyncing = false,
  uniqueSellers = [],
  setHistoryClient = () => {},
}: ReportesExcelTabProps) {
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>(''); // Formato YYYY-MM
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterVendedor, setFilterVendedor] = useState<string>('ALL');
  const [filterTipoPlan, setFilterTipoPlan] = useState<'ALL' | 'MENSUAL' | 'ANUAL'>('ALL');
  const [filterConcepto, setFilterConcepto] = useState<string>('ALL');
  const [filterEstadoImpago, setFilterEstadoImpago] = useState<'ALL' | 'VENCIDO' | 'BLOQUEADO'>('ALL');

  // Datos de proyección calculados por Python
  const [proyeccionData, setProyeccionData] = useState<any>(null);
  const [loadingProyeccion, setLoadingProyeccion] = useState<boolean>(false);

  useEffect(() => {
    setLoadingProyeccion(true);
    fetch('/api/admin/proyeccion-mes')
      .then((res) => res.json())
      .then((resData) => {
        if (resData && resData.success && resData.data) {
          setProyeccionData(resData.data);
        }
      })
      .catch((err) => console.error('Error cargando proyeccion Python:', err))
      .finally(() => setLoadingProyeccion(false));
  }, []);

  const safeClients = useMemo(() => (Array.isArray(clients) ? clients : []), [clients]);
  const safePayments = useMemo(() => (Array.isArray(payments) ? payments : []), [payments]);

  // Diccionario de clientes por id y ruc
  const clientMap = useMemo(() => {
    const map = new Map<string, Client>();
    safeClients.forEach((c) => {
      if (c.id) map.set(String(c.id), c);
      if (c.ruc) map.set(`ruc-${c.ruc}`, c);
    });
    return map;
  }, [safeClients]);

  const MESES_LABEL: Record<string, string> = {
    '01': 'Enero', '02': 'Febrero', '03': 'Marzo', '04': 'Abril',
    '05': 'Mayo', '06': 'Junio', '07': 'Julio', '08': 'Agosto',
    '09': 'Setiembre', '10': 'Octubre', '11': 'Noviembre', '12': 'Diciembre'
  };

  const formatMonthLabel = (mKey: string) => {
    if (!mKey || !mKey.includes('-')) return mKey;
    const [y, m] = mKey.split('-');
    return `${MESES_LABEL[m] || m} ${y}`;
  };

  const parseDateSafe = (val: any): Date | null => {
    if (!val) return null;
    if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
    const s = String(val).split('T')[0].split(' ')[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      const [y, m, d] = s.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  };

  // 1. PROCESAR HISTORIAL COMPLETO DE PAGOS (1:1 CON EL HISTORIAL DEL CLIENTE)
  // Se identifica el mes exacto al que pertenece el pago considerando fecha de servicio y adelantos
  const allParsedPayments = useMemo(() => {
    const list: Array<{
      id: string;
      pagoId: any;
      ventaId: any;
      clienteId: string;
      ruc: string;
      razonSocial: string;
      nombreComercial: string;
      telefono: string;
      asesor: string;
      planNombre: string;
      tipoSuscripcion: 'MENSUAL' | 'ANUAL';
      monto: number;
      fechaPagoStr: string;
      fechaPagoDate: Date | null;
      periodoInicioStr: string;
      periodoFinStr: string;
      targetMonthKey: string; // YYYY-MM del mes correspondiente
      targetMonthLabel: string;
      tipoOperacion: 'ALTA' | 'RENOVACION' | 'PRORRATEO' | 'ADELANTO' | 'PAGO_GENERAL';
      tipoOperacionLabel: string;
      badgeColor: string;
      medioPago: string;
      codigoOperacion: string;
      observaciones: string;
      isAdelanto: boolean;
      isAnual: boolean;
    }> = [];

    const seenPagoIds = new Set<string>();

    safePayments.forEach((p, idx) => {
      const estadoPago = (p?.estadoPago || '').toUpperCase();
      const estadoVenta = (p?.venta?.estadoVenta || p?.estadoVenta || '').toUpperCase();
      if ((estadoPago !== 'PAGADO' && estadoPago !== 'CONFIRMADO') || estadoVenta === 'CANCELADA') {
        return;
      }

      const pId = p?.id ?? p?.pagoId ?? `pay-${idx}`;
      if (seenPagoIds.has(String(pId))) return;
      seenPagoIds.add(String(pId));

      const rawCId = p?.venta?.cliente?.id ?? p?.clienteId ?? p?.venta?.clienteId;
      const rawRuc = p?.clienteRuc || p?.venta?.cliente?.ruc;
      const matchedClient = (rawCId && clientMap.get(String(rawCId))) || (rawRuc && clientMap.get(`ruc-${rawRuc}`)) || null;

      const fPagoRaw = p?.fechaPago || p?.fechaRegistro;
      const fInicioRaw = p?.periodoInicio || p?.venta?.periodoInicio || p?.venta?.fechaVenta || fPagoRaw;
      const fFinRaw = p?.periodoFin || p?.venta?.periodoFin;

      const datePago = parseDateSafe(fPagoRaw);
      const dateInicio = parseDateSafe(fInicioRaw);

      // El mes al que pertenece el pago es el de su período o fecha de pago
      const dateTarget = dateInicio || datePago || new Date();
      const targetMonthKey = `${dateTarget.getFullYear()}-${String(dateTarget.getMonth() + 1).padStart(2, '0')}`;

      const obs = String(p?.observaciones || p?.codigoOperacion || '').toLowerCase();
      const rawTipoVenta = (p?.venta?.tipoVenta || p?.tipoVenta || '').toUpperCase();
      const isProrr = obs.includes('prorrat') || p?.tipoProrrateo === 'SEGUNDO_PRORRATEO' || p?.tipoProrrateo === 'PRIMER_PRORRATEO';

      let isAdelanto = obs.includes('adelant') || obs.includes('anticip');
      if (datePago && dateInicio) {
        const mPago = datePago.getFullYear() * 12 + datePago.getMonth();
        const mInicio = dateInicio.getFullYear() * 12 + dateInicio.getMonth();
        if (mInicio > mPago) {
          isAdelanto = true;
        }
      }

      let tipoOperacion: 'ALTA' | 'RENOVACION' | 'PRORRATEO' | 'ADELANTO' | 'PAGO_GENERAL' = 'RENOVACION';
      let tipoOperacionLabel = 'Renovación';
      let badgeColor = 'bg-info text-dark';

      if (isAdelanto) {
        tipoOperacion = 'ADELANTO';
        tipoOperacionLabel = 'Adelanto';
        badgeColor = 'bg-primary text-white';
      } else if (rawTipoVenta === 'ALTA' || obs.includes('alta') || obs.includes('inicial')) {
        tipoOperacion = 'ALTA';
        tipoOperacionLabel = 'Afiliación / Alta';
        badgeColor = 'bg-success text-white';
      } else if (isProrr) {
        tipoOperacion = 'PRORRATEO';
        tipoOperacionLabel = 'Cobro Prorrateo';
        badgeColor = 'bg-warning text-dark';
      } else if (rawTipoVenta === 'CAMBIO_PLAN' || rawTipoVenta === 'MEJORA_PLAN') {
        tipoOperacion = 'PAGO_GENERAL';
        tipoOperacionLabel = 'Mejora Plan';
        badgeColor = 'bg-secondary text-white';
      }

      const tipoSubRaw = (p?.tipoSuscripcion || p?.venta?.suscripcion?.tipoSuscripcion || matchedClient?.tipoSuscripcion || 'MENSUAL').toUpperCase();
      const tipoSuscripcion: 'MENSUAL' | 'ANUAL' = tipoSubRaw === 'ANUAL' ? 'ANUAL' : 'MENSUAL';

      list.push({
        id: String(pId),
        pagoId: pId,
        ventaId: p?.ventaId || p?.venta?.id,
        clienteId: String(rawCId || matchedClient?.id || ''),
        ruc: rawRuc || matchedClient?.ruc || '—',
        razonSocial: p?.clienteRazonSocial || matchedClient?.razonSocial || matchedClient?.nombreComercial || `Cliente ${rawRuc || ''}`,
        nombreComercial: matchedClient?.nombreComercial || '',
        telefono: matchedClient?.telefono || matchedClient?.telefonoPersonal || '—',
        asesor: p?.vendedorNombre || p?.venta?.vendedor?.nombre || matchedClient?.vendedor || 'Por asignar',
        planNombre: p?.planNombre || p?.venta?.suscripcion?.plan?.nombrePlan || matchedClient?.planContratado || 'Plan Estándar',
        tipoSuscripcion,
        monto: Number(p?.monto || 0),
        fechaPagoStr: datePago ? datePago.toLocaleDateString('es-PE') : '—',
        fechaPagoDate: datePago,
        periodoInicioStr: dateInicio ? dateInicio.toLocaleDateString('es-PE') : '—',
        periodoFinStr: fFinRaw ? (parseDateSafe(fFinRaw)?.toLocaleDateString('es-PE') || '—') : '—',
        targetMonthKey,
        targetMonthLabel: formatMonthLabel(targetMonthKey),
        tipoOperacion,
        tipoOperacionLabel,
        badgeColor,
        medioPago: p?.medioPago || 'YAPE',
        codigoOperacion: p?.codigoOperacion || '—',
        observaciones: p?.observaciones || (isAdelanto ? 'Adelanto aplicado a este mes' : 'Pago verificado'),
        isAdelanto,
        isAnual: tipoSuscripcion === 'ANUAL',
      });
    });

    list.sort((a, b) => {
      const tA = a.fechaPagoDate ? a.fechaPagoDate.getTime() : 0;
      const tB = b.fechaPagoDate ? b.fechaPagoDate.getTime() : 0;
      return tB - tA;
    });

    return list;
  }, [safePayments, clientMap]);

  // Extraer lista única de meses ordenados cronológicamente descendente
  const availableMonthKeys = useMemo(() => {
    const setM = new Set<string>();
    allParsedPayments.forEach((p) => setM.add(p.targetMonthKey));
    const now = new Date();
    const currKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    setM.add(currKey);
    return Array.from(setM).sort().reverse();
  }, [allParsedPayments]);

  // Seleccionar por defecto el mes más reciente
  useEffect(() => {
    if (!selectedMonth && availableMonthKeys.length > 0) {
      setSelectedMonth(availableMonthKeys[0]);
    }
  }, [availableMonthKeys, selectedMonth]);

  // Pagos del mes seleccionado
  const paymentsOfSelectedMonth = useMemo(() => {
    if (!selectedMonth) return [];
    return allParsedPayments.filter((p) => p.targetMonthKey === selectedMonth);
  }, [allParsedPayments, selectedMonth]);

  // 2. MÉTRICAS EXACTAS DEL MES SELECCIONADO (CON BASE EN LA IMAGEN)
  const selectedMonthMetrics = useMemo(() => {
    const pagos = paymentsOfSelectedMonth;
    const totalRecaudado = pagos.reduce((acc, p) => acc + p.monto, 0);

    const pagosRegulares = pagos.filter((p) => p.tipoOperacion === 'RENOVACION' || p.tipoOperacion === 'ALTA' || p.tipoOperacion === 'PAGO_GENERAL');
    const pagosProrrateos = pagos.filter((p) => p.tipoOperacion === 'PRORRATEO');
    const pagosAdelantos = pagos.filter((p) => p.isAdelanto);

    const pagosMensuales = pagos.filter((p) => p.tipoSuscripcion === 'MENSUAL');
    const pagosAnuales = pagos.filter((p) => p.tipoSuscripcion === 'ANUAL');

    // Clientes activos no bloqueados en dicho mes
    const [sY, sM] = (selectedMonth || '2026-11').split('-').map(Number);
    const finDelMes = new Date(sY, sM, 0, 23, 59, 59);

    let activosTotales = 0;
    let activosMensuales = 0;
    let activosAnuales = 0;

    safeClients.forEach((c) => {
      const st = (c.estadoCuenta || '').toUpperCase();
      if (st === 'BLOQUEADO' || st === 'SUSPENDIDO') return;

      const fReg = c.fechaRegistro ? new Date(c.fechaRegistro) : null;
      if (fReg && fReg > finDelMes) return;

      activosTotales++;
      if ((c.tipoSuscripcion || '').toUpperCase() === 'ANUAL') {
        activosAnuales++;
      } else {
        activosMensuales++;
      }
    });

    return {
      totalRecaudado,
      regularesMonto: pagosRegulares.reduce((acc, p) => acc + p.monto, 0),
      regularesCount: pagosRegulares.length,
      prorrateosMonto: pagosProrrateos.reduce((acc, p) => acc + p.monto, 0),
      prorrateosCount: pagosProrrateos.length,
      adelantosMonto: pagosAdelantos.reduce((acc, p) => acc + p.monto, 0),
      adelantosCount: pagosAdelantos.length,
      activosTotales,
      activosMensuales,
      activosAnuales,
      mensualesCobradosMonto: pagosMensuales.reduce((acc, p) => acc + p.monto, 0),
      mensualesCobradosCount: pagosMensuales.length,
      anualesCobradosMonto: pagosAnuales.reduce((acc, p) => acc + p.monto, 0),
      anualesCobradosCount: pagosAnuales.length,
      totalTransacciones: pagos.length,
    };
  }, [paymentsOfSelectedMonth, safeClients, selectedMonth]);

  // 3. ANÁLISIS DE PÉRDIDAS E IMPAGOS (BLOQUEADOS Y VENCIDOS)
  const lossDebtAnalysis = useMemo(() => {
    let perdidasBloqueados = 0;
    let perdidasVencidos = 0;
    let countBloqueados = 0;
    let countVencidos = 0;

    const list: Array<{
      id: string;
      cliente: Client;
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
        perdidasBloqueados += deuda;
        countBloqueados++;
      } else {
        perdidasVencidos += deuda;
        countVencidos++;
      }

      const fVenc = parseDateSafe(c.fechaVencimientoMensual);

      list.push({
        id: String(c.id || c.ruc),
        cliente: c,
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
      perdidaTotal: perdidasBloqueados + perdidasVencidos,
      perdidasBloqueados,
      perdidasVencidos,
      countTotal: countBloqueados + countVencidos,
      countBloqueados,
      countVencidos,
      list,
    };
  }, [safeClients]);

  // Filtrado de la tabla de pagos
  const filteredPagosTable = useMemo(() => {
    return paymentsOfSelectedMonth.filter((p) => {
      if (filterVendedor !== 'ALL' && p.asesor !== filterVendedor) return false;
      if (filterTipoPlan !== 'ALL' && p.tipoSuscripcion !== filterTipoPlan) return false;
      if (filterConcepto !== 'ALL' && p.tipoOperacion !== filterConcepto) return false;

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
  }, [paymentsOfSelectedMonth, filterVendedor, filterTipoPlan, filterConcepto, searchQuery]);

  // Filtrado de la tabla de pérdidas
  const filteredImpagosTable = useMemo(() => {
    return lossDebtAnalysis.list.filter((item) => {
      if (filterEstadoImpago !== 'ALL' && item.estadoCuenta !== filterEstadoImpago) return false;
      if (filterVendedor !== 'ALL' && item.asesor !== filterVendedor) return false;

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
  }, [lossDebtAnalysis.list, filterEstadoImpago, filterVendedor, searchQuery]);

  // Descarga del reporte en Excel oficial generado por Python
  const handleDownloadExcel = async () => {
    setIsExportingExcel(true);
    try {
      const res = await fetch('/api/admin/reporte-excel-oficial');
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Reporte_Oficial_Cobros_${new Date().toISOString().slice(0, 10)}.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        alert('Error al generar el reporte con Python.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsExportingExcel(false);
    }
  };

  return (
    <div className="admin-module admin-module--reportes p-1">
      {/* 1. BARRA SUPERIOR: SELECTOR DE MES Y BOTONES DE ACCIÓN */}
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4 pb-3 border-bottom">
        <div>
          <h4 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
            <FileSpreadsheet className="text-primary" size={24} />
            <span>Reporte Mensual de Facturación y Pérdidas</span>
          </h4>
          <p className="text-muted small mb-0">
            Selecciona cualquier mes para ver los cobros exactos, clientes activos y el dinero no recaudado por cuentas vencidas o bloqueadas.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2.5 flex-wrap">
          {/* Selector de Mes Dinámico */}
          <div className="d-flex align-items-center gap-2 bg-white px-3 py-1.5 rounded-3 border shadow-xs">
            <Calendar size={16} className="text-primary" />
            <span className="small fw-bold text-muted">Seleccionar Mes:</span>
            <select
              className="form-select form-select-sm border-0 fw-bold text-primary shadow-none ps-1 pe-4"
              style={{ fontSize: '0.92rem', cursor: 'pointer' }}
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              {availableMonthKeys.map((mk) => (
                <option key={mk} value={mk}>
                  {formatMonthLabel(mk)}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => loadData(null, true)}
            disabled={isSyncing}
            className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1.5 px-3 py-2 rounded-3 shadow-xs"
            title="Sincronizar datos"
          >
            <RefreshCw size={14} className={isSyncing ? 'spin-anim' : ''} />
            <span>{isSyncing ? 'Actualizando...' : 'Actualizar'}</span>
          </button>

          <button
            onClick={handleDownloadExcel}
            disabled={isExportingExcel}
            className="btn btn-success btn-sm d-flex align-items-center gap-2 px-3 py-2 rounded-3 shadow-xs fw-bold"
            title="Exportar archivo Excel multi-hoja con Python"
          >
            {isExportingExcel ? <RefreshCw size={15} className="spin-anim" /> : <FileSpreadsheet size={15} />}
            <span>{isExportingExcel ? 'Generando Excel...' : 'Exportar Excel'}</span>
          </button>
        </div>
      </div>

      {/* 2. TARJETAS DE INDICADORES (CON EL FORMATO DE LA IMAGEN EN TODAS LAS CARDS) */}
      <div className="row g-3 mb-4">
        {/* Card 1: Cobrado en el Mes Seleccionado (Idéntico a la imagen) */}
        <div className="col-12 col-md-6 col-xl-3">
          <div
            className="card h-100 shadow-sm border-0 p-3.5"
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid #E5E7EB',
            }}
          >
            <div className="d-flex justify-content-between align-items-start mb-2">
              <span className="fw-bold text-primary" style={{ fontSize: '1rem' }}>
                Cobrado {formatMonthLabel(selectedMonth)}
              </span>
              <span
                className="p-2 rounded-3 d-flex align-items-center justify-content-center"
                style={{ backgroundColor: '#EEF2FF', color: '#4338CA' }}
              >
                <Calendar size={18} strokeWidth={2.2} />
              </span>
            </div>

            <div className="fw-bolder text-primary mb-2" style={{ fontSize: '1.85rem', letterSpacing: '-0.5px' }}>
              S/ {selectedMonthMetrics.totalRecaudado.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>

            <div className="d-flex flex-column gap-1 pt-2 border-top" style={{ fontSize: '0.82rem' }}>
              <div className="d-flex justify-content-between align-items-center">
                <span className="text-muted">Regulares ({selectedMonthMetrics.regularesCount}):</span>
                <strong className="text-dark">S/ {selectedMonthMetrics.regularesMonto.toFixed(2)}</strong>
              </div>
              <div className="d-flex justify-content-between align-items-center">
                <span className="text-muted">Prorrateos ({selectedMonthMetrics.prorrateosCount}):</span>
                <strong className="text-primary">S/ {selectedMonthMetrics.prorrateosMonto.toFixed(2)}</strong>
              </div>
              <div className="d-flex justify-content-between align-items-center">
                <span className="text-muted">Adelantos ({selectedMonthMetrics.adelantosCount}):</span>
                <strong className="text-success">S/ {selectedMonthMetrics.adelantosMonto.toFixed(2)}</strong>
              </div>
              <div className="text-muted small mt-1 pt-1 border-top d-flex align-items-center gap-1.5" style={{ fontSize: '0.74rem' }}>
                <Check size={14} className="text-success" />
                <span>{selectedMonthMetrics.totalTransacciones} pagos registrados en este mes</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Clientes Activos del Mes (Total, Anuales y Mensuales - Idéntico a la imagen) */}
        <div className="col-12 col-md-6 col-xl-3">
          <div
            className="card h-100 shadow-sm border-0 p-3.5"
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid #E5E7EB',
            }}
          >
            <div className="d-flex justify-content-between align-items-start mb-2">
              <span className="fw-bold text-dark" style={{ fontSize: '1rem' }}>
                Clientes Activos
              </span>
              <span
                className="p-2 rounded-3 d-flex align-items-center justify-content-center"
                style={{ backgroundColor: '#F0FDF4', color: '#16A34A' }}
              >
                <Users size={18} strokeWidth={2.2} />
              </span>
            </div>

            <div className="fw-bolder text-dark mb-2" style={{ fontSize: '1.85rem', letterSpacing: '-0.5px' }}>
              {selectedMonthMetrics.activosTotales} <span className="fs-6 text-muted fw-normal">activos</span>
            </div>

            <div className="d-flex flex-column gap-1 pt-2 border-top" style={{ fontSize: '0.82rem' }}>
              <div className="d-flex justify-content-between align-items-center">
                <span className="text-muted">Planes Mensuales:</span>
                <strong className="text-dark">{selectedMonthMetrics.activosMensuales} clientes</strong>
              </div>
              <div className="d-flex justify-content-between align-items-center">
                <span className="text-muted">Planes Anuales:</span>
                <strong className="text-dark">{selectedMonthMetrics.activosAnuales} clientes</strong>
              </div>
              <div className="d-flex justify-content-between align-items-center">
                <span className="text-muted">Cobrado Anuales:</span>
                <strong className="text-success">S/ {selectedMonthMetrics.anualesCobradosMonto.toFixed(2)}</strong>
              </div>
              <div className="text-muted small mt-1 pt-1 border-top d-flex align-items-center gap-1.5" style={{ fontSize: '0.74rem' }}>
                <Check size={14} className="text-success" />
                <span>Anuales solo se cobran su mes correspondiente</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Pérdidas por Bloqueados y Vencidos (Idéntico a la imagen) */}
        <div className="col-12 col-md-6 col-xl-3">
          <div
            className="card h-100 shadow-sm border-0 p-3.5"
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid #FEE2E2',
            }}
          >
            <div className="d-flex justify-content-between align-items-start mb-2">
              <span className="fw-bold text-danger" style={{ fontSize: '1rem' }}>
                Pérdidas e Impagos
              </span>
              <span
                className="p-2 rounded-3 d-flex align-items-center justify-content-center"
                style={{ backgroundColor: '#FEF2F2', color: '#DC2626' }}
              >
                <TrendingDown size={18} strokeWidth={2.2} />
              </span>
            </div>

            <div className="fw-bolder text-danger mb-2" style={{ fontSize: '1.85rem', letterSpacing: '-0.5px' }}>
              S/ {lossDebtAnalysis.perdidaTotal.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>

            <div className="d-flex flex-column gap-1 pt-2 border-top" style={{ fontSize: '0.82rem' }}>
              <div className="d-flex justify-content-between align-items-center">
                <span className="text-muted">Bloqueados ({lossDebtAnalysis.countBloqueados}):</span>
                <strong className="text-danger">S/ {lossDebtAnalysis.perdidasBloqueados.toFixed(2)}</strong>
              </div>
              <div className="d-flex justify-content-between align-items-center">
                <span className="text-muted">Vencidos ({lossDebtAnalysis.countVencidos}):</span>
                <strong className="text-warning-emphasis">S/ {lossDebtAnalysis.perdidasVencidos.toFixed(2)}</strong>
              </div>
              <div className="d-flex justify-content-between align-items-center">
                <span className="text-muted">Total Cuentas con Deuda:</span>
                <strong className="text-danger">{lossDebtAnalysis.countTotal} clientes</strong>
              </div>
              <div className="text-danger small mt-1 pt-1 border-top d-flex align-items-center gap-1.5" style={{ fontSize: '0.74rem' }}>
                <AlertTriangle size={14} className="text-danger" />
                <span>Dinero dejado de percibir (detallado en tabla inferior)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: Previa del Próximo Mes (Idéntico a la imagen) */}
        <div className="col-12 col-md-6 col-xl-3">
          <div
            className="card h-100 shadow-sm border-0 p-3.5"
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid #E5E7EB',
            }}
          >
            <div className="d-flex justify-content-between align-items-start mb-2">
              <span className="fw-bold text-primary" style={{ fontSize: '1rem' }}>
                Previa {proyeccionData?.periodo_proyectado || 'Próximo Mes'}
              </span>
              <span
                className="p-2 rounded-3 d-flex align-items-center justify-content-center"
                style={{ backgroundColor: '#EEF2FF', color: '#4338CA' }}
              >
                <Calendar size={18} strokeWidth={2.2} />
              </span>
            </div>

            <div className="fw-bolder text-primary mb-2" style={{ fontSize: '1.85rem', letterSpacing: '-0.5px' }}>
              {loadingProyeccion ? (
                <span className="fs-6 text-muted fw-normal">Calculando...</span>
              ) : (
                `S/ ${(proyeccionData?.total_proyectado || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              )}
            </div>

            <div className="d-flex flex-column gap-1 pt-2 border-top" style={{ fontSize: '0.82rem' }}>
              <div className="d-flex justify-content-between align-items-center">
                <span className="text-muted">Regulares ({proyeccionData?.count_regulares || 0}):</span>
                <strong className="text-dark">S/ {(proyeccionData?.total_regulares || 0).toFixed(2)}</strong>
              </div>
              <div className="d-flex justify-content-between align-items-center">
                <span className="text-muted">Prorrateos ({proyeccionData?.count_prorrateados || 0}):</span>
                <strong className="text-primary">S/ {(proyeccionData?.total_prorrateados || 0).toFixed(2)}</strong>
              </div>
              <div className="d-flex justify-content-between align-items-center">
                <span className="text-muted">Adelantos (0):</span>
                <strong className="text-success">S/ 0.00</strong>
              </div>
              <div className="text-muted small mt-1 pt-1 border-top d-flex align-items-center gap-1.5" style={{ fontSize: '0.74rem' }}>
                <Check size={14} className="text-success" />
                <span>Planes activos ({proyeccionData?.clientes_no_bloqueados || 0} sin bloqueados)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. TABLA 1: DETALLE DE PAGOS DEL MES SELECCIONADO */}
      <div className="card shadow-sm border-0 rounded-4 overflow-hidden mb-5">
        <div className="p-3.5 bg-white border-bottom">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-3">
            <div className="d-flex align-items-center gap-2">
              <CreditCard size={18} className="text-primary" />
              <h6 className="fw-bold text-dark mb-0">
                1. Tabla de Pagos Recibidos en {formatMonthLabel(selectedMonth)}
              </h6>
              <span className="badge bg-primary-subtle text-primary fw-bold rounded-pill px-2.5 py-0.5">
                {filteredPagosTable.length} pagos
              </span>
            </div>

            <div className="text-muted small">
              Suma recaudada en vista:{' '}
              <strong className="text-primary fs-6">
                S/ {filteredPagosTable.reduce((acc, p) => acc + p.monto, 0).toFixed(2)}
              </strong>
            </div>
          </div>

          {/* Filtros de la Tabla de Pagos */}
          <div className="row g-2 align-items-center">
            <div className="col-12 col-md-4">
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-light border-end-0">
                  <Search size={14} className="text-muted" />
                </span>
                <input
                  type="text"
                  className="form-control bg-light border-start-0"
                  placeholder="Buscar RUC, razón social, operación..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="col-6 col-md-3">
              <select
                className="form-select form-select-sm"
                value={filterVendedor}
                onChange={(e) => setFilterVendedor(e.target.value)}
              >
                <option value="ALL">Todos los Asesores</option>
                {uniqueSellers.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-6 col-md-2">
              <select
                className="form-select form-select-sm"
                value={filterTipoPlan}
                onChange={(e) => setFilterTipoPlan(e.target.value as any)}
              >
                <option value="ALL">Mensual / Anual</option>
                <option value="MENSUAL">Solo Mensuales</option>
                <option value="ANUAL">Solo Anuales</option>
              </select>
            </div>

            <div className="col-6 col-md-2">
              <select
                className="form-select form-select-sm"
                value={filterConcepto}
                onChange={(e) => setFilterConcepto(e.target.value)}
              >
                <option value="ALL">Todos los Conceptos</option>
                <option value="RENOVACION">Renovación</option>
                <option value="PRORRATEO">Cobro Prorrateo</option>
                <option value="ADELANTO">Adelanto</option>
                <option value="ALTA">Afiliación / Alta</option>
              </select>
            </div>

            <div className="col-6 col-md-1 text-end">
              <button
                className="btn btn-outline-secondary btn-sm w-100 py-1"
                onClick={() => {
                  setSearchQuery('');
                  setFilterVendedor('ALL');
                  setFilterTipoPlan('ALL');
                  setFilterConcepto('ALL');
                }}
                title="Limpiar filtros"
              >
                <RotateCcw size={13} />
              </button>
            </div>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.86rem' }}>
            <thead className="table-light text-muted small text-uppercase" style={{ letterSpacing: '0.5px' }}>
              <tr>
                <th className="ps-3 py-2.5">Cliente / Razón Social</th>
                <th className="py-2.5">RUC</th>
                <th className="py-2.5">Plan Contratado</th>
                <th className="py-2.5 text-center">Fecha Pago</th>
                <th className="py-2.5 text-center">Período de Servicio</th>
                <th className="py-2.5">Concepto</th>
                <th className="py-2.5">Asesor</th>
                <th className="py-2.5 text-end pe-3">Monto Pagado</th>
              </tr>
            </thead>
            <tbody>
              {filteredPagosTable.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-5 text-muted">
                    <AlertTriangle size={24} className="mb-2 text-warning d-block mx-auto" />
                    <span>No se encontraron pagos registrados para {formatMonthLabel(selectedMonth)} con estos filtros.</span>
                  </td>
                </tr>
              ) : (
                filteredPagosTable.map((p) => (
                  <tr key={p.id}>
                    <td className="ps-3 py-2.5">
                      <div className="fw-bold text-dark">{p.razonSocial}</div>
                      {p.nombreComercial && (
                        <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>
                          {p.nombreComercial}
                        </small>
                      )}
                    </td>
                    <td className="py-2.5 fw-semibold text-secondary">{p.ruc}</td>
                    <td className="py-2.5">
                      <span className="fw-semibold text-dark">{p.planNombre}</span>{' '}
                      <span
                        className={`badge rounded-pill ${
                          p.tipoSuscripcion === 'ANUAL'
                            ? 'bg-warning-subtle text-warning-emphasis'
                            : 'bg-light text-muted border'
                        }`}
                        style={{ fontSize: '0.7rem' }}
                      >
                        {p.tipoSuscripcion}
                      </span>
                    </td>
                    <td className="py-2.5 text-center text-muted">{p.fechaPagoStr}</td>
                    <td className="py-2.5 text-center">
                      <span className="small fw-semibold text-dark">
                        {p.periodoInicioStr} al {p.periodoFinStr}
                      </span>
                    </td>
                    <td className="py-2.5">
                      <span className={`badge ${p.badgeColor} rounded-pill px-2.5 py-1`} style={{ fontSize: '0.72rem' }}>
                        {p.tipoOperacionLabel}
                      </span>
                      {p.isAdelanto && (
                        <small className="d-block text-primary fw-semibold mt-0.5" style={{ fontSize: '0.7rem' }}>
                          Adelanto
                        </small>
                      )}
                    </td>
                    <td className="py-2.5 text-muted">{p.asesor}</td>
                    <td className="py-2.5 text-end pe-3 fw-bold text-dark" style={{ fontSize: '0.94rem' }}>
                      S/ {p.monto.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filteredPagosTable.length > 0 && (
              <tfoot className="table-light border-top">
                <tr className="fw-bold">
                  <td colSpan={7} className="ps-3 py-2.5 text-uppercase" style={{ fontSize: '0.82rem' }}>
                    Suma Total Recaudada en {formatMonthLabel(selectedMonth)}:
                  </td>
                  <td className="text-end pe-3 py-2.5 text-primary" style={{ fontSize: '1.05rem' }}>
                    S/ {filteredPagosTable.reduce((acc, p) => acc + p.monto, 0).toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* 4. TABLA 2: DETALLE DE PÉRDIDAS POR CLIENTES BLOQUEADOS Y VENCIDOS */}
      <div className="card shadow-sm border-0 rounded-4 overflow-hidden mb-4" style={{ border: '1px solid #FEE2E2' }}>
        <div className="p-3.5 bg-white border-bottom">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-3">
            <div className="d-flex align-items-center gap-2">
              <ShieldAlert size={19} className="text-danger" />
              <h6 className="fw-bold text-danger mb-0">
                2. Tabla de Pérdidas e Impagos: Cuánto Dinero se está Perdiendo en Cuentas Bloqueadas y Vencidas
              </h6>
              <span className="badge bg-danger-subtle text-danger fw-bold rounded-pill px-2.5 py-0.5">
                {filteredImpagosTable.length} clientes
              </span>
            </div>

            <div className="text-danger fw-bold" style={{ fontSize: '1.05rem' }}>
              Suma Total de Pérdida:{' '}
              <span>S/ {filteredImpagosTable.reduce((acc, i) => acc + i.montoDeuda, 0).toFixed(2)}</span>
            </div>
          </div>

          {/* Filtros de la Tabla de Pérdidas */}
          <div className="row g-2 align-items-center">
            <div className="col-12 col-md-5">
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-light border-end-0">
                  <Search size={14} className="text-muted" />
                </span>
                <input
                  type="text"
                  className="form-control bg-light border-start-0"
                  placeholder="Buscar cliente, RUC o plan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="col-6 col-md-3">
              <select
                className="form-select form-select-sm"
                value={filterEstadoImpago}
                onChange={(e) => setFilterEstadoImpago(e.target.value as any)}
              >
                <option value="ALL">Todos los Estados (Bloqueados + Vencidos)</option>
                <option value="BLOQUEADO">Solo Cuentas Bloqueadas</option>
                <option value="VENCIDO">Solo Cuentas Vencidas</option>
              </select>
            </div>

            <div className="col-6 col-md-3">
              <select
                className="form-select form-select-sm"
                value={filterVendedor}
                onChange={(e) => setFilterVendedor(e.target.value)}
              >
                <option value="ALL">Todos los Asesores</option>
                {uniqueSellers.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12 col-md-1 text-end">
              <button
                className="btn btn-outline-secondary btn-sm w-100 py-1"
                onClick={() => {
                  setSearchQuery('');
                  setFilterEstadoImpago('ALL');
                  setFilterVendedor('ALL');
                }}
                title="Limpiar filtros"
              >
                <RotateCcw size={13} />
              </button>
            </div>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.86rem' }}>
            <thead className="table-light text-muted small text-uppercase" style={{ letterSpacing: '0.5px' }}>
              <tr>
                <th className="ps-3 py-2.5">Cliente Impago</th>
                <th className="py-2.5">RUC</th>
                <th className="py-2.5">Plan / Modalidad</th>
                <th className="py-2.5 text-center">Estado de Cuenta</th>
                <th className="py-2.5 text-center">Fecha Vencimiento</th>
                <th className="py-2.5">Teléfono Contacto</th>
                <th className="py-2.5">Asesor Asignado</th>
                <th className="py-2.5 text-end pe-3">Monto Deuda (Pérdida)</th>
              </tr>
            </thead>
            <tbody>
              {filteredImpagosTable.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-5 text-muted">
                    <Check size={24} className="mb-2 text-success d-block mx-auto" />
                    <span>No hay cuentas impagas con los filtros seleccionados. Cartera al día.</span>
                  </td>
                </tr>
              ) : (
                filteredImpagosTable.map((item) => (
                  <tr key={item.id}>
                    <td className="ps-3 py-2.5">
                      <div className="fw-bold text-dark">{item.razonSocial}</div>
                    </td>
                    <td className="py-2.5 fw-semibold text-secondary">{item.ruc}</td>
                    <td className="py-2.5">
                      <span className="fw-semibold text-dark">{item.plan}</span>{' '}
                      <small className="text-muted">({item.tipoSuscripcion})</small>
                    </td>
                    <td className="py-2.5 text-center">
                      <span
                        className={`badge rounded-pill px-2.5 py-1 ${
                          item.estadoCuenta === 'BLOQUEADO'
                            ? 'bg-danger text-white'
                            : 'bg-warning-subtle text-warning-emphasis'
                        }`}
                        style={{ fontSize: '0.74rem' }}
                      >
                        {item.estadoCuenta}
                      </span>
                    </td>
                    <td className="py-2.5 text-center text-muted">{item.fechaVencimiento}</td>
                    <td className="py-2.5 text-muted">{item.telefono}</td>
                    <td className="py-2.5 text-muted">{item.asesor}</td>
                    <td className="py-2.5 text-end pe-3 fw-bold text-danger" style={{ fontSize: '0.94rem' }}>
                      S/ {item.montoDeuda.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filteredImpagosTable.length > 0 && (
              <tfoot className="table-light border-top">
                <tr className="fw-bold">
                  <td colSpan={7} className="ps-3 py-2.5 text-uppercase text-danger" style={{ fontSize: '0.82rem' }}>
                    Suma Total de Pérdida en Cartera (Deuda Acumulada):
                  </td>
                  <td className="text-end pe-3 py-2.5 text-danger fw-bolder" style={{ fontSize: '1.05rem' }}>
                    S/ {filteredImpagosTable.reduce((acc, i) => acc + i.montoDeuda, 0).toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
