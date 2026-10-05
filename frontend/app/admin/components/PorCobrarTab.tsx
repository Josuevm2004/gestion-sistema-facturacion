'use client';

import React from 'react';
import { CreditCard, CheckCircle, X } from 'lucide-react';
import { Client } from './ClientesTodosTab';
import PaginationControls from './PaginationControls';
import { TableActionDropdown } from './TableActionDropdown';

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
  const [openActionId, setOpenActionId] = React.useState<string | number | null>(null);

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
    <div className="w-100 admin-module admin-module--receivables">
      <section className="admin-data-panel" aria-label="Clientes por cobrar">
      {/* Encabezado con Icono Moderno y Badge */}
      <div className="admin-module-heading d-flex justify-content-between align-items-center flex-wrap gap-3">
        <div className="d-flex align-items-center gap-3">
          <div className="section-header-icon section-header-icon-warning">
            <CreditCard size={20} strokeWidth={2.2} />
          </div>
          <div>
            <h2 className="fw-bold text-dark mb-0 fs-5" style={{ letterSpacing: '-0.3px' }}>Clientes Por Cobrar</h2>
            <small className="text-muted fw-semibold">Clientes derivados del formulario web en espera de pago y confirmación</small>
          </div>
        </div>
        <span className="admin-badge-count-pill admin-badge-count-pill--warning">
          {clientesPorCobrarList.length} Por Cobrar
        </span>
      </div>

      {/* Tabla Expandida al 100% con Dropdown */}
      <div className="table-card-meta">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0 table-meta">
            <thead>
              <tr>
                <th style={{ width: '45px' }}>#</th>
                <th>RUC / Empresa</th>
                <th>Contacto</th>
                <th>Plan / Suscripción</th>
                <th>Monto a Cobrar</th>
                <th>Estado Cuenta</th>
                <th className="text-center" style={{ width: '130px' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clientesPorCobrarList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-muted py-5 fw-semibold">
                    No hay registros pendientes por cobrar en este momento.
                  </td>
                </tr>
              ) : (
                visibleClients.map((c, idx) => {
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
                              backgroundColor: '#FEF3C7',
                              color: '#D97706',
                              fontSize: '0.78rem',
                              border: '1px solid #FDE68A',
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
                        <span className="cell-amount text-primary">
                          S/ {Number(c.montoSiguienteCobro ?? c.montoMensual).toFixed(2)}
                        </span>
                      </td>
                      <td>
                        <span className="badge-fb badge-fb-warning">
                          <span className="badge-dot badge-dot-warning" />
                          POR COBRAR
                        </span>
                      </td>
                      <td className="text-center">
                        <TableActionDropdown
                          isOpen={isActionOpen}
                          onToggle={() => setOpenActionId(isActionOpen ? null : c.id)}
                          onClose={() => setOpenActionId(null)}
                          buttonTitle="Opciones de cobro y plan"
                          menuWidth={210}
                        >
                          <button
                            type="button"
                            className="table-action-item item-success"
                            onClick={() => {
                              setOpenActionId(null);
                              handleRegisterPayment(c);
                            }}
                          >
                            <CheckCircle size={15} />
                            <span>Confirmar Pago</span>
                          </button>
                          <button
                            type="button"
                            className="table-action-item item-danger"
                            onClick={() => {
                              setOpenActionId(null);
                              const confirmCancel = window.confirm(
                                `¿Confirmas la cancelación del plan para ${c.razonSocial}? Pasará a la sección de Bloqueados.`
                              );
                              if (confirmCancel) {
                                handleEstadoCuentaChange(c, 'BLOQUEADO');
                              }
                            }}
                          >
                            <X size={15} />
                            <span>Cancelar Plan</span>
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
        totalItems={clientesPorCobrarList.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
      />
      </section>
    </div>
  );
}
