import {
  ADMIN_SECRET_KEY,
  cleanupStaleSessions,
  createAdminToken,
  getActiveAdminSession,
  getConnectedClientsCount,
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
  const { sessionId, password } = body;

  const effectiveSessionId =
    sessionId && typeof sessionId === 'string'
      ? sessionId
      : `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  touchClient(effectiveSessionId);

  const normalizedPassword = String(password ?? '').trim();
  if (normalizedPassword !== '1987' && normalizedPassword !== ADMIN_SECRET_KEY) {
    return res.status(401).json({
      ok: false,
      reason: 'invalid_password',
      message: 'Acceso incorrecto. Ingresa ****.',
    });
  }

  const currentAdmin = getActiveAdminSession();
  if (currentAdmin && currentAdmin.sessionId !== effectiveSessionId) {
    return res.status(409).json({
      ok: false,
      reason: 'already_occupied',
      message:
        'Ya hay 1 Administrador conectado en este momento. Solo se permite un administrador activo a la vez.',
    });
  }

  const token = createAdminToken(effectiveSessionId);
  const now = Date.now();
  setActiveAdminSession({
    sessionId: effectiveSessionId,
    token,
    connectedAt: now,
    lastSeen: now,
  });

  return res.status(200).json({
    ok: true,
    adminToken: token,
    sessionId: effectiveSessionId,
    isYouAdmin: true,
    isAdminOccupiedByOther: false,
    activeUsersCount: getConnectedClientsCount(),
  });
}
