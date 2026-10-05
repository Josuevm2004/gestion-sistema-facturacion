'use client';

import React, { useMemo, useState } from 'react';
import {
  Coins,
  DollarSign,
  Clock,
  Users,
  TrendingUp,
  FileSpreadsheet,
  Search,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Award,
} from 'lucide-react';
import { Client } from './ClientesTodosTab';
import { CommissionsBarChart } from './ReportCharts';
import PaginationControls from './PaginationControls';

interface ComisionesTabProps {
  clients?: Client[];
  payments?: any[];
  uniqueSellers?: string[];
  currentUser?: any;
  token?: string | null;
}

export default function ComisionesTab({
  clients = [],
  payments = [],
  uniqueSellers = [],
  currentUser,
}: ComisionesTabProps) {
  const safeClients = useMemo(() => (Array.isArray(clients) ? clients : []), [clients]);
  const safePayments = useMemo(() => (Array.isArray(payments) ? payments : []), [payments]);

  // Si el usuario logueado es vendedor, se filtra inicialmente por su nombre
  const defaultSeller = currentUser?.rol === 'VENDEDOR' ? (currentUser?.nombre || currentUser?.username || 'ALL') : 'ALL';
  const [selectedSeller, setSelectedSeller] = useState<string>(defaultSeller);
  const [selectedMes, setSelectedMes] = useState<string>('ALL');
  const [selectedEstado, setSelectedEstado] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 15;

  const TASA_COMISION = 9.0; // S/ 9.00 fijado por regla de negocio

  // Helper para parsear fecha local
  const parseDateSafe = (val: any): Date | null => {
    if (!val) return null;
    if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
    const str = String(val).trim();
    if (!str) return null;
    const dateOnly = str.split('T')[0].split(' ')[0].replace(/Z$/i, '');
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
      const [y, m, d] = dateOnly.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  };

  // Construir registros comisionables (exclusivamente por ALTA / AFILIACIÓN de clientes)
  const allCommissionItems = useMemo(() => {
    const list: Array<{
      id: string;
      cliente: string;
      ruc: string;
      vendedor: string;
      plan: string;
      tipoSuscripcion: string;
      fechaAlta: Date;
      fechaStr: string;
      montoVenta: number;
      estadoPago: 'PAGADO' | 'PENDIENTE';
      comision: number;
      mesKey: string;
      mesNombre: string;
    }> = [];

    const MES_NOMBRES = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Setiembre', 'Octubre', 'Noviembre', 'Diciembre',
    ];

    // Mapear pagos de tipo ALTA existentes
    const paymentAltas = safePayments.filter((p) => {
      const tipo = String(p?.tipoVenta || p?.venta?.tipoVenta || '').toUpperCase();
      return tipo === 'ALTA';
    });

    const seenRucs = new Set<string>();

    paymentAltas.forEach((p, idx) => {
      const ruc = p?.clienteRuc || p?.venta?.cliente?.ruc || '—';
      const fechaRaw = p?.fechaPago || p?.fechaRegistro || p?.venta?.fechaVenta;
      const d = parseDateSafe(fechaRaw) || new Date();
      const estadoPago = (p?.estadoPago || p?.venta?.estadoVenta || '').toUpperCase() === 'PAGADO' ? 'PAGADO' : 'PENDIENTE';
      const vendedor = p?.vendedorNombre || p?.venta?.vendedor?.nombre || p?.venta?.vendedor?.username || 'Sin Asignar';
      const plan = p?.planNombre || p?.venta?.suscripcion?.plan?.nombrePlan || 'Plan Inicia';
      const tipoSub = (p?.tipoSuscripcion || p?.venta?.suscripcion?.tipoSuscripcion || 'MENSUAL').toUpperCase();
      const monto = Number(p?.monto || p?.venta?.montoTotal || 19);

      if (ruc && ruc !== '—') seenRucs.add(ruc);

      const mIdx = d.getMonth();
      const y = d.getFullYear();
      const mesKey = `${y}-${String(mIdx + 1).padStart(2, '0')}`;

      list.push({
        id: `com-pay-${p?.id || idx}`,
        cliente: p?.clienteRazonSocial || p?.venta?.cliente?.razonSocial || 'Cliente General',
        ruc,
        vendedor,
        plan,
        tipoSuscripcion: tipoSub,
        fechaAlta: d,
        fechaStr: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`,
        montoVenta: monto,
        estadoPago,
        comision: TASA_COMISION,
        mesKey,
        mesNombre: `${MES_NOMBRES[mIdx]} ${y}`,
      });
    });

    // Incorporar clientes cuyo registro es un ALTA pero que aún no tienen pago confirmado en safePayments
    safeClients.forEach((c, idx) => {
      if (!seenRucs.has(c.ruc)) {
        seenRucs.add(c.ruc);
        const d = parseDateSafe(c.fechaRegistro || c.fechaCreacion) || new Date();
        const mIdx = d.getMonth();
        const y = d.getFullYear();
        const mesKey = `${y}-${String(mIdx + 1).padStart(2, '0')}`;
        const isPaid = (c.estadoCuenta || '').toUpperCase() === 'HABILITADO';

        list.push({
          id: `com-cli-${c.id || idx}`,
          cliente: c.razonSocial || 'Cliente General',
          ruc: c.ruc || '—',
          vendedor: c.vendedor || 'Sin Asignar',
          plan: c.planContratado || 'Plan Inicia',
          tipoSuscripcion: (c.tipoSuscripcion || 'MENSUAL').toUpperCase(),
          fechaAlta: d,
          fechaStr: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`,
          montoVenta: Number(c.montoSiguienteCobro || c.montoMensual || 19),
          estadoPago: isPaid ? 'PAGADO' : 'PENDIENTE',
          comision: TASA_COMISION,
          mesKey,
          mesNombre: `${MES_NOMBRES[mIdx]} ${y}`,
        });
      }
    });

    return list.sort((a, b) => b.fechaAlta.getTime() - a.fechaAlta.getTime());
  }, [safeClients, safePayments]);

  // Lista de meses disponibles para el selector
  const availableMonths = useMemo(() => {
    const map = new Map<string, string>();
    allCommissionItems.forEach((item) => {
      if (!map.has(item.mesKey)) {
        map.set(item.mesKey, item.mesNombre);
      }
    });
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [allCommissionItems]);

  // Filtrado de comisiones
  const filteredCommissions = useMemo(() => {
    return allCommissionItems.filter((item) => {
      if (selectedSeller !== 'ALL' && item.vendedor !== selectedSeller) {
        return false;
      }
      if (selectedMes !== 'ALL' && item.mesKey !== selectedMes) {
        return false;
      }
      if (selectedEstado !== 'ALL' && item.estadoPago !== selectedEstado) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!item.cliente.toLowerCase().includes(q) && !item.ruc.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [allCommissionItems, selectedSeller, selectedMes, selectedEstado, searchQuery]);

  // Métricas agregadas
  const metrics = useMemo(() => {
    const cobradas = filteredCommissions.filter((c) => c.estadoPago === 'PAGADO');
    const pendientes = filteredCommissions.filter((c) => c.estadoPago === 'PENDIENTE');

    const totalCobrado = cobradas.reduce((sum, c) => sum + c.comision, 0);
    const totalPendiente = pendientes.reduce((sum, c) => sum + c.comision, 0);
    const totalAltas = filteredCommissions.length;

    // Calcular vendedor top
    const sellerCounts = new Map<string, number>();
    cobradas.forEach((c) => {
      sellerCounts.set(c.vendedor, (sellerCounts.get(c.vendedor) || 0) + 1);
    });
    let topSeller = '—';
    let maxCount = 0;
    sellerCounts.forEach((count, s) => {
      if (count > maxCount && s !== 'Sin Asignar' && s !== 'Por asignar') {
        maxCount = count;
        topSeller = s;
      }
    });

    return {
      totalCobrado,
      totalPendiente,
      totalAltas,
      countCobradas: cobradas.length,
      countPendientes: pendientes.length,
      topSeller,
      topSellerCount: maxCount,
    };
  }, [filteredCommissions]);

  // Datos para gráfico mensual de comisiones
  const monthlyChartData = useMemo(() => {
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic'];
    const counts = new Array(12).fill(0);

    filteredCommissions
      .filter((c) => c.estadoPago === 'PAGADO')
      .forEach((c) => {
        const m = c.fechaAlta.getMonth();
        counts[m] += c.comision;
      });

    return monthNames.map((name, idx) => ({
      month: name,
      comision: counts[idx],
    }));
  }, [filteredCommissions]);

  // Paginación
  const totalPages = Math.max(1, Math.ceil(filteredCommissions.length / pageSize));
  const paginatedCommissions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCommissions.slice(start, start + pageSize);
  }, [filteredCommissions, currentPage, pageSize]);

  // Exportar comisiones a Excel/CSV
  const handleExportComisiones = () => {
    const headers = [
      'N°',
      'Cliente / Empresa',
      'RUC',
      'Asesor Comercial',
      'Plan Contratado',
      'Tipo Suscripción',
      'Fecha Alta',
      'Monto Venta (S/)',
      'Estado Cobranza',
      'Tasa Comisión (S/)',
      'Comisión Ganada (S/)',
      'Estado Comisión',
    ];

    const rows = filteredCommissions.map((c, idx) => [
      idx + 1,
      `"${c.cliente.replace(/"/g, '""')}"`,
      `"${c.ruc}"`,
      `"${c.vendedor}"`,
      `"${c.plan}"`,
      `"${c.tipoSuscripcion}"`,
      `"${c.fechaStr}"`,
      c.montoVenta.toFixed(2),
      `"${c.estadoPago}"`,
      c.comision.toFixed(2),
      c.comision.toFixed(2),
      `"${c.estadoPago === 'PAGADO' ? 'LIBERADA' : 'EN ESPERA'}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Reporte_Comisiones_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const resetFilters = () => {
    setSelectedSeller('ALL');
    setSelectedMes('ALL');
    setSelectedEstado('ALL');
    setSearchQuery('');
    setCurrentPage(1);
  };

  return (
    <div className="admin-module admin-module--comisiones">
      {/* Header del módulo */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-4">
        <div>
          <h2 className="h4 fw-bold text-dark mb-1 d-flex align-items-center gap-2">
            <Coins size={24} className="text-primary" />
            <span>Mis Comisiones y Rendimiento Comercial</span>
          </h2>
          <p className="text-muted small mb-0">
            Seguimiento oficial de comisiones generadas por altas y nuevas afiliaciones (S/ {TASA_COMISION.toFixed(2)} por cliente).
          </p>
        </div>
        <button
          type="button"
          onClick={handleExportComisiones}
          className="btn-meta-action btn-meta-action-success shadow-xs d-inline-flex align-items-center gap-2"
        >
          <FileSpreadsheet size={16} />
          <span>Exportar Comisiones</span>
        </button>
      </div>

      {/* KPI Stat Cards (TailAdmin Signature Aesthetic) */}
      <div className="row g-3 g-xl-4 mb-4 admin-stat-strip">
        {/* Card 1: Comisiones Cobradas */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card admin-stat-card h-100">
            <div className="admin-stat-card-header">
              <span className="admin-stat-card-label">Comisiones Ganadas</span>
              <span className="admin-stat-card-icon admin-stat-card-icon--green">
                <DollarSign size={18} strokeWidth={2.2} />
              </span>
            </div>
            <div className="d-flex align-items-center gap-1 mb-2">
              <span className="admin-stat-card-trend">
                <CheckCircle2 size={13} /> {metrics.countCobradas} cobradas
              </span>
              <span className="admin-stat-card-trend-label">fondos liberados</span>
            </div>
            <div className="d-flex align-items-end justify-content-between mt-auto">
              <div className="admin-stat-card-value text-success">
                S/ {metrics.totalCobrado.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Comisiones en Espera */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card admin-stat-card h-100">
            <div className="admin-stat-card-header">
              <span className="admin-stat-card-label">Comisiones en Espera</span>
              <span className="admin-stat-card-icon admin-stat-card-icon--amber">
                <Clock size={18} strokeWidth={2.2} />
              </span>
            </div>
            <div className="d-flex align-items-center gap-1 mb-2">
              <span className="admin-stat-card-trend" style={{ color: '#D97706' }}>
                <Clock size={13} /> {metrics.countPendientes} por cobrar
              </span>
              <span className="admin-stat-card-trend-label">pendientes de pago</span>
            </div>
            <div className="d-flex align-items-end justify-content-between mt-auto">
              <div className="admin-stat-card-value" style={{ color: '#D97706' }}>
                S/ {metrics.totalPendiente.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Total Altas Afiliadas */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card admin-stat-card h-100">
            <div className="admin-stat-card-header">
              <span className="admin-stat-card-label">Total Afiliaciones</span>
              <span className="admin-stat-card-icon admin-stat-card-icon--blue">
                <Users size={18} strokeWidth={2.2} />
              </span>
            </div>
            <div className="d-flex align-items-center gap-1 mb-2">
              <span className="admin-stat-card-trend">
                <TrendingUp size={13} /> S/ {TASA_COMISION.toFixed(2)} / alta
              </span>
              <span className="admin-stat-card-trend-label">tasa fija asignada</span>
            </div>
            <div className="d-flex align-items-end justify-content-between mt-auto">
              <div className="admin-stat-card-value">
                {metrics.totalAltas}
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: Asesor Destacado */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card admin-stat-card h-100">
            <div className="admin-stat-card-header">
              <span className="admin-stat-card-label">Asesor Líder</span>
              <span className="admin-stat-card-icon" style={{ backgroundColor: '#F3E8FF', color: '#8B5CF6' }}>
                <Award size={18} strokeWidth={2.2} />
              </span>
            </div>
            <div className="d-flex align-items-center gap-1 mb-2">
              <span className="admin-stat-card-trend" style={{ color: '#8B5CF6' }}>
                <Award size={13} /> {metrics.topSellerCount} altas confirmadas
              </span>
            </div>
            <div className="d-flex align-items-end justify-content-between mt-auto">
              <div className="admin-stat-card-value text-truncate" style={{ fontSize: '1.25rem' }}>
                {metrics.topSeller}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico y Regla Informativa */}
      <div className="row g-3 g-xl-4 mb-4">
        <div className="col-12 col-lg-8">
          <div className="card p-4 h-100 shadow-sm border">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h5 className="h6 fw-bold text-dark mb-0">Evolución de Comisiones Ganadas</h5>
                <small className="text-muted">Distribución mensual de comisiones cobradas efectivamente</small>
              </div>
            </div>
            <CommissionsBarChart data={monthlyChartData} />
          </div>
        </div>

        <div className="col-12 col-lg-4">
          <div className="card p-4 h-100 shadow-sm border bg-white">
            <h5 className="h6 fw-bold text-dark mb-3 d-flex align-items-center gap-2">
              <Award size={18} className="text-primary" />
              <span>Regla de Comisión</span>
            </h5>
            <div className="p-3 rounded-3 mb-3" style={{ backgroundColor: '#EEF4FE', border: '1px solid #DCE4FF' }}>
              <span className="d-block fw-bold text-primary mb-1">S/ {TASA_COMISION.toFixed(2)} por Nueva Alta</span>
              <p className="text-muted small mb-0">
                La comisión se genera automáticamente al registrar un nuevo cliente con tipo de venta <strong>ALTA</strong>.
              </p>
            </div>
            <ul className="small text-muted ps-3 mb-0 d-flex flex-column gap-2">
              <li>
                <strong>Comisión Liberada:</strong> Se confirma cuando el cliente realiza el abono del servicio.
              </li>
              <li>
                <strong>Comisión en Espera:</strong> Clientes en estado Por Cobrar hasta que registren su comprobante.
              </li>
              <li>
                Las renovaciones mensuales recurrentes no descuentan comisión de afiliación.
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="card p-3 mb-4 shadow-sm border bg-white">
        <div className="row g-2 align-items-center">
          {/* Buscador */}
          <div className="col-12 col-md-4">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-transparent border-end-0">
                <Search size={14} className="text-muted" />
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Buscar cliente o RUC..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>

          {/* Filtro Vendedor */}
          <div className="col-6 col-md-3">
            <select
              className="form-select form-select-sm"
              value={selectedSeller}
              onChange={(e) => {
                setSelectedSeller(e.target.value);
                setCurrentPage(1);
              }}
              disabled={currentUser?.rol === 'VENDEDOR'}
            >
              <option value="ALL">Todos los asesores</option>
              {uniqueSellers.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro Mes de Facturación */}
          <div className="col-6 col-md-3">
            <select
              className="form-select form-select-sm"
              value={selectedMes}
              onChange={(e) => {
                setSelectedMes(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="ALL">Todos los meses</option>
              {availableMonths.map(([key, name]) => (
                <option key={key} value={key}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro Estado */}
          <div className="col-6 col-md-2">
            <select
              className="form-select form-select-sm"
              value={selectedEstado}
              onChange={(e) => {
                setSelectedEstado(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="ALL">Todos los estados</option>
              <option value="PAGADO">Cobrado / Liberado</option>
              <option value="PENDIENTE">Por Cobrar</option>
            </select>
          </div>
        </div>

        {(selectedSeller !== 'ALL' || selectedMes !== 'ALL' || selectedEstado !== 'ALL' || searchQuery) && (
          <div className="d-flex justify-content-end mt-2 pt-2 border-top">
            <button
              type="button"
              onClick={resetFilters}
              className="btn btn-sm btn-link text-muted p-0 text-decoration-none d-flex align-items-center gap-1"
            >
              <RotateCcw size={12} />
              <span>Limpiar filtros</span>
            </button>
          </div>
        )}
      </div>

      {/* Tabla de Comisiones Detalladas */}
      <div className="card shadow-sm border bg-white overflow-hidden mb-4">
        <div className="card-header bg-white px-4 py-3 d-flex justify-content-between align-items-center border-bottom">
          <div>
            <h6 className="fw-bold text-dark mb-0">Detalle de Comisiones ({filteredCommissions.length})</h6>
            <small className="text-muted">Registro individual por cada afiliación y venta inicial</small>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0 table-meta">
            <thead>
              <tr>
                <th>#</th>
                <th>Cliente / Razón Social</th>
                <th>RUC</th>
                <th>Asesor Comercial</th>
                <th>Plan</th>
                <th>Fecha de Alta</th>
                <th>Monto Plan</th>
                <th>Estado Cobro</th>
                <th className="text-end">Comisión Ganada</th>
              </tr>
            </thead>
            <tbody>
              {paginatedCommissions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center text-muted py-4 fw-semibold">
                    No se encontraron comisiones con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                paginatedCommissions.map((c, idx) => (
                  <tr key={c.id}>
                    <td className="text-muted fw-semibold">{(currentPage - 1) * pageSize + idx + 1}</td>
                    <td>
                      <span className="cell-title d-block">{c.cliente}</span>
                    </td>
                    <td>
                      <span className="cell-title font-monospace">{c.ruc}</span>
                    </td>
                    <td>
                      <span className="badge-seller-chip">{c.vendedor}</span>
                    </td>
                    <td>
                      <span className="badge-tag badge-plan-tag">{c.plan}</span>
                    </td>
                    <td>
                      <span className="cell-subtext">{c.fechaStr}</span>
                    </td>
                    <td>
                      <span className="cell-amount text-dark">S/ {c.montoVenta.toFixed(2)}</span>
                    </td>
                    <td>
                      {c.estadoPago === 'PAGADO' ? (
                        <span className="badge-fb badge-fb-success">
                          <span className="badge-dot badge-dot-success" />
                          Cobrado
                        </span>
                      ) : (
                        <span className="badge-fb badge-fb-warning">
                          <span className="badge-dot badge-dot-warning" />
                          Por Cobrar
                        </span>
                      )}
                    </td>
                    <td className="text-end">
                      <div className="d-flex flex-column align-items-end">
                        <strong className={`fs-6 ${c.estadoPago === 'PAGADO' ? 'text-success' : 'text-muted'}`}>
                          S/ {c.comision.toFixed(2)}
                        </strong>
                        <span style={{ fontSize: '0.7rem' }} className={c.estadoPago === 'PAGADO' ? 'text-success' : 'text-warning'}>
                          {c.estadoPago === 'PAGADO' ? 'Liberada' : 'En espera'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="card-footer bg-white px-4 py-3 border-top d-flex justify-content-between align-items-center">
            <span className="small text-muted">
              Mostrando {Math.min(filteredCommissions.length, (currentPage - 1) * pageSize + 1)} a{' '}
              {Math.min(filteredCommissions.length, currentPage * pageSize)} de {filteredCommissions.length} comisiones
            </span>
            <PaginationControls
              currentPage={currentPage}
              totalItems={filteredCommissions.length}
              pageSize={pageSize}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
