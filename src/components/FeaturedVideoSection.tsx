import React, { useState, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  ExternalLink,
  Tv,
  ShieldCheck,
  MessageCircle,
  Sparkles,
} from 'lucide-react';
import { buildWhatsAppLink } from '../data/catalog';

const YOUTUBE_VIDEO_ID = 'XG1GUEodSX0';
const YOUTUBE_WATCH_URL = `https://www.youtube.com/watch?v=${YOUTUBE_VIDEO_ID}`;
const YOUTUBE_THUMBNAIL_HQ = `https://i.ytimg.com/vi/${YOUTUBE_VIDEO_ID}/hqdefault.jpg`;

export const FeaturedVideoSection: React.FC = () => {
  // Never auto-plays on page load; only starts when the user explicitly clicks Play
  const [hasStarted, setHasStarted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCinemaMode, setIsCinemaMode] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const playerContainerRef = useRef<HTMLDivElement | null>(null);

  const sendYouTubeCommand = (func: string, args: unknown[] = []) => {
    if (!iframeRef.current || !iframeRef.current.contentWindow) return;
    iframeRef.current.contentWindow.postMessage(
      JSON.stringify({
        event: 'command',
        func,
        args,
      }),
      '*'
    );
  };

  const handlePlay = () => {
    if (!hasStarted) {
      setHasStarted(true);
      setIsPlaying(true);
      return;
    }
    sendYouTubeCommand('playVideo');
    setIsPlaying(true);
  };

  const handlePause = () => {
    sendYouTubeCommand('pauseVideo');
    setIsPlaying(false);
  };

  const handleTogglePlayPause = () => {
    if (!hasStarted || !isPlaying) {
      handlePlay();
    } else {
      handlePause();
    }
  };

  const handleStopAndReset = () => {
    sendYouTubeCommand('stopVideo');
    setIsPlaying(false);
    setHasStarted(false);
    setIsMuted(false);
  };

  const handleToggleMute = () => {
    if (!hasStarted) return;
    if (isMuted) {
      sendYouTubeCommand('unMute');
      setIsMuted(false);
    } else {
      sendYouTubeCommand('mute');
      setIsMuted(true);
    }
  };

  const handleFullscreen = () => {
    const el = playerContainerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else if (el.requestFullscreen) {
      el.requestFullscreen().catch(() => {});
    }
  };

  return (
    <section
      id="video-oficial"
      className="py-10 sm:py-16 relative overflow-hidden border-y border-slate-800/80 bg-gradient-to-b from-slate-950 via-slate-900/60 to-slate-950"
    >
      {/* Ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[750px] h-[420px] bg-gradient-to-tr from-emerald-500/10 via-cyan-500/10 to-teal-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div
        className={`mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-300 ${
          isCinemaMode ? 'max-w-[96vw]' : 'max-w-6xl'
        }`}
      >
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 sm:mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold mb-3">
              <Tv className="w-3.5 h-3.5 text-emerald-400" />
              <span>REPRODUCTOR MULTIMEDIA OFICIAL • REPRODUCCIÓN MANUAL</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <span>Presentación y Demostración en Video</span>
              <Sparkles className="w-6 h-6 text-emerald-400 shrink-0 hidden sm:inline" />
            </h2>
            <p className="mt-1.5 text-sm sm:text-base text-slate-300 max-w-2xl">
              Presiona el botón <strong className="text-emerald-400">Play (Reproducir)</strong> cuando desees iniciar el video. El reproductor está configurado en formato grande de alta definición y no se reproduce solo.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsCinemaMode((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 transition-all cursor-pointer"
              title="Cambiar entre tamaño grande y modo cine extra grande"
            >
              {isCinemaMode ? (
                <>
                  <Minimize2 className="w-4 h-4 text-cyan-400" />
                  <span>Tamaño Grande Estándar</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-4 h-4 text-cyan-400" />
                  <span>Expandir Modo Cine</span>
                </>
              )}
            </button>

            <a
              href={YOUTUBE_WATCH_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-all"
            >
              <ExternalLink className="w-4 h-4 text-emerald-400" />
              <span>Abrir en YouTube</span>
            </a>
          </div>
        </div>

        {/* Large Cinema Player Frame */}
        <div
          ref={playerContainerRef}
          className="rounded-3xl bg-slate-900/95 border-2 border-slate-800 hover:border-emerald-500/40 shadow-2xl shadow-emerald-950/50 overflow-hidden transition-all"
        >
          {/* Top Player Status Bar */}
          <div className="px-4 sm:px-6 py-3 bg-slate-950/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    hasStarted && isPlaying
                      ? 'bg-emerald-400 animate-pulse'
                      : 'bg-amber-400'
                  }`}
                />
                <span className="text-xs sm:text-sm font-bold text-white">
                  {hasStarted
                    ? isPlaying
                      ? 'Reproduciendo Video Oficial'
                      : 'Video en Pausa'
                    : 'Listo para reproducir (Esperando clic en Play)'}
                </span>
              </div>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                <ShieldCheck className="w-3 h-3" /> Sin Autoplay Automático
              </span>
            </div>

            <div className="text-xs text-slate-400 font-medium">
              Formato Grande 16:9 • Sonido Activo al dar Play
            </div>
          </div>

          {/* Main Video Viewport (Large Responsive 16:9 Container) */}
          <div
            className={`relative w-full aspect-video bg-slate-950 overflow-hidden ${
              isCinemaMode
                ? 'min-h-[340px] sm:min-h-[560px] lg:min-h-[720px]'
                : 'min-h-[280px] sm:min-h-[460px] lg:min-h-[600px]'
            }`}
          >
            {!hasStarted ? (
              /* Interactive Cover Screen - Guarantees NO Autoplay until User Clicks Play */
              <div
                onClick={handlePlay}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handlePlay();
                  }
                }}
                aria-label="Reproducir video oficial"
                className="group relative w-full h-full flex flex-col items-center justify-center cursor-pointer select-none overflow-hidden"
              >
                {/* Video Thumbnail Background */}
                <img
                  src={YOUTUBE_THUMBNAIL_HQ}
                  alt="Vista previa del video oficial"
                  className="absolute inset-0 w-full h-full object-cover object-center scale-105 group-hover:scale-110 transition-transform duration-700 opacity-65"
                />

                {/* Dark Cinema Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/55 to-slate-950/60 group-hover:via-slate-950/40 transition-colors duration-300" />

                {/* Center Big Play Button */}
                <div className="relative z-10 flex flex-col items-center text-center px-4">
                  <div className="relative flex items-center justify-center">
                    <span className="absolute -inset-4 rounded-full bg-emerald-500/25 blur-xl group-hover:bg-emerald-400/40 transition-all duration-300 animate-pulse" />
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-400 text-slate-950 flex items-center justify-center shadow-2xl shadow-emerald-500/40 group-hover:scale-110 active:scale-95 transition-all duration-300 border-4 border-white/90">
                      <Play className="w-11 h-11 sm:w-13 sm:h-13 fill-slate-950 ml-1.5" />
                    </div>
                  </div>

                  <span className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-950/90 border border-emerald-500/50 text-white font-extrabold text-sm sm:text-lg shadow-xl group-hover:border-emerald-400 group-hover:text-emerald-300 transition-all">
                    <Play className="w-4 h-4 fill-emerald-400 text-emerald-400" />
                    <span>Haz clic aquí para dar PLAY y reproducir el video</span>
                  </span>

                  <p className="mt-2.5 text-xs sm:text-sm text-slate-300 font-medium max-w-md">
                    El video no se reproduce automáticamente. Inicia únicamente cuando tú presionas Play.
                  </p>
                </div>
              </div>
            ) : (
              /* Active YouTube Embed Player - Mounted and Played upon User Click */
              <iframe
                ref={iframeRef}
                className="w-full h-full border-0"
                src={`https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?autoplay=1&enablejsapi=1&rel=0&modestbranding=1&playsinline=1`}
                title="Reproductor Oficial Servicios Digitales Premium"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            )}
          </div>

          {/* Bottom Control Deck */}
          <div className="px-4 sm:px-6 py-4 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {/* Primary Play / Pause Button */}
              <button
                type="button"
                onClick={handleTogglePlayPause}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm transition-all cursor-pointer shadow-lg ${
                  !hasStarted || !isPlaying
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-500/20'
                    : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                }`}
              >
                {!hasStarted || !isPlaying ? (
                  <>
                    <Play className="w-4 h-4 fill-slate-950" />
                    <span>Reproducir (Play)</span>
                  </>
                ) : (
                  <>
                    <Pause className="w-4 h-4 fill-slate-950" />
                    <span>Pausar Video</span>
                  </>
                )}
              </button>

              {/* Stop & Reset to Cover */}
              {hasStarted && (
                <button
                  type="button"
                  onClick={handleStopAndReset}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 transition-all cursor-pointer"
                  title="Detener video y regresar a la portada"
                >
                  <RotateCcw className="w-4 h-4 text-cyan-400" />
                  <span>Detener / Reiniciar</span>
                </button>
              )}

              {/* Mute / Unmute */}
              {hasStarted && (
                <button
                  type="button"
                  onClick={handleToggleMute}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 transition-all cursor-pointer"
                >
                  {isMuted ? (
                    <>
                      <VolumeX className="w-4 h-4 text-red-400" />
                      <span>Activar Sonido</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4 text-emerald-400" />
                      <span>Silenciar</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Right Actions: Fullscreen & WhatsApp CTA */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleFullscreen}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer"
                title="Ver reproductor en pantalla completa"
              >
                <Maximize2 className="w-4 h-4 text-emerald-400" />
                <span>Pantalla Completa</span>
              </button>

              <a
                href={buildWhatsAppLink(
                  '¡Hola! Acabo de ver el video oficial en la página web y me gustaría recibir información sobre sus servicios.'
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 transition-all"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Consultar por WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
