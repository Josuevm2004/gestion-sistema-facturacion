'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { adminApi, api } from '@/lib/api';
import { Client, ColorTagType, SubscriptionType } from '../components/ClientesTodosTab';
import { UserAccount } from '../components/VendedoresTab';

function extractArray(resData: any): any[] {
  if (Array.isArray(resData)) return resData;
  if (resData && Array.isArray(resData.data)) return resData.data;
  return [];
}

export function useAdminData() {
  const [token, setToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [activeTab, setActiveTab] = useState<string>('resumen');
  const [notice, setNotice] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Estados de datos
  const [clients, setClients] = useState<Client[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<UserAccount[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const lastVencimientosReviewRef = useRef<number>(0);
  const processingPaymentsRef = useRef<Set<string>>(new Set());
  const processingOperationsRef = useRef<Set<string>>(new Set());
  const processingStateRef = useRef<Set<string>>(new Set());

  // Filtros unificados
  const [search, setSearch] = useState('');
  const [regimenFilter, setRegimenFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [suscripcionFilter, setSuscripcionFilter] = useState('');
  const [colorFilter, setColorFilter] = useState('');
  const [capacitacionFilter, setCapacitacionFilter] = useState('');
  const [estadoCuentaFilter, setEstadoCuentaFilter] = useState('');
  const [sellerFilter, setSellerFilter] = useState('');
  const [periodoIngresoTipo, setPeriodoIngresoTipo] = useState('');
  const [fechaCustomFilter, setFechaCustomFilter] = useState('');
  const [showSolKeys, setShowSolKeys] = useState<Record<string, boolean>>({});

  // Modales
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);
  const [cambioPlanClient, setCambioPlanClient] = useState<Client | null>(null);
  const [cambioPlanSeleccionado, setCambioPlanSeleccionado] = useState<string>('INICIA');
  const [cambioPlanTipo, setCambioPlanTipo] = useState<string>('MENSUAL');

  const [trainingClient, setTrainingClient] = useState<Client | null>(null);
  const [trainingDateInput, setTrainingDateInput] = useState<string>('');
  const [historyClient, setHistoryClient] = useState<Client | null>(null);

  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [showNewUserModal, setShowNewUserModal] = useState<boolean>(false);

  // Dropdowns
  const [calendarSearch, setCalendarSearch] = useState<string>('');
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState<boolean>(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState<boolean>(false);

  useEffect(() => {
    const savedToken = localStorage.getItem('miquipu_admin_token');
    const savedUser = localStorage.getItem('miquipu_admin_user');
    if (savedToken) {
      setToken(savedToken);
      if (savedUser) {
        try {
          setCurrentUser(JSON.parse(savedUser));
        } catch (e) {
          console.error(e);
        }
      }
      loadData(savedToken);

      // Auto-sincronización en tiempo real cada 4 segundos
      const intervalId = setInterval(() => {
        loadData(savedToken);
      }, 4000);

      return () => clearInterval(intervalId);
    }
  }, []);

  useEffect(() => {
    if (notice) {
      const timer = setTimeout(() => {
        setNotice(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [notice]);

  async function loadData(authToken?: string | null, showSyncMsg = false) {
    const tokenToUse = authToken || token;
    if (!tokenToUse) return;
    if (showSyncMsg) setIsSyncing(true);
    try {
      const nowMs = Date.now();
      if (nowMs - lastVencimientosReviewRef.current > 60000) {
        lastVencimientosReviewRef.current = nowMs;
        try {
          await adminApi(tokenToUse).post('/admin/servicios/revisar-vencimientos');
        } catch (re) {
          console.warn('No se pudo revisar vencimientos automaticamente', re);
        }
      }

      const clientRes = await adminApi(tokenToUse).get('/admin/clientes');
      const rawClients = extractArray(clientRes.data);
      const normalizedClients: Client[] = rawClients.map((c: any) => ({
        id: c.id,
        ruc: c.ruc,
        razonSocial: c.razonSocial || c.ruc,
        nombreComercial: c.nombreComercial || '',
        direccion: c.direccion || '',
        telefono: c.telefono || '',
        email: c.email || '',
        nombres: c.nombres || '',
        apellidos: c.apellidos || '',
        dni: c.dni || '',
        emailPersonal: c.emailPersonal || '',
        telefonoPersonal: c.telefonoPersonal || '',
        departamento: c.departamento || '',
        provincia: c.provincia || '',
        distrito: c.distrito || '',
        regimenTributario: c.regimenTributario || 'GENERAL',
        planContratado: c.planNombre || c.planContratado || 'Plan Emprende',
        tipoSuscripcion: c.tipoSuscripcion || 'MENSUAL',
        montoMensual: c.precioPlan !== undefined ? c.precioPlan : (c.montoMensual || 29),
        montoSiguienteCobro: c.montoSiguienteCobro,
        ventaId: c.ventaId,
        diasProrrateados: c.diasProrrateados,
        estadoCuenta: c.estadoNombre || c.estadoCuenta || 'POR_COBRAR',
        estadoCapacitacion: c.fechaCapacitacion ? 'COMPLETADO' : (c.estadoNombre === 'POR_CAPACITAR' ? 'PENDIENTE' : 'PENDIENTE'),
        colorTag: (c.colorCodigo || c.colorTag || 'VERDE') as ColorTagType,
        fechaRegistro: c.fechaRegistro,
        fechaCreacion: c.fechaRegistro,
        fechaVencimientoMensual: c.fechaFinServicio || c.fechaVencimientoMensual,
        fechaCapacitacion: c.fechaCapacitacion,
        usuarioSol: c.usuarioSol,
        claveSolCifrada: c.claveSolCifrada,
        vendedor: c.vendedorNombre || c.vendedor || 'Por asignar',
        linkSistema: c.urlAcceso || c.linkSistema,
        usuarioSistema: c.usuarioAdminFacturador || c.usuarioSistema,
        claveSistema: c.claveTemporal || c.claveSistema,
      }));

      setClients(normalizedClients);

      try {
        const payRes = await adminApi(tokenToUse).get('/admin/pagos');
        setPayments(extractArray(payRes.data));
      } catch (pe) {
        setPayments([]);
      }

      try {
        const userRes = await adminApi(tokenToUse).get('/admin/usuarios');
        setUsersList(extractArray(userRes.data));
      } catch (ue) {
        setUsersList([]);
      }

      try {
        const notifRes = await adminApi(tokenToUse).get('/admin/notificaciones');
        setNotifications(extractArray(notifRes.data));
      } catch (ne) {
        setNotifications([]);
      }

      if (showSyncMsg) {
        setNotice('¡Datos sincronizados con éxito!');
        setTimeout(() => setNotice(null), 3000);
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        handleLogout();
        setNotice('Tu sesión ha expirado. Por favor ingresa tus credenciales nuevamente.');
      } else {
        setNotice('No se pudieron cargar los clientes del servidor.');
      }
    } finally {
      setIsSyncing(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem('miquipu_admin_token');
    localStorage.removeItem('miquipu_admin_user');
    setToken(null);
    setCurrentUser(null);
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    try {
      const response = await api.post('/admin/login', { username, password });
      const authToken = response.data.token || response.data.access_token || 'token_demo_admin';
      const userObj = response.data.usuario || { username, nombre: username, rol: 'ADMIN' };

      localStorage.setItem('miquipu_admin_token', authToken);
      localStorage.setItem('miquipu_admin_user', JSON.stringify(userObj));
      setToken(authToken);
      setCurrentUser(userObj);
      loadData(authToken);
    } catch (err: any) {
      setNotice(err.response?.data?.error || err.response?.data?.message || 'Credenciales administrativas inválidas.');
    }
  }

  function formatDatePeru(dateInput: Date | string): string {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  function normalizePlanKey(planStr?: string) {
    const normalized = (planStr || 'INICIA')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/^PLAN\s+/, '')
      .trim();
    if (normalized === 'INICIAL') return 'INICIA';
    return normalized;
  }

  function calcularProrrateoEntero(
    planStr?: string,
    tipoSuscripcion?: string,
    fechaCapacitacionStr?: string,
    montoMensualBase?: number
  ) {
    const monthlyBillingDay = 15;
    const monthlyPlanPrices: Record<string, number> = { INICIA: 19, EMPRENDE: 29, IMPULSA: 39, EMPRESARIAL: 59, LIDER: 89 };
    const annualPlanPrices: Record<string, number> = { INICIA: 190, EMPRENDE: 290, IMPULSA: 390, EMPRESARIAL: 590, LIDER: 890 };
    const pKey = normalizePlanKey(planStr);
    const isAnual = (tipoSuscripcion || 'MENSUAL').toUpperCase() === 'ANUAL';
    const montoPlan = montoMensualBase || (isAnual ? annualPlanPrices[pKey] : monthlyPlanPrices[pKey]) || (isAnual ? 190 : 19);

    if (isAnual) {
      return { montoProrrateado: Math.round(montoPlan), diasProrrateados: 365 };
    }

    if (!fechaCapacitacionStr) {
      return { montoProrrateado: Math.round(montoPlan), diasProrrateados: 30 };
    }

    const dCap = new Date(fechaCapacitacionStr);
    if (isNaN(dCap.getTime())) {
      return { montoProrrateado: Math.round(montoPlan), diasProrrateados: 30 };
    }

    const diaCap = dCap.getDate();
    const year = dCap.getFullYear();
    const month = dCap.getMonth();
    const billingDate = (base: Date) => {
      const y = base.getFullYear();
      const m = base.getMonth();
      const lastDay = new Date(y, m + 1, 0).getDate();
      return new Date(y, m, Math.min(monthlyBillingDay, lastDay));
    };
    let fechaFin = billingDate(dCap);
    if (dCap >= fechaFin) {
      fechaFin = billingDate(new Date(year, month + 1, 1));
    }
    const fechaInicioCiclo = billingDate(new Date(fechaFin.getFullYear(), fechaFin.getMonth() - 1, 1));
    const msDia = 24 * 60 * 60 * 1000;
    const dTotal = Math.max(1, Math.round((fechaFin.getTime() - fechaInicioCiclo.getTime()) / msDia));

    const diasUsados = Math.max(1, Math.round((fechaFin.getTime() - dCap.getTime()) / msDia));
    const montoCalculado = (montoPlan / dTotal) * diasUsados;
    return { montoProrrateado: Math.round(montoCalculado), diasProrrateados: diasUsados };
  }

  const prorrateoCalculado = useMemo(() => {
    if (!trainingClient || !trainingDateInput) return null;
    const dCap = new Date(trainingDateInput);
    if (isNaN(dCap.getTime())) return null;

    const year = dCap.getFullYear();
    const month = dCap.getMonth();
    const diaCap = dCap.getDate();
    const monthlyBillingDay = 15;
    const billingDate = (base: Date) => {
      const y = base.getFullYear();
      const m = base.getMonth();
      const lastDay = new Date(y, m + 1, 0).getDate();
      return new Date(y, m, Math.min(monthlyBillingDay, lastDay));
    };

    const isAnual = (trainingClient.tipoSuscripcion || 'MENSUAL') === 'ANUAL';
    const res = calcularProrrateoEntero(
      trainingClient.planContratado,
      trainingClient.tipoSuscripcion,
      trainingDateInput,
      trainingClient.montoMensual
    );

    let fVenc = isAnual ? new Date(dCap.getFullYear() + 1, dCap.getMonth(), dCap.getDate()) : billingDate(dCap);
    if (!isAnual && dCap >= fVenc) {
      fVenc = billingDate(new Date(year, month + 1, 1));
    }
    const fechaInicioCiclo = billingDate(new Date(fVenc.getFullYear(), fVenc.getMonth() - 1, 1));
    const dTotal = isAnual ? 365 : Math.max(1, Math.round((fVenc.getTime() - fechaInicioCiclo.getTime()) / (24 * 60 * 60 * 1000)));
    const fechaVencimientoStr = fVenc.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });

    return {
      diasTotales: dTotal,
      diaCapacitacion: diaCap,
      montoProrrateado: res.montoProrrateado,
      fechaVencimiento: fechaVencimientoStr,
      isAnual,
    };
  }, [trainingClient, trainingDateInput]);

  function getCalculatedExpirationDate(client: Client): { fechaStr: string; dateObj: Date; isExpired: boolean; daysRemaining: number } {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monthlyBillingDay = 15;
    const getBillingDate = (baseDate: Date) => {
      const year = baseDate.getFullYear();
      const month = baseDate.getMonth();
      const lastDay = new Date(year, month + 1, 0).getDate();
      return new Date(year, month, Math.min(monthlyBillingDay, lastDay));
    };
    const getNextBillingDate = (baseDate: Date) => {
      let billingDate = getBillingDate(baseDate);
      if (baseDate >= billingDate) {
        billingDate = getBillingDate(new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 1));
      }
      return billingDate;
    };

    let expDate: Date;
    if (client.fechaVencimientoMensual) {
      expDate = new Date(client.fechaVencimientoMensual);
    } else if (client.fechaCapacitacion) {
      let baseDate = new Date(client.fechaCapacitacion);
      if (isNaN(baseDate.getTime())) baseDate = new Date();

      const isAnual = (client.tipoSuscripcion || 'MENSUAL') === 'ANUAL';
      expDate = new Date(baseDate);
      if (isAnual) {
        expDate.setFullYear(expDate.getFullYear() + 1);
      } else {
        expDate = getNextBillingDate(baseDate);
      }
    } else if (client.fechaCreacion) {
      let baseDate = new Date(client.fechaCreacion);
      if (isNaN(baseDate.getTime())) baseDate = new Date();
      expDate = getNextBillingDate(baseDate);
    } else {
      expDate = new Date();
    }

    if (isNaN(expDate.getTime())) expDate = new Date();

    expDate.setHours(0, 0, 0, 0);

    const diffTime = expDate.getTime() - today.getTime();
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const isExpired = daysRemaining <= 0;

    return {
      fechaStr: expDate.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      dateObj: expDate,
      isExpired,
      daysRemaining,
    };
  }

  async function handleRegisterPayment(client: Client) {
    if (!token) return;
    const processingKey = `PAGO-${client.id}-${client.ventaId || 'SIN_VENTA'}`;
    if (processingPaymentsRef.current.has(processingKey)) return;
    processingPaymentsRef.current.add(processingKey);

    // 1. Actualización optimista instantánea a POR_CAPACITAR
    setClients((prev) =>
      prev.map((c) =>
        c.id === client.id
          ? { ...c, estadoCuenta: 'POR_CAPACITAR', estadoCapacitacion: 'PENDIENTE' }
          : c
      )
    );

    // 2. Redirección instantánea a pestaña Capacitaciones
    setActiveTab('capacitaciones');
    setNotice(`Pago verificado para ${client.razonSocial}. Se ha trasladado a la pestaña Capacitaciones.`);

    try {
      if (client.ventaId) {
        await adminApi(token).post('/admin/pagos/registrar', {
          ventaId: client.ventaId,
          codigoOperacion: `PAGO-${client.id}-${Date.now()}`,
          monto: client.montoSiguienteCobro ?? client.montoMensual,
          medioPago: 'OTRO',
          observaciones: `Pago inicial verificado desde dashboard para ${client.razonSocial}`,
        });
      } else {
        await adminApi(token).put(`/admin/clientes/${client.id}/estado?nuevoEstado=POR_CAPACITAR`);
      }
      await loadData(token);
    } catch (err: any) {
      setNotice(`Error al registrar el pago: ${err.response?.data?.message || err.message}`);
      await loadData(token);
    } finally {
      processingPaymentsRef.current.delete(processingKey);
    }
  }

  async function handleEstadoCuentaChange(client: Client, nuevoEstado: string) {
    if (!token) return;
    const processingKey = `ESTADO-${client.id}-${nuevoEstado}`;
    if (processingStateRef.current.has(processingKey)) return;
    processingStateRef.current.add(processingKey);
    try {
      if (nuevoEstado === 'BLOQUEADO') {
        await adminApi(token).put(`/admin/servicios/cliente/${client.id}/bloquear?motivo=Cliente bloqueado desde dashboard`);
      } else {
        await adminApi(token).put(`/admin/clientes/${client.id}/estado?nuevoEstado=${nuevoEstado}`);
      }
      setNotice(`Estado de cuenta de ${client.razonSocial} actualizado a ${nuevoEstado}.`);
      await loadData(token);
    } catch (err: any) {
      setNotice(`Error al actualizar estado: ${err.message}`);
      await loadData(token);
    } finally {
      processingStateRef.current.delete(processingKey);
    }
  }

  async function handleDevolverAcceso(client: Client) {
    if (!token) return;
    const processingKey = `DEVOLVER-${client.id}`;
    if (processingStateRef.current.has(processingKey)) return;
    processingStateRef.current.add(processingKey);
    try {
      await adminApi(token).put(`/admin/servicios/cliente/${client.id}/devolver-acceso`);
      setNotice(`Acceso devuelto para ${client.razonSocial}. Restaurado a estado VENCIDO.`);
      await loadData(token);
    } catch (err: any) {
      setNotice(`Error al devolver acceso: ${err.message}`);
      await loadData(token);
    } finally {
      processingStateRef.current.delete(processingKey);
    }
  }

  async function handleRenovarPlan(client: Client, nuevoPlan?: string, nuevoTipo?: string) {
    if (!token) return;
    const planAUsar = normalizePlanKey(nuevoPlan || client.planContratado || 'EMPRENDE');
    const tipoAUsar = (nuevoTipo || client.tipoSuscripcion || 'MENSUAL').toUpperCase() as 'MENSUAL' | 'ANUAL';

    const PLAN_ID_MAP: Record<string, number> = {
      INICIA: 1,
      EMPRENDE: 2,
      IMPULSA: 3,
      EMPRESARIAL: 4,
      LIDER: 5,
    };

    const planId = PLAN_ID_MAP[planAUsar] || PLAN_ID_MAP.EMPRENDE;

    const isCambio = nuevoPlan && normalizePlanKey(nuevoPlan) !== normalizePlanKey(client.planContratado);
    const tipoVenta = isCambio ? 'CAMBIO_PLAN' : 'RENOVACION';
    const processingKey = `${client.id}-${tipoVenta}-${planId}-${tipoAUsar}`;
    if (processingOperationsRef.current.has(processingKey)) return;
    processingOperationsRef.current.add(processingKey);

    try {
      await adminApi(token).post(`/admin/ventas/procesar-operacion`, {
        clienteId: client.id,
        planId,
        tipoSuscripcion: tipoAUsar,
        tipoVenta: tipoVenta,
        observaciones: `Operación de ${tipoVenta}: ${planAUsar} (${tipoAUsar})`,
      });

      setNotice(`Operación procesada con éxito para ${client.razonSocial} (${planAUsar} - ${tipoAUsar}).`);
      await loadData(token);
    } catch (err: any) {
      setNotice(`Error al procesar la venta: ${err.response?.data?.message || err.message}`);
      await loadData(token);
    } finally {
      processingOperationsRef.current.delete(processingKey);
    }
  }

  async function handleDeleteClientConfirm() {
    if (!deletingClient || !token) return;
    const idToDelete = deletingClient.id;
    setClients((prev) => prev.filter((c) => c.id !== idToDelete));
    setDeletingClient(null);

    try {
      await adminApi(token).delete(`/admin/clientes/${idToDelete}`);
      setNotice(`El cliente ha sido eliminado permanentemente.`);
      await loadData(token);
    } catch (err: any) {
      setNotice(`Error al eliminar cliente: ${err.message}`);
    }
  }

  async function handleSaveEditClient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingClient || !token) return;

    const formData = new FormData(event.currentTarget);
    const selectedVendedor = formData.get('vendedor') as string;
    let foundVendedorId: string | number | null = null;
    if (selectedVendedor && selectedVendedor !== 'Por asignar') {
      const u = usersList.find((usr) => usr.nombre === selectedVendedor || usr.username === selectedVendedor);
      if (u) foundVendedorId = u.id;
      if (!u && selectedVendedor !== editingClient.vendedor) {
        setNotice(`No se encontró el vendedor "${selectedVendedor}" en usuarios activos.`);
        return;
      }
    }

    const apiPayload = {
      ruc: formData.get('ruc') as string,
      razonSocial: formData.get('razonSocial') as string,
      nombreComercial: formData.get('nombreComercial') as string,
      direccion: formData.get('direccion') as string,
      telefono: formData.get('telefono') as string,
      email: formData.get('email') as string,
      nombres: formData.get('nombres') as string,
      apellidos: formData.get('apellidos') as string,
      dni: formData.get('dni') as string,
      emailPersonal: formData.get('emailPersonal') as string,
      telefonoPersonal: formData.get('telefonoPersonal') as string,
      departamento: formData.get('departamento') as string,
      provincia: formData.get('provincia') as string,
      distrito: formData.get('distrito') as string,
      usuarioSol: formData.get('usuarioSol') as string,
      claveSol: formData.get('claveSol') as string,
      usuarioAdminFacturador: formData.get('usuarioSistema') as string,
      claveTemporal: formData.get('claveSistema') as string,
      urlAcceso: formData.get('linkSistema') as string,
      vendedorId: foundVendedorId,
    };

    setClients((prev) =>
      prev.map((c) => (c.id === editingClient.id ? { ...c, ...apiPayload, vendedor: selectedVendedor || c.vendedor } : c))
    );
    setEditingClient(null);

    try {
      await adminApi(token).put(`/admin/clientes/${editingClient.id}`, apiPayload);
      if (foundVendedorId) {
        await adminApi(token).request({
          method: 'PUT',
          url: `/admin/clientes/${editingClient.id}/vendedor?vendedorId=${foundVendedorId}`,
        });
      }
      setNotice(`Los datos de ${editingClient.razonSocial} se han actualizado correctamente.`);
      await loadData(token);
    } catch (err: any) {
      setNotice(`Error al actualizar el cliente: ${err.response?.data?.message || err.message}`);
    }
  }

  async function handleSaveTrainingSchedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!trainingClient || !token || !trainingDateInput) return;

    const targetId = trainingClient.id;
    const dateVal = trainingDateInput;
    const fechaCapacitacion = dateVal.includes('T')
      ? (dateVal.length === 16 ? `${dateVal}:00` : dateVal)
      : `${dateVal}T12:00:00`;

    // Actualización instantánea en pantalla
    setClients((prev) =>
      prev.map((c) =>
        c.id === targetId
          ? {
              ...c,
              fechaCapacitacion: dateVal,
              estadoCapacitacion: 'COMPLETADA',
              estadoCuenta: 'HABILITADO',
            }
          : c
      )
    );

    setTrainingClient(null);
    setTrainingDateInput('');

    try {
      await adminApi(token).post(`/admin/servicios/capacitar/${targetId}`, {
        fechaCapacitacion,
      });

      setNotice(`Capacitación guardada con éxito. El plan y el prorrateo han iniciado desde la fecha asignada.`);
      await loadData(token);
    } catch (err: any) {
      setNotice(`Error al programar capacitación: ${err.response?.data?.message || err.response?.data?.error || err.message}`);
      await loadData(token);
    }
  }

  async function handleAssignVendedor(client: Client, nuevoVendedor: string) {
    if (!token) return;
    const foundUser = usersList.find((u) => u.nombre === nuevoVendedor || u.username === nuevoVendedor);
    if (!foundUser) {
      setNotice(`No se encontró el vendedor "${nuevoVendedor}" en usuarios activos.`);
      return;
    }
    const vendedorId = foundUser.id;

    // Optimista
    setClients((prev) =>
      prev.map((c) => (c.id === client.id ? { ...c, vendedor: nuevoVendedor } : c))
    );

    try {
      await adminApi(token).request({
        method: 'PUT',
        url: `/admin/clientes/${client.id}/vendedor?vendedorId=${vendedorId}`,
      });
      setNotice(`Vendedor asignado (${nuevoVendedor}) a ${client.razonSocial}.`);
      await loadData(token);
    } catch (err: any) {
      setNotice(`Error al asignar vendedor: ${err.response?.data?.message || err.response?.data?.error || err.message}`);
      await loadData(token);
    }
  }

  async function handleColorTagChange(client: Client, nuevoColor: ColorTagType) {
    if (!token) return;
    const colorMap: Record<string, number> = { VERDE: 1, AMARILLO: 2, ROJO: 3, AZUL: 4 };
    const colorId = colorMap[nuevoColor] || 1;

    // Optimista
    setClients((prev) =>
      prev.map((c) => (c.id === client.id ? { ...c, colorTag: nuevoColor } : c))
    );

    try {
      await adminApi(token).request({
        method: 'PUT',
        url: `/admin/clientes/${client.id}/color-tag?colorTagId=${colorId}`,
      });
      setNotice(`Etiqueta de color cambiada a ${nuevoColor} para ${client.razonSocial}.`);
      loadData(token);
    } catch (err: any) {
      setNotice(`Error al cambiar etiqueta de color: ${err.message}`);
    }
  }

  async function handleSaveUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    const formData = new FormData(event.currentTarget);
    const payload = {
      nombre: formData.get('nombre') as string,
      username: formData.get('username') as string,
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      rol: formData.get('rol') as string,
    };

    try {
      if (editingUser) {
        await adminApi(token).put(`/admin/usuarios/${editingUser.id}`, payload);
        setNotice(`Usuario ${editingUser.username} actualizado con éxito.`);
      } else {
        await adminApi(token).post('/admin/usuarios', payload);
        setNotice(`Nuevo vendedor/usuario (${payload.nombre}) registrado correctamente.`);
      }
      setEditingUser(null);
      setShowNewUserModal(false);
      loadData(token);
    } catch (err: any) {
      setNotice(`Error en la gestión de usuario: ${err.response?.data?.error || err.message}`);
    }
  }

  async function handleDeleteUser(user: UserAccount) {
    if (!token) return;
    if (!confirm(`¿Eliminar definitivamente al usuario ${user.nombre} (${user.username})?`)) return;
    try {
      await adminApi(token).delete(`/admin/usuarios/${user.id}`);
      setNotice(`Usuario ${user.nombre} eliminado del sistema.`);
      loadData(token);
    } catch (err: any) {
      setNotice(`Error al eliminar usuario: ${err.message}`);
    }
  }

  async function handleMarkNotificationAsRead(notificationId: string | number) {
    if (!token || !notificationId) return;
    setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, leida: true } : n)));
    try {
      await adminApi(token).put(`/admin/notificaciones/${notificationId}/leida`);
    } catch (err) {
      await loadData(token);
    }
  }

  const safeClients = useMemo(() => (Array.isArray(clients) ? clients : []), [clients]);
  const safeUsersList = useMemo(() => (Array.isArray(usersList) ? usersList : []), [usersList]);
  const safePayments = useMemo(() => (Array.isArray(payments) ? payments : []), [payments]);

  const totalCobradoDia = useMemo(() => {
    const now = new Date();
    const todayLocalStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    let sum = 0;
    const countedPaymentIds = new Set<string>();

    safePayments.forEach((p) => {
      const estadoPago = (p.estadoPago || '').toUpperCase();
      const estadoVenta = (p.venta?.estadoVenta || p.estadoVenta || '').toUpperCase();
      const paymentKey = String(p.venta?.id || p.ventaId || p.id || p.codigoOperacion || `${p.fechaPago || p.fechaRegistro}-${p.monto}`);
      if (estadoPago === 'PAGADO' && estadoVenta !== 'CANCELADA' && !countedPaymentIds.has(paymentKey) && p.fechaPago) {
        const pDate = new Date(p.fechaPago);
        if (!isNaN(pDate.getTime())) {
          const payStr = `${pDate.getFullYear()}-${String(pDate.getMonth() + 1).padStart(2, '0')}-${String(pDate.getDate()).padStart(2, '0')}`;
          if (payStr === todayLocalStr) {
            countedPaymentIds.add(paymentKey);
            sum += Number(p.monto) || 0;
          }
        }
      }
    });

    return sum;
  }, [safePayments]);

  const uniqueSellers = useMemo(() => {
    const s = new Set<string>();
    safeClients.forEach((c) => {
      if (c.vendedor && c.vendedor !== 'Sin Asignar') s.add(c.vendedor);
    });
    safeUsersList.forEach((u) => {
      if (u.nombre) s.add(u.nombre);
    });
    return Array.from(s);
  }, [safeClients, safeUsersList]);

  function filterClientUnified(c: Client): boolean {
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchRuc = c.ruc?.toLowerCase().includes(q);
      const matchRazon = c.razonSocial?.toLowerCase().includes(q);
      const matchComercial = c.nombreComercial?.toLowerCase().includes(q);
      const matchDni = c.dni?.toLowerCase().includes(q);
      const matchTel = c.telefono?.toLowerCase().includes(q);
      const matchTelPers = c.telefonoPersonal?.toLowerCase().includes(q);
      const matchEmail = c.email?.toLowerCase().includes(q);
      const matchVendedor = c.vendedor?.toLowerCase().includes(q);
      if (!matchRuc && !matchRazon && !matchComercial && !matchDni && !matchTel && !matchTelPers && !matchEmail && !matchVendedor) {
        return false;
      }
    }

    if (regimenFilter && c.regimenTributario !== regimenFilter) return false;

    if (planFilter) {
      if (normalizePlanKey(c.planContratado) !== normalizePlanKey(planFilter)) return false;
    }

    if (suscripcionFilter && suscripcionFilter !== 'TODOS') {
      if ((c.tipoSuscripcion || 'MENSUAL').toUpperCase() !== suscripcionFilter.toUpperCase()) return false;
    }

    if (colorFilter && (c.colorTag || 'VERDE').toUpperCase() !== colorFilter.toUpperCase()) return false;

    if (capacitacionFilter) {
      const isCap = Boolean(c.fechaCapacitacion || c.estadoCapacitacion === 'COMPLETADO' || c.estadoCapacitacion === 'COMPLETADA');
      if (capacitacionFilter === 'REALIZADA' && !isCap) return false;
      if (capacitacionFilter === 'PENDIENTE' && isCap) return false;
    }

    if (estadoCuentaFilter && c.estadoCuenta !== estadoCuentaFilter) return false;

    if (sellerFilter && (c.vendedor || 'Por asignar') !== sellerFilter) return false;

    if (periodoIngresoTipo && periodoIngresoTipo !== 'TODOS') {
      const rawDate = c.fechaRegistro || c.fechaCreacion;
      if (rawDate) {
        const cDate = new Date(rawDate);
        if (!isNaN(cDate.getTime())) {
          const now = new Date();
          const regLocalStr = `${cDate.getFullYear()}-${String(cDate.getMonth() + 1).padStart(2, '0')}-${String(cDate.getDate()).padStart(2, '0')}`;
          const todayLocalStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

          if (periodoIngresoTipo === 'HOY' || periodoIngresoTipo === 'DIA') {
            if (regLocalStr !== todayLocalStr) return false;
          } else if (periodoIngresoTipo === 'MES_ACTUAL' || periodoIngresoTipo === 'MES') {
            if (cDate.getMonth() !== now.getMonth() || cDate.getFullYear() !== now.getFullYear()) return false;
          } else if (periodoIngresoTipo === 'ANO_ACTUAL' || periodoIngresoTipo === 'ANO') {
            if (cDate.getFullYear() !== now.getFullYear()) return false;
          } else if (periodoIngresoTipo === 'FECHA_CUSTOM' || periodoIngresoTipo === 'CUSTOM') {
            if (fechaCustomFilter && regLocalStr !== fechaCustomFilter) return false;
          }
        }
      }
    }

    return true;
  }

  const effectiveClients = useMemo(() => {
    return safeClients.map((c) => {
      const exp = getCalculatedExpirationDate(c);
      if (exp.isExpired && c.estadoCuenta === 'HABILITADO') {
        return { ...c, estadoCuenta: 'VENCIDO' };
      }
      return c;
    });
  }, [safeClients]);

  const allFilteredClients = useMemo(() => {
    return effectiveClients.filter(filterClientUnified);
  }, [effectiveClients, search, regimenFilter, planFilter, suscripcionFilter, colorFilter, capacitacionFilter, estadoCuentaFilter, sellerFilter, periodoIngresoTipo, fechaCustomFilter]);

  const clientesActivos = useMemo(() => {
    return effectiveClients.filter((c) => c.estadoCuenta === 'HABILITADO').length;
  }, [effectiveClients]);

  const clientesPorCobrarList = useMemo(() => {
    return effectiveClients.filter((c) => c.estadoCuenta === 'POR_COBRAR');
  }, [effectiveClients]);

  const clientesVencidosList = useMemo(() => {
    return effectiveClients.filter((c) => {
      const exp = getCalculatedExpirationDate(c);
      return c.estadoCuenta !== 'BLOQUEADO' && (exp.isExpired || c.estadoCuenta === 'VENCIDO');
    });
  }, [effectiveClients]);

  const clientesBloqueadosList = useMemo(() => {
    return effectiveClients.filter((c) => c.estadoCuenta === 'BLOQUEADO');
  }, [effectiveClients]);

  const clientesCapacitacionPendienteList = useMemo(() => {
    return effectiveClients.filter((c) => {
      const estado = (c.estadoCuenta || '').toUpperCase();
      const capacitacionPendiente = c.estadoCapacitacion === 'PENDIENTE' || !c.fechaCapacitacion;
      return estado === 'POR_CAPACITAR' && capacitacionPendiente;
    });
  }, [effectiveClients]);

  const clientesPorVencer1DiaList = useMemo(() => {
    return effectiveClients.filter((c) => {
      const exp = getCalculatedExpirationDate(c);
      return exp.daysRemaining === 1 && c.estadoCuenta === 'HABILITADO';
    });
  }, [effectiveClients]);

  return {
    token,
    currentUser,
    activeTab,
    setActiveTab,
    notice,
    setNotice,
    isSyncing,
    loadData,
    handleLogin,
    handleLogout,
    clients: effectiveClients,
    payments,
    notifications,
    usersList,
    search,
    setSearch,
    regimenFilter,
    setRegimenFilter,
    planFilter,
    setPlanFilter,
    suscripcionFilter,
    setSuscripcionFilter,
    colorFilter,
    setColorFilter,
    capacitacionFilter,
    setCapacitacionFilter,
    estadoCuentaFilter,
    setEstadoCuentaFilter,
    sellerFilter,
    setSellerFilter,
    periodoIngresoTipo,
    setPeriodoIngresoTipo,
    fechaCustomFilter,
    setFechaCustomFilter,
    showSolKeys,
    setShowSolKeys,
    editingClient,
    setEditingClient,
    deletingClient,
    setDeletingClient,
    cambioPlanClient,
    setCambioPlanClient,
    cambioPlanSeleccionado,
    setCambioPlanSeleccionado,
    cambioPlanTipo,
    setCambioPlanTipo,
    trainingClient,
    setTrainingClient,
    trainingDateInput,
    setTrainingDateInput,
    historyClient,
    setHistoryClient,
    editingUser,
    setEditingUser,
    showNewUserModal,
    setShowNewUserModal,
    calendarSearch,
    setCalendarSearch,
    showNotificationsDropdown,
    setShowNotificationsDropdown,
    showProfileDropdown,
    setShowProfileDropdown,
    handleRegisterPayment,
    handleEstadoCuentaChange,
    handleDevolverAcceso,
    handleRenovarPlan,
    handleDeleteClientConfirm,
    handleSaveEditClient,
    handleSaveTrainingSchedule,
    handleAssignVendedor,
    handleColorTagChange,
    handleSaveUser,
    handleDeleteUser,
    handleMarkNotificationAsRead,
    uniqueSellers,
    allFilteredClients,
    filterClientUnified,
    totalCobradoDia,
    clientesActivos,
    clientesPorCobrarList,
    clientesVencidosList,
    clientesBloqueadosList,
    clientesCapacitacionPendienteList,
    clientesPorVencer1DiaList,
    prorrateoCalculado,
    calcularProrrateoEntero,
    formatDatePeru,
  };
}
