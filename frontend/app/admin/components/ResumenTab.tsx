'use client';

import React from 'react';
import { DollarSign, CheckCircle, Clock, AlertTriangle, Users, CreditCard, Bell, RefreshCw } from 'lucide-react';
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

  return (
    <div>
      {/* Tarjetas de Métricas Ejecutivas (Meta UI Style) */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="custom-card p-3.5 h-100 shadow-sm rounded-4 border bg-white">
            <div className="d-flex justify-content-between align-items-start mb-2">
              <div className="d-flex align-items-center gap-2.5">
                <div className="section-header-icon section-header-icon-primary">
                  <DollarSign size={20} strokeWidth={2.2} />
                </div>
                <span className="text-secondary small fw-bold text-uppercase" style={{ letterSpacing: '0.4px', fontSize: '0.74rem' }}>
                  Ingresos del Día
                </span>
              </div>
              <span className="badge-tag" style={{ backgroundColor: '#E7F3FF', color: '#0866FF' }}>
                Ventas
              </span>
            </div>
            <div className="fs-3 fw-bolder text-dark mb-1 mt-2" style={{ letterSpacing: '-0.5px' }}>S/ {totalCobradoDia.toFixed(2)}</div>
            <small className="text-muted d-block fw-semibold" style={{ fontSize: '0.78rem' }}>Ventas confirmadas al día de hoy</small>
          </div>
        </div>

        <div className="col-md-3">
          <div className="custom-card p-3.5 h-100 shadow-sm rounded-4 border bg-white">
            <div className="d-flex justify-content-between align-items-start mb-2">
              <div className="d-flex align-items-center gap-2.5">
                <div className="section-header-icon section-header-icon-success">
                  <CheckCircle size={20} strokeWidth={2.2} />
                </div>
                <span className="text-secondary small fw-bold text-uppercase" style={{ letterSpacing: '0.4px', fontSize: '0.74rem' }}>
                  Clientes Activos
                </span>
              </div>
              <span className="badge-tag" style={{ backgroundColor: '#ECFDF5', color: '#065F46' }}>
                Al Día
              </span>
            </div>
            <div className="fs-3 fw-bolder text-dark mb-1 mt-2" style={{ letterSpacing: '-0.5px' }}>{clientesActivos}</div>
            <small className="text-muted d-block fw-semibold" style={{ fontSize: '0.78rem' }}>Cuentas con acceso habilitado</small>
          </div>
        </div>

        <div className="col-md-3">
          <div className="custom-card p-3.5 h-100 shadow-sm rounded-4 border bg-white">
            <div className="d-flex justify-content-between align-items-start mb-2">
              <div className="d-flex align-items-center gap-2.5">
                <div className="section-header-icon section-header-icon-warning">
                  <Clock size={20} strokeWidth={2.2} />
                </div>
                <span className="text-secondary small fw-bold text-uppercase" style={{ letterSpacing: '0.4px', fontSize: '0.74rem' }}>
                  Por Cobrar
                </span>
              </div>
              <span className="badge-tag" style={{ backgroundColor: '#FFFBEB', color: '#92400E' }}>
                Pendientes
              </span>
            </div>
            <div className="fs-3 fw-bolder text-dark mb-1 mt-2" style={{ letterSpacing: '-0.5px' }}>{clientesPorCobrarList.length}</div>
            <small className="text-muted d-block fw-semibold" style={{ fontSize: '0.78rem' }}>Derivados pendientes de abono</small>
          </div>
        </div>

        <div className="col-md-3">
          <div className="custom-card p-3.5 h-100 shadow-sm rounded-4 border bg-white">
            <div className="d-flex justify-content-between align-items-start mb-2">
              <div className="d-flex align-items-center gap-2.5">
                <div className="section-header-icon section-header-icon-danger">
                  <AlertTriangle size={20} strokeWidth={2.2} />
                </div>
                <span className="text-secondary small fw-bold text-uppercase" style={{ letterSpacing: '0.4px', fontSize: '0.74rem' }}>
                  Vencidos / Bloqueados
                </span>
              </div>
              <span className="badge-tag" style={{ backgroundColor: '#FEF2F2', color: '#991B1B' }}>
                Alerta
              </span>
            </div>
            <div className="fs-3 fw-bolder text-dark mb-1 mt-2" style={{ letterSpacing: '-0.5px' }}>{clientesVencidosList.length}</div>
            <small className="text-muted d-block fw-semibold" style={{ fontSize: '0.78rem' }}>Cuentas por vencer o suspendidas</small>
          </div>
        </div>
      </div>

      {/* Dashboard Grid 2 Columnas */}
      <div className="row g-4">
        {/* Columna Izquierda: Listas rápidas de Clientes */}
        <div className="col-lg-6">
          {/* Panel 1: Clientes Habilitados Recientes */}
          <div className="custom-card p-4 mb-4 shadow-sm">
            <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
              <div>
                <h2 className="h6 fw-bold text-dark mb-1 d-flex align-items-center">
                  <Users size={18} className="text-primary me-2" />
                  <span>Clientes Activos Recientes</span>
                </h2>
                <small className="text-muted">Últimos clientes con servicio habilitado</small>
              </div>
              <button onClick={() => setActiveTab('todos')} className="btn btn-outline-primary btn-sm rounded-3 px-3 fw-semibold">
                Ver Todos
              </button>
            </div>
            <div className="list-group list-group-flush">
              {clients.filter((c) => c.estadoCuenta === 'HABILITADO').slice(0, 5).length === 0 ? (
                <div className="text-muted small py-4 text-center">No hay clientes activos registrados.</div>
              ) : (
                clients
                  .filter((c) => c.estadoCuenta === 'HABILITADO')
                  .slice(0, 5)
                  .map((c) => (
                    <div key={`act-${c.id}`} className="list-group-item px-0 py-2.5 d-flex justify-content-between align-items-center border-bottom border-light">
                      <div className="d-flex align-items-center">
                        <div className="rounded-circle bg-light border text-secondary fw-bold d-flex align-items-center justify-content-center me-3 flex-shrink-0" style={{ width: '40px', height: '40px', fontSize: '0.85rem' }}>
                          {(c.razonSocial || 'CL').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <strong className="text-dark d-block small">{c.razonSocial}</strong>
                          <span className="text-muted small">RUC: {c.ruc} | Plan: {c.planContratado}</span>
                        </div>
                      </div>
                      <span className="badge-fb badge-fb-success">
                        <span className="badge-dot badge-dot-success" />
                        HABILITADO
                      </span>
                    </div>
                  ))
              )}
            </div>
          </div>

          {/* Panel 2: Pendientes por Cobrar */}
          <div className="custom-card p-4 shadow-sm">
            <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
              <div>
                <h2 className="h6 fw-bold text-dark mb-1 d-flex align-items-center">
                  <CreditCard size={18} className="text-warning me-2" />
                  <span>Pendientes de Cobro</span>
                </h2>
                <small className="text-muted">Clientes derivados del formulario en espera de confirmación</small>
              </div>
              <button onClick={() => setActiveTab('cobrar')} className="btn-meta-action btn-meta-action-warning">
                Gestionar Cobros
              </button>
            </div>
            <div className="list-group list-group-flush">
              {clientesPorCobrarList.slice(0, 5).length === 0 ? (
                <div className="text-muted small py-5 text-center d-flex flex-column align-items-center justify-content-center">
                  <CreditCard size={36} className="text-muted opacity-30 mb-2" />
                  <span>No hay pendientes por cobrar.</span>
                </div>
              ) : (
                clientesPorCobrarList.slice(0, 5).map((c) => (
                  <div key={`cob-${c.id}`} className="list-group-item px-0 py-2.5 d-flex justify-content-between align-items-center border-bottom border-light">
                    <div>
                      <strong className="text-dark d-block small">{c.razonSocial}</strong>
                      <span className="text-muted small">RUC: {c.ruc} | Tel: {c.telefono}</span>
                    </div>
                    <div className="text-end">
                      <strong className="text-warning d-block small">S/ {Number(c.montoSiguienteCobro ?? c.montoMensual).toFixed(2)}</strong>
                      <span className="badge-fb badge-fb-warning">
                        <span className="badge-dot badge-dot-warning" />
                        POR COBRAR
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Columna Derecha: Notificaciones y Distribución */}
        <div className="col-lg-6">
          {/* Panel 3: Notificaciones y Vencimientos */}
          <div className="custom-card p-4 mb-4 shadow-sm">
            <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
              <div>
                <h2 className="h6 fw-bold text-dark mb-1 d-flex align-items-center">
                  <Bell size={18} className="text-info me-2" />
                  <span>Notificaciones y Vencimientos Próximos</span>
                </h2>
                <small className="text-muted">Clientes con vencimiento cercano a alertar</small>
              </div>
              <button onClick={() => setActiveTab('todos')} className="btn-meta-action btn-meta-action-primary">
                Todos los Clientes
              </button>
            </div>
            <div className="d-flex flex-column gap-2">
              {clientesPorVencer1DiaList.length === 0 ? (
                <div className="text-center text-muted py-5 small d-flex flex-column align-items-center justify-content-center">
                  <Bell size={36} className="text-muted opacity-30 mb-2" />
                  <span>No hay alertas de vencimiento pendientes.</span>
                </div>
              ) : (
                clientesPorVencer1DiaList.slice(0, 5).map((c) => (
                  <div
                    key={`res-notif-${c.id}`}
                    className="p-3 border rounded-3 bg-light d-flex justify-content-between align-items-center"
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      setCalendarSearch(c.ruc);
                      setActiveTab('todos');
                    }}
                  >
                    <div>
                      <strong className="text-dark d-block small">{c.razonSocial}</strong>
                      <span className="text-muted small">RUC: {c.ruc} | {c.planContratado}</span>
                    </div>
                    <span className="badge-tag badge-plazo-urgent">
                      <span className="badge-dot badge-dot-warning" />
                      VENCE EN 1 DÍA
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Panel 4: Distribución por Plan */}
          <div className="custom-card p-4 shadow-sm">
            <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
              <div>
                <h2 className="h6 fw-bold text-dark mb-1 d-flex align-items-center">
                  <Clock size={18} className="text-secondary me-2" />
                  <span>Distribución de Clientes por Plan</span>
                </h2>
                <small className="text-muted">Total de cuentas según el plan contratado</small>
              </div>
              <button
                onClick={() => loadData(token, true)}
                disabled={isSyncing}
                className="btn-meta-action btn-meta-action-secondary"
              >
                <RefreshCw size={14} className={isSyncing ? 'spin-anim' : ''} />
                <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar'}</span>
              </button>
            </div>
            <div className="d-flex flex-column gap-3 pt-1">
              {[
                { key: 'INICIA', name: 'Plan Inicia', color: 'bg-info' },
                { key: 'EMPRENDE', name: 'Plan Emprende', color: 'bg-primary' },
                { key: 'IMPULSA', name: 'Plan Impulsa', color: 'bg-purple' },
                { key: 'EMPRESARIAL', name: 'Plan Empresarial', color: 'bg-success' },
                { key: 'LIDER', name: 'Plan Líder', color: 'bg-dark' },
              ].map((p) => {
                const count = clients.filter((c) => normalizePlanKey(c.planContratado) === p.key).length;
                const pct = clients.length > 0 ? Math.round((count / clients.length) * 100) : 0;
                return (
                  <div key={p.key}>
                    <div className="d-flex justify-content-between small mb-1">
                      <span className="fw-semibold text-dark">{p.name}</span>
                      <span className="text-muted">{count} clientes ({pct}%)</span>
                    </div>
                    <div className="progress" style={{ height: '8px' }}>
                      <div className={`progress-bar ${p.color}`} role="progressbar" style={{ width: `${pct}%` }}></div>
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
