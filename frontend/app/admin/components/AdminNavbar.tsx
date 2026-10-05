'use client';

import React from 'react';
import Image from 'next/image';
import {
  Activity, AlertTriangle, Bell, CheckCheck, CheckCircle2, ChevronDown, ChevronRight,
  FileSpreadsheet, GraduationCap, LayoutDashboard, LockKeyhole, LogOut, Menu,
  Moon, Search, Sun, UserPlus, Users, WalletCards, X,
} from 'lucide-react';

type AdminNavItem = {
  key: string;
  label: string;
  icon: React.ReactNode;
  count?: number;
  countVariant?: 'danger' | 'warning' | 'default';
  isNew?: boolean;
};

interface AdminNavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  headerSearch: string;
  setHeaderSearch: (value: string) => void;
  headerSearchRef: React.RefObject<HTMLInputElement>;
  handleHeaderSearch: (event: React.FormEvent<HTMLFormElement>) => void;
  clientesPorCobrarList: any[];
  clientesVencidosList: any[];
  clientesBloqueadosList: any[];
  clientesPorVencer1DiaList: any[];
  notifications?: any[];
  currentUser: any;
  showNotificationsDropdown: boolean;
  setShowNotificationsDropdown: (open: boolean) => void;
  showProfileDropdown: boolean;
  setShowProfileDropdown: (open: boolean) => void;
  setShowNewUserModal: (open: boolean) => void;
  handleLogout: () => void;
  setCalendarSearch: (value: string) => void;
  handleMarkNotificationAsRead?: (id: string | number) => void;
  handleMarkAllNotificationsAsRead?: () => void;
}

