import React, { useState } from 'react';
import {
  GraduationCap,
  Sparkles,
  Video,
  LayoutGrid,
  PenTool,
  CheckCircle2,
  MessageCircle,
  Plus,
  ShoppingCart,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import { Product, CountryCode } from '../types';
import { PRODUCTS, buildWhatsAppLink } from '../data/catalog';

interface CatalogSectionProps {
  country: CountryCode;
  onAddToCart: (product: Product) => void;
  onOpenOrderModal: (product: Product) => void;
}

export const CatalogSection: React.FC<CatalogSectionProps> = ({
  country,
  onAddToCart,
  onOpenOrderModal,
}) => {
  const [currencyView, setCurrencyView] = useState<'both' | 'mxn' | 'usd'>('both');

  const getProductIcon = (iconName: string) => {
    switch (iconName) {
      case 'GraduationCap':
        return <GraduationCap className="w-6 h-6 text-blue-400" />;
      case 'Sparkles':
        return <Sparkles className="w-6 h-6 text-purple-400" />;
      case 'Video':
        return <Video className="w-6 h-6 text-pink-400" />;
      case 'LayoutGrid':
        return <LayoutGrid className="w-6 h-6 text-cyan-400" />;
      case 'PenTool':
        return <PenTool className="w-6 h-6 text-emerald-400" />;
      default:
        return <Zap className="w-6 h-6 text-amber-400" />;
    }
  };

  return (
    <section id="catalogo" className="py-16 sm:py-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wider bg-emerald-500/10 px-3 py-1 rounded-md border border-emerald-500/20 mb-2">
              <Zap className="w-3.5 h-3.5" /> Catálogo Oficial & Tarifas
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Herramientas Digitales de Alto Rendimiento
            </h2>
            <p className="mt-2 text-sm sm:text-base text-slate-400 max-w-xl">
              Precios exactos sin cargos ocultos. Cuentas directas y garantizadas con soporte oficial por WhatsApp.
            </p>
          </div>

          {/* Currency Toggle */}
          <div className="flex items-center self-start md:self-auto bg-slate-900 border border-slate-800 rounded-xl p-1 shrink-0">
            <span className="text-xs font-semibold text-slate-400 px-2">Moneda:</span>
            <button
              onClick={() => setCurrencyView('both')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                currencyView === 'both'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              MXN & USDT
            </button>
            <button
              onClick={() => setCurrencyView('mxn')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                currencyView === 'mxn'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sólo MXN
            </button>
            <button
              onClick={() => setCurrencyView('usd')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                currencyView === 'usd'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sólo USDT/USD
            </button>
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {PRODUCTS.map((product) => {
            const waInquiry = buildWhatsAppLink(
              `¡Hola! Vengo del catálogo oficial de Servicios Digitales Premium. Me interesa adquirir: *${product.name}* ($${product.priceMxn} MXN / $${product.priceUsd.toFixed(2)} ${product.currencyType}). ¿Tienen disponibilidad para entrega inmediata?`
            );

            return (
              <div
                key={product.id}
                className={`relative flex flex-col justify-between bg-slate-900/80 rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl overflow-hidden ${
                  product.popular
                    ? 'border-emerald-500/50 hover:border-emerald-400 shadow-lg shadow-emerald-500/5'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Popular Badge */}
                {product.popular && (
                  <div className="absolute top-0 right-0">
                    <span className="bg-gradient-to-l from-emerald-500 to-teal-500 text-slate-950 text-[10px] uppercase font-extrabold px-3 py-1 rounded-bl-xl shadow-md">
                      Más Solicitado
                    </span>
                  </div>
                )}

                <div className="p-6">
                  {/* Category & Icon */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center shadow-inner">
                      {getProductIcon(product.iconName)}
                    </div>
                    <span className="text-[11px] font-semibold text-slate-400 bg-slate-800/60 px-2.5 py-1 rounded-lg border border-slate-700/40">
                      {product.duration}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-xl font-bold text-white tracking-tight">{product.name}</h3>
                  <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed min-h-[40px]">
                    {product.description}
                  </p>

                  {/* Highlights */}
                  <div className="mt-5 space-y-2 pt-4 border-t border-slate-800/80">
                    {product.highlights.map((highlight, index) => (
                      <div key={index} className="flex items-start gap-2 text-xs text-slate-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{highlight}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pricing & Actions Footer */}
                <div className="p-6 pt-0 mt-2 bg-gradient-to-b from-transparent to-slate-950/40">
                  {/* Price Box */}
                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 mb-4 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                        Inversión Oficial
                      </div>
                      <div className="flex items-baseline gap-2 mt-0.5">
                        {(currencyView === 'both' || currencyView === 'mxn') && (
                          <span className="text-2xl font-black text-white">
                            ${product.priceMxn} <span className="text-xs font-semibold text-slate-400">MXN</span>
                          </span>
                        )}
                        {currencyView === 'both' && <span className="text-slate-600 font-medium">/</span>}
                        {(currencyView === 'both' || currencyView === 'usd') && (
                          <span className="text-lg font-bold text-emerald-400">
                            ${product.priceUsd.toFixed(2)}{' '}
                            <span className="text-xs font-semibold text-emerald-500/80">
                              {product.currencyType}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="inline-block text-[10px] font-semibold text-emerald-400/90 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        Entrega Rápida
                      </span>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => onAddToCart(product)}
                      className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-semibold py-2.5 px-3 rounded-xl text-xs transition-all border border-slate-700 hover:border-slate-600 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Agregar</span>
                    </button>

                    <a
                      href={waInquiry}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-bold py-2.5 px-3 rounded-xl text-xs transition-all shadow-md shadow-emerald-500/10"
                    >
                      <MessageCircle className="w-3.5 h-3.5 fill-slate-950" />
                      <span>WhatsApp</span>
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Reminder note */}
        <div className="mt-10 p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-center gap-3 text-xs sm:text-sm text-slate-300 text-center">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>Recordatorio:</strong> Todos los pedidos se activan y entregan por medio de nuestro canal oficial de WhatsApp.
          </span>
        </div>
      </div>
    </section>
  );
};
