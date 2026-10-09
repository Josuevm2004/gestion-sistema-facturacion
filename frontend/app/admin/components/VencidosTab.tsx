'use client';

import React from 'react';
import { AlertCircle, RotateCcw, Settings, X, Unlock, ShieldAlert, Search, ChevronDown, Download } from 'lucide-react';
import { Client } from './ClientesTodosTab';
import PaginationControls from './PaginationControls';
import { parseLocalDate, formatDatePeru } from '@/lib/billing';
import RegistrarPagoModal from '../modals/RegistrarPagoModal';
import { TableActionDropdown } from './TableActionDropdown';
import { exportTableToExcel } from '../utils/exportTableReport';

interface VencidosTabProps {
  clientesVencidosList: Client[];
  handleRenovarPlan: (client: Client, nuevoPlan?: string, nuevoTipo?: string, paymentDetails?: any) => any;
  handleAdelantoPago?: (client: Client, monto?: number, observaciones?: string, paymentDetails?: any) => any;
  setCambioPlanClient: (client: Client) => void;
  setCambioPlanSeleccionado: (plan: string) => void;
  setCambioPlanTipo?: (tipo: string) => void;
  handleEstadoCuentaChange?: (client: Client, nuevoEstado: string) => void;
  handleDevolverAcceso?: (client: Client) => void;
}

