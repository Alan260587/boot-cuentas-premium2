import React from 'react';
import { AlertTriangle, MessageCircle, ExternalLink, ShieldCheck } from 'lucide-react';
import { OFFICIAL_WHATSAPP_NUMBER, buildWhatsAppLink } from '../data/catalog';

export const NoticeBanner: React.FC = () => {
  const directUrl = buildWhatsAppLink(
    '¡Hola! Me comunico desde Servicios Digitales Premium antes de comprar para verificar disponibilidad y activar mi servicio.'
  );

  return (
    <div className="bg-gradient-to-r from-amber-500/15 via-emerald-500/15 to-amber-500/15 border-y border-amber-500/30 py-3.5 px-4 sm:px-6 relative overflow-hidden backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-center md:text-left">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0 text-amber-400 animate-pulse">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center justify-center md:justify-start gap-2">
              <span className="font-bold text-amber-300 text-sm sm:text-base tracking-wide uppercase">
                Aviso Importante Oficial
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                <ShieldCheck className="w-3 h-3" /> Verificado
              </span>
            </div>
            <p className="text-slate-200 text-xs sm:text-sm font-medium mt-0.5">
              ⚠️ <strong className="text-amber-200 font-bold">Atención:</strong> Antes de comprar, favor de comunicarse por WhatsApp oficial ({OFFICIAL_WHATSAPP_NUMBER}) para validar stock y entrega inmediata.
            </p>
          </div>
        </div>

        <a
          href={directUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs sm:text-sm shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0"
        >
          <MessageCircle className="w-4 h-4 fill-slate-950" />
          <span>Escribir al WhatsApp Oficial</span>
          <ExternalLink className="w-3.5 h-3.5 opacity-70" />
        </a>
      </div>
    </div>
  );
};
