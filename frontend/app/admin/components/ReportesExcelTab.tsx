'use client';

import React, { useMemo, useState } from 'react';
import {
  FileSpreadsheet,
  RefreshCw,
  Users,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  Percent,
  Clock,
  Search,
  RotateCcw,
  ShieldAlert,
  UserPlus,
  Repeat,
  Calendar,
  Layers,
  CheckCircle2,
  BarChart3,
  Eye,
  Check,
  CreditCard,
} from 'lucide-react';
import { Client } from './ClientesTodosTab';
import {
  SalesTimelineChart,
  PlanDoughnutChart,
  PortfolioHealthChart,
  RevenueTypeBarChart,
} from './ReportCharts';

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
  setHistoryClient?: (client: Client | null) => void;
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
  periodoIngresoTipo,
  setPeriodoIngresoTipo,
  fechaCustomFilter,
  setFechaCustomFilter,
  search,
  setSearch,
  sellerFilter,
  setSellerFilter,
  uniqueSellers = [],
  colorFilter,
  setColorFilter,
  regimenFilter,
  setRegimenFilter,
  planFilter,
  setPlanFilter,
  estadoCuentaFilter,
  setEstadoCuentaFilter,
  capacitacionFilter,
  setCapacitacionFilter,
  suscripcionFilter,
  setSuscripcionFilter,
  filterClientUnified,
  setEditingClient = () => {},
  setHistoryClient = () => {},
  COLOR_MAP,
}: ReportesExcelTabProps) {
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [proyeccionNextMonth, setProyeccionNextMonth] = useState<any>(null);
  const [loadingProyeccion, setLoadingProyeccion] = useState<boolean>(false);

  React.useEffect(() => {
    setLoadingProyeccion(true);
    fetch('/api/admin/proyeccion-mes')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.success && data.data) {
          setProyeccionNextMonth(data.data);
        }
      })
      .catch((err) => console.error('Error cargando proyección:', err))
      .finally(() => setLoadingProyeccion(false));
  }, []);

  // --------------------------------------------------------------------------
  // FILTROS PRINCIPALES (UBICADOS AL INICIO DE LA PÁGINA)
  // --------------------------------------------------------------------------
  const [selectedMesFacturacion, setSelectedMesFacturacion] = useState<string>('ALL');
  const [selectedVendedor, setSelectedVendedor] = useState<string>('ALL');
  const [selectedPlan, setSelectedPlan] = useState<string>('ALL');
  const [selectedEstadoCuenta, setSelectedEstadoCuenta] = useState<string>('ALL');
  const [selectedCliente, setSelectedCliente] = useState<string>('');

  // Navegación de secciones
  const [activeSection, setActiveSection] = useState<
    'RESUMEN' | 'TOTAL_MES' | 'PAGOS_MES' | 'ALTAS' | 'MENSUALIDADES' | 'ANUALES' | 'PRORRATEOS' | 'BLOQUEADOS'
  >('RESUMEN');

  // Paginación y verificador instantáneo
  const [tablePage, setTablePage] = useState<number>(1);
  const [showAllRows, setShowAllRows] = useState<boolean>(false);
  const [verifierQuery, setVerifierQuery] = useState<string>('');
  const ITEMS_PER_PAGE = 25;

  const safeClients = useMemo(() => (Array.isArray(clients) ? clients : []), [clients]);
  const safePayments = useMemo(() => (Array.isArray(payments) ? payments : []), [payments]);

  // Helper robusto para parsear cualquier fecha a Date local sin desfases UTC
  const parseLocalDateSafe = (dateInput?: any): Date | null => {
    if (!dateInput) return null;
    if (dateInput instanceof Date) {
      if (isNaN(dateInput.getTime())) return null;
      return new Date(dateInput.getFullYear(), dateInput.getMonth(), dateInput.getDate(), 0, 0, 0, 0);
    }
    if (Array.isArray(dateInput) && dateInput.length >= 3) {
      const y = Number(dateInput[0]);
      const m = Number(dateInput[1]);
      const d = Number(dateInput[2]);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        return new Date(y, m - 1, d, 0, 0, 0, 0);
      }
    }
    const str = String(dateInput).trim();
    if (!str) return null;
    const dateOnly = str.split('T')[0].split(' ')[0].replace(/Z$/i, '');
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
      const [y, m, d] = dateOnly.split('-').map(Number);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        return new Date(y, m - 1, d, 0, 0, 0, 0);
      }
    }
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateOnly)) {
      const [d, m, y] = dateOnly.split('/').map(Number);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        return new Date(y, m - 1, d, 0, 0, 0, 0);
      }
    }
    const d = new Date(str);
    if (isNaN(d.getTime())) return null;
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  };

  const monthKeyFromDate = (rawDate?: any): string | null => {
    const d = parseLocalDateSafe(rawDate);
    if (!d) return null;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  const addMonthsToKey = (key: string, monthsToAdd: number): string => {
    const [year, month] = key.split('-').map(Number);
    const d = new Date(year, month - 1 + monthsToAdd, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  const monthIndexFromKey = (key: string): number => {
    const [year, month] = key.split('-').map(Number);
    return year * 12 + month - 1;
  };

  const formatExcelDate = (val?: any): string => {
    const d = parseLocalDateSafe(val);
    if (!d) return '';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatMonthKeyLabel = (key: string): string => {
    if (!key || !key.includes('-')) return key || '—';
    const [y, m] = key.split('-').map(Number);
    const names = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
    ];
    return `${names[m - 1] || 'Mes'} ${y}`;
  };

  // --------------------------------------------------------------------------
  // CLIENTES FILTRADOS: LOS FILTROS AFECTAN A TODO EL MÓDULO
  // --------------------------------------------------------------------------
  const filteredClients = useMemo(() => {
    return safeClients.filter((c) => {
      if (filterClientUnified && !filterClientUnified(c)) return false;
      if (selectedVendedor !== 'ALL' && c.vendedor !== selectedVendedor) return false;
      if (selectedPlan !== 'ALL' && !(c.planContratado || '').toUpperCase().includes(selectedPlan.toUpperCase())) return false;
      if (selectedEstadoCuenta !== 'ALL' && (c.estadoCuenta || '').toUpperCase() !== selectedEstadoCuenta.toUpperCase()) return false;
      if (selectedCliente.trim() !== '') {
        const q = selectedCliente.toLowerCase();
        const razon = (c.razonSocial || '').toLowerCase();
        const ruc = (c.ruc || '').toLowerCase();
        const comercial = (c.nombreComercial || '').toLowerCase();
        if (!razon.includes(q) && !ruc.includes(q) && !comercial.includes(q)) return false;
      }
      return true;
    });
  }, [safeClients, filterClientUnified, selectedVendedor, selectedPlan, selectedEstadoCuenta, selectedCliente]);

  // Lista de planes únicos para el selector de filtros
  const availablePlans = useMemo(() => {
    const set = new Set<string>();
    safeClients.forEach((c) => {
      if (c.planContratado) set.add(c.planContratado);
    });
    return Array.from(set).sort();
  }, [safeClients]);

  // Mapa rápido de pagos de clientes
  const paymentsByClient = useMemo(() => {
    const map = new Map<string, any[]>();
    const seen = new Set<string>();
    safePayments.forEach((p, idx) => {
      const uKey = String(p?.id ?? p?.pagoId ?? `${p?.fechaPago || p?.fechaRegistro}-${p?.monto}-${idx}`);
      if (seen.has(uKey)) return;
      seen.add(uKey);

      const cId = p?.venta?.cliente?.id ?? p?.clienteId ?? p?.venta?.clienteId;
      const ruc = p?.clienteRuc || p?.venta?.cliente?.ruc;
      if (cId) {
        const list = map.get(String(cId)) || [];
        list.push(p);
        map.set(String(cId), list);
      }
      if (ruc) {
        const listRuc = map.get(`ruc-${ruc}`) || [];
        listRuc.push(p);
        map.set(`ruc-${ruc}`, listRuc);
      }
    });
    return map;
  }, [safePayments]);

  // --------------------------------------------------------------------------
  // MATRIZ FINANCIERA UNIFICADA (1 A 1 CON EL EXCEL OFICIAL)
  // Esta matriz es la ÚNICA fuente de verdad para la pantalla y la exportación.
  // --------------------------------------------------------------------------
  const {
    allMonthKeys,
    currentMonthKey,
    nextMonthKey,
    clientMatrixRows,
    monthColumnTotals,
    granTotalCobros,
    overallAltasTotal,
    overallAltasCount,
    overallRenovacionesTotal,
    overallRenovacionesCount,
    overallAnualesTotal,
    overallAnualesCount,
    overallProrrateosTotal,
  } = useMemo(() => {
    const monthKeysSet = new Set<string>();
    const today = new Date();
    const currKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    const nextKey = addMonthsToKey(currKey, 1);

    // Siempre incluir el mes actual y el próximo mes (previa de lo que se debería ganar)
    monthKeysSet.add(currKey);
    monthKeysSet.add(nextKey);

    // Mapa rápido de la proyección de Python por ID y RUC
    const proyeccionByClient = new Map<string, any>();
    if (proyeccionNextMonth && Array.isArray(proyeccionNextMonth.desglose)) {
      proyeccionNextMonth.desglose.forEach((item: any) => {
        if (item.id) proyeccionByClient.set(String(item.id), item);
        if (item.ruc) proyeccionByClient.set(`ruc-${item.ruc}`, item);
      });
    }

    // 1. Detectar rango de meses en base a fechas de servicio / capacitación / registro / pagos
    safeClients.forEach((c) => {
      const candidateDates = [
        parseLocalDateSafe(c.fechaRegistro),
        parseLocalDateSafe(c.fechaCreacion),
        parseLocalDateSafe(c.fechaCapacitacion),
        parseLocalDateSafe(c.fechaInicioServicio),
      ].filter((d): d is Date => d !== null);

      candidateDates.forEach((d) => {
        const k = monthKeyFromDate(d);
        if (k && monthIndexFromKey(k) <= monthIndexFromKey(nextKey)) {
          monthKeysSet.add(k);
        }
      });

      if (candidateDates.length > 0) {
        const earliest = candidateDates.reduce((min, d) => (d.getTime() < min.getTime() ? d : min), candidateDates[0]);
        const regKey = monthKeyFromDate(earliest);
        if (regKey) {
          const startIdx = monthIndexFromKey(regKey);
          const currIdx = monthIndexFromKey(currKey);
          for (let idx = Math.min(startIdx, currIdx); idx <= Math.max(startIdx, currIdx); idx++) {
            const y = Math.floor(idx / 12);
            const m = (idx % 12) + 1;
            monthKeysSet.add(`${y}-${String(m).padStart(2, '0')}`);
          }
        }
      }
    });

    safePayments.forEach((p) => {
      const pD = parseLocalDateSafe(p?.periodoInicio || p?.fechaPago || p?.fechaRegistro);
      if (pD) {
        const k = monthKeyFromDate(pD);
        if (k && monthIndexFromKey(k) <= monthIndexFromKey(nextKey)) {
          monthKeysSet.add(k);
        }
      }
    });

    const sortedMonthKeys = Array.from(monthKeysSet).sort();

    // 2. Inicializar acumuladores de columnas mensuales
    const colTotals = new Map<string, {
      totalGenerado: number;
      altas: number;
      altasCount: number;
      renovaciones: number;
      renovacionesCount: number;
      anuales: number;
      anualesCount: number;
      prorrateos: number;
      totalOperaciones: number;
    }>();

    sortedMonthKeys.forEach((k) => {
      colTotals.set(k, {
        totalGenerado: 0,
        altas: 0,
        altasCount: 0,
        renovaciones: 0,
        renovacionesCount: 0,
        anuales: 0,
        anualesCount: 0,
        prorrateos: 0,
        totalOperaciones: 0,
      });
    });

    let granTotal = 0;
    let sumAltas = 0;
    let countAltas = 0;
    let sumRenovaciones = 0;
    let countRenovaciones = 0;
    let sumAnuales = 0;
    let countAnuales = 0;
    let sumProrrateos = 0;

    // 3. Procesar cada cliente de filteredClients
    const rows = filteredClients.map((c) => {
      const rawPlanPrice = Number(c.montoMensual || c.precioPlan || 0);
      const isClientAnnual = (c.tipoSuscripcion || '').toUpperCase() === 'ANUAL' || rawPlanPrice >= 150;
      const isBlocked = (c.estadoCuenta || '').toUpperCase() === 'BLOQUEADO';
      const clientMonthlyPlanPrice = rawPlanPrice || (isClientAnnual ? 590 : 29);

      // Revisar pagos confirmados en base de datos para este cliente (desduplicando por ID de pago)
      const rawPays = [
        ...(c.id ? (paymentsByClient.get(String(c.id)) || []) : []),
        ...(c.ruc ? (paymentsByClient.get(`ruc-${c.ruc}`) || []) : [])
      ];
      const seenPayKeys = new Set<string>();
      const clPays: any[] = [];
      rawPays.forEach((p) => {
        const uId = String(p?.id ?? p?.pagoId ?? `${p?.fechaPago || p?.fechaRegistro}-${p?.monto}`);
        if (!seenPayKeys.has(uId)) {
          seenPayKeys.add(uId);
          clPays.push(p);
        }
      });

      // Determinar el verdadero mes de inicio (alta original) del cliente sin que las renovaciones o adelantos lo desplacen
      const allClientDates: Date[] = [];
      [c.fechaRegistro, c.fechaCreacion, c.fechaCapacitacion, c.fechaInicioServicio].forEach((raw) => {
        const d = parseLocalDateSafe(raw);
        if (d) allClientDates.push(d);
      });
      clPays.forEach((p) => {
        const d = parseLocalDateSafe(p?.periodoInicio || p?.fechaVenta || p?.venta?.fechaVenta || p?.fechaPago || p?.fechaRegistro);
        if (d) allClientDates.push(d);
      });

      const earliestD = allClientDates.length > 0
        ? allClientDates.reduce((min, d) => (d.getTime() < min.getTime() ? d : min), allClientDates[0])
        : parseLocalDateSafe(c.fechaInicioServicio || c.fechaCapacitacion || c.fechaRegistro || c.fechaCreacion);
      const startMonthKey = earliestD ? (monthKeyFromDate(earliestD) || sortedMonthKeys[0]) : sortedMonthKeys[0];

      const endD = parseLocalDateSafe(c.fechaFinServicio || c.fechaVencimientoMensual);
      const spans: Array<{ startKey: string; amount: number; monthsCovered: number; type: 'ANUAL' | 'SEGUNDO_PRORRATEO' }> = [];
      const monthlySums = new Map<string, number>();
      sortedMonthKeys.forEach((k) => monthlySums.set(k, 0));

      let nextMonthIsProrrateo = false;
      let nextMonthIsAdelanto = false;
      const advanceMonths = new Set<string>();

      if (isClientAnnual) {
        // PLAN ANUAL: solo figura una única vez en el mes exacto que inicia/afilia su suscripción (nunca en meses posteriores)
        const annualPay = clPays.find((p) => {
          const isAnn = (p?.tipoSuscripcion || p?.venta?.suscripcion?.tipoSuscripcion || '').toUpperCase() === 'ANUAL';
          return isAnn || Number(p?.monto || 0) >= 150;
        });
        const annualAmount = annualPay
          ? Number(annualPay.monto || annualPay.venta?.montoTotal || 0)
          : (Number(c.precioPlan || c.montoMensual || 0) || 590);
        const annualPayD = annualPay
          ? parseLocalDateSafe(annualPay?.periodoInicio || annualPay?.fechaVenta || annualPay?.venta?.fechaVenta || annualPay?.fechaPago || annualPay?.fechaRegistro)
          : null;
        const annualMonthKey = (annualPayD && monthKeyFromDate(annualPayD)) || startMonthKey;
        // Solo colocar el cobro en el mes de afiliación
        monthlySums.set(annualMonthKey, annualAmount);

        // Los anuales antiguos NO vuelven a figurar en la previa a menos que su año esté realmente vencido y tenga renovación pendiente
        if (!isBlocked && endD) {
          const endKey = monthKeyFromDate(endD);
          if (endKey === nextKey && monthIndexFromKey(annualMonthKey) <= monthIndexFromKey(currKey) - 10) {
            const proyItem = (c.id && proyeccionByClient.get(String(c.id))) || (c.ruc && proyeccionByClient.get(`ruc-${c.ruc}`));
            if (proyItem && Number(proyItem.monto || 0) > 0) {
              monthlySums.set(nextKey, Number(proyItem.monto));
            }
          }
        }
      } else {
        // 1. Corroborar pagos del historial:
        // Si pagan adelantado para el siguiente mes (o con observaciones de adelanto), debe figurar en el siguiente mes
        if (clPays.length > 0) {
          const sortedPays = [...clPays].sort((a, b) => {
            const dA = parseLocalDateSafe(a?.fechaPago || a?.fechaVenta || a?.periodoInicio)?.getTime() || 0;
            const dB = parseLocalDateSafe(b?.fechaPago || b?.fechaVenta || b?.periodoInicio)?.getTime() || 0;
            return dA - dB;
          });

          sortedPays.forEach((p) => {
            const pAmount = Number(p?.monto || p?.venta?.montoTotal || 0);
            if (pAmount <= 0) return;

            const obsStr = String(p?.observaciones || p?.venta?.observaciones || '').toLowerCase();
            const isObsAdelanto = obsStr.includes('adelanto');
            const perD = parseLocalDateSafe(p?.periodoInicio);
            const payD = parseLocalDateSafe(p?.fechaVenta || p?.venta?.fechaVenta || p?.fechaPago || p?.fechaRegistro);
            const payMonthKey = monthKeyFromDate(payD);
            let targetKey = monthKeyFromDate(perD) || payMonthKey;
            if (!targetKey) return;

            // Si es un pago adelantado para el siguiente mes:
            if (isObsAdelanto) {
              if (targetKey === currKey || targetKey === payMonthKey) {
                targetKey = nextKey;
              }
            } else if (payMonthKey === currKey && targetKey && monthIndexFromKey(targetKey) > monthIndexFromKey(currKey)) {
              // El pago se hizo en el mes actual pero cubre el período siguiente -> asignar al mes siguiente
              targetKey = nextKey;
            }

            if (monthIndexFromKey(targetKey) > monthIndexFromKey(nextKey)) {
              targetKey = nextKey;
            }

            if (targetKey === nextKey || isObsAdelanto) {
              advanceMonths.add(targetKey);
            }
            monthlySums.set(targetKey, (monthlySums.get(targetKey) || 0) + pAmount);
          });
        }

        // 2. Garantizar que todo plan activo tenga registrado lo que generó desde su mes de inicio hasta el mes actual (currKey)
        const startIdx = monthIndexFromKey(startMonthKey);
        const currIdx = monthIndexFromKey(currKey);
        if (!isBlocked) {
          for (let idx = startIdx; idx <= currIdx; idx++) {
            const y = Math.floor(idx / 12);
            const m = (idx % 12) + 1;
            const mKey = `${y}-${String(m).padStart(2, '0')}`;
            if ((monthlySums.get(mKey) || 0) <= 0) {
              let fallbackAmt = clientMonthlyPlanPrice;
              if (
                mKey === startMonthKey &&
                c.tipoProrrateo === 'PRIMER_PRORRATEO' &&
                Number(c.montoProrrateado || 0) > 0 &&
                Number(c.montoProrrateado) < clientMonthlyPlanPrice
              ) {
                fallbackAmt = Number(c.montoProrrateado);
              }
              monthlySums.set(mKey, fallbackAmt);
            }
          }
        } else if (clPays.length === 0) {
          let initialAmt = clientMonthlyPlanPrice;
          if (c.tipoProrrateo === 'PRIMER_PRORRATEO' && Number(c.montoProrrateado || 0) > 0) {
            initialAmt = Number(c.montoProrrateado);
          }
          monthlySums.set(startMonthKey, initialAmt);
        }

        // 3. Previa del próximo mes (nextKey):
        // Todo cliente mensual activo (no bloqueado) debe figurar en el mes que sigue como previa de lo que se debería ganar,
        // contando pagos regulares, prorrateos (1.° o 2.° prorrateo) y adelantos ya pagados.
        if (!isBlocked) {
          const proyItem = (c.id && proyeccionByClient.get(String(c.id))) || (c.ruc && proyeccionByClient.get(`ruc-${c.ruc}`));
          const paidAdvanceInNext = monthlySums.get(nextKey) || 0;
          const baseMonto = clientMonthlyPlanPrice;
          const nextCobro = Number(c.montoSiguienteCobro || 0);
          const adicMonto = Number(c.montoProrrateoAdicional || 0);
          const prorrMonto = Number(c.montoProrrateado || 0);

          let previewNextAmt = baseMonto;
          let isProrrNext = false;
          let isAdelNext = paidAdvanceInNext > 0 || advanceMonths.has(nextKey);

          if (proyItem && Number(proyItem.monto || 0) > 0) {
            previewNextAmt = Number(proyItem.monto);
            isProrrNext = Boolean(proyItem.es_prorrateado);
            isAdelNext = Boolean(proyItem.es_adelanto) || isAdelNext;
            if (paidAdvanceInNext > previewNextAmt) {
              previewNextAmt = paidAdvanceInNext;
            }
          } else if (c.tipoProrrateo === 'SEGUNDO_PRORRATEO' || adicMonto > 0) {
            if (nextCobro > baseMonto) {
              previewNextAmt = nextCobro;
              isProrrNext = true;
            } else if (adicMonto > 0) {
              previewNextAmt = Math.round((baseMonto + adicMonto) * 100) / 100;
              isProrrNext = true;
            } else if (paidAdvanceInNext > baseMonto) {
              previewNextAmt = paidAdvanceInNext;
              isProrrNext = true;
            }
          } else if (c.tipoProrrateo === 'PRIMER_PRORRATEO') {
            if (nextCobro > 0 && nextCobro < baseMonto) {
              previewNextAmt = nextCobro;
              isProrrNext = true;
            } else if (prorrMonto > 0 && prorrMonto < baseMonto) {
              previewNextAmt = prorrMonto;
              isProrrNext = true;
            }
          } else if (paidAdvanceInNext > 0) {
            previewNextAmt = paidAdvanceInNext;
            isProrrNext = Math.abs(paidAdvanceInNext - baseMonto) > 0.05;
          }

          nextMonthIsProrrateo = isProrrNext;
          nextMonthIsAdelanto = isAdelNext;
          if (isAdelNext) advanceMonths.add(nextKey);
          monthlySums.set(nextKey, previewNextAmt);
        }
      }

      // Construir mapa de celdas por mes para este cliente
      const cellDataByMonth = new Map<string, {
        amount: number;
        tipo: 'ALTA' | 'RENOVACION' | 'ANUAL' | 'PRORRATEO' | 'NINGUNO';
        esAdelanto?: boolean;
        esPrevia?: boolean;
        isSpanStart: boolean;
        isCoveredBySpan: boolean;
        spanCols: number;
        displayVal: string;
      }>();

      let clientTotal = 0;

      for (let i = 0; i < sortedMonthKeys.length; i++) {
        const key = sortedMonthKeys[i];
        const amt = monthlySums.get(key) || 0;

        if (amt > 0) {
          let tipo: 'ALTA' | 'RENOVACION' | 'ANUAL' | 'PRORRATEO' = 'RENOVACION';
          const isDiffFromBase = Math.abs(amt - clientMonthlyPlanPrice) > 0.05 && clientMonthlyPlanPrice > 0;
          if (isClientAnnual) {
            tipo = 'ANUAL';
          } else if (key === nextKey) {
            tipo = nextMonthIsProrrateo || isDiffFromBase ? 'PRORRATEO' : 'RENOVACION';
          } else if (isDiffFromBase) {
            tipo = 'PRORRATEO';
          } else if (key === startMonthKey) {
            tipo = 'ALTA';
          } else {
            tipo = 'RENOVACION';
          }

          const isCellAdelanto = (key === nextKey && nextMonthIsAdelanto) || advanceMonths.has(key);

          cellDataByMonth.set(key, {
            amount: amt,
            tipo,
            esAdelanto: isCellAdelanto,
            esPrevia: key === nextKey,
            isSpanStart: false,
            isCoveredBySpan: false,
            spanCols: 1,
            displayVal: amt.toFixed(2),
          });
          clientTotal += amt;

          const col = colTotals.get(key);
          if (col) {
            col.totalGenerado += amt;
            col.totalOperaciones += 1;
            if (tipo === 'ANUAL') {
              col.anuales += amt;
              col.anualesCount += 1;
              sumAnuales += amt;
              countAnuales += 1;
              if (key === startMonthKey) {
                col.altasCount += 1;
                countAltas += 1;
              }
            } else if (tipo === 'PRORRATEO') {
              col.prorrateos += amt;
              sumProrrateos += amt;
            } else if (tipo === 'ALTA') {
              col.altas += amt;
              col.altasCount += 1;
              sumAltas += amt;
              countAltas += 1;
            } else {
              col.renovaciones += amt;
              col.renovacionesCount += 1;
              sumRenovaciones += amt;
              countRenovaciones += 1;
            }
          }
        } else {
          cellDataByMonth.set(key, {
            amount: 0,
            tipo: 'NINGUNO',
            isSpanStart: false,
            isCoveredBySpan: false,
            spanCols: 1,
            displayVal: '-',
          });
        }
      }

      granTotal += clientTotal;

      return {
        client: c,
        startMonthKey,
        isClientAnnual,
        spans,
        clientTotal,
        cellDataByMonth,
      };
    });

    return {
      allMonthKeys: sortedMonthKeys,
      currentMonthKey: currKey,
      nextMonthKey: nextKey,
      clientMatrixRows: rows,
      monthColumnTotals: colTotals,
      granTotalCobros: granTotal,
      overallAltasTotal: sumAltas,
      overallAltasCount: countAltas,
      overallRenovacionesTotal: sumRenovaciones,
      overallRenovacionesCount: countRenovaciones,
      overallAnualesTotal: sumAnuales,
      overallAnualesCount: countAnuales,
      overallProrrateosTotal: sumProrrateos,
    };
  }, [safeClients, filteredClients, safePayments, paymentsByClient, proyeccionNextMonth]);

  // Lista de meses disponibles para el selector mensual (ordenados de más reciente a más antiguo)
  const availableBillingMonths = useMemo(() => {
    return allMonthKeys
      .map((k) => [k, formatMonthKeyLabel(k)] as [string, string])
      .reverse();
  }, [allMonthKeys]);

  // --------------------------------------------------------------------------
  // CÁLCULO DE KPIS SEGÚN EL PERÍODO SELECCIONADO (COINCIDENCIA 100% CON EXCEL)
  // --------------------------------------------------------------------------
  const selectedMonthTotalData = useMemo(() => {
    if (selectedMesFacturacion === 'ALL') return null;
    return monthColumnTotals.get(selectedMesFacturacion) || null;
  }, [selectedMesFacturacion, monthColumnTotals]);

  // Total recaudado: coincide exactamente con la columna del mes en el Excel o con el Gran Total
  const kpiTotalRecaudado = useMemo(() => {
    if (selectedMesFacturacion === 'ALL') return granTotalCobros;
    return selectedMonthTotalData ? selectedMonthTotalData.totalGenerado : 0;
  }, [selectedMesFacturacion, granTotalCobros, selectedMonthTotalData]);

  const kpiAltasMonto = useMemo(() => {
    if (selectedMesFacturacion === 'ALL') return overallAltasTotal;
    return selectedMonthTotalData ? selectedMonthTotalData.altas : 0;
  }, [selectedMesFacturacion, overallAltasTotal, selectedMonthTotalData]);

  const kpiAltasCount = useMemo(() => {
    if (selectedMesFacturacion === 'ALL') return overallAltasCount;
    return selectedMonthTotalData ? selectedMonthTotalData.altasCount : 0;
  }, [selectedMesFacturacion, overallAltasCount, selectedMonthTotalData]);

  const kpiRenovacionesMonto = useMemo(() => {
    if (selectedMesFacturacion === 'ALL') return overallRenovacionesTotal;
    return selectedMonthTotalData ? selectedMonthTotalData.renovaciones : 0;
  }, [selectedMesFacturacion, overallRenovacionesTotal, selectedMonthTotalData]);

  const kpiRenovacionesCount = useMemo(() => {
    if (selectedMesFacturacion === 'ALL') return overallRenovacionesCount;
    return selectedMonthTotalData ? selectedMonthTotalData.renovacionesCount : 0;
  }, [selectedMesFacturacion, overallRenovacionesCount, selectedMonthTotalData]);

  const kpiAnualesMonto = useMemo(() => {
    if (selectedMesFacturacion === 'ALL') return overallAnualesTotal;
    return selectedMonthTotalData ? selectedMonthTotalData.anuales : 0;
  }, [selectedMesFacturacion, overallAnualesTotal, selectedMonthTotalData]);

  const kpiAnualesCount = useMemo(() => {
    if (selectedMesFacturacion === 'ALL') return overallAnualesCount;
    return selectedMonthTotalData ? selectedMonthTotalData.anualesCount : 0;
  }, [selectedMesFacturacion, overallAnualesCount, selectedMonthTotalData]);

  const kpiProrrateosMonto = useMemo(() => {
    if (selectedMesFacturacion === 'ALL') return overallProrrateosTotal;
    return selectedMonthTotalData ? selectedMonthTotalData.prorrateos : 0;
  }, [selectedMesFacturacion, overallProrrateosTotal, selectedMonthTotalData]);

  // Deuda unificada (Vencidos y Bloqueados): 1 tarifa por cada cliente impago
  const { clientesConDeudaList, vencidosCount, bloqueadosCount, totalDeudaPendiente } = useMemo(() => {
    const list: Array<{
      client: Client;
      razonSocial: string;
      ruc: string;
      estado: 'VENCIDO' | 'BLOQUEADO';
      tarifa: number;
      fechaVencimientoStr: string;
      asesor: string;
      telefono: string;
    }> = [];

    let sumDeuda = 0;
    let vCount = 0;
    let bCount = 0;

    filteredClients.forEach((c) => {
      const st = (c.estadoCuenta || '').toUpperCase();
      if (st !== 'VENCIDO' && st !== 'BLOQUEADO' && st !== 'SUSPENDIDO') return;

      // Para bloqueados y vencidos, fijarse en el monto de cuánto debe (montoSiguienteCobro si > 0, sino tarifa de plan)
      const deuda = c.montoSiguienteCobro && Number(c.montoSiguienteCobro) > 0
        ? Number(c.montoSiguienteCobro)
        : Number(c.montoMensual || c.precioPlan || 0);
      const isBloq = st === 'BLOQUEADO' || st === 'SUSPENDIDO';
      if (isBloq) bCount++;
      else vCount++;
      sumDeuda += deuda;

      const vencD = parseLocalDateSafe(c.fechaVencimientoMensual) || parseLocalDateSafe(c.fechaCreacion) || parseLocalDateSafe(c.fechaRegistro);
      const fechaVencimientoStr = vencD ? vencD.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

      list.push({
        client: c,
        razonSocial: c.razonSocial || 'Cliente General',
        ruc: c.ruc || '—',
        estado: isBloq ? 'BLOQUEADO' : 'VENCIDO',
        tarifa: deuda,
        fechaVencimientoStr,
        asesor: c.vendedor || 'Por asignar',
        telefono: c.telefono || c.telefonoPersonal || '',
      });
    });

    return {
      clientesConDeudaList: list.sort((a, b) => b.tarifa - a.tarifa),
      vencidosCount: vCount,
      bloqueadosCount: bCount,
      totalDeudaPendiente: sumDeuda,
    };
  }, [filteredClients]);

  // --------------------------------------------------------------------------
  // HOJA / AUDITORÍA DE TODOS LOS PAGOS DEL MES SELECCIONADO (DESDE HISTORIAL DE PAGOS)
  // --------------------------------------------------------------------------
  const activeMonthForPayments = selectedMesFacturacion === 'ALL' ? currentMonthKey : selectedMesFacturacion;

  const pagosDelMesSeleccionado = useMemo(() => {
    const list: Array<{
      pagoId: string;
      clienteId: string;
      razonSocial: string;
      ruc: string;
      plan: string;
      asesor: string;
      monto: number;
      medioPago: string;
      codigoOperacion: string;
      fechaPagoStr: string;
      fechaRegistroStr: string;
      periodoCubiertoStr: string;
      observaciones: string;
      esAdelanto: boolean;
      esProrrateo: boolean;
      tipoVenta: string;
    }> = [];

    const seenUids = new Set<string>();

    safePayments.forEach((p, idx) => {
      const uId = String(p?.id ?? p?.pagoId ?? `${p?.fechaPago || p?.fechaRegistro}-${p?.monto}-${idx}`);
      if (seenUids.has(uId)) return;
      seenUids.add(uId);

      const payD = parseLocalDateSafe(p?.fechaPago || p?.fechaVenta || p?.venta?.fechaVenta || p?.fechaRegistro);
      const perD = parseLocalDateSafe(p?.periodoInicio);
      const perFinD = parseLocalDateSafe(p?.periodoFin);

      const payMonth = monthKeyFromDate(payD);
      const perMonth = monthKeyFromDate(perD);
      const obsStr = String(p?.observaciones || p?.venta?.observaciones || '').toLowerCase();
      const isObsAdelanto = obsStr.includes('adelanto');

      // Determinar a qué mes se imputa el pago:
      let mesImputado = perMonth || payMonth;
      if (isObsAdelanto && (mesImputado === currentMonthKey || payMonth === currentMonthKey)) {
        mesImputado = nextMonthKey;
      } else if (payMonth === currentMonthKey && perMonth && monthIndexFromKey(perMonth) > monthIndexFromKey(currentMonthKey)) {
        mesImputado = nextMonthKey;
      }

      // Filtrar para ver los pagos que corresponden al mes activo (por fecha de pago o por período imputado)
      const matchesTarget = (mesImputado === activeMonthForPayments) || (payMonth === activeMonthForPayments);
      if (!matchesTarget) return;

      const cId = p?.venta?.cliente?.id ?? p?.clienteId ?? p?.venta?.clienteId;
      const cRuc = p?.clienteRuc || p?.venta?.cliente?.ruc || '';
      const cRazon = p?.clienteRazonSocial || p?.venta?.cliente?.razonSocial || 'Cliente';
      const vNombre = p?.vendedorNombre || p?.venta?.vendedor?.nombre || 'Por asignar';
      const planNom = p?.planNombre || p?.venta?.suscripcion?.plan?.nombrePlan || 'Plan Estándar';
      const tProrr = p?.tipoProrrateo || p?.venta?.tipoProrrateo || 'NINGUNO';
      const isProrr = tProrr !== 'NINGUNO' || obsStr.includes('prorrateo');

      const fechaPagoStr = payD ? formatExcelDate(payD) : '—';
      const fechaRegistroStr = formatExcelDate(p?.fechaRegistro || payD);
      const perIniStr = perD ? formatExcelDate(perD) : '';
      const perFinStr = perFinD ? formatExcelDate(perFinD) : '';
      const periodoCubiertoStr = perIniStr && perFinStr ? `${perIniStr} al ${perFinStr}` : perIniStr || '—';

      list.push({
        pagoId: String(p?.id || idx),
        clienteId: String(cId || ''),
        razonSocial: cRazon,
        ruc: cRuc,
        plan: planNom,
        asesor: vNombre,
        monto: Number(p?.monto || p?.venta?.montoTotal || 0),
        medioPago: String(p?.medioPago || 'TRANSFERENCIA'),
        codigoOperacion: String(p?.codigoOperacion || '—'),
        fechaPagoStr,
        fechaRegistroStr,
        periodoCubiertoStr,
        observaciones: p?.observaciones || 'Pago registrado',
        esAdelanto: isObsAdelanto || mesImputado === nextMonthKey,
        esProrrateo: isProrr,
        tipoVenta: String(p?.tipoVenta || p?.venta?.tipoVenta || 'RENOVACION'),
      });
    });

    return list.sort((a, b) => b.monto - a.monto);
  }, [safePayments, activeMonthForPayments, currentMonthKey, nextMonthKey]);

  // Datos para la tabla mensual (lista de filas por mes)
  const monthlySummaryTableData = useMemo(() => {
    return allMonthKeys
      .map((k) => {
        const col = monthColumnTotals.get(k) || {
          totalGenerado: 0,
          altas: 0,
          altasCount: 0,
          renovaciones: 0,
          renovacionesCount: 0,
          anuales: 0,
          anualesCount: 0,
          prorrateos: 0,
          totalOperaciones: 0,
        };
        return {
          monthKey: k,
          label: formatMonthKeyLabel(k),
          altas: col.altas,
          altasCount: col.altasCount,
          renovaciones: col.renovaciones,
          renovacionesCount: col.renovacionesCount,
          anuales: col.anuales,
          anualesCount: col.anualesCount,
          prorrateos: col.prorrateos,
          totalGenerado: col.totalGenerado,
          cantidadOperaciones: col.totalOperaciones,
        };
      })
      .reverse();
  }, [allMonthKeys, monthColumnTotals]);

  // --------------------------------------------------------------------------
  // LISTA DE OPERACIONES / AUDITORÍA SEGÚN LA SECCIÓN ACTIVA
  // --------------------------------------------------------------------------
  const detailedTableList = useMemo(() => {
    const list: Array<{
      id: string;
      client: Client;
      razonSocial: string;
      ruc: string;
      mesKey: string;
      mesLabel: string;
      tipo: string;
      esAdelanto?: boolean;
      esPrevia?: boolean;
      monto: number;
      asesor: string;
      plan: string;
      estado: string;
    }> = [];

    clientMatrixRows.forEach((row) => {
      const c = row.client;
      row.cellDataByMonth.forEach((cell, mKey) => {
        if (cell.amount <= 0 || cell.isCoveredBySpan) return;

        // Filtrar por mes si no es 'ALL'
        if (selectedMesFacturacion !== 'ALL' && mKey !== selectedMesFacturacion) return;

        // Filtrar por sección
        if (activeSection === 'ALTAS' && cell.tipo !== 'ALTA' && cell.tipo !== 'ANUAL') return;
        if (activeSection === 'MENSUALIDADES' && cell.tipo !== 'RENOVACION') return;
        if (activeSection === 'ANUALES' && cell.tipo !== 'ANUAL' && (c.tipoSuscripcion || '').toUpperCase() !== 'ANUAL') return;
        if (activeSection === 'PRORRATEOS' && cell.tipo !== 'PRORRATEO') return;

        list.push({
          id: `${c.id}-${mKey}-${cell.tipo}`,
          client: c,
          razonSocial: c.razonSocial || 'Cliente General',
          ruc: c.ruc || '—',
          mesKey: mKey,
          mesLabel: formatMonthKeyLabel(mKey),
          tipo: cell.tipo,
          esAdelanto: cell.esAdelanto,
          esPrevia: cell.esPrevia,
          monto: cell.amount,
          asesor: c.vendedor || 'Por asignar',
          plan: c.planContratado || 'Plan Estándar',
          estado: (c.estadoCuenta || 'HABILITADO').toUpperCase(),
        });
      });
    });

    return list.sort((a, b) => b.mesKey.localeCompare(a.mesKey) || b.monto - a.monto);
  }, [clientMatrixRows, selectedMesFacturacion, activeSection]);

  const displayedRows = showAllRows
    ? detailedTableList
    : detailedTableList.slice((tablePage - 1) * ITEMS_PER_PAGE, tablePage * ITEMS_PER_PAGE);
  const totalPages = Math.ceil(detailedTableList.length / ITEMS_PER_PAGE) || 1;

  // Verificador instantáneo de cliente
  const verifiedClientResult = useMemo(() => {
    if (!verifierQuery.trim()) return null;
    const q = verifierQuery.trim().toLowerCase();
    const foundRow = clientMatrixRows.find(
      (r) =>
        (r.client.ruc && r.client.ruc.toLowerCase().includes(q)) ||
        (r.client.razonSocial && r.client.razonSocial.toLowerCase().includes(q))
    );
    if (!foundRow) return { found: false };

    const c = foundRow.client;
    const monthCell = selectedMesFacturacion !== 'ALL' ? foundRow.cellDataByMonth.get(selectedMesFacturacion) : null;
    return {
      found: true,
      client: c,
      totalCobrosCliente: foundRow.clientTotal,
      montoMesSeleccionado: monthCell ? monthCell.amount : 0,
      clientPayments: paymentsByClient.get(String(c.id)) || (c.ruc ? paymentsByClient.get(`ruc-${c.ruc}`) : []) || [],
    };
  }, [verifierQuery, clientMatrixRows, selectedMesFacturacion, paymentsByClient]);

  const resetFilters = () => {
    setSelectedMesFacturacion('ALL');
    setSelectedVendedor('ALL');
    setSelectedPlan('ALL');
    setSelectedEstadoCuenta('ALL');
    setSelectedCliente('');
    setTablePage(1);
  };

  const currentMonthLabel = selectedMesFacturacion === 'ALL' ? 'Histórico Consolidado' : formatMonthKeyLabel(selectedMesFacturacion);

  // --------------------------------------------------------------------------
  // EXPORTACIÓN A EXCEL: USA LA EXACTA MISMA MATRIZ (SpreadsheetML)
  // --------------------------------------------------------------------------
  const exportToExcelLocal = async () => {
    if (handleExportExcel) {
      handleExportExcel();
      return;
    }

    setIsExportingExcel(true);
    try {
      // 1. Intentar exportación oficial directa generada con Python (Pandas/OpenPyXL 100% fiel a la BD)
      try {
        const res = await fetch('/api/admin/reporte-excel-oficial');
        if (res.ok) {
          const blob = await res.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Reporte_Oficial_Clientes_${new Date().toISOString().slice(0, 10)}.xlsx`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(url);
          setIsExportingExcel(false);
          return;
        }
      } catch (pythonErr) {
        console.warn('Fallo endpoint Python, recurriendo a exportador local:', pythonErr);
      }
      const monthHeaders = allMonthKeys.map((k) => `${formatMonthKeyLabel(k)} (S/)`);
      const headers = [
        'RUC', 'Razón Social', 'Nombre Comercial', 'Dirección Fiscal',
        'Departamento', 'Provincia', 'Distrito', 'Teléfono Comercial',
        'Email Comercial', 'Representante Legal', 'DNI', 'Teléfono Personal',
        'Email Personal', 'Régimen Tributario', 'Plan Contratado',
        'Tipo Suscripción', 'Tarifa Mensual (S/)', 'Vendedor Asignado',
        'Color Atención', 'Estado Comercial', 'Estado Capacitación',
        'Fecha Capacitación', 'Fecha Vencimiento', 'Monto Prorrateado Vigente (S/)',
        'Dias Prorrateados', 'Tipo Prorrateo', 'Prorrateo Adicional (S/)',
        'Dias Prorrateo Adicional', 'Inicio Prorrateo Adicional',
        'Fin Prorrateo Adicional', 'Fecha Alta / Registro', 'Usuario SOL',
        'Usuario Sistema', 'Clave Sistema', 'URL Sistema',
        ...monthHeaders,
        'TOTAL COBROS (S/)',
      ];

      const xmlRows = clientMatrixRows.map((row) => {
        const c = row.client;
        const repNombre = `${c.nombres || ''} ${c.apellidos || ''}`.trim() || '—';
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
          .map((val, idx) => {
            const isNumberCell = numericBaseCellIndexes.has(idx);
            return `<Cell ss:StyleID="${isNumberCell ? 'NumberStyle' : 'DataStyle'}"><Data ss:Type="${
              isNumberCell ? 'Number' : 'String'
            }">${String(val).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</Data></Cell>`;
          })
          .join('');

        const monthCellsXml: string[] = [];
        for (let i = 0; i < allMonthKeys.length; i++) {
          const k = allMonthKeys[i];
          const cell = row.cellDataByMonth.get(k);
          if (!cell || cell.isCoveredBySpan) continue;

          const colIndex = 36 + i;

          if (cell.isSpanStart && cell.spanCols > 1) {
            const mergeCount = cell.spanCols - 1;
            const styleId = cell.tipo === 'ANUAL' ? 'AnnualStyle' : 'SegundoProrrateoStyle';
            monthCellsXml.push(
              `<Cell ss:Index="${colIndex}" ss:StyleID="${styleId}" ss:MergeAcross="${mergeCount}"><Data ss:Type="Number">${cell.amount.toFixed(2)}</Data></Cell>`
            );
          } else if (cell.amount > 0) {
            const styleId = cell.tipo === 'ANUAL' ? 'AnnualStyle' : 'NumberStyle';
            monthCellsXml.push(
              `<Cell ss:Index="${colIndex}" ss:StyleID="${styleId}"><Data ss:Type="Number">${cell.amount.toFixed(2)}</Data></Cell>`
            );
          } else {
            monthCellsXml.push(`<Cell ss:Index="${colIndex}" ss:StyleID="DataStyle"><Data ss:Type="String">-</Data></Cell>`);
          }
        }

        const totalColIndex = 36 + allMonthKeys.length;
        const totalCellXml = `<Cell ss:Index="${totalColIndex}" ss:StyleID="NumberStyle"><Data ss:Type="Number">${row.clientTotal.toFixed(2)}</Data></Cell>`;
        return `<Row>${baseCellsXml}${monthCellsXml.join('')}${totalCellXml}</Row>`;
      });

      // Fila de totales por mes al final de las columnas
      const totalColIndex = 36 + allMonthKeys.length;
      const monthTotalsCellsXml = allMonthKeys
        .map((k, idx) => {
          const col = monthColumnTotals.get(k);
          const mTotal = col ? col.totalGenerado : 0;
          return `<Cell ss:Index="${36 + idx}" ss:StyleID="TotalNumberStyle"><Data ss:Type="Number">${mTotal.toFixed(2)}</Data></Cell>`;
        })
        .join('');

      const totalRowXml = `<Row ss:Height="26"><Cell ss:Index="1" ss:StyleID="TotalLabelStyle" ss:MergeAcross="34"><Data ss:Type="String">TOTAL GENERADO POR MES (S/)</Data></Cell>${monthTotalsCellsXml}<Cell ss:Index="${totalColIndex}" ss:StyleID="GrandTotalStyle"><Data ss:Type="Number">${granTotalCobros.toFixed(2)}</Data></Cell></Row>`;

      // Hoja 2: Resumen por Mes
      const summaryMonthRowsXml = allMonthKeys
        .map((k) => {
          const label = formatMonthKeyLabel(k);
          const col = monthColumnTotals.get(k);
          const mTotal = col ? col.totalGenerado : 0;
          return `    <Row ss:Height="22">
     <Cell ss:StyleID="DataStyle"><Data ss:Type="String">${label}</Data></Cell>
     <Cell ss:StyleID="DataStyle"><Data ss:Type="String">${k}</Data></Cell>
     <Cell ss:StyleID="NumberStyle"><Data ss:Type="Number">${mTotal.toFixed(2)}</Data></Cell>
    </Row>`;
        })
        .join('\n');

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
   <Font ss:Size="10" ss:FontName="Calibri" ss:Bold="1" ss:Color="#065F46"/>
   <Interior ss:Color="#D1FAE5" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <NumberFormat ss:Format="#,##0.00"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#A7F3D0"/>
   </Borders>
  </Style>
  <Style ss:ID="SegundoProrrateoStyle">
   <Font ss:Size="10" ss:FontName="Calibri" ss:Bold="1" ss:Color="#1E40AF"/>
   <Interior ss:Color="#DBEAFE" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <NumberFormat ss:Format="#,##0.00"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#93C5FD"/>
   </Borders>
  </Style>
  <Style ss:ID="TotalLabelStyle">
   <Font ss:Bold="1" ss:Color="#FFFFFF" ss:Size="11" ss:FontName="Calibri"/>
   <Interior ss:Color="#0F172A" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#0047FF"/>
    <Border ss:Position="Bottom" ss:LineStyle="Double" ss:Weight="3" ss:Color="#0047FF"/>
   </Borders>
  </Style>
  <Style ss:ID="TotalNumberStyle">
   <Font ss:Bold="1" ss:Color="#0F172A" ss:Size="11" ss:FontName="Calibri"/>
   <Interior ss:Color="#E2E8F0" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <NumberFormat ss:Format="#,##0.00"/>
   <Borders>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#94A3B8"/>
    <Border ss:Position="Bottom" ss:LineStyle="Double" ss:Weight="3" ss:Color="#0047FF"/>
   </Borders>
  </Style>
  <Style ss:ID="GrandTotalStyle">
   <Font ss:Bold="1" ss:Color="#FFFFFF" ss:Size="11" ss:FontName="Calibri"/>
   <Interior ss:Color="#047857" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <NumberFormat ss:Format="#,##0.00"/>
   <Borders>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#065F46"/>
    <Border ss:Position="Bottom" ss:LineStyle="Double" ss:Weight="3" ss:Color="#065F46"/>
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
   ${totalRowXml}
  </Table>
 </Worksheet>
 <Worksheet ss:Name="Resumen por Mes">
  <Table>
   <Row ss:Height="26">
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Mes de Facturación</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Código Mes</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Total Generado (S/)</Data></Cell>
   </Row>
${summaryMonthRowsXml}
   <Row ss:Height="26">
    <Cell ss:StyleID="TotalLabelStyle" ss:MergeAcross="1"><Data ss:Type="String">TOTAL GENERAL ACUMULADO (S/)</Data></Cell>
    <Cell ss:StyleID="GrandTotalStyle"><Data ss:Type="Number">${granTotalCobros.toFixed(2)}</Data></Cell>
   </Row>
  </Table>
 </Worksheet>
  <Worksheet ss:Name="Pagos del Mes Seleccionado">
   <Table>
    <Row ss:Height="26">
     <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Cliente / Razón Social</Data></Cell>
     <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">RUC</Data></Cell>
     <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Plan</Data></Cell>
     <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Fecha Pago</Data></Cell>
     <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Período Cubierto</Data></Cell>
     <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Medio de Pago</Data></Cell>
     <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Código Operación</Data></Cell>
     <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Tipo / Concepto</Data></Cell>
     <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Asesor</Data></Cell>
     <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Monto Pagado (S/)</Data></Cell>
     <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Observaciones</Data></Cell>
    </Row>
    ${pagosDelMesSeleccionado
      .map(
        (p) => `<Row ss:Height="22">
     <Cell ss:StyleID="DataStyle"><Data ss:Type="String">${String(p.razonSocial).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</Data></Cell>
     <Cell ss:StyleID="DataStyle"><Data ss:Type="String">${p.ruc}</Data></Cell>
     <Cell ss:StyleID="DataStyle"><Data ss:Type="String">${p.plan}</Data></Cell>
     <Cell ss:StyleID="DataStyle"><Data ss:Type="String">${p.fechaPagoStr}</Data></Cell>
     <Cell ss:StyleID="DataStyle"><Data ss:Type="String">${p.periodoCubiertoStr}</Data></Cell>
     <Cell ss:StyleID="DataStyle"><Data ss:Type="String">${p.medioPago}</Data></Cell>
     <Cell ss:StyleID="DataStyle"><Data ss:Type="String">${p.codigoOperacion}</Data></Cell>
     <Cell ss:StyleID="DataStyle"><Data ss:Type="String">${p.esAdelanto ? 'Adelanto' : p.esProrrateo ? 'Prorrateo' : p.tipoVenta}</Data></Cell>
     <Cell ss:StyleID="DataStyle"><Data ss:Type="String">${p.asesor}</Data></Cell>
     <Cell ss:StyleID="NumberStyle"><Data ss:Type="Number">${p.monto.toFixed(2)}</Data></Cell>
     <Cell ss:StyleID="DataStyle"><Data ss:Type="String">${String(p.observaciones).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</Data></Cell>
    </Row>`
      )
      .join('\n')}
    <Row ss:Height="26">
     <Cell ss:StyleID="TotalLabelStyle" ss:MergeAcross="8"><Data ss:Type="String">TOTAL PAGOS DEL MES (${formatMonthKeyLabel(activeMonthForPayments)})</Data></Cell>
     <Cell ss:StyleID="GrandTotalStyle"><Data ss:Type="Number">${pagosDelMesSeleccionado.reduce((acc, p) => acc + p.monto, 0).toFixed(2)}</Data></Cell>
     <Cell ss:StyleID="TotalLabelStyle"><Data ss:Type="String"></Data></Cell>
    </Row>
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

  // --------------------------------------------------------------------------
  // DATOS PARA GRÁFICOS INTERACTIVOS (COINCIDEN 100% CON LA MATRIZ EXCEL)
  // --------------------------------------------------------------------------
  const timelineData = useMemo(() => {
    const topMonths = allMonthKeys.slice(-6);
    return topMonths.map((mk) => {
      const col = monthColumnTotals.get(mk) || { totalGenerado: 0, totalOperaciones: 0 };
      return {
        label: formatMonthKeyLabel(mk),
        ventas: col.totalOperaciones,
        ingresos: col.totalGenerado,
      };
    });
  }, [allMonthKeys, monthColumnTotals]);

  const planDistribution = useMemo(() => {
    const planCounts = new Map<string, { count: number; amount: number }>();
    clientMatrixRows.forEach((r) => {
      const p = r.client.planContratado || 'Plan Estándar';
      const cur = planCounts.get(p) || { count: 0, amount: 0 };
      cur.count += 1;
      cur.amount += r.clientTotal;
      planCounts.set(p, cur);
    });

    const colors = ['#0047FF', '#059669', '#7C3AED', '#D97706', '#DC2626', '#0284C7'];
    let idx = 0;
    const totalAmount = granTotalCobros || 1;
    return Array.from(planCounts.entries()).map(([label, val]) => {
      const color = colors[idx % colors.length];
      idx++;
      return {
        label,
        count: val.count,
        amount: val.amount,
        percentage: ((val.amount / totalAmount) * 100).toFixed(1),
        color,
      };
    });
  }, [clientMatrixRows, granTotalCobros]);

  const monthlyRevenueComparison = useMemo(() => {
    const topMonths = allMonthKeys.slice(-6);
    return topMonths.map((mk) => {
      const col = monthColumnTotals.get(mk) || { altas: 0, renovaciones: 0, prorrateos: 0, anuales: 0 };
      return {
        period: formatMonthKeyLabel(mk).split(' ')[0],
        altas: col.altas,
        renovaciones: col.renovaciones,
        prorrateos: col.prorrateos + col.anuales,
      };
    });
  }, [allMonthKeys, monthColumnTotals]);

  return (
    <div className="reporte-general-container admin-module admin-module--reports pb-5">
      {/* 1. HEADER PRINCIPAL */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4 custom-card admin-module-heading p-3.5">
        <div className="d-flex align-items-center gap-3">
          <div className="section-header-icon section-header-icon-primary">
            <FileSpreadsheet size={24} strokeWidth={2.2} />
          </div>
          <div>
            <h1 className="h5 fw-bold text-dark mb-0.5">Reporte General y Resumen Financiero</h1>
            <p className="text-muted small mb-0">
              Datos matemáticamente idénticos 1 a 1 con el archivo Excel oficial descargable
            </p>
          </div>
        </div>
        <div className="d-flex align-items-center gap-2">
          <button
            onClick={exportToExcelLocal}
            disabled={isExportingExcel}
            className="btn-meta-action btn-meta-action-success"
            title="Exportar reporte consolidado oficial a formato Excel"
          >
            {isExportingExcel ? <RefreshCw size={16} className="spin-anim" /> : <FileSpreadsheet size={16} />}
            <span>{isExportingExcel ? 'Generando Excel...' : 'Exportar Excel'}</span>
          </button>
          <button
            onClick={() => loadData(token, true)}
            disabled={isSyncing}
            className="btn-meta-action btn-meta-action-secondary"
            title="Sincronizar datos con el servidor"
          >
            <RefreshCw size={15} className={isSyncing ? 'spin-anim' : ''} />
            <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar'}</span>
          </button>
        </div>
      </div>

      {/* 2. BLOQUE 1: RESUMEN GENERAL DE LA CARTERA (MÉTRICAS GLOBALES MACRO DE LA EMPRESA) */}
      <div className="mb-4">
        <div className="d-flex align-items-center justify-content-between mb-2.5 flex-wrap gap-2">
          <div className="d-flex align-items-center gap-2">
            <BarChart3 size={17} className="text-primary" />
            <strong className="text-dark fw-bold" style={{ fontSize: '0.96rem' }}>
              Resumen General de la Cartera (Métricas Globales de Empresa)
            </strong>
            <span className="badge rounded-pill bg-secondary-subtle text-secondary fw-semibold px-2 py-0.5" style={{ fontSize: '0.7rem' }}>
              Acumulado Global Histórico
            </span>
          </div>
          <small className="text-muted" style={{ fontSize: '0.78rem' }}>
            Estado macro de la cartera total (no sujeto a filtros de períodos mensuales)
          </small>
        </div>

        <div className="row g-3">
          {/* Card 1: Por Facturar Próximo Mes (Automático con Python) */}
          <div className="col-12 col-sm-6 col-lg-3">
            <div
              className="card admin-stat-card h-100 shadow-sm border-0"
              onClick={() => {
                setSelectedMesFacturacion(nextMonthKey);
                setActiveSection('TOTAL_MES');
                setTablePage(1);
              }}
              style={{ cursor: 'pointer', borderLeft: '4px solid #6366F1', backgroundColor: '#FAFAFE' }}
              title="Previa de todo lo que se debería ganar el próximo mes en planes activos (Regulares + Prorrateos + Adelantos)"
            >
              <div className="admin-stat-card-header">
                <span className="admin-stat-card-label fw-bold text-primary">
                  Previa {proyeccionNextMonth?.periodo_proyectado || formatMonthKeyLabel(nextMonthKey)}
                </span>
                <span className="admin-stat-card-icon admin-stat-card-icon--purple" style={{ backgroundColor: '#EEF2FF', color: '#4F46E5' }}>
                  <Calendar size={18} strokeWidth={2.2} />
                </span>
              </div>
              <div className="admin-stat-card-value text-primary" style={{ fontSize: '1.6rem' }}>
                {loadingProyeccion && !monthColumnTotals.get(nextMonthKey) ? (
                  <span className="text-muted fs-6">Calculando...</span>
                ) : (
                  `S/ ${(proyeccionNextMonth?.total_proyectado || monthColumnTotals.get(nextMonthKey)?.totalGenerado || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                )}
              </div>
              <div className="text-muted mt-auto pt-2 border-top d-flex flex-column gap-1" style={{ fontSize: '0.72rem' }}>
                <div className="d-flex justify-content-between align-items-center">
                  <span>Regulares ({proyeccionNextMonth?.count_regulares || 0}):</span>
                  <strong className="text-dark">S/ {(proyeccionNextMonth?.total_regulares || 0).toFixed(2)}</strong>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <span>Prorrateos ({proyeccionNextMonth?.count_prorrateados || 0}):</span>
                  <strong className="text-indigo" style={{ color: '#4F46E5' }}>S/ {(proyeccionNextMonth?.total_prorrateados || 0).toFixed(2)}</strong>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <span>Adelantos ({proyeccionNextMonth?.count_adelantos || 0}):</span>
                  <strong className="text-success">S/ {(proyeccionNextMonth?.total_adelantos || 0).toFixed(2)}</strong>
                </div>
                <div className="text-muted small mt-0.5 d-flex align-items-center gap-1" style={{ fontSize: '0.68rem' }}>
                  <Check size={11} className="text-success" /> Planes activos ({proyeccionNextMonth?.clientes_no_bloqueados || safeClients.filter(c => (c.estadoCuenta || '').toUpperCase() !== 'BLOQUEADO').length} sin bloqueados)
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Generado en Planes Activos (Mes Actual + Histórico) */}
          <div className="col-12 col-sm-6 col-lg-3">
            <div
              className="card admin-stat-card h-100 shadow-sm border-0"
              onClick={() => {
                setSelectedMesFacturacion(selectedMesFacturacion === currentMonthKey ? 'ALL' : currentMonthKey);
                setActiveSection('TOTAL_MES');
                setTablePage(1);
              }}
              style={{ cursor: 'pointer', borderLeft: '4px solid #10B981' }}
              title="Todo lo generado en planes activos en el mes actual y el acumulado histórico total"
            >
              <div className="admin-stat-card-header">
                <span className="admin-stat-card-label fw-bold text-success">
                  Planes Activos {formatMonthKeyLabel(currentMonthKey)}
                </span>
                <span className="admin-stat-card-icon admin-stat-card-icon--green">
                  <DollarSign size={18} strokeWidth={2.2} />
                </span>
              </div>
              <div className="admin-stat-card-value text-success" style={{ fontSize: '1.6rem' }}>
                S/ {(monthColumnTotals.get(currentMonthKey)?.totalGenerado || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-muted mt-auto pt-2 border-top d-flex flex-column gap-1" style={{ fontSize: '0.72rem' }}>
                <div className="d-flex justify-content-between align-items-center">
                  <span>Altas / Mensualidades:</span>
                  <strong className="text-dark">
                    S/ {((monthColumnTotals.get(currentMonthKey)?.altas || 0) + (monthColumnTotals.get(currentMonthKey)?.renovaciones || 0)).toFixed(2)}
                  </strong>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <span>Anuales / Prorrateos:</span>
                  <strong className="text-dark">
                    S/ {((monthColumnTotals.get(currentMonthKey)?.anuales || 0) + (monthColumnTotals.get(currentMonthKey)?.prorrateos || 0)).toFixed(2)}
                  </strong>
                </div>
                <div className="d-flex justify-content-between align-items-center pt-0.5 border-top">
                  <span>Acumulado Total:</span>
                  <strong className="text-success">S/ {granTotalCobros.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Cartera Total de Clientes */}
          <div className="col-12 col-sm-6 col-lg-3">
            <div
              className="card admin-stat-card h-100 shadow-sm border-0"
              onClick={() => setActiveSection('RESUMEN')}
              style={{ cursor: 'pointer', borderLeft: '4px solid #3B82F6' }}
              title="Clientes activos registrados en la base de datos"
            >
              <div className="admin-stat-card-header">
                <span className="admin-stat-card-label fw-bold">Cartera de Clientes</span>
                <span className="admin-stat-card-icon admin-stat-card-icon--blue">
                  <Users size={18} strokeWidth={2.2} />
                </span>
              </div>
              <div className="admin-stat-card-value text-dark" style={{ fontSize: '1.6rem' }}>
                {safeClients.length} clientes
              </div>
              <div className="text-muted mt-auto pt-2 border-top d-flex justify-content-between align-items-center" style={{ fontSize: '0.74rem' }}>
                <span>Al día: <strong className="text-success">{safeClients.filter(c => (c.estadoCuenta || '').toUpperCase() === 'HABILITADO').length}</strong></span>
                <span>Bloqueados: <strong className="text-danger">{safeClients.filter(c => (c.estadoCuenta || '').toUpperCase() === 'BLOQUEADO').length}</strong></span>
              </div>
            </div>
          </div>

          {/* Card 4: Deuda Total Pendiente de Cobro */}
          <div className="col-12 col-sm-6 col-lg-3">
            <div
              className="card admin-stat-card h-100 shadow-sm border-0"
              onClick={() => setActiveSection('BLOQUEADOS')}
              style={{ cursor: 'pointer', borderLeft: '4px solid #EF4444' }}
              title="Deuda total acumulada de clientes vencidos y bloqueados"
            >
              <div className="admin-stat-card-header">
                <span className="admin-stat-card-label fw-bold">Deuda Pendiente</span>
                <span className="admin-stat-card-icon admin-stat-card-icon--red">
                  <AlertTriangle size={18} strokeWidth={2.2} />
                </span>
              </div>
              <div className="admin-stat-card-value text-danger" style={{ fontSize: '1.6rem' }}>
                S/ {totalDeudaPendiente.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-muted mt-auto pt-2 border-top d-flex justify-content-between align-items-center" style={{ fontSize: '0.74rem' }}>
                <span><strong className="text-danger">{clientesConDeudaList.length} clientes</strong> impagos</span>
                <span className="badge bg-danger-subtle text-danger fw-bold">Vencidos + Bloqueados</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. BLOQUE 2: BARRA DE FILTROS DE ANÁLISIS DEL PERÍODO */}
      <div className="custom-card admin-report-filter-panel p-3.5 mb-4 shadow-sm" style={{ borderTop: '3px solid #0047FF' }}>
        <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom flex-wrap gap-2">
          <div className="d-flex align-items-center gap-2">
            <Search size={17} className="text-primary" />
            <strong className="text-dark fw-bold" style={{ fontSize: '0.92rem' }}>
              Filtros de Análisis del Período y Segmentación
            </strong>
            <span className="badge rounded-pill bg-primary-subtle text-primary fw-bold px-2 py-0.5" style={{ fontSize: '0.7rem' }}>
              Control Dinámico
            </span>
          </div>
          <div className="d-flex align-items-center gap-2">
            <span className="text-muted small" style={{ fontSize: '0.78rem' }}>
              Seleccione un mes o asesor para auditar el rendimiento del período
            </span>
            <button
              onClick={resetFilters}
              className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1 py-1 px-2.5 rounded-3"
              title="Restablecer todos los filtros"
            >
              <RotateCcw size={13} />
              <span>Limpiar Filtros</span>
            </button>
          </div>
        </div>

        <div className="row g-2.5 align-items-end">
          {/* Mes de Facturación */}
          <div className="col-12 col-sm-6 col-lg-3">
            <label className="form-label small fw-semibold text-dark mb-1 d-flex align-items-center gap-1">
              <Calendar size={14} className="text-primary" />
              <span>Mes de Facturación</span>
            </label>
            <select
              className="form-select form-select-sm rounded-3 fw-semibold border-primary shadow-xs"
              value={selectedMesFacturacion}
              onChange={(e) => {
                setSelectedMesFacturacion(e.target.value);
                setTablePage(1);
              }}
            >
              <option value="ALL">Histórico Consolidado (Todos los meses)</option>
              {availableBillingMonths.map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Asesor / Vendedor */}
          <div className="col-6 col-sm-6 col-lg-2">
            <label className="form-label small fw-semibold text-muted mb-1">Asesor / Vendedor</label>
            <select
              className="form-select form-select-sm rounded-3"
              value={selectedVendedor}
              onChange={(e) => {
                setSelectedVendedor(e.target.value);
                setTablePage(1);
              }}
            >
              <option value="ALL">Todos los asesores</option>
              {uniqueSellers.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          {/* Plan Contratado */}
          <div className="col-6 col-sm-6 col-lg-2">
            <label className="form-label small fw-semibold text-muted mb-1">Plan Contratado</label>
            <select
              className="form-select form-select-sm rounded-3"
              value={selectedPlan}
              onChange={(e) => {
                setSelectedPlan(e.target.value);
                setTablePage(1);
              }}
            >
              <option value="ALL">Todos los planes</option>
              {availablePlans.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Estado de Cuenta */}
          <div className="col-6 col-sm-6 col-lg-2">
            <label className="form-label small fw-semibold text-muted mb-1">Estado de Cuenta</label>
            <select
              className="form-select form-select-sm rounded-3"
              value={selectedEstadoCuenta}
              onChange={(e) => {
                setSelectedEstadoCuenta(e.target.value);
                setTablePage(1);
              }}
            >
              <option value="ALL">Todos los estados</option>
              <option value="HABILITADO">Habilitados (Al día)</option>
              <option value="VENCIDO">Vencidos (Pendientes)</option>
              <option value="BLOQUEADO">Bloqueados (Suspendidos)</option>
            </select>
          </div>

          {/* Buscador de Cliente por RUC o Razón Social */}
          <div className="col-12 col-sm-6 col-lg-3">
            <label className="form-label small fw-semibold text-muted mb-1">Buscar por RUC o Razón Social</label>
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-white border-end-0">
                <Search size={14} className="text-muted" />
              </span>
              <input
                type="text"
                className="form-control border-start-0 ps-0 rounded-end-3"
                placeholder="Ej. 20614429501 o Mi Empresa..."
                value={selectedCliente}
                onChange={(e) => {
                  setSelectedCliente(e.target.value);
                  setTablePage(1);
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 4. BLOQUE 3: RENDIMIENTO DEL PERÍODO SELECCIONADO */}
      <div className="mb-4">
        <div className="d-flex align-items-center justify-content-between mb-2.5 flex-wrap gap-2">
          <div className="d-flex align-items-center gap-2">
            <TrendingUp size={17} className="text-success" />
            <strong className="text-dark fw-bold" style={{ fontSize: '0.96rem' }}>
              Rendimiento del Período: {currentMonthLabel}
            </strong>
            <span className="badge rounded-pill bg-success-subtle text-success fw-bold px-2 py-0.5" style={{ fontSize: '0.7rem' }}>
              Resultados del Filtro
            </span>
          </div>
          <small className="text-muted" style={{ fontSize: '0.78rem' }}>
            Haz clic en cualquier tarjeta para auditar sus registros abajo
          </small>
        </div>

        <div className="row g-3 admin-stat-strip">
          {/* KPI 1: Cobrado en el Período */}
          <div className="col-12 col-sm-6 col-xl">
            <div
              className={`card admin-stat-card h-100 shadow-sm border-0 ${activeSection === 'TOTAL_MES' ? 'border border-2 border-success' : ''}`}
              onClick={() => setActiveSection('TOTAL_MES')}
              style={{ cursor: 'pointer' }}
              title="Total recaudado en el período seleccionado que coincide 1 a 1 con la columna del Excel"
            >
              <div className="admin-stat-card-header">
                <span className="admin-stat-card-label">Cobrado en el Período</span>
                <span className="admin-stat-card-icon admin-stat-card-icon--green">
                  <DollarSign size={18} strokeWidth={2.2} />
                </span>
              </div>
              <div className="admin-stat-card-value text-success" style={{ fontSize: '1.45rem' }}>
                S/ {kpiTotalRecaudado.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-muted mt-auto pt-2 border-top" style={{ fontSize: '0.72rem' }}>
                Período: <strong className="text-dark">{currentMonthLabel}</strong>
              </div>
            </div>
          </div>

          {/* KPI 2: Nuevas Altas del Período */}
          <div className="col-12 col-sm-6 col-xl">
            <div
              className={`card admin-stat-card h-100 shadow-sm border-0 ${activeSection === 'ALTAS' ? 'border border-2 border-success' : ''}`}
              onClick={() => setActiveSection('ALTAS')}
              style={{ cursor: 'pointer' }}
              title="Clientes que iniciaron su plan en este período"
            >
              <div className="admin-stat-card-header">
                <span className="admin-stat-card-label">Nuevas Altas</span>
                <span className="admin-stat-card-icon admin-stat-card-icon--green">
                  <UserPlus size={18} strokeWidth={2.2} />
                </span>
              </div>
              <div className="admin-stat-card-value text-dark" style={{ fontSize: '1.45rem' }}>
                S/ {kpiAltasMonto.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-muted mt-auto pt-2 border-top" style={{ fontSize: '0.72rem' }}>
                <strong className="text-success">{kpiAltasCount} clientes</strong> iniciaron aquí
              </div>
            </div>
          </div>

          {/* KPI 3: Renovaciones Mensuales */}
          <div className="col-12 col-sm-6 col-xl">
            <div
              className={`card admin-stat-card h-100 shadow-sm border-0 ${activeSection === 'MENSUALIDADES' ? 'border border-2 border-primary' : ''}`}
              onClick={() => setActiveSection('MENSUALIDADES')}
              style={{ cursor: 'pointer' }}
              title="Mensualidades recurrentes cobradas"
            >
              <div className="admin-stat-card-header">
                <span className="admin-stat-card-label">Renovaciones</span>
                <span className="admin-stat-card-icon admin-stat-card-icon--blue">
                  <Repeat size={18} strokeWidth={2.2} />
                </span>
              </div>
              <div className="admin-stat-card-value text-primary" style={{ fontSize: '1.45rem' }}>
                S/ {kpiRenovacionesMonto.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-muted mt-auto pt-2 border-top" style={{ fontSize: '0.72rem' }}>
                <strong className="text-primary">{kpiRenovacionesCount} cobros</strong> recurrentes
              </div>
            </div>
          </div>

          {/* KPI 4: Planes Anuales */}
          <div className="col-12 col-sm-6 col-xl">
            <div
              className={`card admin-stat-card h-100 shadow-sm border-0 ${activeSection === 'ANUALES' ? 'border border-2 border-purple' : ''}`}
              onClick={() => setActiveSection('ANUALES')}
              style={{ cursor: 'pointer' }}
              title="Venta anual contada únicamente en su mes de inicio"
            >
              <div className="admin-stat-card-header">
                <span className="admin-stat-card-label">Planes Anuales</span>
                <span className="admin-stat-card-icon admin-stat-card-icon--purple">
                  <Calendar size={18} strokeWidth={2.2} />
                </span>
              </div>
              <div className="admin-stat-card-value" style={{ fontSize: '1.45rem', color: '#7C3AED' }}>
                S/ {kpiAnualesMonto.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-muted mt-auto pt-2 border-top" style={{ fontSize: '0.72rem' }}>
                <strong style={{ color: '#7C3AED' }}>{kpiAnualesCount} suscripciones</strong> · 1 año
              </div>
            </div>
          </div>

          {/* KPI 5: Prorrateos Cobrados */}
          <div className="col-12 col-sm-6 col-xl">
            <div
              className={`card admin-stat-card h-100 shadow-sm border-0 ${activeSection === 'PRORRATEOS' ? 'border border-2 border-warning' : ''}`}
              onClick={() => setActiveSection('PRORRATEOS')}
              style={{ cursor: 'pointer' }}
              title="Cobros de ajustes de prorrateo"
            >
              <div className="admin-stat-card-header">
                <span className="admin-stat-card-label">Prorrateos</span>
                <span className="admin-stat-card-icon admin-stat-card-icon--orange">
                  <Layers size={18} strokeWidth={2.2} />
                </span>
              </div>
              <div className="admin-stat-card-value text-warning" style={{ fontSize: '1.45rem' }}>
                S/ {kpiProrrateosMonto.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-muted mt-auto pt-2 border-top" style={{ fontSize: '0.72rem' }}>
                Ajustes iniciales y 2.° prorrateo
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. PANEL DE CONCILIACIÓN CON EL EXCEL E INSPECTOR POR RUC */}
      <div className="custom-card p-3.5 mb-4 shadow-sm" style={{ borderLeft: '4px solid #10B981', backgroundColor: '#F8FAFC' }}>
        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <span className="badge rounded-pill bg-success-subtle text-success fw-bold px-2.5 py-1">
                <CheckCircle2 size={13} className="me-1 d-inline" />
                Conciliación con Excel: 100% Coincidente
              </span>
              <span className="text-dark fw-bold small">Período: {currentMonthLabel}</span>
            </div>
            <p className="text-muted small mb-0" style={{ fontSize: '0.8rem' }}>
              El <strong>Total Recaudado (S/ {kpiTotalRecaudado.toFixed(2)})</strong> equivale exactamente a la suma de la columna <strong>&quot;{currentMonthLabel}&quot;</strong> en el archivo Excel oficial. Para los clientes anuales, la venta figura únicamente en su mes de inicio y no se duplica en meses posteriores.
            </p>
          </div>

          <div className="d-flex align-items-center gap-2" style={{ minWidth: '320px' }}>
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-white border-end-0">
                <Search size={14} className="text-primary" />
              </span>
              <input
                type="text"
                className="form-control border-start-0 ps-0"
                placeholder="Verificar RUC en Excel (ej. 20614429501)..."
                value={verifierQuery}
                onChange={(e) => setVerifierQuery(e.target.value)}
              />
              {verifierQuery && (
                <button
                  className="btn btn-outline-secondary btn-sm"
                  type="button"
                  onClick={() => setVerifierQuery('')}
                >
                  <RotateCcw size={12} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tarjeta de resultado del verificador */}
        {verifierQuery.trim() !== '' && (
          <div className="mt-3 pt-3 border-top">
            {verifiedClientResult && verifiedClientResult.found ? (
              <div className="p-3 bg-white rounded-3 border d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 shadow-xs">
                <div>
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <strong className="text-dark">{verifiedClientResult.client?.razonSocial}</strong>
                    <span className="badge bg-light text-muted font-monospace">{verifiedClientResult.client?.ruc}</span>
                    <span
                      className={`badge rounded-pill ${
                        verifiedClientResult.client?.estadoCuenta === 'HABILITADO'
                          ? 'bg-success text-white'
                          : verifiedClientResult.client?.estadoCuenta === 'BLOQUEADO'
                          ? 'bg-danger text-white'
                          : 'bg-warning text-dark'
                      }`}
                    >
                      {verifiedClientResult.client?.estadoCuenta || 'SIN ESTADO'}
                    </span>
                  </div>
                  <div className="text-muted small" style={{ fontSize: '0.78rem' }}>
                    Plan: <strong className="text-dark">{verifiedClientResult.client?.planContratado || 'Plan Estándar'}</strong> · Tarifa: <strong>S/ {Number(verifiedClientResult.client?.montoMensual || 0).toFixed(2)}</strong> · Asesor: <strong>{verifiedClientResult.client?.vendedor || 'Por asignar'}</strong>
                  </div>
                  <div className="mt-1 small">
                    <span className="text-success fw-bold me-3">
                      ✓ Monto en Columna Excel ({currentMonthLabel}): S/ {Number(verifiedClientResult.montoMesSeleccionado || 0).toFixed(2)}
                    </span>
                    <span className="text-primary fw-semibold">
                      Total histórico cobrado en Excel: S/ {Number(verifiedClientResult.totalCobrosCliente || 0).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="d-flex align-items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => {
                      if (verifiedClientResult.client) setHistoryClient(verifiedClientResult.client);
                    }}
                    className="btn btn-primary btn-sm d-flex align-items-center gap-1.5 px-3 py-1.5 rounded-3 fw-semibold shadow-xs"
                  >
                    <Eye size={14} />
                    <span>Ver Historial de Pagos</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-2 text-center text-muted small bg-white rounded-3 border">
                No se encontró ningún cliente con el RUC o nombre &quot;{verifierQuery}&quot;.
              </div>
            )}
          </div>
        )}
      </div>

      {/* 5. BARRA DE NAVEGACIÓN POR CATEGORÍAS */}
      <div className="d-flex align-items-center gap-2 mb-4 overflow-x-auto pb-1" style={{ borderBottom: '2px solid #E2E8F0' }}>
        <button
          onClick={() => {
            setActiveSection('RESUMEN');
            setTablePage(1);
          }}
          className={`btn btn-sm px-3.5 py-2 fw-semibold rounded-pill d-flex align-items-center gap-2 ${
            activeSection === 'RESUMEN' ? 'btn-primary text-white shadow-sm' : 'btn-light text-secondary'
          }`}
          style={{ whiteSpace: 'nowrap' }}
        >
          <BarChart3 size={15} />
          <span>Vista Consolidada</span>
        </button>

        <button
          onClick={() => {
            setActiveSection('TOTAL_MES');
            setTablePage(1);
          }}
          className={`btn btn-sm px-3.5 py-2 fw-semibold rounded-pill d-flex align-items-center gap-2 ${
            activeSection === 'TOTAL_MES' ? 'btn-success text-white shadow-sm' : 'btn-light text-secondary'
          }`}
          style={{ whiteSpace: 'nowrap', backgroundColor: activeSection === 'TOTAL_MES' ? '#059669' : undefined }}
        >
          <Calendar size={15} />
          <span>Total por Meses ({monthlySummaryTableData.length})</span>
          <span className="badge rounded-pill bg-white text-success px-2 py-0.5" style={{ fontSize: '0.7rem' }}>
            S/ {granTotalCobros.toFixed(0)}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveSection('PAGOS_MES');
            setTablePage(1);
          }}
          className={`btn btn-sm px-3.5 py-2 fw-semibold rounded-pill d-flex align-items-center gap-2 ${
            activeSection === 'PAGOS_MES' ? 'btn-primary text-white shadow-sm' : 'btn-light text-secondary'
          }`}
          style={{ whiteSpace: 'nowrap', backgroundColor: activeSection === 'PAGOS_MES' ? '#4F46E5' : undefined }}
          title="Ver en una sola hoja todos los pagos confirmados del mes seleccionado con comprobante, medio y fecha"
        >
          <CreditCard size={15} />
          <span>Hoja de Pagos del Mes ({pagosDelMesSeleccionado.length})</span>
          <span className="badge rounded-pill bg-white px-2 py-0.5" style={{ fontSize: '0.7rem', color: '#4F46E5' }}>
            S/ {pagosDelMesSeleccionado.reduce((acc, p) => acc + p.monto, 0).toFixed(0)}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveSection('ALTAS');
            setTablePage(1);
          }}
          className={`btn btn-sm px-3.5 py-2 fw-semibold rounded-pill d-flex align-items-center gap-2 ${
            activeSection === 'ALTAS' ? 'btn-success text-white shadow-sm' : 'btn-light text-secondary'
          }`}
          style={{ whiteSpace: 'nowrap' }}
        >
          <UserPlus size={15} />
          <span>Nuevas Altas ({kpiAltasCount})</span>
          <span className="badge rounded-pill bg-white text-success px-2 py-0.5" style={{ fontSize: '0.7rem' }}>
            S/ {kpiAltasMonto.toFixed(0)}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveSection('MENSUALIDADES');
            setTablePage(1);
          }}
          className={`btn btn-sm px-3.5 py-2 fw-semibold rounded-pill d-flex align-items-center gap-2 ${
            activeSection === 'MENSUALIDADES' ? 'btn-primary text-white shadow-sm' : 'btn-light text-secondary'
          }`}
          style={{ whiteSpace: 'nowrap', backgroundColor: activeSection === 'MENSUALIDADES' ? '#3B82F6' : undefined }}
        >
          <Repeat size={15} />
          <span>Renovaciones ({kpiRenovacionesCount})</span>
          <span className="badge rounded-pill bg-white text-primary px-2 py-0.5" style={{ fontSize: '0.7rem' }}>
            S/ {kpiRenovacionesMonto.toFixed(0)}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveSection('ANUALES');
            setTablePage(1);
          }}
          className={`btn btn-sm px-3.5 py-2 fw-semibold rounded-pill d-flex align-items-center gap-2 ${
            activeSection === 'ANUALES' ? 'btn-dark text-white shadow-sm' : 'btn-light text-secondary'
          }`}
          style={{ whiteSpace: 'nowrap', backgroundColor: activeSection === 'ANUALES' ? '#7C3AED' : undefined }}
        >
          <Calendar size={15} />
          <span>Planes Anuales ({kpiAnualesCount})</span>
          <span className="badge rounded-pill bg-white px-2 py-0.5" style={{ fontSize: '0.7rem', color: '#7C3AED' }}>
            S/ {kpiAnualesMonto.toFixed(0)}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveSection('PRORRATEOS');
            setTablePage(1);
          }}
          className={`btn btn-sm px-3.5 py-2 fw-semibold rounded-pill d-flex align-items-center gap-2 ${
            activeSection === 'PRORRATEOS' ? 'btn-warning text-dark shadow-sm' : 'btn-light text-secondary'
          }`}
          style={{ whiteSpace: 'nowrap' }}
        >
          <Layers size={15} />
          <span>Prorrateos</span>
          <span className="badge rounded-pill bg-white text-dark px-2 py-0.5" style={{ fontSize: '0.7rem' }}>
            S/ {overallProrrateosTotal.toFixed(0)}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveSection('BLOQUEADOS');
            setTablePage(1);
          }}
          className={`btn btn-sm px-3.5 py-2 fw-semibold rounded-pill d-flex align-items-center gap-2 ${
            activeSection === 'BLOQUEADOS' ? 'btn-danger text-white shadow-sm' : 'btn-light text-secondary'
          }`}
          style={{ whiteSpace: 'nowrap' }}
        >
          <AlertTriangle size={15} />
          <span>Deuda ({clientesConDeudaList.length})</span>
          <span className="badge rounded-pill bg-white text-danger px-2 py-0.5" style={{ fontSize: '0.7rem' }}>
            S/ {totalDeudaPendiente.toFixed(0)}
          </span>
        </button>
      </div>

      {/* 6. TABLA CONSOLIDADA: TOTAL GENERADO POR MES (COINCIDENCIA EXACTA EXCEL) */}
      {(activeSection === 'RESUMEN' || activeSection === 'TOTAL_MES') && (
        <div className="custom-card p-4 mb-4 shadow-sm" style={{ borderLeft: '4px solid #059669', backgroundColor: '#FFFFFF' }}>
          <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom flex-wrap gap-2">
            <div>
              <div className="d-flex align-items-center gap-2">
                <Calendar size={18} className="text-success" />
                <strong className="text-dark fw-bold" style={{ fontSize: '0.98rem' }}>
                  Total Generado por Mes (Recaudación Consolidada Mensual)
                </strong>
                <span className="badge rounded-pill bg-success-subtle text-success fw-bold px-2.5 py-0.5" style={{ fontSize: '0.72rem' }}>
                  Cálculo Oficial Excel
                </span>
              </div>
              <small className="text-muted d-block mt-0.5" style={{ fontSize: '0.78rem' }}>
                Para los clientes con plan <strong>ANUAL</strong>, la venta solo se cuenta una vez en el mes que inició su plan (ej. si inicia en diciembre, figura en diciembre y en enero ya no se repite).
              </small>
            </div>
            <div className="d-flex align-items-center gap-2">
              <span className="badge-tag" style={{ backgroundColor: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0', fontWeight: 'bold', fontSize: '0.85rem', padding: '0.35rem 0.75rem' }}>
                Gran Total Acumulado: S/ {granTotalCobros.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 table-meta">
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC' }}>
                  <th>Mes de Facturación</th>
                  <th className="text-center">Clientes con Cobro</th>
                  <th className="text-end">Nuevas Altas (S/)</th>
                  <th className="text-end">Mensualidades (S/)</th>
                  <th className="text-end" style={{ color: '#7C3AED' }}>Planes Anuales (S/)</th>
                  <th className="text-end text-warning">Prorrateos (S/)</th>
                  <th className="text-end" style={{ color: '#0047FF' }}>TOTAL GENERADO (S/)</th>
                </tr>
              </thead>
              <tbody>
                {monthlySummaryTableData.map((row) => {
                  const isSelected = selectedMesFacturacion === row.monthKey;
                  return (
                    <tr
                      key={row.monthKey}
                      style={{
                        backgroundColor: isSelected ? '#EFF6FF' : undefined,
                        cursor: 'pointer',
                      }}
                      onClick={() => {
                        setSelectedMesFacturacion(isSelected ? 'ALL' : row.monthKey);
                        setTablePage(1);
                      }}
                      title="Haz clic para filtrar los KPIs y la tabla por este mes"
                    >
                      <td>
                        <strong className="text-dark d-flex align-items-center gap-1.5 flex-wrap">
                          <span>{row.label}</span>
                          {row.monthKey === nextMonthKey && (
                            <span className="badge rounded-pill" style={{ backgroundColor: '#EEF2FF', color: '#4F46E5', border: '1px solid #C7D2FE', fontSize: '0.68rem' }}>
                              Previa Mes Siguiente (Planes Activos)
                            </span>
                          )}
                          {row.monthKey === currentMonthKey && (
                            <span className="badge rounded-pill bg-success-subtle text-success" style={{ fontSize: '0.68rem' }}>
                              Mes Actual (Planes Activos)
                            </span>
                          )}
                          {isSelected && <span className="badge bg-primary ms-1">Filtrado</span>}
                        </strong>
                        <small className="text-muted font-monospace">{row.monthKey}</small>
                      </td>
                      <td className="text-center">
                        <span className="badge rounded-pill bg-light text-dark border px-2 py-1">
                          {row.cantidadOperaciones} cobros
                        </span>
                      </td>
                      <td className="text-end text-success fw-semibold">
                        S/ {row.altas.toFixed(2)}
                      </td>
                      <td className="text-end text-primary fw-semibold">
                        S/ {row.renovaciones.toFixed(2)}
                      </td>
                      <td className="text-end fw-semibold" style={{ color: '#7C3AED' }}>
                        S/ {row.anuales.toFixed(2)}
                      </td>
                      <td className="text-end text-warning fw-semibold">
                        S/ {row.prorrateos.toFixed(2)}
                      </td>
                      <td className="text-end">
                        <strong className="text-dark fw-bold" style={{ fontSize: '1rem' }}>
                          S/ {row.totalGenerado.toFixed(2)}
                        </strong>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ backgroundColor: '#F1F5F9', borderTop: '2px solid #CBD5E1' }}>
                  <td className="fw-bold text-dark">TOTAL GENERAL ACUMULADO</td>
                  <td className="text-center fw-bold text-dark">
                    {monthlySummaryTableData.reduce((acc, r) => acc + r.cantidadOperaciones, 0)} cobros
                  </td>
                  <td className="text-end fw-bold text-success">
                    S/ {overallAltasTotal.toFixed(2)}
                  </td>
                  <td className="text-end fw-bold text-primary">
                    S/ {overallRenovacionesTotal.toFixed(2)}
                  </td>
                  <td className="text-end fw-bold" style={{ color: '#7C3AED' }}>
                    S/ {overallAnualesTotal.toFixed(2)}
                  </td>
                  <td className="text-end fw-bold text-warning">
                    S/ {overallProrrateosTotal.toFixed(2)}
                  </td>
                  <td className="text-end">
                    <strong className="text-success fw-bold" style={{ fontSize: '1.08rem' }}>
                      S/ {granTotalCobros.toFixed(2)}
                    </strong>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* 7. GRÁFICOS INTERACTIVOS (EN VISTA CONSOLIDADA) */}
      {activeSection === 'RESUMEN' && (
        <>
          <div className="row g-3 mb-4">
            <div className="col-12 col-lg-5">
              <div className="custom-card admin-chart-card p-4 h-100 d-flex flex-column justify-content-between shadow-sm">
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <strong className="text-dark fw-bold d-block" style={{ fontSize: '0.92rem' }}>
                      Salud de Cartera y Cobranza
                    </strong>
                    <span className="badge-tag" style={{ backgroundColor: '#FEF2F2', color: '#B91C1C', borderColor: '#FECACA' }}>
                      S/ {totalDeudaPendiente.toFixed(0)} en deuda
                    </span>
                  </div>
                  <small className="text-muted d-block mb-3" style={{ fontSize: '0.74rem' }}>
                    Cobrado efectivo vs cartera con deuda (Vencidos y Bloqueados)
                  </small>
                  <PortfolioHealthChart
                    cobrado={kpiTotalRecaudado}
                    porCobrar={totalDeudaPendiente}
                    vencido={clientesConDeudaList.filter((c) => c.estado === 'VENCIDO').reduce((acc, c) => acc + c.tarifa, 0)}
                    bloqueado={clientesConDeudaList.filter((c) => c.estado === 'BLOQUEADO').reduce((acc, c) => acc + c.tarifa, 0)}
                  />
                </div>
                <div className="pt-3 border-top mt-3">
                  <div className="row g-2 text-center" style={{ fontSize: '0.74rem' }}>
                    <div className="col-4 p-1 rounded-2" style={{ backgroundColor: '#ECFDF5' }}>
                      <span className="text-muted d-block" style={{ fontSize: '0.68rem' }}>Cobrado</span>
                      <strong className="text-success fw-bold">S/ {kpiTotalRecaudado.toFixed(0)}</strong>
                    </div>
                    <div className="col-4 p-1 rounded-2" style={{ backgroundColor: '#FFFBEB' }}>
                      <span className="text-muted d-block" style={{ fontSize: '0.68rem' }}>Vencidos</span>
                      <strong className="text-warning fw-bold">S/ {clientesConDeudaList.filter((c) => c.estado === 'VENCIDO').reduce((acc, c) => acc + c.tarifa, 0).toFixed(2)}</strong>
                    </div>
                    <div className="col-4 p-1 rounded-2" style={{ backgroundColor: '#FEF2F2' }}>
                      <span className="text-muted d-block" style={{ fontSize: '0.68rem' }}>Bloqueados</span>
                      <strong className="text-danger fw-bold">S/ {clientesConDeudaList.filter((c) => c.estado === 'BLOQUEADO').reduce((acc, c) => acc + c.tarifa, 0).toFixed(2)}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-12 col-lg-7">
              <div className="custom-card admin-chart-card p-4 h-100 d-flex flex-column justify-content-between shadow-sm">
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <strong className="text-dark fw-bold d-block" style={{ fontSize: '0.92rem' }}>
                      Ingresos por Concepto (Altas vs Mensualidades vs Anuales/Prorrateos)
                    </strong>
                    <span className="badge-tag" style={{ backgroundColor: '#EFF6FF', color: '#1D4ED8', borderColor: '#BFDBFE' }}>
                      Datos en Soles (S/)
                    </span>
                  </div>
                  <small className="text-muted d-block mb-3" style={{ fontSize: '0.74rem' }}>
                    Origen del dinero recaudado por período
                  </small>
                  <RevenueTypeBarChart data={monthlyRevenueComparison} />
                </div>
                <div className="d-flex flex-wrap justify-content-between align-items-center pt-2.5 mt-2 border-top gap-2" style={{ fontSize: '0.75rem' }}>
                  <span className="text-muted fw-semibold">
                    Altas: <strong className="text-success fw-bold">S/ {kpiAltasMonto.toFixed(2)}</strong>
                  </span>
                  <span className="text-muted fw-semibold">
                    Mensualidades: <strong className="text-primary fw-bold">S/ {kpiRenovacionesMonto.toFixed(2)}</strong>
                  </span>
                  <span className="text-muted fw-semibold">
                    Anuales y Prorrateos: <strong style={{ color: '#8B5CF6' }}>S/ {(kpiAnualesMonto + overallProrrateosTotal).toFixed(2)}</strong>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="row g-3 mb-4">
            <div className="col-12 col-lg-7">
              <div className="custom-card admin-chart-card p-4 h-100 d-flex flex-column justify-content-between shadow-sm">
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
                    <div>
                      <strong className="text-dark fw-bold d-block" style={{ fontSize: '0.92rem' }}>
                        Evolución Mensual de Facturación y Cobranza
                      </strong>
                      <small className="text-muted" style={{ fontSize: '0.74rem' }}>
                        Cobros recaudados en los últimos períodos
                      </small>
                    </div>
                  </div>
                  <SalesTimelineChart data={timelineData} />
                </div>
              </div>
            </div>

            <div className="col-12 col-lg-5">
              <div className="custom-card admin-chart-card p-4 h-100 d-flex flex-column justify-content-between shadow-sm">
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
                    <strong className="text-dark fw-bold d-block" style={{ fontSize: '0.92rem' }}>
                      Distribución por Plan Contratado
                    </strong>
                    <span className="badge-tag badge-plan-tag">{planDistribution.length} planes</span>
                  </div>
                  <div className="row align-items-center g-3 pt-2">
                    <div className="col-5 d-flex justify-content-center">
                      <PlanDoughnutChart data={planDistribution} totalVentas={granTotalCobros} />
                    </div>
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
                                <div className="progress-bar rounded-pill" role="progressbar" style={{ width: `${p.percentage}%`, backgroundColor: p.color }} />
                              </div>
                              <strong className="text-dark fw-bold" style={{ fontSize: '0.78rem' }}>S/ {p.amount.toFixed(2)}</strong>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 8.1 HOJA DE PAGOS DEL MES SELECCIONADO (CORROBORADO CON HISTORIAL DE PAGOS) */}
      {activeSection === 'PAGOS_MES' && (
        <div className="custom-card p-4 shadow-sm mb-4" style={{ borderLeft: '4px solid #4F46E5', backgroundColor: '#FFFFFF' }}>
          <div className="d-flex justify-content-between align-items-center mb-3 pb-3 border-bottom flex-wrap gap-2">
            <div>
              <div className="d-flex align-items-center gap-2">
                <CreditCard size={18} className="text-primary" />
                <strong className="text-dark fw-bold" style={{ fontSize: '1rem' }}>
                  Hoja Oficial de Pagos: {formatMonthKeyLabel(activeMonthForPayments)}
                </strong>
                <span className="badge rounded-pill" style={{ backgroundColor: '#EEF2FF', color: '#4F46E5', border: '1px solid #C7D2FE', fontSize: '0.72rem' }}>
                  {pagosDelMesSeleccionado.length} pagos registrados
                </span>
              </div>
              <small className="text-muted d-block mt-1">
                Listado completo de todos los pagos corroborados en el historial para este mes (incluye adelantos imputados al siguiente mes y prorrateos).
              </small>
            </div>
            <div className="d-flex align-items-center gap-2">
              <span className="badge-tag" style={{ backgroundColor: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0', fontWeight: 'bold', fontSize: '0.88rem', padding: '0.4rem 0.8rem' }}>
                Total Pagos del Mes: S/ {pagosDelMesSeleccionado.reduce((acc, p) => acc + p.monto, 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 table-meta">
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC' }}>
                  <th>Cliente / Razón Social</th>
                  <th>RUC</th>
                  <th>Fecha de Pago</th>
                  <th>Período Cubierto</th>
                  <th>Medio / Código Op.</th>
                  <th>Tipo / Concepto</th>
                  <th>Asesor</th>
                  <th className="text-end">Monto Pagado (S/)</th>
                  <th className="text-end">Historial</th>
                </tr>
              </thead>
              <tbody>
                {pagosDelMesSeleccionado.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center text-muted py-5 fw-semibold">
                      No se encontraron pagos registrados para {formatMonthKeyLabel(activeMonthForPayments)}. Puedes cambiar el mes en el selector de filtros superior.
                    </td>
                  </tr>
                ) : (
                  pagosDelMesSeleccionado.map((p, idx) => (
                    <tr key={idx}>
                      <td>
                        <strong className="text-dark d-block">{p.razonSocial}</strong>
                        <small className="text-muted">{p.plan}</small>
                      </td>
                      <td className="font-monospace text-muted">{p.ruc || '—'}</td>
                      <td>
                        <strong className="text-dark d-block">{p.fechaPagoStr}</strong>
                        <small className="text-muted font-monospace">{p.fechaRegistroStr}</small>
                      </td>
                      <td>
                        <span className="badge rounded-pill bg-light text-dark border px-2.5 py-1 font-monospace" style={{ fontSize: '0.74rem' }}>
                          {p.periodoCubiertoStr}
                        </span>
                      </td>
                      <td>
                        <span className="badge bg-secondary-subtle text-secondary fw-semibold d-block text-truncate mb-0.5" style={{ maxWidth: '140px', fontSize: '0.7rem' }}>
                          {p.medioPago}
                        </span>
                        <small className="text-muted font-monospace">{p.codigoOperacion}</small>
                      </td>
                      <td>
                        <div className="d-flex flex-column gap-1">
                          <span
                            className={`badge rounded-pill ${
                              p.esAdelanto
                                ? 'bg-success text-white'
                                : p.esProrrateo
                                ? 'bg-warning text-dark'
                                : 'bg-primary text-white'
                            }`}
                            style={{ fontSize: '0.7rem', width: 'fit-content' }}
                          >
                            {p.esAdelanto ? 'Adelanto Siguiente Mes' : p.esProrrateo ? 'Prorrateo' : p.tipoVenta}
                          </span>
                          <small className="text-muted text-truncate" style={{ maxWidth: '160px', fontSize: '0.68rem' }} title={p.observaciones}>
                            {p.observaciones}
                          </small>
                        </div>
                      </td>
                      <td className="text-dark fw-semibold">{p.asesor}</td>
                      <td className="text-end">
                        <strong className="text-success fw-bold" style={{ fontSize: '1rem' }}>
                          S/ {p.monto.toFixed(2)}
                        </strong>
                      </td>
                      <td className="text-end">
                        <button
                          onClick={() => {
                            const found = safeClients.find((c) => String(c.id) === p.clienteId || c.ruc === p.ruc);
                            if (found) setHistoryClient(found);
                          }}
                          className="btn btn-outline-primary btn-sm py-1 px-2 rounded-3 d-inline-flex align-items-center gap-1"
                          title="Ver historial completo del cliente"
                        >
                          <Eye size={13} />
                          <span>Historial</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr style={{ backgroundColor: '#F8FAFC', borderTop: '2px solid #CBD5E1' }}>
                  <td colSpan={7} className="fw-bold text-dark py-2.5">
                    TOTAL PAGOS COBRADOS ({pagosDelMesSeleccionado.length} transacciones en {formatMonthKeyLabel(activeMonthForPayments)})
                  </td>
                  <td className="fw-bold py-2.5 text-end text-success" style={{ fontSize: '1.05rem' }}>
                    S/ {pagosDelMesSeleccionado.reduce((acc, p) => acc + p.monto, 0).toFixed(2)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* 8. TABLA DE CLIENTES CON DEUDA (SI LA SECCIÓN ES 'BLOQUEADOS') */}
      {activeSection === 'BLOQUEADOS' && (
        <div className="custom-card p-3.5 shadow-sm mb-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <strong className="text-dark fw-bold d-block" style={{ fontSize: '0.92rem' }}>
                Listado de Clientes con Deuda (Vencidos y Bloqueados)
              </strong>
              <small className="text-muted">
                Mostrando {clientesConDeudaList.length} clientes · Monto pendiente de cobro real (deuda)
              </small>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 table-meta">
              <thead>
                <tr>
                  <th>Cliente / Razón Social</th>
                  <th>RUC</th>
                  <th>Estado de Cuenta</th>
                  <th>Monto Pendiente (Deuda)</th>
                  <th>Vencimiento</th>
                  <th>Asesor</th>
                  <th>Contacto</th>
                  <th className="text-end">Historial</th>
                </tr>
              </thead>
              <tbody>
                {clientesConDeudaList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center text-muted py-4 fw-semibold">
                      Excelente: No existen clientes vencidos ni bloqueados con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  clientesConDeudaList.map((item, idx) => {
                    const isBloq = item.estado === 'BLOQUEADO';
                    return (
                      <tr key={idx}>
                        <td>
                          <strong className="text-dark d-block">{item.razonSocial}</strong>
                          <small className="text-muted">{item.client.planContratado || 'Plan Estándar'}</small>
                        </td>
                        <td className="font-monospace text-muted">{item.ruc}</td>
                        <td>
                          <span
                            className="badge rounded-pill px-2.5 py-1 fw-bold"
                            style={{
                              backgroundColor: isBloq ? '#FEE2E2' : '#FEF3C7',
                              color: isBloq ? '#991B1B' : '#92400E',
                            }}
                          >
                            {item.estado}
                          </span>
                        </td>
                        <td>
                          <strong className="text-danger fw-bold" style={{ fontSize: '0.95rem' }}>
                            S/ {item.tarifa.toFixed(2)}
                          </strong>
                        </td>
                        <td className="text-muted">{item.fechaVencimientoStr}</td>
                        <td className="text-dark fw-semibold">{item.asesor}</td>
                        <td className="text-muted font-monospace">{item.telefono || '—'}</td>
                        <td className="text-end">
                          <button
                            onClick={() => setHistoryClient(item.client)}
                            className="btn btn-outline-primary btn-sm py-1 px-2.5 rounded-3 d-inline-flex align-items-center gap-1"
                            title="Ver historial de pagos de este cliente"
                          >
                            <Eye size={13} />
                            <span>Historial</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 9. TABLA PRINCIPAL DE AUDITORÍA Y DETALLE DE OPERACIONES */}
      {activeSection !== 'BLOQUEADOS' && activeSection !== 'PAGOS_MES' && (
        <div className="custom-card admin-report-table-card p-3.5 shadow-sm">
          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <div>
              <strong className="small text-dark fw-bold d-block">
                {activeSection === 'ALTAS'
                  ? 'Detalle de Nuevas Altas (Mes de Inicio de Plan)'
                  : activeSection === 'MENSUALIDADES'
                  ? 'Detalle de Renovaciones Recurrentes'
                  : activeSection === 'ANUALES'
                  ? 'Detalle de Planes Anuales (Vigencia 12 Meses)'
                  : activeSection === 'PRORRATEOS'
                  ? 'Detalle de Cobros con Prorrateo'
                  : 'Detalle de Operaciones y Facturación'}
              </strong>
              <small className="text-muted">
                Mostrando {displayedRows.length} de {detailedTableList.length} operaciones filtradas · Período: {currentMonthLabel}
              </small>
            </div>
            <div className="d-flex align-items-center gap-2">
              <span className="badge-tag" style={{ backgroundColor: '#F1F5F9', color: '#475569' }}>
                {currentMonthLabel}
              </span>
            </div>
          </div>

          <div className="table-card-meta mb-3">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 table-meta">
                <thead>
                  <tr>
                    <th>Cliente / Empresa</th>
                    <th>RUC</th>
                    <th>Mes de Facturación</th>
                    <th>Plan Contratado</th>
                    <th>Tipo Ingreso</th>
                    <th>Asesor</th>
                    <th>Monto en Excel (S/)</th>
                    <th>Estado de Cuenta</th>
                    <th className="text-end">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedRows.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center text-muted py-5 fw-semibold">
                        No se encontraron registros para esta sección con los filtros actuales.
                      </td>
                    </tr>
                  ) : (
                    displayedRows.map((t) => (
                      <tr key={t.id}>
                        <td>
                          <strong className="text-dark d-block">{t.razonSocial}</strong>
                          <small className="text-muted">{t.client.nombreComercial || '—'}</small>
                        </td>
                        <td className="font-monospace text-muted">{t.ruc}</td>
                        <td>
                          <span className="badge rounded-pill bg-light text-dark border px-2 py-0.5 font-monospace">
                            {t.mesLabel}
                          </span>
                        </td>
                        <td>
                          <span className="badge-tag badge-plan-tag">{t.plan}</span>
                        </td>
                        <td>
                          <span
                            className={`badge-tag ${
                              t.esAdelanto
                                ? 'badge-tag-success'
                                : t.tipo === 'ALTA'
                                ? 'badge-tag-success'
                                : t.tipo === 'RENOVACION'
                                ? 'badge-tag-primary'
                                : t.tipo === 'ANUAL'
                                ? 'badge-tag-dark'
                                : 'badge-tag-warning'
                            }`}
                            style={{
                              fontSize: '0.72rem',
                              backgroundColor: t.tipo === 'ANUAL' ? '#EDE9FE' : undefined,
                              color: t.tipo === 'ANUAL' ? '#7C3AED' : undefined,
                              border: t.tipo === 'ANUAL' ? '1px solid #C4B5FD' : undefined,
                            }}
                          >
                            {t.esAdelanto && t.tipo === 'PRORRATEO'
                              ? 'Adelanto + Prorrateo'
                              : t.esAdelanto
                              ? 'Adelanto Pagado'
                              : t.esPrevia && t.tipo === 'PRORRATEO'
                              ? 'Previa Prorrateo'
                              : t.esPrevia && t.tipo === 'RENOVACION'
                              ? 'Previa Renovación'
                              : t.tipo === 'ALTA'
                              ? 'Nueva Alta'
                              : t.tipo === 'RENOVACION'
                              ? 'Renovación Mensual'
                              : t.tipo === 'ANUAL'
                              ? 'Alta (Plan Anual)'
                              : 'Prorrateo'}
                          </span>
                        </td>
                        <td className="text-dark fw-semibold">{t.asesor}</td>
                        <td>
                          <span className="cell-amount text-dark fw-bold">S/ {t.monto.toFixed(2)}</span>
                        </td>
                        <td>
                          <span
                            className={`badge-fb ${
                              t.estado === 'HABILITADO' ? 'badge-fb-success' : 'badge-fb-warning'
                            }`}
                          >
                            <span
                              className={`badge-dot ${
                                t.estado === 'HABILITADO' ? 'badge-dot-success' : 'badge-dot-warning'
                              }`}
                            />
                            {t.estado === 'HABILITADO' ? 'Habilitado' : t.estado}
                          </span>
                        </td>
                        <td className="text-end">
                          <button
                            onClick={() => setHistoryClient(t.client)}
                            className="btn btn-outline-primary btn-sm py-1 px-2.5 rounded-3 d-inline-flex align-items-center gap-1"
                            title="Ver historial de pagos de este cliente"
                          >
                            <Eye size={13} />
                            <span>Historial</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr style={{ backgroundColor: '#F8FAFC', borderTop: '2px solid #CBD5E1' }}>
                    <td colSpan={6} className="fw-bold text-dark py-2.5">
                      TOTAL OPERACIONES FILTRADAS ({detailedTableList.length} registros)
                    </td>
                    <td className="fw-bold py-2.5" style={{ color: '#0047FF', fontSize: '0.98rem' }}>
                      S/ {detailedTableList.reduce((acc, t) => acc + t.monto, 0).toFixed(2)}
                    </td>
                    <td colSpan={2} className="text-muted small py-2.5 text-end">
                      Total coincidente 100% con columna Excel
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {detailedTableList.length > ITEMS_PER_PAGE && (
            <div className="d-flex justify-content-between align-items-center pt-3 border-top mt-2">
              <button
                type="button"
                className="btn btn-link btn-sm text-primary fw-semibold p-0 text-decoration-none"
                onClick={() => setShowAllRows(!showAllRows)}
              >
                {showAllRows ? 'Ver paginado' : 'Ver todas las operaciones'}
              </button>
              {!showAllRows && (
                <div className="d-flex align-items-center gap-1.5">
                  <button
                    className="btn btn-outline-secondary btn-sm px-2 py-1"
                    disabled={tablePage <= 1}
                    onClick={() => setTablePage((p) => Math.max(p - 1, 1))}
                  >
                    Anterior
                  </button>
                  <span className="small text-muted px-1">
                    {tablePage} / {totalPages}
                  </span>
                  <button
                    className="btn btn-outline-secondary btn-sm px-2 py-1"
                    disabled={tablePage >= totalPages}
                    onClick={() => setTablePage((p) => Math.min(p + 1, totalPages))}
                  >
                    Siguiente
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