export default function AdminNavbar({
  activeTab,
  setActiveTab,
  isSidebarCollapsed,
  toggleSidebar,
  headerSearch,
  setHeaderSearch,
  headerSearchRef,
  handleHeaderSearch,
  clientesPorCobrarList,
  clientesVencidosList,
  clientesBloqueadosList,
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
  const [isDarkMode, setIsDarkMode] = React.useState(false);

  const activeNotifications = React.useMemo(
    () => (Array.isArray(notifications) ? notifications : []).filter((notification: any) => notification && !notification.leida),
    [notifications],
  );

  React.useEffect(() => {
    if (!isMobileMenuOpen) return;
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMobileMenuOpen(false);
    };
    window.addEventListener('keydown', onEscape);
    return () => window.removeEventListener('keydown', onEscape);
  }, [isMobileMenuOpen]);

  const navGroups: Array<{ label: string; items: AdminNavItem[] }> = [
    {
      label: 'CRM',
      items: [
        { key: 'resumen', label: 'Resumen', icon: <LayoutDashboard size={19} strokeWidth={1.8} /> },
      ],
    },
    {
      label: 'Clientes',
      items: [
        { key: 'todos', label: 'Todos los clientes', icon: <Users size={19} strokeWidth={1.8} /> },
        {
          key: 'cobrar',
          label: 'Por cobrar',
          icon: <WalletCards size={19} strokeWidth={1.8} />,
          count: clientesPorCobrarList.length,
          countVariant: 'warning',
        },
        {
          key: 'vencidos',
          label: 'Vencidos',
          icon: <AlertTriangle size={19} strokeWidth={1.8} />,
          count: clientesVencidosList.length,
          countVariant: 'danger',
        },
        {
          key: 'bloqueados',
          label: 'Bloqueados',
          icon: <LockKeyhole size={19} strokeWidth={1.8} />,
          count: clientesBloqueadosList.length,
          countVariant: 'default',
        },
      ],
    },
    {
      label: 'Gestión',
      items: [
        { key: 'capacitaciones', label: 'Capacitaciones', icon: <GraduationCap size={19} strokeWidth={1.8} /> },
        { key: 'reporte', label: 'Reporte general', icon: <FileSpreadsheet size={19} strokeWidth={1.8} /> },
        ...(currentUser?.rol === 'ADMIN'
          ? [{ key: 'usuarios', label: 'Vendedores y usuarios', icon: <Users size={19} strokeWidth={1.8} /> }]
          : []),
      ],
    },
  ];

  const selectTab = (key: string) => {
    setActiveTab(key);
    setIsMobileMenuOpen(false);
  };

  const userName = currentUser?.nombre || currentUser?.username || 'Usuario Admin';
  const userInitials = String(userName).slice(0, 2).toUpperCase();

  return (
    <>
      {isMobileMenuOpen && (
        <button
          type="button"
          className="admin-sidebar-backdrop"
          aria-label="Cerrar menú lateral"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* TailAdmin Clean Sidebar */}
      <aside
        className={`admin-sidebar ${isMobileMenuOpen ? 'admin-sidebar--open' : ''}`}
        aria-label="Navegación principal"
      >
        <div className="admin-sidebar-top">
          <button
            type="button"
            className="admin-sidebar-brand"
            onClick={() => selectTab('resumen')}
            aria-label="Ir al resumen"
          >
            <span className="admin-sidebar-brand-icon">
              <Image src="/logo.jpeg" alt="" width={36} height={36} />
            </span>
            <span className="admin-sidebar-brand-title">Miquipu</span>
          </button>
          <button
            type="button"
            className="admin-sidebar-mobile-close"
            aria-label="Cerrar menú"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="admin-sidebar-nav" aria-label="Módulos del sistema">
          {navGroups.map((group) => (
            <div className="admin-sidebar-group" key={group.label}>
              <div className="admin-nav-group-title">{group.label}</div>
              <div className="admin-sidebar-links">
                {group.items.map((item) => {
                  const active = activeTab === item.key;
                  return (
                    <button
                      type="button"
                      key={item.key}
                      className={`admin-sidebar-link ${active ? 'active' : ''}`}
                      onClick={() => selectTab(item.key)}
                      aria-current={active ? 'page' : undefined}
                      title={isSidebarCollapsed ? item.label : undefined}
                    >
                      <span className="admin-sidebar-link-icon">{item.icon}</span>
                      <span className="admin-sidebar-link-label">{item.label}</span>
                      {Boolean(item.count) && (
                        <span
                          className="admin-sidebar-count"
                          style={
                            item.countVariant === 'danger' && !active
                              ? { backgroundColor: '#FEF2F2', color: '#B42318' }
                              : item.countVariant === 'warning' && !active
                              ? { backgroundColor: '#FFFBEB', color: '#B54708' }
                              : undefined
                          }
                        >
                          {item.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      {/* TailAdmin Clean Header */}
      <header className="admin-topbar" aria-label="Encabezado del panel">
        <div className="admin-topbar-start">
          <button
            type="button"
            className="admin-sidebar-toggle-btn"
            onClick={() => {
              if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                setIsMobileMenuOpen((prev) => !prev);
              } else {
                toggleSidebar();
              }
            }}
            aria-label={isSidebarCollapsed ? 'Expandir menú lateral' : 'Contraer menú lateral'}
            aria-expanded={!isSidebarCollapsed}
            title={isSidebarCollapsed ? 'Expandir menú lateral' : 'Contraer menú lateral'}
          >
            <Menu size={18} />
          </button>

          <form className="admin-topbar-search" role="search" onSubmit={handleHeaderSearch}>
            <Search size={18} aria-hidden="true" />
            <input
              ref={headerSearchRef}
              type="search"
              value={headerSearch}
              onChange={(event) => setHeaderSearch(event.target.value)}
              placeholder="Buscar o escribir un comando..."
              aria-label="Buscar clientes o escribir comando"
            />
            <kbd>⌘K</kbd>
          </form>
        </div>

        <div className="admin-topbar-actions">
          {/* Theme toggle (Moon/Sun) matching TailAdmin */}
          <button
            type="button"
            className="admin-header-icon-button"
            style={{ borderRadius: '50%' }}
            title={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            aria-label="Modo de color"
            onClick={() => setIsDarkMode((prev) => !prev)}
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Notifications button */}
          <div className="admin-header-popover-anchor">
            <button
              type="button"
              className="admin-header-icon-button admin-notification-trigger"
              title="Notificaciones"
              aria-label={`Notificaciones${activeNotifications.length ? `, ${activeNotifications.length} pendientes` : ''}`}
              aria-expanded={showNotificationsDropdown}
              onClick={() => {
                setShowNotificationsDropdown(!showNotificationsDropdown);
                setShowProfileDropdown(false);
              }}
            >
              <Bell size={18} />
              {activeNotifications.length > 0 && (
                <span className="admin-notification-badge-dot" />
              )}
            </button>

            {showNotificationsDropdown && (
              <>
                <button
                  type="button"
                  className="admin-popover-backdrop"
                  aria-label="Cerrar notificaciones"
                  onClick={() => setShowNotificationsDropdown(false)}
                />
                <div className="admin-notification-panel-fb" role="dialog" aria-label="Notificaciones">
                  <div className="admin-popover-header">
                    <div>
                      <strong>Notificaciones</strong>
                      <span>Alertas y recordatorios recientes</span>
                    </div>
                    <button
                      type="button"
                      className="admin-popover-close"
                      aria-label="Cerrar"
                      onClick={() => setShowNotificationsDropdown(false)}
                    >
                      <X size={16} />
                    </button>
                  </div>
                  {activeNotifications.length > 0 && (
                    <div className="admin-notification-toolbar">
                      <span>{activeNotifications.length} pendientes</span>
                      <button type="button" onClick={() => handleMarkAllNotificationsAsRead?.()}>
                        <CheckCheck size={14} /> Marcar todas como leídas
                      </button>
                    </div>
                  )}
                  <div className="admin-notification-list">
                    {activeNotifications.length === 0 ? (
                      <div className="admin-notification-empty p-4 text-center">
                        <span className="d-inline-flex p-3 rounded-circle bg-success bg-opacity-10 text-success mb-2">
                          <CheckCircle2 size={24} />
                        </span>
                        <strong className="d-block text-dark">¡Estás al día!</strong>
                        <p className="text-muted small mb-0">No tienes alertas pendientes.</p>
                      </div>
                    ) : (
                      activeNotifications.map((notification: any) => {
                        const overdue =
                          notification.tipo?.toLowerCase().includes('venc') ||
                          notification.mensaje?.toLowerCase().includes('venc');
                        const payment =
                          notification.tipo?.toLowerCase().includes('cobr') ||
                          notification.tipo?.toLowerCase().includes('pago');
                        return (
                          <button
                            type="button"
                            key={`notif-${notification.id}`}
                            className="admin-notification-item"
                            onClick={() => {
                              if (notification.id && handleMarkNotificationAsRead) {
                                handleMarkNotificationAsRead(notification.id);
                              }
                              if (notification.clienteRazonSocial) {
                                setCalendarSearch(notification.clienteRazonSocial);
                                selectTab('todos');
                                setShowNotificationsDropdown(false);
                              }
                            }}
                          >
                            <span
                              className={`admin-notification-icon ${
                                overdue
                                  ? 'admin-notification-icon--danger'
                                  : payment
                                  ? 'admin-notification-icon--warning'
                                  : ''
                              }`}
                            >
                              {overdue ? (
                                <AlertTriangle size={18} />
                              ) : payment ? (
                                <WalletCards size={18} />
                              ) : (
                                <Bell size={18} />
                              )}
                            </span>
                            <span className="admin-notification-copy">
                              <strong>{notification.clienteRazonSocial || notification.titulo || 'Cliente'}</strong>
                              <span>{notification.mensaje}</span>
                              <small>{notification.tipo || 'Aviso'}</small>
                            </span>
                            <span className="admin-notification-unread" />
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* User profile dropdown */}
          <div className="admin-header-popover-anchor">
            <button
              type="button"
              className="admin-profile-trigger"
              title="Perfil de usuario"
              aria-label="Perfil de usuario"
              aria-expanded={showProfileDropdown}
              onClick={() => {
                setShowProfileDropdown(!showProfileDropdown);
                setShowNotificationsDropdown(false);
              }}
            >
              <span className="admin-profile-avatar">{userInitials}</span>
              <span className="admin-profile-name">{userName}</span>
              <ChevronDown size={14} className="admin-profile-chevron" />
            </button>

            {showProfileDropdown && (
              <>
                <button
                  type="button"
                  className="admin-popover-backdrop"
                  aria-label="Cerrar perfil"
                  onClick={() => setShowProfileDropdown(false)}
                />
                <div className="admin-profile-panel" role="menu" aria-label="Opciones de usuario">
                  <div className="admin-profile-panel-user">
                    <span className="admin-profile-avatar">{userInitials}</span>
                    <div>
                      <strong className="d-block text-dark">{userName}</strong>
                      <small className="text-muted">{currentUser?.email || currentUser?.rol || 'ADMIN'}</small>
                    </div>
                  </div>
                  <div className="admin-profile-panel-links">
                    {currentUser?.rol === 'ADMIN' && (
                      <>
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setShowNewUserModal(true);
                            setShowProfileDropdown(false);
                          }}
                        >
                          <UserPlus size={16} /> Registrar nuevo vendedor <ChevronRight size={14} />
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            selectTab('usuarios');
                            setShowProfileDropdown(false);
                          }}
                        >
                          <Users size={16} /> Gestión de vendedores <ChevronRight size={14} />
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        selectTab('reporte');
                        setShowProfileDropdown(false);
                      }}
                    >
                      <Activity size={16} /> Reporte general <ChevronRight size={14} />
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      className="admin-profile-logout"
                      onClick={() => {
                        setShowProfileDropdown(false);
                        handleLogout();
                      }}
                    >
                      <LogOut size={16} /> Cerrar sesión
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
