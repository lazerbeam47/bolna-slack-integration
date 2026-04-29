/**
 * Bolna → Slack Alert Server
 *
 * Receives Bolna call-ended webhooks and forwards a summary to Slack.
 *
 * ENV variables required:
 *   SLACK_WEBHOOK_URL  — your Slack Incoming Webhook URL
 *   PORT               — (optional) port to listen on, default 3000
 */
require("dotenv").config();
const express = require("express");
const app = express();
app.use(express.json());

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
const PORT = process.env.PORT || 3000;

if (!SLACK_WEBHOOK_URL) {
  console.error("❌  SLACK_WEBHOOK_URL env variable is required");
  process.exit(1);
}

// ── Slack helper ──────────────────────────────────────────────────────────────

async function sendSlackAlert({ id, agent_id, duration, transcript }) {
  // Truncate very long transcripts so the Slack message stays readable
  const MAX_TRANSCRIPT_LENGTH = 2000;
  const truncatedTranscript =
    transcript && transcript.length > MAX_TRANSCRIPT_LENGTH
      ? transcript.slice(0, MAX_TRANSCRIPT_LENGTH) + "…  _(truncated)_"
      : transcript || "_No transcript available_";

  const payload = {
    text: `📞 *Bolna Call Ended*`,
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "📞 Bolna Call Ended",
          emoji: true,
        },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Call ID:*\n\`${id}\`` },
          { type: "mrkdwn", text: `*Agent ID:*\n\`${agent_id}\`` },
          {
            type: "mrkdwn",
            text: `*Duration:*\n${duration != null ? `${duration}s` : "N/A"}`,
          },
        ],
      },
      { type: "divider" },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Transcript:*\n${truncatedTranscript}`,
        },
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `Received at ${new Date().toISOString()}`,
          },
        ],
      },
    ],
  };

  const res = await fetch(SLACK_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Slack responded ${res.status}: ${text}`);
  }
}

// ── Webhook endpoint ──────────────────────────────────────────────────────────

app.post("/webhook/bolna", async (req, res) => {
  const body = req.body;

  console.log("Received Bolna webhook:", JSON.stringify(body, null, 2));

  // Only alert when the call is fully completed
  if (body.status !== "completed") {
    console.log(`Skipping status: ${body.status}`);
    return res.status(200).json({ ok: true, skipped: true });
  }

  // Extract the four required fields
  // duration lives inside telephony_data per the Bolna payload spec
  const id = body.id;
  const agent_id = body.agent_id;
  const duration = body.telephony_data?.duration ?? body.conversation_time;
  const transcript = body.transcript;

  try {
    await sendSlackAlert({ id, agent_id, duration, transcript });
    console.log("✅  Slack alert sent for call", id);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Failed to send Slack alert:", err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// Health-check
app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.listen(PORT, () => {
  console.log(`🚀  Server listening on port ${PORT}`);
  console.log(`    Webhook URL: http://your-domain:${PORT}/webhook/bolna`);
});