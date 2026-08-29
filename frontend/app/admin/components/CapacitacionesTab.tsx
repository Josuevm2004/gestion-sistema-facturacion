'use client';

import React from 'react';
import { GraduationCap, CheckCircle, Calendar } from 'lucide-react';
import { Client } from './ClientesTodosTab';
import PaginationControls from './PaginationControls';

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
  // Mostrar empresas que requieren capacitación o que ya han sido capacitadas
  // ORDENADO: Primero los que faltan capacitar, y después los que ya están capacitados
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
      const dateA = new Date(a.fechaRegistro || a.fechaCreacion || 0).getTime();
      const dateB = new Date(b.fechaRegistro || b.fechaCreacion || 0).getTime();
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
    if (formatDatePeru) return formatDatePeru(dateStr);
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div className="custom-card p-4 shadow-sm">
      <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
        <div className="d-flex align-items-center gap-2">
          <div className="p-2 bg-info bg-opacity-10 text-info rounded-3">
            <GraduationCap size={20} />
          </div>
          <div>
            <h2 className="h6 fw-bold text-dark mb-0">Gestión de Capacitaciones</h2>
            <small className="text-muted">Monitoreo y asignación de fechas de capacitación real</small>
          </div>
        </div>
        <span className="badge bg-primary text-white rounded-pill px-3 py-1.5 fw-bold">
          {targetList.length} Registros
        </span>
      </div>

      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead>
            <tr>
              <th style={{ width: '50px' }}>#</th>
              <th>RUC / Empresa</th>
              <th>Contacto WhatsApp</th>
              <th>Plan / Suscripción</th>
              <th>Estado Capacitación</th>
              <th>Fecha Programada</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {targetList.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-muted py-4 fw-semibold">
                  No hay empresas para capacitación en este momento.
                </td>
              </tr>
            ) : (
              visibleClients.map((c: Client, idx: number) => {
                const isCapacitado = Boolean(c.fechaCapacitacion || c.estadoCapacitacion === 'COMPLETADO' || c.estadoCapacitacion === 'COMPLETADA' || (c.estadoCuenta === 'HABILITADO' && c.fechaCapacitacion));

                return (
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
                      <div className="d-flex align-items-center gap-1">
                        <span className="badge bg-light text-dark border fw-bold">{c.planContratado}</span>
                        <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25">{c.tipoSuscripcion || 'MENSUAL'}</span>
                      </div>
                    </td>
                    <td>
                      {isCapacitado ? (
                        <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25">
                          Capacitado
                        </span>
                      ) : (
                        <span className="badge bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25">
                          Pendiente de Capacitación
                        </span>
                      )}
                    </td>
                    <td>
                      {c.fechaCapacitacion ? (
                        <span className="badge bg-light text-primary border border-primary border-opacity-25 fw-bold">
                          {formatPeruDate(c.fechaCapacitacion)}
                        </span>
                      ) : (
                        <span className="text-muted small fw-semibold">Sin programar</span>
                      )}
                    </td>
                    <td>
                      {!isCapacitado ? (
                        <button
                          onClick={() => setTrainingClient(c)}
                          className="btn btn-sm btn-primary px-3 py-1.5 fw-bold shadow-sm d-inline-flex align-items-center gap-1.5"
                        >
                          <Calendar size={14} />
                          <span>Programar Capacitación</span>
                        </button>
                      ) : (
                        <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-3 py-1.5 fw-bold d-inline-flex align-items-center gap-1">
                          <CheckCircle size={14} />
                          <span>Capacitación Realizada</span>
                        </span>
                      )}
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
        totalItems={targetList.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
