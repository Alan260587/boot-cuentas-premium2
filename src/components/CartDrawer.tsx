import React, { useState } from 'react';
import {
  X,
  Trash2,
  Plus,
  Minus,
  MessageCircle,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  ShoppingBag,
} from 'lucide-react';
import { CartItem, CountryCode, UserProfile } from '../types';
import {
  COUNTRIES,
  OFFICIAL_WHATSAPP_NUMBER,
  formatWhatsAppOrderMessage,
  buildWhatsAppLink,
} from '../data/catalog';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  country: CountryCode;
  profile: UserProfile;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  country,
  profile,
}) => {
  const [paymentChoice, setPaymentChoice] = useState('Banco Nu (SPEI / Tarjeta)');
  const [recommenderName, setRecommenderName] = useState('');
  const [noRecommender, setNoRecommender] = useState(false);

  if (!isOpen) return null;

  const totalMxn = items.reduce((sum, item) => sum + item.product.priceMxn * item.quantity, 0);
  const totalUsd = items.reduce((sum, item) => sum + item.product.priceUsd * item.quantity, 0);

  const getActiveConcept = () => {
    if (noRecommender) return 'pago';
    const trimmed = recommenderName.trim();
    return trimmed.length > 0 ? trimmed : 'pago';
  };

  const activeConcept = getActiveConcept();

  const currentCountryName = COUNTRIES.find((c) => c.code === country)?.name || 'México';
  const profileLabel =
    profile === 'afiliado'
      ? 'Vendedor / Afiliado'
      : profile === 'atencion'
      ? 'Atención al Cliente'
      : 'Comprador';

  const orderProducts = items.map((i) => ({
    name: i.product.name,
    qty: i.quantity,
    priceMxn: i.product.priceMxn,
    priceUsd: i.product.priceUsd,
    currencyType: i.product.currencyType,
  }));

  const whatsappOrderUrl = buildWhatsAppLink(
    formatWhatsAppOrderMessage(
      orderProducts,
      totalMxn,
      totalUsd,
      paymentChoice,
      activeConcept,
      currentCountryName,
      profileLabel
    )
  );

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
      ></div>

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-slate-950 border-l border-slate-800 shadow-2xl flex flex-col justify-between">
          {/* Header */}
          <div className="p-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-bold text-white">Tu Cotización / Pedido</h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body items */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {items.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-3">
                <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <p className="text-sm font-medium">Aún no has agregado servicios a tu cotización.</p>
                <button
                  onClick={onClose}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-bold"
                >
                  Explorar catálogo de servicios →
                </button>
              </div>
            ) : (
              <>
                {/* Warning notice */}
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Atención:</strong> Antes de pagar, validaremos disponibilidad inmediata en nuestro WhatsApp oficial: <strong>{OFFICIAL_WHATSAPP_NUMBER}</strong>.
                  </span>
                </div>

                {/* Items list */}
                <div className="space-y-3">
                  {items.map((item) => (
                    <div
                      key={item.product.id}
                      className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-white truncate">
                          {item.product.name}
                        </h4>
                        <div className="text-xs text-slate-400 mt-0.5">
                          ${item.product.priceMxn} MXN / ${item.product.priceUsd.toFixed(2)}{' '}
                          {item.product.currencyType}
                        </div>
                      </div>

                      {/* Controls */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5">
                          <button
                            onClick={() => onUpdateQuantity(item.product.id, -1)}
                            className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-white"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center text-xs font-bold text-white">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(item.product.id, 1)}
                            className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-white"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <button
                          onClick={() => onRemoveItem(item.product.id)}
                          className="w-7 h-7 rounded-lg text-slate-500 hover:text-red-400 flex items-center justify-center"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Payment method selector in cart */}
                <div className="pt-4 border-t border-slate-800 space-y-3">
                  <label className="block text-xs font-semibold text-slate-300">
                    Método de Pago Preferido:
                  </label>
                  <select
                    value={paymentChoice}
                    onChange={(e) => setPaymentChoice(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-xs sm:text-sm text-white px-3 py-2 rounded-xl outline-none"
                  >
                    <option value="Banco Nu (SPEI / Tarjeta)">Banco Nu (México - SPEI / Tarjeta)</option>
                    <option value="Bancoppel (Depósito / Tarjeta)">Bancoppel (México - Depósito / OXXO)</option>
                    <option value="Binance Pay (ID 453667986)">Binance Pay (Internacional - USDT)</option>
                    <option value="PayPal / Correo">PayPal / Correo Digital</option>
                  </select>

                  {/* Concept field in cart */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Concepto Obligatorio (¿Quién te recomendó?):
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Nombre y Apellido del recomendador"
                        disabled={noRecommender}
                        value={recommenderName}
                        onChange={(e) => setRecommenderName(e.target.value)}
                        className={`flex-1 bg-slate-900 border text-xs text-white px-3 py-2 rounded-xl outline-none ${
                          noRecommender ? 'opacity-40 border-slate-800' : 'border-slate-700'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setNoRecommender(!noRecommender);
                          if (!noRecommender) setRecommenderName('');
                        }}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-xl border ${
                          noRecommender
                            ? 'bg-amber-500 text-slate-950 border-amber-400'
                            : 'bg-slate-900 text-slate-400 border-slate-700'
                        }`}
                      >
                        {noRecommender ? '✓ Solo "pago"' : 'Nadie'}
                      </button>
                    </div>
                    <div className="mt-1 text-[11px] text-amber-300">
                      Concepto generado: <strong>"{activeConcept}"</strong>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer totals & actions */}
          {items.length > 0 && (
            <div className="p-6 bg-slate-900 border-t border-slate-800 space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Subtotal en Pesos Mexicanos:</span>
                  <span className="font-bold text-white">${totalMxn.toLocaleString()} MXN</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Equivalente en Cripto / USD:</span>
                  <span className="font-bold text-emerald-400">${totalUsd.toFixed(2)} USDT/USD</span>
                </div>
                <div className="flex items-center justify-between text-sm font-extrabold text-white pt-2 border-t border-slate-800">
                  <span>Total Final:</span>
                  <span className="text-base text-emerald-400">
                    ${totalMxn.toLocaleString()} MXN / ${totalUsd.toFixed(2)} USDT
                  </span>
                </div>
              </div>

              <a
                href={whatsappOrderUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 px-4 rounded-xl text-sm shadow-xl shadow-emerald-500/20 transition-all cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 fill-slate-950" />
                <span>Finalizar Pedido por WhatsApp</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
