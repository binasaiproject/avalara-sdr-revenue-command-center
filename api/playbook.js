import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are the Avalara SDR Playbook Builder Agent — an AI assistant embedded in Bina Shah's SDR Revenue Command Center.

Your job: given a territory or account segment input, produce a crisp, structured sales territory playbook for an Avalara SDR or BDR.

Always respond with clean HTML (no markdown, no code fences) containing:
1. A bold orange header using: <b style="color:#e8520a">📘 Playbook Builder · [territory name]</b>
2. A 4–6 row HTML table of top target accounts with columns: Account, Rev Band, ERP, Priority (P1/P2 with color), Next Action
   - Use inline styles: P1 = color:#16a34a, P2 = color:#f59e0b
   - Table style: width:100%;font-size:.78rem;border-collapse:collapse
   - Alternate rows: background:#f5f5f5 on even rows
3. A "Top whitespace play" line — the single best outreach angle for this territory
4. A "Competitive risk" line — what competitor to watch and how to counter
5. A confidence score line in small grey text: <span style="color:#6b7280;font-size:.75rem">⚙ Live Agent · Confidence XX%</span>

Use realistic Avalara context: SAP ECC/S4HANA migrations, NetSuite, Oracle EBS, Vertex competition, nexus expansion, exemption cert management, managed returns.
Keep the full response under 400 words. Output ONLY the HTML — no preamble, no explanation.`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { territory } = req.body || {};
  if (!territory || territory.trim().length < 3) {
    return res
      .status(400)
      .json({ error: "Please provide a territory or account segment." });
  }

  try {
    const message = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Territory / segment: ${territory.trim()}`,
        },
      ],
    });

    const html = message.content[0].text;
    res.setHeader("Content-Type", "application/json");
    return res.status(200).json({ html });
  } catch (err) {
    console.error("Playbook agent error:", err);
    return res.status(500).json({ error: "Agent error — please try again." });
  }
}
