'use client';

import React from 'react';
import { ShieldCheck, Edit, Trash2, UserPlus } from 'lucide-react';

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
    <div className="w-100">
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-3 p-3 bg-white rounded-3 border shadow-xs">
        <div>
          <h2 className="h6 fw-bold text-dark mb-1">Gestión de Usuarios y Vendedores</h2>
          <p className="text-muted small mb-0">Módulo exclusivo para Administrador: alta, edición y baja de colaboradores.</p>
        </div>
        <button
          onClick={() => setShowNewUserModal(true)}
          className="btn-meta-action btn-meta-action-primary"
          title="Registrar nuevo usuario o vendedor"
        >
          <UserPlus size={15} />
          <span>Registrar Nuevo Vendedor / Usuario</span>
        </button>
      </div>

      <div className="table-card-meta mb-3">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0 table-meta">
          <thead>
            <tr>
              <th style={{ width: '45px' }}>#</th>
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
                <td colSpan={6} className="text-center text-muted py-5 fw-semibold">
                  No hay usuarios adicionales registrados.
                </td>
              </tr>
            ) : (
              usersList.map((u, idx) => {
                const initial = (u.nombre || u.username || 'U').charAt(0).toUpperCase();

                return (
                  <tr key={u.id}>
                    <td className="text-muted fw-semibold py-2.5">{idx + 1}</td>
                    <td>
                      <div className="d-flex align-items-center gap-2.5">
                        <div
                          className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 fw-bold"
                          style={{
                            width: '34px',
                            height: '34px',
                            backgroundColor: u.rol === 'ADMIN' ? '#FEE2E2' : '#E7F3FF',
                            color: u.rol === 'ADMIN' ? '#DC2626' : '#0866FF',
                            fontSize: '0.82rem',
                            border: `1px solid ${u.rol === 'ADMIN' ? '#FECACA' : '#D0E2FF'}`,
                          }}
                        >
                          {initial}
                        </div>
                        <div>
                          <strong className="text-dark d-block fw-bold" style={{ fontSize: '0.88rem' }}>
                            {u.nombre || u.username}
                          </strong>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge bg-light text-dark border rounded-pill px-2.5 py-1 font-monospace">
                        {u.username}
                      </span>
                    </td>
                    <td>
                      <span className="text-dark">{u.email || '—'}</span>
                    </td>
                    <td>
                      <span className={`badge-fb ${u.rol === 'ADMIN' ? 'badge-fb-danger' : 'badge-fb-primary'}`}>
                        {u.rol}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex gap-2 align-items-center">
                        <button
                          onClick={() => setEditingUser(u)}
                          className="btn-meta-action btn-meta-action-secondary"
                          title="Editar información de usuario"
                        >
                          <Edit size={13} />
                          <span>Editar</span>
                        </button>
                        {u.username !== 'admin' && (
                          <button
                            onClick={() => handleDeleteUser(u)}
                            className="btn-meta-action btn-meta-action-danger"
                            title="Eliminar usuario"
                          >
                            <Trash2 size={13} />
                            <span>Eliminar</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      </div>
    </div>
  );
}
