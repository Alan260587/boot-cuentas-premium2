import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { syncCatalogFromServer } from './catalog';
import { syncScheduleFromServer } from './scheduleConfig';

export const ADMIN_AUTH_CHANGE_EVENT = 'sdp-admin-auth-changed';
export const ADMIN_PRESENCE_EVENT = 'sdp-admin-presence-updated';
export const LEGACY_ADMIN_AUTH_EVENT = 'admin_auth_state_changed';

const LOCAL_ADMIN_LOCK_KEY = 'sdp_active_admin_lock_v1';
const LOCAL_ADMIN_LOCK_TTL_MS = 14000;

// Unique transient session ID for this browser tab (never persisted across reloads/closes)
const CLIENT_SESSION_ID = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

// Strictly in-memory authentication state so closing or reloading the page automatically logs out
let isAuthenticatedMemory = false;
let currentAdminToken: string | null = null;
let isAdminOccupiedByOther = false;
let isCloudAdminOccupiedByOther = false;
let activeConnectedUsersCount = 1;
let heartbeatIntervalId: number | null = null;
let adminLockUnsubscribe: (() => void) | null = null;

interface LocalAdminLock {
  sessionId: string;
  token: string;
  lastSeen: number;
}

export interface AdminPresenceState {
  sessionId: string;
  isAuthenticated: boolean;
  isYouAdmin: boolean;
  isAdminOccupiedByOther: boolean;
  activeUsersCount: number;
}

export type MultiUserAdminState = AdminPresenceState;

export interface AdminLoginResult {
  ok: boolean;
  reason?: 'invalid_password' | 'already_occupied' | 'network_error';
  message: string;
}

export const ADMIN_PIN_CODE = '1987';

export function isExpectedOwnerPin(input: string): boolean {
  return String(input ?? '').trim() === ADMIN_PIN_CODE;
}

export function verifyOwnerPassword(inputPassword: string): boolean {
  return isExpectedOwnerPin(inputPassword);
}

