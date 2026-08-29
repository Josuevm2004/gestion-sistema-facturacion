'use client';

import React from 'react';
import { MONTHLY_BILLING_DAY } from '@/lib/billing';
import { Client } from '../components/ClientesTodosTab';

interface TrainingModalProps {
  trainingClient: Client | null;
  setTrainingClient: (client: Client | null) => void;
  trainingDateInput: string;
  setTrainingDateInput: (v: string) => void;
  prorrateoCalculado: any;
  handleSaveTrainingSchedule: (e: React.FormEvent<HTMLFormElement>) => void;
}

export default function TrainingModal({
  trainingClient,
  setTrainingClient,
  trainingDateInput,
  setTrainingDateInput,
  prorrateoCalculado,
  handleSaveTrainingSchedule,
}: TrainingModalProps) {
  if (!trainingClient) return null;

  return (
    <div className="modal d-block bg-dark bg-opacity-50" tabIndex={-1}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content rounded-3 shadow">
          <div className="modal-header border-bottom">
            <h5 className="modal-title fw-bold">Programar Capacitación: {trainingClient.razonSocial}</h5>
            <button type="button" className="btn-close" onClick={() => setTrainingClient(null)}></button>
          </div>
          <form onSubmit={handleSaveTrainingSchedule}>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">Fecha y Hora de Capacitación</label>
                <input
                  type="datetime-local"
                  className="form-control"
                  value={trainingDateInput}
                  onChange={(e) => setTrainingDateInput(e.target.value)}
                  required
                />
              </div>

              {prorrateoCalculado && (
                <div className="p-3 bg-light rounded-3 border">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="badge bg-primary bg-opacity-10 text-primary border border-primary fw-semibold px-2 py-1">
                      {prorrateoCalculado.tipoProrrateo === 'SEGUNDO_PRORRATEO'
                        ? 'Segundo Prorrateo (Días 10 al 31)'
                        : prorrateoCalculado.isAnual
                        ? 'Plan Anual'
                        : `Primer Prorrateo (Días 1 al 9)`}
                    </span>
                    <span className="text-muted small fw-semibold">
                      Plan: {trainingClient.planContratado}
                    </span>
                  </div>

                  <div className="p-2 bg-white rounded-2 border mb-3 small">
                    <div className="d-flex justify-content-between py-1 border-bottom">
                      <span className="text-muted">Tarifa Mensual Base:</span>
                      <strong className="text-dark">S/ {Number(trainingClient.montoMensual || 0).toFixed(2)}</strong>
                    </div>

                    {prorrateoCalculado.tipoProrrateo === 'SEGUNDO_PRORRATEO' ? (
                      <>
                        <div className="d-flex justify-content-between py-1 border-bottom">
                          <span className="text-muted">Tramo de Ajuste Adicional:</span>
                          <span className="fw-semibold text-dark">
                            {prorrateoCalculado.fechaInicioProrrateoAdicional
                              ? new Date(prorrateoCalculado.fechaInicioProrrateoAdicional).toLocaleDateString('es-PE')
                              : '—'}
                            {' al '}
                            {prorrateoCalculado.fechaFinProrrateoAdicional
                              ? new Date(prorrateoCalculado.fechaFinProrrateoAdicional).toLocaleDateString('es-PE')
                              : '—'}
                            {' '}({prorrateoCalculado.diasProrrateoAdicional} días)
                          </span>
                        </div>
                        <div className="d-flex justify-content-between py-1 border-bottom">
                          <span className="text-muted">Prorrateo Adicional:</span>
                          <strong className="text-primary">+ S/ {Number(prorrateoCalculado.montoProrrateoAdicional || 0).toFixed(2)}</strong>
                        </div>
                        <div className="d-flex justify-content-between py-1 border-bottom">
                          <span className="text-muted">Fecha del Próximo Cobro:</span>
                          <strong className="text-dark">{prorrateoCalculado.fechaVencimiento} (00:00 am)</strong>
                        </div>
                        <div className="d-flex justify-content-between align-items-center pt-2">
                          <span className="fw-bold text-dark">Próximo Cobro Unificado:</span>
                          <span className="fs-5 fw-bold text-success">
                            S/ {Number(prorrateoCalculado.montoProrrateado || 0).toFixed(2)}
                          </span>
                        </div>
                        <div className="text-muted mt-2 pt-1 border-top" style={{ fontSize: '0.75rem' }}>
                          * Incluye la siguiente mensualidad regular (S/ {Number(trainingClient.montoMensual || 0).toFixed(2)}) + los {prorrateoCalculado.diasProrrateoAdicional} días de ajuste. A partir del mes siguiente, el cobro continuará en S/ {Number(trainingClient.montoMensual || 0).toFixed(2)} el día 1 de cada mes.
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="d-flex justify-content-between py-1 border-bottom">
                          <span className="text-muted">Día de Capacitación:</span>
                          <span className="fw-semibold text-dark">Día {prorrateoCalculado.diaCapacitacion}</span>
                        </div>
                        <div className="d-flex justify-content-between py-1 border-bottom">
                          <span className="text-muted">Días Cobrados hasta Fin de Mes:</span>
                          <span className="fw-semibold text-dark">{prorrateoCalculado.diasTotales - (prorrateoCalculado.diaCapacitacion - 1)} días</span>
                        </div>
                        <div className="d-flex justify-content-between py-1 border-bottom">
                          <span className="text-muted">Fecha del Próximo Cobro:</span>
                          <strong className="text-dark">{prorrateoCalculado.fechaVencimiento} (00:00 am)</strong>
                        </div>
                        <div className="d-flex justify-content-between align-items-center pt-2">
                          <span className="fw-bold text-dark">Monto Inicial Prorrateado:</span>
                          <span className="fs-5 fw-bold text-success">
                            S/ {Number(prorrateoCalculado.montoProrrateado || 0).toFixed(2)}
                          </span>
                        </div>
                        <div className="text-muted mt-2 pt-1 border-top" style={{ fontSize: '0.75rem' }}>
                          * Al llegar el día {MONTHLY_BILLING_DAY} ({prorrateoCalculado.fechaVencimiento}), la siguiente renovación será por la mensualidad completa de S/ {Number(trainingClient.montoMensual || 0).toFixed(2)}.
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer border-top">
              <button type="button" className="btn btn-secondary" onClick={() => setTrainingClient(null)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-success">
                Confirmar Programación
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
