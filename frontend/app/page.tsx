'use client';

import { FormEvent, useRef, useState } from 'react';
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
};

const PLAN_PRICES: Record<string, number> = {
  INICIA: 19,
  EMPRENDE: 29,
  IMPULSA: 39,
  EMPRESARIAL: 59,
  LIDER: 89,
};

const PLAN_ANNUAL_PRICES: Record<string, number> = {
  INICIA: 190,
  EMPRENDE: 290,
  IMPULSA: 390,
  EMPRESARIAL: 590,
  LIDER: 890,
};

const PLAN_IDS: Record<string, number> = {
  INICIA: 1,
  EMPRENDE: 2,
  IMPULSA: 3,
  EMPRESARIAL: 4,
  LIDER: 5,
};

export default function FormularioPublicoPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [client, setClient] = useState<ClientRegistration | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string>('EMPRENDE');
  const [regimenTributario, setRegimenTributario] = useState<string>('MYPE_TRIBUTARIO');
  const [tipoSuscripcion, setTipoSuscripcion] = useState<'MENSUAL' | 'ANUAL'>('MENSUAL');
  const [message, setMessage] = useState<{ type: 'success' | 'warning' | 'info' | 'danger'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;

    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    const formData = new FormData(form);
    const payload = {
      ruc: formData.get('ruc') as string,
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
      regimenTributario: formData.get('regimenTributario') as string,
      planId: PLAN_IDS[selectedPlan] || 2,
      planContratado: selectedPlan,
      tipoSuscripcion: tipoSuscripcion,
      usuarioSol: formData.get('usuarioSol') as string,
      claveSol: formData.get('claveSol') as string,
      comoNosConocio: formData.get('comoNosConocio') as string,
      usoSistemaAnterior: formData.get('usoSistemaAnterior') === 'true',
      comentarios: formData.get('comentarios') as string,
    };

    try {
      const { data } = await api.post('/public/registro', payload);
      const registeredData = data.data;
      setClient({
        id: registeredData.id || registeredData.clienteId,
        ruc: registeredData.ruc,
        razonSocial: registeredData.razonSocial,
        planContratado: registeredData.planNombre || registeredData.planContratado || selectedPlan,
        montoMensual: Number(registeredData.precioPlan ?? (tipoSuscripcion === 'ANUAL' ? PLAN_ANNUAL_PRICES[selectedPlan] : PLAN_PRICES[selectedPlan]) ?? 29),
        tipoSuscripcion,
        subdominio: registeredData.subdominio || registeredData.acceso?.subdominio,
      });
      setStep(2);
      setMessage({ type: 'success', text: 'Datos registrados correctamente. Revisa los datos de pago a continuación.' });
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Error al conectar con la base de datos Azure SQL';
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

              {/* SECCIÓN 2: DATOS TRIBUTARIOS */}
              <div className="col-12 mt-4">
                <h2 className="h6 fw-bold text-primary text-uppercase mb-1">2. Datos Tributarios de la Empresa</h2>
              </div>

              <div className="col-md-4">
                <label className="form-label">RUC (11 dígitos)</label>
                <input type="text" name="ruc" className="form-control" placeholder="20601234567" pattern="^(10|20)\d{9}$" maxLength={11} required />
                <div className="invalid-feedback">Ingresa un RUC válido de 11 dígitos.</div>
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

              {/* SECCIÓN 3: DATOS PERSONALES */}
              <div className="col-12 mt-4">
                <h2 className="h6 fw-bold text-primary text-uppercase mb-1">3. Datos Personales del Representante</h2>
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

              {/* SECCIÓN 4: CLAVE SOL */}
              <div className="col-12 mt-4">
                <div className="p-3 rounded-3 border bg-light">
                  <div className="alert alert-info d-flex align-items-center gap-2 mb-3 border-0 shadow-sm rounded-3" style={{ backgroundColor: '#eef6ff', color: '#0056b3' }}>
                    <Info size={20} className="flex-shrink-0" />
                    <div>
                      <strong>Requisito Importante:</strong> Ingrese sus credenciales SOL de SUNAT para habilitar su facturación electrónica.
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <KeyRound size={16} className="text-primary" />
                    <strong className="text-dark">4. Credenciales Clave SOL (SUNAT)</strong>
                  </div>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Usuario SOL</label>
                      <input type="text" name="usuarioSol" className="form-control" placeholder="MODDATOS" required />
                      <div className="invalid-feedback">Ingresa tu usuario SOL.</div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Clave SOL</label>
                      <input type="password" name="claveSol" className="form-control" placeholder="••••••••" required />
                      <div className="invalid-feedback">Ingresa tu clave SOL.</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECCIÓN 5: SELECCIÓN DE PLAN */}
              <div className="col-12 mt-4">
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-3">
                  <h2 className="h6 fw-bold text-primary text-uppercase mb-2 mb-md-0">5. Selección de Plan</h2>
                  
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
                  {[
                    { id: 'INICIA', name: 'Inicia', price: 19, annual: 190, docs: '50 Boletas o Facturas', users: '1 Usuario', features: 'Web y aplicativo' },
                    { id: 'EMPRENDE', name: 'Emprende', price: 29, annual: 290, docs: '100 Boletas o Facturas', users: '2 Usuarios', features: 'Web y aplicativo' },
                    { id: 'IMPULSA', name: 'Impulsa', price: 39, annual: 390, docs: '200 Boletas o Facturas', users: '3 Usuarios', features: 'Web, app y ticketera' },
                    { id: 'EMPRESARIAL', name: 'Empresarial', price: 59, annual: 590, docs: '500 Boletas o Facturas', users: '4 Usuarios', features: 'Web, app y ticketera' },
                    { id: 'LIDER', name: 'Líder', price: 89, annual: 890, docs: '1000 Boletas o Facturas', users: '6 Usuarios', features: 'Web, app y ticketera' },
                  ].map((plan) => {
                    return (
                      <div key={plan.id} className={plan.id === 'EMPRESARIAL' || plan.id === 'LIDER' ? 'col-md-6' : 'col-md-4'}>
                        <div
                          onClick={() => setSelectedPlan(plan.id)}
                          className={`p-3 rounded-3 border position-relative ${
                            selectedPlan === plan.id ? 'border-primary border-2 shadow-sm bg-white' : 'border-light-subtle bg-white'
                          }`}
                          style={{ cursor: 'pointer', transition: 'all 0.15s' }}
                        >
                          {selectedPlan === plan.id && (
                            <span className="position-absolute top-0 end-0 translate-middle badge rounded-pill bg-primary" style={{ fontSize: '0.65rem' }}>Seleccionado</span>
                          )}
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <strong className="text-dark">{plan.name}</strong>
                            <span className="badge bg-primary">
                              {tipoSuscripcion === 'ANUAL' ? `S/ ${plan.annual}/año` : `S/ ${plan.price}/mes`}
                            </span>
                          </div>
                          <p className="small text-muted mb-1">{plan.docs}</p>
                          <div className="d-flex gap-2 small text-muted">
                            <span>{plan.users}</span>
                            <span>|</span>
                            <span>{plan.features}</span>
                          </div>
                          <div className="text-end mt-1">
                            <span className="small text-success fw-semibold">Anual: S/ {plan.annual} (ahorra 2 meses)</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="col-12 mt-4">
                <button type="submit" disabled={isSubmitting} className="btn btn-miquipu btn-lg w-100 d-flex align-items-center justify-content-center gap-2">
                  {isSubmitting ? <RefreshCw size={18} className="spin" /> : <span>Enviar Datos e Ir a Pagar</span>}
                  <ArrowRight size={18} />
                </button>
              </div>
            </form>
          </div>
        )}

        {step === 2 && client && (
          <div className="row justify-content-center">
            <div className="col-md-8">
              <div className="custom-card p-4 p-md-5 text-center">

                <div>
                  <div className="mb-4">
                    <CheckCircle2 size={56} className="text-success" />
                  </div>
                  <h2 className="h4 fw-bold text-dark mb-2">¡Registro Exitoso!</h2>
                  <p className="text-muted mb-4">
                    Estimado/a <strong className="text-dark">{client.razonSocial}</strong>, sus datos han sido registrados correctamente.
                    Realice el pago a cualquiera de nuestras cuentas y nos comunicaremos con usted para activar su sistema.
                  </p>

                  <div className="bg-light p-4 rounded-3 text-start mb-4">
                    <h3 className="h6 fw-bold text-dark border-bottom pb-2 mb-3">Resumen de su Suscripción</h3>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">RUC:</span>
                      <strong className="text-dark">{client.ruc}</strong>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">Plan contratado:</span>
                      <strong className="text-primary">{client.planContratado}</strong>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">Monto a pagar:</span>
                      <strong className="text-success">
                        S/ {client.montoMensual.toFixed(2)}
                        {client.tipoSuscripcion === 'ANUAL' ? ' anual' : ''}
                      </strong>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span className="text-muted">Estado:</span>
                      <span className="badge bg-warning text-dark">PENDIENTE DE PAGO</span>
                    </div>
                  </div>

                  <div className="bg-white border rounded-3 p-4 text-start mb-4 shadow-sm">
                    <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
                      <h3 className="h6 fw-bold text-primary mb-0">Cuentas Empresariales para Transferencia</h3>
                      <span className="badge bg-dark text-white fw-bold">RUC: 20607730254</span>
                    </div>

                    <div className="p-2.5 mb-3 rounded-2 bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 small fw-semibold">
                      🏢 <strong>Titular:</strong> CORPORACIONES ONE E.I.R.L.
                    </div>

                    {/* Cuenta BCP */}
                    <div className="mb-3 p-3 border rounded-3 bg-light shadow-2xs">
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <span className="badge bg-primary px-2.5 py-1 fw-bold">BCP</span>
                        <strong className="text-dark">Cuenta Corriente BCP Soles</strong>
                      </div>
                      <div className="small text-muted mb-0.5">Número de Cuenta:</div>
                      <div className="fw-bold text-dark font-monospace fs-6 mb-1">194-9357265-026</div>
                      <div className="small text-muted mb-0.5">CCI (Código Interbancario):</div>
                      <div className="fw-semibold text-secondary font-monospace">00219400935726502690</div>
                    </div>

                    {/* Cuenta BBVA */}
                    <div className="p-3 border rounded-3 bg-light shadow-2xs">
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <span className="badge px-2.5 py-1 fw-bold" style={{ backgroundColor: '#004481', color: 'white' }}>BBVA</span>
                        <strong className="text-dark">Cuenta Corriente BBVA Continental Soles</strong>
                      </div>
                      <div className="small text-muted mb-0.5">Número de Cuenta:</div>
                      <div className="fw-bold text-dark font-monospace fs-6 mb-1">0011-0323-0100032917</div>
                      <div className="small text-muted mb-0.5">CCI (Código Interbancario):</div>
                      <div className="fw-semibold text-secondary font-monospace">011-323-00100032917-35</div>
                    </div>
                  </div>

                  <div className="alert alert-info d-flex align-items-start gap-2 text-start">
                    <Info size={20} className="flex-shrink-0 mt-1" />
                    <div className="small">
                      Una vez realizado el pago, envíe su comprobante de transferencia al <strong>WhatsApp</strong> o <strong>email</strong> indicado.
                      Verificaremos su pago y activaremos su cuenta en el menor tiempo posible.
                    </div>
                  </div>

                  <p className="text-muted small mt-3">
                    Nos comunicaremos con usted al número registrado para coordinar la activación de su cuenta y capacitación.
                  </p>
                </div>

              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
