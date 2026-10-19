import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export interface DevicePlatformInfo {
  os: 'Android' | 'iOS' | 'Windows' | 'macOS' | 'Linux' | 'Otro';
  deviceType: 'Móvil' | 'Tablet' | 'Escritorio';
  browser: 'Chrome' | 'Safari' | 'Edge' | 'Firefox' | 'Opera' | 'Navegador Web';
  isAndroid: boolean;
  isIOS: boolean;
  isMobile: boolean;
  isDesktop: boolean;
  isStandalone: boolean;
  isOnline: boolean;
  platformBadge: string;
}

export function detectDeviceAndOS(): Omit<DevicePlatformInfo, 'isStandalone' | 'isOnline'> {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      os: 'Web' as any,
      deviceType: 'Escritorio',
      browser: 'Navegador Web',
      isAndroid: false,
      isIOS: false,
      isMobile: false,
      isDesktop: true,
      platformBadge: '💻 Web Escritorio',
    };
  }

  const ua = navigator.userAgent || '';
  const uaLower = ua.toLowerCase();
  const maxTouch = navigator.maxTouchPoints || 0;

  // Detect iOS (including iPadOS 13+ which reports Macintosh with touch points)
  const isIOS =
    /iphone|ipad|ipod/.test(uaLower) ||
    (uaLower.includes('macintosh') && maxTouch > 1);

  const isAndroid = /android/.test(uaLower);

  let os: DevicePlatformInfo['os'] = 'Otro';
  if (isAndroid) {
    os = 'Android';
  } else if (isIOS) {
    os = 'iOS';
  } else if (uaLower.includes('win')) {
    os = 'Windows';
  } else if (uaLower.includes('mac')) {
    os = 'macOS';
  } else if (uaLower.includes('linux')) {
    os = 'Linux';
  }

  // Detect Device Type
  const isTablet =
    /ipad|tablet|playbook|silk/.test(uaLower) ||
    (uaLower.includes('macintosh') && maxTouch > 1) ||
    (isAndroid && !uaLower.includes('mobile'));

  let deviceType: DevicePlatformInfo['deviceType'] = 'Escritorio';
  if (isTablet) {
    deviceType = 'Tablet';
  } else if (isIOS || isAndroid || /mobile|iemobile|opera mini/.test(uaLower)) {
    deviceType = 'Móvil';
  }

  // Detect Browser
  let browser: DevicePlatformInfo['browser'] = 'Navegador Web';
  if (uaLower.includes('edg/')) {
    browser = 'Edge';
  } else if (uaLower.includes('opr/') || uaLower.includes('opera')) {
    browser = 'Opera';
  } else if (uaLower.includes('chrome') && !uaLower.includes('edg/')) {
    browser = 'Chrome';
  } else if (uaLower.includes('firefox')) {
    browser = 'Firefox';
  } else if (uaLower.includes('safari') && !uaLower.includes('chrome')) {
    browser = 'Safari';
  }

  const isMobile = deviceType === 'Móvil' || deviceType === 'Tablet';
  const isDesktop = !isMobile;

  const icon = isAndroid ? '🤖' : isIOS ? '🍎' : '💻';
  const platformBadge = `${icon} ${os} • ${deviceType} (${browser})`;

  return {
    os,
    deviceType,
    browser,
    isAndroid,
    isIOS,
    isMobile,
    isDesktop,
    platformBadge,
  };
}

export function useDeviceAndPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [deviceInfo, setDeviceInfo] = useState(() => detectDeviceAndOS());

  useEffect(() => {
    setDeviceInfo(detectDeviceAndOS());

    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
      return true;
    }
    return false;
  };

  return {
    ...deviceInfo,
    isStandalone: isInstalled,
    isInstalled,
    isInstallable: !!deferredPrompt,
    isOnline,
    installApp,
  };
}
