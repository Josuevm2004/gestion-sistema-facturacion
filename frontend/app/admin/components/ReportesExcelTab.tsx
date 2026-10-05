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
import { SalesTimelineChart, PlanDoughnutChart, CommissionsBarChart } from './ReportCharts';

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
        const startD = parseLocalDateSafe(c.fechaCapacitacion || c.fechaRegistro || c.fechaCreacion);
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

        // 1. Procesar operaciones de ventas registradas
        rawOps.forEach((op) => {
          const opD = parseLocalDateSafe(op?.fechaInicioServicio || op?.fechaPago || op?.fechaOperacion);
          if (!opD) return;
          const key = monthKeyFromDate(opD);
          if (!key) return;

          const montoOperacion = Number(op?.montoPagado || op?.montoVenta || op?.montoTotal || op?.precioLista || 0) || clientMonthlyPlanPrice;
          const isAnnualOp = (op?.tipoSuscripcion || c.tipoSuscripcion || '').toUpperCase() === 'ANUAL';
          const isSegundoProrrateoOp = op?.tipoProrrateo === 'SEGUNDO_PRORRATEO' || Number(op?.diasProrrateoAdicional || 0) > 0 || (opD.getDate() >= 10 && op?.tipoProrrateo !== 'PRIMER_PRORRATEO');

          if (isAnnualOp) {
            if (!spans.some((s) => s.startKey === key)) {
              spans.push({ startKey: key, amount: montoOperacion || (clientMonthlyPlanPrice * 10), monthsCovered: 12, type: 'ANUAL' });
            }
          } else if (isSegundoProrrateoOp) {
            // El 2.° prorrateo chapa los 2 meses
            if (!spans.some((s) => s.startKey === key)) {
              spans.push({ startKey: key, amount: montoOperacion || Number(c.montoSiguienteCobro || 0) || clientMonthlyPlanPrice, monthsCovered: 2, type: 'SEGUNDO_PRORRATEO' });
            }
          } else {
            // 1.° prorrateo o mensualidad regular
            monthlySums.set(key, (monthlySums.get(key) || 0) + montoOperacion);
          }
        });

        // 2. Procesar pagos de caja
        clPayments.forEach((p) => {
          const payD = parseLocalDateSafe(p?.fechaPago || p?.fechaRegistro);
          if (!payD) return;
          const key = monthKeyFromDate(payD);
          if (!key) return;

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
            monthlySums.set(key, (monthlySums.get(key) || 0) + pAmount);
          }
        });

        // 3. Fallback inteligente directo con los datos del cliente (Garantiza que ningún cliente activo salga en blanco)
        const startD = parseLocalDateSafe(c.fechaCapacitacion || c.fechaRegistro || c.fechaCreacion);
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
                // Chapa los 2 meses (mes de inicio + siguiente mes)
                spans.push({ startKey, amount: totalSegundo, monthsCovered: 2, type: 'SEGUNDO_PRORRATEO' });
              }
            } else if (isPrimerProrrateoCli) {
              if ((monthlySums.get(startKey) || 0) === 0 && !spans.some((s) => s.startKey === startKey)) {
                const totalPrimer = Number(c.montoSiguienteCobro || c.montoProrrateado || 0) || clientMonthlyPlanPrice;
                monthlySums.set(startKey, totalPrimer);
              }
            }
          }

          // Para clientes habilitados: meses posteriores hasta fechaVencimientoMensual o mes actual
          if ((c.estadoCuenta || '').toUpperCase() === 'HABILITADO' && clientMonthlyPlanPrice > 0) {
            const vencD = parseLocalDateSafe(c.fechaVencimientoMensual);
            const endD = vencD && vencD > startD ? vencD : new Date();
            const endKey = monthKeyFromDate(endD) || currentMonthKey;
            const startIdx = monthIndexFromKey(startKey);
            const endIdx = monthIndexFromKey(endKey);

            for (let idx = startIdx; idx <= endIdx; idx += 1) {
              const y = Math.floor(idx / 12);
              const m = (idx % 12) + 1;
              const mKey = `${y}-${String(m).padStart(2, '0')}`;

              // Verificar si este mes está dentro de algún span
              const coveredBySpan = spans.some((s) => {
                const sIdx = monthIndexFromKey(s.startKey);
                return idx >= sIdx && idx < sIdx + s.monthsCovered;
              });

              if (!coveredBySpan && (monthlySums.get(mKey) || 0) === 0) {
                monthlySums.set(mKey, clientMonthlyPlanPrice);
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
    <div className="reporte-general-container admin-module admin-module--reports pb-5">
      {/* Header Principal con Icono de Sección */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4 custom-card admin-module-heading p-3.5">
        <div className="d-flex align-items-center gap-3">
          <div className="section-header-icon section-header-icon-primary">
            <FileSpreadsheet size={24} strokeWidth={2.2} />
          </div>
          <div>
            <h1 className="h5 fw-bold text-dark mb-0.5">Reporte General</h1>
            <p className="text-muted small mb-0">Reporte consolidado de ventas, recaudación y comisiones</p>
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

      {/* SECCIÓN 1: REPORTE DE VENTAS */}
      <div className="mb-5">
        <div className="d-flex align-items-center gap-2.5 mb-3">
          <div className="section-header-icon section-header-icon-primary" style={{ width: '36px', height: '36px' }}>
            <ShoppingCart size={18} strokeWidth={2.2} />
          </div>
          <div>
            <h2 className="h6 fw-bold text-dark mb-0">Reporte de Ventas</h2>
            <small className="text-muted">Métricas de facturación, ingresos y transacciones</small>
          </div>
        </div>

        {/* Filtros de ventas dentro de una tarjeta de contenido */}
        <div className="custom-card admin-report-filter-panel p-3.5 mb-4">
          <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
            <div className="d-flex align-items-center gap-2">
              <Search size={17} className="admin-report-filter-icon" />
              <strong className="admin-report-filter-title">Filtros de Ventas</strong>
            </div>
            <span className="cell-subtext">
              Filtrado dinámico en tiempo real
            </span>
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
                <option value="ALL">Todos los meses</option>
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
                <option value="ALL">Todos los estados</option>
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
                <option value="ALL">Todos los planes</option>
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
                <option value="ALL">Todos los asesores</option>
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
              <label className="form-label small fw-semibold text-muted mb-1">Tipo suscripción</label>
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
                <option value="ALL">Todos los regímenes</option>
                <option value="MYPE">MYPE Tributario</option>
                <option value="GENERAL">General</option>
                <option value="ESPECIAL">Especial / RER</option>
                <option value="RUS">Nuevo RUS</option>
              </select>
            </div>
            <div className="col-12 col-md-4 col-lg-4 d-flex gap-2">
              <button
                type="button"
                className="btn-meta-action btn-meta-action-primary flex-grow-1"
                onClick={() => setVentasPage(1)}
              >
                <Search size={14} />
                <span>Buscar</span>
              </button>
              <button
                type="button"
                className="btn-meta-action btn-meta-action-secondary"
                onClick={resetFilters}
              >
                <RotateCcw size={14} />
                <span>Limpiar</span>
              </button>
            </div>
          </div>
        </div>

        {/* 4 KPI Stat Cards Rediseñadas (Alineadas a Resumen) */}
        <div className="row g-3 mb-4 admin-stat-strip">
          <div className="col-12 col-sm-6 col-lg-3">
            <div className="custom-card admin-stat-card admin-stat-card--blue p-3.5 h-100 shadow-sm rounded-4 border bg-white">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div className="d-flex align-items-center gap-2.5">
                  <div className="section-header-icon section-header-icon-primary" style={{ width: '38px', height: '38px' }}>
                    <ShoppingCart size={18} strokeWidth={2.2} />
                  </div>
                  <span className="text-secondary small fw-bold text-uppercase" style={{ letterSpacing: '0.4px', fontSize: '0.72rem' }}>
                    Ventas Totales
                  </span>
                </div>
                <span className="badge-tag" style={{ backgroundColor: '#EEF2FF', color: '#465FFF' }}>
                  Total
                </span>
              </div>
              <div className="fs-4 fw-bolder text-dark mb-1 mt-2" style={{ letterSpacing: '-0.5px' }}>
                S/ {totalVentas.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <small className="text-muted d-block fw-semibold" style={{ fontSize: '0.78rem' }}>
                {totalVentasCount} ventas registradas
              </small>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <div className="custom-card admin-stat-card admin-stat-card--green p-3.5 h-100 shadow-sm rounded-4 border bg-white">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div className="d-flex align-items-center gap-2.5">
                  <div className="section-header-icon section-header-icon-success" style={{ width: '38px', height: '38px' }}>
                    <DollarSign size={18} strokeWidth={2.2} />
                  </div>
                  <span className="text-secondary small fw-bold text-uppercase" style={{ letterSpacing: '0.4px', fontSize: '0.72rem' }}>
                    Ingresos Cobrados
                  </span>
                </div>
                <span className="badge-tag" style={{ backgroundColor: '#ECFDF5', color: '#065F46' }}>
                  Cobrado
                </span>
              </div>
              <div className="fs-4 fw-bolder text-dark mb-1 mt-2" style={{ letterSpacing: '-0.5px' }}>
                S/ {totalIngresos.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <small className="text-muted d-block fw-semibold" style={{ fontSize: '0.78rem' }}>
                Monto efectivamente recaudado
              </small>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <div className="custom-card admin-stat-card admin-stat-card--red p-3.5 h-100 shadow-sm rounded-4 border bg-white">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div className="d-flex align-items-center gap-2.5">
                  <div className="section-header-icon section-header-icon-danger" style={{ width: '38px', height: '38px' }}>
                    <AlertCircle size={18} strokeWidth={2.2} />
                  </div>
                  <span className="text-secondary small fw-bold text-uppercase" style={{ letterSpacing: '0.4px', fontSize: '0.72rem' }}>
                    Por Cobrar
                  </span>
                </div>
                <span className="badge-tag" style={{ backgroundColor: '#FEF2F2', color: '#B91C1C' }}>
                  Pendiente
                </span>
              </div>
              <div className="fs-4 fw-bolder text-danger mb-1 mt-2" style={{ letterSpacing: '-0.5px' }}>
                S/ {totalPendiente.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <small className="text-muted d-block fw-semibold" style={{ fontSize: '0.78rem' }}>
                {totalPendienteCount} transacciones pendientes
              </small>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <div className="custom-card admin-stat-card admin-stat-card--violet p-3.5 h-100 shadow-sm rounded-4 border bg-white">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div className="d-flex align-items-center gap-2.5">
                  <div className="section-header-icon section-header-icon-indigo" style={{ width: '38px', height: '38px' }}>
                    <Ticket size={18} strokeWidth={2.2} />
                  </div>
                  <span className="text-secondary small fw-bold text-uppercase" style={{ letterSpacing: '0.4px', fontSize: '0.72rem' }}>
                    Ticket Promedio
                  </span>
                </div>
                <span className="badge-tag" style={{ backgroundColor: '#EDE9FE', color: '#6D28D9' }}>
                  Promedio
                </span>
              </div>
              <div className="fs-4 fw-bolder text-dark mb-1 mt-2" style={{ letterSpacing: '-0.5px' }}>
                S/ {ticketPromedio.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <small className="text-muted d-block fw-semibold" style={{ fontSize: '0.78rem' }}>
                Monto medio por operación
              </small>
            </div>
          </div>
        </div>

        {/* Gráficos con Chart.js: Evolución Temporal Interactiva + Donut por Plan */}
        <div className="row g-3 mb-4">
          {/* Gráfico 1: Área y Tendencia de Ventas e Ingresos con Chart.js */}
          <div className="col-12 col-lg-7">
            <div className="custom-card admin-chart-card p-4 h-100 d-flex flex-column justify-content-between">
              <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2 mb-3 pb-2 border-bottom">
                <div>
                  <strong className="text-dark fw-bold d-block" style={{ fontSize: '0.92rem' }}>
                    Evolución de Facturación y Cobranza
                  </strong>
                  <small className="text-muted" style={{ fontSize: '0.74rem' }}>
                    Comparativa de ventas generadas vs recaudación efectiva en Soles (S/)
                  </small>
                </div>
                <div className="d-flex align-items-center gap-2 flex-wrap">
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

              {/* Componente Gráfico Chart.js interactivo con Tooltips */}
              <SalesTimelineChart data={timelineData} />

              {/* Resumen Humano Explicativo al pie del gráfico */}
              <div className="d-flex flex-wrap justify-content-between align-items-center pt-2.5 mt-2 border-top gap-2" style={{ fontSize: '0.75rem' }}>
                <span className="text-muted fw-semibold">
                  Efectividad de Cobro:{' '}
                  <strong className="text-success fw-bold">
                    {totalVentas > 0 ? `${((totalIngresos / totalVentas) * 100).toFixed(1)}%` : '100%'}
                  </strong>
                </span>
                <span className="text-muted fw-semibold">
                  Ticket Promedio:{' '}
                  <strong className="text-dark fw-bold">S/ {ticketPromedio.toFixed(2)}</strong>
                </span>
                <span className="text-muted fw-semibold">
                  Transacciones:{' '}
                  <strong className="text-primary fw-bold">{filteredTransactions.length} operaciones</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Gráfico 2: Donut Radial con Chart.js + Desglose por Plan */}
          <div className="col-12 col-lg-5">
            <div className="custom-card admin-chart-card p-4 h-100 d-flex flex-column justify-content-between">
              <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                <div>
                  <strong className="text-dark fw-bold d-block" style={{ fontSize: '0.92rem' }}>
                    Distribución por Plan
                  </strong>
                  <small className="text-muted" style={{ fontSize: '0.74rem' }}>
                    Proporción de ingresos generados por cada paquete
                  </small>
                </div>
                <span className="badge-tag badge-plan-tag">
                  {planDistribution.length} planes
                </span>
              </div>

              <div className="row align-items-center g-3 flex-grow-1">
                {/* Donut Chart.js con Centro Métrico */}
                <div className="col-5 d-flex justify-content-center">
                  <PlanDoughnutChart data={planDistribution} totalVentas={totalVentas} />
                </div>

                {/* Desglose con barras y badges estructurados */}
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
                      <div className="text-muted small py-2 text-center">Sin ventas de planes</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabla: Detalle de Ventas */}
        <div className="custom-card admin-report-table-card p-3.5">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <strong className="small text-dark fw-bold">Detalle de ventas</strong>
            <small className="text-muted fw-semibold">
              Mostrando {displayedVentas.length} de {filteredTransactions.length} registros
            </small>
          </div>

          <div className="table-card-meta mb-3">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 table-meta">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Cliente</th>
                  <th>RUC</th>
                  <th>Plan</th>
                  <th>Vendedor</th>
                  <th>Monto</th>
                  <th>Método de pago</th>
                  <th className="text-end">Estado</th>
                </tr>
              </thead>
              <tbody>
                {displayedVentas.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center text-muted py-5 fw-semibold">
                      No se encontraron ventas con los filtros aplicados.
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
                      <td className="text-dark fw-semibold">{t.vendedor}</td>
                      <td>
                        <span className="cell-amount text-dark">S/ {t.monto.toFixed(2)}</span>
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
        <div className="d-flex align-items-center gap-2 mb-3">
          <div className="section-header-icon section-header-icon-indigo">
            <Coins size={18} strokeWidth={2.2} />
          </div>
          <div>
            <h2 className="fs-6 fw-bold text-dark mb-0">Mis comisiones por venta de sistema</h2>
            <p className="text-muted small mb-0">Liquidación y balance de comisiones por altas y activaciones de clientes</p>
          </div>
        </div>

        {/* 4 KPI Stat Cards Comisiones */}
        <div className="row g-3 mb-4 admin-commission-stat-strip">
          <div className="col-12 col-sm-6 col-lg-3">
            <div className="custom-card p-3.5 h-100 d-flex flex-column justify-content-between">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div className="section-header-icon section-header-icon-primary">
                  <Coins size={18} strokeWidth={2.2} />
                </div>
                <span className="badge-tag">Total</span>
              </div>
              <div>
                <span className="text-muted fw-semibold small d-block mb-1">Comisión acumulada</span>
                <strong className="fs-4 text-primary fw-bolder d-block" style={{ lineHeight: '1.2' }}>
                  S/ {comisionAcumulada.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </strong>
                <small className="text-muted" style={{ fontSize: '0.75rem' }}>{totalAltasCount} afiliaciones registradas</small>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <div className="custom-card p-3.5 h-100 d-flex flex-column justify-content-between">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div className="section-header-icon section-header-icon-success">
                  <TrendingUp size={18} strokeWidth={2.2} />
                </div>
                <span className="badge-tag">Altas</span>
              </div>
              <div>
                <span className="text-muted fw-semibold small d-block mb-1">Ventas realizadas</span>
                <strong className="fs-4 text-dark fw-bolder d-block" style={{ lineHeight: '1.2' }}>
                  {totalAltasCount}
                </strong>
                <small className="text-muted" style={{ fontSize: '0.75rem' }}>Afiliaciones de sistema</small>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <div className="custom-card p-3.5 h-100 d-flex flex-column justify-content-between">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div className="section-header-icon section-header-icon-indigo">
                  <Percent size={18} strokeWidth={2.2} />
                </div>
                <span className="badge-tag">Por alta</span>
              </div>
              <div>
                <span className="text-muted fw-semibold small d-block mb-1">Tasa de comisión</span>
                <strong className="fs-4 text-dark fw-bolder d-block" style={{ lineHeight: '1.2' }}>
                  S/ {TASA_COMISION_ALTA.toFixed(2)}
                </strong>
                <small className="text-muted" style={{ fontSize: '0.75rem' }}>Comisión fija por cliente</small>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <div className="custom-card p-3.5 h-100 d-flex flex-column justify-content-between">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div className="section-header-icon section-header-icon-warning">
                  <Clock size={18} strokeWidth={2.2} />
                </div>
                <span className="badge-tag" style={{ color: '#D97706', borderColor: '#FDE68A', backgroundColor: '#FFFBEB' }}>
                  {altasPendientesCount} pendientes
                </span>
              </div>
              <div>
                <span className="text-muted fw-semibold small d-block mb-1">Pendiente de pago</span>
                <strong className="fs-4 fw-bolder d-block" style={{ lineHeight: '1.2', color: '#D97706' }}>
                  S/ {comisionPendiente.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </strong>
                <small className="text-muted" style={{ fontSize: '0.75rem' }}>Por conciliar y liquidar</small>
              </div>
            </div>
          </div>
        </div>

        {/* Gráfico Comisiones por Mes + Detalle de Comisiones */}
        <div className="row g-3">
          {/* Gráfico de Barras Comisiones Moderno */}
          <div className="col-12 col-lg-5">
            <div className="custom-card p-3.5 h-100 d-flex flex-column justify-content-between">
              <div>
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <strong className="small text-dark fw-bold">Comisiones por mes</strong>
                  <span className="badge-tag" style={{ color: '#465FFF', borderColor: '#BFDBFE', backgroundColor: '#EFF6FF' }}>
                    S/ {comisionAcumulada.toFixed(2)} acumulado
                  </span>
                </div>
                <p className="text-muted small mb-3" style={{ fontSize: '0.75rem' }}>Rendimiento mensual de comisiones ganadas</p>

                {/* Gráfico interactivo con Chart.js */}
                <div className="pt-2 pb-1">
                  <CommissionsBarChart data={monthlyCommissions} />
                </div>
              </div>

              {/* Pie con métricas clave */}
              <div className="d-flex justify-content-between align-items-center pt-2.5 mt-2 border-top" style={{ fontSize: '0.74rem' }}>
                <span className="text-muted fw-semibold">
                  Promedio: <strong className="text-dark">S/ {(comisionAcumulada / Math.max(monthlyCommissions.filter(m => m.comision > 0).length, 1)).toFixed(1)}/mes</strong>
                </span>
                <span className="text-muted fw-semibold">
                  Pico máx: <strong className="text-primary">S/ {Math.max(...monthlyCommissions.map(m => m.comision), 0).toFixed(0)}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Tabla: Detalle de Comisiones */}
          <div className="col-12 col-lg-7">
            <div className="custom-card admin-report-table-card p-3.5 h-100 d-flex flex-column justify-content-between">
              <div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <strong className="small text-dark fw-bold">Detalle de comisiones</strong>
                  <small className="text-muted fw-semibold">
                    Mostrando {displayedComisiones.length} de {altasTransactions.length} afiliaciones
                  </small>
                </div>

                <div className="table-card-meta mb-3">
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0 table-meta">
                      <thead>
                        <tr>
                          <th>Fecha</th>
                          <th>Cliente</th>
                          <th>Plan</th>
                          <th>Monto venta</th>
                          <th>% Comisión</th>
                          <th>Comisión</th>
                          <th className="text-end">Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayedComisiones.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="text-center text-muted py-5 fw-semibold">
                              No se encontraron afiliaciones en el periodo filtrado.
                            </td>
                          </tr>
                        ) : (
                          displayedComisiones.map((t) => (
                            <tr key={t.id}>
                              <td className="text-muted fw-semibold">
                                {t.fechaObj.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                              </td>
                              <td>
                                <span className="cell-title">{t.cliente}</span>
                              </td>
                              <td>
                                <span className="badge-tag badge-plan-tag">{t.plan}</span>
                              </td>
                              <td>
                                <span className="cell-amount text-dark">S/ {t.monto.toFixed(2)}</span>
                              </td>
                              <td className="text-muted fw-semibold">Fija / ALTA</td>
                              <td>
                                <span className="cell-amount text-primary">S/ {TASA_COMISION_ALTA.toFixed(2)}</span>
                              </td>
                              <td className="text-end">
                                <span
                                  className={`badge-fb ${
                                    t.estado === 'PAGADO' ? 'badge-fb-success' : 'badge-fb-primary'
                                  }`}
                                >
                                  <span
                                    className={`badge-dot ${
                                      t.estado === 'PAGADO' ? 'badge-dot-success' : 'badge-dot-info'
                                    }`}
                                  />
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
