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
    <div className="modal d-block bg-dark bg-opacity-50" tabIndex={-1}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content rounded-3 shadow">
          <div className="modal-header border-bottom">
            <h5 className="modal-title fw-bold">Cambio de Plan: {cambioPlanClient.razonSocial}</h5>
            <button type="button" className="btn-close" onClick={() => setCambioPlanClient(null)}></button>
          </div>
          <div className="modal-body">
            <p className="small text-muted mb-3">
              Plan actual: <strong>{cambioPlanClient.planContratado}</strong> ({cambioPlanClient.tipoSuscripcion || 'MENSUAL'})
            </p>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold">Nuevo Plan</label>
                <select
                  className="form-select"
                  value={selectedPlanKey}
                  onChange={(e) => setCambioPlanSeleccionado(e.target.value)}
                >
                  <option value="INICIA">Plan Inicia</option>
                  <option value="EMPRENDE">Plan Emprende</option>
                  <option value="IMPULSA">Plan Impulsa</option>
                  <option value="EMPRESARIAL">Plan Empresarial</option>
                  <option value="LIDER">Plan Líder</option>
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">Tipo Suscripción</label>
                <select
                  className="form-select"
                  value={cambioPlanTipo}
                  onChange={(e) => setCambioPlanTipo(e.target.value)}
                >
                  <option value="MENSUAL">Mensual</option>
                  <option value="ANUAL">Anual</option>
                </select>
              </div>
            </div>

            <div className="alert alert-info mt-3 mb-0 small">
              Nuevo plan: <strong>{cambioPlanSeleccionado}</strong>. El cobro se calculará con el precio registrado en la base de datos.
            </div>
          </div>
          <div className="modal-footer border-top">
            <button type="button" className="btn btn-secondary" onClick={() => setCambioPlanClient(null)}>
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-warning text-dark fw-semibold"
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
