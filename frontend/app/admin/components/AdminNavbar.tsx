'use client';

import React from 'react';
import Image from 'next/image';
import { Bell, User, UserPlus, Users, Activity, LogOut, CheckCircle } from 'lucide-react';

interface AdminNavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  clientesPorCobrarList: any[];
  clientesVencidosList: any[];
  clientesBloqueadosList: any[];
  clientesPorVencer1DiaList: any[];
  notifications?: any[];
  currentUser: any;
  showNotificationsDropdown: boolean;
  setShowNotificationsDropdown: (b: boolean) => void;
  showProfileDropdown: boolean;
  setShowProfileDropdown: (b: boolean) => void;
  setShowNewUserModal: (b: boolean) => void;
  handleLogout: () => void;
  setCalendarSearch: (s: string) => void;
  handleMarkNotificationAsRead?: (id: string | number) => void;
}

export default function AdminNavbar({
  activeTab,
  setActiveTab,
  clientesPorCobrarList,
  clientesVencidosList,
  clientesBloqueadosList,
  clientesPorVencer1DiaList,
  notifications = [],
  currentUser,
  showNotificationsDropdown,
  setShowNotificationsDropdown,
  showProfileDropdown,
  setShowProfileDropdown,
  setShowNewUserModal,
  handleLogout,
  setCalendarSearch,
  handleMarkNotificationAsRead,
}: AdminNavbarProps) {
  const activeNotifications = React.useMemo(() => {
    const seen = new Set<string>();
    return notifications.filter((n) => {
      if (!n || n.leida) return false;
      const key = `${n.clienteId || n.clienteRuc || n.clienteRazonSocial || n.id}-${n.tipo}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [notifications]);

  const uniqueNearDueClients = React.useMemo(() => {
    const seen = new Set<string>();
    return clientesPorVencer1DiaList.filter((c) => {
      if (!c) return false;
      const key = String(c.id || c.ruc || c.razonSocial);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [clientesPorVencer1DiaList]);

  const alertCount = activeNotifications.length || uniqueNearDueClients.length;

  const navItems = [
    { key: 'resumen', label: 'Resumen' },
    { key: 'todos', label: 'Todos los Clientes' },
    { key: 'cobrar', label: 'Por Cobrar', count: clientesPorCobrarList.length, badge: 'bg-warning text-dark' },
    { key: 'vencidos', label: 'Vencidos', count: clientesVencidosList.length, badge: 'bg-danger' },
    { key: 'bloqueados', label: 'Bloqueados', count: clientesBloqueadosList.length, badge: 'bg-secondary' },
    { key: 'capacitaciones', label: 'Capacitaciones' },
    { key: 'calendario', label: 'Centro de Control' },
    { key: 'reporte', label: 'Reporte General' },
  ];

  return (
    <nav className="navbar navbar-expand-lg sticky-top custom-navbar bg-black shadow-sm">
      <div className="container-fluid px-3 px-md-4">
        <div className="d-flex align-items-center gap-3">
          <Image src="/logo.jpeg" alt="Miquipu Logo" width={40} height={40} className="rounded-3 shadow-sm" />
          <span className="navbar-brand text-white fw-bold mb-0 me-0" style={{ letterSpacing: '-0.3px', fontSize: '1.15rem' }}>
            Miquipu Admin
          </span>
        </div>

        <button
          className="navbar-toggler border-0 text-white p-2"
          type="button"
          data-bs-toggle="offcanvas"
          data-bs-target="#adminNavbarOffcanvas"
          aria-controls="adminNavbarOffcanvas"
          aria-label="Abrir menu de navegacion"
        >
          <span className="navbar-toggler-icon" style={{ filter: 'invert(1)' }}></span>
        </button>

        <div className="offcanvas offcanvas-start bg-dark text-white" tabIndex={-1} id="adminNavbarOffcanvas">
          <div className="offcanvas-header border-bottom border-secondary">
            <div className="d-flex align-items-center gap-2">
              <Image src="/logo.jpeg" alt="Miquipu Logo" width={32} height={32} className="rounded-3" />
              <h5 className="offcanvas-title text-white fw-bold">Menu Miquipu</h5>
            </div>
            <button type="button" className="btn-close btn-close-white" data-bs-dismiss="offcanvas" aria-label="Cerrar"></button>
          </div>

          <div className="offcanvas-body align-items-center justify-content-between">
            <ul className="navbar-nav gap-1 me-auto mb-2 mb-lg-0" style={{ fontSize: '0.88rem' }}>
              {navItems.map((item) => (
                <li className="nav-item" key={item.key}>
                  <button
                    className={`nav-link btn border-0 text-start py-1 px-2 rounded-2 d-flex align-items-center gap-1 ${
                      activeTab === item.key ? 'active bg-primary text-white fw-bold' : 'text-white-50'
                    }`}
                    onClick={() => setActiveTab(item.key)}
                    data-bs-dismiss="offcanvas"
                  >
                    <span>{item.label}</span>
                    {!!item.count && <span className={`badge rounded-pill ${item.badge || 'bg-primary'}`}>{item.count}</span>}
                  </button>
                </li>
              ))}

              {currentUser?.rol === 'ADMIN' && (
                <li className="nav-item">
                  <button
                    className={`nav-link btn border-0 text-start py-1 px-2 rounded-2 ${
                      activeTab === 'usuarios' ? 'active bg-primary text-white fw-bold' : 'text-white-50'
                    }`}
                    onClick={() => setActiveTab('usuarios')}
                    data-bs-dismiss="offcanvas"
                  >
                    Vendedores / Usuarios
                  </button>
                </li>
              )}
            </ul>

            <div className="d-flex align-items-center gap-2 mt-3 mt-lg-0 ms-lg-2 position-relative">
              <div className="position-relative w-100 w-lg-auto">
                <button
                  onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
                  className="btn btn-warning btn-sm w-100 w-lg-auto position-relative d-flex align-items-center justify-content-center gap-1 py-1 px-3 fw-semibold"
                  title="Alertas de Vencimiento"
                >
                  <Bell size={15} />
                  <span>Alertas</span>
                  {alertCount > 0 && (
                    <span className="badge rounded-pill bg-danger ms-1">{alertCount}</span>
                  )}
                </button>

                {showNotificationsDropdown && (
                  <>
                    <div
                      className="d-block d-lg-none position-fixed top-0 start-0 w-100 h-100 bg-dark opacity-50"
                      style={{ zIndex: 100040 }}
                      onClick={() => setShowNotificationsDropdown(false)}
                    ></div>

                    <div
                      className="notification-dropdown-responsive bg-white text-dark rounded-3 shadow-lg p-3 border"
                      style={{ maxHeight: '80vh', overflowY: 'auto' }}
                    >
                      <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-3">
                        <strong className="text-dark fs-6 d-flex align-items-center gap-2">
                          <Bell size={18} className="text-warning" />
                          <span>Recordatorios de Vencimiento</span>
                        </strong>
                        <button type="button" className="btn-close btn-sm" onClick={() => setShowNotificationsDropdown(false)}></button>
                      </div>

                      {alertCount === 0 ? (
                        <div className="text-center text-muted py-4">
                          <CheckCircle size={24} className="text-success mb-2 d-block mx-auto" />
                          <p className="small mb-0">No hay alertas de recordatorio activas.</p>
                        </div>
                      ) : (
                        <div className="d-flex flex-column gap-2">
                          {activeNotifications.length > 0 && activeNotifications.map((n) => (
                            <div
                              key={`notif-${n.id}`}
                              className="p-3 border rounded bg-light text-start shadow-sm"
                              style={{ cursor: n.clienteId ? 'pointer' : 'default' }}
                              onClick={() => {
                                if (n.id && handleMarkNotificationAsRead) {
                                  handleMarkNotificationAsRead(n.id);
                                }
                                if (n.clienteRazonSocial) {
                                  setCalendarSearch(n.clienteRazonSocial);
                                  setActiveTab('calendario');
                                  setShowNotificationsDropdown(false);
                                }
                              }}
                            >
                              <div className="d-flex justify-content-between align-items-center mb-1">
                                <strong className="text-dark text-truncate me-2" style={{ maxWidth: '200px' }}>
                                  {n.clienteRazonSocial || n.titulo}
                                </strong>
                                <span className="badge bg-warning text-dark flex-shrink-0" style={{ fontSize: '0.65rem' }}>
                                  {n.tipo}
                                </span>
                              </div>
                              <div className="small text-muted">{n.mensaje}</div>
                            </div>
                          ))}
                          {activeNotifications.length === 0 && uniqueNearDueClients.map((c) => (
                            <div
                              key={`alert-near-${c.id}`}
                              className="p-3 border rounded bg-light text-start shadow-sm"
                              style={{ cursor: 'pointer' }}
                              onClick={() => {
                                setCalendarSearch(c.ruc);
                                setActiveTab('calendario');
                                setShowNotificationsDropdown(false);
                              }}
                            >
                              <div className="d-flex justify-content-between align-items-center mb-1">
                                <strong className="text-dark text-truncate me-2" style={{ maxWidth: '200px' }}>
                                  {c.razonSocial}
                                </strong>
                                <span className="badge bg-warning text-dark flex-shrink-0" style={{ fontSize: '0.65rem' }}>
                                  POR VENCER
                                </span>
                              </div>
                              <div className="d-flex justify-content-between align-items-center small text-muted">
                                <span>RUC: {c.ruc} | {c.planContratado}</span>
                                <span className="fw-bold text-primary">S/ {Number(c.montoMensual || 0).toFixed(2)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              <div className="position-relative">
                <button
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="btn btn-outline-light btn-sm d-flex align-items-center gap-2 px-2 py-1 rounded-3 border-secondary shadow-sm"
                  title="Perfil de Usuario"
                >
                  <span className="p-1 bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '24px', height: '24px' }}>
                    <User size={13} />
                  </span>
                  <span className="fw-semibold text-truncate d-none d-sm-inline" style={{ maxWidth: '120px' }}>
                    {currentUser?.nombre || currentUser?.username || 'Mi Perfil'}
                  </span>
                  <span className="small opacity-75 ms-1">v</span>
                </button>

                {showProfileDropdown && (
                  <div className="position-absolute end-0 mt-2 bg-white text-dark rounded-3 shadow-lg p-2 border" style={{ zIndex: 99999, width: '240px' }}>
                    <div className="px-3 py-2 border-bottom mb-2 bg-light rounded-2 text-start">
                      <strong className="d-block text-dark text-truncate" style={{ fontSize: '0.85rem' }}>
                        {currentUser?.nombre || currentUser?.username || 'Usuario'}
                      </strong>
                      <span className="badge bg-primary text-white mt-1" style={{ fontSize: '0.65rem' }}>
                        {currentUser?.rol || 'ADMIN'}
                      </span>
                      {currentUser?.email && (
                        <small className="d-block text-muted text-truncate mt-1" style={{ fontSize: '0.75rem' }}>
                          {currentUser.email}
                        </small>
                      )}
                    </div>

                    {currentUser?.rol === 'ADMIN' && (
                      <>
                        <button
                          className="btn btn-primary w-100 text-start d-flex align-items-center gap-2 small py-2 px-3 rounded-2 text-white mb-1 border-0 fw-semibold shadow-sm"
                          onClick={() => {
                            setShowNewUserModal(true);
                            setShowProfileDropdown(false);
                          }}
                        >
                          <UserPlus size={15} />
                          <span>Registrar Nuevo Vendedor</span>
                        </button>
                        <button
                          className="btn btn-light w-100 text-start d-flex align-items-center gap-2 small py-2 px-3 rounded-2 text-dark mb-1 border-0"
                          onClick={() => {
                            setActiveTab('usuarios');
                            setShowProfileDropdown(false);
                          }}
                        >
                          <Users size={15} className="text-primary" />
                          <span>Gestion de Vendedores</span>
                        </button>
                      </>
                    )}

                    <button
                      className="btn btn-light w-100 text-start d-flex align-items-center gap-2 small py-2 px-3 rounded-2 text-dark mb-1 border-0"
                      onClick={() => {
                        setActiveTab('reporte');
                        setShowProfileDropdown(false);
                      }}
                    >
                      <Activity size={15} className="text-info" />
                      <span>Reporte General</span>
                    </button>

                    <div className="border-top my-1"></div>

                    <button
                      onClick={() => {
                        setShowProfileDropdown(false);
                        handleLogout();
                      }}
                      className="btn btn-outline-danger w-100 text-start d-flex align-items-center gap-2 small py-2 px-3 rounded-2 fw-semibold mt-1"
                    >
                      <LogOut size={15} />
                      <span>Cerrar Sesion</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
