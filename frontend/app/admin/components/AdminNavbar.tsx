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
  ChevronRight,
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

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
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          data-bs-toggle="offcanvas"
          data-bs-target="#adminNavbarOffcanvas"
          aria-controls="adminNavbarOffcanvas"
          aria-label="Abrir menu de navegacion"
        >
          <Menu size={20} aria-hidden="true" />
        </button>

        {/* Backdrop en móvil */}
        {isMobileMenuOpen && (
          <div
            className="offcanvas-backdrop fade show d-lg-none"
            onClick={() => setIsMobileMenuOpen(false)}
            style={{ zIndex: 1040 }}
          />
        )}

        {/* Navigation Content */}
        <div
          className={`offcanvas offcanvas-start offcanvas-lg bg-white text-dark flex-grow-1 ${isMobileMenuOpen ? 'show' : ''}`}
          tabIndex={-1}
          id="adminNavbarOffcanvas"
          style={{ visibility: isMobileMenuOpen ? 'visible' : undefined }}
        >
          <div className="offcanvas-header border-bottom d-lg-none py-3 px-3.5">
            <div className="d-flex align-items-center gap-2.5">
              <Image src="/logo.jpeg" alt="Miquipu Logo" width={34} height={34} className="rounded-circle shadow-xs" />
              <div>
                <h5 className="offcanvas-title text-dark fw-bolder mb-0 fs-6">Miquipu Facturación</h5>
                <span className="text-muted" style={{ fontSize: '0.72rem' }}>Panel de Control</span>
              </div>
            </div>
            <button
              type="button"
              className="btn-close"
              onClick={() => setIsMobileMenuOpen(false)}
              data-bs-dismiss="offcanvas"
              aria-label="Cerrar"
            ></button>
          </div>

          <div className="offcanvas-body h-100 d-flex flex-column flex-lg-row align-items-lg-center justify-content-lg-between p-3 p-lg-0">
            {/* Center Navigation Links (Vertical in Mobile, Horizontal in Desktop) */}
            <ul className="navbar-nav stitch-navbar-nav-scroll d-flex flex-column flex-lg-row align-items-lg-center h-100 gap-1 mx-lg-auto mb-3 mb-lg-0 w-100 w-lg-auto">
              {navItems.map((item) => {
                const isActive = activeTab === item.key;
                return (
                  <li className="nav-item h-lg-100 w-100 w-lg-auto d-flex align-items-center" key={item.key}>
                    <button
                      className={`stitch-nav-tab w-100 w-lg-auto ${isActive ? 'active' : ''}`}
                      onClick={() => {
                        setActiveTab(item.key);
                        setIsMobileMenuOpen(false);
                      }}
                      data-bs-dismiss="offcanvas"
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <span className={`d-inline-flex align-items-center justify-content-center ${isActive ? 'text-primary' : 'text-muted'}`}>
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                      {!!item.count && (
                        <span
                          className={`badge rounded-pill fw-bold ms-auto ms-lg-0 ${
                            item.key === 'cobrar'
                              ? 'bg-warning-subtle text-warning-emphasis border border-warning-subtle'
                              : item.key === 'vencidos'
                              ? 'bg-danger-subtle text-danger-emphasis border border-danger-subtle'
                              : item.key === 'bloqueados'
                              ? 'bg-secondary-subtle text-secondary border'
                              : 'bg-primary text-white'
                          }`}
                          style={{ fontSize: '0.68rem', padding: '0.22em 0.55em' }}
                        >
                          {item.count}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}

              {currentUser?.rol === 'ADMIN' && (
                <li className="nav-item h-lg-100 w-100 w-lg-auto d-flex align-items-center">
                  <button
                    className={`stitch-nav-tab w-100 w-lg-auto ${activeTab === 'usuarios' ? 'active' : ''}`}
                    onClick={() => {
                      setActiveTab('usuarios');
                      setIsMobileMenuOpen(false);
                    }}
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
            <div className="d-flex align-items-center justify-content-between justify-content-lg-end gap-2 mt-auto mt-lg-0 ms-lg-2 position-relative w-100 w-lg-auto">
              {/* En móvil: Indicador de sesión activa a la izquierda */}
              <div className="d-flex d-lg-none align-items-center gap-2 overflow-hidden">
                <span className="text-dark small fw-bold text-truncate" style={{ maxWidth: '140px' }}>
                  {currentUser?.nombre || currentUser?.username || 'Admin'}
                </span>
                <span className="badge rounded-pill" style={{ backgroundColor: '#E7F3FF', color: '#0866FF', fontSize: '0.65rem' }}>
                  {currentUser?.rol || 'ADMIN'}
                </span>
              </div>

              <div className="d-flex align-items-center gap-2">
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
                      className="admin-notification-panel-fb text-dark"
                    >
                      {/* Facebook Style Notifications Header */}
                      <div className="fb-notif-header">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <h3 className="h6 fw-bold text-dark mb-0 fs-5">Notificaciones</h3>
                          <div className="d-flex align-items-center gap-2">
                            {alertCount > 0 && (
                              <button
                                type="button"
                                className="btn btn-sm rounded-pill px-2.5 py-1 fw-bold text-primary border-0 d-inline-flex align-items-center gap-1"
                                style={{ fontSize: '0.74rem', backgroundColor: '#E7F3FF' }}
                                onClick={() => handleMarkAllNotificationsAsRead?.()}
                                title="Marcar todas como leídas"
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

                        {/* Facebook Tabs: Todas / No leídas */}
                        <div className="d-flex align-items-center gap-1.5 pt-1">
                          <button
                            type="button"
                            className="fb-notif-tab active"
                          >
                            Todas {alertCount > 0 && `(${alertCount})`}
                          </button>
                          <button
                            type="button"
                            className="fb-notif-tab"
                            onClick={() => handleMarkAllNotificationsAsRead?.()}
                          >
                            No leídas
                          </button>
                        </div>
                      </div>

                      {/* Notifications List (Facebook Feed Style) */}
                      <div className="fb-notif-list">
                        {alertCount === 0 ? (
                          <div className="text-center text-muted py-5 px-3">
                            <div
                              className="mx-auto rounded-circle d-flex align-items-center justify-content-center mb-3"
                              style={{ width: '56px', height: '56px', backgroundColor: '#E8F8F0', color: '#059669' }}
                            >
                              <CheckCircle size={28} />
                            </div>
                            <h4 className="h6 fw-bold text-dark mb-1">¡Estás al día!</h4>
                            <p className="small text-muted mb-0">No tienes alertas pendientes ni vencimientos sin atender.</p>
                          </div>
                        ) : (
                          activeNotifications.map((n: any) => {
                            const isVencido = n.tipo?.toLowerCase().includes('venc') || n.mensaje?.toLowerCase().includes('venc');
                            const isCobro = n.tipo?.toLowerCase().includes('cobr') || n.tipo?.toLowerCase().includes('pago');
                            
                            const iconBg = isVencido ? '#FEE2E2' : isCobro ? '#FEF3C7' : '#E7F3FF';
                            const iconColor = isVencido ? '#DC2626' : isCobro ? '#D97706' : '#0866FF';

                            return (
                              <div
                                key={`notif-${n.id}`}
                                className="fb-notif-item unread"
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
                                <div
                                  className="fb-notif-icon shadow-xs flex-shrink-0"
                                  style={{ backgroundColor: iconBg, color: iconColor }}
                                >
                                  {isVencido ? <AlertTriangle size={18} /> : isCobro ? <WalletCards size={18} /> : <Bell size={18} />}
                                </div>
                                <div className="flex-grow-1 overflow-hidden">
                                  <div className="text-dark small lh-sm mb-1">
                                    <strong className="fw-bold">{n.clienteRazonSocial || n.titulo || 'Cliente'}</strong>
                                    <span className="text-secondary d-block text-truncate mt-0.5" style={{ fontSize: '0.80rem' }}>
                                      {n.mensaje}
                                    </span>
                                  </div>
                                  <div className="d-flex align-items-center gap-1.5 mt-1">
                                    <span className="badge-fb badge-fb-secondary" style={{ fontSize: '0.62rem', padding: '0.15rem 0.45rem' }}>
                                      {n.tipo || 'Aviso'}
                                    </span>
                                    <span className="text-muted small" style={{ fontSize: '0.72rem' }}>
                                      Revisar cliente &bull; Clic aquí
                                    </span>
                                  </div>
                                </div>
                                <span className="fb-notif-unread-dot" title="No leído"></span>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Profile Avatar / Menu Button (Meta Photo 3 Style) */}
              {/* Profile Avatar / Menu Button (Stitch Style - Icon Only) */}
              <div className="position-relative admin-profile-wrap">
                <button
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="btn p-0 border-0 bg-transparent d-flex align-items-center"
                  title="Perfil de Usuario"
                  aria-label="Perfil de Usuario"
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
                </button>

                {/* Profile Flyout (Photo 3 Facebook Style with Backdrop) */}
                {showProfileDropdown && (
                  <>
                    <div
                      className="position-fixed top-0 start-0 w-100 h-100"
                      style={{ zIndex: 100055, background: 'transparent' }}
                      onClick={() => setShowProfileDropdown(false)}
                    />
                    <div
                      className="admin-profile-panel text-dark"
                      style={{ zIndex: 100060 }}
                    >
                      {/* User Top Card (Facebook Style) */}
                      <div className="p-3 border rounded-3 mb-2 shadow-xs" style={{ backgroundColor: '#F0F2F5' }}>
                        <div className="d-flex align-items-center gap-3">
                          <div
                            className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white shadow-sm flex-shrink-0"
                            style={{ width: '46px', height: '46px', backgroundColor: '#0866FF', fontSize: '1.1rem' }}
                          >
                            <User size={22} />
                          </div>
                          <div className="overflow-hidden">
                            <strong className="d-block text-dark text-truncate fw-bold" style={{ fontSize: '0.94rem' }}>
                              {currentUser?.nombre || currentUser?.username || 'Usuario Admin'}
                            </strong>
                            <span className="badge rounded-pill mt-0.5 fw-bold" style={{ backgroundColor: '#E7F3FF', color: '#0866FF', fontSize: '0.68rem' }}>
                              {currentUser?.rol || 'ADMIN'}
                            </span>
                            {currentUser?.email && (
                              <small className="d-block text-muted text-truncate mt-0.5" style={{ fontSize: '0.74rem' }}>
                                {currentUser.email}
                              </small>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Menu Items (Facebook Settings List Style) */}
                      <div className="d-flex flex-column gap-1">
                        {currentUser?.rol === 'ADMIN' && (
                          <>
                            <button
                              type="button"
                              className="btn btn-light w-100 text-start d-flex align-items-center justify-content-between py-2 px-2.5 rounded-3 text-dark border-0"
                              onClick={() => {
                                setShowNewUserModal(true);
                                setShowProfileDropdown(false);
                              }}
                            >
                              <div className="d-flex align-items-center gap-2.5">
                                <span
                                  className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                                  style={{ width: '36px', height: '36px', backgroundColor: '#F0F2F5', color: '#0866FF' }}
                                >
                                  <UserPlus size={17} />
                                </span>
                                <span className="fw-semibold text-nowrap" style={{ fontSize: '0.84rem' }}>Registrar Nuevo Vendedor</span>
                              </div>
                              <ChevronRight size={16} className="text-muted flex-shrink-0" />
                            </button>

                            <button
                              type="button"
                              className="btn btn-light w-100 text-start d-flex align-items-center justify-content-between py-2 px-2.5 rounded-3 text-dark border-0"
                              onClick={() => {
                                setActiveTab('usuarios');
                                setShowProfileDropdown(false);
                              }}
                            >
                              <div className="d-flex align-items-center gap-2.5">
                                <span
                                  className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                                  style={{ width: '36px', height: '36px', backgroundColor: '#F0F2F5', color: '#0866FF' }}
                                >
                                  <Users size={17} />
                                </span>
                                <span className="fw-semibold text-nowrap" style={{ fontSize: '0.84rem' }}>Gestión de Vendedores</span>
                              </div>
                              <ChevronRight size={16} className="text-muted flex-shrink-0" />
                            </button>
                          </>
                        )}

                        <button
                          type="button"
                          className="btn btn-light w-100 text-start d-flex align-items-center justify-content-between py-2 px-2.5 rounded-3 text-dark border-0"
                          onClick={() => {
                            setActiveTab('reporte');
                            setShowProfileDropdown(false);
                          }}
                        >
                          <div className="d-flex align-items-center gap-2.5">
                            <span
                              className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                              style={{ width: '36px', height: '36px', backgroundColor: '#F0F2F5', color: '#0284C7' }}
                            >
                              <Activity size={17} />
                            </span>
                            <span className="fw-semibold text-nowrap" style={{ fontSize: '0.84rem' }}>Reporte General</span>
                          </div>
                          <ChevronRight size={16} className="text-muted flex-shrink-0" />
                        </button>

                        <div className="border-top my-1"></div>

                        <button
                          type="button"
                          onClick={() => {
                            setShowProfileDropdown(false);
                            handleLogout();
                          }}
                          className="btn w-100 text-start d-flex align-items-center justify-content-between py-2 px-2.5 rounded-3 border-0"
                          style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}
                        >
                          <div className="d-flex align-items-center gap-2.5">
                            <span
                              className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                              style={{ width: '36px', height: '36px', backgroundColor: '#FFFFFF', color: '#DC2626' }}
                            >
                              <LogOut size={17} />
                            </span>
                            <span className="fw-bold text-nowrap" style={{ fontSize: '0.84rem' }}>Cerrar Sesión</span>
                          </div>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </nav>
  );
}
