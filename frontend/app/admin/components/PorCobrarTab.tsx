'use client';

import React from 'react';
import { CreditCard, CheckCircle, X, Search, RotateCcw, Download } from 'lucide-react';
import { Client } from './ClientesTodosTab';
import PaginationControls from './PaginationControls';
import { TableActionDropdown } from './TableActionDropdown';
import { exportTableToExcel } from '../utils/exportTableReport';

interface PorCobrarTabProps {
  clientesPorCobrarList: Client[];
  handleRegisterPayment: (client: Client) => void;
  handleEstadoCuentaChange: (client: Client, nuevoEstado: string) => void;
}

export default function PorCobrarTab({
  clientesPorCobrarList,
  handleRegisterPayment,
  handleEstadoCuentaChange,
}: PorCobrarTabProps) {
  const [search, setSearch] = React.useState('');
  const [suscripcionFilter, setSuscripcionFilter] = React.useState('');
  const [vendedorFilter, setVendedorFilter] = React.useState('');
  const [planFilter, setPlanFilter] = React.useState('');
  const [openActionId, setOpenActionId] = React.useState<string | number | null>(null);
  const pageSize = 10;
  const [currentPage, setCurrentPage] = React.useState(1);

  const availableVendedores = React.useMemo(() => {
    const s = new Set<string>();
    clientesPorCobrarList.forEach((c) => {
      if (c.vendedor) s.add(c.vendedor.trim());
    });
    return Array.from(s).sort();
  }, [clientesPorCobrarList]);

  const availablePlanes = React.useMemo(() => {
    const s = new Set<string>();
    clientesPorCobrarList.forEach((c) => {
      if (c.planContratado) s.add(c.planContratado.trim());
    });
    return Array.from(s).sort();
  }, [clientesPorCobrarList]);

  const filteredClients = React.useMemo(() => {
    return clientesPorCobrarList.filter((c) => {
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
          (c.email || '').toLowerCase().includes(q) ||
          (c.planContratado || '').toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [clientesPorCobrarList, search, suscripcionFilter, vendedorFilter, planFilter]);

  const hasActiveFilters = Boolean(search.trim() || suscripcionFilter || vendedorFilter || planFilter);

  const resetFilters = () => {
    setSearch('');
    setSuscripcionFilter('');
    setVendedorFilter('');
    setPlanFilter('');
  };

  const handleExportReport = () => {
    exportTableToExcel({
      filename: `Reporte_Clientes_Por_Cobrar_${new Date().toISOString().slice(0, 10)}`,
      sheetName: 'PorCobrar',
      reportTitle: 'Reporte de Clientes Por Cobrar',
      reportSubtitle: 'Clientes pendientes de confirmación de pago inicial o activación',
      columns: [
        { header: '#', key: 'idx', width: 40, align: 'center', getValue: (_, idx) => idx + 1 },
        { header: 'RUC', key: 'ruc', width: 110, align: 'center' },
        { header: 'Razón Social / Empresa', key: 'razonSocial', width: 230 },
        { header: 'Contacto / Teléfono', key: 'telefono', width: 130, getValue: (c) => c.telefono || c.telefonoPersonal || '—' },
        { header: 'Email', key: 'email', width: 180, getValue: (c) => c.email || c.emailPersonal || '—' },
        { header: 'Plan Contratado', key: 'planContratado', width: 140, getValue: (c) => c.planContratado || 'Plan Estándar' },
        { header: 'Suscripción', key: 'tipoSuscripcion', width: 100, align: 'center', getValue: (c) => c.tipoSuscripcion || 'MENSUAL' },
        { header: 'Asesor Comercial', key: 'vendedor', width: 140, getValue: (c) => c.vendedor || 'Por asignar' },
        { header: 'Estado', key: 'estadoCuenta', width: 110, align: 'center', getValue: (c) => c.estadoCuenta || 'POR_COBRAR' },
        {
          header: 'Monto a Cobrar (S/)',
          key: 'monto',
          type: 'number',
          width: 130,
          getValue: (c) => Number(c.montoSiguienteCobro ?? c.montoMensual ?? c.precioPlan ?? 0),
        },
        {
          header: 'Fecha Registro',
          key: 'fechaRegistro',
          width: 110,
          align: 'center',
          getValue: (c) => c.fechaRegistro ? new Date(c.fechaRegistro).toLocaleDateString('es-PE') : '—',
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
    <div className="w-100 admin-module admin-module--receivables">
      <section className="admin-data-panel" aria-label="Clientes por cobrar">
      {/* Encabezado con Icono Moderno y Badge */}
      <div className="admin-module-heading d-flex justify-content-between align-items-center flex-wrap gap-3">
        <div className="d-flex align-items-center gap-3">
          <div className="section-header-icon section-header-icon-warning">
            <CreditCard size={20} strokeWidth={2.2} />
          </div>
          <div>
            <h2 className="fw-bold text-dark mb-0 fs-5" style={{ letterSpacing: '-0.3px' }}>Clientes Por Cobrar</h2>
            <small className="text-muted fw-semibold">Clientes derivados del formulario web en espera de pago y confirmación</small>
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
            title="Exportar listado de clientes por cobrar a Excel"
          >
            <Download size={14} />
            <span>Exportar Reporte ({filteredClients.length})</span>
          </button>
          <span className="admin-badge-count-pill admin-badge-count-pill--warning">
            {hasActiveFilters ? `${filteredClients.length} de ${clientesPorCobrarList.length} Por Cobrar` : `${clientesPorCobrarList.length} Por Cobrar`}
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
                <th>Monto a Cobrar</th>
                <th>Estado Cuenta</th>
                <th className="text-center" style={{ width: '130px' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-muted py-5 fw-semibold">
                    {hasActiveFilters
                      ? 'No se encontraron clientes por cobrar con los filtros aplicados.'
                      : 'No hay registros pendientes por cobrar en este momento.'}
                  </td>
                </tr>
              ) : (
                visibleClients.map((c, idx) => {
                  const phone = c.telefono || c.telefonoPersonal;
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
                              backgroundColor: '#FEF3C7',
                              color: '#D97706',
                              fontSize: '0.78rem',
                              border: '1px solid #FDE68A',
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
                        <span className="cell-amount text-primary">
                          S/ {Number(c.montoSiguienteCobro ?? c.montoMensual).toFixed(2)}
                        </span>
                      </td>
                      <td>
                        <span className="badge-fb badge-fb-warning">
                          <span className="badge-dot badge-dot-warning" />
                          POR COBRAR
                        </span>
                      </td>
                      <td className="text-center">
                        <TableActionDropdown
                          isOpen={isActionOpen}
                          onToggle={() => setOpenActionId(isActionOpen ? null : c.id)}
                          onClose={() => setOpenActionId(null)}
                          buttonTitle="Opciones de cobro y plan"
                          menuWidth={210}
                        >
                          <button
                            type="button"
                            className="table-action-item item-success"
                            onClick={() => {
                              setOpenActionId(null);
                              handleRegisterPayment(c);
                            }}
                          >
                            <CheckCircle size={15} />
                            <span>Confirmar Pago</span>
                          </button>
                          <button
                            type="button"
                            className="table-action-item item-danger"
                            onClick={() => {
                              setOpenActionId(null);
                              const confirmCancel = window.confirm(
                                `¿Confirmas la cancelación del plan para ${c.razonSocial}? Pasará a la sección de Bloqueados.`
                              );
                              if (confirmCancel) {
                                handleEstadoCuentaChange(c, 'BLOQUEADO');
                              }
                            }}
                          >
                            <X size={15} />
                            <span>Cancelar Plan</span>
                          </button>
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
        totalItems={clientesPorCobrarList.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
      />
      </section>
    </div>
  );
}
