'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { Search, Users, Edit, Trash2, Eye, EyeOff, TrendingUp } from 'lucide-react';

export type ColorTagType = 'VERDE' | 'ROJO' | 'AMARILLO' | 'AZUL';
export type SubscriptionType = 'MENSUAL' | 'ANUAL';
export type EntityId = string | number;

export type Client = {
  id: EntityId;
  ruc: string;
  razonSocial: string;
  nombreComercial?: string;
  direccion?: string;
  telefono: string;
  email: string;
  nombres?: string;
  apellidos?: string;
  dni?: string;
  emailPersonal?: string;
  telefonoPersonal?: string;
  departamento?: string;
  provincia?: string;
  distrito?: string;
  regimenTributario: string;
  planContratado: string;
  tipoSuscripcion?: string;
  montoMensual: number;
  montoSiguienteCobro?: number;
  ventaId?: EntityId;
  diasProrrateados?: number;
  estadoCuenta: string;
  estadoCapacitacion: string;
  colorTag?: ColorTagType;
  fechaRegistro?: string;
  fechaCreacion?: string;
  fechaVencimientoMensual?: string;
  fechaCapacitacion?: string;
  usuarioSol?: string;
  claveSolCifrada?: string;
  vendedor?: string;
  linkSistema?: string;
  usuarioSistema?: string;
  claveSistema?: string;
};

interface ClientesTodosTabProps {
  clients?: Client[];
  allFilteredClients: Client[];
  search?: string;
  setSearch?: (v: string) => void;
  searchTerm?: string;
  setSearchTerm?: (v: string) => void;
  regimenFilter: string;
  setRegimenFilter: (v: string) => void;
  planFilter: string;
  setPlanFilter: (v: string) => void;
  handleColorTagChange: (client: Client, color: ColorTagType) => void;
  handleAssignVendedor: (client: Client, vendedorName: string) => void;
  showSolKeys: Record<string, boolean>;
  setShowSolKeys: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  currentUser: any;
  setEditingClient: (client: Client) => void;
  setMejoraPlanClient: (client: Client) => void;
  setMejoraPlanSeleccionado: (plan: string) => void;
  setDeletingClient: (client: Client) => void;
  COLOR_MAP?: any;
}

