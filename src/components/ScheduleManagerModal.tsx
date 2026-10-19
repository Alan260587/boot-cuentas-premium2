import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Bot,
  UserCheck,
} from 'lucide-react';
import { ScheduleConfig } from '../types';
import {
  DEFAULT_SCHEDULE_CONFIG,
  getSavedScheduleConfig,
  saveScheduleConfig,
  formatEnabledDaysSummary,
} from '../data/scheduleConfig';
import { OFFICIAL_BENEFICIARY } from '../data/catalog';
import {
  getMultiUserAdminState,
  verifyOwnerPasswordAsync,
  logoutOwner,
  MultiUserAdminState,
} from '../data/adminAuth';
import { Lock, KeyRound, Users } from 'lucide-react';

interface ScheduleManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (newConfig: ScheduleConfig) => void;
}

export const ScheduleManagerModal: React.FC<ScheduleManagerModalProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const [adminState, setAdminState] = useState<MultiUserAdminState>(() =>
    getMultiUserAdminState()
  );
  const [inputPass, setInputPass] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [passError, setPassError] = useState<string | null>(null);

  const [config, setConfig] = useState<ScheduleConfig>(getSavedScheduleConfig());
  const [newSlotStart, setNewSlotStart] = useState('02:00 PM');
  const [newSlotEnd, setNewSlotEnd] = useState('03:00 PM');
  const [savedToast, setSavedToast] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    const syncAuth = () => setAdminState(getMultiUserAdminState());
    window.addEventListener('admin_auth_state_changed', syncAuth);
    return () => window.removeEventListener('admin_auth_state_changed', syncAuth);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setAdminState(getMultiUserAdminState());
      setConfig(getSavedScheduleConfig());
      setInputPass('');
      setPassError(null);
      setConfirmReset(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isAuth = adminState.isAuthenticated;

  const handleUnlockModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isVerifying) return;
    setIsVerifying(true);
    setPassError(null);

    const res = await verifyOwnerPasswordAsync(inputPass);
    setIsVerifying(false);

    if (res.ok) {
      setAdminState(getMultiUserAdminState());
      setPassError(null);
      setInputPass('');
    } else {
      setAdminState(getMultiUserAdminState());
      setPassError(res.message || 'Acceso incorrecto. Ingresa ****.');
    }
  };

  const handleToggleDay = (dayId: string) => {
    setConfig((prev) => ({
      ...prev,
      availableDays: prev.availableDays.map((d) =>
        d.dayId === dayId ? { ...d, enabled: !d.enabled } : d
      ),
    }));
  };

  const handleAddSlot = () => {
    const formatted = `${newSlotStart.trim()} - ${newSlotEnd.trim()}`;
    if (!config.timeSlots.includes(formatted)) {
      setConfig((prev) => ({
        ...prev,
        timeSlots: [...prev.timeSlots, formatted],
      }));
    }
  };

  const handleRemoveSlot = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      timeSlots: prev.timeSlots.filter((_, idx) => idx !== index),
    }));
  };

  const handleSave = () => {
    saveScheduleConfig(config);
    setSavedToast(true);
    if (onSaved) onSaved(config);
    setTimeout(() => {
      setSavedToast(false);
      onClose();
    }, 1200);
  };

  const handleReset = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      setTimeout(() => setConfirmReset(false), 4000);
      return;
    }
    setConfig(DEFAULT_SCHEDULE_CONFIG);
    saveScheduleConfig(DEFAULT_SCHEDULE_CONFIG);
    setConfirmReset(false);
    if (onSaved) onSaved(DEFAULT_SCHEDULE_CONFIG);
  };

  const daysSummary = formatEnabledDaysSummary(config.availableDays);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-bold text-white">
                  Panel de Disponibilidad: Días y Horarios
                </h3>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded border border-emerald-500/30">
                  Titular: {OFFICIAL_BENEFICIARY}
                </span>
                <span className="text-[10px] bg-cyan-500/15 text-cyan-300 font-bold px-2 py-0.5 rounded border border-cyan-500/30 flex items-center gap-1">
                  <Users className="w-3 h-3" /> {adminState.activeUsersCount} en línea
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Configura cuándo estás disponible. Solo 1 Administrador puede conectarse a la vez y la sesión se cierra al cerrar la página.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        {!isAuth ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
              <Lock className="w-7 h-7" />
            </div>
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-amber-400 bg-amber-500/15 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                Sesión Única Admin (1/1) • ****
              </span>
              <h4 className="text-lg font-bold text-white mt-2">
                Ingresa (****)
              </h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Ingresa <strong>****</strong> para entrar como Administrador. Los demás usuarios permanecerán en modo cliente normal y tu sesión se cerrará automáticamente al cerrar la página.
              </p>
            </div>

            {adminState.isAdminOccupiedByOther && (
              <div className="max-w-md mx-auto p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-2 text-left">
                <UserCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-amber-300 block">
                    Ya hay 1 Administrador conectado en este momento
                  </strong>
                  <span>
                    Solo se permite 1 sesión de administrador activa a la vez. Mientras el administrador actual esté conectado, los demás usuarios continúan en modo normal.
                  </span>
                </div>
              </div>
            )}

            <form onSubmit={handleUnlockModal} className="max-w-xs mx-auto space-y-3 pt-2">
              <div className="relative">
                <input
                  type="password"
                  placeholder="****"
                  value={inputPass}
                  onChange={(e) => {
                    setInputPass(e.target.value);
                    if (passError) setPassError(null);
                  }}
                  autoComplete="off"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 text-sm text-white px-3.5 py-2.5 rounded-xl outline-none text-center tracking-widest placeholder:tracking-widest"
                  autoFocus
                />
              </div>

              {passError && (
                <div className="text-xs text-red-400 bg-red-500/10 py-2 px-3 rounded-lg border border-red-500/20">
                  {passError}
                </div>
              )}

              <button
                type="submit"
                disabled={isVerifying}
                className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 disabled:opacity-60 text-slate-950 font-bold py-2.5 px-4 rounded-xl text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
              >
                <KeyRound className="w-4 h-4" />
                <span>
                  {isVerifying ? 'Verificando...' : 'Desbloquear Todo (****)'}
                </span>
              </button>
            </form>
          </div>
        ) : (
          <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Rule note */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-xs text-amber-200">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-amber-300 font-bold block mb-0.5">
                Activación Automática por Inactividad (3 a 5 minutos)
              </strong>
              <span>
                Cuando un cliente te escriba por WhatsApp o pregunte al asistente y pasen entre 3 y 5 minutos sin que puedas atenderle personalmente, el bot tomará el control automáticamente y le ofrecerá programar una cita en los <strong>días y horarios que tú definas aquí</strong>.
              </span>
            </div>
          </div>

          {/* Section 1: Days of Week */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <span>1. Selecciona los Días Disponibles para Atención:</span>
              </label>
              <span className="text-xs text-slate-400">
                Resumen: <strong className="text-emerald-400">{daysSummary}</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
              {config.availableDays.map((day) => (
                <button
                  key={day.dayId}
                  type="button"
                  onClick={() => handleToggleDay(day.dayId)}
                  className={`py-3 px-2 rounded-xl text-xs font-bold transition-all border flex flex-col items-center gap-1 cursor-pointer ${
                    day.enabled
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/10'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span>{day.name}</span>
                  <span className="text-[10px] font-semibold opacity-80">
                    {day.enabled ? '✓ Activo' : 'Cerrado'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Section 2: Time Slots */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>2. Horas y Turnos Disponibles ({config.timeSlots.length} activos):</span>
              </label>
            </div>

            {/* List of slots */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {config.timeSlots.map((slot, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs text-slate-200"
                >
                  <span className="font-semibold">{slot}</span>
                  <button
                    onClick={() => handleRemoveSlot(index)}
                    className="w-7 h-7 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 flex items-center justify-center transition-colors cursor-pointer"
                    title="Eliminar este horario"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add custom slot */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center gap-2">
              <span className="text-xs text-slate-400 shrink-0 font-medium">Agregar nuevo horario:</span>
              <input
                type="text"
                placeholder="02:00 PM"
                value={newSlotStart}
                onChange={(e) => setNewSlotStart(e.target.value)}
                className="w-full sm:w-28 bg-slate-900 border border-slate-700 text-xs text-white px-2.5 py-1.5 rounded-lg outline-none"
              />
              <span className="text-xs text-slate-500">hasta</span>
              <input
                type="text"
                placeholder="03:00 PM"
                value={newSlotEnd}
                onChange={(e) => setNewSlotEnd(e.target.value)}
                className="w-full sm:w-28 bg-slate-900 border border-slate-700 text-xs text-white px-2.5 py-1.5 rounded-lg outline-none"
              />
              <button
                type="button"
                onClick={handleAddSlot}
                className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-400" />
                <span>Añadir</span>
              </button>
            </div>
          </div>

          {/* Section 3: Bot Response Preview */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <Bot className="w-4 h-4 text-emerald-400" />
              <span>Vista Previa: Lo que el bot le responderá al cliente a los 3-5 minutos:</span>
            </div>
            <div className="text-xs text-slate-300 italic bg-slate-900/90 p-3 rounded-xl border border-slate-800 leading-relaxed">
              "¡Hola! Veo que Javier se encuentra atendiendo a otros clientes y han transcurrido más de 3 minutos sin que pueda responderte personalmente. Para respetar tu tiempo y asegurar tu entrega, he activado el sistema de Citas Prioritarias con los días ({daysSummary}) y horas disponibles de Javier. Elige tu horario para confirmar tu turno..."
            </div>
          </div>
        </div>
        )}

        {/* Footer */}
        {isAuth && (
          <div className="p-6 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleReset}
                className={`flex-1 sm:flex-none text-xs flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border transition-colors cursor-pointer ${
                  confirmReset
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold'
                    : 'text-slate-400 hover:text-white border-slate-800 hover:border-slate-700'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{confirmReset ? '¿Confirmar Restauración?' : 'Restaurar Predeterminados'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  logoutOwner('manual');
                  setAdminState(getMultiUserAdminState());
                }}
                className="text-xs text-slate-400 hover:text-amber-300 flex items-center justify-center gap-1 py-2 px-2.5 rounded-lg border border-slate-800 hover:border-amber-500/40 transition-colors cursor-pointer"
                title="Cerrar sesión única de administrador y bloquear panel"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Cerrar Sesión Admin</span>
              </button>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none text-xs text-slate-300 hover:text-white py-2.5 px-4 rounded-xl border border-slate-700 hover:border-slate-600 transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleSave}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 px-5 rounded-xl text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
              >
                {savedToast ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>¡Horarios Guardados!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Guardar Mis Horarios</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
