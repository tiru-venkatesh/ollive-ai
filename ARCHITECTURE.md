# Architecture Notes — Ollive Inference Logger

---

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                      │
│   Chat UI  │  Conversations List  │  Logs Dashboard          │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP / SSE
┌────────────────────────▼────────────────────────────────────┐
│                     BACKEND (Express / Node.js)              │
│                                                              │
│   /api/chat ──► llmWrapper.js ──► Groq API (SSE stream)     │
│                     │                                        │
│                     └──► PII Redactor                        │
│                              │                               │
│   /api/logs  ◄───────────────┘  (post-stream log ingestion) │
│   /api/conversations                                         │
└────────────────────────┬────────────────────────────────────┘
                         │ Mongoose
┌────────────────────────▼────────────────────────────────────┐
│                        MongoDB Atlas                         │
│   inference_logs  │  conversations  │  messages              │
└─────────────────────────────────────────────────────────────┘
```

---

## Ingestion Flow

1. **Client sends message** — `POST /api/chat` with `{ message, sessionId, history }`
2. **llmWrapper intercepts** — records `startTime`, builds prompt, appends conversation history
3. **Groq API called** — streaming response via Groq SDK
4. **SSE stream opened** — tokens forwarded to client as they arrive; UI renders live
5. **Stream completes** — `latencyMs` calculated as `Date.now() - startTime`
6. **PII redaction** — input/output previews stripped of emails, phone numbers, names before persistence
7. **Log ingested** — `POST /api/logs` stores `InferenceLog` document to MongoDB
8. **Message persisted** — user + assistant messages saved to `messages` collection, linked by `sessionId`
9. **Dashboard reads** — `GET /api/logs` aggregates data for latency, token, and error charts

---

## Logging Strategy

Logs are captured **inside the LLM wrapper** (`llmWrapper.js`), not in route handlers. This keeps observability concerns co-located with the inference call and makes it easy to extend to multiple providers — each provider path feeds into the same log shape.

**What is logged per inference event:**

| Field | Source |
|---|---|
| `sessionId` | Client-generated UUID, passed in request |
| `provider` | Hardcoded at call site (`"groq"`) |
| `model` | From Groq response or config |
| `latencyMs` | `Date.now()` delta around the full stream |
| `promptTokens` | From Groq usage object |
| `completionTokens` | From Groq usage object |
| `totalTokens` | Sum of above |
| `status` | `"success"` or `"error"` |
| `inputPreview` | First 200 chars of user message (PII redacted) |
| `outputPreview` | First 200 chars of assistant response (PII redacted) |
| `timestamp` | Server-side `new Date()` at log creation |

Logs are written **after** the stream completes (not mid-stream), which keeps the hot path clean and ensures token counts are available from the final Groq response object.

---

## PII Redaction

The `piiRedactor.js` utility applies regex-based redaction before any user input or model output is stored:

- Email addresses → `[EMAIL]`
- Phone numbers → `[PHONE]`
- Common name patterns → `[NAME]` *(heuristic)*
- Credit card numbers → `[CC]`

Redaction applies only to **preview fields** in inference logs. Full message content stored in the `messages` collection is currently unredacted — in production, this would also be processed or encrypted at rest.

---

## Scaling Considerations

**Current architecture** is appropriate for low-to-medium traffic (single instance, synchronous logging).

**At scale, the following changes would apply:**

### Decouple Logging from Hot Path
Replace direct `POST /api/logs` with a **message queue** (Redis Streams or Kafka).

```
Groq stream complete
        ↓
Publish log event → Redis Stream
        ↓
Log consumer worker → validates → writes MongoDB
```

This removes DB write latency from the user-facing response path entirely.

### Horizontal Scaling
- Backend is stateless (no in-memory session state) — safe to run multiple instances behind a load balancer
- MongoDB Atlas scales reads with replica sets; writes scale with sharding on `sessionId`
- SSE connections are per-instance — a sticky session or connection broker (e.g., Redis pub/sub) would be needed for multi-instance SSE at scale

### Database Indexes
Production indexes to add:

```js
InferenceLog: { sessionId: 1 }, { timestamp: -1 }, { status: 1 }
Message:      { sessionId: 1 }, { timestamp: 1 }
Conversation: { updatedAt: -1 }
```

### Caching
Dashboard aggregate queries (avg latency, total tokens, error rate) should be cached with a short TTL (e.g. 30s in Redis) rather than recalculated on every dashboard load.

---

## Failure Handling Assumptions

| Failure Scenario | Current Handling |
|---|---|
| Groq API timeout / error | `try/catch` in wrapper; `status: "error"` logged; SSE sends error event to client |
| MongoDB write failure (log) | Logged to server console; does not crash request — inference result still returned to user |
| MongoDB write failure (message) | Same — fire-and-forget persistence, response is not blocked |
| Client disconnects mid-stream | `req.on('close')` handler aborts the Groq stream; avoids token waste |
| Missing/invalid sessionId | Falls back to a generated UUID server-side |
| PII redactor throws | Wrapped in try/catch; raw preview stored with warning log rather than crashing ingestion |

**Key assumption:** Logging failures are non-fatal. Users always receive their chat response even if observability data fails to persist. Observability is a side effect, not a dependency.

---

## What Would Be Added in Production

- **OpenTelemetry** — distributed tracing with spans per inference call, DB write, and log ingestion
- **Kafka / Redis Streams** — async event-based log ingestion pipeline
- **Dead Letter Queue** — failed log events retried up to N times before DLQ
- **Rate limiting** — per-IP and per-session limits on `/api/chat`
- **Auth** — JWT session tokens; logs and conversations scoped to authenticated users
- **Kubernetes** — Helm chart with HPA on CPU/memory; separate deployments for API and log consumer
- **Alerting** — PagerDuty / Slack webhook when P95 latency > 3s or error rate > 5%
