'use client';

import React from 'react';

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
        <div className="modal d-block bg-dark bg-opacity-50" tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-3 shadow">
              <div className="modal-header border-bottom">
                <h5 className="modal-title fw-bold">Registrar Nuevo Vendedor / Usuario</h5>
                <button type="button" className="btn-close" onClick={() => setShowNewUserModal(false)}></button>
              </div>
              <form onSubmit={handleSaveUser}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Nombre Completo del Vendedor</label>
                    <input className="form-control" name="nombre" placeholder="ej. Juan Pérez" required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Nombre de Usuario (Login)</label>
                    <input className="form-control" name="username" placeholder="ej. juanperez" required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Correo Electrónico</label>
                    <input type="email" className="form-control" name="email" placeholder="juan@facturacion.com" required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Contraseña</label>
                    <input type="password" className="form-control" name="password" required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Rol de Acceso</label>
                    <select className="form-select" name="rol" defaultValue="VENDEDOR">
                      <option value="VENDEDOR">Vendedor (Colaborador)</option>
                      <option value="ADMIN">Administrador General</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer border-top">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowNewUserModal(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary">
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
        <div className="modal d-block bg-dark bg-opacity-50" tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-3 shadow">
              <div className="modal-header border-bottom">
                <h5 className="modal-title fw-bold">Editar Usuario: {editingUser.username}</h5>
                <button type="button" className="btn-close" onClick={() => setEditingUser(null)}></button>
              </div>
              <form onSubmit={handleSaveUser}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Nombre Completo</label>
                    <input className="form-control" name="nombre" defaultValue={editingUser.nombre} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Correo Electrónico</label>
                    <input type="email" className="form-control" name="email" defaultValue={editingUser.email} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Nueva Contraseña (Opcional)</label>
                    <input
                      type="password"
                      className="form-control"
                      name="password"
                      placeholder="Dejar en blanco para mantener actual"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Rol de Acceso</label>
                    <select className="form-select" name="rol" defaultValue={editingUser.rol}>
                      <option value="VENDEDOR">Vendedor (Colaborador)</option>
                      <option value="ADMIN">Administrador General</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer border-top">
                  <button type="button" className="btn btn-secondary" onClick={() => setEditingUser(null)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary">
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
