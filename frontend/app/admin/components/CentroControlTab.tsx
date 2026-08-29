'use client';

import React from 'react';
import { Activity, Search, Eye, MessageSquare, BellRing, CheckCircle2 } from 'lucide-react';
import { Client } from './ClientesTodosTab';
import PaginationControls from './PaginationControls';
import BillingMessageModal from '../modals/BillingMessageModal';

interface CentroControlTabProps {
  clients: Client[];
  calendarSearch: string;
  setCalendarSearch: (v: string) => void;
  calcularProrrateoEntero: (
    planStr?: string,
    tipoSuscripcion?: string,
    fechaCapacitacionStr?: string,
    montoMensualBase?: number
  ) => { montoProrrateado: number; diasProrrateados: number };
  setHistoryClient: (client: Client) => void;
  handleToggleAvisado?: (client: Client, nextAvisado?: boolean) => void;
}

export default function CentroControlTab({
  clients,
  calendarSearch,
  setCalendarSearch,
  calcularProrrateoEntero: _calcularProrrateoEntero,
  setHistoryClient,
  handleToggleAvisado,
}: CentroControlTabProps) {
  const [billingMessageClient, setBillingMessageClient] = React.useState<Client | null>(null);
  const pageSize = 10;
  const [currentPage, setCurrentPage] = React.useState(1);

  const filteredClients = React.useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    return clients
      .filter((c) => (c.estadoCuenta || '').toUpperCase() !== 'BLOQUEADO')
      .filter((c) => {
        const searchStr = (calendarSearch || '').trim();
        if (!searchStr) return true;
        const q = searchStr.toLowerCase();
        return (
          c.razonSocial?.toLowerCase().includes(q) ||
          c.ruc?.includes(q) ||
          (c.dni || '').includes(q) ||
          (c.nombres || '').toLowerCase().includes(q) ||
          (c.apellidos || '').toLowerCase().includes(q) ||
          (c.telefono || '').includes(q) ||
          (c.telefonoPersonal || '').includes(q) ||
          (c.usuarioWsp || '').toLowerCase().includes(q) ||
          (c.email || '').toLowerCase().includes(q)
        );
      })
      .map((c) => {
        const vencDate = c.fechaVencimientoMensual ? new Date(c.fechaVencimientoMensual) : null;
        if (vencDate) vencDate.setHours(0, 0, 0, 0);
        const diffTime = vencDate ? vencDate.getTime() - now.getTime() : Infinity;
        const diffDays = vencDate ? Math.ceil(diffTime / (1000 * 60 * 60 * 24)) : 9999;
        return { ...c, _vencDate: vencDate, _diffDays: diffDays };
      })
      .sort((a, b) => a._diffDays - b._diffDays);
  }, [clients, calendarSearch]);
  const totalPages = Math.max(1, Math.ceil(filteredClients.length / pageSize));
  const visibleClients = React.useMemo(
    () => filteredClients.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [filteredClients, currentPage]
  );

  React.useEffect(() => {
    setCurrentPage(1);
  }, [calendarSearch, filteredClients.length]);

  React.useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  return (
    <div className="custom-card p-4 shadow-sm">
      <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
        <div className="d-flex align-items-center gap-2">
          <div className="p-2 bg-primary bg-opacity-10 text-primary rounded-3">
            <Activity size={20} />
          </div>
          <div>
            <h2 className="h6 fw-bold text-dark mb-0">Centro de Control</h2>
            <small className="text-muted">Monitoreo detallado de vencimientos y cálculo prorrateado</small>
          </div>
        </div>
        <div className="input-group input-group-sm" style={{ maxWidth: '280px' }}>
          <span className="input-group-text bg-light border-end-0">
            <Search size={14} />
          </span>
          <input
            className="form-control border-start-0"
            placeholder="Buscar empresa, RUC, DNI, representante..."
            value={calendarSearch}
            onChange={(e) => setCalendarSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="table-responsive">
        <table className="table table-sm table-hover align-middle mb-0" style={{ fontSize: '0.85rem' }}>
          <thead>
            <tr>
              <th className="py-2.5">#</th>
              <th className="py-2.5">Representante</th>
              <th className="py-2.5">DNI</th>
              <th className="py-2.5">RUC</th>
              <th className="py-2.5">Empresa</th>
              <th className="py-2.5">Teléfono</th>
              <th className="py-2.5">Usuario WSP</th>
              <th className="py-2.5">Plan Actual</th>
              <th className="py-2.5">Próximo Cobro</th>
              <th className="py-2.5">Vencimiento</th>
              <th className="py-2.5">Plazo</th>
              <th className="py-2.5">Estado</th>
              <th className="py-2.5 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.length === 0 ? (
              <tr>
                <td colSpan={13} className="text-center text-muted py-4 fw-semibold">
                  No se encontraron clientes activos en el Centro de Control.
                </td>
              </tr>
            ) : visibleClients.map((c, idx) => {
                const { _vencDate: vencDate, _diffDays: diffDays } = c;
                const estadoVisual = diffDays !== 9999 && diffDays <= 0 && c.estadoCuenta === 'HABILITADO'
                  ? 'VENCIDO'
                  : c.estadoCuenta;

                const cobroProximo = Number(c.montoSiguienteCobro ?? c.montoMensual ?? 0);

                const isNearExpiry = diffDays <= 3 && diffDays >= 0;
                const isExpired = diffDays <= 0;

                return (
                  <tr key={c.id} className={isExpired ? 'bg-danger bg-opacity-10' : isNearExpiry ? 'bg-warning bg-opacity-10' : ''}>
                    <td className="text-muted fw-semibold py-2.5">{(currentPage - 1) * pageSize + idx + 1}</td>
                    <td className="py-2.5">
                      {c.nombres || c.apellidos ? (
                        <strong className="text-dark">
                          {c.nombres} {c.apellidos || ''}
                        </strong>
                      ) : (
                        <span className="text-muted small">Sin especificar</span>
                      )}
                    </td>
                    <td className="py-2.5">
                      {c.dni ? (
                        <span className="fw-bold text-dark">{c.dni}</span>
                      ) : (
                        <span className="text-muted small">Sin DNI</span>
                      )}
                    </td>
                    <td className="py-2.5">
                      <span className="fw-bold text-dark font-monospace">{c.ruc}</span>
                    </td>
                    <td className="py-2.5">
                      <strong className="text-dark fs-6">{c.razonSocial}</strong>
                    </td>
                    <td className="py-2.5">
                      <span className="fw-bold text-dark d-block">{c.telefono || c.telefonoPersonal || '—'}</span>
                      <small className="text-muted">{c.email || ''}</small>
                    </td>
                    <td className="py-2.5">
                      {c.usuarioWsp ? (
                        <span className="badge bg-light text-dark border fw-semibold font-monospace">{c.usuarioWsp}</span>
                      ) : (
                        <span className="text-muted small">—</span>
                      )}
                    </td>
                    <td className="py-2.5">
                      <div className="d-flex align-items-center gap-1">
                        <span className="badge bg-light text-dark border fw-bold">{c.planContratado}</span>
                        <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25">{c.tipoSuscripcion || 'MENSUAL'}</span>
                      </div>
                    </td>
                    <td className="py-2.5">
                      <strong className="text-primary fs-6">S/ {cobroProximo.toFixed(2)}</strong>
                    </td>
                    <td className="py-2.5">
                      <strong className={isExpired ? 'text-danger' : isNearExpiry ? 'text-warning text-dark' : 'text-dark'}>
                        {vencDate
                          ? vencDate.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
                          : 'Sin fecha'}
                      </strong>
                    </td>
                    <td className="py-2.5">
                      {diffDays === 9999 ? (
                        <span className="badge bg-light text-muted border">Sin fecha</span>
                      ) : diffDays > 0 ? (
                        <span
                          className={`badge fw-bold ${
                            diffDays <= 3 ? 'bg-warning bg-opacity-25 text-dark border border-warning' : diffDays <= 7 ? 'bg-info bg-opacity-25 text-dark border border-info' : 'bg-success bg-opacity-10 text-success border border-success border-opacity-25'
                          }`}
                        >
                          {diffDays === 1 ? 'Mañana' : `${diffDays} días`}
                        </span>
                      ) : diffDays === 0 ? (
                        <span className="badge bg-danger text-white fw-bold">HOY</span>
                      ) : (
                        <span className="badge bg-danger text-white">Vencido {Math.abs(diffDays)}d</span>
                      )}
                    </td>
                    <td className="py-2.5">
                      <span
                        className={`badge ${
                          estadoVisual === 'HABILITADO'
                            ? 'badge-habilitado'
                            : estadoVisual === 'POR_COBRAR'
                            ? 'badge-pendiente'
                            : 'badge-vencido'
                        }`}
                      >
                        {estadoVisual}
                      </span>
                    </td>
                    <td className="py-2.5 text-center">
                      <div className="d-flex justify-content-center align-items-center gap-1.5">
                        {c.avisado ? (
                          <button
                            className="btn btn-sm btn-success px-2.5 py-1 fw-bold text-white shadow-sm d-inline-flex align-items-center gap-1"
                            onClick={() => handleToggleAvisado?.(c, false)}
                            title="Cliente marcado como avisado en la Base de Datos. Clic para desmarcar."
                          >
                            <CheckCircle2 size={13} />
                            <span>Avisado</span>
                          </button>
                        ) : (
                          <button
                            className="btn btn-sm btn-outline-secondary px-2.5 py-1 fw-semibold d-inline-flex align-items-center gap-1"
                            onClick={() => handleToggleAvisado?.(c, true)}
                            title="Marcar cliente como avisado para su cobranza (guardado en BD)"
                          >
                            <BellRing size={13} />
                            <span>Avisar</span>
                          </button>
                        )}
                        <button
                          className="btn btn-sm btn-outline-success px-2.5 py-1 fw-bold d-inline-flex align-items-center gap-1"
                          onClick={() => setBillingMessageClient(c)}
                          title="Generar mensaje inteligente de cobranza para WhatsApp"
                        >
                          <MessageSquare size={13} />
                          <span>Mensaje</span>
                        </button>
                        <button
                          className="btn btn-sm btn-outline-primary px-2.5 py-1 fw-bold d-inline-flex align-items-center gap-1"
                          onClick={() => setHistoryClient(c)}
                          title="Ver historial de movimientos"
                        >
                          <Eye size={13} />
                          <span>Historial</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
      <PaginationControls
        currentPage={currentPage}
        totalItems={filteredClients.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
      />

      {/* Modal de Mensajes Inteligentes de Cobranza */}
      <BillingMessageModal
        client={billingMessageClient}
        onClose={() => setBillingMessageClient(null)}
        onAvisado={() => {
          if (billingMessageClient) {
            handleToggleAvisado?.(billingMessageClient, true);
          }
        }}
      />
    </div>
  );
}
