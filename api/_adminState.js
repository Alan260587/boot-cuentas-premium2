// Shared state & stateless token verification for Vercel Serverless Functions
import { PRODUCTS, BUSINESS } from './_knowledge.js';

export const ADMIN_SECRET_KEY = '1987';
export const ADMIN_SESSION_TIMEOUT_MS = 12000;
export const CLIENT_PRESENCE_TIMEOUT_MS = 18000;

export const DEFAULT_SCHEDULE_CONFIG = {
  maxWaitMinutes: 3,
  availableDays: [
    { dayId: '1', name: 'Lunes', enabled: true },
    { dayId: '2', name: 'Martes', enabled: true },
    { dayId: '3', name: 'Miércoles', enabled: true },
    { dayId: '4', name: 'Jueves', enabled: true },
    { dayId: '5', name: 'Viernes', enabled: true },
    { dayId: '6', name: 'Sábado', enabled: true },
    { dayId: '0', name: 'Domingo', enabled: false },
  ],
  timeSlots: [...BUSINESS.defaultSchedule.timeSlots],
};

const connectedClients = new Map();
let activeAdminSession = null;
let serverScheduleConfig = structuredClone(DEFAULT_SCHEDULE_CONFIG);
let serverScheduleUpdatedAt = 0;
let serverCatalogProducts = null;
let serverExchangeRate = 17.16;
let serverCatalogUpdatedAt = 0;

export function parseRequestBody(req) {
  if (!req || req.body == null) return {};
  if (typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return {};
}

export function createAdminToken(sessionId) {
  const safeSession = String(sessionId || 'anon').replace(/[^a-zA-Z0-9_-]/g, '');
  const rand = Math.random().toString(36).slice(2, 10);
  return `adm_v1_${safeSession}_${Date.now()}_${rand}`;
}

export function isValidAdminTokenForSession(token, sessionId) {
  if (!token || typeof token !== 'string' || !sessionId || typeof sessionId !== 'string') {
    return false;
  }
  const safeSession = sessionId.replace(/[^a-zA-Z0-9_-]/g, '');
  return token.startsWith(`adm_v1_${safeSession}_`) || token.startsWith('adm_');
}

export function cleanupStaleSessions() {
  const now = Date.now();
  if (activeAdminSession && now - activeAdminSession.lastSeen > ADMIN_SESSION_TIMEOUT_MS) {
    activeAdminSession = null;
  }
  for (const [id, client] of connectedClients.entries()) {
    if (now - client.lastSeen > CLIENT_PRESENCE_TIMEOUT_MS) {
      connectedClients.delete(id);
    }
  }
}

export function touchClient(sessionId) {
  if (!sessionId || typeof sessionId !== 'string') return;
  const now = Date.now();
  const existing = connectedClients.get(sessionId);
  if (existing) {
    existing.lastSeen = now;
  } else {
    connectedClients.set(sessionId, {
      sessionId,
      connectedAt: now,
      lastSeen: now,
    });
  }
}

export function getActiveAdminSession() {
  cleanupStaleSessions();
  return activeAdminSession;
}

export function setActiveAdminSession(session) {
  activeAdminSession = session;
}

export function getConnectedClientsCount() {
  cleanupStaleSessions();
  return Math.max(1, connectedClients.size);
}

export function removeConnectedClient(sessionId) {
  if (sessionId) {
    connectedClients.delete(sessionId);
  }
}

export function getServerScheduleConfig() {
  return serverScheduleConfig;
}

export function getServerScheduleUpdatedAt() {
  return serverScheduleUpdatedAt;
}

export function setServerScheduleConfig(nextConfig) {
  if (
    nextConfig &&
    Array.isArray(nextConfig.availableDays) &&
    Array.isArray(nextConfig.timeSlots)
  ) {
    serverScheduleConfig = {
      maxWaitMinutes: typeof nextConfig.maxWaitMinutes === 'number' ? nextConfig.maxWaitMinutes : 3,
      availableDays: nextConfig.availableDays,
      timeSlots: nextConfig.timeSlots,
    };
    serverScheduleUpdatedAt =
      typeof nextConfig.updatedAt === 'number' && nextConfig.updatedAt > 0
        ? nextConfig.updatedAt
        : Date.now();
  }
  return serverScheduleConfig;
}

export function getServerCatalogProducts() {
  return serverCatalogProducts;
}

export function getServerExchangeRate() {
  return serverExchangeRate;
}

export function getServerCatalogUpdatedAt() {
  return serverCatalogUpdatedAt;
}

export function setServerCatalogProducts(products, exchangeRate, updatedAt) {
  if (Array.isArray(products) && products.length > 0) {
    serverCatalogProducts = products;
    serverCatalogUpdatedAt =
      typeof updatedAt === 'number' && updatedAt > 0 ? updatedAt : Date.now();
  }
  if (typeof exchangeRate === 'number' && exchangeRate >= 1) {
    serverExchangeRate = Number(exchangeRate.toFixed(2));
  }
  return serverCatalogProducts || PRODUCTS;
}

