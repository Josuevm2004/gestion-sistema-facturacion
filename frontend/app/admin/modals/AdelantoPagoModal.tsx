'use client';

import React, { useState } from 'react';
import { Calendar, DollarSign, CheckCircle, X, AlertCircle } from 'lucide-react';
import { Client } from '../components/ClientesTodosTab';
import { parseLocalDate, getTodayLocalMidnight, formatDatePeru } from '@/lib/billing';

interface AdelantoPagoModalProps {
  client: Client | null;
  onClose: () => void;
  onConfirm: (client: Client, monto: number, observaciones: string) => Promise<void> | void;
}

export function AdelantoPagoModal({ client, onClose, onConfirm }: AdelantoPagoModalProps) {
  if (!client) return null;

  const currentMonto = client.montoSiguienteCobro || client.montoMensual || client.precioPlan || 19;
  const [monto, setMonto] = useState<number>(Number(currentMonto));
  const [observaciones, setObservaciones] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Calcular fechas de forma determinista y segura en cualquier zona horaria
  const rawVenc = client.fechaVencimientoMensual || client.fechaFinServicio;
  const vencDate = parseLocalDate(rawVenc);
  const now = getTodayLocalMidnight();

  // La nueva fecha de inicio es la fecha de vencimiento actual (si es futura o igual a hoy) o hoy
  const fechaInicioCalculada = vencDate && vencDate >= now ? vencDate : now;

  // La nueva fecha de fin es un mes (o año) después de la fecha de inicio
  const fechaFinCalculada = new Date(fechaInicioCalculada);
  if ((client.tipoSuscripcion || 'MENSUAL').toUpperCase() === 'ANUAL') {
    fechaFinCalculada.setFullYear(fechaFinCalculada.getFullYear() + 1);
  } else {
    fechaFinCalculada.setMonth(fechaFinCalculada.getMonth() + 1);
  }

  const formatDate = (d: Date) => formatDatePeru(d);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (monto <= 0) return;
    setLoading(true);
    try {
      await onConfirm(
        client,
        monto,
        observaciones.trim() || `Adelanto de pago para periodo ${formatDate(fechaInicioCalculada)} al ${formatDate(fechaFinCalculada)}`
      );
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal d-block bg-dark bg-opacity-50" tabIndex={-1} style={{ backdropFilter: 'blur(4px)' }}>
      <div className="modal-dialog modal-dialog-centered my-4">
        <div className="modal-content rounded-4 shadow-lg border-0 overflow-hidden">
          <div className="modal-header bg-light border-bottom px-4 py-3">
            <div className="d-flex align-items-center gap-2">
              <div className="p-2 bg-success text-white rounded-3 shadow-sm">
                <Calendar size={18} />
              </div>
              <div>
                <h5 className="modal-title fw-bold text-dark mb-0">Registrar Adelanto de Pago</h5>
                <small className="text-muted fw-semibold">
                  Extensión del servicio para el siguiente periodo
                </small>
              </div>
            </div>
            <button type="button" className="btn-close" onClick={onClose} disabled={loading}></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4 bg-white">
              {/* Resumen del Cliente */}
              <div className="p-3 bg-light rounded-3 border mb-3">
                <div className="d-flex justify-content-between align-items-center mb-1.5">
                  <span className="small text-muted fw-bold">Cliente:</span>
                  <span className="badge bg-primary text-white">{client.planContratado || 'PLAN INICIA'}</span>
                </div>
                <div className="fw-bold text-dark fs-6 mb-1">{client.razonSocial}</div>
                <div className="small text-muted">RUC: <strong className="text-dark">{client.ruc}</strong></div>
              </div>

              {/* Explicación Visual del Periodo Adelantado */}
              <div className="alert alert-info border-info border-opacity-25 d-flex gap-2.5 p-3 rounded-3 mb-3">
                <AlertCircle size={20} className="text-info flex-shrink-0 mt-0.5" />
                <div className="small text-dark" style={{ lineHeight: '1.45' }}>
                  <strong>Lógica de Adelanto:</strong> El pago se registra hoy, pero la nueva vigencia del servicio iniciará el <strong>{formatDate(fechaInicioCalculada)}</strong> y vencerá el <strong>{formatDate(fechaFinCalculada)}</strong>. ¡El cliente no pierde sus días actuales!
                </div>
              </div>

              {/* Formulario */}
              <div className="mb-3">
                <label className="form-label small fw-bold text-dark mb-1">
                  Monto a Cobrar (S/):
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-light fw-bold text-muted">S/</span>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control fw-bold fs-5 text-primary bg-light"
                    value={monto}
                    readOnly
                  />
                </div>
                <small className="text-muted">Monto del ciclo: S/ {Number(currentMonto).toFixed(2)}</small>
              </div>

              <div className="mb-2">
                <label className="form-label small fw-bold text-dark mb-1">
                  Observaciones / N.° de Operación (Opcional):
                </label>
                <input
                  type="text"
                  className="form-control rounded-3"
                  placeholder="Ej. Transferencia BCP N.° 123456"
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-footer px-4 py-3 bg-light border-top d-flex justify-content-end gap-2">
              <button
                type="button"
                className="btn btn-outline-secondary px-3.5 py-1.5 fw-semibold"
                onClick={onClose}
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-success px-4 py-1.5 fw-bold text-white shadow-sm d-inline-flex align-items-center gap-1.5"
                disabled={loading || monto <= 0}
              >
                {loading ? (
                  <span>Procesando...</span>
                ) : (
                  <>
                    <CheckCircle size={15} />
                    <span>Confirmar Adelanto</span>
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
