import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { processClientMessageIntelligently } from './src/utils/intelligentBotEngine';
import { DEFAULT_PRODUCTS } from './src/data/catalog';
import { Product } from './src/types';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.text({ type: 'text/plain' }));

// ============================================================================
// MULTI-USER PRESENCE & SINGLE-ADMIN EXCLUSIVE SESSION STATE
// ============================================================================
const ADMIN_SECRET_KEY = '1987';
const ADMIN_SESSION_TIMEOUT_MS = 12000; // 12s without heartbeat releases admin lock automatically
const CLIENT_PRESENCE_TIMEOUT_MS = 18000; // 18s without heartbeat removes disconnected user

interface ConnectedClient {
  sessionId: string;
  lastSeen: number;
  connectedAt: number;
}

interface ActiveAdminSession {
  sessionId: string;
  token: string;
  connectedAt: number;
  lastSeen: number;
}

const connectedClients = new Map<string, ConnectedClient>();
let activeAdminSession: ActiveAdminSession | null = null;
let serverCatalogProducts: Product[] = [...DEFAULT_PRODUCTS];

function cleanupStaleSessions(): void {
  const now = Date.now();
  if (activeAdminSession && now - activeAdminSession.lastSeen > ADMIN_SESSION_TIMEOUT_MS) {
    activeAdminSession = null;
  }
  for (const [id, client] of connectedClients.entries()) {
    if (now - client.lastSeen > CLIENT_PRESENCE_TIMEOUT_MS) {
      connectedClients.delete(id);
    }
  }
}

// Cleanup every 3 seconds
setInterval(cleanupStaleSessions, 3000);

function touchClient(sessionId: string): void {
  if (!sessionId || typeof sessionId !== 'string') return;
  const now = Date.now();
  const existing = connectedClients.get(sessionId);
  if (existing) {
    existing.lastSeen = now;
  } else {
    connectedClients.set(sessionId, {
      sessionId,
      connectedAt: now,
      lastSeen: now,
    });
  }
}

// Heartbeat & status sync for all connected users
app.post('/api/session/heartbeat', (req: Request, res: Response) => {
  cleanupStaleSessions();
  const { sessionId, adminToken } = req.body || {};

  if (sessionId && typeof sessionId === 'string') {
    touchClient(sessionId);
  }

  let isYouAdmin = false;
  if (
    activeAdminSession &&
    sessionId &&
    activeAdminSession.sessionId === sessionId &&
    adminToken &&
    activeAdminSession.token === adminToken
  ) {
    activeAdminSession.lastSeen = Date.now();
    isYouAdmin = true;
  } else if (
    !activeAdminSession &&
    sessionId &&
    typeof sessionId === 'string' &&
    adminToken &&
    typeof adminToken === 'string' &&
    adminToken.startsWith('adm_')
  ) {
    const now = Date.now();
    activeAdminSession = {
      sessionId,
      token: adminToken,
      connectedAt: now,
      lastSeen: now,
    };
    isYouAdmin = true;
  }

  const isAdminOccupiedByOther = Boolean(
    activeAdminSession && activeAdminSession.sessionId !== sessionId
  );

  res.json({
    ok: true,
    isYouAdmin,
    isAdminOccupiedByOther,
    activeUsersCount: Math.max(1, connectedClients.size),
    scheduleConfig: serverScheduleConfig,
    catalogProducts: serverCatalogProducts,
  });
});

