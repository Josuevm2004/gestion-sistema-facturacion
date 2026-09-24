'use client';

import React from 'react';
import { AlertCircle, RefreshCw, Settings, X, Unlock, ShieldAlert, Search, RotateCcw, Phone } from 'lucide-react';
import { Client } from './ClientesTodosTab';
import PaginationControls from './PaginationControls';
import { parseLocalDate, formatDatePeru } from '@/lib/billing';
import RegistrarPagoModal from '../modals/RegistrarPagoModal';

interface VencidosTabProps {
  clientesVencidosList: Client[];
  handleRenovarPlan: (client: Client, nuevoPlan?: string, nuevoTipo?: string, paymentDetails?: any) => any;
  handleAdelantoPago?: (client: Client, monto?: number, observaciones?: string, paymentDetails?: any) => any;
  setCambioPlanClient: (client: Client) => void;
  setCambioPlanSeleccionado: (plan: string) => void;
  setCambioPlanTipo?: (tipo: string) => void;
  handleEstadoCuentaChange?: (client: Client, nuevoEstado: string) => void;
  handleDevolverAcceso?: (client: Client) => void;
}

export default function VencidosTab({
  clientesVencidosList,
  handleRenovarPlan,
  handleAdelantoPago,
  setCambioPlanClient,
  setCambioPlanSeleccionado,
  setCambioPlanTipo,
  handleEstadoCuentaChange,
  handleDevolverAcceso,
}: VencidosTabProps) {
  const [pagoModalConfig, setPagoModalConfig] = React.useState<{
    client: Client;
  } | null>(null);
  const [search, setSearch] = React.useState('');
  const [suscripcionFilter, setSuscripcionFilter] = React.useState('');
  const pageSize = 10;
  const [currentPage, setCurrentPage] = React.useState(1);

  const filteredClients = React.useMemo(() => {
    return clientesVencidosList.filter((c) => {
      if (suscripcionFilter) {
        const tipo = (c.tipoSuscripcion || 'MENSUAL').toUpperCase();
        if (tipo !== suscripcionFilter.toUpperCase()) return false;
      }
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const match =
          c.razonSocial?.toLowerCase().includes(q) ||
          c.ruc?.toLowerCase().includes(q) ||
          (c.dni || '').toLowerCase().includes(q) ||
          (c.nombres || '').toLowerCase().includes(q) ||
          (c.apellidos || '').toLowerCase().includes(q) ||
          (c.telefono || '').toLowerCase().includes(q) ||
          (c.telefonoPersonal || '').toLowerCase().includes(q) ||
          (c.usuarioWsp || '').toLowerCase().includes(q) ||
          (c.email || '').toLowerCase().includes(q) ||
          (c.planContratado || '').toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [clientesVencidosList, search, suscripcionFilter]);

  const hasActiveFilters = Boolean(search.trim() || suscripcionFilter);

  const resetFilters = () => {
    setSearch('');
    setSuscripcionFilter('');
  };

  const totalPages = Math.max(1, Math.ceil(filteredClients.length / pageSize));
  const visibleClients = React.useMemo(
    () => filteredClients.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [filteredClients, currentPage]
  );

  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, suscripcionFilter, filteredClients.length]);

  React.useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  return (
    <div className="card rounded-4 border bg-white p-4 shadow-sm">
      <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-3">
        <div className="d-flex align-items-center gap-3">
          <div className="d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#FEE2E2', color: '#DC2626' }}>
            <AlertCircle size={20} />
          </div>
          <div>
            <h2 className="h6 fw-bold text-dark mb-0">Clientes Vencidos</h2>
            <small className="text-muted">Clientes con fecha de servicio expirada que requieren renovación o corte</small>
          </div>
        </div>
        <div className="d-flex align-items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="btn btn-sm btn-outline-secondary rounded-pill px-3 d-inline-flex align-items-center gap-1 fw-semibold"
            >
              <RotateCcw size={13} />
              <span>Limpiar Filtros</span>
            </button>
          )}
          <span className="badge rounded-pill px-3 py-2 fs-6 fw-bold" style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}>
            {hasActiveFilters ? `${filteredClients.length} de ${clientesVencidosList.length} pendientes` : `${clientesVencidosList.length} pendientes`}
          </span>
        </div>
      </div>

      {/* Barra de Filtros: Buscador y Filtro Anual / Mensual */}
      <div className="p-3 rounded-4 border mb-4" style={{ backgroundColor: '#F0F2F5' }}>
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-8 col-lg-6">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-white border-end-0 text-muted rounded-start-pill ps-3">
                <Search size={14} />
              </span>
              <input
                type="text"
                className="form-control border-start-0 rounded-end-pill pe-3"
                placeholder="Buscar por RUC, Empresa, DNI, Teléfono, Plan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="col-12 col-md-4 col-lg-3">
            <select
              className="form-select form-select-sm fw-semibold rounded-pill px-3"
              value={suscripcionFilter}
              onChange={(e) => setSuscripcionFilter(e.target.value)}
            >
              <option value="">Suscripción: Todas</option>
              <option value="MENSUAL">Mensual</option>
              <option value="ANUAL">Anual</option>
            </select>
          </div>
        </div>
      </div>

      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0 table-meta">
          <thead>
            <tr>
              <th style={{ width: '45px' }}>#</th>
              <th>Empresa / RUC</th>
              <th>Teléfono / WhatsApp</th>
              <th>Plan</th>
              <th>Estado</th>
              <th>Monto Plan</th>
              <th>Fecha Vencimiento</th>
              <th>Acciones Comerciales</th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center text-muted py-5 fw-semibold">
                  {hasActiveFilters
                    ? 'No se encontraron clientes vencidos con los filtros aplicados.'
                    : 'No hay clientes vencidos en este momento.'}
                </td>
              </tr>
            ) : (
              visibleClients.map((c, idx) => {
                const vencDate = parseLocalDate(c.fechaVencimientoMensual);
                const isBloqueado = c.estadoCuenta === 'BLOQUEADO';
                const phone = c.telefono || c.telefonoPersonal;
                const cleanPhone = phone ? phone.replace(/\D/g, '') : '';
                const initial = (c.razonSocial || 'C').charAt(0).toUpperCase();

                return (
                  <tr key={c.id} className={isBloqueado ? 'bg-light bg-opacity-75' : ''}>
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
                            backgroundColor: '#FEE2E2',
                            color: '#DC2626',
                            fontSize: '0.82rem',
                            border: '1px solid #FECACA',
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
                          style={{ backgroundColor: '#F0F2F5', color: '#65676B' }}
                        >
                          {c.tipoSuscripcion || 'MENSUAL'}
                        </span>
                      </div>
                    </td>
                    <td>
                      {isBloqueado ? (
                        <span className="badge bg-secondary text-white rounded-pill px-2.5 py-1 d-inline-flex align-items-center gap-1 fw-bold">
                          <ShieldAlert size={12} /> Bloqueado
                        </span>
                      ) : (
                        <span
                          className="badge rounded-pill px-2.5 py-1 fw-bold"
                          style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}
                        >
                          Vencido
                        </span>
                      )}
                    </td>
                    <td className="fw-bold text-danger fs-6">S/ {c.montoMensual?.toFixed(2)}</td>
                    <td>
                      {vencDate ? (
                        <span className="badge bg-light text-danger border border-danger border-opacity-25 rounded-pill px-2.5 py-1 fw-bold">
                          {formatDatePeru(vencDate)}
                        </span>
                      ) : (
                        <span className="badge bg-light text-muted border rounded-pill px-2.5 py-1">Sin fecha</span>
                      )}
                    </td>
                    <td>
                      <div className="d-flex gap-2 flex-wrap align-items-center">
                        <button
                          onClick={() => setPagoModalConfig({ client: c })}
                          className="btn-meta-action btn-meta-action-primary"
                          title="Registrar pago o renovar servicio: abre el calendario con cálculo dinámico"
                        >
                          <RotateCcw size={14} />
                          <span>Registrar Pago / Renovar</span>
                        </button>
                        <button
                          onClick={() => {
                            setCambioPlanClient(c);
                            setCambioPlanSeleccionado(c.planContratado || '');
                            if (setCambioPlanTipo) setCambioPlanTipo(c.tipoSuscripcion || 'MENSUAL');
                          }}
                          className="btn-meta-action btn-meta-action-secondary"
                          title="Cambiar plan o suscripción"
                        >
                          <Settings size={14} />
                          <span>Cambiar Plan</span>
                        </button>
                        {!isBloqueado ? (
                          <button
                            onClick={() => {
                              const ok = window.confirm(
                                `¿Bloquear cliente ${c.razonSocial}? Su acceso se suspenderá.`
                              );
                              if (ok && handleEstadoCuentaChange) handleEstadoCuentaChange(c, 'BLOQUEADO');
                            }}
                            className="btn-meta-action btn-meta-action-danger"
                            title="Suspender acceso del cliente"
                          >
                            <X size={14} />
                            <span>Bloquear</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              if (handleDevolverAcceso) handleDevolverAcceso(c);
                            }}
                            className="btn-meta-action btn-meta-action-secondary"
                            title="Desbloquear cliente y devolver acceso (estado Vencido sin registrar pago)"
                          >
                            <Unlock size={14} />
                            <span>Desbloquear</span>
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
        totalItems={filteredClients.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
      />

      {/* Modal Unificado de Renovación, Reanudación y Adelanto de Pago */}
      {pagoModalConfig && (
        <RegistrarPagoModal
          client={pagoModalConfig.client}
          onClose={() => setPagoModalConfig(null)}
          onConfirm={async (client, data) => {
            if (data.modalidad === 'ADELANTO' && handleAdelantoPago) {
              await handleAdelantoPago(client, data.monto, data.observaciones, {
                fechaPago: data.fechaPago,
                medioPago: data.medioPago,
                codigoOperacion: data.codigoOperacion,
                observaciones: data.observaciones,
              });
            } else {
              await handleRenovarPlan(client, undefined, undefined, {
                monto: data.monto,
                fechaPago: data.fechaPago,
                medioPago: data.medioPago,
                codigoOperacion: data.codigoOperacion,
                observaciones: data.observaciones,
                conProrrateo: data.conProrrateo,
                fechaInicioPeriodo: data.fechaInicioPeriodo,
                fechaFinPeriodo: data.fechaFinPeriodo,
              });
            }
            setPagoModalConfig(null);
          }}
        />
      )}
    </div>
  );
}
