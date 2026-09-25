'use client';

import React from 'react';
import { GraduationCap, CheckCircle, Calendar, ChevronDown } from 'lucide-react';
import { Client } from './ClientesTodosTab';
import PaginationControls from './PaginationControls';
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

  const pageSize = 10;
  const [currentPage, setCurrentPage] = React.useState(1);
  const totalPages = Math.max(1, Math.ceil(targetList.length / pageSize));
  const visibleClients = React.useMemo(
    () => targetList.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [targetList, currentPage]
  );

  React.useEffect(() => {
    setCurrentPage(1);
  }, [targetList.length]);

  React.useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const formatPeruDate = (dateStr?: string | null): string => {
    return libFormatDatePeru(dateStr);
  };

  return (
    <div className="w-100">
      {/* Encabezado con Icono Moderno y Badge */}
      <div className="d-flex justify-content-between align-items-center mb-3 p-3 bg-white rounded-3 border shadow-xs flex-wrap gap-2">
        <div className="d-flex align-items-center gap-3">
          <div className="section-header-icon section-header-icon-indigo">
            <GraduationCap size={22} strokeWidth={2.2} />
          </div>
          <div>
            <h2 className="h6 fw-bold text-dark mb-0">Gestión de Capacitaciones</h2>
            <small className="text-muted fw-semibold">Monitoreo y asignación de fechas de capacitación real</small>
          </div>
        </div>
        <span className="badge rounded-pill px-3 py-1.5 fw-bold" style={{ backgroundColor: '#EEF2FF', color: '#4F46E5', border: '1px solid #C7D2FE' }}>
          {targetList.length} Registros
        </span>
      </div>

      {/* Tabla Expandida al 100% con Dropdown de Acciones */}
      <div className="table-card-meta mb-3">
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
              {targetList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-muted py-5 fw-semibold">
                    No hay empresas para capacitación en este momento.
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
                      <td className="text-center position-relative">
                        <div className="table-action-floating-container">
                          <button
                            type="button"
                            onClick={() => setOpenActionId(isActionOpen ? null : c.id)}
                            className="btn-meta-action btn-meta-action-primary shadow-xs"
                            title="Opciones de capacitación"
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
                                    setTrainingClient(c);
                                  }}
                                >
                                  <Calendar size={15} />
                                  <span>{isCapacitado ? 'Reagendar Capacitación' : 'Programar Capacitación'}</span>
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
        totalItems={targetList.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
