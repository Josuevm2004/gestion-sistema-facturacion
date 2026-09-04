'use client';

import React from 'react';
import { ShieldCheck, CheckCircle, Trash2, Search, RotateCcw, RefreshCw } from 'lucide-react';
import { Client } from './ClientesTodosTab';
import PaginationControls from './PaginationControls';
import RegistrarPagoModal from '../modals/RegistrarPagoModal';

interface BloqueadosTabProps {
  clientesBloqueadosList: Client[];
  handleEstadoCuentaChange: (client: Client, nuevoEstado: string) => void;
  handleDevolverAcceso: (client: Client) => any;
  setDeletingClient: (client: Client) => void;
  handleRenovarPlan?: (client: Client, nuevoPlan?: string, nuevoTipo?: string, paymentDetails?: any) => any;
}

export default function BloqueadosTab({
  clientesBloqueadosList,
  handleEstadoCuentaChange: _handleEstadoCuentaChange,
  handleDevolverAcceso,
  setDeletingClient,
  handleRenovarPlan,
}: BloqueadosTabProps) {
  const [pagoModalConfig, setPagoModalConfig] = React.useState<{
    client: Client;
    mode: 'REANUDAR_PAGO' | 'RENOVAR_PRORRATEO';
  } | null>(null);
  const [search, setSearch] = React.useState('');
  const [suscripcionFilter, setSuscripcionFilter] = React.useState('');
  const pageSize = 10;
  const [currentPage, setCurrentPage] = React.useState(1);

  const filteredClients = React.useMemo(() => {
    return clientesBloqueadosList.filter((c) => {
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
  }, [clientesBloqueadosList, search, suscripcionFilter]);

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
          <div className="p-2 bg-secondary bg-opacity-10 text-secondary rounded-3">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h2 className="h6 fw-bold text-dark mb-0">Clientes Bloqueados / Suspendidos</h2>
            <small className="text-muted">Clientes desafiliados o con acceso restringido que pueden rehabilitarse</small>
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
          <span className="badge bg-secondary text-white rounded-pill px-3 py-1.5 fw-bold">
            {hasActiveFilters ? `${filteredClients.length} de ${clientesBloqueadosList.length} Bloqueados` : `${clientesBloqueadosList.length} Bloqueados`}
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
        <table className="table table-hover align-middle mb-0">
          <thead>
            <tr>
              <th style={{ width: '50px' }}>#</th>
              <th>RUC / Empresa</th>
              <th>Teléfono</th>
              <th>Email</th>
              <th>Plan</th>
              <th>Estado</th>
              <th>Acciones Comerciales</th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-muted py-4 fw-semibold">
                  {hasActiveFilters
                    ? 'No se encontraron clientes bloqueados con los filtros aplicados.'
                    : 'No hay clientes en estado bloqueado.'}
                </td>
              </tr>
            ) : (
              visibleClients.map((c, idx) => (
                <tr key={c.id}>
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
                    <span className="text-dark">{c.email || 'N/A'}</span>
                  </td>
                  <td>
                    <div className="d-flex align-items-center gap-1">
                      <span className="badge bg-light text-dark border fw-bold">{c.planContratado || 'Plan'}</span>
                      <span className="badge bg-secondary text-white">{c.tipoSuscripcion || 'MENSUAL'}</span>
                    </div>
                  </td>
                  <td>
                    <span className="badge bg-secondary text-white">BLOQUEADO</span>
                  </td>
                  <td>
                    <div className="d-flex gap-2 flex-wrap">
                      {handleRenovarPlan && (
                        <>
                          <button
                            onClick={() => setPagoModalConfig({ client: c, mode: 'REANUDAR_PAGO' })}
                            className="btn btn-sm btn-primary text-white px-2.5 py-1.5 fw-bold shadow-sm d-inline-flex align-items-center gap-1.5"
                            title="Reanudar fecha de pago: ciclo completo desde el 1.° con estado HABILITADO"
                          >
                            <RefreshCw size={13} />
                            <span>Reanudar fecha de pago</span>
                          </button>
                          <button
                            onClick={() => setPagoModalConfig({ client: c, mode: 'RENOVAR_PRORRATEO' })}
                            className="btn btn-sm btn-outline-warning text-dark px-2.5 py-1.5 fw-bold shadow-sm d-inline-flex align-items-center gap-1.5"
                            title="Renovar con prorrateo por atraso de pago con estado HABILITADO"
                          >
                            <RotateCcw size={13} />
                            <span>Renovar</span>
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => {
                          const ok = window.confirm(
                            `¿Habilitar acceso para ${c.razonSocial}? Pasará a VENCIDO para gestionar renovación o cambio de plan.`
                          );
                          if (ok) handleDevolverAcceso(c);
                        }}
                        className="btn btn-sm btn-outline-success px-2.5 py-1.5 fw-bold d-inline-flex align-items-center gap-1.5"
                      >
                        <CheckCircle size={14} />
                        <span>Habilitar Accesos</span>
                      </button>
                      <button
                        onClick={() => setDeletingClient(c)}
                        className="btn btn-sm btn-outline-danger px-2.5 py-1.5 fw-bold d-inline-flex align-items-center gap-1.5"
                      >
                        <Trash2 size={14} />
                        <span>Eliminar</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
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

      {/* Modal Unificado de Renovación y Reanudación de Pago Real */}
      {pagoModalConfig && handleRenovarPlan && (
        <RegistrarPagoModal
          client={pagoModalConfig.client}
          mode={pagoModalConfig.mode}
          onClose={() => setPagoModalConfig(null)}
          onConfirm={async (client, data) => {
            await handleRenovarPlan(client, undefined, undefined, {
              fechaPago: data.fechaPago,
              medioPago: data.medioPago,
              codigoOperacion: data.codigoOperacion,
              observaciones: data.observaciones,
              conProrrateo: data.conProrrateo,
            });
            setPagoModalConfig(null);
          }}
        />
      )}
    </div>
  );
}
