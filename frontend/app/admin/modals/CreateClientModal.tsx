'use client';

import React, { useState } from 'react';
import { UserPlus, RefreshCw, X, Building2, User, KeyRound, HelpCircle, CheckCircle2 } from 'lucide-react';

interface CreateClientModalProps {
  show: boolean;
  onClose: () => void;
  handleCreateClient: (payload: any) => Promise<boolean | undefined>;
  currentUser?: any;
  usersList?: any[];
  uniqueSellers?: string[];
  entornos?: Array<{ id: string | number; nombre: string }>;
}

const PLAN_PRICES: Record<string, { MENSUAL: number; ANUAL: number }> = {
  INICIA: { MENSUAL: 19, ANUAL: 190 },
  EMPRENDE: { MENSUAL: 29, ANUAL: 290 },
  IMPULSA: { MENSUAL: 39, ANUAL: 390 },
  EMPRESARIAL: { MENSUAL: 59, ANUAL: 590 },
  LIDER: { MENSUAL: 89, ANUAL: 890 },
};

export default function CreateClientModal({
  show,
  onClose,
  handleCreateClient,
  currentUser,
  usersList = [],
  uniqueSellers = [],
  entornos = [],
}: CreateClientModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [selectedPlan, setSelectedPlan] = useState<string>('EMPRENDE');
  const [selectedTipo, setSelectedTipo] = useState<'MENSUAL' | 'ANUAL'>('MENSUAL');

  // Seleccionar por defecto el entorno de Producción si existe
  const defaultEntornoId = React.useMemo(() => {
    if (!entornos.length) return '';
    const prod = entornos.find((e) => !e.nombre.toLowerCase().includes('interno'));
    return prod ? String(prod.id) : String(entornos[0].id);
  }, [entornos]);

  const [selectedEntornoId, setSelectedEntornoId] = useState<string>(defaultEntornoId);

  React.useEffect(() => {
    if (defaultEntornoId && !selectedEntornoId) {
      setSelectedEntornoId(defaultEntornoId);
    }
  }, [defaultEntornoId, selectedEntornoId]);

  if (!show) return null;

  const currentEntorno = entornos.find((e) => String(e.id) === selectedEntornoId);
  const isProduccion = currentEntorno
    ? !currentEntorno.nombre.toLowerCase().includes('interno')
    : true;

  const activePrices = PLAN_PRICES[selectedPlan] || { MENSUAL: 29, ANUAL: 290 };
  const currentPrice = selectedTipo === 'ANUAL' ? activePrices.ANUAL : activePrices.MENSUAL;

  const isAdmin =
    !currentUser ||
    !currentUser.rol ||
    currentUser.rol.toUpperCase() === 'ADMIN' ||
    currentUser.username === 'admin';

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);

      const rucInput = ((formData.get('ruc') as string) || '').trim();
      let finalRuc = rucInput;
      if (!finalRuc) {
        if (isProduccion) {
          throw new Error('El RUC de 11 dígitos es obligatorio para la modalidad de Producción.');
        }
        // Para control interno sin RUC, asignar identificador temporal
        finalRuc = '99' + Date.now().toString().slice(-9);
      }

      if (isProduccion && !/^(10|20)\d{9}$/.test(finalRuc)) {
        throw new Error('El RUC para Producción debe iniciar con 10 o 20 y tener exactamente 11 dígitos.');
      }

      const vendedorName = formData.get('vendedor') as string;
      let vendedorId: number | null = null;
      if (vendedorName && vendedorName !== 'Por asignar') {
        const u = usersList.find((usr) => usr.nombre === vendedorName || usr.username === vendedorName);
        if (u) vendedorId = Number(u.id);
      } else if (!isAdmin && currentUser?.id) {
        vendedorId = Number(currentUser.id);
      }

      const payload = {
        ruc: finalRuc,
        razonSocial: (formData.get('razonSocial') as string) || finalRuc,
        nombreComercial: formData.get('nombreComercial') as string,
        direccion: formData.get('direccion') as string,
        departamento: formData.get('departamento') as string,
        provincia: formData.get('provincia') as string,
        distrito: formData.get('distrito') as string,
        telefono: formData.get('telefono') as string,
        email: formData.get('email') as string,
        nombres: formData.get('nombres') as string,
        apellidos: formData.get('apellidos') as string,
        dni: formData.get('dni') as string,
        telefonoPersonal: formData.get('telefonoPersonal') as string,
        emailPersonal: formData.get('emailPersonal') as string,
        planContratado: selectedPlan,
        tipoSuscripcion: selectedTipo,
        entornoId: selectedEntornoId ? Number(selectedEntornoId) : undefined,
        vendedorId: vendedorId,
        usuarioSol: isProduccion ? ((formData.get('usuarioSol') as string) || '').trim() : 'SIN_USUARIO',
        claveSol: isProduccion ? ((formData.get('claveSol') as string) || '').trim() : 'SIN_CLAVE',
        dniRepresentante: isProduccion ? formData.get('dniRepresentante') as string : undefined,
        correoRepresentante: isProduccion ? formData.get('correoRepresentante') as string : undefined,
        primeraVezOProviene: isProduccion ? formData.get('primeraVezOProviene') as string : undefined,
        usabaSunatAnteriormente: isProduccion ? formData.get('usabaSunatAnteriormente') as string : undefined,
        tipoIgv: isProduccion ? formData.get('tipoIgv') as string : undefined,
      };

      await handleCreateClient(payload);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al crear el cliente');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="modal d-block bg-dark bg-opacity-50"
      tabIndex={-1}
      style={{ backdropFilter: 'blur(6px)', overflowY: 'auto' }}
    >
      <div className="modal-dialog modal-lg modal-dialog-centered my-3" style={{ maxWidth: '840px' }}>
        <div
          className="modal-content rounded-4 shadow-lg border-0"
          style={{ maxHeight: 'calc(100vh - 3rem)', display: 'flex', flexDirection: 'column' }}
        >
          <div className="modal-header border-bottom bg-white px-4 py-3 flex-shrink-0">
            <div className="d-flex align-items-center gap-3">
              <div className="p-2 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '42px', height: '42px', backgroundColor: '#E7F3FF', color: '#0866FF' }}>
                <UserPlus size={22} />
              </div>
              <div>
                <h5 className="modal-title fw-bold text-dark mb-0" style={{ fontSize: '1.2rem', letterSpacing: '-0.2px' }}>
                  Registrar Nuevo Cliente
                </h5>
                <small className="text-muted fw-semibold">Configuración de empresa, facturación electrónica y plan</small>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-circle-meta"
              style={{ width: '36px', height: '36px' }}
              onClick={onClose}
              disabled={isSubmitting}
              aria-label="Cerrar"
            >
              <X size={18} />
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}
          >
            <div className="modal-body p-4" style={{ overflowY: 'auto', flex: 1 }}>
              {errorMessage && (
                <div className="alert alert-danger py-2.5 px-3 mb-3 rounded-3 small fw-semibold border-0 shadow-sm" style={{ backgroundColor: '#FDE8E8', color: '#C81E1E' }}>
                  {errorMessage}
                </div>
              )}

              <div className="row g-3">
                {/* --- SECCIÓN 1: MODALIDAD Y PLAN --- */}
                <div className="col-12">
                  <div className="d-flex align-items-center gap-2 mb-2 pb-1 border-bottom">
                    <span className="badge bg-primary text-white rounded-pill px-2.5 py-1 text-uppercase" style={{ fontSize: '0.72rem' }}>1</span>
                    <h6 className="fw-bold text-dark mb-0 text-uppercase" style={{ fontSize: '0.82rem', letterSpacing: '0.5px' }}>Modalidad y Plan de Emisión</h6>
                  </div>
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-bold">Entorno / Modalidad <span className="text-danger">*</span></label>
                  <select
                    className="form-select fw-semibold"
                    value={selectedEntornoId}
                    onChange={(e) => setSelectedEntornoId(e.target.value)}
                    required
                  >
                    {entornos.map((entorno) => (
                      <option key={String(entorno.id)} value={String(entorno.id)}>
                        {entorno.nombre}
                      </option>
                    ))}
                  </select>
                  <small className="text-muted d-block mt-1" style={{ fontSize: '0.78rem' }}>
                    {isProduccion
                      ? '✓ Conexión oficial con SUNAT (requiere RUC y credenciales Clave SOL).'
                      : '✓ Control interno y notas de venta (no requiere credenciales SUNAT).'}
                  </small>
                </div>

                <div className="col-md-6">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <label className="form-label fw-bold mb-0">Periodicidad <span className="text-danger">*</span></label>
                    <div className="btn-group btn-group-sm p-0.5 rounded-pill bg-light border">
                      <button
                        type="button"
                        className={`btn btn-sm rounded-pill px-3 py-1 fw-bold ${selectedTipo === 'MENSUAL' ? 'btn-primary shadow-sm text-white' : 'btn-light border-0 text-secondary'}`}
                        onClick={() => setSelectedTipo('MENSUAL')}
                      >
                        Mensual
                      </button>
                      <button
                        type="button"
                        className={`btn btn-sm rounded-pill px-3 py-1 fw-bold ${selectedTipo === 'ANUAL' ? 'btn-primary shadow-sm text-white' : 'btn-light border-0 text-secondary'}`}
                        onClick={() => setSelectedTipo('ANUAL')}
                      >
                        Anual (-15%)
                      </button>
                    </div>
                  </div>
                  <select
                    className="form-select d-none"
                    value={selectedTipo}
                    onChange={(e) => setSelectedTipo(e.target.value as 'MENSUAL' | 'ANUAL')}
                  >
                    <option value="MENSUAL">Mensual</option>
                    <option value="ANUAL">Anual (x10 meses)</option>
                  </select>
                  <small className="text-muted d-block mt-1" style={{ fontSize: '0.78rem' }}>
                    Elige la frecuencia de renovación del servicio.
                  </small>
                </div>

                {/* Meta-Style Interactive Plan Cards */}
                <div className="col-12 mt-2">
                  <label className="form-label fw-bold mb-2">Selecciona el Plan <span className="text-danger">*</span></label>
                  <div className="row g-2">
                    {[
                      { key: 'INICIA', name: 'Inicia', priceM: 19, priceA: 190, popular: false },
                      { key: 'EMPRENDE', name: 'Emprende', priceM: 29, priceA: 290, popular: true },
                      { key: 'IMPULSA', name: 'Impulsa', priceM: 39, priceA: 390, popular: false },
                      { key: 'EMPRESARIAL', name: 'Empresarial', priceM: 59, priceA: 590, popular: false },
                      { key: 'LIDER', name: 'Líder', priceM: 89, priceA: 890, popular: false },
                    ].map((plan) => {
                      const isSelected = selectedPlan === plan.key;
                      const price = selectedTipo === 'ANUAL' ? plan.priceA : plan.priceM;
                      return (
                        <div className="col" key={plan.key} style={{ minWidth: '120px' }}>
                          <div
                            onClick={() => setSelectedPlan(plan.key)}
                            className={`p-2.5 rounded-3 text-center border position-relative h-100 ${
                              isSelected
                                ? 'bg-primary-subtle border-primary shadow-sm'
                                : 'bg-white border-light-subtle'
                            }`}
                            style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
                          >
                            {plan.popular && (
                              <span className="position-absolute top-0 start-50 translate-middle badge rounded-pill bg-primary text-white" style={{ fontSize: '0.55rem' }}>
                                Popular
                              </span>
                            )}
                            <div className="fw-bold text-dark text-truncate" style={{ fontSize: '0.85rem' }}>{plan.name}</div>
                            <div className="fw-bolder text-primary mt-1" style={{ fontSize: '1.05rem' }}>
                              S/ {price}
                            </div>
                            <small className="text-muted d-block" style={{ fontSize: '0.68rem' }}>
                              {selectedTipo === 'ANUAL' ? '/año' : '/mes'}
                            </small>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {/* Select sincronizado */}
                  <select
                    className="form-select d-none"
                    value={selectedPlan}
                    onChange={(e) => setSelectedPlan(e.target.value)}
                  >
                    <option value="INICIA">Plan Inicia</option>
                    <option value="EMPRENDE">Plan Emprende</option>
                    <option value="IMPULSA">Plan Impulsa</option>
                    <option value="EMPRESARIAL">Plan Empresarial</option>
                    <option value="LIDER">Plan Líder</option>
                  </select>
                </div>

                <div className="col-12 mt-2">
                  <div className="p-2.5 rounded-3 d-flex justify-content-between align-items-center border" style={{ backgroundColor: '#F0F2F5' }}>
                    <div className="small">
                      <span className="text-muted">Tarifa confirmada:</span> <strong className="text-dark">Plan {selectedPlan} ({selectedTipo})</strong>
                    </div>
                    <span className="badge bg-primary fs-6 px-3 py-1.5 fw-bold shadow-sm rounded-pill">
                      S/ {currentPrice.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="col-md-6">
                  <label className="form-label text-primary fw-bold">Vendedor Asignado</label>
                  {isAdmin ? (
                    <select className="form-select border-primary fw-semibold" name="vendedor" defaultValue="Por asignar">
                      <option value="Por asignar">-- Sin asignar (Por asignar) --</option>
                      {usersList.map((u) => (
                        <option key={u.id} value={u.nombre || u.username}>
                          {u.nombre || u.username} ({u.rol})
                        </option>
                      ))}
                      {uniqueSellers
                        .filter((s) => s !== 'Por asignar' && !usersList.some((u) => u.nombre === s || u.username === s))
                        .map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                  ) : (
                    <input
                      className="form-control bg-light"
                      name="vendedor"
                      value={currentUser?.nombre || currentUser?.username || 'Vendedor'}
                      readOnly
                    />
                  )}
                </div>

                {/* --- SECCIÓN 2: DATOS DE LA EMPRESA --- */}
                <div className="col-12 mt-4">
                  <div className="d-flex align-items-center gap-2 mb-2 pb-1 border-bottom">
                    <span className="badge bg-primary text-white px-2.5 py-1 text-uppercase" style={{ fontSize: '0.72rem' }}>2</span>
                    <h6 className="fw-bold text-dark mb-0 text-uppercase" style={{ fontSize: '0.82rem', letterSpacing: '0.5px' }}>Datos de la Empresa</h6>
                  </div>
                </div>

                <div className="col-md-4">
                  <label className="form-label">
                    RUC {isProduccion ? <span className="text-danger">*</span> : <small className="text-muted">(opcional)</small>}
                  </label>
                  <input
                    className="form-control fw-bold text-dark"
                    name="ruc"
                    placeholder={isProduccion ? '20601234567' : 'Opcional (11 dígitos)'}
                    maxLength={11}
                    required={isProduccion}
                  />
                  {!isProduccion && (
                    <small className="text-muted d-block mt-0.5" style={{ fontSize: '0.75rem' }}>
                      Si se deja vacío, el sistema generará un código interno automáticamente.
                    </small>
                  )}
                </div>

                <div className="col-md-8">
                  <label className="form-label">Razón Social <span className="text-danger">*</span></label>
                  <input className="form-control fw-semibold" name="razonSocial" placeholder="Mi Empresa S.A.C." required />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Nombre Comercial</label>
                  <input className="form-control" name="nombreComercial" placeholder="Nombre comercial de la marca" />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Dirección Fiscal <span className="text-danger">*</span></label>
                  <input className="form-control" name="direccion" placeholder="Av. Principal 123" required />
                </div>

                <div className="col-md-4">
                  <label className="form-label">Departamento <span className="text-danger">*</span></label>
                  <input className="form-control" name="departamento" placeholder="Lima" required />
                </div>

                <div className="col-md-4">
                  <label className="form-label">Provincia <span className="text-danger">*</span></label>
                  <input className="form-control" name="provincia" placeholder="Lima" required />
                </div>

                <div className="col-md-4">
                  <label className="form-label">Distrito <span className="text-danger">*</span></label>
                  <input className="form-control" name="distrito" placeholder="Miraflores" required />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Celular WhatsApp Empresa <span className="text-danger">*</span></label>
                  <input className="form-control fw-semibold" name="telefono" placeholder="987654321" maxLength={9} required />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Email Empresa <span className="text-danger">*</span></label>
                  <input className="form-control" type="email" name="email" placeholder="correo@empresa.pe" required />
                </div>

                {isProduccion && (
                  <div className="col-md-6">
                    <label className="form-label">Régimen Tributario</label>
                    <select className="form-select" name="regimenTributario" defaultValue="MYPE_TRIBUTARIO">
                      <option value="MYPE_TRIBUTARIO">MYPE Tributario</option>
                      <option value="REGIMEN_GENERAL">Régimen General</option>
                      <option value="RER">Régimen Especial - RER</option>
                      <option value="NRUS">Nuevo RUS - NRUS</option>
                    </select>
                  </div>
                )}

                {/* --- SECCIÓN 3: REPRESENTANTE LEGAL --- */}
                <div className="col-12 mt-4">
                  <div className="d-flex align-items-center gap-2 mb-2 pb-1 border-bottom">
                    <span className="badge bg-primary text-white px-2.5 py-1 text-uppercase" style={{ fontSize: '0.72rem' }}>3</span>
                    <h6 className="fw-bold text-dark mb-0 text-uppercase" style={{ fontSize: '0.82rem', letterSpacing: '0.5px' }}>Representante Legal / Contacto Personal</h6>
                  </div>
                </div>

                <div className="col-md-4">
                  <label className="form-label">Nombres</label>
                  <input className="form-control" name="nombres" placeholder="Nombres" />
                </div>

                <div className="col-md-4">
                  <label className="form-label">Apellidos</label>
                  <input className="form-control" name="apellidos" placeholder="Apellidos" />
                </div>

                <div className="col-md-4">
                  <label className="form-label">DNI</label>
                  <input className="form-control" name="dni" placeholder="8 dígitos" maxLength={8} />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Teléfono Personal</label>
                  <input className="form-control" name="telefonoPersonal" placeholder="987654321" maxLength={9} />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Correo Personal</label>
                  <input className="form-control" type="email" name="emailPersonal" placeholder="personal@ejemplo.com" />
                </div>

                {/* --- SECCIÓN 4: ACCESOS SUNAT (SOLO PRODUCCIÓN) --- */}
                {isProduccion ? (
                  <>
                    <div className="col-12 mt-4">
                      <div className="d-flex align-items-center gap-2 mb-2 pb-1 border-bottom">
                        <span className="badge bg-primary text-white px-2.5 py-1 text-uppercase" style={{ fontSize: '0.72rem' }}>4</span>
                        <h6 className="fw-bold text-dark mb-0 text-uppercase" style={{ fontSize: '0.82rem', letterSpacing: '0.5px' }}>Accesos Clave SOL (SUNAT)</h6>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Usuario SOL <span className="text-danger">*</span></label>
                      <input className="form-control" name="usuarioSol" placeholder="MODDATOS" required />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Clave SOL <span className="text-danger">*</span></label>
                      <input className="form-control" name="claveSol" placeholder="••••••••" required />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Número de DNI (Diferente al dueño y socios)</label>
                      <input className="form-control" name="dniRepresentante" placeholder="8 dígitos" maxLength={8} />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Correo (Diferente al dueño y socios)</label>
                      <input className="form-control" type="email" name="correoRepresentante" placeholder="representante@ejemplo.com" />
                    </div>

                    {/* --- SECCIÓN 5: PREGUNTAS ADICIONALES (SOLO PRODUCCIÓN) --- */}
                    <div className="col-12 mt-4">
                      <div className="d-flex align-items-center gap-2 mb-2 pb-1 border-bottom">
                        <span className="badge bg-primary text-white px-2.5 py-1 text-uppercase" style={{ fontSize: '0.72rem' }}>5</span>
                        <h6 className="fw-bold text-dark mb-0 text-uppercase" style={{ fontSize: '0.82rem', letterSpacing: '0.5px' }}>Preguntas Adicionales</h6>
                      </div>
                    </div>

                    <div className="col-12">
                      <label className="form-label">1. ¿Es su primera vez usando un sistema de facturación o viene de otro sistema de facturación?:</label>
                      <input className="form-control" name="primeraVezOProviene" placeholder="Respuesta..." />
                    </div>

                    <div className="col-12">
                      <label className="form-label">2. ¿Usaba antes la plataforma de SUNAT para emitir comprobantes como boletas o facturas?:</label>
                      <input className="form-control" name="usabaSunatAnteriormente" placeholder="Respuesta..." />
                    </div>

                    <div className="col-12">
                      <label className="form-label">3. ¿Está usted pagando IGV normal o está exonerado? (Solo aplica para la selva):</label>
                      <input className="form-control" name="tipoIgv" placeholder="Respuesta..." />
                    </div>
                  </>
                ) : (
                  <div className="col-12 mt-4">
                    <div className="alert alert-info py-2.5 px-3 mb-0 rounded-3 border-0 small d-flex align-items-center gap-2" style={{ backgroundColor: '#eef6ff', color: '#0056b3' }}>
                      <CheckCircle2 size={18} className="flex-shrink-0" />
                      <span>
                        <strong>Modalidad Control Interno:</strong> No requiere credenciales Clave SOL ni preguntas de vinculación ante SUNAT. El cliente se creará listo para comprobantes internos y notas de venta.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer border-top bg-white px-4 py-3 flex-shrink-0 d-flex justify-content-end gap-2">
              <button
                type="button"
                className="btn btn-light rounded-pill px-4 py-2.5 fw-semibold text-dark border-0"
                style={{ backgroundColor: '#E4E6EB' }}
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary rounded-pill px-4 py-2.5 fw-bold text-white shadow-sm d-inline-flex align-items-center gap-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={16} className="spin-anim" />
                    <span>Guardando Cliente...</span>
                  </>
                ) : (
                  <>
                    <UserPlus size={16} />
                    <span>Guardar y Habilitar Cliente</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
