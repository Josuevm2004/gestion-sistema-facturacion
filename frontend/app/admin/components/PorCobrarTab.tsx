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
              <th>Acciones Comerciales</th>
            </tr>
          </thead>
          <tbody>
            {clientesPorCobrarList.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center text-muted py-4 fw-semibold">
                  ✨ No hay registros pendientes por cobrar en este momento.
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
                    <div className="d-flex align-items-center gap-1">
                      <span className="badge bg-light text-dark border fw-bold">{c.planContratado}</span>
                      <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25">{c.tipoSuscripcion || 'MENSUAL'}</span>
                    </div>
                  </td>
                  <td className="fw-bold text-primary fs-6">S/ {Number(c.montoSiguienteCobro ?? c.montoMensual).toFixed(2)}</td>
                  <td>
                    <span className="badge bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25">
                      ⏳ POR COBRAR
                    </span>
                  </td>
                  <td>
                    <div className="d-flex gap-2">
                      <button
                        onClick={() => handleRegisterPayment(c)}
                        className="btn btn-sm btn-success px-3 py-1.5 fw-bold shadow-sm d-inline-flex align-items-center gap-1.5"
                      >
                        <CheckCircle size={14} />
                        <span>Confirmar Pago</span>
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
                        className="btn btn-sm btn-outline-danger px-3 py-1.5 fw-bold d-inline-flex align-items-center gap-1.5"
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
