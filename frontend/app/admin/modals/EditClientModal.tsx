'use client';

import React from 'react';
import { Client } from '../components/ClientesTodosTab';

interface EditClientModalProps {
  editingClient: Client | null;
  setEditingClient: (client: Client | null) => void;
  handleSaveEditClient: (e: React.FormEvent<HTMLFormElement>) => void;
  currentUser?: any;
  usersList?: any[];
  uniqueSellers?: string[];
  entornos?: Array<{ id: string | number; nombre: string }>;
}

export default function EditClientModal({
  editingClient,
  setEditingClient,
  handleSaveEditClient,
  currentUser,
  usersList = [],
  uniqueSellers = [],
  entornos = [],
}: EditClientModalProps) {
  if (!editingClient) return null;

  const isAssigned = Boolean(
    editingClient.vendedor &&
    editingClient.vendedor !== 'Por asignar' &&
    editingClient.vendedor !== 'Sin Asignar'
  );

  const isAdmin =
    !currentUser ||
    !currentUser.rol ||
    currentUser.rol.toUpperCase() === 'ADMIN' ||
    currentUser.username === 'admin';
  const planLocked = Boolean(editingClient.fechaCapacitacion) ||
    ['POR_CAPACITAR', 'HABILITADO', 'VENCIDO', 'BLOQUEADO'].includes(editingClient.estadoCuenta || '');
  const normalizePlanKey = (planStr?: string) => {
    const normalized = (planStr || 'EMPRENDE')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/^PLAN\s+/, '')
      .trim();
    return normalized === 'INICIAL' ? 'INICIA' : normalized;
  };

  return (
    <div className="modal d-block bg-dark bg-opacity-50" tabIndex={-1}>
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content rounded-3 shadow">
          <div className="modal-header border-bottom">
            <h5 className="modal-title fw-bold">Editar Cliente: {editingClient.razonSocial}</h5>
            <button type="button" className="btn-close" onClick={() => setEditingClient(null)}></button>
          </div>
          <form onSubmit={handleSaveEditClient}>
            <div className="modal-body">
              <div className="row g-3">
                {/* --- Datos de la Empresa --- */}
                <div className="col-12">
                  <hr className="my-1" />
                  <small className="text-muted fw-semibold text-uppercase">Datos de la Empresa</small>
                </div>
                <div className="col-md-4">
                  <label className="form-label">RUC</label>
                  <input className="form-control" name="ruc" defaultValue={editingClient.ruc} required />
                </div>
                <div className="col-md-8">
                  <label className="form-label">Razón Social</label>
                  <input className="form-control" name="razonSocial" defaultValue={editingClient.razonSocial} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Nombre Comercial</label>
                  <input className="form-control" name="nombreComercial" defaultValue={editingClient.nombreComercial || ''} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Dirección Fiscal</label>
                  <input className="form-control" name="direccion" defaultValue={editingClient.direccion || ''} />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Departamento</label>
                  <input className="form-control" name="departamento" defaultValue={editingClient.departamento || ''} />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Provincia</label>
                  <input className="form-control" name="provincia" defaultValue={editingClient.provincia || ''} />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Distrito</label>
                  <input className="form-control" name="distrito" defaultValue={editingClient.distrito || ''} />
                </div>

                {/* --- Datos del Representante --- */}
                <div className="col-12">
                  <hr className="my-1" />
                  <small className="text-muted fw-semibold text-uppercase">Representante Legal</small>
                </div>
                <div className="col-md-4">
                  <label className="form-label">Nombres</label>
                  <input className="form-control" name="nombres" defaultValue={editingClient.nombres || ''} />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Apellidos</label>
                  <input className="form-control" name="apellidos" defaultValue={editingClient.apellidos || ''} />
                </div>
                <div className="col-md-4">
                  <label className="form-label">DNI</label>
                  <input className="form-control" name="dni" defaultValue={editingClient.dni || ''} maxLength={8} />
                </div>
                <div className="col-md-4">
                  <label className="form-label">WhatsApp Empresa</label>
                  <input className="form-control" name="telefono" defaultValue={editingClient.telefono} required />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Email Empresa</label>
                  <input className="form-control" name="email" defaultValue={editingClient.email || ''} required />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Teléfono Personal</label>
                  <input className="form-control" name="telefonoPersonal" defaultValue={editingClient.telefonoPersonal || ''} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Correo Personal</label>
                  <input className="form-control" name="emailPersonal" defaultValue={editingClient.emailPersonal || ''} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Usuario de WhatsApp</label>
                  <input
                    className="form-control"
                    name="usuarioWsp"
                    defaultValue={editingClient.usuarioWsp || ''}
                    placeholder="Usuario o número de WhatsApp"
                  />
                </div>

                {/* --- Plan y Acceso --- */}
                <div className="col-12">
                  <hr className="my-1" />
                  <small className="text-muted fw-semibold text-uppercase">Plan y Acceso</small>
                </div>
                <div className="col-md-4">
                  <label className="form-label">Régimen Tributario</label>
                  <select
                    className="form-select"
                    name="regimenTributario"
                    defaultValue={editingClient.regimenTributario || 'MYPE_TRIBUTARIO'}
                  >
                    <option value="MYPE_TRIBUTARIO">MYPE Tributario</option>
                    <option value="REGIMEN_GENERAL">Régimen General</option>
                    <option value="RER">Régimen Especial - RER</option>
                    <option value="NRUS">Nuevo RUS - NRUS</option>
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label">Plan Contratado</label>
                  <select className="form-select" name="planContratado" defaultValue={normalizePlanKey(editingClient.planContratado)} disabled={planLocked}>
                    <option value="INICIA">Plan Inicia (S/ 19)</option>
                    <option value="EMPRENDE">Plan Emprende (S/ 29)</option>
                    <option value="IMPULSA">Plan Impulsa (S/ 39)</option>
                    <option value="EMPRESARIAL">Plan Empresarial (S/ 59)</option>
                    <option value="LIDER">Plan Líder (S/ 89)</option>
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label">Tipo Suscripción</label>
                  <select className="form-select" name="tipoSuscripcion" defaultValue={editingClient.tipoSuscripcion || 'MENSUAL'} disabled={planLocked}>
                    <option value="MENSUAL">Mensual</option>
                    <option value="ANUAL">Anual</option>
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label font-weight-bold text-primary">Vendedor Asignado</label>
                  {isAdmin ? (
                    <select
                      className="form-select border-primary fw-semibold"
                      name="vendedor"
                      defaultValue={editingClient.vendedor || 'Por asignar'}
                    >
                      <option value="Por asignar">-- Seleccionar Vendedor --</option>
                      {usersList.map((u) => (
                        <option key={u.id} value={u.nombre || u.username}>
                          {u.nombre || u.username} ({u.rol})
                        </option>
                      ))}
                      {uniqueSellers
                        .filter((s) => s !== 'Por asignar' && !usersList.some((u) => u.nombre === s || u.username === s))
                        .map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                    </select>
                  ) : (
                    <input
                      className="form-control bg-light"
                      name="vendedor"
                      value={editingClient.vendedor || 'Por asignar'}
                      readOnly
                      title="Solo el Administrador puede modificar el vendedor."
                    />
                  )}
                </div>

                <div className="col-md-6">
                  <label className="form-label">Link del Sistema Facturador</label>
                  <input className="form-control" name="linkSistema" defaultValue={editingClient.linkSistema || ''} placeholder="https://demo.facturacion.com" />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Entorno</label>
                  <select className="form-select" name="entornoId" defaultValue={editingClient.entornoId ? String(editingClient.entornoId) : ''}>
                    <option value="">Sin entorno seleccionado</option>
                    {entornos.map((entorno) => (
                      <option key={String(entorno.id)} value={String(entorno.id)}>{entorno.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label">Usuario Sistema</label>
                  <input className="form-control" name="usuarioSistema" defaultValue={editingClient.usuarioSistema || ''} />
                </div>
                <div className="col-md-3">
                  <label className="form-label">Clave Sistema</label>
                  <input className="form-control" name="claveSistema" defaultValue={editingClient.claveSistema || ''} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Usuario SOL</label>
                  <input className="form-control" name="usuarioSol" defaultValue={editingClient.usuarioSol || ''} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Clave SOL</label>
                  <input className="form-control" name="claveSol" defaultValue={editingClient.claveSolCifrada || ''} />
                </div>
              </div>
            </div>
            <div className="modal-footer border-top">
              <button type="button" className="btn btn-secondary" onClick={() => setEditingClient(null)}>
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
  );
}
