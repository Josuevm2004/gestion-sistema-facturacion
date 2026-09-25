'use client';

import React from 'react';
import { Activity, Search, Eye, MessageSquare, BellRing, CheckCircle2, CalendarPlus, RotateCcw, ChevronDown } from 'lucide-react';
import { Client } from './ClientesTodosTab';
import PaginationControls from './PaginationControls';
import BillingMessageModal from '../modals/BillingMessageModal';
import RegistrarPagoModal from '../modals/RegistrarPagoModal';
import { parseLocalDate, getDiffDays } from '@/lib/billing';

interface CentroControlTabProps {
  clients: Client[];
  calendarSearch: string;
  setCalendarSearch: (v: string) => void;
  calcularProrrateoEntero: (
    planStr?: string,
    tipoSuscripcion?: string,
    fechaCapacitacionStr?: string,
    montoMensualBase?: number
  ) => { montoProrrateado: number; diasProrrateados: number };
  setHistoryClient: (client: Client) => void;
  handleToggleAvisado?: (client: Client, nextAvisado?: boolean) => void;
  handleAdelantoPago?: (client: Client, monto?: number, observaciones?: string, paymentDetails?: any) => Promise<void> | void;
  handleRenovarPlan?: (client: Client, nuevoPlan?: string, nuevoTipo?: string, paymentDetails?: any) => Promise<void> | void;
}

