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
  CategoryDualAxisChart,
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
  // NAVEGACIÓN POR CATEGORÍAS SEPARADAS (Altas, Renovaciones, Anuales, Deuda)
  // --------------------------------------------------------------------------
  const [activeSection, setActiveSection] = React.useState<
    'RESUMEN' | 'ALTAS' | 'MENSUALIDADES' | 'ANUALES' | 'PRORRATEOS' | 'BLOQUEADOS'
  >('RESUMEN');

  // Filtros Avanzados
  const [selectedMesFacturacion, setSelectedMesFacturacion] = React.useState<string>('ALL');
  const [fechaDesde, setFechaDesde] = React.useState<string>('');
  const [fechaHasta, setFechaHasta] = React.useState<string>('');
  const [selectedEstadoPago, setSelectedEstadoPago] = React.useState<string>('ALL');
  const [selectedPlan, setSelectedPlan] = React.useState<string>('ALL');
  const [selectedVendedor, setSelectedVendedor] = React.useState<string>('ALL');
  const [selectedCliente, setSelectedCliente] = React.useState<string>('');

  // Paginación por sección
  const [tablePage, setTablePage] = React.useState<number>(1);
  const [showAllRows, setShowAllRows] = React.useState<boolean>(false);
  const ITEMS_PER_PAGE = 8;

  const monthNamesEs = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Setiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const toMonthKey = (d: Date): string => {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  const addMonthsToKeyHelper = (key: string, count: number): string => {
    const [y, m] = key.split('-').map(Number);
    const date = new Date(y, m - 1 + count, 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  };

  const formatMonthKeyLabel = (key: string): string => {
    const [y, m] = key.split('-').map(Number);
    return `${monthNamesEs[m - 1]} ${y}`;
  };

  // --------------------------------------------------------------------------
  // EXTRACCIÓN Y NORMALIZACIÓN DE TRANSACCIONES REALES DE BASE DE DATOS
  // --------------------------------------------------------------------------
  const rawTransactions = useMemo(() => {
    const list: Array<{
      id: string;
      fecha: string;
      fechaObj: Date;
      fechaPagoStr: string;
      fechaInicioPlanStr: string;
      fechaFinPlanStr: string;
      cliente: string;
      ruc: string;
      telefono: string;
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

    // 1. Pagos registrados en la base de datos
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
        detalleCobertura = 'Anual (12 meses)';
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

      // Fecha de inicio de su plan
      const rawPlanStart = p?.periodoInicio || cli?.fechaRegistro || cli?.fechaCreacion || cli?.fechaInicioProrrateoAdicional || fechaRaw;
      const planStartObj = parseLocalDateSafe(rawPlanStart) || d;
      const fechaInicioPlanStr = planStartObj.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });

      // Fecha fin (vigencia de 12 meses para planes anuales)
      const rawEnd = p?.periodoFin;
      const planEndObj = rawEnd
        ? parseLocalDateSafe(rawEnd)
        : isAnual
        ? new Date(planStartObj.getFullYear() + 1, planStartObj.getMonth(), planStartObj.getDate())
        : null;
      const fechaFinPlanStr = planEndObj
        ? planEndObj.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })
        : '—';

      const fechaPagoStr = d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });

      const uniqueKey = `pay-${p?.id || idx}-${p?.monto}-${fechaRaw}`;
      if (seenKeys.has(uniqueKey)) return;
      seenKeys.add(uniqueKey);

      list.push({
        id: String(p?.id || `p-${idx}`),
        fecha: d.toISOString(),
        fechaObj: d,
        fechaPagoStr,
        fechaInicioPlanStr,
        fechaFinPlanStr,
        cliente: p?.clienteRazonSocial || p?.venta?.cliente?.razonSocial || cli?.razonSocial || 'Cliente General',
        ruc: p?.clienteRuc || p?.venta?.cliente?.ruc || cli?.ruc || '—',
        telefono: cli?.telefono || cli?.telefonoPersonal || '',
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

    // 2. Incorporar clientes sin pago registrado aún (pendientes de alta)
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

        const planStartObj = parseLocalDateSafe(c.fechaRegistro) || d;
        const fechaInicioPlanStr = planStartObj.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const planEndObj = isAnual ? new Date(planStartObj.getFullYear() + 1, planStartObj.getMonth(), planStartObj.getDate()) : null;
        const fechaFinPlanStr = planEndObj ? planEndObj.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';
        const fechaPagoStr = d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });

        list.push({
          id: `cli-${c.id || idx}`,
          fecha: d.toISOString(),
          fechaObj: d,
          fechaPagoStr,
          fechaInicioPlanStr,
          fechaFinPlanStr,
          cliente: c.razonSocial || 'Cliente General',
          ruc: c.ruc || '—',
          telefono: c.telefono || c.telefonoPersonal || '',
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

  // Meses disponibles para filtro
  const availableBillingMonths = useMemo(() => {
    const map = new Map<string, string>();
    rawTransactions.forEach((t) => {
      t.coveredMonths.forEach((mKey) => {
        if (!map.has(mKey)) map.set(mKey, formatMonthKeyLabel(mKey));
      });
    });
    const nowKey = toMonthKey(new Date());
    if (!map.has(nowKey)) map.set(nowKey, formatMonthKeyLabel(nowKey));
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [rawTransactions]);

  // Transacciones filtradas por los controles generales
  const filteredTransactions = useMemo(() => {
    return rawTransactions.filter((t) => {
      if (selectedMesFacturacion !== 'ALL' && !t.coveredMonths.includes(selectedMesFacturacion)) return false;
      if (fechaDesde) {
        const dDesde = new Date(fechaDesde);
        dDesde.setHours(0, 0, 0, 0);
        if (t.fechaObj < dDesde) return false;
      }
      if (fechaHasta) {
        const dHasta = new Date(fechaHasta);
        dHasta.setHours(23, 59, 59, 999);
        if (t.fechaObj > dHasta) return false;
      }
      if (selectedEstadoPago !== 'ALL' && t.estado !== selectedEstadoPago) return false;
      if (selectedPlan !== 'ALL' && !t.planNormalizado.includes(selectedPlan.toUpperCase())) return false;
      if (selectedVendedor !== 'ALL' && t.vendedor !== selectedVendedor) return false;
      if (selectedCliente.trim() !== '') {
        const q = selectedCliente.toLowerCase();
        if (!t.cliente.toLowerCase().includes(q) && !t.ruc.includes(q)) return false;
      }
      return true;
    });
  }, [rawTransactions, selectedMesFacturacion, fechaDesde, fechaHasta, selectedEstadoPago, selectedPlan, selectedVendedor, selectedCliente]);

  // --------------------------------------------------------------------------
  // CÁLCULO DE DEUDA REAL ACUMULADA EN CLIENTES VENCIDOS Y BLOQUEADOS
  // (Para los bloqueados, los meses impagos se acumulan en el tiempo)
  // --------------------------------------------------------------------------
  const {
    vencidosDetalleList,
    bloqueadosDetalleList,
    totalDeudaVencidos,
    totalDeudaBloqueados,
    totalMesesBloqueados,
    totalDeudaNoCobrada,
    totalClientesConDeuda,
  } = useMemo(() => {
    const now = new Date();
    const vencidos: Array<{ client: Client; tarifa: number; meses: number; deuda: number; fechaBaseStr: string; telefono: string }> = [];
    const bloqueados: Array<{ client: Client; tarifa: number; meses: number; deuda: number; fechaBaseStr: string; telefono: string }> = [];

    safeClients.forEach((c) => {
      const st = (c.estadoCuenta || '').toUpperCase();
      if (selectedVendedor !== 'ALL' && c.vendedor !== selectedVendedor) return;
      if (selectedPlan !== 'ALL' && !c.planContratado?.toUpperCase().includes(selectedPlan.toUpperCase())) return;
      if (selectedCliente.trim() !== '') {
        const q = selectedCliente.toLowerCase();
        if (!c.razonSocial?.toLowerCase().includes(q) && !c.ruc?.includes(q)) return;
      }

      const tarifa = Number(c.montoMensual || c.montoSiguienteCobro || c.precioPlan || 30);
      const baseDate = parseLocalDateSafe(c.fechaVencimientoMensual) || parseLocalDateSafe(c.fechaCapacitacion) || parseLocalDateSafe(c.fechaCreacion) || parseLocalDateSafe(c.fechaRegistro);
      const fechaBaseStr = baseDate ? baseDate.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Sin fecha';
      const telefono = c.telefono || c.telefonoPersonal || '';

      if (st === 'BLOQUEADO' || st === 'SUSPENDIDO') {
        let meses = 1;
        if (baseDate) {
          const diff = (now.getFullYear() - baseDate.getFullYear()) * 12 + (now.getMonth() - baseDate.getMonth());
          meses = Math.max(1, diff + (now.getDate() >= baseDate.getDate() ? 1 : 0));
        }
        bloqueados.push({
          client: c,
          tarifa,
          meses,
          deuda: tarifa * meses,
          fechaBaseStr,
          telefono,
        });
      } else if (st === 'VENCIDO') {
        vencidos.push({
          client: c,
          tarifa,
          meses: 1,
          deuda: tarifa,
          fechaBaseStr,
          telefono,
        });
      }
    });

    const deudaVenc = vencidos.reduce((acc, item) => acc + item.deuda, 0);
    const deudaBloq = bloqueados.reduce((acc, item) => acc + item.deuda, 0);
    const mesesBloq = bloqueados.reduce((acc, item) => acc + item.meses, 0);

    return {
      vencidosDetalleList: vencidos,
      bloqueadosDetalleList: bloqueados,
      totalDeudaVencidos: deudaVenc,
      totalDeudaBloqueados: deudaBloq,
      totalMesesBloqueados: mesesBloq,
      totalDeudaNoCobrada: deudaVenc + deudaBloq,
      totalClientesConDeuda: vencidos.length + bloqueados.length,
    };
  }, [safeClients, selectedVendedor, selectedPlan, selectedCliente]);

  // --------------------------------------------------------------------------
  // SEGREGACIÓN POR CATEGORÍA ESPECÍFICA (ALTAS, MENSUALIDADES, ANUALES, ETC.)
  // --------------------------------------------------------------------------

  // 1. NUEVAS ALTAS (AFILIACIONES)
  const altasData = useMemo(() => {
    return filteredTransactions.filter((t) => t.tipoIngreso === 'ALTA' && t.estado === 'PAGADO');
  }, [filteredTransactions]);
  const gananciaAltas = useMemo(() => altasData.reduce((acc, t) => acc + t.monto, 0), [altasData]);
  const countAltas = altasData.length;
  const promedioAlta = countAltas > 0 ? gananciaAltas / countAltas : 0;

  // 2. RENOVACIONES / MENSUALIDADES RECURRENTES
  const mensualidadesData = useMemo(() => {
    return filteredTransactions.filter((t) => t.tipoIngreso === 'MENSUALIDAD' && t.estado === 'PAGADO');
  }, [filteredTransactions]);
  const gananciaMensualidades = useMemo(() => mensualidadesData.reduce((acc, t) => acc + t.monto, 0), [mensualidadesData]);
  const countMensualidades = mensualidadesData.length;
  const promedioMensualidad = countMensualidades > 0 ? gananciaMensualidades / countMensualidades : 0;

  // 3. PLANES ANUALES
  const anualesData = useMemo(() => {
    return filteredTransactions.filter((t) => t.tipoIngreso === 'ANUAL' && t.estado === 'PAGADO');
  }, [filteredTransactions]);
  const gananciaAnual = useMemo(() => anualesData.reduce((acc, t) => acc + t.monto, 0), [anualesData]);
  const countAnuales = anualesData.length;

  // 4. PRORRATEOS (1er y 2do prorrateo)
  const prorrateo1Data = useMemo(() => filteredTransactions.filter((t) => t.tipoIngreso === 'PRORRATEO_1' && t.estado === 'PAGADO'), [filteredTransactions]);
  const prorrateo2Data = useMemo(() => filteredTransactions.filter((t) => t.tipoIngreso === 'PRORRATEO_2' && t.estado === 'PAGADO'), [filteredTransactions]);
  const gananciaProrrateo1 = useMemo(() => prorrateo1Data.reduce((acc, t) => acc + t.monto, 0), [prorrateo1Data]);
  const gananciaProrrateo2 = useMemo(() => prorrateo2Data.reduce((acc, t) => acc + t.monto, 0), [prorrateo2Data]);
  const totalProrrateos = gananciaProrrateo1 + gananciaProrrateo2;
  const prorrateosCombinedData = useMemo(() => [...prorrateo1Data, ...prorrateo2Data], [prorrateo1Data, prorrateo2Data]);

  // 5. TOTAL COBRADO EFECTIVO EN CAJA
  const totalCobrado = useMemo(() => {
    return filteredTransactions.filter((t) => t.estado === 'PAGADO').reduce((acc, t) => acc + t.monto, 0);
  }, [filteredTransactions]);
  const totalPendiente = useMemo(() => {
    return filteredTransactions.filter((t) => t.estado === 'PENDIENTE').reduce((acc, t) => acc + t.monto, 0);
  }, [filteredTransactions]);
  const totalFacturado = totalCobrado + totalPendiente;
  const efectividadCobro = totalFacturado > 0 ? ((totalCobrado / totalFacturado) * 100).toFixed(1) : '100';

  // --------------------------------------------------------------------------
  // DATOS PARA GRÁFICOS INTERACTIVOS (POR CATEGORÍA Y MENSUALES)
  // --------------------------------------------------------------------------
  const monthNamesShort = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic'];

  // Tendencia mensual de Altas
  const altasMonthlyTrend = useMemo(() => {
    const topMonths = availableBillingMonths.slice(0, 6).reverse();
    if (topMonths.length === 0) return [{ period: 'Actual', monto: gananciaAltas, cantidad: countAltas }];
    return topMonths.map(([mKey]) => {
      const [yr, mo] = mKey.split('-').map(Number);
      const shortLabel = `${monthNamesShort[mo - 1]} ${yr.toString().slice(2)}`;
      let monto = 0;
      let cantidad = 0;
      rawTransactions.forEach((t) => {
        if (t.estado === 'PAGADO' && t.tipoIngreso === 'ALTA' && t.coveredMonths.includes(mKey)) {
          monto += t.monto;
          cantidad += 1;
        }
      });
      return { period: shortLabel, monto, cantidad };
    });
  }, [availableBillingMonths, rawTransactions, gananciaAltas, countAltas]);

  // Tendencia mensual de Renovaciones
  const mensualidadesMonthlyTrend = useMemo(() => {
    const topMonths = availableBillingMonths.slice(0, 6).reverse();
    if (topMonths.length === 0) return [{ period: 'Actual', monto: gananciaMensualidades, cantidad: countMensualidades }];
    return topMonths.map(([mKey]) => {
      const [yr, mo] = mKey.split('-').map(Number);
      const shortLabel = `${monthNamesShort[mo - 1]} ${yr.toString().slice(2)}`;
      let monto = 0;
      let cantidad = 0;
      rawTransactions.forEach((t) => {
        if (t.estado === 'PAGADO' && t.tipoIngreso === 'MENSUALIDAD' && t.coveredMonths.includes(mKey)) {
          monto += t.monto;
          cantidad += 1;
        }
      });
      return { period: shortLabel, monto, cantidad };
    });
  }, [availableBillingMonths, rawTransactions, gananciaMensualidades, countMensualidades]);

  // Tendencia mensual de Anuales
  const anualesMonthlyTrend = useMemo(() => {
    const topMonths = availableBillingMonths.slice(0, 6).reverse();
    if (topMonths.length === 0) return [{ period: 'Actual', monto: gananciaAnual, cantidad: countAnuales }];
    return topMonths.map(([mKey]) => {
      const [yr, mo] = mKey.split('-').map(Number);
      const shortLabel = `${monthNamesShort[mo - 1]} ${yr.toString().slice(2)}`;
      let monto = 0;
      let cantidad = 0;
      rawTransactions.forEach((t) => {
        if (t.estado === 'PAGADO' && t.tipoIngreso === 'ANUAL' && t.coveredMonths.includes(mKey)) {
          monto += t.monto;
          cantidad += 1;
        }
      });
      return { period: shortLabel, monto, cantidad };
    });
  }, [availableBillingMonths, rawTransactions, gananciaAnual, countAnuales]);

  // Comparativa global para Resumen
  const monthlyRevenueComparison = useMemo(() => {
    const topMonths = availableBillingMonths.slice(0, 6).reverse();
    if (topMonths.length === 0) {
      return [{ period: 'Actual', altas: gananciaAltas, renovaciones: gananciaMensualidades, prorrateos: totalProrrateos + gananciaAnual }];
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
      return { period: shortLabel, altas, renovaciones, prorrateos };
    });
  }, [availableBillingMonths, rawTransactions, gananciaAltas, gananciaMensualidades, totalProrrateos, gananciaAnual]);

  // Evolución temporal para Resumen
  const timelineData = useMemo(() => {
    const dayMap = new Map<string, { label: string; ventas: number; ingresos: number }>();
    const sorted = [...filteredTransactions].sort((a, b) => a.fechaObj.getTime() - b.fechaObj.getTime());
    if (sorted.length === 0) return [{ label: 'Sin datos', ventas: 0, ingresos: 0 }];
    sorted.forEach((t) => {
      const d = t.fechaObj;
      const key = `${d.getDate()} ${d.toLocaleDateString('es-PE', { month: 'short' })}`;
      if (!dayMap.has(key)) dayMap.set(key, { label: key, ventas: 0, ingresos: 0 });
      const item = dayMap.get(key)!;
      item.ventas += t.monto;
      if (t.estado === 'PAGADO') item.ingresos += t.monto;
    });
    return Array.from(dayMap.values());
  }, [filteredTransactions]);

  // Distribución por plan
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
    setSelectedPlan('ALL');
    setSelectedVendedor('ALL');
    setSelectedCliente('');
    setTablePage(1);
  };

  // Helper para paginación según sección activa
  const currentTableList = useMemo(() => {
    if (activeSection === 'ALTAS') return altasData;
    if (activeSection === 'MENSUALIDADES') return mensualidadesData;
    if (activeSection === 'ANUALES') return anualesData;
    if (activeSection === 'PRORRATEOS') return prorrateosCombinedData;
    return filteredTransactions;
  }, [activeSection, altasData, mensualidadesData, anualesData, prorrateosCombinedData, filteredTransactions]);

  const displayedRows = showAllRows
    ? currentTableList
    : currentTableList.slice((tablePage - 1) * ITEMS_PER_PAGE, tablePage * ITEMS_PER_PAGE);
  const totalPages = Math.ceil(currentTableList.length / ITEMS_PER_PAGE) || 1;

  return (
    <div className="reporte-general-container admin-module admin-module--reports pb-5">
      {/* Header Principal */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4 custom-card admin-module-heading p-3.5">
        <div className="d-flex align-items-center gap-3">
          <div className="section-header-icon section-header-icon-primary">
            <FileSpreadsheet size={24} strokeWidth={2.2} />
          </div>
          <div>
            <h1 className="h5 fw-bold text-dark mb-0.5">Reporte General y Resumen Financiero</h1>
            <p className="text-muted small mb-0">
              Altas, renovaciones recurrentes, planes anuales y cartera acumulada sin cobrar
            </p>
          </div>
        </div>
        <div className="d-flex align-items-center gap-2">
          <button
            onClick={exportToExcelLocal}
            disabled={isExportingExcel}
            className="btn-meta-action btn-meta-action-success"
            title="Exportar reporte consolidado a formato Excel oficial"
          >
            {isExportingExcel ? <RefreshCw size={16} className="spin-anim" /> : <FileSpreadsheet size={16} />}
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

      {/* STRIP DE 5 INDICADORES PRINCIPALES (ESTILO TAILADMIN) */}
      <div className="row g-3 mb-4 admin-stat-strip">
        {/* KPI 1: Dinero No Cobrado (Vencidos + Bloqueados con meses acumulados) */}
        <div className="col-12 col-sm-6 col-xl">
          <div
            className="card admin-stat-card h-100 shadow-sm border-0 cursor-pointer"
            onClick={() => setActiveSection('BLOQUEADOS')}
            style={{ cursor: 'pointer', transition: 'transform 0.15s ease' }}
            title="Ver lista de clientes con deuda acumulada"
          >
            <div className="admin-stat-card-header">
              <span className="admin-stat-card-label">Dinero No Cobrado</span>
              <span className="admin-stat-card-icon admin-stat-card-icon--red">
                <AlertTriangle size={18} strokeWidth={2.2} />
              </span>
            </div>
            <div className="d-flex align-items-center gap-1.5 mb-2">
              <span className="admin-stat-card-trend admin-stat-card-trend--danger">
                <ShieldAlert size={12} /> Deuda acumulada
              </span>
              <span className="admin-stat-card-trend-label">{totalClientesConDeuda} clientes impagos</span>
            </div>
            <div className="admin-stat-card-value text-danger" style={{ fontSize: '1.45rem' }}>
              S/ {totalDeudaNoCobrada.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-muted mt-auto pt-2 border-top" style={{ fontSize: '0.72rem' }}>
              Vencidos: <strong className="text-danger">S/ {totalDeudaVencidos.toFixed(0)}</strong> ({vencidosDetalleList.length}) · Bloqueados: <strong className="text-dark">S/ {totalDeudaBloqueados.toFixed(0)}</strong> ({bloqueadosDetalleList.length} cli, {totalMesesBloqueados}m)
            </div>
          </div>
        </div>

        {/* KPI 2: Nuevas Altas (Recién Afiliados) */}
        <div className="col-12 col-sm-6 col-xl">
          <div
            className="card admin-stat-card h-100 shadow-sm border-0"
            onClick={() => setActiveSection('ALTAS')}
            style={{ cursor: 'pointer' }}
            title="Ver detalle de nuevas altas"
          >
            <div className="admin-stat-card-header">
              <span className="admin-stat-card-label">Nuevas Altas</span>
              <span className="admin-stat-card-icon admin-stat-card-icon--green">
                <UserPlus size={18} strokeWidth={2.2} />
              </span>
            </div>
            <div className="d-flex align-items-center gap-1.5 mb-2">
              <span className="admin-stat-card-trend">
                <TrendingUp size={12} /> Afiliaciones
              </span>
              <span className="admin-stat-card-trend-label">{countAltas} clientes afiliados</span>
            </div>
            <div className="admin-stat-card-value text-success" style={{ fontSize: '1.45rem' }}>
              S/ {gananciaAltas.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-muted mt-auto pt-2 border-top" style={{ fontSize: '0.72rem' }}>
              Promedio por alta: <strong>S/ {promedioAlta.toFixed(2)}</strong>
            </div>
          </div>
        </div>

        {/* KPI 3: Mensualidades Recurrentes */}
        <div className="col-12 col-sm-6 col-xl">
          <div
            className="card admin-stat-card h-100 shadow-sm border-0"
            onClick={() => setActiveSection('MENSUALIDADES')}
            style={{ cursor: 'pointer' }}
            title="Ver detalle de renovaciones mensuales"
          >
            <div className="admin-stat-card-header">
              <span className="admin-stat-card-label">Renovaciones</span>
              <span className="admin-stat-card-icon admin-stat-card-icon--blue">
                <Repeat size={18} strokeWidth={2.2} />
              </span>
            </div>
            <div className="d-flex align-items-center gap-1.5 mb-2">
              <span className="admin-stat-card-trend" style={{ color: '#465FFF' }}>
                <Clock size={12} /> Mensualidades
              </span>
              <span className="admin-stat-card-trend-label">{countMensualidades} cobradas</span>
            </div>
            <div className="admin-stat-card-value text-primary" style={{ fontSize: '1.45rem' }}>
              S/ {gananciaMensualidades.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-muted mt-auto pt-2 border-top" style={{ fontSize: '0.72rem' }}>
              Promedio mensual: <strong>S/ {promedioMensualidad.toFixed(2)}</strong>
            </div>
          </div>
        </div>

        {/* KPI 4: Planes Anuales */}
        <div className="col-12 col-sm-6 col-xl">
          <div
            className="card admin-stat-card h-100 shadow-sm border-0"
            onClick={() => setActiveSection('ANUALES')}
            style={{ cursor: 'pointer' }}
            title="Ver clientes con suscripción anual de 12 meses"
          >
            <div className="admin-stat-card-header">
              <span className="admin-stat-card-label">Planes Anuales</span>
              <span className="admin-stat-card-icon admin-stat-card-icon--purple">
                <Calendar size={18} strokeWidth={2.2} />
              </span>
            </div>
            <div className="d-flex align-items-center gap-1.5 mb-2">
              <span className="admin-stat-card-trend" style={{ color: '#8B5CF6' }}>
                <Percent size={12} /> 12 Meses
              </span>
              <span className="admin-stat-card-trend-label">{countAnuales} suscripciones</span>
            </div>
            <div className="admin-stat-card-value" style={{ fontSize: '1.45rem', color: '#7C3AED' }}>
              S/ {gananciaAnual.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-muted mt-auto pt-2 border-top" style={{ fontSize: '0.72rem' }}>
              Prorrateos adicionales: <strong>S/ {totalProrrateos.toFixed(2)}</strong>
            </div>
          </div>
        </div>

        {/* KPI 5: Total Recaudado en Caja */}
        <div className="col-12 col-sm-6 col-xl">
          <div
            className="card admin-stat-card h-100 shadow-sm border-0"
            onClick={() => setActiveSection('RESUMEN')}
            style={{ cursor: 'pointer' }}
            title="Ver vista general consolidada"
          >
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
              Pendiente por cobrar: <strong className="text-warning">S/ {totalPendiente.toFixed(2)}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* PANEL DE FILTROS SUPERIORES (SIMPLE Y DIRECTO) */}
      <div className="custom-card admin-report-filter-panel p-3.5 mb-4 shadow-sm">
        <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom flex-wrap gap-2">
          <div className="d-flex align-items-center gap-2">
            <Search size={17} className="admin-report-filter-icon text-primary" />
            <strong className="admin-report-filter-title text-dark">Filtros de Período y Búsqueda</strong>
          </div>
          <div className="d-flex align-items-center gap-2">
            <span className="text-muted small">
              Filtro por mes cubierto (evalúa prorrateos de 2 meses y anuales de 12 meses)
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
          {/* Selector de Mes de Facturación Principal */}
          <div className="col-12 col-md-4 col-lg-3">
            <label className="form-label small fw-bold text-dark mb-1 d-flex align-items-center gap-1">
              <Calendar size={14} className="text-primary" /> Mes de facturación cubierto
            </label>
            <select
              className="form-select form-select-sm rounded-3 fw-semibold border-primary"
              style={{ backgroundColor: '#F0F7FF' }}
              value={selectedMesFacturacion}
              onChange={(e) => {
                setSelectedMesFacturacion(e.target.value);
                setTablePage(1);
              }}
            >
              <option value="ALL">Todos los meses facturados</option>
              {availableBillingMonths.map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Fecha Pago Desde */}
          <div className="col-6 col-md-4 col-lg-2">
            <label className="form-label small fw-semibold text-muted mb-1">Fecha pago desde</label>
            <input
              type="date"
              className="form-control form-control-sm rounded-3"
              value={fechaDesde}
              onChange={(e) => {
                setFechaDesde(e.target.value);
                setTablePage(1);
              }}
            />
          </div>

          {/* Fecha Pago Hasta */}
          <div className="col-6 col-md-4 col-lg-2">
            <label className="form-label small fw-semibold text-muted mb-1">Fecha pago hasta</label>
            <input
              type="date"
              className="form-control form-control-sm rounded-3"
              value={fechaHasta}
              onChange={(e) => {
                setFechaHasta(e.target.value);
                setTablePage(1);
              }}
            />
          </div>

          {/* Vendedor / Asesor */}
          <div className="col-12 col-md-4 col-lg-2">
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

          {/* Buscador de Cliente */}
          <div className="col-12 col-md-8 col-lg-3">
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

      {/* BARRA DE NAVEGACIÓN POR CATEGORÍAS SEPARADAS (ESTILO TAILADMIN) */}
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
            setActiveSection('ALTAS');
            setTablePage(1);
          }}
          className={`btn btn-sm px-3.5 py-2 fw-semibold rounded-pill d-flex align-items-center gap-2 ${
            activeSection === 'ALTAS' ? 'btn-success text-white shadow-sm' : 'btn-light text-secondary'
          }`}
          style={{ whiteSpace: 'nowrap' }}
        >
          <UserPlus size={15} />
          <span>Nuevas Altas ({countAltas})</span>
          <span className="badge rounded-pill bg-white text-success px-2 py-0.5" style={{ fontSize: '0.7rem' }}>
            S/ {gananciaAltas.toFixed(0)}
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
          <span>Renovaciones ({countMensualidades})</span>
          <span className="badge rounded-pill bg-white text-primary px-2 py-0.5" style={{ fontSize: '0.7rem' }}>
            S/ {gananciaMensualidades.toFixed(0)}
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
          <span>Planes Anuales ({countAnuales})</span>
          <span className="badge rounded-pill bg-white text-purple px-2 py-0.5" style={{ fontSize: '0.7rem', color: '#7C3AED' }}>
            S/ {gananciaAnual.toFixed(0)}
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
          <span>Prorrateos ({prorrateosCombinedData.length})</span>
          <span className="badge rounded-pill bg-white text-dark px-2 py-0.5" style={{ fontSize: '0.7rem' }}>
            S/ {totalProrrateos.toFixed(0)}
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
          <span>Deuda Acumulada ({totalClientesConDeuda})</span>
          <span className="badge rounded-pill bg-white text-danger px-2 py-0.5" style={{ fontSize: '0.7rem' }}>
            S/ {totalDeudaNoCobrada.toFixed(0)}
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* VISTA 1: RESUMEN CONSOLIDADO                                              */}
      {/* ========================================================================= */}
      {activeSection === 'RESUMEN' && (
        <>
          {/* Fila 1 de gráficos: Salud de Cartera y Comparativa de Ingresos */}
          <div className="row g-3 mb-4">
            <div className="col-12 col-lg-5">
              <div className="custom-card admin-chart-card p-4 h-100 d-flex flex-column justify-content-between shadow-sm">
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <strong className="text-dark fw-bold d-block" style={{ fontSize: '0.92rem' }}>
                      Salud de Cartera y Cobranza
                    </strong>
                    <span className="badge-tag" style={{ backgroundColor: '#FEF2F2', color: '#B91C1C', borderColor: '#FECACA' }}>
                      S/ {totalDeudaNoCobrada.toFixed(0)} sin cobrar
                    </span>
                  </div>
                  <small className="text-muted d-block mb-3" style={{ fontSize: '0.74rem' }}>
                    Cobrado efectivo vs cartera vencida y bloqueados acumulados
                  </small>
                  <PortfolioHealthChart
                    cobrado={totalCobrado}
                    porCobrar={totalPendiente}
                    vencido={totalDeudaVencidos}
                    bloqueado={totalDeudaBloqueados}
                  />
                </div>
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
                      <strong className="text-danger fw-bold">S/ {totalDeudaVencidos.toFixed(0)}</strong>
                    </div>
                    <div className="col-3 p-1 rounded-2" style={{ backgroundColor: '#F1F5F9' }}>
                      <span className="text-muted d-block" style={{ fontSize: '0.68rem' }}>Bloqueados</span>
                      <strong className="text-secondary fw-bold">S/ {totalDeudaBloqueados.toFixed(0)}</strong>
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
                      Ingresos por Concepto (Altas vs Mensualidades vs Prorrateos)
                    </strong>
                    <span className="badge-tag" style={{ backgroundColor: '#EFF6FF', color: '#1D4ED8', borderColor: '#BFDBFE' }}>
                      Datos en Soles (S/)
                    </span>
                  </div>
                  <small className="text-muted d-block mb-3" style={{ fontSize: '0.74rem' }}>
                    Comparativa histórica mensual del origen del dinero recaudado
                  </small>
                  <RevenueTypeBarChart data={monthlyRevenueComparison} />
                </div>
                <div className="d-flex flex-wrap justify-content-between align-items-center pt-2.5 mt-2 border-top gap-2" style={{ fontSize: '0.75rem' }}>
                  <span className="text-muted fw-semibold">
                    Altas: <strong className="text-success fw-bold">S/ {gananciaAltas.toFixed(2)}</strong>
                  </span>
                  <span className="text-muted fw-semibold">
                    Mensualidades: <strong className="text-primary fw-bold">S/ {gananciaMensualidades.toFixed(2)}</strong>
                  </span>
                  <span className="text-muted fw-semibold">
                    Anuales y Prorrateos: <strong className="text-indigo fw-bold" style={{ color: '#8B5CF6' }}>S/ {(gananciaAnual + totalProrrateos).toFixed(2)}</strong>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Fila 2 de gráficos: Evolución Temporal y Planes */}
          <div className="row g-3 mb-4">
            <div className="col-12 col-lg-7">
              <div className="custom-card admin-chart-card p-4 h-100 d-flex flex-column justify-content-between shadow-sm">
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
                    <div>
                      <strong className="text-dark fw-bold d-block" style={{ fontSize: '0.92rem' }}>
                        Evolución Diaria de Facturación y Cobranza
                      </strong>
                      <small className="text-muted" style={{ fontSize: '0.74rem' }}>
                        Flujo de operaciones registradas y dinero cobrado
                      </small>
                    </div>
                  </div>
                  <SalesTimelineChart data={timelineData} />
                </div>
                <div className="d-flex flex-wrap justify-content-between align-items-center pt-2.5 mt-2 border-top gap-2" style={{ fontSize: '0.75rem' }}>
                  <span className="text-muted fw-semibold">
                    Efectividad: <strong className="text-success fw-bold">{efectividadCobro}%</strong>
                  </span>
                  <span className="text-muted fw-semibold">
                    Operaciones: <strong className="text-primary fw-bold">{filteredTransactions.length} registros</strong>
                  </span>
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
                    <span className="badge-tag badge-plan-tag">{planDistribution.length} paquetes</span>
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

      {/* ========================================================================= */}
      {/* VISTA 2: SECCIÓN ESPECÍFICA DE NUEVAS ALTAS (AFILIACIONES)                 */}
      {/* ========================================================================= */}
      {activeSection === 'ALTAS' && (
        <div className="mb-4">
          <div className="row g-3 mb-4">
            <div className="col-12 col-md-4">
              <div className="card admin-stat-card p-3 shadow-sm border-0 h-100">
                <span className="admin-stat-card-label">Total Recaudado en Altas</span>
                <div className="admin-stat-card-value text-success mt-1" style={{ fontSize: '1.6rem' }}>
                  S/ {gananciaAltas.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <small className="text-muted mt-2">Primer pago ingresado por afiliación</small>
              </div>
            </div>
            <div className="col-12 col-md-4">
              <div className="card admin-stat-card p-3 shadow-sm border-0 h-100">
                <span className="admin-stat-card-label">Cantidad de Clientes Afiliados</span>
                <div className="admin-stat-card-value text-dark mt-1" style={{ fontSize: '1.6rem' }}>
                  {countAltas} clientes
                </div>
                <small className="text-muted mt-2">Nuevos contratos en el período</small>
              </div>
            </div>
            <div className="col-12 col-md-4">
              <div className="card admin-stat-card p-3 shadow-sm border-0 h-100">
                <span className="admin-stat-card-label">Ticket Promedio por Alta</span>
                <div className="admin-stat-card-value text-primary mt-1" style={{ fontSize: '1.6rem' }}>
                  S/ {promedioAlta.toFixed(2)}
                </div>
                <small className="text-muted mt-2">Valor medio por nuevo afiliado</small>
              </div>
            </div>
          </div>

          {/* Gráfico Exclusivo de Nuevas Altas */}
          <div className="custom-card p-4 mb-4 shadow-sm">
            <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
              <div>
                <strong className="text-dark fw-bold d-block" style={{ fontSize: '0.95rem' }}>
                  Evolución Mensual de Nuevas Altas (Cantidad vs Monto Recaudado)
                </strong>
                <small className="text-muted">
                  Visualiza mes a mes cuántos clientes nuevos se sumaron y cuánto dinero generaron
                </small>
              </div>
              <span className="badge-tag" style={{ backgroundColor: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0' }}>
                {countAltas} afiliaciones en período
              </span>
            </div>
            <CategoryDualAxisChart
              data={altasMonthlyTrend}
              themeColor="#10B981"
              lineColor="#0284C7"
              cantidadLabel="Afiliaciones"
              montoLabel="Recaudado en Altas (S/)"
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA 3: SECCIÓN ESPECÍFICA DE RENOVACIONES / MENSUALIDADES                */}
      {/* ========================================================================= */}
      {activeSection === 'MENSUALIDADES' && (
        <div className="mb-4">
          <div className="row g-3 mb-4">
            <div className="col-12 col-md-4">
              <div className="card admin-stat-card p-3 shadow-sm border-0 h-100">
                <span className="admin-stat-card-label">Recaudación por Mensualidades</span>
                <div className="admin-stat-card-value text-primary mt-1" style={{ fontSize: '1.6rem' }}>
                  S/ {gananciaMensualidades.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <small className="text-muted mt-2">Suscripciones recurrentes pagadas</small>
              </div>
            </div>
            <div className="col-12 col-md-4">
              <div className="card admin-stat-card p-3 shadow-sm border-0 h-100">
                <span className="admin-stat-card-label">Mensualidades Cobradas</span>
                <div className="admin-stat-card-value text-dark mt-1" style={{ fontSize: '1.6rem' }}>
                  {countMensualidades} cobros
                </div>
                <small className="text-muted mt-2">Clientes que pagaron su renovación</small>
              </div>
            </div>
            <div className="col-12 col-md-4">
              <div className="card admin-stat-card p-3 shadow-sm border-0 h-100">
                <span className="admin-stat-card-label">Tarifa Promedio Mensual</span>
                <div className="admin-stat-card-value text-dark mt-1" style={{ fontSize: '1.6rem' }}>
                  S/ {promedioMensualidad.toFixed(2)}
                </div>
                <small className="text-muted mt-2">Ingreso recurrente promedio</small>
              </div>
            </div>
          </div>

          {/* Gráfico Exclusivo de Renovaciones */}
          <div className="custom-card p-4 mb-4 shadow-sm">
            <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
              <div>
                <strong className="text-dark fw-bold d-block" style={{ fontSize: '0.95rem' }}>
                  Evolución Mensual de Renovaciones Recurrentes
                </strong>
                <small className="text-muted">
                  Comportamiento mensual de cobranzas de clientes recurrentes al día
                </small>
              </div>
              <span className="badge-tag" style={{ backgroundColor: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}>
                {countMensualidades} renovaciones
              </span>
            </div>
            <CategoryDualAxisChart
              data={mensualidadesMonthlyTrend}
              themeColor="#3B82F6"
              lineColor="#8B5CF6"
              cantidadLabel="Renovaciones"
              montoLabel="Recaudado en Mensualidades (S/)"
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA 4: SECCIÓN ESPECÍFICA DE PLANES ANUALES                              */}
      {/* ========================================================================= */}
      {activeSection === 'ANUALES' && (
        <div className="mb-4">
          <div className="row g-3 mb-4">
            <div className="col-12 col-md-4">
              <div className="card admin-stat-card p-3 shadow-sm border-0 h-100">
                <span className="admin-stat-card-label">Recaudación en Planes Anuales</span>
                <div className="admin-stat-card-value mt-1" style={{ fontSize: '1.6rem', color: '#7C3AED' }}>
                  S/ {gananciaAnual.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <small className="text-muted mt-2">Ingresos cobrados por período de 12 meses</small>
              </div>
            </div>
            <div className="col-12 col-md-4">
              <div className="card admin-stat-card p-3 shadow-sm border-0 h-100">
                <span className="admin-stat-card-label">Suscripciones Anuales</span>
                <div className="admin-stat-card-value text-dark mt-1" style={{ fontSize: '1.6rem' }}>
                  {countAnuales} clientes
                </div>
                <small className="text-muted mt-2">Clientes con vigencia por 1 año</small>
              </div>
            </div>
            <div className="col-12 col-md-4">
              <div className="card admin-stat-card p-3 shadow-sm border-0 h-100">
                <span className="admin-stat-card-label">Vigencia y Cobertura</span>
                <div className="admin-stat-card-value text-success mt-1" style={{ fontSize: '1.6rem' }}>
                  12 Meses
                </div>
                <small className="text-muted mt-2">Servicio continuo sin cortes mensuales</small>
              </div>
            </div>
          </div>

          {/* Gráfico Exclusivo de Planes Anuales */}
          <div className="custom-card p-4 mb-4 shadow-sm">
            <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
              <div>
                <strong className="text-dark fw-bold d-block" style={{ fontSize: '0.95rem' }}>
                  Contratación y Recaudación de Planes Anuales
                </strong>
                <small className="text-muted">
                  Ingresos y número de afiliados bajo modalidad de pago anual (12 meses)
                </small>
              </div>
              <span className="badge-tag" style={{ backgroundColor: '#EDE9FE', color: '#6D28D9', border: '1px solid #DDD6FE' }}>
                {countAnuales} suscripciones anuales
              </span>
            </div>
            <CategoryDualAxisChart
              data={anualesMonthlyTrend}
              themeColor="#7C3AED"
              lineColor="#10B981"
              cantidadLabel="Planes Anuales"
              montoLabel="Recaudado Anual (S/)"
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA 5: SECCIÓN ESPECÍFICA DE PRORRATEOS (1er y 2do)                     */}
      {/* ========================================================================= */}
      {activeSection === 'PRORRATEOS' && (
        <div className="mb-4">
          <div className="row g-3 mb-4">
            <div className="col-12 col-md-4">
              <div className="card admin-stat-card p-3 shadow-sm border-0 h-100">
                <span className="admin-stat-card-label">1.° Prorrateo (Días 1 al 9)</span>
                <div className="admin-stat-card-value text-primary mt-1" style={{ fontSize: '1.6rem' }}>
                  S/ {gananciaProrrateo1.toFixed(2)}
                </div>
                <small className="text-muted mt-2">{prorrateo1Data.length} cobros proporcionales</small>
              </div>
            </div>
            <div className="col-12 col-md-4">
              <div className="card admin-stat-card p-3 shadow-sm border-0 h-100">
                <span className="admin-stat-card-label">2.° Prorrateo (Cubre 2 Meses)</span>
                <div className="admin-stat-card-value text-warning mt-1" style={{ fontSize: '1.6rem' }}>
                  S/ {gananciaProrrateo2.toFixed(2)}
                </div>
                <small className="text-muted mt-2">{prorrateo2Data.length} cobros (días restantes + mes siguiente)</small>
              </div>
            </div>
            <div className="col-12 col-md-4">
              <div className="card admin-stat-card p-3 shadow-sm border-0 h-100">
                <span className="admin-stat-card-label">Total Recaudado en Prorrateos</span>
                <div className="admin-stat-card-value text-dark mt-1" style={{ fontSize: '1.6rem' }}>
                  S/ {totalProrrateos.toFixed(2)}
                </div>
                <small className="text-muted mt-2">Ajustes proporcionales por fecha de ingreso</small>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA 6: SECCIÓN ESPECÍFICA DE CLIENTES VENCIDOS Y BLOQUEADOS (DEUDA REAL)*/}
      {/* ========================================================================= */}
      {activeSection === 'BLOQUEADOS' && (
        <div className="mb-4">
          <div className="row g-3 mb-4">
            <div className="col-12 col-md-4">
              <div className="card admin-stat-card p-3 shadow-sm border-0 h-100">
                <span className="admin-stat-card-label">Total Dinero No Cobrado</span>
                <div className="admin-stat-card-value text-danger mt-1" style={{ fontSize: '1.65rem' }}>
                  S/ {totalDeudaNoCobrada.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <small className="text-muted mt-2">Deuda total acumulada en cartera vencida y suspendida</small>
              </div>
            </div>
            <div className="col-12 col-md-4">
              <div className="card admin-stat-card p-3 shadow-sm border-0 h-100">
                <span className="admin-stat-card-label">Bloqueados (Meses Acumulados)</span>
                <div className="admin-stat-card-value text-dark mt-1" style={{ fontSize: '1.65rem' }}>
                  S/ {totalDeudaBloqueados.toFixed(2)}
                </div>
                <small className="text-muted mt-2">
                  {bloqueadosDetalleList.length} clientes · <strong className="text-danger">{totalMesesBloqueados} meses sin pagar acumulados</strong>
                </small>
              </div>
            </div>
            <div className="col-12 col-md-4">
              <div className="card admin-stat-card p-3 shadow-sm border-0 h-100">
                <span className="admin-stat-card-label">Vencidos Recientes (1 Mes)</span>
                <div className="admin-stat-card-value text-warning mt-1" style={{ fontSize: '1.65rem' }}>
                  S/ {totalDeudaVencidos.toFixed(2)}
                </div>
                <small className="text-muted mt-2">{vencidosDetalleList.length} clientes en período de gracia / 1 mes impago</small>
              </div>
            </div>
          </div>

          {/* Tarjeta explicativa de la acumulación de meses */}
          <div className="alert alert-light border rounded-3 p-3 mb-4 d-flex align-items-center gap-3" style={{ backgroundColor: '#FFF7ED', borderColor: '#FED7AA' }}>
            <AlertTriangle className="text-warning flex-shrink-0" size={24} />
            <div className="small text-dark">
              <strong>Cálculo Real de Deuda para Clientes Bloqueados:</strong> A los clientes bloqueados se les calcula la deuda multiplicando su tarifa mensual por cada mes que ha transcurrido desde su último vencimiento sin registrar pago. Esto refleja con precisión el dinero total que la empresa ha dejado de percibir.
            </div>
          </div>

          {/* Tabla de Clientes con Deuda Acumulada */}
          <div className="custom-card p-3.5 shadow-sm mb-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <strong className="text-dark fw-bold d-block" style={{ fontSize: '0.92rem' }}>
                  Listado Detallado de Clientes con Deuda (Vencidos y Bloqueados)
                </strong>
                <small className="text-muted">
                  Mostrando {vencidosDetalleList.length + bloqueadosDetalleList.length} clientes con pagos pendientes
                </small>
              </div>
            </div>

            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 table-meta">
                <thead>
                  <tr>
                    <th>Cliente / Razón Social</th>
                    <th>RUC</th>
                    <th>Estado</th>
                    <th>Tarifa Mensual</th>
                    <th>Último Vencimiento</th>
                    <th>Meses Sin Pagar</th>
                    <th>Deuda Acumulada</th>
                    <th className="text-end">Contacto</th>
                  </tr>
                </thead>
                <tbody>
                  {[...bloqueadosDetalleList, ...vencidosDetalleList].length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center text-muted py-4 fw-semibold">
                        Excelente: No existen clientes vencidos ni bloqueados con los filtros seleccionados.
                      </td>
                    </tr>
                  ) : (
                    [...bloqueadosDetalleList, ...vencidosDetalleList].map((item, idx) => {
                      const isBloq = (item.client.estadoCuenta || '').toUpperCase() === 'BLOQUEADO';
                      return (
                        <tr key={idx}>
                          <td>
                            <strong className="text-dark d-block">{item.client.razonSocial || 'Cliente General'}</strong>
                            <small className="text-muted">{item.client.planContratado || 'Plan Estándar'}</small>
                          </td>
                          <td className="font-monospace text-muted">{item.client.ruc || '—'}</td>
                          <td>
                            <span
                              className="badge rounded-pill px-2.5 py-1 fw-bold"
                              style={{
                                backgroundColor: isBloq ? '#FEE2E2' : '#FEF3C7',
                                color: isBloq ? '#991B1B' : '#92400E',
                              }}
                            >
                              {isBloq ? 'BLOQUEADO' : 'VENCIDO'}
                            </span>
                          </td>
                          <td className="fw-semibold text-dark">S/ {item.tarifa.toFixed(2)}</td>
                          <td className="text-muted">{item.fechaBaseStr}</td>
                          <td>
                            <span
                              className="badge rounded-pill px-2 py-0.5"
                              style={{
                                backgroundColor: item.meses > 1 ? '#FEE2E2' : '#F1F5F9',
                                color: item.meses > 1 ? '#B91C1C' : '#475569',
                                fontWeight: item.meses > 1 ? '700' : '500',
                              }}
                            >
                              {item.meses} {item.meses === 1 ? 'mes adeudado' : 'meses adeudados'}
                            </span>
                          </td>
                          <td>
                            <strong className="text-danger fw-bold" style={{ fontSize: '0.95rem' }}>
                              S/ {item.deuda.toFixed(2)}
                            </strong>
                          </td>
                          <td className="text-end text-muted font-monospace">{item.telefono || '—'}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TABLA PRINCIPAL DE AUDITORÍA Y DETALLE DE OPERACIONES                     */}
      {/* ========================================================================= */}
      {activeSection !== 'BLOQUEADOS' && (
        <div className="custom-card admin-report-table-card p-3.5 shadow-sm">
          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <div>
              <strong className="small text-dark fw-bold d-block">
                {activeSection === 'ALTAS'
                  ? 'Detalle de Nuevas Altas (Con Fecha de Inicio de su Plan)'
                  : activeSection === 'MENSUALIDADES'
                  ? 'Detalle de Renovaciones Recurrentes'
                  : activeSection === 'ANUALES'
                  ? 'Detalle de Planes Anuales (Vigencia 12 Meses)'
                  : activeSection === 'PRORRATEOS'
                  ? 'Detalle de Cobros con Prorrateo'
                  : 'Detalle de Operaciones y Facturación'}
              </strong>
              <small className="text-muted">
                Mostrando {displayedRows.length} de {currentTableList.length} operaciones filtradas
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
                    <th>Cliente / Empresa</th>
                    <th>RUC</th>
                    {activeSection === 'ALTAS' ? (
                      <th style={{ color: '#059669', backgroundColor: '#ECFDF5' }}>Fecha Inicio de Plan</th>
                    ) : activeSection === 'ANUALES' ? (
                      <th style={{ color: '#7C3AED', backgroundColor: '#EDE9FE' }}>Periodo Vigencia (12 Meses)</th>
                    ) : (
                      <th>Mes Cubierto</th>
                    )}
                    <th>Fecha Pago Caja</th>
                    <th>Plan</th>
                    <th>Tipo Ingreso</th>
                    <th>Asesor</th>
                    <th>Monto (S/)</th>
                    <th>Método</th>
                    <th className="text-end">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedRows.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center text-muted py-5 fw-semibold">
                        No se encontraron registros para esta sección con los filtros actuales.
                      </td>
                    </tr>
                  ) : (
                    displayedRows.map((t) => (
                      <tr key={t.id}>
                        <td>
                          <span className="cell-title fw-bold text-dark d-block">{t.cliente}</span>
                          {t.telefono && <small className="text-muted">{t.telefono}</small>}
                        </td>
                        <td className="text-muted font-monospace">{t.ruc}</td>

                        {/* Columna condicional clave solicitada por el usuario */}
                        {activeSection === 'ALTAS' ? (
                          <td>
                            <span className="badge rounded-pill px-2.5 py-1 fw-bold" style={{ backgroundColor: '#D1FAE5', color: '#065F46' }}>
                              Inicio: {t.fechaInicioPlanStr}
                            </span>
                          </td>
                        ) : activeSection === 'ANUALES' ? (
                          <td>
                            <span className="badge rounded-pill px-2.5 py-1 fw-bold" style={{ backgroundColor: '#EDE9FE', color: '#6D28D9' }}>
                              {t.fechaInicioPlanStr} al {t.fechaFinPlanStr}
                            </span>
                          </td>
                        ) : (
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
                        )}

                        <td className="text-muted fw-semibold">{t.fechaPagoStr}</td>
                        <td>
                          <span className="badge-tag badge-plan-tag">{t.plan}</span>
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
          {currentTableList.length > ITEMS_PER_PAGE && (
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
