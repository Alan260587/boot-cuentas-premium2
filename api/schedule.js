import {
  getServerScheduleConfig,
  getServerScheduleUpdatedAt,
  parseRequestBody,
  setServerScheduleConfig,
} from './_adminState.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      ...getServerScheduleConfig(),
      updatedAt: getServerScheduleUpdatedAt(),
    });
  }

  if (req.method === 'POST') {
    const body = parseRequestBody(req);
    const updated = setServerScheduleConfig(body);
    return res.status(200).json({
      ok: true,
      scheduleConfig: updated,
      updatedAt: getServerScheduleUpdatedAt(),
    });
  }

  return res.status(405).json({ ok: false, message: 'Method not allowed' });
}

