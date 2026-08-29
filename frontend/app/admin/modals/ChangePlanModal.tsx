'use client';

import React from 'react';
import { Client } from '../components/ClientesTodosTab';

interface ChangePlanModalProps {
  cambioPlanClient: Client | null;
  setCambioPlanClient: (client: Client | null) => void;
  cambioPlanSeleccionado: string;
  setCambioPlanSeleccionado: (plan: string) => void;
  cambioPlanTipo: string;
  setCambioPlanTipo: (tipo: string) => void;
  handleRenovarPlan: (client: Client, nuevoPlan?: string, nuevoTipo?: string) => Promise<void>;
}

export default function ChangePlanModal({
  cambioPlanClient,
  setCambioPlanClient,
  cambioPlanSeleccionado,
  setCambioPlanSeleccionado,
  cambioPlanTipo,
  setCambioPlanTipo,
  handleRenovarPlan,
}: ChangePlanModalProps) {
  if (!cambioPlanClient) return null;

  const normalizePlanKey = (planStr?: string) => {
    const normalized = (planStr || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/^PLAN\s+/, '')
      .trim();
    return normalized === 'INICIAL' ? 'INICIA' : normalized;
  };
  const selectedPlanKey = normalizePlanKey(cambioPlanSeleccionado);

  return (
    <div className="modal d-block bg-dark bg-opacity-50" tabIndex={-1} style={{ backdropFilter: 'blur(6px)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content rounded-4 shadow-lg border-0">
          <div className="modal-header border-bottom bg-light px-4 py-3">
            <div>
              <h5 className="modal-title fw-bold text-dark mb-0">Cambio de Plan</h5>
              <small className="text-muted fw-semibold">{cambioPlanClient.razonSocial} | RUC: {cambioPlanClient.ruc}</small>
            </div>
            <button type="button" className="btn-close" onClick={() => setCambioPlanClient(null)}></button>
          </div>
          <div className="modal-body p-4">
            <div className="p-3 bg-light rounded-3 border mb-3">
              <div className="small text-muted mb-1">Plan Actual:</div>
              <div className="d-flex align-items-center gap-2">
                <span className="badge bg-secondary text-white px-2.5 py-1.5 fs-6">{cambioPlanClient.planContratado}</span>
                <span className="badge bg-light text-dark border fw-bold">{cambioPlanClient.tipoSuscripcion || 'MENSUAL'}</span>
                <span className="fw-bold text-dark ms-auto">S/ {Number(cambioPlanClient.montoMensual || 0).toFixed(2)}</span>
              </div>
            </div>

            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label fw-bold text-dark">Nuevo Plan</label>
                <select
                  className="form-select fw-semibold"
                  value={selectedPlanKey}
                  onChange={(e) => setCambioPlanSeleccionado(e.target.value)}
                >
                  <option value="INICIA">Plan Inicia (S/ 19.00)</option>
                  <option value="EMPRENDE">Plan Emprende (S/ 29.00)</option>
                  <option value="IMPULSA">Plan Impulsa (S/ 39.00)</option>
                  <option value="EMPRESARIAL">Plan Empresarial (S/ 59.00)</option>
                  <option value="LIDER">Plan Líder (S/ 89.00)</option>
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label fw-bold text-dark">Tipo Suscripción</label>
                <select
                  className="form-select fw-semibold"
                  value={cambioPlanTipo}
                  onChange={(e) => setCambioPlanTipo(e.target.value)}
                >
                  <option value="MENSUAL">Mensual</option>
                  <option value="ANUAL">Anual</option>
                </select>
              </div>
            </div>

            <div className="alert alert-info mt-3 mb-0 small border-info border-opacity-25 bg-info bg-opacity-10 text-dark">
              <strong>Regla Comercial:</strong> Al procesar el cambio a <strong>{cambioPlanSeleccionado} ({cambioPlanTipo})</strong>, el cliente pagará la tarifa completa y se le otorgará el período completo de servicio correspondiente.
            </div>
          </div>
          <div className="modal-footer border-top bg-light px-4 py-3">
            <button type="button" className="btn btn-outline-secondary px-4 fw-semibold" onClick={() => setCambioPlanClient(null)}>
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-warning text-dark fw-bold px-4 shadow-sm"
              onClick={async () => {
                if (
                  cambioPlanSeleccionado === cambioPlanClient.planContratado &&
                  cambioPlanTipo === (cambioPlanClient.tipoSuscripcion || 'MENSUAL')
                ) {
                  alert('Selecciona un plan o tipo de suscripción diferente al actual.');
                  return;
                }
                await handleRenovarPlan(cambioPlanClient, cambioPlanSeleccionado, cambioPlanTipo);
                setCambioPlanClient(null);
              }}
            >
              Confirmar Cambio de Plan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
