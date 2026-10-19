import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  AlertTriangle,
  MessageCircle,
  CheckCircle2,
  Send,
  User,
  ShieldCheck,
  Headphones,
  Zap,
  Settings,
  Bot,
  Lock,
  Copy,
  ExternalLink,
  Sparkles,
  Check,
} from 'lucide-react';
import { CountryCode, AppointmentData } from '../types';
import { COUNTRIES, OFFICIAL_WHATSAPP_NUMBER, buildWhatsAppLink, OFFICIAL_BENEFICIARY } from '../data/catalog';
import {
  getSavedScheduleConfig,
  formatEnabledDaysSummary,
} from '../data/scheduleConfig';
import { ScheduleManagerModal } from './ScheduleManagerModal';
import { ProtectedSectionLock } from './ProtectedSectionLock';

interface AppointmentSectionProps {
  country: CountryCode;
}

export const AppointmentSection: React.FC<AppointmentSectionProps> = ({ country }) => {
  const [scheduleConfig, setScheduleConfig] = useState(getSavedScheduleConfig());
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  const [name, setName] = useState('');
  const [selectedService, setSelectedService] = useState('Activación de Cuenta Digital');
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    today.setDate(today.getDate() + 1);
    return today.toISOString().split('T')[0];
  });
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(
    scheduleConfig.timeSlots[0] || '11:00 AM - 12:00 PM'
  );
  const [notes, setNotes] = useState('');
  const [generatedTicket, setGeneratedTicket] = useState<{
    ticketId: string;
    name: string;
    service: string;
    date: string;
    slot: string;
    whatsAppUrl: string;
  } | null>(null);
  const [copiedExample, setCopiedExample] = useState(false);

  const sampleTicketId = 'TKT-849201';
  const sampleMessage = `¡Hola! Acabo de agendar una Cita de Atención Prioritaria en Servicios Digitales Premium:

🔖 *Ticket de Cita:* #${sampleTicketId}
👤 *Nombre:* Cliente Express (Atención Rápida)
📍 *País:* México
🛎️ *Motivo / Servicio:* Activación de Cuenta Digital
📅 *Fecha Solicitada:* ${selectedDate}
⏰ *Horario:* ${selectedTimeSlot}
⚡ *Modo:* Generación Automática Instantánea (Sin escribir)

Por favor, confirmen mi turno de atención. ¡Gracias!`;

  const sampleWhatsAppUrl = buildWhatsAppLink(sampleMessage);

  const handleCopyExample = () => {
    navigator.clipboard.writeText(sampleMessage);
    setCopiedExample(true);
    setTimeout(() => setCopiedExample(false), 2500);
  };

  useEffect(() => {
    const updateHandler = () => {
      const updated = getSavedScheduleConfig();
      setScheduleConfig(updated);
      if (!updated.timeSlots.includes(selectedTimeSlot) && updated.timeSlots.length > 0) {
        setSelectedTimeSlot(updated.timeSlots[0]);
      }
    };

    window.addEventListener('schedule_config_updated', updateHandler);
    return () => window.removeEventListener('schedule_config_updated', updateHandler);
  }, [selectedTimeSlot]);

  const timeSlots = scheduleConfig.timeSlots;
  const daysSummary = formatEnabledDaysSummary(scheduleConfig.availableDays);

  const servicesList = [
    'Activación de Cuenta Digital',
    'Coursera Plus - Soporte & Entrega',
    'Google AI Pro / Gemini - Activación',
    'Figma Pro (.edu) - Activación 2 Años',
    'CapCut Teams - Entrega de Equipo',
    'Microsoft 365 Family - Invitación',
    'Registro en Programa de Afiliados',
    'Atención Comercial & Mayorista',
  ];

  const triggerExternalLink = (url: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleScheduleAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const currentCountryObj = COUNTRIES.find((c) => c.code === country);
    const appointmentId = `TKT-${Math.floor(100000 + Math.random() * 900000)}`;

    const message = `¡Hola! Acabo de agendar una Cita de Atención Prioritaria en Servicios Digitales Premium:

🔖 *Ticket de Cita:* #${appointmentId}
👤 *Nombre:* ${name}
📍 *País:* ${currentCountryObj?.name}
🛎️ *Motivo / Servicio:* ${selectedService}
📅 *Fecha Solicitada:* ${selectedDate}
⏰ *Horario:* ${selectedTimeSlot}
${notes.trim() ? `💬 *Nota adicional:* ${notes}` : ''}

Por favor, confirmen mi turno de atención. ¡Gracias!`;

    const waUrl = buildWhatsAppLink(message);
    setGeneratedTicket({
      ticketId: appointmentId,
      name: name.trim(),
      service: selectedService,
      date: selectedDate,
      slot: selectedTimeSlot,
      whatsAppUrl: waUrl,
    });
    triggerExternalLink(waUrl);
  };

  const handleAutoGenerateAppointment = (serviceName?: string, presetLabel?: string, isWaitTimeoutRule = false) => {
    const chosenService = serviceName || selectedService || 'Activación de Cuenta Digital';
    const autoName = name.trim() || `Cliente Express (${presetLabel || 'Atención Rápida'})`;
    const currentCountryObj = COUNTRIES.find((c) => c.code === country);
    const appointmentId = `TKT-${Math.floor(100000 + Math.random() * 900000)}`;
    const slot = selectedTimeSlot || timeSlots[0] || '11:00 AM - 12:00 PM';

    setName(autoName);
    setSelectedService(chosenService);

    const message = isWaitTimeoutRule
      ? `¡Hola Javier! Te escribo al WhatsApp oficial ${OFFICIAL_WHATSAPP_NUMBER}.

⏳ *Activación Automática:* Al no recibir respuesta de 3 a 5 minutos, el sistema me generó esta Cita de Atención Prioritaria automáticamente:

🔖 *Ticket de Cita:* #${appointmentId}
👤 *Nombre:* ${autoName}
📍 *País:* ${currentCountryObj?.name || 'Internacional'}
🛎️ *Servicio Solicitado:* ${chosenService}
📅 *Fecha Solicitada:* ${selectedDate}
⏰ *Horario Reservado:* ${slot}
⏱️ *Protocolo:* Auto-agendado por espera de 3 a 5 min sin contestar (${OFFICIAL_WHATSAPP_NUMBER})

Por favor, confirmen mi turno de atención preferencial. ¡Muchas gracias!`
      : `¡Hola! Acabo de agendar una Cita de Atención Prioritaria en Servicios Digitales Premium:

🔖 *Ticket de Cita:* #${appointmentId}
👤 *Nombre:* ${autoName}
📍 *País:* ${currentCountryObj?.name || 'Internacional'}
🛎️ *Motivo / Servicio:* ${chosenService}
📅 *Fecha Solicitada:* ${selectedDate}
⏰ *Horario:* ${slot}
⚡ *Modo:* Generación Automática Instantánea (Sin escribir)

Por favor, confirmen mi turno de atención. ¡Gracias!`;

    const waUrl = buildWhatsAppLink(message);
    setGeneratedTicket({
      ticketId: appointmentId,
      name: autoName,
      service: chosenService,
      date: selectedDate,
      slot,
      whatsAppUrl: waUrl,
    });
    triggerExternalLink(waUrl);
  };

  return (
    <section id="citas" className="py-16 sm:py-20 bg-slate-900/50 border-t border-slate-800 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-400 uppercase tracking-wider bg-purple-500/10 px-3 py-1 rounded-md border border-purple-500/20 mb-3">
            <Headphones className="w-3.5 h-3.5" /> Canalización Oficial & Citas
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Atención Prioritaria y Agendamiento
          </h2>
          <p className="mt-2 text-sm sm:text-base text-slate-300">
            Todas las transacciones y entregas se canalizan y concretan formalmente por nuestro WhatsApp oficial: <strong className="text-emerald-400">{OFFICIAL_WHATSAPP_NUMBER}</strong>.
          </p>
        </div>

        {/* HIGH DEMAND ALERT BANNER */}
        <div className="max-w-4xl mx-auto mb-10 p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Clock className="w-5 h-5 animate-spin" style={{ animationDuration: '6s' }} />
            </div>
            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                  Protocolo Oficial WhatsApp ({OFFICIAL_WHATSAPP_NUMBER})
                </span>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
              </div>
              <p className="text-xs sm:text-sm text-slate-200 mt-0.5">
                Si no contesto de <strong className="text-amber-300 font-bold">3 a 5 minutos</strong> al WhatsApp <strong className="text-emerald-400">{OFFICIAL_WHATSAPP_NUMBER}</strong>, el sistema te agrega una cita automáticamente para garantizar tu turno de entrega sin demoras.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
            <button
              onClick={() => setIsManagerOpen(true)}
              className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-amber-500/40 text-amber-300 font-semibold px-3.5 py-2.5 rounded-xl text-xs transition-all shadow-md cursor-pointer"
              title="Personalizar días de la semana y horas en que puedes atender (Clave única 1987)"
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Configurar Días y Horas (Clave 1987)</span>
            </button>

            <a
              href={buildWhatsAppLink('¡Hola! Requiero atención rápida inmediata en WhatsApp oficial por favor.')}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm shadow-md transition-all shrink-0"
            >
              <MessageCircle className="w-4 h-4 fill-slate-950" />
              <span>WhatsApp Directo</span>
            </a>
          </div>
        </div>

        {/* Schedule availability banner */}
        <div className="max-w-4xl mx-auto mb-6 p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span>
              Días de atención configurados:{' '}
              <strong className="text-white">{daysSummary}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              <strong className="text-white">{timeSlots.length}</strong> horarios disponibles configurados
            </span>
          </div>
        </div>

        {/* Appointment Form & Info Grid */}
        <div className="max-w-4xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Left form */}
            <form onSubmit={handleScheduleAppointment} className="flex-1 space-y-4">
              <div className="pb-3 border-b border-slate-800">
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  <span>Reserva tu Turno de Atención</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Elige el horario en el que deseas ser atendido de forma personalizada y sin esperas.
                </p>
              </div>

              {/* ⚡ Acceso Rápido: Generar Cita Automática en 1 Clic (Sin Escribir) */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-teal-500/10 border border-emerald-500/30">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                  <span className="text-xs font-extrabold text-emerald-400 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> Generar Cita en 1 Clic (Sin Escribir)
                  </span>
                  <span className="text-[10px] text-slate-400">Rellena el ticket y abre WhatsApp listo</span>
                </div>

                {/* Botón destacado: Regla de 3 a 5 min sin contestar */}
                <button
                  type="button"
                  onClick={() =>
                    handleAutoGenerateAppointment(
                      'Activación de Cuenta Digital',
                      'Espera 3-5 min WhatsApp',
                      true
                    )
                  }
                  className="w-full mb-2.5 text-xs font-bold bg-gradient-to-r from-amber-500/20 via-emerald-500/20 to-teal-500/20 hover:from-amber-500/30 hover:to-emerald-500/30 text-amber-300 border border-amber-500/50 hover:border-amber-400 py-2.5 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm active:scale-95"
                  title={`Generar Cita Automática si no contesto de 3 a 5 minutos al WhatsApp ${OFFICIAL_WHATSAPP_NUMBER}`}
                >
                  <Clock className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
                  <span>⏳ Auto-Cita si no contesto en 3-5 min ({OFFICIAL_WHATSAPP_NUMBER})</span>
                </button>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => handleAutoGenerateAppointment('Activación de Cuenta Digital', 'Atención Express')}
                    className="text-[11px] font-bold bg-slate-950 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 hover:border-emerald-500/60 py-2 px-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                    title="Genera un ticket automático para activación rápida y abre WhatsApp con el texto ya escrito"
                  >
                    <Zap className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>⚡ Cita Express</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAutoGenerateAppointment('Figma Pro (.edu) - Activación 2 Años', 'Figma Pro')}
                    className="text-[11px] font-bold bg-slate-950 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 hover:border-purple-500/60 py-2 px-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                    title="Genera un ticket automático para Figma Pro"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>🎨 Figma Pro</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAutoGenerateAppointment('Google AI Pro / Gemini - Activación', 'Gemini Flash AI')}
                    className="text-[11px] font-bold bg-slate-950 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 hover:border-emerald-500/60 py-2 px-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                    title="Genera un ticket automático con Gemini Flash AI"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                    <span>🤖 Gemini AI</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAutoGenerateAppointment('Coursera Plus - Soporte & Entrega', 'Coursera Plus')}
                    className="text-[11px] font-bold bg-slate-950 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 hover:border-cyan-500/60 py-2 px-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                    title="Genera un ticket automático para Coursera Plus"
                  >
                    <Bot className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>📚 Coursera</span>
                  </button>
                </div>
              </div>

              {generatedTicket && (
                <div className="p-4 rounded-2xl bg-emerald-950/70 border border-emerald-500/50 space-y-2.5 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-emerald-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ¡Ticket Oficial Generado!
                    </span>
                    <span className="text-[11px] font-mono font-bold bg-emerald-900/80 text-emerald-200 px-2 py-0.5 rounded">
                      #{generatedTicket.ticketId}
                    </span>
                  </div>
                  <div className="text-xs text-slate-200 space-y-0.5 font-mono">
                    <div>👤 <strong>Cliente:</strong> {generatedTicket.name}</div>
                    <div>🛎️ <strong>Servicio:</strong> {generatedTicket.service}</div>
                    <div>📅 <strong>Fecha:</strong> {generatedTicket.date} • ⏰ {generatedTicket.slot}</div>
                  </div>
                  <a
                    href={generatedTicket.whatsAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-2.5 px-4 rounded-xl text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4 fill-slate-950" />
                    <span>Abrir Ticket #{generatedTicket.ticketId} en WhatsApp ({OFFICIAL_WHATSAPP_NUMBER})</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tu Nombre Completo:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Ej. María González"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 text-sm text-white px-3.5 py-2.5 rounded-xl outline-none transition-colors"
                  />
                  <User className="w-4 h-4 text-slate-500 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Motivo de Atención / Servicio:
                </label>
                <select
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 text-xs sm:text-sm text-white px-3.5 py-2.5 rounded-xl outline-none transition-colors"
                >
                  {servicesList.map((srv, idx) => (
                    <option key={idx} value={srv}>
                      {srv}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Fecha de Atención:
                  </label>
                  <input
                    type="date"
                    required
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 text-xs sm:text-sm text-white px-3.5 py-2.5 rounded-xl outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Horario Disponible:
                  </label>
                  <select
                    value={selectedTimeSlot}
                    onChange={(e) => setSelectedTimeSlot(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 text-xs sm:text-sm text-white px-3.5 py-2.5 rounded-xl outline-none transition-colors"
                  >
                    {timeSlots.map((ts, idx) => (
                      <option key={idx} value={ts}>
                        {ts}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Notas o Preguntas Adicionales (Opcional):
                </label>
                <textarea
                  rows={2}
                  placeholder="Detalles sobre tu equipo, sistema operativo o cuentas..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 text-xs sm:text-sm text-white px-3.5 py-2 rounded-xl outline-none transition-colors resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold px-6 py-3 rounded-xl text-xs sm:text-sm shadow-lg shadow-emerald-500/20 transition-all cursor-pointer active:scale-98"
              >
                <Send className="w-4 h-4" />
                <span>Confirmar y Enviar Turno a WhatsApp</span>
              </button>
            </form>

            {/* Right Information Box */}
            <div className="md:w-72 bg-slate-950 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">
                  Garantía de Atención
                </span>

                <div className="space-y-3.5 text-xs text-slate-300">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Confirmación instantánea con ticket numerado oficial.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Asistencia guiada paso a paso para la activación de tu cuenta.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Canal directo con el titular Javier Alan Rodriguez Yescas.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <span>Garantía completa durante toda la duración contratada.</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-400">
                <span>¿Prefieres atención inmediata?</span>
                <a
                  href={buildWhatsAppLink('¡Hola! Necesito soporte comercial inmediato.')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 text-emerald-400 hover:text-emerald-300 font-bold block"
                >
                  Escribir ahora al {OFFICIAL_WHATSAPP_NUMBER} →
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* DEMOSTRACIÓN & EXPLICACIÓN: CÓMO SE GENERA Y ENVÍA SOLA POR WHATSAPP */}
        <div className="mt-8">
          <ProtectedSectionLock
            badge="Guía Previa de Agendamiento"
            title="¿Cómo se genera y envía la cita sola por WhatsApp?"
            subtitle="Ingresa la clave única 1987 para desbloquear esta guía previa paso a paso, el simulador de WhatsApp y el panel de horarios simultáneamente."
          >
        <div className="max-w-4xl mx-auto mt-6 bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-800">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 mb-1.5">
                <Zap className="w-3 h-3 text-amber-400" /> Demostración Práctica
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold text-white">
                ¿Cómo se genera y envía la cita sola por WhatsApp?
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Así es como el cliente no escribe nada y el mensaje llega redactado automáticamente:
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyExample}
                className="text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                title="Copiar texto de ejemplo al portapapeles"
              >
                {copiedExample ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Ejemplo</span>
                  </>
                )}
              </button>

              <a
                href={sampleWhatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
                title="Abrir WhatsApp real para comprobar que el mensaje ya está escrito en la barra"
              >
                <MessageCircle className="w-3.5 h-3.5 fill-slate-950" />
                <span>Probar Enviar a WhatsApp</span>
              </a>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Visual Chat Bubble (WhatsApp Style) */}
            <div className="lg:col-span-6 bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
              {/* WhatsApp top bar */}
              <div className="bg-emerald-950/70 border-b border-emerald-900/40 px-4 py-2.5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500 text-slate-950 font-black flex items-center justify-center text-xs shrink-0">
                  SD
                </div>
                <div className="leading-tight">
                  <span className="text-xs font-bold text-white block">
                    Servicios Digitales Premium Oficial
                  </span>
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    en línea • {OFFICIAL_WHATSAPP_NUMBER}
                  </span>
                </div>
              </div>

              {/* Chat Canvas */}
              <div className="p-4 bg-[#0b141a] space-y-3">
                {/* Auto Generated message bubble */}
                <div className="max-w-[95%] ml-auto bg-[#005c4b] text-slate-100 rounded-2xl rounded-tr-none p-3.5 text-xs shadow-md border border-emerald-600/30">
                  <div className="text-[11px] font-bold text-emerald-200 border-b border-emerald-500/20 pb-1 mb-2 flex items-center justify-between">
                    <span>Mensaje Generado Automáticamente</span>
                    <span className="text-[10px] bg-emerald-900/60 px-1.5 py-0.5 rounded text-emerald-300">
                      Sin Escribir
                    </span>
                  </div>
                  <p className="font-semibold text-white">
                    ¡Hola! Acabo de agendar una Cita de Atención Prioritaria en Servicios Digitales Premium:
                  </p>
                  <div className="mt-2 space-y-1 bg-black/20 p-2 rounded-lg text-[11px] font-mono">
                    <div>🔖 <strong>Ticket de Cita:</strong> #{sampleTicketId}</div>
                    <div>👤 <strong>Nombre:</strong> Cliente Express (Atención Rápida)</div>
                    <div>📍 <strong>País:</strong> México</div>
                    <div>🛎️ <strong>Motivo / Servicio:</strong> Activación de Cuenta Digital</div>
                    <div>📅 <strong>Fecha:</strong> {selectedDate}</div>
                    <div>⏰ <strong>Horario:</strong> {selectedTimeSlot}</div>
                    <div className="text-emerald-300">⚡ <strong>Modo:</strong> Generación Automática Instantánea</div>
                  </div>
                  <p className="mt-2 text-slate-200">
                    Por favor, confirmen mi turno de atención. ¡Gracias!
                  </p>
                  <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-emerald-300/80">
                    <span>19:25</span>
                    <span className="font-bold text-cyan-300">✓✓</span>
                  </div>
                </div>
              </div>

              {/* Simulated bottom input */}
              <div className="bg-[#202c33] px-3 py-2 flex items-center justify-between text-[11px] text-slate-300">
                <span className="text-slate-400 truncate">
                  El mensaje se carga automáticamente en la barra de texto ✍️
                </span>
                <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center text-slate-950 shrink-0">
                  <Send className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>

            {/* Explanation side */}
            <div className="lg:col-span-6 space-y-3.5 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                <h4 className="font-bold text-white flex items-center gap-2 mb-1">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-extrabold flex items-center justify-center text-[11px]">
                    1
                  </span>
                  <span>¿Por qué el cliente no tiene que escribir?</span>
                </h4>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  El botón utiliza el protocolo oficial de WhatsApp (<code className="text-emerald-400">wa.me/.../?text=...</code>). Al hacer clic en <strong>"Generar Cita"</strong>, WhatsApp se abre en el teléfono o PC con <strong>todo el texto redactado en la caja de escritura</strong>. El usuario únicamente pulsa el botón verde de enviar.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                <h4 className="font-bold text-white flex items-center gap-2 mb-1">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-extrabold flex items-center justify-center text-[11px]">
                    2
                  </span>
                  <span>¿Cómo se agrega la cita automáticamente tras 3 a 5 min?</span>
                </h4>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  Si un cliente escribe a tu WhatsApp oficial <strong className="text-emerald-400">{OFFICIAL_WHATSAPP_NUMBER}</strong> y te encuentras ocupado en entregas, a los <strong>3 a 5 minutos</strong> de espera tu Asistente Oficial le responde en automático: le asigna un número de ticket oficial, le presenta tus horarios disponibles y le agenda su cita para asegurar su pedido.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                <h4 className="font-bold text-white flex items-center gap-2 mb-1">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-extrabold flex items-center justify-center text-[11px]">
                    3
                  </span>
                  <span>Tus días y horas siempre sincronizados</span>
                </h4>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  Tanto el agendador web como el asistente de WhatsApp leen tu configuración de horarios (Lunes a Domingo y turnos). Tú solo cambias tus horas desde el botón protegido con contraseña (1987) y el sistema se encarga del resto.
                </p>
              </div>
            </div>
          </div>
        </div>
          </ProtectedSectionLock>
        </div>
      </div>

      {/* Schedule Manager Modal for Javier */}
      <ScheduleManagerModal
        isOpen={isManagerOpen}
        onClose={() => setIsManagerOpen(false)}
        onSaved={(newCfg) => setScheduleConfig(newCfg)}
      />
    </section>
  );
};