export default function ClientesTodosTab({
  clients,
  allFilteredClients,
  search,
  setSearch,
  searchTerm,
  setSearchTerm,
  regimenFilter,
  setRegimenFilter,
  planFilter,
  setPlanFilter,
  handleColorTagChange,
  handleAssignVendedor,
  showSolKeys,
  setShowSolKeys,
  currentUser,
  setEditingClient,
  setMejoraPlanClient,
  setMejoraPlanSeleccionado,
  setDeletingClient,
  COLOR_MAP,
}: ClientesTodosTabProps) {
  const currentSearch = search !== undefined ? search : (searchTerm || '');
  const handleSearchChange = setSearch || setSearchTerm || (() => {});
  const [activeColorPickerId, setActiveColorPickerId] = React.useState<EntityId | null>(null);
  const [colorPickerPosition, setColorPickerPosition] = React.useState<{ top: number; left: number } | null>(null);
  const colorPickerRef = React.useRef<HTMLDivElement | null>(null);
  const colorLabels: Record<ColorTagType, string> = {
    VERDE: 'Verde',
    ROJO: 'Rojo',
    AMARILLO: 'Amarillo',
    AZUL: 'Azul',
  };
  const defaultColorMap: Record<string, { hex: string; label: string }> = {
    VERDE: { hex: '#198754', label: '🟢 Verde' },
    ROJO: { hex: '#dc3545', label: '🔴 Rojo' },
    AMARILLO: { hex: '#ffc107', label: '🟡 Amarillo' },
    AZUL: { hex: '#0d6efd', label: '🔵 Azul' },
  };

  const getColorInfo = (tag?: string) => {
    const key = (tag || 'VERDE').toUpperCase();
    if (COLOR_MAP && COLOR_MAP[key]) return COLOR_MAP[key];
    return defaultColorMap[key] || defaultColorMap.VERDE;
  };
  const planOrder = ['INICIA', 'EMPRENDE', 'IMPULSA', 'EMPRESARIAL', 'LIDER'];
  const normalizePlanKey = (planStr?: string) => {
    const normalized = (planStr || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/^PLAN\s+/, '')
      .trim();
    return normalized === 'INICIAL' ? 'INICIA' : normalized;
  };
  const nextUpgradePlan = (planStr?: string) => {
    const currentIndex = planOrder.indexOf(normalizePlanKey(planStr));
    return planOrder[Math.min(currentIndex + 1, planOrder.length - 1)] || 'EMPRENDE';
  };

  const activeColorClient = React.useMemo(
    () => allFilteredClients.find((client) => client.id === activeColorPickerId) || null,
    [activeColorPickerId, allFilteredClients]
  );

  const toggleColorPicker = (event: React.MouseEvent<HTMLButtonElement>, clientId: EntityId) => {
    if (activeColorPickerId === clientId) {
      setActiveColorPickerId(null);
      setColorPickerPosition(null);
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const menuWidth = 158;
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - menuWidth - 8));

    setActiveColorPickerId(clientId);
    setColorPickerPosition({
      top: rect.bottom + 6,
      left,
    });
  };

  React.useEffect(() => {
    if (activeColorPickerId === null) return;

    const closeColorPicker = () => {
      setActiveColorPickerId(null);
      setColorPickerPosition(null);
    };

    const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (colorPickerRef.current?.contains(target)) return;
      if (target instanceof Element && target.closest('[data-color-picker-trigger="true"]')) return;
      closeColorPicker();
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    window.addEventListener('resize', closeColorPicker);
    window.addEventListener('scroll', closeColorPicker, true);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      window.removeEventListener('resize', closeColorPicker);
      window.removeEventListener('scroll', closeColorPicker, true);
    };
  }, [activeColorPickerId]);

  return (
    <div className="custom-card p-4 shadow-sm">
      <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
        <div className="d-flex align-items-center gap-2">
          <div className="p-2 bg-primary bg-opacity-10 text-primary rounded-3">
            <Users size={20} />
          </div>
          <div>
            <h2 className="h6 fw-bold text-dark mb-0">Gestión General de Clientes</h2>
            <small className="text-muted">Listado consolidado de empresas y estado comercial</small>
          </div>
        </div>
        <span className="badge bg-primary rounded-pill px-3 py-1.5 fw-bold">
          {allFilteredClients.length} Registros Total
        </span>
      </div>

      <div className="row g-3 mb-4 p-3 bg-light rounded-3 border">
        <div className="col-md-5">
          <div className="input-group">
            <span className="input-group-text bg-white border-end-0">
              <Search size={16} className="text-muted" />
            </span>
            <input
              type="text"
              className="form-control border-start-0"
              placeholder="Buscar por RUC, Razón Social, Teléfono..."
              value={currentSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>
        </div>
        <div className="col-md-3">
          <select className="form-select" value={regimenFilter} onChange={(e) => setRegimenFilter(e.target.value)}>
            <option value="">Todos los Regímenes</option>
            <option value="MYPE_TRIBUTARIO">MYPE Tributario</option>
            <option value="REGIMEN_GENERAL">Régimen General</option>
            <option value="RER">Régimen Especial - RER</option>
            <option value="NRUS">Nuevo RUS - NRUS</option>
          </select>
        </div>
        <div className="col-md-4">
          <select className="form-select" value={planFilter} onChange={(e) => setPlanFilter(e.target.value)}>
            <option value="">Todos los Planes</option>
            <option value="INICIA">Plan Inicia (S/ 19)</option>
            <option value="EMPRENDE">Plan Emprende (S/ 29)</option>
            <option value="IMPULSA">Plan Impulsa (S/ 39)</option>
            <option value="EMPRESARIAL">Plan Empresarial (S/ 59)</option>
            <option value="LIDER">Plan Líder (S/ 89)</option>
          </select>
        </div>
      </div>

      {/* Tabla de Clientes */}
      <div className="table-responsive" style={{ overflow: 'visible' }}>
        <table className="table table-hover align-middle mb-0">
          <thead>
            <tr>
              <th style={{ width: '80px' }}>Color Celular</th>
              <th>RUC / Empresa</th>
              <th>WhatsApp / Email</th>
              <th>Plan / Suscripción</th>
              <th>Vendedor</th>
              <th>Estado Cuenta</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {allFilteredClients.map((c, idx) => (
              <tr key={c.id}>
                <td style={{ position: 'relative', zIndex: activeColorPickerId === c.id ? 99999 : 1 }}>
                  <div className="position-relative d-inline-block">
                    <button
                      type="button"
                      data-color-picker-trigger="true"
                      className="btn btn-sm p-0 border-0 d-flex align-items-center justify-content-center"
                      onClick={(event) => toggleColorPicker(event, c.id)}
                      title="Cambiar color de celular/atención"
                    >
                      <span
                        className="d-inline-block rounded-circle border shadow-sm transition-all"
                        style={{
                          width: '22px',
                          height: '22px',
                          backgroundColor: getColorInfo(c.colorTag)?.hex || '#198754',
                          cursor: 'pointer',
                          transform: activeColorPickerId === c.id ? 'scale(1.2)' : 'scale(1)',
                        }}
                      ></span>
                    </button>

                  </div>
                </td>
                <td>
                  <strong className="text-dark d-block">{c.razonSocial}</strong>
                  <span className="small text-muted">{c.ruc}</span>
                </td>
                <td>
                  <span className="fw-semibold d-block">{c.telefono}</span>
                  <span className="small text-muted">{c.email || '—'}</span>
                </td>
                <td>
                  <span className="badge bg-light text-dark me-1">{c.planContratado}</span>
                  <span className={`badge ${c.tipoSuscripcion === 'ANUAL' ? 'bg-purple text-white' : 'bg-info text-dark'}`}>
                    {c.tipoSuscripcion || 'MENSUAL'}
                  </span>
                </td>
                <td>
                  {c.vendedor && c.vendedor !== 'Por asignar' && c.vendedor !== 'Sin Asignar' ? (
                    <span className="badge bg-secondary text-white fw-semibold" style={{ fontSize: '0.75rem' }} title="Vendedor asignado (Bloqueado)">
                      👤 {c.vendedor}
                    </span>
                  ) : currentUser?.rol === 'ADMIN' ? (
                    <button
                      onClick={() => handleAssignVendedor(c, currentUser?.nombre || currentUser?.username || 'Administrador')}
                      className="btn btn-sm btn-outline-success text-nowrap py-0.5 px-2 fw-semibold"
                      style={{ fontSize: '0.75rem' }}
                      title="Asignar vendedor a este cliente (Exclusivo Administrador)"
                    >
                      + Asignar Vendedor
                    </button>
                  ) : (
                    <span className="badge bg-light text-muted fw-normal border" style={{ fontSize: '0.75rem' }}>
                      Por asignar
                    </span>
                  )}
                </td>
                <td>
                  <span className={`badge ${c.estadoCuenta === 'HABILITADO' ? 'badge-habilitado' : 'badge-bloqueado'}`}>
                    {c.estadoCuenta}
                  </span>
                </td>
                <td>
                  <div className="d-flex gap-1">
                    {c.estadoCuenta === 'HABILITADO' && normalizePlanKey(c.planContratado) !== 'LIDER' && (
                      <button
                        onClick={() => {
                          setMejoraPlanSeleccionado(nextUpgradePlan(c.planContratado));
                          setMejoraPlanClient(c);
                        }}
                        className="btn btn-sm btn-outline-success"
                        title="Mejorar plan activo sin modificar vencimiento"
                      >
                        <TrendingUp size={14} />
                      </button>
                    )}
                    <button onClick={() => setEditingClient(c)} className="btn btn-sm btn-outline-primary" title="Editar cliente">
                      <Edit size={14} />
                    </button>
                    <button onClick={() => setDeletingClient(c)} className="btn btn-sm btn-outline-danger" title="Eliminar cliente">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {activeColorClient &&
        colorPickerPosition &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={colorPickerRef}
            className="bg-white rounded-3 shadow-lg p-2 border"
            style={{
              position: 'fixed',
              top: colorPickerPosition.top,
              left: colorPickerPosition.left,
              zIndex: 100000,
              minWidth: '158px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
            }}
          >
            <div className="small text-muted fw-bold mb-1 px-1" style={{ fontSize: '0.68rem' }}>
              SELECCIONAR COLOR
            </div>
            {(['VERDE', 'ROJO', 'AMARILLO', 'AZUL'] as ColorTagType[]).map((col) => {
              const info = getColorInfo(col);
              return (
                <button
                  key={col}
                  type="button"
                  className="btn btn-sm btn-light w-100 text-start d-flex align-items-center gap-2 mb-1 p-1.5 rounded-2 hover-bg-light"
                  onClick={() => {
                    handleColorTagChange(activeColorClient, col);
                    setActiveColorPickerId(null);
                    setColorPickerPosition(null);
                  }}
                >
                  <span
                    className="rounded-circle d-inline-block border"
                    style={{ width: '14px', height: '14px', backgroundColor: info?.hex || '#198754' }}
                  ></span>
                  <span className="fw-semibold small text-dark">{colorLabels[col]}</span>
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </div>
  );
}