export default function VencidosTab({
  clientesVencidosList,
  handleRenovarPlan,
  handleAdelantoPago,
  setCambioPlanClient,
  setCambioPlanSeleccionado,
  setCambioPlanTipo,
  handleEstadoCuentaChange,
  handleDevolverAcceso,
}: VencidosTabProps) {
  const [pagoModalConfig, setPagoModalConfig] = React.useState<{
    client: Client;
  } | null>(null);
  const [search, setSearch] = React.useState('');
  const [suscripcionFilter, setSuscripcionFilter] = React.useState('');
  const [vendedorFilter, setVendedorFilter] = React.useState('');
  const [planFilter, setPlanFilter] = React.useState('');
  const [openActionId, setOpenActionId] = React.useState<string | number | null>(null);
  const pageSize = 10;
  const [currentPage, setCurrentPage] = React.useState(1);

  const availableVendedores = React.useMemo(() => {
    const s = new Set<string>();
    clientesVencidosList.forEach((c) => {
      if (c.vendedor) s.add(c.vendedor.trim());
    });
    return Array.from(s).sort();
  }, [clientesVencidosList]);

  const availablePlanes = React.useMemo(() => {
    const s = new Set<string>();
    clientesVencidosList.forEach((c) => {
      if (c.planContratado) s.add(c.planContratado.trim());
    });
    return Array.from(s).sort();
  }, [clientesVencidosList]);

  const filteredClients = React.useMemo(() => {
    return clientesVencidosList.filter((c) => {
      if (suscripcionFilter) {
        const tipo = (c.tipoSuscripcion || 'MENSUAL').toUpperCase();
        if (tipo !== suscripcionFilter.toUpperCase()) return false;
      }
      if (vendedorFilter && (c.vendedor || '').toLowerCase() !== vendedorFilter.toLowerCase()) {
        return false;
      }
      if (planFilter && (c.planContratado || '').toLowerCase() !== planFilter.toLowerCase()) {
        return false;
      }
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const match =
          c.razonSocial?.toLowerCase().includes(q) ||
          c.ruc?.toLowerCase().includes(q) ||
          (c.dni || '').toLowerCase().includes(q) ||
          (c.nombres || '').toLowerCase().includes(q) ||
          (c.apellidos || '').toLowerCase().includes(q) ||
          (c.telefono || '').toLowerCase().includes(q) ||
          (c.telefonoPersonal || '').toLowerCase().includes(q) ||
          (c.usuarioWsp || '').toLowerCase().includes(q) ||
          (c.email || '').toLowerCase().includes(q) ||
          (c.planContratado || '').toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [clientesVencidosList, search, suscripcionFilter, vendedorFilter, planFilter]);

  const hasActiveFilters = Boolean(search.trim() || suscripcionFilter || vendedorFilter || planFilter);

  const resetFilters = () => {
    setSearch('');
    setSuscripcionFilter('');
    setVendedorFilter('');
    setPlanFilter('');
  };

  const handleExportReport = () => {
    exportTableToExcel({
      filename: `Reporte_Clientes_Vencidos_${new Date().toISOString().slice(0, 10)}`,
      sheetName: 'Vencidos',
      reportTitle: 'Reporte de Clientes Vencidos',
      reportSubtitle: 'Cartera de clientes con fecha de servicio expirada y gestión de cobro pendiente',
      columns: [
        { header: '#', key: 'idx', width: 40, align: 'center', getValue: (_, idx) => idx + 1 },
        { header: 'RUC', key: 'ruc', width: 110, align: 'center' },
        { header: 'Razón Social / Empresa', key: 'razonSocial', width: 230 },
        { header: 'Contacto / Teléfono', key: 'telefono', width: 130, getValue: (c) => c.telefono || c.telefonoPersonal || '—' },
        { header: 'Email', key: 'email', width: 180, getValue: (c) => c.email || c.emailPersonal || '—' },
        { header: 'Plan Contratado', key: 'planContratado', width: 140, getValue: (c) => c.planContratado || 'Plan Estándar' },
        { header: 'Suscripción', key: 'tipoSuscripcion', width: 100, align: 'center', getValue: (c) => c.tipoSuscripcion || 'MENSUAL' },
        { header: 'Asesor Comercial', key: 'vendedor', width: 140, getValue: (c) => c.vendedor || 'Por asignar' },
        { header: 'Estado', key: 'estadoCuenta', width: 100, align: 'center', getValue: (c) => c.estadoCuenta || 'VENCIDO' },
        {
          header: 'Monto a Cobrar / Deuda (S/)',
          key: 'deuda',
          type: 'number',
          width: 130,
          getValue: (c) => Number(c.montoSiguienteCobro && Number(c.montoSiguienteCobro) > 0 ? c.montoSiguienteCobro : (c.montoMensual || c.precioPlan || 0)),
        },
        {
          header: 'Fecha Vencimiento',
          key: 'vencimiento',
          width: 120,
          align: 'center',
          getValue: (c) => c.fechaVencimientoMensual ? new Date(c.fechaVencimientoMensual).toLocaleDateString('es-PE') : '—',
        },
      ],
      data: filteredClients,
    });
  };

  const totalPages = Math.max(1, Math.ceil(filteredClients.length / pageSize));
  const visibleClients = React.useMemo(
    () => filteredClients.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [filteredClients, currentPage]
  );

  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, suscripcionFilter, vendedorFilter, planFilter, filteredClients.length]);

  React.useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  return (
    <div className="w-100 admin-module admin-module--overdue">
      <section className="admin-data-panel" aria-label="Clientes vencidos">
      {/* Encabezado con Icono Moderno y Badge */}
      <div className="admin-module-heading d-flex justify-content-between align-items-center flex-wrap gap-3">
        <div className="d-flex align-items-center gap-3">
          <div className="section-header-icon section-header-icon-danger">
            <AlertCircle size={20} strokeWidth={2.2} />
          </div>
          <div>
            <h2 className="fw-bold text-dark mb-0 fs-5" style={{ letterSpacing: '-0.3px' }}>Clientes Vencidos</h2>
            <small className="text-muted fw-semibold">Clientes con fecha de servicio expirada que requieren renovación o corte</small>
          </div>
        </div>
        <div className="d-flex align-items-center gap-2 flex-wrap">
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="btn-meta-action btn-meta-action-secondary"
            >
              <RotateCcw size={13} />
              <span>Limpiar Filtros</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleExportReport}
            className="btn-meta-action btn-meta-action-secondary"
            title="Exportar listado de clientes vencidos a Excel"
          >
            <Download size={14} />
            <span>Exportar Reporte ({filteredClients.length})</span>
          </button>
          <span className="admin-badge-count-pill admin-badge-count-pill--danger">
            {hasActiveFilters ? `${filteredClients.length} de ${clientesVencidosList.length} Vencidos` : `${clientesVencidosList.length} Vencidos`}
          </span>
        </div>
      </div>

      {/* Barra de Filtros: Buscador, Suscripción, Asesor y Plan */}
      <div className="stitch-filter-toolbar">
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-6 col-lg-4">
            <div className="stitch-filter-search">
              <Search size={15} />
              <input
                type="text"
                className="form-control stitch-filter-input"
                placeholder="Buscar por RUC, Empresa, DNI, Teléfono..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="col-6 col-md-3 col-lg-2">
            <select
              className="form-select stitch-filter-select w-100"
              value={suscripcionFilter}
              onChange={(e) => setSuscripcionFilter(e.target.value)}
            >
              <option value="">Modalidad: Todas</option>
              <option value="MENSUAL">Mensual</option>
              <option value="ANUAL">Anual</option>
            </select>
          </div>
          <div className="col-6 col-md-3 col-lg-3">
            <select
              className="form-select stitch-filter-select w-100"
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
            >
              <option value="">Plan: Todos</option>
              {availablePlanes.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div className="col-12 col-md-4 col-lg-3">
            <select
              className="form-select stitch-filter-select w-100"
              value={vendedorFilter}
              onChange={(e) => setVendedorFilter(e.target.value)}
            >
              <option value="">Asesor: Todos</option>
              {availableVendedores.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabla Expandida al 100% con Dropdown */}
      <div className="table-card-meta">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0 table-meta">
            <thead>
              <tr>
                <th style={{ width: '45px' }}>#</th>
                <th>RUC / Empresa</th>
                <th>Contacto</th>
                <th>Plan / Suscripción</th>
                <th>Estado</th>
                <th>Monto</th>
                <th>Vencimiento</th>
                <th className="text-center" style={{ width: '130px' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center text-muted py-5 fw-semibold">
                    No se encontraron clientes vencidos con los criterios especificados.
                  </td>
                </tr>
              ) : (
                visibleClients.map((c, idx) => {
                  const phone = c.telefono || c.telefonoPersonal;
                  const vencDate = c.fechaVencimientoMensual ? parseLocalDate(c.fechaVencimientoMensual) : null;
                  const isBloqueado = c.estadoCuenta === 'BLOQUEADO';
                  const initial = (c.razonSocial || 'C').charAt(0).toUpperCase();
                  const isActionOpen = openActionId === c.id;

                  return (
                    <tr key={c.id}>
                      <td className="text-muted fw-semibold py-2.5">
                        {(currentPage - 1) * pageSize + idx + 1}
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2.5">
                          <div
                            className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 fw-bold shadow-xs"
                            style={{
                              width: '32px',
                              height: '32px',
                              backgroundColor: '#FEF3F2',
                              color: '#D92D20',
                              fontSize: '0.78rem',
                              border: '1px solid #FECACA',
                            }}
                          >
                            {initial}
                          </div>
                          <div>
                            <span className="cell-title d-block">{c.razonSocial}</span>
                            <span className="cell-subtext font-monospace">RUC: {c.ruc}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="cell-title">{phone || '—'}</span>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-1.5 flex-wrap">
                          <span className="badge-tag badge-plan-tag">
                            {c.planContratado}
                          </span>
                          <span
                            className={`badge-tag ${c.tipoSuscripcion === 'ANUAL' ? 'badge-sub-anual' : 'badge-sub-mensual'}`}
                          >
                            {c.tipoSuscripcion || 'MENSUAL'}
                          </span>
                        </div>
                      </td>
                      <td>
                        {isBloqueado ? (
                          <span className="badge-fb badge-fb-secondary">
                            <span className="badge-dot badge-dot-neutral" />
                            <ShieldAlert size={11} /> Bloqueado
                          </span>
                        ) : (
                          <span className="badge-fb badge-fb-danger">
                            <span className="badge-dot badge-dot-danger" />
                            Vencido
                          </span>
                        )}
                      </td>
                      <td>
                        <span className="cell-amount text-danger">
                          S/ {Number(c.montoSiguienteCobro && Number(c.montoSiguienteCobro) > 0 ? c.montoSiguienteCobro : (c.montoMensual || c.precioPlan || 0)).toFixed(2)}
                        </span>
                      </td>
                      <td>
                        {vencDate ? (
                          <span className="badge-tag badge-plazo-expired">
                            <span className="badge-dot badge-dot-danger" />
                            {formatDatePeru(vencDate)}
                          </span>
                        ) : (
                          <span className="badge-tag badge-plazo-neutral">Sin fecha</span>
                        )}
                      </td>
                      <td className="text-center">
                        <TableActionDropdown
                          isOpen={isActionOpen}
                          onToggle={() => setOpenActionId(isActionOpen ? null : c.id)}
                          onClose={() => setOpenActionId(null)}
                          buttonTitle="Opciones de regularización y renovación"
                          menuWidth={230}
                        >
                          <button
                            type="button"
                            className="table-action-item item-primary"
                            onClick={() => {
                              setOpenActionId(null);
                              setPagoModalConfig({ client: c });
                            }}
                          >
                            <RotateCcw size={15} />
                            <span>Registrar Pago / Renovar</span>
                          </button>
                          <button
                            type="button"
                            className="table-action-item"
                            onClick={() => {
                              setOpenActionId(null);
                              setCambioPlanClient(c);
                              setCambioPlanSeleccionado(c.planContratado || '');
                              if (setCambioPlanTipo) setCambioPlanTipo(c.tipoSuscripcion || 'MENSUAL');
                            }}
                          >
                            <Settings size={15} />
                            <span>Cambiar Plan</span>
                          </button>
                          {!isBloqueado ? (
                            <button
                              type="button"
                              className="table-action-item item-danger"
                              onClick={() => {
                                setOpenActionId(null);
                                const ok = window.confirm(
                                  `¿Bloquear cliente ${c.razonSocial}? Su acceso se suspenderá.`
                                );
                                if (ok && handleEstadoCuentaChange) handleEstadoCuentaChange(c, 'BLOQUEADO');
                              }}
                            >
                              <X size={15} />
                              <span>Bloquear Acceso</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="table-action-item item-success"
                              onClick={() => {
                                setOpenActionId(null);
                                if (handleDevolverAcceso) handleDevolverAcceso(c);
                              }}
                            >
                              <Unlock size={15} />
                              <span>Desbloquear Acceso</span>
                            </button>
                          )}
                        </TableActionDropdown>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <PaginationControls
        currentPage={currentPage}
        totalItems={filteredClients.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
      />
      </section>

      {/* Modal Unificado de Renovación, Reanudación y Adelanto de Pago */}
      {pagoModalConfig && (
        <RegistrarPagoModal
          client={pagoModalConfig.client}
          onClose={() => setPagoModalConfig(null)}
          onConfirm={async (client, data) => {
            if (data.modalidad === 'ADELANTO' && handleAdelantoPago) {
              await handleAdelantoPago(client, data.monto, data.observaciones, {
                fechaPago: data.fechaPago,
                medioPago: data.medioPago,
                codigoOperacion: data.codigoOperacion,
                observaciones: data.observaciones,
              });
            } else {
              await handleRenovarPlan(client, undefined, undefined, {
                monto: data.monto,
                fechaPago: data.fechaPago,
                medioPago: data.medioPago,
                codigoOperacion: data.codigoOperacion,
                observaciones: data.observaciones,
                conProrrateo: data.conProrrateo,
                fechaInicioPeriodo: data.fechaInicioPeriodo,
                fechaFinPeriodo: data.fechaFinPeriodo,
              });
            }
            setPagoModalConfig(null);
          }}
        />
      )}
    </div>
  );
}
