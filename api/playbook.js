const Anthropic = require("@anthropic-ai/sdk");

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are the Avalara SDR Playbook Builder Agent embedded in Bina Shah's SDR Revenue Command Center.

Given a territory brief, produce a structured territory playbook. Respond with ONLY valid JSON (no markdown, no code fences) matching this exact schema:

{
  "territory": "<short territory name>",
  "accounts": [
    {
      "account": "<Account Name>",
      "revenue": "<e.g. $145M>",
      "erp": "<ERP system>",
      "priority": "<P1 or P2>",
      "trigger": "<1-sentence buying trigger>",
      "opening_angle": "<specific cold call / email opening angle>",
      "competitor": "<incumbent vendor or 'None'>",
      "co_sell": "<partner name or 'None'>",
      "top_contact": "<Name, Title — rationale>"
    }
  ],
  "whitespace_play": "<single best outreach play for the territory>",
  "competitive_risk": "<top competitor and counter-strategy>",
  "thirty_day_focus": "<top 3 actions for the first 30 days as a bulleted string>",
  "confidence": <number 80-97>
}

Rules:
- Include 5–10 accounts, ordered P1 first then P2
- Use realistic Avalara context: SAP ECC/S4HANA migrations, NetSuite, Oracle EBS, Vertex/TaxJar/DIY competition, nexus expansion, managed returns
- opening_angle must be specific to that account's trigger — not generic
- If the input mentions a specific account, use it; otherwise invent realistic ones for the territory
- Output ONLY the JSON object, nothing else`;

function accountsToHtml(accounts, territory, whitespace, competitive, thirtyDay, confidence) {
  const rows = accounts.map((a, i) => {
    const bg = i % 2 === 1 ? ' style="background:#f9f9f9"' : '';
    const pColor = a.priority === 'P1' ? '#16a34a' : '#f59e0b';
    return `<tr${bg}>
      <td style="padding:4px 7px"><b>${a.account}</b></td>
      <td style="padding:4px 7px">${a.revenue}</td>
      <td style="padding:4px 7px">${a.erp}</td>
      <td style="padding:4px 7px"><span style="color:${pColor};font-weight:700">${a.priority}</span></td>
      <td style="padding:4px 7px">${a.trigger}</td>
      <td style="padding:4px 7px;font-style:italic;color:#374151">${a.opening_angle}</td>
      <td style="padding:4px 7px">${a.competitor}</td>
      <td style="padding:4px 7px">${a.co_sell}</td>
      <td style="padding:4px 7px;color:#6366f1">${a.top_contact}</td>
    </tr>`;
  }).join('');

  return `<b style="color:#e8520a">📘 Playbook Builder · ${territory}</b><br><br>
<div style="overflow-x:auto">
<table style="width:100%;font-size:.75rem;border-collapse:collapse;min-width:700px">
<tr style="background:#f3f4f6;font-size:.72rem">
  <th style="padding:5px 7px;text-align:left">Account</th>
  <th style="padding:5px 7px">Revenue</th>
  <th style="padding:5px 7px">ERP</th>
  <th style="padding:5px 7px">Priority</th>
  <th style="padding:5px 7px;text-align:left">Trigger</th>
  <th style="padding:5px 7px;text-align:left">Opening Angle</th>
  <th style="padding:5px 7px">Incumbent</th>
  <th style="padding:5px 7px">Co-Sell</th>
  <th style="padding:5px 7px;text-align:left">Top Contact</th>
</tr>
${rows}
</table>
</div>
<br>
<b>Whitespace Play:</b> ${whitespace}<br>
<b>Competitive Risk:</b> ${competitive}<br>
<b>30-Day Focus:</b><br>${thirtyDay.replace(/•/g,'&bull;').replace(/\n/g,'<br>')}<br><br>
<span style="color:#6b7280;font-size:.75rem">⚙ Live Agent · Confidence ${confidence}%</span>`;
}

function accountsToCsv(accounts, territory, whitespace, competitive, thirtyDay, confidence) {
  const header = [
    'Territory','Account','Revenue','ERP','Priority','Trigger',
    'Opening Angle','Incumbent','Co-Sell Partner','Top Contact',
    'Whitespace Play','Competitive Risk','30-Day Focus','Confidence'
  ];
  const rows = accounts.map(a => [
    territory, a.account, a.revenue, a.erp, a.priority,
    a.trigger, a.opening_angle, a.competitor, a.co_sell, a.top_contact,
    whitespace, competitive, thirtyDay, `${confidence}%`
  ].map(v => `"${String(v).replace(/"/g,'""')}"`).join(','));
  return [header.join(','), ...rows].join('\r\n');
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { territory } = req.body || {};
  if (!territory || territory.trim().length < 3) {
    return res.status(400).json({ error: 'Please provide a territory or account segment.' });
  }

  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `Territory brief:\n\n${territory.trim()}` }],
    });

    let json;
    try {
      json = JSON.parse(message.content[0].text);
    } catch {
      return res.status(500).json({ error: 'Agent returned malformed data — please try again.' });
    }

    const { accounts = [], territory: t, whitespace_play: wp, competitive_risk: cr, thirty_day_focus: tdf, confidence: conf } = json;
    const html = accountsToHtml(accounts, t, wp, cr, tdf, conf);
    const csv  = accountsToCsv(accounts, t, wp, cr, tdf, conf);

    return res.status(200).json({ html, csv, territory: t });
  } catch (err) {
    console.error('Playbook agent error:', err);
    return res.status(500).json({ error: 'Agent error — please try again.' });
  }
}
