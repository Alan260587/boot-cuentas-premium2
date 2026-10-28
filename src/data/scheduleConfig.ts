import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { ScheduleConfig, DayAvailability } from '../types';
import { db, handleFirestoreError, OperationType } from '../firebase';

export const DEFAULT_SCHEDULE_CONFIG: ScheduleConfig = {
  maxWaitMinutes: 3, // 3 to 5 minutes
  availableDays: [
    { dayId: '1', name: 'Lunes', enabled: true },
    { dayId: '2', name: 'Martes', enabled: true },
    { dayId: '3', name: 'Miércoles', enabled: true },
    { dayId: '4', name: 'Jueves', enabled: true },
    { dayId: '5', name: 'Viernes', enabled: true },
    { dayId: '6', name: 'Sábado', enabled: true },
    { dayId: '0', name: 'Domingo', enabled: false },
  ],
  timeSlots: [
    '09:00 AM - 10:00 AM',
    '10:30 AM - 11:30 AM',
    '12:00 PM - 01:00 PM',
    '03:00 PM - 04:00 PM',
    '04:30 PM - 05:30 PM',
    '06:00 PM - 07:00 PM',
    '07:30 PM - 08:30 PM',
  ],
};

const STORAGE_KEY = 'sdp_owner_schedule_config';
const SCHEDULE_UPDATED_AT_KEY = 'sdp_schedule_updated_at_v1';
const DEVICE_ID_STORAGE_KEY = 'sdp_device_sync_id_v1';

let scheduleRealtimeUnsubscribe: (() => void) | null = null;

