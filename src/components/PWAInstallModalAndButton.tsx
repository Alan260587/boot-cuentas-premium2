import React, { useState } from 'react';
import {
  Smartphone,
  Monitor,
  Download,
  Share,
  PlusSquare,
  CheckCircle2,
  X,
  WifiOff,
  Cpu,
  Globe,
  MoreVertical,
} from 'lucide-react';
import { useDeviceAndPWA } from '../utils/deviceDetector';

export const PWAInstallModalAndButton: React.FC<{ variant?: 'header' | 'banner' }> = ({
  variant = 'header',
}) => {
  const {
    os,
    deviceType,
    browser,
    isAndroid,
    isIOS,
    isInstallable,
    isInstalled,
    isOnline,
    platformBadge,
    installApp,
  } = useDeviceAndPWA();

  const [showGuideModal, setShowGuideModal] = useState(false);

  const handleInstallClick = async () => {
    if (isInstallable) {
      await installApp();
    } else {
      setShowGuideModal(true);
    }
  };

  if (variant === 'banner') {
    return (
      <>
        {!isOnline && (
          <div className="bg-amber-500 text-slate-950 px-4 py-1.5 text-xs font-extrabold flex items-center justify-center gap-2 shadow-md">
            <WifiOff className="w-3.5 h-3.5" />
            <span>Modo Sin Conexión (Offline Activo) — Consultando catálogo y horarios guardados en tu dispositivo.</span>
          </div>
        )}

        <div className="bg-slate-900/90 border-b border-slate-800/80 px-4 py-1.5 text-[11px] text-slate-300">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                <Cpu className="w-3 h-3" />
                <span>Sistema Autodetectado:</span>
              </span>
              <span className="font-semibold text-white">{platformBadge}</span>
              <span className="hidden sm:inline text-slate-500">•</span>
              <span className="hidden sm:inline text-slate-400">
                Optimizado para Android, iOS y Web
              </span>
            </div>

            <div className="flex items-center gap-2">
              {isInstalled ? (
                <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>App Instalada ({os})</span>
                </span>
              ) : (
                <button
                  onClick={handleInstallClick}
                  className="inline-flex items-center gap-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-md font-bold transition-colors cursor-pointer"
                >
                  <Download className="w-3 h-3" />
                  <span>
                    {isIOS
                      ? 'Instalar en iPhone / iPad'
                      : isAndroid
                      ? 'Instalar App en Android'
                      : `Instalar App en ${os}`}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>

        {showGuideModal && (
          <InstallGuideModal
            os={os}
            deviceType={deviceType}
            browser={browser}
            isIOS={isIOS}
            isAndroid={isAndroid}
            onClose={() => setShowGuideModal(false)}
          />
        )}
      </>
    );
  }

  // Header button variant
  if (isInstalled) {
    return (
      <div
        className="hidden xl:flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-2.5 py-1.5 rounded-xl text-xs font-semibold"
        title={`Ejecutando como App nativa en ${os} (${deviceType})`}
      >
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        <span>App {os}</span>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={handleInstallClick}
        className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 hover:from-cyan-500/30 hover:to-emerald-500/30 border border-cyan-500/40 text-cyan-300 font-bold px-2.5 py-2 rounded-xl text-xs transition-all cursor-pointer shrink-0"
        title={`Instalar aplicación en tu ${deviceType} (${os})`}
      >
        {isIOS || isAndroid ? (
          <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
        ) : (
          <Monitor className="w-3.5 h-3.5 text-cyan-400" />
        )}
        <span className="hidden md:inline">
          {isIOS ? 'App iOS' : isAndroid ? 'App Android' : 'Instalar App'}
        </span>
      </button>

      {showGuideModal && (
        <InstallGuideModal
          os={os}
          deviceType={deviceType}
          browser={browser}
          isIOS={isIOS}
          isAndroid={isAndroid}
          onClose={() => setShowGuideModal(false)}
        />
      )}
    </>
  );
};

interface InstallGuideModalProps {
  os: string;
  deviceType: string;
  browser: string;
  isIOS: boolean;
  isAndroid: boolean;
  onClose: () => void;
}

const InstallGuideModal: React.FC<InstallGuideModalProps> = ({
  os,
  deviceType,
  browser,
  isIOS,
  isAndroid,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              {isIOS || isAndroid ? (
                <Smartphone className="w-5 h-5" />
              ) : (
                <Monitor className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">
                Instalar App en {os} ({deviceType})
              </h3>
              <p className="text-[11px] text-emerald-400 font-semibold">
                Sistema detectado: {os} • {browser}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isIOS ? (
          <div className="space-y-3 text-xs text-slate-200">
            <p className="text-slate-300 leading-relaxed">
              Para instalar <strong>Servicios Digitales Premium</strong> en la pantalla de inicio de tu <strong>iPhone o iPad</strong>:
            </p>
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0">
                  1
                </span>
                <span className="flex items-center gap-1.5">
                  Toca el botón <strong>Compartir</strong> <Share className="w-4 h-4 text-cyan-400 inline" /> en la barra de Safari.
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0">
                  2
                </span>
                <span className="flex items-center gap-1.5">
                  Desliza hacia abajo y selecciona <strong>"Agregar a Inicio"</strong> <PlusSquare className="w-4 h-4 text-emerald-400 inline" />.
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0">
                  3
                </span>
                <span>
                  Pulsa <strong>"Agregar"</strong> en la esquina superior derecha.
                </span>
              </div>
            </div>
          </div>
        ) : isAndroid ? (
          <div className="space-y-3 text-xs text-slate-200">
            <p className="text-slate-300 leading-relaxed">
              Para instalar la aplicación en tu teléfono o tablet <strong>Android</strong>:
            </p>
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0">
                  1
                </span>
                <span className="flex items-center gap-1.5">
                  Toca el menú de 3 puntos <MoreVertical className="w-4 h-4 text-cyan-400 inline" /> arriba a la derecha en Chrome.
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0">
                  2
                </span>
                <span className="flex items-center gap-1.5">
                  Elige <strong>"Instalar aplicación"</strong> o <strong>"Agregar a la pantalla principal"</strong>.
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3 text-xs text-slate-200">
            <p className="text-slate-300 leading-relaxed">
              Para instalar la aplicación web en tu equipo <strong>{os} ({browser})</strong>:
            </p>
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0">
                  1
                </span>
                <span>
                  Haz clic en el ícono de <strong>Instalar</strong> <Download className="w-3.5 h-3.5 text-cyan-400 inline" /> situado en el lado derecho de la barra de direcciones de tu navegador.
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0">
                  2
                </span>
                <span>
                  Confirma haciendo clic en <strong>"Instalar"</strong> para abrirla como aplicación directa en tu escritorio.
                </span>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
        >
          Entendido
        </button>
      </div>
    </div>
  );
};
