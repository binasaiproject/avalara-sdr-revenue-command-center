import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are the Avalara Persona & Messaging Agent embedded in Bina Shah's SDR Revenue Command Center.

Given a buyer role and industry (or company context), produce a complete buyer persona and messaging framework for an Avalara SDR or BDR.

Respond with ONLY valid JSON (no markdown, no code fences) matching this exact schema:

{
  "persona_name": "<fictional first name that fits the role>",
  "title": "<exact buyer title>",
  "industry": "<industry>",
  "segment": "<Enterprise | Mid-Market | SMB>",
  "company_profile": "<1-sentence description of a typical company this persona works at>",
  "day_in_the_life": "<2 sentences describing their daily priorities and pressures>",
  "top_pains": ["<pain 1>", "<pain 2>", "<pain 3>"],
  "buying_triggers": ["<trigger 1>", "<trigger 2>", "<trigger 3>"],
  "why_buy_anything": "<the core business problem driving them to look at ANY solution — 2 sentences>",
  "why_buy_now": "<what creates urgency — deadline, event, or risk — 1-2 sentences>",
  "why_avalara": "<specific Avalara differentiators for this persona — 2 sentences. Name specific features/connectors>",
  "objections": [
    {"objection": "<common objection>", "response": "<specific reframe — 1-2 sentences>"}
  ],
  "sequence_recommendation": "<recommended outreach sequence — e.g. Cold call → LinkedIn → Email → Email w/ case study>",
  "cold_email_subject": "<best subject line for first-touch email>",
  "opening_line": "<personalized first-touch cold call opener for this persona>",
  "proof_point": "<a specific customer reference or outcome relevant to this persona — real or realistic>",
  "confidence": <number 82-96>
}

Rules:
- Include 3 objections
- Use realistic Avalara context: SAP/NetSuite/Oracle integrations, managed returns, CertCapture, cross-border/VAT, nexus expansion
- why_avalara must name specific Avalara features — not generic "we're the best"
- proof_point should be a realistic customer story with a measurable outcome
- Output ONLY the JSON object, nothing else`;

function toHtml(d) {
  const segColor = d.segment === 'Enterprise' ? '#7c3aed' : d.segment === 'Mid-Market' ? '#2563eb' : '#16a34a';
  const pains = (d.top_pains || []).map(p => `<li>${p}</li>`).join('');
  const triggers = (d.buying_triggers || []).map(t => `<li>${t}</li>`).join('');
  const objRows = (d.objections || []).map((o, i) => {
    const bg = i % 2 === 1 ? ' style="background:#f9f9f9"' : '';
    return `<tr${bg}><td style="padding:5px 8px;font-weight:600">${o.objection}</td><td style="padding:5px 8px;color:#374151">${o.response}</td></tr>`;
  }).join('');

  return `<b style="color:#e8520a">🎭 Persona & Messaging · ${d.persona_name} — ${d.title}</b>
<span style="font-size:.75rem;color:#6b7280;margin-left:8px">${d.industry} · <span style="color:${segColor};font-weight:600">${d.segment}</span></span><br>
<span style="font-size:.78rem;color:#374151">${d.company_profile}</span><br><br>

<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
  <div style="background:#f9f9f9;padding:10px 12px;border-radius:8px">
    <b style="font-size:.72rem;text-transform:uppercase;letter-spacing:.5px;color:#6b7280">Day in the Life</b><br>
    <span style="font-size:.8rem">${d.day_in_the_life}</span>
  </div>
  <div style="background:#f9f9f9;padding:10px 12px;border-radius:8px">
    <b style="font-size:.72rem;text-transform:uppercase;letter-spacing:.5px;color:#6b7280">Top Pains</b>
    <ul style="margin:4px 0 0;padding-left:16px;font-size:.8rem">${pains}</ul>
  </div>
</div>

<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:12px">
  <div style="background:#fff8f0;border-top:3px solid #e8520a;padding:10px 12px;border-radius:0 0 8px 8px">
    <b style="font-size:.72rem;text-transform:uppercase;letter-spacing:.5px;color:#e8520a">Why Buy Anything</b>
    <p style="font-size:.78rem;margin:4px 0 0">${d.why_buy_anything}</p>
  </div>
  <div style="background:#f0f7ff;border-top:3px solid #2563eb;padding:10px 12px;border-radius:0 0 8px 8px">
    <b style="font-size:.72rem;text-transform:uppercase;letter-spacing:.5px;color:#2563eb">Why Buy Now</b>
    <p style="font-size:.78rem;margin:4px 0 0">${d.why_buy_now}</p>
  </div>
  <div style="background:#f0fdf4;border-top:3px solid #16a34a;padding:10px 12px;border-radius:0 0 8px 8px">
    <b style="font-size:.72rem;text-transform:uppercase;letter-spacing:.5px;color:#16a34a">Why Avalara</b>
    <p style="font-size:.78rem;margin:4px 0 0">${d.why_avalara}</p>
  </div>
</div>

<b>Objection Handlers</b><br>
<table style="width:100%;font-size:.78rem;border-collapse:collapse;margin-bottom:12px">
<tr style="background:#f3f4f6"><th style="padding:5px 8px;text-align:left">Objection</th><th style="padding:5px 8px;text-align:left">Response</th></tr>
${objRows}</table>

<b>Sequence:</b> ${d.sequence_recommendation}<br>
<b>Subject line:</b> <i>${d.cold_email_subject}</i><br><br>
<div style="background:#fff8f0;border-left:3px solid #e8520a;padding:10px 14px;border-radius:0 6px 6px 0;font-size:.82rem;margin-bottom:8px">
  <b style="font-size:.72rem;text-transform:uppercase;letter-spacing:.5px;color:#e8520a">Cold Call Opener</b><br>
  <i>"${d.opening_line}"</i>
</div>
<b>Proof point:</b> <span style="font-size:.8rem">${d.proof_point}</span><br><br>
<span style="color:#6b7280;font-size:.75rem">⚙ Live Agent · Confidence ${d.confidence}%</span>`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { persona } = req.body || {};
  if (!persona || persona.trim().length < 2) return res.status(400).json({ error: 'Please provide a buyer role and industry.' });

  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 1800,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `Buyer: ${persona.trim()}` }],
    });

    let data;
    try { data = JSON.parse(message.content[0].text); }
    catch { return res.status(500).json({ error: 'Agent returned malformed data — please try again.' }); }

    return res.status(200).json({ html: toHtml(data), persona: `${data.title} · ${data.industry}` });
  } catch (err) {
    console.error('Persona agent error:', err);
    return res.status(500).json({ error: 'Agent error — please try again.' });
  }
}
