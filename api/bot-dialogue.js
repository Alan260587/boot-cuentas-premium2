// POST /api/bot-dialogue — Asistente Comercial (Gemini de AI Studio o Meta Model API).
//
// Contrato EXACTO que ya espera el frontend de la web (Vite + React):
//   Request:  { message, history: [{sender, text}], context, scheduleConfig }
//   Response: { reply, updatedContext, isAppointmentConfirmed, confirmedTicket? }
//
// Proveedor según la clave configurada en Vercel (en este orden):
//   1. GEMINI_API_KEY (Google AI Studio) -> gemini-2.5-flash por defecto
//   2. MODEL_API_KEY  (Meta Model API)   -> muse-spark-1.3 por defecto
// Las claves viven SOLO en el servidor (variables de entorno de Vercel).
// Sin dependencias externas: usa fetch nativo de Node 18+.

import { BUSINESS, buildSystemPrompt } from "./_knowledge.js";

// La cadena de modelos puede tardar: se permite hasta 60s de función.
export const config = { maxDuration: 60 };

const META_API_URL = "https://api.meta.ai/v1/chat/completions";
const META_MODEL = process.env.MUSE_MODEL || "muse-spark-1.3";
// Cadena de modelos Gemini: si uno no está disponible para la cuenta (404),
// está saturado (503/429) o tarda demasiado, se intenta el siguiente.
// GEMINI_MODEL (si se define en Vercel) va primero. 4 modelos x 13s de
// timeout = 52s máx, dentro del maxDuration de 60s. (Reforzado 2026-10-23
// tras intermitencia: los modelos de Google fallaban por ratos y el bot
// caía al mensaje de respaldo de WhatsApp.)
const GEMINI_MODELS = [
  ...new Set(
    [
      process.env.GEMINI_MODEL,
      "gemini-3.6-flash",
      "gemini-3.5-flash",
      "gemini-3-flash-preview",
      "gemini-3.8-flash",
    ].filter(Boolean)
  ),
];
const geminiUrl = (model) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
const WHATSAPP = BUSINESS.whatsappNumber;

const FALLBACK_REPLY =
  "Gracias por escribirnos. En este momento te canalizo directo con un agente en nuestro WhatsApp oficial " +
  BUSINESS.whatsappDisplay +
  " (respuesta de 3 a 5 minutos) para atenderte sin espera.";

function makeTicketId() {
  return (
    "SDP-" +
    Date.now().toString(36).toUpperCase() +
    Math.floor(Math.random() * 90 + 10)
  );
}

