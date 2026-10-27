# Dispatch Exception CoPilot — AI Service

The **external** AI service for the Dispatch Exception CoPilot. It implements the
HTTP contract dictated by [`../AI_INTEGRATION.md`](../AI_INTEGRATION.md): the
Next.js app's `analyzeExceptionText` seam makes one `fetch` to this service and
consumes whatever it returns.

It turns raw, chaotic courier updates — often **Arabizi / mixed Arabic-English**
(e.g. `"3atal el van 2rib men Zahle, 40 tard 3ande"`) — into a strict,
in-taxonomy record plus a Markdown action plan and a customer SMS.

- **Primary path:** Claude (`claude-opus-4-8`) with **structured outputs**, so
  `severity`/`category` are constrained to the exact Prisma enums — never coerced.
- **Fallback path:** a deterministic keyword classifier (ported from the app's
  original mock) runs when the model is unavailable, so the service is runnable
  with zero external dependencies for demos and tests.
- **Failure is a designed path:** timeouts, upstream errors, refusals, and
  out-of-taxonomy output become the documented error body, which drives the
  app's Fallback Mode (manual triage).

## HTTP contract

```
POST /v1/exceptions:analyze
Authorization: Bearer <AI_SERVICE_API_KEY>
Content-Type: application/json
```

Request:

```json
{ "text": "3atal el van...", "shipmentId": "uuid", "requestId": "uuid" }
```

Success — `200 OK`:

```json
{
  "structuredRecord": {
    "severity": "HIGH",
    "category": "VEHICLE_ISSUE",
    "etaImpact": "+2-4 hrs (same-day at risk)"
  },
  "actionPlan": "**Recommended Action Plan — Vehicle Issue (HIGH)**\n\n1. ...",
  "customerNotification": "Hi! There's a short delay with your delivery..."
}
```

- `severity` ∈ `LOW | HIGH | CRITICAL`; `category` ∈ `VEHICLE_ISSUE | CUSTOMER_ABSENT | WEATHER`.
- Any failure returns a non-2xx with `{ "error": { "message", "code", "requestId" } }`.
  Codes are free-form (`TIMEOUT`, `RATE_LIMITED`, `INVALID_OUTPUT`, `REFUSED`, `DEMO_FAIL`, `UNAUTHORIZED`, ...).

`GET /healthz` returns `{ "status": "ok", "model_available": bool }`.

## Run locally

```bash
cd ai-service
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # set AI_SERVICE_API_KEY; ANTHROPIC_API_KEY optional
uvicorn app.main:app --reload --port 8000
```

Smoke test:

```bash
curl -s http://localhost:8000/v1/exceptions:analyze \
  -H "Authorization: Bearer change-me-shared-secret" \
  -H "Content-Type: application/json" \
  -d '{"text":"3atal el van 2rib men Zahle, 40 tard 3ande","shipmentId":"s-1","requestId":"r-1"}' | jq
```

Without `ANTHROPIC_API_KEY`, the keyword classifier answers — same shape, no network.
Interactive docs: http://localhost:8000/docs.

## Configuration

| Env var | Default | Notes |
| --- | --- | --- |
| `AI_SERVICE_API_KEY` | _(unset)_ | Bearer secret. **Unset = auth disabled** (dev only). |
| `ANTHROPIC_API_KEY` | _(unset)_ | Unset → keyword fallback only. |
| `ANTHROPIC_MODEL` | `claude-opus-4-8` | Analysis model. |
| `ANTHROPIC_EFFORT` | `low` | Keeps p95 latency inside the client's 8s timeout. |
| `ANTHROPIC_TIMEOUT_SECONDS` | `7.0` | Per-call cap; fail fast below the client timeout. |
| `ANTHROPIC_MAX_TOKENS` | `1500` | |
| `ENABLE_KEYWORD_FALLBACK` | `true` | Fall back to keywords on model failure. |
| `DEMO_FAIL_HOOK` | `true` | Input containing `fail` → error (exercises Fallback Mode). |

## Docker

```bash
docker build -t copilot-ai-service .
docker run --rm -p 8000:8000 --env-file .env copilot-ai-service
```

## Tests

```bash
pip install -r requirements.txt
pytest            # network-free: success, auth, taxonomy, fallback, malformed, mocked-Claude
```

## Wiring the Next.js app to this service

In the app repo, point the seam at this service (per `AI_INTEGRATION.md` → Practical steps):

1. Add to the app's `.env` / Railway: `AI_SERVICE_URL=http://localhost:8000`,
   `AI_SERVICE_API_KEY=<same secret>`, `AI_SERVICE_TIMEOUT_MS=8000`.
2. Replace the body of `analyzeExceptionText` in `src/lib/mock-ai.ts` with a
   `fetch` to `${AI_SERVICE_URL}/v1/exceptions:analyze` carrying the Bearer key,
   returning the parsed `AnalysisResult`. Everything downstream is unchanged.
