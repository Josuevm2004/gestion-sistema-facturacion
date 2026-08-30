'use client';

import React, { useState, useMemo } from 'react';
import { MessageSquare, Copy, Check, ExternalLink, RefreshCw, UserCheck } from 'lucide-react';
import { Client } from '../components/ClientesTodosTab';

interface BillingMessageModalProps {
  client: Client | null;
  onClose: () => void;
  onAvisado?: () => void;
}

export type MessageType = 'AUTO' | 'REGULAR' | 'PRIMER_PRORRATEO' | 'SEGUNDO_PRORRATEO' | 'ANUAL';
export type ModalStep = 'PRESENTACION' | 'COBRANZA';

// Helper seguro para parsear fechas evitando desfasajes de zona horaria UTC
function parseLocalDate(dateStr?: string): Date | null {
  if (!dateStr) return null;
  const clean = String(dateStr).replace('Z', '').split('T')[0];
  const parts = clean.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
      return new Date(year, month, day);
    }
  }
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

const DEFAULT_PRESENTATION_TEXT = `Hola, ¿qué tal? 👋 Te saluda Josué V., del *Área de Soporte y Capacitador del Sistema de Facturación Electrónica de MiQuipu*.
Espero que estés teniendo un excelente día.

Me contacto contigo para estar alineados y apoyarte a potenciar el uso de tu cuenta, resolver dudas de la plataforma o revisar cualquier detalle pendiente de tu servicio. 👍`;

async function copyImageBlobToClipboard(imageUrl: string): Promise<boolean> {
  try {
    const res = await fetch(imageUrl);
    if (!res.ok) return false;
    const blob = await res.blob();
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const blobUrl = URL.createObjectURL(blob);
    img.src = blobUrl;
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });

    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;
    ctx.drawImage(img, 0, 0);

    return await new Promise((resolve) => {
      canvas.toBlob(async (pngBlob) => {
        if (pngBlob && navigator.clipboard && navigator.clipboard.write) {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': pngBlob })
            ]);
            resolve(true);
          } catch (e) {
            resolve(false);
          }
        } else {
          resolve(false);
        }
      }, 'image/png');
    });
  } catch (err) {
    console.warn('Auto-copy de imagen omitido:', err);
    return false;
  }
}

