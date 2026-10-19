import React, { useState } from 'react';
import {
  CreditCard,
  Copy,
  Check,
  AlertCircle,
  Building,
  Coins,
  Send,
  UserCheck,
  HelpCircle,
  ShieldCheck,
} from 'lucide-react';
import { CountryCode } from '../types';
import {
  BANK_DETAILS,
  OFFICIAL_BENEFICIARY,
  OFFICIAL_WHATSAPP_NUMBER,
  buildWhatsAppLink,
} from '../data/catalog';

interface PaymentMethodsSectionProps {
  country: CountryCode;
}

export const PaymentMethodsSection: React.FC<PaymentMethodsSectionProps> = ({ country }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [recommendedBy, setRecommendedBy] = useState<string>('');
  const [isNoRecommender, setIsNoRecommender] = useState<boolean>(false);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2200);
  };

  const getComputedConcept = () => {
    if (isNoRecommender) return 'pago';
    const trimmed = recommendedBy.trim();
    return trimmed.length > 0 ? trimmed : 'pago';
  };

  const activeConcept = getComputedConcept();

  const proofWhatsAppUrl = buildWhatsAppLink(`¡Hola! Acabo de realizar mi pago en Servicios Digitales Premium.

👤 *Titular verificado:* ${OFFICIAL_BENEFICIARY}
📝 *Concepto que coloqué:* "${activeConcept}"
📎 Adjunto aquí mi captura / comprobante de transferencia para entrega y activación de mi servicio.`);

  return (
    <section id="pagos" className="py-16 sm:py-20 bg-slate-900/40 border-y border-slate-800/80 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400 uppercase tracking-wider bg-cyan-500/10 px-3 py-1 rounded-md border border-cyan-500/20 mb-3">
            <CreditCard className="w-3.5 h-3.5" /> Canales Oficiales de Pago
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Datos Bancarios y Métodos Autorizados
          </h2>
          <p className="mt-2 text-sm sm:text-base text-slate-300">
            Cuentas únicas a nombre del titular oficial. Selecciona el método correspondiente a tu país.
          </p>

          {/* Beneficiary Badge */}
          <div className="mt-4 inline-flex items-center gap-2 bg-slate-950/80 border border-slate-700/80 px-4 py-2 rounded-xl text-xs sm:text-sm text-slate-200 shadow-sm">
            <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Beneficiario / Titular Oficial:{' '}
              <strong className="text-white font-extrabold">{OFFICIAL_BENEFICIARY}</strong>
            </span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-bold border border-emerald-500/30">
              Verificado
            </span>
          </div>
        </div>

        {/* Bank Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Mexico Accounts */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 sm:p-7 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none"></div>

            <div>
              <div className="flex items-center justify-between gap-2 mb-4 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Building className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-white flex items-center gap-1.5">
                      <span>🇲🇽 Cuentas Locales para México</span>
                    </h3>
                    <p className="text-xs text-slate-400">Transferencias SPEI o depósitos directos</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                  Pesos (MXN)
                </span>
              </div>

              {/* Account details */}
              <div className="space-y-4">
                {BANK_DETAILS.mexico.map((acc, idx) => {
                  const copyId = `mx-${idx}`;
                  const isCopied = copiedKey === copyId;

                  return (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                        <span className="font-bold text-slate-200">{acc.bank}</span>
                        <span className="text-[11px] text-emerald-400/90 font-medium">{acc.badge}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mb-1.5">{acc.type}</div>

                      <div className="flex items-center justify-between bg-slate-900 px-3 py-2 rounded-lg border border-slate-800 font-mono text-xs sm:text-sm text-slate-100">
                        <span className="tracking-wider font-semibold">{acc.accountNumber}</span>
                        <button
                          onClick={() => handleCopy(acc.accountNumber, copyId)}
                          className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-md transition-all font-sans cursor-pointer ${
                            isCopied
                              ? 'bg-emerald-500 text-slate-950 font-bold'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                          }`}
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Copiado</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copiar</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Titular: <strong>{OFFICIAL_BENEFICIARY}</strong></span>
              <span className="text-emerald-400 font-medium">Acreditación Rápida</span>
            </div>
          </div>

          {/* International & Crypto Accounts */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 sm:p-7 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none"></div>

            <div>
              <div className="flex items-center justify-between gap-2 mb-4 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                    <Coins className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-white flex items-center gap-1.5">
                      <span>🌐 Internacional / Binance & PayPal</span>
                    </h3>
                    <p className="text-xs text-slate-400">Ideal para Venezuela, Colombia y resto del mundo</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20">
                  USDT / USD
                </span>
              </div>

              {/* Account details */}
              <div className="space-y-4">
                {BANK_DETAILS.international.map((acc, idx) => {
                  const copyId = `intl-${idx}`;
                  const isCopied = copiedKey === copyId;

                  return (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                        <span className="font-bold text-slate-200">{acc.platform}</span>
                        <span className="text-[11px] text-cyan-400/90 font-medium">{acc.badge}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mb-1.5">{acc.type}</div>

                      <div className="flex items-center justify-between bg-slate-900 px-3 py-2 rounded-lg border border-slate-800 font-mono text-xs sm:text-sm text-slate-100">
                        <span className="tracking-wider font-semibold break-all">{acc.accountNumber}</span>
                        <button
                          onClick={() => handleCopy(acc.accountNumber, copyId)}
                          className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-md transition-all font-sans shrink-0 ml-2 cursor-pointer ${
                            isCopied
                              ? 'bg-emerald-500 text-slate-950 font-bold'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                          }`}
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Copiado</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copiar</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Receptor: <strong>{OFFICIAL_BENEFICIARY}</strong></span>
              <span className="text-cyan-400 font-medium">Binance Pay 0% Fee</span>
            </div>
          </div>
        </div>

        {/* STRICT CONCEPT RULE GENERATOR & VALIDATOR */}
        <div className="bg-gradient-to-r from-amber-500/10 via-slate-900 to-amber-500/10 border-2 border-amber-500/30 rounded-2xl p-6 sm:p-8 max-w-4xl mx-auto shadow-xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-extrabold text-amber-400 uppercase tracking-widest">
                  Regla Estricta de Transferencia
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-white">
                  Concepto / Motivo de Pago Obligatorio
                </h3>
              </div>
            </div>
            <div className="text-xs text-amber-200/90 bg-amber-500/15 px-3 py-1.5 rounded-lg border border-amber-500/30 font-medium">
              ⚠️ Requisito indispensable para validar tu abono
            </div>
          </div>

          <div className="py-6 space-y-4">
            <p className="text-sm text-slate-200 leading-relaxed">
              <strong className="text-amber-300 font-semibold">Regla oficial del sistema:</strong> En el concepto de pago se debe indicar el <strong>nombre y apellido</strong> de quien lo recomendó. Si no fue recomendado por nadie, escribir únicamente la palabra <strong>"pago"</strong>.
            </p>

            {/* Interactive Concept Builder */}
            <div className="bg-slate-950 p-4 sm:p-5 rounded-xl border border-slate-800 space-y-4">
              <label className="block text-xs font-semibold text-slate-300">
                ¿Fuiste recomendado por alguien? Escribe aquí su nombre y apellido:
              </label>

              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="Ejemplo: Carlos Mendoza"
                  value={recommendedBy}
                  disabled={isNoRecommender}
                  onChange={(e) => {
                    setRecommendedBy(e.target.value);
                    if (isNoRecommender) setIsNoRecommender(false);
                  }}
                  className={`flex-1 bg-slate-900 border text-sm text-white px-3.5 py-2.5 rounded-xl outline-none transition-all ${
                    isNoRecommender
                      ? 'opacity-40 border-slate-800 cursor-not-allowed'
                      : 'border-slate-700 focus:border-amber-400'
                  }`}
                />

                <button
                  type="button"
                  onClick={() => {
                    setIsNoRecommender(!isNoRecommender);
                    if (!isNoRecommender) {
                      setRecommendedBy('');
                    }
                  }}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    isNoRecommender
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                      : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  {isNoRecommender ? '✓ Nadie me recomendó' : 'Nadie me recomendó'}
                </button>
              </div>

              {/* Exact Text Preview to Put in Bank App */}
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">
                    Texto exacto que debes colocar en tu aplicación bancaria:
                  </span>
                  <div className="font-mono text-base sm:text-lg font-black text-amber-300 mt-0.5 tracking-wider">
                    "{activeConcept}"
                  </div>
                </div>

                <button
                  onClick={() => handleCopy(activeConcept, 'active-concept')}
                  className={`flex items-center justify-center gap-1.5 text-xs px-4 py-2 rounded-lg font-bold transition-all shrink-0 cursor-pointer ${
                    copiedKey === 'active-concept'
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                  }`}
                >
                  {copiedKey === 'active-concept' ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>¡Concepto Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copiar Concepto</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Action to WhatsApp */}
          <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Valida tu comprobante en el WhatsApp oficial: <strong>{OFFICIAL_WHATSAPP_NUMBER}</strong>
              </span>
            </div>

            <a
              href={proofWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs sm:text-sm shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Enviar Comprobante por WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
