# Ollive Inference Logger

A full-stack LLM inference logging and ingestion system built for the Ollive Founding Fullstack Engineer assignment.

## Live Demo
> [Add your deployed URL here]

---

## Architecture Overview

```
┌─────────────────┐     ┌──────────────────────────────────────────┐
│   React Frontend│     │             Node.js Backend               │
│                 │     │                                           │
│  ┌───────────┐  │     │  ┌──────────┐   ┌──────────────────────┐ │
│  │ OlliveSDK │──┼─────┼─▶│ /api/chat│──▶│   llmWrapper.js      │ │
│  │ (wrapper) │  │     │  └──────────┘   │  (SDK / Middleware)   │ │
│  └───────────┘  │     │                 │  - captures latency   │ │
│                 │     │                 │  - token usage        │ │
│  ┌───────────┐  │     │                 │  - timestamps         │ │
│  │  Chat UI  │  │     │                 │  - input/output prev  │ │
│  └───────────┘  │     │                 └──────────┬───────────┘ │
│                 │     │                            │              │
│  ┌───────────┐  │     │  ┌──────────┐             ▼              │
│  │Logs Board │──┼─────┼─▶│/api/logs │   ┌──────────────────┐    │
│  └───────────┘  │     │  └──────────┘   │   Groq API       │    │
│                 │     │                 │   Gemini API      │    │
│  ┌───────────┐  │     │  ┌─────────────┐└──────────────────┘    │
│  │Conv. List │──┼─────┼─▶│/api/convers.│                        │
│  └───────────┘  │     │  └─────────────┘                        │
└─────────────────┘     └──────────────────┬──────────────────────┘
                                            │
                                            ▼
                              ┌─────────────────────────┐
                              │        MongoDB           │
                              │  - messages collection  │
                              │  - inferencelogs coll.  │
                              └─────────────────────────┘
```

### Ingestion Flow
1. User sends a message from the React frontend via `OlliveSDK`
2. Backend `POST /api/chat` receives the message + sessionId
3. Full conversation history is loaded from MongoDB (multi-turn context)
4. `llmWrapper.js` calls Groq or Gemini, tracking start time
5. On response: latency, token usage, input/output previews are captured
6. Log is written to `InferenceLog` collection (non-blocking, fire-and-forget)
7. Response is returned to the client with sessionId

---

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite |
| Backend | Node.js + Express |
| Database | MongoDB + Mongoose |
| Primary LLM | Groq (Llama 3.1 8B Instant) |
| Secondary LLM | Google Gemini 1.5 Flash |
| Containerization | Docker + Docker Compose |

---

## Setup Instructions

### Option 1: Docker (recommended)

```bash
# Clone the repo
git clone <repo-url>
cd ollive-inference-logger

# Add your API keys
cp .env.example .env
# Edit .env with your GROQ_API_KEY and GEMINI_API_KEY

# One-command start
docker compose up --build
```

App runs at: http://localhost:5173

### Option 2: Local Dev

**Backend**
```bash
cd backend
cp .env.example .env
# Add your API keys to .env
npm install
npm run dev
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
```

**MongoDB** — make sure MongoDB is running locally on port 27017.

---

## Schema Design

### Messages Collection
```js
{
  sessionId: String,   // groups messages into conversations
  role: "user" | "assistant",
  content: String,
  timestamp: Date
}
```

### InferenceLogs Collection
```js
{
  sessionId: String,
  model: String,          // e.g. "llama-3.1-8b-instant"
  provider: String,       // "groq" | "gemini"
  latencyMs: Number,
  promptTokens: Number,
  completionTokens: Number,
  totalTokens: Number,
  status: "success" | "error",
  error: String,
  inputPreview: String,   // first 100 chars
  outputPreview: String,  // first 100 chars
  timestamp: Date
}
```

**Design decisions:**
- Separate collections for messages and logs — clean separation of concerns; logs can grow independently
- `sessionId` as shared key — allows joining conversation context with inference metadata without foreign keys
- Non-blocking log writes — inference logging never blocks the response path

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat` | Send message, get response |
| GET | `/api/conversations` | List all conversations |
| GET | `/api/conversations/:id` | Get messages for a session |
| DELETE | `/api/conversations/:id` | Cancel/delete a conversation |
| GET | `/api/logs` | Get inference logs |
| GET | `/api/logs/stats` | Aggregated provider stats |
| GET | `/health` | Health check |

---

## Features Completed

### Core
- [x] Multi-turn chatbot with conversation memory
- [x] Lightweight SDK wrapper capturing latency, tokens, timestamps, status
- [x] Ingestion pipeline with validation and DB storage
- [x] MongoDB with sensible schema design

### Bonus
- [x] Multi-provider support (Groq + Gemini)
- [x] Docker Compose one-command setup
- [x] Latency + token + error stats dashboard
- [x] List conversations
- [x] Resume a conversation
- [x] Cancel/delete a conversation

---

## Tradeoffs Made

1. **Fire-and-forget logging** — Logs are written non-blocking to keep response latency low. The risk: a DB failure could drop logs. Mitigation: add a retry queue with more time.

2. **Client-side session ID** — Session IDs are generated on the frontend (UUID v4). Simple and stateless, but means no auth/user scoping. Fine for this scope.

3. **No streaming yet** — Responses are returned as complete strings. Streaming would significantly improve perceived latency.

4. **SQLite vs MongoDB** — MongoDB chosen for flexible schema as inference metadata fields may evolve. PostgreSQL would be better for analytics queries at scale.

---

## What I'd Improve With More Time

- [ ] Streaming responses (SSE / WebSocket)
- [ ] PII redaction in log previews
- [ ] Event-based architecture (Redis pub/sub for log ingestion)
- [ ] Self-hosted k8s deployment
- [ ] Auth + per-user conversation scoping
- [ ] Real-time dashboard with auto-refresh
- [ ] Rate limiting and request queuing

---

## Scaling Considerations

- **Ingestion pipeline**: Replace direct MongoDB writes with a queue (Redis/Kafka) to handle burst traffic without dropping logs
- **LLM calls**: Add connection pooling and timeout handling for provider failures
- **MongoDB**: Index on `sessionId` + `timestamp` for query performance at scale
- **Horizontal scaling**: Backend is stateless — can run multiple instances behind a load balancer
