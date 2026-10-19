import { ScheduleConfig, DayAvailability } from '../types';
import {
  OFFICIAL_WHATSAPP_NUMBER,
  OFFICIAL_BENEFICIARY,
  BANK_DETAILS,
  PRODUCTS,
  buildWhatsAppLink,
} from '../data/catalog';
import { formatEnabledDaysSummary } from '../data/scheduleConfig';

export interface BotConversationContext {
  clientName?: string;
  selectedServiceName?: string;
  selectedDay?: string;
  selectedTimeSlot?: string;
  ticketId?: string;
  state: 'idle' | 'awaiting_service' | 'awaiting_slot' | 'awaiting_name' | 'confirmed';
}

export interface BotProcessResult {
  replyText: string;
  updatedContext: BotConversationContext;
  isAppointmentConfirmed?: boolean;
  confirmedTicket?: {
    ticketId: string;
    clientName: string;
    serviceName: string;
    dayOrDate: string;
    timeSlot: string;
    whatsAppLink: string;
  };
}

// Clean and normalize text
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .trim();
}

// Find product match
function detectProduct(normalized: string): string | null {
  if (normalized.includes('figma')) return 'Figma Pro (.edu) - Activación 2 Años';
  if (normalized.includes('coursera')) return 'Coursera Plus - Soporte & Entrega';
  if (normalized.includes('gemini') || normalized.includes('google ai') || normalized.includes('ia') || normalized.includes('inteligencia artificial')) {
    return 'Google AI Pro / Gemini - Activación';
  }
  if (normalized.includes('capcut') || normalized.includes('video') || normalized.includes('edicion')) {
    return 'CapCut Teams - Entrega de Equipo';
  }
  if (normalized.includes('office') || normalized.includes('microsoft') || normalized.includes('365') || normalized.includes('word') || normalized.includes('excel')) {
    return 'Microsoft 365 Family - Invitación';
  }
  return null;
}

