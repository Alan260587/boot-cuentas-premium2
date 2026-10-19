import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  ShieldCheck,
  Bot,
  User,
  ExternalLink,
  MessageCircle,
  HelpCircle,
  Zap,
  Clock,
  Calendar,
} from 'lucide-react';
import { CountryCode, UserProfile, ChatMessage } from '../types';
import { OFFICIAL_WHATSAPP_NUMBER, buildWhatsAppLink, COUNTRIES, OFFICIAL_BENEFICIARY } from '../data/catalog';
import { getSavedScheduleConfig, formatEnabledDaysSummary } from '../data/scheduleConfig';
import { processClientMessageIntelligently, BotConversationContext } from '../utils/intelligentBotEngine';

interface ChatbotWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  country: CountryCode;
  profile: UserProfile;
}

export const ChatbotWidget: React.FC<ChatbotWidgetProps> = ({
  isOpen,
  onClose,
  country,
  profile,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'assistant',
      text: `¡Hola! Saludos cordiales. Soy el Asistente Virtual Comercial Oficial de **Servicios Digitales Premium**. 

Estoy aquí para **potenciar tu aprendizaje y creatividad al mejor precio**.

⚠️ **Atención:** Antes de comprar, favor de comunicarse por nuestro WhatsApp oficial: **${OFFICIAL_WHATSAPP_NUMBER}** para verificar stock y validar tu activación.

¿En qué puedo orientarte hoy? Puedes elegir una de las opciones rápidas abajo o escribirme tu consulta.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actionUrl: buildWhatsAppLink('¡Hola! Me comunico desde el Asistente Comercial Oficial para consultar sobre sus servicios.'),
      actionLabel: 'Chatear en WhatsApp Oficial',
    },
  ]);

  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [botContext, setBotContext] = useState<BotConversationContext>({ state: 'idle' });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputValue.trim();
    if (!textToSend || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInputValue('');
    setIsLoading(true);

    try {
      const schedule = getSavedScheduleConfig();
      const historyPayload = messages.slice(-5).map((m) => ({
        sender: m.sender === 'user' ? 'client' : 'assistant',
        text: m.text,
      }));

      const response = await fetch('/api/bot-dialogue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history: historyPayload,
          scheduleConfig: schedule,
          context: botContext,
        }),
      });

      if (!response.ok) {
        throw new Error('Error en conexión con el bot');
      }

      const data = await response.json();
      const botReply = data.reply || '¡Hola! Te atendemos directamente en nuestro WhatsApp oficial: +52 662 180 5354.';

      if (data.updatedContext) {
        setBotContext(data.updatedContext);
      }

      let actionUrl = buildWhatsAppLink(
        `¡Hola Javier! Estaba consultando con el Asistente Gemini sobre: "${textToSend.slice(0, 70)}". Deseo atención directa.`
      );
      let actionLabel = 'Continuar en WhatsApp (+52 662 180 5354)';

      if (data.isAppointmentConfirmed && data.confirmedTicket?.whatsAppLink) {
        actionUrl = data.confirmedTicket.whatsAppLink;
        actionLabel = `Enviar Ticket #${data.confirmedTicket.ticketId} a WhatsApp (+52 662 180 5354)`;
      }

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: botReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionUrl,
        actionLabel,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.warn('Chat API error, utilizing intelligent local engine:', err);
      const schedule = getSavedScheduleConfig();
      const fallback = processClientMessageIntelligently(textToSend, botContext, schedule);
      setBotContext(fallback.updatedContext);

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: fallback.replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionUrl: fallback.confirmedTicket?.whatsAppLink || buildWhatsAppLink(`¡Hola! Deseo atención sobre: ${textToSend}`),
        actionLabel: fallback.confirmedTicket ? `Enviar Ticket #${fallback.confirmedTicket.ticketId} a WhatsApp` : 'Abrir WhatsApp (+52 662 180 5354)',
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 sm:inset-auto sm:bottom-4 sm:right-4 z-50 w-full sm:w-[420px] sm:max-h-[640px] h-full sm:h-[620px] bg-slate-950 sm:rounded-3xl border border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
      {/* Top Header */}
      <div className="bg-slate-900/95 border-b border-slate-800 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 p-0.5 shadow-md">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-emerald-400">
                <Bot className="w-5 h-5" />
              </div>
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-950"></span>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-extrabold text-white text-sm">Asistente Comercial</h3>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-1.5 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-300" />
                Gemini Flash AI
              </span>
            </div>
            <p className="text-[11px] text-slate-400 flex items-center gap-1">
              <span>WhatsApp:</span>
              <strong className="text-emerald-400">{OFFICIAL_WHATSAPP_NUMBER}</strong>
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-8 h-8 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* WhatsApp Status Subheader */}
      <div className="bg-emerald-950/40 border-b border-emerald-500/20 px-4 py-2 flex items-center justify-between text-[11px] text-emerald-300">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Canalizado al WhatsApp Oficial</span>
        </span>
        <span className="text-slate-400">Demanda: 3-5 min</span>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[88%] p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-emerald-600 text-white rounded-br-none'
                  : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none shadow-sm'
              }`}
            >
              <div className="whitespace-pre-line">{msg.text}</div>

              {/* Action Button to WhatsApp */}
              {msg.actionUrl && (
                <div className="mt-3 pt-2.5 border-t border-slate-800">
                  <a
                    href={msg.actionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs transition-transform active:scale-95 shadow-md shadow-emerald-500/10"
                  >
                    <MessageCircle className="w-3.5 h-3.5 fill-slate-950" />
                    <span>{msg.actionLabel || 'Contactar en WhatsApp'}</span>
                    <ExternalLink className="w-3 h-3 opacity-70" />
                  </a>
                </div>
              )}
            </div>
            <span className="text-[10px] text-slate-500 mt-1 px-1">{msg.timestamp}</span>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900 border border-slate-800 px-3.5 py-2.5 rounded-2xl w-fit">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
            <span>Consultando catálogo oficial y generando respuesta...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggestions Chips */}
      <div className="p-2 border-t border-slate-800 bg-slate-900/60 overflow-x-auto flex gap-1.5 no-scrollbar">
        <button
          onClick={() => handleSendMessage('No me han respondido en WhatsApp en los últimos 3-5 minutos, ¿puedo agendar cita con los horarios disponibles de Javier?')}
          className="shrink-0 text-[11px] bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold px-2.5 py-1 rounded-lg border border-amber-500/40 transition-colors flex items-center gap-1 cursor-pointer"
        >
          <Clock className="w-3 h-3 text-amber-400" />
          <span>⏳ Sin respuesta 3-5 min: Agendar Cita</span>
        </button>
        <button
          onClick={() => handleSendMessage('¿Cuáles son los precios del catálogo completo?')}
          className="shrink-0 text-[11px] bg-slate-800/90 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700/60 transition-colors"
        >
          📦 Ver Catálogo & Precios
        </button>
        <button
          onClick={() => handleSendMessage('¿Cuáles son las cuentas para pagar por Nu, Coppel o Binance?')}
          className="shrink-0 text-[11px] bg-slate-800/90 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700/60 transition-colors"
        >
          💳 Métodos de Pago
        </button>
        <button
          onClick={() => handleSendMessage('¿Cuál es la regla estricta del concepto de pago?')}
          className="shrink-0 text-[11px] bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 px-2.5 py-1 rounded-lg border border-amber-500/30 transition-colors"
        >
          ⚠️ Regla de Concepto
        </button>
        <button
          onClick={() => handleSendMessage('¿Cómo funciona el programa de afiliados para ganar Figmas gratis?')}
          className="shrink-0 text-[11px] bg-slate-800/90 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700/60 transition-colors"
        >
          🎁 Afiliados (Figmas Gratis)
        </button>
        <button
          onClick={() => handleSendMessage('¿Cómo agendo una cita de atención prioritaria?')}
          className="shrink-0 text-[11px] bg-slate-800/90 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700/60 transition-colors"
        >
          📅 Citas & Horarios
        </button>
      </div>

      {/* Input area */}
      <div className="p-3 bg-slate-900 border-t border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Escribe tu consulta comercial..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isLoading}
            className="flex-1 bg-slate-950 border border-slate-700 focus:border-emerald-500 text-xs sm:text-sm text-white px-3.5 py-2.5 rounded-xl outline-none transition-colors"
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="w-10 h-10 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 flex items-center justify-center transition-all cursor-pointer shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
