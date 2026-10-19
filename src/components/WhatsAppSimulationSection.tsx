import React, { useState, useEffect, useRef } from 'react';
import {
  MessageCircle,
  Send,
  CheckCheck,
  ShieldCheck,
  User,
  Bot,
  Sparkles,
  Phone,
  Video,
  MoreVertical,
  ExternalLink,
  Clock,
  AlertTriangle,
  Gift,
  CreditCard,
  RotateCcw,
  Calendar,
  Settings,
  Lock,
  Copy,
  Check,
  Zap,
} from 'lucide-react';
import {
  OFFICIAL_WHATSAPP_NUMBER,
  OFFICIAL_BENEFICIARY,
  buildWhatsAppLink,
} from '../data/catalog';
import {
  getSavedScheduleConfig,
  formatEnabledDaysSummary,
} from '../data/scheduleConfig';
import { ScheduleManagerModal } from './ScheduleManagerModal';
import { ProtectedSectionLock } from './ProtectedSectionLock';
import {
  processClientMessageIntelligently,
  processClientMessageWithGemini,
  BotConversationContext,
} from '../utils/intelligentBotEngine';

interface ChatBubble {
  id: string;
  sender: 'client' | 'assistant';
  text: string;
  time: string;
  ticketData?: {
    ticketId: string;
    clientName: string;
    serviceName: string;
    dayOrDate: string;
    timeSlot: string;
    whatsAppLink: string;
  };
}

interface Scenario {
  id: string;
  title: string;
  badge: string;
  clientPreview: string;
  messages: ChatBubble[];
}

