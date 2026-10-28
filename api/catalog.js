import {
  getServerCatalogProducts,
  getServerCatalogUpdatedAt,
  getServerExchangeRate,
  parseRequestBody,
  setServerCatalogProducts,
} from './_adminState.js';
import { PRODUCTS } from './_knowledge.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      ok: true,
      products: getServerCatalogProducts() || PRODUCTS,
      exchangeRate: getServerExchangeRate(),
      updatedAt: getServerCatalogUpdatedAt(),
    });
  }

  if (req.method === 'POST') {
    const body = parseRequestBody(req);
    const updated = setServerCatalogProducts(
      body?.products,
      body?.exchangeRate,
      body?.updatedAt
    );
    return res.status(200).json({
      ok: true,
      products: updated,
      exchangeRate: getServerExchangeRate(),
      updatedAt: getServerCatalogUpdatedAt(),
    });
  }

  return res.status(405).json({ ok: false, message: 'Method not allowed' });
}

