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
  calcularProrrateoEntero,
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
          setDbHistory(data.data.operacionesHistorial || data.data.ventasHistorial || []);
        }
      })
      .catch((err) => console.error('Error fetching client DB history:', err))
      .finally(() => setLoading(false));
  }, [historyClient]);

  if (!historyClient) return null;

  const pro = calcularProrrateoEntero(
    historyClient.planContratado,
    historyClient.tipoSuscripcion,
    historyClient.fechaCapacitacion,
    historyClient.montoMensual
  );

  // Filtrar pagos en memoria
  const rawPayments = (payments || []).filter((p) => {
    if (!p) return false;
    return (
      p.clienteId === historyClient.id ||
      p.cliente?.id === historyClient.id ||
      p.venta?.cliente?.id === historyClient.id
    );
  });

  // Lista consolidada de transacciones
  const transactions: any[] = [];

  if (dbHistory.length > 0) {
    dbHistory.forEach((v) => {
      const ventaId = v.ventaId || v.id;
      const tipo = v.tipoOperacion || v.tipoVenta;
      const estado = v.estadoPago || v.estadoVenta || 'PENDIENTE_PAGO';

      transactions.push({
        id: `venta-${ventaId}`,
        fecha: v.fechaPago || v.fechaOperacion || v.fechaVenta || historyClient.fechaRegistro,
        tipoOperacion: tipo === 'ALTA' ? 'Pago Inicial / Alta' : tipo === 'RENOVACION' ? 'Renovacion' : 'Cambio de Plan',
        badgeClass: tipo === 'ALTA' ? 'bg-success' : tipo === 'RENOVACION' ? 'bg-info text-dark' : 'bg-warning text-dark',
        monto: v.montoPagado ?? v.montoVenta ?? v.montoTotal ?? v.precioLista ?? historyClient.montoMensual,
        estado,
        observaciones: v.observaciones || (v.montoProrrateado ? 'Prorrateo: S/ ' + v.montoProrrateado : 'Venta en sistema'),
      });
    });
  }
  rawPayments.forEach((p) => {
    const ventaId = p.ventaId || p.venta?.id;
    if (!transactions.some((t) => t.id === `venta-${ventaId}` || t.id === `pago-${p.id}`)) {
      transactions.push({
        id: `pago-${p.id || Math.random()}`,
        fecha: p.fechaPago || historyClient.fechaRegistro,
        tipoOperacion: p.codigoOperacion?.startsWith('RENOVACION') ? 'Renovación' : 'Pago de Servicio',
        badgeClass: 'bg-primary',
        monto: p.monto || historyClient.montoMensual,
        estado: p.estadoPago || 'CONFIRMADO',
        observaciones: p.codigoOperacion || 'Pago verificado',
      });
    }
  });

  // Si no hay ventas en DB ni pagos registrados, crear la transacción inicial de ALTA
  if (transactions.length === 0) {
    transactions.push({
      id: 'initial',
      fecha: historyClient.fechaRegistro || new Date().toISOString(),
      tipoOperacion: 'Pago Inicial / Alta',
      badgeClass: 'bg-success',
      monto: historyClient.montoMensual,
      estado: historyClient.estadoCuenta === 'POR_COBRAR' ? 'PENDIENTE' : 'PAGADO',
      observaciones: 'Venta inicial registrada',
    });
  }

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
              <h5 className="modal-title fw-bold text-dark mb-0">Historial de Transacciones de Base de Datos</h5>
              <small className="text-muted">
                {historyClient.razonSocial} | RUC: {historyClient.ruc}
              </small>
            </div>
            <button type="button" className="btn-close" onClick={() => setHistoryClient(null)}></button>
          </div>
          <div className="modal-body p-4">
            <div className="p-3 bg-light rounded-3 border mb-4">
              <div className="row g-2 small">
                <div className="col-md-6">
                  Plan Contratado: <strong>{historyClient.planContratado}</strong> (
                  {historyClient.tipoSuscripcion || 'MENSUAL'})
                </div>
                <div className="col-md-6">
                  Monto Base del Plan: <strong>S/ {Number(historyClient.montoMensual || 0).toFixed(2)}</strong>
                </div>
                <div className="col-md-6">
                  Estado de Cuenta: <span className="badge bg-success">{historyClient.estadoCuenta}</span>
                </div>
                <div className="col-md-6">
                  Próximo Cobro Sugerido: <strong className="text-primary fs-6">S/ {pro.montoProrrateado}</strong>
                </div>
              </div>
            </div>

            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-bold text-dark mb-0">Operaciones en Base de Datos ({transactions.length})</h6>
              {loading && <span className="badge bg-warning text-dark">Cargando desde MySQL...</span>}
            </div>

            <div className="table-responsive">
              <table className="table table-sm table-hover align-middle mb-0 small">
                <thead className="table-secondary">
                  <tr>
                    <th>#</th>
                    <th>Fecha Operación</th>
                    <th>Inicio de Servicio</th>
                    <th>Mes Correspondiente</th>
                    <th>Tipo Operación</th>
                    <th>Estado</th>
                    <th>Monto Final</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t, idx) => {
                    const tDate = t.fecha ? new Date(t.fecha) : new Date();
                    const mesTexto = `${MESES[tDate.getMonth()]} ${tDate.getFullYear()}`;
                    const fechaInicioPlan = historyClient.fechaCapacitacion
                      ? new Date(historyClient.fechaCapacitacion).toLocaleDateString('es-PE', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })
                      : tDate.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });

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
                          <strong className="text-dark">{fechaInicioPlan}</strong>
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
                        <td className="fw-bold text-success fs-6">S/ {Number(t.monto || 0).toFixed(2)}</td>
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
