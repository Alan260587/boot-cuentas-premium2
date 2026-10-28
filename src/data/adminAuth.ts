import { syncScheduleFromServer } from './scheduleConfig';
import { syncCatalogFromServer } from './catalog';

const LEGACY_STORAGE_KEY = 'sdp_admin_auth_1987';

// Unique per-page-load session ID (in memory only, never persisted across page close/reload)
const currentSessionId =
  typeof window !== 'undefined'
    ? `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
    : 'server_sess';

let isAuthenticatedMemory = false;
let currentAdminToken: string | null = null;
let isAdminOccupiedByOtherMemory = false;
let activeUsersCountMemory = 1;
let heartbeatInitialized = false;

export interface AdminLoginResult {
  ok: boolean;
  reason?: 'invalid_password' | 'already_occupied' | 'network_error';
  message?: string;
}

export interface MultiUserAdminState {
  isAuthenticated: boolean;
  isAdminOccupiedByOther: boolean;
  activeUsersCount: number;
  sessionId: string;
}

function clearLegacyStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(LEGACY_STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // Ignore storage access errors
  }
}

function notifyStateChange(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event('admin_auth_state_changed'));
}

export function isOwnerAuthenticated(): boolean {
  return isAuthenticatedMemory;
}

export function getMultiUserAdminState(): MultiUserAdminState {
  return {
    isAuthenticated: isAuthenticatedMemory,
    isAdminOccupiedByOther: isAdminOccupiedByOtherMemory,
    activeUsersCount: activeUsersCountMemory,
    sessionId: currentSessionId,
  };
}

export async function verifyOwnerPasswordAsync(
  inputPassword: string
): Promise<AdminLoginResult> {
  const cleanPassword = inputPassword.trim();
  if (!cleanPassword) {
    return {
      ok: false,
      reason: 'invalid_password',
      message: 'Acceso incorrecto. Ingresa ****.',
    };
  }

  try {
    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: currentSessionId,
        password: cleanPassword,
      }),
    });

    const data = await response.json();

    if (response.ok && data.ok) {
      isAuthenticatedMemory = true;
      currentAdminToken = data.adminToken || null;
      isAdminOccupiedByOtherMemory = false;
      if (typeof data.activeUsersCount === 'number') {
        activeUsersCountMemory = data.activeUsersCount;
      }
      clearLegacyStorage();
      notifyStateChange();
      return { ok: true };
    }

    if (response.status === 409 || data.reason === 'already_occupied') {
      isAuthenticatedMemory = false;
      currentAdminToken = null;
      isAdminOccupiedByOtherMemory = true;
      notifyStateChange();
      return {
        ok: false,
        reason: 'already_occupied',
        message:
          data.message ||
          'Ya hay 1 Administrador conectado en este momento. Solo se permite un administrador activo a la vez.',
      };
    }

    return {
      ok: false,
      reason: 'invalid_password',
      message: data.message || 'Acceso incorrecto. Ingresa ****.',
    };
  } catch {
    return {
      ok: false,
      reason: 'network_error',
      message: 'No se pudo verificar la sesión en el servidor. Intenta de nuevo.',
    };
  }
}

export function logoutOwner(reason: 'manual' | 'page_close' = 'manual'): void {
  const tokenToRelease = currentAdminToken;
  isAuthenticatedMemory = false;
  currentAdminToken = null;
  clearLegacyStorage();
  notifyStateChange();

  if (typeof window === 'undefined') return;

  const payload = JSON.stringify({
    sessionId: currentSessionId,
    adminToken: tokenToRelease,
    reason,
  });

  if (reason === 'page_close' && typeof navigator !== 'undefined' && navigator.sendBeacon) {
    try {
      const blob = new Blob([payload], { type: 'text/plain;charset=UTF-8' });
      navigator.sendBeacon('/api/admin/logout', blob);
      return;
    } catch {
      // Fallback to fetch keepalive below
    }
  }

  fetch('/api/admin/logout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
    keepalive: true,
  }).catch(() => {});
}

async function runSessionHeartbeat(): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const res = await fetch('/api/session/heartbeat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: currentSessionId,
        adminToken: currentAdminToken,
      }),
    });
    if (!res.ok) return;
    const data = await res.json();

    let changed = false;

    if (typeof data.activeUsersCount === 'number' && data.activeUsersCount !== activeUsersCountMemory) {
      activeUsersCountMemory = data.activeUsersCount;
      changed = true;
    }

    const occupiedByOther = Boolean(data.isAdminOccupiedByOther);
    if (occupiedByOther !== isAdminOccupiedByOtherMemory) {
      isAdminOccupiedByOtherMemory = occupiedByOther;
      changed = true;
    }

    // If this client thought it was admin, but server lock expired or was reset
    if (isAuthenticatedMemory && !data.isYouAdmin) {
      isAuthenticatedMemory = false;
      currentAdminToken = null;
      changed = true;
    }

    if (data.scheduleConfig) {
      syncScheduleFromServer(data.scheduleConfig);
    }

    if (Array.isArray(data.catalogProducts)) {
      syncCatalogFromServer(data.catalogProducts);
    }

    if (changed) {
      notifyStateChange();
    }
  } catch {
    // Ignore transient network errors during heartbeat
  }
}

export function initMultiUserSessionManager(): void {
  if (typeof window === 'undefined' || heartbeatInitialized) return;
  heartbeatInitialized = true;

  // Ensure any previous session storage is wiped on page load so every reload/open starts locked
  clearLegacyStorage();
  isAuthenticatedMemory = false;
  currentAdminToken = null;

  // Initial heartbeat immediately
  runSessionHeartbeat();

  // Periodic heartbeat every 3.5 seconds for real-time multi-user & single-admin sync
  window.setInterval(runSessionHeartbeat, 3500);

  // Automatic logout when closing or reloading the page/tab
  const handlePageUnload = () => {
    logoutOwner('page_close');
  };

  window.addEventListener('pagehide', handlePageUnload);
  window.addEventListener('beforeunload', handlePageUnload);
}

// Auto-initialize in browser environment
if (typeof window !== 'undefined') {
  initMultiUserSessionManager();
}
