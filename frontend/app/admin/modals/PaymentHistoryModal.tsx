'use client';

import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Client } from '../components/ClientesTodosTab';
import { parseLocalDate, formatDatePeru } from '@/lib/billing';
import ClientPortal from '../components/ClientPortal';

interface PaymentHistoryModalProps {
  historyClient: Client | null;
  setHistoryClient: (client: Client | null) => void;
  payments: any[];
  calcularProrrateoEntero: (
    planStr?: string,
    tipoSuscripcion?: string,
    fechaCapacitacionStr?: string,
    montoMensualBase?: number
  ) => { montoProrrateado: number; diasProrrateados: number };
}

export default function PaymentHistoryModal({
  historyClient,
  setHistoryClient,
  payments = [],
  calcularProrrateoEntero: _calcularProrrateoEntero,
}: PaymentHistoryModalProps) {
  const [dbHistory, setDbHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!historyClient) return;

    const token = typeof window !== 'undefined' ? localStorage.getItem('miquipu_admin_token') : null;
    if (!token) return;

    setLoading(true);
    fetch(`/api/admin/clientes/${historyClient.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.status === 401 || res.status === 403) {
          window.dispatchEvent(new CustomEvent('miquipu_auth_expired'));
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data && data.success && data.data) {
          setDbHistory(data.data.pagosHistorial || []);
        }
      })
      .catch((err) => console.error('Error fetching client DB history:', err))
      .finally(() => setLoading(false));
  }, [historyClient]);

  if (!historyClient) return null;

  // Filtrar pagos en memoria
  const rawPayments = (payments || []).filter((p) => {
    if (!p) return false;
    const estadoPago = (p.estadoPago || '').toUpperCase();
    const estadoVenta = (p.venta?.estadoVenta || p.estadoVenta || '').toUpperCase();
    if (estadoPago !== 'PAGADO' || estadoVenta === 'CANCELADA') return false;
    const currentId = String(historyClient.id);
    return (
      String(p.clienteId || '') === currentId ||
      String(p.cliente?.id || '') === currentId ||
      String(p.venta?.cliente?.id || '') === currentId
    );
  });

  // Lista consolidada de transacciones
  const transactions: any[] = [];

  const MESES = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Setiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];

  [...dbHistory, ...rawPayments].forEach((p) => {
    const estadoPago = (p.estadoPago || '').toUpperCase();
    const estadoVenta = (p.venta?.estadoVenta || p.estadoVenta || '').toUpperCase();
    if (estadoPago !== 'PAGADO' || estadoVenta === 'CANCELADA') return;

    const ventaId = p.ventaId || p.venta?.id;
    const pagoId = p.pagoId || p.id;
    if (!transactions.some((t) => t.id === `pago-${pagoId}` || (ventaId && t.ventaId === String(ventaId)))) {
      const tipo = p.venta?.tipoVenta || p.tipoVenta || p.codigoOperacion?.split('-')?.[0] || 'PAGO';
      const obsRaw = String(p.observaciones || p.codigoOperacion || '');
      const isExcel =
        obsRaw.toLowerCase().includes('excel') ||
        (!p.codigoOperacion && (obsRaw.toLowerCase().includes('importad') || !p.medioPago));

      transactions.push({
        id: `pago-${pagoId || `${ventaId}-${p.fechaPago}`}`,
        ventaId: ventaId ? String(ventaId) : '',
        fecha: p.fechaPago || historyClient.fechaRegistro,
        periodoInicio: p.periodoInicio || p.venta?.periodoInicio,
        periodoFin: p.periodoFin || p.venta?.periodoFin,
        tipoOperacion:
          tipo === 'ALTA'
            ? 'Pago Inicial / Alta'
            : tipo === 'RENOVACION'
            ? 'Renovación'
            : tipo === 'CAMBIO_PLAN'
            ? 'Cambio de Plan'
            : tipo === 'MEJORA_PLAN'
            ? 'Mejora de Plan'
            : 'Pago de Servicio',
        badgeClass:
          tipo === 'ALTA'
            ? 'bg-success'
            : tipo === 'RENOVACION'
            ? 'bg-info text-dark'
            : tipo === 'CAMBIO_PLAN'
            ? 'bg-warning text-dark'
            : tipo === 'MEJORA_PLAN'
            ? 'bg-success'
            : 'bg-primary',
        monto: Number(p.monto || historyClient.montoMensual || 0),
        estado: p.estadoPago || 'CONFIRMADO',
        observaciones:
          p.observaciones ||
          (isExcel ? 'Pago histórico importado desde Excel' : p.codigoOperacion || 'Pago verificado'),
        isExcel,
        codigoOperacion: p.codigoOperacion,
      });
    }
  });

  transactions.sort((a, b) => {
    const aTime = a.fecha ? new Date(a.fecha).getTime() : 0;
    const bTime = b.fecha ? new Date(b.fecha).getTime() : 0;
    return bTime - aTime;
  });

  const countExcel = transactions.filter((t) => t.isExcel).length;
  const countSistema = transactions.length - countExcel;
  const totalMontoAbonado = transactions.reduce((acc, t) => acc + (t.monto || 0), 0);

  useEffect(() => {
    if (!historyClient) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setHistoryClient(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyClient, setHistoryClient]);

  return (
    <ClientPortal>
      <div
        className="modal admin-dialog d-block bg-dark bg-opacity-50"
        tabIndex={-1}
        style={{ backdropFilter: 'blur(6px)', zIndex: 1000000 }}
        onClick={(e) => {
          if (e.target === e.currentTarget) setHistoryClient(null);
        }}
      >
        <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content rounded-4 shadow-lg border-0">
          <div className="modal-header border-bottom bg-white px-4 py-3 d-flex justify-content-between align-items-center">
            <div>
              <h5 className="modal-title fw-bold text-dark mb-0">Historial de Pagos y Facturación</h5>
              <small className="text-muted fw-semibold">
                {historyClient.razonSocial} | RUC: {historyClient.ruc}
              </small>
            </div>
            <button
              type="button"
              className="btn-circle-meta border-0 text-muted"
              onClick={() => setHistoryClient(null)}
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
          <div className="modal-body p-4">
            <div className="card rounded-4 border bg-white shadow-sm p-3 mb-4">
              <div className="row g-3 small">
                <div className="col-md-6 col-lg-3">
                  <span className="text-muted d-block">Plan Contratado:</span>
                  <strong className="text-dark">{historyClient.planContratado || 'Plan Estándar'}</strong>{' '}
                  <span className="text-muted">({historyClient.tipoSuscripcion || 'MENSUAL'})</span>
                </div>
                <div className="col-md-6 col-lg-3">
                  <span className="text-muted d-block">Tarifa Mensual Base:</span>
                  <strong className="text-dark">S/ {Number(historyClient.montoMensual || 0).toFixed(2)}</strong>
                </div>
                <div className="col-md-6 col-lg-3">
                  <span className="text-muted d-block">Pagos Confirmados:</span>
                  <strong className="text-primary fs-6">{transactions.length}</strong>{' '}
                  <span className="text-muted">
                    ({countExcel > 0 ? `${countExcel} Excel` : ''}
                    {countExcel > 0 && countSistema > 0 ? ' + ' : ''}
                    {countSistema > 0 ? `${countSistema} Sistema` : ''})
                  </span>
                </div>
                <div className="col-md-6 col-lg-3">
                  <span className="text-muted d-block">Monto Total Pagado:</span>
                  <strong className="text-success fs-6">S/ {totalMontoAbonado.toFixed(2)}</strong>
                </div>
              </div>
            </div>

            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h6 className="fw-bold text-dark mb-0">Transacciones Registradas ({transactions.length})</h6>
                <small className="text-muted">
                  Detalle de meses cubiertos y procedencia (Plantilla Excel y Renovaciones en Sistema)
                </small>
              </div>
              {loading && <span className="badge bg-warning text-dark">Cargando desde base de datos...</span>}
            </div>

            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 table-meta">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Fecha Pago</th>
                    <th>Mes Cubierto</th>
                    <th>Procedencia / Detalle</th>
                    <th>Tipo</th>
                    <th>Estado</th>
                    <th className="text-end">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center text-muted py-4 fw-semibold">
                        No hay pagos registrados para este cliente.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((t, idx) => {
                      const tDate = parseLocalDate(t.fecha) || new Date();
                      const pInicio = parseLocalDate(t.periodoInicio);
                      const pFin = parseLocalDate(t.periodoFin);

                      let mesNombre = '';
                      let rangoFechas = '';

                      if (pInicio) {
                        mesNombre = `${MESES[pInicio.getMonth()]} ${pInicio.getFullYear()}`;
                        if (pFin) {
                          rangoFechas = `${formatDatePeru(pInicio)} al ${formatDatePeru(pFin)}`;
                        } else {
                          rangoFechas = `Desde ${formatDatePeru(pInicio)}`;
                        }
                      } else {
                        mesNombre = `${MESES[tDate.getMonth()]} ${tDate.getFullYear()}`;
                        rangoFechas = formatDatePeru(tDate);
                      }

                      return (
                        <tr key={t.id || idx}>
                          <td className="text-muted fw-semibold">{transactions.length - idx}</td>
                          <td>
                            <span className="cell-title">
                              {formatDatePeru(tDate)}
                            </span>
                          </td>
                          <td>
                            <div className="d-flex flex-column">
                              <span className="fw-bold text-dark" style={{ fontSize: '0.84rem' }}>
                                {mesNombre}
                              </span>
                              <span className="text-muted" style={{ fontSize: '0.72rem' }}>
                                {rangoFechas}
                              </span>
                            </div>
                          </td>
                          <td>
                            <div className="d-flex flex-column gap-1">
                              <div>
                                {t.isExcel ? (
                                  <span
                                    className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25"
                                    style={{ fontSize: '0.72rem' }}
                                    title="Importado directamente de la plantilla Excel original"
                                  >
                                    Histórico Excel
                                  </span>
                                ) : (
                                  <span
                                    className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25"
                                    style={{ fontSize: '0.72rem' }}
                                    title="Operación o renovación registrada en el sistema"
                                  >
                                    Sistema MiQuipu
                                  </span>
                                )}
                              </div>
                              <span
                                className="text-muted text-truncate"
                                style={{ fontSize: '0.74rem', maxWidth: '240px' }}
                                title={t.observaciones}
                              >
                                {t.observaciones}
                              </span>
                            </div>
                          </td>
                          <td>
                            <span className="badge-tag badge-sub-mensual">{t.tipoOperacion}</span>
                          </td>
                          <td>
                            <span className="badge-fb badge-fb-success">
                              <span className="badge-dot badge-dot-success" />
                              {t.estado}
                            </span>
                          </td>
                          <td className="text-end">
                            <span className="cell-amount text-success">
                              S/ {Number(t.monto || 0).toFixed(2)}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="modal-footer border-top bg-light px-4 py-3 d-flex justify-content-end">
            <button
              type="button"
              className="btn-meta-action btn-meta-action-secondary"
              onClick={() => setHistoryClient(null)}
            >
              Cerrar Historial
            </button>
          </div>
        </div>
      </div>
    </div>
    </ClientPortal>
  );
}
