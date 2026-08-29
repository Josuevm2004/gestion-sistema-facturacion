'use client';

import React from 'react';
import { CreditCard, CheckCircle, X } from 'lucide-react';
import { Client } from './ClientesTodosTab';
import PaginationControls from './PaginationControls';

interface PorCobrarTabProps {
  clientesPorCobrarList: Client[];
  handleRegisterPayment: (client: Client) => void;
  handleEstadoCuentaChange: (client: Client, nuevoEstado: string) => void;
}

export default function PorCobrarTab({
  clientesPorCobrarList,
  handleRegisterPayment,
  handleEstadoCuentaChange,
}: PorCobrarTabProps) {
  const pageSize = 10;
  const [currentPage, setCurrentPage] = React.useState(1);
  const totalPages = Math.max(1, Math.ceil(clientesPorCobrarList.length / pageSize));
  const visibleClients = React.useMemo(
    () => clientesPorCobrarList.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [clientesPorCobrarList, currentPage]
  );

  React.useEffect(() => {
    setCurrentPage(1);
  }, [clientesPorCobrarList.length]);

  React.useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  return (
    <div className="custom-card p-4 shadow-sm">
      <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
        <div className="d-flex align-items-center gap-2">
          <div className="p-2 bg-warning bg-opacity-10 text-warning rounded-3">
            <CreditCard size={20} />
          </div>
          <div>
            <h2 className="h6 fw-bold text-dark mb-0">Clientes Por Cobrar</h2>
            <small className="text-muted">Clientes derivados del formulario web en espera de pago y confirmación</small>
          </div>
        </div>
        <span className="badge bg-warning text-dark rounded-pill px-3 py-1.5 fw-bold">
          {clientesPorCobrarList.length} Por Cobrar
        </span>
      </div>

      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead>
            <tr>
              <th>RUC / Empresa</th>
              <th>WhatsApp</th>
              <th>Plan / Suscripción</th>
              <th>Monto a Cobrar</th>
              <th>Estado Cuenta</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clientesPorCobrarList.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center text-muted py-3">
                  No hay registros pendientes por cobrar.
                </td>
              </tr>
            ) : (
              visibleClients.map((c) => (
                <tr key={c.id}>
                  <td>
                    <strong className="text-dark d-block">{c.razonSocial}</strong>
                    <span className="small text-muted">{c.ruc}</span>
                  </td>
                  <td>
                    <span className="fw-semibold">{c.telefono}</span>
                  </td>
                  <td>
                    <span className="badge bg-light text-dark me-1">{c.planContratado}</span>
                    <span className="badge bg-info text-dark">{c.tipoSuscripcion || 'MENSUAL'}</span>
                  </td>
                  <td className="fw-bold text-primary">S/ {Number(c.montoSiguienteCobro ?? c.montoMensual).toFixed(2)}</td>
                  <td>
                    <span className="badge bg-warning text-dark">POR_COBRAR</span>
                  </td>
                  <td>
                    <div className="d-flex gap-2">
                      <button
                        onClick={() => handleRegisterPayment(c)}
                        className="btn btn-sm btn-success rounded-pill px-3 py-1.5 fw-semibold shadow-sm d-inline-flex align-items-center gap-1"
                      >
                        <CheckCircle size={14} />
                        <span>Marcar como Pagado</span>
                      </button>
                      <button
                        onClick={() => {
                          const confirmCancel = window.confirm(
                            `¿Confirmas la cancelación del plan para ${c.razonSocial}? Pasará a la sección de Bloqueados.`
                          );
                          if (confirmCancel) {
                            handleEstadoCuentaChange(c, 'BLOQUEADO');
                          }
                        }}
                        className="btn btn-sm btn-outline-danger rounded-pill px-3 py-1.5 fw-semibold d-inline-flex align-items-center gap-1"
                      >
                        <X size={14} />
                        <span>Cancelar Plan</span>
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
        totalItems={clientesPorCobrarList.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
