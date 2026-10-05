'use client';

import React, { useMemo, useState } from 'react';
import {
  FileSpreadsheet,
  RefreshCw,
  User,
  ShoppingCart,
  DollarSign,
  AlertCircle,
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
  XCircle,
  PieChart as PieIcon,
  BarChart3,
  HelpCircle,
  Eye,
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
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const safeClients = useMemo(() => (Array.isArray(clients) ? clients : []), [clients]);
  const filterFn = filterClientUnified || (() => true);
  const reportFilteredList = safeClients.filter((c) => filterFn(c));

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

  // Generador avanzado de Excel en formato Excel XML (Diseño con estilos, 2 prorrateos y soporte anual)
  const exportToExcelLocal = async () => {
    if (handleExportExcel) {
      handleExportExcel();
      return;
    }

    setIsExportingExcel(true);
    try {
      const idKey = (value: any) => (value === undefined || value === null || value === '' ? '' : String(value));
      const operacionesByClient = new Map<string, any[]>();
      const paymentsByClient = new Map<string, any[]>();
      const seenPaymentKeys = new Set<string>();

      const registerPaymentForClient = (p: any, cId?: string, ruc?: string) => {
        const uniquePaymentKey = String(p?.id ?? p?.pagoId ?? `${p?.fechaPago || p?.fechaRegistro}-${p?.monto}-${cId || ruc}`);
        if (seenPaymentKeys.has(uniquePaymentKey)) return;
        seenPaymentKeys.add(uniquePaymentKey);

        if (cId) {
          const list = paymentsByClient.get(cId) || [];
          list.push(p);
          paymentsByClient.set(cId, list);
        }
        if (ruc) {
          const listRuc = paymentsByClient.get(`ruc-${ruc}`) || [];
          listRuc.push(p);
          paymentsByClient.set(`ruc-${ruc}`, listRuc);
        }
      };

      // 1. Cargar pagos existentes en memoria (rápido y garantizado)
      (Array.isArray(payments) ? payments : []).forEach((p) => {
        const cId = idKey(p?.venta?.cliente?.id ?? p?.clienteId ?? p?.venta?.clienteId);
        const ruc = p?.clienteRuc || p?.venta?.cliente?.ruc;
        registerPaymentForClient(p, cId, ruc);
      });

      // 2. Intentar enriquecer con el detalle del servidor (con timeout de protección)
      if (token) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 4000);
          await Promise.allSettled(
            reportFilteredList.map(async (c) => {
              try {
                const res = await fetch(`/api/admin/clientes/${c.id}`, {
                  headers: { Authorization: `Bearer ${token}` },
                  signal: controller.signal,
                });
                const data = await res.json();
                const operaciones = data?.data?.operacionesHistorial || [];
                const pagos = data?.data?.pagosHistorial || [];
                operacionesByClient.set(idKey(c.id), operaciones);
                pagos.forEach((p: any) => registerPaymentForClient(p, idKey(c.id), c.ruc));
              } catch (_) {}
            })
          );
          clearTimeout(timeoutId);
        } catch (_) {}
      }

      const monthNames = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Setiembre', 'Octubre', 'Noviembre', 'Diciembre',
      ];

      const monthKeysSet = new Set<string>();
      const today = new Date();
      const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

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

      // Determinar los meses a mostrar asegurando que cubra las fechas de los clientes y sus 2 prorrateos
      reportFilteredList.forEach((c) => {
        const startD = parseLocalDateSafe(c.fechaRegistro || c.fechaCreacion || c.fechaCapacitacion);
        if (startD) {
          const startKey = monthKeyFromDate(startD);
          if (startKey) {
            monthKeysSet.add(startKey);
            const isAnual = (c.tipoSuscripcion || '').toUpperCase() === 'ANUAL';
            const isSegundoProrrateo = c.tipoProrrateo === 'SEGUNDO_PRORRATEO' || Number(c.diasProrrateoAdicional || 0) > 0 || startD.getDate() >= 10;

            if (isAnual) {
              for (let k = 0; k < 12; k += 1) monthKeysSet.add(addMonthsToKey(startKey, k));
            } else if (isSegundoProrrateo) {
              // El segundo prorrateo chapa los 2 meses: mes de inicio + mes siguiente
              monthKeysSet.add(addMonthsToKey(startKey, 1));
            }
          }
        }

        const regKey = monthKeyFromDate(c.fechaRegistro);
        if (regKey) addMonthRangeToSet(regKey, currentMonthKey);

        const vencKey = monthKeyFromDate(c.fechaVencimientoMensual);
        if (vencKey) {
          monthKeysSet.add(vencKey);
          if (regKey) addMonthRangeToSet(regKey, vencKey);
        }

        // Operaciones pagadas
        const ops = operacionesByClient.get(idKey(c.id)) || [];
        ops.forEach((op) => {
          const opD = parseLocalDateSafe(op?.fechaInicioServicio || op?.fechaPago || op?.fechaOperacion);
          if (!opD) return;
          const opKey = monthKeyFromDate(opD);
          if (!opKey) return;
          monthKeysSet.add(opKey);
          if ((op?.tipoSuscripcion || '').toUpperCase() === 'ANUAL') {
            for (let k = 0; k < 12; k += 1) monthKeysSet.add(addMonthsToKey(opKey, k));
          } else if (op?.tipoProrrateo === 'SEGUNDO_PRORRATEO' || Number(op?.diasProrrateoAdicional || 0) > 0 || opD.getDate() >= 10) {
            monthKeysSet.add(addMonthsToKey(opKey, 1));
          }
        });

        // Pagos
        const pList = [
          ...(paymentsByClient.get(idKey(c.id)) || []),
          ...(c.ruc ? (paymentsByClient.get(`ruc-${c.ruc}`) || []) : [])
        ];
        pList.forEach((p) => {
          const payD = parseLocalDateSafe(p?.fechaPago || p?.fechaRegistro);
          if (!payD) return;
          const pKey = monthKeyFromDate(payD);
          if (!pKey) return;
          monthKeysSet.add(pKey);
          if ((p?.tipoSuscripcion || '').toUpperCase() === 'ANUAL') {
            for (let k = 0; k < 12; k += 1) monthKeysSet.add(addMonthsToKey(pKey, k));
          } else if (p?.tipoProrrateo === 'SEGUNDO_PRORRATEO' || (p?.conProrrateo && payD.getDate() >= 10)) {
            monthKeysSet.add(addMonthsToKey(pKey, 1));
          }
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
        const spans: Array<{ startKey: string; amount: number; monthsCovered: number; type: 'ANUAL' | 'SEGUNDO_PRORRATEO' }> = [];

        const isClientAnnual = (c.tipoSuscripcion || '').toUpperCase() === 'ANUAL';
        const clientMonthlyPlanPrice = Number(c.montoMensual || c.precioPlan || 0);

        // Deduplicar pagos del cliente
        const rawClPayments = [
          ...(paymentsByClient.get(idKey(c.id)) || []),
          ...(c.ruc ? (paymentsByClient.get(`ruc-${c.ruc}`) || []) : [])
        ];
        const uniqueClPayments = new Map<string, any>();
        rawClPayments.forEach((p, idx) => {
          const key = String(p?.id ?? p?.pagoId ?? `${p?.fechaPago || p?.fechaRegistro}-${p?.monto}-${idx}`);
          if (!uniqueClPayments.has(key)) uniqueClPayments.set(key, p);
        });
        const clPayments = Array.from(uniqueClPayments.values());

        const rawOps = operacionesByClient.get(idKey(c.id)) || [];

        // 1. Procesar primero los pagos de caja confirmados (Fuente de verdad de ingresos)
        const coveredVentaIds = new Set<string>();
        const coveredMonthKeys = new Set<string>();

        clPayments.forEach((p) => {
          const payD = parseLocalDateSafe(p?.periodoInicio || p?.fechaPago || p?.fechaRegistro);
          if (!payD) return;
          const key = monthKeyFromDate(payD);
          if (!key) return;

          const vId = String(p?.ventaId || p?.venta?.id || '');
          if (vId) coveredVentaIds.add(vId);
          coveredMonthKeys.add(key);

          const pAmount = Number(p?.monto || p?.venta?.montoTotal || 0);
          if (pAmount <= 0) return;

          const isAnnualPay = (p?.tipoSuscripcion || p?.venta?.suscripcion?.tipoSuscripcion || c.tipoSuscripcion || '').toUpperCase() === 'ANUAL';
          const isSegundoProrrateoPay = p?.tipoProrrateo === 'SEGUNDO_PRORRATEO' || p?.venta?.tipoProrrateo === 'SEGUNDO_PRORRATEO' || (p?.conProrrateo && payD.getDate() >= 10) || String(p?.observaciones || '').toLowerCase().includes('segundo');

          if (isAnnualPay) {
            if (!spans.some((s) => s.startKey === key)) {
              spans.push({ startKey: key, amount: pAmount, monthsCovered: 12, type: 'ANUAL' });
            }
          } else if (isSegundoProrrateoPay) {
            if (!spans.some((s) => s.startKey === key)) {
              spans.push({ startKey: key, amount: pAmount, monthsCovered: 2, type: 'SEGUNDO_PRORRATEO' });
            }
          } else {
            // Asignar el monto al mes correspondiente sin duplicar
            monthlySums.set(key, (monthlySums.get(key) || 0) + pAmount);
          }
        });

        // 2. Procesar operaciones de ventas que no tengan pago registrado en caja (evitando duplicar)
        rawOps.forEach((op) => {
          const vId = String(op?.ventaId || '');
          if (vId && coveredVentaIds.has(vId)) return; // Ya contabilizado por clPayments

          const opD = parseLocalDateSafe(op?.fechaInicioServicio || op?.fechaPago || op?.fechaOperacion);
          if (!opD) return;
          const key = monthKeyFromDate(opD);
          if (!key || coveredMonthKeys.has(key)) return; // Mes ya cubierto por un pago confirmado

          const montoOperacion = Number(op?.montoPagado || op?.montoVenta || op?.montoTotal || op?.precioLista || 0);
          if (montoOperacion <= 0) return;

          const isAnnualOp = (op?.tipoSuscripcion || c.tipoSuscripcion || '').toUpperCase() === 'ANUAL';
          const isSegundoProrrateoOp = op?.tipoProrrateo === 'SEGUNDO_PRORRATEO' || Number(op?.diasProrrateoAdicional || 0) > 0 || (opD.getDate() >= 10 && op?.tipoProrrateo !== 'PRIMER_PRORRATEO');

          if (isAnnualOp) {
            if (!spans.some((s) => s.startKey === key)) {
              spans.push({ startKey: key, amount: montoOperacion || (clientMonthlyPlanPrice * 10), monthsCovered: 12, type: 'ANUAL' });
            }
          } else if (isSegundoProrrateoOp) {
            if (!spans.some((s) => s.startKey === key)) {
              spans.push({ startKey: key, amount: montoOperacion || Number(c.montoSiguienteCobro || 0) || clientMonthlyPlanPrice, monthsCovered: 2, type: 'SEGUNDO_PRORRATEO' });
            }
          } else {
            monthlySums.set(key, (monthlySums.get(key) || 0) + montoOperacion);
          }
        });

        // 3. Fallback ÚNICAMENTE para clientes que no tienen ningún pago ni operación en base de datos
        const hasExistingRecords = clPayments.length > 0 || rawOps.length > 0;
        if (!hasExistingRecords) {
          const startD = parseLocalDateSafe(c.fechaRegistro || c.fechaCreacion || c.fechaCapacitacion);
          if (startD) {
            const startKey = monthKeyFromDate(startD)!;

            if (isClientAnnual) {
              if (!spans.some((s) => s.startKey === startKey)) {
                const annualAmount = Number(c.precioPlan || c.montoMensual || 0);
                spans.push({ startKey, amount: annualAmount, monthsCovered: 12, type: 'ANUAL' });
              }
            } else {
              const isSegundoProrrateoCli = c.tipoProrrateo === 'SEGUNDO_PRORRATEO' || Number(c.diasProrrateoAdicional || 0) > 0 || (startD.getDate() >= 10 && c.tipoProrrateo !== 'PRIMER_PRORRATEO');
              const isPrimerProrrateoCli = c.tipoProrrateo === 'PRIMER_PRORRATEO' || startD.getDate() < 10;

              if (isSegundoProrrateoCli) {
                if (!spans.some((s) => s.startKey === startKey)) {
                  const baseMonto = Number(c.montoMensual || c.precioPlan || 0);
                  const adicMonto = Number(c.montoProrrateoAdicional || 0);
                  const totalSegundo = Number(c.montoSiguienteCobro || 0) || (baseMonto + adicMonto) || baseMonto;
                  spans.push({ startKey, amount: totalSegundo, monthsCovered: 2, type: 'SEGUNDO_PRORRATEO' });
                }
              } else if (isPrimerProrrateoCli) {
                if ((monthlySums.get(startKey) || 0) === 0 && !spans.some((s) => s.startKey === startKey)) {
                  const totalPrimer = Number(c.montoSiguienteCobro || c.montoProrrateado || 0) || clientMonthlyPlanPrice;
                  monthlySums.set(startKey, totalPrimer);
                }
              }
            }
          }
        }

        // Ordenar spans cronológicamente
        spans.sort((a, b) => monthIndexFromKey(a.startKey) - monthIndexFromKey(b.startKey));

        let totalCobros = 0;
        spans.forEach((span) => {
          totalCobros += span.amount;
        });
        monthlySums.forEach((val) => {
          totalCobros += val;
        });

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

        // Generar celdas mensuales con soporte para spans (2.° prorrateo chapa 2 meses, anual chapa 12 meses)
        const monthCellsXml: string[] = [];
        for (let i = 0; i < monthKeys.length; i += 1) {
          const key = monthKeys[i];
          const span = spans.find((s) => s.startKey === key);

          if (span) {
            const remainingColumns = monthKeys.length - i;
            const mergeCount = Math.min(Math.max(span.monthsCovered - 1, 0), remainingColumns - 1);
            const styleId = span.type === 'ANUAL' ? 'AnnualStyle' : 'SegundoProrrateoStyle';
            monthCellsXml.push(
              `<Cell ss:StyleID="${styleId}" ss:MergeAcross="${mergeCount}"><Data ss:Type="Number">${span.amount.toFixed(2)}</Data></Cell>`
            );
            i += mergeCount; // Avanza el índice de meses cubiertos
          } else {
            // Verificar si el mes actual está dentro de un span anterior
            const isCoveredByOtherSpan = spans.some((s) => {
              const startIndex = monthIndexFromKey(s.startKey);
              const currentIndex = monthIndexFromKey(key);
              return currentIndex > startIndex && currentIndex < startIndex + s.monthsCovered;
            });

            if (isCoveredByOtherSpan) {
              continue;
            }

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
   <Font ss:Size="10" ss:FontName="Calibri" ss:Bold="1" ss:Color="#065F46"/>
   <Interior ss:Color="#D1FAE5" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <NumberFormat ss:Format="#,##0.00"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#A7F3D0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#A7F3D0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#A7F3D0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#A7F3D0"/>
   </Borders>
  </Style>
  <Style ss:ID="SegundoProrrateoStyle">
   <Font ss:Size="10" ss:FontName="Calibri" ss:Bold="1" ss:Color="#1E40AF"/>
   <Interior ss:Color="#DBEAFE" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <NumberFormat ss:Format="#,##0.00"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#93C5FD"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#93C5FD"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#93C5FD"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#93C5FD"/>
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
    } finally {
      setIsExportingExcel(false);
    }
  };

  // --------------------------------------------------------------------------
  // FILTROS AVANZADOS DE INDICADORES (Por Mes de Facturación, Fechas, Asesor, etc.)
  // --------------------------------------------------------------------------
  const [selectedMesFacturacion, setSelectedMesFacturacion] = React.useState<string>('ALL');
  const [fechaDesde, setFechaDesde] = React.useState<string>('');
  const [fechaHasta, setFechaHasta] = React.useState<string>('');
  const [selectedEstadoPago, setSelectedEstadoPago] = React.useState<string>('ALL');
  const [selectedPlan, setSelectedPlan] = React.useState<string>('ALL');
  const [selectedVendedor, setSelectedVendedor] = React.useState<string>('ALL');
  const [selectedCliente, setSelectedCliente] = React.useState<string>('');
  const [selectedTipoIngreso, setSelectedTipoIngreso] = React.useState<string>('ALL');
  const [selectedMetodoPago, setSelectedMetodoPago] = React.useState<string>('ALL');
  const [selectedRegimen, setSelectedRegimen] = React.useState<string>('ALL');

  // Paginación de tabla de transacciones
  const [ventasPage, setVentasPage] = React.useState<number>(1);
  const [showAllVentas, setShowAllVentas] = React.useState<boolean>(false);
  const ITEMS_PER_PAGE = 8;

  const monthNamesEs = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Setiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // Helper para convertir Date a clave 'YYYY-MM'
  const toMonthKey = (d: Date): string => {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  // Helper para sumar meses a una clave 'YYYY-MM'
  const addMonthsToKeyHelper = (key: string, count: number): string => {
    const [y, m] = key.split('-').map(Number);
    const date = new Date(y, m - 1 + count, 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  };

  // Helper para formatear 'YYYY-MM' a 'Mes Año' en español
  const formatMonthKeyLabel = (key: string): string => {
    const [y, m] = key.split('-').map(Number);
    return `${monthNamesEs[m - 1]} ${y}`;
  };

  // Extraer todas las transacciones reales desde la base de datos (Pagos y Clientes)
  // Con asignación inteligente de meses cubiertos (1.° prorrateo, 2.° prorrateo que cubre 2 meses, anual que cubre 12 meses)
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
      primaryMonth: string;
      coveredMonths: string[];
      tipoIngreso: 'ALTA' | 'MENSUALIDAD' | 'PRORRATEO_1' | 'PRORRATEO_2' | 'ANUAL' | 'MEJORA_PLAN';
      detalleCobertura: string;
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

      // Calcular mes de facturación y meses cubiertos
      const isAnual = (p?.tipoSuscripcion || p?.venta?.suscripcion?.tipoSuscripcion || cli?.tipoSuscripcion || '').toUpperCase() === 'ANUAL';
      const isSegundoProrrateo =
        p?.tipoProrrateo === 'SEGUNDO_PRORRATEO' ||
        cli?.tipoProrrateo === 'SEGUNDO_PRORRATEO' ||
        (p?.conProrrateo && d.getDate() >= 10) ||
        String(p?.observaciones || '').toLowerCase().includes('segundo') ||
        Number(cli?.diasProrrateoAdicional || 0) > 0;
      const isPrimerProrrateo =
        p?.tipoProrrateo === 'PRIMER_PRORRATEO' ||
        (p?.conProrrateo && d.getDate() < 10) ||
        String(p?.observaciones || '').toLowerCase().includes('primer');

      let baseD = d;
      if (p?.periodoInicio) {
        const parsedStart = parseLocalDateSafe(p.periodoInicio);
        if (parsedStart) baseD = parsedStart;
      }
      const primaryMonth = toMonthKey(baseD);
      const coveredMonths: string[] = [];
      let detalleCobertura = formatMonthKeyLabel(primaryMonth);

      let tipoIngreso: 'ALTA' | 'MENSUALIDAD' | 'PRORRATEO_1' | 'PRORRATEO_2' | 'ANUAL' | 'MEJORA_PLAN' = 'MENSUALIDAD';

      if (isAnual) {
        tipoIngreso = 'ANUAL';
        for (let k = 0; k < 12; k++) {
          coveredMonths.push(addMonthsToKeyHelper(primaryMonth, k));
        }
        detalleCobertura = `Anual (12 meses)`;
      } else if (isSegundoProrrateo) {
        tipoIngreso = 'PRORRATEO_2';
        coveredMonths.push(primaryMonth);
        const m2 = addMonthsToKeyHelper(primaryMonth, 1);
        coveredMonths.push(m2);
        detalleCobertura = `2.° Prorr. (${formatMonthKeyLabel(primaryMonth).split(' ')[0]} - ${formatMonthKeyLabel(m2)})`;
      } else if (isPrimerProrrateo) {
        tipoIngreso = 'PRORRATEO_1';
        coveredMonths.push(primaryMonth);
        detalleCobertura = `1.° Prorr. (${formatMonthKeyLabel(primaryMonth)})`;
      } else if (tipoVenta === 'ALTA') {
        tipoIngreso = 'ALTA';
        coveredMonths.push(primaryMonth);
        detalleCobertura = `Alta (${formatMonthKeyLabel(primaryMonth)})`;
      } else if (tipoVenta === 'CAMBIO_PLAN' || tipoVenta === 'MEJORA_PLAN') {
        tipoIngreso = 'MEJORA_PLAN';
        coveredMonths.push(primaryMonth);
        detalleCobertura = `Mejora Plan (${formatMonthKeyLabel(primaryMonth)})`;
      } else {
        tipoIngreso = 'MENSUALIDAD';
        coveredMonths.push(primaryMonth);
        detalleCobertura = formatMonthKeyLabel(primaryMonth);
      }

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
        primaryMonth,
        coveredMonths,
        tipoIngreso,
        detalleCobertura,
      });
    });

    // 2. Incorporar cobros pendientes de clientes sin pago registrado aún
    safeClients.forEach((c, idx) => {
      const hasPayment = list.some((t) => t.ruc === c.ruc);
      if (!hasPayment && c.fechaRegistro) {
        const d = new Date(c.fechaRegistro);
        const rawPlan = c.planContratado || 'Plan Inicia';
        const planNorm = rawPlan.toUpperCase().replace(/^PLAN\s+/, '').trim();
        const primaryMonth = toMonthKey(d);

        const isAnual = (c.tipoSuscripcion || '').toUpperCase() === 'ANUAL';
        const isSegundoProrrateo = c.tipoProrrateo === 'SEGUNDO_PRORRATEO' || Number(c.diasProrrateoAdicional || 0) > 0 || d.getDate() >= 10;
        const coveredMonths: string[] = [];
        let detalleCobertura = formatMonthKeyLabel(primaryMonth);
        let tipoIngreso: 'ALTA' | 'MENSUALIDAD' | 'PRORRATEO_1' | 'PRORRATEO_2' | 'ANUAL' | 'MEJORA_PLAN' = 'ALTA';

        if (isAnual) {
          tipoIngreso = 'ANUAL';
          for (let k = 0; k < 12; k++) coveredMonths.push(addMonthsToKeyHelper(primaryMonth, k));
          detalleCobertura = 'Anual (12 meses)';
        } else if (isSegundoProrrateo) {
          tipoIngreso = 'PRORRATEO_2';
          coveredMonths.push(primaryMonth);
          const m2 = addMonthsToKeyHelper(primaryMonth, 1);
          coveredMonths.push(m2);
          detalleCobertura = `2.° Prorr. (${formatMonthKeyLabel(primaryMonth).split(' ')[0]} - ${formatMonthKeyLabel(m2)})`;
        } else {
          tipoIngreso = 'ALTA';
          coveredMonths.push(primaryMonth);
          detalleCobertura = `Alta (${formatMonthKeyLabel(primaryMonth)})`;
        }

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
          primaryMonth,
          coveredMonths,
          tipoIngreso,
          detalleCobertura,
        });
      }
    });

    return list.sort((a, b) => b.fechaObj.getTime() - a.fechaObj.getTime());
  }, [safeClients, payments]);

  // Lista de meses de facturación disponibles para el selector principal
  const availableBillingMonths = useMemo(() => {
    const map = new Map<string, string>();
    rawTransactions.forEach((t) => {
      t.coveredMonths.forEach((mKey) => {
        if (!map.has(mKey)) {
          map.set(mKey, formatMonthKeyLabel(mKey));
        }
      });
    });
    const nowKey = toMonthKey(new Date());
    if (!map.has(nowKey)) map.set(nowKey, formatMonthKeyLabel(nowKey));

    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [rawTransactions]);

  // Filtrado de transacciones según todos los criterios seleccionados
  const filteredTransactions = useMemo(() => {
    return rawTransactions.filter((t) => {
      // 1. Filtro principal por Mes de Facturación (cubierto)
      if (selectedMesFacturacion !== 'ALL') {
        if (!t.coveredMonths.includes(selectedMesFacturacion)) return false;
      }
      // 2. Filtro fecha de pago / registro (desde)
      if (fechaDesde) {
        const dDesde = new Date(fechaDesde);
        dDesde.setHours(0, 0, 0, 0);
        if (t.fechaObj < dDesde) return false;
      }
      // 3. Filtro fecha de pago / registro (hasta)
      if (fechaHasta) {
        const dHasta = new Date(fechaHasta);
        dHasta.setHours(23, 59, 59, 999);
        if (t.fechaObj > dHasta) return false;
      }
      // 4. Filtro estado de pago
      if (selectedEstadoPago !== 'ALL') {
        if (t.estado !== selectedEstadoPago) return false;
      }
      // 5. Filtro tipo de ingreso
      if (selectedTipoIngreso !== 'ALL') {
        if (t.tipoIngreso !== selectedTipoIngreso) return false;
      }
      // 6. Filtro plan
      if (selectedPlan !== 'ALL') {
        if (!t.planNormalizado.includes(selectedPlan.toUpperCase())) return false;
      }
      // 7. Filtro vendedor
      if (selectedVendedor !== 'ALL') {
        if (t.vendedor !== selectedVendedor) return false;
      }
      // 8. Filtro cliente (RUC o Razón Social)
      if (selectedCliente.trim() !== '') {
        const q = selectedCliente.toLowerCase();
        if (!t.cliente.toLowerCase().includes(q) && !t.ruc.includes(q)) return false;
      }
      // 9. Filtro método de pago
      if (selectedMetodoPago !== 'ALL') {
        if (!t.metodoPago.includes(selectedMetodoPago.toUpperCase())) return false;
      }
      // 10. Filtro régimen
      if (selectedRegimen !== 'ALL') {
        if (!t.regimen.includes(selectedRegimen.toUpperCase())) return false;
      }
      return true;
    });
  }, [
    rawTransactions,
    selectedMesFacturacion,
    fechaDesde,
    fechaHasta,
    selectedEstadoPago,
    selectedTipoIngreso,
    selectedPlan,
    selectedVendedor,
    selectedCliente,
    selectedMetodoPago,
    selectedRegimen,
  ]);

  // --------------------------------------------------------------------------
  // CÁLCULO DE KPIS E INDICADORES FINANCIEROS REALES DE LA BASE DE DATOS
  // --------------------------------------------------------------------------

  // 1. CARTERA EN MORA Y PÉRDIDAS (Vencidos y Bloqueados)
  const vencidosList = useMemo(() => {
    return safeClients.filter((c) => {
      const st = (c.estadoCuenta || '').toUpperCase();
      if (st !== 'VENCIDO') return false;
      if (selectedVendedor !== 'ALL' && c.vendedor !== selectedVendedor) return false;
      if (selectedPlan !== 'ALL' && !c.planContratado?.toUpperCase().includes(selectedPlan.toUpperCase())) return false;
      return true;
    });
  }, [safeClients, selectedVendedor, selectedPlan]);

  const bloqueadosList = useMemo(() => {
    return safeClients.filter((c) => {
      const st = (c.estadoCuenta || '').toUpperCase();
      if (st !== 'BLOQUEADO' && st !== 'SUSPENDIDO') return false;
      if (selectedVendedor !== 'ALL' && c.vendedor !== selectedVendedor) return false;
      if (selectedPlan !== 'ALL' && !c.planContratado?.toUpperCase().includes(selectedPlan.toUpperCase())) return false;
      return true;
    });
  }, [safeClients, selectedVendedor, selectedPlan]);

  const montoVencidos = useMemo(() => {
    return vencidosList.reduce((acc, c) => acc + Number(c.montoSiguienteCobro || c.montoMensual || 19), 0);
  }, [vencidosList]);

  const montoBloqueados = useMemo(() => {
    return bloqueadosList.reduce((acc, c) => acc + Number(c.montoMensual || c.montoSiguienteCobro || 19), 0);
  }, [bloqueadosList]);

  const totalPerdidaRiesgo = montoVencidos + montoBloqueados;
  const totalMorososCount = vencidosList.length + bloqueadosList.length;
  const tasaMorosidad = safeClients.length > 0 ? ((totalMorososCount / safeClients.length) * 100).toFixed(1) : '0';

  // 2. GANANCIA POR ALTAS (Recién Afiliados)
  const altasList = useMemo(() => {
    return filteredTransactions.filter((t) => t.tipoIngreso === 'ALTA' && t.estado === 'PAGADO');
  }, [filteredTransactions]);
  const gananciaAltas = useMemo(() => altasList.reduce((acc, t) => acc + t.monto, 0), [altasList]);
  const countAltas = altasList.length;

  // 3. GANANCIA POR MENSUALIDADES (Renovaciones Recurrentes)
  const mensualidadesList = useMemo(() => {
    return filteredTransactions.filter((t) => t.tipoIngreso === 'MENSUALIDAD' && t.estado === 'PAGADO');
  }, [filteredTransactions]);
  const gananciaMensualidades = useMemo(() => mensualidadesList.reduce((acc, t) => acc + t.monto, 0), [mensualidadesList]);
  const countMensualidades = mensualidadesList.length;

  // 4. GANANCIA POR PRORRATEOS Y ANUALES
  const prorrateo1List = useMemo(() => {
    return filteredTransactions.filter((t) => t.tipoIngreso === 'PRORRATEO_1' && t.estado === 'PAGADO');
  }, [filteredTransactions]);
  const gananciaProrrateo1 = useMemo(() => prorrateo1List.reduce((acc, t) => acc + t.monto, 0), [prorrateo1List]);

  const prorrateo2List = useMemo(() => {
    return filteredTransactions.filter((t) => t.tipoIngreso === 'PRORRATEO_2' && t.estado === 'PAGADO');
  }, [filteredTransactions]);
  const gananciaProrrateo2 = useMemo(() => prorrateo2List.reduce((acc, t) => acc + t.monto, 0), [prorrateo2List]);

  const anualList = useMemo(() => {
    return filteredTransactions.filter((t) => t.tipoIngreso === 'ANUAL' && t.estado === 'PAGADO');
  }, [filteredTransactions]);
  const gananciaAnual = useMemo(() => anualList.reduce((acc, t) => acc + t.monto, 0), [anualList]);

  const totalProrrateosAnuales = gananciaProrrateo1 + gananciaProrrateo2 + gananciaAnual;

  // 5. RECAUDACIÓN Y FACTURACIÓN EFECTIVA
  const totalCobrado = useMemo(() => {
    return filteredTransactions.filter((t) => t.estado === 'PAGADO').reduce((acc, t) => acc + t.monto, 0);
  }, [filteredTransactions]);

  const totalPendiente = useMemo(() => {
    return filteredTransactions.filter((t) => t.estado === 'PENDIENTE').reduce((acc, t) => acc + t.monto, 0);
  }, [filteredTransactions]);

  const totalFacturado = totalCobrado + totalPendiente;
  const efectividadCobro = totalFacturado > 0 ? ((totalCobrado / totalFacturado) * 100).toFixed(1) : '100';
  const ticketPromedio = filteredTransactions.length > 0 ? totalFacturado / filteredTransactions.length : 0;

  // Datos para gráfico comparativo mensual de ingresos
  const monthlyRevenueComparison = useMemo(() => {
    const monthNamesShort = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic'];
    const topMonths = availableBillingMonths.slice(0, 6).reverse();
    if (topMonths.length === 0) {
      return [{ period: 'Actual', altas: gananciaAltas, renovaciones: gananciaMensualidades, prorrateos: totalProrrateosAnuales }];
    }
    return topMonths.map(([mKey]) => {
      const [yr, mo] = mKey.split('-').map(Number);
      const shortLabel = `${monthNamesShort[mo - 1]} ${yr.toString().slice(2)}`;
      let altas = 0;
      let renovaciones = 0;
      let prorrateos = 0;

      rawTransactions.forEach((t) => {
        if (t.estado !== 'PAGADO') return;
        if (t.coveredMonths.includes(mKey)) {
          if (t.tipoIngreso === 'ALTA') altas += t.monto;
          else if (t.tipoIngreso === 'MENSUALIDAD') renovaciones += t.monto;
          else prorrateos += t.monto;
        }
      });

      return {
        period: shortLabel,
        altas,
        renovaciones,
        prorrateos,
      };
    });
  }, [availableBillingMonths, rawTransactions, gananciaAltas, gananciaMensualidades, totalProrrateosAnuales]);

  // Datos para gráfico de evolución temporal diaria
  const timelineData = useMemo(() => {
    const dayMap = new Map<string, { label: string; ventas: number; ingresos: number }>();
    const sorted = [...filteredTransactions].sort((a, b) => a.fechaObj.getTime() - b.fechaObj.getTime());

    if (sorted.length === 0) {
      return [{ label: 'Sin datos', ventas: 0, ingresos: 0 }];
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

  // Desglose por plan contratado
  const planDistribution = useMemo(() => {
    const plans = [
      { key: 'INICIA', label: 'Plan Inicia', color: '#0284C7' },
      { key: 'EMPRENDE', label: 'Plan Emprende', color: '#465FFF' },
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

  const resetFilters = () => {
    setSelectedMesFacturacion('ALL');
    setFechaDesde('');
    setFechaHasta('');
    setSelectedEstadoPago('ALL');
    setSelectedTipoIngreso('ALL');
    setSelectedPlan('ALL');
    setSelectedVendedor('ALL');
    setSelectedCliente('');
    setSelectedMetodoPago('ALL');
    setSelectedRegimen('ALL');
    setVentasPage(1);
  };

  const displayedVentas = showAllVentas
    ? filteredTransactions
    : filteredTransactions.slice((ventasPage - 1) * ITEMS_PER_PAGE, ventasPage * ITEMS_PER_PAGE);
  const totalVentasPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE) || 1;

  return (
    <div className="reporte-general-container admin-module admin-module--reports pb-5">
      {/* Header Principal con Icono de Sección */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4 custom-card admin-module-heading p-3.5">
        <div className="d-flex align-items-center gap-3">
          <div className="section-header-icon section-header-icon-primary">
            <FileSpreadsheet size={24} strokeWidth={2.2} />
          </div>
          <div>
            <h1 className="h5 fw-bold text-dark mb-0.5">Reporte General y Resumen Financiero</h1>
            <p className="text-muted small mb-0">
              Indicadores clave de facturación, pérdidas en mora, ganancias por tipo y exportación consolidada
            </p>
          </div>
        </div>
        <div className="d-flex align-items-center gap-2">
          <button
            onClick={exportToExcelLocal}
            disabled={isExportingExcel}
            className="btn-meta-action btn-meta-action-success"
            title="Exportar reporte consolidado a formato Excel"
          >
            {isExportingExcel ? (
              <RefreshCw size={16} className="spin-anim" />
            ) : (
              <FileSpreadsheet size={16} />
            )}
            <span>{isExportingExcel ? 'Generando Excel...' : 'Exportar Excel'}</span>
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

      {/* STRIP DE 5 INDICADORES CLAVE (ESTILO TAILADMIN) */}
      <div className="row g-3 mb-4 admin-stat-strip">
        {/* KPI 1: Cartera en Riesgo / Pérdida en Mora (Vencidos + Bloqueados) */}
        <div className="col-12 col-sm-6 col-xl">
          <div className="card admin-stat-card h-100 shadow-sm border-0">
            <div className="admin-stat-card-header">
              <span className="admin-stat-card-label">Pérdida en Mora</span>
              <span className="admin-stat-card-icon admin-stat-card-icon--red">
                <AlertTriangle size={18} strokeWidth={2.2} />
              </span>
            </div>
            <div className="d-flex align-items-center gap-1.5 mb-2">
              <span className="admin-stat-card-trend admin-stat-card-trend--danger">
                <ShieldAlert size={12} /> {tasaMorosidad}% morosidad
              </span>
              <span className="admin-stat-card-trend-label">{totalMorososCount} en mora</span>
            </div>
            <div className="admin-stat-card-value text-danger" style={{ fontSize: '1.45rem' }}>
              S/ {totalPerdidaRiesgo.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-muted mt-auto pt-2 border-top" style={{ fontSize: '0.72rem' }}>
              Vencidos: <strong className="text-danger">S/ {montoVencidos.toFixed(2)}</strong> ({vencidosList.length}) · Bloqueados: <strong className="text-dark">S/ {montoBloqueados.toFixed(2)}</strong> ({bloqueadosList.length})
            </div>
          </div>
        </div>

        {/* KPI 2: Ganancia por Altas (Recién Afiliados) */}
        <div className="col-12 col-sm-6 col-xl">
          <div className="card admin-stat-card h-100 shadow-sm border-0">
            <div className="admin-stat-card-header">
              <span className="admin-stat-card-label">Nuevas Altas</span>
              <span className="admin-stat-card-icon admin-stat-card-icon--green">
                <UserPlus size={18} strokeWidth={2.2} />
              </span>
            </div>
            <div className="d-flex align-items-center gap-1.5 mb-2">
              <span className="admin-stat-card-trend">
                <TrendingUp size={12} /> Nuevos clientes
              </span>
              <span className="admin-stat-card-trend-label">{countAltas} altas cobradas</span>
            </div>
            <div className="admin-stat-card-value text-success" style={{ fontSize: '1.45rem' }}>
              S/ {gananciaAltas.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-muted mt-auto pt-2 border-top" style={{ fontSize: '0.72rem' }}>
              Ingreso recaudado por primeras afiliaciones
            </div>
          </div>
        </div>

        {/* KPI 3: Ganancia por Mensualidades (Recurrentes) */}
        <div className="col-12 col-sm-6 col-xl">
          <div className="card admin-stat-card h-100 shadow-sm border-0">
            <div className="admin-stat-card-header">
              <span className="admin-stat-card-label">Mensualidades</span>
              <span className="admin-stat-card-icon admin-stat-card-icon--blue">
                <Repeat size={18} strokeWidth={2.2} />
              </span>
            </div>
            <div className="d-flex align-items-center gap-1.5 mb-2">
              <span className="admin-stat-card-trend" style={{ color: '#465FFF' }}>
                <Clock size={12} /> Recurrente
              </span>
              <span className="admin-stat-card-trend-label">{countMensualidades} mensualidades</span>
            </div>
            <div className="admin-stat-card-value text-primary" style={{ fontSize: '1.45rem' }}>
              S/ {gananciaMensualidades.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-muted mt-auto pt-2 border-top" style={{ fontSize: '0.72rem' }}>
              Cobro recurrente por uso regular de plataforma
            </div>
          </div>
        </div>

        {/* KPI 4: Prorrateos y Planes Anuales */}
        <div className="col-12 col-sm-6 col-xl">
          <div className="card admin-stat-card h-100 shadow-sm border-0">
            <div className="admin-stat-card-header">
              <span className="admin-stat-card-label">Prorrateos y Anuales</span>
              <span className="admin-stat-card-icon admin-stat-card-icon--purple">
                <Layers size={18} strokeWidth={2.2} />
              </span>
            </div>
            <div className="d-flex align-items-center gap-1.5 mb-2">
              <span className="admin-stat-card-trend" style={{ color: '#8B5CF6' }}>
                <Percent size={12} /> Ajustes
              </span>
              <span className="admin-stat-card-trend-label">Prorr. 1 & 2 + Anuales</span>
            </div>
            <div className="admin-stat-card-value" style={{ fontSize: '1.45rem', color: '#7C3AED' }}>
              S/ {totalProrrateosAnuales.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-muted mt-auto pt-2 border-top" style={{ fontSize: '0.72rem' }}>
              1.°: S/ {gananciaProrrateo1.toFixed(0)} · 2.° (2m): S/ {gananciaProrrateo2.toFixed(0)} · Anual: S/ {gananciaAnual.toFixed(0)}
            </div>
          </div>
        </div>

        {/* KPI 5: Recaudación Total Efectiva */}
        <div className="col-12 col-sm-6 col-xl">
          <div className="card admin-stat-card h-100 shadow-sm border-0">
            <div className="admin-stat-card-header">
              <span className="admin-stat-card-label">Total Recaudado</span>
              <span className="admin-stat-card-icon admin-stat-card-icon--green">
                <DollarSign size={18} strokeWidth={2.2} />
              </span>
            </div>
            <div className="d-flex align-items-center gap-1.5 mb-2">
              <span className="admin-stat-card-trend" style={{ color: '#059669' }}>
                <CheckCircle2 size={12} /> {efectividadCobro}% cobrado
              </span>
              <span className="admin-stat-card-trend-label">efectividad</span>
            </div>
            <div className="admin-stat-card-value text-dark" style={{ fontSize: '1.45rem' }}>
              S/ {totalCobrado.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-muted mt-auto pt-2 border-top" style={{ fontSize: '0.72rem' }}>
              Por cobrar en período: <strong className="text-warning">S/ {totalPendiente.toFixed(2)}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* PANEL DE FILTROS AVANZADOS (CON MES DE FACTURACIÓN Y COBERTURA) */}
      <div className="custom-card admin-report-filter-panel p-3.5 mb-4 shadow-sm">
        <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom flex-wrap gap-2">
          <div className="d-flex align-items-center gap-2">
            <Search size={17} className="admin-report-filter-icon" />
            <strong className="admin-report-filter-title">Filtros de Indicadores y Facturación</strong>
          </div>
          <div className="d-flex align-items-center gap-2">
            <span className="cell-subtext">
              Filtrado por mes cubierto (considera 2.° prorrateo de 2 meses y planes anuales)
            </span>
            <button
              onClick={resetFilters}
              className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1 py-1 px-2.5 rounded-3"
              title="Restablecer todos los filtros"
            >
              <RotateCcw size={13} />
              <span>Limpiar filtros</span>
            </button>
          </div>
        </div>

        <div className="row g-2.5">
          {/* Filtro 1: Mes de Facturación Principal */}
          <div className="col-12 col-md-4 col-lg-3">
            <label className="form-label small fw-bold text-dark mb-1 d-flex align-items-center gap-1">
              <Calendar size={14} className="text-primary" /> Mes de facturación cubierto
            </label>
            <select
              className="form-select form-select-sm rounded-3 fw-semibold border-primary"
              style={{ backgroundColor: '#F0F7FF' }}
              value={selectedMesFacturacion}
              onChange={(e) => setSelectedMesFacturacion(e.target.value)}
            >
              <option value="ALL">Todos los meses facturados</option>
              {availableBillingMonths.map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro 2: Fecha de pago desde (por si las moscas) */}
          <div className="col-6 col-md-4 col-lg-2">
            <label className="form-label small fw-semibold text-muted mb-1">Fecha pago desde</label>
            <input
              type="date"
              className="form-control form-control-sm rounded-3"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
            />
          </div>

          {/* Filtro 3: Fecha de pago hasta */}
          <div className="col-6 col-md-4 col-lg-2">
            <label className="form-label small fw-semibold text-muted mb-1">Fecha pago hasta</label>
            <input
              type="date"
              className="form-control form-control-sm rounded-3"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
            />
          </div>

          {/* Filtro 4: Tipo de Ingreso */}
          <div className="col-12 col-md-4 col-lg-2">
            <label className="form-label small fw-semibold text-muted mb-1">Tipo de ingreso</label>
            <select
              className="form-select form-select-sm rounded-3"
              value={selectedTipoIngreso}
              onChange={(e) => setSelectedTipoIngreso(e.target.value)}
            >
              <option value="ALL">Todos los tipos</option>
              <option value="ALTA">Nuevas Altas / Afiliaciones</option>
              <option value="MENSUALIDAD">Mensualidades Regulares</option>
              <option value="PRORRATEO_1">1.° Prorrateo (Días 1 al 9)</option>
              <option value="PRORRATEO_2">2.° Prorrateo (Cubre 2 meses)</option>
              <option value="ANUAL">Planes Anuales (12 meses)</option>
              <option value="MEJORA_PLAN">Mejora / Cambio de Plan</option>
            </select>
          </div>

          {/* Filtro 5: Estado de pago */}
          <div className="col-6 col-md-4 col-lg-1.5">
            <label className="form-label small fw-semibold text-muted mb-1">Estado pago</label>
            <select
              className="form-select form-select-sm rounded-3"
              value={selectedEstadoPago}
              onChange={(e) => setSelectedEstadoPago(e.target.value)}
            >
              <option value="ALL">Todos</option>
              <option value="PAGADO">Pagado</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="CANCELADO">Cancelado</option>
            </select>
          </div>

          {/* Filtro 6: Plan */}
          <div className="col-6 col-md-4 col-lg-1.5">
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

          {/* Filtro 7: Vendedor */}
          <div className="col-12 col-md-4 col-lg-2">
            <label className="form-label small fw-semibold text-muted mb-1">Vendedor / Asesor</label>
            <select
              className="form-select form-select-sm rounded-3"
              value={selectedVendedor}
              onChange={(e) => setSelectedVendedor(e.target.value)}
            >
              <option value="ALL">Todos los vendedores</option>
              {uniqueSellers.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro 8: Buscar cliente */}
          <div className="col-12 col-md-8 col-lg-4">
            <label className="form-label small fw-semibold text-muted mb-1">Buscar por RUC o Razón Social</label>
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-white border-end-0">
                <Search size={14} className="text-muted" />
              </span>
              <input
                type="text"
                className="form-control border-start-0 ps-0 rounded-end-3"
                placeholder="Ej. 20614429501 o Mi Empresa S.A.C."
                value={selectedCliente}
                onChange={(e) => setSelectedCliente(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* FILA DE GRÁFICOS 1: SALUD DE CARTERA (PÉRDIDAS VS COBRADO) + COMPARATIVA DE INGRESOS */}
      <div className="row g-3 mb-4">
        {/* Gráfico 1: Salud de Cartera y Cartera en Riesgo (PortfolioHealthChart) */}
        <div className="col-12 col-lg-5">
          <div className="custom-card admin-chart-card p-4 h-100 d-flex flex-column justify-content-between shadow-sm">
            <div>
              <div className="d-flex justify-content-between align-items-center mb-1">
                <strong className="text-dark fw-bold d-block" style={{ fontSize: '0.92rem' }}>
                  Salud de Cartera y Riesgo de Cobranza
                </strong>
                <span className="badge-tag" style={{ backgroundColor: '#FEF2F2', color: '#B91C1C', borderColor: '#FECACA' }}>
                  S/ {totalPerdidaRiesgo.toFixed(0)} en mora
                </span>
              </div>
              <small className="text-muted d-block mb-3" style={{ fontSize: '0.74rem' }}>
                Proporción de cobranza efectiva vs clientes en mora (Vencidos y Bloqueados)
              </small>

              {/* Componente Gráfico Radial de Salud de Cartera */}
              <PortfolioHealthChart
                cobrado={totalCobrado}
                porCobrar={totalPendiente}
                vencido={montoVencidos}
                bloqueado={montoBloqueados}
              />
            </div>

            {/* Desglose explicativo de cartera */}
            <div className="pt-3 border-top mt-3">
              <div className="row g-2 text-center" style={{ fontSize: '0.74rem' }}>
                <div className="col-3 p-1 rounded-2" style={{ backgroundColor: '#ECFDF5' }}>
                  <span className="text-muted d-block" style={{ fontSize: '0.68rem' }}>Cobrado</span>
                  <strong className="text-success fw-bold">S/ {totalCobrado.toFixed(0)}</strong>
                </div>
                <div className="col-3 p-1 rounded-2" style={{ backgroundColor: '#FFFBEB' }}>
                  <span className="text-muted d-block" style={{ fontSize: '0.68rem' }}>Por Cobrar</span>
                  <strong className="text-warning fw-bold">S/ {totalPendiente.toFixed(0)}</strong>
                </div>
                <div className="col-3 p-1 rounded-2" style={{ backgroundColor: '#FEF2F2' }}>
                  <span className="text-muted d-block" style={{ fontSize: '0.68rem' }}>Vencidos</span>
                  <strong className="text-danger fw-bold">S/ {montoVencidos.toFixed(0)}</strong>
                </div>
                <div className="col-3 p-1 rounded-2" style={{ backgroundColor: '#F1F5F9' }}>
                  <span className="text-muted d-block" style={{ fontSize: '0.68rem' }}>Bloqueados</span>
                  <strong className="text-secondary fw-bold">S/ {montoBloqueados.toFixed(0)}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Gráfico 2: Desglose de Ingresos por Tipo (RevenueTypeBarChart) */}
        <div className="col-12 col-lg-7">
          <div className="custom-card admin-chart-card p-4 h-100 d-flex flex-column justify-content-between shadow-sm">
            <div>
              <div className="d-flex justify-content-between align-items-center mb-1">
                <strong className="text-dark fw-bold d-block" style={{ fontSize: '0.92rem' }}>
                  Ingresos por Concepto (Altas vs Mensualidades vs Prorrateos)
                </strong>
                <span className="badge-tag" style={{ backgroundColor: '#EFF6FF', color: '#1D4ED8', borderColor: '#BFDBFE' }}>
                  Datos en Soles (S/)
                </span>
              </div>
              <small className="text-muted d-block mb-3" style={{ fontSize: '0.74rem' }}>
                Comparativa histórica mensual del origen del dinero recaudado
              </small>

              {/* Componente Gráfico de Barras por Concepto */}
              <RevenueTypeBarChart data={monthlyRevenueComparison} />
            </div>

            {/* Resumen explicativo al pie del gráfico */}
            <div className="d-flex flex-wrap justify-content-between align-items-center pt-2.5 mt-2 border-top gap-2" style={{ fontSize: '0.75rem' }}>
              <span className="text-muted fw-semibold">
                Altas en período: <strong className="text-success fw-bold">S/ {gananciaAltas.toFixed(2)}</strong>
              </span>
              <span className="text-muted fw-semibold">
                Mensualidades: <strong className="text-primary fw-bold">S/ {gananciaMensualidades.toFixed(2)}</strong>
              </span>
              <span className="text-muted fw-semibold">
                Prorrateos y Anuales: <strong className="text-indigo fw-bold" style={{ color: '#8B5CF6' }}>S/ {totalProrrateosAnuales.toFixed(2)}</strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* FILA DE GRÁFICOS 2: EVOLUCIÓN TEMPORAL DIARIA + DONUT POR PLAN */}
      <div className="row g-3 mb-4">
        {/* Gráfico 3: Línea de Evolución Temporal de Facturación */}
        <div className="col-12 col-lg-7">
          <div className="custom-card admin-chart-card p-4 h-100 d-flex flex-column justify-content-between shadow-sm">
            <div>
              <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
                <div>
                  <strong className="text-dark fw-bold d-block" style={{ fontSize: '0.92rem' }}>
                    Evolución Diaria de Facturación y Cobranza
                  </strong>
                  <small className="text-muted" style={{ fontSize: '0.74rem' }}>
                    Flujo de operaciones registradas y dinero efectivamente cobrado
                  </small>
                </div>
                <div className="d-flex align-items-center gap-2">
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

              <SalesTimelineChart data={timelineData} />
            </div>

            <div className="d-flex flex-wrap justify-content-between align-items-center pt-2.5 mt-2 border-top gap-2" style={{ fontSize: '0.75rem' }}>
              <span className="text-muted fw-semibold">
                Efectividad del período:{' '}
                <strong className="text-success fw-bold">{efectividadCobro}%</strong>
              </span>
              <span className="text-muted fw-semibold">
                Ticket Promedio:{' '}
                <strong className="text-dark fw-bold">S/ {ticketPromedio.toFixed(2)}</strong>
              </span>
              <span className="text-muted fw-semibold">
                Operaciones:{' '}
                <strong className="text-primary fw-bold">{filteredTransactions.length} registros</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Gráfico 4: Donut por Plan Contratado */}
        <div className="col-12 col-lg-5">
          <div className="custom-card admin-chart-card p-4 h-100 d-flex flex-column justify-content-between shadow-sm">
            <div>
              <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
                <div>
                  <strong className="text-dark fw-bold d-block" style={{ fontSize: '0.92rem' }}>
                    Distribución por Plan Contratado
                  </strong>
                  <small className="text-muted" style={{ fontSize: '0.74rem' }}>
                    Participación de cada paquete sobre los ingresos
                  </small>
                </div>
                <span className="badge-tag badge-plan-tag">
                  {planDistribution.length} paquetes activos
                </span>
              </div>

              <div className="row align-items-center g-3 pt-2">
                <div className="col-5 d-flex justify-content-center">
                  <PlanDoughnutChart data={planDistribution} totalVentas={totalFacturado} />
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
                      <div className="text-muted small py-2 text-center">Sin transacciones registradas</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2.5 mt-2 border-top text-center text-muted" style={{ fontSize: '0.74rem' }}>
              Base de cálculo: Montos contratados y pagos recibidos en base de datos
            </div>
          </div>
        </div>
      </div>

      {/* TABLA DE AUDITORÍA Y DETALLE DE TRANSACCIONES */}
      <div className="custom-card admin-report-table-card p-3.5 shadow-sm">
        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          <div>
            <strong className="small text-dark fw-bold d-block">Detalle de Operaciones y Facturación</strong>
            <small className="text-muted">
              Mostrando {displayedVentas.length} de {filteredTransactions.length} registros filtrados
            </small>
          </div>
          <div className="d-flex align-items-center gap-2">
            <span className="badge-tag" style={{ backgroundColor: '#F1F5F9', color: '#475569' }}>
              {selectedMesFacturacion === 'ALL' ? 'Todos los meses' : formatMonthKeyLabel(selectedMesFacturacion)}
            </span>
          </div>
        </div>

        <div className="table-card-meta mb-3">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 table-meta">
              <thead>
                <tr>
                  <th>Fecha Pago / Caja</th>
                  <th>Cliente</th>
                  <th>RUC</th>
                  <th>Plan</th>
                  <th>Mes / Período Cubierto</th>
                  <th>Tipo Ingreso</th>
                  <th>Asesor / Vendedor</th>
                  <th>Monto (S/)</th>
                  <th>Método</th>
                  <th className="text-end">Estado</th>
                </tr>
              </thead>
              <tbody>
                {displayedVentas.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center text-muted py-5 fw-semibold">
                      No se encontraron transacciones con los filtros aplicados.
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
                      <td>
                        <span
                          className="badge-tag"
                          style={{
                            backgroundColor: t.tipoIngreso === 'PRORRATEO_2' ? '#FEF3C7' : t.tipoIngreso === 'ANUAL' ? '#EDE9FE' : '#EFF6FF',
                            color: t.tipoIngreso === 'PRORRATEO_2' ? '#92400E' : t.tipoIngreso === 'ANUAL' ? '#6D28D9' : '#1E40AF',
                            border: '1px solid transparent',
                            fontSize: '0.74rem',
                          }}
                        >
                          {t.detalleCobertura}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge-tag ${
                            t.tipoIngreso === 'ALTA'
                              ? 'badge-tag-success'
                              : t.tipoIngreso === 'MENSUALIDAD'
                              ? 'badge-tag-primary'
                              : 'badge-tag-warning'
                          }`}
                          style={{ fontSize: '0.72rem' }}
                        >
                          {t.tipoIngreso === 'ALTA'
                            ? 'Alta'
                            : t.tipoIngreso === 'MENSUALIDAD'
                            ? 'Mensualidad'
                            : t.tipoIngreso === 'PRORRATEO_1'
                            ? '1.° Prorrateo'
                            : t.tipoIngreso === 'PRORRATEO_2'
                            ? '2.° Prorrateo'
                            : t.tipoIngreso === 'ANUAL'
                            ? 'Anual'
                            : 'Upgrade'}
                        </span>
                      </td>
                      <td className="text-dark fw-semibold">{t.vendedor}</td>
                      <td>
                        <span className="cell-amount text-dark fw-bold">S/ {t.monto.toFixed(2)}</span>
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
              {showAllVentas ? 'Ver paginado' : 'Ver todas las transacciones'}
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
  );
}
