'use client';

import React from 'react';
import { AlertCircle, RefreshCw, Settings, X, Unlock, ShieldAlert } from 'lucide-react';
import { Client } from './ClientesTodosTab';
import PaginationControls from './PaginationControls';

interface VencidosTabProps {
  clientesVencidosList: Client[];
  handleRenovarPlan: (client: Client, nuevoPlan?: string, nuevoTipo?: string) => any;
  setCambioPlanClient: (client: Client) => void;
  setCambioPlanSeleccionado: (plan: string) => void;
  setCambioPlanTipo?: (tipo: string) => void;
  handleEstadoCuentaChange?: (client: Client, nuevoEstado: string) => void;
  handleDevolverAcceso?: (client: Client) => void;
}

export default function VencidosTab({
  clientesVencidosList,
  handleRenovarPlan,
  setCambioPlanClient,
  setCambioPlanSeleccionado,
  setCambioPlanTipo,
  handleEstadoCuentaChange,
  handleDevolverAcceso,
}: VencidosTabProps) {
  const pageSize = 10;
  const [currentPage, setCurrentPage] = React.useState(1);
  const totalPages = Math.max(1, Math.ceil(clientesVencidosList.length / pageSize));
  const visibleClients = React.useMemo(
    () => clientesVencidosList.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [clientesVencidosList, currentPage]
  );

  React.useEffect(() => {
    setCurrentPage(1);
  }, [clientesVencidosList.length]);

  React.useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  return (
    <div className="custom-card p-4 border-danger shadow-sm">
      <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
        <div className="d-flex align-items-center gap-2">
          <div className="p-2 bg-danger bg-opacity-10 text-danger rounded-3">
            <AlertCircle size={20} />
          </div>
          <div>
            <h2 className="h6 fw-bold text-danger mb-0">Clientes Vencidos</h2>
            <small className="text-muted">Gestión comercial: Renovación, Cambio de Plan o Bloqueo</small>
          </div>
        </div>
        <span className="badge bg-danger text-white rounded-pill px-3 py-1.5 fw-bold">
          {clientesVencidosList.length} Registros
        </span>
      </div>

      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead>
            <tr>
              <th>RUC / Empresa</th>
              <th>WhatsApp</th>
              <th>Plan Actual</th>
              <th>Estado</th>
              <th>Monto</th>
              <th>Venció / Inicio</th>
              <th>Acciones Comerciales</th>
            </tr>
          </thead>
          <tbody>
            {clientesVencidosList.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-muted py-3">
                  No hay clientes vencidos.
                </td>
              </tr>
            ) : (
              visibleClients.map((c) => {
                const vencDate = c.fechaVencimientoMensual ? new Date(c.fechaVencimientoMensual) : null;
                const isBloqueado = c.estadoCuenta === 'BLOQUEADO';

                return (
                  <tr key={c.id} className={isBloqueado ? 'bg-light bg-opacity-50' : ''}>
                    <td>
                      <strong className="text-dark d-block">{c.razonSocial}</strong>
                      <span className="small text-muted">{c.ruc}</span>
                    </td>
                    <td>
                      <span className="fw-semibold">{c.telefono}</span>
                    </td>
                    <td>
                      <span className="badge bg-light text-dark me-1">{c.planContratado}</span>
                      <span className="badge bg-secondary">{c.tipoSuscripcion || 'MENSUAL'}</span>
                    </td>
                    <td>
                      {isBloqueado ? (
                        <span className="badge bg-dark text-white d-inline-flex align-items-center gap-1">
                          <ShieldAlert size={12} /> Bloqueado
                        </span>
                      ) : (
                        <span className="badge bg-danger text-white">Vencido</span>
                      )}
                    </td>
                    <td className="fw-bold text-danger">S/ {c.montoMensual?.toFixed(2)}</td>
                    <td>
                      {vencDate ? (
                        <span className={`badge ${isBloqueado ? 'bg-secondary' : 'bg-danger'}`}>
                          {vencDate.toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="badge bg-secondary">Sin fecha</span>
                      )}
                    </td>
                    <td>
                      <div className="d-flex gap-1.5 flex-wrap">
                        {!isBloqueado ? (
                          <>
                            <button
                              onClick={() => {
                                const ok = window.confirm(
                                  `¿Renovar plan de ${c.razonSocial}? Se registrará una nueva venta de RENOVACIÓN.`
                                );
                                if (ok) handleRenovarPlan(c);
                              }}
                              className="btn btn-sm btn-info text-white rounded-pill px-3 py-1 fw-semibold shadow-sm d-inline-flex align-items-center gap-1"
                            >
                              <RefreshCw size={13} />
                              <span>Renovación</span>
                            </button>
                            <button
                              onClick={() => {
                                setCambioPlanClient(c);
                                setCambioPlanSeleccionado(c.planContratado);
                                if (setCambioPlanTipo) setCambioPlanTipo(c.tipoSuscripcion || 'MENSUAL');
                              }}
                              className="btn btn-sm btn-warning text-dark rounded-pill px-3 py-1 fw-semibold shadow-sm d-inline-flex align-items-center gap-1"
                            >
                              <Settings size={13} />
                              <span>Cambio de Plan</span>
                            </button>
                            <button
                              onClick={() => {
                                const ok = window.confirm(
                                  `¿Bloquear cliente ${c.razonSocial}? Su acceso se suspenderá.`
                                );
                                if (ok && handleEstadoCuentaChange) handleEstadoCuentaChange(c, 'BLOQUEADO');
                              }}
                              className="btn btn-sm btn-outline-danger rounded-pill px-3 py-1 fw-semibold d-inline-flex align-items-center gap-1"
                            >
                              <X size={13} />
                              <span>Bloquear</span>
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => {
                              const ok = window.confirm('Reactivar a ' + c.razonSocial + '? Se registrara una renovacion con prorrateo si corresponde.');
                              if (ok) handleRenovarPlan(c);
                            }}
                            className="btn btn-sm btn-success text-white rounded-pill px-3 py-1 fw-semibold shadow-sm d-inline-flex align-items-center gap-1"
                          >
                            <Unlock size={13} />
                            <span>Reactivar</span>
                          </button>
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
      <PaginationControls
        currentPage={currentPage}
        totalItems={clientesVencidosList.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
