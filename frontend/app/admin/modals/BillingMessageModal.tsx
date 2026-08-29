'use client';

import React, { useState, useMemo } from 'react';
import { MessageSquare, Copy, Check, ExternalLink, RefreshCw, UserCheck } from 'lucide-react';
import { Client } from '../components/ClientesTodosTab';

interface BillingMessageModalProps {
  client: Client | null;
  onClose: () => void;
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

export default function BillingMessageModal({ client, onClose }: BillingMessageModalProps) {
  const [activeStep, setActiveStep] = useState<ModalStep>('PRESENTACION');
  const [presentationText, setPresentationText] = useState<string>(DEFAULT_PRESENTATION_TEXT);
  const [selectedType, setSelectedType] = useState<MessageType>('AUTO');
  const [copied, setCopied] = useState(false);
  const [customMessage, setCustomMessage] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);

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

  const handleSendWhatsApp = (textToSend?: string) => {
    if (!client) return;
    const text = textToSend || currentActiveText;
    const rawPhone = client.usuarioWsp || client.telefono || client.telefonoPersonal || '';
    const cleanPhone = rawPhone.replace(/\D/g, '');
    const fullPhone = cleanPhone.startsWith('51') ? cleanPhone : `51${cleanPhone}`;
    const url = `https://web.whatsapp.com/send?phone=${cleanPhone ? fullPhone : ''}&text=${encodeURIComponent(text)}`;
    void handleCopy(text);
    const wspWindow = window.open(url, 'whatsapp_web_window');
    if (wspWindow) wspWindow.focus();
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
                <small className="text-muted fw-semibold">Cliente: <strong className="text-primary">{client.razonSocial}</strong></small>
              </div>
            </div>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>

          <div className="bg-white border-bottom px-4 pt-2.5">
            <ul className="nav nav-tabs border-0 gap-2">
              <li className="nav-item">
                <button className={`nav-link border-0 fw-bold px-3.5 py-2 rounded-top-3 d-flex align-items-center gap-2 ${activeStep === 'PRESENTACION' ? 'active text-primary bg-light border-bottom-0 shadow-sm' : 'text-muted'}`} onClick={() => setActiveStep('PRESENTACION')}>
                  <span className="badge bg-primary rounded-circle">1</span> Presentación
                </button>
              </li>
              <li className="nav-item">
                <button className={`nav-link border-0 fw-bold px-3.5 py-2 rounded-top-3 d-flex align-items-center gap-2 ${activeStep === 'COBRANZA' ? 'active text-success bg-light border-bottom-0 shadow-sm' : 'text-muted'}`} onClick={() => setActiveStep('COBRANZA')}>
                  <span className="badge bg-success rounded-circle">2</span> Cobranza
                </button>
              </li>
            </ul>
          </div>

          <div className="modal-body p-4 bg-light">
            {activeStep === 'PRESENTACION' ? (
              <div className="row g-3">
                <div className="col-md-4">
                  <div className="p-3 bg-primary rounded-3 text-white text-center shadow-sm">
                    <UserCheck size={40} className="mb-2" />
                    <p className="fw-bold mb-0">Soporte MiQuipu</p>
                  </div>
                </div>
                <div className="col-md-8">
                  <textarea className="form-control" rows={8} value={presentationText} onChange={(e) => setPresentationText(e.target.value)} />
                </div>
              </div>
            ) : (
              <div>
                <div className="d-flex flex-wrap gap-2 mb-3">
                  <button className="btn btn-sm btn-outline-secondary" onClick={() => { setSelectedType('AUTO'); setIsEditing(false); }}>Auto</button>
                  <button className="btn btn-sm btn-outline-secondary" onClick={() => { setSelectedType('REGULAR'); setIsEditing(false); }}>Regular</button>
                  <button className="btn btn-sm btn-outline-secondary" onClick={() => { setSelectedType('SEGUNDO_PRORRATEO'); setIsEditing(false); }}>2.° Prorrateo</button>
                </div>
                <textarea className="form-control" rows={11} value={currentBillingText} onChange={(e) => { setIsEditing(true); setCustomMessage(e.target.value); }} />
              </div>
            )}
          </div>

          <div className="modal-footer px-4 py-3">
            <button className="btn btn-outline-secondary" onClick={() => handleCopy()}>{copied ? '¡Copiado!' : 'Copiar'}</button>
            <button className={`btn ${activeStep === 'PRESENTACION' ? 'btn-primary' : 'btn-success'}`} onClick={() => handleSendWhatsApp()}>Enviar por WhatsApp</button>
          </div>
        </div>
      </div>
    </div>
  );
}