export const WhatsAppSimulationSection: React.FC = () => {
  const [scheduleConfig, setScheduleConfig] = useState(getSavedScheduleConfig());
  const [isManagerOpen, setIsManagerOpen] = useState(false);

  useEffect(() => {
    const handler = () => {
      setScheduleConfig(getSavedScheduleConfig());
    };
    window.addEventListener('schedule_config_updated', handler);
    return () => window.removeEventListener('schedule_config_updated', handler);
  }, []);

  const daysSummary = formatEnabledDaysSummary(scheduleConfig.availableDays);
  const sampleTimeSlot = scheduleConfig.timeSlots[0] || '11:00 AM - 12:00 PM';

  const scenarios: Scenario[] = [
    {
      id: 'auto-agenda-3-5min',
      title: '⚡ 1. Sin Respuesta en 3 a 5 min ➡️ Cita Automática (+52 662 180 5354)',
      badge: 'Auto-Agendamiento 3-5 min',
      clientPreview: 'Hola Javier, te escribí al +52 662 180 5354 hace 4 min...',
      messages: [
        {
          id: '1',
          sender: 'client',
          text: `Hola Javier, te escribí hace unos minutos al WhatsApp ${OFFICIAL_WHATSAPP_NUMBER} para comprar Figma Pro y activar mi cuenta, ¿estás disponible?`,
          time: '19:10',
        },
        {
          id: 'wait-banner',
          sender: 'client',
          text: `⏳ [Han transcurrido 4 minutos sin respuesta del titular al ${OFFICIAL_WHATSAPP_NUMBER}. Sistema de cita automática activado...]`,
          time: '19:14',
        },
        {
          id: '2',
          sender: 'assistant',
          text: `¡Hola! 👋 Soy el Asistente Oficial de **${OFFICIAL_BENEFICIARY}** (${OFFICIAL_WHATSAPP_NUMBER}).

Debido a que Javier se encuentra atendiendo pedidos en este momento y han transcurrido más de 3 minutos sin que pueda responderte personalmente, **tu cita de atención prioritaria ha sido agregada automáticamente**:

🔖 **Ticket Oficial:** #TKT-849201
🗓️ **Días de atención disponibles:** ${daysSummary}
⏰ **Horarios habilitados por Javier:**
${scheduleConfig.timeSlots.map((t) => `  › ${t}`).join('\n')}
👤 **Titular asignado:** ${OFFICIAL_BENEFICIARY} (${OFFICIAL_WHATSAPP_NUMBER})

¿En qué día y horario te gustaría que Javier se conecte contigo para entregarte tu cuenta? Respóndeme por aquí para confirmarte tu ticket oficial.`,
          time: '19:14',
        },
        {
          id: '3',
          sender: 'client',
          text: `Perfecto, me gustaría agendar para mañana en el horario de ${sampleTimeSlot}.`,
          time: '19:15',
        },
        {
          id: '4',
          sender: 'assistant',
          text: `✅ **¡Cita Agendada Exitosamente!**

🔖 **Ticket de Atención:** #TKT-849201
👤 **Cliente:** Agendado vía WhatsApp (${OFFICIAL_WHATSAPP_NUMBER})
⏰ **Horario reservado:** ${sampleTimeSlot}
👨‍💻 **Especialista asignado:** ${OFFICIAL_BENEFICIARY}

Tu turno ha quedado reservado de forma prioritaria en la agenda de Javier. Te enviaremos un mensaje recordatorio minutos antes. ¡Muchas gracias por tu paciencia!`,
          time: '19:15',
        },
      ],
    },
    {
      id: 'catalogo',
      title: '2. Consulta de Catálogo y Precios',
      badge: 'Comprador Nuevo',
      clientPreview: 'Hola, me gustaría saber precios y qué servicios tienen...',
      messages: [
        {
          id: '1',
          sender: 'client',
          text: '¡Hola! Buenas tardes. Me gustaría saber qué servicios digitales tienen disponibles y qué costo tienen, por favor.',
          time: '14:20',
        },
        {
          id: '2',
          sender: 'assistant',
          text: `¡Hola! 👋 Saludos cordiales. Te atiende el canal oficial de **Servicios Digitales Premium**. Estoy aquí para potenciar tu aprendizaje y creatividad al mejor precio.

⚠️ **Atención:** Antes de comprar, validamos disponibilidad y entrega por este medio.

Aquí tienes nuestro catálogo con precios exactos en MXN y USDT/USD:
📚 **Coursera Plus:** $150 MXN / 8.74 USD (Acceso ilimitado a especializaciones y certificados oficiales)
🤖 **Google AI Pro / Gemini:** $150 MXN / 8.74 USD (IA avanzada para redacción, análisis y programación)
🎬 **CapCut Teams (25 Días):** $150 MXN / 8.74 USD (Herramientas Pro para creadores de video)
💼 **Microsoft 365 Family:** $150 MXN / 8.74 USDT (Suite Office completa y almacenamiento OneDrive)
🎨 **Figma Pro (.edu):** $300 MXN / 17.00 USDT (Licencia educativa Pro por 2 años para diseño UI/UX)

¿Desde qué país nos escribes (México, Venezuela, Colombia u otro) y cuál de estas herramientas te gustaría activar hoy?`,
          time: '14:21',
        },
      ],
    },
    {
      id: 'pago-concepto',
      title: '3. Proceso de Pago y Regla de Concepto',
      badge: 'Regla Estricta',
      clientPreview: 'Quiero comprar Figma Pro y Coursera Plus en México. ¿A qué cuenta transfiero?',
      messages: [
        {
          id: '1',
          sender: 'client',
          text: 'Quiero comprar Figma Pro (.edu) y Coursera Plus. Estoy en México. ¿A qué cuentas transfiero?',
          time: '15:05',
        },
        {
          id: '2',
          sender: 'assistant',
          text: `¡Excelente elección! Con gusto te paso los datos autorizados.

📦 **Resumen de tu pedido:**
• 1x Figma Pro (.edu 2 Años): $300 MXN
• 1x Coursera Plus: $150 MXN
💰 **Total a pagar:** $450 MXN

🇲🇽 **Cuentas Oficiales para México:**
• **Banco Nu:** CLABE / Tarjeta: \`5101258665547429\`
• **Bancoppel:** Tarjeta: \`4169160624712155\`
• **Beneficiario Oficial:** ${OFFICIAL_BENEFICIARY}

⚠️ **REGLA ESTRICTA DE CONCEPTO BANCARIO:**
En el concepto o motivo de tu transferencia debes colocar el **nombre y apellido de quien te recomendó**. Si nadie te recomendó, escribe únicamente la palabra **"pago"**.

Una vez hecha la transferencia, envíame tu comprobante por aquí para validarte y entregarte tus accesos en minutos.`,
          time: '15:06',
        },
      ],
    },
    {
      id: 'afiliado-validacion',
      title: '4. Cliente Recomendado por un Vendedor',
      badge: 'Acreditación de Afiliado',
      clientPreview: 'Ya transferí $300 de Figma. En el concepto puse "Carlos Mendoza"...',
      messages: [
        {
          id: '1',
          sender: 'client',
          text: 'Listo, ya transferí los $300 MXN de Figma Pro por Nu. En el concepto puse "Carlos Mendoza" porque él me recomendó. Adjunto aquí la captura del comprobante.',
          time: '16:12',
        },
        {
          id: '2',
          sender: 'assistant',
          text: `¡Comprobante recibido y validado con éxito! 🧾✨

• **Titular verificado:** ${OFFICIAL_BENEFICIARY}
• **Monto:** $300.00 MXN
• **Concepto detectado:** "Carlos Mendoza"

✅ **Registro de Afiliado:** Se le ha sumado exitosamente 1 venta de Figma a Carlos Mendoza en nuestro sistema (recuerda que al acumular 3 ventas de Figma, Carlos recibe 1 Figma Pro gratis).

🔐 **Entrega de tu licencia:**
A continuación te comparto tu acceso oficial para Figma Pro (.edu 2 Años) junto con las instrucciones paso a paso para activarlo en tu cuenta. Cualquier duda técnica estoy aquí para ayudarte.`,
          time: '16:14',
        },
      ],
    },
    {
      id: 'afiliados-registro',
      title: '5. Persona que Desea ser Vendedor',
      badge: 'Oportunidad de Negocio',
      clientPreview: 'Hola, vi que puedo ganar Figmas gratis vendiendo. ¿Cómo funciona?',
      messages: [
        {
          id: '1',
          sender: 'client',
          text: 'Hola, vi que puedo ganar licencias gratis de Figma si vendo sus servicios. ¿Cómo me registro y cómo funciona el programa de afiliados?',
          time: '17:30',
        },
        {
          id: '2',
          sender: 'assistant',
          text: `¡Hola! Qué gusto saludarte. Bienvenido a la oportunidad de negocio de **Servicios Digitales Premium**. Nuestros servicios se adquieren para uso personal o para convertirse en vendedor independiente.

🎁 **Reglas oficiales del Programa de Afiliados:**
1️⃣ **Meta Figma:** Por cada **3 licencias de Figma Pro** ($300 MXN) que vendas, ¡obtienes **1 Figma Pro (.edu 2 Años) completamente GRATIS**!
2️⃣ **Meta Servicios Base:** Por cada **6 productos equivalentes a $150 MXN u 8.74 USDT** (Coursera, Gemini, CapCut, Microsoft) que vendas, ¡obtienes **1 Figma Pro GRATIS**!

📌 **¿Cómo se registran tus ventas?**
Es muy simple: le indicas a tus clientes que al pagar coloquen **TU NOMBRE Y APELLIDO** en el concepto bancario. Cuando ellos nos envíen la captura por este WhatsApp (+52 662 180 5354), nuestro sistema te computará la venta automáticamente.

Por favor, facilítame tu **Nombre y Apellido completo** y tu país para darte de alta en nuestro registro oficial de afiliados.`,
          time: '17:32',
        },
      ],
    },
  ];

  const [activeScenarioId, setActiveScenarioId] = useState<string>('auto-agenda-3-5min');
  const [customClientMsg, setCustomClientMsg] = useState('');
  const [dynamicMessages, setDynamicMessages] = useState<ChatBubble[] | null>(null);
  const [copiedTemplate, setCopiedTemplate] = useState(false);
  const [botContext, setBotContext] = useState<BotConversationContext>({ state: 'idle' });
  const [isBotTyping, setIsBotTyping] = useState<boolean>(false);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  const activeScenario = scenarios.find((s) => s.id === activeScenarioId) || scenarios[0];
  const displayedMessages = dynamicMessages || activeScenario.messages;

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTo({
        top: chatScrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [displayedMessages, isBotTyping]);

  const autoScheduleTemplate = `¡Hola! 👋 Te atiende el Asistente Oficial de ${OFFICIAL_BENEFICIARY} (${OFFICIAL_WHATSAPP_NUMBER}).

Veo que Javier se encuentra atendiendo entregas en este momento y han transcurrido más de 3 a 5 minutos sin que pueda responderte personalmente.

Para respetar tu tiempo y asegurar tu entrega sin demoras, tu Cita Prioritaria ha sido agregada automáticamente:
🔖 Ticket Oficial: #TKT-${Math.floor(100000 + Math.random() * 900000)}
🗓️ Días de atención: ${daysSummary}
⏰ Horario reservado: ${sampleTimeSlot}
👤 Titular: ${OFFICIAL_BENEFICIARY} (${OFFICIAL_WHATSAPP_NUMBER})

Por favor confírmanos si este horario te queda bien o indícanos cuál prefieres de la lista para atenderte de inmediato. ¡Muchas gracias!`;

  const handleCopyTemplate = () => {
    navigator.clipboard.writeText(autoScheduleTemplate);
    setCopiedTemplate(true);
    setTimeout(() => setCopiedTemplate(false), 2500);
  };

  const handleSelectScenario = (id: string) => {
    setActiveScenarioId(id);
    setDynamicMessages(null);
    setCustomClientMsg('');
    setBotContext({ state: 'idle' });
  };

  // Core function to send user message to the Intelligent Autonomous Bot Engine (Gemini Flash AI)
  const sendUserMessage = async (userText: string) => {
    const trimmed = userText.trim();
    if (!trimmed || isBotTyping) return;

    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatBubble = {
      id: `c-${Date.now()}`,
      sender: 'client',
      text: trimmed,
      time: currentTime,
    };

    const currentBase = dynamicMessages ? [...dynamicMessages] : [...activeScenario.messages];
    const updatedMessages = [...currentBase, userMsg];
    setDynamicMessages(updatedMessages);
    setCustomClientMsg('');
    setIsBotTyping(true);

    try {
      const historyForApi = updatedMessages.map((m) => ({
        sender: m.sender,
        text: m.text,
      }));

      const result = await processClientMessageWithGemini(
        trimmed,
        botContext,
        scheduleConfig,
        historyForApi
      );

      setBotContext(result.updatedContext);

      const botMsg: ChatBubble = {
        id: `a-${Date.now()}`,
        sender: 'assistant',
        text: result.replyText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        ticketData: result.confirmedTicket,
      };

      setDynamicMessages([...updatedMessages, botMsg]);
    } catch (err) {
      console.warn('Fallback in sendUserMessage:', err);
      const fallback = processClientMessageIntelligently(trimmed, botContext, scheduleConfig);
      setBotContext(fallback.updatedContext);
      const botMsg: ChatBubble = {
        id: `a-${Date.now()}`,
        sender: 'assistant',
        text: fallback.replyText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        ticketData: fallback.confirmedTicket,
      };
      setDynamicMessages([...updatedMessages, botMsg]);
    } finally {
      setIsBotTyping(false);
    }
  };

  const handleSendCustomMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customClientMsg.trim()) return;
    sendUserMessage(customClientMsg);
  };

  const handleResetChat = () => {
    setDynamicMessages([
      {
        id: `init-${Date.now()}`,
        sender: 'assistant',
        text: `¡Hola! 👋 Te atiende el **Asistente Oficial con Inteligencia Artificial Gemini Flash** de **${OFFICIAL_BENEFICIARY}** (${OFFICIAL_WHATSAPP_NUMBER}).
        
Estoy potenciado con IA en tiempo real para dialogar contigo, responder tus preguntas y **revisar la disponibilidad real** en la agenda de Javier (${daysSummary}) para agendarte tu cita de entrega prioritaria de forma 100% inteligente y automática.

¿Qué producto te interesa o qué horario de atención te gustaría consultar?`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setBotContext({ state: 'idle' });
    setCustomClientMsg('');
  };

  const handleTriggerWaitSimulation = () => {
    const ticketNum = Math.floor(100000 + Math.random() * 900000);
    const appointmentMessage = `¡Hola Javier! Te escribo al WhatsApp oficial ${OFFICIAL_WHATSAPP_NUMBER}.

⏳ *Auto-Cita por Espera de 3 a 5 min:*
🔖 *Ticket Oficial:* #TKT-${ticketNum}
🗓️ *Días de atención:* ${daysSummary}
⏰ *Turno asignado:* ${sampleTimeSlot}
👤 *Titular:* ${OFFICIAL_BENEFICIARY} (${OFFICIAL_WHATSAPP_NUMBER})

Por favor confirmen mi turno de atención preferencial. ¡Muchas gracias!`;

    const whatsAppLink = buildWhatsAppLink(appointmentMessage);

    const newMsgs: ChatBubble[] = [
      {
        id: `c1-${Date.now()}`,
        sender: 'client',
        text: `¡Hola Javier! Te escribo al WhatsApp ${OFFICIAL_WHATSAPP_NUMBER} para comprar y activar mi cuenta de Figma Pro.`,
        time: '19:10',
      },
      {
        id: `wait-${Date.now()}`,
        sender: 'client',
        text: `⏳ [Han transcurrido 4 minutos sin respuesta del titular al ${OFFICIAL_WHATSAPP_NUMBER}. Sistema de cita automática activado...]`,
        time: '19:14',
      },
      {
        id: `a1-${Date.now()}`,
        sender: 'assistant',
        text: `¡Hola! 👋 Soy el Asistente Oficial de **${OFFICIAL_BENEFICIARY}** (${OFFICIAL_WHATSAPP_NUMBER}).

Debido a que Javier se encuentra en entregas activas y han pasado 4 minutos sin poder atenderte personalmente, **tu cita ha sido agregada automáticamente con disponibilidad real**:

🔖 **Ticket Oficial:** #TKT-${ticketNum}
🗓️ **Días de atención:** ${daysSummary}
⏰ **Horario asignado:** ${sampleTimeSlot}
📲 **Canal verificado:** WhatsApp ${OFFICIAL_WHATSAPP_NUMBER}

Tu turno prioritario está reservado. En cuanto Javier concluya el pedido actual o llegue tu horario, serás atendido con máxima prioridad.`,
        time: '19:14',
        ticketData: {
          ticketId: String(ticketNum),
          clientName: 'Cliente Espera 3-5 min',
          serviceName: 'Figma Pro (.edu) - Activación 2 Años',
          dayOrDate: 'Próximo turno hábil',
          timeSlot: sampleTimeSlot,
          whatsAppLink,
        },
      },
      {
        id: `c2-${Date.now()}`,
        sender: 'client',
        text: '¡Excelente, muchas gracias! Esperaré mi turno para realizar la transferencia.',
        time: '19:15',
      },
      {
        id: `a2-${Date.now()}`,
        sender: 'assistant',
        text: `¡Con gusto! Puedes ir preparando tu comprobante con el concepto correcto ("tu nombre y apellido"). ¡Quedas agendado! 👍`,
        time: '19:15',
      },
    ];
    setDynamicMessages(newMsgs);
  };

  const firstClientMsg = displayedMessages.find((m) => m.sender === 'client')?.text || '¡Hola! Deseo información de Servicios Digitales Premium.';
  const realWhatsAppUrl = buildWhatsAppLink(firstClientMsg);

  return (
    <section id="simulador-whatsapp" className="bg-slate-950 relative border-t border-slate-800">
      <ProtectedSectionLock
        badge="Guías Previas & Simulador Oficial"
        title="Simulador en Vivo y Guía de Auto-Respuesta WhatsApp"
        subtitle="Ingresa **** para desbloquear simultáneamente esta guía previa, el simulador interactivo de WhatsApp, la plantilla de ausencia (3 a 5 min) y el panel de horarios."
      >
      <div className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wider bg-emerald-500/10 px-3 py-1 rounded-md border border-emerald-500/20 mb-3">
            <MessageCircle className="w-3.5 h-3.5" /> Demostración en Vivo
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            ¿Cómo Funciona Cuando Alguien Envía Mensaje?
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-300">
            Mira la simulación exacta de cómo el asistente comercial recibe, responde, canaliza y gestiona las conversaciones reales en el WhatsApp oficial <strong className="text-emerald-400">{OFFICIAL_WHATSAPP_NUMBER}</strong>.
          </p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              onClick={() => setIsManagerOpen(true)}
              className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border border-amber-500/50 text-amber-300 font-bold px-4 py-2 rounded-xl text-xs shadow-lg transition-all cursor-pointer"
              title="Configurar días de la semana y turnos de atención (****)"
            >
              <Lock className="w-4 h-4 text-amber-400" />
              <span>Configurar Días y Horas (****)</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Scenario Selectors & Intelligence Info */}
          <div className="lg:col-span-5 space-y-3">
            {/* Autonomous Engine Badge */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-teal-500/15 to-cyan-500/15 border border-emerald-500/40 flex items-start gap-3 shadow-md">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 text-slate-950 font-black flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                <Sparkles className="w-4 h-4 text-slate-950" />
              </div>
              <div className="text-xs">
                <div className="flex items-center gap-1.5 font-bold text-white mb-0.5">
                  <span>Asistente Oficial con Gemini Flash AI</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Gemini Flash Activo
                  </span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Integrado con <strong>Gemini Flash AI</strong> y el WhatsApp oficial <strong>+52 662 180 5354</strong>. Dialoga en lenguaje natural, consulta en tiempo real tu disponibilidad configurada (<strong className="text-emerald-300">{daysSummary}</strong>) y concreta citas de forma 100% automática y sin errores.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Casos rápidos o chatea libremente:
              </span>
              <button
                onClick={handleResetChat}
                className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold cursor-pointer"
                title="Reiniciar la conversación para chatear libremente"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reiniciar Chat</span>
              </button>
            </div>

            {scenarios.map((sc) => {
              const isSelected = activeScenarioId === sc.id && !dynamicMessages;
              return (
                <button
                  key={sc.id}
                  onClick={() => handleSelectScenario(sc.id)}
                  className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 border-emerald-500/80 shadow-lg shadow-emerald-500/10'
                      : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-bold text-white tracking-tight">
                      {sc.title}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        isSelected
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {sc.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 italic line-clamp-1">
                    "{sc.clientPreview}"
                  </p>
                </button>
              );
            })}

            {/* Custom message form */}
            <div className="mt-4 p-4 rounded-2xl bg-slate-900/70 border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-200">
                  Escribe cualquier mensaje para dialogar con el bot:
                </span>
                <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  En línea
                </span>
              </div>
              <form onSubmit={handleSendCustomMessage} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ej. Hola, quiero agendar cita para mañana..."
                  value={customClientMsg}
                  onChange={(e) => setCustomClientMsg(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700 focus:border-emerald-500 text-xs text-white px-3 py-2 rounded-xl outline-none"
                />
                <button
                  type="submit"
                  disabled={!customClientMsg.trim() || isBotTyping}
                  className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-bold px-3.5 py-2 rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span>Enviar</span>
                  <Send className="w-3 h-3" />
                </button>
              </form>

              {/* Botón interactivo para simular inactividad de 3-5 min */}
              <button
                type="button"
                onClick={handleTriggerWaitSimulation}
                className="w-full mt-3 bg-gradient-to-r from-amber-500/15 via-emerald-500/15 to-teal-500/15 hover:from-amber-500/25 hover:to-emerald-500/25 border border-amber-500/40 hover:border-amber-400 text-amber-300 font-bold px-3 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md active:scale-98"
                title="Simula en vivo qué sucede cuando pasan 3 a 5 minutos sin contestar en WhatsApp"
              >
                <Clock className="w-4 h-4 text-amber-400" />
                <span>⏳ Simular: Pasan 3 a 5 min sin contestar ({OFFICIAL_WHATSAPP_NUMBER})</span>
              </button>
            </div>

            {/* Plantilla oficial de auto-respuesta para el WhatsApp de Javier */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-emerald-500/30 shadow-lg">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="text-xs font-bold text-white">
                    Auto-Respuesta para tu WhatsApp ({OFFICIAL_WHATSAPP_NUMBER})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyTemplate}
                  className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                  title="Copiar texto para usarlo como Mensaje de Ausencia o Respuesta Rápida en WhatsApp Business"
                >
                  {copiedTemplate ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>¡Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copiar Plantilla</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Copia esta plantilla oficial y pégala en tu <strong>WhatsApp Business</strong> (en <em>Mensaje de Ausencia</em> o <em>Respuesta Rápida</em>). Si estás ocupado y transcurren de 3 a 5 minutos, tu WhatsApp responderá automáticamente asignando el turno prioritario.
              </p>
            </div>
          </div>

          {/* Right Column: Realistic WhatsApp Phone Mockup */}
          <div className="lg:col-span-7">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl max-w-lg mx-auto">
              {/* WhatsApp App Top Bar */}
              <div className="bg-[#128C7E] px-4 py-3 flex items-center justify-between text-white">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-slate-950 border-2 border-emerald-300 flex items-center justify-center font-black text-xs text-emerald-400">
                      SDP
                    </div>
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#128C7E]"></span>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-sm text-white leading-none">
                        Servicios Digitales Premium
                      </h4>
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-200 fill-emerald-200/20" />
                    </div>
                    <span className="text-[11px] text-emerald-100/90 leading-tight block mt-0.5">
                      {OFFICIAL_WHATSAPP_NUMBER} • {isBotTyping ? 'escribiendo...' : 'en línea'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-emerald-100">
                  <Video className="w-4 h-4 cursor-pointer opacity-80 hover:opacity-100" />
                  <Phone className="w-4 h-4 cursor-pointer opacity-80 hover:opacity-100" />
                  <MoreVertical className="w-4 h-4 cursor-pointer opacity-80 hover:opacity-100" />
                </div>
              </div>

              {/* Chat Sub-banner with Demand status */}
              <div className="bg-[#075E54] px-4 py-1.5 text-[11px] text-emerald-100 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-emerald-300 animate-spin" style={{ animationDuration: '6s' }} />
                  <span>Días reales: <strong className="text-white">{daysSummary}</strong></span>
                </span>
                <span className="font-semibold text-emerald-200 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  <span>Gemini Flash AI Oficial</span>
                </span>
              </div>

              {/* Chat Body Wallpaper & Bubbles */}
              <div
                ref={chatScrollRef}
                className="bg-[#0b141a] p-4 min-h-[380px] max-h-[460px] overflow-y-auto space-y-3.5 scroll-smooth"
              >
                {/* Security encryption pill */}
                <div className="text-center">
                  <span className="inline-block bg-[#182229] text-amber-200/90 text-[10px] px-3 py-1 rounded-lg border border-amber-500/20 max-w-xs leading-tight">
                    🔒 Mensajes y citas automáticas sincronizados con {OFFICIAL_BENEFICIARY} (+52 662 180 5354).
                  </span>
                </div>

                {displayedMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.sender === 'client' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[88%] p-3 rounded-2xl text-xs sm:text-[13px] leading-relaxed relative shadow-md ${
                        msg.sender === 'client'
                          ? 'bg-[#005c4b] text-emerald-50 rounded-tr-none'
                          : 'bg-[#202c33] text-slate-100 rounded-tl-none border border-slate-700/50'
                      }`}
                    >
                      {/* Sender label */}
                      <span className="text-[10px] font-bold block mb-1 opacity-70">
                        {msg.sender === 'client' ? 'Cliente' : 'Asistente Gemini Flash AI'}
                      </span>

                      <div className="whitespace-pre-line">{msg.text}</div>

                      {/* Interactive Ticket Card if an appointment was confirmed */}
                      {msg.ticketData && (
                        <div className="mt-3 p-3 bg-emerald-950/90 border border-emerald-500/50 rounded-xl space-y-2">
                          <div className="flex items-center justify-between border-b border-emerald-500/30 pb-1.5">
                            <span className="text-[11px] font-extrabold text-emerald-300 flex items-center gap-1">
                              <Sparkles className="w-3.5 h-3.5 text-amber-300" /> CITA AGENDADA CON ÉXITO
                            </span>
                            <span className="text-[10px] font-mono bg-emerald-900 text-emerald-200 px-1.5 py-0.5 rounded font-bold">
                              #{msg.ticketData.ticketId}
                            </span>
                          </div>
                          <div className="space-y-1 text-[11px] text-slate-200 font-mono">
                            <div>👤 <strong>Cliente:</strong> {msg.ticketData.clientName}</div>
                            <div>🛎️ <strong>Servicio:</strong> {msg.ticketData.serviceName}</div>
                            <div>📅 <strong>Día:</strong> {msg.ticketData.dayOrDate}</div>
                            <div>⏰ <strong>Horario:</strong> {msg.ticketData.timeSlot}</div>
                            <div>👨‍💻 <strong>Especialista:</strong> {OFFICIAL_BENEFICIARY}</div>
                          </div>
                          <a
                            href={msg.ticketData.whatsAppLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 w-full inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba5a] text-slate-950 font-bold px-3 py-2 rounded-lg text-xs shadow-md transition-all cursor-pointer"
                          >
                            <MessageCircle className="w-4 h-4 fill-slate-950" />
                            <span>Enviar Ticket a WhatsApp Oficial ({OFFICIAL_WHATSAPP_NUMBER})</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}

                      <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-slate-400">
                        <span>{msg.time}</span>
                        {msg.sender === 'client' && (
                          <CheckCheck className="w-3.5 h-3.5 text-cyan-400" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Animated Typing Indicator */}
                {isBotTyping && (
                  <div className="flex flex-col items-start">
                    <div className="bg-[#202c33] text-slate-300 rounded-2xl rounded-tl-none p-2.5 px-3.5 text-xs border border-slate-700/50 flex items-center gap-2 shadow-md">
                      <span className="text-[11px] text-emerald-400 font-medium">Asistente Gemini Flash respondiendo...</span>
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Testing Chips */}
              <div className="bg-[#182229] px-3 py-2 border-t border-slate-800 flex items-center gap-1.5 overflow-x-auto text-[11px]">
                <button
                  type="button"
                  onClick={() => sendUserMessage('¿Cuáles son los horarios y días de atención de Javier (+52 662 180 5354)?')}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1 rounded-full whitespace-nowrap transition-colors border border-slate-700 shrink-0 cursor-pointer"
                >
                  📅 Disponibilidad Real
                </button>
                <button
                  type="button"
                  onClick={() => sendUserMessage('Quiero agendar una cita de atención con Gemini Flash')}
                  className="bg-emerald-950 hover:bg-emerald-900 text-emerald-300 px-2.5 py-1 rounded-full whitespace-nowrap transition-colors border border-emerald-500/30 shrink-0 cursor-pointer"
                >
                  ⚡ Agendar Cita
                </button>
                <button
                  type="button"
                  onClick={() => sendUserMessage('¿Qué precio y garantía tiene Figma Pro 2 años?')}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1 rounded-full whitespace-nowrap transition-colors border border-slate-700 shrink-0 cursor-pointer"
                >
                  🎨 Figma Pro $300
                </button>
                <button
                  type="button"
                  onClick={() => sendUserMessage('¿Cuáles son las cuentas oficiales Nu, Bancoppel y Binance?')}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1 rounded-full whitespace-nowrap transition-colors border border-slate-700 shrink-0 cursor-pointer"
                >
                  💳 Cuentas de Pago
                </button>
                <button
                  type="button"
                  onClick={() => sendUserMessage('¿Cómo funciona la regla obligatoria del concepto de pago?')}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1 rounded-full whitespace-nowrap transition-colors border border-slate-700 shrink-0 cursor-pointer"
                >
                  📌 Regla Concepto
                </button>
                <button
                  type="button"
                  onClick={() => sendUserMessage('¿Cómo gano cuentas gratis con el programa de afiliados?')}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1 rounded-full whitespace-nowrap transition-colors border border-slate-700 shrink-0 cursor-pointer"
                >
                  🤝 Afiliados
                </button>
              </div>

              {/* WhatsApp bottom input mockup with direct typing */}
              <div className="bg-[#202c33] p-3 flex items-center justify-between gap-2 border-t border-slate-800">
                <form
                  onSubmit={handleSendCustomMessage}
                  className="flex-1 flex items-center gap-2 bg-[#2a3942] rounded-full px-3 py-1.5"
                >
                  <input
                    type="text"
                    placeholder="Escribe un mensaje aquí..."
                    value={customClientMsg}
                    onChange={(e) => setCustomClientMsg(e.target.value)}
                    className="flex-1 bg-transparent text-xs text-white placeholder-slate-400 outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!customClientMsg.trim() || isBotTyping}
                    className="text-emerald-400 hover:text-emerald-300 disabled:opacity-30 cursor-pointer p-1"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>

                {/* Real WhatsApp anchor link */}
                <a
                  href={realWhatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#25D366] hover:bg-[#20ba5a] text-slate-950 font-bold px-3 py-2 rounded-full text-xs flex items-center gap-1.5 shadow-md transition-all shrink-0 cursor-pointer"
                  title="Abrir este chat directamente en WhatsApp oficial"
                >
                  <MessageCircle className="w-3.5 h-3.5 fill-slate-950" />
                  <span className="hidden sm:inline">WhatsApp Real</span>
                  <ExternalLink className="w-3 h-3 opacity-70" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      </ProtectedSectionLock>

      <ScheduleManagerModal
        isOpen={isManagerOpen}
        onClose={() => setIsManagerOpen(false)}
        onSaved={(newCfg) => setScheduleConfig(newCfg)}
      />
    </section>
  );
};
