'use client';

import React from 'react';
import {
  DollarSign, CheckCircle, Clock, AlertTriangle, Users, CreditCard,
  Bell, RefreshCw, ArrowUpRight, TrendingUp, ChevronRight
} from 'lucide-react';
import { Client } from './ClientesTodosTab';

interface ResumenTabProps {
  totalCobradoDia: number;
  clientesActivos: number;
  clientesPorCobrarList: Client[];
  clientesVencidosList: Client[];
  clientesPorVencer1DiaList: Client[];
  clients: Client[];
  token: string;
  isSyncing: boolean;
  loadData: (token: string, sync?: boolean) => void;
  setActiveTab: (tab: string) => void;
  setCalendarSearch: (search: string) => void;
}

export default function ResumenTab({
  totalCobradoDia,
  clientesActivos,
  clientesPorCobrarList,
  clientesVencidosList,
  clientesPorVencer1DiaList,
  clients,
  token,
  isSyncing,
  loadData,
  setActiveTab,
  setCalendarSearch,
}: ResumenTabProps) {
  const normalizePlanKey = (planStr?: string) => {
    const normalized = (planStr || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/^PLAN\s+/, '')
      .trim();
    if (normalized === 'INICIAL' || normalized === 'INICIA') return 'INICIA';
    if (normalized === 'LIDER') return 'LIDER';
    return normalized;
  };

  const parseDateHelper = (raw: any): Date | null => {
    if (!raw) return null;
    const str = String(raw).split('T')[0].split(' ')[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      const [y, m, d] = str.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    const d = new Date(raw);
    return isNaN(d.getTime()) ? null : d;
  };

  const { totalDeudaAcumulada, totalDeudaVencidos, totalDeudaBloqueados, clientesBloqueadosCount, clientesVencidosCount, totalClientesImpagos } = React.useMemo(() => {
    let deudaVenc = 0;
    let deudaBloq = 0;
    let vCount = 0;
    let bCount = 0;

    (clients || []).forEach((c) => {
      const st = (c.estadoCuenta || '').toUpperCase();
      if (st !== 'VENCIDO' && st !== 'BLOQUEADO' && st !== 'SUSPENDIDO') return;

      // Para bloqueados y vencidos, fijarse en cuánto debe (montoSiguienteCobro si > 0, sino tarifa de plan)
      const deuda = c.montoSiguienteCobro && Number(c.montoSiguienteCobro) > 0
        ? Number(c.montoSiguienteCobro)
        : Number(c.montoMensual || c.precioPlan || 0);

      if (st === 'BLOQUEADO' || st === 'SUSPENDIDO') {
        bCount++;
        deudaBloq += deuda;
      } else {
        vCount++;
        deudaVenc += deuda;
      }
    });

    return {
      totalDeudaAcumulada: deudaVenc + deudaBloq,
      totalDeudaVencidos: deudaVenc,
      totalDeudaBloqueados: deudaBloq,
      clientesBloqueadosCount: bCount,
      clientesVencidosCount: vCount,
      totalClientesImpagos: vCount + bCount,
    };
  }, [clients]);

  return (
    <div className="admin-module admin-module--overview">
      {/* TailAdmin Signature KPI Stat Cards (Matches Captura 2) */}
      <div className="row g-3 g-xl-4 mb-4 admin-stat-strip">
        {/* Card 1: Ingresos del Día */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card admin-stat-card h-100">
            <div className="admin-stat-card-header">
              <span className="admin-stat-card-label">Ingresos del Día</span>
              <span className="admin-stat-card-icon admin-stat-card-icon--green">
                <DollarSign size={18} strokeWidth={2.2} />
              </span>
            </div>
            <div className="d-flex align-items-center gap-1 mb-3">
              <span className="admin-stat-card-trend">
                <ArrowUpRight size={13} /> +20%
              </span>
              <span className="admin-stat-card-trend-label">frente al mes pasado</span>
            </div>
            <div className="d-flex align-items-end justify-content-between mt-auto">
              <div className="admin-stat-card-value">S/ {totalCobradoDia.toFixed(2)}</div>
              <div className="admin-stat-card-sparkline">
                <svg width="90" height="34" viewBox="0 0 90 34" fill="none" aria-hidden="true">
                  <path d="M0 26C15 22 25 6 40 18C55 30 70 4 80 12L90 4" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />
                  <path d="M0 26C15 22 25 6 40 18C55 30 70 4 80 12L90 4V34H0V26Z" fill="url(#sparkline-green)" opacity="0.12" />
                  <defs>
                    <linearGradient id="sparkline-green" x1="45" y1="4" x2="45" y2="34" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#10B981" />
                      <stop offset="1" stopColor="#10B981" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Clientes Activos */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card admin-stat-card h-100">
            <div className="admin-stat-card-header">
              <span className="admin-stat-card-label">Clientes Activos</span>
              <span className="admin-stat-card-icon admin-stat-card-icon--blue">
                <Users size={18} strokeWidth={2.2} />
              </span>
            </div>
            <div className="d-flex align-items-center gap-1 mb-3">
              <span className="admin-stat-card-trend">
                <ArrowUpRight size={13} /> +15%
              </span>
              <span className="admin-stat-card-trend-label">frente al mes pasado</span>
            </div>
            <div className="d-flex align-items-end justify-content-between mt-auto">
              <div className="admin-stat-card-value">{clientesActivos}</div>
              <div className="admin-stat-card-sparkline">
                <svg width="90" height="34" viewBox="0 0 90 34" fill="none" aria-hidden="true">
                  <path d="M0 24C12 20 28 8 45 16C62 24 75 6 82 10L90 6" stroke="#465FFF" strokeWidth="2" strokeLinecap="round" />
                  <path d="M0 24C12 20 28 8 45 16C62 24 75 6 82 10L90 6V34H0V24Z" fill="url(#sparkline-blue)" opacity="0.12" />
                  <defs>
                    <linearGradient id="sparkline-blue" x1="45" y1="6" x2="45" y2="34" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#465FFF" />
                      <stop offset="1" stopColor="#465FFF" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Por Cobrar */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card admin-stat-card h-100">
            <div className="admin-stat-card-header">
              <span className="admin-stat-card-label">Por Cobrar</span>
              <span className="admin-stat-card-icon admin-stat-card-icon--amber">
                <CreditCard size={18} strokeWidth={2.2} />
              </span>
            </div>
            <div className="d-flex align-items-center gap-1 mb-3">
              <span className="admin-stat-card-trend" style={{ color: '#D97706' }}>
                <Clock size={13} /> Pendientes
              </span>
              <span className="admin-stat-card-trend-label">de confirmación</span>
            </div>
            <div className="d-flex align-items-end justify-content-between mt-auto">
              <div className="admin-stat-card-value">{clientesPorCobrarList.length}</div>
              <div className="admin-stat-card-sparkline">
                <svg width="90" height="34" viewBox="0 0 90 34" fill="none" aria-hidden="true">
                  <path d="M0 16C15 24 30 10 45 20C60 30 75 8 82 14L90 10" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
                  <path d="M0 16C15 24 30 10 45 20C60 30 75 8 82 14L90 10V34H0V16Z" fill="url(#sparkline-amber)" opacity="0.12" />
                  <defs>
                    <linearGradient id="sparkline-amber" x1="45" y1="10" x2="45" y2="34" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#F59E0B" />
                      <stop offset="1" stopColor="#F59E0B" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: Dinero No Cobrado (Vencidos y Bloqueados Acumulados) */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card admin-stat-card h-100">
            <div className="admin-stat-card-header">
              <span className="admin-stat-card-label">Dinero No Cobrado</span>
              <span className="admin-stat-card-icon admin-stat-card-icon--red">
                <AlertTriangle size={18} strokeWidth={2.2} />
              </span>
            </div>
            <div className="d-flex align-items-center gap-1 mb-2">
              <span className="admin-stat-card-trend admin-stat-card-trend--danger">
                <AlertTriangle size={13} /> Deuda acumulada
              </span>
              <span className="admin-stat-card-trend-label">{totalClientesImpagos} clientes con deuda</span>
            </div>
            <div className="d-flex align-items-end justify-content-between mt-auto">
              <div>
                <div className="admin-stat-card-value text-danger" style={{ fontSize: '1.45rem' }}>
                  S/ {totalDeudaAcumulada.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <span className="text-muted" style={{ fontSize: '0.72rem' }}>
                  Vencidos: S/ {totalDeudaVencidos.toFixed(2)} ({clientesVencidosCount}) · Bloqueados: S/ {totalDeudaBloqueados.toFixed(2)} ({clientesBloqueadosCount})
                </span>
              </div>
              <div className="admin-stat-card-sparkline">

                <svg width="90" height="34" viewBox="0 0 90 34" fill="none" aria-hidden="true">
                  <path d="M0 18C15 14 30 26 45 12C60 22 75 16 82 20L90 14" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
                  <path d="M0 18C15 14 30 26 45 12C60 22 75 16 82 20L90 14V34H0V18Z" fill="url(#sparkline-red)" opacity="0.12" />
                  <defs>
                    <linearGradient id="sparkline-red" x1="45" y1="12" x2="45" y2="34" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#EF4444" />
                      <stop offset="1" stopColor="#EF4444" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Paneles de Actividad */}
      <div className="row g-3 g-xl-4 admin-overview-grid">
        {/* Columna Izquierda: Clientes Activos & Por Cobrar */}
        <div className="col-12 col-xl-7">
          {/* Panel 1: Clientes Habilitados Recientes */}
          <div className="card p-4 mb-4">
            <div className="d-flex justify-content-between align-items-center mb-3 pb-3 border-bottom">
              <div>
                <h3 className="h6 fw-bold text-dark mb-1 d-flex align-items-center gap-2">
                  <Users size={18} className="text-primary" />
                  <span>Clientes Activos Recientes</span>
                </h3>
                <small className="text-muted">Últimos clientes con facturación habilitada</small>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('todos')}
                className="btn-meta-action btn-meta-action-secondary"
              >
                Ver Todos <ChevronRight size={14} />
              </button>
            </div>

            <div className="d-flex flex-column gap-2">
              {clients.filter((c) => c.estadoCuenta === 'HABILITADO').slice(0, 5).length === 0 ? (
                <div className="text-muted small py-4 text-center">No hay clientes activos registrados.</div>
              ) : (
                clients
                  .filter((c) => c.estadoCuenta === 'HABILITADO')
                  .slice(0, 5)
                  .map((c) => (
                    <div
                      key={`act-${c.id}`}
                      className="p-2.5 rounded-3 d-flex justify-content-between align-items-center border-bottom border-light"
                      style={{ transition: 'background-color 0.15s ease' }}
                    >
                      <div className="d-flex align-items-center gap-3">
                        <div
                          className="rounded-circle d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
                          style={{
                            width: '40px',
                            height: '40px',
                            backgroundColor: '#EEF4FE',
                            color: '#465FFF',
                            fontSize: '0.875rem',
                            border: '1px solid #DCE4FF',
                          }}
                        >
                          {(c.razonSocial || 'CL').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <strong className="text-dark d-block" style={{ fontSize: '0.875rem' }}>
                            {c.razonSocial}
                          </strong>
                          <span className="text-muted" style={{ fontSize: '0.775rem' }}>
                            RUC: {c.ruc} | Plan: {c.planContratado}
                          </span>
                        </div>
                      </div>
                      <span
                        className="badge rounded-pill"
                        style={{ backgroundColor: '#ECFDF5', color: '#027A48', border: '1px solid #A7F3D0' }}
                      >
                        HABILITADO
                      </span>
                    </div>
                  ))
              )}
            </div>
          </div>

          {/* Panel 2: Pendientes por Cobrar */}
          <div className="card p-4">
            <div className="d-flex justify-content-between align-items-center mb-3 pb-3 border-bottom">
              <div>
                <h3 className="h6 fw-bold text-dark mb-1 d-flex align-items-center gap-2">
                  <CreditCard size={18} className="text-warning" />
                  <span>Pendientes de Cobro</span>
                </h3>
                <small className="text-muted">Derivados de onboarding en espera de pago</small>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('cobrar')}
                className="btn-meta-action btn-meta-action-warning"
              >
                Gestionar Cobros
              </button>
            </div>

            <div className="d-flex flex-column gap-2">
              {clientesPorCobrarList.slice(0, 5).length === 0 ? (
                <div className="text-muted small py-4 text-center d-flex flex-column align-items-center justify-content-center">
                  <CreditCard size={32} className="text-muted opacity-30 mb-2" />
                  <span>No hay pendientes por cobrar en este momento.</span>
                </div>
              ) : (
                clientesPorCobrarList.slice(0, 5).map((c) => (
                  <div
                    key={`cob-${c.id}`}
                    className="p-2.5 rounded-3 d-flex justify-content-between align-items-center border-bottom border-light"
                  >
                    <div>
                      <strong className="text-dark d-block" style={{ fontSize: '0.875rem' }}>
                        {c.razonSocial}
                      </strong>
                      <span className="text-muted" style={{ fontSize: '0.775rem' }}>
                        RUC: {c.ruc} | Tel: {c.telefono || '—'}
                      </span>
                    </div>
                    <div className="text-end">
                      <strong className="d-block text-dark fw-bold" style={{ fontSize: '0.875rem' }}>
                        S/ {Number(c.montoSiguienteCobro && Number(c.montoSiguienteCobro) > 0 ? c.montoSiguienteCobro : (c.montoMensual || c.precioPlan || 0)).toFixed(2)}
                      </strong>
                      <span
                        className="badge rounded-pill mt-1"
                        style={{ backgroundColor: '#FFFBEB', color: '#B54708', border: '1px solid #FEDF89' }}
                      >
                        POR COBRAR
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Columna Derecha: Alertas & Distribución */}
        <div className="col-12 col-xl-5">
          {/* Panel 3: Alertas de Vencimiento */}
          <div className="card p-4 mb-4">
            <div className="d-flex justify-content-between align-items-center mb-3 pb-3 border-bottom">
              <div>
                <h3 className="h6 fw-bold text-dark mb-1 d-flex align-items-center gap-2">
                  <Bell size={18} className="text-danger" />
                  <span>Vencimientos Próximos</span>
                </h3>
                <small className="text-muted">Cuentas con corte de servicio en 1 día</small>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('vencidos')}
                className="btn-meta-action btn-meta-action-secondary"
              >
                Ver Vencidos
              </button>
            </div>

            <div className="d-flex flex-column gap-2.5">
              {clientesPorVencer1DiaList.length === 0 ? (
                <div className="text-center text-muted py-4 small d-flex flex-column align-items-center justify-content-center">
                  <Bell size={32} className="text-muted opacity-30 mb-2" />
                  <span>No hay alertas urgentes pendientes.</span>
                </div>
              ) : (
                clientesPorVencer1DiaList.slice(0, 5).map((c) => (
                  <div
                    key={`res-notif-${c.id}`}
                    className="p-3 border rounded-3 bg-white d-flex justify-content-between align-items-center"
                    style={{ cursor: 'pointer', transition: 'border-color 0.15s ease' }}
                    onClick={() => {
                      setCalendarSearch(c.ruc);
                      setActiveTab('todos');
                    }}
                  >
                    <div>
                      <strong className="text-dark d-block" style={{ fontSize: '0.875rem' }}>
                        {c.razonSocial}
                      </strong>
                      <span className="text-muted" style={{ fontSize: '0.775rem' }}>
                        RUC: {c.ruc} | {c.planContratado}
                      </span>
                    </div>
                    <span
                      className="badge rounded-pill"
                      style={{ backgroundColor: '#FEF2F2', color: '#B42318', border: '1px solid #FECDCA' }}
                    >
                      VENCE EN 1 DÍA
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Panel 4: Distribución por Plan */}
          <div className="card p-4">
            <div className="d-flex justify-content-between align-items-center mb-3 pb-3 border-bottom">
              <div>
                <h3 className="h6 fw-bold text-dark mb-1 d-flex align-items-center gap-2">
                  <TrendingUp size={18} className="text-primary" />
                  <span>Distribución de Clientes por Plan</span>
                </h3>
                <small className="text-muted">Total de cuentas según el plan contratado</small>
              </div>
              <button
                type="button"
                onClick={() => loadData(token, true)}
                disabled={isSyncing}
                className="btn-meta-action btn-meta-action-secondary"
                title="Sincronizar información de clientes"
              >
                <RefreshCw size={14} className={isSyncing ? 'spin-anim' : ''} />
                <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar'}</span>
              </button>
            </div>

            <div className="d-flex flex-column gap-3 pt-1">
              {[
                { key: 'INICIA', name: 'Plan Inicia', color: '#465FFF' },
                { key: 'EMPRENDE', name: 'Plan Emprende', color: '#10B981' },
                { key: 'IMPULSA', name: 'Plan Impulsa', color: '#8B5CF6' },
                { key: 'EMPRESARIAL', name: 'Plan Empresarial', color: '#0284C7' },
                { key: 'LIDER', name: 'Plan Líder', color: '#1C2434' },
              ].map((p) => {
                const count = clients.filter((c) => normalizePlanKey(c.planContratado) === p.key).length;
                const pct = clients.length > 0 ? Math.round((count / clients.length) * 100) : 0;
                return (
                  <div key={p.key}>
                    <div className="d-flex justify-content-between small mb-1.5">
                      <span className="fw-semibold text-dark">{p.name}</span>
                      <span className="text-muted fw-medium">{count} clientes ({pct}%)</span>
                    </div>
                    <div className="progress" style={{ height: '7px', borderRadius: '9999px', backgroundColor: '#F1F5F9' }}>
                      <div
                        className="progress-bar"
                        role="progressbar"
                        style={{ width: `${pct}%`, backgroundColor: p.color, borderRadius: '9999px' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
