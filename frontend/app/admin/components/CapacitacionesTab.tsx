'use client';

import React, { useState } from 'react';
import { GraduationCap, CheckCircle, Calendar, Search, X } from 'lucide-react';
import { Client } from './ClientesTodosTab';
import PaginationControls from './PaginationControls';
import { TableActionDropdown } from './TableActionDropdown';
import { parseLocalDate, formatDatePeru as libFormatDatePeru } from '@/lib/billing';

interface CapacitacionesTabProps {
  clients?: Client[];
  clientesCapacitacionPendienteList?: Client[];
  formatDatePeru?: (dateStr?: string | null) => string;
  setTrainingClient: (client: Client) => void;
  setTrainingDateInput?: (v: string) => void;
}

export default function CapacitacionesTab({
  clients = [],
  clientesCapacitacionPendienteList,
  formatDatePeru,
  setTrainingClient,
  setTrainingDateInput,
}: CapacitacionesTabProps) {
  const [openActionId, setOpenActionId] = React.useState<string | number | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [estadoFilter, setEstadoFilter] = useState<string>('');

  const targetList: Client[] = React.useMemo(() => {
    const list = clients.filter(
      (c) =>
        c.estadoCuenta === 'POR_CAPACITAR' ||
        c.estadoCuenta === 'HABILITADO' ||
        c.estadoCapacitacion === 'PENDIENTE' ||
        c.fechaCapacitacion
    );

    return [...list].sort((a, b) => {
      const isCapA = Boolean(
        a.fechaCapacitacion ||
        a.estadoCapacitacion === 'COMPLETADO' ||
        a.estadoCapacitacion === 'COMPLETADA' ||
        (a.estadoCuenta === 'HABILITADO' && a.fechaCapacitacion)
      );
      const isCapB = Boolean(
        b.fechaCapacitacion ||
        b.estadoCapacitacion === 'COMPLETADO' ||
        b.estadoCapacitacion === 'COMPLETADA' ||
        (b.estadoCuenta === 'HABILITADO' && b.fechaCapacitacion)
      );

      // Pendientes de capacitar van primero
      if (!isCapA && isCapB) return -1;
      if (isCapA && !isCapB) return 1;

      // Si ambos tienen el mismo estado, ordenar por fecha de registro descendente
      const dateA = parseLocalDate(a.fechaRegistro || a.fechaCreacion)?.getTime() || 0;
      const dateB = parseLocalDate(b.fechaRegistro || b.fechaCreacion)?.getTime() || 0;
      return dateB - dateA;
    });
  }, [clients]);

  const filteredList: Client[] = React.useMemo(() => {
    let list = targetList;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter((c) => {
        const matchRuc = c.ruc?.toLowerCase().includes(q);
        const matchRazon = c.razonSocial?.toLowerCase().includes(q);
        const matchComercial = c.nombreComercial?.toLowerCase().includes(q);
        const matchTel = c.telefono?.toLowerCase().includes(q) || c.telefonoPersonal?.toLowerCase().includes(q);
        const matchVendedor = c.vendedor?.toLowerCase().includes(q);
        const matchPlan = c.planContratado?.toLowerCase().includes(q);
        return matchRuc || matchRazon || matchComercial || matchTel || matchVendedor || matchPlan;
      });
    }

    if (estadoFilter === 'CAPACITADO') {
      list = list.filter((c) => Boolean(
        c.fechaCapacitacion ||
        c.estadoCapacitacion === 'COMPLETADO' ||
        c.estadoCapacitacion === 'COMPLETADA' ||
        (c.estadoCuenta === 'HABILITADO' && c.fechaCapacitacion)
      ));
    } else if (estadoFilter === 'PENDIENTE') {
      list = list.filter((c) => !Boolean(
        c.fechaCapacitacion ||
        c.estadoCapacitacion === 'COMPLETADO' ||
        c.estadoCapacitacion === 'COMPLETADA' ||
        (c.estadoCuenta === 'HABILITADO' && c.fechaCapacitacion)
      ));
    }

    return list;
  }, [targetList, searchTerm, estadoFilter]);

  const pageSize = 10;
  const [currentPage, setCurrentPage] = React.useState(1);
  const totalPages = Math.max(1, Math.ceil(filteredList.length / pageSize));
  const visibleClients = React.useMemo(
    () => filteredList.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [filteredList, currentPage]
  );

  React.useEffect(() => {
    setCurrentPage(1);
  }, [filteredList.length, searchTerm, estadoFilter]);

  React.useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const formatPeruDate = (dateStr?: string | null): string => {
    return libFormatDatePeru(dateStr);
  };

  return (
    <div className="w-100 admin-module admin-module--training">
      <section className="admin-data-panel" aria-label="Gestión de capacitaciones">
      {/* Encabezado con Icono Moderno y Badge */}
      <div className="admin-module-heading d-flex justify-content-between align-items-center flex-wrap gap-3">
        <div className="d-flex align-items-center gap-3">
          <div className="section-header-icon section-header-icon-indigo">
            <GraduationCap size={20} strokeWidth={2.2} />
          </div>
          <div>
            <h2 className="fw-bold text-dark mb-0 fs-5" style={{ letterSpacing: '-0.3px' }}>Gestión de Capacitaciones</h2>
            <small className="text-muted fw-semibold">Monitoreo y asignación de fechas de capacitación real</small>
          </div>
        </div>
        <span className="admin-badge-count-pill admin-badge-count-pill--primary">
          {filteredList.length} Registros
        </span>
      </div>

      {/* Buscador de Capacitaciones */}
      <div className="stitch-filter-toolbar mb-3">
        <div className="row g-2 align-items-center">
          <div className="col-lg-6 col-md-7 col-12">
            <div className="stitch-filter-search position-relative">
              <Search size={15} />
              <input
                type="text"
                className="form-control stitch-filter-input pe-5"
                placeholder="Buscar capacitación por RUC, Empresa, Teléfono, Asesor, Plan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  type="button"
                  className="btn-circle-meta position-absolute end-0 top-50 translate-middle-y me-2 border-0 bg-transparent text-muted"
                  style={{ width: '24px', height: '24px' }}
                  onClick={() => setSearchTerm('')}
                  title="Limpiar búsqueda"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>
          <div className="col-lg-3 col-md-5 col-8">
            <select
              className="form-select stitch-filter-select"
              value={estadoFilter}
              onChange={(e) => setEstadoFilter(e.target.value)}
            >
              <option value="">Capacitación: Todos</option>
              <option value="PENDIENTE">Pendientes de Capacitar</option>
              <option value="CAPACITADO">Capacitados Realizados</option>
            </select>
          </div>
          <div className="col-lg-3 col-12 d-flex justify-content-lg-end">
            {(searchTerm || estadoFilter) && (
              <button
                type="button"
                className="btn-meta-action btn-meta-action-secondary"
                onClick={() => {
                  setSearchTerm('');
                  setEstadoFilter('');
                }}
              >
                <X size={13} />
                <span>Limpiar ({filteredList.length})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabla Expandida al 100% con Dropdown de Acciones */}
      <div className="table-card-meta">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0 table-meta">
            <thead>
              <tr>
                <th style={{ width: '45px' }}>#</th>
                <th>RUC / Empresa</th>
                <th>Contacto</th>
                <th>Plan / Suscripción</th>
                <th>Estado Capacitación</th>
                <th>Fecha Programada</th>
                <th className="text-center" style={{ width: '130px' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-muted py-5 fw-semibold">
                    {searchTerm || estadoFilter
                      ? 'No se encontraron empresas que coincidan con la búsqueda o filtro seleccionado.'
                      : 'No hay empresas para capacitación en este momento.'}
                  </td>
                </tr>
              ) : (
                visibleClients.map((c: Client, idx: number) => {
                  const isCapacitado = Boolean(
                    c.fechaCapacitacion ||
                      c.estadoCapacitacion === 'COMPLETADO' ||
                      c.estadoCapacitacion === 'COMPLETADA' ||
                      (c.estadoCuenta === 'HABILITADO' && c.fechaCapacitacion)
                  );
                  const phone = c.telefono || c.telefonoPersonal;
                  const initial = (c.razonSocial || 'C').charAt(0).toUpperCase();
                  const isActionOpen = openActionId === c.id;

                  return (
                    <tr key={c.id}>
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
                              backgroundColor: '#EEF2FF',
                              color: '#4F46E5',
                              fontSize: '0.78rem',
                              border: '1px solid #C7D2FE',
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
                        {isCapacitado ? (
                          <span className="badge-fb badge-fb-success">
                            <span className="badge-dot badge-dot-success" />
                            Capacitado
                          </span>
                        ) : (
                          <span className="badge-fb badge-fb-warning">
                            <span className="badge-dot badge-dot-warning" />
                            Pendiente
                          </span>
                        )}
                      </td>
                      <td>
                        {c.fechaCapacitacion ? (
                          <span className="badge-tag badge-plazo-soon">
                            <span className="badge-dot badge-dot-info" />
                            {formatPeruDate(c.fechaCapacitacion)}
                          </span>
                        ) : (
                          <span className="cell-subtext">Sin programar</span>
                        )}
                      </td>
                      <td className="text-center">
                        <TableActionDropdown
                          isOpen={isActionOpen}
                          onToggle={() => setOpenActionId(isActionOpen ? null : c.id)}
                          onClose={() => setOpenActionId(null)}
                          buttonTitle="Opciones de capacitación"
                          menuWidth={210}
                        >
                          <button
                            type="button"
                            className="table-action-item item-primary"
                            onClick={() => {
                              setOpenActionId(null);
                              setTrainingClient(c);
                            }}
                          >
                            <Calendar size={15} />
                            <span>{isCapacitado ? 'Reagendar Capacitación' : 'Programar Capacitación'}</span>
                          </button>
                        </TableActionDropdown>
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
        totalItems={filteredList.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
      />
      </section>
    </div>
  );
}
