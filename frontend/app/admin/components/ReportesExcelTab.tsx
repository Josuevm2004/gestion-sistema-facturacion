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
  Tag,
  AlertTriangle,
  History,
  Layers,
  CalendarDays,
  FileText,
  Clock
} from 'lucide-react';
import { Client } from './ClientesTodosTab';

export interface ReportesExcelTabProps {
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
  setHistoryClient,
}: ReportesExcelTabProps) {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonthNum = String(currentDate.getMonth() + 1).padStart(2, '0');

  // Selector de Año y Mes
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthNum);

  // Sub-Pestaña activa: 'TODOS' | 'MENSUAL' | 'ANUAL' | 'PERDIDA'
  const [activeReportSubTab, setActiveReportSubTab] = useState<'TODOS' | 'MENSUAL' | 'ANUAL' | 'POR_CAPACITAR' | 'PERDIDA'>('TODOS');

  // Filtros de búsqueda
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterVendedor, setFilterVendedor] = useState<string>('ALL');
  const [filterConcepto, setFilterConcepto] = useState<string>('ALL');
  const [filterMedioPago, setFilterMedioPago] = useState<string>('ALL');

  // Paginación
  const [currentPage, setCurrentPage] = useState<number>(1);
  const ITEMS_PER_PAGE = 25;

  const [isExportingExcel, setIsExportingExcel] = useState<boolean>(false);

  const safeClients = useMemo(() => (Array.isArray(clients) ? clients : []), [clients]);
  const safePayments = useMemo(() => (Array.isArray(payments) ? payments : []), [payments]);

  // Diccionario rápido de clientes
  const clientMap = useMemo(() => {
    const map = new Map<string, Client>();
    safeClients.forEach((c) => {
      if (c.id) map.set(String(c.id), c);
      if (c.ruc) {
        map.set(`ruc-${c.ruc.trim()}`, c);
        map.set(c.ruc.trim(), c);
      }
    });
    return map;
  }, [safeClients]);

  const getClientRowKey = (rawCId?: any, rawRuc?: string | null): string => {
    const cleanRuc = (rawRuc || '').trim();
    if (cleanRuc && cleanRuc !== '—') {
      return `ruc-${cleanRuc}`;
    }
    const cleanId = rawCId ? String(rawCId).trim() : '';
    if (cleanId) {
      return `id-${cleanId}`;
    }
    return '';
  };

  // Parseador de fechas seguro sin desfasaje de zona horaria
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

  // Helper para resolver el mes correspondiente (gestiona prorrateos, adelantos expresos y fechas de vigencia)
  const resolveTargetMonthKey = (
    fPago: Date | null,
    fInicio: Date | null,
    obsRaw: string,
    tipoVentaRaw: string,
    pagoItem?: any,
    matchedClient?: Client | null
  ): string | null => {
    const obs = obsRaw.toLowerCase();

    // 1. REGLA DE ALTA / AFILIACIÓN INICIAL:
    // El pago de alta / afiliación inicial pertenece a la fecha de inicio/capacitación del servicio inicial o fecha de pago.
    const isAlta = tipoVentaRaw === 'ALTA' || obs.includes('alta') || obs.includes('inicial') || obs.includes('afiliac');
    if (isAlta) {
      const fCapDate = parseDateSafe(matchedClient?.fechaCapacitacion);
      const fRegDate = parseDateSafe(matchedClient?.fechaRegistro);
      const fAltaDate = fCapDate || fPago || fRegDate;
      if (fAltaDate) {
        return `${fAltaDate.getFullYear()}-${String(fAltaDate.getMonth() + 1).padStart(2, '0')}`;
      }
    }

    // 2. Si las observaciones mencionan explícitamente un mes futuro (ej. "adelanto noviembre", "cuota de noviembre")
    const mesesNombresArr = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    for (let i = 0; i < mesesNombresArr.length; i++) {
      if (obs.includes(mesesNombresArr[i])) {
        const mNum = String(i + 1).padStart(2, '0');
        const yNum = fPago ? fPago.getFullYear() : selectedYear;
        return `${yNum}-${mNum}`;
      }
    }

    // 2.b Si las observaciones mencionan una fecha de ciclo explícita (ej. "período 01/11/2026")
    const dateMatch = obs.match(/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\b/);
    if (dateMatch) {
      const mNum = String(dateMatch[2]).padStart(2, '0');
      const yNum = dateMatch[3];
      return `${yNum}-${mNum}`;
    }

    // 3. Si tiene periodo de inicio de servicio explícito (ej. periodo 01/10/2026 al 01/11/2026 pertenece a 2026-10)
    if (fInicio) {
      const year = fInicio.getFullYear();
      const monthStr = String(fInicio.getMonth() + 1).padStart(2, '0');
      return `${year}-${monthStr}`;
    }

    // 4. Si no tiene periodo de inicio, se usa la fecha efectiva de pago
    if (fPago) {
      const year = fPago.getFullYear();
      const monthStr = String(fPago.getMonth() + 1).padStart(2, '0');
      return `${year}-${monthStr}`;
    }

    return null;
  };

  const targetPeriodKey = `${selectedYear}-${selectedMonth}`;

  // --------------------------------------------------------------------------
  // 1. CONSOLIDACIÓN DE PAGOS Y PLANES ACTIVOS DEL MES (1 FILA POR CLIENTE)
  // --------------------------------------------------------------------------
  const { consolidatedMonthRows, porCapacitarRows, periodMetrics, deudoresList, totalPerdidaDeuda } = useMemo(() => {
    const clientRowMap = new Map<string, {
      clienteId: string;
      rawClient: Client | null;
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
      esPorCapacitar: boolean;
      estadoCuenta: string;
    }>();

    // Contadores para la tarjeta "Previa Mes"
    let sumaRegulares = 0;
    let countRegulares = 0;
    let sumaProrrateos = 0;
    let countProrrateos = 0;
    let sumaAdelantos = 0;
    let countAdelantos = 0;
    let sumaAltas = 0;
    let countAltas = 0;

    // A. Procesar todos los pagos del sistema
    safePayments.forEach((p, idx) => {
      const estadoPago = (p?.estadoPago || '').toUpperCase();
      const estadoVenta = (p?.venta?.estadoVenta || p?.estadoVenta || '').toUpperCase();
      if (estadoPago === 'CANCELADO' || estadoPago === 'RECHAZADO' || estadoVenta === 'CANCELADA') {
        return;
      }

      const fPago = parseDateSafe(p?.fechaPago || p?.fechaRegistro);
      const fInicio = parseDateSafe(p?.periodoInicio);
      const obs = String(p?.observaciones || p?.codigoOperacion || '').toLowerCase();
      const rawTipoVenta = (p?.venta?.tipoVenta || p?.tipoVenta || '').toUpperCase();

      const rawCId = p?.venta?.cliente?.id ?? p?.clienteId ?? p?.venta?.clienteId;
      const rawRuc = p?.clienteRuc || p?.venta?.cliente?.ruc;
      const matchedClient = (rawCId && clientMap.get(String(rawCId))) || (rawRuc && clientMap.get(`ruc-${rawRuc.trim()}`)) || (rawRuc && clientMap.get(rawRuc.trim())) || null;

      let monthKey = resolveTargetMonthKey(fPago, fInicio, obs, rawTipoVenta, p, matchedClient);
      if (!monthKey && fPago) {
        monthKey = `${fPago.getFullYear()}-${String(fPago.getMonth() + 1).padStart(2, '0')}`;
      }

      // Regla de adelantos: si el pago es adelanto para el mes seleccionado
      if (fPago && fInicio) {
        const mInicio = `${fInicio.getFullYear()}-${String(fInicio.getMonth() + 1).padStart(2, '0')}`;
        if (mInicio === targetPeriodKey) {
          monthKey = targetPeriodKey;
        }
      }

      if (monthKey !== targetPeriodKey) {
        return;
      }

      // REGLA SEGUNDO PRORRATEO (Día >= 10):
      // Si el cliente fue capacitado o afiliado el día >= 10 en el mes M (ej. 15 de Octubre):
      // 1) En el mes M (Octubre) figura su afiliación / pago inicial.
      // 2) En el mes M+1 (Noviembre) NO debe figurar ningún cobro (el cliente no paga en este mes).
      // 3) En el mes M+2 (Diciembre) figura su segundo prorrateo.
      const fRegDate = parseDateSafe(matchedClient?.fechaRegistro);
      const fCapDate = parseDateSafe(matchedClient?.fechaCapacitacion);
      const isInitialPeriod = fRegDate && fCapDate && fRegDate.getFullYear() === fCapDate.getFullYear() && fRegDate.getMonth() === fCapDate.getMonth();
      const effectiveCapDate = isInitialPeriod ? fCapDate : fRegDate;
      if (effectiveCapDate && effectiveCapDate.getDate() >= 10) {
        const isClientSegundoProrr = 
          matchedClient?.tipoProrrateo === 'SEGUNDO_PRORRATEO' || 
          Number(matchedClient?.diasProrrateoAdicional) > 0 || 
          Number(matchedClient?.montoProrrateoAdicional) > 0;
        
        if (isClientSegundoProrr) {
          const nextMonthDate = new Date(effectiveCapDate.getFullYear(), effectiveCapDate.getMonth() + 1, 1);
          const nextMonthKey = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, '0')}`;

          // En el mes M+1 (Noviembre), este cliente NO debe figurar:
          if (targetPeriodKey === nextMonthKey) {
            return;
          }
        }
      }

      const ruc = (rawRuc || matchedClient?.ruc || '—').trim();
      const clientKey = getClientRowKey(rawCId, ruc) || `pago-cli-${idx}`;

      const monto = Number(p?.monto || 0);
      if (monto <= 0) return;

      const rawSub = (p?.tipoSuscripcion || p?.venta?.suscripcion?.tipoSuscripcion || matchedClient?.tipoSuscripcion || 'MENSUAL').toUpperCase();
      const isAnual = rawSub === 'ANUAL';

      // REGLA: Los anuales SOLO figuran en el mes de su afiliación o pago anual
      if (isAnual) {
        const fAltaAnual = parseDateSafe(matchedClient?.fechaRegistro || matchedClient?.fechaCreacion || fPago);
        const altaAnualKey = fAltaAnual ? `${fAltaAnual.getFullYear()}-${String(fAltaAnual.getMonth() + 1).padStart(2, '0')}` : monthKey;
        if (altaAnualKey !== targetPeriodKey && monthKey !== targetPeriodKey) {
          return;
        }
      }

      // La fecha de alta efectiva del cliente es la fecha en que se le capacita (o registro inicial si no fue capacitado)
      const fCapClient = parseDateSafe(matchedClient?.fechaCapacitacion);
      const fRegClient = parseDateSafe(matchedClient?.fechaRegistro);
      const effectiveAltaDate = fCapClient || fRegClient;
      const effectiveAltaMonthKey = effectiveAltaDate ? `${effectiveAltaDate.getFullYear()}-${String(effectiveAltaDate.getMonth() + 1).padStart(2, '0')}` : null;
      const isClientAncient = effectiveAltaMonthKey !== null && effectiveAltaMonthKey < targetPeriodKey;

      // Identificar concepto de cobro
      const isProrr = obs.includes('prorrat') || p?.tipoProrrateo === 'SEGUNDO_PRORRATEO' || p?.tipoProrrateo === 'PRIMER_PRORRATEO';
      const isAdelanto = obs.includes('adelant') || obs.includes('anticip') || (fPago && fInicio && fInicio > fPago);
      const isAltaRaw = rawTipoVenta === 'ALTA' || obs.includes('alta') || obs.includes('inicial') || obs.includes('afiliac');
      const isAlta = !isClientAncient && isAltaRaw;
      const isAumento = rawTipoVenta === 'CAMBIO_PLAN' || rawTipoVenta === 'MEJORA_PLAN' || obs.includes('aumento') || obs.includes('mejora');

      let conceptoLabel = 'Renovación';
      if (isAlta) conceptoLabel = isAnual ? 'Afiliación Anual' : 'Afiliación / Alta';
      else if (isAumento) conceptoLabel = 'Mejora de Plan';
      else if (isProrr) conceptoLabel = 'Prorrateo';
      else if (isAdelanto) conceptoLabel = 'Adelanto';

      const medioPago = (p?.medioPago || 'Transferencia').toUpperCase();
      const codOp = p?.codigoOperacion ? String(p.codigoOperacion).trim() : '';

      // Consolidar en 1 sola fila por cliente (sin duplicar)
      let row = clientRowMap.get(clientKey);
      if (!row) {
        const razonSocial = p?.clienteRazonSocial || matchedClient?.razonSocial || matchedClient?.nombreComercial || `Cliente ${ruc}`;
        const nombreComercial = matchedClient?.nombreComercial || '';
        const asesor = p?.vendedorNombre || p?.venta?.vendedor?.nombre || matchedClient?.vendedor || 'Por asignar';
        const planNombre = p?.planNombre || p?.venta?.suscripcion?.plan?.nombrePlan || matchedClient?.planContratado || 'Plan Estándar';
        const precioBase = Number(matchedClient?.montoMensual || matchedClient?.precioPlan || monto);
        const telefono = matchedClient?.telefono || matchedClient?.telefonoPersonal || '—';
        const st = (matchedClient?.estadoCuenta || 'HABILITADO').toUpperCase();

        const isUntrained =
          st === 'POR_CAPACITAR' ||
          (matchedClient?.estadoCapacitacion || '').toUpperCase() === 'PENDIENTE' ||
          (!matchedClient?.fechaCapacitacion && isAlta);

        row = {
          clienteId: clientKey,
          rawClient: matchedClient,
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
          esPorCapacitar: isUntrained,
          estadoCuenta: st,
        };
        clientRowMap.set(clientKey, row);
      }

      // Si el pago posterior corresponde a un plan superior (ej. upgrade a REST), actualizamos el nombre del plan visible
      const freshPlanName = p?.planNombre || p?.venta?.suscripcion?.plan?.nombrePlan;
      if (freshPlanName && (isAumento || freshPlanName.toUpperCase().includes('REST') || freshPlanName.toUpperCase().includes('EMPRENDE'))) {
        row.planNombre = freshPlanName;
      }

      row.totalCobradoMes += monto;
      row.conceptosSet.add(conceptoLabel);
      if (medioPago) row.mediosPagoSet.add(medioPago);
      if (codOp && codOp !== '—') row.operacionesSet.add(codOp);
      if (fPago) row.fechasPagoList.push(fPago);

      if (isAlta) {
        row.esAlta = true;
        if (row.estadoCuenta === 'POR_CAPACITAR' || !matchedClient?.fechaCapacitacion) {
          row.esPorCapacitar = true;
        }
      }
      if (isAdelanto) row.esAdelanto = true;
      if (isProrr) row.esProrrateo = true;
      if (isAumento) row.esAumentoPlan = true;
    });

    // B. Procesar clientes con afiliacion directa en el mes (para asegurar que ningun nuevo cliente quede fuera)
    safeClients.forEach((c) => {
      const st = (c.estadoCuenta || '').toUpperCase();
      if (st === 'BLOQUEADO' || st === 'SUSPENDIDO' || st === 'VENCIDO') return;

      const ruc = (c.ruc || '').trim();
      const clientKey = getClientRowKey(c.id, ruc);
      if (!clientKey || clientRowMap.has(clientKey)) return;

      const isAnual = (c.tipoSuscripcion || '').toUpperCase() === 'ANUAL';
      const fReg = parseDateSafe(c.fechaRegistro || c.fechaCreacion);
      const fCap = parseDateSafe(c.fechaCapacitacion);
      const regMonthKey = fReg ? `${fReg.getFullYear()}-${String(fReg.getMonth() + 1).padStart(2, '0')}` : null;
      const capMonthKey = fCap ? `${fCap.getFullYear()}-${String(fCap.getMonth() + 1).padStart(2, '0')}` : null;

      // REGLA: La fecha de alta depende de cuándo se le capacita. Si ya fue capacitado en meses previos, es antiguo.
      const effectiveAltaDate = fCap || fReg;
      const effectiveAltaMonthKey = effectiveAltaDate ? `${effectiveAltaDate.getFullYear()}-${String(effectiveAltaDate.getMonth() + 1).padStart(2, '0')}` : null;
      if (effectiveAltaMonthKey && effectiveAltaMonthKey < targetPeriodKey) {
        return;
      }

      if (isAnual && regMonthKey !== targetPeriodKey && capMonthKey !== targetPeriodKey) {
        return;
      }

      // En el mes M de su capacitacion o registro de afiliacion, figura su alta si aun no tuviera pago procesado en pagos
      const targetEffectiveMonth = capMonthKey || regMonthKey;
      if (targetEffectiveMonth === targetPeriodKey) {
        const monto = Number(c.montoMensual || c.precioPlan || 0);
        if (monto > 0) {
          clientRowMap.set(clientKey, {
            clienteId: clientKey,
            rawClient: c,
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
            fechasPagoList: fCap || fReg ? [fCap || fReg!] : [],
            operacionesSet: new Set(),
            esAnual: isAnual,
            esAlta: true,
            esAdelanto: false,
            esProrrateo: false,
            esAumentoPlan: false,
            esPorCapacitar: st === 'POR_CAPACITAR' || (c.estadoCapacitacion || '').toUpperCase() === 'PENDIENTE' || !fCap,
            estadoCuenta: st,
          });
        }
      }
    });

    const allRows = Array.from(clientRowMap.values()).sort((a, b) => b.totalCobradoMes - a.totalCobradoMes);
    const operativeRows = allRows.filter((r) => !r.esPorCapacitar);
    const porCapacitarRows = allRows.filter((r) => r.esPorCapacitar);

    // Desglose para la tarjeta previa mes: cobros de clientes operativos
    operativeRows.forEach((r) => {
      if (r.esAdelanto) {
        sumaAdelantos += r.totalCobradoMes;
        countAdelantos += 1;
      } else if (r.esProrrateo) {
        sumaProrrateos += r.totalCobradoMes;
        countProrrateos += 1;
      } else if (r.esAlta) {
        sumaAltas += r.totalCobradoMes;
        countAltas += 1;
      } else {
        sumaRegulares += r.totalCobradoMes;
        countRegulares += 1;
      }
    });

    const sumaOperativaMes = operativeRows.reduce((acc, r) => acc + r.totalCobradoMes, 0);
    const countOperativos = operativeRows.length;

    const sumaPorCapacitarMes = porCapacitarRows.reduce((acc, r) => acc + r.totalCobradoMes, 0);
    const countPorCapacitar = porCapacitarRows.length;

    const totalGeneralMes = sumaOperativaMes + sumaPorCapacitarMes;
    const countTotalMes = countOperativos + countPorCapacitar;

    const countAnualesMes = operativeRows.filter((r) => r.esAnual).length;
    const montoAnualesMes = operativeRows.filter((r) => r.esAnual).reduce((acc, r) => acc + r.totalCobradoMes, 0);
    const countMensualesMes = operativeRows.filter((r) => !r.esAnual).length;
    const montoMensualesMes = operativeRows.filter((r) => !r.esAnual).reduce((acc, r) => acc + r.totalCobradoMes, 0);

    // C. Cartera Vencida y Bloqueada ("Cuánto estoy perdiendo"):
    // Clientes que están en VENCIDO, BLOQUEADO o SUSPENDIDO
    const deudores = safeClients
      .filter((c) => {
        const st = (c.estadoCuenta || '').toUpperCase();
        return st === 'VENCIDO' || st === 'BLOQUEADO' || st === 'SUSPENDIDO';
      })
      .map((c) => {
        const deudaEstimada = Number(c.montoSiguienteCobro && c.montoSiguienteCobro > 0 ? c.montoSiguienteCobro : (c.montoMensual || c.precioPlan || 29));
        return {
          id: String(c.id),
          client: c,
          ruc: c.ruc || '—',
          razonSocial: c.razonSocial || c.nombreComercial || `Cliente ${c.ruc}`,
          planNombre: c.planContratado || 'Plan Estándar',
          tipoSuscripcion: (c.tipoSuscripcion || 'MENSUAL').toUpperCase(),
          estadoCuenta: (c.estadoCuenta || 'VENCIDO').toUpperCase(),
          asesor: c.vendedor || 'Por asignar',
          telefono: c.telefono || '—',
          montoDeuda: deudaEstimada,
          fechaVencimiento: parseDateSafe(c.fechaFinServicio || c.fechaVencimientoMensual),
        };
      })
      .sort((a, b) => b.montoDeuda - a.montoDeuda);

    const totalPerdida = deudores.reduce((acc, d) => acc + d.montoDeuda, 0);

    return {
      consolidatedMonthRows: operativeRows,
      porCapacitarRows,
      periodMetrics: {
        totalRecaudadoMes: totalGeneralMes,
        sumaOperativaMes,
        countOperativos,
        sumaPorCapacitarMes,
        countPorCapacitar,
        countClientesMes: countTotalMes,
        sumaRegulares,
        countRegulares,
        sumaProrrateos,
        countProrrateos,
        sumaAdelantos,
        countAdelantos,
        countAnualesMes,
        montoAnualesMes,
        countMensualesMes,
        montoMensualesMes,
        countAltas,
        sumaAltas,
      },
      deudoresList: deudores,
      totalPerdidaDeuda: totalPerdida,
    };
  }, [safePayments, safeClients, clientMap, targetPeriodKey, selectedYear]);

  // Filtrar según sub-pestaña (TODOS / MENSUAL / ANUAL / POR_CAPACITAR) y filtros de búsqueda
  const filteredRows = useMemo(() => {
    const baseSource = activeReportSubTab === 'POR_CAPACITAR' ? porCapacitarRows : consolidatedMonthRows;

    return baseSource.filter((r) => {
      // Filtro de sub-pestaña (si es dentro de operativos)
      if (activeReportSubTab === 'MENSUAL' && r.esAnual) return false;
      if (activeReportSubTab === 'ANUAL' && !r.esAnual) return false;

      // Filtro Asesor
      if (filterVendedor !== 'ALL' && r.asesor !== filterVendedor) return false;

      // Filtro Concepto
      if (filterConcepto !== 'ALL' && activeReportSubTab !== 'POR_CAPACITAR') {
        const hasConcepto = Array.from(r.conceptosSet).some((c) =>
          c.toLowerCase().includes(filterConcepto.toLowerCase())
        );
        if (!hasConcepto) return false;
      }

      // Filtro Medio de Pago
      if (filterMedioPago !== 'ALL') {
        const hasMedio = Array.from(r.mediosPagoSet).some((m) =>
          m.toLowerCase().includes(filterMedioPago.toLowerCase())
        );
        if (!hasMedio) return false;
      }

      // Búsqueda en texto
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
  }, [consolidatedMonthRows, porCapacitarRows, activeReportSubTab, filterVendedor, filterConcepto, filterMedioPago, searchQuery]);

  // Filtrar deudores en la pestaña de PÉRDIDA
  const filteredDeudores = useMemo(() => {
    return deudoresList.filter((d) => {
      if (filterVendedor !== 'ALL' && d.asesor !== filterVendedor) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          d.ruc.toLowerCase().includes(q) ||
          d.razonSocial.toLowerCase().includes(q) ||
          d.planNombre.toLowerCase().includes(q) ||
          d.asesor.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [deudoresList, filterVendedor, searchQuery]);

  // Paginación
  const currentDatasetLength = activeReportSubTab === 'PERDIDA' ? filteredDeudores.length : filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(currentDatasetLength / ITEMS_PER_PAGE));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRows.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRows, currentPage]);

  const paginatedDeudores = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredDeudores.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredDeudores, currentPage]);

  const sumaTotalFiltrada = useMemo(() => {
    return filteredRows.reduce((acc, r) => acc + r.totalCobradoMes, 0);
  }, [filteredRows]);

  const sumaPerdidaFiltrada = useMemo(() => {
    return filteredDeudores.reduce((acc, d) => acc + d.montoDeuda, 0);
  }, [filteredDeudores]);

  const mesNombreSeleccionado = useMemo(() => {
    const m = MESES_LIST.find((item) => item.num === selectedMonth);
    return m ? m.nombre : 'Mes';
  }, [selectedMonth]);

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
      const res = await fetch('/api/admin/reporte-excel-oficial');
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Reporte_${mesNombreSeleccionado}_${selectedYear}.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        return;
      }
    } catch (e) {
      console.warn('Fallback a CSV local:', e);
    }

    try {
      let csv = '\uFEFF';
      if (activeReportSubTab === 'PERDIDA') {
        csv += 'N°,RUC,Cliente / Razon Social,Plan Contratado,Modalidad,Estado,Asesor,Telefono,Fecha Vencimiento,Monto Perdida / Deuda (S/)\n';
        filteredDeudores.forEach((d, idx) => {
          csv += `${idx + 1},"${d.ruc}","${d.razonSocial.replace(/"/g, '""')}","${d.planNombre}","${d.tipoSuscripcion}","${d.estadoCuenta}","${d.asesor}","${d.telefono}","${formatFechaPE(d.fechaVencimiento)}",${d.montoDeuda.toFixed(2)}\n`;
        });
        csv += `\nTOTAL PERDIDA EN CARTERA VENCIDA/BLOQUEADA,,,,,,,,,${sumaPerdidaFiltrada.toFixed(2)}\n`;
      } else if (activeReportSubTab === 'POR_CAPACITAR') {
        csv += 'N°,RUC,Cliente / Razon Social,Nombre Comercial,Plan Contratado,Modalidad,Estado,Fecha de Pago,Medio Pago,Asesor,Monto Pagado (S/)\n';
        filteredRows.forEach((r, idx) => {
          const mediosStr = Array.from(r.mediosPagoSet).join(', ') || 'Confirmado';
          const fUlt = r.fechasPagoList.length > 0 ? formatFechaPE(r.fechasPagoList[0]) : '—';
          csv += `${idx + 1},"${r.ruc}","${r.razonSocial.replace(/"/g, '""')}","${r.nombreComercial.replace(/"/g, '""')}","${r.planNombre}","${r.tipoSuscripcion}","POR CAPACITAR","${fUlt}","${mediosStr}","${r.asesor}",${r.totalCobradoMes.toFixed(2)}\n`;
        });
        csv += `\nTOTAL AFILIACIONES PENDIENTES DE CAPACITACION,,,,,,,,,,${sumaTotalFiltrada.toFixed(2)}\n`;
      } else {
        csv += 'N°,RUC,Cliente / Razon Social,Nombre Comercial,Plan Activo,Modalidad,Conceptos en el Mes,Fecha Ultimo Pago,Medios de Pago,Operaciones,Asesor,Total Cobrado (S/)\n';
        filteredRows.forEach((r, idx) => {
          const conceptosStr = Array.from(r.conceptosSet).join(' + ');
          const mediosStr = Array.from(r.mediosPagoSet).join(', ');
          const opStr = Array.from(r.operacionesSet).join(', ') || '—';
          const fUlt = r.fechasPagoList.length > 0 ? formatFechaPE(r.fechasPagoList[0]) : '—';
          csv += `${idx + 1},"${r.ruc}","${r.razonSocial.replace(/"/g, '""')}","${r.nombreComercial.replace(/"/g, '""')}","${r.planNombre}","${r.tipoSuscripcion}","${conceptosStr}","${fUlt}","${mediosStr}","${opStr}","${r.asesor}",${r.totalCobradoMes.toFixed(2)}\n`;
        });
        csv += `\nSUBTOTAL COBRADO CLIENTES OPERATIVOS,,,,,,,,,,,${sumaTotalFiltrada.toFixed(2)}\n`;

        if (porCapacitarRows.length > 0) {
          csv += `\n\n--- AFILIACIONES PENDIENTES DE CAPACITACION (${mesNombreSeleccionado.toUpperCase()} ${selectedYear}) ---\n`;
          csv += 'N°,RUC,Cliente / Razon Social,Plan Contratado,Modalidad,Estado,Fecha Pago,Asesor,Monto (S/)\n';
          porCapacitarRows.forEach((pc, idx) => {
            const fUlt = pc.fechasPagoList.length > 0 ? formatFechaPE(pc.fechasPagoList[0]) : '—';
            csv += `${idx + 1},"${pc.ruc}","${pc.razonSocial.replace(/"/g, '""')}","${pc.planNombre}","${pc.tipoSuscripcion}","POR CAPACITAR","${fUlt}","${pc.asesor}",${pc.totalCobradoMes.toFixed(2)}\n`;
          });
          csv += `SUBTOTAL AFILIACIONES PENDIENTES DE CAPACITACION,,,,,,,,${periodMetrics.sumaPorCapacitarMes.toFixed(2)}\n`;
          csv += `TOTAL GENERAL RECAUDADO EN EL MES,,,,,,,,${periodMetrics.totalRecaudadoMes.toFixed(2)}\n`;
        }
      }

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Reporte_${activeReportSubTab}_${mesNombreSeleccionado}_${selectedYear}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } finally {
      setIsExportingExcel(false);
    }
  };

  return (
    <div className="admin-module admin-module--reportes" style={{ padding: '6px' }}>
      {/* 1. ENCABEZADO CON SELECTOR DE AÑO Y BOTONES DE ACCIÓN */}
      <div className="card shadow-sm border-0 mb-3 bg-white" style={{ borderRadius: '14px', border: '1px solid #E2E8F0' }}>
        <div className="card-body p-3.5">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <div className="p-2 rounded-3 bg-primary-subtle text-primary">
                  <FileSpreadsheet size={22} />
                </div>
                <div>
                  <h4 className="fw-bold text-dark mb-0" style={{ fontSize: '1.25rem', letterSpacing: '-0.3px' }}>
                    Reporte General de Facturación
                  </h4>
                  <span className="text-muted small">
                    Liquidación mensual detallada: cobros de mensualidades, anualidades, adelantos, prorrateos y pérdidas de cartera.
                  </span>
                </div>
              </div>
            </div>

            <div className="d-flex align-items-center gap-2 flex-wrap">
              {/* Selector de Año */}
              <div className="d-flex align-items-center gap-2 bg-light px-3 py-1.5 rounded-3 border">
                <span className="small fw-bold text-muted">Año:</span>
                <select
                  className="form-select form-select-sm border-0 bg-transparent fw-bold text-dark shadow-none p-0 pe-3"
                  style={{ fontSize: '0.92rem', cursor: 'pointer' }}
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

              {/* Botón Exportar */}
              <button
                onClick={handleExportarExcel}
                disabled={isExportingExcel}
                className="btn btn-success btn-sm d-flex align-items-center gap-1.5 px-3.5 py-2 rounded-3 shadow-xs fw-bold"
                title="Exportar datos a formato Excel"
              >
                <Download size={15} />
                <span>{isExportingExcel ? 'Generando...' : 'Exportar Excel'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. SELECTOR DE MESES TIPO BARRA HORIZONTAL (DESPLAZABLE Y VISUAL) */}
      <div className="card shadow-sm border-0 mb-3 bg-white" style={{ borderRadius: '12px', border: '1px solid #E2E8F0' }}>
        <div className="card-body p-2">
          <div className="d-flex align-items-center gap-1 overflow-x-auto pb-1" style={{ scrollbarWidth: 'thin' }}>
            <div className="px-2.5 py-1.5 text-muted small fw-bold d-flex align-items-center gap-1 border-end me-1 text-nowrap">
              <Calendar size={15} className="text-primary" />
              <span>Seleccionar Mes:</span>
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

      {/* 3. TARJETAS DE INDICADORES (CON EL FORMATO DE LA IMAGEN "PREVIA MES" + DESGLOSE + PÉRDIDA) */}
      <div className="row g-2.5 mb-3">
        {/* Card 1: Formato Previa Mes (Total, Regulares, Prorrateos, Adelantos, Planes Activos) */}
        <div className="col-12 col-lg-4">
          <div className="card h-100 shadow-sm border-0 p-3.5 bg-white position-relative" style={{ borderRadius: '14px', border: '1px solid #E2E8F0' }}>
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="fw-bold text-primary" style={{ fontSize: '1.05rem' }}>
                Previa {mesNombreSeleccionado} {selectedYear}
              </span>
              <div className="p-1.5 rounded-2 bg-primary-subtle text-primary">
                <CalendarDays size={18} />
              </div>
            </div>

            <div className="fw-bold text-primary my-1" style={{ fontSize: '2rem', letterSpacing: '-0.8px', lineHeight: '1.2' }}>
              S/ {periodMetrics.totalRecaudadoMes.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>

            <div className="mt-2 pt-2 border-top" style={{ fontSize: '0.84rem' }}>
              <div className="d-flex justify-content-between py-0.5 text-muted">
                <span>Operativos ({periodMetrics.countOperativos}):</span>
                <strong className="text-dark">S/ {periodMetrics.sumaOperativaMes.toFixed(2)}</strong>
              </div>
              <div className="d-flex justify-content-between py-0.5 text-muted ps-2" style={{ fontSize: '0.76rem' }}>
                <span>· Regulares ({periodMetrics.countRegulares}): S/ {periodMetrics.sumaRegulares.toFixed(2)}</span>
                <span>· Prorrateos ({periodMetrics.countProrrateos}): S/ {periodMetrics.sumaProrrateos.toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between py-1 text-muted border-top mt-1">
                <span className="text-warning-emphasis fw-semibold">Por Capacitar ({periodMetrics.countPorCapacitar}):</span>
                <strong className="text-warning-emphasis">S/ {periodMetrics.sumaPorCapacitarMes.toFixed(2)}</strong>
              </div>
            </div>

            <div className="pt-2 mt-2 border-top text-success fw-semibold small d-flex align-items-center gap-1.5" style={{ fontSize: '0.78rem' }}>
              <CheckCircle2 size={15} />
              <span>{periodMetrics.countOperativos} operativos + {periodMetrics.countPorCapacitar} por capacitar ({periodMetrics.countClientesMes} total)</span>
            </div>
          </div>
        </div>

        {/* Card 2: Modalidad Anual vs Mensual (Regla: Anuales solo en su mes de pago) */}
        <div className="col-12 col-sm-6 col-lg-4">
          <div className="card h-100 shadow-sm border-0 p-3.5 bg-white" style={{ borderRadius: '14px', border: '1px solid #E2E8F0', borderLeft: '4px solid #F59E0B' }}>
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="text-muted small fw-bold text-uppercase">Modalidades de Cobro</span>
              <span className="p-1.5 rounded-2 bg-warning-subtle text-warning-emphasis">
                <Tag size={17} />
              </span>
            </div>

            <div className="my-1">
              <span className="text-muted small d-block">Planes Anuales (Solo {mesNombreSeleccionado}):</span>
              <div className="fw-bold text-dark" style={{ fontSize: '1.45rem', letterSpacing: '-0.4px' }}>
                S/ {periodMetrics.montoAnualesMes.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <small className="text-muted" style={{ fontSize: '0.76rem' }}>
                {periodMetrics.countAnualesMes} anualidades cobradas en este mes (no figuran en otros meses)
              </small>
            </div>

            <div className="mt-2 pt-2 border-top">
              <span className="text-muted small d-block">Planes Mensuales de {mesNombreSeleccionado}:</span>
              <div className="fw-bold text-primary" style={{ fontSize: '1.25rem' }}>
                S/ {periodMetrics.montoMensualesMes.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <small className="text-muted" style={{ fontSize: '0.76rem' }}>
                {periodMetrics.countMensualesMes} mensualidades recaudadas
              </small>
            </div>
          </div>
        </div>

        {/* Card 3: Cartera Vencida y Bloqueada ("Cuánto estoy perdiendo") */}
        <div className="col-12 col-sm-6 col-lg-4">
          <div className="card h-100 shadow-sm border-0 p-3.5 bg-white" style={{ borderRadius: '14px', border: '1px solid #E2E8F0', borderLeft: '4px solid #EF4444' }}>
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="text-danger small fw-bold text-uppercase">Pérdida en Cartera Vencida / Bloqueada</span>
              <span className="p-1.5 rounded-2 bg-danger-subtle text-danger">
                <AlertTriangle size={17} />
              </span>
            </div>

            <div className="my-1">
              <span className="text-muted small d-block">Total que estás perdiendo de recaudar:</span>
              <div className="fw-bold text-danger" style={{ fontSize: '1.8rem', letterSpacing: '-0.5px' }}>
                S/ {totalPerdidaDeuda.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            <div className="mt-2 pt-2 border-top" style={{ fontSize: '0.84rem' }}>
              <div className="d-flex justify-content-between py-0.5 text-muted">
                <span>Total deudas pendientes:</span>
                <strong className="text-danger">{deudoresList.length} clientes</strong>
              </div>
              <div className="d-flex justify-content-between py-0.5 text-muted">
                <span>Clientes Vencidos:</span>
                <strong className="text-dark">{deudoresList.filter((d) => d.estadoCuenta === 'VENCIDO').length}</strong>
              </div>
              <div className="d-flex justify-content-between py-0.5 text-muted">
                <span>Clientes Bloqueados / Suspendidos:</span>
                <strong className="text-dark">{deudoresList.filter((d) => d.estadoCuenta !== 'VENCIDO').length}</strong>
              </div>
            </div>

            <button
              onClick={() => {
                setActiveReportSubTab('PERDIDA');
                setCurrentPage(1);
              }}
              className="btn btn-outline-danger btn-sm w-100 mt-2 py-1 fw-bold rounded-2"
              style={{ fontSize: '0.78rem' }}
            >
              Ver Tabla Detallada de Pérdida
            </button>
          </div>
        </div>
      </div>

      {/* 4. SUB-PESTAÑAS DE REPORTES (CONSOLIDADO, MENSUAL, ANUAL, PÉRDIDA) */}
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
        <ul className="nav nav-pills gap-1.5 bg-white p-1 rounded-3 border shadow-xs" style={{ fontSize: '0.86rem' }}>
          <li className="nav-item">
            <button
              className={`nav-link py-1.5 px-3 fw-bold rounded-2 transition-all ${
                activeReportSubTab === 'TODOS' ? 'active shadow-sm' : 'text-secondary'
              }`}
              onClick={() => {
                setActiveReportSubTab('TODOS');
                setCurrentPage(1);
              }}
            >
              <Layers size={14} className="me-1" />
              Operativos ({periodMetrics.countOperativos})
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link py-1.5 px-3 fw-bold rounded-2 transition-all ${
                activeReportSubTab === 'MENSUAL' ? 'active shadow-sm' : 'text-secondary'
              }`}
              onClick={() => {
                setActiveReportSubTab('MENSUAL');
                setCurrentPage(1);
              }}
            >
              <Calendar size={14} className="me-1" />
              Mensuales ({periodMetrics.countMensualesMes})
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link py-1.5 px-3 fw-bold rounded-2 transition-all ${
                activeReportSubTab === 'ANUAL' ? 'active shadow-sm' : 'text-secondary'
              }`}
              onClick={() => {
                setActiveReportSubTab('ANUAL');
                setCurrentPage(1);
              }}
            >
              <Tag size={14} className="me-1" />
              Anuales ({periodMetrics.countAnualesMes})
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link py-1.5 px-3 fw-bold rounded-2 transition-all ${
                activeReportSubTab === 'POR_CAPACITAR'
                  ? 'active shadow-sm text-white'
                  : 'text-warning-emphasis'
              }`}
              style={{
                backgroundColor: activeReportSubTab === 'POR_CAPACITAR' ? '#D97706' : undefined,
              }}
              onClick={() => {
                setActiveReportSubTab('POR_CAPACITAR');
                setCurrentPage(1);
              }}
            >
              <Clock size={14} className="me-1" />
              Por Capacitar ({periodMetrics.countPorCapacitar})
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link py-1.5 px-3 fw-bold rounded-2 transition-all ${
                activeReportSubTab === 'PERDIDA' ? 'active btn-danger text-white shadow-sm' : 'text-danger'
              }`}
              onClick={() => {
                setActiveReportSubTab('PERDIDA');
                setCurrentPage(1);
              }}
            >
              <AlertTriangle size={14} className="me-1" />
              Pérdida ({deudoresList.length})
            </button>
          </li>
        </ul>

        {/* Resumen rápido visible */}
        <div className="small fw-semibold text-muted">
          {activeReportSubTab === 'PERDIDA' ? (
            <span className="badge bg-danger-subtle text-danger px-2.5 py-1.5 border border-danger-subtle fs-7">
              Pérdida Total en Deuda: S/ {sumaPerdidaFiltrada.toFixed(2)}
            </span>
          ) : (
            <span className="badge bg-primary-subtle text-primary px-2.5 py-1.5 border border-primary-subtle fs-7">
              Total Cobrado en {mesNombreSeleccionado}: S/ {sumaTotalFiltrada.toFixed(2)}
            </span>
          )}
        </div>
      </div>

      {/* 5. TABLA PRINCIPAL Y BARRA DE FILTROS */}
      <div className="card shadow-sm border-0 bg-white mb-4" style={{ borderRadius: '14px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        {/* Barra de Filtros */}
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
                  placeholder="Buscar por RUC, cliente, plan o asesor..."
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

            {/* Filtro Concepto (solo para tablas de cobros) */}
            {activeReportSubTab !== 'PERDIDA' && (
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
                  <option value="Adelanto">Adelanto</option>
                  <option value="Prorrateo">Prorrateo</option>
                  <option value="Afiliación">Afiliación / Alta</option>
                  <option value="Mejora">Mejora de Plan</option>
                </select>
              </div>
            )}

            {/* Filtro Medio de Pago */}
            {activeReportSubTab !== 'PERDIDA' && (
              <div className="col-6 col-md-2">
                <select
                  className="form-select form-select-sm shadow-none"
                  value={filterMedioPago}
                  onChange={(e) => {
                    setFilterMedioPago(e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{ fontSize: '0.84rem' }}
                >
                  <option value="ALL">Medio de Pago</option>
                  <option value="TRANSFERENCIA">Transferencia</option>
                  <option value="BCP">BCP</option>
                  <option value="YAPE">Yape</option>
                  <option value="PLIN">Plin</option>
                  <option value="EFECTIVO">Efectivo</option>
                </select>
              </div>
            )}

            {/* Botón Limpiar Filtros */}
            <div className="col-6 col-md-1 text-end">
              <button
                className="btn btn-outline-secondary btn-sm w-100 py-1"
                onClick={() => {
                  setSearchQuery('');
                  setFilterVendedor('ALL');
                  setFilterConcepto('ALL');
                  setFilterMedioPago('ALL');
                  setCurrentPage(1);
                }}
                title="Limpiar filtros"
              >
                <RotateCcw size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* A. TABLA DE COBROS DEL MES (CONSOLIDADO, MENSUAL, ANUAL) */}
        {/* ========================================================================= */}
        {activeReportSubTab !== 'PERDIDA' && (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.85rem' }}>
              <thead style={{ backgroundColor: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                <tr className="text-muted small text-uppercase" style={{ letterSpacing: '0.4px' }}>
                  <th className="ps-3 py-3" style={{ width: '40px' }}>#</th>
                  <th className="py-3" style={{ minWidth: '220px' }}>Cliente / Razón Social</th>
                  <th className="py-3" style={{ minWidth: '110px' }}>RUC</th>
                  <th className="py-3" style={{ minWidth: '150px' }}>Plan Activo</th>
                  <th className="py-3" style={{ minWidth: '180px' }}>{activeReportSubTab === 'POR_CAPACITAR' ? 'Estado / Concepto' : `Conceptos en ${mesNombreSeleccionado}`}</th>
                  <th className="py-3 text-center" style={{ minWidth: '105px' }}>Último Pago</th>
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

                        {/* Razón Social */}
                        <td className="py-2.5">
                          <div className="fw-semibold text-dark d-flex align-items-center gap-1.5" style={{ lineHeight: '1.2' }}>
                            <span>{row.razonSocial}</span>
                            {setHistoryClient && row.rawClient && (
                              <button
                                onClick={() => setHistoryClient(row.rawClient)}
                                className="btn btn-link p-0 text-muted hover-text-primary"
                                title="Ver historial de operaciones"
                              >
                                <History size={13} />
                              </button>
                            )}
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

                        {/* Conceptos en el mes */}
                        <td className="py-2.5">
                          {activeReportSubTab === 'POR_CAPACITAR' ? (
                            <span className="badge rounded-pill fw-semibold bg-warning-subtle text-warning-emphasis border border-warning-subtle" style={{ fontSize: '0.71rem', padding: '3px 8px' }}>
                              Por Capacitar (Sin inicio de servicio)
                            </span>
                          ) : (
                          <div className="d-flex flex-wrap gap-1">
                            {Array.from(row.conceptosSet).map((cName) => {
                              let badgeClass = 'bg-primary-subtle text-primary border border-primary-subtle';
                              if (cName.includes('Adelanto')) badgeClass = 'bg-success-subtle text-success border border-success-subtle';
                              else if (cName.includes('Prorrateo')) badgeClass = 'bg-warning-subtle text-warning-emphasis border border-warning-subtle';
                              else if (cName.includes('Alta') || cName.includes('Afiliación')) badgeClass = 'bg-info-subtle text-info-emphasis border border-info-subtle';
                              else if (cName.includes('Mejora') || cName.includes('Aumento')) badgeClass = 'bg-purple-subtle text-purple border border-purple-subtle';

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
                          )}
                        </td>

                        {/* Fecha de Pago */}
                        <td className="py-2.5 text-center text-muted small">
                          {fechaUltimoPago}
                        </td>

                        {/* Medios de Pago */}
                        <td className="py-2.5">
                          <span className="badge bg-light text-dark border px-2 py-1" style={{ fontSize: '0.72rem' }}>
                            {mediosStr}
                          </span>
                        </td>

                        {/* Asesor */}
                        <td className="py-2.5 text-muted small">
                          {row.asesor}
                        </td>

                        {/* Monto Total Cobrado */}
                        <td className="py-2.5 text-end pe-3 fw-bold text-dark" style={{ fontSize: '0.96rem' }}>
                          S/ {row.totalCobradoMes.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>

              {/* Pie con Suma Total General */}
              {filteredRows.length > 0 && (
                <tfoot style={{ backgroundColor: '#F8FAFC', borderTop: '2px solid #CBD5E1' }}>
                  <tr className="fw-bold">
                    <td colSpan={8} className="ps-3 py-3 text-uppercase text-dark" style={{ fontSize: '0.85rem' }}>
                      {activeReportSubTab === 'POR_CAPACITAR'
                        ? `Suma Total Afiliaciones Pendientes de Capacitación (${filteredRows.length} clientes):`
                        : `Suma Total Cobrada en ${mesNombreSeleccionado.toUpperCase()} ${selectedYear} (${filteredRows.length} clientes):`}
                    </td>
                    <td className="text-end pe-3 py-3 text-primary" style={{ fontSize: '1.12rem' }}>
                      S/ {sumaTotalFiltrada.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}

        {/* ========================================================================= */}
        {/* B. TABLA DE PÉRDIDA EN CARTERA (CLIENTES VENCIDOS Y BLOQUEADOS) */}
        {/* ========================================================================= */}
        {activeReportSubTab === 'PERDIDA' && (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.85rem' }}>
              <thead style={{ backgroundColor: '#FEF2F2', borderBottom: '2px solid #FCA5A5' }}>
                <tr className="text-danger small text-uppercase" style={{ letterSpacing: '0.4px' }}>
                  <th className="ps-3 py-3" style={{ width: '40px' }}>#</th>
                  <th className="py-3" style={{ minWidth: '220px' }}>Cliente / Razón Social</th>
                  <th className="py-3" style={{ minWidth: '110px' }}>RUC</th>
                  <th className="py-3" style={{ minWidth: '140px' }}>Plan Contratado</th>
                  <th className="py-3 text-center" style={{ minWidth: '110px' }}>Estado Cuenta</th>
                  <th className="py-3 text-center" style={{ minWidth: '120px' }}>Vencimiento</th>
                  <th className="py-3" style={{ minWidth: '120px' }}>Asesor</th>
                  <th className="py-3" style={{ minWidth: '110px' }}>Teléfono</th>
                  <th className="py-3 text-end pe-3" style={{ minWidth: '140px' }}>Monto Perdido (S/)</th>
                </tr>
              </thead>
              <tbody>
                {paginatedDeudores.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-5 text-muted">
                      <CheckCircle2 size={30} className="mb-2 text-success d-block mx-auto opacity-75" />
                      <span className="fw-semibold d-block text-dark">No hay clientes con deuda pendiente o en pérdida</span>
                      <small className="text-muted">¡Toda la cartera se encuentra al día o no hay clientes bloqueados/vencidos bajo este filtro!</small>
                    </td>
                  </tr>
                ) : (
                  paginatedDeudores.map((deudor, idx) => {
                    const globalIdx = (currentPage - 1) * ITEMS_PER_PAGE + idx + 1;
                    const fVenc = deudor.fechaVencimiento ? formatFechaPE(deudor.fechaVencimiento) : 'Vencido';

                    return (
                      <tr key={deudor.id} style={{ transition: 'background-color 0.15s ease' }}>
                        <td className="ps-3 py-2.5 text-muted small">{globalIdx}</td>
                        <td className="py-2.5">
                          <div className="fw-semibold text-dark d-flex align-items-center gap-1.5">
                            <span>{deudor.razonSocial}</span>
                            {setHistoryClient && deudor.client && (
                              <button
                                onClick={() => setHistoryClient(deudor.client)}
                                className="btn btn-link p-0 text-muted hover-text-danger"
                                title="Ver historial del cliente"
                              >
                                <History size={13} />
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 text-secondary fw-semibold font-monospace" style={{ fontSize: '0.82rem' }}>
                          {deudor.ruc}
                        </td>
                        <td className="py-2.5">
                          <div className="fw-semibold text-dark">{deudor.planNombre}</div>
                          <span className="badge bg-light text-muted border" style={{ fontSize: '0.68rem' }}>
                            {deudor.tipoSuscripcion}
                          </span>
                        </td>
                        <td className="py-2.5 text-center">
                          <span
                            className={`badge px-2 py-1 fw-bold ${
                              deudor.estadoCuenta === 'BLOQUEADO'
                                ? 'bg-danger text-white'
                                : 'bg-danger-subtle text-danger border border-danger-subtle'
                            }`}
                            style={{ fontSize: '0.72rem' }}
                          >
                            {deudor.estadoCuenta}
                          </span>
                        </td>
                        <td className="py-2.5 text-center text-danger fw-semibold small">
                          {fVenc}
                        </td>
                        <td className="py-2.5 text-muted small">{deudor.asesor}</td>
                        <td className="py-2.5 text-muted small">{deudor.telefono}</td>
                        <td className="py-2.5 text-end pe-3 fw-bold text-danger" style={{ fontSize: '0.98rem' }}>
                          S/ {deudor.montoDeuda.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>

              {/* Pie de Tabla con Suma Total de Pérdida */}
              {filteredDeudores.length > 0 && (
                <tfoot style={{ backgroundColor: '#FEF2F2', borderTop: '2px solid #FCA5A5' }}>
                  <tr className="fw-bold">
                    <td colSpan={8} className="ps-3 py-3 text-uppercase text-danger" style={{ fontSize: '0.85rem' }}>
                      Pérdida Total en Cartera ({filteredDeudores.length} clientes con cobro pendiente):
                    </td>
                    <td className="text-end pe-3 py-3 text-danger" style={{ fontSize: '1.15rem' }}>
                      S/ {sumaPerdidaFiltrada.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}

        {/* Paginador */}
        {totalPages > 1 && (
          <div className="d-flex justify-content-between align-items-center p-3 bg-white border-top small">
            <span className="text-muted">
              Mostrando página <strong>{currentPage}</strong> de <strong>{totalPages}</strong> ({currentDatasetLength} registros)
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
