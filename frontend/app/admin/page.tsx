'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  ShieldCheck,
  LogOut,
  LogIn,
  RefreshCw,
  Search,
  DollarSign,
  Users,
  CheckCircle,
  GraduationCap,
  Settings,
  Eye,
  EyeOff,
  Calendar,
  Activity,
  AlertTriangle,
  Trash2,
  Edit,
  Clock,
  Tag,
  X,
  AlertCircle,
  CreditCard,
  Bell,
  User,
  UserPlus,
  FileSpreadsheet,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { adminApi, api } from '@/lib/api';

type ColorTagType = 'VERDE' | 'ROJO' | 'AMARILLO' | 'AZUL';
type SubscriptionType = 'MENSUAL' | 'ANUAL';

type UserAccount = {
  id: number;
  username: string;
  nombre: string;
  email: string;
  rol: string;
};

type Client = {
  id: number;
  ruc: string;
  razonSocial: string;
  nombreComercial?: string;
  direccion?: string;
  telefono: string;
  email?: string;
  nombres?: string;
  apellidos?: string;
  dni?: string;
  emailPersonal?: string;
  telefonoPersonal?: string;
  departamento?: string;
  provincia?: string;
  distrito?: string;
  regimenTributario?: string;
  planContratado: string;
  tipoSuscripcion?: SubscriptionType;
  colorTag?: ColorTagType;
  montoMensual: number;
  montoSiguienteCobro?: number;
  estadoCuenta: string;
  estadoCapacitacion: string;
  fechaRegistro?: string;
  fechaVencimientoMensual?: string;
  fechaCapacitacion?: string;
  usuarioSol?: string;
  claveSolCifrada?: string;
  vendedor?: string;
  linkSistema?: string;
  usuarioSistema?: string;
  claveSistema?: string;
};

type Payment = {
  id: number;
  clienteId: number;
  codigoOperacion?: string;
  monto: number;
  medioPago: string;
  estadoPago: string;
  fechaPago?: string;
  periodoMesAno: string;
};

const COLOR_MAP: Record<ColorTagType, { hex: string; label: string; bgClass: string }> = {
  VERDE: { hex: '#22c55e', label: 'Verde (Celular 1)', bgClass: 'bg-success' },
  ROJO: { hex: '#ef4444', label: 'Rojo (Celular 2 / Alerta)', bgClass: 'bg-danger' },
  AMARILLO: { hex: '#eab308', label: 'Amarillo (Celular 3 / Seguimiento)', bgClass: 'bg-warning' },
  AZUL: { hex: '#3b82f6', label: 'Azul (Celular 4 / VIP)', bgClass: 'bg-primary' },
};

function calcularProrrateoEntero(
  planName: string,
  tipoSuscripcion: string = 'MENSUAL',
  fechaCapacitacionStr?: string,
  montoMensualBase: number = 29
) {
  const planPrices: Record<string, number> = { INICIA: 19, EMPRENDE: 29, IMPULSA: 39, EMPRESARIAL: 59, LIDER: 89 };
  const P = planPrices[planName] ?? montoMensualBase;

  if (tipoSuscripcion === 'ANUAL') {
    return { montoProrrateado: Math.round(P * 12), isProrrateado: false, diaCap: 1, totalDias: 365, descuento: 0 };
  }

  if (!fechaCapacitacionStr) {
    return { montoProrrateado: Math.round(P), isProrrateado: false, diaCap: 1, totalDias: 30, descuento: 0 };
  }

  const date = new Date(fechaCapacitacionStr);
  if (isNaN(date.getTime())) {
    return { montoProrrateado: Math.round(P), isProrrateado: false, diaCap: 1, totalDias: 30, descuento: 0 };
  }

  const year = date.getFullYear();
  const month = date.getMonth();
  const D_total = new Date(year, month + 1, 0).getDate();
  const D_cap = date.getDate();
  const costoDiario = P / D_total;
  const descuento = costoDiario * (D_cap - 1);
  const Mcobro = Math.round(P - descuento);

  return {
    montoProrrateado: Mcobro,
    isProrrateado: D_cap > 1,
    diaCap: D_cap,
    totalDias: D_total,
    descuento: Math.round(descuento),
  };
}