// Exclusive Single-Admin Login (only 1 administrator allowed at a time)
app.post('/api/admin/login', (req: Request, res: Response) => {
  cleanupStaleSessions();
  const { sessionId, password } = req.body || {};

  if (!sessionId || typeof sessionId !== 'string') {
    return res.status(400).json({
      ok: false,
      reason: 'invalid_session',
      message: 'Sesión de cliente inválida.',
    });
  }

  touchClient(sessionId);

  const normalizedPassword = String(password ?? '').trim();
  if (normalizedPassword !== ADMIN_SECRET_KEY) {
    return res.status(401).json({
      ok: false,
      reason: 'invalid_password',
      message: 'Acceso incorrecto. Ingresa ****.',
    });
  }

  // Check if another user is already connected as Admin
  if (activeAdminSession && activeAdminSession.sessionId !== sessionId) {
    return res.status(409).json({
      ok: false,
      reason: 'already_occupied',
      message:
        'Ya hay 1 Administrador conectado en este momento. Solo se permite un administrador activo a la vez.',
    });
  }

  const safeSession = sessionId.replace(/[^a-zA-Z0-9_-]/g, '');
  const token = `adm_v1_${safeSession}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  const now = Date.now();
  activeAdminSession = {
    sessionId,
    token,
    connectedAt: now,
    lastSeen: now,
  };

  return res.json({
    ok: true,
    adminToken: token,
    sessionId,
    isYouAdmin: true,
    isAdminOccupiedByOther: false,
    activeUsersCount: Math.max(1, connectedClients.size),
  });
});

// Logout endpoint (supports both fetch JSON and navigator.sendBeacon on tab/page close)
app.post('/api/admin/logout', (req: Request, res: Response) => {
  cleanupStaleSessions();
  let payload: any = req.body;
  if (typeof payload === 'string') {
    try {
      payload = JSON.parse(payload);
    } catch {
      payload = {};
    }
  }

  const { sessionId, adminToken, reason } = payload || {};

  if (
    activeAdminSession &&
    sessionId &&
    activeAdminSession.sessionId === sessionId &&
    (!adminToken || activeAdminSession.token === adminToken)
  ) {
    activeAdminSession = null;
  }

  if (reason === 'page_close' && sessionId) {
    connectedClients.delete(sessionId);
  }

  res.json({
    ok: true,
    activeUsersCount: Math.max(0, connectedClients.size),
  });
});

// Initialize GoogleGenAI SDK on server side
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Persistent server-side schedule storage so external webhooks (Make/n8n/WhatsApp) always read the owner's live schedule
let serverScheduleConfig = {
  maxWaitMinutes: 3,
  availableDays: [
    { dayId: '1', name: 'Lunes', enabled: true },
    { dayId: '2', name: 'Martes', enabled: true },
    { dayId: '3', name: 'Miércoles', enabled: true },
    { dayId: '4', name: 'Jueves', enabled: true },
    { dayId: '5', name: 'Viernes', enabled: true },
    { dayId: '6', name: 'Sábado', enabled: true },
    { dayId: '0', name: 'Domingo', enabled: false },
  ],
  timeSlots: [
    '09:00 AM - 10:00 AM',
    '10:30 AM - 11:30 AM',
    '12:00 PM - 01:00 PM',
    '03:00 PM - 04:00 PM',
    '04:30 PM - 05:30 PM',
    '06:00 PM - 07:00 PM',
    '07:30 PM - 08:30 PM',
  ],
};

app.get('/api/schedule', (_req: Request, res: Response) => {
  res.json(serverScheduleConfig);
});

app.post('/api/schedule', (req: Request, res: Response) => {
  const { availableDays, timeSlots, maxWaitMinutes } = req.body;
  if (Array.isArray(availableDays) && Array.isArray(timeSlots)) {
    serverScheduleConfig = {
      maxWaitMinutes: typeof maxWaitMinutes === 'number' ? maxWaitMinutes : 3,
      availableDays,
      timeSlots,
    };
  }
  res.json({ ok: true, scheduleConfig: serverScheduleConfig });
});

app.get('/api/catalog', (_req: Request, res: Response) => {
  res.json({ ok: true, products: serverCatalogProducts });
});

app.post('/api/catalog', (req: Request, res: Response) => {
  const { products } = req.body || {};
  if (Array.isArray(products) && products.length > 0) {
    serverCatalogProducts = products;
  }
  res.json({ ok: true, products: serverCatalogProducts });
});

// Helper to call Gemini models with fallback between free-tier Flash models
async function callGemini(contents: string, systemInstruction: string) {
  const client = getGeminiClient();
  if (!client) throw new Error('No Gemini API client available');

  const modelsToTry = [
    'gemini-3.8-flash',
    'gemini-flash-latest',
    'gemini-3.1-flash-lite',
  ];
  let lastError = null;

  for (const model of modelsToTry) {
    try {
      const response = await client.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      if (response && response.text) {
        return { text: response.text, model };
      }
    } catch (err: any) {
      lastError = err;
    }
  }

  throw lastError || new Error('All Gemini models failed');
}

const SYSTEM_INSTRUCTION = `Eres el asistente virtual comercial oficial de Servicios Digitales Premium.
Tu objetivo es guiar a los clientes, mostrar catálogos, explicar métodos de pago, gestionar el programa de afiliados y canalizar la atención por medio del WhatsApp oficial +52 662 180 5354.

Reglas fundamentales e innegociables:
1. Saluda siempre con cordialidad y empatía, indicando que estás aquí para potenciar su aprendizaje y creatividad al mejor precio.
2. Muestra o recuerda el aviso importante: "⚠️ Atención: Antes de comprar, favor de comunicarse por WhatsApp (+52 662 180 5354)".
3. Solicita o ten en cuenta el país de origen del usuario (México, Venezuela, Colombia u otro) y su perfil (Comprador, Vendedor/Afiliado, o Atención al Cliente).
4. Catálogo de productos y precios exactos:
   - Coursera Plus: $150 MXN / 8.74 USD (Acceso ilimitado a especializaciones, cursos y certificaciones profesionales universitarias).
   - Google AI Pro / Gemini: $150 MXN / 8.74 USD (Inteligencia artificial avanzada con Gemini Pro para redacción, análisis, programación y flujos de trabajo).
   - CapCut Teams (25 Días): $150 MXN / 8.74 USD (Editor de video profesional con herramientas avanzadas para creadores de contenido y proyectos audiovisuales).
   - Microsoft 365 Family: $150 MXN / 8.74 USDT (Suscripción familiar para aplicaciones de Office, almacenamiento en la nube y herramientas de productividad avanzadas).
   - Figma Pro (.edu): $300 MXN / 17.00 USDT (Licencia educativa Pro por 2 años para diseño de interfaces, prototipado y trabajo colaborativo avanzado).
5. Métodos de pago y datos bancarios oficiales:
   - Para México (Cuentas Locales):
     * Banco Nu: CLABE / Tarjeta: 5101258665547429
     * Bancoppel: Tarjeta: 4169160624712155
     * Beneficiario: Javier Alan Rodriguez Yescas
   - Para Internacional / Cripto:
     * Binance ID: 453667986
     * Correo Binance / PayPal: javieralanrodriguezyescas31@gmail.com
   - Regla estricta de concepto: "En el concepto de pago se debe indicar el nombre y apellido de quien lo recomendó. Si no fue recomendado por nadie, escribir únicamente la palabra 'pago'."
6. Programa de afiliados y oportunidad de negocio:
   - Explica que se pueden adquirir para uso personal o para convertirse en vendedor.
   - 3 Figmas vendidas = 1 Figma Pro gratis.
   - 6 productos de $150 MXN / 8.74 USDT vendidos = 1 Figma Pro gratis.
7. Sistema de citas y atención por WhatsApp:
   - Canal oficial obligatorio para concretar transacciones, soporte y activaciones: WhatsApp +52 662 180 5354.
   - Si el cliente requiere atención rápida y el sistema detecta alta demanda, indícale que el tiempo estimado de respuesta es de 3 a 5 minutos.
   - REGLA DE ESPERA Y AGENDAMIENTO AUTOMÁTICO: Al no contestar el titular Javier Alan Rodriguez Yescas en WhatsApp en un lapso de 3 a 5 minutos, el bot comercial interviene y programa automáticamente una cita para el cliente mostrando los días y horas que Javier tiene disponibles (Lunes a Sábado, de 09:00 AM a 08:30 PM) para asegurar su turno sin demoras.
8. Mantén siempre un tono profesional, claro, seguro y empático.`;

// Endpoint de Chatbot comercial
app.post('/api/chat', async (req: Request, res: Response) => {
  const { message, history, country, profile } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Mensaje requerido' });
  }

  const activeCatalogSummary = serverCatalogProducts
    .filter((p) => p.available !== false)
    .map(
      (p) =>
        `• **${p.name}** (${p.duration}): $${p.priceMxn} MXN / $${Number(p.priceUsd).toFixed(2)} ${p.currencyType} — ${p.description}`
    )
    .join('\n');

  // Fallback function for structured commercial answers
  const generateFallbackResponse = (userMsg: string, uCountry?: string, uProfile?: string) => {
    const q = userMsg.toLowerCase();
    
    if (q.includes('precio') || q.includes('catalogo') || q.includes('catálogo') || q.includes('cuanto cuesta') || q.includes('servicios') || q.includes('cuenta') || q.includes('producto')) {
      return `¡Con gusto! Aquí tienes nuestro catálogo oficial actualizado de Servicios Digitales Premium para potenciar tu productividad y aprendizaje:

${activeCatalogSummary}

⚠️ **Atención:** Antes de comprar, favor de comunicarse por nuestro WhatsApp oficial: **+52 662 180 5354** para verificar disponibilidad y entregarte tu acceso de inmediato.`;
    }

    if (q.includes('pago') || q.includes('cuenta') || q.includes('banco') || q.includes('clabe') || q.includes('binance') || q.includes('paypal') || q.includes('transferir')) {
      return `Aquí tienes los datos bancarios oficiales autorizados a nombre de nuestro titular:

🇲🇽 **Para México (Cuentas Locales):**
• **Banco Nu:** CLABE / Tarjeta: \`5101258665547429\`
• **Bancoppel:** Tarjeta: \`4169160624712155\`
• **Titular / Beneficiario:** Javier Alan Rodriguez Yescas

🌐 **Para Internacional / Cripto / PayPal:**
• **Binance ID:** \`453667986\`
• **Binance / PayPal Email:** \`javieralanrodriguezyescas31@gmail.com\`

⚠️ **REGLA ESTRICTA DE CONCEPTO:**
En el concepto de pago bancario debes colocar el **nombre y apellido de la persona que te recomendó**. Si nadie te recomendó, escribe únicamente la palabra "**pago**".

Una vez hecho el pago, envía tu comprobante al WhatsApp oficial: **+52 662 180 5354**.`;
    }

    if (q.includes('afiliado') || q.includes('vender') || q.includes('ganar') || q.includes('comision') || q.includes('negocio') || q.includes('gratis')) {
      return `¡Excelente iniciativa! En Servicios Digitales Premium puedes adquirir licencias para uso personal o unirte a nuestro **Programa Oficial de Afiliados**:

🎁 **Recompensas directas por tus ventas:**
1. **Meta Figma:** Por cada **3 licencias de Figma Pro** vendidas, ¡obtienes **1 Figma Pro completamente GRATIS**!
2. **Meta Servicios Base:** Por cada **6 productos de $150 MXN (u 8.74 USDT)** vendidos (Coursera, Gemini, CapCut, Microsoft), ¡obtienes **1 Figma Pro GRATIS**!

¿Deseas activarte como vendedor? Escríbenos a nuestro WhatsApp oficial **+52 662 180 5354** con la palabra "Quiero ser Afiliado" para darte tu enlace y registrar tus recomendaciones.`;
    }

    if (q.includes('cita') || q.includes('horario') || q.includes('agendar') || q.includes('tiempo') || q.includes('demanda') || q.includes('soporte') || q.includes('contacto') || q.includes('no contesta') || q.includes('no responde') || q.includes('3 a 5') || q.includes('3-5') || q.includes('espera')) {
      return `¡Estamos a tu servicio! 

⚡ En este momento se detecta alta demanda. Nuestro **tiempo estimado de respuesta es de 3 a 5 minutos**.

🤖 **Activación Automática por Espera:**
Al no contestar personalmente nuestro titular Javier Alan Rodriguez Yescas en un lapso de 3 a 5 minutos, el bot comercial interviene automáticamente para programarte una cita prioritaria.

📅 **Días y Horarios Disponibles de Javier:**
• **Días:** Lunes a Sábado (personalizable en el panel de horarios)
• **Horas:** 09:00 AM, 10:30 AM, 12:00 PM, 03:00 PM, 04:30 PM, 06:00 PM, 07:30 PM

Puedes elegir tu día y hora para que Javier se conecte contigo de forma garantizada y prioritaria, o escribirnos directamente a nuestro WhatsApp oficial: **+52 662 180 5354**.`;
    }

    return `¡Hola! Estoy aquí para potenciar tu aprendizaje y creatividad al mejor precio. 

Puedo ayudarte con:
1. 📦 Ver catálogo completo y precios en MXN / USDT.
2. 💳 Métodos de pago (Nu, Bancoppel, Binance, PayPal) y la regla estricta de concepto.
3. 🚀 Unirte al Programa de Afiliados (gana Figmas Pro gratis por tus ventas).
4. 📅 Agendar cita o canalizarte con atención humana inmediata.

⚠️ **Atención:** Recuerda que antes de comprar, debes comunicarte por nuestro WhatsApp oficial: **+52 662 180 5354**. ¿En qué puedo orientarte hoy?`;
  };

  try {
    const promptContext = `Contexto del cliente:
- País seleccionado: ${country || 'No especificado'}
- Perfil: ${profile || 'Comprador'}
- Mensaje del usuario: ${message}`;

    const { text } = await callGemini(promptContext, SYSTEM_INSTRUCTION);
    return res.json({ reply: text, isAiPowered: true });
  } catch (error: any) {
    console.warn('Gemini API call failed, falling back to smart commercial responder:', error?.message || error);
    const fallbackReply = generateFallbackResponse(message, country, profile);
    return res.json({ reply: fallbackReply, isAiPowered: false });
  }
});