function readLocalAdminLock(): LocalAdminLock | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(LOCAL_ADMIN_LOCK_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LocalAdminLock;
    if (!parsed || typeof parsed.sessionId !== 'string' || typeof parsed.lastSeen !== 'number') {
      return null;
    }
    if (Date.now() - parsed.lastSeen > LOCAL_ADMIN_LOCK_TTL_MS) {
      window.localStorage.removeItem(LOCAL_ADMIN_LOCK_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeLocalAdminLock(token: string): void {
  if (typeof window === 'undefined') return;
  try {
    const payload: LocalAdminLock = {
      sessionId: CLIENT_SESSION_ID,
      token,
      lastSeen: Date.now(),
    };
    window.localStorage.setItem(LOCAL_ADMIN_LOCK_KEY, JSON.stringify(payload));
  } catch {
    // ignore storage errors
  }
}

function clearLocalAdminLockIfOwned(): void {
  if (typeof window === 'undefined') return;
  try {
    const current = readLocalAdminLock();
    if (current && current.sessionId === CLIENT_SESSION_ID) {
      window.localStorage.removeItem(LOCAL_ADMIN_LOCK_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

function isLocalLockOccupiedByOtherTab(): boolean {
  const lock = readLocalAdminLock();
  return Boolean(lock && lock.sessionId !== CLIENT_SESSION_ID);
}

async function writeCloudAdminLock(locked: boolean, token: string): Promise<void> {
  if (typeof window === 'undefined') return;
  const path = 'appConfig/adminLock';
  try {
    await setDoc(doc(db, 'appConfig', 'adminLock'), {
      sessionId: locked ? CLIENT_SESSION_ID : '',
      token: locked ? token : '',
      lastSeen: Date.now(),
      locked,
      authCode: ADMIN_PIN_CODE,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

function notifyAuthAndPresenceListeners(): void {
  if (typeof window === 'undefined') return;
  const detail: AdminPresenceState = getAdminPresenceState();
  window.dispatchEvent(new CustomEvent(ADMIN_AUTH_CHANGE_EVENT, { detail }));
  window.dispatchEvent(new CustomEvent(ADMIN_PRESENCE_EVENT, { detail }));
  window.dispatchEvent(new CustomEvent(LEGACY_ADMIN_AUTH_EVENT, { detail }));
}

export function getClientSessionId(): string {
  return CLIENT_SESSION_ID;
}

export function getAdminPresenceState(): AdminPresenceState {
  const localOther = isLocalLockOccupiedByOtherTab();
  const occupied =
    !isAuthenticatedMemory &&
    (isAdminOccupiedByOther || isCloudAdminOccupiedByOther || localOther);
  const totalUsers = Math.max(1, activeConnectedUsersCount);
  return {
    sessionId: CLIENT_SESSION_ID,
    isAuthenticated: isAuthenticatedMemory,
    isYouAdmin: isAuthenticatedMemory,
    isAdminOccupiedByOther: occupied,
    activeUsersCount: totalUsers,
  };
}

export function getMultiUserAdminState(): MultiUserAdminState {
  return getAdminPresenceState();
}

export function isOwnerAuthenticated(): boolean {
  return isAuthenticatedMemory;
}

export function setOwnerAuthenticated(authenticated: boolean): void {
  isAuthenticatedMemory = authenticated;
  if (!authenticated) {
    currentAdminToken = null;
    clearLocalAdminLockIfOwned();
    writeCloudAdminLock(false, '');
  }
  notifyAuthAndPresenceListeners();
}

export async function verifyOwnerPasswordAsync(inputPassword: string): Promise<AdminLoginResult> {
  const cleanPassword = (inputPassword ?? '').trim();

  if (!isExpectedOwnerPin(cleanPassword)) {
    return {
      ok: false,
      reason: 'invalid_password',
      message: 'Acceso incorrecto. Ingresa ****.',
    };
  }

  // Check if another tab or device is already logged in as Admin
  if (isLocalLockOccupiedByOtherTab() || isCloudAdminOccupiedByOther) {
    isAdminOccupiedByOther = true;
    notifyAuthAndPresenceListeners();
    return {
      ok: false,
      reason: 'already_occupied',
      message:
        'Ya hay 1 Administrador conectado en este momento. Solo se permite un administrador activo a la vez.',
    };
  }

  try {
    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: CLIENT_SESSION_ID,
        password: cleanPassword,
      }),
    });

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await response.json();

      if (response.ok && data?.ok) {
        const token: string =
          typeof data.adminToken === 'string' && data.adminToken
            ? data.adminToken
            : `adm_v1_${CLIENT_SESSION_ID.replace(/[^a-zA-Z0-9_-]/g, '')}_${Date.now()}`;
        isAuthenticatedMemory = true;
        currentAdminToken = token;
        isAdminOccupiedByOther = false;
        isCloudAdminOccupiedByOther = false;
        if (typeof data.activeUsersCount === 'number') {
          activeConnectedUsersCount = Math.max(1, data.activeUsersCount);
        }
        writeLocalAdminLock(token);
        await writeCloudAdminLock(true, token);
        notifyAuthAndPresenceListeners();
        return {
          ok: true,
          message: 'Sesión de Administrador iniciada correctamente.',
        };
      }

      if (response.status === 409 || data?.reason === 'already_occupied') {
        isAuthenticatedMemory = false;
        currentAdminToken = null;
        isAdminOccupiedByOther = true;
        notifyAuthAndPresenceListeners();
        return {
          ok: false,
          reason: 'already_occupied',
          message:
            data?.message ||
            'Ya hay 1 Administrador conectado en este momento. Solo se permite un administrador activo a la vez.',
        };
      }

      if (response.status === 401 || data?.reason === 'invalid_password') {
        return {
          ok: false,
          reason: 'invalid_password',
          message: 'Acceso incorrecto. Ingresa ****.',
        };
      }
    }
  } catch {
    // Fallback below for Vercel serverless cold start or static edge routing
  }

  // Fallback activation when PIN is verified via isExpectedOwnerPin and no other admin is active
  const fallbackToken = `adm_v1_${CLIENT_SESSION_ID.replace(/[^a-zA-Z0-9_-]/g, '')}_${Date.now()}`;
  isAuthenticatedMemory = true;
  currentAdminToken = fallbackToken;
  isAdminOccupiedByOther = false;
  isCloudAdminOccupiedByOther = false;
  writeLocalAdminLock(fallbackToken);
  await writeCloudAdminLock(true, fallbackToken);
  notifyAuthAndPresenceListeners();

  return {
    ok: true,
    message: 'Sesión de Administrador iniciada correctamente.',
  };
}

export function logoutOwnerSession(reason: 'manual' | 'page_close' = 'manual'): void {
  const tokenToRelease = currentAdminToken;
  const wasAdmin = isAuthenticatedMemory;

  isAuthenticatedMemory = false;
  currentAdminToken = null;
  clearLocalAdminLockIfOwned();
  if (wasAdmin) {
    writeCloudAdminLock(false, '');
  }
  notifyAuthAndPresenceListeners();

  const payload = JSON.stringify({
    sessionId: CLIENT_SESSION_ID,
    adminToken: tokenToRelease,
    reason,
  });

  if (reason === 'page_close' && typeof navigator !== 'undefined' && navigator.sendBeacon) {
    try {
      const blob = new Blob([payload], { type: 'text/plain;charset=UTF-8' });
      navigator.sendBeacon('/api/admin/logout', blob);
      return;
    } catch {
      // fallback to fetch keepalive below
    }
  }

  if (wasAdmin || reason === 'page_close') {
    fetch('/api/admin/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  }
}

export function logoutOwner(reason: 'manual' | 'page_close' = 'manual'): void {
  logoutOwnerSession(reason);
}

async function runSessionHeartbeat(): Promise<void> {
  // Keep local tab lock and cloud lock fresh if we are the active administrator
  if (isAuthenticatedMemory && currentAdminToken) {
    writeLocalAdminLock(currentAdminToken);
    writeCloudAdminLock(true, currentAdminToken);
  }

  const localOtherBefore = isLocalLockOccupiedByOtherTab();

  try {
    const response = await fetch('/api/session/heartbeat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: CLIENT_SESSION_ID,
        adminToken: currentAdminToken,
      }),
    });

    if (!response.ok) return;
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) return;

    const data = await response.json();
    if (!data?.ok) return;

    let changed = false;

    const nextOccupied =
      !isAuthenticatedMemory &&
      (Boolean(data.isAdminOccupiedByOther) || isCloudAdminOccupiedByOther || localOtherBefore);
    const nextUsers =
      typeof data.activeUsersCount === 'number'
        ? Math.max(1, data.activeUsersCount)
        : activeConnectedUsersCount;

    if (nextOccupied !== isAdminOccupiedByOther || nextUsers !== activeConnectedUsersCount) {
      isAdminOccupiedByOther = nextOccupied;
      activeConnectedUsersCount = nextUsers;
      changed = true;
    }

    if (
      Array.isArray(data.catalogProducts) &&
      data.catalogProducts.length > 0 &&
      typeof data.catalogUpdatedAt === 'number' &&
      data.catalogUpdatedAt > 0
    ) {
      syncCatalogFromServer(
        data.catalogProducts,
        data.exchangeRate,
        data.catalogUpdatedAt
      );
    }

    if (
      data.scheduleConfig &&
      typeof data.scheduleUpdatedAt === 'number' &&
      data.scheduleUpdatedAt > 0
    ) {
      syncScheduleFromServer(data.scheduleConfig, data.scheduleUpdatedAt);
    }

    if (changed) {
      notifyAuthAndPresenceListeners();
    }
  } catch {
    // Ignore transient network errors during heartbeat
    if (localOtherBefore !== isAdminOccupiedByOther && !isAuthenticatedMemory) {
      isAdminOccupiedByOther = localOtherBefore;
      notifyAuthAndPresenceListeners();
    }
  }
}

export function initAdminSessionLifecycle(): void {
  if (typeof window === 'undefined') return;
  if (heartbeatIntervalId !== null) return;

  // Clear any legacy persistent storage from older versions
  try {
    window.localStorage.removeItem('sdp_owner_admin_unlocked');
    window.sessionStorage.removeItem('sdp_owner_admin_unlocked_session');
  } catch {
    // ignore
  }

  // Subscribe to cloud single-admin lock across all devices
  if (!adminLockUnsubscribe) {
    const lockPath = 'appConfig/adminLock';
    adminLockUnsubscribe = onSnapshot(
      doc(db, 'appConfig', 'adminLock'),
      (snapshot) => {
        if (!snapshot.exists()) {
          if (isCloudAdminOccupiedByOther) {
            isCloudAdminOccupiedByOther = false;
            notifyAuthAndPresenceListeners();
          }
          return;
        }
        const data = snapshot.data();
        const now = Date.now();
        const isFresh =
          Boolean(data?.locked) &&
          typeof data?.sessionId === 'string' &&
          data.sessionId.length > 0 &&
          typeof data?.lastSeen === 'number' &&
          now - data.lastSeen <= LOCAL_ADMIN_LOCK_TTL_MS;

        const occupiedByOtherDevice = isFresh && data.sessionId !== CLIENT_SESSION_ID;
        if (occupiedByOtherDevice !== isCloudAdminOccupiedByOther) {
          isCloudAdminOccupiedByOther = occupiedByOtherDevice;
          notifyAuthAndPresenceListeners();
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, lockPath);
      }
    );
  }

  // Listen for cross-tab localStorage changes so tabs immediately see when Admin is occupied/released
  window.addEventListener('storage', (event) => {
    if (event.key === LOCAL_ADMIN_LOCK_KEY) {
      const occupiedByOther = isLocalLockOccupiedByOtherTab();
      if (!isAuthenticatedMemory && occupiedByOther !== isAdminOccupiedByOther) {
        isAdminOccupiedByOther = occupiedByOther;
        notifyAuthAndPresenceListeners();
      }
    }
  });

  // Initial heartbeat immediately
  runSessionHeartbeat();

  // Periodic heartbeat every 4 seconds to keep presence & admin lock alive
  heartbeatIntervalId = window.setInterval(() => {
    runSessionHeartbeat();
  }, 4000);

  // Automatic logout when closing the tab, reloading, or navigating away
  const handlePageUnload = () => {
    logoutOwnerSession('page_close');
  };

  window.addEventListener('pagehide', handlePageUnload);
  window.addEventListener('beforeunload', handlePageUnload);
}

