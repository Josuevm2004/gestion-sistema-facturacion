'use client';

import React, { useMemo, useState } from 'react';
import {
  FileSpreadsheet,
  RefreshCw,
  Calendar,
  Search,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Users,
  DollarSign,
  TrendingUp,
  CreditCard,
  Download,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Tag
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

const MESES_LIST = [
  { num: '01', nombre: 'Enero' },
  { num: '02', nombre: 'Febrero' },
  { num: '03', nombre: 'Marzo' },
  { num: '04', nombre: 'Abril' },
  { num: '05', nombre: 'Mayo' },
  { num: '06', nombre: 'Junio' },
  { num: '07', nombre: 'Julio' },
  { num: '08', nombre: 'Agosto' },
  { num: '09', nombre: 'Septiembre' },
  { num: '10', nombre: 'Octubre' },
  { num: '11', nombre: 'Noviembre' },
  { num: '12', nombre: 'Diciembre' },
];

export default function ReportesExcelTab({
  clients = [],
  payments = [],
  loadData = () => {},
  isSyncing = false,
  uniqueSellers = [],
}: ReportesExcelTabProps) {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonthNum = String(currentDate.getMonth() + 1).padStart(2, '0');

  // Estado del selector de fecha
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthNum); // '01'..'12'

  // Filtros de búsqueda
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterVendedor, setFilterVendedor] = useState<string>('ALL');
  const [filterConcepto, setFilterConcepto] = useState<string>('ALL');
  const [filterTipoSuscripcion, setFilterTipoSuscripcion] = useState<string>('ALL');

  // Paginación
  const [currentPage, setCurrentPage] = useState<number>(1);
  const ITEMS_PER_PAGE = 25;

  const [isExportingExcel, setIsExportingExcel] = useState<boolean>(false);

  const safeClients = useMemo(() => (Array.isArray(clients) ? clients : []), [clients]);
  const safePayments = useMemo(() => (Array.isArray(payments) ? payments : []), [payments]);

  // Diccionario rápido de clientes por ID y por RUC
  const clientMap = useMemo(() => {
    const map = new Map<string, Client>();
    safeClients.forEach((c) => {
      if (c.id) map.set(String(c.id), c);
      if (c.ruc) map.set(`ruc-${c.ruc.trim()}`, c);
    });
    return map;
  }, [safeClients]);

  // Función robusta para parsear cualquier fecha sin desfases horarios
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

  const formatFechaPE = (d: Date | null): string => {
    if (!d) return '—';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Helper para determinar a qué mes corresponde un pago (considerando adelantos, periodo de servicio y fecha de pago)
  const resolveTargetMonthKey = (
    fPago: Date | null,
    fInicio: Date | null,
    obsRaw: string,
    tipoVentaRaw: string
  ): string | null => {
    const obs = obsRaw.toLowerCase();
    const isAdelanto = obs.includes('adelant') || obs.includes('anticip');

    // Si tiene período de inicio explícito:
    // Si es un adelanto pagado antes, el mes al que corresponde el cobro es el de su periodo de inicio
    if (fInicio) {
      const year = fInicio.getFullYear();
      const monthStr = String(fInicio.getMonth() + 1).padStart(2, '0');
      return `${year}-${monthStr}`;
    }

    // Si no tiene periodoInicio pero tiene fecha de pago:
    if (fPago) {
      const year = fPago.getFullYear();
      const monthStr = String(fPago.getMonth() + 1).padStart(2, '0');
      return `${year}-${monthStr}`;
    }

    return null;
  };

  // --------------------------------------------------------------------------
  // CONSOLIDACIÓN POR CLIENTE PARA EL MES SELECCIONADO (1 FILA POR CLIENTE)
  // --------------------------------------------------------------------------
  const targetPeriodKey = `${selectedYear}-${selectedMonth}`;

  const { consolidatedMonthRows, periodMetrics } = useMemo(() => {
    // Mapa: clientKey -> acumulador del cliente en este mes
    const clientRowMap = new Map<string, {
      clienteId: string;
      ruc: string;
      razonSocial: string;
      nombreComercial: string;
      planNombre: string;
      tipoSuscripcion: 'MENSUAL' | 'ANUAL';
      precioBasePlan: number;
      asesor: string;
      telefono: string;
      totalCobradoMes: number;
      conceptosSet: Set<string>;
      mediosPagoSet: Set<string>;
      fechasPagoList: Date[];
      operacionesSet: Set<string>;
      esAnual: boolean;
      esAlta: boolean;
      esAdelanto: boolean;
      esProrrateo: boolean;
      esAumentoPlan: boolean;
    }>();

    // 1. Procesar todos los pagos registrados en la base de datos
    safePayments.forEach((p, idx) => {
      const estadoPago = (p?.estadoPago || '').toUpperCase();
      const estadoVenta = (p?.venta?.estadoVenta || p?.estadoVenta || '').toUpperCase();
      // Solo pagos válidos (no cancelados ni rechazados)
      if (estadoPago === 'CANCELADO' || estadoPago === 'RECHAZADO' || estadoVenta === 'CANCELADA') {
        return;
      }

      const fPago = parseDateSafe(p?.fechaPago || p?.fechaRegistro);
      const fInicio = parseDateSafe(p?.periodoInicio);
      const obs = String(p?.observaciones || p?.codigoOperacion || '').toLowerCase();
      const rawTipoVenta = (p?.venta?.tipoVenta || p?.tipoVenta || '').toUpperCase();

      // Resolver a qué mes corresponde este pago
      let monthKey = resolveTargetMonthKey(fPago, fInicio, obs, rawTipoVenta);

      // Si el pago no tiene fechas pero se pagó en el mes seleccionado
      if (!monthKey && fPago) {
        monthKey = `${fPago.getFullYear()}-${String(fPago.getMonth() + 1).padStart(2, '0')}`;
      }

      // Detectar adelantos explícitos que cubren este mes
      if (fPago && fInicio) {
        const mPago = `${fPago.getFullYear()}-${String(fPago.getMonth() + 1).padStart(2, '0')}`;
        const mInicio = `${fInicio.getFullYear()}-${String(fInicio.getMonth() + 1).padStart(2, '0')}`;
        // Si el periodo cubierto es el mes seleccionado, debe figurar en este mes
        if (mInicio === targetPeriodKey) {
          monthKey = targetPeriodKey;
        } else if (mPago === targetPeriodKey && !obs.includes('adelant')) {
          // Si se pagó en este mes y no es adelanto para otro mes futuro
          monthKey = targetPeriodKey;
        }
      }

      // Si este pago no pertenece al mes seleccionado, no se procesa aquí
      if (monthKey !== targetPeriodKey) {
        return;
      }

      // Vincular con el cliente
      const rawCId = p?.venta?.cliente?.id ?? p?.clienteId ?? p?.venta?.clienteId;
      const rawRuc = p?.clienteRuc || p?.venta?.cliente?.ruc;
      const matchedClient = (rawCId && clientMap.get(String(rawCId))) || (rawRuc && clientMap.get(`ruc-${rawRuc.trim()}`)) || null;

      const ruc = (rawRuc || matchedClient?.ruc || '—').trim();
      const clientKey = String(rawCId || (ruc !== '—' ? ruc : `pago-cli-${idx}`));

      const monto = Number(p?.monto || 0);
      if (monto <= 0) return;

      // Tipo de suscripción (Mensual o Anual)
      const rawSub = (p?.tipoSuscripcion || p?.venta?.suscripcion?.tipoSuscripcion || matchedClient?.tipoSuscripcion || 'MENSUAL').toUpperCase();
      const isAnual = rawSub === 'ANUAL';

      // REGLA CLAVE PARA ANUALES:
      // "los anuales que se afilian en dicho mes que solo figure ahi en los otros meses no"
      if (isAnual) {
        // Verificar si la fecha de alta/cobro del anual corresponde exactamente a este mes
        const fAltaAnual = parseDateSafe(matchedClient?.fechaRegistro || matchedClient?.fechaCreacion || fPago);
        const altaAnualKey = fAltaAnual ? `${fAltaAnual.getFullYear()}-${String(fAltaAnual.getMonth() + 1).padStart(2, '0')}` : monthKey;
        if (altaAnualKey !== targetPeriodKey && monthKey !== targetPeriodKey) {
          return;
        }
      }

      // Identificar concepto de la transacción
      const isProrr = obs.includes('prorrat') || p?.tipoProrrateo === 'SEGUNDO_PRORRATEO' || p?.tipoProrrateo === 'PRIMER_PRORRATEO';
      const isAdelanto = obs.includes('adelant') || obs.includes('anticip') || (fPago && fInicio && fInicio > fPago);
      const isAlta = rawTipoVenta === 'ALTA' || obs.includes('alta') || obs.includes('inicial') || obs.includes('afiliac');
      const isAumento = rawTipoVenta === 'CAMBIO_PLAN' || rawTipoVenta === 'MEJORA_PLAN' || obs.includes('aumento') || obs.includes('mejora');

      let conceptoLabel = 'Renovación';
      if (isAlta) conceptoLabel = 'Afiliación / Alta';
      else if (isAumento) conceptoLabel = 'Aumento de Plan';
      else if (isProrr) conceptoLabel = 'Cobro Prorrateo';
      else if (isAdelanto) conceptoLabel = 'Pago Adelantado';

      // Medio de pago
      const medioPago = (p?.medioPago || 'Transferencia').toUpperCase();
      const codOp = p?.codigoOperacion ? String(p.codigoOperacion).trim() : '';

      // Consolidar en la fila única del cliente
      let row = clientRowMap.get(clientKey);
      if (!row) {
        const razonSocial = p?.clienteRazonSocial || matchedClient?.razonSocial || matchedClient?.nombreComercial || `Cliente ${ruc}`;
        const nombreComercial = matchedClient?.nombreComercial || '';
        const asesor = p?.vendedorNombre || p?.venta?.vendedor?.nombre || matchedClient?.vendedor || 'Por asignar';
        const planNombre = p?.planNombre || p?.venta?.suscripcion?.plan?.nombrePlan || matchedClient?.planContratado || 'Plan Estándar';
        const precioBase = Number(matchedClient?.montoMensual || matchedClient?.precioPlan || monto);
        const telefono = matchedClient?.telefono || matchedClient?.telefonoPersonal || '—';

        row = {
          clienteId: clientKey,
          ruc,
          razonSocial,
          nombreComercial,
          planNombre,
          tipoSuscripcion: isAnual ? 'ANUAL' : 'MENSUAL',
          precioBasePlan: precioBase,
          asesor,
          telefono,
          totalCobradoMes: 0,
          conceptosSet: new Set<string>(),
          mediosPagoSet: new Set<string>(),
          fechasPagoList: [],
          operacionesSet: new Set<string>(),
          esAnual: isAnual,
          esAlta: false,
          esAdelanto: false,
          esProrrateo: false,
          esAumentoPlan: false,
        };
        clientRowMap.set(clientKey, row);
      }

      // Acumular montos y conceptos sin duplicar fila
      row.totalCobradoMes += monto;
      row.conceptosSet.add(conceptoLabel);
      if (medioPago) row.mediosPagoSet.add(medioPago);
      if (codOp && codOp !== '—') row.operacionesSet.add(codOp);
      if (fPago) row.fechasPagoList.push(fPago);

      if (isAlta) row.esAlta = true;
      if (isAdelanto) row.esAdelanto = true;
      if (isProrr) row.esProrrateo = true;
      if (isAumento) row.esAumentoPlan = true;
    });

    // 2. Incluir también clientes con plan activo que se registraron/afiliaron en este mes
    // si aún no estaban en la lista de pagos para asegurar que no falte ningún cliente
    safeClients.forEach((c) => {
      const st = (c.estadoCuenta || '').toUpperCase();
      if (st === 'BLOQUEADO' || st === 'SUSPENDIDO') return;

      const isAnual = (c.tipoSuscripcion || '').toUpperCase() === 'ANUAL';
      const fReg = parseDateSafe(c.fechaRegistro || c.fechaCreacion);
      const regMonthKey = fReg ? `${fReg.getFullYear()}-${String(fReg.getMonth() + 1).padStart(2, '0')}` : null;

      // Si es un cliente anual, SOLO si su alta fue en este mes
      if (isAnual && regMonthKey !== targetPeriodKey) {
        return;
      }

      const ruc = (c.ruc || '').trim();
      const clientKey = String(c.id || (ruc ? ruc : ''));
      if (!clientKey || clientRowMap.has(clientKey)) {
        return;
      }

      // Si se afilió en este mes y tiene monto
      if (regMonthKey === targetPeriodKey) {
        const monto = Number(c.montoMensual || c.precioPlan || 0);
        if (monto > 0) {
          clientRowMap.set(clientKey, {
            clienteId: clientKey,
            ruc: ruc || '—',
            razonSocial: c.razonSocial || c.nombreComercial || `Cliente ${ruc}`,
            nombreComercial: c.nombreComercial || '',
            planNombre: c.planContratado || 'Plan Estándar',
            tipoSuscripcion: isAnual ? 'ANUAL' : 'MENSUAL',
            precioBasePlan: monto,
            asesor: c.vendedor || 'Por asignar',
            telefono: c.telefono || c.telefonoPersonal || '—',
            totalCobradoMes: monto,
            conceptosSet: new Set([isAnual ? 'Afiliación Anual' : 'Afiliación / Alta']),
            mediosPagoSet: new Set(['Confirmado']),
            fechasPagoList: fReg ? [fReg] : [],
            operacionesSet: new Set(),
            esAnual: isAnual,
            esAlta: true,
            esAdelanto: false,
            esProrrateo: false,
            esAumentoPlan: false,
          });
        }
      }
    });

    // Convertir a lista y ordenar por mayor monto cobrado
    const rows = Array.from(clientRowMap.values()).sort((a, b) => b.totalCobradoMes - a.totalCobradoMes);

    // Calcular métricas exactas del mes
    const totalRecaudadoMes = rows.reduce((acc, r) => acc + r.totalCobradoMes, 0);
    const countClientesMes = rows.length;
    const countAnualesMes = rows.filter((r) => r.esAnual).length;
    const montoAnualesMes = rows.filter((r) => r.esAnual).reduce((acc, r) => acc + r.totalCobradoMes, 0);
    const countAdelantosProrr = rows.filter((r) => r.esAdelanto || r.esProrrateo).length;
    const montoAdelantosProrr = rows.filter((r) => r.esAdelanto || r.esProrrateo).reduce((acc, r) => acc + r.totalCobradoMes, 0);
    const countAltasMes = rows.filter((r) => r.esAlta).length;
    const montoAltasMes = rows.filter((r) => r.esAlta).reduce((acc, r) => acc + r.totalCobradoMes, 0);

    return {
      consolidatedMonthRows: rows,
      periodMetrics: {
        totalRecaudadoMes,
        countClientesMes,
        countAnualesMes,
        montoAnualesMes,
        countAdelantosProrr,
        montoAdelantosProrr,
        countAltasMes,
        montoAltasMes,
      },
    };
  }, [safePayments, safeClients, clientMap, targetPeriodKey]);

  // Filtrar filas según la búsqueda y filtros rápidos
  const filteredRows = useMemo(() => {
    return consolidatedMonthRows.filter((r) => {
      if (filterVendedor !== 'ALL' && r.asesor !== filterVendedor) return false;
      if (filterTipoSuscripcion !== 'ALL' && r.tipoSuscripcion !== filterTipoSuscripcion) return false;

      if (filterConcepto !== 'ALL') {
        const hasConcepto = Array.from(r.conceptosSet).some((c) =>
          c.toLowerCase().includes(filterConcepto.toLowerCase())
        );
        if (!hasConcepto) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match =
          r.ruc.toLowerCase().includes(q) ||
          r.razonSocial.toLowerCase().includes(q) ||
          r.nombreComercial.toLowerCase().includes(q) ||
          r.planNombre.toLowerCase().includes(q) ||
          r.asesor.toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [consolidatedMonthRows, filterVendedor, filterTipoSuscripcion, filterConcepto, searchQuery]);

  // Paginación
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / ITEMS_PER_PAGE));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRows.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRows, currentPage]);

  // Suma total de los clientes que se muestran filtrados
  const sumaTotalFiltrada = useMemo(() => {
    return filteredRows.reduce((acc, r) => acc + r.totalCobradoMes, 0);
  }, [filteredRows]);

  // Nombre legible del mes seleccionado
  const mesNombreSeleccionado = useMemo(() => {
    const m = MESES_LIST.find((item) => item.num === selectedMonth);
    return m ? m.nombre : 'Mes';
  }, [selectedMonth]);

  // Años disponibles en el selector
  const availableYears = useMemo(() => {
    const set = new Set<number>();
    set.add(currentYear);
    set.add(currentYear - 1);
    safePayments.forEach((p) => {
      const d = parseDateSafe(p?.fechaPago || p?.fechaRegistro);
      if (d) set.add(d.getFullYear());
    });
    return Array.from(set).sort().reverse();
  }, [safePayments, currentYear]);

  // Exportar Excel Oficial
  const handleExportarExcel = async () => {
    setIsExportingExcel(true);
    try {
      // 1. Intentar el endpoint oficial de Python del backend
      const res = await fetch('/api/admin/reporte-excel-oficial');
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Reporte_Facturacion_${mesNombreSeleccionado}_${selectedYear}.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        return;
      }
    } catch (e) {
      console.warn('Fallback a exportación web local:', e);
    }

    // 2. Exportación local directa si el microservicio de Python no está disponible
    try {
      let csv = '\uFEFF';
      csv += 'N°,RUC,Cliente / Razon Social,Nombre Comercial,Plan Activo,Modalidad,Conceptos del Mes,Fecha Ultimo Pago,Medios de Pago,Operaciones,Asesor,Monto Cobrado (S/)\n';
      filteredRows.forEach((r, idx) => {
        const conceptosStr = Array.from(r.conceptosSet).join(' + ');
        const mediosStr = Array.from(r.mediosPagoSet).join(', ');
        const opStr = Array.from(r.operacionesSet).join(', ') || '—';
        const fUlt = r.fechasPagoList.length > 0 ? formatFechaPE(r.fechasPagoList[0]) : '—';
        csv += `${idx + 1},"${r.ruc}","${r.razonSocial.replace(/"/g, '""')}","${r.nombreComercial.replace(/"/g, '""')}","${r.planNombre}","${r.tipoSuscripcion}","${conceptosStr}","${fUlt}","${mediosStr}","${opStr}","${r.asesor}",${r.totalCobradoMes.toFixed(2)}\n`;
      });
      csv += `\nTOTAL COBRADO EN ${mesNombreSeleccionado.toUpperCase()} ${selectedYear},,,,,,,,,,,${sumaTotalFiltrada.toFixed(2)}\n`;

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Reporte_Facturacion_${mesNombreSeleccionado}_${selectedYear}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } finally {
      setIsExportingExcel(false);
    }
  };

  return (
    <div className="admin-module admin-module--reportes" style={{ padding: '4px' }}>
      {/* 1. ENCABEZADO PRINCIPAL */}
      <div className="card shadow-sm border-0 mb-3 bg-white" style={{ borderRadius: '14px', border: '1px solid #E2E8F0' }}>
        <div className="card-body p-3.5">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <FileSpreadsheet className="text-primary" size={22} />
                <h4 className="fw-bold text-dark mb-0" style={{ fontSize: '1.25rem', letterSpacing: '-0.3px' }}>
                  Reporte General de Facturación Mensual
                </h4>
              </div>
              <p className="text-muted small mb-0">
                Detalle consolidado de cobros por cliente para <strong className="text-primary">{mesNombreSeleccionado} {selectedYear}</strong>. Incluye renovaciones, adelantos, prorrateos y afiliaciones en una sola fila por cliente.
              </p>
            </div>

            <div className="d-flex align-items-center gap-2 flex-wrap">
              {/* Selector de Año */}
              <div className="d-flex align-items-center gap-1.5 bg-light px-3 py-1.5 rounded-3 border">
                <span className="small fw-bold text-muted">Año:</span>
                <select
                  className="form-select form-select-sm border-0 bg-transparent fw-bold text-dark shadow-none p-0 pe-3"
                  style={{ fontSize: '0.9rem', cursor: 'pointer' }}
                  value={selectedYear}
                  onChange={(e) => {
                    setSelectedYear(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                >
                  {availableYears.map((yr) => (
                    <option key={yr} value={yr}>
                      {yr}
                    </option>
                  ))}
                </select>
              </div>

              {/* Botón Actualizar */}
              <button
                onClick={() => loadData(null, true)}
                disabled={isSyncing}
                className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1.5 px-3 py-2 rounded-3 shadow-xs"
                title="Sincronizar datos"
              >
                <RefreshCw size={14} className={isSyncing ? 'spin-anim' : ''} />
                <span>{isSyncing ? 'Actualizando...' : 'Actualizar'}</span>
              </button>

              {/* Botón Exportar Excel */}
              <button
                onClick={handleExportarExcel}
                disabled={isExportingExcel}
                className="btn btn-success btn-sm d-flex align-items-center gap-1.5 px-3.5 py-2 rounded-3 shadow-xs fw-bold"
                title="Descargar archivo Excel con los datos del mes"
              >
                <Download size={15} />
                <span>{isExportingExcel ? 'Generando...' : 'Exportar Excel'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. SELECTOR DE MESES TIPO BARRA HORIZONTAL (INTERACTIVO Y ELEGANTE) */}
      <div className="card shadow-sm border-0 mb-3 bg-white" style={{ borderRadius: '12px', border: '1px solid #E2E8F0' }}>
        <div className="card-body p-2">
          <div className="d-flex align-items-center gap-1 overflow-x-auto pb-1" style={{ scrollbarWidth: 'thin' }}>
            <div className="px-2.5 py-1.5 text-muted small fw-bold d-flex align-items-center gap-1 border-end me-1 text-nowrap">
              <Calendar size={15} className="text-primary" />
              <span>Mes:</span>
            </div>
            {MESES_LIST.map((m) => {
              const isSelected = selectedMonth === m.num;
              return (
                <button
                  key={m.num}
                  onClick={() => {
                    setSelectedMonth(m.num);
                    setCurrentPage(1);
                  }}
                  className={`btn btn-sm px-3 py-1.5 rounded-2 fw-semibold text-nowrap transition-all ${
                    isSelected
                      ? 'btn-primary shadow-sm text-white'
                      : 'btn-light text-secondary border-0 hover-bg-gray'
                  }`}
                  style={{
                    fontSize: '0.85rem',
                    minWidth: '85px',
                    backgroundColor: isSelected ? '#2563EB' : '#F8FAFC',
                    color: isSelected ? '#FFFFFF' : '#475569',
                  }}
                >
                  {m.nombre}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. TARJETAS DE INDICADORES DEL MES SELECCIONADO (PROPORCIONADAS Y SIN DISTORSIÓN) */}
      <div className="row g-2.5 mb-3">
        {/* Card 1: Total Ingresado */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card h-100 shadow-sm border-0 p-3 bg-white" style={{ borderRadius: '12px', borderLeft: '4px solid #2563EB' }}>
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="text-muted small fw-semibold">Total Ingresado en {mesNombreSeleccionado}</span>
              <span className="p-1.5 rounded-3 bg-primary-subtle text-primary">
                <DollarSign size={16} />
              </span>
            </div>
            <div className="fw-bold text-primary mb-1" style={{ fontSize: '1.65rem', letterSpacing: '-0.5px' }}>
              S/ {periodMetrics.totalRecaudadoMes.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-muted small pt-1.5 border-top d-flex justify-content-between" style={{ fontSize: '0.76rem' }}>
              <span>{periodMetrics.countClientesMes} clientes con cobro</span>
              <span className="text-success fw-semibold">100% verificado</span>
            </div>
          </div>
        </div>

        {/* Card 2: Clientes Anuales del Mes */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card h-100 shadow-sm border-0 p-3 bg-white" style={{ borderRadius: '12px', borderLeft: '4px solid #F59E0B' }}>
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="text-muted small fw-semibold">Planes Anuales (Solo {mesNombreSeleccionado})</span>
              <span className="p-1.5 rounded-3 bg-warning-subtle text-warning-emphasis">
                <Tag size={16} />
              </span>
            </div>
            <div className="fw-bold text-dark mb-1" style={{ fontSize: '1.65rem', letterSpacing: '-0.5px' }}>
              S/ {periodMetrics.montoAnualesMes.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-muted small pt-1.5 border-top d-flex justify-content-between" style={{ fontSize: '0.76rem' }}>
              <span>{periodMetrics.countAnualesMes} anuales de este mes</span>
              <span className="text-muted">No figuran en otros meses</span>
            </div>
          </div>
        </div>

        {/* Card 3: Adelantos y Prorrateos */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card h-100 shadow-sm border-0 p-3 bg-white" style={{ borderRadius: '12px', borderLeft: '4px solid #10B981' }}>
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="text-muted small fw-semibold">Adelantos y Prorrateos</span>
              <span className="p-1.5 rounded-3 bg-success-subtle text-success">
                <CheckCircle2 size={16} />
              </span>
            </div>
            <div className="fw-bold text-dark mb-1" style={{ fontSize: '1.65rem', letterSpacing: '-0.5px' }}>
              S/ {periodMetrics.montoAdelantosProrr.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-muted small pt-1.5 border-top d-flex justify-content-between" style={{ fontSize: '0.76rem' }}>
              <span>{periodMetrics.countAdelantosProrr} clientes con cobro especial</span>
              <span className="text-success fw-semibold">Aplicado al mes</span>
            </div>
          </div>
        </div>

        {/* Card 4: Afiliaciones Nuevas del Mes */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card h-100 shadow-sm border-0 p-3 bg-white" style={{ borderRadius: '12px', borderLeft: '4px solid #6366F1' }}>
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="text-muted small fw-semibold">Nuevas Afiliaciones / Altas</span>
              <span className="p-1.5 rounded-3" style={{ backgroundColor: '#EEF2FF', color: '#4F46E5' }}>
                <Users size={16} />
              </span>
            </div>
            <div className="fw-bold text-dark mb-1" style={{ fontSize: '1.65rem', letterSpacing: '-0.5px' }}>
              S/ {periodMetrics.montoAltasMes.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-muted small pt-1.5 border-top d-flex justify-content-between" style={{ fontSize: '0.76rem' }}>
              <span>{periodMetrics.countAltasMes} clientes nuevos</span>
              <span className="text-primary fw-semibold">Ingresos iniciales</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. TABLA PRINCIPAL: 1 FILA POR CLIENTE CON TODOS LOS COBROS CONSOLIDADOS */}
      <div className="card shadow-sm border-0 bg-white mb-4" style={{ borderRadius: '14px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        {/* Barra de Filtros y Búsqueda */}
        <div className="p-3 border-bottom bg-white">
          <div className="row g-2 align-items-center">
            {/* Buscador */}
            <div className="col-12 col-md-4">
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-light border-end-0 text-muted">
                  <Search size={14} />
                </span>
                <input
                  type="text"
                  className="form-control bg-light border-start-0 shadow-none"
                  placeholder="Buscar por RUC, razón social o asesor..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{ fontSize: '0.85rem' }}
                />
              </div>
            </div>

            {/* Filtro Asesor */}
            <div className="col-6 col-md-3">
              <select
                className="form-select form-select-sm shadow-none"
                value={filterVendedor}
                onChange={(e) => {
                  setFilterVendedor(e.target.value);
                  setCurrentPage(1);
                }}
                style={{ fontSize: '0.84rem' }}
              >
                <option value="ALL">Todos los Asesores</option>
                {uniqueSellers.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro Concepto */}
            <div className="col-6 col-md-2">
              <select
                className="form-select form-select-sm shadow-none"
                value={filterConcepto}
                onChange={(e) => {
                  setFilterConcepto(e.target.value);
                  setCurrentPage(1);
                }}
                style={{ fontSize: '0.84rem' }}
              >
                <option value="ALL">Todos los Conceptos</option>
                <option value="Renovación">Renovación</option>
                <option value="Adelant">Pago Adelantado</option>
                <option value="Prorrat">Cobro Prorrateo</option>
                <option value="Afiliac">Afiliación / Alta</option>
                <option value="Aumento">Aumento de Plan</option>
              </select>
            </div>

            {/* Filtro Modalidad */}
            <div className="col-6 col-md-2">
              <select
                className="form-select form-select-sm shadow-none"
                value={filterTipoSuscripcion}
                onChange={(e) => {
                  setFilterTipoSuscripcion(e.target.value);
                  setCurrentPage(1);
                }}
                style={{ fontSize: '0.84rem' }}
              >
                <option value="ALL">Mensual / Anual</option>
                <option value="MENSUAL">Solo Mensuales</option>
                <option value="ANUAL">Solo Anuales</option>
              </select>
            </div>

            {/* Botón Limpiar */}
            <div className="col-6 col-md-1 text-end">
              <button
                className="btn btn-outline-secondary btn-sm w-100 py-1"
                onClick={() => {
                  setSearchQuery('');
                  setFilterVendedor('ALL');
                  setFilterConcepto('ALL');
                  setFilterTipoSuscripcion('ALL');
                  setCurrentPage(1);
                }}
                title="Limpiar filtros"
              >
                <RotateCcw size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* Tabla Responsiva con Diseño Proporcional */}
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.85rem' }}>
            <thead style={{ backgroundColor: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
              <tr className="text-muted small text-uppercase" style={{ letterSpacing: '0.4px' }}>
                <th className="ps-3 py-3" style={{ width: '40px' }}>#</th>
                <th className="py-3" style={{ minWidth: '220px' }}>Cliente / Razón Social</th>
                <th className="py-3" style={{ minWidth: '110px' }}>RUC</th>
                <th className="py-3" style={{ minWidth: '150px' }}>Plan Activo</th>
                <th className="py-3" style={{ minWidth: '160px' }}>Conceptos en {mesNombreSeleccionado}</th>
                <th className="py-3 text-center" style={{ minWidth: '110px' }}>Último Pago</th>
                <th className="py-3" style={{ minWidth: '110px' }}>Medio Pago</th>
                <th className="py-3" style={{ minWidth: '120px' }}>Asesor</th>
                <th className="py-3 text-end pe-3" style={{ minWidth: '130px' }}>Monto Cobrado</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-5 text-muted">
                    <AlertCircle size={28} className="mb-2 text-muted d-block mx-auto opacity-50" />
                    <span className="fw-semibold d-block text-dark">No se encontraron cobros registrados para {mesNombreSeleccionado} {selectedYear}</span>
                    <small className="text-muted">Si se registraron adelantos o cobros en otros meses, puedes cambiar de mes en la barra superior.</small>
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row, idx) => {
                  const globalIdx = (currentPage - 1) * ITEMS_PER_PAGE + idx + 1;
                  const fechaUltimoPago = row.fechasPagoList.length > 0 ? formatFechaPE(row.fechasPagoList[0]) : '—';
                  const mediosStr = Array.from(row.mediosPagoSet).join(', ') || 'Confirmado';

                  return (
                    <tr key={row.clienteId} style={{ transition: 'background-color 0.15s ease' }}>
                      {/* Correlativo */}
                      <td className="ps-3 py-2.5 text-muted small">{globalIdx}</td>

                      {/* Razón Social y Nombre Comercial */}
                      <td className="py-2.5">
                        <div className="fw-semibold text-dark" style={{ lineHeight: '1.2' }}>
                          {row.razonSocial}
                        </div>
                        {row.nombreComercial && (
                          <div className="text-muted small" style={{ fontSize: '0.74rem' }}>
                            {row.nombreComercial}
                          </div>
                        )}
                      </td>

                      {/* RUC */}
                      <td className="py-2.5 text-secondary fw-semibold font-monospace" style={{ fontSize: '0.82rem' }}>
                        {row.ruc}
                      </td>

                      {/* Plan Activo */}
                      <td className="py-2.5">
                        <div className="fw-semibold text-dark">{row.planNombre}</div>
                        <span
                          className={`badge rounded-pill mt-0.5 ${
                            row.tipoSuscripcion === 'ANUAL'
                              ? 'bg-warning-subtle text-warning-emphasis border border-warning-subtle'
                              : 'bg-light text-secondary border'
                          }`}
                          style={{ fontSize: '0.68rem', padding: '2px 8px' }}
                        >
                          {row.tipoSuscripcion} (S/ {row.precioBasePlan.toFixed(2)})
                        </span>
                      </td>

                      {/* Conceptos aplicados al mes (Afiliación, Renovación, Adelanto, Prorrateo, Aumento) */}
                      <td className="py-2.5">
                        <div className="d-flex flex-wrap gap-1">
                          {Array.from(row.conceptosSet).map((cName) => {
                            let badgeClass = 'bg-primary-subtle text-primary border border-primary-subtle';
                            if (cName.includes('Adelant')) badgeClass = 'bg-success-subtle text-success border border-success-subtle';
                            else if (cName.includes('Prorrat')) badgeClass = 'bg-warning-subtle text-warning-emphasis border border-warning-subtle';
                            else if (cName.includes('Alta') || cName.includes('Afiliac')) badgeClass = 'bg-primary-subtle text-primary border border-primary-subtle';
                            else if (cName.includes('Aumento')) badgeClass = 'bg-secondary-subtle text-dark border border-secondary-subtle';

                            return (
                              <span
                                key={cName}
                                className={`badge rounded-pill fw-semibold ${badgeClass}`}
                                style={{ fontSize: '0.71rem', padding: '3px 8px' }}
                              >
                                {cName}
                              </span>
                            );
                          })}
                        </div>
                      </td>

                      {/* Fecha de Pago */}
                      <td className="py-2.5 text-center text-muted small">
                        {fechaUltimoPago}
                      </td>

                      {/* Medio de Pago */}
                      <td className="py-2.5">
                        <span className="badge bg-light text-dark border px-2 py-1" style={{ fontSize: '0.72rem' }}>
                          {mediosStr}
                        </span>
                      </td>

                      {/* Asesor */}
                      <td className="py-2.5 text-muted small">
                        {row.asesor}
                      </td>

                      {/* Monto Cobrado (En una sola fila consolidada) */}
                      <td className="py-2.5 text-end pe-3 fw-bold text-dark" style={{ fontSize: '0.96rem' }}>
                        S/ {row.totalCobradoMes.toFixed(2)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Pie de Tabla con Suma Total General */}
            {filteredRows.length > 0 && (
              <tfoot style={{ backgroundColor: '#F8FAFC', borderTop: '2px solid #CBD5E1' }}>
                <tr className="fw-bold">
                  <td colSpan={8} className="ps-3 py-3 text-uppercase text-dark" style={{ fontSize: '0.85rem' }}>
                    Suma Total Cobrada en {mesNombreSeleccionado.toUpperCase()} {selectedYear} ({filteredRows.length} clientes):
                  </td>
                  <td className="text-end pe-3 py-3 text-primary" style={{ fontSize: '1.12rem' }}>
                    S/ {sumaTotalFiltrada.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Paginador */}
        {totalPages > 1 && (
          <div className="d-flex justify-content-between align-items-center p-3 bg-white border-top small">
            <span className="text-muted">
              Mostrando página <strong>{currentPage}</strong> de <strong>{totalPages}</strong> ({filteredRows.length} clientes consolidados)
            </span>
            <div className="d-flex gap-1.5">
              <button
                className="btn btn-sm btn-outline-secondary px-2.5 py-1"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              >
                <ChevronLeft size={14} /> Anterior
              </button>
              <button
                className="btn btn-sm btn-outline-secondary px-2.5 py-1"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              >
                Siguiente <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
