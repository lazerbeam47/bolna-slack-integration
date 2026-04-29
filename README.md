# 📞 Bolna → Slack Integration

Automatically sends a Slack alert whenever a [Bolna](https://bolna.ai) voice call ends — capturing the **Call ID**, **Agent ID**, **Duration**, and full **Transcript** in real time.

> 🚀 **Already deployed at:** https://bolna-slack-integration-ybbw.onrender.com

---

## How It Works

```
Bolna call ends
  → Bolna POSTs webhook payload to your server
    → Server filters for status = "completed"
      → Formatted Slack alert is sent to your channel
```

---

## Demo

When a call ends, you get an alert like this in Slack:

```
📞 Bolna Call Ended
─────────────────────────────
Call ID:    8eeb28ac-90d3-485b-aabe-a3390fa3b411
Agent ID:   35e731a4-cd93-478a-a982-7a8a3a0d7eb5
Duration:   91s
─────────────────────────────
Transcript:
Agent: Hi, this is a demo call from Bolna.
User: Hi, how are you doing?
Agent: I'm glad to hear you're doing great! How can I assist you today?
...
─────────────────────────────
Received at 2026-04-28T19:00:13.723Z
```

---

## Tech Stack

- **Node.js** + **Express** — webhook server
- **Slack Incoming Webhooks** — Slack alerts
- **Bolna** — AI voice call platform
- **Render** — hosting

---

## Getting Started

### Option A — From ZIP

#### 1. Unzip and enter the folder

```bash
unzip bolna-slack-integration.zip
cd clean_bolna
```

#### 2. Install dependencies

```bash
npm install
```

#### 3. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and add your Slack webhook URL:

```env
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
PORT=3000
```

#### 4. Run the server

```bash
node server.js
# 🚀 Server listening on port 3000
```

---

### Option B — From GitHub

#### 1. Clone the repo

```bash
git clone https://github.com/lazerbeam47/bolna-slack-integration
cd bolna-slack-integration
```

#### 2. Install dependencies

```bash
npm install
```

#### 3. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and add your Slack webhook URL:

```env
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
PORT=3000
```

#### 4. Run the server

```bash
node server.js
# 🚀 Server listening on port 3000
```

---

### After Running (Both Options)

#### 5. Expose it publicly via Cloudflare Tunnel

Bolna needs a public URL to POST to. Use Cloudflare Tunnel — no account needed:

```bash
npx cloudflared tunnel --url http://localhost:3000
# → https://some-random-name.trycloudflare.com
```

#### 6. Update your Bolna agent webhook

1. Go to **https://platform.bolna.ai** → open your agent
2. Click the **Analytics Tab**
3. Paste your tunnel URL in **"Push all execution data to webhook"**:
   ```
   https://some-random-name.trycloudflare.com/webhook/bolna
   ```
4. Click **Save agent**

#### 7. Test it

```bash
curl -X POST http://localhost:3000/webhook/bolna \
  -H "Content-Type: application/json" \
  -d '{
    "id": 12345,
    "agent_id": "d311e737-70e6-4075-bef6-c0ef3a7026b4",
    "status": "completed",
    "transcript": "Agent: Hello!\nUser: Hi, I need help.",
    "telephony_data": { "duration": 67 }
  }'
```

You should see a Slack message appear instantly. ✅

---

## Deployment Status

### ✅ Already Deployed

The server is live at:
```
https://bolna-slack-integration-ybbw.onrender.com
```

Bolna webhook URL is configured to:
```
https://bolna-slack-integration-ybbw.onrender.com/webhook/bolna
```

> ⚠️ **If the Render free tier limit is hit**, you can either deploy your own instance or run it locally using the steps above.

---

## Deploy Your Own Instance on Render (Free)

1. Fork this repo to your GitHub account
2. Go to **https://render.com** → Sign up → **New Web Service** → connect your forked repo
3. Set:
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
4. Under **Environment**, add:
   ```
   SLACK_WEBHOOK_URL = your Slack webhook URL
   ```
5. Deploy → copy your new Render URL (e.g. `https://your-app.onrender.com`)
6. Update your Bolna agent webhook to:
   ```
   https://your-app.onrender.com/webhook/bolna
   ```

---

## Create a Slack Incoming Webhook

If you don't have one yet:

1. Go to **https://api.slack.com/apps** → **Create New App** → From scratch
2. Name it (e.g. `Bolna Alerts`) and select your workspace
3. Left sidebar → **Incoming Webhooks** → toggle **On**
4. Click **Add New Webhook to Workspace** → pick a channel (e.g. `#calls`)
5. Copy the webhook URL:
   ```
   https://hooks.slack.com/services/T.../B.../xxx
   ```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/webhook/bolna` | Receives Bolna call events |
| `GET` | `/health` | Health check — returns `{"status":"ok"}` |

---

## Webhook Payload

Bolna sends this payload on every call status change. The server only acts on `status = "completed"`.

```json
{
  "id": "8eeb28ac-90d3-485b-aabe-a3390fa3b411",
  "agent_id": "35e731a4-cd93-478a-a982-7a8a3a0d7eb5",
  "status": "completed",
  "transcript": "Agent: Hello!\nUser: Hi...",
  "telephony_data": {
    "duration": 91,
    "to_number": "+91XXXXXXXXXX",
    "from_number": "+1XXXXXXXXXX"
  }
}
```

| Field | Source in payload |
|-------|-------------------|
| `id` | `body.id` |
| `agent_id` | `body.agent_id` |
| `duration` | `body.telephony_data.duration` (falls back to `body.conversation_time`) |
| `transcript` | `body.transcript` |

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SLACK_WEBHOOK_URL` | ✅ Yes | Slack Incoming Webhook URL |
| `PORT` | ❌ No | Port to run on (default: `3000`) |

---

## Project Structure

```
bolna-slack-integration/
├── server.js        # Express server — webhook handler + Slack sender
├── package.json
├── .env.example     # Environment variable template
├── .gitignore
└── README.md
```

---

## Security Notes

- Never commit your `.env` file — it's listed in `.gitignore`
- Rotate your Slack webhook URL if it's ever exposed publicly
- Bolna sends webhooks from IP `13.203.39.153` — whitelist it in production

---

## License

MIT
