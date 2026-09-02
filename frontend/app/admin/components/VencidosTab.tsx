'use client';

import React from 'react';
import { AlertCircle, RefreshCw, Settings, X, Unlock, ShieldAlert, Search, RotateCcw } from 'lucide-react';
import { Client } from './ClientesTodosTab';
import PaginationControls from './PaginationControls';
import { parseLocalDate, formatDatePeru } from '@/lib/billing';

interface VencidosTabProps {
  clientesVencidosList: Client[];
  handleRenovarPlan: (client: Client, nuevoPlan?: string, nuevoTipo?: string) => any;
  setCambioPlanClient: (client: Client) => void;
  setCambioPlanSeleccionado: (plan: string) => void;
  setCambioPlanTipo?: (tipo: string) => void;
  handleEstadoCuentaChange?: (client: Client, nuevoEstado: string) => void;
  handleDevolverAcceso?: (client: Client) => void;
}

export default function VencidosTab({
  clientesVencidosList,
  handleRenovarPlan,
  setCambioPlanClient,
  setCambioPlanSeleccionado,
  setCambioPlanTipo,
  handleEstadoCuentaChange,
  handleDevolverAcceso,
}: VencidosTabProps) {
  const [search, setSearch] = React.useState('');
  const [suscripcionFilter, setSuscripcionFilter] = React.useState('');
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
    <div className="custom-card p-4 shadow-sm">
      <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-3">
        <div className="d-flex align-items-center gap-2">
          <div className="p-2 bg-danger bg-opacity-10 text-danger rounded-3">
            <AlertCircle size={20} />
          </div>
          <div>
            <h2 className="h6 fw-bold text-dark mb-0">Clientes Vencidos</h2>
            <small className="text-muted">Clientes con fecha de servicio expirada que requieren renovación o corte</small>
          </div>
        </div>
        <div className="d-flex align-items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1 fw-semibold"
            >
              <RotateCcw size={13} />
              <span>Limpiar Filtros</span>
            </button>
          )}
          <span className="badge bg-danger rounded-pill px-3 py-2 fs-6">
            {hasActiveFilters ? `${filteredClients.length} de ${clientesVencidosList.length} pendientes` : `${clientesVencidosList.length} pendientes`}
          </span>
        </div>
      </div>

      {/* Barra de Filtros: Buscador y Filtro Anual / Mensual */}
      <div className="p-3 bg-light rounded-3 border mb-4">
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-8 col-lg-6">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-white border-end-0 text-muted">
                <Search size={14} />
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Buscar por RUC, Empresa, DNI, Teléfono, Plan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="col-12 col-md-4 col-lg-3">
            <select
              className="form-select form-select-sm fw-semibold"
              value={suscripcionFilter}
              onChange={(e) => setSuscripcionFilter(e.target.value)}
            >
              <option value="">Suscripción: Todas</option>
              <option value="MENSUAL">Mensual</option>
              <option value="ANUAL">Anual</option>
            </select>
          </div>
        </div>
      </div>

      <div className="table-responsive">
        <table className="table table-sm table-hover align-middle mb-0" style={{ fontSize: '0.88rem' }}>
          <thead>
            <tr>
              <th>#</th>
              <th>Empresa / RUC</th>
              <th>Teléfono</th>
              <th>Plan</th>
              <th>Estado</th>
              <th>Monto Plan</th>
              <th>Fecha Vencimiento</th>
              <th>Acciones Comerciales</th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center text-muted py-4 fw-semibold">
                  {hasActiveFilters
                    ? 'No se encontraron clientes vencidos con los filtros aplicados.'
                    : 'No hay clientes vencidos en este momento.'}
                </td>
              </tr>
            ) : (
              visibleClients.map((c, idx) => {
                const vencDate = parseLocalDate(c.fechaVencimientoMensual);
                const isBloqueado = c.estadoCuenta === 'BLOQUEADO';

                return (
                  <tr key={c.id} className={isBloqueado ? 'bg-light bg-opacity-75' : ''}>
                    <td className="text-muted fw-semibold py-2.5">
                      {(currentPage - 1) * pageSize + idx + 1}
                    </td>
                    <td>
                      <strong className="text-dark d-block fs-6">{c.razonSocial}</strong>
                      <span className="small text-muted fw-semibold">RUC: {c.ruc}</span>
                    </td>
                    <td>
                      <span className="fw-bold text-dark">{c.telefono || c.telefonoPersonal || '—'}</span>
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-1">
                        <span className="badge bg-light text-dark border fw-bold">{c.planContratado}</span>
                        <span className="badge bg-secondary text-white">{c.tipoSuscripcion || 'MENSUAL'}</span>
                      </div>
                    </td>
                    <td>
                      {isBloqueado ? (
                        <span className="badge bg-secondary text-white d-inline-flex align-items-center gap-1">
                          <ShieldAlert size={12} /> Bloqueado
                        </span>
                      ) : (
                        <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25">
                          Vencido
                        </span>
                      )}
                    </td>
                    <td className="fw-bold text-danger fs-6">S/ {c.montoMensual?.toFixed(2)}</td>
                    <td>
                      {vencDate ? (
                        <span className="badge bg-light text-danger border border-danger border-opacity-25 fw-bold">
                          {formatDatePeru(vencDate)}
                        </span>
                      ) : (
                        <span className="badge bg-light text-muted border">Sin fecha</span>
                      )}
                    </td>
                    <td>
                      <div className="d-flex gap-2 flex-wrap align-items-center">
                        {!isBloqueado ? (
                          <>
                            <button
                              onClick={() => {
                                const ok = window.confirm(
                                  `¿Renovar plan de ${c.razonSocial}? Se registrará una nueva venta de RENOVACIÓN.`
                                );
                                if (ok) handleRenovarPlan(c);
                              }}
                              className="btn btn-sm btn-primary text-white px-3 py-1 fw-bold shadow-sm d-inline-flex align-items-center gap-1.5"
                            >
                              <RefreshCw size={13} />
                              <span>Renovar</span>
                            </button>
                            <button
                              onClick={() => {
                                setCambioPlanClient(c);
                                setCambioPlanSeleccionado(c.planContratado || '');
                                if (setCambioPlanTipo) setCambioPlanTipo(c.tipoSuscripcion || 'MENSUAL');
                              }}
                              className="btn btn-sm btn-warning text-dark px-3 py-1 fw-bold shadow-sm d-inline-flex align-items-center gap-1.5"
                            >
                              <Settings size={13} />
                              <span>Cambiar Plan</span>
                            </button>
                            <button
                              onClick={() => {
                                const ok = window.confirm(
                                  `¿Bloquear cliente ${c.razonSocial}? Su acceso se suspenderá.`
                                );
                                if (ok && handleEstadoCuentaChange) handleEstadoCuentaChange(c, 'BLOQUEADO');
                              }}
                              className="btn btn-sm btn-outline-danger px-3 py-1 fw-bold d-inline-flex align-items-center gap-1.5"
                            >
                              <X size={13} />
                              <span>Bloquear</span>
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => {
                              const ok = window.confirm('Reactivar a ' + c.razonSocial + '? Se registrará una renovación.');
                              if (ok) handleRenovarPlan(c);
                            }}
                            className="btn btn-sm btn-success text-white px-3 py-1 fw-bold shadow-sm d-inline-flex align-items-center gap-1.5"
                          >
                            <Unlock size={13} />
                            <span>Reactivar Acceso</span>
                          </button>
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
      <PaginationControls
        currentPage={currentPage}
        totalItems={filteredClients.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
