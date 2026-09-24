'use client';

import React from 'react';
import { GraduationCap, CheckCircle, Calendar } from 'lucide-react';
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
    <div className="card rounded-4 border bg-white p-4 shadow-sm">
      <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
        <div className="d-flex align-items-center gap-3">
          <div className="d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#E7F3FF', color: '#0866FF' }}>
            <GraduationCap size={20} />
          </div>
          <div>
            <h2 className="h6 fw-bold text-dark mb-0">Gestión de Capacitaciones</h2>
            <small className="text-muted">Monitoreo y asignación de fechas de capacitación real</small>
          </div>
        </div>
        <span className="badge rounded-pill px-3 py-1.5 fw-bold" style={{ backgroundColor: '#E7F3FF', color: '#0866FF' }}>
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
                      <div className="d-flex align-items-center gap-1.5">
                        <span className="badge bg-light text-dark border rounded-pill px-2.5 py-1 fw-bold">{c.planContratado}</span>
                        <span className="badge rounded-pill px-2.5 py-1 fw-bold" style={{ backgroundColor: '#E7F3FF', color: '#0866FF' }}>{c.tipoSuscripcion || 'MENSUAL'}</span>
                      </div>
                    </td>
                    <td>
                      {isCapacitado ? (
                        <span className="badge rounded-pill px-2.5 py-1 fw-bold" style={{ backgroundColor: '#DEF7EC', color: '#03543F' }}>
                          Capacitado
                        </span>
                      ) : (
                        <span className="badge rounded-pill px-2.5 py-1 fw-bold" style={{ backgroundColor: '#FEF3C7', color: '#B45309' }}>
                          Pendiente de Capacitación
                        </span>
                      )}
                    </td>
                    <td>
                      {c.fechaCapacitacion ? (
                        <span className="badge bg-light border rounded-pill px-2.5 py-1 fw-bold" style={{ color: '#0866FF', borderColor: '#D0E2FF' }}>
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
                          className="btn btn-sm text-white rounded-pill px-3 py-1.5 fw-bold shadow-sm d-inline-flex align-items-center gap-1.5"
                          style={{ backgroundColor: '#0866FF', borderColor: '#0866FF' }}
                        >
                          <Calendar size={14} />
                          <span>Programar Capacitación</span>
                        </button>
                      ) : (
                        <span className="badge rounded-pill px-3 py-1.5 fw-bold d-inline-flex align-items-center gap-1" style={{ backgroundColor: '#DEF7EC', color: '#03543F' }}>
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
