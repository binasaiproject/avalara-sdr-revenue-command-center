const Anthropic = require("@anthropic-ai/sdk");

module.exports = async function handler(req, res) {
  const keySet = !!process.env.ANTHROPIC_API_KEY;
  const keyPreview = keySet
    ? process.env.ANTHROPIC_API_KEY.slice(0, 10) + "…"
    : "NOT SET";

  if (!keySet) {
    return res.status(200).json({
      status: "error",
      message: "ANTHROPIC_API_KEY is not set in Vercel environment variables.",
      key_preview: keyPreview,
    });
  }

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 16,
      messages: [{ role: "user", content: "Reply with: ok" }],
    });
    return res.status(200).json({
      status: "ok",
      message: "API key is valid and Claude is reachable.",
      key_preview: keyPreview,
      model_response: msg.content[0].text,
    });
  } catch (err) {
    return res.status(200).json({
      status: "error",
      message: "Key is set but API call failed: " + err.message,
      key_preview: keyPreview,
    });
  }
};
