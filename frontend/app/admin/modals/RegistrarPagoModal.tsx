'use client';

import React, { useState, useMemo } from 'react';
import { Calendar, RefreshCw, CalendarPlus, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { Client } from '../components/ClientesTodosTab';
import { parseLocalDate, getTodayLocalMidnight, formatDatePeru } from '@/lib/billing';

export type RegistrarPagoMode = 'ADELANTO' | 'REANUDAR_PAGO' | 'RENOVAR_PRORRATEO' | 'RENOVACION';

export interface PaymentSubmissionData {
  monto: number;
  fechaPago: string; // YYYY-MM-DD
  medioPago: string; // TRANSFERENCIA, YAPE, PLIN, EFECTIVO, OTRO
  codigoOperacion: string;
  observaciones: string;
  conProrrateo?: boolean;
}

interface RegistrarPagoModalProps {
  client: Client | null;
  mode: RegistrarPagoMode;
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

  const isAdelanto = mode === 'ADELANTO';
  const isReanudarPago = mode === 'REANUDAR_PAGO';
  const isRenovarProrrateo = mode === 'RENOVAR_PRORRATEO' || mode === 'RENOVACION';
  const conProrrateo = isRenovarProrrateo;

  const precioOficialPlan = Number(client.precioPlan || client.montoMensual || 19);
  const rawVenc = client.fechaVencimientoMensual || client.fechaFinServicio;
  const vencDate = parseLocalDate(rawVenc);
  const isAnual = (client.tipoSuscripcion || 'MENSUAL').toUpperCase() === 'ANUAL';

  // Fecha real del pago: por defecto HOY en hora local de Perú (YYYY-MM-DD)
  const now = getTodayLocalMidnight();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const [fechaPago, setFechaPago] = useState<string>(todayStr);
  const [medioPago, setMedioPago] = useState<string>('TRANSFERENCIA');
  const [codigoOperacion, setCodigoOperacion] = useState<string>('');
  const [observaciones, setObservaciones] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const payDate = parseLocalDate(fechaPago) || now;

  // Cálculo determinístico del período y monto a cobrar según el flujo
  const { monto, fechaInicioPeriodo, fechaFinPeriodo, detalleCalculo } = useMemo(() => {
    if (isAdelanto) {
      const inicio = vencDate && vencDate >= now ? vencDate : now;
      const fin = new Date(inicio);
      if (isAnual) {
        fin.setFullYear(fin.getFullYear() + 1);
      } else {
        fin.setMonth(fin.getMonth() + 1);
      }
      return {
        monto: precioOficialPlan,
        fechaInicioPeriodo: inicio,
        fechaFinPeriodo: fin,
        detalleCalculo: 'Cobro de siguiente período (precio oficial de lista)',
      };
    }

    if (isReanudarPago) {
      // Reanudar fecha de pago: ciclo completo garantizado desde el 1.° del mes
      const primerDiaMesActual = new Date(now.getFullYear(), now.getMonth(), 1);
      let inicio = primerDiaMesActual;
      if (vencDate && vencDate >= primerDiaMesActual) {
        inicio = new Date(vencDate.getFullYear(), vencDate.getMonth(), 1);
      }
      const fin = new Date(inicio);
      if (isAnual) {
        fin.setFullYear(fin.getFullYear() + 1);
      } else {
        fin.setMonth(fin.getMonth() + 1);
      }
      return {
        monto: precioOficialPlan,
        fechaInicioPeriodo: inicio,
        fechaFinPeriodo: fin,
        detalleCalculo: 'Ciclo completo desde el 1.° del mes (habilitado)',
      };
    }

    // RENOVAR_PRORRATEO (Renovación con prorrateo por atraso de pago)
    const inicio = payDate;
    if (isAnual) {
      const fin = new Date(inicio);
      fin.setFullYear(fin.getFullYear() + 1);
      return {
        monto: precioOficialPlan,
        fechaInicioPeriodo: inicio,
        fechaFinPeriodo: fin,
        detalleCalculo: 'Suscripción anual completa (inicia en fecha de pago)',
      };
    }

    const dia = payDate.getDate();
    const y = payDate.getFullYear();
    const m = payDate.getMonth();

    if (dia >= 10) {
      // Segundo Prorrateo (día >= 10)
      const nextMonthLastDay = new Date(y, m + 2, 0).getDate();
      const fechaInicioAdicional = new Date(y, m + 1, Math.min(dia, nextMonthLastDay));
      const fechaFinExclusiva = new Date(fechaInicioAdicional.getFullYear(), fechaInicioAdicional.getMonth() + 1, 1);
      const msDia = 24 * 60 * 60 * 1000;
      const diasAdicionales = Math.max(0, Math.round((fechaFinExclusiva.getTime() - fechaInicioAdicional.getTime()) / msDia));
      const precioDiario = precioOficialPlan / nextMonthLastDay;
      const montoAdicional = Number((precioDiario * diasAdicionales).toFixed(2));
      const total = Number((precioOficialPlan + montoAdicional).toFixed(2));
      return {
        monto: total,
        fechaInicioPeriodo: inicio,
        fechaFinPeriodo: fechaFinExclusiva,
        detalleCalculo: `Segundo prorrateo (día ${dia}): Mes base (S/ ${precioOficialPlan.toFixed(2)}) + ${diasAdicionales} días adic. (S/ ${montoAdicional.toFixed(2)})`,
      };
    } else {
      // Primer Prorrateo (día < 10)
      const fechaFinPrimer = new Date(y, m + 1, 1);
      const diasMes = new Date(y, m + 1, 0).getDate();
      const msDia = 24 * 60 * 60 * 1000;
      const diasCobrados = Math.max(1, Math.round((fechaFinPrimer.getTime() - payDate.getTime()) / msDia));
      const precioDiario = precioOficialPlan / diasMes;
      const total = Math.round(precioDiario * diasCobrados);
      return {
        monto: total,
        fechaInicioPeriodo: inicio,
        fechaFinPeriodo: fechaFinPrimer,
        detalleCalculo: `Primer prorrateo (día ${dia}): ${diasCobrados} días cobrados hasta el 1.° del próximo mes`,
      };
    }
  }, [isAdelanto, isReanudarPago, precioOficialPlan, vencDate, now, isAnual, payDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (monto <= 0) return;
    setLoading(true);
    try {
      const defaultObs = isAdelanto
        ? `Adelanto de pago período ${formatDatePeru(fechaInicioPeriodo)} al ${formatDatePeru(fechaFinPeriodo)}`
        : isReanudarPago
        ? `Reanudación de fecha de pago período ${formatDatePeru(fechaInicioPeriodo)} al ${formatDatePeru(fechaFinPeriodo)}`
        : `Renovación con prorrateo por atraso de pago período ${formatDatePeru(fechaInicioPeriodo)} al ${formatDatePeru(fechaFinPeriodo)}`;

      await onConfirm(client, {
        monto,
        fechaPago,
        medioPago,
        codigoOperacion: codigoOperacion.trim(),
        observaciones: observaciones.trim() || defaultObs,
        conProrrateo,
      });
      onClose();
    } catch (err) {
      console.error('Error al procesar pago:', err);
    } finally {
      setLoading(false);
    }
  };

  const headerColor = isAdelanto
    ? 'bg-warning text-dark'
    : isReanudarPago
    ? 'bg-primary text-white'
    : 'bg-info text-dark';

  const modalTitle = isAdelanto
    ? 'Registrar Adelanto de Pago'
    : isReanudarPago
    ? 'Reanudar Fecha de Pago'
    : 'Renovar Servicio (con Prorrateo)';

  const modalSubtitle = isAdelanto
    ? 'Cobro del siguiente período para cliente con servicio activo'
    : isReanudarPago
    ? 'Cobro del ciclo completo para cliente que continuó consumiendo habilitado'
    : 'Renovación proporcional por atraso de pago desde la fecha real';

  const submitButtonColor = isAdelanto
    ? 'btn-warning text-dark'
    : isReanudarPago
    ? 'btn-primary text-white'
    : 'btn-success text-white';

  const submitButtonText = isAdelanto
    ? 'Confirmar Adelanto'
    : isReanudarPago
    ? 'Reanudar Fecha de Pago'
    : 'Confirmar Renovación con Prorrateo';

  return (
    <div className="modal d-block bg-dark bg-opacity-50" tabIndex={-1} style={{ backdropFilter: 'blur(4px)', zIndex: 1060 }}>
      <div className="modal-dialog modal-dialog-centered my-4">
        <div className="modal-content rounded-4 shadow-lg border-0 overflow-hidden">
          <div className="modal-header bg-light border-bottom px-4 py-3">
            <div className="d-flex align-items-center gap-2">
              <div className={`p-2 ${headerColor} rounded-3 shadow-sm`}>
                {isAdelanto ? <CalendarPlus size={18} /> : isReanudarPago ? <RefreshCw size={18} /> : <Clock size={18} />}
              </div>
              <div>
                <h5 className="modal-title fw-bold text-dark mb-0">
                  {modalTitle}
                </h5>
                <small className="text-muted fw-semibold">
                  {modalSubtitle}
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

              {/* Banner Informativo del Flujo Seleccionado */}
              <div
                className={`alert ${
                  isAdelanto
                    ? 'alert-warning border-warning'
                    : isReanudarPago
                    ? 'alert-primary border-primary'
                    : 'alert-info border-info'
                } border-opacity-25 d-flex gap-2.5 p-3 rounded-3 mb-3`}
              >
                <AlertCircle
                  size={20}
                  className={`${
                    isAdelanto
                      ? 'text-warning text-dark'
                      : isReanudarPago
                      ? 'text-primary'
                      : 'text-info'
                  } flex-shrink-0 mt-0.5`}
                />
                <div className="small text-dark" style={{ lineHeight: '1.45' }}>
                  <div>
                    <strong>Período a Facturar:</strong>{' '}
                    <span className="badge bg-white text-dark border fw-bold">
                      {formatDatePeru(fechaInicioPeriodo)} al {formatDatePeru(fechaFinPeriodo)}
                    </span>
                  </div>
                  <div className="mt-1 text-muted">
                    {isAdelanto && (
                      <>✨ <strong>Cobertura extendida:</strong> El cliente mantiene sus días vigentes y la fecha de corte se aplaza al siguiente mes.</>
                    )}
                    {isReanudarPago && (
                      <>📌 <strong>Ciclo contractual completo:</strong> El cliente venció pero siguió habilitado consumiendo el sistema. Su pago cuenta desde su fecha de corte contractual (el 1.°), cubriendo el ciclo completo.</>
                    )}
                    {isRenovarProrrateo && (
                      <>⚡ <strong>Prorrateo por atraso de pago:</strong> El nuevo servicio inicia en la fecha real de pago ({formatDatePeru(fechaInicioPeriodo)}) y el cobro se ajusta proporcionalmente a los días a disfrutar.</>
                    )}
                  </div>
                </div>
              </div>

              {/* Grid de Formulario */}
              <div className="row g-3">
                {/* Monto a Cobrar */}
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
                  <small className="text-muted d-block mt-0.5" style={{ fontSize: '0.73rem', lineHeight: '1.2' }}>
                    {detalleCalculo}
                  </small>
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
                  <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                    {isRenovarProrrateo ? 'Define el día de inicio del prorrateo' : 'Día en que ingresó el dinero'}
                  </small>
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
                    placeholder={
                      isAdelanto
                        ? 'Detalle del adelanto...'
                        : isReanudarPago
                        ? 'Detalle de la reanudación desde corte...'
                        : 'Detalle de la renovación con prorrateo...'
                    }
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
                className={`btn btn-sm ${submitButtonColor} px-4 py-1.5 fw-bold shadow-sm d-inline-flex align-items-center gap-1.5`}
                disabled={loading || monto <= 0}
              >
                {loading ? (
                  <span>Procesando pago...</span>
                ) : (
                  <>
                    <CheckCircle size={15} />
                    <span>{submitButtonText}</span>
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