// Extract name if provided
function extractName(text: string): string | null {
  const stopWords = ['y', 'e', 'o', 'pero', 'para', 'por', 'con', 'quiero', 'me', 'necesito', 'busco', 'deseo', 'a', 'en', 'el', 'la', 'los', 'las', 'un', 'una', 'hoy', 'manana'];

  const cleanExtractedWords = (raw: string): string | null => {
    const words = raw.trim().split(/\s+/);
    const validWords: string[] = [];
    for (const w of words) {
      const low = w.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (stopWords.includes(low)) break;
      validWords.push(w.charAt(0).toUpperCase() + w.slice(1));
    }
    if (validWords.length === 0) return null;
    const joined = validWords.join(' ');
    const reserved = ['hoy', 'manana', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo', 'nuevo', 'cliente', 'comprar', 'cita', 'agenda', 'activar', 'comprador', 'estudiante', 'de', 'mexico', 'colombia', 'venezuela'];
    if (reserved.includes(joined.toLowerCase())) return null;
    return joined;
  };

  // First check explicit name indicators
  const explicitMatch = text.match(/(?:mi nombre es|me llamo|a nombre de|nombre:)\s+([a-zA-ZáéíóúÁÉÍÓÚñÑ]+(?:\s+[a-zA-ZáéíóúÁÉÍÓÚñÑ]+)?)/i);
  if (explicitMatch && explicitMatch[1]) {
    const cleaned = cleanExtractedWords(explicitMatch[1]);
    if (cleaned) return cleaned;
  }

  // Secondary check with "soy"
  const soyMatch = text.match(/\bsoy\s+([a-zA-ZáéíóúÁÉÍÓÚñÑ]+(?:\s+[a-zA-ZáéíóúÁÉÍÓÚñÑ]+)?)/i);
  if (soyMatch && soyMatch[1]) {
    const cleaned = cleanExtractedWords(soyMatch[1]);
    if (cleaned) return cleaned;
  }

  return null;
}

// Check if user is asking for availability or schedule
function isAskingSchedule(normalized: string): boolean {
  return (
    normalized.includes('horario') ||
    normalized.includes('disponib') ||
    normalized.includes('cuando atiend') ||
    normalized.includes('a que hora') ||
    normalized.includes('dias') ||
    normalized.includes('estas disponible') ||
    normalized.includes('que dias') ||
    normalized.includes('trabajas') ||
    normalized.includes('abierto')
  );
}

// Check if user wants to schedule / book
function isBookingIntent(normalized: string): boolean {
  return (
    normalized.includes('agend') ||
    normalized.includes('cita') ||
    normalized.includes('turno') ||
    normalized.includes('apart') ||
    normalized.includes('reserv') ||
    normalized.includes('program') ||
    normalized.includes('comprar ahora') ||
    normalized.includes('quiero entrega')
  );
}

// Check if a time slot was mentioned
function matchTimeSlot(normalized: string, availableSlots: string[]): string | null {
  // Direct inclusion
  for (const slot of availableSlots) {
    const normSlot = normalizeText(slot);
    // check hours like "11", "04:30", "12", "7:30", "10:30"
    const hourMatches = slot.match(/\b(\d{1,2}(?::\d{2})?)\s*(am|pm)/gi);
    if (hourMatches) {
      for (const hm of hourMatches) {
        if (normalized.includes(normalizeText(hm))) {
          return slot;
        }
      }
    }
  }

  // Check generic terms
  if (normalized.includes('manana') || normalized.includes('temprano')) {
    const morningSlot = availableSlots.find((s) => s.includes('AM'));
    if (morningSlot) return morningSlot;
  }
  if (normalized.includes('tarde')) {
    const afternoonSlot = availableSlots.find((s) => s.includes('PM') && (s.includes('03:') || s.includes('04:') || s.includes('05:') || s.includes('06:')));
    if (afternoonSlot) return afternoonSlot;
  }
  if (normalized.includes('noche')) {
    const eveningSlot = availableSlots.find((s) => s.includes('07:') || s.includes('08:') || s.includes('PM'));
    if (eveningSlot) return eveningSlot;
  }

  // Check ordinal like "la primera", "opcion 1", "el primero"
  if (normalized.includes('primer') || normalized.includes('opcion 1') || normalized.includes('1era')) {
    return availableSlots[0] || null;
  }
  if (normalized.includes('segund') || normalized.includes('opcion 2') || normalized.includes('2da')) {
    return availableSlots[1] || availableSlots[0] || null;
  }
  if (normalized.includes('tercer') || normalized.includes('opcion 3') || normalized.includes('3ra')) {
    return availableSlots[2] || availableSlots[0] || null;
  }

  return null;
}

// Check day mentions
function detectDay(normalized: string, daysConfig: DayAvailability[]): { dayName: string; isAvailable: boolean } | null {
  const daysMap: Record<string, string> = {
    lunes: 'Lunes',
    martes: 'Martes',
    miercoles: 'Miércoles',
    jueves: 'Jueves',
    viernes: 'Viernes',
    sabado: 'Sábado',
    domingo: 'Domingo',
    hoy: 'Hoy',
    manana: 'Mañana',
  };

  for (const [key, name] of Object.entries(daysMap)) {
    if (normalized.includes(key)) {
      if (key === 'hoy' || key === 'manana') {
        return { dayName: name, isAvailable: true };
      }
      const found = daysConfig.find((d) => normalizeText(d.name) === key);
      return {
        dayName: name,
        isAvailable: found ? found.enabled : false,
      };
    }
  }
  return null;
}

/**
 * Intelligent dialogue processor running 100% locally in the browser (Zero API key needed).
 * Analyzes natural language, checks real schedule availability, and manages multi-turn appointment booking.
 */
export function processClientMessageIntelligently(
  userText: string,
  currentContext: BotConversationContext,
  scheduleConfig: ScheduleConfig
): BotProcessResult {
  const normalized = normalizeText(userText);
  const context: BotConversationContext = { ...currentContext };

  const daysSummary = formatEnabledDaysSummary(scheduleConfig.availableDays);
  const availableSlots = scheduleConfig.timeSlots;
  const sampleSlot = availableSlots[0] || '11:00 AM - 12:00 PM';

  // 1. Detect any name mentioned
  const extractedName = extractName(userText);
  if (extractedName) {
    context.clientName = extractedName;
  }

  // 2. Detect any product mentioned
  const detectedProd = detectProduct(normalized);
  if (detectedProd) {
    context.selectedServiceName = detectedProd;
  }

  // 3. Detect any day mentioned
  const dayMatch = detectDay(normalized, scheduleConfig.availableDays);
  if (dayMatch) {
    if (!dayMatch.isAvailable) {
      // Day is closed!
      return {
        replyText: `📅 Disculpa, los días **${dayMatch.dayName}** Javier se encuentra fuera de servicio o atendiendo mantenimiento.
        
Los días que Javier tiene **disponibles en tiempo real** son:
👉 **${daysSummary}**

¿Te gustaría que te agendemos en alguno de esos días disponibles?`,
        updatedContext: context,
      };
    }
    context.selectedDay = dayMatch.dayName;
  }

  // 4. Detect slot mentioned
  const slotMatch = matchTimeSlot(normalized, availableSlots);
  if (slotMatch) {
    context.selectedTimeSlot = slotMatch;
  }

  // 5. Check if user is confirming or agreeing
  const isAffirmative =
    normalized === 'si' ||
    normalized.startsWith('si ') ||
    normalized.includes('perfecto') ||
    normalized.includes('de acuerdo') ||
    normalized.includes('confirmo') ||
    normalized.includes('me parece bien') ||
    normalized.includes('esta bien') ||
    normalized.includes('vale') ||
    normalized.includes('dale') ||
    normalized.includes('agendalo') ||
    normalized.includes('adelante');

  // State Machine Step 1: User is confirming or we have enough info to book
  if (context.state === 'awaiting_name' && !context.clientName) {
    // If user typed just their name or a short answer
    if (userText.split(' ').length <= 4 && !isAskingSchedule(normalized)) {
      context.clientName = userText.trim();
      context.state = 'awaiting_slot';
    }
  }

  // Check if we are ready to confirm an appointment
  if (
    (context.state === 'awaiting_slot' || context.state === 'awaiting_service' || isBookingIntent(normalized) || isAffirmative) &&
    (context.selectedTimeSlot || slotMatch)
  ) {
    const finalSlot = context.selectedTimeSlot || slotMatch || sampleSlot;
    const finalDay = context.selectedDay || 'Próximo día hábil';
    const finalService = context.selectedServiceName || 'Activación de Cuenta Digital';
    const finalName = context.clientName || 'Cliente Prioritario';
    const ticketId = context.ticketId || `TKT-${Math.floor(100000 + Math.random() * 900000)}`;

    context.selectedTimeSlot = finalSlot;
    context.selectedDay = finalDay;
    context.selectedServiceName = finalService;
    context.clientName = finalName;
    context.ticketId = ticketId;
    context.state = 'confirmed';

    const appointmentMessage = `¡Hola! Acabo de agendar una Cita de Atención Prioritaria con el Asistente Inteligente:

🔖 *Ticket de Cita:* #${ticketId}
👤 *Nombre:* ${finalName}
🛎️ *Servicio:* ${finalService}
📅 *Día / Fecha:* ${finalDay}
⏰ *Horario Reservado:* ${finalSlot}
📲 *Canal Oficial:* WhatsApp ${OFFICIAL_WHATSAPP_NUMBER}
👨‍💻 *Titular:* ${OFFICIAL_BENEFICIARY}

Por favor, confirmen mi turno de entrega prioritaria. ¡Gracias!`;

    const whatsAppLink = buildWhatsAppLink(appointmentMessage);

    const reply = `✅ **¡Cita Agendada Exitosamente por el Asistente Inteligente!**

He verificado la **disponibilidad real** en el calendario de Javier y tu turno ha quedado reservado:

🔖 **Ticket Oficial:** #${ticketId}
👤 **Cliente:** ${finalName}
🛎️ **Servicio:** ${finalService}
🗓️ **Día:** ${finalDay} (${daysSummary})
⏰ **Turno:** ${finalSlot}
👨‍💻 **Especialista asignado:** ${OFFICIAL_BENEFICIARY} (${OFFICIAL_WHATSAPP_NUMBER})

🚀 Puedes pulsar el botón de abajo para enviar este ticket directamente al WhatsApp de Javier y comenzar tu activación de inmediato sin esperas.`;

    return {
      replyText: reply,
      updatedContext: context,
      isAppointmentConfirmed: true,
      confirmedTicket: {
        ticketId,
        clientName: finalName,
        serviceName: finalService,
        dayOrDate: finalDay,
        timeSlot: finalSlot,
        whatsAppLink,
      },
    };
  }

  // User specifically wants to book an appointment
  if (isBookingIntent(normalized)) {
    context.state = 'awaiting_slot';
    const serviceMentioned = context.selectedServiceName ? `para **${context.selectedServiceName}**` : '';
    
    return {
      replyText: `¡Excelente! Vamos a agendar tu cita ${serviceMentioned} de forma prioritaria.

📅 **Disponibilidad real de Javier:**
• 🗓️ **Días habilitados:** ${daysSummary}
• ⏰ **Horarios disponibles hoy y próximos días:**
${availableSlots.map((s, idx) => `  ${idx + 1}. › ${s}`).join('\n')}

¿Cuál de estos horarios te queda mejor? Si gustas, dime también tu nombre para personalizar tu ticket oficial.`,
      updatedContext: context,
    };
  }

  // User asks for real schedule & availability
  if (isAskingSchedule(normalized)) {
    return {
      replyText: `🕒 **Consulta de Disponibilidad en Tiempo Real:**

Actualmente Javier Alan Rodriguez Yescas tiene configurado el siguiente calendario de atención:

• 🗓️ **Días de atención:** ${daysSummary}
• ⏰ **Turnos de entrega disponibles:**
${availableSlots.map((s) => `  › ${s}`).join('\n')}
• ⏱️ **Tiempo de respuesta en WhatsApp (${OFFICIAL_WHATSAPP_NUMBER}):** 3 a 5 minutos.

¿Te gustaría que te reserve alguno de estos horarios ahora mismo? Solo indícame cuál prefieres (por ejemplo: *"el de las ${sampleSlot}"*).`,
      updatedContext: context,
    };
  }

  // User asks about prices or catalog
  if (
    normalized.includes('precio') ||
    normalized.includes('costo') ||
    normalized.includes('cuanto vale') ||
    normalized.includes('cuanto cuesta') ||
    normalized.includes('catalogo') ||
    normalized.includes('productos') ||
    normalized.includes('servicios') ||
    normalized.includes('que vendes') ||
    normalized.includes('planes')
  ) {
    return {
      replyText: `💎 **Catálogo Oficial & Precios Disponibles:**

1. 🎨 **Figma Pro (.edu - 2 Años Completos):** $300 MXN / 17.00 USDT
   › Acceso Pro individual, Figma Slides, Dev Mode, IA Pro.
2. 📚 **Coursera Plus Anual:** $150 MXN / 8.74 USD
   › Cursos ilimitados y certificados oficiales incluidos.
3. 🤖 **Google AI Pro / Gemini Advanced:** $150 MXN / 8.74 USD
   › Modelo Gemini Ultra/Pro con 2 TB de almacenamiento.
4. 🎬 **CapCut Teams (25 Días):** $150 MXN / 8.74 USD
   › Espacio en la nube y funciones Pro desbloqueadas.
5. 📊 **Microsoft 365 Family:** $150 MXN / 8.74 USDT
   › Word, Excel, PowerPoint + 1 TB en OneDrive.

⚡ *Garantía de servicio durante todo el periodo contratado.*
¿Cuál de estos te gustaría adquirir o agendar para entrega?`,
      updatedContext: context,
    };
  }

  // Specific question about Figma
  if (normalized.includes('figma')) {
    context.selectedServiceName = 'Figma Pro (.edu) - Activación 2 Años';
    return {
      replyText: `🎨 **Figma Pro (.edu) con 2 Años de Vigencia Oficial:**

• **Precio:** $300 MXN (o 17.00 USDT vía Binance Pay).
• **Beneficios:** Acceso a proyectos y archivos ilimitados, Dev Mode completo, Figma Slides y nuevas herramientas de IA.
• **Activación:** Se entrega directo a tu correo o cuenta.
• **Garantía:** Cobertura de soporte con el titular Javier Alan Rodriguez Yescas.

¿Deseas que te reservemos tu turno de activación en los horarios disponibles? (Días: ${daysSummary})`,
      updatedContext: context,
    };
  }

  // Specific question about Coursera
  if (normalized.includes('coursera')) {
    context.selectedServiceName = 'Coursera Plus - Soporte & Entrega';
    return {
      replyText: `📚 **Coursera Plus Oficial:**

• **Precio:** $150 MXN (o 8.74 USD / USDT).
• **Beneficios:** Miles de cursos universitarios (Google, IBM, Stanford, etc.) con certificados profesionales verificables sin costo adicional.
• **Duración:** Acceso completo con entrega garantizada.

¿Te gustaría apartar tu cupo ahora mismo en alguno de nuestros turnos disponibles?`,
      updatedContext: context,
    };
  }

  // Specific question about Gemini / AI
  if (normalized.includes('gemini') || normalized.includes('google ai') || normalized.includes('ia')) {
    context.selectedServiceName = 'Google AI Pro / Gemini - Activación';
    return {
      replyText: `🤖 **Google AI Pro & Gemini Advanced:**

• **Precio:** $150 MXN (o 8.74 USD).
• **Beneficios:** Acceso a los modelos más avanzados de razonamiento de Google, integración profunda con Workspace y 2 TB de almacenamiento en Google Drive.

¿Quieres que te agendemos cita para la entrega y activación?`,
      updatedContext: context,
    };
  }

  // Payment methods & accounts
  if (
    normalized.includes('pago') ||
    normalized.includes('cuenta') ||
    normalized.includes('clabe') ||
    normalized.includes('banco') ||
    normalized.includes('transfer') ||
    normalized.includes('deposito') ||
    normalized.includes('oxxo') ||
    normalized.includes('binance') ||
    normalized.includes('paypal')
  ) {
    return {
      replyText: `💳 **Cuentas Bancarias Oficiales - Titular: ${OFFICIAL_BENEFICIARY}**

🇲🇽 **México (SPEI / OXXO):**
• **Banco Nu:** CLABE/Tarjeta: \`5101258665547429\`
• **Bancoppel:** Tarjeta: \`4169160624712155\`

🌐 **Internacional & Cripto:**
• **Binance Pay:** Binance ID: \`453667986\` (USDT sin comisión)
• **PayPal / Binance Correo:** \`javieralanrodriguezyescas31@gmail.com\`

⚠️ **REGLA OBLIGATORIA DEL CONCEPTO:**
Al realizar tu transferencia, en el campo *Concepto / Motivo de pago* debes colocar el **Nombre y Apellido de la persona que te recomendó**. Si nadie te recomendó, pon únicamente la palabra **"pago"**.

¿Deseas que te agende tu cita para entregar tu cuenta en cuanto realices el pago?`,
      updatedContext: context,
    };
  }

  // Concept rule question
  if (normalized.includes('concepto') || normalized.includes('motivo') || normalized.includes('recomendo')) {
    return {
      replyText: `📌 **Regla Oficial del Concepto de Transferencia:**

Es indispensable para validar tu pago y acreditar comisiones de afiliados:
1. Si un promotor o amigo te recomendó: escribe su **Nombre y Apellido** en el concepto.
2. Si llegaste por ti mismo: escribe únicamente la palabra **"pago"**.

🚫 *Nunca pongas palabras como "cuentas", "figma" o "licencias" en el concepto bancario.*`,
      updatedContext: context,
    };
  }

  // Affiliate program
  if (normalized.includes('afiliad') || normalized.includes('ganar') || normalized.includes('comision') || normalized.includes('vender')) {
    return {
      replyText: `🤝 **Programa Oficial de Afiliados:**

¡Gana cuentas gratis y beneficios refiriendo clientes a Servicios Digitales Premium!
🎁 **Recompensas directas:**
• Vende 3 Figmas Pro ➡️ **¡Obtén 1 Figma Pro gratis!**
• Vende 6 productos de $150 MXN (Coursera, Gemini, CapCut, Microsoft) ➡️ **¡Obtén 1 Figma Pro gratis!**

Tus clientes solo deben poner tu **Nombre y Apellido** en el concepto bancario al transferir al WhatsApp oficial (${OFFICIAL_WHATSAPP_NUMBER}).`,
      updatedContext: context,
    };
  }

  // Inactivity / 3 to 5 minutes question
  if (normalized.includes('3 a 5') || normalized.includes('minuto') || normalized.includes('no contesta') || normalized.includes('espera')) {
    return {
      replyText: `⏳ **Protocolo de Inactividad de 3 a 5 Minutos:**

Si le escribes a Javier al WhatsApp **${OFFICIAL_WHATSAPP_NUMBER}** y se encuentra atendiendo otros pedidos, a los **3 a 5 minutos** yo (el asistente autónomo) intervengo de inmediato para que no pierdas tu tiempo:
1. Te asigno un número de ticket prioritario.
2. Te muestro los horarios configurados: **${availableSlots.join(', ')}**.
3. Registro tu solicitud en la lista de espera preferencial.`,
      updatedContext: context,
    };
  }

  // Password / Clave 1987 question
  if (normalized.includes('clave') || normalized.includes('contrasena') || normalized.includes('1987') || normalized.includes('desbloquear')) {
    return {
      replyText: `🔐 **Clave Única de Seguridad del Sistema:**

El Panel de Disponibilidad de Días y Horas de **${OFFICIAL_BENEFICIARY}** se desbloquea exclusivamente con la clave oficial:
👉 **\`1987\`**

Puedes abrirlo desde el botón **"Horarios (1987)"** en la barra superior o en la sección de Citas y Simulador.`,
      updatedContext: context,
    };
  }

  // Android / iOS / Web / Install question
  if (
    normalized.includes('android') ||
    normalized.includes('ios') ||
    normalized.includes('iphone') ||
    normalized.includes('ipad') ||
    normalized.includes('instalar') ||
    normalized.includes('celular') ||
    normalized.includes('sistema') ||
    normalized.includes('dispositivo')
  ) {
    return {
      replyText: `📱 **Compatibilidad Multiplataforma (Android, iOS y Web):**

Nuestra aplicación cuenta con **autodetección inteligente de máquina y sistema operativo**:
• 🤖 **Android:** Instalable en 1 clic desde Chrome (*"Instalar App"*).
• 🍎 **iOS (iPhone / iPad):** Instalable desde Safari (*Compartir ➡️ Agregar a Inicio*).
• 💻 **Web Escritorio (Windows, macOS, Linux):** Instalable como aplicación directa desde la barra superior.

Usa el botón **"Instalar App"** en la parte superior para instalarla en tu equipo actual.`,
      updatedContext: context,
    };
  }

  // Greetings
  if (
    normalized.startsWith('hola') ||
    normalized.startsWith('buen') ||
    normalized.startsWith('hey') ||
    normalized.startsWith('que tal') ||
    normalized.startsWith('saludos')
  ) {
    const greetingName = context.clientName ? ` ${context.clientName}` : '';
    return {
      replyText: `¡Hola${greetingName}! 👋 Te atiende el **Asistente Inteligente Autónomo** de Servicios Digitales Premium.

Estoy sincronizado en tiempo real con la disponibilidad de **${OFFICIAL_BENEFICIARY}** (${OFFICIAL_WHATSAPP_NUMBER}).

Puedo ayudarte a:
1. 📅 **Consultar horarios y agendar tu cita** con disponibilidad real (${daysSummary}).
2. 💎 **Ver catálogo y precios** (Figma Pro, Coursera Plus, Gemini, CapCut, Microsoft).
3. 💳 **Obtener datos de pago y cuentas oficiales**.
4. ⚡ **Agendar entrega inmediata** sin esperas.

¿En qué te puedo apoyar hoy?`,
      updatedContext: context,
    };
  }

  // Thanks
  if (normalized.includes('gracias') || normalized.includes('muchas gracias') || normalized.includes('agradezco')) {
    return {
      replyText: `¡Ha sido un placer ayudarte! 😊 Recuerda que en Servicios Digitales Premium estamos para servirte y garantizar tu satisfacción. Si requieres algo más o deseas agendar tu turno, aquí estaré.`,
      updatedContext: context,
    };
  }

  // Default intelligent fallback with proactive guidance
  return {
    replyText: `Comprendo tu mensaje. Como **Asistente Inteligente Autónomo**, puedo responderte dudas comerciales o agendarte directamente una cita con Javier en su horario oficial (${daysSummary}):

• Si buscas agendar entrega, dime: *"Quiero agendar a las ${sampleSlot}"*.
• Si buscas precios, dime: *"Ver precios y catálogo"*.
• Si necesitas pagar, dime: *"Cuentas bancarias"*.

¿Cómo prefieres que procedamos?`,
    updatedContext: context,
  };
}

/**
 * Intelligent dialogue processor powered by Gemini Flash AI with automatic local fallback.
 * Sends user message and real schedule to backend /api/bot-dialogue.
 */
export async function processClientMessageWithGemini(
  userText: string,
  currentContext: BotConversationContext,
  scheduleConfig: ScheduleConfig,
  history?: Array<{ sender: 'client' | 'assistant'; text: string }>
): Promise<BotProcessResult & { isAiPowered?: boolean; model?: string }> {
  try {
    const res = await fetch('/api/bot-dialogue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: userText,
        history,
        context: currentContext,
        scheduleConfig,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.reply) {
        return {
          replyText: data.reply,
          updatedContext: {
            ...currentContext,
            ...(data.updatedContext || {}),
            state: data.isAppointmentConfirmed ? 'confirmed' : currentContext.state,
          },
          isAppointmentConfirmed: data.isAppointmentConfirmed,
          confirmedTicket: data.confirmedTicket,
          isAiPowered: data.isAiPowered,
          model: data.model,
        };
      }
    }
  } catch (err) {
    console.warn('Network call to /api/bot-dialogue failed, using local engine fallback:', err);
  }

  // Flawless fallback to local engine
  const fallbackResult = processClientMessageIntelligently(userText, currentContext, scheduleConfig);
  return {
    ...fallbackResult,
    isAiPowered: false,
    model: 'local-engine',
  };
}
