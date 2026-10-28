import {
  cleanupStaleSessions,
  getActiveAdminSession,
  getConnectedClientsCount,
  getServerCatalogProducts,
  getServerCatalogUpdatedAt,
  getServerExchangeRate,
  getServerScheduleConfig,
  getServerScheduleUpdatedAt,
  isValidAdminTokenForSession,
  parseRequestBody,
  setActiveAdminSession,
  touchClient,
} from '../_adminState.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, message: 'Method not allowed' });
  }

  cleanupStaleSessions();
  const body = parseRequestBody(req);
  const { sessionId, adminToken } = body;

  if (sessionId && typeof sessionId === 'string') {
    touchClient(sessionId);
  }

  let currentAdmin = getActiveAdminSession();
  let isYouAdmin = false;

  if (
    currentAdmin &&
    sessionId &&
    currentAdmin.sessionId === sessionId &&
    adminToken &&
    currentAdmin.token === adminToken
  ) {
    currentAdmin.lastSeen = Date.now();
    isYouAdmin = true;
  } else if (
    !currentAdmin &&
    sessionId &&
    adminToken &&
    isValidAdminTokenForSession(adminToken, sessionId)
  ) {
    // Stateless serverless cold-start recovery on Vercel:
    // If no other admin is active and this client presents a valid signed session token,
    // restore the active admin session seamlessly.
    const now = Date.now();
    currentAdmin = {
      sessionId,
      token: adminToken,
      connectedAt: now,
      lastSeen: now,
    };
    setActiveAdminSession(currentAdmin);
    isYouAdmin = true;
  }

  const isAdminOccupiedByOther = Boolean(
    currentAdmin && currentAdmin.sessionId !== sessionId
  );

  return res.status(200).json({
    ok: true,
    isYouAdmin,
    isAdminOccupiedByOther,
    activeUsersCount: getConnectedClientsCount(),
    scheduleConfig: getServerScheduleConfig(),
    scheduleUpdatedAt: getServerScheduleUpdatedAt(),
    catalogProducts: getServerCatalogProducts(),
    exchangeRate: getServerExchangeRate(),
    catalogUpdatedAt: getServerCatalogUpdatedAt(),
  });
}

