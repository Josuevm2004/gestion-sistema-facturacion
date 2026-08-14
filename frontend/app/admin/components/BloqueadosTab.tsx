'use client';

import React from 'react';
import { ShieldCheck, CheckCircle, Trash2 } from 'lucide-react';
import { Client } from './ClientesTodosTab';

interface BloqueadosTabProps {
  clientesBloqueadosList: Client[];
  handleEstadoCuentaChange: (client: Client, nuevoEstado: string) => void;
  handleRenovarPlan: (client: Client, nuevoPlan?: string, nuevoTipo?: string) => any;
  setDeletingClient: (client: Client) => void;
}

export default function BloqueadosTab({
  clientesBloqueadosList,
  handleEstadoCuentaChange,
  handleRenovarPlan,
  setDeletingClient,
}: BloqueadosTabProps) {
  return (
    <div className="custom-card p-4 shadow-sm">
      <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
        <div className="d-flex align-items-center gap-2">
          <div className="p-2 bg-secondary bg-opacity-10 text-secondary rounded-3">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h2 className="h6 fw-bold text-dark mb-0">Clientes Bloqueados / Suspendidos</h2>
            <small className="text-muted">Clientes desafiliados o con acceso restringido que pueden rehabilitarse</small>
          </div>
        </div>
        <span className="badge bg-secondary text-white rounded-pill px-3 py-1.5 fw-bold">
          {clientesBloqueadosList.length} Bloqueados
        </span>
      </div>

      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead>
            <tr>
              <th>RUC / Empresa</th>
              <th>Teléfono</th>
              <th>Email</th>
              <th>Plan</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clientesBloqueadosList.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center text-muted py-4">
                  No hay clientes en estado bloqueado.
                </td>
              </tr>
            ) : (
              clientesBloqueadosList.map((c) => (
                <tr key={c.id}>
                  <td>
                    <strong className="text-dark d-block">{c.razonSocial}</strong>
                    <span className="small text-muted">{c.ruc}</span>
                  </td>
                  <td>{c.telefono}</td>
                  <td>{c.email || 'N/A'}</td>
                  <td>
                    <span className="badge bg-light text-dark">{c.planContratado}</span>
                  </td>
                  <td>
                    <span className="badge bg-danger">BLOQUEADO</span>
                  </td>
                  <td>
                    <div className="d-flex gap-2">
                      <button
                        onClick={() => {
                          const ok = window.confirm(`Â¿Reactivar a ${c.razonSocial}? Se registrarÃ¡ una renovaciÃ³n con prorrateo si corresponde.`);
                          if (ok) handleRenovarPlan(c);
                        }}
                        className="btn btn-sm btn-success rounded-pill px-3 py-1.5 fw-semibold shadow-sm d-inline-flex align-items-center gap-1"
                      >
                        <CheckCircle size={14} />
                        <span>Habilitar Accesos</span>
                      </button>
                      <button
                        onClick={() => setDeletingClient(c)}
                        className="btn btn-sm btn-outline-danger rounded-pill px-3 py-1.5 fw-semibold d-inline-flex align-items-center gap-1"
                      >
                        <Trash2 size={14} />
                        <span>Eliminar Definitivamente</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