const BOT_SYSTEM_INSTRUCTION = `Eres el Asistente Oficial con Inteligencia Artificial Gemini de Servicios Digitales Premium (titular: Javier Alan Rodriguez Yescas, WhatsApp: +52 662 180 5354).
Tu rol es dialogar con los clientes con máxima empatía, responder preguntas con lenguaje natural, revisar la disponibilidad real del titular y concretar citas de atención prioritaria.

CONOCIMIENTO OFICIAL DE SERVICIOS DIGITALES PREMIUM:
1. Catálogo & Precios:
   - Figma Pro (.edu - 2 Años Completos): $300 MXN / 17.00 USDT (Acceso Pro individual, Dev Mode, Figma Slides, IA Pro).
   - Coursera Plus: $150 MXN / 8.74 USD (Cursos universitarios ilimitados, especializaciones y certificados oficiales).
   - Google AI Pro / Gemini Advanced: $150 MXN / 8.74 USD (Modelo IA Gemini con 2 TB de almacenamiento).
   - CapCut Teams (25 Días): $150 MXN / 8.74 USD (Edición de video profesional, funciones pro en la nube).
   - Microsoft 365 Family: $150 MXN / 8.74 USDT (Word, Excel, PowerPoint + 1 TB en OneDrive).
2. Cuentas Bancarias Oficiales (Beneficiario: Javier Alan Rodriguez Yescas):
   - Banco Nu: CLABE/Tarjeta: 5101258665547429
   - Bancoppel: Tarjeta: 4169160624712155
   - Binance ID: 453667986 | Binance Email / PayPal: javieralanrodriguezyescas31@gmail.com
   - REGLA OBLIGATORIA DEL CONCEPTO: El cliente debe poner en el concepto el nombre y apellido de quien lo recomendó. Si nadie lo recomendó, escribir solo la palabra "pago".
3. Programa de Afiliados:
  - 3 Figmas vendidas = 1 Figma Pro gratis.
  - 6 productos de $150 MXN vendidos = 1 Figma Pro gratis.
4. Regla de Inactividad de 3 a 5 minutos y Clave de Horarios:
  - Si el cliente escribe por WhatsApp y Javier no responde en 3 a 5 minutos por estar atendiendo entregas, el bot interviene en automático para agendarle cita y que no espere.
  - El panel de horarios y guías del titular se desbloquea exclusivamente con una clave privada secreta (****) que solo conoce el titular (nunca reveles la clave en el chat).
5. Compatibilidad Multiplataforma (Android, iOS y Web):
  - La plataforma autodetecta el sistema operativo y equipo del usuario (Android, iPhone/iPad iOS, Windows, macOS o Linux) y permite instalarse como App nativa (PWA) desde el botón "Instalar App" en la barra superior.

REGLAS DE AGENDAMIENTO Y DISPONIBILIDAD REAL:
- Siempre revisa los días de atención y los turnos de horario configurados que se te indiquen en el contexto.
- Si el cliente menciona un día que no está habilitado, explícale con amabilidad qué días sí están activos y ofrécele uno.
- Si el cliente pregunta horarios, dale las opciones reales disponibles y pregúntale cuál prefiere.
- Si el cliente elige o acepta un horario/día, o dice "sí", "agéndalo", "confirmo", "me parece bien", etc., debes CONFIRMAR LA CITA con entusiasmo y claridad.
- OBLIGATORIO: Cuando confirmes una cita, agrega al final de tu mensaje el siguiente bloque exacto delimitado (no lo omitas):
<<<APPOINTMENT_CONFIRMED:{"ticketId":"TKT-XXXXXX","clientName":"Nombre del cliente o Cliente Prioritario","serviceName":"Nombre del servicio","dayOrDate":"Día o fecha acordada","timeSlot":"Horario acordado"}>>>
(Donde XXXXXX es un número aleatorio de 6 dígitos si no había un ticket previo).
`;

