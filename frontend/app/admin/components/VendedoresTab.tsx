'use client';

import React from 'react';
import { ShieldCheck, Edit, Trash2 } from 'lucide-react';

export type UserAccount = {
  id: string | number;
  username: string;
  nombre: string;
  email: string;
  rol: string;
};

interface VendedoresTabProps {
  clients?: any[];
  uniqueSellers?: string[];
  currentUser: any;
  usersList: UserAccount[];
  setShowNewUserModal: (v: boolean) => void;
  setEditingUser: (user: UserAccount) => void;
  handleDeleteUser: (user: UserAccount) => void;
}

export default function VendedoresTab({
  currentUser,
  usersList,
  setShowNewUserModal,
  setEditingUser,
  handleDeleteUser,
}: VendedoresTabProps) {
  if (currentUser?.rol !== 'ADMIN') {
    return (
      <div className="custom-card p-5 text-center my-4 border-danger shadow-sm">
        <ShieldCheck size={48} className="text-danger mb-3 mx-auto" />
        <h3 className="h5 fw-bold text-dark mb-2">Acceso Exclusivo para Administrador General</h3>
        <p className="text-muted small mb-0">
          Solo la cuenta Administrador tiene permisos para crear nuevos usuarios vendedores, modificar credenciales o eliminar cuentas del sistema.
        </p>
      </div>
    );
  }

  return (
    <div className="card rounded-4 border bg-white p-4 shadow-sm">
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-4 border-bottom pb-3">
        <div>
          <h2 className="h6 fw-bold text-dark mb-1">Gestión de Usuarios y Vendedores</h2>
          <p className="text-muted small mb-0">Módulo exclusivo para Administrador: alta, edición y baja de colaboradores.</p>
        </div>
        <button
          onClick={() => setShowNewUserModal(true)}
          className="btn text-white rounded-pill px-3 py-2 fw-bold shadow-sm d-inline-flex align-items-center gap-1.5"
          style={{ backgroundColor: '#0866FF', borderColor: '#0866FF' }}
        >
          <span>+ Registrar Nuevo Vendedor / Usuario</span>
        </button>
      </div>

      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead>
            <tr>
              <th style={{ width: '50px' }}>#</th>
              <th>Nombre Completo</th>
              <th>Usuario</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usersList.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center text-muted py-4 fw-semibold">
                  No hay usuarios adicionales registrados.
                </td>
              </tr>
            ) : (
              usersList.map((u, idx) => (
                <tr key={u.id}>
                  <td className="text-muted small fw-semibold py-2.5">{idx + 1}</td>
                  <td>
                    <strong className="text-dark d-block fs-6">{u.nombre || u.username}</strong>
                  </td>
                  <td>
                    <span className="badge bg-light text-dark border rounded-pill px-2.5 py-1 font-monospace">{u.username}</span>
                  </td>
                  <td>
                    <span className="text-dark">{u.email || '—'}</span>
                  </td>
                  <td>
                    <span
                      className="badge rounded-pill px-2.5 py-1 fw-bold"
                      style={
                        u.rol === 'ADMIN'
                          ? { backgroundColor: '#FEE2E2', color: '#DC2626' }
                          : { backgroundColor: '#E7F3FF', color: '#0866FF' }
                      }
                    >
                      {u.rol}
                    </span>
                  </td>
                  <td>
                    <div className="d-flex gap-2">
                      <button
                        onClick={() => setEditingUser(u)}
                        className="btn btn-sm btn-outline-primary rounded-pill px-3 py-1 fw-semibold d-inline-flex align-items-center gap-1"
                      >
                        <Edit size={13} />
                        <span>Editar</span>
                      </button>
                      {u.username !== 'admin' && (
                        <button
                          onClick={() => handleDeleteUser(u)}
                          className="btn btn-sm btn-outline-danger rounded-pill px-3 py-1 fw-semibold d-inline-flex align-items-center gap-1"
                        >
                          <Trash2 size={13} />
                          <span>Eliminar</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
