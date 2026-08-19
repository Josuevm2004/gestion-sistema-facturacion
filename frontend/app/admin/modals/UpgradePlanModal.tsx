'use client';

import React from 'react';
import { TrendingUp } from 'lucide-react';
import { Client } from '../components/ClientesTodosTab';

interface UpgradePlanModalProps {
  mejoraPlanClient: Client | null;
  setMejoraPlanClient: (client: Client | null) => void;
  mejoraPlanSeleccionado: string;
  setMejoraPlanSeleccionado: (plan: string) => void;
  subscriptions: Array<{
    id: string | number;
    plan?: { nombrePlan?: string };
    tipoSuscripcion?: string;
    precio?: number;
    activo?: boolean;
  }>;
  handleMejorarPlan: (client: Client, subscriptionId: string) => Promise<void>;
}

export default function UpgradePlanModal({
  mejoraPlanClient,
  setMejoraPlanClient,
  mejoraPlanSeleccionado,
  setMejoraPlanSeleccionado,
  subscriptions,
  handleMejorarPlan,
}: UpgradePlanModalProps) {
  if (!mejoraPlanClient) return null;

  const currentType = (mejoraPlanClient.tipoSuscripcion || 'MENSUAL').toUpperCase();
  const currentPrice = Number(mejoraPlanClient.montoMensual || 0);
  const planOptions = subscriptions
    .filter((subscription) => subscription.activo !== false)
    .filter((subscription) => (subscription.tipoSuscripcion || '').toUpperCase() === currentType)
    .sort((a, b) => Number(a.precio || 0) - Number(b.precio || 0));
  const selectedSubscription = planOptions.find(
    (subscription) => String(subscription.id) === String(mejoraPlanSeleccionado)
  ) || planOptions.find((subscription) => Number(subscription.precio || 0) > currentPrice);
  const canUpgrade = Boolean(selectedSubscription && Number(selectedSubscription.precio || 0) > currentPrice);

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

            {planOptions.length === 0 ? (
              <div className="alert alert-warning mb-0 small">
                No hay tarifas {currentType.toLowerCase()} activas disponibles en la base de datos.
              </div>
            ) : (
              <>
                <label className="form-label fw-semibold">Planes disponibles ({currentType})</label>
                <select
                  className="form-select"
                  value={selectedSubscription ? String(selectedSubscription.id) : ''}
                  onChange={(e) => setMejoraPlanSeleccionado(e.target.value)}
                >
                  {planOptions.map((subscription) => {
                    const planName = subscription.plan?.nombrePlan || 'Plan sin nombre';
                    const isHigher = Number(subscription.precio || 0) > currentPrice;
                    return (
                    <option key={String(subscription.id)} value={String(subscription.id)} disabled={!isHigher}>
                      {planName} - S/ {Number(subscription.precio || 0).toFixed(2)}{isHigher ? '' : ' (no disponible para mejora)'}
                    </option>
                    );
                  })}
                </select>

                <div className="alert alert-info mt-3 mb-0 small">
                  Se registrará una venta por la diferencia proporcional. La fecha de inicio y vencimiento no se modifican, incluso para planes anuales.
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
              disabled={!canUpgrade}
              onClick={async () => {
                if (!selectedSubscription) return;
                await handleMejorarPlan(mejoraPlanClient, String(selectedSubscription.id));
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
