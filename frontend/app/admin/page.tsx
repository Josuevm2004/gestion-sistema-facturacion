'use client';

import React from 'react';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, ChevronRight, LogIn } from 'lucide-react';
import { useAdminData } from './hooks/useAdminData';

import AdminNavbar from './components/AdminNavbar';
import ResumenTab from './components/ResumenTab';
import ClientesTodosTab from './components/ClientesTodosTab';
import PorCobrarTab from './components/PorCobrarTab';
import VencidosTab from './components/VencidosTab';
import BloqueadosTab from './components/BloqueadosTab';
import CapacitacionesTab from './components/CapacitacionesTab';
import VendedoresTab from './components/VendedoresTab';
import ReportesExcelTab from './components/ReportesExcelTab';
import ComisionesTab from './components/ComisionesTab';

import EditClientModal from './modals/EditClientModal';
import DeleteClientModal from './modals/DeleteClientModal';
import ChangePlanModal from './modals/ChangePlanModal';
import UpgradePlanModal from './modals/UpgradePlanModal';
import TrainingModal from './modals/TrainingModal';
import PaymentHistoryModal from './modals/PaymentHistoryModal';
import UserModal from './modals/UserModal';
import CreateClientModal from './modals/CreateClientModal';
import './admin-theme.css';
import './admin-shell.css';
import './modules-theme.css';
import './modal-theme.css';

const ADMIN_PAGE_TITLES: Record<string, string> = {
  resumen: 'Resumen',
  todos: 'Todos los clientes',
  cobrar: 'Por cobrar',
  vencidos: 'Vencidos',
  bloqueados: 'Bloqueados',
  capacitaciones: 'Capacitaciones',
  reporte: 'Reporte general',
  comisiones: 'Mis comisiones',
  usuarios: 'Vendedores y usuarios',
};

const ADMIN_PAGE_DESCRIPTIONS: Record<string, string> = {
  resumen: 'Vista general de ingresos, clientes y tareas pendientes.',
  todos: 'Consulta y administra los clientes registrados.',
  cobrar: 'Revisa y gestiona los cobros pendientes.',
  vencidos: 'Da seguimiento a los planes y pagos vencidos.',
  bloqueados: 'Consulta las cuentas con acceso suspendido.',
  capacitaciones: 'Organiza las capacitaciones de tus clientes.',
  reporte: 'Explora los indicadores y exporta la información.',
  comisiones: 'Monitorea las comisiones por afiliación y ventas de los asesores.',
  usuarios: 'Administra el equipo y sus asignaciones.',
};

