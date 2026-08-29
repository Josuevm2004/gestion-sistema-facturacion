'use client';

import React from 'react';
import {
  Users,
  Search,
  Key,
  Eye,
  EyeOff,
  Copy,
  Edit2,
  Trash2,
  Check,
  TrendingUp,
  MessageCircle,
  RotateCcw,
} from 'lucide-react';
import PaginationControls from './PaginationControls';

export type EntityId = number | string;
export type ColorTagType = 'VERDE' | 'ROJO' | 'AMARILLO' | 'AZUL' | string;
export type SubscriptionType = 'MENSUAL' | 'ANUAL' | string;

export type Client = {
  id: EntityId;
  ruc: string;
  razonSocial: string;
  nombreComercial?: string;
  email?: string;
  telefono?: string;
  telefonoPersonal?: string;
  usuarioWsp?: string;
  nombres?: string;
  apellidos?: string;
  dni?: string;
  emailPersonal?: string;
  direccion?: string;
  departamento?: string;
  provincia?: string;
  distrito?: string;
  regimenTributario?: string;
  usuarioSol?: string;
  claveSolCifrada?: string;
  planContratado?: string;
  tipoSuscripcion?: string;
  montoMensual?: number;
  montoSiguienteCobro?: number;
  ventaId?: string;
  diasProrrateados?: number;
  tipoProrrateo?: string;
  montoProrrateoAdicional?: number;
  diasProrrateoAdicional?: number;
  fechaInicioProrrateoAdicional?: string;
  fechaFinProrrateoAdicional?: string;
  estadoCuenta?: string;
  estadoCapacitacion?: string;
  fechaRegistro?: string;
  fechaCreacion?: string;
  fechaVencimientoMensual?: string;
  fechaCapacitacion?: string;
  vendedor?: string;
  linkSistema?: string;
  usuarioSistema?: string;
  claveSistema?: string;
  colorTag?: ColorTagType;
  colorCodigo?: string;
  avisado?: boolean;
  entornoId?: EntityId;
  entornoNombre?: string;
  [key: string]: any;
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
  estadoCuentaFilter?: string;
  setEstadoCuentaFilter?: (v: string) => void;
  capacitacionFilter?: string;
  setCapacitacionFilter?: (v: string) => void;
  suscripcionFilter?: string;
  setSuscripcionFilter?: (v: string) => void;
  sellerFilter?: string;
  setSellerFilter?: (v: string) => void;
  uniqueSellers?: string[];
  handleAssignVendedor: (client: Client, vendedorName: string) => void;
  handleSelfAssignVendedor: (client: Client) => void;
  usersList?: Array<{ id: EntityId; nombre?: string; username?: string; activo?: boolean }>;
  showSolKeys: Record<string, boolean>;
  setShowSolKeys: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  currentUser: any;
  setEditingClient: (client: Client) => void;
  setMejoraPlanClient: (client: Client) => void;
  setMejoraPlanSeleccionado: (plan: string) => void;
  setDeletingClient: (client: Client) => void;
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
  estadoCuentaFilter = '',
  setEstadoCuentaFilter = () => {},
  capacitacionFilter = '',
  setCapacitacionFilter = () => {},
  suscripcionFilter = '',
  setSuscripcionFilter = () => {},
  sellerFilter = '',
  setSellerFilter = () => {},
  uniqueSellers = [],
  handleAssignVendedor,
  handleSelfAssignVendedor,
  usersList = [],
  showSolKeys,
  setShowSolKeys,
  currentUser,
  setEditingClient,
  setMejoraPlanClient,
  setMejoraPlanSeleccionado,
  setDeletingClient,
}: ClientesTodosTabProps) {
  const currentSearch = search !== undefined ? search : (searchTerm || '');
  const handleSearchChange = setSearch || setSearchTerm || (() => {});
  const [copiedMessageClientId, setCopiedMessageClientId] = React.useState<EntityId | null>(null);
  const [currentPage, setCurrentPage] = React.useState(1);
  const pageSize = 10;

  const formatRegimen = (value?: string) => {
    const labels: Record<string, string> = {
      MYPE_TRIBUTARIO: 'Régimen MYPE Tributario',
      REGIMEN_GENERAL: 'Régimen General',
      RER: 'Régimen Especial - RER',
      NRUS: 'Nuevo RUS - NRUS',
    };
    return labels[value || ''] || value || 'No registrado';
  };

  const buildAffiliationMessage = (client: Client) => [
    'Te adjuntamos la información necesaria para completar el proceso.',
    '',
    'Datos para la afiliación:',
    '',
    `Razón Social : ${client.razonSocial || 'No registrado'}`,
    `Nombre del Negocio : ${client.nombreComercial || 'No registrado'}`,
    `Régimen Tributario : ${formatRegimen(client.regimenTributario)}`,
    `DNI : ${client.dni || 'No registrado'}`,
    `Celular : ${client.telefono || client.telefonoPersonal || 'No registrado'}`,
    `Correo : ${client.email || 'No registrado'}`,
    `Dirección Fiscal : ${client.direccion || 'No registrado'}`,
    `Distrito, Provincia y Departamento : ${[client.distrito, client.provincia, client.departamento].filter(Boolean).join(', ') || 'No registrado'}`,
    `Plan Contratado : ${client.planContratado || 'No registrado'}`,
    '',
    'Para el alta en SUNAT:',
    `RUC : ${client.ruc || 'No registrado'}`,
    `Usuario SOL : ${client.usuarioSol || 'No registrado'}`,
    `Clave SOL : ${client.claveSolCifrada || 'No registrada'}`,
    '',
    'Adicional:',
    '1. ¿Es su primer sistema de facturación? Si',
    '2. ¿Emitía comprobantes desde SUNAT? No',
    '3. ¿Paga IGV o está exonerado? No estoy exonerado, pago normal',
  ].join('\n');

  const copyAffiliationMessage = async (client: Client) => {
    const message = buildAffiliationMessage(client);
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(message);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = message;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedMessageClientId(client.id);
      setTimeout(() => {
        setCopiedMessageClientId(null);
      }, 2000);
    } catch (err) {
      console.error('No se pudo copiar el mensaje de afiliación', err);
    }
  };

  const hasActiveFilters = Boolean(
    currentSearch.trim() ||
    regimenFilter ||
    planFilter ||
    (estadoCuentaFilter && estadoCuentaFilter !== 'TODOS') ||
    (capacitacionFilter && capacitacionFilter !== 'TODOS') ||
    (suscripcionFilter && suscripcionFilter !== 'TODOS') ||
    sellerFilter
  );

  const resetAllFilters = () => {
    handleSearchChange('');
    setRegimenFilter('');
    setPlanFilter('');
    setEstadoCuentaFilter('');
    setCapacitacionFilter('');
    setSuscripcionFilter('');
    setSellerFilter('');
  };

  const totalPages = Math.max(1, Math.ceil(allFilteredClients.length / pageSize));
  const visibleClients = React.useMemo(
    () => allFilteredClients.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [allFilteredClients, currentPage]
  );

  React.useEffect(() => {
    setCurrentPage(1);
  }, [
    currentSearch,
    regimenFilter,
    planFilter,
    estadoCuentaFilter,
    capacitacionFilter,
    suscripcionFilter,
    sellerFilter,
    allFilteredClients.length,
  ]);

  React.useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

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
        <div className="d-flex align-items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={resetAllFilters}
              className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1 fw-semibold"
            >
              <RotateCcw size={13} />
              <span>Limpiar Filtros</span>
            </button>
          )}
          <span className="badge bg-primary rounded-pill px-3 py-1.5 fw-bold">
            {allFilteredClients.length} Registros Total
          </span>
        </div>
      </div>

      {/* Panel Avanzado de Filtros */}
      <div className="p-3 bg-light rounded-3 border mb-4">
        <div className="row g-2 mb-2">
          <div className="col-lg-4 col-md-6">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-white border-end-0 text-muted">
                <Search size={14} />
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Buscar por RUC, Empresa, DNI, Teléfono..."
                value={currentSearch}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>
          </div>
          <div className="col-lg-2 col-md-3 col-6">
            <select
              className="form-select form-select-sm fw-semibold"
              value={estadoCuentaFilter}
              onChange={(e) => setEstadoCuentaFilter(e.target.value)}
            >
              <option value="">Estado: Todos</option>
              <option value="HABILITADO">Habilitado</option>
              <option value="POR_COBRAR">Por Cobrar</option>
              <option value="VENCIDO">Vencido</option>
              <option value="BLOQUEADO">Bloqueado</option>
              <option value="POR_CAPACITAR">Por Capacitar</option>
            </select>
          </div>
          <div className="col-lg-2 col-md-3 col-6">
            <select
              className="form-select form-select-sm fw-semibold"
              value={suscripcionFilter}
              onChange={(e) => setSuscripcionFilter(e.target.value)}
            >
              <option value="">Suscripción: Todas</option>
              <option value="MENSUAL">Mensual</option>
              <option value="ANUAL">Anual</option>
            </select>
          </div>
          <div className="col-lg-2 col-md-6 col-6">
            <select
              className="form-select form-select-sm fw-semibold"
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
            >
              <option value="">Plan: Todos</option>
              <option value="INICIA">Plan Inicia (S/ 19)</option>
              <option value="EMPRENDE">Plan Emprende (S/ 29)</option>
              <option value="IMPULSA">Plan Impulsa (S/ 39)</option>
              <option value="EMPRESARIAL">Plan Empresarial (S/ 59)</option>
              <option value="LIDER">Plan Líder (S/ 89)</option>
            </select>
          </div>
          <div className="col-lg-2 col-md-6 col-6">
            <select
              className="form-select form-select-sm fw-semibold"
              value={regimenFilter}
              onChange={(e) => setRegimenFilter(e.target.value)}
            >
              <option value="">Régimen: Todos</option>
              <option value="MYPE_TRIBUTARIO">MYPE Tributario</option>
              <option value="REGIMEN_GENERAL">Régimen General</option>
              <option value="RER">RER</option>
              <option value="NRUS">Nuevo RUS</option>
            </select>
          </div>
        </div>

        <div className="row g-2">
          <div className="col-lg-3 col-md-6 col-6">
            <select
              className="form-select form-select-sm fw-semibold"
              value={capacitacionFilter}
              onChange={(e) => setCapacitacionFilter(e.target.value)}
            >
              <option value="">Capacitación: Todas</option>
              <option value="PENDIENTE">Pendiente de Capacitación</option>
              <option value="REALIZADA">Capacitado</option>
            </select>
          </div>
          <div className="col-lg-3 col-md-6 col-6">
            <select
              className="form-select form-select-sm fw-semibold"
              value={sellerFilter}
              onChange={(e) => setSellerFilter(e.target.value)}
            >
              <option value="">Vendedor: Todos</option>
              {uniqueSellers.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabla de Clientes */}
      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.85rem' }}>
          <thead>
            <tr>
              <th style={{ width: '50px' }}>#</th>
              <th>RUC / Empresa</th>
              <th>WhatsApp / Contacto</th>
              <th>Plan / Suscripción</th>
              <th>Vendedor</th>
              <th>Estado</th>
              <th className="text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {visibleClients.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-muted py-4 fw-semibold">
                  No se encontraron clientes con los filtros seleccionados.
                </td>
              </tr>
            ) : (
              visibleClients.map((c, idx) => (
                <tr key={c.id}>
                  <td className="text-muted fw-semibold py-2.5">
                    {(currentPage - 1) * pageSize + idx + 1}
                  </td>
                  <td>
                    <strong className="text-dark d-block fs-6">{c.razonSocial}</strong>
                    <span className="small text-muted fw-semibold">RUC: {c.ruc}</span>
                  </td>
                  <td>
                    <span className="fw-bold text-dark d-block">{c.telefono || c.telefonoPersonal || '—'}</span>
                    <span className="small text-muted">{c.usuarioWsp ? `WSP: ${c.usuarioWsp}` : c.email || '—'}</span>
                  </td>
                  <td>
                    <div className="d-flex align-items-center gap-1">
                      <span className="badge bg-light text-dark border fw-bold">{c.planContratado}</span>
                      <span className={`badge ${c.tipoSuscripcion === 'ANUAL' ? 'bg-purple text-white' : 'bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25'}`}>
                        {c.tipoSuscripcion || 'MENSUAL'}
                      </span>
                    </div>
                  </td>
                  <td>
                    {c.vendedor && c.vendedor !== 'Por asignar' && c.vendedor !== 'Sin Asignar' ? (
                      <span className="badge bg-secondary text-white fw-bold" style={{ fontSize: '0.75rem' }} title="Vendedor asignado">
                        {c.vendedor}
                      </span>
                    ) : currentUser?.rol === 'ADMIN' ? (
                      <select
                        className="form-select form-select-sm border-warning fw-semibold"
                        style={{ fontSize: '0.75rem', width: '130px' }}
                        defaultValue=""
                        onChange={(e) => {
                          if (e.target.value) handleAssignVendedor(c, e.target.value);
                        }}
                      >
                        <option value="" disabled>Asignar Asesor...</option>
                        {usersList.map((u) => (
                          <option key={u.id} value={u.nombre || u.username}>
                            {u.nombre || u.username}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <button
                        onClick={() => handleSelfAssignVendedor(c)}
                        className="btn btn-sm btn-outline-primary px-2 py-0.5"
                        style={{ fontSize: '0.75rem' }}
                      >
                        Asignarme
                      </button>
                    )}
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        c.estadoCuenta === 'HABILITADO'
                          ? 'badge-habilitado'
                          : c.estadoCuenta === 'POR_COBRAR'
                          ? 'badge-pendiente'
                          : c.estadoCuenta === 'VENCIDO'
                          ? 'badge-vencido'
                          : 'badge-bloqueado'
                      }`}
                    >
                      {c.estadoCuenta || 'SIN ESTADO'}
                    </span>
                  </td>
                  <td className="text-center">
                    <div className="d-flex justify-content-center align-items-center gap-1">
                      {/* Copiar Formato de Afiliación */}
                      <button
                        onClick={() => copyAffiliationMessage(c)}
                        className={`btn btn-sm p-1.5 ${
                          copiedMessageClientId === c.id
                            ? 'btn-success text-white'
                            : 'btn-outline-success text-success'
                        }`}
                        title="Copiar datos de afiliación"
                      >
                        {copiedMessageClientId === c.id ? <Check size={14} /> : <MessageCircle size={14} />}
                      </button>

                      {/* Mostrar / Ocultar Clave SOL */}
                      <button
                        onClick={() =>
                          setShowSolKeys((prev) => ({
                            ...prev,
                            [String(c.id)]: !prev[String(c.id)],
                          }))
                        }
                        className="btn btn-sm btn-outline-secondary p-1.5"
                        title={showSolKeys[String(c.id)] ? 'Ocultar Clave SOL' : 'Ver Clave SOL'}
                      >
                        {showSolKeys[String(c.id)] ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>

                      {/* Copiar Clave SOL */}
                      <button
                        onClick={() => {
                          if (c.claveSolCifrada) {
                            navigator.clipboard.writeText(c.claveSolCifrada);
                          }
                        }}
                        className="btn btn-sm btn-outline-secondary p-1.5"
                        title="Copiar Clave SOL"
                        disabled={!c.claveSolCifrada}
                      >
                        <Copy size={14} />
                      </button>

                      {/* Editar Cliente */}
                      <button
                        onClick={() => setEditingClient(c)}
                        className="btn btn-sm btn-outline-primary p-1.5"
                        title="Editar información"
                      >
                        <Edit2 size={14} />
                      </button>

                      {/* Mejorar Plan */}
                      <button
                        onClick={() => {
                          setMejoraPlanClient(c);
                          setMejoraPlanSeleccionado(c.planContratado || '');
                        }}
                        className="btn btn-sm btn-outline-warning text-dark p-1.5"
                        title="Mejorar Plan (Upgrade)"
                      >
                        <TrendingUp size={14} />
                      </button>

                      {/* Eliminar Cliente (solo ADMIN) */}
                      {currentUser?.rol === 'ADMIN' && (
                        <button
                          onClick={() => setDeletingClient(c)}
                          className="btn btn-sm btn-outline-danger p-1.5"
                          title="Eliminar cliente"
                        >
                          <Trash2 size={14} />
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

      <PaginationControls
        currentPage={currentPage}
        totalItems={allFilteredClients.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
