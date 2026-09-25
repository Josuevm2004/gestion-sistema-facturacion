'use client';

import React from 'react';
import { ShieldCheck, Edit, Trash2, UserPlus, Users, ChevronDown } from 'lucide-react';

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
  const [openActionId, setOpenActionId] = React.useState<string | number | null>(null);

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
      {/* Encabezado con Icono Moderno y Botón de Registro */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-3 p-3 bg-white rounded-3 border shadow-xs">
        <div className="d-flex align-items-center gap-3">
          <div className="section-header-icon section-header-icon-primary">
            <Users size={22} strokeWidth={2.2} />
          </div>
          <div>
            <h2 className="h6 fw-bold text-dark mb-0">Gestión de Usuarios y Vendedores</h2>
            <small className="text-muted fw-semibold">Módulo exclusivo para Administrador: alta, edición y baja de colaboradores.</small>
          </div>
        </div>
        <button
          onClick={() => setShowNewUserModal(true)}
          className="btn-meta-action btn-meta-action-primary shadow-xs"
          title="Registrar nuevo usuario o vendedor"
        >
          <UserPlus size={15} />
          <span>Registrar Nuevo Colaborador</span>
        </button>
      </div>

      {/* Tabla Expandida al 100% con Dropdown de Acciones */}
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
                <th className="text-center" style={{ width: '130px' }}>Acciones</th>
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
                  const isActionOpen = openActionId === u.id;

                  return (
                    <tr key={u.id} style={{ position: isActionOpen ? 'relative' : undefined, zIndex: isActionOpen ? 1050 : undefined }}>
                      <td className="text-muted fw-semibold py-2.5">{idx + 1}</td>
                      <td>
                        <div className="d-flex align-items-center gap-2.5">
                          <div
                            className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 fw-bold shadow-xs"
                            style={{
                              width: '32px',
                              height: '32px',
                              backgroundColor: u.rol === 'ADMIN' ? '#FEE2E2' : '#E7F3FF',
                              color: u.rol === 'ADMIN' ? '#DC2626' : '#0866FF',
                              fontSize: '0.78rem',
                              border: `1px solid ${u.rol === 'ADMIN' ? '#FECACA' : '#D0E2FF'}`,
                            }}
                          >
                            {initial}
                          </div>
                          <div>
                            <span className="cell-title d-block">
                              {u.nombre || u.username}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge-wsp-chip">
                          {u.username}
                        </span>
                      </td>
                      <td>
                        <span className="cell-title">{u.email || '—'}</span>
                      </td>
                      <td>
                        <span className={`badge-fb ${u.rol === 'ADMIN' ? 'badge-fb-danger' : 'badge-fb-primary'}`}>
                          <span className={`badge-dot ${u.rol === 'ADMIN' ? 'badge-dot-danger' : 'badge-dot-info'}`} />
                          {u.rol}
                        </span>
                      </td>
                      <td className="text-center position-relative">
                        <div className="table-action-floating-container">
                          <button
                            type="button"
                            onClick={() => setOpenActionId(isActionOpen ? null : u.id)}
                            className="btn-meta-action btn-meta-action-secondary shadow-xs"
                            title="Opciones de usuario"
                          >
                            <span>Acciones</span>
                            <ChevronDown size={12} />
                          </button>

                          {isActionOpen && (
                            <>
                              <div
                                className="position-fixed top-0 start-0 w-100 h-100"
                                style={{ zIndex: 100050, background: 'transparent' }}
                                onClick={() => setOpenActionId(null)}
                              />
                              <div className="table-action-menu shadow-lg">
                                <button
                                  type="button"
                                  className="table-action-item item-primary"
                                  onClick={() => {
                                    setOpenActionId(null);
                                    setEditingUser(u);
                                  }}
                                >
                                  <Edit size={15} />
                                  <span>Editar Información</span>
                                </button>
                                {u.username !== 'admin' && (
                                  <button
                                    type="button"
                                    className="table-action-item item-danger"
                                    onClick={() => {
                                      setOpenActionId(null);
                                      handleDeleteUser(u);
                                    }}
                                  >
                                    <Trash2 size={15} />
                                    <span>Eliminar Usuario</span>
                                  </button>
                                )}
                              </div>
                            </>
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
