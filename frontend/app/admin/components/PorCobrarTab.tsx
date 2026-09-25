'use client';

import React from 'react';
import { CreditCard, CheckCircle, X, Phone } from 'lucide-react';
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
    <div className="w-100">
      <div className="d-flex justify-content-between align-items-center mb-3 p-3 bg-white rounded-3 border shadow-xs">
        <div className="d-flex align-items-center gap-3">
          <div className="d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#FEF3C7', color: '#D97706' }}>
            <CreditCard size={20} />
          </div>
          <div>
            <h2 className="h6 fw-bold text-dark mb-0">Clientes Por Cobrar</h2>
            <small className="text-muted">Clientes derivados del formulario web en espera de pago y confirmación</small>
          </div>
        </div>
        <span className="badge rounded-pill px-3 py-1.5 fw-bold" style={{ backgroundColor: '#FEF3C7', color: '#B45309' }}>
          {clientesPorCobrarList.length} Por Cobrar
        </span>
      </div>

      <div className="table-card-meta mb-3">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0 table-meta">
          <thead>
            <tr>
              <th style={{ width: '45px' }}>#</th>
              <th>RUC / Empresa</th>
              <th>WhatsApp / Contacto</th>
              <th>Plan / Suscripción</th>
              <th>Monto a Cobrar</th>
              <th>Estado Cuenta</th>
              <th>Acciones Comerciales</th>
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
                const cleanPhone = phone ? phone.replace(/\D/g, '') : '';
                const initial = (c.razonSocial || 'C').charAt(0).toUpperCase();

                return (
                  <tr key={c.id}>
                    <td className="text-muted fw-semibold py-2.5">
                      {(currentPage - 1) * pageSize + idx + 1}
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-2.5">
                        <div
                          className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 fw-bold"
                          style={{
                            width: '34px',
                            height: '34px',
                            backgroundColor: '#FEF3C7',
                            color: '#D97706',
                            fontSize: '0.82rem',
                            border: '1px solid #FDE68A',
                          }}
                        >
                          {initial}
                        </div>
                        <div>
                          <strong className="text-dark d-block fw-bold" style={{ fontSize: '0.88rem' }}>
                            {c.razonSocial}
                          </strong>
                          <span className="small text-muted fw-semibold">RUC: {c.ruc}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <span className="fw-bold text-dark">{phone || '—'}</span>
                        {cleanPhone && (
                          <a
                            href={`https://wa.me/51${cleanPhone}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-meta-icon btn-meta-icon-whatsapp"
                            title="Abrir chat de WhatsApp"
                          >
                            <Phone size={13} />
                          </a>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-1.5">
                        <span className="badge bg-light text-dark border rounded-pill px-2.5 py-1 fw-bold">
                          {c.planContratado}
                        </span>
                        <span
                          className="badge rounded-pill px-2.5 py-1 fw-bold"
                          style={{ backgroundColor: '#E7F3FF', color: '#0866FF' }}
                        >
                          {c.tipoSuscripcion || 'MENSUAL'}
                        </span>
                      </div>
                    </td>
                    <td className="fw-bold fs-6" style={{ color: '#0866FF' }}>
                      S/ {Number(c.montoSiguienteCobro ?? c.montoMensual).toFixed(2)}
                    </td>
                    <td>
                      <span className="badge-fb badge-fb-warning">
                        POR COBRAR
                      </span>
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-2 flex-wrap">
                        <button
                          onClick={() => handleRegisterPayment(c)}
                          className="btn-meta-action btn-meta-action-success"
                          title="Confirmar el cobro y registrar pago"
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
                          className="btn-meta-action btn-meta-action-danger"
                          title="Cancelar plan del cliente"
                        >
                          <X size={14} />
                          <span>Cancelar Plan</span>
                        </button>
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
        totalItems={clientesPorCobrarList.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
