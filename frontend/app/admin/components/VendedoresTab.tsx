'use client';

import React from 'react';
import { ShieldCheck, Edit, Trash2 } from 'lucide-react';

export type UserAccount = {
  id: number;
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
    <div className="custom-card p-4">
      <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
        <div>
          <h2 className="h6 fw-bold text-dark mb-1">Gestión de Usuarios y Vendedores</h2>
          <p className="text-muted small mb-0">Módulo exclusivo para Administrador: alta, edición y baja de colaboradores.</p>
        </div>
        <button onClick={() => setShowNewUserModal(true)} className="btn btn-primary btn-sm fw-semibold shadow-sm">
          + Registrar Nuevo Vendedor / Usuario
        </button>
      </div>

      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light">
            <tr>
              <th>#</th>
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
                <td colSpan={6} className="text-center text-muted py-4">
                  No hay usuarios adicionales registrados.
                </td>
              </tr>
            ) : (
              usersList.map((u, idx) => (
                <tr key={u.id}>
                  <td className="text-muted small fw-semibold">{idx + 1}</td>
                  <td>
                    <strong className="text-dark">{u.nombre || u.username}</strong>
                  </td>
                  <td>
                    <code>{u.username}</code>
                  </td>
                  <td>{u.email || '—'}</td>
                  <td>
                    <span className={`badge ${u.rol === 'ADMIN' ? 'bg-danger' : 'bg-primary'}`}>{u.rol}</span>
                  </td>
                  <td>
                    <div className="d-flex gap-2">
                      <button onClick={() => setEditingUser(u)} className="btn btn-sm btn-outline-primary">
                        <Edit size={14} className="me-1" /> Editar
                      </button>
                      {u.username !== 'admin' && (
                        <button onClick={() => handleDeleteUser(u)} className="btn btn-sm btn-outline-danger">
                          <Trash2 size={14} className="me-1" /> Eliminar
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
