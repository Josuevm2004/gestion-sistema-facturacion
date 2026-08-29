const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const pino = require('pino');
const qrcodeTerminal = require('qrcode-terminal');
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} = require('@whiskeysockets/baileys');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

let sock = null;
let qrCodeString = null;
let isConnected = false;
let connectedUser = null;

async function startWhatsApp() {
  const authDir = path.join(__dirname, 'auth_info_baileys');
  const { state, saveCreds } = await useMultiFileAuthState(authDir);
  const { version } = await fetchLatestBaileysVersion();

  sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    auth: state,
    printQRInTerminal: false,
    browser: ['MiQuipu Facturacion', 'Chrome', '1.0.0'],
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      qrCodeString = qr;
      console.log('\n======================================================');
      console.log('📲 ESCANEA EL CÓDIGO QR CON TU WHATSAPP (VINCULAR DISPOSITIVO):');
      console.log('======================================================\n');
      qrcodeTerminal.generate(qr, { small: true });
      console.log('\nO abre en tu navegador: http://localhost:3001/qr\n');
    }

    if (connection === 'close') {
      isConnected = false;
      connectedUser = null;
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('⚠️ Conexión cerrada. Reconectando...', shouldReconnect);
      if (shouldReconnect) {
        setTimeout(startWhatsApp, 3000);
      }
    } else if (connection === 'open') {
      isConnected = true;
      qrCodeString = null;
      connectedUser = sock.user?.id || 'Conectado';
      console.log('✅ ¡WHATSAPP CONECTADO EXITOSAMENTE Y LISTO PARA ENVIAR!');
    }
  });
}

// Endpoint de estado
app.get('/status', (req, res) => {
  res.json({
    connected: isConnected,
    user: connectedUser,
    hasQr: Boolean(qrCodeString),
  });
});

// Endpoint para escanear QR desde el navegador
app.get('/qr', (req, res) => {
  if (isConnected) {
    return res.send(`
      <!DOCTYPE html>
      <html>
        <head><title>WhatsApp MiQuipu - Conectado</title></head>
        <body style="font-family: sans-serif; text-align: center; padding: 50px; background: #f0fdf4;">
          <h1 style="color: #16a34a;">✅ WhatsApp Conectado</h1>
          <p>Tu servicio de WhatsApp está activo y listo para enviar mensajes automáticamente.</p>
        </body>
      </html>
    `);
  }

  if (!qrCodeString) {
    return res.send(`
      <!DOCTYPE html>
      <html>
        <head><title>Generando QR...</title><meta http-equiv="refresh" content="3"></head>
        <body style="font-family: sans-serif; text-align: center; padding: 50px;">
          <h2>Iniciando WhatsApp... Por favor espera unos segundos.</h2>
        </body>
      </html>
    `);
  }

  // Generar imagen QR usando CDN
  const qrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
    qrCodeString
  )}`;

  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Vincular WhatsApp MiQuipu</title>
        <meta http-equiv="refresh" content="20">
      </head>
      <body style="font-family: sans-serif; text-align: center; padding: 40px; background: #f8fafc;">
        <div style="max-width: 450px; margin: 0 auto; background: white; padding: 30px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
          <h2 style="color: #0f172a; margin-bottom: 10px;">Vincular WhatsApp MiQuipu</h2>
          <p style="color: #64748b; font-size: 14px; margin-bottom: 25px;">
            Abre WhatsApp en tu celular > Dispositivos vinculados > Vincular un dispositivo y escanea este código:
          </p>
          <img src="${qrImgUrl}" alt="QR WhatsApp" style="width: 260px; height: 260px; border-radius: 8px; border: 1px solid #e2e8f0; padding: 10px;" />
          <p style="color: #94a3b8; font-size: 12px; margin-top: 20px;">
            Esta página se actualiza automáticamente.
          </p>
        </div>
      </body>
    </html>
  `);
});

// Endpoint para enviar mensaje o foto con texto
app.post('/send', async (req, res) => {
  try {
    const { phone, message, imagePath } = req.body;

    if (!phone || !message) {
      return res.status(400).json({ success: false, error: 'phone y message son obligatorios' });
    }

    if (!isConnected || !sock) {
      return res.status(503).json({
        success: false,
        error: 'WhatsApp no está conectado. Abre http://localhost:3001/qr para escanear el QR.',
      });
    }

    const cleanPhone = String(phone).replace(/\D/g, '');
    const fullPhone = cleanPhone.startsWith('51') ? cleanPhone : `51${cleanPhone}`;
    const jid = `${fullPhone}@s.whatsapp.net`;

    // 1. Si viene una ruta de imagen válida
    if (imagePath && fs.existsSync(imagePath)) {
      const imageBuffer = fs.readFileSync(imagePath);
      await sock.sendMessage(jid, {
        image: imageBuffer,
        caption: message,
      });
      console.log(`📤 Imagen + Texto enviado con éxito a ${fullPhone}`);
      return res.json({ success: true, method: 'BAILEYS_IMAGE', to: fullPhone });
    }

    // 2. Si es solo texto
    await sock.sendMessage(jid, {
      text: message,
    });
    console.log(`📤 Mensaje de texto enviado con éxito a ${fullPhone}`);
    return res.json({ success: true, method: 'BAILEYS_TEXT', to: fullPhone });
  } catch (error) {
    console.error('Error enviando mensaje por WhatsApp:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servicio de WhatsApp escuchando en http://localhost:${PORT}`);
  startWhatsApp().catch((err) => console.error('Error al iniciar WhatsApp:', err));
});
