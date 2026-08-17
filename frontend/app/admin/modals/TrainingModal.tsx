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
                  <h6 className="fw-bold text-primary mb-2">Cálculo de Prorrateo con Corte Día {MONTHLY_BILLING_DAY} (Fórmula Mcobro)</h6>
                  <div className="small">
                    <div>
                      Plan contratado: <strong>{trainingClient.planContratado} (S/ {trainingClient.montoMensual})</strong>
                    </div>
                    <div>
                      Días del ciclo (Dtotal): <strong>{prorrateoCalculado.diasTotales} días</strong>
                    </div>
                    <div>
                      Día de capacitación (Dcap): <strong>Día {prorrateoCalculado.diaCapacitacion}</strong>
                    </div>
                    {!prorrateoCalculado.isAnual && (
                      <div>
                        Días no consumidos a descontar: <strong>{prorrateoCalculado.diaCapacitacion - 1} días</strong>
                      </div>
                    )}
                    <div className="fs-5 fw-bold text-success mt-2">
                      Cobro al corte del día {MONTHLY_BILLING_DAY}: S/ {prorrateoCalculado.montoProrrateado.toFixed(2)}
                    </div>
                    <div className="text-muted small">Fecha límite de pago ajustada: {prorrateoCalculado.fechaVencimiento}</div>
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
