import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Globe,
  User,
  MessageCircle,
  ShoppingCart,
  Headphones,
  TrendingUp,
  Sparkles,
  Lock,
  Unlock,
  Check,
  Users,
} from 'lucide-react';
import { CountryCode, UserProfile } from '../types';
import { COUNTRIES, OFFICIAL_WHATSAPP_NUMBER, buildWhatsAppLink } from '../data/catalog';
import {
  getMultiUserAdminState,
  logoutOwner,
  MultiUserAdminState,
} from '../data/adminAuth';
import { AdminControlModal } from './AdminControlModal';
import { PWAInstallModalAndButton } from './PWAInstallModalAndButton';

interface HeaderProps {
  country: CountryCode;
  onCountryChange: (country: CountryCode) => void;
  profile: UserProfile;
  onProfileChange: (profile: UserProfile) => void;
  cartCount: number;
  onOpenCart: () => void;
  onOpenChat: () => void;
  onOpenSimulator?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  country,
  onCountryChange,
  profile,
  onProfileChange,
  cartCount,
  onOpenCart,
  onOpenChat,
  onOpenSimulator,
}) => {
  const [adminState, setAdminState] = useState<MultiUserAdminState>(() =>
    getMultiUserAdminState()
  );
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  useEffect(() => {
    const handleAuth = () => setAdminState(getMultiUserAdminState());
    window.addEventListener('admin_auth_state_changed', handleAuth);
    return () => window.removeEventListener('admin_auth_state_changed', handleAuth);
  }, []);

  const isAdminAuth = adminState.isAuthenticated;

  const handleAdminLockToggle = () => {
    setIsAdminModalOpen(true);
  };

  const handleShareWeb = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2500);
    }
  };

  const directWhatsApp = buildWhatsAppLink(
    `¡Hola! Soy ${profile === 'afiliado' ? 'Vendedor/Afiliado' : profile === 'atencion' ? 'Cliente solicitando atención' : 'Comprador'} de ${COUNTRIES.find((c) => c.code === country)?.name}. Deseo información directa sobre sus servicios.`
  );

  return (
    <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-xl border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 p-0.5 shadow-lg shadow-emerald-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-emerald-400 font-extrabold text-xl tracking-tighter">
                SDP
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-white">
                  Servicios Digitales <span className="text-emerald-400">Premium</span>
                </span>
                <span className="inline-flex items-center text-xs text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 font-medium">
                  <ShieldCheck className="w-3 h-3 mr-0.5 inline" /> Oficial
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block"></span>
                  WhatsApp {OFFICIAL_WHATSAPP_NUMBER}
                </span>
                <span className="hidden md:inline text-slate-600">•</span>
                <span className="hidden md:inline-flex items-center gap-1 text-cyan-300 font-medium">
                  <Users className="w-3 h-3" />
                  <span>{adminState.activeUsersCount} en línea</span>
                </span>
              </div>
            </div>
          </div>

          {/* Center: Country & Profile Selectors */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Country Selector */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1">
              <div className="flex items-center px-2 text-xs font-semibold text-slate-400 gap-1">
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                <span>País:</span>
              </div>
              <div className="flex gap-1">
                {COUNTRIES.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => onCountryChange(c.code)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                      country === c.code
                        ? 'bg-emerald-500 text-slate-950 shadow-sm font-bold'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <span>{c.flag}</span>
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Profile Selector */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1">
              <div className="flex items-center px-2 text-xs font-semibold text-slate-400 gap-1">
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span>Perfil:</span>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => onProfileChange('comprador')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    profile === 'comprador'
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  Comprador
                </button>
                <button
                  onClick={() => onProfileChange('afiliado')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                    profile === 'afiliado'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <TrendingUp className="w-3 h-3" />
                  Vendedor / Afiliado
                </button>
                <button
                  onClick={() => onProfileChange('atencion')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                    profile === 'atencion'
                      ? 'bg-purple-500 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Headphones className="w-3 h-3" />
                  Atención
                </button>
              </div>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* PWA Install Button with Auto-Detection */}
            <PWAInstallModalAndButton variant="header" />

            {/* Admin Lock / Unlock Status Toggle */}
            <div className="flex items-center gap-1">
              <button
                onClick={handleAdminLockToggle}
                className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                  isAdminAuth
                    ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/40'
                    : adminState.isAdminOccupiedByOther
                    ? 'bg-slate-900 hover:bg-slate-800 text-slate-400 border-slate-700'
                    : 'bg-slate-900 hover:bg-slate-800 text-amber-300 border-amber-500/30'
                }`}
                title={
                  isAdminAuth
                    ? 'Abrir Centro de Administración: Productos, Precios y Horarios (****)'
                    : adminState.isAdminOccupiedByOther
                    ? 'Administrador conectado en otra sesión (1/1 en uso)'
                    : 'Abrir Panel de Administración: Productos, Precios y Horarios (****)'
                }
              >
                {isAdminAuth ? (
                  <>
                    <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="hidden sm:inline">Panel Admin (****)</span>
                  </>
                ) : adminState.isAdminOccupiedByOther ? (
                  <>
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span className="hidden sm:inline">Admin (1/1 En Uso)</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span className="hidden sm:inline">Administrar (****)</span>
                  </>
                )}
              </button>

              {isAdminAuth && (
                <button
                  onClick={() => logoutOwner('manual')}
                  className="px-2 py-2 rounded-xl text-[11px] font-bold bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/30 transition-all cursor-pointer"
                  title="Cerrar sesión de administrador inmediatamente"
                >
                  Salir
                </button>
              )}
            </div>

            {/* Share link button */}
            <button
              onClick={handleShareWeb}
              className="hidden sm:flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white font-medium px-2.5 py-2 rounded-xl text-xs transition-all cursor-pointer"
              title="Copiar enlace para compartir con clientes"
            >
              {copiedUrl ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">¡Enlace Copiado!</span>
                </>
              ) : (
                <>
                  <Globe className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Compartir Web</span>
                </>
              )}
            </button>

            {/* Simulator quick button */}
            {onOpenSimulator && (
              <button
                onClick={onOpenSimulator}
                className="hidden md:flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-emerald-500/30 hover:border-emerald-500 text-emerald-400 font-semibold px-3 py-2 rounded-xl text-xs transition-all shadow-sm cursor-pointer"
                title="Ver cómo funciona cuando alguien envía mensaje"
              >
                <MessageCircle className="w-3.5 h-3.5 fill-emerald-400" />
                <span>Ejemplo WhatsApp</span>
              </button>
            )}

            {/* Chatbot trigger */}
            <button
              onClick={onOpenChat}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-500/50 text-slate-200 hover:text-emerald-400 font-semibold px-3 py-2 rounded-xl text-xs sm:text-sm transition-all shadow-sm cursor-pointer"
              title="Abrir Asistente Virtual"
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Asistente IA</span>
            </button>

            {/* Cart Trigger */}
            <button
              onClick={onOpenCart}
              className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
              title="Ver mi cotización / pedido"
            >
              <ShoppingCart className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-slate-950 font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-scale">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Direct WhatsApp Call to Action */}
            <a
              href={directWhatsApp}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm shadow-lg shadow-emerald-500/25 transition-all hover:scale-105 active:scale-95"
            >
              <MessageCircle className="w-4 h-4 fill-slate-950" />
              <span className="hidden sm:inline">WhatsApp Oficial</span>
              <span className="sm:hidden">WhatsApp</span>
            </a>
          </div>
        </div>

        {/* Mobile Country & Profile Selector Bar */}
        <div className="lg:hidden py-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1">
            <span className="text-slate-400 font-medium">País:</span>
            <select
              value={country}
              onChange={(e) => onCountryChange(e.target.value as CountryCode)}
              className="bg-slate-900 text-white font-semibold border border-slate-700 rounded-lg px-2 py-1 text-xs outline-none focus:border-emerald-500"
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-slate-400 font-medium">Perfil:</span>
            <select
              value={profile}
              onChange={(e) => onProfileChange(e.target.value as UserProfile)}
              className="bg-slate-900 text-white font-semibold border border-slate-700 rounded-lg px-2 py-1 text-xs outline-none focus:border-cyan-500"
            >
              <option value="comprador">👤 Comprador</option>
              <option value="afiliado">🚀 Vendedor / Afiliado</option>
              <option value="atencion">🎧 Atención al Cliente</option>
            </select>
          </div>
        </div>
      </div>

      {/* Auto-detected OS, Machine & PWA Install Status Bar */}
      <PWAInstallModalAndButton variant="banner" />

      <AdminControlModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
      />
    </header>
  );
};
