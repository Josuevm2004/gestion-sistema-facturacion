'use client';

import { FormEvent, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { adminApi, api } from '@/lib/api';
import { MONTHLY_BILLING_DAY, parseLocalDate, formatDatePeru as libFormatDatePeru, getTodayLocalMidnight, getDiffDays } from '@/lib/billing';
import { Client, ColorTagType, SubscriptionType } from '../components/ClientesTodosTab';
import { UserAccount } from '../components/VendedoresTab';

function extractArray(resData: any): any[] {
  if (Array.isArray(resData)) return resData;
  if (resData && Array.isArray(resData.data)) return resData.data;
  return [];
}

function resolverPlanIdDesdeNombre(planNombre?: string): number {
  if (!planNombre) return 1;
  const norm = planNombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/^PLAN\s+/, '')
    .trim();
  if (norm === 'EMPRENDE') return 2;
  if (norm === 'IMPULSA') return 3;
  if (norm === 'EMPRESARIAL') return 4;
  if (norm === 'LIDER') return 5;
  if (norm === 'INICIAL' || norm === 'INICIA') return 1;
  return 1;
}

function normalizeClientData(c: any): Client {
  return {
    // Cockroach unique_rowid() supera el limite seguro de Number en JS.
    // Mantener los IDs como texto evita que PUT/GET apunten a otro cliente.
    id: String(c.id),
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
    usuarioWsp: c.usuarioWsp || '',
    departamento: c.departamento || '',
    provincia: c.provincia || '',
    distrito: c.distrito || '',
    regimenTributario: c.regimenTributario || 'GENERAL',
    planContratado: c.planNombre || c.planContratado || '',
    planId: c.planId !== undefined && c.planId !== null ? String(c.planId) : String(resolverPlanIdDesdeNombre(c.planNombre || c.planContratado)),
    tipoSuscripcion: c.tipoSuscripcion || '',
    montoMensual: c.precioPlan !== undefined && c.precioPlan !== null ? c.precioPlan : (c.montoMensual ?? 0),
    montoSiguienteCobro: c.montoSiguienteCobro !== undefined && c.montoSiguienteCobro !== null ? Number(c.montoSiguienteCobro) : undefined,
    ventaId: c.ventaId !== undefined && c.ventaId !== null ? String(c.ventaId) : undefined,
    diasProrrateados: c.diasProrrateados,
    tipoProrrateo: c.tipoProrrateo || 'NINGUNO',
    montoProrrateoAdicional: c.montoProrrateoAdicional,
    diasProrrateoAdicional: c.diasProrrateoAdicional,
    fechaInicioProrrateoAdicional: c.fechaInicioProrrateoAdicional,
    fechaFinProrrateoAdicional: c.fechaFinProrrateoAdicional,
    estadoCuenta: c.estadoNombre || c.estadoCuenta || 'SIN_ESTADO',
    estadoCapacitacion: c.fechaCapacitacion ? 'COMPLETADO' : (c.estadoNombre === 'POR_CAPACITAR' ? 'PENDIENTE' : 'PENDIENTE'),
    colorTag: (c.colorCodigo || c.colorTag || 'VERDE') as ColorTagType,
    avisado: Boolean(c.avisado),
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
    entornoId: c.entornoId !== undefined && c.entornoId !== null ? String(c.entornoId) : undefined,
    entornoNombre: c.entornoNombre || '',
  };
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
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [entornos, setEntornos] = useState<Array<{ id: string | number; nombre: string }>>([]);
  const loadDataInFlightRef = useRef(false);
  const recoveryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recoveryAttemptsRef = useRef(0);
  const processingPaymentsRef = useRef<Set<string>>(new Set());
  const processingOperationsRef = useRef<Set<string>>(new Set());
  const processingStateRef = useRef<Set<string>>(new Set());
  const pendingOverridesRef = useRef<Map<string, { data: Partial<Client>; timestamp: number }>>(new Map());
  const deletedClientIdsRef = useRef<Set<string>>(new Set());
  const deletedUserIdsRef = useRef<Set<string>>(new Set());
  const readNotificationIdsRef = useRef<Set<string>>(new Set());
  const lastSyncTimeRef = useRef<number>(Date.now());

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
  const deferredSearch = useDeferredValue(search);

  // Modales
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);
  const [cambioPlanClient, setCambioPlanClient] = useState<Client | null>(null);
  const [cambioPlanSeleccionado, setCambioPlanSeleccionado] = useState<string>('INICIA');
  const [cambioPlanTipo, setCambioPlanTipo] = useState<string>('MENSUAL');
  const [mejoraPlanClient, setMejoraPlanClient] = useState<Client | null>(null);
  const [mejoraPlanSeleccionado, setMejoraPlanSeleccionado] = useState<string>('EMPRENDE');

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

      // Auto-sincronización periódica rápida y ligera cada 8 segundos (detecta nuevos registros automáticamente)
      const intervalId = setInterval(() => {
        loadData(savedToken);
      }, 8000);

      // Escuchar cuando el usuario vuelve a la pestaña del navegador para refrescar al instante
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          const now = Date.now();
          if (now - lastSyncTimeRef.current > 3000) {
            loadData(savedToken);
          }
        }
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);

      // Escuchar eventos en tiempo real entre pestañas (ej. nuevo registro en el formulario público)
      let bc: BroadcastChannel | null = null;
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        bc = new BroadcastChannel('miquipu_events');
        bc.onmessage = (event) => {
          if (event.data?.type === 'NEW_CLIENT_REGISTERED' || event.data?.type === 'USER_UPDATED' || event.data?.type === 'DATA_CHANGED') {
            loadData(savedToken);
          }
        };
      }

      const handleStorage = (e: StorageEvent) => {
        if (e.key === 'miquipu_last_registration' || e.key === 'miquipu_sync_trigger') {
          loadData(savedToken);
        }
      };
      window.addEventListener('storage', handleStorage);

      return () => {
        clearInterval(intervalId);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('storage', handleStorage);
        if (bc) bc.close();
      };
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
    if (loadDataInFlightRef.current) return;
    loadDataInFlightRef.current = true;
    lastSyncTimeRef.current = Date.now();
    if (showSyncMsg) setIsSyncing(true);
    try {
      const clientApi = adminApi(tokenToUse);
      const normalizeAndSetClients = (rawClients: any[]) => {
        const normalized = rawClients
          .filter((c) => !deletedClientIdsRef.current.has(String(c?.id)))
          .map(normalizeClientData);
        setClients(
          normalized.map((freshClient) => {
            const override = pendingOverridesRef.current.get(String(freshClient.id));
            if (override && Date.now() - override.timestamp < 15000) {
              return { ...freshClient, ...override.data };
            }
            return freshClient;
          })
        );
      };

      // 1. Carga prioritaria de clientes (renderizado instantáneo de la tabla principal)
      const clientPromise = clientApi.get('/admin/clientes').then((res) => {
        const rawClients = extractArray(res.data);
        normalizeAndSetClients(rawClients);
        return res;
      });

      // 2. Carga en paralelo de recursos secundarios sin bloquear la interfaz
      const secondaryPromises = Promise.allSettled([
        clientApi.get('/admin/pagos').then((res) => setPayments(extractArray(res.data))),
        clientApi.get('/admin/usuarios').then((res) => {
          setUsersList(extractArray(res.data).filter((u) => !deletedUserIdsRef.current.has(String(u?.id))));
        }),
        clientApi.get('/admin/notificaciones').then((res) => {
          setNotifications(
            extractArray(res.data).map((n) =>
              readNotificationIdsRef.current.has(String(n?.id)) ? { ...n, leida: true } : n
            )
          );
        }),
        clientApi.get('/admin/planes/suscripciones').then((res) => setSubscriptions(extractArray(res.data))),
        clientApi.get('/admin/entornos').then((res) => setEntornos(extractArray(res.data))),
      ]);

      if (showSyncMsg) {
        try {
          await clientApi.post('/admin/servicios/revisar-vencimientos');
        } catch (re) {
          console.warn('No se pudo revisar vencimientos manualmente', re);
        }
      }

      await clientPromise;
      void secondaryPromises;
      recoveryAttemptsRef.current = 0;

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
        if (!recoveryTimerRef.current && recoveryAttemptsRef.current < 3) {
          recoveryAttemptsRef.current += 1;
          recoveryTimerRef.current = setTimeout(() => {
            recoveryTimerRef.current = null;
            void loadData(tokenToUse);
          }, 5000);
        }
      }
    } finally {
      setIsSyncing(false);
      loadDataInFlightRef.current = false;
    }
  }

  function handleLogout() {
    localStorage.removeItem('miquipu_admin_token');
    localStorage.removeItem('miquipu_admin_user');
    setToken(null);
    setCurrentUser(null);
  }

  async function loadClientsOnly(authToken?: string | null) {
    const tokenToUse = authToken || token;
    if (!tokenToUse) return;
    try {
      const response = await adminApi(tokenToUse).get('/admin/clientes');
      const rawClients = extractArray(response.data);
      const normalized = rawClients
        .filter((c) => !deletedClientIdsRef.current.has(String(c?.id)))
        .map(normalizeClientData);
      setClients(
        normalized.map((freshClient) => {
          const override = pendingOverridesRef.current.get(String(freshClient.id));
          if (override && Date.now() - override.timestamp < 15000) {
            return { ...freshClient, ...override.data };
          }
          return freshClient;
        })
      );
    } catch (e) {}
  }

  async function loadPaymentsOnly(authToken?: string | null) {
    const tokenToUse = authToken || token;
    if (!tokenToUse) return;
    try {
      const response = await adminApi(tokenToUse).get('/admin/pagos');
      setPayments(extractArray(response.data));
    } catch (e) {}
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    try {
      const response = await api.post('/admin/login', { username, password });
      const responseBody = response.data ?? {};
      const authData = responseBody.data ?? responseBody;
      const authToken = authData.token || authData.access_token;
      if (!authToken) {
        throw new Error('El servidor no devolvió token de acceso.');
      }
      const userObj = authData.usuario || authData.user || {
        username: authData.username || username,
        nombre: authData.nombre || authData.username || username,
        rol: authData.rol || 'ADMIN',
      };

      localStorage.setItem('miquipu_admin_token', authToken);
      localStorage.setItem('miquipu_admin_user', JSON.stringify(userObj));
      setToken(authToken);
      setCurrentUser(userObj);
      loadData(authToken);
    } catch (err: any) {
      setNotice(err.response?.data?.error || err.response?.data?.message || 'Credenciales administrativas inválidas.');
    }
  }

  async function loadSubscriptions() {
    if (!token) return;
    try {
      const response = await adminApi(token).get('/admin/planes/suscripciones');
      setSubscriptions(extractArray(response.data));
    } catch (err) {
      console.warn('No se pudieron cargar las tarifas de planes', err);
    }
  }

  function formatDatePeru(dateInput: Date | string): string {
    return libFormatDatePeru(dateInput);
  }

  function normalizePlanKey(planStr?: string) {
    const normalized = (planStr || '')
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
    const monthlyBillingDay = MONTHLY_BILLING_DAY;
    const isAnual = (tipoSuscripcion || 'MENSUAL').toUpperCase() === 'ANUAL';
    const montoPlan = Number(montoMensualBase || 0);

    if (!montoPlan) {
      return { montoProrrateado: 0, diasProrrateados: 0 };
    }

    if (isAnual) {
      return { montoProrrateado: Math.round(montoPlan), diasProrrateados: 365, tipoProrrateo: 'NINGUNO' };
    }

    if (!fechaCapacitacionStr) {
      return { montoProrrateado: Math.round(montoPlan), diasProrrateados: 30, tipoProrrateo: 'PRIMER_PRORRATEO' };
    }

    const dCap = new Date(fechaCapacitacionStr);
    if (isNaN(dCap.getTime())) {
      return { montoProrrateado: Math.round(montoPlan), diasProrrateados: 30, tipoProrrateo: 'PRIMER_PRORRATEO' };
    }

    const diaCap = dCap.getDate();
    const year = dCap.getFullYear();
    const month = dCap.getMonth();

    if (diaCap >= 10) {
      const nextMonthLastDay = new Date(year, month + 2, 0).getDate();
      const fechaInicioAdicional = new Date(year, month + 1, Math.min(diaCap, nextMonthLastDay), 12);
      const fechaFinAdicional = new Date(
        fechaInicioAdicional.getFullYear(),
        fechaInicioAdicional.getMonth() + 1,
        0,
        12
      );
      const fechaFinExclusiva = new Date(
        fechaFinAdicional.getFullYear(),
        fechaFinAdicional.getMonth(),
        fechaFinAdicional.getDate() + 1,
        12
      );
      const msDia = 24 * 60 * 60 * 1000;
      const diasAdicionales = Math.max(
        0,
        Math.round((fechaFinExclusiva.getTime() - fechaInicioAdicional.getTime()) / msDia)
      );
      const montoAdicional = Number(
        ((montoPlan / nextMonthLastDay) * diasAdicionales).toFixed(2)
      );
      return {
        montoProrrateado: Number((montoPlan + montoAdicional).toFixed(2)),
        montoProrrateoAdicional: montoAdicional,
        diasProrrateados: diasAdicionales,
        diasProrrateoAdicional: diasAdicionales,
        fechaInicioProrrateoAdicional: fechaInicioAdicional.toISOString(),
        fechaFinProrrateoAdicional: fechaFinAdicional.toISOString(),
        tipoProrrateo: 'SEGUNDO_PRORRATEO',
      };
    }

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
    return { montoProrrateado: Math.round(montoCalculado), diasProrrateados: diasUsados, tipoProrrateo: 'PRIMER_PRORRATEO' };
  }

  const prorrateoCalculado = useMemo(() => {
    if (!trainingClient || !trainingDateInput) return null;
    const dCap = new Date(trainingDateInput);
    if (isNaN(dCap.getTime())) return null;

    const year = dCap.getFullYear();
    const month = dCap.getMonth();
    const diaCap = dCap.getDate();
    const monthlyBillingDay = MONTHLY_BILLING_DAY;
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

    let fVenc: Date;
    if (isAnual) {
      fVenc = new Date(dCap.getFullYear() + 1, dCap.getMonth(), dCap.getDate());
    } else if (res.tipoProrrateo === 'SEGUNDO_PRORRATEO' && res.fechaFinProrrateoAdicional) {
      const dFin = new Date(res.fechaFinProrrateoAdicional);
      fVenc = new Date(dFin.getFullYear(), dFin.getMonth(), dFin.getDate() + 1);
    } else {
      fVenc = billingDate(dCap);
      if (dCap >= fVenc) {
        fVenc = billingDate(new Date(year, month + 1, 1));
      }
    }
    const fechaInicioCiclo = billingDate(new Date(fVenc.getFullYear(), fVenc.getMonth() - 1, 1));
    const dTotal = isAnual ? 365 : Math.max(1, Math.round((fVenc.getTime() - fechaInicioCiclo.getTime()) / (24 * 60 * 60 * 1000)));
    const fechaVencimientoStr = fVenc.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });

    return {
      diasTotales: dTotal,
      diaCapacitacion: diaCap,
      montoProrrateado: res.montoProrrateado,
      montoProrrateoAdicional: res.montoProrrateoAdicional || 0,
      diasProrrateoAdicional: res.diasProrrateoAdicional || 0,
      fechaInicioProrrateoAdicional: res.fechaInicioProrrateoAdicional,
      fechaFinProrrateoAdicional: res.fechaFinProrrateoAdicional,
      tipoProrrateo: res.tipoProrrateo || (isAnual ? 'NINGUNO' : 'PRIMER_PRORRATEO'),
      fechaVencimiento: fechaVencimientoStr,
      isAnual,
    };
  }, [trainingClient, trainingDateInput]);

  function getCalculatedExpirationDate(client: Client): { fechaStr: string; dateObj: Date; isExpired: boolean; daysRemaining: number } {
    const today = getTodayLocalMidnight();
    const monthlyBillingDay = MONTHLY_BILLING_DAY;
    const getBillingDate = (baseDate: Date) => {
      const year = baseDate.getFullYear();
      const month = baseDate.getMonth();
      const lastDay = new Date(year, month + 1, 0).getDate();
      return new Date(year, month, Math.min(monthlyBillingDay, lastDay), 0, 0, 0, 0);
    };
    const getNextBillingDate = (baseDate: Date) => {
      let billingDate = getBillingDate(baseDate);
      if (baseDate >= billingDate) {
        billingDate = getBillingDate(new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 1, 0, 0, 0, 0));
      }
      return billingDate;
    };

    let expDate: Date | null = null;
    if (client.fechaVencimientoMensual) {
      expDate = parseLocalDate(client.fechaVencimientoMensual);
    } else if (client.fechaCapacitacion) {
      const baseDate = parseLocalDate(client.fechaCapacitacion) || getTodayLocalMidnight();
      const isAnual = (client.tipoSuscripcion || 'MENSUAL').toUpperCase() === 'ANUAL';
      expDate = new Date(baseDate);
      if (isAnual) {
        expDate.setFullYear(expDate.getFullYear() + 1);
      } else {
        expDate = getNextBillingDate(baseDate);
      }
    } else if (client.fechaCreacion) {
      const baseDate = parseLocalDate(client.fechaCreacion) || getTodayLocalMidnight();
      expDate = getNextBillingDate(baseDate);
    }

    if (!expDate || isNaN(expDate.getTime())) {
      return {
        fechaStr: 'Sin fecha',
        dateObj: new Date(''),
        isExpired: false,
        daysRemaining: 9999,
      };
    }

    expDate.setHours(0, 0, 0, 0);

    const diffTime = expDate.getTime() - today.getTime();
    const daysRemaining = Math.round(diffTime / (1000 * 60 * 60 * 24));
    const isExpired = daysRemaining <= 0;

    return {
      fechaStr: libFormatDatePeru(expDate),
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

    const clientIdStr = String(client.id);
    pendingOverridesRef.current.set(clientIdStr, {
      data: { estadoCuenta: 'POR_CAPACITAR', estadoCapacitacion: 'PENDIENTE' },
      timestamp: Date.now(),
    });

    // 1. Actualización optimista instantánea a POR_CAPACITAR
    setClients((prev) =>
      prev.map((c) =>
        String(c.id) === clientIdStr
          ? { ...c, estadoCuenta: 'POR_CAPACITAR', estadoCapacitacion: 'PENDIENTE' }
          : c
      )
    );

    // 2. Redirección instantánea a pestaña Capacitaciones
    setActiveTab('capacitaciones');
    setNotice(`Pago verificado para ${client.razonSocial}. Se ha trasladado a la pestaña Capacitaciones.`);

    try {
      if (client.ventaId) {
        const paymentResponse = await adminApi(token).post('/admin/pagos/registrar', {
          ventaId: client.ventaId,
          codigoOperacion: `PAGO-${client.id}-${Date.now()}`,
          monto: client.montoSiguienteCobro ?? client.montoMensual,
          medioPago: 'OTRO',
          observaciones: `Pago inicial verificado desde dashboard para ${client.razonSocial}`,
        });
        const registeredPayment = paymentResponse.data?.data;
        if (registeredPayment) {
          setPayments((prev) => [
            registeredPayment,
            ...prev.filter((payment) => String(payment.id ?? payment.pagoId) !== String(registeredPayment.id ?? registeredPayment.pagoId)),
          ]);
        }
      } else {
        await adminApi(token).put(`/admin/clientes/${client.id}/estado?nuevoEstado=POR_CAPACITAR`);
      }
    } catch (err: any) {
      pendingOverridesRef.current.delete(clientIdStr);
      setNotice(`Error al registrar el pago: ${err.response?.data?.message || err.message}`);
      void loadClientsOnly(token).catch(() => undefined);
    } finally {
      processingPaymentsRef.current.delete(processingKey);
    }
  }

  async function handleEstadoCuentaChange(client: Client, nuevoEstado: string) {
    if (!token) return;
    const processingKey = `ESTADO-${client.id}-${nuevoEstado}`;
    if (processingStateRef.current.has(processingKey)) return;
    processingStateRef.current.add(processingKey);

    const clientIdStr = String(client.id);
    pendingOverridesRef.current.set(clientIdStr, {
      data: { estadoCuenta: nuevoEstado },
      timestamp: Date.now(),
    });

    setClients((prev) =>
      prev.map((c) => (String(c.id) === clientIdStr ? { ...c, estadoCuenta: nuevoEstado } : c))
    );
    setNotice(`Estado de cuenta de ${client.razonSocial} actualizado a ${nuevoEstado}.`);

    try {
      if (nuevoEstado === 'BLOQUEADO') {
        await adminApi(token).put(`/admin/servicios/cliente/${client.id}/bloquear?motivo=Cliente bloqueado desde dashboard`);
      } else {
        await adminApi(token).put(`/admin/clientes/${client.id}/estado?nuevoEstado=${nuevoEstado}`);
      }
    } catch (err: any) {
      pendingOverridesRef.current.delete(clientIdStr);
      setNotice(`Error al actualizar estado: ${err.message}`);
      void loadClientsOnly(token).catch(() => undefined);
    } finally {
      processingStateRef.current.delete(processingKey);
    }
  }

  async function handleDevolverAcceso(client: Client) {
    if (!token) return;
    const processingKey = `DEVOLVER-${client.id}`;
    if (processingStateRef.current.has(processingKey)) return;
    processingStateRef.current.add(processingKey);

    const clientIdStr = String(client.id);
    pendingOverridesRef.current.set(clientIdStr, {
      data: { estadoCuenta: 'VENCIDO' },
      timestamp: Date.now(),
    });

    setClients((prev) =>
      prev.map((c) => (String(c.id) === clientIdStr ? { ...c, estadoCuenta: 'VENCIDO' } : c))
    );
    setActiveTab('vencidos');
    setNotice(`Acceso devuelto para ${client.razonSocial}. Restaurado a estado VENCIDO.`);

    try {
      await adminApi(token).put(`/admin/servicios/cliente/${client.id}/devolver-acceso`);
    } catch (err: any) {
      pendingOverridesRef.current.delete(clientIdStr);
      setNotice(`Error al devolver acceso: ${err.message}`);
      void loadClientsOnly(token).catch(() => undefined);
    } finally {
      processingStateRef.current.delete(processingKey);
    }
  }

  async function handleRenovarPlan(
    client: Client,
    nuevoPlan?: string,
    nuevoTipo?: string,
    paymentDetails?: {
      fechaPago?: string;
      medioPago?: string;
      codigoOperacion?: string;
      observaciones?: string;
    }
  ) {
    if (!token) return;
    const planAUsar = normalizePlanKey(nuevoPlan || client.planContratado);
    const tipoAUsar = (nuevoTipo || client.tipoSuscripcion || 'MENSUAL').toUpperCase() as 'MENSUAL' | 'ANUAL';

    const PLAN_ID_MAP: Record<string, number> = {
      INICIA: 1,
      EMPRENDE: 2,
      IMPULSA: 3,
      EMPRESARIAL: 4,
      LIDER: 5,
    };

    const planId = PLAN_ID_MAP[planAUsar];
    if (!planId) {
      setNotice('El cliente no tiene un plan válido registrado en la base de datos.');
      return;
    }

    const isCambio = Boolean(
      nuevoPlan && (
        normalizePlanKey(nuevoPlan) !== normalizePlanKey(client.planContratado) ||
        tipoAUsar !== (client.tipoSuscripcion || 'MENSUAL').toUpperCase()
      )
    );
    const tipoVenta = isCambio ? 'CAMBIO_PLAN' : 'RENOVACION';
    const processingKey = `${client.id}-${tipoVenta}-${planId}-${tipoAUsar}`;
    if (processingOperationsRef.current.has(processingKey)) return;
    processingOperationsRef.current.add(processingKey);

    const clientIdStr = String(client.id);
    pendingOverridesRef.current.set(clientIdStr, {
      data: {
        planContratado: planAUsar,
        tipoSuscripcion: tipoAUsar,
        estadoCuenta: 'POR_COBRAR',
      },
      timestamp: Date.now(),
    });

    setClients((prev) =>
      prev.map((c) =>
        String(c.id) === clientIdStr
          ? {
              ...c,
              planContratado: planAUsar,
              tipoSuscripcion: tipoAUsar,
              estadoCuenta: 'POR_COBRAR',
            }
          : c
      )
    );

    try {
      await adminApi(token).post(`/admin/ventas/procesar-operacion`, {
        clienteId: client.id,
        planId,
        tipoSuscripcion: tipoAUsar,
        tipoVenta: tipoVenta,
        fechaPago: paymentDetails?.fechaPago,
        medioPago: paymentDetails?.medioPago,
        codigoOperacion: paymentDetails?.codigoOperacion,
        observaciones: paymentDetails?.observaciones || `Operación de ${tipoVenta}: ${planAUsar} (${tipoAUsar})`,
      });

      setNotice(`Operación procesada con éxito para ${client.razonSocial} (${planAUsar} - ${tipoAUsar}).`);
      void Promise.all([loadClientsOnly(token), loadPaymentsOnly(token)]).catch(() => undefined);
    } catch (err: any) {
      pendingOverridesRef.current.delete(clientIdStr);
      setNotice(`Error al procesar la venta: ${err.response?.data?.message || err.message}`);
      void loadClientsOnly(token).catch(() => undefined);
    } finally {
      processingOperationsRef.current.delete(processingKey);
    }
  }

  async function handleMejorarPlan(client: Client, subscriptionId: string) {
    if (!token) return;
    const tipoAUsar = (client.tipoSuscripcion || 'MENSUAL').toUpperCase() as 'MENSUAL' | 'ANUAL';
    const selectedSubscription = subscriptions.find((subscription) => String(subscription.id) === String(subscriptionId));
    const planId = Number(selectedSubscription?.plan?.id || selectedSubscription?.planId || 0);
    const planAUsar = selectedSubscription?.plan?.nombrePlan || 'plan seleccionado';
    if (!planId || !selectedSubscription) {
      setNotice('Selecciona una tarifa válida registrada en la base de datos.');
      return;
    }

    const processingKey = `${client.id}-MEJORA_PLAN-${planId}-${tipoAUsar}`;
    if (processingOperationsRef.current.has(processingKey)) return;
    processingOperationsRef.current.add(processingKey);

    const clientIdStr = String(client.id);
    pendingOverridesRef.current.set(clientIdStr, {
      data: {
        planContratado: planAUsar,
        tipoSuscripcion: tipoAUsar,
      },
      timestamp: Date.now(),
    });

    setClients((prev) =>
      prev.map((c) =>
        String(c.id) === clientIdStr
          ? {
              ...c,
              planContratado: planAUsar,
              tipoSuscripcion: tipoAUsar,
            }
          : c
      )
    );

    try {
      const response = await adminApi(token).post(`/admin/ventas/procesar-operacion`, {
        clienteId: client.id,
        planId,
        tipoSuscripcion: tipoAUsar,
        tipoVenta: 'MEJORA_PLAN',
        observaciones: `Mejora de plan activa a ${planAUsar} (${tipoAUsar}) sin reiniciar vencimiento`,
      });

      const monto = Number(response.data?.data?.montoTotal ?? 0);
      setNotice(`Mejora de plan registrada para ${client.razonSocial}. Diferencia cobrada: S/ ${monto.toFixed(2)}.`);
      void Promise.all([loadClientsOnly(token), loadPaymentsOnly(token)]).catch(() => undefined);
    } catch (err: any) {
      pendingOverridesRef.current.delete(clientIdStr);
      setNotice(`Error al mejorar plan: ${err.response?.data?.message || err.message}`);
      void loadClientsOnly(token).catch(() => undefined);
    } finally {
      processingOperationsRef.current.delete(processingKey);
    }
  }

  async function handleAdelantoPago(
    client: Client,
    monto?: number,
    observaciones?: string,
    paymentDetails?: {
      fechaPago?: string;
      medioPago?: string;
      codigoOperacion?: string;
      observaciones?: string;
    }
  ) {
    if (!token) return;
    const clientIdStr = String(client.id);
    const processingKey = `${client.id}-ADELANTO_PAGO`;
    if (processingOperationsRef.current.has(processingKey)) return;
    processingOperationsRef.current.add(processingKey);

    const tipoSub = (client.tipoSuscripcion || 'MENSUAL').toUpperCase();
    const planIdNum = client.planId ? Number(client.planId) : resolverPlanIdDesdeNombre(client.planContratado);

    try {
      await adminApi(token).post(`/admin/ventas/adelanto-pago`, {
        clienteId: client.id,
        planId: planIdNum,
        tipoSuscripcion: tipoSub,
        vendedorId: client.vendedorId ? Number(client.vendedorId) : undefined,
        monto: monto || client.montoSiguienteCobro || client.montoMensual || client.precioPlan || 19,
        fechaPago: paymentDetails?.fechaPago,
        medioPago: paymentDetails?.medioPago,
        codigoOperacion: paymentDetails?.codigoOperacion,
        observaciones: paymentDetails?.observaciones || observaciones || `Adelanto de pago realizado para el siguiente mes`,
      });

      setNotice(`✅ Adelanto de pago registrado con éxito para ${client.razonSocial}.`);
      void Promise.all([loadClientsOnly(token), loadPaymentsOnly(token)]).catch(() => undefined);
    } catch (err: any) {
      setNotice(`Error al procesar adelanto de pago: ${err.response?.data?.message || err.message}`);
      void loadClientsOnly(token).catch(() => undefined);
    } finally {
      processingOperationsRef.current.delete(processingKey);
    }
  }

  async function handleDeleteClientConfirm() {
    if (!deletingClient || !token) return;
    const idToDelete = deletingClient.id;
    const clientIdStr = String(idToDelete);

    deletedClientIdsRef.current.add(clientIdStr);
    setClients((prev) => prev.filter((c) => String(c.id) !== clientIdStr));
    setDeletingClient(null);

    try {
      await adminApi(token).delete(`/admin/clientes/${idToDelete}`);
      setNotice(`El cliente ha sido eliminado permanentemente.`);
    } catch (err: any) {
      deletedClientIdsRef.current.delete(clientIdStr);
      setNotice(`Error al eliminar cliente: ${err.message}`);
      void loadClientsOnly(token).catch(() => undefined);
    }
  }

  async function handleSaveEditClient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingClient || !token) return;

    const formData = new FormData(event.currentTarget);
    const canEditVendedor =
      currentUser?.rol?.toUpperCase() === 'ADMIN' || currentUser?.username === 'admin';
    const selectedVendedor = formData.get('vendedor') as string;
    let foundVendedorId: string | number | null = null;
    if (canEditVendedor && selectedVendedor && selectedVendedor !== 'Por asignar') {
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
      usuarioWsp: formData.get('usuarioWsp') as string,
      entornoId: formData.get('entornoId') ? Number(formData.get('entornoId')) : undefined,
      vendedorId: canEditVendedor ? foundVendedorId : null,
    };

    const clientIdStr = String(editingClient.id);
    pendingOverridesRef.current.set(clientIdStr, {
      data: { ...apiPayload, vendedor: selectedVendedor || editingClient.vendedor },
      timestamp: Date.now(),
    });

    setClients((prev) =>
      prev.map((c) => (String(c.id) === clientIdStr ? { ...c, ...apiPayload, vendedor: selectedVendedor || c.vendedor } : c))
    );
    setEditingClient(null);

    try {
      const response = await adminApi(token).put(`/admin/clientes/${editingClient.id}`, apiPayload);
      const updatedClient = response.data?.data;
      if (updatedClient) {
        setClients((prev) => prev.map((c) => (String(c.id) === String(updatedClient.id) ? normalizeClientData(updatedClient) : c)));
      }
      setNotice(`Los datos de ${editingClient.razonSocial} se han actualizado correctamente.`);
    } catch (err: any) {
      pendingOverridesRef.current.delete(clientIdStr);
      setNotice(`Error al actualizar el cliente: ${err.response?.data?.message || err.message}`);
      void loadClientsOnly(token).catch(() => undefined);
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

    const clientIdStr = String(targetId);
    pendingOverridesRef.current.set(clientIdStr, {
      data: {
        fechaCapacitacion: dateVal,
        estadoCapacitacion: 'COMPLETADA',
        estadoCuenta: 'HABILITADO',
      },
      timestamp: Date.now(),
    });

    // Actualización instantánea en pantalla
    setClients((prev) =>
      prev.map((c) =>
        String(c.id) === clientIdStr
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
      void Promise.all([loadClientsOnly(token), loadPaymentsOnly(token)]).catch(() => undefined);
    } catch (err: any) {
      pendingOverridesRef.current.delete(clientIdStr);
      setNotice(`Error al programar capacitación: ${err.response?.data?.message || err.response?.data?.error || err.message}`);
      void loadClientsOnly(token).catch(() => undefined);
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
    const clientIdStr = String(client.id);

    pendingOverridesRef.current.set(clientIdStr, {
      data: { vendedor: nuevoVendedor },
      timestamp: Date.now(),
    });

    // Optimista
    setClients((prev) =>
      prev.map((c) => (String(c.id) === clientIdStr ? { ...c, vendedor: nuevoVendedor } : c))
    );

    try {
      await adminApi(token).request({
        method: 'PUT',
        url: `/admin/clientes/${client.id}/vendedor?vendedorId=${vendedorId}`,
      });
      setNotice(`Vendedor asignado (${nuevoVendedor}) a ${client.razonSocial}.`);
    } catch (err: any) {
      pendingOverridesRef.current.delete(clientIdStr);
      setNotice(`Error al asignar vendedor: ${err.response?.data?.message || err.response?.data?.error || err.message}`);
      void loadClientsOnly(token).catch(() => undefined);
    }
  }

  async function handleSelfAssignVendedor(client: Client) {
    if (!token) return;
    const myName = currentUser?.nombre || currentUser?.username || 'Asignado';
    const clientIdStr = String(client.id);

    pendingOverridesRef.current.set(clientIdStr, {
      data: { vendedor: myName },
      timestamp: Date.now(),
    });

    setClients((prev) =>
      prev.map((c) => (String(c.id) === clientIdStr ? { ...c, vendedor: myName } : c))
    );

    try {
      await adminApi(token).post(`/admin/clientes/${client.id}/vendedor/asignarme`);
      setNotice(`Te asignaste correctamente el cliente ${client.razonSocial}.`);
    } catch (err: any) {
      pendingOverridesRef.current.delete(clientIdStr);
      setNotice(`No se pudo asignar el cliente: ${err.response?.data?.message || err.response?.data?.error || err.message}`);
      void loadClientsOnly(token).catch(() => undefined);
    }
  }

  async function handleColorTagChange(client: Client, nuevoColor: ColorTagType) {
    if (!token) return;
    const colorMap: Record<string, number> = { VERDE: 1, AMARILLO: 2, ROJO: 3, AZUL: 4 };
    const colorId = colorMap[nuevoColor] || 1;
    const clientIdStr = String(client.id);

    pendingOverridesRef.current.set(clientIdStr, {
      data: { colorTag: nuevoColor },
      timestamp: Date.now(),
    });

    // Optimista
    setClients((prev) =>
      prev.map((c) => (String(c.id) === clientIdStr ? { ...c, colorTag: nuevoColor } : c))
    );

    try {
      await adminApi(token).request({
        method: 'PUT',
        url: `/admin/clientes/${client.id}/color-tag?colorTagId=${colorId}`,
      });
      setNotice(`Etiqueta de color cambiada a ${nuevoColor} para ${client.razonSocial}.`);
    } catch (err: any) {
      pendingOverridesRef.current.delete(clientIdStr);
      setNotice(`Error al cambiar etiqueta de color: ${err.message}`);
      void loadClientsOnly(token).catch(() => undefined);
    }
  }

  async function handleToggleAvisado(client: Client, nextAvisado?: boolean) {
    if (!client) return;
    const clientIdStr = String(client.id);
    const targetState = nextAvisado !== undefined ? nextAvisado : !client.avisado;

    pendingOverridesRef.current.set(clientIdStr, {
      data: { avisado: targetState },
      timestamp: Date.now(),
    });

    setClients((prev) =>
      prev.map((c) => (String(c.id) === clientIdStr ? { ...c, avisado: targetState } : c))
    );

    if (token) {
      try {
        await adminApi(token).put(`/admin/clientes/${client.id}/avisado?avisado=${targetState}`);
      } catch (err: any) {
        console.error('Error al actualizar estado avisado en BD:', err);
      }
    }
  }

  async function handleSaveUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    const formData = new FormData(event.currentTarget);
    const nombre = formData.get('nombre') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const rol = (formData.get('rol') as string) || 'VENDEDOR';
    const username = (formData.get('username') as string) || (editingUser ? editingUser.username : '');

    const payload: any = {
      nombre,
      username,
      email,
      rol,
    };
    if (password && password.trim().length > 0) {
      payload.password = password;
    }

    try {
      if (editingUser) {
        // 1. Actualización optimista de la lista de usuarios
        setUsersList((prev) =>
          prev.map((u) =>
            String(u.id) === String(editingUser.id)
              ? { ...u, nombre, email, rol, username: u.username || username }
              : u
          )
        );

        // 2. Actualización optimista del usuario actual en sesión (para actualizar el Navbar y Menú)
        if (currentUser && (String(currentUser.id) === String(editingUser.id) || currentUser.username === editingUser.username)) {
          const updatedCurrent = { ...currentUser, nombre, email, rol };
          setCurrentUser(updatedCurrent);
          localStorage.setItem('miquipu_admin_user', JSON.stringify(updatedCurrent));
        }

        // 3. Actualización de nombre de vendedor en la tabla de clientes
        if (editingUser.nombre && editingUser.nombre !== nombre) {
          setClients((prev) =>
            prev.map((c) => (c.vendedor === editingUser.nombre ? { ...c, vendedor: nombre } : c))
          );
        }

        const res = await adminApi(token).put(`/admin/usuarios/${editingUser.id}`, payload);
        const savedData = res.data?.data;
        if (savedData) {
          setUsersList((prev) =>
            prev.map((u) => (String(u.id) === String(editingUser.id) ? { ...u, ...savedData } : u))
          );
          if (currentUser && (String(currentUser.id) === String(editingUser.id) || currentUser.username === savedData.username)) {
            const updatedCurrent = { ...currentUser, ...savedData };
            setCurrentUser(updatedCurrent);
            localStorage.setItem('miquipu_admin_user', JSON.stringify(updatedCurrent));
          }
        }
        setNotice(`Usuario ${editingUser.username} actualizado con éxito.`);
      } else {
        const res = await adminApi(token).post('/admin/usuarios', payload);
        const newUser = res.data?.data;
        if (newUser) {
          setUsersList((prev) => [newUser, ...prev.filter((u) => String(u.id) !== String(newUser.id))]);
        }
        setNotice(`Nuevo vendedor/usuario (${payload.nombre}) registrado correctamente.`);
      }
      setEditingUser(null);
      setShowNewUserModal(false);

      // Sincronizar en segundo plano
      void adminApi(token)
        .get('/admin/usuarios')
        .then((resp) => setUsersList(extractArray(resp.data)))
        .catch(() => undefined);
    } catch (err: any) {
      setNotice(`Error en la gestión de usuario: ${err.response?.data?.error || err.message}`);
      void adminApi(token)
        .get('/admin/usuarios')
        .then((resp) => setUsersList(extractArray(resp.data)))
        .catch(() => undefined);
    }
  }

  async function handleDeleteUser(user: UserAccount) {
    if (!token) return;
    if (!confirm(`¿Eliminar definitivamente al usuario ${user.nombre} (${user.username})?`)) return;

    const userIdStr = String(user.id);
    deletedUserIdsRef.current.add(userIdStr);

    // Optimista
    setUsersList((prev) => prev.filter((u) => String(u.id) !== userIdStr));
    setNotice(`Usuario ${user.nombre} eliminado del sistema.`);

    try {
      await adminApi(token).delete(`/admin/usuarios/${user.id}`);
      const usersResponse = await adminApi(token).get('/admin/usuarios');
      setUsersList(extractArray(usersResponse.data).filter((u) => !deletedUserIdsRef.current.has(String(u?.id))));
    } catch (err: any) {
      deletedUserIdsRef.current.delete(userIdStr);
      setNotice(`Error al eliminar usuario: ${err.message}`);
      void adminApi(token)
        .get('/admin/usuarios')
        .then((resp) => setUsersList(extractArray(resp.data).filter((u) => !deletedUserIdsRef.current.has(String(u?.id)))))
        .catch(() => undefined);
    }
  }

  async function handleMarkNotificationAsRead(notificationId: string | number) {
    if (!token || !notificationId) return;
    const notifIdStr = String(notificationId);

    // 1. Marcar localmente de forma optimista Y registrar en el ref
    //    para que el polling de loadData (cada 15s) no revierta el cambio
    //    antes de que la BD confirme.
    readNotificationIdsRef.current.add(notifIdStr);
    setNotifications((prev) =>
      prev.map((n) => (String(n.id) === notifIdStr ? { ...n, leida: true } : n))
    );

    try {
      await adminApi(token).put(`/admin/notificaciones/${notifIdStr}/leida`);
      // Servidor confirmó: ya podemos sacar del ref (la BD ya tiene leida=true,
      // cualquier recarga futura traerá el dato correcto).
      readNotificationIdsRef.current.delete(notifIdStr);
    } catch (err) {
      // Fallo en el servidor: revertir optimismo y limpiar ref
      readNotificationIdsRef.current.delete(notifIdStr);
      setNotifications((prev) =>
        prev.map((n) => (String(n.id) === notifIdStr ? { ...n, leida: false } : n))
      );
      console.error('Error al marcar notificación como leída', err);
    }
  }

  async function handleMarkAllNotificationsAsRead() {
    if (!token) return;

    // 1. Obtener de forma sincrónica los IDs no leídos desde el estado actual
    const unreadIds = notifications.filter((n) => !n.leida).map((n) => String(n.id));

    // 2. Registrar de inmediato en el ref para proteger contra el polling de loadData
    unreadIds.forEach((id) => readNotificationIdsRef.current.add(id));

    // 3. Actualización optimista del estado local
    setNotifications((prev) => prev.map((n) => ({ ...n, leida: true })));

    try {
      await adminApi(token).put(`/admin/notificaciones/marcar-todas-leidas`);
      // Servidor confirmó: ya persistido en BD, podemos liberar los IDs del ref
      unreadIds.forEach((id) => readNotificationIdsRef.current.delete(id));
    } catch (err) {
      // Fallo: revertir optimismo y limpiar ref
      unreadIds.forEach((id) => readNotificationIdsRef.current.delete(id));
      setNotifications((prev) =>
        prev.map((n) =>
          unreadIds.includes(String(n.id)) ? { ...n, leida: false } : n
        )
      );
      console.error('Error al marcar todas las notificaciones como leídas', err);
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

  function filterClientUnified(c: Client, searchValue?: any): boolean {
    const searchStr = typeof searchValue === 'string' ? searchValue : (deferredSearch || '');
    if (searchStr.trim()) {
      const q = searchStr.toLowerCase();
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
    return effectiveClients.filter((client) => filterClientUnified(client, deferredSearch));
  }, [effectiveClients, deferredSearch, regimenFilter, planFilter, suscripcionFilter, colorFilter, capacitacionFilter, estadoCuentaFilter, sellerFilter, periodoIngresoTipo, fechaCustomFilter]);

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
    loadSubscriptions,
    handleLogin,
    handleLogout,
    clients: effectiveClients,
    payments,
    notifications,
    usersList,
    subscriptions,
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
    mejoraPlanClient,
    setMejoraPlanClient,
    mejoraPlanSeleccionado,
    setMejoraPlanSeleccionado,
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
    entornos,
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
    handleAdelantoPago,
    handleMejorarPlan,
    handleDeleteClientConfirm,
    handleSaveEditClient,
    handleSaveTrainingSchedule,
    handleAssignVendedor,
    handleSelfAssignVendedor,
    handleColorTagChange,
    handleToggleAvisado,
    handleSaveUser,
    handleDeleteUser,
    handleMarkNotificationAsRead,
    handleMarkAllNotificationsAsRead,
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
