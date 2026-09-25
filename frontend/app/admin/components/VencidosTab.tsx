'use client';

import React from 'react';
import { AlertCircle, RotateCcw, Settings, X, Unlock, ShieldAlert, Search, ChevronDown } from 'lucide-react';
import { Client } from './ClientesTodosTab';
import PaginationControls from './PaginationControls';
import { parseLocalDate, formatDatePeru } from '@/lib/billing';
import RegistrarPagoModal from '../modals/RegistrarPagoModal';

interface VencidosTabProps {
  clientesVencidosList: Client[];
  handleRenovarPlan: (client: Client, nuevoPlan?: string, nuevoTipo?: string, paymentDetails?: any) => any;
  handleAdelantoPago?: (client: Client, monto?: number, observaciones?: string, paymentDetails?: any) => any;
  setCambioPlanClient: (client: Client) => void;
  setCambioPlanSeleccionado: (plan: string) => void;
  setCambioPlanTipo?: (tipo: string) => void;
  handleEstadoCuentaChange?: (client: Client, nuevoEstado: string) => void;
  handleDevolverAcceso?: (client: Client) => void;
}

export default function VencidosTab({
  clientesVencidosList,
  handleRenovarPlan,
  handleAdelantoPago,
  setCambioPlanClient,
  setCambioPlanSeleccionado,
  setCambioPlanTipo,
  handleEstadoCuentaChange,
  handleDevolverAcceso,
}: VencidosTabProps) {
  const [pagoModalConfig, setPagoModalConfig] = React.useState<{
    client: Client;
  } | null>(null);
  const [search, setSearch] = React.useState('');
  const [suscripcionFilter, setSuscripcionFilter] = React.useState('');
  const [openActionId, setOpenActionId] = React.useState<string | number | null>(null);
  const pageSize = 10;
  const [currentPage, setCurrentPage] = React.useState(1);

  const filteredClients = React.useMemo(() => {
    return clientesVencidosList.filter((c) => {
      if (suscripcionFilter) {
        const tipo = (c.tipoSuscripcion || 'MENSUAL').toUpperCase();
        if (tipo !== suscripcionFilter.toUpperCase()) return false;
      }
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const match =
          c.razonSocial?.toLowerCase().includes(q) ||
          c.ruc?.toLowerCase().includes(q) ||
          (c.dni || '').toLowerCase().includes(q) ||
          (c.nombres || '').toLowerCase().includes(q) ||
          (c.apellidos || '').toLowerCase().includes(q) ||
          (c.telefono || '').toLowerCase().includes(q) ||
          (c.telefonoPersonal || '').toLowerCase().includes(q) ||
          (c.usuarioWsp || '').toLowerCase().includes(q) ||
          (c.email || '').toLowerCase().includes(q) ||
          (c.planContratado || '').toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [clientesVencidosList, search, suscripcionFilter]);

  const hasActiveFilters = Boolean(search.trim() || suscripcionFilter);

  const resetFilters = () => {
    setSearch('');
    setSuscripcionFilter('');
  };

  const totalPages = Math.max(1, Math.ceil(filteredClients.length / pageSize));
  const visibleClients = React.useMemo(
    () => filteredClients.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [filteredClients, currentPage]
  );

  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, suscripcionFilter, filteredClients.length]);

  React.useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  return (
    <div className="w-100">
      {/* Encabezado con Icono Moderno y Badge */}
      <div className="d-flex justify-content-between align-items-center mb-3 p-3 custom-card flex-wrap gap-2">
        <div className="d-flex align-items-center gap-3">
          <div className="section-header-icon section-header-icon-danger">
            <AlertCircle size={22} strokeWidth={2.2} />
          </div>
          <div>
            <h2 className="h6 fw-bold text-dark mb-0">Clientes Vencidos</h2>
            <small className="text-muted fw-semibold">Clientes con fecha de servicio expirada que requieren renovación o corte</small>
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
          <span className="badge rounded-pill px-3 py-1.5 fw-bold" style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}>
            {hasActiveFilters ? `${filteredClients.length} de ${clientesVencidosList.length} Vencidos` : `${clientesVencidosList.length} Vencidos`}
          </span>
        </div>
      </div>

      {/* Barra de Filtros: Buscador y Filtro Anual / Mensual (Stitch Style) */}
      <div className="stitch-filter-toolbar mb-4">
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-8 col-lg-6">
            <div className="stitch-filter-search">
              <Search size={15} />
              <input
                type="text"
                className="form-control stitch-filter-input"
                placeholder="Buscar por RUC, Empresa, DNI, Teléfono, Plan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="col-12 col-md-4 col-lg-3">
            <select
              className="form-select stitch-filter-select"
              value={suscripcionFilter}
              onChange={(e) => setSuscripcionFilter(e.target.value)}
            >
              <option value="">Modalidad: Todas</option>
              <option value="MENSUAL">Suscripción Mensual</option>
              <option value="ANUAL">Suscripción Anual</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla Expandida al 100% con Dropdown que se sobrepone a todo */}
      <div className="table-card-meta mb-3">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0 table-meta">
            <thead>
              <tr>
                <th style={{ width: '45px' }}>#</th>
                <th>RUC / Empresa</th>
                <th>Contacto</th>
                <th>Plan / Suscripción</th>
                <th>Estado</th>
                <th>Monto</th>
                <th>Vencimiento</th>
                <th className="text-center" style={{ width: '130px' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center text-muted py-5 fw-semibold">
                    No se encontraron clientes vencidos con los criterios especificados.
                  </td>
                </tr>
              ) : (
                visibleClients.map((c, idx) => {
                  const phone = c.telefono || c.telefonoPersonal;
                  const vencDate = c.fechaVencimientoMensual ? parseLocalDate(c.fechaVencimientoMensual) : null;
                  const isBloqueado = c.estadoCuenta === 'BLOQUEADO';
                  const initial = (c.razonSocial || 'C').charAt(0).toUpperCase();
                  const isActionOpen = openActionId === c.id;

                  return (
                    <tr key={c.id} style={{ position: isActionOpen ? 'relative' : undefined, zIndex: isActionOpen ? 1050 : undefined }}>
                      <td className="text-muted fw-semibold py-2.5">
                        {(currentPage - 1) * pageSize + idx + 1}
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2.5">
                          <div
                            className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 fw-bold shadow-xs"
                            style={{
                              width: '32px',
                              height: '32px',
                              backgroundColor: '#FEE2E2',
                              color: '#DC2626',
                              fontSize: '0.78rem',
                              border: '1px solid #FECACA',
                            }}
                          >
                            {initial}
                          </div>
                          <div>
                            <span className="cell-title d-block">{c.razonSocial}</span>
                            <span className="cell-subtext font-monospace">RUC: {c.ruc}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="cell-title">{phone || '—'}</span>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-1.5 flex-wrap">
                          <span className="badge-tag badge-plan-tag">
                            {c.planContratado}
                          </span>
                          <span
                            className={`badge-tag ${c.tipoSuscripcion === 'ANUAL' ? 'badge-sub-anual' : 'badge-sub-mensual'}`}
                          >
                            {c.tipoSuscripcion || 'MENSUAL'}
                          </span>
                        </div>
                      </td>
                      <td>
                        {isBloqueado ? (
                          <span className="badge-fb badge-fb-secondary">
                            <span className="badge-dot badge-dot-neutral" />
                            <ShieldAlert size={11} /> Bloqueado
                          </span>
                        ) : (
                          <span className="badge-fb badge-fb-danger">
                            <span className="badge-dot badge-dot-danger" />
                            Vencido
                          </span>
                        )}
                      </td>
                      <td>
                        <span className="cell-amount text-danger">S/ {c.montoMensual?.toFixed(2)}</span>
                      </td>
                      <td>
                        {vencDate ? (
                          <span className="badge-tag badge-plazo-expired">
                            <span className="badge-dot badge-dot-danger" />
                            {formatDatePeru(vencDate)}
                          </span>
                        ) : (
                          <span className="badge-tag badge-plazo-neutral">Sin fecha</span>
                        )}
                      </td>
                      <td className="text-center position-relative">
                        <div className="table-action-floating-container">
                          <button
                            type="button"
                            onClick={() => setOpenActionId(isActionOpen ? null : c.id)}
                            className="btn-meta-action btn-meta-action-primary shadow-xs"
                            title="Opciones de regularización y renovación"
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
                                <button
                                  type="button"
                                  className="table-action-item item-primary"
                                  onClick={() => {
                                    setOpenActionId(null);
                                    setPagoModalConfig({ client: c });
                                  }}
                                >
                                  <RotateCcw size={15} />
                                  <span>Registrar Pago / Renovar</span>
                                </button>
                                <button
                                  type="button"
                                  className="table-action-item"
                                  onClick={() => {
                                    setOpenActionId(null);
                                    setCambioPlanClient(c);
                                    setCambioPlanSeleccionado(c.planContratado || '');
                                    if (setCambioPlanTipo) setCambioPlanTipo(c.tipoSuscripcion || 'MENSUAL');
                                  }}
                                >
                                  <Settings size={15} />
                                  <span>Cambiar Plan</span>
                                </button>
                                {!isBloqueado ? (
                                  <button
                                    type="button"
                                    className="table-action-item item-danger"
                                    onClick={() => {
                                      setOpenActionId(null);
                                      const ok = window.confirm(
                                        `¿Bloquear cliente ${c.razonSocial}? Su acceso se suspenderá.`
                                      );
                                      if (ok && handleEstadoCuentaChange) handleEstadoCuentaChange(c, 'BLOQUEADO');
                                    }}
                                  >
                                    <X size={15} />
                                    <span>Bloquear Acceso</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    className="table-action-item item-success"
                                    onClick={() => {
                                      setOpenActionId(null);
                                      if (handleDevolverAcceso) handleDevolverAcceso(c);
                                    }}
                                  >
                                    <Unlock size={15} />
                                    <span>Desbloquear Acceso</span>
                                  </button>
                                )}
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

      {/* Modal Unificado de Renovación, Reanudación y Adelanto de Pago */}
      {pagoModalConfig && (
        <RegistrarPagoModal
          client={pagoModalConfig.client}
          onClose={() => setPagoModalConfig(null)}
          onConfirm={async (client, data) => {
            if (data.modalidad === 'ADELANTO' && handleAdelantoPago) {
              await handleAdelantoPago(client, data.monto, data.observaciones, {
                fechaPago: data.fechaPago,
                medioPago: data.medioPago,
                codigoOperacion: data.codigoOperacion,
                observaciones: data.observaciones,
              });
            } else {
              await handleRenovarPlan(client, undefined, undefined, {
                monto: data.monto,
                fechaPago: data.fechaPago,
                medioPago: data.medioPago,
                codigoOperacion: data.codigoOperacion,
                observaciones: data.observaciones,
                conProrrateo: data.conProrrateo,
                fechaInicioPeriodo: data.fechaInicioPeriodo,
                fechaFinPeriodo: data.fechaFinPeriodo,
              });
            }
            setPagoModalConfig(null);
          }}
        />
      )}
    </div>
  );
}