function buildWhatsappLink(ctx, ticketId) {
  const lines = [
    "¡Hola Javier! Vengo del asistente de la web de Servicios Digitales Premium.",
    ticketId ? `🔖 Ticket de cita: #${ticketId}` : null,
    ctx.clientName ? `👤 Nombre: ${ctx.clientName}` : null,
    ctx.country ? `📍 País: ${ctx.country}` : null,
    ctx.selectedServiceName ? `📦 Servicio: ${ctx.selectedServiceName}` : null,
    ctx.selectedDay ? `🗓️ Día: ${ctx.selectedDay}` : null,
    ctx.selectedTimeSlot ? `⏰ Horario: ${ctx.selectedTimeSlot}` : null,
    ctx.intent === "soporte" ? "🛠️ Motivo: soporte de mi servicio" : null,
    ctx.intent === "afiliados" ? "🤝 Motivo: programa de afiliados" : null,
  ].filter(Boolean);
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(lines.join("\n"))}`;
}

async function notifyLead(payload) {
  // 1) Queda registrado en los logs de Vercel (Functions > Logs).
  console.log("[LEAD]", JSON.stringify(payload));
  // 2) Opcional: si defines LEADS_WEBHOOK_URL (Zapier, Make, Google Sheets,
  //    Slack, tu CRM...), el lead también se envía ahí en cada captura.
  const url = process.env.LEADS_WEBHOOK_URL;
  if (!url) return;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(4000),
    });
  } catch (err) {
    console.error("[LEAD webhook error]", err?.message || err);
  }
}

export function parseModelJson(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {}
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) {
    try {
      return JSON.parse(text.slice(start, end + 1));
    } catch {}
  }
  // Last resort: the model sometimes emits JSON with literal newlines or
  // other control characters inside the reply string, which breaks
  // JSON.parse. Extract the fields with regexes so the visitor never
  // sees raw JSON.
  const replyMatch = text.match(/"reply"\s*:\s*"((?:\\.|[^"\\])*)"/s);
  if (replyMatch) {
    let reply = replyMatch[1];
    try {
      reply = JSON.parse(`"${reply}"`);
    } catch {}
    let updatedContext = {};
    const ctxStart = text.indexOf('"updatedContext"');
    if (ctxStart >= 0) {
      const braceStart = text.indexOf("{", ctxStart);
      const braceEnd = text.indexOf("}", braceStart);
      if (braceStart >= 0 && braceEnd > braceStart) {
        try {
          updatedContext = JSON.parse(text.slice(braceStart, braceEnd + 1));
        } catch {}
      }
    }
    return {
      reply,
      updatedContext,
      isAppointmentConfirmed: /"isAppointmentConfirmed"\s*:\s*true/.test(text),
      confirmedTicket: null,
    };
  }
  return null;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ reply: FALLBACK_REPLY });
    return;
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  const metaKey = process.env.MODEL_API_KEY;
  const body = req.body || {};
  const message = String(body.message || "").slice(0, 1500).trim();
  const history = Array.isArray(body.history) ? body.history.slice(-12) : [];
  const context =
    body.context && typeof body.context === "object" ? body.context : {};
  const scheduleConfig = body.scheduleConfig || null;

  if (!message) {
    res.status(200).json({
      reply: "¡Hola! Soy el Asistente Comercial de Servicios Digitales Premium. ¿Qué servicio te interesa: Coursera Plus, Google AI Pro, CapCut Teams, Microsoft 365 o Figma Pro?",
      updatedContext: context,
      isAppointmentConfirmed: false,
    });
    return;
  }

  if (!geminiKey && !metaKey) {
    console.error(
      "[bot-dialogue] Falta GEMINI_API_KEY (o MODEL_API_KEY) en Vercel"
    );
    res.status(200).json({
      reply: FALLBACK_REPLY,
      updatedContext: context,
      isAppointmentConfirmed: false,
    });
    return;
  }

  const systemPrompt =
    buildSystemPrompt(scheduleConfig) +
    `\n\nContexto conocido del visitante hasta ahora: ${JSON.stringify(context)}`;
  const turns = history
    .filter((h) => h && typeof h.text === "string")
    .map((h) => ({
      role: h.sender === "assistant" ? "assistant" : "user",
      content: h.text.slice(0, 1500),
    }));
  turns.push({ role: "user", content: message });
  // Gemini exige que la conversación empiece con turno de usuario:
  // se descartan saludos iniciales del asistente al frente del historial.
  while (turns.length > 1 && turns[0].role === "assistant") turns.shift();

  try {
    let raw = "";

    if (geminiKey) {
      // Google AI Studio / Gemini Developer API (REST, sin SDK).
      const geminiBody = JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: turns.map((t) => ({
          role: t.role === "assistant" ? "model" : "user",
          parts: [{ text: t.content }],
        })),
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 800,
          responseMimeType: "application/json",
        },
      });

      let geminiOk = false;
      for (const model of GEMINI_MODELS) {
        let apiRes;
        try {
          apiRes = await fetch(geminiUrl(model), {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": geminiKey,
            },
            body: geminiBody,
            signal: AbortSignal.timeout(13000),
          });
        } catch (fetchErr) {
          // Timeout o error de red con este modelo: probar el siguiente.
          console.error(
            `[bot-dialogue] Gemini (${model}) sin respuesta:`,
            fetchErr?.name || fetchErr
          );
          continue;
        }

        if (apiRes.ok) {
          const data = await apiRes.json();
          raw =
            data?.candidates?.[0]?.content?.parts
              ?.map((p) => p.text || "")
              .join("") || "";
          geminiOk = true;
          break;
        }

        const errText = await apiRes.text().catch(() => "");
        console.error(
          `[bot-dialogue] Gemini (${model}) error`,
          apiRes.status,
          errText.slice(0, 200)
        );
        // 404 = modelo no disponible para la cuenta; 429/503 = saturado.
        // En esos casos se prueba el siguiente modelo de la cadena.
        if (![404, 429, 503].includes(apiRes.status)) break;
      }

      if (!geminiOk) {
        res.status(200).json({
          reply: FALLBACK_REPLY,
          updatedContext: context,
          isAppointmentConfirmed: false,
        });
        return;
      }
    } else {
      // Meta Model API (Chat Completions, compatible con OpenAI).
      const apiRes = await fetch(META_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${metaKey}`,
        },
        body: JSON.stringify({
          model: META_MODEL,
          messages: [
            { role: "system", content: systemPrompt },
            ...turns.map((t) => ({ role: t.role, content: t.content })),
          ],
          temperature: 0.4,
          max_tokens: 800,
        }),
        signal: AbortSignal.timeout(25000),
      });

      if (!apiRes.ok) {
        console.error(
          "[bot-dialogue] Meta Model API error",
          apiRes.status,
          await apiRes.text().catch(() => "")
        );
        res.status(200).json({
          reply: FALLBACK_REPLY,
          updatedContext: context,
          isAppointmentConfirmed: false,
        });
        return;
      }

      const data = await apiRes.json();
      raw = data?.choices?.[0]?.message?.content || "";
    }
    const parsed = parseModelJson(raw);

    if (!parsed || typeof parsed.reply !== "string") {
      // El modelo no devolvió JSON usable: usa su texto como respuesta,
      // pero nunca muestres JSON crudo al visitante.
      const trimmed = raw.trim();
      res.status(200).json({
        reply: trimmed && !trimmed.startsWith("{") ? trimmed : FALLBACK_REPLY,
        updatedContext: context,
        isAppointmentConfirmed: false,
      });
      return;
    }

    const updatedContext = { ...context, ...(parsed.updatedContext || {}) };
    const confirmed = parsed.isAppointmentConfirmed === true;
    const wantsWhatsapp = parsed.wantsWhatsapp === true;

    let confirmedTicket;
    if (confirmed) {
      const ticketId = makeTicketId();
      confirmedTicket = {
        ticketId,
        clientName: updatedContext.clientName || "Cliente web",
        serviceName: updatedContext.selectedServiceName || "Servicio Premium",
        dayOrDate: updatedContext.selectedDay || "",
        timeSlot: updatedContext.selectedTimeSlot || "",
        whatsAppLink: buildWhatsappLink(updatedContext, ticketId),
      };
      updatedContext.state = "confirmed";
    }

    if (confirmed || wantsWhatsapp) {
      await notifyLead({
        type: confirmed ? "cita_confirmada" : "lead_whatsapp",
        ticketId: confirmedTicket?.ticketId || null,
        at: new Date().toISOString(),
        ...updatedContext,
        lastMessage: message,
        whatsappLink: confirmed
          ? confirmedTicket.whatsAppLink
          : buildWhatsappLink(updatedContext, null),
      });
    }

    res.status(200).json({
      reply: parsed.reply,
      updatedContext,
      isAppointmentConfirmed: confirmed,
      ...(confirmedTicket ? { confirmedTicket } : {}),
    });
  } catch (err) {
    console.error("[bot-dialogue] Error:", err?.message || err);
    res.status(200).json({
      reply: FALLBACK_REPLY,
      updatedContext: context,
      isAppointmentConfirmed: false,
    });
  }
}
