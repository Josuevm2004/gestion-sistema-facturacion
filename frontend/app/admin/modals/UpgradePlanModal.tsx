'use client';

import React from 'react';
import { TrendingUp } from 'lucide-react';
import { Client } from '../components/ClientesTodosTab';

interface UpgradePlanModalProps {
  mejoraPlanClient: Client | null;
  setMejoraPlanClient: (client: Client | null) => void;
  mejoraPlanSeleccionado: string;
  setMejoraPlanSeleccionado: (plan: string) => void;
  handleMejorarPlan: (client: Client, nuevoPlan: string) => Promise<void>;
}

const PLANES = [
  { key: 'INICIA', label: 'Plan Inicia' },
  { key: 'EMPRENDE', label: 'Plan Emprende' },
  { key: 'IMPULSA', label: 'Plan Impulsa' },
  { key: 'EMPRESARIAL', label: 'Plan Empresarial' },
  { key: 'LIDER', label: 'Plan Lider' },
];

function normalizePlanKey(planStr?: string) {
  const normalized = (planStr || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/^PLAN\s+/, '')
    .trim();
  return normalized === 'INICIAL' ? 'INICIA' : normalized;
}

export default function UpgradePlanModal({
  mejoraPlanClient,
  setMejoraPlanClient,
  mejoraPlanSeleccionado,
  setMejoraPlanSeleccionado,
  handleMejorarPlan,
}: UpgradePlanModalProps) {
  if (!mejoraPlanClient) return null;

  const currentPlanKey = normalizePlanKey(mejoraPlanClient.planContratado);
  const currentIndex = PLANES.findIndex((p) => p.key === currentPlanKey);
  const upgradeOptions = PLANES.filter((_, idx) => idx > currentIndex);

  return (
    <div className="modal d-block bg-dark bg-opacity-50" tabIndex={-1}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content rounded-3 shadow">
          <div className="modal-header border-bottom">
            <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
              <TrendingUp size={18} className="text-success" />
              <span>Mejorar Plan: {mejoraPlanClient.razonSocial}</span>
            </h5>
            <button type="button" className="btn-close" onClick={() => setMejoraPlanClient(null)}></button>
          </div>

          <div className="modal-body">
            <p className="small text-muted mb-3">
              Plan actual: <strong>{mejoraPlanClient.planContratado}</strong> ({mejoraPlanClient.tipoSuscripcion || 'MENSUAL'})
            </p>

            {upgradeOptions.length === 0 ? (
              <div className="alert alert-warning mb-0 small">
                Este cliente ya está en el plan más alto disponible.
              </div>
            ) : (
              <>
                <label className="form-label fw-semibold">Nuevo Plan Superior</label>
                <select
                  className="form-select"
                  value={mejoraPlanSeleccionado}
                  onChange={(e) => setMejoraPlanSeleccionado(e.target.value)}
                >
                  {upgradeOptions.map((plan) => (
                    <option key={plan.key} value={plan.key}>
                      {plan.label}
                    </option>
                  ))}
                </select>

                <div className="alert alert-info mt-3 mb-0 small">
                  Se registrará una venta por la diferencia proporcional del plan activo. La fecha de inicio y vencimiento del servicio no se modifican.
                </div>
              </>
            )}
          </div>

          <div className="modal-footer border-top">
            <button type="button" className="btn btn-secondary" onClick={() => setMejoraPlanClient(null)}>
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-success fw-semibold"
              disabled={upgradeOptions.length === 0}
              onClick={async () => {
                await handleMejorarPlan(mejoraPlanClient, mejoraPlanSeleccionado);
                setMejoraPlanClient(null);
              }}
            >
              Confirmar Mejora
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
