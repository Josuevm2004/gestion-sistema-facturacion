'use client';

import React from 'react';
import { X } from 'lucide-react';

interface UserModalProps {
  showNewUserModal: boolean;
  setShowNewUserModal: (show: boolean) => void;
  editingUser: any | null;
  setEditingUser: (user: any | null) => void;
  handleSaveUser: (e: React.FormEvent<HTMLFormElement>) => void;
}

export default function UserModal({
  showNewUserModal,
  setShowNewUserModal,
  editingUser,
  setEditingUser,
  handleSaveUser,
}: UserModalProps) {
  return (
    <>
      {/* Modal Registrar Nuevo Usuario */}
      {showNewUserModal && (
        <div className="modal d-block bg-dark bg-opacity-50" tabIndex={-1} style={{ backdropFilter: 'blur(6px)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 shadow-lg border-0">
              <div className="modal-header border-bottom bg-white px-4 py-3 d-flex justify-content-between align-items-center">
                <h5 className="modal-title fw-bold text-dark mb-0">Registrar Nuevo Vendedor / Usuario</h5>
                <button
                  type="button"
                  className="btn-circle-meta border-0 text-muted"
                  onClick={() => setShowNewUserModal(false)}
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleSaveUser}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label text-secondary fw-semibold small">Nombre Completo del Vendedor</label>
                    <input className="form-control" name="nombre" placeholder="ej. Juan Pérez" required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label text-secondary fw-semibold small">Nombre de Usuario (Login)</label>
                    <input className="form-control" name="username" placeholder="ej. juanperez" required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label text-secondary fw-semibold small">Correo Electrónico</label>
                    <input type="email" className="form-control" name="email" placeholder="juan@facturacion.com" required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label text-secondary fw-semibold small">Contraseña</label>
                    <input type="password" className="form-control" name="password" required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label text-secondary fw-semibold small">Rol de Acceso</label>
                    <select className="form-select" name="rol" defaultValue="VENDEDOR">
                      <option value="VENDEDOR">Vendedor (Colaborador)</option>
                      <option value="ADMIN">Administrador General</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer border-top bg-white px-4 py-3 d-flex justify-content-end gap-2">
                  <button
                    type="button"
                    className="btn btn-light rounded-pill px-4 py-2 fw-semibold text-dark border-0"
                    style={{ backgroundColor: '#E4E6EB' }}
                    onClick={() => setShowNewUserModal(false)}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn text-white fw-bold rounded-pill px-4 py-2 shadow-sm"
                    style={{ backgroundColor: '#0866FF', borderColor: '#0866FF' }}
                  >
                    Registrar Usuario
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Usuario */}
      {editingUser && (
        <div className="modal d-block bg-dark bg-opacity-50" tabIndex={-1} style={{ backdropFilter: 'blur(6px)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 shadow-lg border-0">
              <div className="modal-header border-bottom bg-white px-4 py-3 d-flex justify-content-between align-items-center">
                <h5 className="modal-title fw-bold text-dark mb-0">Editar Usuario: {editingUser.username}</h5>
                <button
                  type="button"
                  className="btn-circle-meta border-0 text-muted"
                  onClick={() => setEditingUser(null)}
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleSaveUser}>
                <div className="modal-body p-4">
                  <input type="hidden" name="username" value={editingUser.username} />
                  <div className="mb-3">
                    <label className="form-label text-secondary fw-semibold small">Nombre Completo</label>
                    <input className="form-control" name="nombre" defaultValue={editingUser.nombre} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label text-secondary fw-semibold small">Correo Electrónico</label>
                    <input type="email" className="form-control" name="email" defaultValue={editingUser.email} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label text-secondary fw-semibold small">Nueva Contraseña (Opcional)</label>
                    <input
                      type="password"
                      className="form-control"
                      name="password"
                      placeholder="Dejar en blanco para mantener actual"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label text-secondary fw-semibold small">Rol de Acceso</label>
                    <select className="form-select" name="rol" defaultValue={editingUser.rol}>
                      <option value="VENDEDOR">Vendedor (Colaborador)</option>
                      <option value="ADMIN">Administrador General</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer border-top bg-white px-4 py-3 d-flex justify-content-end gap-2">
                  <button
                    type="button"
                    className="btn btn-light rounded-pill px-4 py-2 fw-semibold text-dark border-0"
                    style={{ backgroundColor: '#E4E6EB' }}
                    onClick={() => setEditingUser(null)}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn text-white fw-bold rounded-pill px-4 py-2 shadow-sm"
                    style={{ backgroundColor: '#0866FF', borderColor: '#0866FF' }}
                  >
                    Guardar Cambios
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
