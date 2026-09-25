'use client';

import React from 'react';
import { ShieldCheck, CheckCircle, Trash2, Search, RotateCcw, ChevronDown } from 'lucide-react';
import { Client } from './ClientesTodosTab';
import PaginationControls from './PaginationControls';

interface BloqueadosTabProps {
  clientesBloqueadosList: Client[];
  handleEstadoCuentaChange: (client: Client, nuevoEstado: string) => void;
  handleDevolverAcceso: (client: Client) => any;
  setDeletingClient: (client: Client) => void;
}

export default function BloqueadosTab({
  clientesBloqueadosList,
  handleEstadoCuentaChange: _handleEstadoCuentaChange,
  handleDevolverAcceso,
  setDeletingClient,
}: BloqueadosTabProps) {
  const [search, setSearch] = React.useState('');
  const [suscripcionFilter, setSuscripcionFilter] = React.useState('');
  const [openActionId, setOpenActionId] = React.useState<string | number | null>(null);
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
    <div className="w-100">
      {/* Encabezado con Icono Moderno y Badge */}
      <div className="d-flex justify-content-between align-items-center mb-3 p-3 custom-card flex-wrap gap-2">
        <div className="d-flex align-items-center gap-3">
          <div className="section-header-icon section-header-icon-dark">
            <ShieldCheck size={22} strokeWidth={2.2} />
          </div>
          <div>
            <h2 className="h6 fw-bold text-dark mb-0">Clientes Bloqueados / Suspendidos</h2>
            <small className="text-muted fw-semibold">Clientes desafiliados o con acceso restringido que pueden rehabilitarse</small>
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
          <span className="badge rounded-pill px-3 py-1.5 fw-bold" style={{ backgroundColor: '#F0F2F5', color: '#4B5563' }}>
            {hasActiveFilters ? `${filteredClients.length} de ${clientesBloqueadosList.length} Bloqueados` : `${clientesBloqueadosList.length} Bloqueados`}
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
              className="form-select stitch-filter-select w-100"
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

      {/* Tabla Expandida al 100% con Dropdown que se sobrepone a todo */}
      <div className="table-card-meta mb-3">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0 table-meta">
            <thead>
              <tr>
                <th style={{ width: '45px' }}>#</th>
                <th>RUC / Empresa</th>
                <th>Contacto</th>
                <th>Email</th>
                <th>Plan</th>
                <th>Estado</th>
                <th className="text-center" style={{ width: '130px' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-muted py-5 fw-semibold">
                    {hasActiveFilters
                      ? 'No se encontraron clientes bloqueados con los filtros aplicados.'
                      : 'No hay clientes en estado bloqueado.'}
                  </td>
                </tr>
              ) : (
                visibleClients.map((c, idx) => {
                  const phone = c.telefono || c.telefonoPersonal;
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
                              backgroundColor: '#F0F2F5',
                              color: '#4B5563',
                              fontSize: '0.78rem',
                              border: '1px solid #E4E6EB',
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
                        <span className="cell-title">{c.email || '—'}</span>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-1.5 flex-wrap">
                          <span className="badge-tag badge-plan-tag">
                            {c.planContratado || 'Plan'}
                          </span>
                          <span
                            className={`badge-tag ${c.tipoSuscripcion === 'ANUAL' ? 'badge-sub-anual' : 'badge-sub-mensual'}`}
                          >
                            {c.tipoSuscripcion || 'MENSUAL'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="badge-fb badge-fb-secondary">
                          <span className="badge-dot badge-dot-neutral" />
                          BLOQUEADO
                        </span>
                      </td>
                      <td className="text-center position-relative">
                        <div className="table-action-floating-container">
                          <button
                            type="button"
                            onClick={() => setOpenActionId(isActionOpen ? null : c.id)}
                            className="btn-meta-action btn-meta-action-secondary shadow-xs"
                            title="Opciones de desbloqueo o eliminación"
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
                                  className="table-action-item item-success"
                                  onClick={() => {
                                    setOpenActionId(null);
                                    const ok = window.confirm(
                                      `¿Habilitar acceso para ${c.razonSocial}? Pasará a VENCIDO para gestionar renovación o cambio de plan.`
                                    );
                                    if (ok) handleDevolverAcceso(c);
                                  }}
                                >
                                  <CheckCircle size={15} />
                                  <span>Habilitar Accesos</span>
                                </button>
                                <button
                                  type="button"
                                  className="table-action-item item-danger"
                                  onClick={() => {
                                    setOpenActionId(null);
                                    setDeletingClient(c);
                                  }}
                                >
                                  <Trash2 size={15} />
                                  <span>Eliminar Registro</span>
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
    </div>
  );
}
