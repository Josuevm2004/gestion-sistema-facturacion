'use client';

import React, { useState, useMemo } from 'react';
import { MessageSquare, Copy, Check, ExternalLink, RefreshCw, X } from 'lucide-react';
import { Client } from '../components/ClientesTodosTab';

interface BillingMessageModalProps {
  client: Client | null;
  onClose: () => void;
}

export type MessageType = 'AUTO' | 'REGULAR' | 'PRIMER_PRORRATEO' | 'SEGUNDO_PRORRATEO' | 'ANUAL';

export default function BillingMessageModal({ client, onClose }: BillingMessageModalProps) {
  const [selectedType, setSelectedType] = useState<MessageType>('AUTO');
  const [copied, setCopied] = useState(false);
  const [customMessage, setCustomMessage] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);

  const monthNames = [
    'enero',
    'febrero',
    'marzo',
    'abril',
    'mayo',
    'junio',
    'julio',
    'agosto',
    'septiembre',
    'octubre',
    'noviembre',
    'diciembre',
  ];

  const monthNamesCapital = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];

  // Identificar automáticamente el tipo de cliente
  const detectedType = useMemo<MessageType>(() => {
    if (!client) return 'REGULAR';
    const isAnual = (client.tipoSuscripcion || '').toUpperCase() === 'ANUAL';
    if (isAnual) return 'ANUAL';

    const tipoProrrateo = (client.tipoProrrateo || '').toUpperCase();
    if (tipoProrrateo === 'SEGUNDO_PRORRATEO') return 'SEGUNDO_PRORRATEO';
    if (tipoProrrateo === 'PRIMER_PRORRATEO') return 'PRIMER_PRORRATEO';

    // Detección basada en fecha de registro/capacitación si no tiene tag de prorrateo
    const rawDate = client.fechaCapacitacion || client.fechaRegistro || client.fechaCreacion;
    if (rawDate) {
      const d = new Date(rawDate);
      if (!isNaN(d.getTime())) {
        const day = d.getDate();
        if (day >= 10 && (client.montoSiguienteCobro || 0) > (client.montoMensual || 0)) {
          return 'SEGUNDO_PRORRATEO';
        }
        if (day < 10 && (client.montoSiguienteCobro || 0) > 0 && (client.montoSiguienteCobro || 0) < (client.montoMensual || 0)) {
          return 'PRIMER_PRORRATEO';
        }
      }
    }

    return 'REGULAR';
  }, [client]);

  const activeType = selectedType === 'AUTO' ? detectedType : selectedType;

  // Generador de Mensajes Inteligentes
  const generatedMessage = useMemo(() => {
    if (!client) return '';

    const tarifaBase = Number(client.montoMensual || 29).toFixed(2);
    const planName = client.planContratado || 'Plan Estándar';
    const now = new Date();

    // 1. Caso: Cliente con Segundo Prorrateo (Días 10 al 31)
    if (activeType === 'SEGUNDO_PRORRATEO') {
      const rawDate = client.fechaCapacitacion || client.fechaRegistro || client.fechaCreacion || now.toISOString();
      const dInit = new Date(rawDate);
      const diaInit = String(dInit.getDate()).padStart(2, '0');
      const mesInit = String(dInit.getMonth() + 1).padStart(2, '0');

      // Fecha fin del primer mes cubierto (aniversario)
      const dAniv = new Date(dInit.getFullYear(), dInit.getMonth() + 1, dInit.getDate());
      const diaAniv = String(dAniv.getDate()).padStart(2, '0');
      const mesAniv = String(dAniv.getMonth() + 1).padStart(2, '0');
      const nombreMesAniv = monthNames[dAniv.getMonth()];

      // Tramo adicional de ajuste
      const dFinMesAniv = new Date(dAniv.getFullYear(), dAniv.getMonth() + 1, 0);
      const diaFinMesAniv = String(dFinMesAniv.getDate()).padStart(2, '0');

      const montoAdicional = Number(client.montoProrrateoAdicional || ((Number(tarifaBase) / dFinMesAniv.getDate()) * (dFinMesAniv.getDate() - dAniv.getDate()))).toFixed(2);

      // Mes en que se cobrará
      const dCobro = new Date(dAniv.getFullYear(), dAniv.getMonth() + 1, 1);
      const nombreMesCobro = monthNamesCapital[dCobro.getMonth()];
      const montoTotalCobro = Number(client.montoSiguienteCobro || (Number(tarifaBase) + Number(montoAdicional))).toFixed(2);

      // Mes subsiguiente normalizado
      const dSiguienteNormal = new Date(dCobro.getFullYear(), dCobro.getMonth() + 1, 1);
      const nombreMesSiguienteNormal = monthNames[dSiguienteNormal.getMonth()];

      return `💳 *¿CÓMO FUNCIONA TU PRÓXIMO PAGO?*

Al activar tu cuenta el *${diaInit}/${mesInit}* con tu plan de *S/ ${tarifaBase} mensual*, tu primer pago cubre un mes completo (del ${diaInit}/${mesInit} al ${diaAniv}/${mesAniv}).
Para alinearte a nuestro ciclo de cobro de los días 01 de cada mes, los días restantes de ${nombreMesAniv} se juntan con el mes siguiente:

📌 *Ejemplo de tus fechas:*

• *${diaInit}/${mesInit} al ${diaAniv}/${mesAniv}:* Cubierto con tu pago inicial.
• *${diaAniv}/${mesAniv} al ${diaFinMesAniv}/${mesAniv}:* Días restantes de ${nombreMesAniv} (Prorrateo: S/ ${montoAdicional} aprox.).
• *01 de ${nombreMesCobro}:* Pagas la diferencia de ${nombreMesAniv} + tu mes de ${monthNames[dCobro.getMonth()]} completo (S/ ${tarifaBase}).

👉 *TOTAL A PAGAR EL 01 DE ${nombreMesCobro.toUpperCase()}: S/ ${montoTotalCobro}*

*(A partir del 01 de ${nombreMesSiguienteNormal} en adelante, tus pagos se normalizan a tus S/ ${tarifaBase} de siempre)*

🏦 *CUENTAS DE PAGO:*
*BCP:* 194-9357265-026
*CCI:* 00219400935726502690
*CORPORACIÓN ONE EIRL*

📲 *Yape:* 928 355 469
*Judith Macedo Vargas*

(Cualquier duda que tengas, avísanos con confianza y te ayudamos 🙌)`;
    }

    // 2. Caso: Cliente con Primer Prorrateo (Días 1 al 9)
    if (activeType === 'PRIMER_PRORRATEO') {
      const rawDate = client.fechaCapacitacion || client.fechaRegistro || client.fechaCreacion || now.toISOString();
      const dInit = new Date(rawDate);
      const diaInit = String(dInit.getDate()).padStart(2, '0');
      const nombreMesInit = monthNames[dInit.getMonth()];

      // Siguiente mes de cobro proporcional
      const dCobro = new Date(dInit.getFullYear(), dInit.getMonth() + 1, 1);
      const nombreMesCobro = monthNamesCapital[dCobro.getMonth()];
      const montoProrrateado = Number(client.montoSiguienteCobro || client.montoMensual || 15).toFixed(2);

      // Mes subsiguiente normal
      const dNormal = new Date(dCobro.getFullYear(), dCobro.getMonth() + 1, 1);
      const nombreMesNormal = monthNamesCapital[dNormal.getMonth()];

      return `💳 *¿CÓMO SERÁ TU PRÓXIMO PAGO?*

Para que no te compliques con las fechas, todos nuestros clientes pagan los días 1 de cada mes.

Como tú te inscribiste el *${diaInit} de ${nombreMesInit}*, tu primer pago ya te cubrió un mes completo (hasta el ${diaInit} de ${monthNames[dCobro.getMonth()]}). Por eso, el 1 de ${monthNames[dCobro.getMonth()]} no te toca pagar el mes entero, solo pagas la diferencia.

📌 *Míralo así de fácil:*

1. *Tu primer pago ya cubrió:* Del ${diaInit} de ${nombreMesInit} al ${diaInit} de ${monthNames[dCobro.getMonth()]}.
2. *El 01 de ${nombreMesCobro.toUpperCase()} pagas solo:* S/ ${montoProrrateado} (que son los días que faltan para terminar ${monthNames[dCobro.getMonth()]}).
3. *El 01 de ${nombreMesNormal.toUpperCase()} en adelante:* Ya pagas tu cuota normal de S/ ${tarifaBase} todos los 1 de cada mes.

👉 *En resumen: Este 01 de ${monthNames[dCobro.getMonth()]} solo vas a abonar S/ ${montoProrrateado}.*

🏦 *CUENTAS DE PAGO:*
*BCP:* 194-9357265-026
*CCI:* 00219400935726502690
*CORPORACIÓN ONE EIRL*

📲 *Yape:* 928 355 469
*Judith Macedo Vargas*

(Cualquier duda que tengas, avísanos con confianza y te ayudamos 🙌)`;
    }

    // 3. Caso: Cliente con Plan Anual
    if (activeType === 'ANUAL') {
      const vencDate = client.fechaVencimientoMensual
        ? new Date(client.fechaVencimientoMensual)
        : new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());

      const fechaVencStr = vencDate.toLocaleDateString('es-PE', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });

      return `👋 *¡Hola!*

Queremos recordarte que tu suscripción anual de tu Sistema de Facturación (*${planName} - Plan Anual*) está lista para su renovación.
*Mantener tu pago al día garantiza que sigas emitiendo comprobantes de manera ilimitada y sin interrupciones 🚀*

📊 *DETALLE DE TU CUENTA ANUAL:*
📅 *Plan:* ${planName} (Anual)
⏰ *Vencimiento:* ${fechaVencStr}
💳 *Monto de Renovación:* S/ ${tarifaBase}
🗓️ *Cobertura:* 12 meses completos

🏦 *CUENTAS DE PAGO:*
*BCP:* 194-9357265-026
*CCI:* 00219400935726502690
*CORPORACIÓN ONE EIRL*

📲 *Yape:* 928 355 469
*Judith Macedo Vargas*

📌 *Realiza tu pago a tiempo para evitar la suspensión del servicio.*
*¡Gracias por tu preferencia! 🙌*`;
    }

    // 4. Caso: Cliente Regularizado (Cobro normal del día 1)
    const vencDate = client.fechaVencimientoMensual
      ? new Date(client.fechaVencimientoMensual)
      : new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const nombreMes = monthNamesCapital[vencDate.getMonth()];

    return `👋 *¡Hola!*

Queremos recordarte que tu cuota de *${nombreMes} de tu Sistema de Facturación* está lista para ser abonada.
*Mantener tu pago al día garantiza que sigas emitiendo comprobantes sin interrupciones 🚀*

📊 *DETALLE DE TU CUENTA:*
📅 *Mes:* ${nombreMes}
⏰ *Vencimiento:* 01 de ${nombreMes}
💳 *Monto:* S/ ${tarifaBase}

🏦 *CUENTAS DE PAGO:*
*BCP:* 194-9357265-026
*CCI:* 00219400935726502690
*CORPORACIÓN ONE EIRL*

📲 *Yape:* 928 355 469
*Judith Macedo Vargas*

📌 *Realiza tu pago a tiempo para evitar la suspensión del servicio.*
*¡Gracias por tu preferencia! 🙌*`;
  }, [client, activeType]);

  const currentMessageText = isEditing ? customMessage : generatedMessage;

  const handleCopy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(currentMessageText);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = currentMessageText;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendWhatsApp = () => {
    if (!client) return;
    const rawPhone = client.usuarioWsp || client.telefono || client.telefonoPersonal || '';
    const cleanPhone = rawPhone.replace(/\D/g, '');
    const fullPhone = cleanPhone.startsWith('51') ? cleanPhone : `51${cleanPhone}`;
    const encodedText = encodeURIComponent(currentMessageText);
    const url = cleanPhone
      ? `https://api.whatsapp.com/send?phone=${fullPhone}&text=${encodedText}`
      : `https://api.whatsapp.com/send?text=${encodedText}`;
    window.open(url, '_blank');
  };

  if (!client) return null;

  return (
    <div className="modal d-block bg-dark bg-opacity-50" tabIndex={-1}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content rounded-3 shadow">
          <div className="modal-header border-bottom">
            <div className="d-flex align-items-center gap-2">
              <div className="p-2 bg-primary bg-opacity-10 text-primary rounded-3">
                <MessageSquare size={20} />
              </div>
              <div>
                <h5 className="modal-title fw-bold mb-0">Mensaje de Cobranza Inteligente</h5>
                <small className="text-muted">
                  Empresa: <strong className="text-dark">{client.razonSocial}</strong> ({client.ruc})
                </small>
              </div>
            </div>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>

          <div className="modal-body p-4">
            {/* Barra de Selección de Tipo de Mensaje */}
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3 pb-2 border-bottom">
              <div className="d-flex align-items-center gap-1.5 flex-wrap">
                <span className="small text-muted fw-bold me-1">Formato:</span>
                <button
                  type="button"
                  className={`btn btn-sm px-2.5 py-1 fw-bold rounded-2 ${
                    selectedType === 'AUTO'
                      ? 'btn-primary shadow-sm'
                      : 'btn-outline-secondary'
                  }`}
                  onClick={() => {
                    setSelectedType('AUTO');
                    setIsEditing(false);
                  }}
                >
                  Automático ({detectedType === 'SEGUNDO_PRORRATEO' ? '2.° Prorrateo' : detectedType === 'PRIMER_PRORRATEO' ? '1.° Prorrateo' : detectedType === 'ANUAL' ? 'Plan Anual' : 'Regularizado'})
                </button>
                <button
                  type="button"
                  className={`btn btn-sm px-2.5 py-1 fw-semibold rounded-2 ${
                    selectedType === 'REGULAR'
                      ? 'btn-dark shadow-sm'
                      : 'btn-outline-secondary'
                  }`}
                  onClick={() => {
                    setSelectedType('REGULAR');
                    setIsEditing(false);
                  }}
                >
                  Regularizado (Día 1)
                </button>
                <button
                  type="button"
                  className={`btn btn-sm px-2.5 py-1 fw-semibold rounded-2 ${
                    selectedType === 'SEGUNDO_PRORRATEO'
                      ? 'btn-dark shadow-sm'
                      : 'btn-outline-secondary'
                  }`}
                  onClick={() => {
                    setSelectedType('SEGUNDO_PRORRATEO');
                    setIsEditing(false);
                  }}
                >
                  Segundo Prorrateo (Días 10-31)
                </button>
                <button
                  type="button"
                  className={`btn btn-sm px-2.5 py-1 fw-semibold rounded-2 ${
                    selectedType === 'PRIMER_PRORRATEO'
                      ? 'btn-dark shadow-sm'
                      : 'btn-outline-secondary'
                  }`}
                  onClick={() => {
                    setSelectedType('PRIMER_PRORRATEO');
                    setIsEditing(false);
                  }}
                >
                  Primer Prorrateo (Días 1-9)
                </button>
                <button
                  type="button"
                  className={`btn btn-sm px-2.5 py-1 fw-semibold rounded-2 ${
                    selectedType === 'ANUAL'
                      ? 'btn-dark shadow-sm'
                      : 'btn-outline-secondary'
                  }`}
                  onClick={() => {
                    setSelectedType('ANUAL');
                    setIsEditing(false);
                  }}
                >
                  Plan Anual
                </button>
              </div>

              {isEditing && (
                <button
                  type="button"
                  className="btn btn-sm btn-link text-muted p-0 d-inline-flex align-items-center gap-1"
                  onClick={() => {
                    setIsEditing(false);
                    setCustomMessage('');
                  }}
                >
                  <RefreshCw size={12} />
                  <span>Restablecer Original</span>
                </button>
              )}
            </div>

            {/* Vista Previa del Mensaje */}
            <div className="position-relative">
              <textarea
                className="form-control font-monospace p-3 bg-light text-dark border rounded-3"
                rows={14}
                style={{ fontSize: '0.86rem', lineHeight: '1.45', whiteSpace: 'pre-wrap' }}
                value={currentMessageText}
                onChange={(e) => {
                  setIsEditing(true);
                  setCustomMessage(e.target.value);
                }}
              />
            </div>
          </div>

          <div className="modal-footer border-top bg-light d-flex justify-content-between align-items-center py-2.5">
            <div className="small text-muted">
              Destinatario:{' '}
              <strong className="text-dark">
                {client.telefono || client.telefonoPersonal || client.usuarioWsp || 'Sin número registrado'}
              </strong>
            </div>

            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-secondary px-3 py-1.5 fw-semibold"
                onClick={onClose}
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={handleCopy}
                className={`btn px-3 py-1.5 fw-bold shadow-sm d-inline-flex align-items-center gap-1.5 ${
                  copied ? 'btn-success text-white' : 'btn-outline-primary'
                }`}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                <span>{copied ? '¡Copiado!' : 'Copiar Mensaje'}</span>
              </button>
              <button
                type="button"
                onClick={handleSendWhatsApp}
                className="btn btn-success px-3 py-1.5 fw-bold shadow-sm d-inline-flex align-items-center gap-1.5"
              >
                <ExternalLink size={16} />
                <span>Enviar por WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
