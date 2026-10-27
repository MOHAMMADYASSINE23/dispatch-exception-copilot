# Dispatch Exception CoPilot: AI Service

A Python/FastAPI service that converts messy courier updates, including Arabizi and mixed Arabic-English, into a validated exception record, dispatcher action plan, and customer notification.

The service is optional. The Next.js app can use its built-in mock when `AI_SERVICE_URL` is not configured.

## What it does

- Accepts dispatcher text and shipment/request identifiers.
- Uses OpenAI structured outputs when `OPENAI_API_KEY` is configured.
- Restricts severity and category to the web app's allowed taxonomy.
- Falls back to a deterministic keyword classifier when the model is unavailable or model analysis fails, if fallback is enabled.
- Returns a documented error response for authentication, validation, timeout, rate-limit, and upstream failures.
- Exposes `GET /healthz` and interactive API docs at `/docs`.

## API contract

```http
POST /v1/exceptions:analyze
Authorization: Bearer <AI_SERVICE_API_KEY>
Content-Type: application/json
```

Example request:

```json
{
  "text": "3atal el van 2rib men Zahle, 40 tard 3ande",
  "shipmentId": "s-1",
  "requestId": "r-1"
}
```

A successful response includes `structuredRecord` (`severity`, `category`, `etaImpact`), `actionPlan`, and `customerNotification`. The allowed severity values are `LOW`, `HIGH`, and `CRITICAL`; allowed categories are `VEHICLE_ISSUE`, `CUSTOMER_ABSENT`, and `WEATHER`.

## Run locally

Requirements: Python 3.10+ and pip.

```bash
cd ai-service
python -m venv .venv
# Windows PowerShell:
.venv\Scripts\Activate.ps1
# macOS/Linux instead:
# source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

Set `AI_SERVICE_API_KEY` in `.env` to require bearer authentication. Set `OPENAI_API_KEY` to enable live OpenAI analysis; without it, the keyword fallback can answer demo requests without external model access. Use a strong non-default shared key when connecting this service to the web app.

Example request:

```bash
curl -X POST http://localhost:8000/v1/exceptions:analyze \
  -H "Authorization: Bearer YOUR_AI_SERVICE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"text":"van breakdown, delivery delayed","shipmentId":"s-1","requestId":"r-1"}'
```

## Configuration

| Variable | Purpose |
| --- | --- |
| `AI_SERVICE_API_KEY` | Shared bearer secret. If unset, authentication is disabled for local development only. |
| `OPENAI_API_KEY` | Optional OpenAI credential for live model analysis. |
| `OPENAI_MODEL` | Model name; defaults to `gpt-4o-mini`. |
| `OPENAI_TIMEOUT_SECONDS` | Model-call timeout budget. |
| `OPENAI_MAX_TOKENS` | Maximum generated output tokens. |
| `ENABLE_KEYWORD_FALLBACK` | Enables deterministic fallback when model analysis is unavailable. |
| `DEMO_FAIL_HOOK` | Enables the demo failure hook for inputs containing `fail`. |

## Tests

Run from this directory:

```bash
pytest
```

Tests are designed to run without a live model API key or network calls.

## Connect the web app

From the repository root, the Docker Compose setup connects the services automatically. For separate local processes, configure the web app's environment:

- `AI_SERVICE_URL=http://localhost:8000`
- `AI_SERVICE_API_KEY` set to the same value as the Python service
- `AI_SERVICE_TIMEOUT_MS=8000`

Keep the URL and shared key server-side. Never expose the bearer key in browser-prefixed environment variables.
