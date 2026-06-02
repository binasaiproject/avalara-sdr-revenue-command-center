import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are the Avalara Email Personalizer Agent embedded in Bina Shah's SDR Revenue Command Center.

Given an account brief, trigger, or buyer context, draft a personalized first-touch outreach email that earns a reply — not a template blast.

Respond with ONLY valid JSON (no markdown, no code fences) matching this exact schema:

{
  "to_name": "<recipient first name or role if name unknown>",
  "to_title": "<recipient title>",
  "company": "<company name>",
  "trigger_used": "<the specific trigger this email leads with — 1 short phrase>",
  "subject": "<email subject line — specific, not generic, under 60 chars>",
  "email_body": "<full email body — plain text with \\n for line breaks. 120-160 words. Lead with the trigger, map pain to Avalara value, end with a low-friction CTA. Do NOT use [brackets] for variables — use realistic placeholder names/details. Sign off as 'Bina Shah | Avalara'>",
  "why_this_works": "<3-sentence explanation of the specific personalization choices made — trigger, pain mapping, CTA rationale>",
  "ab_variant": {
    "subject": "<alternative subject line — different angle>",
    "opening_line": "<alternative first sentence only>"
  },
  "predicted_reply_rate": "<e.g. 18–22%>",
  "best_send_time": "<e.g. Tuesday 8–9am recipient's timezone>",
  "follow_up_cadence": "<recommended Day 3 / Day 7 / Day 14 touchpoints — 1 sentence each>",
  "confidence": <number 82-96>
}

Rules:
- email_body must be specific to this trigger and company — no generic filler
- Subject line must create curiosity or name a specific business risk — not "Avalara intro" or "Quick question"
- CTA must be low-friction: a question, a short call offer, or a resource — never "schedule a demo"
- Use realistic Avalara context: SAP/NetSuite/Oracle integrations, nexus expansion, managed returns, CertCapture, VAT
- Output ONLY the JSON object, nothing else`;

function toHtml(d) {
  const emailLines = (d.email_body || '').split('\n').map(l => l ? `<p style="margin:0 0 6px">${l}</p>` : '<br>').join('');
  const cadenceLines = (d.follow_up_cadence || '').split(/Day \d+/).filter(Boolean);

  return `<b style="color:#e8520a">✉️ Email Personalizer · ${d.company} → ${d.to_name}, ${d.to_title}</b><br>
<b style="font-size:.75rem;color:#6b7280">Trigger used: ${d.trigger_used}</b><br><br>

<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px">
  <div style="background:#f3f4f6;padding:8px 12px;border-radius:6px;font-size:.78rem">
    <b>Subject A:</b> ${d.subject}
  </div>
  <div style="background:#f3f4f6;padding:8px 12px;border-radius:6px;font-size:.78rem">
    <b>Subject B (variant):</b> ${d.ab_variant?.subject || '—'}
  </div>
</div>

<div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:16px 18px;font-size:.82rem;line-height:1.55;margin-bottom:12px">
${emailLines}
</div>

<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:12px;font-size:.78rem">
  <div style="background:#f0fdf4;padding:8px 12px;border-radius:6px">
    <b style="color:#16a34a">Predicted Reply Rate</b><br>${d.predicted_reply_rate}
  </div>
  <div style="background:#f0f7ff;padding:8px 12px;border-radius:6px">
    <b style="color:#2563eb">Best Send Time</b><br>${d.best_send_time}
  </div>
  <div style="background:#fff8f0;padding:8px 12px;border-radius:6px">
    <b style="color:#e8520a">Variant Opener</b><br><i>${d.ab_variant?.opening_line || '—'}</i>
  </div>
</div>

<b>Why this works:</b> <span style="font-size:.8rem">${d.why_this_works}</span><br><br>
<b>Follow-up cadence:</b> <span style="font-size:.8rem">${d.follow_up_cadence}</span><br><br>
<span style="color:#6b7280;font-size:.75rem">⚙ Live Agent · Confidence ${d.confidence}%</span>`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { context } = req.body || {};
  if (!context || context.trim().length < 2) return res.status(400).json({ error: 'Please provide an account brief or trigger context.' });

  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 1800,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `Account/trigger context: ${context.trim()}` }],
    });

    let data;
    try { data = JSON.parse(message.content[0].text); }
    catch { return res.status(500).json({ error: 'Agent returned malformed data — please try again.' }); }

    return res.status(200).json({ html: toHtml(data), subject: data.subject, email_body: data.email_body, company: data.company });
  } catch (err) {
    console.error('Email personalizer error:', err);
    return res.status(500).json({ error: 'Agent error — please try again.' });
  }
}