export default function AdminPage() {
  const adminData = useAdminData();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);
  const [headerSearch, setHeaderSearch] = React.useState('');
  const headerSearchRef = React.useRef<HTMLInputElement>(null);
  const activePageTitle = ADMIN_PAGE_TITLES[adminData.activeTab] || 'Administración';

  React.useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        headerSearchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', focusSearch);
    return () => window.removeEventListener('keydown', focusSearch);
  }, []);

  const handleHeaderSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    adminData.setCalendarSearch(headerSearch.trim());
    adminData.setActiveTab('todos');
  };

  return (
    <div className={`admin-shell min-h-screen ${adminData.token ? 'admin-shell--authenticated' : ''} ${adminData.token && isSidebarCollapsed ? 'admin-shell--sidebar-collapsed' : ''}`}>
      {adminData.token && (
        <AdminNavbar
          activeTab={adminData.activeTab}
          setActiveTab={adminData.setActiveTab}
          isSidebarCollapsed={isSidebarCollapsed}
          toggleSidebar={() => setIsSidebarCollapsed((collapsed) => !collapsed)}
          headerSearch={headerSearch}
          setHeaderSearch={setHeaderSearch}
          headerSearchRef={headerSearchRef}
          handleHeaderSearch={handleHeaderSearch}
          clientesPorCobrarList={adminData.clientesPorCobrarList}
          clientesVencidosList={adminData.clientesVencidosList}
          clientesBloqueadosList={adminData.clientesBloqueadosList}
          clientesPorVencer1DiaList={adminData.clientesPorVencer1DiaList}
          notifications={adminData.notifications}
          currentUser={adminData.currentUser}
          showNotificationsDropdown={adminData.showNotificationsDropdown}
          setShowNotificationsDropdown={adminData.setShowNotificationsDropdown}
          showProfileDropdown={adminData.showProfileDropdown}
          setShowProfileDropdown={adminData.setShowProfileDropdown}
          setShowNewUserModal={adminData.setShowNewUserModal}
          handleLogout={adminData.handleLogout}
          setCalendarSearch={adminData.setCalendarSearch}
          handleMarkNotificationAsRead={adminData.handleMarkNotificationAsRead}
          handleMarkAllNotificationsAsRead={adminData.handleMarkAllNotificationsAsRead}
        />
      )}

      <main className={`admin-main ${!adminData.token ? 'admin-main--login' : ''}`}>
        {adminData.notice && (
          <div className="alert admin-notice alert-info alert-dismissible fade show shadow-sm rounded-4 mb-4 border-0" role="alert">
            <span>{adminData.notice}</span>
            <button type="button" className="btn-close" onClick={() => adminData.setNotice(null)}></button>
          </div>
        )}

        {!adminData.token ? (
          <div className="admin-login-shell">
            <section className="admin-login-form-side">
              <div className="admin-login-card-wrap">
                <a href="/" className="admin-login-back"><ArrowLeft size={16} /> Volver al inicio</a>
                <div className="card admin-login-card rounded-4 border bg-white shadow-sm p-4 p-md-5">
                  <div className="admin-login-intro text-center mb-4">
                    <span className="admin-login-kicker">PANEL DE MIQUIPU</span>
                    <h1 className="h5 fw-bold text-dark mb-1">Iniciar sesión</h1>
                    <p className="text-muted small">Ingresa tus credenciales para acceder al panel.</p>
                  </div>

                  <form onSubmit={adminData.handleLogin} className="needs-validation">
                    <div className="mb-3">
                      <label className="form-label text-secondary fw-semibold small" htmlFor="admin-username">Usuario <span className="admin-required">*</span></label>
                      <input id="admin-username" className="form-control px-3" name="username" placeholder="Ingresa tu usuario" autoComplete="username" required />
                    </div>
                    <div className="mb-4">
                      <label className="form-label text-secondary fw-semibold small" htmlFor="admin-password">Contraseña <span className="admin-required">*</span></label>
                      <input id="admin-password" className="form-control px-3" name="password" type="password" placeholder="Ingresa tu contraseña" autoComplete="current-password" required />
                    </div>
                    <button type="submit" className="btn btn-primary w-100 py-2.5 fw-bold d-flex align-items-center justify-content-center gap-2">
                      <LogIn size={16} />
                      <span>Ingresar al panel</span>
                      <ArrowRight size={16} />
                    </button>
                  </form>
                  <p className="admin-login-footnote">Acceso exclusivo para el equipo de Miquipu.</p>
                </div>
              </div>
            </section>
            <aside className="admin-login-brand-side">
              <div className="admin-login-brand-content">
                <div className="admin-login-brand-mark"><Image src="/logo.jpeg" alt="" width={54} height={54} className="admin-login-brand-logo" /></div>
                <div className="admin-login-brand-name">Miquipu</div>
                <p>Tu espacio para gestionar clientes, cobros y facturación electrónica.</p>
              </div>
            </aside>
          </div>
        ) : (
          <div className="admin-content">
            <div className="admin-page-heading">
              <div>
                <span className="admin-page-eyebrow">Panel de control</span>
                <h1>{activePageTitle}</h1>
                <p>{ADMIN_PAGE_DESCRIPTIONS[adminData.activeTab]}</p>
              </div>
              <nav className="admin-breadcrumb" aria-label="Ubicación">
                <span>Inicio</span>
                <ChevronRight size={14} aria-hidden="true" />
                <strong>{activePageTitle}</strong>
              </nav>
            </div>
            {adminData.activeTab === 'resumen' && (
              <ResumenTab
                totalCobradoDia={adminData.totalCobradoDia}
                clientesActivos={adminData.clientesActivos}
                clientesPorCobrarList={adminData.clientesPorCobrarList}
                clientesVencidosList={adminData.clientesVencidosList}
                clientesPorVencer1DiaList={adminData.clientesPorVencer1DiaList}
                clients={adminData.clients}
                token={adminData.token}
                isSyncing={adminData.isSyncing}
                loadData={adminData.loadData}
                setActiveTab={adminData.setActiveTab}
                setCalendarSearch={adminData.setCalendarSearch}
              />
            )}

            {adminData.activeTab === 'todos' && (
              <ClientesTodosTab
                clients={adminData.clients}
                allFilteredClients={adminData.allFilteredClients}
                search={adminData.search}
                setSearch={adminData.setSearch}
                regimenFilter={adminData.regimenFilter}
                setRegimenFilter={adminData.setRegimenFilter}
                planFilter={adminData.planFilter}
                setPlanFilter={adminData.setPlanFilter}
                estadoCuentaFilter={adminData.estadoCuentaFilter}
                setEstadoCuentaFilter={adminData.setEstadoCuentaFilter}
                capacitacionFilter={adminData.capacitacionFilter}
                setCapacitacionFilter={adminData.setCapacitacionFilter}
                suscripcionFilter={adminData.suscripcionFilter}
                setSuscripcionFilter={adminData.setSuscripcionFilter}
                sellerFilter={adminData.sellerFilter}
                setSellerFilter={adminData.setSellerFilter}
                uniqueSellers={adminData.uniqueSellers}
                handleAssignVendedor={adminData.handleAssignVendedor}
                handleSelfAssignVendedor={adminData.handleSelfAssignVendedor}
                usersList={adminData.usersList}
                currentUser={adminData.currentUser}
                setEditingClient={adminData.setEditingClient}
                setMejoraPlanClient={adminData.setMejoraPlanClient}
                setMejoraPlanSeleccionado={adminData.setMejoraPlanSeleccionado}
                setDeletingClient={adminData.setDeletingClient}
                onOpenCreateClient={() => adminData.setShowCreateClientModal(true)}
                handleToggleAvisado={adminData.handleToggleAvisado}
                handleAdelantoPago={adminData.handleAdelantoPago}
                setHistoryClient={adminData.setHistoryClient}
              />
            )}

            {adminData.activeTab === 'cobrar' && (
              <PorCobrarTab
                clientesPorCobrarList={adminData.clientesPorCobrarList}
                handleRegisterPayment={adminData.handleRegisterPayment}
                handleEstadoCuentaChange={adminData.handleEstadoCuentaChange}
              />
            )}

            {adminData.activeTab === 'vencidos' && (
              <VencidosTab
                clientesVencidosList={adminData.clientesVencidosList}
                handleRenovarPlan={adminData.handleRenovarPlan}
                handleAdelantoPago={adminData.handleAdelantoPago}
                setCambioPlanClient={adminData.setCambioPlanClient}
                setCambioPlanSeleccionado={adminData.setCambioPlanSeleccionado}
                setCambioPlanTipo={adminData.setCambioPlanTipo}
                handleEstadoCuentaChange={adminData.handleEstadoCuentaChange}
                handleDevolverAcceso={adminData.handleDevolverAcceso}
              />
            )}

            {adminData.activeTab === 'bloqueados' && (
              <BloqueadosTab
                clientesBloqueadosList={adminData.clientesBloqueadosList}
                handleEstadoCuentaChange={adminData.handleEstadoCuentaChange}
                handleDevolverAcceso={adminData.handleDevolverAcceso}
                setDeletingClient={adminData.setDeletingClient}
              />
            )}

            {adminData.activeTab === 'capacitaciones' && (
              <CapacitacionesTab
                clientesCapacitacionPendienteList={adminData.clientesCapacitacionPendienteList}
                clients={adminData.clients}
                setTrainingClient={adminData.setTrainingClient}
                setTrainingDateInput={adminData.setTrainingDateInput}
              />
            )}

            {adminData.activeTab === 'reporte' && (
              <ReportesExcelTab
                clients={adminData.clients}
                payments={adminData.payments}
                uniqueSellers={adminData.uniqueSellers}
                search={adminData.search}
                setSearch={adminData.setSearch}
                sellerFilter={adminData.sellerFilter}
                setSellerFilter={adminData.setSellerFilter}
                colorFilter={adminData.colorFilter}
                setColorFilter={adminData.setColorFilter}
                regimenFilter={adminData.regimenFilter}
                setRegimenFilter={adminData.setRegimenFilter}
                planFilter={adminData.planFilter}
                setPlanFilter={adminData.setPlanFilter}
                estadoCuentaFilter={adminData.estadoCuentaFilter}
                setEstadoCuentaFilter={adminData.setEstadoCuentaFilter}
                capacitacionFilter={adminData.capacitacionFilter}
                setCapacitacionFilter={adminData.setCapacitacionFilter}
                suscripcionFilter={adminData.suscripcionFilter}
                setSuscripcionFilter={adminData.setSuscripcionFilter}
                periodoIngresoTipo={adminData.periodoIngresoTipo}
                setPeriodoIngresoTipo={adminData.setPeriodoIngresoTipo}
                fechaCustomFilter={adminData.fechaCustomFilter}
                setFechaCustomFilter={adminData.setFechaCustomFilter}
                filterClientUnified={adminData.filterClientUnified}
                setEditingClient={adminData.setEditingClient}
                token={adminData.token}
                loadData={adminData.loadData}
                isSyncing={adminData.isSyncing}
                setHistoryClient={adminData.setHistoryClient}
              />
            )}

            {adminData.activeTab === 'comisiones' && (
              <ComisionesTab
                clients={adminData.clients}
                payments={adminData.payments}
                uniqueSellers={adminData.uniqueSellers}
                currentUser={adminData.currentUser}
                token={adminData.token}
              />
            )}

            {adminData.activeTab === 'usuarios' && adminData.currentUser?.rol === 'ADMIN' && (
              <VendedoresTab
                clients={adminData.clients}
                uniqueSellers={adminData.uniqueSellers}
                currentUser={adminData.currentUser}
                usersList={adminData.usersList}
                setShowNewUserModal={adminData.setShowNewUserModal}
                setEditingUser={adminData.setEditingUser}
                handleDeleteUser={adminData.handleDeleteUser}
              />
            )}
          </div>
        )}

        <EditClientModal
          editingClient={adminData.editingClient}
          setEditingClient={adminData.setEditingClient}
          handleSaveEditClient={adminData.handleSaveEditClient}
          currentUser={adminData.currentUser}
          usersList={adminData.usersList}
          uniqueSellers={adminData.uniqueSellers}
          entornos={adminData.entornos}
        />
        <DeleteClientModal
          deletingClient={adminData.deletingClient}
          setDeletingClient={adminData.setDeletingClient}
          handleDeleteClientConfirm={adminData.handleDeleteClientConfirm}
        />

        <ChangePlanModal
          cambioPlanClient={adminData.cambioPlanClient}
          setCambioPlanClient={adminData.setCambioPlanClient}
          cambioPlanSeleccionado={adminData.cambioPlanSeleccionado}
          setCambioPlanSeleccionado={adminData.setCambioPlanSeleccionado}
          cambioPlanTipo={adminData.cambioPlanTipo}
          setCambioPlanTipo={adminData.setCambioPlanTipo}
          handleRenovarPlan={adminData.handleRenovarPlan}
        />

        <UpgradePlanModal
          mejoraPlanClient={adminData.mejoraPlanClient}
          setMejoraPlanClient={adminData.setMejoraPlanClient}
          mejoraPlanSeleccionado={adminData.mejoraPlanSeleccionado}
          setMejoraPlanSeleccionado={adminData.setMejoraPlanSeleccionado}
          subscriptions={adminData.subscriptions}
          loadSubscriptions={adminData.loadSubscriptions}
          handleMejorarPlan={adminData.handleMejorarPlan}
        />

        <TrainingModal
          trainingClient={adminData.trainingClient}
          setTrainingClient={adminData.setTrainingClient}
          trainingDateInput={adminData.trainingDateInput}
          setTrainingDateInput={adminData.setTrainingDateInput}
          prorrateoCalculado={adminData.prorrateoCalculado}
          handleSaveTrainingSchedule={adminData.handleSaveTrainingSchedule}
        />

        <PaymentHistoryModal
          historyClient={adminData.historyClient}
          setHistoryClient={adminData.setHistoryClient}
          payments={adminData.payments}
          calcularProrrateoEntero={adminData.calcularProrrateoEntero}
        />

        <UserModal
          showNewUserModal={adminData.showNewUserModal}
          setShowNewUserModal={adminData.setShowNewUserModal}
          editingUser={adminData.editingUser}
          setEditingUser={adminData.setEditingUser}
          handleSaveUser={adminData.handleSaveUser}
        />

        <CreateClientModal
          show={adminData.showCreateClientModal}
          onClose={() => adminData.setShowCreateClientModal(false)}
          handleCreateClient={adminData.handleCreateClient}
          currentUser={adminData.currentUser}
          usersList={adminData.usersList}
          uniqueSellers={adminData.uniqueSellers}
          entornos={adminData.entornos}
        />
      </main>
    </div>
  );
}
