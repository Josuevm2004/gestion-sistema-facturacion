'use client';

import React from 'react';
import { GraduationCap, CheckCircle, Calendar } from 'lucide-react';
import { Client } from './ClientesTodosTab';

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
  const targetList: Client[] = clients.filter(
    (c) =>
      c.estadoCuenta === 'POR_CAPACITAR' ||
      c.estadoCuenta === 'HABILITADO' ||
      c.estadoCapacitacion === 'PENDIENTE' ||
      c.fechaCapacitacion
  );

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
              <th>RUC / Empresa</th>
              <th>Contacto</th>
              <th>Plan</th>
              <th>Estado Capacitación</th>
              <th>Fecha Capacitación</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {targetList.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center text-muted py-4">
                  No hay empresas para capacitación.
                </td>
              </tr>
            ) : (
              targetList.map((c: Client) => {
                const isCapacitado = Boolean(c.fechaCapacitacion || c.estadoCapacitacion === 'COMPLETADO' || c.estadoCapacitacion === 'COMPLETADA' || (c.estadoCuenta === 'HABILITADO' && c.fechaCapacitacion));

                return (
                  <tr key={c.id}>
                    <td>
                      <strong className="text-dark d-block">{c.razonSocial}</strong>
                      <span className="small text-muted">{c.ruc}</span>
                    </td>
                    <td>{c.telefono}</td>
                    <td>
                      <span className="badge bg-light text-dark me-1">{c.planContratado}</span>
                      <span className="badge bg-secondary">{c.tipoSuscripcion || 'MENSUAL'}</span>
                    </td>
                    <td>
                      {isCapacitado ? (
                        <span className="badge bg-success text-white">Capacitado</span>
                      ) : (
                        <span className="badge bg-warning text-dark">Pendiente de Capacitación</span>
                      )}
                    </td>
                    <td>
                      {c.fechaCapacitacion ? (
                        <span className="badge bg-info text-dark">{formatPeruDate(c.fechaCapacitacion)}</span>
                      ) : (
                        <span className="text-muted small">Sin programar</span>
                      )}
                    </td>
                    <td>
                      {!isCapacitado ? (
                        <button
                          onClick={() => setTrainingClient(c)}
                          className="btn btn-sm btn-primary rounded-pill px-3 py-1.5 fw-semibold shadow-sm d-inline-flex align-items-center gap-1"
                        >
                          <Calendar size={14} />
                          <span>Programar capacitación</span>
                        </button>
                      ) : (
                        <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 rounded-pill px-3 py-1.5 fw-semibold d-inline-flex align-items-center gap-1">
                          <CheckCircle size={14} />
                          <span>Ya capacitado</span>
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
    </div>
  );
}