export default function CentroControlTab({
  clients,
  calendarSearch,
  setCalendarSearch,
  calcularProrrateoEntero: _calcularProrrateoEntero,
  setHistoryClient,
  handleToggleAvisado,
  handleAdelantoPago,
  handleRenovarPlan: _handleRenovarPlan,
}: CentroControlTabProps) {
  const [billingMessageClient, setBillingMessageClient] = React.useState<Client | null>(null);
  const [adelantoClient, setAdelantoClient] = React.useState<Client | null>(null);
  const [suscripcionFilter, setSuscripcionFilter] = React.useState<string>('');
  const [avisadoFilter, setAvisadoFilter] = React.useState<string>('');
  const [openActionId, setOpenActionId] = React.useState<string | number | null>(null);
  const pageSize = 10;
  const [currentPage, setCurrentPage] = React.useState(1);

  const totalActivos = React.useMemo(() => {
    return clients.filter((c) => (c.estadoCuenta || '').toUpperCase() !== 'BLOQUEADO').length;
  }, [clients]);

  const filteredClients = React.useMemo(() => {
    return clients
      .filter((c) => (c.estadoCuenta || '').toUpperCase() !== 'BLOQUEADO')
      .filter((c) => {
        // Filtro de Suscripción (Mensual / Anual)
        if (suscripcionFilter) {
          const tipo = (c.tipoSuscripcion || 'MENSUAL').toUpperCase();
          if (tipo !== suscripcionFilter.toUpperCase()) return false;
        }

        // Filtro de Avisados
        if (avisadoFilter === 'AVISADO') {
          if (!c.avisado) return false;
        } else if (avisadoFilter === 'NO_AVISADO') {
          if (c.avisado) return false;
        }

        // Buscador
        const searchStr = (calendarSearch || '').trim();
        if (!searchStr) return true;
        const q = searchStr.toLowerCase();
        return (
          c.razonSocial?.toLowerCase().includes(q) ||
          c.ruc?.includes(q) ||
          (c.dni || '').includes(q) ||
          (c.nombres || '').toLowerCase().includes(q) ||
          (c.apellidos || '').toLowerCase().includes(q) ||
          (c.telefono || '').includes(q) ||
          (c.telefonoPersonal || '').includes(q) ||
          (c.usuarioWsp || '').toLowerCase().includes(q) ||
          (c.email || '').toLowerCase().includes(q) ||
          (c.planContratado || '').toLowerCase().includes(q)
        );
      })
      .map((c) => {
        const vencDate = parseLocalDate(c.fechaVencimientoMensual);
        const diffDays = getDiffDays(c.fechaVencimientoMensual);
        return { ...c, _vencDate: vencDate, _diffDays: diffDays };
      })
      .sort((a, b) => a._diffDays - b._diffDays);
  }, [clients, calendarSearch, suscripcionFilter, avisadoFilter]);

  const hasActiveFilters = Boolean((calendarSearch || '').trim() || suscripcionFilter || avisadoFilter);

  const resetFilters = () => {
    setCalendarSearch('');
    setSuscripcionFilter('');
    setAvisadoFilter('');
  };

  const totalPages = Math.max(1, Math.ceil(filteredClients.length / pageSize));
  const visibleClients = React.useMemo(
    () => filteredClients.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [filteredClients, currentPage]
  );

  React.useEffect(() => {
    setCurrentPage(1);
  }, [calendarSearch, suscripcionFilter, avisadoFilter, filteredClients.length]);

  React.useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  return (
    <div className="w-100">
      {/* Encabezado con Icono Moderno y Badge */}
      <div className="d-flex justify-content-between align-items-center mb-3 p-3 custom-card flex-wrap gap-2">
        <div className="d-flex align-items-center gap-3">
          <div className="section-header-icon section-header-icon-success">
            <Activity size={22} strokeWidth={2.2} />
          </div>
          <div>
            <h2 className="h6 fw-bold text-dark mb-0">Centro de Control y Cobranzas</h2>
            <small className="text-muted fw-semibold">Monitoreo detallado de vencimientos y cálculo prorrateado</small>
          </div>
        </div>
        <div className="d-flex align-items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="btn btn-sm btn-outline-secondary rounded-pill px-3 d-inline-flex align-items-center gap-1 fw-semibold"
            >
              <RotateCcw size={13} />
              <span>Limpiar Filtros</span>
            </button>
          )}
          <span className="badge rounded-pill px-3 py-1.5 fw-bold" style={{ backgroundColor: '#DEF7EC', color: '#03543F' }}>
            {hasActiveFilters ? `${filteredClients.length} de ${totalActivos} Clientes` : `${totalActivos} Clientes`}
          </span>
        </div>
      </div>

      {/* Barra de Filtros: Buscador, Suscripción (Anual/Mensual) y Estado de Aviso (Stitch Style) */}
      <div className="stitch-filter-toolbar mb-4">
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-6 col-lg-5">
            <div className="stitch-filter-search">
              <Search size={15} />
              <input
                type="text"
                className="form-control stitch-filter-input"
                placeholder="Buscar por RUC, Empresa, DNI, Teléfono, Plan..."
                value={calendarSearch}
                onChange={(e) => setCalendarSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="col-6 col-md-3 col-lg-3">
            <select
              className="form-select stitch-filter-select w-100"
              value={suscripcionFilter}
              onChange={(e) => setSuscripcionFilter(e.target.value)}
            >
              <option value="">Modalidad: Todas</option>
              <option value="MENSUAL">Suscripción Mensual</option>
              <option value="ANUAL">Suscripción Anual</option>
            </select>
          </div>
          <div className="col-6 col-md-3 col-lg-4">
            <select
              className="form-select stitch-filter-select w-100"
              value={avisadoFilter}
              onChange={(e) => setAvisadoFilter(e.target.value)}
            >
              <option value="">Estado Aviso: Todos</option>
              <option value="AVISADO">Solo Avisados</option>
              <option value="NO_AVISADO">Sin Avisar (Pendientes)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla Expandida al 100% con Dropdown de Acciones Unificadas */}
      <div className="table-card-meta mb-4">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0 table-meta">
            <thead>
              <tr>
                <th style={{ width: '45px' }}>#</th>
                <th>RUC / Empresa</th>
                <th>Contacto</th>
                <th>Usuario WSP</th>
                <th>Plan / Suscripción</th>
                <th>Monto</th>
                <th>Vencimiento</th>
                <th>Plazo</th>
                <th>Estado</th>
                <th className="text-center" style={{ width: '130px' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center text-muted py-5 fw-semibold">
                    No se encontraron clientes con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                visibleClients.map((c, idx) => {
                  const { _vencDate: vencDate, _diffDays: diffDays } = c;
                  const isExpired = diffDays !== 9999 && diffDays <= 0;
                  const isNearExpiry = diffDays <= 3 && diffDays >= 0;
                  const cobroProximo = Number(c.montoSiguienteCobro ?? c.montoMensual ?? c.precioPlan ?? 0);
                  const estadoVisual = isExpired && c.estadoCuenta === 'HABILITADO' ? 'VENCIDO' : c.estadoCuenta;
                  const initial = (c.razonSocial || 'C').charAt(0).toUpperCase();
                  const isActionOpen = openActionId === c.id;

                  return (
                    <tr
                      key={c.id}
                      className={isExpired ? 'bg-danger bg-opacity-10' : isNearExpiry ? 'bg-warning bg-opacity-10' : ''}
                      style={{ position: isActionOpen ? 'relative' : undefined, zIndex: isActionOpen ? 1050 : undefined }}
                    >
                      <td className="text-muted fw-semibold py-2.5">
                        {(currentPage - 1) * pageSize + idx + 1}
                      </td>
                      <td className="py-2.5">
                        <div className="d-flex align-items-center gap-2">
                          <div
                            className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 fw-bold shadow-xs"
                            style={{
                              width: '32px',
                              height: '32px',
                              backgroundColor: '#E7F3FF',
                              color: '#0866FF',
                              fontSize: '0.78rem',
                              border: '1px solid #D0E2FF',
                            }}
                          >
                            {initial}
                          </div>
                          <div>
                            <span className="cell-title d-block">{c.razonSocial}</span>
                            <span className="cell-subtext font-monospace">{c.ruc}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5">
                        <span className="cell-title d-block">{c.telefono || c.telefonoPersonal || '—'}</span>
                        <span className="cell-subtext">{c.email || ''}</span>
                      </td>
                      <td className="py-2.5">
                        {c.usuarioWsp ? (
                          <span className="badge-wsp-chip">{c.usuarioWsp}</span>
                        ) : (
                          <span className="cell-subtext">—</span>
                        )}
                      </td>
                      <td className="py-2.5">
                        <div className="d-flex align-items-center gap-1.5 flex-wrap">
                          <span className="badge-tag badge-plan-tag">{c.planContratado}</span>
                          <span className={`badge-tag ${c.tipoSuscripcion === 'ANUAL' ? 'badge-sub-anual' : 'badge-sub-mensual'}`}>
                            {c.tipoSuscripcion || 'MENSUAL'}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5">
                        <span className="cell-amount text-primary">S/ {cobroProximo.toFixed(2)}</span>
                      </td>
                      <td className="py-2.5">
                        <span className={`cell-title ${isExpired ? 'text-danger' : isNearExpiry ? 'text-warning text-dark' : 'text-dark'}`}>
                          {vencDate
                            ? vencDate.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
                            : 'Sin fecha'}
                        </span>
                      </td>
                      <td className="py-2.5">
                        {diffDays === 9999 ? (
                          <span className="badge-tag badge-plazo-neutral">Sin fecha</span>
                        ) : diffDays === 0 ? (
                          <span className="badge-tag badge-plazo-today">
                            <span className="badge-dot badge-dot-danger badge-dot-pulse" />
                            HOY
                          </span>
                        ) : diffDays === 1 ? (
                          <span className="badge-tag badge-plazo-urgent">
                            <span className="badge-dot badge-dot-warning" />
                            Mañana
                          </span>
                        ) : diffDays > 1 && diffDays <= 3 ? (
                          <span className="badge-tag badge-plazo-urgent">
                            <span className="badge-dot badge-dot-warning" />
                            {diffDays} días
                          </span>
                        ) : diffDays >= 4 && diffDays <= 7 ? (
                          <span className="badge-tag badge-plazo-soon">
                            <span className="badge-dot badge-dot-info" />
                            {diffDays} días
                          </span>
                        ) : diffDays > 7 ? (
                          <span className="badge-tag badge-plazo-ok">
                            <span className="badge-dot badge-dot-success" />
                            {diffDays} días
                          </span>
                        ) : (
                          <span className="badge-tag badge-plazo-expired">
                            <span className="badge-dot badge-dot-danger" />
                            Vencido {Math.abs(diffDays)}d
                          </span>
                        )}
                      </td>
                      <td className="py-2.5">
                        <span
                          className={`badge-fb ${
                            estadoVisual === 'HABILITADO'
                              ? 'badge-fb-success'
                              : estadoVisual === 'POR_COBRAR'
                              ? 'badge-fb-warning'
                              : estadoVisual === 'BLOQUEADO'
                              ? 'badge-fb-secondary'
                              : 'badge-fb-danger'
                          }`}
                        >
                          <span
                            className={`badge-dot ${
                              estadoVisual === 'HABILITADO'
                                ? 'badge-dot-success'
                                : estadoVisual === 'POR_COBRAR'
                                ? 'badge-dot-warning'
                                : estadoVisual === 'BLOQUEADO'
                                ? 'badge-dot-neutral'
                                : 'badge-dot-danger'
                            }`}
                          />
                          {estadoVisual}
                        </span>
                      </td>
                      <td className="py-2.5 text-center position-relative">
                        <div className="table-action-floating-container">
                          <button
                            type="button"
                            onClick={() => setOpenActionId(isActionOpen ? null : c.id)}
                            className="btn-meta-action btn-meta-action-primary shadow-xs"
                            title="Opciones de cobranza y control"
                          >
                            <span>Acciones</span>
                            <ChevronDown size={12} />
                          </button>

                          {isActionOpen && (
                            <>
                              <div
                                className="position-fixed top-0 start-0 w-100 h-100"
                                style={{ zIndex: 100050, background: 'transparent' }}
                                onClick={() => setOpenActionId(null)}
                              />
                              <div className="table-action-menu shadow-lg">
                                {/* 1. Toggle Avisado */}
                                <button
                                  type="button"
                                  className={`table-action-item ${c.avisado ? 'item-success' : ''}`}
                                  onClick={() => {
                                    setOpenActionId(null);
                                    handleToggleAvisado?.(c, !c.avisado);
                                  }}
                                >
                                  {c.avisado ? <CheckCircle2 size={15} /> : <BellRing size={15} />}
                                  <span>{c.avisado ? 'Desmarcar Avisado' : 'Marcar como Avisado'}</span>
                                </button>

                                {/* 2. Mensaje Inteligente de Cobranza */}
                                <button
                                  type="button"
                                  className="table-action-item item-success"
                                  onClick={() => {
                                    setOpenActionId(null);
                                    setBillingMessageClient(c);
                                  }}
                                >
                                  <MessageSquare size={15} />
                                  <span>Mensaje de Cobranza</span>
                                </button>

                                {/* 3. Adelanto de Pago (si faltan 10 días o menos) */}
                                {diffDays > 0 && diffDays <= 10 && (
                                  <button
                                    type="button"
                                    className="table-action-item"
                                    onClick={() => {
                                      setOpenActionId(null);
                                      setAdelantoClient(c);
                                    }}
                                  >
                                    <CalendarPlus size={15} />
                                    <span>Adelanto de Pago</span>
                                  </button>
                                )}

                                {/* 4. Ver Historial */}
                                <button
                                  type="button"
                                  className="table-action-item item-primary"
                                  onClick={() => {
                                    setOpenActionId(null);
                                    setHistoryClient(c);
                                  }}
                                >
                                  <Eye size={15} />
                                  <span>Ver Historial</span>
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <PaginationControls
        currentPage={currentPage}
        totalItems={filteredClients.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
      />

      {/* Modal de Mensajes Inteligentes de Cobranza */}
      <BillingMessageModal
        client={billingMessageClient}
        onClose={() => setBillingMessageClient(null)}
        onAvisado={() => {
          if (billingMessageClient) {
            handleToggleAvisado?.(billingMessageClient, true);
          }
        }}
      />

      {/* Modal de Adelanto de Pago */}
      {adelantoClient && (
        <RegistrarPagoModal
          client={adelantoClient}
          mode="ADELANTO"
          onClose={() => setAdelantoClient(null)}
          onConfirm={async (client, data) => {
            await handleAdelantoPago?.(client, data.monto, data.observaciones, {
              fechaPago: data.fechaPago,
              medioPago: data.medioPago,
              codigoOperacion: data.codigoOperacion,
              observaciones: data.observaciones,
            });
            setAdelantoClient(null);
          }}
        />
      )}
    </div>
  );
}
