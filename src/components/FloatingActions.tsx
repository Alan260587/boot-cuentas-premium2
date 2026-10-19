import React from 'react';
import { MessageCircle, Bot, Sparkles } from 'lucide-react';
import { OFFICIAL_WHATSAPP_NUMBER, buildWhatsAppLink } from '../data/catalog';

interface FloatingActionsProps {
  onToggleChat: () => void;
  isChatOpen: boolean;
}

export const FloatingActions: React.FC<FloatingActionsProps> = ({
  onToggleChat,
  isChatOpen,
}) => {
  const directWhatsAppUrl = buildWhatsAppLink(
    '¡Hola! Me comunico directamente por el botón flotante de WhatsApp de Servicios Digitales Premium.'
  );

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3 pointer-events-none">
      {/* Bot Button */}
      {!isChatOpen && (
        <button
          onClick={onToggleChat}
          className="pointer-events-auto group flex items-center gap-2 bg-slate-900/90 hover:bg-slate-800 text-white p-3 sm:px-4 sm:py-3 rounded-full border border-slate-700/80 hover:border-emerald-500/50 shadow-2xl backdrop-blur-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
          title="Abrir Asistente Virtual Comercial"
        >
          <div className="relative">
            <Bot className="w-5 h-5 text-emerald-400" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          </div>
          <span className="hidden sm:inline text-xs font-bold">Asistente Virtual</span>
        </button>
      )}

      {/* WhatsApp Button */}
      <a
        href={directWhatsAppUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="pointer-events-auto group flex items-center gap-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-3.5 rounded-full shadow-2xl shadow-emerald-500/30 transition-all hover:scale-110 active:scale-95 font-black text-xs sm:text-sm"
        title={`WhatsApp Oficial: ${OFFICIAL_WHATSAPP_NUMBER}`}
      >
        <div className="relative">
          <MessageCircle className="w-5 h-5 fill-slate-950" />
          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-200 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-slate-950"></span>
          </span>
        </div>
        <span className="hidden sm:inline font-extrabold tracking-tight">WhatsApp Oficial</span>
        <span className="text-[10px] bg-slate-950/20 px-1.5 py-0.5 rounded font-bold hidden md:inline">
          3-5 min
        </span>
      </a>
    </div>
  );
};
