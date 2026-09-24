'use client';

import React from 'react';
import {
  Users,
  Search,
  Check,
  TrendingUp,
  MessageCircle,
  RotateCcw,
  UserPlus,
  SlidersHorizontal,
  MoreVertical,
  ChevronDown,
  Edit2,
  Trash2,
  Eye,
  MessageSquare,
  BellRing,
  CheckCircle2,
  CalendarPlus,
} from 'lucide-react';
import PaginationControls from './PaginationControls';
import BillingMessageModal from '../modals/BillingMessageModal';
import RegistrarPagoModal from '../modals/RegistrarPagoModal';
import { parseLocalDate, getDiffDays } from '@/lib/billing';

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
  precioPlan?: number;
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
  vendedorId?: EntityId | null;
  linkSistema?: string;
  usuarioSistema?: string;
  claveSistema?: string;
  colorTag?: ColorTagType;
  colorCodigo?: string;
  avisado?: boolean;
  entornoId?: EntityId | null;
  entornoNombre?: string;
  dniRepresentante?: string;
  correoRepresentante?: string;
  primeraVezOProviene?: string;
  usabaSunatAnteriormente?: string;
  tipoIgv?: string;
  [key: string]: any;
};

export interface ColumnConfig {
  id: string;
  label: string;
  defaultVisible: boolean;
}

export const AVAILABLE_COLUMNS: ColumnConfig[] = [
  { id: 'index', label: '#', defaultVisible: true },
  { id: 'empresa', label: 'Empresa / Razón Social', defaultVisible: true },
  { id: 'ruc', label: 'RUC', defaultVisible: true },
  { id: 'representante', label: 'Representante Legal', defaultVisible: false },
  { id: 'dni', label: 'DNI', defaultVisible: false },
  { id: 'contacto', label: 'Contacto / Teléfono', defaultVisible: true },
  { id: 'usuarioWsp', label: 'Usuario WSP', defaultVisible: false },
  { id: 'plan', label: 'Plan / Suscripción', defaultVisible: true },
  { id: 'proximoCobro', label: 'Próximo Cobro', defaultVisible: true },
  { id: 'vencimiento', label: 'Vencimiento', defaultVisible: true },
  { id: 'plazo', label: 'Plazo (Días)', defaultVisible: true },
  { id: 'vendedor', label: 'Vendedor / Asesor', defaultVisible: true },
  { id: 'estado', label: 'Estado de Cuenta', defaultVisible: true },
  { id: 'avisado', label: 'Estado de Aviso', defaultVisible: true },
  { id: 'acciones', label: 'Acciones', defaultVisible: true },
];

