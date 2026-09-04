'use client';

import React, { useState } from 'react';
import { Calendar, RefreshCw, CalendarPlus, CheckCircle, AlertCircle } from 'lucide-react';
import { Client } from '../components/ClientesTodosTab';
import { parseLocalDate, getTodayLocalMidnight, formatDatePeru } from '@/lib/billing';

export interface PaymentSubmissionData {
  monto: number;
  fechaPago: string; // YYYY-MM-DD
  medioPago: string; // TRANSFERENCIA, YAPE, PLIN, EFECTIVO, OTRO
  codigoOperacion: string;
  observaciones: string;
}

interface RegistrarPagoModalProps {
  client: Client | null;
  mode: 'RENOVACION' | 'ADELANTO';
  onClose: () => void;
  onConfirm: (client: Client, data: PaymentSubmissionData) => Promise<void> | void;
}

export default function RegistrarPagoModal({
  client,
  mode,
  onClose,
  onConfirm,
}: RegistrarPagoModalProps) {
  if (!client) return null;

  const currentMonto = Number(client.montoSiguienteCobro || client.montoMensual || client.precioPlan || 19);
  const [monto] = useState<number>(currentMonto);
  const [medioPago, setMedioPago] = useState<string>('TRANSFERENCIA');
  const [codigoOperacion, setCodigoOperacion] = useState<string>('');
  const [observaciones, setObservaciones] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Fecha real del pago: por defecto HOY en hora local de Perú (YYYY-MM-DD)
  const now = getTodayLocalMidnight();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const [fechaPago, setFechaPago] = useState<string>(todayStr);

  // Calculo deterministico del periodo del servicio segun el modo
  const rawVenc = client.fechaVencimientoMensual || client.fechaFinServicio;
  const vencDate = parseLocalDate(rawVenc);
  const isAnual = (client.tipoSuscripcion || 'MENSUAL').toUpperCase() === 'ANUAL';

  let fechaInicioPeriodo: Date;
  let fechaFinPeriodo: Date;

  if (mode === 'ADELANTO') {
    // Para adelanto: el periodo inicia cuando termina el servicio actual (o hoy si no tenia fecha)
    fechaInicioPeriodo = vencDate && vencDate >= now ? vencDate : now;
    fechaFinPeriodo = new Date(fechaInicioPeriodo);
    if (isAnual) {
      fechaFinPeriodo.setFullYear(fechaFinPeriodo.getFullYear() + 1);
    } else {
      fechaFinPeriodo.setMonth(fechaFinPeriodo.getMonth() + 1);
    }
  } else {
    // Para renovacion: el periodo corresponde al ciclo pendiente (preserva el ancla del ciclo)
    fechaInicioPeriodo = vencDate || now;
    fechaFinPeriodo = new Date(fechaInicioPeriodo);
    if (isAnual) {
      fechaFinPeriodo.setFullYear(fechaFinPeriodo.getFullYear() + 1);
    } else {
      fechaFinPeriodo.setMonth(fechaFinPeriodo.getMonth() + 1);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (monto <= 0) return;
    setLoading(true);
    try {
      const defaultObs = mode === 'ADELANTO'
        ? `Adelanto de pago período ${formatDatePeru(fechaInicioPeriodo)} al ${formatDatePeru(fechaFinPeriodo)}`
        : `Renovación de servicio período ${formatDatePeru(fechaInicioPeriodo)} al ${formatDatePeru(fechaFinPeriodo)}`;

      await onConfirm(client, {
        monto,
        fechaPago,
        medioPago,
        codigoOperacion: codigoOperacion.trim(),
        observaciones: observaciones.trim() || defaultObs,
      });
      onClose();
    } catch (err) {
      console.error('Error al procesar pago:', err);
    } finally {
      setLoading(false);
    }
  };

  const isAdelanto = mode === 'ADELANTO';

  return (
    <div className="modal d-block bg-dark bg-opacity-50" tabIndex={-1} style={{ backdropFilter: 'blur(4px)', zIndex: 1060 }}>
      <div className="modal-dialog modal-dialog-centered my-4">
        <div className="modal-content rounded-4 shadow-lg border-0 overflow-hidden">
          <div className="modal-header bg-light border-bottom px-4 py-3">
            <div className="d-flex align-items-center gap-2">
              <div className={`p-2 ${isAdelanto ? 'bg-warning text-dark' : 'bg-primary text-white'} rounded-3 shadow-sm`}>
                {isAdelanto ? <CalendarPlus size={18} /> : <RefreshCw size={18} />}
              </div>
              <div>
                <h5 className="modal-title fw-bold text-dark mb-0">
                  {isAdelanto ? 'Registrar Adelanto de Pago' : 'Confirmar Pago / Renovación'}
                </h5>
                <small className="text-muted fw-semibold">
                  {isAdelanto
                    ? 'Cobro del siguiente período para cliente con servicio activo'
                    : 'Cobro del período actual pendiente (mantiene ancla de ciclo)'}
                </small>
              </div>
            </div>
            <button type="button" className="btn-close" onClick={onClose} disabled={loading}></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4 bg-white">
              {/* Resumen del Cliente */}
              <div className="p-3 bg-light rounded-3 border mb-3">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="small text-muted fw-bold">Cliente / Empresa:</span>
                  <div className="d-flex gap-1">
                    <span className="badge bg-primary text-white">{client.planContratado || 'PLAN INICIA'}</span>
                    <span className="badge bg-secondary text-white">{client.tipoSuscripcion || 'MENSUAL'}</span>
                  </div>
                </div>
                <div className="fw-bold text-dark fs-6">{client.razonSocial}</div>
                <div className="small text-muted">RUC: <strong className="text-dark font-monospace">{client.ruc}</strong></div>
              </div>

              {/* Banner Informativo del Periodo Cubierto (Inmutable) */}
              <div className={`alert ${isAdelanto ? 'alert-warning border-warning' : 'alert-info border-info'} border-opacity-25 d-flex gap-2.5 p-3 rounded-3 mb-3`}>
                <AlertCircle size={20} className={`${isAdelanto ? 'text-warning text-dark' : 'text-info'} flex-shrink-0 mt-0.5`} />
                <div className="small text-dark" style={{ lineHeight: '1.45' }}>
                  <div>
                    <strong>Período a Facturar:</strong>{' '}
                    <span className="badge bg-white text-dark border fw-bold">
                      {formatDatePeru(fechaInicioPeriodo)} al {formatDatePeru(fechaFinPeriodo)}
                    </span>
                  </div>
                  <div className="mt-1 text-muted">
                    {isAdelanto
                      ? '✨ Cobertura extendida: El cliente mantiene sus días vigentes y la fecha de corte se aplaza al siguiente mes.'
                      : '📌 Ciclo contractual fijo: Aunque el pago se reciba con retraso, el ciclo de corte del cliente no se desplaza.'}
                  </div>
                </div>
              </div>

              {/* Grid de Formulario */}
              <div className="row g-3">
                {/* Monto del Plan */}
                <div className="col-12 col-sm-6">
                  <label className="form-label small fw-bold text-dark mb-1">
                    Monto a Cobrar:
                  </label>
                  <div className="input-group input-group-sm">
                    <span className="input-group-text bg-light fw-bold text-muted">S/</span>
                    <input
                      type="text"
                      className="form-control fw-bold text-primary bg-light"
                      value={monto.toFixed(2)}
                      readOnly
                    />
                  </div>
                  <small className="text-muted" style={{ fontSize: '0.75rem' }}>Precio de lista del plan</small>
                </div>

                {/* Fecha Real del Pago */}
                <div className="col-12 col-sm-6">
                  <label className="form-label small fw-bold text-dark mb-1">
                    <Calendar size={13} className="me-1 inline" /> Fecha Real del Pago:
                  </label>
                  <input
                    type="date"
                    className="form-control form-control-sm fw-semibold"
                    value={fechaPago}
                    onChange={(e) => setFechaPago(e.target.value)}
                    required
                  />
                  <small className="text-muted" style={{ fontSize: '0.75rem' }}>Día en que ingresó el dinero al banco</small>
                </div>

                {/* Medio de Pago */}
                <div className="col-12 col-sm-6">
                  <label className="form-label small fw-bold text-dark mb-1">
                    Medio de Pago:
                  </label>
                  <select
                    className="form-select form-select-sm fw-semibold"
                    value={medioPago}
                    onChange={(e) => setMedioPago(e.target.value)}
                  >
                    <option value="TRANSFERENCIA">Transferencia Bancaria</option>
                    <option value="YAPE">Yape</option>
                    <option value="PLIN">Plin</option>
                    <option value="EFECTIVO">Efectivo</option>
                    <option value="OTRO">Otro Medio</option>
                  </select>
                </div>

                {/* Código de Operación */}
                <div className="col-12 col-sm-6">
                  <label className="form-label small fw-bold text-dark mb-1">
                    N.° de Operación (Voucher):
                  </label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Ej. OP-1948202"
                    value={codigoOperacion}
                    onChange={(e) => setCodigoOperacion(e.target.value)}
                  />
                </div>

                {/* Observaciones */}
                <div className="col-12">
                  <label className="form-label small fw-bold text-dark mb-1">
                    Observaciones (Opcional):
                  </label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder={isAdelanto ? "Detalle del adelanto..." : "Detalle de la renovación..."}
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer px-4 py-3 bg-light border-top d-flex justify-content-end gap-2">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary px-3 py-1.5 fw-semibold"
                onClick={onClose}
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className={`btn btn-sm ${isAdelanto ? 'btn-warning text-dark' : 'btn-success text-white'} px-4 py-1.5 fw-bold shadow-sm d-inline-flex align-items-center gap-1.5`}
                disabled={loading || monto <= 0}
              >
                {loading ? (
                  <span>Procesando pago...</span>
                ) : (
                  <>
                    <CheckCircle size={15} />
                    <span>{isAdelanto ? 'Confirmar Adelanto' : 'Registrar Renovación'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
