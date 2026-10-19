import React, { useState, useEffect } from 'react';
import { Lock, Unlock, KeyRound, AlertCircle, ShieldCheck, LogOut, Eye, EyeOff } from 'lucide-react';
import { isOwnerAuthenticated, verifyOwnerPassword, logoutOwner } from '../data/adminAuth';

interface ProtectedSectionLockProps {
  title: string;
  subtitle?: string;
  badge?: string;
  children: React.ReactNode;
}

export const ProtectedSectionLock: React.FC<ProtectedSectionLockProps> = ({
  title,
  subtitle,
  badge = 'Área Restringida',
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setIsAuthenticated(isOwnerAuthenticated());

    const handleAuthChange = () => {
      setIsAuthenticated(isOwnerAuthenticated());
    };

    window.addEventListener('admin_auth_state_changed', handleAuthChange);
    return () => window.removeEventListener('admin_auth_state_changed', handleAuthChange);
  }, []);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyOwnerPassword(password)) {
      setIsAuthenticated(true);
      setErrorMsg(null);
      setPassword('');
    } else {
      setErrorMsg('Acceso incorrecto. Ingrese ****.');
    }
  };

  const handleLock = () => {
    logoutOwner();
    setIsAuthenticated(false);
  };

  if (isAuthenticated) {
    return (
      <div className="relative">
        {/* Subtle Admin Active Bar */}
        <div className="bg-slate-950 border-b border-emerald-500/30 px-4 py-2 flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-bold text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Todo Desbloqueado (****)
            </span>
            <span className="text-slate-500 hidden sm:inline">•</span>
            <span className="text-slate-400 hidden sm:inline">
              Guías previas, simulador de WhatsApp, agendamiento prioritario y panel de horarios activos
            </span>
          </div>

          <button
            onClick={handleLock}
            className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-red-400 bg-slate-900 hover:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700 hover:border-red-500/40 transition-colors cursor-pointer"
            title="Bloquear todas las secciones y guías protegidas"
          >
            <Lock className="w-3 h-3" />
            <span>Bloquear Todo</span>
          </button>
        </div>

        {children}
      </div>
    );
  }

  return (
    <div className="py-16 sm:py-20 bg-slate-950 relative border-t border-slate-800">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl text-center relative overflow-hidden">
          {/* Top lock icon */}
          <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto mb-5 shadow-lg shadow-amber-500/5">
            <Lock className="w-8 h-8" />
          </div>

          {/* Badge */}
          <span className="inline-block text-[11px] uppercase font-extrabold tracking-widest text-amber-400 bg-amber-500/15 px-3 py-1 rounded-full border border-amber-500/30 mb-3">
            {badge} • ****
          </span>

          {/* Title */}
          <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            {title}
          </h3>

          <p className="mt-2 text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            {subtitle ||
              'Ingresa **** para desbloquear simultáneamente todas las guías previas, el simulador de WhatsApp, el agendamiento prioritario y el panel de horarios.'}
          </p>

          {/* Password Form */}
          <form onSubmit={handleUnlock} className="mt-6 max-w-sm mx-auto space-y-3">
            <div className="relative">
              <input
                type="password"
                placeholder="****"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                autoComplete="off"
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 text-sm text-white px-4 py-3 rounded-2xl outline-none transition-all text-center tracking-widest placeholder:tracking-widest placeholder:text-sm"
              />
            </div>

            {errorMsg && (
              <div className="flex items-center justify-center gap-1.5 text-xs text-red-400 bg-red-500/10 py-1.5 px-3 rounded-xl border border-red-500/20">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 font-extrabold py-3 px-6 rounded-2xl text-xs sm:text-sm shadow-xl shadow-amber-500/20 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <KeyRound className="w-4 h-4" />
              <span>Desbloquear Todo (****)</span>
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Acceso seguro protegido para el titular y personal autorizado</span>
          </div>
        </div>
      </div>
    </div>
  );
};
