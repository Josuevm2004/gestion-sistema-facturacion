'use client';

import React, { useEffect, useState } from 'react';
import { Client } from '../components/ClientesTodosTab';

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
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
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

  [...dbHistory, ...rawPayments].forEach((p) => {
    const estadoPago = (p.estadoPago || '').toUpperCase();
    const estadoVenta = (p.venta?.estadoVenta || p.estadoVenta || '').toUpperCase();
    if (estadoPago !== 'PAGADO' || estadoVenta === 'CANCELADA') return;

    const ventaId = p.ventaId || p.venta?.id;
    const pagoId = p.pagoId || p.id;
    if (!transactions.some((t) => t.id === `pago-${pagoId}` || (ventaId && t.ventaId === String(ventaId)))) {
      const tipo = p.venta?.tipoVenta || p.tipoVenta || p.codigoOperacion?.split('-')?.[0] || 'PAGO';
      transactions.push({
        id: `pago-${pagoId || `${ventaId}-${p.fechaPago}`}`,
        ventaId: ventaId ? String(ventaId) : '',
        fecha: p.fechaPago || historyClient.fechaRegistro,
        tipoOperacion: tipo === 'ALTA' ? 'Pago Inicial / Alta' : tipo === 'RENOVACION' ? 'Renovación' : tipo === 'CAMBIO_PLAN' ? 'Cambio de Plan' : tipo === 'MEJORA_PLAN' ? 'Mejora de Plan' : 'Pago de Servicio',
        badgeClass: tipo === 'ALTA' ? 'bg-success' : tipo === 'RENOVACION' ? 'bg-info text-dark' : tipo === 'CAMBIO_PLAN' ? 'bg-warning text-dark' : tipo === 'MEJORA_PLAN' ? 'bg-success' : 'bg-primary',
        monto: p.monto || historyClient.montoMensual,
        estado: p.estadoPago || 'CONFIRMADO',
        observaciones: p.codigoOperacion || 'Pago verificado',
      });
    }
  });

  transactions.sort((a, b) => {
    const aTime = a.fecha ? new Date(a.fecha).getTime() : 0;
    const bTime = b.fecha ? new Date(b.fecha).getTime() : 0;
    return bTime - aTime;
  });
  const MESES = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];

  return (
    <div className="modal d-block bg-dark bg-opacity-50" tabIndex={-1}>
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content rounded-3 shadow">
          <div className="modal-header border-bottom bg-light">
            <div>
              <h5 className="modal-title fw-bold text-dark mb-0">Historial de Pagos de Base de Datos</h5>
              <small className="text-muted">
                {historyClient.razonSocial} | RUC: {historyClient.ruc}
              </small>
            </div>
            <button type="button" className="btn-close" onClick={() => setHistoryClient(null)}></button>
          </div>
          <div className="modal-body p-4">
            <div className="card bg-light border-0 rounded-3 p-3 mb-4">
              <div className="row g-2 small">
                <div className="col-md-6">
                  Plan Contratado: <strong>{historyClient.planContratado}</strong> ({historyClient.tipoSuscripcion || 'MENSUAL'})
                </div>
                <div className="col-md-6">
                  Monto Base del Plan: <strong>S/ {Number(historyClient.montoMensual || 0).toFixed(2)}</strong>
                </div>
                <div className="col-md-6">
                  Estado de Cuenta: <span className="badge bg-success">{historyClient.estadoCuenta}</span>
                </div>
                <div className="col-md-6">
                  Pagos confirmados: <strong className="text-primary fs-6">{transactions.length}</strong>
                </div>
              </div>
            </div>

            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-bold text-dark mb-0">Pagos en Base de Datos ({transactions.length})</h6>
              {loading && <span className="badge bg-warning text-dark">Cargando desde base de datos...</span>}
            </div>

            <div className="table-responsive">
              <table className="table table-sm table-hover align-middle mb-0 small">
                <thead className="table-secondary">
                  <tr>
                    <th>#</th>
                    <th>Fecha Pago</th>
                    <th>Código / Observación</th>
                    <th>Mes Correspondiente</th>
                    <th>Tipo Pago</th>
                    <th>Estado</th>
                    <th>Monto Pagado</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t, idx) => {
                    const tDate = t.fecha ? new Date(t.fecha) : new Date();
                    const mesTexto = `${MESES[tDate.getMonth()]} ${tDate.getFullYear()}`;

                    return (
                      <tr key={t.id || idx}>
                        <td className="text-muted fw-semibold">{transactions.length - idx}</td>
                        <td>
                          {tDate.toLocaleDateString('es-PE', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })}
                        </td>
                        <td>
                          <strong className="text-dark">{t.observaciones}</strong>
                        </td>
                        <td>
                          <span className="badge bg-light text-dark border fw-bold">{mesTexto}</span>
                        </td>
                        <td>
                          <span className={`badge ${t.badgeClass}`}>{t.tipoOperacion}</span>
                        </td>
                        <td>
                          <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25">
                            {t.estado}
                          </span>
                        </td>
                        <td className="fw-bold text-success fs-6">
                          S/ {Number(t.monto || 0).toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <div className="modal-footer border-top">
            <button type="button" className="btn btn-secondary" onClick={() => setHistoryClient(null)}>
              Cerrar Historial
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
