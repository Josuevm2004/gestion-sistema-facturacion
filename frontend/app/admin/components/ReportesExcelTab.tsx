'use client';

import React, { useMemo, useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  RefreshCw,
  Users,
  DollarSign,
  AlertTriangle,
  Search,
  RotateCcw,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  ChevronRight,
  Filter,
  ArrowUpRight,
  ShieldCheck,
  Check
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
  const [selectedMonth, setSelectedMonth] = useState<string>(''); // YYYY-MM
  const [selectedVendedor, setSelectedVendedor] = useState<string>('ALL');
  const [selectedTipoPlan, setSelectedTipoPlan] = useState<'ALL' | 'MENSUAL' | 'ANUAL'>('ALL');
  const [selectedConcepto, setSelectedConcepto] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Proyección calculada por Python
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

  // Mapa rápido de clientes por ID y RUC
  const clientMap = useMemo(() => {
    const map = new Map<string, Client>();
    safeClients.forEach((c) => {
      if (c.id) map.set(String(c.id), c);
      if (c.ruc) map.set(`ruc-${c.ruc}`, c);
    });
    return map;
  }, [safeClients]);

  // Lista de meses con formato
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

  // 1. Procesar todas las transacciones de pagos confirmados
  // Detecta exactamente el mes al que corresponde el pago (adelanto, periodo de servicio o fecha de pago)
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
      tarifaBase: number;
      monto: number;
      fechaPago: string;
      fechaPagoDate: Date | null;
      periodoInicio: string;
      periodoFin: string;
      targetMonthKey: string; // YYYY-MM del mes al que pertenece el cobro
      targetMonthLabel: string;
      tipoOperacion: 'ALTA' | 'RENOVACION' | 'PRORRATEO' | 'ADELANTO' | 'PAGO_GENERAL';
      tipoOperacionLabel: string;
      badgeColor: string;
      medioPago: string;
      codigoOperacion: string;
      observaciones: string;
      isAdelanto: boolean;
      estadoCuenta: string;
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

      // Fechas
      const fPagoRaw = p?.fechaPago || p?.fechaRegistro;
      const fInicioRaw = p?.periodoInicio || p?.venta?.periodoInicio || p?.venta?.fechaVenta || fPagoRaw;
      const fFinRaw = p?.periodoFin || p?.venta?.periodoFin;

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

      const datePago = parseDateSafe(fPagoRaw);
      const dateInicio = parseDateSafe(fInicioRaw);

      // Determinar mes objetivo (el mes que realmente cubre el pago)
      const dateTarget = dateInicio || datePago || new Date();
      const targetMonthKey = `${dateTarget.getFullYear()}-${String(dateTarget.getMonth() + 1).padStart(2, '0')}`;

      // Tipo de operación y adelanto
      const obs = String(p?.observaciones || p?.codigoOperacion || '').toLowerCase();
      const rawTipoVenta = (p?.venta?.tipoVenta || p?.tipoVenta || '').toUpperCase();
      const isProrr = obs.includes('prorrat') || p?.tipoProrrateo === 'SEGUNDO_PRORRATEO' || p?.tipoProrrateo === 'PRIMER_PRORRATEO';
      
      // Detección de adelanto: si la fecha de pago es anterior al mes del periodo o dice 'adelanto'
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
        tipoOperacionLabel = 'Adelanto de Pago';
        badgeColor = 'bg-primary text-white';
      } else if (rawTipoVenta === 'ALTA' || obs.includes('alta') || obs.includes('inicial')) {
        tipoOperacion = 'ALTA';
        tipoOperacionLabel = 'Pago Inicial / Alta';
        badgeColor = 'bg-success text-white';
      } else if (isProrr) {
        tipoOperacion = 'PRORRATEO';
        tipoOperacionLabel = 'Cobro Prorrateo';
        badgeColor = 'bg-warning text-dark';
      } else if (rawTipoVenta === 'CAMBIO_PLAN' || rawTipoVenta === 'MEJORA_PLAN') {
        tipoOperacion = 'PAGO_GENERAL';
        tipoOperacionLabel = 'Mejora / Cambio Plan';
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
        tarifaBase: Number(matchedClient?.montoMensual || matchedClient?.precioPlan || p?.monto || 29),
        monto: Number(p?.monto || 0),
        fechaPago: datePago ? datePago.toLocaleDateString('es-PE') : '—',
        fechaPagoDate: datePago,
        periodoInicio: dateInicio ? dateInicio.toLocaleDateString('es-PE') : '—',
        periodoFin: fFinRaw ? (parseDateSafe(fFinRaw)?.toLocaleDateString('es-PE') || '—') : '—',
        targetMonthKey,
        targetMonthLabel: formatMonthLabel(targetMonthKey),
        tipoOperacion,
        tipoOperacionLabel,
        badgeColor,
        medioPago: p?.medioPago || 'YAPE',
        codigoOperacion: p?.codigoOperacion || '—',
        observaciones: p?.observaciones || (isAdelanto ? 'Adelanto aplicado a este período' : 'Pago verificado en sistema'),
        isAdelanto,
        estadoCuenta: matchedClient?.estadoCuenta || 'HABILITADO'
      });
    });

    // Ordenar de más reciente a más antiguo
    list.sort((a, b) => {
      const tA = a.fechaPagoDate ? a.fechaPagoDate.getTime() : 0;
      const tB = b.fechaPagoDate ? b.fechaPagoDate.getTime() : 0;
      return tB - tA;
    });

    return list;
  }, [safePayments, clientMap]);

  // 2. Extraer lista única de todos los meses registrados
  const availableMonthKeys = useMemo(() => {
    const setM = new Set<string>();
    allParsedPayments.forEach((p) => setM.add(p.targetMonthKey));
    
    // Asegurar que el mes actual y previo existan
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

  // 3. Pagos correspondientes al mes seleccionado
  const paymentsForSelectedMonth = useMemo(() => {
    if (!selectedMonth) return [];
    return allParsedPayments.filter((p) => p.targetMonthKey === selectedMonth);
  }, [allParsedPayments, selectedMonth]);

  // 4. Clientes activos en el mes seleccionado (excluyendo bloqueados)
  // Permite distinguir el total de clientes activos de la cartera en dicho mes, anuales y mensuales
  const monthlyMetrics = useMemo(() => {
    const pagosMes = paymentsForSelectedMonth;
    const totalRecaudado = pagosMes.reduce((acc, p) => acc + p.monto, 0);

    // Conteo y montos por tipo
    const pagosMensuales = pagosMes.filter((p) => p.tipoSuscripcion === 'MENSUAL');
    const pagosAnuales = pagosMes.filter((p) => p.tipoSuscripcion === 'ANUAL');
    const pagosAdelanto = pagosMes.filter((p) => p.isAdelanto);
    const pagosProrrateo = pagosMes.filter((p) => p.tipoOperacion === 'PRORRATEO');
    const pagosAltas = pagosMes.filter((p) => p.tipoOperacion === 'ALTA');
    const pagosRenovaciones = pagosMes.filter((p) => p.tipoOperacion === 'RENOVACION');

    // Clientes únicos que pagaron en el mes
    const uniqueClientsPaid = new Set<string>();
    pagosMes.forEach((p) => uniqueClientsPaid.add(p.clienteId || p.ruc));

    // Clientes activos no bloqueados registrados hasta ese mes
    let activosTotales = 0;
    let activosMensuales = 0;
    let activosAnuales = 0;

    const [sY, sM] = (selectedMonth || '2026-11').split('-').map(Number);
    const finDelMesSel = new Date(sY, sM, 0, 23, 59, 59);

    safeClients.forEach((c) => {
      const st = (c.estadoCuenta || '').toUpperCase();
      if (st === 'BLOQUEADO' || st === 'SUSPENDIDO') return;

      const fReg = c.fechaRegistro ? new Date(c.fechaRegistro) : null;
      if (fReg && fReg > finDelMesSel) return; // Se registró después de este mes

      activosTotales++;
      const isAnual = (c.tipoSuscripcion || '').toUpperCase() === 'ANUAL';
      if (isAnual) {
        activosAnuales++;
      } else {
        activosMensuales++;
      }
    });

    return {
      totalRecaudado,
      activosTotales: Math.max(activosTotales, uniqueClientsPaid.size),
      activosMensuales,
      activosAnuales,
      pagosCount: pagosMes.length,
      mensualesTotal: pagosMensuales.reduce((acc, p) => acc + p.monto, 0),
      mensualesCount: pagosMensuales.length,
      anualesTotal: pagosAnuales.reduce((acc, p) => acc + p.monto, 0),
      anualesCount: pagosAnuales.length,
      adelantoTotal: pagosAdelanto.reduce((acc, p) => acc + p.monto, 0),
      adelantoCount: pagosAdelanto.length,
      prorrateoTotal: pagosProrrateo.reduce((acc, p) => acc + p.monto, 0),
      prorrateoCount: pagosProrrateo.length,
      altasTotal: pagosAltas.reduce((acc, p) => acc + p.monto, 0),
      altasCount: pagosAltas.length,
      renovacionesTotal: pagosRenovaciones.reduce((acc, p) => acc + p.monto, 0),
      renovacionesCount: pagosRenovaciones.length,
    };
  }, [paymentsForSelectedMonth, safeClients, selectedMonth]);

  // 5. Filtrar pagos en la tabla según buscador, asesor, tipo y concepto
  const filteredTablePayments = useMemo(() => {
    return paymentsForSelectedMonth.filter((p) => {
      if (selectedVendedor !== 'ALL' && p.asesor !== selectedVendedor) return false;
      if (selectedTipoPlan !== 'ALL' && p.tipoSuscripcion !== selectedTipoPlan) return false;
      if (selectedConcepto !== 'ALL' && p.tipoOperacion !== selectedConcepto) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match =
          p.ruc.toLowerCase().includes(q) ||
          p.razonSocial.toLowerCase().includes(q) ||
          p.nombreComercial.toLowerCase().includes(q) ||
          p.planNombre.toLowerCase().includes(q) ||
          p.codigoOperacion.toLowerCase().includes(q) ||
          p.asesor.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [paymentsForSelectedMonth, selectedVendedor, selectedTipoPlan, selectedConcepto, searchQuery]);

  // Exportar Excel Oficial utilizando el servicio de Python
  const handleDownloadOfficialExcel = async () => {
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
        alert('No se pudo generar el reporte con Python. Verifique la conexión al servidor.');
      }
    } catch (err) {
      console.error('Error descargando Excel:', err);
    } finally {
      setIsExportingExcel(false);
    }
  };

  return (
    <div className="admin-module admin-module--reportes">
      {/* 1. BARRA SUPERIOR: TÍTULO, SELECTOR DE MES Y ACCIONES */}
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4 pb-2 border-bottom">
        <div>
          <h4 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
            <FileSpreadsheet className="text-primary" size={24} />
            <span>Reporte Mensual de Facturación y Pagos</span>
          </h4>
          <p className="text-muted small mb-0">
            Control exacto mes a mes de cobros, clientes activos (anuales y mensuales), adelantos y prorrateos.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2.5 flex-wrap">
          {/* Selector de Mes */}
          <div className="d-flex align-items-center gap-2 bg-white px-3 py-1.5 rounded-3 border shadow-xs">
            <Calendar size={16} className="text-primary" />
            <span className="small fw-bold text-muted">Mes a Auditar:</span>
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
            onClick={handleDownloadOfficialExcel}
            disabled={isExportingExcel}
            className="btn btn-success btn-sm d-flex align-items-center gap-2 px-3 py-2 rounded-3 shadow-xs fw-bold"
            title="Exportar archivo XLSX multi-hoja generado con Python"
          >
            {isExportingExcel ? <RefreshCw size={15} className="spin-anim" /> : <FileSpreadsheet size={15} />}
            <span>{isExportingExcel ? 'Generando Excel...' : 'Exportar Excel Oficial'}</span>
          </button>
        </div>
      </div>

      {/* 2. TARJETAS DE INDICADORES (ESTILO DE LA IMAGEN) */}
      <div className="row g-3 mb-4">
        {/* Card 1: Resumen del Mes Seleccionado (Idéntico a la imagen) */}
        <div className="col-12 col-md-6 col-xl-4">
          <div
            className="card h-100 shadow-sm border-0 p-3.5"
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid #E5E7EB',
            }}
          >
            <div className="d-flex justify-content-between align-items-start mb-2">
              <span className="fw-bold text-primary" style={{ fontSize: '1.05rem' }}>
                Resumen {formatMonthLabel(selectedMonth)}
              </span>
              <span
                className="p-2 rounded-3 d-flex align-items-center justify-content-center"
                style={{ backgroundColor: '#EEF2FF', color: '#4338CA' }}
              >
                <Calendar size={18} strokeWidth={2.2} />
              </span>
            </div>

            <div className="fw-bolder text-primary mb-3" style={{ fontSize: '2.1rem', letterSpacing: '-0.5px' }}>
              S/ {monthlyMetrics.totalRecaudado.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>

            <div className="d-flex flex-column gap-1.5 pt-2 border-top" style={{ fontSize: '0.86rem' }}>
              <div className="d-flex justify-content-between align-items-center">
                <span className="text-muted">Renovaciones ({monthlyMetrics.renovacionesCount}):</span>
                <strong className="text-dark">S/ {monthlyMetrics.renovacionesTotal.toFixed(2)}</strong>
              </div>
              <div className="d-flex justify-content-between align-items-center">
                <span className="text-muted">Prorrateos ({monthlyMetrics.prorrateoCount}):</span>
                <strong className="text-primary">S/ {monthlyMetrics.prorrateoTotal.toFixed(2)}</strong>
              </div>
              <div className="d-flex justify-content-between align-items-center">
                <span className="text-muted">Adelantos ({monthlyMetrics.adelantoCount}):</span>
                <strong className="text-success">S/ {monthlyMetrics.adelantoTotal.toFixed(2)}</strong>
              </div>
              <div className="d-flex justify-content-between align-items-center">
                <span className="text-muted">Afiliaciones / Altas ({monthlyMetrics.altasCount}):</span>
                <strong className="text-dark">S/ {monthlyMetrics.altasTotal.toFixed(2)}</strong>
              </div>

              <div className="text-muted small mt-2 pt-2 border-top d-flex align-items-center gap-1.5" style={{ fontSize: '0.78rem' }}>
                <Check size={14} className="text-success" />
                <span>
                  <strong>{monthlyMetrics.pagosCount} pagos</strong> procesados en este mes
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Clientes Activos del Mes (Total, Anuales y Mensuales) */}
        <div className="col-12 col-md-6 col-xl-4">
          <div
            className="card h-100 shadow-sm border-0 p-3.5"
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid #E5E7EB',
            }}
          >
            <div className="d-flex justify-content-between align-items-start mb-2">
              <span className="fw-bold text-dark" style={{ fontSize: '1.05rem' }}>
                Clientes Activos ({formatMonthLabel(selectedMonth)})
              </span>
              <span
                className="p-2 rounded-3 d-flex align-items-center justify-content-center"
                style={{ backgroundColor: '#F0FDF4', color: '#16A34A' }}
              >
                <Users size={18} strokeWidth={2.2} />
              </span>
            </div>

            <div className="fw-bolder text-dark mb-3" style={{ fontSize: '2.1rem', letterSpacing: '-0.5px' }}>
              {monthlyMetrics.activosTotales} <span className="fs-6 text-muted fw-normal">clientes activos</span>
            </div>

            <div className="d-flex flex-column gap-1.5 pt-2 border-top" style={{ fontSize: '0.86rem' }}>
              <div className="d-flex justify-content-between align-items-center">
                <span className="text-muted">Planes Mensuales:</span>
                <strong className="text-dark">{monthlyMetrics.activosMensuales} activos</strong>
              </div>
              <div className="d-flex justify-content-between align-items-center">
                <span className="text-muted">Planes Anuales:</span>
                <strong className="text-dark">{monthlyMetrics.activosAnuales} activos</strong>
              </div>
              <div className="d-flex justify-content-between align-items-center">
                <span className="text-muted">Cobrado en Anuales este mes:</span>
                <strong className="text-success">S/ {monthlyMetrics.anualesTotal.toFixed(2)}</strong>
              </div>
              <div className="d-flex justify-content-between align-items-center">
                <span className="text-muted">Cobrado en Mensuales este mes:</span>
                <strong className="text-primary">S/ {monthlyMetrics.mensualesTotal.toFixed(2)}</strong>
              </div>

              <div className="text-muted small mt-2 pt-2 border-top d-flex align-items-center gap-1.5" style={{ fontSize: '0.78rem' }}>
                <Check size={14} className="text-success" />
                <span>Excluye bloqueados y anuales no correspondientes a este mes</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Previa Proyectada Próximo Mes (Calculada con Python) */}
        <div className="col-12 col-md-12 col-xl-4">
          <div
            className="card h-100 shadow-sm border-0 p-3.5"
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid #E5E7EB',
            }}
          >
            <div className="d-flex justify-content-between align-items-start mb-2">
              <span className="fw-bold text-primary" style={{ fontSize: '1.05rem' }}>
                Previa {proyeccionData?.periodo_proyectado || 'Próximo Mes'}
              </span>
              <span
                className="p-2 rounded-3 d-flex align-items-center justify-content-center"
                style={{ backgroundColor: '#EEF2FF', color: '#4338CA' }}
              >
                <Calendar size={18} strokeWidth={2.2} />
              </span>
            </div>

            <div className="fw-bolder text-primary mb-3" style={{ fontSize: '2.1rem', letterSpacing: '-0.5px' }}>
              {loadingProyeccion ? (
                <span className="fs-5 text-muted fw-normal">Calculando...</span>
              ) : (
                `S/ ${(proyeccionData?.total_proyectado || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              )}
            </div>

            <div className="d-flex flex-column gap-1.5 pt-2 border-top" style={{ fontSize: '0.86rem' }}>
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

              <div className="text-muted small mt-2 pt-2 border-top d-flex align-items-center gap-1.5" style={{ fontSize: '0.78rem' }}>
                <Check size={14} className="text-success" />
                <span>Planes activos ({proyeccionData?.clientes_no_bloqueados || 0} sin bloqueados)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. TABLA DE PAGOS Y COBROS DEL MES */}
      <div className="card shadow-sm border-0 rounded-4 overflow-hidden mb-4">
        {/* Cabecera y Filtros de la Tabla */}
        <div className="p-3.5 bg-white border-bottom">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-3">
            <div className="d-flex align-items-center gap-2">
              <CreditCard size={18} className="text-primary" />
              <h6 className="fw-bold text-dark mb-0">
                Detalle de Pagos Recibidos en {formatMonthLabel(selectedMonth)}
              </h6>
              <span className="badge bg-primary-subtle text-primary fw-bold rounded-pill px-2.5 py-0.5">
                {filteredTablePayments.length} registros
              </span>
            </div>

            <div className="text-muted small">
              Total en vista:{' '}
              <strong className="text-dark">
                S/ {filteredTablePayments.reduce((acc, p) => acc + p.monto, 0).toFixed(2)}
              </strong>
            </div>
          </div>

          <div className="row g-2 align-items-center">
            {/* Buscador */}
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

            {/* Filtro por Asesor */}
            <div className="col-6 col-md-3">
              <select
                className="form-select form-select-sm"
                value={selectedVendedor}
                onChange={(e) => setSelectedVendedor(e.target.value)}
              >
                <option value="ALL">Todos los Asesores</option>
                {uniqueSellers.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro por Tipo de Plan */}
            <div className="col-6 col-md-2">
              <select
                className="form-select form-select-sm"
                value={selectedTipoPlan}
                onChange={(e) => setSelectedTipoPlan(e.target.value as any)}
              >
                <option value="ALL">Mensual / Anual</option>
                <option value="MENSUAL">Solo Mensuales</option>
                <option value="ANUAL">Solo Anuales</option>
              </select>
            </div>

            {/* Filtro por Concepto */}
            <div className="col-6 col-md-2">
              <select
                className="form-select form-select-sm"
                value={selectedConcepto}
                onChange={(e) => setSelectedConcepto(e.target.value)}
              >
                <option value="ALL">Todos los Conceptos</option>
                <option value="RENOVACION">Renovación</option>
                <option value="PRORRATEO">Prorrateo</option>
                <option value="ADELANTO">Adelanto</option>
                <option value="ALTA">Alta / Inicial</option>
              </select>
            </div>

            {/* Limpiar */}
            <div className="col-6 col-md-1 text-end">
              <button
                className="btn btn-outline-secondary btn-sm w-100 py-1"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedVendedor('ALL');
                  setSelectedTipoPlan('ALL');
                  setSelectedConcepto('ALL');
                }}
                title="Limpiar filtros"
              >
                <RotateCcw size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* Tabla Responsiva */}
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.86rem' }}>
            <thead className="table-light text-muted small text-uppercase" style={{ letterSpacing: '0.5px' }}>
              <tr>
                <th className="ps-3 py-2.5">Cliente / Razón Social</th>
                <th className="py-2.5">RUC</th>
                <th className="py-2.5">Plan / Suscripción</th>
                <th className="py-2.5 text-center">Fecha Pago</th>
                <th className="py-2.5 text-center">Período de Servicio</th>
                <th className="py-2.5">Concepto</th>
                <th className="py-2.5">Asesor</th>
                <th className="py-2.5 text-end pe-3">Monto Pagado</th>
              </tr>
            </thead>
            <tbody>
              {filteredTablePayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-5 text-muted">
                    <AlertTriangle size={24} className="mb-2 text-warning d-block mx-auto" />
                    <span>No se encontraron pagos registrados para este mes con los filtros aplicados.</span>
                  </td>
                </tr>
              ) : (
                filteredTablePayments.map((p) => (
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
                    <td className="py-2.5 text-center text-muted">{p.fechaPago}</td>
                    <td className="py-2.5 text-center">
                      <span className="small fw-semibold text-dark">
                        {p.periodoInicio} al {p.periodoFin}
                      </span>
                    </td>
                    <td className="py-2.5">
                      <span className={`badge ${p.badgeColor} rounded-pill px-2.5 py-1`} style={{ fontSize: '0.72rem' }}>
                        {p.tipoOperacionLabel}
                      </span>
                      {p.isAdelanto && (
                        <small className="d-block text-primary fw-semibold mt-0.5" style={{ fontSize: '0.7rem' }}>
                          Adelantado
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
            {filteredTablePayments.length > 0 && (
              <tfoot className="table-light border-top">
                <tr className="fw-bold">
                  <td colSpan={7} className="ps-3 py-2.5 text-uppercase" style={{ fontSize: '0.8rem' }}>
                    Total Pagado en {formatMonthLabel(selectedMonth)}:
                  </td>
                  <td className="text-end pe-3 py-2.5 text-primary" style={{ fontSize: '1rem' }}>
                    S/ {filteredTablePayments.reduce((acc, p) => acc + p.monto, 0).toFixed(2)}
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
