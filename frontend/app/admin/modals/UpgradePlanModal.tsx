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
  loadSubscriptions: () => Promise<void>;
  handleMejorarPlan: (client: Client, subscriptionId: string) => Promise<void>;
}

export default function UpgradePlanModal({
  mejoraPlanClient,
  setMejoraPlanClient,
  mejoraPlanSeleccionado,
  setMejoraPlanSeleccionado,
  subscriptions,
  loadSubscriptions,
  handleMejorarPlan,
}: UpgradePlanModalProps) {
  const loadRequestedRef = React.useRef(false);

  React.useEffect(() => {
    if (!mejoraPlanClient) {
      loadRequestedRef.current = false;
      return;
    }
    if (subscriptions.length === 0 && !loadRequestedRef.current) {
      loadRequestedRef.current = true;
      void loadSubscriptions();
    }
  }, [mejoraPlanClient, subscriptions.length, loadSubscriptions]);

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
    <div className="modal d-block bg-dark bg-opacity-50" tabIndex={-1} style={{ backdropFilter: 'blur(6px)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content rounded-4 shadow-lg border-0">
          <div className="modal-header border-bottom bg-light px-4 py-3">
            <div>
              <h5 className="modal-title fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                <TrendingUp size={20} className="text-success" />
                <span>Mejorar Plan (Upgrade)</span>
              </h5>
              <small className="text-muted fw-semibold">{mejoraPlanClient.razonSocial} | RUC: {mejoraPlanClient.ruc}</small>
            </div>
            <button type="button" className="btn-close" onClick={() => setMejoraPlanClient(null)}></button>
          </div>

          <div className="modal-body p-4">
            <div className="p-3 bg-light rounded-3 border mb-3">
              <div className="small text-muted mb-1">Plan Actual Contratado:</div>
              <div className="d-flex align-items-center gap-2">
                <span className="badge bg-secondary text-white px-2.5 py-1.5 fs-6">{mejoraPlanClient.planContratado}</span>
                <span className="badge bg-light text-dark border fw-bold">{currentType}</span>
                <span className="fw-bold text-dark ms-auto">S/ {currentPrice.toFixed(2)}</span>
              </div>
            </div>

            {planOptions.length === 0 ? (
              <div className="alert alert-warning mb-0 small">
                No hay tarifas {currentType.toLowerCase()} activas disponibles en la base de datos.
              </div>
            ) : (
              <>
                <label className="form-label fw-bold text-dark">Selecciona el Plan Superior ({currentType})</label>
                <select
                  className="form-select fw-semibold"
                  value={selectedSubscription ? String(selectedSubscription.id) : ''}
                  onChange={(e) => setMejoraPlanSeleccionado(e.target.value)}
                >
                  {planOptions.map((subscription) => {
                    const planName = subscription.plan?.nombrePlan || 'Plan sin nombre';
                    const isHigher = Number(subscription.precio || 0) > currentPrice;
                    return (
                      <option key={String(subscription.id)} value={String(subscription.id)} disabled={!isHigher}>
                        {planName} - S/ {Number(subscription.precio || 0).toFixed(2)}{isHigher ? '' : ' (Tarifa menor o igual - no aplica mejora)'}
                      </option>
                    );
                  })}
                </select>

                <div className="alert alert-success mt-3 mb-0 small border-success border-opacity-25 bg-success bg-opacity-10 text-dark">
                  <strong>Cálculo Automático:</strong> Se registrará el cobro proporcional únicamente por la diferencia del plan. Las fechas de vigencia y aniversario de cobro se conservan intactas.
                </div>
              </>
            )}
          </div>

          <div className="modal-footer border-top bg-light px-4 py-3">
            <button type="button" className="btn btn-outline-secondary px-4 fw-semibold" onClick={() => setMejoraPlanClient(null)}>
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-success fw-bold px-4 shadow-sm"
              disabled={!canUpgrade}
              onClick={async () => {
                if (!selectedSubscription) return;
                await handleMejorarPlan(mejoraPlanClient, String(selectedSubscription.id));
                setMejoraPlanClient(null);
              }}
            >
              Confirmar Mejora de Plan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
