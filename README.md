# Dispatch Exception CoPilot

A full-stack logistics operations dashboard that turns messy courier updates, including Arabizi and mixed Arabic-English, into structured exception records, recommended actions, and customer notifications.

The project demonstrates a practical engineering pattern: **AI assists triage, while deterministic business rules control shipment state changes**. High-severity exceptions halt shipments, deliveries with unresolved exceptions are blocked, and state changes are recorded in an audit log.

## How it works

1. A dispatcher selects a shipment and submits a raw delivery update.
2. The analyzer returns a severity, category, ETA impact, action plan, and customer message.
3. The dispatcher reviews the proposed result and approves it, or uses manual fallback if analysis fails.
4. Server-side transactions enforce shipment rules and record an audit trail.

## Main features

- Shipment dashboard with status and exception severity.
- Support for messy, mixed-language courier notes, including Arabizi.
- AI service with OpenAI structured output and a deterministic keyword fallback.
- Manual triage fallback for unavailable or invalid AI responses.
- Transactional business rules:
  - A shipment cannot be marked delivered while an exception remains unresolved.
  - High and critical exceptions automatically halt the shipment.
  - Shipment and exception status changes create audit records.
- PostgreSQL persistence through Prisma.
- Unit and database-backed integration tests.

## Architecture

| Component | Technology | Responsibility |
| --- | --- | --- |
| Web app | Next.js App Router, React, TypeScript, Tailwind CSS | Dashboard, review flow, server actions |
| Data layer | PostgreSQL, Prisma | Shipments, exceptions, state transitions, audit log |
| AI service | Python, FastAPI, OpenAI API | Structured classification and action recommendations |
| Fallback | Deterministic keyword classifier | Keeps demos and testing usable without an API key |
| Local orchestration | Docker Compose | Starts PostgreSQL, the AI service, and web app |

The AI service is optional for local development. If `AI_SERVICE_URL` is unset, the web app uses its built-in mock analyzer. The Python service also supports keyword fallback when `OPENAI_API_KEY` is not configured.

## Run with Docker Compose

Requirements: Docker Engine and Docker Compose.

1. Clone the repository and enter its directory.
2. Start the services:

   ```bash
   docker compose up --build
   ```

3. Open the web app at [http://localhost:3000](http://localhost:3000). The AI service health endpoint is [http://localhost:8000/healthz](http://localhost:8000/healthz).

The compose configuration uses development-only credentials and a default shared API key. **Do not use these defaults in a deployed environment.** For live model analysis, provide an OpenAI API key and a strong shared `AI_SERVICE_API_KEY` through your local environment. Never commit real credentials.

To seed the database, run:

```bash
docker compose --profile seed run --rm seed
```

## Run services separately

### Web app

See [web-app/README.md](web-app/README.md) for Node.js requirements, Prisma commands, local development, and testing.

### AI service

See [ai-service/README.md](ai-service/README.md) for Python setup, environment variables, API examples, and tests.

## Configuration

- `DATABASE_URL`: PostgreSQL connection string for the web app.
- `AI_SERVICE_URL`: optional base URL of the Python service. Leave unset to use the built-in mock.
- `AI_SERVICE_API_KEY`: shared bearer secret used between the web app and AI service.
- `OPENAI_API_KEY`: optional API key for live OpenAI analysis. Without it, the Python service can use the deterministic keyword fallback.
- `OPENAI_MODEL`: OpenAI model name; defaults to `gpt-4o-mini`.

Use the example environment files as templates. Keep secrets out of source control and rotate credentials if they were ever exposed.

## Important scope and limitations

- AI output is a triage recommendation, not proof of a problem or an autonomous delivery decision.
- The taxonomy is deliberately fixed to the project's current severity and category enums.
- The keyword fallback is a demo-friendly heuristic, not a replacement for model-based language understanding.
- Validate the state-machine and AI flows with test data before any real operational use.

## Tests

- Web app unit tests: run `npm test` from `web-app/`.
- Web app integration tests: run `npm run test:integration` from `web-app/` with PostgreSQL running and migrations applied. Use a disposable local database, never production.
- AI service tests: run `pytest` from `ai-service/`.

## Attribution

This project builds on an existing software-engineering challenge codebase and has been adapted for a personal portfolio. Preserve any applicable license terms and required attribution when reusing or redistributing the underlying work.
