'use client';

import React from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { Client } from '../components/ClientesTodosTab';

interface DeleteClientModalProps {
  deletingClient: Client | null;
  setDeletingClient: (client: Client | null) => void;
  handleDeleteClientConfirm: () => void;
}

export default function DeleteClientModal({
  deletingClient,
  setDeletingClient,
  handleDeleteClientConfirm,
}: DeleteClientModalProps) {
  if (!deletingClient) return null;

  return (
    <div className="modal d-block bg-dark bg-opacity-50" tabIndex={-1} style={{ backdropFilter: 'blur(6px)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content rounded-4 shadow-lg border-0">
          <div className="modal-header border-bottom bg-white px-4 py-3 d-flex justify-content-between align-items-center">
            <h5 className="modal-title fw-bold text-dark mb-0 d-flex align-items-center gap-2">
              <div className="d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#FEE2E2', color: '#DC2626' }}>
                <AlertTriangle size={16} />
              </div>
              <span>¿Eliminar Cliente Definitivamente?</span>
            </h5>
            <button
              type="button"
              className="btn-circle-meta border-0 text-muted"
              onClick={() => setDeletingClient(null)}
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
          <div className="modal-body p-4">
            <p className="mb-3 text-secondary">
              ¿Estás seguro de que deseas eliminar permanentemente a <strong className="text-dark">{deletingClient.razonSocial}</strong> (RUC:{' '}
              {deletingClient.ruc})?
            </p>
            <div className="alert alert-warning mb-0 small rounded-4 border-0" style={{ backgroundColor: '#FEF3C7', color: '#B45309' }}>
              Esta acción eliminará el registro permanentemente del sistema y no se podrá deshacer.
            </div>
          </div>
          <div className="modal-footer border-top bg-white px-4 py-3 d-flex justify-content-end gap-2">
            <button
              type="button"
              className="btn btn-light rounded-pill px-4 py-2 fw-semibold text-dark border-0"
              style={{ backgroundColor: '#E4E6EB' }}
              onClick={() => setDeletingClient(null)}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-danger rounded-pill px-4 py-2 fw-bold text-white shadow-sm"
              onClick={handleDeleteClientConfirm}
            >
              Sí, Eliminar Cliente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
