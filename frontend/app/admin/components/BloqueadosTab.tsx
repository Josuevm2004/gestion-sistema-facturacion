'use client';

import React from 'react';
import { ShieldCheck, CheckCircle, Trash2 } from 'lucide-react';
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
  handleEstadoCuentaChange,
  handleDevolverAcceso,
  setDeletingClient,
}: BloqueadosTabProps) {
  const pageSize = 10;
  const [currentPage, setCurrentPage] = React.useState(1);
  const totalPages = Math.max(1, Math.ceil(clientesBloqueadosList.length / pageSize));
  const visibleClients = React.useMemo(
    () => clientesBloqueadosList.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [clientesBloqueadosList, currentPage]
  );

  React.useEffect(() => {
    setCurrentPage(1);
  }, [clientesBloqueadosList.length]);

  React.useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

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
              <th>Acciones Comerciales</th>
            </tr>
          </thead>
          <tbody>
            {clientesBloqueadosList.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center text-muted py-4 fw-semibold">
                  No hay clientes en estado bloqueado.
                </td>
              </tr>
            ) : (
              visibleClients.map((c) => (
                <tr key={c.id}>
                  <td>
                    <strong className="text-dark d-block fs-6">{c.razonSocial}</strong>
                    <span className="small text-muted fw-semibold">RUC: {c.ruc}</span>
                  </td>
                  <td>
                    <span className="fw-bold text-dark">{c.telefono}</span>
                  </td>
                  <td>
                    <span className="text-dark">{c.email || 'N/A'}</span>
                  </td>
                  <td>
                    <span className="badge bg-light text-dark border fw-bold">{c.planContratado}</span>
                  </td>
                  <td>
                    <span className="badge bg-secondary text-white">BLOQUEADO</span>
                  </td>
                  <td>
                    <div className="d-flex gap-2">
                      <button
                        onClick={() => {
                          const ok = window.confirm(
                            `¿Habilitar acceso para ${c.razonSocial}? Pasará a VENCIDO para gestionar renovación o cambio de plan.`
                          );
                          if (ok) handleDevolverAcceso(c);
                        }}
                        className="btn btn-sm btn-success px-3 py-1.5 fw-bold shadow-sm d-inline-flex align-items-center gap-1.5"
                      >
                        <CheckCircle size={14} />
                        <span>Habilitar Accesos</span>
                      </button>
                      <button
                        onClick={() => setDeletingClient(c)}
                        className="btn btn-sm btn-outline-danger px-3 py-1.5 fw-bold d-inline-flex align-items-center gap-1.5"
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
        totalItems={clientesBloqueadosList.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
