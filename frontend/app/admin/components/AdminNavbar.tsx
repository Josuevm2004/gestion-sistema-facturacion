'use client';

import React from 'react';
import Image from 'next/image';
import {
  Activity,
  AlertTriangle,
  Bell,
  CalendarDays,
  CheckCircle,
  FileSpreadsheet,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  User,
  UserPlus,
  Users,
  WalletCards,
  LockKeyhole,
  CheckCheck,
} from 'lucide-react';

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
  handleMarkAllNotificationsAsRead?: () => void;
}

const STORAGE_DISMISSED_KEY = 'miquipu_dismissed_alerts_v1';

function getTodayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function loadDismissedAlertsFromStorage(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_DISMISSED_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (parsed && parsed.date === getTodayString() && Array.isArray(parsed.ids)) {
      return new Set(parsed.ids.map(String));
    }
  } catch {
    // Ignore storage parse error
  }
  return new Set();
}

function saveDismissedAlertsToStorage(ids: Set<string>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(
      STORAGE_DISMISSED_KEY,
      JSON.stringify({
        date: getTodayString(),
        ids: Array.from(ids),
      })
    );
  } catch {
    // Ignore storage quota error
  }
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
  handleMarkAllNotificationsAsRead,
}: AdminNavbarProps) {
  const [dismissedNearDueAlerts, setDismissedNearDueAlerts] = React.useState<Set<string>>(() =>
    loadDismissedAlertsFromStorage()
  );

  const updateDismissedAlerts = React.useCallback((updater: (prev: Set<string>) => Set<string>) => {
    setDismissedNearDueAlerts((prev) => {
      const next = updater(prev);
      saveDismissedAlertsToStorage(next);
      return next;
    });
  }, []);

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

  const clientIdsInNotifications = React.useMemo(() => {
    const ids = new Set<string>();
    activeNotifications.forEach((n) => {
      if (n.clienteId) ids.add(String(n.clienteId));
      if (n.clienteRuc) ids.add(String(n.clienteRuc));
    });
    return ids;
  }, [activeNotifications]);

  const uniqueNearDueClients = React.useMemo(() => {
    const seen = new Set<string>();
    return clientesPorVencer1DiaList.filter((c) => {
      if (!c) return false;
      const key = String(c.id || c.ruc || c.razonSocial);
      if (dismissedNearDueAlerts.has(key)) return false;
      if (c.id && dismissedNearDueAlerts.has(String(c.id))) return false;
      if (c.ruc && dismissedNearDueAlerts.has(String(c.ruc))) return false;
      if (c.id && clientIdsInNotifications.has(String(c.id))) return false;
      if (c.ruc && clientIdsInNotifications.has(String(c.ruc))) return false;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [clientesPorVencer1DiaList, dismissedNearDueAlerts, clientIdsInNotifications]);

  const alertCount = activeNotifications.length + uniqueNearDueClients.length;

  const navItems = [
    { key: 'resumen', label: 'Resumen', icon: <LayoutDashboard size={15} /> },
    { key: 'todos', label: 'Todos los Clientes', icon: <Users size={15} /> },
    { key: 'cobrar', label: 'Por Cobrar', icon: <WalletCards size={15} />, count: clientesPorCobrarList.length, badge: 'bg-warning text-dark' },
    { key: 'vencidos', label: 'Vencidos', icon: <AlertTriangle size={15} />, count: clientesVencidosList.length, badge: 'bg-danger' },
    { key: 'bloqueados', label: 'Bloqueados', icon: <LockKeyhole size={15} />, count: clientesBloqueadosList.length, badge: 'bg-secondary' },
    { key: 'capacitaciones', label: 'Capacitaciones', icon: <GraduationCap size={15} /> },
    { key: 'calendario', label: 'Centro de Control', icon: <CalendarDays size={15} /> },
    { key: 'reporte', label: 'Reporte General', icon: <FileSpreadsheet size={15} /> },
  ];

  return (
    <nav className="navbar navbar-expand-lg sticky-top custom-navbar admin-navbar">
      <div className="container-fluid admin-navbar-inner px-3 px-md-4">
        <div className="admin-brand d-flex align-items-center gap-2 gap-sm-3">
          <Image src="/logo.jpeg" alt="Miquipu Logo" width={40} height={40} className="admin-brand-logo rounded-3 shadow-sm" />
          <span className="navbar-brand admin-brand-name text-white fw-bold mb-0 me-0">
            Miquipu Admin
          </span>
        </div>

        <button
          className="navbar-toggler admin-navbar-toggler border-0 text-white p-2"
          type="button"
          data-bs-toggle="offcanvas"
          data-bs-target="#adminNavbarOffcanvas"
          aria-controls="adminNavbarOffcanvas"
          aria-label="Abrir menu de navegacion"
        >
          <Menu size={22} aria-hidden="true" />
        </button>

        <div className="offcanvas offcanvas-start offcanvas-lg bg-dark text-white admin-offcanvas ms-lg-4" tabIndex={-1} id="adminNavbarOffcanvas">
          <div className="offcanvas-header border-bottom border-secondary admin-offcanvas-header">
            <div className="d-flex align-items-center gap-2">
              <Image src="/logo.jpeg" alt="Miquipu Logo" width={32} height={32} className="rounded-3" />
              <h5 className="offcanvas-title text-white fw-bold">Menu Miquipu</h5>
            </div>
            <button type="button" className="btn-close btn-close-white" data-bs-dismiss="offcanvas" aria-label="Cerrar"></button>
          </div>

          <div className="offcanvas-body admin-offcanvas-body align-items-center justify-content-between">
            <ul className="navbar-nav admin-nav-links gap-1 me-auto mb-2 mb-lg-0">
              {navItems.map((item) => (
                <li className="nav-item" key={item.key}>
                  <button
                    className={`nav-link admin-nav-link btn border-0 text-start d-flex align-items-center gap-2 ${
                      activeTab === item.key ? 'active bg-primary text-white fw-bold' : 'text-white-50'
                    }`}
                    onClick={() => setActiveTab(item.key)}
                    data-bs-dismiss="offcanvas"
                    aria-current={activeTab === item.key ? 'page' : undefined}
                  >
                    <span className="admin-nav-icon d-inline-flex align-items-center justify-content-center">{item.icon}</span>
                    <span>{item.label}</span>
                    {!!item.count && <span className={`badge rounded-pill ${item.badge || 'bg-primary'}`}>{item.count}</span>}
                  </button>
                </li>
              ))}

              {currentUser?.rol === 'ADMIN' && (
                <li className="nav-item">
                  <button
                    className={`nav-link admin-nav-link btn border-0 text-start d-flex align-items-center gap-2 ${
                      activeTab === 'usuarios' ? 'active bg-primary text-white fw-bold' : 'text-white-50'
                    }`}
                    onClick={() => setActiveTab('usuarios')}
                    data-bs-dismiss="offcanvas"
                    aria-current={activeTab === 'usuarios' ? 'page' : undefined}
                  >
                    <span className="admin-nav-icon d-inline-flex align-items-center justify-content-center"><Users size={15} /></span>
                    Vendedores / Usuarios
                  </button>
                </li>
              )}
            </ul>

            <div className="admin-navbar-actions d-flex align-items-center gap-2 mt-3 mt-lg-0 ms-lg-2 position-relative">
              <div className="position-relative admin-alert-wrap w-100 w-lg-auto">
                <button
                  onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
                  className="btn btn-warning admin-alert-button btn-sm w-100 w-lg-auto position-relative d-flex align-items-center justify-content-center gap-2 py-2 px-3 fw-semibold"
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
                      className="notification-dropdown-responsive admin-notification-panel bg-white text-dark rounded-3 shadow-lg p-3 border"
                      style={{ maxHeight: '80vh', overflowY: 'auto' }}
                    >
                      <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-3">
                        <strong className="text-dark fs-6 d-flex align-items-center gap-2">
                          <Bell size={18} className="text-warning" />
                          <span>Recordatorios</span>
                        </strong>
                        <div className="d-flex align-items-center gap-2">
                          {alertCount > 0 && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary px-2.5 py-1 fw-bold d-inline-flex align-items-center gap-1 shadow-sm"
                              style={{ fontSize: '0.74rem' }}
                              onClick={() => {
                                handleMarkAllNotificationsAsRead?.();
                                updateDismissedAlerts((prev) => {
                                  const next = new Set(prev);
                                  uniqueNearDueClients.forEach((c) => {
                                    next.add(String(c.id || c.ruc || c.razonSocial));
                                    if (c.id) next.add(String(c.id));
                                    if (c.ruc) next.add(String(c.ruc));
                                  });
                                  return next;
                                });
                              }}
                              title="Marcar todas las alertas como leídas"
                            >
                              <CheckCheck size={13} />
                              <span>Marcar todas como leídas</span>
                            </button>
                          )}
                          <button type="button" className="btn-close btn-sm" onClick={() => setShowNotificationsDropdown(false)}></button>
                        </div>
                      </div>

                      {alertCount === 0 ? (
                        <div className="text-center text-muted py-4">
                          <CheckCircle size={24} className="text-success mb-2 d-block mx-auto" />
                          <p className="small mb-0">No hay alertas de recordatorio activas.</p>
                        </div>
                      ) : (
                        <div className="d-flex flex-column gap-2">
                          {activeNotifications.map((n) => (
                            <div
                              key={`notif-${n.id}`}
                              className="p-3 border rounded bg-light text-start shadow-sm"
                              style={{ cursor: n.clienteId ? 'pointer' : 'default' }}
                              onClick={() => {
                                if (n.id && handleMarkNotificationAsRead) {
                                  handleMarkNotificationAsRead(n.id);
                                }
                                if (n.clienteId || n.clienteRuc) {
                                  updateDismissedAlerts((prev) => {
                                    const next = new Set(prev);
                                    if (n.clienteId) next.add(String(n.clienteId));
                                    if (n.clienteRuc) next.add(String(n.clienteRuc));
                                    return next;
                                  });
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
                          {uniqueNearDueClients.map((c) => (
                            <div
                              key={`alert-near-${c.id}`}
                              className="p-3 border rounded bg-light text-start shadow-sm"
                              style={{ cursor: 'pointer' }}
                              onClick={() => {
                                const key = String(c.id || c.ruc || c.razonSocial);
                                updateDismissedAlerts((prev) => {
                                  const next = new Set(prev);
                                  next.add(key);
                                  if (c.id) next.add(String(c.id));
                                  if (c.ruc) next.add(String(c.ruc));
                                  return next;
                                });
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

              <div className="position-relative admin-profile-wrap">
                <button
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="btn btn-outline-light admin-profile-button btn-sm d-flex align-items-center gap-2 px-2 py-1 rounded-3 border-secondary shadow-sm"
                  title="Perfil de Usuario"
                >
                  <span className="p-1 bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '24px', height: '24px' }}>
                    <User size={13} />
                  </span>
                  <span className="fw-semibold text-truncate d-none d-sm-inline" style={{ maxWidth: '120px' }}>
                    {currentUser?.nombre || currentUser?.username || 'Mi Perfil'}
                  </span>
                  <span className="small opacity-75 ms-1">⌄</span>
                </button>

                {showProfileDropdown && (
                  <div className="position-absolute end-0 mt-2 bg-white text-dark rounded-3 shadow-lg p-2 border admin-profile-panel">
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