const STORAGE_KEY = 'miquipu_clientes_columnas_visibles';

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
  showSolKeys?: Record<string, boolean>;
  setShowSolKeys?: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  currentUser: any;
  setEditingClient: (client: Client) => void;
  setMejoraPlanClient: (client: Client) => void;
  setMejoraPlanSeleccionado: (plan: string) => void;
  setDeletingClient: (client: Client) => void;
  onOpenCreateClient?: () => void;
  handleToggleAvisado?: (client: Client, nextAvisado?: boolean) => void;
  handleAdelantoPago?: (client: Client, monto?: number, observaciones?: string, paymentDetails?: any) => Promise<void> | void;
  setHistoryClient?: (client: Client) => void;
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
  currentUser,
  setEditingClient,
  setMejoraPlanClient,
  setMejoraPlanSeleccionado,
  setDeletingClient,
  onOpenCreateClient,
  handleToggleAvisado,
  handleAdelantoPago,
  setHistoryClient,
}: ClientesTodosTabProps) {
  const currentSearch = search !== undefined ? search : (searchTerm || '');
  const handleSearchChange = setSearch || setSearchTerm || (() => {});
  const [copiedMessageClientId, setCopiedMessageClientId] = React.useState<EntityId | null>(null);
  const [currentPage, setCurrentPage] = React.useState(1);
  const pageSize = 10;

  // Estado del menú desplegable de acciones
  const [openActionClientId, setOpenActionClientId] = React.useState<EntityId | null>(null);
  const actionMenuRef = React.useRef<HTMLDivElement | null>(null);

  // Modales adicionales unificados de Centro de Control
  const [billingMessageClient, setBillingMessageClient] = React.useState<Client | null>(null);
  const [adelantoClient, setAdelantoClient] = React.useState<Client | null>(null);
  const [avisadoFilter, setAvisadoFilter] = React.useState<string>('');

  // Configuración de visibilidad de columnas
  const [visibleColumns, setVisibleColumns] = React.useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    AVAILABLE_COLUMNS.forEach((col) => {
      initial[col.id] = col.defaultVisible;
    });
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === 'object') {
            return { ...initial, ...parsed };
          }
        }
      } catch {}
    }
    return initial;
  });

  const [showColumnModal, setShowColumnModal] = React.useState(false);

  // Cerrar menú de acciones al hacer clic fuera
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(e.target as Node)) {
        setOpenActionClientId(null);
      }
    };
    if (openActionClientId !== null) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openActionClientId]);

  const toggleColumn = (columnId: string) => {
    setVisibleColumns((prev) => {
      const updated = { ...prev, [columnId]: !prev[columnId] };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const setAllColumns = (visible: boolean) => {
    const updated: Record<string, boolean> = {};
    AVAILABLE_COLUMNS.forEach((c) => {
      updated[c.id] = visible;
    });
    setVisibleColumns(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  };

  const resetDefaultColumns = () => {
    const updated: Record<string, boolean> = {};
    AVAILABLE_COLUMNS.forEach((c) => {
      updated[c.id] = c.defaultVisible;
    });
    setVisibleColumns(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  };

  const formatRegimen = (value?: string) => {
    const labels: Record<string, string> = {
      MYPE_TRIBUTARIO: 'MYPE Tributario',
      REGIMEN_GENERAL: 'General',
      RER: 'RER',
      ESPECIAL: 'RER',
      NRUS: 'RUS',
      GENERAL: 'General',
    };
    return labels[value || ''] || value || '';
  };

  const buildAffiliationMessage = (client: Client) => {
    const nombreComercial = client.nombreComercial || client.razonSocial || '';
    const regimen = formatRegimen(client.regimenTributario);
    const celular = client.telefono || client.telefonoPersonal || client.usuarioWsp || '';
    const email = client.email || client.emailPersonal || '';

    const planRaw = (client.planContratado || '').toUpperCase().trim();
    const planFormatted = planRaw
      ? (planRaw.startsWith('PLAN ') ? planRaw : `PLAN ${planRaw}`)
      : '';
    const suscripcion = (client.tipoSuscripcion || 'MENSUAL').toUpperCase().trim();
    const planCompleto = planFormatted ? `${planFormatted} ${suscripcion}` : '';

    const esInterno = client.entornoNombre ? client.entornoNombre.toLowerCase().includes('interno') : false;

    if (esInterno) {
      return [
        '📌 *DATOS DE LA EMPRESA*',
        '',
        `👉🏼 Nombre Comercial:${nombreComercial ? ` ${nombreComercial}` : ''}`,
        ` 🌐 Modalidad:${client.entornoNombre ? ` ${client.entornoNombre}` : ' Control Interno'}`,
        '',
        `🔢 RUC:${client.ruc ? ` ${client.ruc}` : ''}`,
        `🗣️ DNI:${client.dni ? ` ${client.dni}` : ''}`,
        `📞 Celular:${celular ? ` ${celular}` : ''}`,
        `📧 Correo (Tenga acceso actual):${email ? ` ${email}` : ''}`,
        `📍 Dirección Comercial o Fiscal:${client.direccion ? ` ${client.direccion}` : ''}`,
        '',
        ` 📍 Departamento:${client.departamento ? ` ${client.departamento}` : ''}`,
        ` 🏙️ Provincia:${client.provincia ? ` ${client.provincia}` : ''}`,
        ` 🏘️ Distrito:${client.distrito ? ` ${client.distrito}` : ''}`,
        '',
        ` 📦 Plan Mensual Contratado:${planCompleto ? ` ${planCompleto}` : ''}`,
      ].join('\n');
    }

    return [
      '📌 *DATOS DE LA EMPRESA*',
      '',
      `👉🏼 Nombre Comercial:${nombreComercial ? ` ${nombreComercial}` : ''}`,
      ` 📊 Régimen Tributario (RUS, RER, MYPE O GENERAL)${regimen ? `: ${regimen}` : ''}`,
      ` 🌐 Modalidad:${client.entornoNombre ? ` ${client.entornoNombre}` : ' Producción'}`,
      '',
      `🗣️ DNI:${client.dni ? ` ${client.dni}` : ''}`,
      `📞 Celular:${celular ? ` ${celular}` : ''}`,
      `📧 Correo (Tenga acceso actual):${email ? ` ${email}` : ''}`,
      `📍 Dirección Comercial o Fiscal:${client.direccion ? ` ${client.direccion}` : ''}`,
      '',
      ` 📍 Departamento:${client.departamento ? ` ${client.departamento}` : ''}`,
      ` 🏙️ Provincia:${client.provincia ? ` ${client.provincia}` : ''}`,
      ` 🏘️ Distrito:${client.distrito ? ` ${client.distrito}` : ''}`,
      '',
      ` 📦 Plan Mensual Contratado:${planCompleto ? ` ${planCompleto}` : ''}`,
      '',
      ' 🔐 ACCESOS CLAVE SOL (ACTIVACIÓN A SUNAT) Enviar los datos reales que brinda la sunat, no enviar usuario secundario, protegemos sus datos según ley peruana de privacidad N° 29733.',
      ` 🔢 RUC:${client.ruc ? ` ${client.ruc}` : ''}`,
      `👤 Usuario SOL:${client.usuarioSol && client.usuarioSol !== 'SIN_USUARIO' ? ` ${client.usuarioSol}` : ''}`,
      `🔑 Contraseña SOL:${client.claveSolCifrada && client.claveSolCifrada !== 'SIN_CLAVE' ? ` ${client.claveSolCifrada}` : ''}`,
      `Número de DNI (Diferente al dueño y socios, mayor de edad):${client.dniRepresentante ? ` ${client.dniRepresentante}` : ''}`,
      `Correo (Diferente al dueño y socios):${client.correoRepresentante ? ` ${client.correoRepresentante}` : ''}`,
      '',
      'PREGUNTAS ADICIONALES',
      '',
      `1. ¿Es su primera vez usando un sistema de facturación o viene de otro sistema de facturación?:${client.primeraVezOProviene ? ` ${client.primeraVezOProviene}` : ''}`,
      `2. ¿Usaba antes la plataforma de SUNAT para emitir comprobantes como boletas o facturas?:${client.usabaSunatAnteriormente ? ` ${client.usabaSunatAnteriormente}` : ''}`,
      `3. ¿Está usted pagando IGV normal o está exonerado? (Solo aplica para la selva):${client.tipoIgv ? ` ${client.tipoIgv}` : ''}`,
    ].join('\n');
  };

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
    sellerFilter ||
    avisadoFilter
  );

  const resetAllFilters = () => {
    handleSearchChange('');
    setRegimenFilter('');
    setPlanFilter('');
    setEstadoCuentaFilter('');
    setCapacitacionFilter('');
    setSuscripcionFilter('');
    setSellerFilter('');
    setAvisadoFilter('');
  };

  // Clientes procesados con fechas de vencimiento y filtro de avisado
  const processedClients = React.useMemo(() => {
    return allFilteredClients
      .filter((c) => {
        if (avisadoFilter === 'AVISADO') {
          if (!c.avisado) return false;
        } else if (avisadoFilter === 'NO_AVISADO') {
          if (c.avisado) return false;
        }
        return true;
      })
      .map((c) => {
        const vencDate = parseLocalDate(c.fechaVencimientoMensual);
        const diffDays = getDiffDays(c.fechaVencimientoMensual);
        return { ...c, _vencDate: vencDate, _diffDays: diffDays };
      });
  }, [allFilteredClients, avisadoFilter]);

  const totalPages = Math.max(1, Math.ceil(processedClients.length / pageSize));
  const visibleClients = React.useMemo(
    () => processedClients.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [processedClients, currentPage]
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
    avisadoFilter,
    processedClients.length,
  ]);

  React.useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const visibleColumnCount = AVAILABLE_COLUMNS.filter((col) => visibleColumns[col.id]).length;

  return (
    <div className="custom-card p-4 shadow-sm">
      <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3 flex-wrap gap-2">
        <div className="d-flex align-items-center gap-2">
          <div className="p-2 bg-primary bg-opacity-10 text-primary rounded-3">
            <Users size={20} />
          </div>
          <div>
            <h2 className="h6 fw-bold text-dark mb-0">Gestión General de Clientes</h2>
            <small className="text-muted">Listado consolidado, monitoreo de vencimientos y cobranzas</small>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2 flex-wrap">
          {hasActiveFilters && (
            <button
              onClick={resetAllFilters}
              className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1 fw-semibold"
            >
              <RotateCcw size={13} />
              <span>Limpiar Filtros</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowColumnModal(true)}
            className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1.5 fw-semibold shadow-sm"
            title="Personalizar columnas visibles de la tabla"
          >
            <SlidersHorizontal size={14} />
            <span>Columnas ({visibleColumnCount})</span>
          </button>

          <span className="badge bg-primary rounded-pill px-3 py-1.5 fw-bold">
            {processedClients.length} Registros Total
          </span>

          {onOpenCreateClient && (
            <button
              type="button"
              onClick={onOpenCreateClient}
              className="btn btn-sm btn-primary d-inline-flex align-items-center gap-1.5 fw-bold shadow-sm"
              title="Crear un nuevo cliente de forma manual"
            >
              <UserPlus size={15} />
              <span>Crear Cliente</span>
            </button>
          )}
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
          <div className="col-lg-3 col-md-4 col-6">
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
          <div className="col-lg-3 col-md-4 col-6">
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
          <div className="col-lg-3 col-md-4 col-12">
            <select
              className="form-select form-select-sm fw-semibold"
              value={avisadoFilter}
              onChange={(e) => setAvisadoFilter(e.target.value)}
            >
              <option value="">Estado de Aviso: Todos</option>
              <option value="AVISADO">Sólo Avisados</option>
              <option value="NO_AVISADO">Sin Avisar (Pendientes)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla de Clientes con Columnas Ajustables */}
      <div className="table-responsive" style={{ minHeight: '380px' }}>
        <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.85rem' }}>
          <thead>
            <tr>
              {visibleColumns.index && <th style={{ width: '45px' }} className="py-2.5">#</th>}
              {visibleColumns.empresa && <th className="py-2.5">Empresa / Razón Social</th>}
              {visibleColumns.ruc && <th className="py-2.5">RUC</th>}
              {visibleColumns.representante && <th className="py-2.5">Representante</th>}
              {visibleColumns.dni && <th className="py-2.5">DNI</th>}
              {visibleColumns.contacto && <th className="py-2.5">Teléfono / Contacto</th>}
              {visibleColumns.usuarioWsp && <th className="py-2.5">Usuario WSP</th>}
              {visibleColumns.plan && <th className="py-2.5">Plan / Suscripción</th>}
              {visibleColumns.proximoCobro && <th className="py-2.5">Próximo Cobro</th>}
              {visibleColumns.vencimiento && <th className="py-2.5">Vencimiento</th>}
              {visibleColumns.plazo && <th className="py-2.5">Plazo</th>}
              {visibleColumns.vendedor && <th className="py-2.5">Vendedor</th>}
              {visibleColumns.estado && <th className="py-2.5">Estado</th>}
              {visibleColumns.avisado && <th className="py-2.5 text-center">Avisado</th>}
              {visibleColumns.acciones && <th className="py-2.5 text-center" style={{ minWidth: '120px' }}>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {visibleClients.length === 0 ? (
              <tr>
                <td colSpan={visibleColumnCount || 1} className="text-center text-muted py-4 fw-semibold">
                  No se encontraron clientes con los filtros seleccionados.
                </td>
              </tr>
            ) : (
              visibleClients.map((c, idx) => {
                const { _vencDate: vencDate, _diffDays: diffDays } = c;
                const estadoVisual = diffDays !== 9999 && diffDays <= 0 && c.estadoCuenta === 'HABILITADO'
                  ? 'VENCIDO'
                  : c.estadoCuenta;

                const cobroProximo = Number(c.montoSiguienteCobro ?? c.montoMensual ?? c.precioPlan ?? 0);
                const isNearExpiry = diffDays <= 3 && diffDays >= 0;
                const isExpired = diffDays <= 0;

                return (
                  <tr
                    key={c.id}
                    className={isExpired ? 'bg-danger bg-opacity-10' : isNearExpiry ? 'bg-warning bg-opacity-10' : ''}
                  >
                    {visibleColumns.index && (
                      <td className="text-muted fw-semibold py-2.5">
                        {(currentPage - 1) * pageSize + idx + 1}
                      </td>
                    )}

                    {visibleColumns.empresa && (
                      <td className="py-2.5">
                        <strong className="text-dark d-block fs-6">{c.razonSocial}</strong>
                        {c.nombreComercial && c.nombreComercial !== c.razonSocial && (
                          <small className="text-muted d-block">{c.nombreComercial}</small>
                        )}
                      </td>
                    )}

                    {visibleColumns.ruc && (
                      <td className="py-2.5">
                        <span className="fw-bold text-dark font-monospace">{c.ruc}</span>
                      </td>
                    )}

                    {visibleColumns.representante && (
                      <td className="py-2.5">
                        {c.nombres || c.apellidos ? (
                          <strong className="text-dark">
                            {c.nombres} {c.apellidos || ''}
                          </strong>
                        ) : (
                          <span className="text-muted small">Sin especificar</span>
                        )}
                      </td>
                    )}

                    {visibleColumns.dni && (
                      <td className="py-2.5">
                        {c.dni ? (
                          <span className="fw-bold text-dark font-monospace">{c.dni}</span>
                        ) : (
                          <span className="text-muted small">—</span>
                        )}
                      </td>
                    )}

                    {visibleColumns.contacto && (
                      <td className="py-2.5">
                        <span className="fw-bold text-dark d-block">{c.telefono || c.telefonoPersonal || '—'}</span>
                        <span className="small text-muted">{c.email || ''}</span>
                      </td>
                    )}

                    {visibleColumns.usuarioWsp && (
                      <td className="py-2.5">
                        {c.usuarioWsp ? (
                          <span className="badge bg-light text-dark border fw-semibold font-monospace">{c.usuarioWsp}</span>
                        ) : (
                          <span className="text-muted small">—</span>
                        )}
                      </td>
                    )}

                    {visibleColumns.plan && (
                      <td className="py-2.5">
                        <div className="d-flex align-items-center gap-1">
                          <span className="badge bg-light text-dark border fw-bold">{c.planContratado}</span>
                          <span className={`badge ${c.tipoSuscripcion === 'ANUAL' ? 'bg-purple text-white' : 'bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25'}`}>
                            {c.tipoSuscripcion || 'MENSUAL'}
                          </span>
                        </div>
                        {c.entornoNombre && (
                          <span className={`badge mt-1 ${c.entornoNombre.toLowerCase().includes('interno') ? 'bg-secondary bg-opacity-25 text-secondary border' : 'bg-info bg-opacity-10 text-info border'}`} style={{ fontSize: '0.68rem' }}>
                            {c.entornoNombre}
                          </span>
                        )}
                      </td>
                    )}

                    {visibleColumns.proximoCobro && (
                      <td className="py-2.5">
                        <strong className="text-primary fs-6">S/ {cobroProximo.toFixed(2)}</strong>
                      </td>
                    )}

                    {visibleColumns.vencimiento && (
                      <td className="py-2.5">
                        <strong className={isExpired ? 'text-danger' : isNearExpiry ? 'text-warning text-dark' : 'text-dark'}>
                          {vencDate
                            ? vencDate.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
                            : 'Sin fecha'}
                        </strong>
                      </td>
                    )}

                    {visibleColumns.plazo && (
                      <td className="py-2.5">
                        {diffDays === 9999 ? (
                          <span className="badge bg-light text-muted border">Sin fecha</span>
                        ) : diffDays > 0 ? (
                          <span
                            className={`badge fw-bold ${
                              diffDays <= 3 ? 'bg-warning bg-opacity-25 text-dark border border-warning' : diffDays <= 7 ? 'bg-info bg-opacity-25 text-dark border border-info' : 'bg-success bg-opacity-10 text-success border border-success border-opacity-25'
                            }`}
                          >
                            {diffDays === 1 ? 'Mañana' : `${diffDays} días`}
                          </span>
                        ) : diffDays === 0 ? (
                          <span className="badge bg-danger text-white fw-bold">HOY</span>
                        ) : (
                          <span className="badge bg-danger text-white">Vencido {Math.abs(diffDays)}d</span>
                        )}
                      </td>
                    )}

                    {visibleColumns.vendedor && (
                      <td className="py-2.5">
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
                    )}

                    {visibleColumns.estado && (
                      <td className="py-2.5">
                        <span
                          className={`badge ${
                            estadoVisual === 'HABILITADO'
                              ? 'badge-habilitado'
                              : estadoVisual === 'POR_COBRAR'
                              ? 'badge-pendiente'
                              : estadoVisual === 'VENCIDO'
                              ? 'badge-vencido'
                              : 'badge-bloqueado'
                          }`}
                        >
                          {estadoVisual || 'SIN ESTADO'}
                        </span>
                      </td>
                    )}

                    {visibleColumns.avisado && (
                      <td className="py-2.5 text-center">
                        {c.avisado ? (
                          <button
                            type="button"
                            className="btn btn-sm btn-success px-2 py-0.5 text-white fw-bold d-inline-flex align-items-center gap-1 shadow-sm"
                            style={{ fontSize: '0.72rem' }}
                            onClick={() => handleToggleAvisado?.(c, false)}
                            title="Cliente marcado como avisado. Clic para desmarcar."
                          >
                            <CheckCircle2 size={12} />
                            <span>Avisado</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary px-2 py-0.5 fw-semibold d-inline-flex align-items-center gap-1"
                            style={{ fontSize: '0.72rem' }}
                            onClick={() => handleToggleAvisado?.(c, true)}
                            title="Marcar cliente como avisado para su cobranza"
                          >
                            <BellRing size={12} />
                            <span>Pendiente</span>
                          </button>
                        )}
                      </td>
                    )}

                    {visibleColumns.acciones && (
                      <td className="py-2.5 text-center position-relative">
                        <div className="d-inline-block position-relative">
                          <button
                            type="button"
                            onClick={() => setOpenActionClientId(openActionClientId === c.id ? null : c.id)}
                            className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1.5 px-2.5 py-1 fw-semibold shadow-sm"
                            title="Acciones para este cliente"
                          >
                            <MoreVertical size={13} />
                            <span>Acciones</span>
                            <ChevronDown size={12} className={openActionClientId === c.id ? 'rotate-180' : ''} />
                          </button>

                          {openActionClientId === c.id && (
                            <div
                              ref={actionMenuRef}
                              className="dropdown-menu show shadow-lg border rounded-3 p-1 position-absolute end-0 mt-1"
                              style={{
                                zIndex: 1060,
                                minWidth: '220px',
                                backgroundColor: '#ffffff',
                              }}
                            >
                              {/* 1. Copiar Afiliación */}
                              <button
                                type="button"
                                className="dropdown-item d-flex align-items-center gap-2 py-1.5 px-2.5 rounded-2 small fw-semibold"
                                onClick={() => {
                                  copyAffiliationMessage(c);
                                  setOpenActionClientId(null);
                                }}
                              >
                                <MessageCircle size={15} className="text-success flex-shrink-0" />
                                <span>{copiedMessageClientId === c.id ? '¡Copiado!' : 'Copiar Afiliación'}</span>
                              </button>

                              {/* 2. Mensaje de Cobranza (WhatsApp) */}
                              <button
                                type="button"
                                className="dropdown-item d-flex align-items-center gap-2 py-1.5 px-2.5 rounded-2 small fw-semibold"
                                onClick={() => {
                                  setBillingMessageClient(c);
                                  setOpenActionClientId(null);
                                }}
                              >
                                <MessageSquare size={15} className="text-primary flex-shrink-0" />
                                <span>Mensaje de Cobranza</span>
                              </button>

                              {/* 3. Avisar / Desmarcar */}
                              <button
                                type="button"
                                className="dropdown-item d-flex align-items-center gap-2 py-1.5 px-2.5 rounded-2 small fw-semibold"
                                onClick={() => {
                                  handleToggleAvisado?.(c, !c.avisado);
                                  setOpenActionClientId(null);
                                }}
                              >
                                {c.avisado ? (
                                  <>
                                    <CheckCircle2 size={15} className="text-success flex-shrink-0" />
                                    <span>Desmarcar de Avisado</span>
                                  </>
                                ) : (
                                  <>
                                    <BellRing size={15} className="text-secondary flex-shrink-0" />
                                    <span>Marcar como Avisado</span>
                                  </>
                                )}
                              </button>

                              {/* 4. Adelanto de Pago */}
                              <button
                                type="button"
                                className="dropdown-item d-flex align-items-center gap-2 py-1.5 px-2.5 rounded-2 small fw-semibold"
                                onClick={() => {
                                  setAdelantoClient(c);
                                  setOpenActionClientId(null);
                                }}
                              >
                                <CalendarPlus size={15} className="text-warning text-dark flex-shrink-0" />
                                <span>Registrar Adelanto</span>
                              </button>

                              {/* 5. Historial de Pagos y Movimientos */}
                              <button
                                type="button"
                                className="dropdown-item d-flex align-items-center gap-2 py-1.5 px-2.5 rounded-2 small fw-semibold"
                                onClick={() => {
                                  setHistoryClient?.(c);
                                  setOpenActionClientId(null);
                                }}
                              >
                                <Eye size={15} className="text-info flex-shrink-0" />
                                <span>Ver Historial</span>
                              </button>

                              <div className="dropdown-divider my-1"></div>

                              {/* 6. Editar Cliente */}
                              <button
                                type="button"
                                className="dropdown-item d-flex align-items-center gap-2 py-1.5 px-2.5 rounded-2 small fw-semibold"
                                onClick={() => {
                                  setEditingClient(c);
                                  setOpenActionClientId(null);
                                }}
                              >
                                <Edit2 size={15} className="text-primary flex-shrink-0" />
                                <span>Editar Cliente</span>
                              </button>

                              {/* 7. Mejorar Plan (Upgrade) */}
                              <button
                                type="button"
                                className="dropdown-item d-flex align-items-center gap-2 py-1.5 px-2.5 rounded-2 small fw-semibold"
                                onClick={() => {
                                  setMejoraPlanClient(c);
                                  setMejoraPlanSeleccionado(c.planContratado || '');
                                  setOpenActionClientId(null);
                                }}
                              >
                                <TrendingUp size={15} className="text-success flex-shrink-0" />
                                <span>Mejorar Plan (Upgrade)</span>
                              </button>

                              {/* 8. Eliminar Cliente (solo ADMIN) */}
                              {currentUser?.rol === 'ADMIN' && (
                                <>
                                  <div className="dropdown-divider my-1"></div>
                                  <button
                                    type="button"
                                    className="dropdown-item d-flex align-items-center gap-2 py-1.5 px-2.5 rounded-2 small fw-semibold text-danger"
                                    onClick={() => {
                                      setDeletingClient(c);
                                      setOpenActionClientId(null);
                                    }}
                                  >
                                    <Trash2 size={15} className="text-danger flex-shrink-0" />
                                    <span>Eliminar Cliente</span>
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <PaginationControls
        currentPage={currentPage}
        totalItems={processedClients.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
      />

      {/* Modal de Personalización de Columnas */}
      {showColumnModal && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1070 }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content shadow-lg border-0 rounded-3">
              <div className="modal-header border-bottom py-3 px-4">
                <div className="d-flex align-items-center gap-2">
                  <div className="p-2 bg-primary bg-opacity-10 text-primary rounded-3">
                    <SlidersHorizontal size={18} />
                  </div>
                  <div>
                    <h5 className="modal-title fw-bold text-dark mb-0">Configuración de Columnas</h5>
                    <small className="text-muted">
                      Active o desactive las casillas para mostrar u ocultar columnas de la tabla
                    </small>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowColumnModal(false)}
                  aria-label="Cerrar"
                ></button>
              </div>

              <div className="modal-body p-4">
                <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom flex-wrap gap-2">
                  <span className="small text-muted fw-semibold">
                    Mostrando {visibleColumnCount} de {AVAILABLE_COLUMNS.length} columnas
                  </span>
                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      className="btn btn-xs btn-outline-primary fw-semibold px-2.5 py-1"
                      style={{ fontSize: '0.78rem' }}
                      onClick={() => setAllColumns(true)}
                    >
                      Seleccionar Todas
                    </button>
                    <button
                      type="button"
                      className="btn btn-xs btn-outline-secondary fw-semibold px-2.5 py-1"
                      style={{ fontSize: '0.78rem' }}
                      onClick={resetDefaultColumns}
                    >
                      Restablecer por Defecto
                    </button>
                  </div>
                </div>

                <div className="row g-2">
                  {AVAILABLE_COLUMNS.map((col) => (
                    <div key={col.id} className="col-12 col-sm-6 col-md-4">
                      <div
                        className={`p-2.5 border rounded-2 d-flex align-items-center gap-2 transition-colors ${
                          visibleColumns[col.id] ? 'bg-light border-primary' : 'bg-white opacity-75'
                        }`}
                        style={{ cursor: 'pointer' }}
                        onClick={() => toggleColumn(col.id)}
                      >
                        <input
                          type="checkbox"
                          className="form-check-input mt-0 cursor-pointer"
                          id={`col-toggle-${col.id}`}
                          checked={Boolean(visibleColumns[col.id])}
                          onChange={() => toggleColumn(col.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <label
                          htmlFor={`col-toggle-${col.id}`}
                          className="form-check-label small fw-semibold text-dark mb-0 cursor-pointer flex-grow-1"
                        >
                          {col.label}
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="modal-footer border-top py-2.5 px-4 bg-light rounded-bottom-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
                <small className="text-muted">Las preferencias se guardan de forma persistente en su navegador.</small>
                <button
                  type="button"
                  className="btn btn-primary btn-sm px-4 fw-bold shadow-sm"
                  onClick={() => setShowColumnModal(false)}
                >
                  Aceptar y Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Mensajes Inteligentes de Cobranza */}
      <BillingMessageModal
        client={billingMessageClient}
        onClose={() => setBillingMessageClient(null)}
        onAvisado={() => {
          if (billingMessageClient) {
            handleToggleAvisado?.(billingMessageClient, true);
          }
        }}
      />

      {/* Modal de Adelanto de Pago */}
      {adelantoClient && (
        <RegistrarPagoModal
          client={adelantoClient}
          mode="ADELANTO"
          onClose={() => setAdelantoClient(null)}
          onConfirm={async (client, data) => {
            await handleAdelantoPago?.(client, data.monto, data.observaciones, {
              fechaPago: data.fechaPago,
              medioPago: data.medioPago,
              codigoOperacion: data.codigoOperacion,
              observaciones: data.observaciones,
            });
            setAdelantoClient(null);
          }}
        />
      )}
    </div>
  );
}
