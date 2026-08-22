'use client';

import React from 'react';
import Image from 'next/image';
import { LogIn } from 'lucide-react';
import { useAdminData } from './hooks/useAdminData';

import AdminNavbar from './components/AdminNavbar';
import ResumenTab from './components/ResumenTab';
import ClientesTodosTab from './components/ClientesTodosTab';
import PorCobrarTab from './components/PorCobrarTab';
import VencidosTab from './components/VencidosTab';
import BloqueadosTab from './components/BloqueadosTab';
import CapacitacionesTab from './components/CapacitacionesTab';
import CentroControlTab from './components/CentroControlTab';
import VendedoresTab from './components/VendedoresTab';
import ReportesExcelTab from './components/ReportesExcelTab';

import EditClientModal from './modals/EditClientModal';
import DeleteClientModal from './modals/DeleteClientModal';
import ChangePlanModal from './modals/ChangePlanModal';
import UpgradePlanModal from './modals/UpgradePlanModal';
import TrainingModal from './modals/TrainingModal';
import PaymentHistoryModal from './modals/PaymentHistoryModal';
import UserModal from './modals/UserModal';

export default function AdminPage() {
  const adminData = useAdminData();

  return (
    <div className="admin-shell bg-white min-h-screen pb-5">
      {adminData.token && (
        <AdminNavbar
          activeTab={adminData.activeTab}
          setActiveTab={adminData.setActiveTab}
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
        />
      )}

      <main className="admin-main container-fluid px-3 px-md-4 my-4">
        {adminData.notice && (
          <div className="alert admin-notice alert-info alert-dismissible fade show shadow-sm rounded-3 mb-4" role="alert">
            <span>{adminData.notice}</span>
            <button type="button" className="btn-close" onClick={() => adminData.setNotice(null)}></button>
          </div>
        )}

        {!adminData.token ? (
          <div className="admin-login-shell row justify-content-center my-5">
            <div className="col-12 col-sm-10 col-md-7 col-lg-5 col-xl-4">
              <div className="custom-card admin-login-card p-4 p-md-5">
                <div className="text-center mb-4">
                  <Image src="/logo.jpeg" alt="Miquipu Logo" width={56} height={56} className="rounded-3 shadow-sm mb-2" />
                  <h1 className="h5 fw-bold text-dark mb-1">Acceso Administrativo</h1>
                  <p className="text-muted small">Ingresa tus credenciales de colaborador.</p>
                </div>

                <form onSubmit={adminData.handleLogin} className="needs-validation">
                  <div className="mb-3">
                    <label className="form-label">Usuario</label>
                    <input className="form-control" name="username" placeholder="Ingresa tu usuario" required />
                  </div>
                  <div className="mb-4">
                    <label className="form-label">Contraseña</label>
                    <input className="form-control" name="password" type="password" placeholder="Ingresa tu contraseña" required />
                  </div>
                  <button type="submit" className="btn btn-miquipu w-100 btn-lg d-flex align-items-center justify-content-center gap-2">
                    <LogIn size={16} />
                    <span>Entrar al Dashboard</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        ) : (
          <div>
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
                handleColorTagChange={adminData.handleColorTagChange}
                handleAssignVendedor={adminData.handleAssignVendedor}
                handleSelfAssignVendedor={adminData.handleSelfAssignVendedor}
                usersList={adminData.usersList}
                showSolKeys={adminData.showSolKeys}
                setShowSolKeys={adminData.setShowSolKeys}
                currentUser={adminData.currentUser}
                setEditingClient={adminData.setEditingClient}
                setMejoraPlanClient={adminData.setMejoraPlanClient}
                setMejoraPlanSeleccionado={adminData.setMejoraPlanSeleccionado}
                setDeletingClient={adminData.setDeletingClient}
                COLOR_MAP={{
                  VERDE: { hex: '#198754', label: '🟢 Verde', bgClass: 'bg-success bg-opacity-10 text-success border-success' },
                  ROJO: { hex: '#dc3545', label: '🔴 Rojo', bgClass: 'bg-danger bg-opacity-10 text-danger border-danger' },
                  AMARILLO: { hex: '#ffc107', label: '🟡 Amarillo', bgClass: 'bg-warning bg-opacity-10 text-warning border-warning' },
                  AZUL: { hex: '#0d6efd', label: '🔵 Azul', bgClass: 'bg-primary bg-opacity-10 text-primary border-primary' },
                }}
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

            {adminData.activeTab === 'calendario' && (
              <CentroControlTab
                clients={adminData.clients}
                calendarSearch={adminData.calendarSearch}
                setCalendarSearch={adminData.setCalendarSearch}
                calcularProrrateoEntero={adminData.calcularProrrateoEntero}
                setHistoryClient={adminData.setHistoryClient}
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
      </main>
    </div>
  );
}
