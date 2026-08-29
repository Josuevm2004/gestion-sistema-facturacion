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
    <div
      className="modal d-block bg-dark bg-opacity-50"
      tabIndex={-1}
      style={{ backdropFilter: 'blur(6px)', overflowY: 'auto' }}
    >
      <div className="modal-dialog modal-lg modal-dialog-centered my-3" style={{ maxWidth: '820px' }}>
        <div
          className="modal-content rounded-4 shadow-lg border-0"
          style={{ maxHeight: 'calc(100vh - 3rem)', display: 'flex', flexDirection: 'column' }}
        >
          <div className="modal-header border-bottom bg-light px-4 py-3 flex-shrink-0">
            <div>
              <h5 className="modal-title fw-bold text-dark mb-0">Editar Cliente: {editingClient.razonSocial}</h5>
              <small className="text-muted fw-semibold">RUC: {editingClient.ruc} | Estado: {editingClient.estadoCuenta}</small>
            </div>
            <button type="button" className="btn-close" onClick={() => setEditingClient(null)}></button>
          </div>
          <form
            onSubmit={handleSaveEditClient}
            style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}
          >
            <div className="modal-body p-4" style={{ overflowY: 'auto', flex: 1 }}>
              <div className="row g-3">
                {/* --- Datos de la Empresa --- */}
                <div className="col-12">
                  <div className="d-flex align-items-center gap-2 mb-2 pb-1 border-bottom">
                    <span className="badge bg-primary text-white px-2.5 py-1 text-uppercase" style={{ fontSize: '0.72rem' }}>1</span>
                    <h6 className="fw-bold text-dark mb-0 text-uppercase" style={{ fontSize: '0.82rem', letterSpacing: '0.5px' }}>Datos de la Empresa</h6>
                  </div>
                </div>
                <div className="col-md-4">
                  <label className="form-label">RUC <span className="text-danger">*</span></label>
                  <input className="form-control fw-bold text-dark" name="ruc" defaultValue={editingClient.ruc} required />
                </div>
                <div className="col-md-8">
                  <label className="form-label">Razón Social <span className="text-danger">*</span></label>
                  <input className="form-control fw-semibold" name="razonSocial" defaultValue={editingClient.razonSocial} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Nombre Comercial</label>
                  <input className="form-control" name="nombreComercial" defaultValue={editingClient.nombreComercial || ''} placeholder="Ej. Mi Negocio SAC" />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Dirección Fiscal</label>
                  <input className="form-control" name="direccion" defaultValue={editingClient.direccion || ''} placeholder="Av. Principal 123" />
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
                <div className="col-12 mt-4">
                  <div className="d-flex align-items-center gap-2 mb-2 pb-1 border-bottom">
                    <span className="badge bg-primary text-white px-2.5 py-1 text-uppercase" style={{ fontSize: '0.72rem' }}>2</span>
                    <h6 className="fw-bold text-dark mb-0 text-uppercase" style={{ fontSize: '0.82rem', letterSpacing: '0.5px' }}>Representante Legal y Contacto</h6>
                  </div>
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
                  <label className="form-label">WhatsApp Empresa <span className="text-danger">*</span></label>
                  <input className="form-control fw-semibold" name="telefono" defaultValue={editingClient.telefono} required />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Email Empresa <span className="text-danger">*</span></label>
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
                <div className="col-12 mt-4">
                  <div className="d-flex align-items-center gap-2 mb-2 pb-1 border-bottom">
                    <span className="badge bg-primary text-white px-2.5 py-1 text-uppercase" style={{ fontSize: '0.72rem' }}>3</span>
                    <h6 className="fw-bold text-dark mb-0 text-uppercase" style={{ fontSize: '0.82rem', letterSpacing: '0.5px' }}>Plan, Asignación y Credenciales</h6>
                  </div>
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
                  <label className="form-label text-primary fw-bold">Vendedor Asignado</label>
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
            <div className="modal-footer border-top bg-light px-4 py-3 flex-shrink-0">
              <button type="button" className="btn btn-outline-secondary px-4 fw-semibold" onClick={() => setEditingClient(null)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary px-4 fw-bold">
                Guardar Cambios
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
