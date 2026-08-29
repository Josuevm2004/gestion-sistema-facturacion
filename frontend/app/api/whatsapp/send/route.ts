import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, message, imageUrl } = body;

    if (!phone || !message) {
      return NextResponse.json(
        { success: false, error: 'Número de teléfono y mensaje son obligatorios.' },
        { status: 400 }
      );
    }

    const cleanPhone = String(phone).replace(/\D/g, '');
    const fullPhone = cleanPhone.startsWith('51') ? cleanPhone : `51${cleanPhone}`;

    const whatsappApiUrl = process.env.WHATSAPP_API_URL || 'http://127.0.0.1:8000/whatsapp/messages/send';
    const metaToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    // 1. Si está configurado el servicio de Laravel o Meta directamente:
    if (metaToken && phoneId) {
      const metaUrl = `https://graph.facebook.com/v19.0/${phoneId}/messages`;
      const metaPayload = imageUrl
        ? {
            messaging_product: 'whatsapp',
            to: fullPhone,
            type: 'image',
            image: {
              link: imageUrl,
              caption: message,
            },
          }
        : {
            messaging_product: 'whatsapp',
            to: fullPhone,
            type: 'text',
            text: { body: message },
          };

      const response = await fetch(metaUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${metaToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metaPayload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || 'Error al enviar por Meta Cloud API');
      }

      return NextResponse.json({
        success: true,
        method: 'META_CLOUD_API',
        data,
      });
    }

    // 2. Intentar con el gateway local / Laravel WhatsApp si está corriendo:
    try {
      const laravelPayload = {
        to: fullPhone,
        type: 'text',
        text: { body: message },
      };

      const localRes = await fetch(whatsappApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(laravelPayload),
      });

      if (localRes.ok) {
        const localData = await localRes.json();
        return NextResponse.json({
          success: true,
          method: 'LARAVEL_WHATSAPP',
          data: localData,
        });
      }
    } catch (localErr) {
      // Gateway local no disponible
    }

    // 3. Respuesta informativa indicando que el endpoint está listo
    return NextResponse.json({
      success: false,
      fallbackRequired: true,
      phone: fullPhone,
      message: 'Servidor de envío automático en segundo plano no disponible actualmente. Abriendo WhatsApp Web.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Error al procesar el envío' },
      { status: 500 }
    );
  }
}
