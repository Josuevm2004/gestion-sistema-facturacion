'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import {
  Building2,
  CheckCircle2,
  KeyRound,
  ArrowRight,
  Info,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { api } from '@/lib/api';

type ClientRegistration = {
  id: number;
  ruc: string;
  razonSocial: string;
  nombreComercial?: string;
  planContratado: string;
  montoMensual: number;
  tipoSuscripcion?: 'MENSUAL' | 'ANUAL';
  subdominio?: string;
  usuarioAdminFacturador?: string;
  claveTemporal?: string;
  urlAcceso?: string;
  estadoPago?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  departamento?: string;
  provincia?: string;
  distrito?: string;
  nombres?: string;
  apellidos?: string;
  dni?: string;
  entornoNombre?: string;
};

type DbSubscription = {
  id: number;
  planId: number;
  planNombre: string;
  tipoSuscripcion: 'MENSUAL' | 'ANUAL';
  precio: number;
};

type DbEntorno = {
  id: number;
  nombre: string;
};

const PLAN_DETAILS: Record<string, { docs: string; users: string; features: string }> = {
  INICIA: { docs: '50 Boletas o Facturas', users: '1 Usuario', features: 'Web y aplicativo' },
  EMPRENDE: { docs: '100 Boletas o Facturas', users: '2 Usuarios', features: 'Web y aplicativo' },
  IMPULSA: { docs: '200 Boletas o Facturas', users: '3 Usuarios', features: 'Web, app y ticketera' },
  EMPRESARIAL: { docs: '500 Boletas o Facturas', users: '4 Usuarios', features: 'Web, app y ticketera' },
  LIDER: { docs: '1000 Boletas o Facturas', users: '6 Usuarios', features: 'Web, app y ticketera' },
};

function normalizePlanName(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/^PLAN\s+/, '')
    .replace('INICIAL', 'INICIA')
    .trim();
}

