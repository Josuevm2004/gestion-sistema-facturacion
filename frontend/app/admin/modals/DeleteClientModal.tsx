'use client';

import React from 'react';
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
    <div className="modal d-block bg-dark bg-opacity-50" tabIndex={-1}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content rounded-3 shadow border-danger">
          <div className="modal-header border-bottom bg-danger text-white">
            <h5 className="modal-title fw-bold">¿Eliminar Cliente Definitivamente?</h5>
            <button type="button" className="btn-close btn-close-white" onClick={() => setDeletingClient(null)}></button>
          </div>
          <div className="modal-body">
            <p className="mb-2">
              ¿Estás seguro de que deseas eliminar permanentemente a <strong>{deletingClient.razonSocial}</strong> (RUC:{' '}
              {deletingClient.ruc})?
            </p>
            <div className="alert alert-warning mb-0 small">
              Esta acción eliminará el registro permanentemente del sistema y no se podrá deshacer.
            </div>
          </div>
          <div className="modal-footer border-top">
            <button type="button" className="btn btn-secondary" onClick={() => setDeletingClient(null)}>
              Cancelar
            </button>
            <button type="button" className="btn btn-danger" onClick={handleDeleteClientConfirm}>
              Sí, Eliminar Cliente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
