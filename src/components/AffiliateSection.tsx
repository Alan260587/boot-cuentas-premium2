import React, { useState } from 'react';
import {
  TrendingUp,
  Gift,
  Award,
  Users,
  CheckCircle2,
  ArrowRight,
  MessageCircle,
  Sparkles,
  Zap,
  Calculator,
} from 'lucide-react';
import { OFFICIAL_WHATSAPP_NUMBER, buildWhatsAppLink } from '../data/catalog';

export const AffiliateSection: React.FC = () => {
  const [figmaSales, setFigmaSales] = useState<number>(3);
  const [baseSales, setBaseSales] = useState<number>(6);

  // Affiliate reward rules calculation:
  // Rule 1: Every 3 Figmas sold = 1 Figma Pro free
  const freeFigmasFromFigma = Math.floor(figmaSales / 3);
  const figmaProgressToNext = figmaSales % 3;

  // Rule 2: Every 6 products of 150 MXN (Coursera, Gemini, CapCut, Office) = 1 Figma Pro free
  const freeFigmasFromBase = Math.floor(baseSales / 6);
  const baseProgressToNext = baseSales % 6;

  const totalFreeFigmas = freeFigmasFromFigma + freeFigmasFromBase;
  const totalRewardValueMxn = totalFreeFigmas * 300;
  const totalRewardValueUsd = totalFreeFigmas * 17.0;

  const affiliateWhatsAppUrl = buildWhatsAppLink(`¡Hola! Deseo unirme al Programa Oficial de Afiliados de Servicios Digitales Premium.

Quiero registrarme como vendedor oficial para promocionar las licencias digitales y ganar recompensas por metas de ventas.

WhatsApp de canalización: ${OFFICIAL_WHATSAPP_NUMBER}`);

  return (
    <section id="afiliados" className="py-16 sm:py-20 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider bg-amber-500/10 px-3 py-1 rounded-md border border-amber-500/20 mb-3">
            <TrendingUp className="w-3.5 h-3.5" /> Oportunidad de Negocio & Crecimiento
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Programa de Afiliados & Vendedores
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-300">
            Nuestros servicios digitales premium pueden adquirirse para <strong className="text-white">uso personal</strong> o para <strong className="text-emerald-400">convertirse en vendedor</strong> y generar ingresos y licencias gratuitas de alto valor.
          </p>
        </div>

        {/* 2 Core Rules Graphic Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Rule 1 Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-6 sm:p-7 rounded-2xl border border-emerald-500/30 relative overflow-hidden shadow-lg shadow-emerald-500/5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <span className="text-xs font-extrabold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                Regla 1: Especialidad Figma
              </span>
              <Gift className="w-5 h-5 text-emerald-400" />
            </div>

            <h3 className="text-xl font-bold text-white mb-2">Vende 3 Figmas Pro</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              En el caso de vender <strong className="text-emerald-300">tres (3) licencias de Figma Pro (.edu)</strong>, se obtiene de inmediato un producto de <strong className="text-white">Figma Pro completamente gratis</strong> (valorado en $300 MXN / 17.00 USDT).
            </p>

            <div className="mt-5 p-3.5 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">Meta por ciclo:</span>
              <span className="font-bold text-emerald-400">3 Ventas Figma = 1 Figma Pro Gratis</span>
            </div>
          </div>

          {/* Rule 2 Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-6 sm:p-7 rounded-2xl border border-cyan-500/30 relative overflow-hidden shadow-lg shadow-cyan-500/5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <span className="text-xs font-extrabold text-cyan-400 uppercase tracking-widest bg-cyan-500/10 px-2.5 py-1 rounded-md border border-cyan-500/20">
                Regla 2: Servicios Base
              </span>
              <Award className="w-5 h-5 text-cyan-400" />
            </div>

            <h3 className="text-xl font-bold text-white mb-2">Vende 6 Servicios de $150 MXN</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              En el caso de vender <strong className="text-cyan-300">seis (6) productos equivalentes a $150 MXN u 8.74 USDT</strong> (Coursera Plus, Gemini AI, CapCut Teams o Microsoft 365), ¡obtienes <strong className="text-white">un Figma Pro gratis</strong>!
            </p>

            <div className="mt-5 p-3.5 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">Meta combinada:</span>
              <span className="font-bold text-cyan-400">6 Ventas Base = 1 Figma Pro Gratis</span>
            </div>
          </div>
        </div>

        {/* Interactive Simulator / Calculator */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-4xl mx-auto shadow-2xl">
          <div className="flex items-center gap-3 pb-6 border-b border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-white">
                Simulador Interactivo de Recompensas
              </h3>
              <p className="text-xs sm:text-sm text-slate-400">
                Ajusta las cantidades de ventas proyectadas y calcula tus licencias gratuitas ganadas.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6">
            {/* Control 1: Figma Sales */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs sm:text-sm font-semibold text-slate-200">
                  Licencias de Figma Pro ($300 MXN) vendidas:
                </label>
                <span className="text-base font-extrabold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-lg border border-emerald-500/20">
                  {figmaSales} {figmaSales === 1 ? 'unidad' : 'unidades'}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="21"
                step="1"
                value={figmaSales}
                onChange={(e) => setFigmaSales(parseInt(e.target.value) || 0)}
                className="w-full accent-emerald-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
              />
              <div className="text-[11px] text-slate-400 flex items-center justify-between">
                <span>Progreso hacia la próxima Figma gratis:</span>
                <span className="font-semibold text-slate-200">{figmaProgressToNext} / 3 ventas</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${(figmaProgressToNext / 3) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Control 2: Base Products Sales */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs sm:text-sm font-semibold text-slate-200">
                  Servicios de $150 MXN / 8.74 USDT vendidos:
                </label>
                <span className="text-base font-extrabold text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-lg border border-cyan-500/20">
                  {baseSales} {baseSales === 1 ? 'unidad' : 'unidades'}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                step="1"
                value={baseSales}
                onChange={(e) => setBaseSales(parseInt(e.target.value) || 0)}
                className="w-full accent-cyan-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
              />
              <div className="text-[11px] text-slate-400 flex items-center justify-between">
                <span>Progreso hacia la próxima Figma gratis:</span>
                <span className="font-semibold text-slate-200">{baseProgressToNext} / 6 ventas</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-500 transition-all duration-300"
                  style={{ width: `${(baseProgressToNext / 6) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Results Summary Box */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-slate-950 to-cyan-500/10 border border-slate-700/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                  Tus Recompensas Obtenidas
                </span>
                <div className="text-xl sm:text-2xl font-black text-white">
                  {totalFreeFigmas} {totalFreeFigmas === 1 ? 'Figma Pro (.edu) Gratis' : 'Figmas Pro (.edu) Gratis'}
                </div>
                <div className="text-xs text-emerald-400 font-semibold mt-0.5">
                  Equivalente a: ${totalRewardValueMxn.toLocaleString()} MXN / ${totalRewardValueUsd.toFixed(2)} USDT
                </div>
              </div>
            </div>

            <a
              href={affiliateWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 font-extrabold px-6 py-3 rounded-xl text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition-all cursor-pointer shrink-0"
            >
              <MessageCircle className="w-4 h-4 fill-slate-950" />
              <span>Unirme como Vendedor / Afiliado</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