function getDeviceSyncId(): string {
  if (typeof window === 'undefined') return 'server';
  try {
    let existing = localStorage.getItem(DEVICE_ID_STORAGE_KEY);
    if (!existing) {
      existing = `dev_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(DEVICE_ID_STORAGE_KEY, existing);
    }
    return existing;
  } catch {
    return `dev_${Date.now()}`;
  }
}

export function getScheduleLastUpdatedAt(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = localStorage.getItem(SCHEDULE_UPDATED_AT_KEY);
    const parsed = raw ? Number(raw) : 0;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  } catch {
    return 0;
  }
}

function normalizeScheduleConfig(config: ScheduleConfig): ScheduleConfig {
  const maxWaitMinutes = Math.min(
    60,
    Math.max(1, Number(config?.maxWaitMinutes ?? DEFAULT_SCHEDULE_CONFIG.maxWaitMinutes))
  );
  const availableDays = Array.isArray(config?.availableDays) && config.availableDays.length > 0
    ? config.availableDays.map((d) => ({
        dayId: String(d.dayId),
        name: String(d.name),
        enabled: Boolean(d.enabled),
      }))
    : DEFAULT_SCHEDULE_CONFIG.availableDays;
  const timeSlots = Array.isArray(config?.timeSlots) && config.timeSlots.length > 0
    ? config.timeSlots.map((s) => String(s)).slice(0, 50)
    : DEFAULT_SCHEDULE_CONFIG.timeSlots;

  return {
    maxWaitMinutes,
    availableDays,
    timeSlots,
  };
}

async function persistScheduleToCloud(config: ScheduleConfig, updatedAt: number): Promise<void> {
  if (typeof window === 'undefined') return;
  const path = 'appConfig/schedule';
  const normalized = normalizeScheduleConfig(config);
  try {
    await setDoc(doc(db, 'appConfig', 'schedule'), {
      maxWaitMinutes: normalized.maxWaitMinutes,
      availableDays: normalized.availableDays,
      timeSlots: normalized.timeSlots,
      updatedAt,
      updatedBy: getDeviceSyncId(),
      authCode: '1987',
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function getSavedScheduleConfig(): ScheduleConfig {
  if (typeof window === 'undefined') return DEFAULT_SCHEDULE_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SCHEDULE_CONFIG;
    const parsed = JSON.parse(raw);
    return normalizeScheduleConfig(parsed);
  } catch {
    return DEFAULT_SCHEDULE_CONFIG;
  }
}

export function syncScheduleFromServer(
  serverConfig: ScheduleConfig,
  serverUpdatedAt?: number
): void {
  if (typeof window === 'undefined' || !serverConfig) return;
  try {
    const localUpdatedAt = getScheduleLastUpdatedAt();
    if (typeof serverUpdatedAt === 'number' && serverUpdatedAt > 0) {
      if (localUpdatedAt > 0 && serverUpdatedAt < localUpdatedAt) {
        return;
      }
    } else if (localUpdatedAt > 0) {
      return;
    }

    const normalized = normalizeScheduleConfig(serverConfig);
    const currentRaw = localStorage.getItem(STORAGE_KEY);
    const nextRaw = JSON.stringify(normalized);
    if (currentRaw !== nextRaw) {
      localStorage.setItem(STORAGE_KEY, nextRaw);
      window.dispatchEvent(new Event('schedule_config_updated'));
    }
    if (typeof serverUpdatedAt === 'number' && serverUpdatedAt > 0) {
      localStorage.setItem(SCHEDULE_UPDATED_AT_KEY, String(serverUpdatedAt));
    }
  } catch {
    // Ignore storage errors
  }
}

export function saveScheduleConfig(config: ScheduleConfig): void {
  if (typeof window === 'undefined') return;
  try {
    const normalized = normalizeScheduleConfig(config);
    const updatedAt = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    localStorage.setItem(SCHEDULE_UPDATED_AT_KEY, String(updatedAt));
    window.dispatchEvent(new Event('schedule_config_updated'));

    persistScheduleToCloud(normalized, updatedAt);

    fetch('/api/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...normalized,
        updatedAt,
      }),
    }).catch(() => {});
  } catch (e) {
    console.error('Error saving schedule config:', e);
  }
}

export function initScheduleRealtimeSync(): void {
  if (typeof window === 'undefined' || scheduleRealtimeUnsubscribe) return;

  const path = 'appConfig/schedule';
  scheduleRealtimeUnsubscribe = onSnapshot(
    doc(db, 'appConfig', 'schedule'),
    (snapshot) => {
      if (!snapshot.exists()) {
        const initialConfig = getSavedScheduleConfig();
        const initialUpdatedAt = getScheduleLastUpdatedAt() || Date.now();
        persistScheduleToCloud(initialConfig, initialUpdatedAt);
        return;
      }

      const data = snapshot.data();
      if (!data) return;

      const cloudUpdatedAt = typeof data.updatedAt === 'number' ? data.updatedAt : Date.now();
      const cloudConfig = normalizeScheduleConfig({
        maxWaitMinutes: data.maxWaitMinutes,
        availableDays: data.availableDays,
        timeSlots: data.timeSlots,
      });

      const currentRaw = localStorage.getItem(STORAGE_KEY);
      const nextRaw = JSON.stringify(cloudConfig);
      if (currentRaw !== nextRaw) {
        localStorage.setItem(STORAGE_KEY, nextRaw);
        window.dispatchEvent(new Event('schedule_config_updated'));
      }
      localStorage.setItem(SCHEDULE_UPDATED_AT_KEY, String(cloudUpdatedAt));

      fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...cloudConfig,
          updatedAt: cloudUpdatedAt,
        }),
      }).catch(() => {});
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export function formatEnabledDaysSummary(days: DayAvailability[]): string {
  const enabled = days.filter((d) => d.enabled);
  if (enabled.length === 0) return 'Ningún día disponible (temporalmente cerrado)';
  if (enabled.length === 7) return 'Todos los días (Lunes a Domingo)';
  if (
    enabled.length === 5 &&
    days.slice(0, 5).every((d) => d.enabled) &&
    !days[5].enabled &&
    !days[6].enabled
  ) {
    return 'Lunes a Viernes';
  }
  if (
    enabled.length === 6 &&
    days.slice(0, 6).every((d) => d.enabled) &&
    !days[6].enabled
  ) {
    return 'Lunes a Sábado';
  }
  return enabled.map((d) => d.name).join(', ');
}