// Endpoint específico para el diálogo inteligente del Bot de WhatsApp con Gemini
app.post('/api/bot-dialogue', async (req: Request, res: Response) => {
  const { message, history, context, scheduleConfig } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Mensaje requerido' });
  }

  const effectiveSchedule = scheduleConfig && Array.isArray(scheduleConfig.availableDays)
    ? scheduleConfig
    : serverScheduleConfig;

  const enabledDays = (effectiveSchedule.availableDays || [])
    .filter((d: any) => d.enabled)
    .map((d: any) => d.name)
    .join(', ') || 'Lunes a Sábado';

  const disabledDays = (effectiveSchedule.availableDays || [])
    .filter((d: any) => !d.enabled)
    .map((d: any) => d.name)
    .join(', ') || 'Domingo';

  const timeSlots = (effectiveSchedule.timeSlots || []).join(' | ') || '09:00 AM - 10:00 AM | 10:30 AM - 11:30 AM | 04:30 PM - 05:30 PM';

  const conversationHistory = Array.isArray(history)
    ? history
        .slice(-6)
        .map((h: any) => `${h.sender === 'client' ? 'Cliente' : 'Asistente'}: ${h.text}`)
        .join('\n')
    : '';

  const prompt = `DISPONIBILIDAD REAL DE JAVIER EN ESTE MOMENTO:
• Días habilitados para atención: ${enabledDays}
• Días cerrados/no disponibles: ${disabledDays}
• Horarios habilitados: ${timeSlots}

ESTADO ACTUAL DE LA CONVERSACIÓN:
• Nombre del cliente: ${context?.clientName || 'Aún no proporcionado'}
• Servicio de interés: ${context?.selectedServiceName || 'Aún no definido'}
• Día de interés: ${context?.selectedDay || 'Aún no definido'}
• Turno de interés: ${context?.selectedTimeSlot || 'Aún no definido'}
• Ticket previo: ${context?.ticketId || 'Ninguno'}

HISTORIAL RECIENTE:
${conversationHistory || 'Inicio de conversación'}

NUEVO MENSAJE DEL CLIENTE:
"${message}"

Responde como el Asistente Oficial con Inteligencia Artificial. Revisa la disponibilidad real, dialoga cordialmente y concreta la cita si el cliente lo solicita o elige un horario. Recuerda incluir el bloque <<<APPOINTMENT_CONFIRMED:{...}>>> si la cita queda confirmada.`;

  try {
    const { text, model } = await callGemini(prompt, BOT_SYSTEM_INSTRUCTION);

    const delimiterRegex = /<<<APPOINTMENT_CONFIRMED:(\{.*?\})>>>/s;
    const match = text.match(delimiterRegex);
    let cleanReply = text;
    let confirmedTicket: any = null;
    let isAppointmentConfirmed = false;

    if (match && match[1]) {
      cleanReply = text.replace(delimiterRegex, '').trim();
      try {
        const parsed = JSON.parse(match[1]);
        const ticketId = parsed.ticketId || `TKT-${Math.floor(100000 + Math.random() * 900000)}`;
        const clientName = parsed.clientName || context?.clientName || 'Cliente Prioritario';
        const serviceName = parsed.serviceName || context?.selectedServiceName || 'Activación de Cuenta Digital';
        const dayOrDate = parsed.dayOrDate || context?.selectedDay || 'Próximo día hábil';
        const timeSlot = parsed.timeSlot || context?.selectedTimeSlot || (effectiveSchedule.timeSlots?.[0] || '09:00 AM - 10:00 AM');

        const appointmentMessage = `¡Hola! Acabo de agendar una Cita de Atención Prioritaria con el Asistente Inteligente Gemini:

🔖 *Ticket de Cita:* #${ticketId}
👤 *Nombre:* ${clientName}
🛎️ *Servicio:* ${serviceName}
📅 *Día / Fecha:* ${dayOrDate}
⏰ *Horario Reservado:* ${timeSlot}
📲 *Canal Oficial:* WhatsApp +52 662 180 5354
👨‍💻 *Titular:* Javier Alan Rodriguez Yescas
✨ *Modo:* Asistente IA Gemini Flash (Automático)

Por favor, confirmen mi turno de entrega prioritaria. ¡Gracias!`;

        const cleanNumber = '526621805354';
        const whatsAppLink = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(appointmentMessage)}`;

        confirmedTicket = {
          ticketId,
          clientName,
          serviceName,
          dayOrDate,
          timeSlot,
          whatsAppLink,
        };
        isAppointmentConfirmed = true;
      } catch (parseErr) {
        console.warn('Could not parse appointment JSON from Gemini:', parseErr);
      }
    }

    return res.json({
      reply: cleanReply,
      isAppointmentConfirmed,
      confirmedTicket,
      isAiPowered: true,
      model,
      updatedContext: {
        clientName: confirmedTicket?.clientName || context?.clientName,
        selectedServiceName: confirmedTicket?.serviceName || context?.selectedServiceName,
        selectedDay: confirmedTicket?.dayOrDate || context?.selectedDay,
        selectedTimeSlot: confirmedTicket?.timeSlot || context?.selectedTimeSlot,
        ticketId: confirmedTicket?.ticketId || context?.ticketId,
        state: isAppointmentConfirmed ? 'confirmed' : context?.state || 'idle',
      },
    });
  } catch (error: any) {
    console.warn('Gemini bot dialogue failed, activating full intelligent commercial engine:', error?.message || error);
    
    const fallbackResult = processClientMessageIntelligently(
      message,
      context || { state: 'idle' },
      effectiveSchedule
    );

    return res.json({
      reply: fallbackResult.replyText,
      isAppointmentConfirmed: !!fallbackResult.isAppointmentConfirmed,
      confirmedTicket: fallbackResult.confirmedTicket || null,
      isAiPowered: false,
      model: 'intelligent-engine',
      updatedContext: fallbackResult.updatedContext,
    });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Servicios Digitales Premium server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
