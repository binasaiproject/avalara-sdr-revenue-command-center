const Anthropic = require("@anthropic-ai/sdk");

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are the Avalara Account Research Agent embedded in Bina Shah's SDR Revenue Command Center.

Given a company name or account description, produce a full pre-call account brief for an Avalara SDR or BDR.

Respond with ONLY valid JSON (no markdown, no code fences) matching this exact schema:

{
  "company": "<Company Name>",
  "revenue_band": "<e.g. $150M–$200M>",
  "industry": "<primary industry>",
  "erp_stack": "<ERP system(s) detected or likely>",
  "primary_trigger": "<the #1 compliance or business event driving urgency — 1 sentence>",
  "trigger_urgency": "<High | Medium | Low>",
  "tax_risk": "<description of their specific tax compliance risk — 2 sentences>",
  "competitive_intel": "<incumbent tax vendor if known, or 'None detected' — and displacement angle>",
  "contacts": [
    {
      "name": "<First Last or role placeholder>",
      "title": "<exact title>",
      "type": "<Economic Buyer | Champion Target | Technical Influencer | Blocker Risk>",
      "rationale": "<why this person matters and how to reach them — 1 sentence>",
      "outreach_angle": "<specific opening line for this contact>"
    }
  ],
  "recommended_play": "<the exact SDR play to run — sequence type, entry point, partner angle if relevant>",
  "talk_track_opener": "<a specific, personalized cold call opener for this account>",
  "confidence": <number 80-96>
}

Rules:
- Include 3 contacts, ordered by priority
- Use realistic Avalara context: SAP ECC/S4HANA migrations, NetSuite, Oracle EBS, Vertex/TaxJar/Sovos/DIY competition
- primary_trigger must be specific to this company — not generic
- talk_track_opener must name the company and reference the trigger — not a template
- Output ONLY the JSON object, nothing else`;

function toHtml(d) {
  const urgencyColor = d.trigger_urgency === 'High' ? '#ef4444' : d.trigger_urgency === 'Medium' ? '#f59e0b' : '#16a34a';
  const typeColor = t => t === 'Economic Buyer' ? '#7c3aed' : t === 'Champion Target' ? '#16a34a' : t === 'Technical Influencer' ? '#2563eb' : '#ef4444';

  const contactRows = (d.contacts || []).map((c, i) => {
    const bg = i % 2 === 1 ? ' style="background:#f9f9f9"' : '';
    return `<tr${bg}>
      <td style="padding:4px 7px"><b>${c.name}</b></td>
      <td style="padding:4px 7px">${c.title}</td>
      <td style="padding:4px 7px"><span style="color:${typeColor(c.type)};font-weight:600;font-size:.72rem">${c.type}</span></td>
      <td style="padding:4px 7px;color:#374151">${c.rationale}</td>
      <td style="padding:4px 7px;font-style:italic;color:#6366f1;font-size:.75rem">"${c.outreach_angle}"</td>
    </tr>`;
  }).join('');

  return `<b style="color:#e8520a">🔍 Account Research · ${d.company}</b>
<span style="font-size:.75rem;color:#6b7280;margin-left:8px">${d.industry} · ${d.revenue_band} · ${d.erp_stack}</span><br><br>
<b>🚨 Primary Trigger:</b> ${d.primary_trigger} &nbsp;<span style="color:${urgencyColor};font-weight:700;font-size:.75rem">● ${d.trigger_urgency} Urgency</span><br>
<b>Tax Risk:</b> ${d.tax_risk}<br>
<b>Competitive Intel:</b> ${d.competitive_intel}<br><br>
<b>Top Contacts</b><br>
<div style="overflow-x:auto"><table style="width:100%;font-size:.75rem;border-collapse:collapse;min-width:600px">
<tr style="background:#f3f4f6;font-size:.72rem">
  <th style="padding:5px 7px;text-align:left">Contact</th><th style="padding:5px 7px;text-align:left">Title</th><th style="padding:5px 7px">Type</th><th style="padding:5px 7px;text-align:left">Why They Matter</th><th style="padding:5px 7px;text-align:left">Opening Angle</th>
</tr>${contactRows}</table></div><br>
<b>Recommended Play:</b> ${d.recommended_play}<br><br>
<div style="background:#fff8f0;border-left:3px solid #e8520a;padding:10px 14px;border-radius:0 6px 6px 0;font-size:.82rem">
  <b style="font-size:.72rem;text-transform:uppercase;letter-spacing:.5px;color:#e8520a">Cold Call Opener</b><br>
  <i>"${d.talk_track_opener}"</i>
</div><br>
<span style="color:#6b7280;font-size:.75rem">⚙ Live Agent · Confidence ${d.confidence}%</span>`;
}

function toCsv(d) {
  const header = ['Company','Industry','Revenue Band','ERP Stack','Primary Trigger','Urgency','Tax Risk','Competitive Intel','Recommended Play','Talk Track Opener','Confidence'];
  const base = [d.company, d.industry, d.revenue_band, d.erp_stack, d.primary_trigger, d.trigger_urgency, d.tax_risk, d.competitive_intel, d.recommended_play, d.talk_track_opener, `${d.confidence}%`];
  const contactHeader = ['Contact Name','Contact Title','Contact Type','Rationale','Outreach Angle'];
  const rows = [
    [...header, ...contactHeader].join(','),
    ...(d.contacts || []).map((c, i) => [
      ...(i === 0 ? base : Array(base.length).fill('')),
      c.name, c.title, c.type, c.rationale, c.outreach_angle
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
  ];
  return rows.join('\r\n');
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { account } = req.body || {};
  if (!account || account.trim().length < 2) return res.status(400).json({ error: 'Please provide a company name or account description.' });

  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `Account: ${account.trim()}` }],
    });

    let data;
    try { data = JSON.parse(message.content[0].text); }
    catch { return res.status(500).json({ error: 'Agent returned malformed data — please try again.' }); }

    return res.status(200).json({ html: toHtml(data), csv: toCsv(data), company: data.company });
  } catch (err) {
    console.error('Account research agent error:', err);
    return res.status(500).json({ error: 'Agent error — please try again.' });
  }
}
