'use client';

import React from 'react';
import { Activity, Search, Eye } from 'lucide-react';
import { Client } from './ClientesTodosTab';

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
}

export default function CentroControlTab({
  clients,
  calendarSearch,
  setCalendarSearch,
  calcularProrrateoEntero,
  setHistoryClient,
}: CentroControlTabProps) {
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
        <table className="table table-sm table-hover align-middle mb-0" style={{ fontSize: '0.82rem' }}>
          <thead className="table-light">
            <tr>
              <th className="py-2">#</th>
              <th className="py-2">Representante</th>
              <th className="py-2">DNI</th>
              <th className="py-2">RUC</th>
              <th className="py-2">Empresa</th>
              <th className="py-2">Correo</th>
              <th className="py-2">Plan Actual</th>
              <th className="py-2">Cobro Próximo Mes</th>
              <th className="py-2">Vencimiento</th>
              <th className="py-2">Días Restantes</th>
              <th className="py-2">Estado</th>
              <th className="py-2">Historial</th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              const now = new Date();
              now.setHours(0, 0, 0, 0);

              const filtered = clients
                .filter((c) => {
                  if (!calendarSearch.trim()) return true;
                  const q = calendarSearch.toLowerCase();
                  return (
                    c.razonSocial?.toLowerCase().includes(q) ||
                    c.ruc?.includes(q) ||
                    (c.dni || '').includes(q) ||
                    (c.nombres || '').toLowerCase().includes(q) ||
                    (c.apellidos || '').toLowerCase().includes(q) ||
                    (c.telefono || '').includes(q) ||
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

              if (filtered.length === 0) {
                return (
                  <tr>
                    <td colSpan={12} className="text-center text-muted py-4">
                      No se encontraron clientes en el Centro de Control.
                    </td>
                  </tr>
                );
              }

              return filtered.map((c, idx) => {
                const { _vencDate: vencDate, _diffDays: diffDays } = c;
                const estadoVisual = diffDays !== 9999 && diffDays <= 0 && c.estadoCuenta === 'HABILITADO'
                  ? 'VENCIDO'
                  : c.estadoCuenta;

                const prorrateo = calcularProrrateoEntero(
                  c.planContratado,
                  c.tipoSuscripcion,
                  c.fechaCapacitacion,
                  c.montoMensual
                );

                const isNearExpiry = diffDays <= 3 && diffDays >= 0;
                const isExpired = diffDays <= 0;

                return (
                  <tr key={c.id} className={isExpired ? 'table-danger' : isNearExpiry ? 'table-warning' : ''}>
                    <td className="text-muted fw-semibold py-2">{idx + 1}</td>
                    <td className="py-2">
                      {c.nombres || c.apellidos ? (
                        <strong className="text-dark">
                          {c.nombres} {c.apellidos || ''}
                        </strong>
                      ) : (
                        <span className="text-muted small">Sin especificar</span>
                      )}
                    </td>
                    <td className="py-2">
                      {c.dni ? (
                        <span className="fw-semibold text-dark">{c.dni}</span>
                      ) : (
                        <span className="text-muted small">Sin DNI</span>
                      )}
                    </td>
                    <td className="py-2">
                      <code>{c.ruc}</code>
                    </td>
                    <td className="py-2">
                      <strong className="text-dark">{c.razonSocial}</strong>
                    </td>
                    <td className="py-2">
                      <span className="text-dark">{c.email || 'Sin correo'}</span>
                      {c.telefono && <small className="text-muted d-block">{c.telefono}</small>}
                    </td>
                    <td className="py-2">
                      <span className="badge bg-primary me-1">{c.planContratado}</span>
                      <span className="badge bg-light text-dark border">{c.tipoSuscripcion || 'MENSUAL'}</span>
                    </td>
                    <td className="py-2">
                      <strong className="text-success fs-6">S/ {prorrateo.montoProrrateado}</strong>
                    </td>
                    <td className="py-2">
                      <strong className={isExpired ? 'text-danger' : isNearExpiry ? 'text-warning' : 'text-dark'}>
                        {vencDate
                          ? vencDate.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
                          : 'Sin fecha'}
                      </strong>
                    </td>
                    <td className="py-2">
                      {diffDays === 9999 ? (
                        <span className="badge bg-light text-muted border">Sin fecha</span>
                      ) : diffDays > 0 ? (
                        <span
                          className={`badge fw-bold ${
                            diffDays <= 3 ? 'bg-warning text-dark' : diffDays <= 7 ? 'bg-info text-dark' : 'bg-success'
                          }`}
                        >
                          {diffDays === 1 ? 'Mañana' : `${diffDays} días`}
                        </span>
                      ) : diffDays === 0 ? (
                        <span className="badge bg-danger fw-bold">HOY</span>
                      ) : (
                        <span className="badge bg-danger">Vencido {Math.abs(diffDays)}d</span>
                      )}
                    </td>
                    <td className="py-2">
                      <span
                        className={`badge ${
                          estadoVisual === 'HABILITADO'
                            ? 'bg-success'
                            : estadoVisual === 'POR_COBRAR'
                            ? 'bg-warning text-dark'
                            : estadoVisual === 'PAGO_REALIZADO'
                            ? 'bg-info text-dark'
                            : 'bg-danger'
                        }`}
                      >
                        {estadoVisual}
                      </span>
                    </td>
                    <td className="py-2">
                      <button
                        className="btn btn-sm btn-primary rounded-pill px-3 py-1 fw-semibold shadow-sm d-inline-flex align-items-center gap-1"
                        onClick={() => setHistoryClient(c)}
                      >
                        <Eye size={13} />
                        <span>Ver Historial</span>
                      </button>
                    </td>
                  </tr>
                );
              });
            })()}
          </tbody>
        </table>
      </div>
    </div>
  );
}
