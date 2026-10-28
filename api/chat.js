import { GoogleGenAI } from '@google/genai';
import { parseRequestBody } from './_adminState.js';
import { BUSINESS, PRODUCTS } from './_knowledge.js';

const MODELS = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = parseRequestBody(req);
  const { message, country, profile } = body || {};

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Mensaje requerido' });
  }

  const activeCatalogSummary = PRODUCTS.map(
    (p) => `• **${p.name}** (${p.duration}): $${p.priceMxn} MXN / ${p.priceAlt} — ${p.description}`
  ).join('\n');

  const generateFallbackResponse = (userMsg) => {
    const q = userMsg.toLowerCase();

    if (
      q.includes('precio') ||
      q.includes('catalogo') ||
      q.includes('catálogo') ||
      q.includes('cuanto cuesta') ||
      q.includes('servicios') ||
      q.includes('cuenta') ||
      q.includes('producto')
    ) {
      return `¡Con gusto! Aquí tienes nuestro catálogo oficial actualizado de ${BUSINESS.name} para potenciar tu productividad y aprendizaje:

${activeCatalogSummary}

⚠️ **Atención:** Antes de comprar, favor de comunicarse por nuestro WhatsApp oficial: **${BUSINESS.whatsappDisplay}** para verificar disponibilidad y entregarte tu acceso de inmediato.`;
    }

    if (
      q.includes('pago') ||
      q.includes('banco') ||
      q.includes('clabe') ||
      q.includes('binance') ||
      q.includes('paypal') ||
      q.includes('transferir')
    ) {
      return `Aquí tienes los datos bancarios oficiales autorizados a nombre de nuestro titular:

🇲🇽 **Para México (Cuentas Locales):**
• **Banco Nu:** CLABE / Tarjeta: \`5101258665547429\`
• **Bancoppel:** Tarjeta: \`4169160624712155\`
• **Titular / Beneficiario:** ${BUSINESS.owner}

🌐 **Para Internacional / Cripto / PayPal:**
• **Binance ID:** \`453667986\`
• **Binance / PayPal Email:** \`javieralanrodriguezyescas31@gmail.com\`

⚠️ **REGLA ESTRICTA DE CONCEPTO:**
En el concepto de pago bancario debes colocar el **nombre y apellido de la persona que te recomendó**. Si nadie te recomendó, escribe únicamente la palabra "**pago**".

Una vez hecho el pago, envía tu comprobante al WhatsApp oficial: **${BUSINESS.whatsappDisplay}**.`;
    }

    if (
      q.includes('afiliado') ||
      q.includes('vender') ||
      q.includes('ganar') ||
      q.includes('comision') ||
      q.includes('negocio') ||
      q.includes('gratis')
    ) {
      return `¡Excelente iniciativa! En ${BUSINESS.name} puedes adquirir licencias para uso personal o unirte a nuestro **Programa Oficial de Afiliados**:

🎁 **Recompensas directas por tus ventas:**
1. **Meta Figma:** Por cada **3 licencias de Figma Pro** vendidas, ¡obtienes **1 Figma Pro completamente GRATIS**!
2. **Meta Servicios Base:** Por cada **6 productos de $150 MXN (u 8.74 USDT)** vendidos, ¡obtienes **1 Figma Pro GRATIS**!

¿Deseas activarte como vendedor? Escríbenos a nuestro WhatsApp oficial **${BUSINESS.whatsappDisplay}** con la palabra "Quiero ser Afiliado".`;
    }

    return `¡Hola! Estoy aquí para potenciar tu aprendizaje y creatividad al mejor precio.

Puedo ayudarte con:
1. 📦 Ver catálogo completo y precios en MXN / USDT.
2. 💳 Métodos de pago (Nu, Bancoppel, Binance, PayPal) y la regla estricta de concepto.
3. 🚀 Unirte al Programa de Afiliados (gana Figmas Pro gratis por tus ventas).
4. 📅 Agendar cita o canalizarte con atención humana inmediata.

⚠️ **Atención:** Recuerda que antes de comprar, debes comunicarte por nuestro WhatsApp oficial: **${BUSINESS.whatsappDisplay}**. ¿En qué puedo orientarte hoy?`;
  };

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(200).json({ reply: generateFallbackResponse(message), isAiPowered: false });
  }

  try {
    const client = new GoogleGenAI({ apiKey });
    const promptContext = `Contexto del cliente:
- País seleccionado: ${country || 'No especificado'}
- Perfil: ${profile || 'Comprador'}
- Mensaje del usuario: ${message}`;

    const systemInstruction = `Eres el asistente virtual comercial oficial de ${BUSINESS.name}.
Tu objetivo es guiar a los clientes, mostrar catálogos, explicar métodos de pago, gestionar el programa de afiliados y canalizar la atención por medio del WhatsApp oficial ${BUSINESS.whatsappDisplay}.
Catálogo oficial:
${activeCatalogSummary}`;

    for (const model of MODELS) {
      try {
        const response = await client.models.generateContent({
          model,
          contents: promptContext,
          config: { systemInstruction, temperature: 0.7 },
        });
        if (response && response.text) {
          return res.status(200).json({ reply: response.text, isAiPowered: true });
        }
      } catch {
        // try next model
      }
    }
  } catch {
    // fallback below
  }

  return res.status(200).json({ reply: generateFallbackResponse(message), isAiPowered: false });
}
