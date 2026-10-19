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
import { isOwnerAuthenticated, verifyOwnerPassword, logoutOwner } from '../data/adminAuth';
import { Lock, KeyRound, AlertCircle, Eye, EyeOff } from 'lucide-react';

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
  const [isAuth, setIsAuth] = useState(false);
  const [inputPass, setInputPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [passError, setPassError] = useState<string | null>(null);

  const [config, setConfig] = useState<ScheduleConfig>(getSavedScheduleConfig());
  const [newSlotStart, setNewSlotStart] = useState('02:00 PM');
  const [newSlotEnd, setNewSlotEnd] = useState('03:00 PM');
  const [savedToast, setSavedToast] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAuth(isOwnerAuthenticated());
      setConfig(getSavedScheduleConfig());
      setInputPass('');
      setPassError(null);
      setConfirmReset(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUnlockModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyOwnerPassword(inputPass)) {
      setIsAuth(true);
      setPassError(null);
      setInputPass('');
    } else {
      setPassError('Contraseña incorrecta. Clave de acceso autorizada: 1987.');
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
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">
                  Panel de Disponibilidad: Días y Horarios
                </h3>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded border border-emerald-500/30">
                  Titular: {OFFICIAL_BENEFICIARY}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Configura cuándo estás disponible para que el bot agende citas automáticamente si no respondes en 3 a 5 minutos.
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
                Desbloqueo Unificado • Clave Única 1987
              </span>
              <h4 className="text-lg font-bold text-white mt-2">
                Ingresa la Clave Única (1987)
              </h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Ingresa la clave exclusiva <strong>1987</strong> para desbloquear simultáneamente el panel de horarios, las guías previas, la plantilla de ausencia y el simulador de WhatsApp.
              </p>
            </div>

            <form onSubmit={handleUnlockModal} className="max-w-xs mx-auto space-y-3 pt-2">
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Clave única: 1987"
                  value={inputPass}
                  onChange={(e) => {
                    setInputPass(e.target.value);
                    if (passError) setPassError(null);
                  }}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 text-sm text-white px-3.5 py-2.5 rounded-xl outline-none pr-10 text-center tracking-widest"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-white"
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {passError && (
                <div className="text-xs text-red-400 bg-red-500/10 py-1.5 px-3 rounded-lg border border-red-500/20">
                  {passError}
                </div>
              )}

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 font-bold py-2.5 px-4 rounded-xl text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
              >
                <KeyRound className="w-4 h-4" />
                <span>Desbloquear Todo (1987)</span>
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
                  logoutOwner();
                  setIsAuth(false);
                }}
                className="text-xs text-slate-400 hover:text-amber-300 flex items-center justify-center gap-1 py-2 px-2.5 rounded-lg border border-slate-800 hover:border-amber-500/40 transition-colors cursor-pointer"
                title="Bloquear panel con contraseña"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Bloquear</span>
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
