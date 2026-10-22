// POST /api/bot-dialogue — Asistente Comercial con Meta Model API (Muse).
//
// Contrato EXACTO que ya espera el frontend de la web (Vite + React):
//   Request:  { message, history: [{sender, text}], context, scheduleConfig }
//   Response: { reply, updatedContext, isAppointmentConfirmed, confirmedTicket? }
//
// La API key vive SOLO en el servidor (variable de entorno de Vercel).
// Sin dependencias externas: usa fetch nativo de Node 18+.

import { BUSINESS, buildSystemPrompt } from "./_knowledge.js";

const MODEL_API_URL = "https://api.meta.ai/v1/chat/completions";
const MODEL = process.env.MUSE_MODEL || "muse-spark-1.3"; // barato y rápido para FAQs/soporte
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

function parseModelJson(text) {
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
  return null;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ reply: FALLBACK_REPLY });
    return;
  }

  const apiKey = process.env.MODEL_API_KEY;
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

  if (!apiKey) {
    console.error("[bot-dialogue] Falta MODEL_API_KEY en Vercel");
    res.status(200).json({
      reply: FALLBACK_REPLY,
      updatedContext: context,
      isAppointmentConfirmed: false,
    });
    return;
  }

  const messages = [
    {
      role: "system",
      content:
        buildSystemPrompt(scheduleConfig) +
        `\n\nContexto conocido del visitante hasta ahora: ${JSON.stringify(context)}`,
    },
    ...history
      .filter((h) => h && typeof h.text === "string")
      .map((h) => ({
        role: h.sender === "assistant" ? "assistant" : "user",
        content: h.text.slice(0, 1500),
      })),
    { role: "user", content: message },
  ];

  try {
    const apiRes = await fetch(MODEL_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature: 0.4,
        max_tokens: 800,
      }),
      signal: AbortSignal.timeout(25000),
    });

    if (!apiRes.ok) {
      console.error(
        "[bot-dialogue] Model API error",
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
    const raw = data?.choices?.[0]?.message?.content || "";
    const parsed = parseModelJson(raw);

    if (!parsed || typeof parsed.reply !== "string") {
      // El modelo no devolvió JSON: usa su texto como respuesta.
      res.status(200).json({
        reply: raw.trim() || FALLBACK_REPLY,
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
