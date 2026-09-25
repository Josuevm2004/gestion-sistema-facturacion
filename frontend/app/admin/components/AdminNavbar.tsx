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
  // Las alertas activas provienen directamente de la tabla notificacion de la base de datos (leida = false)
  const activeNotifications = React.useMemo(() => {
    return (Array.isArray(notifications) ? notifications : []).filter((n: any) => n && !n.leida);
  }, [notifications]);

  const alertCount = activeNotifications.length;

  const navItems = [
    { key: 'resumen', label: 'Resumen', icon: <LayoutDashboard size={15} /> },
    { key: 'todos', label: 'Todos los Clientes', icon: <Users size={15} /> },
    { key: 'cobrar', label: 'Por Cobrar', icon: <WalletCards size={15} />, count: clientesPorCobrarList.length, badge: 'bg-warning text-dark' },
    { key: 'vencidos', label: 'Vencidos', icon: <AlertTriangle size={15} />, count: clientesVencidosList.length, badge: 'bg-danger' },
    { key: 'bloqueados', label: 'Bloqueados', icon: <LockKeyhole size={15} />, count: clientesBloqueadosList.length, badge: 'bg-secondary' },
    { key: 'capacitaciones', label: 'Capacitaciones', icon: <GraduationCap size={15} /> },
    { key: 'reporte', label: 'Reporte General', icon: <FileSpreadsheet size={15} /> },
  ];

  return (
    <nav className="stitch-navbar navbar navbar-expand-lg sticky-top py-0">
      <div className="container-fluid h-100 d-flex align-items-center justify-content-between px-2 px-md-3">
        {/* Brand (Stitch Style: Logo & Title, Search Removed) */}
        <div className="d-flex align-items-center gap-2 gap-sm-2.5 flex-shrink-0 cursor-pointer" onClick={() => setActiveTab('resumen')}>
          <Image src="/logo.jpeg" alt="Miquipu Logo" width={36} height={36} className="rounded-circle shadow-xs" />
          <span className="navbar-brand text-dark fw-bold mb-0 me-0 fs-6 d-none d-sm-inline" style={{ letterSpacing: '-0.3px', fontWeight: 800 }}>
            Miquipu Admin
          </span>
        </div>

        {/* Mobile Toggler */}
        <button
          className="navbar-toggler border-0 text-dark p-2 rounded-circle d-lg-none"
          style={{ backgroundColor: '#F0F2F5' }}
          type="button"
          data-bs-toggle="offcanvas"
          data-bs-target="#adminNavbarOffcanvas"
          aria-controls="adminNavbarOffcanvas"
          aria-label="Abrir menu de navegacion"
        >
          <Menu size={20} aria-hidden="true" />
        </button>

        {/* Navigation Content */}
        <div className="offcanvas offcanvas-start offcanvas-lg bg-white text-dark h-100 flex-grow-1" tabIndex={-1} id="adminNavbarOffcanvas">
          <div className="offcanvas-header border-bottom d-lg-none">
            <div className="d-flex align-items-center gap-2">
              <Image src="/logo.jpeg" alt="Miquipu Logo" width={32} height={32} className="rounded-circle" />
              <h5 className="offcanvas-title text-dark fw-bold mb-0">Menu Miquipu</h5>
            </div>
            <button type="button" className="btn-close" data-bs-dismiss="offcanvas" aria-label="Cerrar"></button>
          </div>

          <div className="offcanvas-body h-100 d-flex flex-column flex-lg-row align-items-lg-center justify-content-lg-between p-3 p-lg-0">
            {/* Center Navigation Links (Stitch Style) */}
            <ul className="navbar-nav d-flex flex-column flex-lg-row align-items-lg-center h-100 gap-1 mx-lg-auto mb-3 mb-lg-0">
              {navItems.map((item) => {
                const isActive = activeTab === item.key;
                return (
                  <li className="nav-item h-100 d-flex align-items-center" key={item.key}>
                    <button
                      className={`stitch-nav-tab ${isActive ? 'active' : ''}`}
                      onClick={() => setActiveTab(item.key)}
                      data-bs-dismiss="offcanvas"
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <span className={`d-inline-flex align-items-center justify-content-center ${isActive ? 'text-primary' : 'text-muted'}`}>
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                      {!!item.count && (
                        <span
                          className={`badge rounded-pill fw-bold ${
                            item.key === 'cobrar'
                              ? 'bg-warning-subtle text-warning-emphasis border border-warning-subtle'
                              : item.key === 'vencidos'
                              ? 'bg-danger-subtle text-danger-emphasis border border-danger-subtle'
                              : item.key === 'bloqueados'
                              ? 'bg-secondary-subtle text-secondary border'
                              : 'bg-primary text-white'
                          }`}
                          style={{ fontSize: '0.68rem', padding: '0.2em 0.5em' }}
                        >
                          {item.count}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}

              {currentUser?.rol === 'ADMIN' && (
                <li className="nav-item h-100 d-flex align-items-center">
                  <button
                    className={`stitch-nav-tab ${activeTab === 'usuarios' ? 'active' : ''}`}
                    onClick={() => setActiveTab('usuarios')}
                    data-bs-dismiss="offcanvas"
                    aria-current={activeTab === 'usuarios' ? 'page' : undefined}
                  >
                    <span className={`d-inline-flex align-items-center justify-content-center ${activeTab === 'usuarios' ? 'text-primary' : 'text-muted'}`}>
                      <Users size={15} />
                    </span>
                    <span>Vendedores / Usuarios</span>
                  </button>
                </li>
              )}
            </ul>

            {/* Right Side Utility Actions (Stitch Circular Buttons) */}
            <div className="d-flex align-items-center gap-2 mt-auto mt-lg-0 ms-lg-2 position-relative">
              {/* Notifications Button */}
              <div className="position-relative admin-alert-wrap">
                <button
                  onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
                  className="stitch-circle-btn shadow-xs"
                  title="Notificaciones y Recordatorios"
                  aria-label="Notificaciones"
                >
                  <Bell size={18} />
                  {alertCount > 0 && (
                    <span
                      className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-white"
                      style={{ fontSize: '0.62rem', padding: '0.2em 0.45em' }}
                    >
                      {alertCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown Card (Meta Photo 2 Style) */}
                {showNotificationsDropdown && (
                  <>
                    <div
                      className="d-block d-lg-none position-fixed top-0 start-0 w-100 h-100 bg-dark opacity-50"
                      style={{ zIndex: 100040 }}
                      onClick={() => setShowNotificationsDropdown(false)}
                    ></div>

                    <div
                      className="notification-dropdown-responsive admin-notification-panel bg-white text-dark rounded-4 shadow-lg p-3 border"
                      style={{ maxHeight: '82vh', overflowY: 'auto' }}
                    >
                      <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-3">
                        <strong className="text-dark fs-5 fw-bold d-flex align-items-center gap-2">
                          <Bell size={20} className="text-primary" />
                          <span>Notificaciones</span>
                        </strong>
                        <div className="d-flex align-items-center gap-2">
                          {alertCount > 0 && (
                            <button
                              type="button"
                              className="btn btn-sm btn-light rounded-pill px-2.5 py-1 fw-bold text-primary d-inline-flex align-items-center gap-1 border-0"
                              style={{ fontSize: '0.74rem', backgroundColor: '#E7F3FF' }}
                              onClick={() => {
                                handleMarkAllNotificationsAsRead?.();
                              }}
                              title="Marcar todas las alertas como leídas"
                            >
                              <CheckCheck size={13} />
                              <span>Marcar leídas</span>
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn-close btn-sm"
                            onClick={() => setShowNotificationsDropdown(false)}
                            aria-label="Cerrar"
                          ></button>
                        </div>
                      </div>

                      {alertCount === 0 ? (
                        <div className="text-center text-muted py-4">
                          <CheckCircle size={28} className="text-success mb-2 d-block mx-auto" />
                          <p className="small mb-0 fw-semibold">No hay alertas de recordatorio activas.</p>
                          <small className="text-muted">Todas tus cobranzas están al día.</small>
                        </div>
                      ) : (
                        <div className="d-flex flex-column gap-2">
                          {activeNotifications.map((n: any) => (
                            <div
                              key={`notif-${n.id}`}
                              className="p-3 border rounded-3 bg-light text-start shadow-sm position-relative"
                              style={{ cursor: n.clienteId ? 'pointer' : 'default', transition: 'background-color 0.15s ease' }}
                              onClick={() => {
                                if (n.id && handleMarkNotificationAsRead) {
                                  handleMarkNotificationAsRead(n.id);
                                }
                                if (n.clienteRazonSocial) {
                                  setCalendarSearch(n.clienteRazonSocial);
                                  setActiveTab('todos');
                                  setShowNotificationsDropdown(false);
                                }
                              }}
                            >
                              <div className="d-flex justify-content-between align-items-start mb-1">
                                <strong className="text-dark text-truncate me-2 fw-bold" style={{ maxWidth: '210px', fontSize: '0.88rem' }}>
                                  {n.clienteRazonSocial || n.titulo}
                                </strong>
                                <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle rounded-pill flex-shrink-0" style={{ fontSize: '0.65rem' }}>
                                  {n.tipo}
                                </span>
                              </div>
                              <div className="small text-muted mb-1" style={{ fontSize: '0.82rem' }}>{n.mensaje}</div>
                              <div className="d-flex align-items-center justify-content-between mt-1">
                                <small className="text-primary fw-semibold" style={{ fontSize: '0.72rem' }}>Hacer clic para ver cliente</small>
                                <span className="p-1 rounded-circle bg-primary" style={{ width: '7px', height: '7px' }}></span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Profile Avatar / Menu Button (Meta Photo 3 Style) */}
              {/* Profile Avatar / Menu Button (Stitch Style) */}
              <div className="position-relative admin-profile-wrap">
                <button
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="btn p-0 border-0 bg-transparent d-flex align-items-center gap-2"
                  title="Perfil de Usuario"
                >
                  <div className="position-relative">
                    <div
                      className="stitch-circle-btn shadow-xs fw-bold text-white"
                      style={{ backgroundColor: '#0F172A', fontSize: '0.84rem' }}
                    >
                      {((currentUser?.nombre || currentUser?.username || 'AD') as string).slice(0, 2).toUpperCase()}
                    </div>
                    <span
                      className="position-absolute bottom-0 end-0 rounded-circle bg-success border border-white border-2"
                      style={{ width: '11px', height: '11px' }}
                    ></span>
                  </div>
                  <span className="fw-bold text-dark text-truncate d-none d-sm-inline" style={{ maxWidth: '120px', fontSize: '0.84rem' }}>
                    {currentUser?.nombre || currentUser?.username || 'Admin'}
                  </span>
                  <span className="small text-muted ms-0.5 d-none d-sm-inline">▾</span>
                </button>

                {/* Profile Flyout (Photo 3 Style) */}
                {showProfileDropdown && (
                  <div className="position-absolute end-0 mt-2 bg-white text-dark rounded-4 shadow-lg p-2.5 border admin-profile-panel" style={{ width: '280px', zIndex: 100050 }}>
                    <div className="p-3 border-bottom mb-2 bg-light rounded-3 text-start d-flex align-items-center gap-3">
                      <div className="p-2.5 bg-primary text-white rounded-circle d-flex align-items-center justify-content-center shadow-sm" style={{ width: '42px', height: '42px' }}>
                        <User size={20} />
                      </div>
                      <div className="overflow-hidden">
                        <strong className="d-block text-dark text-truncate fw-bold" style={{ fontSize: '0.92rem' }}>
                          {currentUser?.nombre || currentUser?.username || 'Usuario'}
                        </strong>
                        <span className="badge bg-primary text-white mt-0.5 rounded-pill" style={{ fontSize: '0.65rem' }}>
                          {currentUser?.rol || 'ADMIN'}
                        </span>
                        {currentUser?.email && (
                          <small className="d-block text-muted text-truncate mt-0.5" style={{ fontSize: '0.73rem' }}>
                            {currentUser.email}
                          </small>
                        )}
                      </div>
                    </div>

                    {currentUser?.rol === 'ADMIN' && (
                      <>
                        <button
                          className="btn btn-light w-100 text-start d-flex align-items-center gap-2.5 py-2 px-3 rounded-3 text-dark mb-1 border-0 fw-semibold"
                          style={{ fontSize: '0.85rem' }}
                          onClick={() => {
                            setShowNewUserModal(true);
                            setShowProfileDropdown(false);
                          }}
                        >
                          <span className="p-1.5 bg-light rounded-circle text-primary d-inline-flex border">
                            <UserPlus size={15} />
                          </span>
                          <span>Registrar Nuevo Vendedor</span>
                        </button>
                        <button
                          className="btn btn-light w-100 text-start d-flex align-items-center gap-2.5 py-2 px-3 rounded-3 text-dark mb-1 border-0 fw-semibold"
                          style={{ fontSize: '0.85rem' }}
                          onClick={() => {
                            setActiveTab('usuarios');
                            setShowProfileDropdown(false);
                          }}
                        >
                          <span className="p-1.5 bg-light rounded-circle text-primary d-inline-flex border">
                            <Users size={15} />
                          </span>
                          <span>Gestión de Vendedores</span>
                        </button>
                      </>
                    )}

                    <button
                      className="btn btn-light w-100 text-start d-flex align-items-center gap-2.5 py-2 px-3 rounded-3 text-dark mb-1 border-0 fw-semibold"
                      style={{ fontSize: '0.85rem' }}
                      onClick={() => {
                        setActiveTab('reporte');
                        setShowProfileDropdown(false);
                      }}
                    >
                      <span className="p-1.5 bg-light rounded-circle text-info d-inline-flex border">
                        <Activity size={15} />
                      </span>
                      <span>Reporte General</span>
                    </button>

                    <div className="border-top my-1.5"></div>

                    <button
                      onClick={() => {
                        setShowProfileDropdown(false);
                        handleLogout();
                      }}
                      className="btn btn-outline-danger w-100 text-start d-flex align-items-center gap-2.5 py-2 px-3 rounded-3 fw-bold mt-1"
                      style={{ fontSize: '0.85rem' }}
                    >
                      <LogOut size={15} />
                      <span>Cerrar Sesión</span>
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
