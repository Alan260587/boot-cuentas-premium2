import {
  cleanupStaleSessions,
  getActiveAdminSession,
  getConnectedClientsCount,
  parseRequestBody,
  removeConnectedClient,
  setActiveAdminSession,
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
  const payload = parseRequestBody(req);
  const { sessionId, adminToken, reason } = payload || {};

  const currentAdmin = getActiveAdminSession();
  if (
    currentAdmin &&
    sessionId &&
    currentAdmin.sessionId === sessionId &&
    (!adminToken || currentAdmin.token === adminToken)
  ) {
    setActiveAdminSession(null);
  }

  if (reason === 'page_close' && sessionId) {
    removeConnectedClient(sessionId);
  }

  return res.status(200).json({
    ok: true,
    activeUsersCount: getConnectedClientsCount(),
  });
}