export default function BillingMessageModal({ client, onClose, onAvisado }: BillingMessageModalProps) {
  const [activeStep, setActiveStep] = useState<ModalStep>('PRESENTACION');
  const [presentationText, setPresentationText] = useState<string>(DEFAULT_PRESENTATION_TEXT);
  const [selectedType, setSelectedType] = useState<MessageType>('AUTO');
  const [copied, setCopied] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);
  const [customMessage, setCustomMessage] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  const monthNames = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
  ];

  const monthNamesCapital = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];

  const detectedType = useMemo<MessageType>(() => {
    if (!client) return 'REGULAR';
    const isAnual = (client.tipoSuscripcion || '').toUpperCase() === 'ANUAL';
    if (isAnual) return 'ANUAL';

    const tipoProrrateo = (client.tipoProrrateo || '').toUpperCase();
    const montoSiguiente = Number(client.montoSiguienteCobro || 0);
    const montoMensual = Number(client.montoMensual || 0);

    if (tipoProrrateo === 'SEGUNDO_PRORRATEO' && montoSiguiente > montoMensual) return 'SEGUNDO_PRORRATEO';
    if (tipoProrrateo === 'PRIMER_PRORRATEO' && montoSiguiente > 0 && montoSiguiente < montoMensual) return 'PRIMER_PRORRATEO';
    return 'REGULAR';
  }, [client]);

  const activeType = selectedType === 'AUTO' ? detectedType : selectedType;

  const generatedMessage = useMemo(() => {
    if (!client) return '';

    const tarifaBase = Number(client.montoMensual || 29).toFixed(2);
    const planName = client.planContratado || 'Plan Estándar';
    const now = new Date();

    if (activeType === 'SEGUNDO_PRORRATEO') {
      let dInicioProrr = parseLocalDate(client.fechaInicioProrrateoAdicional);
      let dFinProrr = parseLocalDate(client.fechaFinProrrateoAdicional);
      let dCobro = parseLocalDate(client.fechaVencimientoMensual);
      
      if (!dInicioProrr || !dFinProrr || !dCobro) {
        const dCap = parseLocalDate(client.fechaCapacitacion || client.fechaRegistro || client.fechaCreacion) || now;
        dInicioProrr = new Date(dCap.getFullYear(), dCap.getMonth() + 1, dCap.getDate());
        dFinProrr = new Date(dCap.getFullYear(), dCap.getMonth() + 2, 0);
        dCobro = new Date(dCap.getFullYear(), dCap.getMonth() + 2, 1);
      }

      const dInit = new Date(dInicioProrr.getFullYear(), dInicioProrr.getMonth() - 1, dInicioProrr.getDate());
      const diaInit = String(dInit.getDate()).padStart(2, '0');
      const mesInit = String(dInit.getMonth() + 1).padStart(2, '0');
      const diaAniv = String(dInicioProrr.getDate()).padStart(2, '0');
      const mesAniv = String(dInicioProrr.getMonth() + 1).padStart(2, '0');
      const nombreMesAniv = monthNames[dInicioProrr.getMonth()];
      const diaSiguienteAniv = String(Math.min(dInicioProrr.getDate() + 1, dFinProrr.getDate())).padStart(2, '0');
      const diaFinMesAniv = String(dFinProrr.getDate()).padStart(2, '0');
      const montoAdicional = Number(client.montoProrrateoAdicional || (Number(tarifaBase) / dFinProrr.getDate()) * (dFinProrr.getDate() - dInicioProrr.getDate())).toFixed(2);
      const nombreMesCobro = monthNamesCapital[dCobro.getMonth()];
      const montoTotalCobro = Number(client.montoSiguienteCobro || (Number(tarifaBase) + Number(montoAdicional))).toFixed(2);
      const nombreMesSiguienteNormal = monthNames[new Date(dCobro.getFullYear(), dCobro.getMonth() + 1, 1).getMonth()];

      return `💳 *¿CÓMO FUNCIONA TU PRÓXIMO PAGO?*

Al activar tu cuenta el *${diaInit}/${mesInit}*, tu primer pago cubre un mes completo.
Para alinearte a nuestro ciclo de cobro de los días 01, los días restantes de ${nombreMesAniv} se juntan con el mes siguiente:

📌 *Tus fechas:*
• *${diaInit}/${mesInit} al ${diaAniv}/${mesAniv}:* Cubierto.
• *${diaSiguienteAniv}/${mesAniv} al ${diaFinMesAniv}/${mesAniv}:* Prorrateo (S/ ${montoAdicional} aprox.).
• *01 de ${nombreMesCobro}:* Pagas diferencia de ${nombreMesAniv} + mes de ${monthNames[dCobro.getMonth()]} completo.

👉 *TOTAL A PAGAR EL 01 DE ${nombreMesCobro.toUpperCase()}: S/ ${montoTotalCobro}*

🏦 *CUENTAS:*
*BCP:* 194-9357265-026 | *CCI:* 00219400935726502690
*CORPORACIÓN ONE EIRL*
*Yape:* 928 355 469 (Judith Macedo)

(Cualquier duda, nos avisas y te ayudamos 🙌)`;
    }

    if (activeType === 'PRIMER_PRORRATEO') {
      const dInit = parseLocalDate(client.fechaCapacitacion || client.fechaRegistro || client.fechaCreacion) || now;
      const diaInit = String(dInit.getDate()).padStart(2, '0');
      const dCobro = parseLocalDate(client.fechaVencimientoMensual) || new Date(dInit.getFullYear(), dInit.getMonth() + 1, 1);
      const nombreMesCobro = monthNamesCapital[dCobro.getMonth()];
      const montoProrrateado = Number(client.montoSiguienteCobro || client.montoMensual || 15).toFixed(2);

      return `💳 *¿CÓMO SERÁ TU PRÓXIMO PAGO?*

Como te inscribiste el *${diaInit} de ${monthNames[dInit.getMonth()]}*, tu primer pago cubrió hasta el ${diaInit} de ${monthNames[dCobro.getMonth()]}.

1. *El 01 de ${nombreMesCobro.toUpperCase()} pagas solo:* S/ ${montoProrrateado} (ajuste de días).
2. *El 01 de ${monthNamesCapital[(dCobro.getMonth() + 1) % 12].toUpperCase()} en adelante:* S/ ${tarifaBase} normal.

👉 *En resumen: Este 01 de ${monthNames[dCobro.getMonth()]} solo abonas S/ ${montoProrrateado}.*

🏦 *CUENTAS:*
*BCP:* 194-9357265-026 | *CCI:* 00219400935726502690
*CORPORACIÓN ONE EIRL*
*Yape:* 928 355 469 (Judith Macedo)

(Cualquier duda, nos avisas y te ayudamos 🙌)`;
    }

    if (activeType === 'ANUAL') {
      const vencDate = parseLocalDate(client.fechaVencimientoMensual) || new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
      return `👋 *¡Hola!*
Tu suscripción anual (*${planName}*) está lista para renovar. Mantener tu pago al día garantiza tu servicio sin interrupciones 🚀

📅 *Vencimiento:* ${vencDate.toLocaleDateString('es-PE')}
💳 *Monto:* S/ ${tarifaBase}

🏦 *BCP:* 194-9357265-026 | *CCI:* 00219400935726502690
*CORPORACIÓN ONE EIRL*
*Yape:* 928 355 469 (Judith Macedo)

¡Gracias por tu preferencia! 🙌`;
    }

    const vencDate = parseLocalDate(client.fechaVencimientoMensual) || new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const nombreMes = monthNamesCapital[vencDate.getMonth()];
    return `👋 *¡Hola!*

Tu cuota de *${nombreMes}* está lista para ser abonada.
📅 *Mes:* ${nombreMes}
💳 *Monto:* S/ ${tarifaBase}

🏦 *BCP:* 194-9357265-026 | *CCI:* 00219400935726502690
*CORPORACIÓN ONE EIRL*
*Yape:* 928 355 469 (Judith Macedo)

¡Gracias por tu preferencia! 🙌`;
  }, [client, activeType, monthNames, monthNamesCapital]);

  const currentBillingText = isEditing ? customMessage : generatedMessage;
  const currentActiveText = activeStep === 'PRESENTACION' ? presentationText : currentBillingText;

  const handleCopy = async (textToCopy?: string) => {
    const text = textToCopy || currentActiveText;
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) { console.error(e); }
  };

  const handleCopyImage = async () => {
    const ok = await copyImageBlobToClipboard('/soporte-miquipu.jpeg');
    if (ok) {
      setCopiedImage(true);
      setTimeout(() => setCopiedImage(false), 2500);
    }
  };

  const handleSendWhatsApp = () => {
    if (!client) return;

    const text = currentActiveText;
    const rawPhone = client.usuarioWsp || client.telefono || client.telefonoPersonal || '';
    const cleanPhone = rawPhone.replace(/\D/g, '');
    const fullPhone = cleanPhone.startsWith('51') ? cleanPhone : `51${cleanPhone}`;
    const url = `https://web.whatsapp.com/send?phone=${cleanPhone ? fullPhone : ''}&text=${encodeURIComponent(text)}`;

    // 1. Copiar texto al portapapeles
    void handleCopy(text);

    // 2. Si es paso 1 (Presentación), auto-copiar la foto al portapapeles
    if (activeStep === 'PRESENTACION') {
      void copyImageBlobToClipboard('/soporte-miquipu.jpeg');
    }

    // 3. Notificar persistencia de avisado en BD
    onAvisado?.();

    // 4. Abrir WhatsApp Web
    const wspWindow = window.open(url, 'whatsapp_tab_singleton');
    if (wspWindow) {
      wspWindow.focus();
    }

    // 5. Si estaba en paso 1, pasar automáticamente a paso 2
    if (activeStep === 'PRESENTACION') {
      setTimeout(() => {
        setActiveStep('COBRANZA');
      }, 1000);
    }
  };

  if (!client) return null;

  return (
    <div className="modal d-block bg-dark bg-opacity-50" tabIndex={-1} style={{ backdropFilter: 'blur(4px)', overflowY: 'auto' }}>
      <div className="modal-dialog modal-dialog-centered modal-lg my-3">
        <div className="modal-content rounded-4 shadow-lg border-0 overflow-hidden">
          <div className="modal-header border-bottom bg-light px-4 py-3">
            <div className="d-flex align-items-center gap-2.5">
              <div className="p-2 bg-primary text-white rounded-3 shadow-sm"><MessageSquare size={18} /></div>
              <div>
                <h5 className="modal-title fw-bold text-dark mb-0">Mensajería Inteligente</h5>
                <small className="text-muted fw-semibold">Cliente: <strong className="text-primary">{client.razonSocial}</strong> ({client.ruc})</small>
              </div>
            </div>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>

          <div className="bg-white border-bottom px-4 pt-2.5">
            <ul className="nav nav-tabs border-0 gap-2">
              <li className="nav-item">
                <button className={`nav-link border-0 fw-bold px-3.5 py-2 rounded-top-3 d-flex align-items-center gap-2 ${activeStep === 'PRESENTACION' ? 'active text-primary bg-light border-bottom-0 shadow-sm' : 'text-muted'}`} onClick={() => setActiveStep('PRESENTACION')}>
                  <span className="badge bg-primary rounded-circle">1</span> 1. Presentación y Foto
                </button>
              </li>
              <li className="nav-item">
                <button className={`nav-link border-0 fw-bold px-3.5 py-2 rounded-top-3 d-flex align-items-center gap-2 ${activeStep === 'COBRANZA' ? 'active text-success bg-light border-bottom-0 shadow-sm' : 'text-muted'}`} onClick={() => setActiveStep('COBRANZA')}>
                  <span className="badge bg-success rounded-circle">2</span> 2. Detalle de Cobro
                </button>
              </li>
            </ul>
          </div>

          <div className="modal-body p-4 bg-light">
            {activeStep === 'PRESENTACION' ? (
              <div>
                <div className="alert alert-primary border-0 rounded-3 py-2 px-3 mb-3 d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <UserCheck size={16} className="text-primary" />
                    <small className="fw-semibold text-dark">
                      <strong>Mensaje 1 (Foto + Saludo):</strong> Al pulsar <em>«1. Enviar Presentación»</em> se abre el chat y se copia la foto. En WhatsApp presiona <strong>Ctrl + V</strong> y dale <strong>Enter</strong>.
                    </small>
                  </div>
                </div>

                <div className="row g-3">
                  <div className="col-md-4 text-center">
                    <div className="p-2 bg-white rounded-3 border shadow-sm h-100 d-flex flex-column align-items-center justify-content-center">
                      <img
                        src="/soporte-miquipu.jpeg"
                        alt="Flyer Soporte MiQuipu"
                        className="rounded-3 img-fluid mb-2 shadow-sm border"
                        style={{ maxHeight: '180px', objectFit: 'contain' }}
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (target.src.endsWith('.jpeg')) {
                            target.src = '/soporte-miquipu.png';
                          } else {
                            target.style.display = 'none';
                          }
                        }}
                      />
                      <small className="text-muted fw-bold mb-2" style={{ fontSize: '0.75rem' }}>
                        Flyer Soporte MiQuipu
                      </small>
                      <button
                        type="button"
                        className={`btn btn-sm w-100 fw-bold d-inline-flex align-items-center justify-content-center gap-1 ${copiedImage ? 'btn-success text-white' : 'btn-outline-primary'}`}
                        onClick={handleCopyImage}
                      >
                        {copiedImage ? <Check size={13} /> : <Copy size={13} />}
                        <span>{copiedImage ? '¡Foto Copiada!' : 'Copiar Foto'}</span>
                      </button>
                    </div>
                  </div>
                  <div className="col-md-8">
                    <label className="form-label fw-bold text-dark mb-1.5 small">
                      Texto del Saludo / Presentación:
                    </label>
                    <textarea className="form-control font-monospace p-3 bg-white text-dark border rounded-3" rows={8} style={{ fontSize: '0.86rem', lineHeight: '1.45' }} value={presentationText} onChange={(e) => setPresentationText(e.target.value)} />
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div className="d-flex flex-wrap gap-2 mb-3">
                  <span className="small text-muted fw-bold align-self-center me-1">Formato:</span>
                  <button className={`btn btn-sm px-2.5 py-1 fw-bold rounded-2 ${selectedType === 'AUTO' ? 'btn-success text-white shadow-sm' : 'btn-outline-secondary bg-white'}`} onClick={() => { setSelectedType('AUTO'); setIsEditing(false); }}>
                    Automático ({detectedType === 'SEGUNDO_PRORRATEO' ? '2.° Prorrateo' : detectedType === 'PRIMER_PRORRATEO' ? '1.° Prorrateo' : detectedType === 'ANUAL' ? 'Plan Anual' : 'Regular'})
                  </button>
                  <button className={`btn btn-sm px-2.5 py-1 fw-semibold rounded-2 ${selectedType === 'REGULAR' ? 'btn-dark text-white shadow-sm' : 'btn-outline-secondary bg-white'}`} onClick={() => { setSelectedType('REGULAR'); setIsEditing(false); }}>Regular (Día 1)</button>
                  <button className={`btn btn-sm px-2.5 py-1 fw-semibold rounded-2 ${selectedType === 'SEGUNDO_PRORRATEO' ? 'btn-dark text-white shadow-sm' : 'btn-outline-secondary bg-white'}`} onClick={() => { setSelectedType('SEGUNDO_PRORRATEO'); setIsEditing(false); }}>2.° Prorrateo</button>
                  <button className={`btn btn-sm px-2.5 py-1 fw-semibold rounded-2 ${selectedType === 'PRIMER_PRORRATEO' ? 'btn-dark text-white shadow-sm' : 'btn-outline-secondary bg-white'}`} onClick={() => { setSelectedType('PRIMER_PRORRATEO'); setIsEditing(false); }}>1.° Prorrateo</button>
                  <button className={`btn btn-sm px-2.5 py-1 fw-semibold rounded-2 ${selectedType === 'ANUAL' ? 'btn-dark text-white shadow-sm' : 'btn-outline-secondary bg-white'}`} onClick={() => { setSelectedType('ANUAL'); setIsEditing(false); }}>Anual</button>
                </div>
                <textarea className="form-control font-monospace p-3 bg-white text-dark border rounded-3" rows={11} style={{ fontSize: '0.86rem', lineHeight: '1.45', whiteSpace: 'pre-wrap' }} value={currentBillingText} onChange={(e) => { setIsEditing(true); setCustomMessage(e.target.value); }} />
              </div>
            )}
          </div>

          <div className="modal-footer px-4 py-3 d-flex justify-content-between align-items-center border-top bg-white">
            <div className="small text-muted">
              Destinatario: <strong className="text-dark">{client.usuarioWsp || client.telefono || client.telefonoPersonal || 'Sin número'}</strong>
            </div>
            <div className="d-flex gap-2">
              <button className="btn btn-outline-secondary px-3.5 py-1.5 fw-semibold d-inline-flex align-items-center gap-1.5" onClick={() => handleCopy()}>
                {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                <span>{copied ? '¡Copiado!' : activeStep === 'PRESENTACION' ? 'Copiar Saludo' : 'Copiar Cobranza'}</span>
              </button>
              <button
                className="btn btn-primary px-4 py-1.5 fw-bold text-white shadow-sm d-inline-flex align-items-center gap-1.5"
                onClick={() => handleSendWhatsApp()}
              >
                <ExternalLink size={15} />
                <span>{activeStep === 'PRESENTACION' ? 'Enviar Presentación' : 'Enviar Cobranza'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
