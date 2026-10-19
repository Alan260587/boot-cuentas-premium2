import { ScheduleConfig, DayAvailability } from '../types';

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

export function getSavedScheduleConfig(): ScheduleConfig {
  if (typeof window === 'undefined') return DEFAULT_SCHEDULE_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SCHEDULE_CONFIG;
    const parsed = JSON.parse(raw);
    return {
      maxWaitMinutes: parsed.maxWaitMinutes ?? DEFAULT_SCHEDULE_CONFIG.maxWaitMinutes,
      availableDays: parsed.availableDays ?? DEFAULT_SCHEDULE_CONFIG.availableDays,
      timeSlots: parsed.timeSlots?.length ? parsed.timeSlots : DEFAULT_SCHEDULE_CONFIG.timeSlots,
    };
  } catch (e) {
    return DEFAULT_SCHEDULE_CONFIG;
  }
}

export function syncScheduleFromServer(serverConfig: ScheduleConfig): void {
  if (typeof window === 'undefined' || !serverConfig) return;
  try {
    const currentRaw = localStorage.getItem(STORAGE_KEY);
    const nextRaw = JSON.stringify(serverConfig);
    if (currentRaw !== nextRaw) {
      localStorage.setItem(STORAGE_KEY, nextRaw);
      window.dispatchEvent(new Event('schedule_config_updated'));
    }
  } catch {
    // Ignore storage errors
  }
}

export function saveScheduleConfig(config: ScheduleConfig): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    window.dispatchEvent(new Event('schedule_config_updated'));
    fetch('/api/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    }).catch(() => {});
  } catch (e) {
    console.error('Error saving schedule config:', e);
  }
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
