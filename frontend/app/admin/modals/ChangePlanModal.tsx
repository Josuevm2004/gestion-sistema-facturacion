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

  const monthlyPlanPrices: Record<string, number> = {
    INICIA: 19,
    EMPRENDE: 29,
    IMPULSA: 39,
    EMPRESARIAL: 59,
    LIDER: 89,
  };
  const annualPlanPrices: Record<string, number> = {
    INICIA: 190,
    EMPRENDE: 290,
    IMPULSA: 390,
    EMPRESARIAL: 590,
    LIDER: 890,
  };
  const normalizePlanKey = (planStr?: string) => {
    const normalized = (planStr || 'EMPRENDE')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/^PLAN\s+/, '')
      .trim();
    return normalized === 'INICIAL' ? 'INICIA' : normalized;
  };
  const selectedPlanKey = normalizePlanKey(cambioPlanSeleccionado);
  const montoTotal =
    cambioPlanTipo === 'ANUAL'
      ? annualPlanPrices[selectedPlanKey] || 290
      : monthlyPlanPrices[selectedPlanKey] || 29;

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
              Plan actual: <strong>{cambioPlanClient.planContratado}</strong> ({cambioPlanClient.tipoSuscripcion || 'MENSUAL'}) — S/{' '}
              {cambioPlanClient.montoMensual.toFixed(2)}/mes
            </p>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold">Nuevo Plan</label>
                <select
                  className="form-select"
                  value={selectedPlanKey}
                  onChange={(e) => setCambioPlanSeleccionado(e.target.value)}
                >
                  <option value="INICIA">Plan Inicia — S/ 19/mes (50 Docs)</option>
                  <option value="EMPRENDE">Plan Emprende — S/ 29/mes (100 Docs)</option>
                  <option value="IMPULSA">Plan Impulsa — S/ 39/mes (200 Docs)</option>
                  <option value="EMPRESARIAL">Plan Empresarial — S/ 59/mes (500 Docs)</option>
                  <option value="LIDER">Plan Líder — S/ 89/mes (1000 Docs)</option>
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
              Nuevo plan: <strong>{cambioPlanSeleccionado}</strong> — Cobro a registrar:{' '}
              <strong>S/ {montoTotal.toFixed(2)}</strong>
              {cambioPlanTipo === 'ANUAL' ? ' (anual)' : ' (mensual)'}
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