export default function AdminDashboardPage() {
  const [token, setToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'resumen' | 'cobrar' | 'vencidos' | 'todos' | 'bloqueados' | 'capacitaciones' | 'calendario' | 'reporte' | 'usuarios'>('resumen');
  const [clients, setClients] = useState<Client[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [currentUser, setCurrentUser] = useState<{ username: string; nombre: string; email: string; rol: string } | null>(null);
  const [usersList, setUsersList] = useState<UserAccount[]>([]);
  const [sellerFilter, setSellerFilter] = useState('TODOS');
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [showNewUserModal, setShowNewUserModal] = useState<boolean>(false);

  const [search, setSearch] = useState('');
  const [regimenFilter, setRegimenFilter] = useState('TODOS');
  const [planFilter, setPlanFilter] = useState('TODOS');
  const [suscripcionFilter, setSuscripcionFilter] = useState('TODOS');
  const [colorFilter, setColorFilter] = useState('TODOS');
  const [capacitacionFilter, setCapacitacionFilter] = useState('TODOS');
  const [estadoCuentaFilter, setEstadoCuentaFilter] = useState('TODOS');
  const [periodoIngresoTipo, setPeriodoIngresoTipo] = useState<'TODOS' | 'HOY' | 'MES_ACTUAL' | 'ANO_ACTUAL' | 'FECHA_CUSTOM'>('TODOS');
  const [fechaCustomFilter, setFechaCustomFilter] = useState<string>('');
  
  const [notice, setNotice] = useState<string | null>(null);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState<boolean>(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState<boolean>(false);
  const [showSolKeys, setShowSolKeys] = useState<Record<number, boolean>>({});

  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [trainingClient, setTrainingClient] = useState<Client | null>(null);
  const [trainingDateInput, setTrainingDateInput] = useState<string>('');
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);
  const [cambioPlanClient, setCambioPlanClient] = useState<Client | null>(null);
  const [cambioPlanSeleccionado, setCambioPlanSeleccionado] = useState<string>('');
  const [cambioPlanTipo, setCambioPlanTipo] = useState<string>('MENSUAL');
  const [calendarSearch, setCalendarSearch] = useState('');
  const [historyClient, setHistoryClient] = useState<Client | null>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem('jwt_token');
    if (savedToken) setToken(savedToken);
    const savedUserInfo = localStorage.getItem('user_info');
    if (savedUserInfo) {
      try { setCurrentUser(JSON.parse(savedUserInfo)); } catch {}
    }
  }, []);

  const [isSyncing, setIsSyncing] = useState(false);

  async function loadData(currentToken = token, showNotice = false) {
    if (!currentToken) return;
    setIsSyncing(true);
    try {
      const resClientes = await adminApi(currentToken).get('/admin/clientes');
      setClients(resClientes.data.data || []);
      setNotice(null);

      try {
        const resPagos = await adminApi(currentToken).get('/admin/pagos');
        setPayments(resPagos.data.data || []);
      } catch {}

      try {
        const resUsuarios = await adminApi(currentToken).get('/admin/usuarios');
        setUsersList(resUsuarios.data.data || []);
      } catch {}

      if (showNotice) {
        setNotice('Base de datos sincronizada con éxito.');
        setTimeout(() => setNotice(null), 3000);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Error al conectar con la base de datos';
      setNotice(`Error al consultar datos: ${errorMsg}`);
    } finally {
      setIsSyncing(false);
    }
  }

  function formatDatePeru(dateStr?: string | null): string {
    if (!dateStr) return '—';
    const clean = dateStr.split('T')[0];
    const parts = clean.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('es-PE', { timeZone: 'America/Lima' });
  }

  useEffect(() => {
    if (!token) return;
    loadData(token);

    // Automatic real-time background sync every 10 seconds
    const interval = setInterval(() => {
      loadData(token, false);
    }, 10000);

    return () => clearInterval(interval);
  }, [token]);

  function handleExportExcel() {
    if (!clients || clients.length === 0) {
      alert('No hay clientes disponibles para exportar.');
      return;
    }

    const nowPeru = new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' });
    const todayPeruStr = new Date().toLocaleDateString('es-PE', { timeZone: 'America/Lima' });

    const reportData = clients.filter(filterClientUnified);

    if (reportData.length === 0) {
      alert('No se encontraron clientes para el filtro seleccionado.');
      return;
    }

    const totalRecaudadoCalculado = reportData.reduce((sum, c) => {
      const cPayments = payments.filter((p) => p.clienteId === c.id);
      return sum + cPayments.reduce((pSum, p) => pSum + (p.monto || 0), 0);
    }, 0);

    const totalHabilitados = reportData.filter((c) => c.estadoCuenta === 'HABILITADO').length;
    const totalVencidos = reportData.filter((c) => c.estadoCuenta === 'VENCIDO').length;

    const monthsList = [
      { label: 'JULIO 2026', month: 6, year: 2026 },
      { label: 'AGOSTO 2026', month: 7, year: 2026 },
      { label: 'SEPTIEMBRE 2026', month: 8, year: 2026 },
      { label: 'OCTUBRE 2026', month: 9, year: 2026 },
      { label: 'NOVIEMBRE 2026', month: 10, year: 2026 },
      { label: 'DICIEMBRE 2026', month: 11, year: 2026 },
      { label: 'ENERO 2027', month: 0, year: 2027 },
      { label: 'FEBRERO 2027', month: 1, year: 2027 },
      { label: 'MARZO 2027', month: 2, year: 2027 },
    ];

    // Excel HTML/XML Spreadsheet format with professional styling
    const excelHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <!--[if gte mso 9]>
        <xml>
         <x:ExcelWorkbook>
          <x:ExcelWorksheets>
           <x:ExcelWorksheet>
            <x:Name>Reporte Clientes Miquipu</x:Name>
            <x:WorksheetOptions>
             <x:DisplayGridlines/>
            </x:WorksheetOptions>
           </x:ExcelWorksheet>
          </x:ExcelWorksheets>
         </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          body { font-family: Arial, sans-serif; font-size: 10pt; color: #0F172A; }
          table { border-collapse: collapse; width: 100%; }
          .banner-title { background-color: #0B132B; color: #FFFFFF; font-size: 14pt; font-weight: bold; text-align: center; height: 42px; vertical-align: middle; }
          .banner-sub { background-color: #1E293B; color: #94A3B8; font-size: 9.5pt; text-align: center; height: 24px; vertical-align: middle; }
          .kpi-box { background-color: #F8FAFC; border: 1px solid #CBD5E1; text-align: center; font-weight: bold; padding: 6px; }
          .kpi-num { font-size: 12pt; color: #2563EB; font-weight: bold; }
          .th-col { background-color: #2563EB; color: #FFFFFF; font-weight: bold; text-align: center; border: 1px solid #1D4ED8; height: 32px; vertical-align: middle; font-size: 9pt; }
          .th-month { background-color: #0284C7; color: #FFFFFF; font-weight: bold; text-align: center; border: 1px solid #0369A1; height: 32px; vertical-align: middle; font-size: 9pt; }
          .td-cell { border: 1px solid #E2E8F0; vertical-align: middle; padding: 6px 8px; font-size: 9.5pt; }
          .td-alt { background-color: #F8FAFC; border: 1px solid #E2E8F0; vertical-align: middle; padding: 6px 8px; font-size: 9.5pt; }
          .badge-hab { background-color: #DCFCE7; color: #15803D; font-weight: bold; text-align: center; }
          .badge-venc { background-color: #FEE2E2; color: #B91C1C; font-weight: bold; text-align: center; }
          .badge-warn { background-color: #FEF3C7; color: #B45309; font-weight: bold; text-align: center; }
          .total-row { background-color: #EFF6FF; font-weight: bold; border-top: 2px solid #2563EB; font-size: 10pt; }
        </style>
      </head>
      <body>
        <table>
          <tr>
            <td colspan="30" class="banner-title">REPORTE GENERAL DE GESTIÓN Y FACTURACIÓN ELECTRÓNICA - MIQUIPU</td>
          </tr>
          <tr>
            <td colspan="30" class="banner-sub">Reporte Consolidado de Clientes | Filtro de Fecha: ${periodoIngresoTipo}</td>
          </tr>
          <tr><td colspan="30"></td></tr>
          <tr>
            <td colspan="5" class="kpi-box">TOTAL CLIENTES: <span class="kpi-num">${reportData.length}</span></td>
            <td colspan="5" class="kpi-box">TOTAL RECAUDADO: <span class="kpi-num">S/ ${totalRecaudadoCalculado.toFixed(2)}</span></td>
            <td colspan="10" class="kpi-box">CLIENTES HABILITADOS: <span class="kpi-num" style="color:#16a34a">${totalHabilitados}</span></td>
            <td colspan="10" class="kpi-box">CLIENTES VENCIDOS / BLOQUEADOS: <span class="kpi-num" style="color:#dc2626">${totalVencidos}</span></td>
          </tr>
          <tr><td colspan="30"></td></tr>
          <thead>
            <tr>
              <th class="th-col">ETIQUETA COLOR</th>
              <th class="th-col">REGIMEN</th>
              <th class="th-col">RUC</th>
              <th class="th-col">DNI</th>
              <th class="th-col">USUARIO SOL</th>
              <th class="th-col">CLAVE SOL</th>
              <th class="th-col">RAZÓN SOCIAL</th>
              <th class="th-col">TELEFONO</th>
              <th class="th-col">NOMBRE COMERCIAL</th>
              <th class="th-col">DIRECCION</th>
              <th class="th-col">CORREO</th>
              <th class="th-col">PLAN</th>
              <th class="th-col">MONTO (S/)</th>
              <th class="th-col">LINK SISTEMA</th>
              <th class="th-col">ACCESO SISTEMA</th>
              <th class="th-col">CONTRASEÑA SISTEMA</th>
              <th class="th-col">F.INICIO</th>
              <th class="th-col">VENDEDOR QUE REALIZÓ LA VENTA</th>
              <th class="th-col">TOTAL PAGOS (S/)</th>
              <th class="th-col">ESTADO</th>
              <th class="th-col">CAPACITADO</th>
              ${monthsList.map((m) => `<th class="th-month">${m.label}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${reportData.map((c, index) => {
              const bgClass = index % 2 === 0 ? 'td-cell' : 'td-alt';
              const estadoClass = c.estadoCuenta === 'HABILITADO' ? 'badge-hab' : c.estadoCuenta === 'VENCIDO' ? 'badge-venc' : 'badge-warn';
              const fReg = formatDatePeru(c.fechaCapacitacion || c.fechaRegistro);
              const cPayments = payments.filter((p) => p.clienteId === c.id);
              const totalPagado = cPayments.reduce((sum, p) => sum + (p.monto || 0), 0);

              const monthCellsHtml = monthsList.map((m) => {
                const pMonth = cPayments.filter((p) => {
                  if (!p.fechaPago) return false;
                  const d = new Date(p.fechaPago);
                  return d.getMonth() === m.month && d.getFullYear() === m.year;
                });

                if (pMonth.length > 0) {
                  const sumPaid = pMonth.reduce((acc, curr) => acc + (curr.monto || 0), 0);
                  return `<td class="${bgClass}" style="text-align:center; color:#15803d; font-weight:bold;">S/ ${sumPaid.toFixed(2)}</td>`;
                }

                if (c.estadoCuenta === 'BLOQUEADO') {
                  return `<td class="${bgClass}" style="text-align:center; color:#b91c1c; font-weight:bold;">BLOQUEADO</td>`;
                }

                if (c.estadoCuenta === 'VENCIDO') {
                  return `<td class="${bgClass}" style="text-align:center; color:#b45309; font-weight:bold;">POR COBRAR</td>`;
                }

                return `<td class="${bgClass}" style="text-align:center; color:#94a3b8;">—</td>`;
              }).join('');

              return `
                <tr>
                  <td class="${bgClass}" style="text-align:center;"><strong>${c.colorTag || 'VERDE'}</strong></td>
                  <td class="${bgClass}" style="text-align:center;">${c.regimenTributario || '—'}</td>
                  <td class="${bgClass}" style="mso-number-format:'\\@'; text-align:center;">${c.ruc || '—'}</td>
                  <td class="${bgClass}" style="mso-number-format:'\\@'; text-align:center;">${c.dni || '—'}</td>
                  <td class="${bgClass}" style="text-align:center;">${c.usuarioSol || '—'}</td>
                  <td class="${bgClass}" style="text-align:center;">${c.claveSolCifrada || '—'}</td>
                  <td class="${bgClass}"><strong>${c.razonSocial || '—'}</strong></td>
                  <td class="${bgClass}" style="mso-number-format:'\\@'; text-align:center;">${c.telefono || '—'}</td>
                  <td class="${bgClass}">${c.nombreComercial || '—'}</td>
                  <td class="${bgClass}">${c.direccion || '—'}</td>
                  <td class="${bgClass}">${c.email || '—'}</td>
                  <td class="${bgClass}" style="text-align:center;"><strong>${c.planContratado || '—'}</strong></td>
                  <td class="${bgClass}" style="text-align:right;">S/ ${(c.montoMensual || 0).toFixed(2)} (${c.tipoSuscripcion || 'MENSUAL'})</td>
                  <td class="${bgClass}">${c.linkSistema || '—'}</td>
                  <td class="${bgClass}">${c.usuarioSistema || '—'}</td>
                  <td class="${bgClass}">${c.claveSistema || '—'}</td>
                  <td class="${bgClass}" style="text-align:center;">${fReg}</td>
                  <td class="${bgClass}" style="text-align:center;">${c.vendedor ? c.vendedor.toUpperCase() : 'SIN ASIGNAR'}</td>
                  <td class="${bgClass}" style="text-align:right; font-weight:bold; color:#2563eb;">S/ ${totalPagado.toFixed(2)}</td>
                  <td class="${bgClass} ${estadoClass}">${c.estadoCuenta || '—'}</td>
                  <td class="${bgClass}" style="text-align:center;">${c.estadoCapacitacion || 'PENDIENTE'}</td>
                  ${monthCellsHtml}
                </tr>
              `;
            }).join('')}
            <tr class="total-row">
              <td colspan="12" style="text-align:right;">TOTALES GENERALES:</td>
              <td style="text-align:right;">S/ ${reportData.reduce((s, c) => s + (c.montoMensual || 0), 0).toFixed(2)}</td>
              <td colspan="5"></td>
              <td style="text-align:right; color:#2563eb;">S/ ${totalRecaudadoCalculado.toFixed(2)}</td>
              <td colspan="${2 + monthsList.length}"></td>
            </tr>
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const filterTag = periodoIngresoTipo !== 'TODOS' ? `_${periodoIngresoTipo}` : '';
    link.setAttribute('download', `Reporte_Facturacion_Miquipu${filterTag}_${todayPeruStr.replace(/\//g, '-')}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    try {
      const { data } = await api.post('/auth/login', Object.fromEntries(values));
      const jwtToken = data.data.token;
      const uInfo = {
        username: data.data.username || 'admin',
        nombre: data.data.nombre || data.data.username || 'Administrador',
        email: data.data.email || '',
        rol: data.data.rol || 'ADMIN'
      };
      localStorage.setItem('jwt_token', jwtToken);
      localStorage.setItem('user_info', JSON.stringify(uInfo));
      setToken(jwtToken);
      setCurrentUser(uInfo);
      setNotice(null);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Credenciales incorrectas o servicio fuera de línea.';
      setNotice(errorMsg);
    }
  }

  function handleLogout() {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_info');
    setToken(null);
    setCurrentUser(null);
    setClients([]);
  }

  async function handleAssignVendedor(client: Client, newVendedor: string) {
    if (!token) return;
    try {
      setClients((prev) => prev.map((c) => (c.id === client.id ? { ...c, vendedor: newVendedor } : c)));
      await adminApi(token).patch(`/admin/clientes/${client.id}/vendedor?vendedor=${encodeURIComponent(newVendedor)}`);
      setNotice(`Vendedor asignado a ${client.razonSocial}: ${newVendedor}`);
      loadData(token);
    } catch (err: any) {
      setNotice(`Error al asignar vendedor: ${err.message}`);
      loadData(token);
    }
  }

  async function handleSaveUser(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!token) return;
    const values = new FormData(e.currentTarget);
    const dataObj = Object.fromEntries(values);
    try {
      if (editingUser) {
        await adminApi(token).put(`/admin/usuarios/${editingUser.id}`, dataObj);
        setNotice(`Usuario ${editingUser.username} actualizado correctamente.`);
        setEditingUser(null);
      } else {
        await adminApi(token).post('/admin/usuarios', dataObj);
        setNotice(`Nuevo usuario registrado exitosamente.`);
        setShowNewUserModal(false);
      }
      loadData(token);
    } catch (err: any) {
      setNotice(`Error al guardar usuario: ${err.response?.data?.message || err.message}`);
    }
  }

  async function handleDeleteUser(user: UserAccount) {
    if (!token) return;
    const confirm = window.confirm(`¿Seguro que deseas eliminar al usuario ${user.username} (${user.nombre})?`);
    if (!confirm) return;
    try {
      await adminApi(token).delete(`/admin/usuarios/${user.id}`);
      setNotice(`Usuario ${user.username} eliminado.`);
      loadData(token);
    } catch (err: any) {
      setNotice(`Error al eliminar usuario: ${err.message}`);
    }
  }

  async function handleRegisterPayment(client: Client) {
    if (!token) return;
    const pro = calcularProrrateoEntero(client.planContratado, client.tipoSuscripcion, client.fechaCapacitacion, client.montoMensual);
    const confirm = window.confirm(`¿Confirmas que se recibió el pago de ${client.razonSocial}? El cliente pasará a PAGO_REALIZADO por un monto prorrateado de S/ ${pro.montoProrrateado}.`);
    if (!confirm) return;

    try {
      setClients((prev) => prev.map((c) => (c.id === client.id ? { ...c, estadoCuenta: 'PAGO_REALIZADO' } : c)));
      await adminApi(token).post('/admin/pagos/registrar', {
        clienteId: client.id,
        codigoOperacion: `CONFIRM-PAGO-${Date.now().toString().slice(-6)}`,
        monto: pro.montoProrrateado,
        medioPago: 'TRANSFERENCIA_BCP',
      });
      setNotice(`¡Pago verificado! ${client.razonSocial} está en PAGO_REALIZADO (S/ ${pro.montoProrrateado}) y listo para programar capacitación.`);
      loadData(token);
    } catch (err: any) {
      setNotice(`Error al registrar pago: ${err.message}`);
      loadData(token);
    }
  }

  async function handleRenovarPlan(client: Client, nuevoPlan?: string, nuevoTipoSuscripcion?: string) {
    if (!token) return;
    const planTarget = nuevoPlan || client.planContratado;
    const subTypeTarget = nuevoTipoSuscripcion || client.tipoSuscripcion || 'MENSUAL';

    const pro = calcularProrrateoEntero(planTarget, subTypeTarget, client.fechaCapacitacion, client.montoMensual);
    const montoCobrado = pro.montoProrrateado;

    try {
      // Calcular nueva fecha de vencimiento (extender 1 mes/año)
      const baseDate = (client.fechaVencimientoMensual && new Date(client.fechaVencimientoMensual) > new Date())
        ? new Date(client.fechaVencimientoMensual)
        : new Date();
      if (subTypeTarget === 'ANUAL') {
        baseDate.setFullYear(baseDate.getFullYear() + 1);
      } else {
        baseDate.setMonth(baseDate.getMonth() + 1);
      }

      // 1. Registrar primero el pago
      await adminApi(token).post('/admin/pagos/registrar', {
        clienteId: client.id,
        codigoOperacion: `RENOVACION-${Date.now().toString().slice(-6)}`,
        monto: montoCobrado,
        medioPago: 'TRANSFERENCIA_BCP',
        fechaPago: new Date().toISOString(),
      });

      // 2. Asegurar que el estado de cuenta quede en HABILITADO y la fecha extendida
      await adminApi(token).put(`/admin/clientes/${client.id}`, {
        ruc: client.ruc,
        razonSocial: client.razonSocial,
        nombreComercial: client.nombreComercial,
        direccion: client.direccion,
        telefono: client.telefono,
        email: client.email,
        nombres: client.nombres,
        apellidos: client.apellidos,
        dni: client.dni,
        emailPersonal: client.emailPersonal,
        telefonoPersonal: client.telefonoPersonal,
        departamento: client.departamento,
        provincia: client.provincia,
        distrito: client.distrito,
        regimenTributario: client.regimenTributario,
        planContratado: planTarget,
        tipoSuscripcion: subTypeTarget,
        colorTag: client.colorTag,
        estadoCuenta: 'HABILITADO',
        fechaVencimientoMensual: baseDate.toISOString(),
      });

      setNotice(`¡Plan de ${client.razonSocial} renovado exitosamente por S/ ${montoCobrado}! Se extendió el periodo de suscripción.`);
      loadData(token);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message;
      setNotice(`Error al renovar plan: ${msg}`);
    }
  }

  async function handleColorTagChange(client: Client, newColor: ColorTagType) {
    if (!token) return;
    // Optimistic UI update in 0ms
    setClients((prev) => prev.map((c) => (c.id === client.id ? { ...c, colorTag: newColor } : c)));
    try {
      await adminApi(token).patch(`/admin/clientes/${client.id}/color-tag?color=${newColor}`);
    } catch (err: any) {
      setNotice(`Error al actualizar etiqueta de color: ${err.message}`);
      loadData(token);
    }
  }

  async function handleCapacitacionChange(client: Client, nuevoEstado: string) {
    if (!token) return;
    // Optimistic UI update in 0ms
    setClients((prev) => prev.map((c) => (c.id === client.id ? { ...c, estadoCapacitacion: nuevoEstado as any } : c)));
    try {
      await adminApi(token).patch(`/admin/clientes/${client.id}/estado-capacitacion?estado=${nuevoEstado}`);
    } catch (err: any) {
      setNotice(`Error al actualizar capacitación: ${err.message}`);
      loadData(token);
    }
  }

  async function handleEstadoCuentaChange(client: Client, nuevoEstado: string) {
    if (!token) return;
    try {
      if (nuevoEstado === 'HABILITADO' && client.estadoCuenta === 'BLOQUEADO') {
        const ayer = new Date();
        ayer.setDate(ayer.getDate() - 1);
        const ayerIso = ayer.toISOString();

        setClients((prev) =>
          prev.map((c) =>
            c.id === client.id
              ? { ...c, estadoCuenta: 'HABILITADO', fechaVencimientoMensual: ayerIso }
              : c
          )
        );

        await adminApi(token).put(`/admin/clientes/${client.id}`, {
          ruc: client.ruc,
          razonSocial: client.razonSocial,
          nombreComercial: client.nombreComercial,
          direccion: client.direccion,
          telefono: client.telefono,
          email: client.email,
          nombres: client.nombres,
          apellidos: client.apellidos,
          dni: client.dni,
          emailPersonal: client.emailPersonal,
          telefonoPersonal: client.telefonoPersonal,
          departamento: client.departamento,
          provincia: client.provincia,
          distrito: client.distrito,
          regimenTributario: client.regimenTributario,
          planContratado: client.planContratado,
          tipoSuscripcion: client.tipoSuscripcion || 'MENSUAL',
          colorTag: client.colorTag,
          estadoCuenta: 'HABILITADO',
          fechaVencimientoMensual: ayerIso,
        });

        setNotice(`El cliente ${client.razonSocial} ha sido trasladado a la pestaña de Vencidos para renovar o cambiar su plan.`);
      } else {
        setClients((prev) => prev.map((c) => (c.id === client.id ? { ...c, estadoCuenta: nuevoEstado } : c)));
        await adminApi(token).patch(`/admin/clientes/${client.id}/estado-cuenta?estado=${nuevoEstado}`);
        setNotice(`Estado de cuenta de ${client.razonSocial} cambiado a ${nuevoEstado}.`);
      }
      loadData(token);
    } catch (err: any) {
      setNotice(`Error al cambiar estado de cuenta: ${err.message}`);
      loadData(token);
    }
  }

  async function handleDeleteClientConfirm() {
    if (!deletingClient || !token) return;
    try {
      await adminApi(token).delete(`/admin/clientes/${deletingClient.id}`);
      setNotice(`El cliente ${deletingClient.razonSocial} ha sido eliminado permanentemente del sistema.`);
      setDeletingClient(null);
      loadData(token);
    } catch (err: any) {
      setNotice(`Error al eliminar cliente: ${err.message}`);
    }
  }

  async function handleSaveEditClient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingClient || !token) return;

    const formData = new FormData(event.currentTarget);
    const payload = {
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
      regimenTributario: formData.get('regimenTributario') as string,
      planContratado: (formData.get('planContratado') as string) || editingClient.planContratado,
      tipoSuscripcion: (formData.get('tipoSuscripcion') as string) || editingClient.tipoSuscripcion || 'MENSUAL',
      colorTag: formData.get('colorTag') as string,
      vendedor: (formData.get('vendedor') as string) || editingClient.vendedor,
      claveSol: formData.get('claveSol') as string,
      linkSistema: formData.get('linkSistema') as string,
      usuarioSistema: formData.get('usuarioSistema') as string,
      claveSistema: formData.get('claveSistema') as string,
      fechaVencimientoMensual: editingClient.fechaVencimientoMensual,
    };

    try {
      await adminApi(token).put(`/admin/clientes/${editingClient.id}`, payload);

      setNotice(`Cliente ${editingClient.razonSocial} actualizado correctamente.`);
      setEditingClient(null);
      loadData(token);
    } catch (err: any) {
      setNotice(`Error al actualizar cliente: ${err.message}`);
    }
  }

  async function handleSaveTrainingSchedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!trainingClient || !token || !trainingDateInput) return;

    try {
      const isoDate = `${trainingDateInput}T12:00:00.000Z`;
      await adminApi(token).patch(`/admin/clientes/${trainingClient.id}/fecha-capacitacion?fecha=${isoDate}`);
      setNotice(`Fecha de capacitación programada para ${trainingClient.razonSocial}. Se calculó el prorrateo de fin de mes.`);
      setTrainingClient(null);
      loadData(token);
    } catch (err: any) {
      setNotice(`Error al guardar capacitación: ${err.message}`);
    }
  }



  const prorrateoCalculado = useMemo(() => {
    if (!trainingClient || !trainingDateInput) return null;
    const parts = trainingDateInput.split('-');
    if (parts.length !== 3) return null;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const date = new Date(year, month, day);
    if (isNaN(date.getTime())) return null;

    const P = trainingClient.montoMensual || 29;
    const isAnual = trainingClient.tipoSuscripcion === 'ANUAL';

    if (isAnual) {
      return {
        montoProrrateado: P * 12,
        diasTotales: 365,
        diaCapacitacion: date.getDate(),
        descuento: 0,
        fechaVencimiento: new Date(date.getFullYear() + 1, date.getMonth(), date.getDate()).toLocaleDateString(),
        isAnual: true,
      };
    }

    const D_total = new Date(year, month + 1, 0).getDate();
    const D_cap = date.getDate();
    const costoDiario = P / D_total;
    const descuento = costoDiario * (D_cap - 1);
    const Mcobro = Math.round(P - descuento);
    const fechaFinMes = new Date(year, month + 1, 0).toLocaleDateString();

    return {
      montoProrrateado: Mcobro,
      diasTotales: D_total,
      diaCapacitacion: D_cap,
      descuento: Math.round(descuento),
      fechaVencimiento: fechaFinMes,
      isAnual: false,
    };
  }, [trainingClient, trainingDateInput]);

  function sendEmailReminder(email: string, razonSocial: string) {
    const targetEmail = email || 'contacto@empresa.com';
    const subject = encodeURIComponent(`Recordatorio de Pago de Mensualidad - Miquipu Facturación (${razonSocial})`);
    const body = encodeURIComponent(`Estimado cliente de ${razonSocial},\n\nLe saludamos de Miquipu Facturación Electrónica.\nLe recordamos amablemente que su fecha de vencimiento de mensualidad está próxima/vencida.\n\nPor favor realizar el abono correspondiente a nuestras cuentas bancarias empresariales para mantener su servicio habilitado sin interrupciones.\n\nAtentamente,\nEquipo de Cobranzas Miquipu`);
    window.open(`mailto:${targetEmail}?subject=${subject}&body=${body}`, '_blank');
  }



  const totalCobradoDia = useMemo(() => {
    const now = new Date();
    const todayY = now.getFullYear();
    const todayM = now.getMonth();
    const todayD = now.getDate();

    if (payments && payments.length > 0) {
      const totalPagos = payments.reduce((sum, p) => {
        if (!p.fechaPago) return sum;
        const pDate = new Date(p.fechaPago);
        if (pDate.getFullYear() === todayY && pDate.getMonth() === todayM && pDate.getDate() === todayD) {
          return sum + (p.monto || 0);
        }
        return sum;
      }, 0);

      if (totalPagos > 0) return totalPagos;
    }

    return clients
      .filter((c) => c.estadoCuenta === 'HABILITADO')
      .reduce((sum, c) => sum + (c.montoMensual || 0), 0);
  }, [payments, clients]);

  const periodoVentasIngresos = useMemo(() => {
    const now = new Date();
    const todayStr = now.toLocaleDateString('es-PE');
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const filteredPayments = payments.filter((p) => {
      if (!p.fechaPago) return false;
      const pDate = new Date(p.fechaPago);

      if (periodoIngresoTipo === 'HOY') {
        return pDate.toLocaleDateString('es-PE') === todayStr;
      }
      if (periodoIngresoTipo === 'MES_ACTUAL') {
        return pDate.getFullYear() === currentYear && pDate.getMonth() === currentMonth;
      }
      if (periodoIngresoTipo === 'ANO_ACTUAL') {
        return pDate.getFullYear() === currentYear;
      }
      if (periodoIngresoTipo === 'FECHA_CUSTOM' && fechaCustomFilter) {
        return pDate.toISOString().slice(0, 10) === fechaCustomFilter;
      }
      return true;
    });

    const totalIngresos = filteredPayments.reduce((sum, p) => sum + (p.monto || 0), 0);

    return {
      totalIngresos,
      totalOperaciones: filteredPayments.length,
      paymentsList: filteredPayments,
    };
  }, [payments, periodoIngresoTipo, fechaCustomFilter]);

  const clientesActivos = useMemo(() => clients.filter((c) => c.estadoCuenta === 'HABILITADO').length, [clients]);
  

  const clientesPorCobrarList = useMemo(() => {
    return clients.filter((c) => c.estadoCuenta === 'POR_COBRAR');
  }, [clients]);



  const clientesVencidosList = useMemo(() => {
    const now = new Date();
    return clients.filter((c) => {
      if (c.estadoCuenta === 'BLOQUEADO') return false;
      if (c.fechaVencimientoMensual) {
        return new Date(c.fechaVencimientoMensual) < now;
      }
      return false;
    });
  }, [clients]);

  const clientesBloqueadosList = useMemo(() => clients.filter((c) => c.estadoCuenta === 'BLOQUEADO'), [clients]);

  const clientesPorVencer1DiaList = useMemo(() => {
    const now = new Date();
    return clients.filter((c) => {
      if (!c.fechaVencimientoMensual) return false;
      const vencDate = new Date(c.fechaVencimientoMensual);
      const diffTime = vencDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 1 && diffDays >= 0;
    });
  }, [clients]);



  const uniqueSellers = useMemo(() => {
    const setS = new Set<string>();
    usersList.forEach((u) => { if (u.nombre) setS.add(u.nombre); });
    clients.forEach((c) => { if (c.vendedor && c.vendedor !== 'Sin Asignar') setS.add(c.vendedor); });
    return Array.from(setS);
  }, [usersList, clients]);

  const sellerMetrics = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const todayStr = now.toLocaleDateString('es-PE');

    return uniqueSellers.map((sellerName) => {
      const sellerClients = clients.filter((c) => c.vendedor === sellerName);
      const sellerClientIds = new Set(sellerClients.map((c) => c.id));

      const sellerPayments = payments.filter((p) => sellerClientIds.has(p.clienteId));

      const ventasDia = sellerPayments
        .filter((p) => {
          if (!p.fechaPago) return false;
          return new Date(p.fechaPago).toLocaleDateString('es-PE') === todayStr;
        })
        .reduce((sum, p) => sum + (p.monto || 0), 0);

      const ventasMes = sellerPayments
        .filter((p) => {
          if (!p.fechaPago) return false;
          const d = new Date(p.fechaPago);
          return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
        })
        .reduce((sum, p) => sum + (p.monto || 0), 0);

      const ventasAno = sellerPayments
        .filter((p) => {
          if (!p.fechaPago) return false;
          const d = new Date(p.fechaPago);
          return d.getFullYear() === currentYear;
        })
        .reduce((sum, p) => sum + (p.monto || 0), 0);

      return {
        vendedor: sellerName,
        totalClientes: sellerClients.length,
        ventasDia,
        ventasMes,
        ventasAno,
      };
    });
  }, [uniqueSellers, clients, payments]);

  function filterClientUnified(c: Client): boolean {
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchSearch =
        (c.razonSocial || '').toLowerCase().includes(q) ||
        (c.ruc || '').includes(q) ||
        (c.telefono || '').includes(q) ||
        (c.email || '').toLowerCase().includes(q) ||
        (c.vendedor || '').toLowerCase().includes(q) ||
        (c.usuarioSol || '').toLowerCase().includes(q) ||
        (c.usuarioSistema || '').toLowerCase().includes(q) ||
        (c.nombreComercial || '').toLowerCase().includes(q);
      if (!matchSearch) return false;
    }

    if (colorFilter !== 'TODOS' && c.colorTag !== colorFilter) return false;
    if (regimenFilter !== 'TODOS' && c.regimenTributario !== regimenFilter) return false;
    if (planFilter !== 'TODOS' && c.planContratado !== planFilter) return false;
    if (suscripcionFilter !== 'TODOS' && c.tipoSuscripcion !== suscripcionFilter) return false;
    if (capacitacionFilter !== 'TODOS' && c.estadoCapacitacion !== capacitacionFilter) return false;
    if (estadoCuentaFilter !== 'TODOS' && c.estadoCuenta !== estadoCuentaFilter) return false;

    if (sellerFilter !== 'TODOS') {
      if (sellerFilter === 'SIN_ASIGNAR') {
        if (c.vendedor && c.vendedor !== 'Sin Asignar') return false;
      } else {
        if (c.vendedor !== sellerFilter) return false;
      }
    }

    if (periodoIngresoTipo !== 'TODOS') {
      const refDateStr = c.fechaRegistro || c.fechaCapacitacion;
      if (!refDateStr) return false;
      const refDatePeru = formatDatePeru(refDateStr);
      const todayPeruStr = new Date().toLocaleDateString('es-PE', { timeZone: 'America/Lima' });

      if (periodoIngresoTipo === 'HOY') {
        if (refDatePeru !== todayPeruStr) return false;
      } else if (periodoIngresoTipo === 'MES_ACTUAL') {
        const now = new Date();
        const d = new Date(refDateStr);
        if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) return false;
      } else if (periodoIngresoTipo === 'ANO_ACTUAL') {
        const now = new Date();
        const d = new Date(refDateStr);
        if (d.getFullYear() !== now.getFullYear()) return false;
      } else if (periodoIngresoTipo === 'FECHA_CUSTOM' && fechaCustomFilter) {
        const customPeru = formatDatePeru(fechaCustomFilter);
        if (refDatePeru !== customPeru) return false;
      }
    }

    return true;
  }

  const allFilteredClients = useMemo(() => {
    return clients.filter(filterClientUnified);
  }, [clients, search, regimenFilter, planFilter, suscripcionFilter, colorFilter, capacitacionFilter, estadoCuentaFilter, sellerFilter, periodoIngresoTipo, fechaCustomFilter]);

  const capacitacionesClients = useMemo(() => {
    return clients.filter(filterClientUnified);
  }, [clients, search, regimenFilter, planFilter, suscripcionFilter, colorFilter, capacitacionFilter, estadoCuentaFilter, sellerFilter, periodoIngresoTipo, fechaCustomFilter]);

  return (
    <div className="bg-white min-h-screen pb-5">

      <nav className="navbar navbar-expand-lg navbar-dark bg-dark sticky-top py-2 shadow-sm">
        <div className="container-fluid px-3 px-lg-4">
          <Link className="navbar-brand d-flex align-items-center gap-2 me-lg-3" href="/admin">
            <Image src="/logo.jpeg" alt="Miquipu Logo" width={32} height={32} className="rounded-2" />
            <span className="brand-title fw-bold fs-6">Miquipu</span>
            <span className="badge bg-primary px-2" style={{ fontSize: '0.65rem' }}>Admin</span>
          </Link>

          {token && (
            <>
              <button
                className="navbar-toggler"
                type="button"
                data-bs-toggle="offcanvas"
                data-bs-target="#offcanvasDarkNavbar"
                aria-controls="offcanvasDarkNavbar"
                aria-label="Toggle navigation"
              >
                <span className="navbar-toggler-icon"></span>
              </button>

              <div className="offcanvas offcanvas-end text-bg-dark" tabIndex={-1} id="offcanvasDarkNavbar" aria-labelledby="offcanvasDarkNavbarLabel">
                <div className="offcanvas-header border-bottom border-secondary">
                  <h5 className="offcanvas-title d-flex align-items-center gap-2" id="offcanvasDarkNavbarLabel">
                    <ShieldCheck size={20} className="text-primary" />
                    <span>Panel de Control</span>
                  </h5>
                  <button type="button" className="btn-close btn-close-white" data-bs-dismiss="offcanvas" aria-label="Close"></button>
                </div>

                <div className="offcanvas-body">
                  {/* Navegación horizontal en escritorio y vertical en celular */}
                  <ul className="navbar-nav mx-auto mb-2 mb-lg-0 align-items-lg-center gap-lg-2">
                    <li className="nav-item">
                      <button
                        className={`nav-link btn border-0 text-start py-1 px-2 rounded-2 ${
                          activeTab === 'resumen' ? 'active bg-primary text-white fw-bold' : 'text-white-50'
                        }`}
                        onClick={() => setActiveTab('resumen')}
                        data-bs-dismiss="offcanvas"
                      >
                        Resumen
                      </button>
                    </li>
                    <li className="nav-item">
                      <button
                        className={`nav-link btn border-0 text-start py-1 px-2 rounded-2 d-flex align-items-center gap-1 ${
                          activeTab === 'todos' ? 'active bg-primary text-white fw-bold' : 'text-white-50'
                        }`}
                        onClick={() => setActiveTab('todos')}
                        data-bs-dismiss="offcanvas"
                      >
                        <span>Clientes</span>
                        <span className="badge rounded-pill bg-secondary">{clients.length}</span>
                      </button>
                    </li>
                    <li className="nav-item">
                      <button
                        className={`nav-link btn border-0 text-start py-1 px-2 rounded-2 d-flex align-items-center gap-1 ${
                          activeTab === 'cobrar' ? 'active bg-warning text-dark fw-bold' : 'text-white-50'
                        }`}
                        onClick={() => setActiveTab('cobrar')}
                        data-bs-dismiss="offcanvas"
                      >
                        <span>Por Cobrar</span>
                        {clientesPorCobrarList.length > 0 && (
                          <span className="badge rounded-pill bg-warning text-dark">{clientesPorCobrarList.length}</span>
                        )}
                      </button>
                    </li>
                    <li className="nav-item">
                      <button
                        className={`nav-link btn border-0 text-start py-1 px-2 rounded-2 d-flex align-items-center gap-1 ${
                          activeTab === 'vencidos' ? 'active bg-danger text-white fw-bold' : 'text-white-50'
                        }`}
                        onClick={() => setActiveTab('vencidos')}
                        data-bs-dismiss="offcanvas"
                      >
                        <span>Vencidos</span>
                        {clientesVencidosList.length > 0 && (
                          <span className="badge rounded-pill bg-danger">{clientesVencidosList.length}</span>
                        )}
                      </button>
                    </li>
                    <li className="nav-item">
                      <button
                        className={`nav-link btn border-0 text-start py-1 px-2 rounded-2 d-flex align-items-center gap-1 ${
                          activeTab === 'bloqueados' ? 'active bg-primary text-white fw-bold' : 'text-white-50'
                        }`}
                        onClick={() => setActiveTab('bloqueados')}
                        data-bs-dismiss="offcanvas"
                      >
                        <span>Bloqueados</span>
                        {clientesBloqueadosList.length > 0 && (
                          <span className="badge rounded-pill bg-secondary">{clientesBloqueadosList.length}</span>
                        )}
                      </button>
                    </li>
                    <li className="nav-item">
                      <button
                        className={`nav-link btn border-0 text-start py-1 px-2 rounded-2 ${
                          activeTab === 'capacitaciones' ? 'active bg-primary text-white fw-bold' : 'text-white-50'
                        }`}
                        onClick={() => setActiveTab('capacitaciones')}
                        data-bs-dismiss="offcanvas"
                      >
                        Capacitaciones
                      </button>
                    </li>
                    <li className="nav-item">
                      <button
                        className={`nav-link btn border-0 text-start py-1 px-2 rounded-2 ${
                          activeTab === 'calendario' ? 'active bg-primary text-white fw-bold' : 'text-white-50'
                        }`}
                        onClick={() => setActiveTab('calendario')}
                        data-bs-dismiss="offcanvas"
                      >
                        Centro de Control
                      </button>
                    </li>
                    <li className="nav-item">
                      <button
                        className={`nav-link btn border-0 text-start py-1 px-2 rounded-2 ${
                          activeTab === 'reporte' ? 'active bg-primary text-white fw-bold' : 'text-white-50'
                        }`}
                        onClick={() => setActiveTab('reporte')}
                        data-bs-dismiss="offcanvas"
                      >
                        Reporte General
                      </button>
                    </li>
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

                  {/* Acciones del lado derecho: Alertas + Salir (Ícono) */}
                  <div className="d-flex align-items-center gap-2 mt-3 mt-lg-0 ms-lg-2 position-relative">
                    <div className="position-relative w-100 w-lg-auto">
                      <button
                        onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
                        className="btn btn-warning btn-sm w-100 w-lg-auto position-relative d-flex align-items-center justify-content-center gap-1 py-1 px-3 fw-semibold"
                        title="Alertas de Vencimiento"
                      >
                        <Bell size={15} />
                        <span>Alertas</span>
                        {clientesPorVencer1DiaList.length > 0 && (
                          <span className="badge rounded-pill bg-danger ms-1">
                            {clientesPorVencer1DiaList.length}
                          </span>
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
                              <button
                                type="button"
                                className="btn-close btn-sm"
                                onClick={() => setShowNotificationsDropdown(false)}
                              ></button>
                            </div>

                            {clientesPorVencer1DiaList.length === 0 ? (
                              <div className="text-center text-muted py-4">
                                <CheckCircle size={24} className="text-success mb-2 d-block mx-auto" />
                                <p className="small mb-0">No hay alertas de recordatorio activas (1 día antes).</p>
                              </div>
                            ) : (
                              <div className="d-flex flex-column gap-2">
                                {clientesPorVencer1DiaList.map((c) => (
                                  <div
                                    key={`alert-near-${c.id}`}
                                    className="p-3 border rounded bg-light text-start shadow-sm"
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => {
                                      setCalendarSearch(c.ruc);
                                      setActiveTab('calendario');
                                      setShowNotificationsDropdown(false);
                                    }}
                                    title="Haz clic para ir directamente al cliente en Centro de Control"
                                  >
                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                      <strong className="text-dark text-truncate me-2" style={{ maxWidth: '200px' }}>
                                        {c.razonSocial}
                                      </strong>
                                      <span className="badge bg-warning text-dark flex-shrink-0" style={{ fontSize: '0.65rem' }}>
                                        POR VENCER (1 DÍA)
                                      </span>
                                    </div>

                                    <div className="d-flex justify-content-between align-items-center small text-muted">
                                      <span>RUC: {c.ruc} | {c.planContratado}</span>
                                      <span className="fw-bold text-primary">S/ {c.montoMensual.toFixed(2)}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Botón Deslizante / Menu de Perfil (Diseño Bootstrap) */}
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
                        <span className="small opacity-75 ms-1">▼</span>
                      </button>

                      {showProfileDropdown && (
                        <div
                          className="position-absolute end-0 mt-2 bg-white text-dark rounded-3 shadow-lg p-2 border"
                          style={{ zIndex: 99999, width: '240px' }}
                        >
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
                                <span>Gestión de Vendedores</span>
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
                            <span>Cerrar Sesión</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </nav>

      <main className="container-fluid px-3 px-md-4 my-4" style={{ maxWidth: '1600px' }}>
        {notice && (
          <div className="alert alert-info alert-dismissible fade show shadow-sm rounded-3 mb-4" role="alert">
            <span>{notice}</span>
            <button type="button" className="btn-close" onClick={() => setNotice(null)}></button>
          </div>
        )}


        {!token ? (
          <div className="row justify-content-center my-5">
            <div className="col-md-5">
              <div className="custom-card p-4 p-md-5">
                <div className="text-center mb-4">
                  <Image src="/logo.jpeg" alt="Miquipu Logo" width={56} height={56} className="rounded-3 shadow-sm mb-2" />
                  <h1 className="h5 fw-bold text-dark mb-1">Acceso Administrativo</h1>
                  <p className="text-muted small">Ingresa tus credenciales de colaborador.</p>
                </div>

                <form onSubmit={handleLogin} className="needs-validation">
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

            {activeTab === 'resumen' && (
              <div>
                {/* Tarjetas de Métricas Ejecutivas Rediseñadas (Estilo Maqueta AI) */}
                <div className="row g-3 mb-4">
                  <div className="col-md-3">
                    <div className="custom-card metric-card-blue p-3 h-100 shadow-sm">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div className="d-flex align-items-center gap-2">
                          <div className="icon-pill-blue">
                            <DollarSign size={20} />
                          </div>
                          <span className="text-muted small fw-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>Ingresos del Día</span>
                        </div>
                        <span className="badge bg-primary text-white rounded-pill px-3 py-1 fw-bold" style={{ fontSize: '0.7rem' }}>Ventas</span>
                      </div>
                      <div className="fs-2 fw-bold text-dark mb-1 mt-2">S/ {totalCobradoDia.toFixed(2)}</div>
                      <small className="text-muted d-block">Ventas confirmadas al día de hoy</small>
                    </div>
                  </div>

                  <div className="col-md-3">
                    <div className="custom-card metric-card-green p-3 h-100 shadow-sm">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div className="d-flex align-items-center gap-2">
                          <div className="icon-pill-green">
                            <CheckCircle size={20} />
                          </div>
                          <span className="text-muted small fw-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>Clientes Activos</span>
                        </div>
                        <span className="badge bg-success text-white rounded-pill px-3 py-1 fw-bold" style={{ fontSize: '0.7rem' }}>Servicio</span>
                      </div>
                      <div className="fs-2 fw-bold text-dark mb-1 mt-2">{clientesActivos}</div>
                      <small className="text-muted d-block">Cuentas con acceso habilitado</small>
                    </div>
                  </div>

                  <div className="col-md-3">
                    <div className="custom-card metric-card-yellow p-3 h-100 shadow-sm">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div className="d-flex align-items-center gap-2">
                          <div className="icon-pill-yellow">
                            <Clock size={20} />
                          </div>
                          <span className="text-muted small fw-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>Por Cobrar</span>
                        </div>
                        <span className="badge bg-warning text-dark rounded-pill px-3 py-1 fw-bold" style={{ fontSize: '0.7rem' }}>Pendientes</span>
                      </div>
                      <div className="fs-2 fw-bold text-dark mb-1 mt-2">{clientesPorCobrarList.length}</div>
                      <small className="text-muted d-block">Derivados pendientes de abono</small>
                    </div>
                  </div>

                  <div className="col-md-3">
                    <div className="custom-card metric-card-red p-3 h-100 shadow-sm">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div className="d-flex align-items-center gap-2">
                          <div className="icon-pill-red">
                            <AlertTriangle size={20} />
                          </div>
                          <span className="text-muted small fw-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>Vencidos / Bloqueados</span>
                        </div>
                        <span className="badge bg-danger text-white rounded-pill px-3 py-1 fw-bold" style={{ fontSize: '0.7rem' }}>Alerta</span>
                      </div>
                      <div className="fs-2 fw-bold text-dark mb-1 mt-2">{clientesVencidosList.length}</div>
                      <small className="text-muted d-block">Cuentas por vencer o suspendidas</small>
                    </div>
                  </div>
                </div>

                {/* Dashboard Grid 2 Columnas */}
                <div className="row g-4">
                  {/* Columna Izquierda: Listas rápidas de Clientes */}
                  <div className="col-lg-6">
                    {/* Panel 1: Clientes Habilitados Recientes */}
                    <div className="custom-card p-4 mb-4 shadow-sm">
                      <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
                        <div>
                          <h2 className="h6 fw-bold text-dark mb-1 d-flex align-items-center">
                            <Users size={18} className="text-primary me-2" />
                            <span>Clientes Activos Recientes</span>
                          </h2>
                          <small className="text-muted">Últimos clientes con servicio habilitado</small>
                        </div>
                        <button onClick={() => setActiveTab('todos')} className="btn btn-outline-primary btn-sm rounded-3 px-3 fw-semibold">
                          Ver Todos
                        </button>
                      </div>
                      <div className="list-group list-group-flush">
                        {clients.filter(c => c.estadoCuenta === 'HABILITADO').slice(0, 5).length === 0 ? (
                          <div className="text-muted small py-4 text-center">No hay clientes activos registrados.</div>
                        ) : (
                          clients.filter(c => c.estadoCuenta === 'HABILITADO').slice(0, 5).map((c) => (
                            <div key={`act-${c.id}`} className="list-group-item px-0 py-2.5 d-flex justify-content-between align-items-center border-bottom border-light">
                              <div className="d-flex align-items-center">
                                <div className="rounded-circle bg-light border text-secondary fw-bold d-flex align-items-center justify-content-center me-3 flex-shrink-0" style={{ width: '40px', height: '40px', fontSize: '0.85rem' }}>
                                  {(c.razonSocial || 'CL').slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <strong className="text-dark d-block small">{c.razonSocial}</strong>
                                  <span className="text-muted small">RUC: {c.ruc} | Plan: {c.planContratado}</span>
                                </div>
                              </div>
                              <span className="badge badge-habilitado">HABILITADO</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Panel 2: Pendientes por Cobrar */}
                    <div className="custom-card p-4 shadow-sm">
                      <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
                        <div>
                          <h2 className="h6 fw-bold text-dark mb-1 d-flex align-items-center">
                            <CreditCard size={18} className="text-warning me-2" />
                            <span>Pendientes de Cobro</span>
                          </h2>
                          <small className="text-muted">Clientes derivados del formulario en espera de confirmación</small>
                        </div>
                        <button onClick={() => setActiveTab('cobrar')} className="btn btn-outline-warning btn-sm text-dark rounded-3 px-3 fw-semibold">
                          Gestionar Cobros
                        </button>
                      </div>
                      <div className="list-group list-group-flush">
                        {clientesPorCobrarList.slice(0, 5).length === 0 ? (
                          <div className="text-muted small py-5 text-center d-flex flex-column align-items-center justify-content-center">
                            <CreditCard size={36} className="text-muted opacity-30 mb-2" />
                            <span>No hay pendientes por cobrar.</span>
                          </div>
                        ) : (
                          clientesPorCobrarList.slice(0, 5).map((c) => (
                            <div key={`cob-${c.id}`} className="list-group-item px-0 py-2.5 d-flex justify-content-between align-items-center border-bottom border-light">
                              <div>
                                <strong className="text-dark d-block small">{c.razonSocial}</strong>
                                <span className="text-muted small">RUC: {c.ruc} | Tel: {c.telefono}</span>
                              </div>
                              <div className="text-end">
                                <strong className="text-warning d-block small">S/ {c.montoMensual.toFixed(2)}</strong>
                                <span className="badge badge-pendiente">POR_COBRAR</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Columna Derecha: Notificaciones y Distribución */}
                  <div className="col-lg-6">
                    {/* Panel 3: Apartado de Notificaciones y Alertas Próximas */}
                    <div className="custom-card p-4 mb-4 shadow-sm">
                      <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
                        <div>
                          <h2 className="h6 fw-bold text-dark mb-1 d-flex align-items-center">
                            <Bell size={18} className="text-info me-2" />
                            <span>Notificaciones y Vencimientos Próximos</span>
                          </h2>
                          <small className="text-muted">Clientes con vencimiento cercano a alertar</small>
                        </div>
                        <button onClick={() => setActiveTab('calendario')} className="btn btn-outline-info btn-sm rounded-3 px-3 fw-semibold">
                          Centro de Control
                        </button>
                      </div>
                      <div className="d-flex flex-column gap-2">
                        {clientesPorVencer1DiaList.length === 0 ? (
                          <div className="text-center text-muted py-5 small d-flex flex-column align-items-center justify-content-center">
                            <Bell size={36} className="text-muted opacity-30 mb-2" />
                            <span>No hay alertas de vencimiento pendientes.</span>
                          </div>
                        ) : (
                          clientesPorVencer1DiaList.slice(0, 5).map((c) => (
                            <div
                              key={`res-notif-${c.id}`}
                              className="p-3 border rounded-3 bg-light d-flex justify-content-between align-items-center"
                              style={{ cursor: 'pointer' }}
                              onClick={() => {
                                setCalendarSearch(c.ruc);
                                setActiveTab('calendario');
                              }}
                            >
                              <div>
                                <strong className="text-dark d-block small">{c.razonSocial}</strong>
                                <span className="text-muted small">RUC: {c.ruc} | {c.planContratado}</span>
                              </div>
                              <span className="badge bg-warning text-dark px-3 py-1 fw-bold">VENCE EN 1 DÍA</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Panel 4: Distribución por Plan de Suscripción */}
                    <div className="custom-card p-4 shadow-sm">
                      <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
                        <div>
                          <h2 className="h6 fw-bold text-dark mb-1 d-flex align-items-center">
                            <Clock size={18} className="text-secondary me-2" />
                            <span>Distribución de Clientes por Plan</span>
                          </h2>
                          <small className="text-muted">Total de cuentas según el plan contratado</small>
                        </div>
                        <button
                          onClick={() => loadData(token, true)}
                          disabled={isSyncing}
                          className="btn btn-outline-secondary btn-sm rounded-pill px-3 fw-semibold d-inline-flex align-items-center gap-1 shadow-sm"
                        >
                          <RefreshCw size={14} className={isSyncing ? 'spin-anim' : ''} />
                          <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar'}</span>
                        </button>
                      </div>
                      <div className="d-flex flex-column gap-3 pt-1">
                        {[
                          { key: 'INICIA', name: 'Plan Inicia (S/ 19)', color: 'bg-info' },
                          { key: 'EMPRENDE', name: 'Plan Emprende (S/ 29)', color: 'bg-primary' },
                          { key: 'IMPULSA', name: 'Plan Impulsa (S/ 39)', color: 'bg-purple' },
                          { key: 'EMPRESARIAL', name: 'Plan Empresarial (S/ 59)', color: 'bg-success' },
                          { key: 'LIDER', name: 'Plan Líder (S/ 89)', color: 'bg-dark' },
                        ].map((p) => {
                          const count = clients.filter(c => c.planContratado === p.key).length;
                          const pct = clients.length > 0 ? Math.round((count / clients.length) * 100) : 0;
                          return (
                            <div key={p.key}>
                              <div className="d-flex justify-content-between small fw-bold mb-1">
                                <span className="text-dark">{p.name}</span>
                                <span className="text-muted">{count} cliente{count !== 1 ? 's' : ''} ({pct}%)</span>
                              </div>
                              <div className="progress" style={{ height: '10px' }}>
                                <div className={`progress-bar ${p.color}`} style={{ width: `${pct}%` }}></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}


            {activeTab === 'todos' && (
              <div className="custom-card p-4 shadow-sm">
                <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
                  <div className="d-flex align-items-center gap-2">
                    <div className="p-2 bg-primary bg-opacity-10 text-primary rounded-3">
                      <Users size={20} />
                    </div>
                    <div>
                      <h2 className="h6 fw-bold text-dark mb-0">Base General de Todos los Clientes</h2>
                      <small className="text-muted">Listado completo de cuentas registradas en la plataforma</small>
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-primary text-white rounded-pill px-3 py-1.5 fw-bold">{allFilteredClients.length} Clientes</span>
                    <button
                      onClick={() => loadData(token, true)}
                      disabled={isSyncing}
                      className="btn btn-outline-secondary btn-sm rounded-pill px-3 fw-semibold d-inline-flex align-items-center gap-1 shadow-sm"
                    >
                      <RefreshCw size={14} className={isSyncing ? 'spin-anim' : ''} />
                      <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar'}</span>
                    </button>
                  </div>
                </div>

                <div className="row g-2 mb-4 bg-light p-3 rounded-3 border">
                  <div className="col-md-3">
                    <div className="input-group input-group-sm">
                      <span className="input-group-text bg-light"><Search size={14} /></span>
                      <input
                        className="form-control"
                        placeholder="Buscar RUC, nombre, vendedor..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-md-2">
                    <select className="form-select form-select-sm" value={sellerFilter} onChange={(e) => setSellerFilter(e.target.value)}>
                      <option value="TODOS">Todos Vendedores</option>
                      <option value="SIN_ASIGNAR">Sin Asignar</option>
                      {uniqueSellers.map((sName) => (
                        <option key={sName} value={sName}>👤 {sName}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-2">
                    <select className="form-select form-select-sm" value={colorFilter} onChange={(e) => setColorFilter(e.target.value)}>
                      <option value="TODOS">Todos los Colores</option>
                      <option value="VERDE">🟢 Verde (Celular 1)</option>
                      <option value="ROJO">🔴 Rojo (Celular 2)</option>
                      <option value="AMARILLO">🟡 Amarillo (Celular 3)</option>
                      <option value="AZUL">🔵 Azul (Celular 4)</option>
                    </select>
                  </div>
                  <div className="col-md-2">
                    <select className="form-select form-select-sm" value={regimenFilter} onChange={(e) => setRegimenFilter(e.target.value)}>
                      <option value="TODOS">Todos Regímenes</option>
                      <option value="MYPE_TRIBUTARIO">MYPE</option>
                      <option value="RER">RER</option>
                      <option value="REGIMEN_GENERAL">General</option>
                      <option value="NRUS">NRUS</option>
                    </select>
                  </div>
                  <div className="col-md-3">
                    <select className="form-select form-select-sm" value={planFilter} onChange={(e) => setPlanFilter(e.target.value)}>
                      <option value="TODOS">Todos los Planes</option>
                      <option value="INICIA">Inicia (S/ 19)</option>
                      <option value="EMPRENDE">Emprende (S/ 29)</option>
                      <option value="IMPULSA">Impulsa (S/ 39)</option>
                      <option value="EMPRESARIAL">Empresarial (S/ 59)</option>
                      <option value="LIDER">Líder (S/ 89)</option>
                    </select>
                  </div>
                </div>

                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead>
                      <tr>
                        <th>Color Celular</th>
                        <th>RUC / Empresa</th>
                        <th>WhatsApp / Email</th>
                        <th>Plan / Suscripción</th>
                        <th>Vendedor</th>
                        <th>Clave SOL</th>
                        <th>Estado Cuenta</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allFilteredClients.map((c, idx) => (
                        <tr key={c.id} style={{ position: 'relative', zIndex: 1000 - idx }}>
                          <td style={{ position: 'relative', zIndex: 1000 - idx }}>
                            <div className="dropdown">
                              <button
                                className="btn btn-sm border-0 p-1 d-flex align-items-center gap-1"
                                type="button"
                                data-bs-toggle="dropdown"
                                aria-expanded="false"
                                title="Cambiar color de celular/atención"
                              >
                                <span
                                  className="d-inline-block rounded-circle border shadow-sm"
                                  style={{ width: '20px', height: '20px', backgroundColor: COLOR_MAP[c.colorTag || 'VERDE'].hex, cursor: 'pointer' }}
                                ></span>
                              </button>
                              <ul className="dropdown-menu shadow-lg border-0 p-1" style={{ zIndex: 99999, minWidth: '190px' }}>
                                {(['VERDE', 'ROJO', 'AMARILLO', 'AZUL'] as ColorTagType[]).map((col) => (
                                  <li key={col}>
                                    <button
                                      className="dropdown-menu-item dropdown-item d-flex align-items-center gap-2 small py-1.5 px-2 rounded-2"
                                      onClick={() => handleColorTagChange(c, col)}
                                    >
                                      <span className="rounded-circle d-inline-block" style={{ width: '12px', height: '12px', backgroundColor: COLOR_MAP[col].hex }}></span>
                                      <span className="fw-semibold">{COLOR_MAP[col].label}</span>
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </td>
                          <td>
                            <strong className="text-dark d-block">{c.razonSocial}</strong>
                            <span className="small text-muted">{c.ruc}</span>
                          </td>
                          <td>
                            <span className="fw-semibold d-block">{c.telefono}</span>
                            <span className="small text-muted">{c.email || '—'}</span>
                          </td>
                          <td>
                            <span className="badge bg-light text-dark me-1">{c.planContratado}</span>
                            <span className={`badge ${c.tipoSuscripcion === 'ANUAL' ? 'bg-purple text-white' : 'bg-info text-dark'}`}>
                              {c.tipoSuscripcion || 'MENSUAL'}
                            </span>
                          </td>
                          <td>
                            {c.vendedor && c.vendedor !== 'Sin Asignar' ? (
                              <span className="badge bg-secondary text-white fw-semibold" style={{ fontSize: '0.75rem' }}>
                                👤 {c.vendedor}
                              </span>
                            ) : (
                              <button
                                onClick={() => handleAssignVendedor(c, currentUser?.nombre || currentUser?.username || 'Vendedor')}
                                className="btn btn-sm btn-outline-success text-nowrap py-0 px-2"
                                style={{ fontSize: '0.75rem' }}
                                title="Asignarme como el vendedor de esta cuenta"
                              >
                                + Asignarme
                              </button>
                            )}
                          </td>
                          <td>
                            <div className="d-flex flex-column gap-1">
                              <div className="d-flex align-items-center gap-1">
                                <code className="bg-light px-2 py-1 rounded small">
                                  {showSolKeys[c.id] ? `SOL: ${c.usuarioSol || 'N/A'} / ${c.claveSolCifrada || 'N/A'}` : 'SOL: ••••••••'}
                                </code>
                                <button
                                  onClick={() => setShowSolKeys((prev) => ({ ...prev, [c.id]: !prev[c.id] }))}
                                  className="btn btn-sm btn-outline-secondary p-1"
                                >
                                  {showSolKeys[c.id] ? <EyeOff size={13} /> : <Eye size={13} />}
                                </button>
                              </div>
                              {showSolKeys[c.id] && (c.linkSistema || c.usuarioSistema) && (
                                <div className="small bg-light p-1 rounded border mt-1">
                                  {c.linkSistema && (
                                    <div className="text-truncate" style={{ maxWidth: '180px' }}>
                                      <a href={c.linkSistema} target="_blank" rel="noreferrer" className="text-primary text-decoration-underline fw-semibold">
                                        🔗 Abrir Sistema
                                      </a>
                                    </div>
                                  )}
                                  <div>
                                    <span className="text-muted">User:</span> <strong>{c.usuarioSistema || '—'}</strong> | <span className="text-muted">Pass:</span> <strong>{c.claveSistema || '—'}</strong>
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${c.estadoCuenta === 'HABILITADO' ? 'badge-habilitado' : 'badge-bloqueado'}`}>
                              {c.estadoCuenta}
                            </span>
                          </td>
                          <td>
                            <div className="d-flex gap-1">
                              <button onClick={() => setEditingClient(c)} className="btn btn-sm btn-outline-primary" title="Editar cliente">
                                <Edit size={14} />
                              </button>
                              <button onClick={() => setDeletingClient(c)} className="btn btn-sm btn-outline-danger" title="Eliminar cliente">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}


            {activeTab === 'cobrar' && (
              <div className="custom-card p-4 shadow-sm">
                <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
                  <div className="d-flex align-items-center gap-2">
                    <div className="p-2 bg-warning bg-opacity-10 text-warning rounded-3">
                      <CreditCard size={20} />
                    </div>
                    <div>
                      <h2 className="h6 fw-bold text-dark mb-0">Clientes Por Cobrar</h2>
                      <small className="text-muted">Clientes derivados del formulario web en espera de pago y confirmación</small>
                    </div>
                  </div>
                  <span className="badge bg-warning text-dark rounded-pill px-3 py-1.5 fw-bold">{clientesPorCobrarList.length} Por Cobrar</span>
                </div>

                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead>
                      <tr>
                        <th>RUC / Empresa</th>
                        <th>WhatsApp</th>
                        <th>Plan / Suscripción</th>
                        <th>Monto a Cobrar</th>
                        <th>Estado Cuenta</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientesPorCobrarList.length === 0 ? (
                        <tr><td colSpan={6} className="text-center text-muted py-3">No hay registros pendientes por cobrar.</td></tr>
                      ) : (
                        clientesPorCobrarList.map((c) => (
                          <tr key={c.id}>
                            <td>
                              <strong className="text-dark d-block">{c.razonSocial}</strong>
                              <span className="small text-muted">{c.ruc}</span>
                            </td>
                            <td><span className="fw-semibold">{c.telefono}</span></td>
                            <td>
                              <span className="badge bg-light text-dark me-1">{c.planContratado}</span>
                              <span className="badge bg-info text-dark">{c.tipoSuscripcion || 'MENSUAL'}</span>
                            </td>
                            <td className="fw-bold text-primary">S/ {c.montoMensual.toFixed(2)}</td>
                            <td><span className="badge bg-warning text-dark">POR_COBRAR</span></td>
                            <td>
                              <div className="d-flex gap-2">
                                <button onClick={() => handleRegisterPayment(c)} className="btn btn-sm btn-success rounded-pill px-3 py-1.5 fw-semibold shadow-sm d-inline-flex align-items-center gap-1">
                                  <CheckCircle size={14} />
                                  <span>Marcar como Pagado</span>
                                </button>
                                <button
                                  onClick={() => {
                                    const confirmCancel = window.confirm(`¿Confirmas la cancelación del plan para ${c.razonSocial}? Pasará a la sección de Bloqueados.`);
                                    if (confirmCancel) {
                                      handleEstadoCuentaChange(c, 'BLOQUEADO');
                                    }
                                  }}
                                  className="btn btn-sm btn-outline-danger rounded-pill px-3 py-1.5 fw-semibold d-inline-flex align-items-center gap-1"
                                >
                                  <X size={14} />
                                  <span>Cancelar Plan</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'vencidos' && (
              <div className="custom-card p-4 border-danger shadow-sm">
                <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
                  <div className="d-flex align-items-center gap-2">
                    <div className="p-2 bg-danger bg-opacity-10 text-danger rounded-3">
                      <AlertCircle size={20} />
                    </div>
                    <div>
                      <h2 className="h6 fw-bold text-danger mb-0">Clientes Vencidos</h2>
                      <small className="text-muted">Cuentas con mensualidad vencida pendientes de renovar o suspender</small>
                    </div>
                  </div>
                  <span className="badge bg-danger text-white rounded-pill px-3 py-1.5 fw-bold">{clientesVencidosList.length} Vencidos</span>
                </div>

                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead>
                      <tr>
                        <th>RUC / Empresa</th>
                        <th>WhatsApp</th>
                        <th>Plan Actual</th>
                        <th>Monto</th>
                        <th>Venció</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientesVencidosList.length === 0 ? (
                        <tr><td colSpan={6} className="text-center text-muted py-3">No hay clientes vencidos.</td></tr>
                      ) : (
                        clientesVencidosList.map((c) => {
                          const vencDate = c.fechaVencimientoMensual ? new Date(c.fechaVencimientoMensual) : null;
                          return (
                          <tr key={c.id}>
                            <td>
                              <strong className="text-dark d-block">{c.razonSocial}</strong>
                              <span className="small text-muted">{c.ruc}</span>
                            </td>
                            <td><span className="fw-semibold">{c.telefono}</span></td>
                            <td>
                              <span className="badge bg-light text-dark me-1">{c.planContratado}</span>
                              <span className="badge bg-secondary">{c.tipoSuscripcion || 'MENSUAL'}</span>
                            </td>
                            <td className="fw-bold text-danger">S/ {c.montoMensual.toFixed(2)}</td>
                            <td>
                              {vencDate ? (
                                <span className="badge bg-danger">{vencDate.toLocaleDateString()}</span>
                              ) : <span className="badge bg-secondary">Sin fecha</span>}
                            </td>
                            <td>
                              <div className="d-flex gap-1.5 flex-wrap">
                                <button
                                  onClick={() => {
                                    const ok = window.confirm(`¿Renovar plan de ${c.razonSocial}? Se extenderá 1 mes y se registrará el cobro de S/ ${c.montoMensual.toFixed(2)}.`);
                                    if (ok) handleRenovarPlan(c);
                                  }}
                                  className="btn btn-sm btn-info text-white rounded-pill px-3 py-1 fw-semibold shadow-sm d-inline-flex align-items-center gap-1"
                                >
                                  <RefreshCw size={13} />
                                  <span>Renovar Plan</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setCambioPlanClient(c);
                                    setCambioPlanSeleccionado(c.planContratado);
                                    setCambioPlanTipo(c.tipoSuscripcion || 'MENSUAL');
                                  }}
                                  className="btn btn-sm btn-warning text-dark rounded-pill px-3 py-1 fw-semibold shadow-sm d-inline-flex align-items-center gap-1"
                                >
                                  <Settings size={13} />
                                  <span>Cambio de Plan</span>
                                </button>
                                <button
                                  onClick={() => {
                                    const ok = window.confirm(`¿Cancelar el plan de ${c.razonSocial}? Pasará a la sección de Bloqueados.`);
                                    if (ok) handleEstadoCuentaChange(c, 'BLOQUEADO');
                                  }}
                                  className="btn btn-sm btn-outline-danger rounded-pill px-3 py-1 fw-semibold d-inline-flex align-items-center gap-1"
                                >
                                  <X size={13} />
                                  <span>Cancelar Plan</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}


            {activeTab === 'bloqueados' && (
              <div className="custom-card p-4 shadow-sm">
                <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
                  <div className="d-flex align-items-center gap-2">
                    <div className="p-2 bg-secondary bg-opacity-10 text-secondary rounded-3">
                      <ShieldCheck size={20} />
                    </div>
                    <div>
                      <h2 className="h6 fw-bold text-dark mb-0">Clientes Bloqueados / Suspendidos</h2>
                      <small className="text-muted">Clientes desafiliados o con acceso restringido que pueden rehabilitarse</small>
                    </div>
                  </div>
                  <span className="badge bg-secondary text-white rounded-pill px-3 py-1.5 fw-bold">{clientesBloqueadosList.length} Bloqueados</span>
                </div>

                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead>
                      <tr>
                        <th>RUC / Empresa</th>
                        <th>Teléfono</th>
                        <th>Email</th>
                        <th>Plan</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientesBloqueadosList.length === 0 ? (
                        <tr><td colSpan={6} className="text-center text-muted py-4">No hay clientes en estado bloqueado.</td></tr>
                      ) : (
                        clientesBloqueadosList.map((c) => (
                          <tr key={c.id}>
                            <td>
                              <strong className="text-dark d-block">{c.razonSocial}</strong>
                              <span className="small text-muted">{c.ruc}</span>
                            </td>
                            <td>{c.telefono}</td>
                            <td>{c.email || 'N/A'}</td>
                            <td><span className="badge bg-light text-dark">{c.planContratado}</span></td>
                            <td><span className="badge bg-danger">BLOQUEADO</span></td>
                            <td>
                              <div className="d-flex gap-2">
                                <button onClick={() => handleEstadoCuentaChange(c, 'HABILITADO')} className="btn btn-sm btn-success rounded-pill px-3 py-1.5 fw-semibold shadow-sm d-inline-flex align-items-center gap-1">
                                  <CheckCircle size={14} />
                                  <span>Habilitar Accesos</span>
                                </button>
                                <button onClick={() => setDeletingClient(c)} className="btn btn-sm btn-outline-danger rounded-pill px-3 py-1.5 fw-semibold d-inline-flex align-items-center gap-1">
                                  <Trash2 size={14} />
                                  <span>Eliminar Definitivamente</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}


            {activeTab === 'capacitaciones' && (
              <div className="custom-card p-4 shadow-sm">
                <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
                  <div className="d-flex align-items-center gap-2">
                    <div className="p-2 bg-info bg-opacity-10 text-info rounded-3">
                      <GraduationCap size={20} />
                    </div>
                    <div>
                      <h2 className="h6 fw-bold text-dark mb-0">Gestión de Capacitaciones</h2>
                      <small className="text-muted">Monitoreo y asignación de fechas de capacitación real</small>
                    </div>
                  </div>
                </div>

                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead>
                      <tr>
                        <th>RUC / Empresa</th>
                        <th>Contacto</th>
                        <th>Plan</th>
                        <th>Estado Capacitación</th>
                        <th>Fecha Capacitación</th>
                        <th>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clients
                        .filter((c) => c.estadoCuenta === 'PAGO_REALIZADO' || (c.estadoCuenta === 'HABILITADO' && c.estadoCapacitacion !== 'PENDIENTE'))
                        .map((c) => (
                        <tr key={c.id}>
                          <td>
                            <strong className="text-dark d-block">{c.razonSocial}</strong>
                            <span className="small text-muted">{c.ruc}</span>
                          </td>
                          <td>{c.telefono}</td>
                          <td><span className="badge bg-light text-dark">{c.planContratado}</span></td>
                          <td>
                            <span className={`badge ${c.estadoCapacitacion === 'COMPLETADA' ? 'bg-success' : c.estadoCapacitacion === 'PROGRAMADA' ? 'bg-info text-dark' : 'bg-warning text-dark'}`}>
                              {c.estadoCapacitacion}
                            </span>
                          </td>
                          <td>
                            {c.fechaCapacitacion ? formatDatePeru(c.fechaCapacitacion) : <span className="text-muted small">Sin programar</span>}
                          </td>
                          <td>
                            {c.estadoCuenta === 'HABILITADO' ? (
                              <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 rounded-pill px-3 py-1.5 fw-semibold d-inline-flex align-items-center gap-1">
                                <CheckCircle size={14} />
                                <span>Ya Capacitado</span>
                              </span>
                            ) : (
                              <button onClick={() => setTrainingClient(c)} className="btn btn-sm btn-primary rounded-pill px-3 py-1.5 fw-semibold shadow-sm d-inline-flex align-items-center gap-1">
                                <Calendar size={14} />
                                <span>Programar Fecha</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}


            {activeTab === 'calendario' && (
              <div className="custom-card p-4 shadow-sm">
                <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
                  <div className="d-flex align-items-center gap-2">
                    <div className="p-2 bg-primary bg-opacity-10 text-primary rounded-3">
                      <Activity size={20} />
                    </div>
                    <div>
                      <h2 className="h6 fw-bold text-dark mb-0">Centro de Control</h2>
                      <small className="text-muted">Monitoreo detallado de vencimientos y cálculo prorrateado</small>
                    </div>
                  </div>
                  <div className="input-group input-group-sm" style={{ maxWidth: '280px' }}>
                    <span className="input-group-text bg-light border-end-0"><Search size={14} /></span>
                    <input
                      className="form-control border-start-0"
                      placeholder="Buscar empresa, RUC, DNI, representante..."
                      value={calendarSearch}
                      onChange={(e) => setCalendarSearch(e.target.value)}
                    />
                  </div>
                </div>

                <div className="table-responsive">
                  <table className="table table-sm table-hover align-middle mb-0" style={{ fontSize: '0.82rem' }}>
                    <thead className="table-light">
                      <tr>
                        <th className="py-2">#</th>
                        <th className="py-2">Representante</th>
                        <th className="py-2">DNI</th>
                        <th className="py-2">RUC</th>
                        <th className="py-2">Empresa</th>
                        <th className="py-2">Correo</th>
                        <th className="py-2">Plan Actual</th>
                        <th className="py-2">Cobro Próximo Mes</th>
                        <th className="py-2">Vencimiento</th>
                        <th className="py-2">Días Restantes</th>
                        <th className="py-2">Estado</th>
                        <th className="py-2">Historial</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const now = new Date();

                        const filtered = clients
                          .filter((c) => {
                            if (!calendarSearch.trim()) return true;
                            const q = calendarSearch.toLowerCase();
                            return (
                              c.razonSocial?.toLowerCase().includes(q) ||
                              c.ruc?.includes(q) ||
                              (c.dni || '').includes(q) ||
                              (c.nombres || '').toLowerCase().includes(q) ||
                              (c.apellidos || '').toLowerCase().includes(q) ||
                              (c.telefono || '').includes(q) ||
                              (c.email || '').toLowerCase().includes(q)
                            );
                          })
                          .map((c) => {
                            const vencDate = c.fechaVencimientoMensual ? new Date(c.fechaVencimientoMensual) : null;
                            const diffTime = vencDate ? vencDate.getTime() - now.getTime() : Infinity;
                            const diffDays = vencDate ? Math.ceil(diffTime / (1000 * 60 * 60 * 24)) : 9999;
                            return { ...c, _vencDate: vencDate, _diffDays: diffDays };
                          })
                          .sort((a, b) => a._diffDays - b._diffDays);

                        if (filtered.length === 0) {
                          return <tr><td colSpan={12} className="text-center text-muted py-4">No se encontraron clientes en el Centro de Control.</td></tr>;
                        }

                        return filtered.map((c, idx) => {
                          const { _vencDate: vencDate, _diffDays: diffDays } = c;

                          // Cálculo de Prorrateo entero para próximo cobro
                          const prorrateo = calcularProrrateoEntero(c.planContratado, c.tipoSuscripcion, c.fechaCapacitacion, c.montoMensual);

                          const isNearExpiry = diffDays <= 3 && diffDays >= 0;
                          const isExpired = diffDays < 0;

                          return (
                            <tr
                              key={c.id}
                              className={isExpired ? 'table-danger' : isNearExpiry ? 'table-warning' : ''}
                            >
                              <td className="text-muted fw-semibold py-2">{idx + 1}</td>
                              <td className="py-2">
                                {c.nombres || c.apellidos ? (
                                  <strong className="text-dark">{c.nombres} {c.apellidos || ''}</strong>
                                ) : (
                                  <span className="text-muted small">Sin especificar</span>
                                )}
                              </td>
                              <td className="py-2">
                                {c.dni ? (
                                  <span className="fw-semibold text-dark">{c.dni}</span>
                                ) : (
                                  <span className="text-muted small">Sin DNI</span>
                                )}
                              </td>
                              <td className="py-2"><code>{c.ruc}</code></td>
                              <td className="py-2"><strong className="text-dark">{c.razonSocial}</strong></td>
                              <td className="py-2">
                                <span className="text-dark">{c.email || 'Sin correo'}</span>
                                {c.telefono && <small className="text-muted d-block">{c.telefono}</small>}
                              </td>
                              <td className="py-2">
                                <span className="badge bg-primary me-1">{c.planContratado}</span>
                                <span className="badge bg-light text-dark border">{c.tipoSuscripcion || 'MENSUAL'}</span>
                              </td>
                              <td className="py-2">
                                <strong className="text-success fs-6">S/ {prorrateo.montoProrrateado}</strong>
                              </td>
                              <td className="py-2">
                                <strong className={isExpired ? 'text-danger' : isNearExpiry ? 'text-warning' : 'text-dark'}>
                                  {vencDate ? vencDate.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Sin fecha'}
                                </strong>
                              </td>
                              <td className="py-2">
                                {diffDays === 9999 ? (
                                  <span className="badge bg-light text-muted border">Sin fecha</span>
                                ) : diffDays > 0 ? (
                                  <span className={`badge fw-bold ${diffDays <= 3 ? 'bg-warning text-dark' : diffDays <= 7 ? 'bg-info text-dark' : 'bg-success'}`}>
                                    {diffDays === 1 ? 'Mañana' : `${diffDays} días`}
                                  </span>
                                ) : diffDays === 0 ? (
                                  <span className="badge bg-danger fw-bold">HOY</span>
                                ) : (
                                  <span className="badge bg-danger">Vencido {Math.abs(diffDays)}d</span>
                                )}
                              </td>
                              <td className="py-2">
                                <span className={`badge ${
                                  c.estadoCuenta === 'HABILITADO' ? 'bg-success' :
                                  c.estadoCuenta === 'POR_COBRAR' ? 'bg-warning text-dark' :
                                  c.estadoCuenta === 'PAGO_REALIZADO' ? 'bg-info text-dark' : 'bg-danger'
                                }`}>
                                  {c.estadoCuenta}
                                </span>
                              </td>
                              <td className="py-2">
                                <button
                                  className="btn btn-sm btn-primary rounded-pill px-3 py-1 fw-semibold shadow-sm d-inline-flex align-items-center gap-1"
                                  onClick={() => setHistoryClient(c)}
                                >
                                  <Eye size={13} />
                                  <span>Ver Historial</span>
                                </button>
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            )}


            {activeTab === 'reporte' && (
              <div className="custom-card p-4">
                <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
                  <div>
                    <h2 className="h6 fw-bold text-dark mb-1">Centro de Reportes General y Rendimiento Comercial</h2>
                    <p className="text-muted small mb-0">Consolidado general de ventas, recaudación e historial exportable a Excel.</p>
                  </div>
                  <div className="d-flex gap-2">
                    <button onClick={handleExportExcel} className="btn btn-success btn-sm fw-semibold d-flex align-items-center gap-1 shadow-sm">
                      <FileSpreadsheet size={15} />
                      <span>Exportar Excel de Clientes</span>
                    </button>
                    <button
                      onClick={() => loadData(token, true)}
                      disabled={isSyncing}
                      className="btn btn-outline-secondary btn-sm rounded-pill px-3 fw-semibold d-inline-flex align-items-center gap-1 shadow-sm"
                    >
                      <RefreshCw size={14} className={isSyncing ? 'spin-anim' : ''} />
                      <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar'}</span>
                    </button>
                  </div>
                </div>

                {/* Tarjetas de Rendimiento por Vendedor */}
                <h6 className="fw-bold text-dark mb-3">Resumen de Ventas por Vendedor (Día, Mes y Año)</h6>
                {sellerMetrics.length === 0 ? (
                  <div className="text-center text-muted py-3 border rounded bg-light mb-4 small">
                    No hay vendedores asignados a cuentas registradas actualmente.
                  </div>
                ) : (
                  <div className="row g-3 mb-4">
                    {sellerMetrics.map((sm) => (
                      <div key={sm.vendedor} className="col-md-6 col-lg-4">
                        <div className="custom-card p-3 border-top border-3 border-primary shadow-sm bg-light">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <strong className="text-dark d-flex align-items-center gap-2">
                              <User size={15} className="text-primary" />
                              <span>{sm.vendedor}</span>
                            </strong>
                            <span className="badge bg-primary text-white fw-bold">
                              {sm.totalClientes} Cliente{sm.totalClientes !== 1 ? 's' : ''}
                            </span>
                          </div>

                          <div className="d-flex flex-column gap-1 border-top pt-2 small">
                            <div className="d-flex justify-content-between align-items-center">
                              <span className="text-muted">Ventas Día:</span>
                              <strong className="text-success">S/ {sm.ventasDia.toFixed(2)}</strong>
                            </div>
                            <div className="d-flex justify-content-between align-items-center">
                              <span className="text-muted">Ventas Mes:</span>
                              <strong className="text-primary">S/ {sm.ventasMes.toFixed(2)}</strong>
                            </div>
                            <div className="d-flex justify-content-between align-items-center">
                              <span className="text-muted">Ventas Año:</span>
                              <strong className="text-dark">S/ {sm.ventasAno.toFixed(2)}</strong>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Barra de Múltiples Filtros */}
                <h6 className="fw-bold text-dark mb-2">Filtros Avanzados para el Reporte</h6>
                <div className="row g-2 mb-4 bg-light p-3 rounded border">
                  <div className="col-md-3">
                    <label className="form-label small fw-semibold text-muted mb-1">Periodo Venta (Ingresos)</label>
                    <select
                      className="form-select form-select-sm fw-bold border-primary"
                      value={periodoIngresoTipo}
                      onChange={(e) => setPeriodoIngresoTipo(e.target.value as any)}
                    >
                      <option value="TODOS">Todos los Periodos</option>
                      <option value="HOY">Ventas de Hoy (Día)</option>
                      <option value="MES_ACTUAL">Ventas del Mes Actual</option>
                      <option value="ANO_ACTUAL">Ventas del Año (2026)</option>
                      <option value="FECHA_CUSTOM">Seleccionar Fecha Específica...</option>
                    </select>
                  </div>

                  {periodoIngresoTipo === 'FECHA_CUSTOM' && (
                    <div className="col-md-2">
                      <label className="form-label small fw-semibold text-muted mb-1">Seleccionar Fecha</label>
                      <input
                        type="date"
                        className="form-control form-control-sm"
                        value={fechaCustomFilter}
                        onChange={(e) => setFechaCustomFilter(e.target.value)}
                      />
                    </div>
                  )}
                  <div className="col-md-3">
                    <label className="form-label small fw-semibold text-muted mb-1">Búsqueda General</label>
                    <input
                      className="form-control form-control-sm"
                      placeholder="RUC, Razón Social, Teléfono, Vendedor..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <div className="col-md-2">
                    <label className="form-label small fw-semibold text-muted mb-1">Vendedor</label>
                    <select className="form-select form-select-sm" value={sellerFilter} onChange={(e) => setSellerFilter(e.target.value)}>
                      <option value="TODOS">Todos Vendedores</option>
                      <option value="SIN_ASIGNAR">Sin Asignar</option>
                      {uniqueSellers.map((sName) => (
                        <option key={sName} value={sName}>{sName}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-2">
                    <label className="form-label small fw-semibold text-muted mb-1">Color Celular</label>
                    <select className="form-select form-select-sm" value={colorFilter} onChange={(e) => setColorFilter(e.target.value)}>
                      <option value="TODOS">Todos Colores</option>
                      <option value="VERDE">Verde (Celular 1)</option>
                      <option value="ROJO">Rojo (Celular 2)</option>
                      <option value="AMARILLO">Amarillo (Celular 3)</option>
                      <option value="AZUL">Azul (Celular 4)</option>
                    </select>
                  </div>
                  <div className="col-md-2">
                    <label className="form-label small fw-semibold text-muted mb-1">Régimen</label>
                    <select className="form-select form-select-sm" value={regimenFilter} onChange={(e) => setRegimenFilter(e.target.value)}>
                      <option value="TODOS">Todos Regímenes</option>
                      <option value="MYPE_TRIBUTARIO">MYPE</option>
                      <option value="RER">RER</option>
                      <option value="REGIMEN_GENERAL">General</option>
                      <option value="NRUS">NRUS</option>
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label small fw-semibold text-muted mb-1">Plan Contratado</label>
                    <select className="form-select form-select-sm" value={planFilter} onChange={(e) => setPlanFilter(e.target.value)}>
                      <option value="TODOS">Todos Planes</option>
                      <option value="INICIA">Inicia (S/ 19)</option>
                      <option value="EMPRENDE">Emprende (S/ 29)</option>
                      <option value="IMPULSA">Impulsa (S/ 39)</option>
                      <option value="EMPRESARIAL">Empresarial (S/ 59)</option>
                      <option value="LIDER">Líder (S/ 89)</option>
                    </select>
                  </div>
                  <div className="col-md-2">
                    <label className="form-label small fw-semibold text-muted mb-1">Estado Cuenta</label>
                    <select className="form-select form-select-sm" value={estadoCuentaFilter} onChange={(e) => setEstadoCuentaFilter(e.target.value)}>
                      <option value="TODOS">Todos Estados</option>
                      <option value="HABILITADO">HABILITADO</option>
                      <option value="POR_COBRAR">POR_COBRAR</option>
                      <option value="PAGO_REALIZADO">PAGO_REALIZADO</option>
                      <option value="BLOQUEADO">BLOQUEADO</option>
                    </select>
                  </div>
                  <div className="col-md-2">
                    <label className="form-label small fw-semibold text-muted mb-1">Capacitación</label>
                    <select className="form-select form-select-sm" value={capacitacionFilter} onChange={(e) => setCapacitacionFilter(e.target.value)}>
                      <option value="TODOS">Todas Capacitaciones</option>
                      <option value="PENDIENTE">PENDIENTE</option>
                      <option value="PROGRAMADA">PROGRAMADA</option>
                      <option value="REALIZADA">REALIZADA</option>
                    </select>
                  </div>
                  <div className="col-md-2">
                    <label className="form-label small fw-semibold text-muted mb-1">Suscripción</label>
                    <select className="form-select form-select-sm" value={suscripcionFilter} onChange={(e) => setSuscripcionFilter(e.target.value)}>
                      <option value="TODOS">Todas Suscripciones</option>
                      <option value="MENSUAL">Mensual</option>
                      <option value="ANUAL">Anual</option>
                    </select>
                  </div>
                </div>

                {/* Tabla de Resultados del Reporte */}
                {(() => {
                  const reportFilteredList = clients.filter(filterClientUnified);

                  return (
                    <div className="table-responsive">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <small className="text-muted fw-semibold">
                          Mostrando {reportFilteredList.length} registros filtrados
                        </small>
                      </div>
                      <table className="table table-hover align-middle mb-0 small">
                        <thead className="table-secondary">
                          <tr>
                            <th>Celular</th>
                            <th>Régimen</th>
                            <th>RUC / Razón Social</th>
                            <th>Teléfono / Correo</th>
                            <th>Plan / Monto</th>
                            <th>Vendedor</th>
                            <th>Acceso Sistema</th>
                            <th>Clave SOL</th>
                            <th>Estado</th>
                            <th>Capacitación</th>
                            <th>Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportFilteredList.length === 0 ? (
                            <tr>
                              <td colSpan={11} className="text-center text-muted py-4">
                                No hay resultados con los filtros seleccionados.
                              </td>
                            </tr>
                          ) : (
                            reportFilteredList.map((c) => (
                              <tr key={c.id}>
                                <td>
                                  <span
                                    className="d-inline-block rounded-circle border shadow-sm"
                                    style={{ width: '16px', height: '16px', backgroundColor: COLOR_MAP[c.colorTag || 'VERDE'].hex }}
                                    title={COLOR_MAP[c.colorTag || 'VERDE'].label}
                                  ></span>
                                </td>
                                <td><span className="badge bg-light text-dark border">{c.regimenTributario || '—'}</span></td>
                                <td>
                                  <strong className="text-dark d-block">{c.razonSocial}</strong>
                                  <span className="text-muted small">RUC: {c.ruc}</span>
                                </td>
                                <td>
                                  <div>{c.telefono}</div>
                                  <small className="text-muted">{c.email || '—'}</small>
                                </td>
                                <td>
                                  <strong className="text-primary">{c.planContratado}</strong>
                                  <div>S/ {c.montoMensual} ({c.tipoSuscripcion || 'MENSUAL'})</div>
                                </td>
                                <td>
                                  <span className="badge bg-secondary text-white">
                                    {c.vendedor || 'Sin Asignar'}
                                  </span>
                                </td>
                                <td>
                                  {c.linkSistema ? (
                                    <div>
                                      <a href={c.linkSistema} target="_blank" rel="noreferrer" className="text-primary text-decoration-underline fw-semibold small d-flex align-items-center gap-1">
                                        <ExternalLink size={12} />
                                        <span>Abrir Sistema</span>
                                      </a>
                                      <div className="small text-muted">User: <strong>{c.usuarioSistema || '—'}</strong></div>
                                    </div>
                                  ) : (
                                    <span className="text-muted small">Sin credenciales</span>
                                  )}
                                </td>
                                <td>
                                  <code>{c.usuarioSol ? `SOL: ${c.usuarioSol}` : '—'}</code>
                                </td>
                                <td>
                                  <span className={`badge ${c.estadoCuenta === 'HABILITADO' ? 'bg-success' : 'bg-danger'}`}>
                                    {c.estadoCuenta}
                                  </span>
                                </td>
                                <td>
                                  <span className="badge bg-info text-dark">{c.estadoCapacitacion}</span>
                                </td>
                                <td>
                                  <button onClick={() => setEditingClient(c)} className="btn btn-sm btn-outline-primary py-0 px-2" style={{ fontSize: '0.75rem' }}>
                                    Editar Credenciales
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>
            )}


            {activeTab === 'usuarios' && (
              currentUser?.rol !== 'ADMIN' ? (
                <div className="custom-card p-5 text-center my-4 border-danger shadow-sm">
                  <ShieldCheck size={48} className="text-danger mb-3 mx-auto" />
                  <h3 className="h5 fw-bold text-dark mb-2">Acceso Exclusivo para Administrador General</h3>
                  <p className="text-muted small mb-0">
                    Solo la cuenta Administrador tiene permisos para crear nuevos usuarios vendedores, modificar credenciales o eliminar cuentas del sistema.
                  </p>
                </div>
              ) : (
                <div className="custom-card p-4">
                  <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
                    <div>
                      <h2 className="h6 fw-bold text-dark mb-1">Gestión de Usuarios y Vendedores</h2>
                      <p className="text-muted small mb-0">Módulo exclusivo para Administrador: alta, edición y baja de colaboradores.</p>
                    </div>
                    <button onClick={() => setShowNewUserModal(true)} className="btn btn-primary btn-sm fw-semibold shadow-sm">
                      + Registrar Nuevo Vendedor / Usuario
                    </button>
                  </div>

                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>#</th>
                          <th>Nombre Completo</th>
                          <th>Usuario</th>
                          <th>Email</th>
                          <th>Rol</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usersList.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="text-center text-muted py-4">No hay usuarios adicionales registrados.</td>
                          </tr>
                        ) : (
                          usersList.map((u, idx) => (
                            <tr key={u.id}>
                              <td className="text-muted small fw-semibold">{idx + 1}</td>
                              <td><strong className="text-dark">{u.nombre || u.username}</strong></td>
                              <td><code>{u.username}</code></td>
                              <td>{u.email || '—'}</td>
                              <td>
                                <span className={`badge ${u.rol === 'ADMIN' ? 'bg-danger' : 'bg-primary'}`}>
                                  {u.rol}
                                </span>
                              </td>
                              <td>
                                <div className="d-flex gap-2">
                                  <button onClick={() => setEditingUser(u)} className="btn btn-sm btn-outline-primary">
                                    <Edit size={14} className="me-1" /> Editar
                                  </button>
                                  {u.username !== 'admin' && (
                                    <button onClick={() => handleDeleteUser(u)} className="btn btn-sm btn-outline-danger">
                                      <Trash2 size={14} className="me-1" /> Eliminar
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            )}
          </div>
        )}


        {editingClient && (
          <div className="modal d-block bg-dark bg-opacity-50" tabIndex={-1}>
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content rounded-3 shadow">
                <div className="modal-header border-bottom">
                  <h5 className="modal-title fw-bold">Editar Cliente: {editingClient.razonSocial}</h5>
                  <button type="button" className="btn-close" onClick={() => setEditingClient(null)}></button>
                </div>
                <form onSubmit={handleSaveEditClient}>
                  <div className="modal-body">
                    <div className="row g-3">
                      {/* --- Datos de la Empresa --- */}
                      <div className="col-12"><hr className="my-1" /><small className="text-muted fw-semibold text-uppercase">Datos de la Empresa</small></div>
                      <div className="col-md-4">
                        <label className="form-label">RUC</label>
                        <input className="form-control" name="ruc" defaultValue={editingClient.ruc} required />
                      </div>
                      <div className="col-md-8">
                        <label className="form-label">Razón Social</label>
                        <input className="form-control" name="razonSocial" defaultValue={editingClient.razonSocial} required />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Nombre Comercial</label>
                        <input className="form-control" name="nombreComercial" defaultValue={editingClient.nombreComercial || ''} />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Dirección Fiscal</label>
                        <input className="form-control" name="direccion" defaultValue={editingClient.direccion || ''} />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Departamento</label>
                        <input className="form-control" name="departamento" defaultValue={editingClient.departamento || ''} />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Provincia</label>
                        <input className="form-control" name="provincia" defaultValue={editingClient.provincia || ''} />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Distrito</label>
                        <input className="form-control" name="distrito" defaultValue={editingClient.distrito || ''} />
                      </div>

                      {/* --- Datos del Representante --- */}
                      <div className="col-12"><hr className="my-1" /><small className="text-muted fw-semibold text-uppercase">Representante Legal</small></div>
                      <div className="col-md-4">
                        <label className="form-label">Nombres</label>
                        <input className="form-control" name="nombres" defaultValue={editingClient.nombres || ''} />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Apellidos</label>
                        <input className="form-control" name="apellidos" defaultValue={editingClient.apellidos || ''} />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">DNI</label>
                        <input className="form-control" name="dni" defaultValue={editingClient.dni || ''} maxLength={8} />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">WhatsApp Empresa</label>
                        <input className="form-control" name="telefono" defaultValue={editingClient.telefono} required />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Email Empresa</label>
                        <input className="form-control" name="email" defaultValue={editingClient.email || ''} required />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Teléfono Personal</label>
                        <input className="form-control" name="telefonoPersonal" defaultValue={editingClient.telefonoPersonal || ''} />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Correo Personal</label>
                        <input className="form-control" name="emailPersonal" defaultValue={editingClient.emailPersonal || ''} />
                      </div>

                      {/* --- Plan y Acceso --- */}
                      <div className="col-12"><hr className="my-1" /><small className="text-muted fw-semibold text-uppercase">Plan y Acceso</small></div>
                      <div className="col-md-4">
                        <label className="form-label">Régimen Tributario</label>
                        <select
                          className="form-select"
                          name="regimenTributario"
                          defaultValue={editingClient.regimenTributario || 'MYPE_TRIBUTARIO'}
                        >
                          <option value="MYPE_TRIBUTARIO">MYPE Tributario</option>
                          <option value="REGIMEN_GENERAL">Régimen General</option>
                          <option value="RER">Régimen Especial - RER</option>
                          <option value="NRUS">Nuevo RUS - NRUS</option>
                        </select>
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">
                          Plan Contratado
                          {editingClient.estadoCuenta === 'HABILITADO' && (
                            <span className="badge bg-secondary ms-2" style={{ fontSize: '0.65rem' }}>Solo editable en Vencidos</span>
                          )}
                        </label>
                        <select
                          className="form-select"
                          name="planContratado"
                          defaultValue={editingClient.planContratado}
                          disabled={editingClient.estadoCuenta === 'HABILITADO'}
                        >
                          <option value="INICIA">Plan Inicia (S/ 19/mes - 50 Docs)</option>
                          <option value="EMPRENDE">Plan Emprende (S/ 29/mes - 100 Docs)</option>
                          <option value="IMPULSA">Plan Impulsa (S/ 39/mes - 200 Docs)</option>
                          <option value="EMPRESARIAL">Plan Empresarial (S/ 59/mes - 500 Docs)</option>
                          <option value="LIDER">Plan Líder (S/ 89/mes - 1000 Docs)</option>
                        </select>
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">
                          Tipo Suscripción
                          {editingClient.estadoCuenta === 'HABILITADO' && (
                            <span className="badge bg-secondary ms-2" style={{ fontSize: '0.65rem' }}>Solo editable en Vencidos</span>
                          )}
                        </label>
                        <select
                          className="form-select"
                          name="tipoSuscripcion"
                          defaultValue={editingClient.tipoSuscripcion || 'MENSUAL'}
                          disabled={editingClient.estadoCuenta === 'HABILITADO'}
                        >
                          <option value="MENSUAL">Mensual</option>
                          <option value="ANUAL">Anual</option>
                        </select>
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Color de Atención (Celular)</label>
                        <select className="form-select" name="colorTag" defaultValue={editingClient.colorTag || 'VERDE'}>
                          <option value="VERDE">🟢 Verde (Celular 1)</option>
                          <option value="ROJO">🔴 Rojo (Celular 2)</option>
                          <option value="AMARILLO">🟡 Amarillo (Celular 3)</option>
                          <option value="AZUL">🔵 Azul (Celular 4)</option>
                        </select>
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">
                          Vendedor Asignado
                          {editingClient.vendedor && editingClient.vendedor !== 'Sin Asignar' && currentUser?.rol !== 'ADMIN' && (
                            <span className="badge bg-warning text-dark ms-1" style={{ fontSize: '0.6rem' }}>Bloqueado (Solo Admin)</span>
                          )}
                        </label>
                        {editingClient.vendedor && editingClient.vendedor !== 'Sin Asignar' && currentUser?.rol !== 'ADMIN' ? (
                          <input
                            className="form-control bg-light"
                            name="vendedor"
                            defaultValue={editingClient.vendedor}
                            readOnly
                            disabled
                            title="Esta etiqueta de vendedor está locked. Solo el Administrador puede reasignarla."
                          />
                        ) : (
                          <select
                            className="form-select"
                            name="vendedor"
                            defaultValue={editingClient.vendedor || currentUser?.nombre || currentUser?.username || 'Sin Asignar'}
                          >
                            <option value="Sin Asignar">Sin Asignar</option>
                            {uniqueSellers.map((sName) => (
                              <option key={sName} value={sName}>👤 {sName}</option>
                            ))}
                            {currentUser && !uniqueSellers.includes(currentUser.nombre) && (
                              <option value={currentUser.nombre}>👤 {currentUser.nombre}</option>
                            )}
                          </select>
                        )}
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Estado de Cuenta</label>
                        <select className="form-select" name="estadoCuenta" defaultValue={editingClient.estadoCuenta}>
                          <option value="POR_COBRAR">POR_COBRAR</option>
                          <option value="PAGO_REALIZADO">PAGO_REALIZADO</option>
                          <option value="HABILITADO">HABILITADO</option>
                          <option value="BLOQUEADO">BLOQUEADO</option>
                        </select>
                      </div>

                      {/* --- Credenciales SOL --- */}
                      <div className="col-12"><hr className="my-1" /><small className="text-muted fw-semibold text-uppercase">Credenciales SOL</small></div>
                      <div className="col-md-6">
                        <label className="form-label">Usuario SOL</label>
                        <input className="form-control" name="usuarioSol" defaultValue={editingClient.usuarioSol || ''} />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Clave SOL</label>
                        <input className="form-control" name="claveSol" defaultValue={editingClient.claveSolCifrada || ''} />
                      </div>

                      {/* --- Credenciales del Sistema Otorgado --- */}
                      <div className="col-12"><hr className="my-1" /><small className="text-muted fw-semibold text-uppercase">Credenciales de Acceso al Sistema Otorgado</small></div>
                      <div className="col-md-6">
                        <label className="form-label">Link del Sistema</label>
                        <input className="form-control" name="linkSistema" placeholder="ej. https://empresa.facturacion.com" defaultValue={editingClient.linkSistema || ''} />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label">Usuario Sistema</label>
                        <input className="form-control" name="usuarioSistema" placeholder="ej. admin_user" defaultValue={editingClient.usuarioSistema || ''} />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label">Contraseña Sistema</label>
                        <input className="form-control" name="claveSistema" placeholder="ej. Clave123!" defaultValue={editingClient.claveSistema || ''} />
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer border-top">
                    <button type="button" className="btn btn-secondary" onClick={() => setEditingClient(null)}>Cancelar</button>
                    <button type="submit" className="btn btn-primary">Guardar Cambios</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}


        {trainingClient && (
          <div className="modal d-block bg-dark bg-opacity-50" tabIndex={-1}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content rounded-3 shadow">
                <div className="modal-header border-bottom">
                  <h5 className="modal-title fw-bold">Programar Capacitación: {trainingClient.razonSocial}</h5>
                  <button type="button" className="btn-close" onClick={() => setTrainingClient(null)}></button>
                </div>
                <form onSubmit={handleSaveTrainingSchedule}>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label">Fecha y Hora de Capacitación</label>
                      <input
                        type="datetime-local"
                        className="form-control"
                        value={trainingDateInput}
                        onChange={(e) => setTrainingDateInput(e.target.value)}
                        required
                      />
                    </div>

                    {prorrateoCalculado && (
                      <div className="p-3 bg-light rounded-3 border">
                        <h6 className="fw-bold text-primary mb-2">Cálculo de Prorrateo de Fin de Mes (Fórmula Mcobro)</h6>
                        <div className="small">
                          <div>Plan contratado: <strong>{trainingClient.planContratado} (S/ {trainingClient.montoMensual})</strong></div>
                          <div>Días del mes (Dtotal): <strong>{prorrateoCalculado.diasTotales} días</strong></div>
                          <div>Día de capacitación (Dcap): <strong>Día {prorrateoCalculado.diaCapacitacion}</strong></div>
                          {!prorrateoCalculado.isAnual && (
                            <div>Días no consumidos a descontar: <strong>{prorrateoCalculado.diaCapacitacion - 1} días</strong></div>
                          )}
                          <div className="fs-5 fw-bold text-success mt-2">
                            Cobro el último día del mes: S/ {prorrateoCalculado.montoProrrateado.toFixed(2)}
                          </div>
                          <div className="text-muted small">Fecha límite de pago ajustada: {prorrateoCalculado.fechaVencimiento}</div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="modal-footer border-top">
                    <button type="button" className="btn btn-secondary" onClick={() => setTrainingClient(null)}>Cancelar</button>
                    <button type="submit" className="btn btn-success">Confirmar Programación</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}


        {deletingClient && (
          <div className="modal d-block bg-dark bg-opacity-50" tabIndex={-1}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content rounded-3 shadow border-danger">
                <div className="modal-header border-bottom bg-danger text-white">
                  <h5 className="modal-title fw-bold">¿Eliminar Cliente Definitivamente?</h5>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setDeletingClient(null)}></button>
                </div>
                <div className="modal-body">
                  <p className="mb-2">¿Estás seguro de que deseas eliminar permanentemente a <strong>{deletingClient.razonSocial}</strong> (RUC: {deletingClient.ruc})?</p>
                  <div className="alert alert-warning mb-0 small">
                    Esta acción eliminará el registro permanentemente del sistema y no se podrá deshacer.
                  </div>
                </div>
                <div className="modal-footer border-top">
                  <button type="button" className="btn btn-secondary" onClick={() => setDeletingClient(null)}>Cancelar</button>
                  <button type="button" className="btn btn-danger" onClick={handleDeleteClientConfirm}>Sí, Eliminar Cliente</button>
                </div>
              </div>
            </div>
          </div>
        )}


        {/* Modal Cambio de Plan */}
        {cambioPlanClient && (
          <div className="modal d-block bg-dark bg-opacity-50" tabIndex={-1}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content rounded-3 shadow">
                <div className="modal-header border-bottom">
                  <h5 className="modal-title fw-bold">Cambio de Plan: {cambioPlanClient.razonSocial}</h5>
                  <button type="button" className="btn-close" onClick={() => setCambioPlanClient(null)}></button>
                </div>
                <div className="modal-body">
                  <p className="small text-muted mb-3">
                    Plan actual: <strong>{cambioPlanClient.planContratado}</strong> ({cambioPlanClient.tipoSuscripcion || 'MENSUAL'}) — S/ {cambioPlanClient.montoMensual.toFixed(2)}/mes
                  </p>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Nuevo Plan</label>
                      <select
                        className="form-select"
                        value={cambioPlanSeleccionado}
                        onChange={(e) => setCambioPlanSeleccionado(e.target.value)}
                      >
                        <option value="INICIA">Plan Inicia — S/ 19/mes (50 Docs)</option>
                        <option value="EMPRENDE">Plan Emprende — S/ 29/mes (100 Docs)</option>
                        <option value="IMPULSA">Plan Impulsa — S/ 39/mes (200 Docs)</option>
                        <option value="EMPRESARIAL">Plan Empresarial — S/ 59/mes (500 Docs)</option>
                        <option value="LIDER">Plan Líder — S/ 89/mes (1000 Docs)</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Tipo Suscripción</label>
                      <select
                        className="form-select"
                        value={cambioPlanTipo}
                        onChange={(e) => setCambioPlanTipo(e.target.value)}
                      >
                        <option value="MENSUAL">Mensual</option>
                        <option value="ANUAL">Anual</option>
                      </select>
                    </div>
                  </div>
                  {(() => {
                    const planPrices: Record<string, number> = { INICIA: 19, EMPRENDE: 29, IMPULSA: 39, EMPRESARIAL: 59, LIDER: 89 };
                    const montoPlan = planPrices[cambioPlanSeleccionado] || 29;
                    const montoTotal = cambioPlanTipo === 'ANUAL' ? montoPlan * 12 : montoPlan;
                    return (
                      <div className="alert alert-info mt-3 mb-0 small">
                        Nuevo plan: <strong>{cambioPlanSeleccionado}</strong> — Cobro a registrar: <strong>S/ {montoTotal.toFixed(2)}</strong>
                        {cambioPlanTipo === 'ANUAL' ? ' (anual)' : ' (mensual)'}
                      </div>
                    );
                  })()}
                </div>
                <div className="modal-footer border-top">
                  <button type="button" className="btn btn-secondary" onClick={() => setCambioPlanClient(null)}>Cancelar</button>
                  <button
                    type="button"
                    className="btn btn-warning text-dark fw-semibold"
                    onClick={async () => {
                      if (cambioPlanSeleccionado === cambioPlanClient.planContratado && cambioPlanTipo === (cambioPlanClient.tipoSuscripcion || 'MENSUAL')) {
                        alert('Selecciona un plan o tipo de suscripción diferente al actual.');
                        return;
                      }
                      await handleRenovarPlan(cambioPlanClient, cambioPlanSeleccionado, cambioPlanTipo);
                      setCambioPlanClient(null);
                    }}
                  >
                    Confirmar Cambio de Plan
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Overlay: Historial de Pagos y Renovaciones */}
        {historyClient && (
          <div className="modal d-block bg-dark bg-opacity-50" tabIndex={-1}>
            <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
              <div className="modal-content rounded-3 shadow">
                <div className="modal-header border-bottom bg-light">
                  <div>
                    <h5 className="modal-title fw-bold text-dark mb-0">Historial de Pagos y Renovaciones</h5>
                    <small className="text-muted">{historyClient.razonSocial} | RUC: {historyClient.ruc}</small>
                  </div>
                  <button type="button" className="btn-close" onClick={() => setHistoryClient(null)}></button>
                </div>
                <div className="modal-body p-4">
                  {/* Resumen y Detalle de Cliente */}
                  {(() => {
                    const pro = calcularProrrateoEntero(historyClient.planContratado, historyClient.tipoSuscripcion, historyClient.fechaCapacitacion, historyClient.montoMensual);
                    const rawPayments = payments.filter((p) => p.clienteId === historyClient.id);

                    // Deduplicación inteligente: evita calcular/mostrar entradas duplicadas de Pago Inicial
                    const uniquePaymentsMap = new Map<string, Payment>();
                    for (const p of rawPayments) {
                      const isInitial = !p.codigoOperacion || p.codigoOperacion.startsWith('CONFIRM-PAGO') || p.codigoOperacion.startsWith('PAGO-INICIAL');
                      const key = isInitial
                        ? `INITIAL-${Math.round(p.monto || 0)}`
                        : (p.codigoOperacion || `${p.periodoMesAno}-${p.monto}`);

                      if (!uniquePaymentsMap.has(key)) {
                        uniquePaymentsMap.set(key, p);
                      } else {
                        const prev = uniquePaymentsMap.get(key)!;
                        if (!prev.fechaPago && p.fechaPago) uniquePaymentsMap.set(key, p);
                        else if (!prev.codigoOperacion && p.codigoOperacion) uniquePaymentsMap.set(key, p);
                      }
                    }

                    const cPayments = Array.from(uniquePaymentsMap.values())
                      .sort((a, b) => new Date(b.fechaPago || '').getTime() - new Date(a.fechaPago || '').getTime());

                    const totalMonto = cPayments.reduce((acc, curr) => acc + (curr.monto || 0), 0);

                    return (
                      <>
                        <div className="row g-3 mb-4">
                          <div className="col-md-3">
                            <div className="p-3 bg-light rounded-3 border">
                              <small className="text-muted d-block fw-semibold text-uppercase">Plan Actual</small>
                              <strong className="text-primary fs-6">{historyClient.planContratado} ({historyClient.tipoSuscripcion || 'MENSUAL'})</strong>
                            </div>
                          </div>
                          <div className="col-md-3">
                            <div className="p-3 bg-light rounded-3 border">
                              <small className="text-muted d-block fw-semibold text-uppercase">Inicio de Plan</small>
                              <strong className="text-dark fs-6">
                                {historyClient.fechaCapacitacion
                                  ? new Date(historyClient.fechaCapacitacion).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })
                                  : 'Día de capacitación'}
                              </strong>
                              <small className="text-muted d-block">Día de Capacitación</small>
                            </div>
                          </div>
                          <div className="col-md-3">
                            <div className="p-3 bg-light rounded-3 border">
                              <small className="text-muted d-block fw-semibold text-uppercase">Representante</small>
                              <strong className="text-dark fs-6">{historyClient.nombres ? `${historyClient.nombres} ${historyClient.apellidos || ''}` : 'No especificado'}</strong>
                              {historyClient.dni && <small className="text-muted d-block">DNI: {historyClient.dni}</small>}
                            </div>
                          </div>
                          <div className="col-md-3">
                            <div className="p-3 bg-light rounded-3 border">
                              <small className="text-muted d-block fw-semibold text-uppercase">Próximo Cobro / Total</small>
                              <strong className="text-success fs-6">S/ {pro.montoProrrateado}</strong>
                              <small className="text-muted d-block">Acumulado: S/ {Math.round(totalMonto)}</small>
                            </div>
                          </div>
                        </div>

                        {/* Tabla Cronológica de Pagos */}
                        <h6 className="fw-bold text-dark mb-3">Detalle de Meses, Pagos y Renovaciones</h6>
                        {cPayments.length === 0 ? (
                          <div className="text-center text-muted py-4 border rounded-3 bg-light">
                            No hay pagos ni renovaciones registrados para este cliente.
                          </div>
                        ) : (
                          <div className="table-responsive">
                            <table className="table table-hover table-bordered align-middle mb-0 small">
                              <thead className="table-secondary">
                                <tr>
                                  <th>#</th>
                                  <th>Fecha de Pago</th>
                                  <th>Fecha Inicio de Plan</th>
                                  <th>Mes</th>
                                  <th>Tipo de Operación</th>
                                  <th>Monto Registrado</th>
                                </tr>
                              </thead>
                              <tbody>
                                {cPayments.map((p, idx) => {
                                  const pDate = p.fechaPago ? new Date(p.fechaPago) : new Date();
                                  const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
                                  let mesTexto = '';
                                  if (p.periodoMesAno && p.periodoMesAno.includes('/')) {
                                    const parts = p.periodoMesAno.split('/');
                                    const mNum = parseInt(parts[0], 10);
                                    const yStr = parts[1] || `${pDate.getFullYear()}`;
                                    if (!isNaN(mNum) && mNum >= 1 && mNum <= 12) {
                                      mesTexto = `${MESES[mNum - 1]} ${yStr}`;
                                    } else {
                                      mesTexto = p.periodoMesAno;
                                    }
                                  } else if (p.periodoMesAno) {
                                    mesTexto = p.periodoMesAno;
                                  } else {
                                    mesTexto = `${MESES[pDate.getMonth()]} ${pDate.getFullYear()}`;
                                  }

                                  const fechaInicioPlan = historyClient.fechaCapacitacion
                                    ? new Date(historyClient.fechaCapacitacion).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })
                                    : pDate.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });

                                  const isRenovacion = p.codigoOperacion?.startsWith('RENOVACION');
                                  const isCambioPlan = p.codigoOperacion?.startsWith('CAMBIPLAN');
                                  const tipoOperacionNombre = isRenovacion ? 'Renovación' : isCambioPlan ? 'Cambio de Plan' : 'Pago Inicial';
                                  const tipoOperacionBadgeClass = isRenovacion ? 'bg-info text-dark' : isCambioPlan ? 'bg-warning text-dark' : 'bg-success';

                                  const montoEntero = Math.round(p.monto || 0);

                                  return (
                                    <tr key={p.id || idx}>
                                      <td className="text-muted fw-semibold">{cPayments.length - idx}</td>
                                      <td>{p.fechaPago ? new Date(p.fechaPago).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'}</td>
                                      <td><strong className="text-dark">{fechaInicioPlan}</strong></td>
                                      <td><span className="badge bg-light text-dark border fw-bold">{mesTexto}</span></td>
                                      <td>
                                        <span className={`badge ${tipoOperacionBadgeClass}`}>
                                          {tipoOperacionNombre}
                                        </span>
                                      </td>
                                      <td className="fw-bold text-success fs-6">S/ {montoEntero}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
                <div className="modal-footer border-top">
                  <button type="button" className="btn btn-secondary" onClick={() => setHistoryClient(null)}>Cerrar Historial</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Registrar Nuevo Usuario */}
        {showNewUserModal && (
          <div className="modal d-block bg-dark bg-opacity-50" tabIndex={-1}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content rounded-3 shadow">
                <div className="modal-header border-bottom">
                  <h5 className="modal-title fw-bold">Registrar Nuevo Vendedor / Usuario</h5>
                  <button type="button" className="btn-close" onClick={() => setShowNewUserModal(false)}></button>
                </div>
                <form onSubmit={handleSaveUser}>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label">Nombre Completo del Vendedor</label>
                      <input className="form-control" name="nombre" placeholder="ej. Juan Pérez" required />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Nombre de Usuario (Login)</label>
                      <input className="form-control" name="username" placeholder="ej. juanperez" required />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Correo Electrónico</label>
                      <input type="email" className="form-control" name="email" placeholder="juan@facturacion.com" required />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Contraseña</label>
                      <input type="password" className="form-control" name="password" required />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Rol de Acceso</label>
                      <select className="form-select" name="rol" defaultValue="VENDEDOR">
                        <option value="VENDEDOR">Vendedor (Colaborador)</option>
                        <option value="ADMIN">Administrador General</option>
                      </select>
                    </div>
                  </div>
                  <div className="modal-footer border-top">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowNewUserModal(false)}>Cancelar</button>
                    <button type="submit" className="btn btn-primary">Registrar Usuario</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal Editar Usuario */}
        {editingUser && (
          <div className="modal d-block bg-dark bg-opacity-50" tabIndex={-1}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content rounded-3 shadow">
                <div className="modal-header border-bottom">
                  <h5 className="modal-title fw-bold">Editar Usuario: {editingUser.username}</h5>
                  <button type="button" className="btn-close" onClick={() => setEditingUser(null)}></button>
                </div>
                <form onSubmit={handleSaveUser}>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label">Nombre Completo</label>
                      <input className="form-control" name="nombre" defaultValue={editingUser.nombre} required />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Correo Electrónico</label>
                      <input type="email" className="form-control" name="email" defaultValue={editingUser.email} required />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Nueva Contraseña (Opcional)</label>
                      <input type="password" className="form-control" name="password" placeholder="Dejar en blanco para mantener actual" />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Rol de Acceso</label>
                      <select className="form-select" name="rol" defaultValue={editingUser.rol}>
                        <option value="VENDEDOR">Vendedor (Colaborador)</option>
                        <option value="ADMIN">Administrador General</option>
                      </select>
                    </div>
                  </div>
                  <div className="modal-footer border-top">
                    <button type="button" className="btn btn-secondary" onClick={() => setEditingUser(null)}>Cancelar</button>
                    <button type="submit" className="btn btn-primary">Guardar Cambios</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