export default function FormularioPublicoPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [client, setClient] = useState<ClientRegistration | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string>('EMPRENDE');
  const [regimenTributario, setRegimenTributario] = useState<string>('MYPE_TRIBUTARIO');
  const [tipoSuscripcion, setTipoSuscripcion] = useState<'MENSUAL' | 'ANUAL'>('MENSUAL');
  const [entornos, setEntornos] = useState<DbEntorno[]>([
    { id: 1, nombre: 'Producción' },
    { id: 2, nombre: 'Control Interno' },
  ]);
  const [selectedEntornoId, setSelectedEntornoId] = useState<number>(1);
  const [message, setMessage] = useState<{ type: 'success' | 'warning' | 'info' | 'danger'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subscriptions, setSubscriptions] = useState<DbSubscription[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [plansError, setPlansError] = useState<string | null>(null);
  const [sunatValidation, setSunatValidation] = useState<'idle' | 'validating' | 'valid' | 'invalid' | 'unavailable'>('idle');
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    let mounted = true;
    api.get('/admin/planes/suscripciones')
      .then((response) => {
        const rows = Array.isArray(response.data?.data) ? response.data.data : [];
        const normalized: DbSubscription[] = rows
          .filter((row: any) => row?.activo !== false && row?.plan?.id && row?.plan?.nombrePlan && row?.tipoSuscripcion && row?.precio != null)
          .map((row: any) => ({
            id: Number(row.id),
            planId: Number(row.plan.id),
            planNombre: row.plan.nombrePlan,
            tipoSuscripcion: String(row.tipoSuscripcion).toUpperCase() as 'MENSUAL' | 'ANUAL',
            precio: Number(row.precio),
          }));
        if (!mounted) return;
        setSubscriptions(normalized);
        if (!normalized.some((s) => normalizePlanName(s.planNombre) === selectedPlan)) {
          setSelectedPlan(normalizePlanName(normalized[0]?.planNombre || ''));
        }
      })
      .catch(() => {
        if (mounted) setPlansError('No se pudieron cargar los planes desde la base de datos.');
      })
      .finally(() => {
        if (mounted) setPlansLoading(false);
      });

    api.get('/public/entornos')
      .then((response) => {
        const rows = Array.isArray(response.data?.data) ? response.data.data : [];
        if (mounted && rows.length > 0) {
          setEntornos(rows.map((r: any) => ({ id: Number(r.id), nombre: r.nombre })));
        }
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, []);

  const availablePlans = Array.from(
    new Map(
      subscriptions.map((subscription) => [
        subscription.planId,
        { id: subscription.planId, key: normalizePlanName(subscription.planNombre), name: subscription.planNombre },
      ])
    ).values()
  );
  const selectedSubscription = subscriptions.find(
    (subscription) => normalizePlanName(subscription.planNombre) === selectedPlan && subscription.tipoSuscripcion === tipoSuscripcion
  );

  const selectedEntorno = entornos.find((e) => e.id === selectedEntornoId) || entornos[0];
  const isProduccion = !selectedEntorno?.nombre?.toLowerCase().includes('interno');

  function subscriptionPrice(planId: number) {
    return subscriptions.find((subscription) => subscription.planId === planId && subscription.tipoSuscripcion === tipoSuscripcion)?.precio;
  }

  function resetSunatValidation() {
    setSunatValidation('idle');
  }

  async function handleValidateSunat() {
    if (!isProduccion) return;
    const form = formRef.current;
    if (!form) return;

    const formData = new FormData(form);
    const ruc = String(formData.get('ruc') || '').trim();
    const usuarioSol = String(formData.get('usuarioSol') || '').trim();
    const claveSol = String(formData.get('claveSol') || '');

    if (!/^\d{11}$/.test(ruc) || !usuarioSol || !claveSol) {
      setSunatValidation('invalid');
      setMessage({ type: 'warning', text: 'Completa el RUC, Usuario SOL y Clave SOL antes de validar.' });
      return;
    }

    setSunatValidation('validating');
    setMessage(null);

    try {
      const response = await api.post('/public/sunat/validar-credenciales', {
        ruc,
        usuarioSol,
        claveSol,
      });
      const resultado = response.data?.data;
      const codigo = resultado?.codigo;

      if (resultado?.valido) {
        setSunatValidation('valid');
        setMessage({ type: 'success', text: 'Perfil validado correctamente con SUNAT.' });
        return;
      }

      const noDisponible = codigo === 'SUNAT_NO_DISPONIBLE' || codigo === 'SUNAT_NO_CONFIGURADA';
      const requiereCaptcha = codigo === 'SUNAT_REQUIERE_CAPTCHA';
      setSunatValidation(noDisponible || requiereCaptcha ? 'unavailable' : 'invalid');
      setMessage({
        type: noDisponible || requiereCaptcha ? 'warning' : 'danger',
        text: codigo === 'SUNAT_NO_CONFIGURADA'
          ? 'La validación SUNAT aún no está configurada en el servidor.'
          : requiereCaptcha
            ? 'SUNAT solicita una verificación adicional. Ingresa directamente al portal de SUNAT para validarte.'
          : codigo === 'SUNAT_NO_DISPONIBLE'
            ? 'SUNAT no está disponible en este momento. Intenta nuevamente más tarde.'
            : 'El RUC, Usuario SOL o Clave SOL no fueron aceptados por SUNAT.',
      });
    } catch {
      setSunatValidation('unavailable');
      setMessage({ type: 'warning', text: 'No se pudo conectar con SUNAT. Intenta nuevamente.' });
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;

    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    if (!selectedSubscription) {
      setMessage({ type: 'danger', text: 'El plan seleccionado no tiene una tarifa activa para esta modalidad.' });
      setIsSubmitting(false);
      return;
    }

    const formData = new FormData(form);
    const rawRuc = String(formData.get('ruc') || '').trim();
    const rucFinal = rawRuc || (!isProduccion ? ('99' + Date.now().toString().slice(-9)) : '');

    const payload = {
      ruc: rucFinal,
      razonSocial: formData.get('razonSocial') as string,
      nombreComercial: (formData.get('nombreComercial') as string) || (formData.get('razonSocial') as string),
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
      regimenTributario: isProduccion ? ((formData.get('regimenTributario') as string) || 'MYPE_TRIBUTARIO') : 'MYPE_TRIBUTARIO',
      planId: selectedSubscription.planId,
      planContratado: selectedPlan,
      tipoSuscripcion: tipoSuscripcion,
      entornoId: selectedEntornoId,
      usuarioSol: isProduccion ? ((formData.get('usuarioSol') as string) || '') : '',
      claveSol: isProduccion ? ((formData.get('claveSol') as string) || '') : '',
      dniRepresentante: isProduccion ? ((formData.get('dniRepresentante') as string) || null) : null,
      correoRepresentante: isProduccion ? ((formData.get('correoRepresentante') as string) || null) : null,
      primeraVezOProviene: isProduccion ? ((formData.get('primeraVezOProviene') as string) || null) : null,
      usabaSunatAnteriormente: isProduccion ? ((formData.get('usabaSunatAnteriormente') as string) || null) : null,
      tipoIgv: isProduccion ? ((formData.get('tipoIgv') as string) || null) : null,
      comoNosConocio: formData.get('comoNosConocio') as string,
      usoSistemaAnterior: formData.get('usoSistemaAnterior') === 'true',
      comentarios: formData.get('comentarios') as string,
    };

    try {
      const { data } = await api.post('/public/registro', payload);
      const registeredData = data.data;
      const entornoNombre = entornos.find(e => e.id === selectedEntornoId)?.nombre || (isProduccion ? 'Producción' : 'Control Interno');

      setClient({
        id: registeredData.id || registeredData.clienteId,
        ruc: registeredData.ruc || payload.ruc,
        razonSocial: registeredData.razonSocial || payload.razonSocial,
        nombreComercial: registeredData.nombreComercial || payload.nombreComercial,
        planContratado: registeredData.planNombre || registeredData.planContratado || selectedPlan,
        montoMensual: Number(registeredData.precioPlan ?? selectedSubscription.precio),
        tipoSuscripcion,
        telefono: payload.telefono,
        email: payload.email,
        direccion: payload.direccion,
        departamento: payload.departamento,
        provincia: payload.provincia,
        distrito: payload.distrito,
        nombres: payload.nombres,
        apellidos: payload.apellidos,
        dni: payload.dni,
        entornoNombre,
        subdominio: registeredData.subdominio || registeredData.acceso?.subdominio,
      });
      setStep(2);
      setMessage({ type: 'success', text: 'Datos registrados correctamente. Por favor bríndenos una captura del formulario para su activación.' });

      // Notificar en tiempo real al panel administrativo si está abierto en otra pestaña o ventana
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem('miquipu_last_registration', Date.now().toString());
          if ('BroadcastChannel' in window) {
            const bc = new BroadcastChannel('miquipu_events');
            bc.postMessage({ type: 'NEW_CLIENT_REGISTERED', client: registeredData });
            bc.close();
          }
        }
      } catch (e) {}
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Error al procesar el registro del cliente';
      setMessage({ type: 'danger', text: `Error en el servidor: ${errorMsg}` });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="bg-white min-h-screen pb-5">

      <nav className="navbar navbar-dark bg-dark sticky-top py-2">
        <div className="container">
          <Link href="/" className="navbar-brand d-flex align-items-center gap-2">
            <Image src="/logo.jpeg" alt="Miquipu Logo" width={36} height={36} className="rounded-2" />
            <span className="brand-title">Miquipu</span>
            <span className="brand-badge">Facturacion Electronica</span>
          </Link>
        </div>
      </nav>

      <main className="container my-4" style={{ maxWidth: '980px' }}>
        {message && (
          <div className={`alert alert-${message.type} d-flex align-items-center gap-2 shadow-sm rounded-3 mb-4`}>
            <Info size={18} />
            <div>{message.text}</div>
          </div>
        )}


        <div className="row justify-content-center mb-4">
          <div className="col-md-7">
            <div className="d-flex justify-content-between align-items-center position-relative">
              <div className="position-absolute top-50 start-0 end-0 translate-middle-y bg-light" style={{ height: '3px', zIndex: 0 }}></div>
              <div className="position-absolute top-50 start-0 translate-middle-y bg-primary" style={{ height: '3px', width: step === 1 ? '0%' : '100%', zIndex: 0, transition: 'width 0.3s' }}></div>

              <div className="d-flex flex-column align-items-center position-relative" style={{ zIndex: 1 }}>
                <div className={`rounded-circle d-flex align-items-center justify-content-center fw-bold ${step >= 1 ? 'bg-primary text-white' : 'bg-light text-muted'}`} style={{ width: '36px', height: '36px', fontSize: '0.9rem' }}>1</div>
                <span className="small fw-semibold mt-1">1. Registro de Datos</span>
              </div>
              <div className="d-flex flex-column align-items-center position-relative" style={{ zIndex: 1 }}>
                <div className={`rounded-circle d-flex align-items-center justify-content-center fw-bold ${step >= 2 ? 'bg-primary text-white' : 'bg-light text-muted'}`} style={{ width: '36px', height: '36px', fontSize: '0.9rem' }}>2</div>
                <span className="small fw-semibold mt-1">2. Datos de Pago</span>
              </div>
            </div>
          </div>
        </div>


        {step === 1 && (
          <div className="custom-card p-4 p-md-5">
            <div className="d-flex align-items-center gap-3 border-bottom pb-3 mb-4">
              <div className="bg-primary-subtle p-3 rounded-3 text-primary">
                <Building2 size={32} />
              </div>
              <div>
                <h1 className="h4 fw-bold text-dark mb-0">Formulario de Registro de Cliente</h1>
                <p className="text-muted small mb-0">Portal público de onboarding para facturación electrónica.</p>
              </div>
            </div>

            <form ref={formRef} onSubmit={handleSubmit} className="row g-3 needs-validation" noValidate>

              <div className="col-12">
                <h2 className="h6 fw-bold text-primary text-uppercase mb-1">1. Encuesta Inicial</h2>
              </div>

              <div className="col-md-6">
                <label className="form-label">¿Cómo nos conoció?</label>
                <select name="comoNosConocio" className="form-select">
                  <option value="RECOMENDACION">Recomendación de un conocido</option>
                  <option value="FACEBOOK">Facebook / Instagram</option>
                  <option value="GOOGLE">Búsqueda en Google</option>
                  <option value="TIKTOK">TikTok</option>
                  <option value="OTRO">Otro medio</option>
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label">¿Usó un sistema de facturación anterior?</label>
                <select name="usoSistemaAnterior" className="form-select">
                  <option value="false">No, primera vez facturando</option>
                  <option value="true">Sí, emitía con otro sistema</option>
                </select>
              </div>

              <div className="col-12">
                <label className="form-label">Comentarios (opcional)</label>
                <input type="text" name="comentarios" className="form-control" placeholder="Notas adicionales..." />
              </div>

              {/* SECCIÓN 2: MODALIDAD DE ENTORNO */}
              <div className="col-12 mt-4">
                <h2 className="h6 fw-bold text-primary text-uppercase mb-1">2. Modalidad de Entorno</h2>
                <p className="text-muted small mb-3">Elija si su facturación se conectará directamente a SUNAT o funcionará para control interno.</p>

                <div className="row g-3">
                  {entornos.map((entorno) => {
                    const isSelected = selectedEntornoId === entorno.id;
                    const esProd = !entorno.nombre.toLowerCase().includes('interno');
                    return (
                      <div key={entorno.id} className="col-md-6">
                        <div
                          onClick={() => setSelectedEntornoId(entorno.id)}
                          className={`p-3 rounded-3 border h-100 transition-all ${
                            isSelected
                              ? 'border-primary bg-primary bg-opacity-10 shadow-sm'
                              : 'border-light-subtle bg-white'
                          }`}
                          style={{ cursor: 'pointer', borderWidth: isSelected ? '2px' : '1px' }}
                        >
                          <div className="d-flex align-items-center justify-content-between mb-1">
                            <strong className="text-dark fs-6">{entorno.nombre}</strong>
                            {isSelected && (
                              <span className="badge rounded-pill bg-primary" style={{ fontSize: '0.7rem' }}>
                                Seleccionado
                              </span>
                            )}
                          </div>
                          <p className="small text-muted mb-0">
                            {esProd
                              ? 'Facturación electrónica oficial conectada a SUNAT. Requiere credenciales Clave SOL.'
                              : 'Gestión y notas de venta de uso interno. No requiere credenciales Clave SOL.'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SECCIÓN 3: DATOS TRIBUTARIOS */}
              <div className="col-12 mt-4">
                <h2 className="h6 fw-bold text-primary text-uppercase mb-1">3. Datos de la Empresa</h2>
              </div>

              <div className="col-md-4">
                <label className="form-label">RUC {isProduccion ? '(11 dígitos)' : '(opcional)'}</label>
                <input
                  type="text"
                  name="ruc"
                  className="form-control"
                  placeholder={isProduccion ? '20601234567' : '20601234567 (opcional)'}
                  pattern={isProduccion ? '^(10|20)\\d{9}$' : undefined}
                  maxLength={11}
                  required={isProduccion}
                  onChange={resetSunatValidation}
                />
                <div className="invalid-feedback">
                  {isProduccion ? 'Ingresa un RUC válido de 11 dígitos.' : 'Formato de RUC no válido.'}
                </div>
              </div>

              <div className="col-md-4">
                <label className="form-label">Razón Social</label>
                <input type="text" name="razonSocial" className="form-control" placeholder="Mi Empresa S.A.C." required />
                <div className="invalid-feedback">Ingresa la razón social.</div>
              </div>

              <div className="col-md-4">
                <label className="form-label">Nombre Comercial</label>
                <input type="text" name="nombreComercial" className="form-control" placeholder="Marca comercial" />
              </div>

              <div className="col-md-6">
                <label className="form-label">Dirección Fiscal</label>
                <input type="text" name="direccion" className="form-control" placeholder="Av. Principal 123" required />
                <div className="invalid-feedback">Ingresa la dirección fiscal.</div>
              </div>

              <div className="col-md-3">
                <label className="form-label">Departamento</label>
                <input type="text" name="departamento" className="form-control" placeholder="Lima" required />
              </div>

              <div className="col-md-3">
                <label className="form-label">Provincia</label>
                <input type="text" name="provincia" className="form-control" placeholder="Lima" required />
              </div>

              <div className="col-md-3">
                <label className="form-label">Distrito</label>
                <input type="text" name="distrito" className="form-control" placeholder="Miraflores" required />
              </div>

              <div className="col-md-3">
                <label className="form-label">Celular WhatsApp Empresa</label>
                <input type="text" name="telefono" className="form-control" placeholder="987654321" pattern="^9\d{8}$" maxLength={9} required />
                <div className="invalid-feedback">Número de 9 dígitos.</div>
              </div>

              <div className="col-md-6">
                <label className="form-label">Correo Electrónico Empresa</label>
                <input type="email" name="email" className="form-control" placeholder="correo@miempresa.pe" required />
                <div className="invalid-feedback">Correo válido requerido.</div>
              </div>

              {isProduccion && (
                <div className="col-md-6">
                  <label className="form-label">Régimen Tributario</label>
                  <select
                    name="regimenTributario"
                    className="form-select"
                    value={regimenTributario}
                    onChange={(e) => setRegimenTributario(e.target.value)}
                    required
                  >
                    <option value="MYPE_TRIBUTARIO">Régimen MYPE Tributario</option>
                    <option value="REGIMEN_GENERAL">Régimen General</option>
                    <option value="RER">Régimen Especial (RER)</option>
                    <option value="NRUS">Nuevo RUS (NRUS)</option>
                  </select>
                </div>
              )}

              {/* SECCIÓN 4: DATOS PERSONALES */}
              <div className="col-12 mt-4">
                <h2 className="h6 fw-bold text-primary text-uppercase mb-1">4. Datos Personales del Representante</h2>
              </div>

              <div className="col-md-4">
                <label className="form-label">Nombres</label>
                <input type="text" name="nombres" className="form-control" placeholder="Juan Carlos" required />
              </div>

              <div className="col-md-4">
                <label className="form-label">Apellidos</label>
                <input type="text" name="apellidos" className="form-control" placeholder="Pérez Gómez" required />
              </div>

              <div className="col-md-4">
                <label className="form-label">DNI</label>
                <input type="text" name="dni" className="form-control" placeholder="12345678" maxLength={8} pattern="^\d{8}$" required />
              </div>

              <div className="col-md-6">
                <label className="form-label">Correo Personal</label>
                <input type="email" name="emailPersonal" className="form-control" placeholder="juan.perez@gmail.com" />
              </div>

              <div className="col-md-6">
                <label className="form-label">Celular Personal</label>
                <input type="text" name="telefonoPersonal" className="form-control" placeholder="912345678" maxLength={9} />
              </div>

              {/* CONDICIONAL: SOLO SI ES PRODUCCIÓN SE SOLICITAN CREDENCIALES SOL Y VINCULACIÓN */}
              {isProduccion ? (
                <>
                  {/* DATOS DEL REPRESENTANTE ADICIONAL */}
                  <div className="col-12 mt-4">
                    <h2 className="h6 fw-bold text-primary text-uppercase mb-1">Datos del Representante (Diferente al dueño y socios)</h2>
                    <p className="text-muted small mb-0">Datos de vinculación requeridos para la gestión de su facturación electrónica ante SUNAT.</p>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Número de DNI (Diferente al dueño y socios, mayor de edad)</label>
                    <input
                      type="text"
                      name="dniRepresentante"
                      className="form-control"
                      placeholder="12345678"
                      maxLength={8}
                      pattern="^\d{8}$"
                    />
                    <div className="form-text text-muted small">
                      DNI de un tercero mayor de edad diferente al dueño y socios.
                    </div>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Correo (Diferente al dueño y socios)</label>
                    <input
                      type="email"
                      name="correoRepresentante"
                      className="form-control"
                      placeholder="correo.tercero@ejemplo.com"
                    />
                    <div className="form-text text-muted small">
                      Correo electrónico diferente al dueño y socios.
                    </div>
                  </div>

                  {/* SECCIÓN 5: CLAVE SOL */}
                  <div className="col-12 mt-4">
                    <div className="p-3 rounded-3 border bg-light">
                      <div className="alert alert-info d-flex align-items-center gap-2 mb-3 border-0 shadow-sm rounded-3" style={{ backgroundColor: '#eef6ff', color: '#0056b3' }}>
                        <Info size={20} className="flex-shrink-0" />
                        <div>
                          <strong>Importante:</strong> Estas credenciales son necesarias para activar nuestro sistema de facturación electrónica y completar la afiliación con SUNAT.
                        </div>
                      </div>
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <KeyRound size={16} className="text-primary" />
                        <strong className="text-dark">5. Credenciales Clave SOL (SUNAT)</strong>
                      </div>
                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className="form-label">Usuario SOL</label>
                          <input type="text" name="usuarioSol" className="form-control" placeholder="MODDATOS" required onChange={resetSunatValidation} />
                          <div className="invalid-feedback">Ingresa tu usuario SOL.</div>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label">Clave SOL</label>
                          <input type="password" name="claveSol" className="form-control" placeholder="••••••••" required onChange={resetSunatValidation} />
                          <div className="invalid-feedback">Ingresa tu clave SOL.</div>
                        </div>
                        <div className="col-12 d-flex flex-wrap align-items-center gap-2">
                          <button
                            type="button"
                            className="btn btn-outline-primary btn-sm d-inline-flex align-items-center gap-2"
                            onClick={handleValidateSunat}
                            disabled={sunatValidation === 'validating'}
                          >
                            <RefreshCw size={15} className={sunatValidation === 'validating' ? 'spin-anim' : ''} />
                            {sunatValidation === 'validating' ? 'Validando con SUNAT...' : 'Validar perfil'}
                          </button>
                          {sunatValidation === 'valid' && (
                            <span className="small text-success fw-semibold d-inline-flex align-items-center gap-1" aria-live="polite">
                              <CheckCircle2 size={15} /> Perfil validado
                            </span>
                          )}
                          {sunatValidation === 'invalid' && (
                            <span className="small text-danger fw-semibold" aria-live="polite">Credenciales no validadas</span>
                          )}
                          {sunatValidation === 'unavailable' && (
                            <span className="small text-warning-emphasis fw-semibold" aria-live="polite">Validación no disponible</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="col-12 mt-4">
                  <div className="alert alert-info d-flex align-items-center gap-3 p-3 shadow-sm rounded-3 border-0" style={{ backgroundColor: '#eef6ff', color: '#0056b3' }}>
                    <Info size={24} className="flex-shrink-0" />
                    <div>
                      <h6 className="fw-bold mb-1">Entorno de Control Interno</h6>
                      <p className="small mb-0">Para la modalidad de Control Interno <strong>no se requieren credenciales Clave SOL</strong> ni datos de vinculación secundaria ante SUNAT. El sistema quedará listo para notas de venta y gestión interna.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* SECCIÓN 6: PREGUNTAS ADICIONALES (SOLO PRODUCCIÓN) */}
              {isProduccion && (
                <>
                  <div className="col-12 mt-4">
                    <h2 className="h6 fw-bold text-primary text-uppercase mb-1">6. Preguntas Adicionales</h2>
                  </div>

                  <div className="col-12">
                    <label className="form-label">1. ¿Es su primera vez usando un sistema de facturación o viene de otro sistema de facturación?:</label>
                    <input
                      type="text"
                      name="primeraVezOProviene"
                      className="form-control"
                      placeholder="Escriba su respuesta aquí..."
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label">2. ¿Usaba antes la plataforma de SUNAT para emitir comprobantes como boletas o facturas?:</label>
                    <input
                      type="text"
                      name="usabaSunatAnteriormente"
                      className="form-control"
                      placeholder="Escriba su respuesta aquí..."
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label">3. ¿Está usted pagando IGV normal o está exonerado? (Solo aplica para la selva):</label>
                    <input
                      type="text"
                      name="tipoIgv"
                      className="form-control"
                      placeholder="Escriba su respuesta aquí..."
                    />
                  </div>
                </>
              )}

              <div className="col-12 mt-3">
                <div className="alert alert-secondary d-flex align-items-start gap-2 mb-0 small border rounded-3">
                  <Info size={17} className="flex-shrink-0 mt-1" />
                  <div>
                    <strong>Importante: tus datos personales están protegidos.</strong>{' '}
                    Usaremos esta información únicamente para gestionar tu afiliación y activar nuestro sistema de facturación electrónica, conforme a la Ley N.° 29733 y su Reglamento, D.S. N.° 016-2024-JUS.{' '}
                    <a
                      href="https://www.gob.pe/institucion/anpd/normas-legales/2018427-29733-2011"
                      target="_blank"
                      rel="noreferrer"
                      className="fw-semibold"
                    >
                      Ver norma oficial
                    </a>
                  </div>
                </div>
              </div>

              {/* SECCIÓN 7: SELECCIÓN DE PLAN */}
              <div className="col-12 mt-4">
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-3">
                  <div>
                    <h2 className="h6 fw-bold text-primary text-uppercase mb-1">7. Selección de Plan</h2>
                    {plansLoading && <small className="text-muted">Cargando tarifas desde la base de datos...</small>}
                    {plansError && <small className="text-danger d-block">{plansError}</small>}
                  </div>
                  
                  {/* Selector de Modalidad (Mensual vs Anual) */}
                  <div className="btn-group bg-light p-1 rounded-3 border" role="group">
                    <button
                      type="button"
                      className={`btn btn-sm px-3 rounded-2 fw-semibold transition-all ${tipoSuscripcion === 'MENSUAL' ? 'btn-primary shadow-sm text-white' : 'btn-light text-muted'}`}
                      onClick={() => setTipoSuscripcion('MENSUAL')}
                    >
                      Suscripción Mensual
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm px-3 rounded-2 fw-semibold transition-all ${tipoSuscripcion === 'ANUAL' ? 'btn-primary shadow-sm text-white' : 'btn-light text-muted'}`}
                      onClick={() => setTipoSuscripcion('ANUAL')}
                    >
                      Suscripción Anual
                    </button>
                  </div>
                </div>

                <div className="row g-3">
                  {availablePlans.map((plan) => {
                    const details = PLAN_DETAILS[plan.key] || { docs: '', users: '', features: '' };
                    const price = subscriptionPrice(plan.id);
                    return (
                      <div key={plan.id} className={plan.key === 'EMPRESARIAL' || plan.key === 'LIDER' ? 'col-md-6' : 'col-md-4'}>
                        <div
                          onClick={() => setSelectedPlan(plan.key)}
                          className={`p-3 rounded-3 border position-relative ${
                            selectedPlan === plan.key ? 'border-primary border-2 shadow-sm bg-white' : 'border-light-subtle bg-white'
                          }`}
                          style={{ cursor: 'pointer', transition: 'all 0.15s' }}
                        >
                          {selectedPlan === plan.key && (
                            <span className="position-absolute top-0 end-0 translate-middle badge rounded-pill bg-primary" style={{ fontSize: '0.65rem' }}>Seleccionado</span>
                          )}
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <strong className="text-dark">{plan.name}</strong>
                            <span className="badge bg-primary">
                              {price != null ? `S/ ${price.toFixed(2)}${tipoSuscripcion === 'ANUAL' ? '/año' : '/mes'}` : 'No disponible'}
                            </span>
                          </div>
                          <p className="small text-muted mb-1">{details.docs}</p>
                          <div className="d-flex gap-2 small text-muted">
                            <span>{details.users}</span>
                            <span>|</span>
                            <span>{details.features}</span>
                          </div>
                          <div className="text-end mt-1">
                            <span className="small text-muted">Precio correspondiente a la modalidad seleccionada</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="col-12 mt-4">
                <button type="submit" disabled={isSubmitting || plansLoading || !selectedSubscription} className="btn btn-miquipu btn-lg w-100 d-flex align-items-center justify-content-center gap-2">
                  {isSubmitting ? <RefreshCw size={18} className="spin" /> : <span>Enviar Datos e Ir a Pagar</span>}
                  <ArrowRight size={18} />
                </button>
              </div>
            </form>
          </div>
        )}

        {step === 2 && client && (
          <div className="row justify-content-center">
            <div className="col-md-9 col-lg-8">
              <div className="custom-card p-4 p-md-5 text-center">
                <div className="mb-3">
                  <CheckCircle2 size={56} className="text-success" />
                </div>
                <h2 className="h4 fw-bold text-dark mb-2">¡Registro Exitoso!</h2>
                <p className="text-muted mb-4">
                  Estimado/a <strong className="text-dark">{client.razonSocial}</strong>, sus datos han sido registrados correctamente en el sistema.
                </p>

                {/* Banner Destacado: Solicitud de Captura de Pantalla */}
                <div className="alert alert-warning border-warning border-2 p-3 p-md-4 rounded-3 text-start mb-4 shadow-sm bg-warning bg-opacity-10">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <span className="fs-3">📸</span>
                    <h3 className="h6 fw-bold text-dark mb-0">AVISO IMPORTANTE: Envíenos una captura de este formulario</h3>
                  </div>
                  <p className="small text-dark mb-0 fw-semibold" style={{ lineHeight: '1.5' }}>
                    Por favor, <strong>tome una captura de pantalla de este formulario / resumen</strong> con sus datos de afiliación y envíenosla directamente por WhatsApp a su asesor o al canal oficial para proceder de inmediato con la activación de su cuenta y coordinar el acceso al sistema.
                  </p>
                </div>

                {/* Resumen de Datos del Afiliado */}
                <div className="bg-light p-4 rounded-3 text-start mb-4 border">
                  <h3 className="h6 fw-bold text-primary border-bottom pb-2 mb-3 text-uppercase" style={{ letterSpacing: '0.5px' }}>
                    📋 Datos del Afiliado y Suscripción
                  </h3>

                  <div className="row g-2">
                    <div className="col-sm-6">
                      <span className="text-muted small d-block">Razón Social:</span>
                      <strong className="text-dark fs-6">{client.razonSocial}</strong>
                    </div>
                    {client.nombreComercial && (
                      <div className="col-sm-6">
                        <span className="text-muted small d-block">Nombre Comercial:</span>
                        <strong className="text-dark">{client.nombreComercial}</strong>
                      </div>
                    )}
                    <div className="col-sm-6">
                      <span className="text-muted small d-block">RUC:</span>
                      <strong className="text-dark font-monospace">{client.ruc}</strong>
                    </div>
                    <div className="col-sm-6">
                      <span className="text-muted small d-block">Modalidad de Entorno:</span>
                      <span className="badge bg-primary text-white">{client.entornoNombre || 'Producción'}</span>
                    </div>

                    <div className="col-12"><hr className="my-2 border-secondary border-opacity-25" /></div>

                    <div className="col-sm-6">
                      <span className="text-muted small d-block">Plan Contratado:</span>
                      <strong className="text-primary">{client.planContratado}</strong>
                      <span className="badge bg-secondary text-white ms-2">{client.tipoSuscripcion || 'MENSUAL'}</span>
                    </div>
                    <div className="col-sm-6">
                      <span className="text-muted small d-block">Monto a Facturar:</span>
                      <strong className="text-success fs-5">
                        S/ {client.montoMensual.toFixed(2)}
                        <small className="text-muted fs-6 fw-normal"> {client.tipoSuscripcion === 'ANUAL' ? '/ año' : '/ mes'}</small>
                      </strong>
                    </div>

                    <div className="col-12"><hr className="my-2 border-secondary border-opacity-25" /></div>

                    <div className="col-sm-6">
                      <span className="text-muted small d-block">Representante Legal:</span>
                      <strong className="text-dark">{[client.nombres, client.apellidos].filter(Boolean).join(' ') || 'Registrado'}</strong>
                      {client.dni && <span className="small text-muted ms-1">(DNI: {client.dni})</span>}
                    </div>
                    <div className="col-sm-6">
                      <span className="text-muted small d-block">Contacto (Celular / WhatsApp):</span>
                      <strong className="text-dark">{client.telefono || 'No registrado'}</strong>
                    </div>
                    <div className="col-sm-6">
                      <span className="text-muted small d-block">Correo Electrónico:</span>
                      <strong className="text-dark">{client.email || 'No registrado'}</strong>
                    </div>
                    <div className="col-sm-6">
                      <span className="text-muted small d-block">Dirección Comercial o Fiscal:</span>
                      <strong className="text-dark">
                        {[client.direccion, client.distrito, client.provincia, client.departamento].filter(Boolean).join(', ') || 'No registrada'}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="alert alert-info d-flex align-items-start gap-2 text-start mb-0">
                  <Info size={20} className="flex-shrink-0 mt-0.5" />
                  <div className="small">
                    Nos comunicaremos con usted al número registrado para coordinar la activación de sus accesos y programar su capacitación.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
