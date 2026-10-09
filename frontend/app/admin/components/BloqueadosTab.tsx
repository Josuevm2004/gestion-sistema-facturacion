'use client';

import React from 'react';
import { ShieldCheck, CheckCircle, Trash2, Search, RotateCcw, Download } from 'lucide-react';
import { Client } from './ClientesTodosTab';
import PaginationControls from './PaginationControls';
import { TableActionDropdown } from './TableActionDropdown';
import { exportTableToExcel } from '../utils/exportTableReport';

interface BloqueadosTabProps {
  clientesBloqueadosList: Client[];
  handleEstadoCuentaChange: (client: Client, nuevoEstado: string) => void;
  handleDevolverAcceso: (client: Client) => any;
  setDeletingClient: (client: Client) => void;
}

export default function BloqueadosTab({
  clientesBloqueadosList,
  handleEstadoCuentaChange: _handleEstadoCuentaChange,
  handleDevolverAcceso,
  setDeletingClient,
}: BloqueadosTabProps) {
  const [search, setSearch] = React.useState('');
  const [suscripcionFilter, setSuscripcionFilter] = React.useState('');
  const [vendedorFilter, setVendedorFilter] = React.useState('');
  const [planFilter, setPlanFilter] = React.useState('');
  const [openActionId, setOpenActionId] = React.useState<string | number | null>(null);
  const pageSize = 10;
  const [currentPage, setCurrentPage] = React.useState(1);

  const availableVendedores = React.useMemo(() => {
    const s = new Set<string>();
    clientesBloqueadosList.forEach((c) => {
      if (c.vendedor) s.add(c.vendedor.trim());
    });
    return Array.from(s).sort();
  }, [clientesBloqueadosList]);

  const availablePlanes = React.useMemo(() => {
    const s = new Set<string>();
    clientesBloqueadosList.forEach((c) => {
      if (c.planContratado) s.add(c.planContratado.trim());
    });
    return Array.from(s).sort();
  }, [clientesBloqueadosList]);

  const filteredClients = React.useMemo(() => {
    return clientesBloqueadosList.filter((c) => {
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
  }, [clientesBloqueadosList, search, suscripcionFilter, vendedorFilter, planFilter]);

  const hasActiveFilters = Boolean(search.trim() || suscripcionFilter || vendedorFilter || planFilter);

  const resetFilters = () => {
    setSearch('');
    setSuscripcionFilter('');
    setVendedorFilter('');
    setPlanFilter('');
  };

  const handleExportReport = () => {
    exportTableToExcel({
      filename: `Reporte_Clientes_Bloqueados_${new Date().toISOString().slice(0, 10)}`,
      sheetName: 'Bloqueados',
      reportTitle: 'Reporte de Clientes Bloqueados / Suspendidos',
      reportSubtitle: 'Cartera de clientes con acceso restringido y deuda pendiente',
      columns: [
        { header: '#', key: 'idx', width: 40, align: 'center', getValue: (_, idx) => idx + 1 },
        { header: 'RUC', key: 'ruc', width: 110, align: 'center' },
        { header: 'Razón Social / Empresa', key: 'razonSocial', width: 230 },
        { header: 'Teléfono Contacto', key: 'telefono', width: 130, getValue: (c) => c.telefono || c.telefonoPersonal || '—' },
        { header: 'Email', key: 'email', width: 180, getValue: (c) => c.email || c.emailPersonal || '—' },
        { header: 'Plan Contratado', key: 'planContratado', width: 140, getValue: (c) => c.planContratado || 'Plan Estándar' },
        { header: 'Suscripción', key: 'tipoSuscripcion', width: 100, align: 'center', getValue: (c) => c.tipoSuscripcion || 'MENSUAL' },
        { header: 'Asesor Comercial', key: 'vendedor', width: 140, getValue: (c) => c.vendedor || 'Por asignar' },
        { header: 'Estado', key: 'estadoCuenta', width: 100, align: 'center', getValue: () => 'BLOQUEADO' },
        {
          header: 'Monto Deuda (S/)',
          key: 'deuda',
          type: 'number',
          width: 120,
          getValue: (c) => Number(c.montoSiguienteCobro && Number(c.montoSiguienteCobro) > 0 ? c.montoSiguienteCobro : (c.montoMensual || c.precioPlan || 0)),
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
    <div className="w-100 admin-module admin-module--blocked">
      <section className="admin-data-panel" aria-label="Clientes bloqueados">
      {/* Encabezado con Icono Moderno y Badge */}
      <div className="admin-module-heading d-flex justify-content-between align-items-center flex-wrap gap-3">
        <div className="d-flex align-items-center gap-3">
          <div className="section-header-icon section-header-icon-dark">
            <ShieldCheck size={20} strokeWidth={2.2} />
          </div>
          <div>
            <h2 className="fw-bold text-dark mb-0 fs-5" style={{ letterSpacing: '-0.3px' }}>Clientes Bloqueados / Suspendidos</h2>
            <small className="text-muted fw-semibold">Clientes desafiliados o con acceso restringido que pueden rehabilitarse</small>
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
            title="Exportar listado de bloqueados a Excel"
          >
            <Download size={14} />
            <span>Exportar Reporte ({filteredClients.length})</span>
          </button>
          <span className="admin-badge-count-pill admin-badge-count-pill--neutral">
            {hasActiveFilters ? `${filteredClients.length} de ${clientesBloqueadosList.length} Bloqueados` : `${clientesBloqueadosList.length} Bloqueados`}
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
                <th>Email</th>
                <th>Plan</th>
                <th>Estado</th>
                <th>Monto Deuda</th>
                <th className="text-center" style={{ width: '130px' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center text-muted py-5 fw-semibold">
                    {hasActiveFilters
                      ? 'No se encontraron clientes bloqueados con los filtros aplicados.'
                      : 'No hay clientes en estado bloqueado.'}
                  </td>
                </tr>
              ) : (
                visibleClients.map((c, idx) => {
                  const phone = c.telefono || c.telefonoPersonal;
                  const initial = (c.razonSocial || 'C').charAt(0).toUpperCase();
                  const isActionOpen = openActionId === c.id;
                  const deuda = Number(
                    c.montoSiguienteCobro && Number(c.montoSiguienteCobro) > 0
                      ? c.montoSiguienteCobro
                      : (c.montoMensual || c.precioPlan || 0)
                  );

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
                              backgroundColor: '#F2F4F7',
                              color: '#4B5563',
                              fontSize: '0.78rem',
                              border: '1px solid #E2E8F0',
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
                        <span className="cell-title">{c.email || '—'}</span>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-1.5 flex-wrap">
                          <span className="badge-tag badge-plan-tag">
                            {c.planContratado || 'Plan'}
                          </span>
                          <span
                            className={`badge-tag ${c.tipoSuscripcion === 'ANUAL' ? 'badge-sub-anual' : 'badge-sub-mensual'}`}
                          >
                            {c.tipoSuscripcion || 'MENSUAL'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="badge-fb badge-fb-secondary">
                          <span className="badge-dot badge-dot-neutral" />
                          BLOQUEADO
                        </span>
                      </td>
                      <td>
                        <span className="cell-amount text-danger fw-bold">
                          S/ {deuda.toFixed(2)}
                        </span>
                      </td>
                      <td className="text-center">
                        <TableActionDropdown
                          isOpen={isActionOpen}
                          onToggle={() => setOpenActionId(isActionOpen ? null : c.id)}
                          onClose={() => setOpenActionId(null)}
                          buttonVariant="secondary"
                          buttonTitle="Opciones de desbloqueo o eliminación"
                          menuWidth={210}
                        >
                          <button
                            type="button"
                            className="table-action-item item-success"
                            onClick={() => {
                              setOpenActionId(null);
                              const ok = window.confirm(
                                `¿Habilitar acceso para ${c.razonSocial}? Pasará a VENCIDO para gestionar renovación o cambio de plan.`
                              );
                              if (ok) handleDevolverAcceso(c);
                            }}
                          >
                            <CheckCircle size={15} />
                            <span>Habilitar Accesos</span>
                          </button>
                          <button
                            type="button"
                            className="table-action-item item-danger"
                            onClick={() => {
                              setOpenActionId(null);
                              setDeletingClient(c);
                            }}
                          >
                            <Trash2 size={15} />
                            <span>Eliminar Registro</span>
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
        totalItems={filteredClients.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
      />
      </section>
    </div>
  );
}
