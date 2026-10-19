import React, { useState, useEffect } from 'react';
import { Lock, KeyRound, AlertCircle, ShieldCheck, Users, UserCheck } from 'lucide-react';
import {
  getMultiUserAdminState,
  verifyOwnerPasswordAsync,
  logoutOwner,
  MultiUserAdminState,
} from '../data/adminAuth';

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
  const [adminState, setAdminState] = useState<MultiUserAdminState>(() =>
    getMultiUserAdminState()
  );
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setAdminState(getMultiUserAdminState());

    const handleAuthChange = () => {
      setAdminState(getMultiUserAdminState());
    };

    window.addEventListener('admin_auth_state_changed', handleAuthChange);
    return () => window.removeEventListener('admin_auth_state_changed', handleAuthChange);
  }, []);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setErrorMsg(null);

    const result = await verifyOwnerPasswordAsync(password);
    setIsSubmitting(false);

    if (result.ok) {
      setAdminState(getMultiUserAdminState());
      setErrorMsg(null);
      setPassword('');
    } else {
      setAdminState(getMultiUserAdminState());
      setErrorMsg(result.message || 'Acceso incorrecto. Ingrese ****.');
    }
  };

  const handleLock = () => {
    logoutOwner('manual');
    setAdminState(getMultiUserAdminState());
  };

  if (adminState.isAuthenticated) {
    return (
      <div className="relative">
        {/* Subtle Admin Active Bar */}
        <div className="bg-slate-950 border-b border-emerald-500/30 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-bold text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Sesión Única Admin Activa (1/1 • ****)
            </span>
            <span className="text-slate-500 hidden sm:inline">•</span>
            <span className="text-slate-300 hidden md:inline flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-cyan-400 inline mr-1" />
              Usuarios conectados: <strong>{adminState.activeUsersCount}</strong> (los demás usuarios ven la app en modo normal y bloqueado)
            </span>
            <span className="text-slate-500 hidden lg:inline">•</span>
            <span className="text-amber-300 text-[11px] hidden lg:inline">
              Se cierra sesión automáticamente al cerrar la página
            </span>
          </div>

          <button
            onClick={handleLock}
            className="flex items-center gap-1 text-[11px] font-semibold text-slate-300 hover:text-red-400 bg-slate-900 hover:bg-slate-800 px-3 py-1 rounded-lg border border-slate-700 hover:border-red-500/40 transition-colors cursor-pointer"
            title="Cerrar sesión de administrador y bloquear todas las secciones protegidas"
          >
            <Lock className="w-3 h-3" />
            <span>Cerrar Sesión Admin</span>
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
          <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
            <span className="inline-block text-[11px] uppercase font-extrabold tracking-widest text-amber-400 bg-amber-500/15 px-3 py-1 rounded-full border border-amber-500/30">
              {badge} • ****
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-cyan-300 bg-cyan-500/10 px-2.5 py-1 rounded-full border border-cyan-500/20">
              <Users className="w-3 h-3" />
              <span>{adminState.activeUsersCount} usuario(s) en línea</span>
            </span>
          </div>

          {/* Title */}
          <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            {title}
          </h3>

          <p className="mt-2 text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            {subtitle ||
              'Ingresa **** para iniciar sesión única de Administrador y desbloquear las guías previas, el simulador de WhatsApp y el panel de horarios.'}
          </p>

          {/* Notice if another user is currently connected as the single active Admin */}
          {adminState.isAdminOccupiedByOther && (
            <div className="mt-4 max-w-md mx-auto p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-2.5 text-left">
              <UserCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-amber-300 block">
                  Administrador Conectado en Otra Sesión (1/1 Activo)
                </strong>
                <span>
                  En este momento ya hay un administrador activo. Solo se permite 1 administrador conectado a la vez; tu sesión permanece en modo usuario normal hasta que el administrador actual cierre su página o cierre sesión.
                </span>
              </div>
            </div>
          )}

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
              <div className="flex items-center justify-center gap-1.5 text-xs text-red-400 bg-red-500/10 py-2 px-3 rounded-xl border border-red-500/20">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 disabled:opacity-60 text-slate-950 font-extrabold py-3 px-6 rounded-2xl text-xs sm:text-sm shadow-xl shadow-amber-500/20 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <KeyRound className="w-4 h-4" />
              <span>
                {isSubmitting ? 'Verificando Sesión...' : 'Desbloquear Todo (****)'}
              </span>
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-slate-800/80 text-[11px] text-slate-400 flex flex-wrap items-center justify-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              Máximo 1 Administrador conectado a la vez • Cierre automático de sesión al cerrar la página
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
