# AI-Powered Workflow Automation Platform
## Full Implementation Plan

**Author:** Full Stack / AI Automation Engineer
**Stack:** Next.js 14 · NestJS · BullMQ + Redis · PostgreSQL + Prisma · Google Gemini API · Vercel + Railway
**Purpose:** Portfolio project demonstrating full-stack architecture, async system design, and production-grade LLM integration

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture Summary](#2-architecture-summary)
3. [Repository Structure](#3-repository-structure)
4. [Phase 0 — Environment & Project Setup](#phase-0--environment--project-setup)
5. [Phase 1 — Core Workflow Engine](#phase-1--core-workflow-engine)
6. [Phase 2 — Persistence & Async Execution](#phase-2--persistence--async-execution)
7. [Phase 3 — Frontend Visual Flow Builder](#phase-3--frontend-visual-flow-builder)
8. [Phase 4 — Differentiator Features](#phase-4--differentiator-features)
9. [Phase 5 — Polish, Templates & Deployment](#phase-5--polish-templates--deployment)
10. [Data Model Reference](#10-data-model-reference)
11. [Final Resume & Portfolio Checklist](#11-final-resume--portfolio-checklist)

---

## 1. Project Overview

A web platform where users build automated workflows that combine deterministic steps (webhooks, HTTP calls, DB writes) with AI-driven steps (classification, extraction, generation, decision-making). The platform executes workflows asynchronously, tracks full execution history, and routes uncertain AI outputs to human review.

**Core value proposition to demonstrate:**
- You can design and build a real backend system, not just call an API in a script.
- You understand that LLMs are probabilistic and design systems that account for that.
- You can build a non-trivial, stateful frontend (not just CRUD forms).

---

## 2. Architecture Summary

```
┌─────────────────┐        ┌──────────────────┐        ┌─────────────────┐
│  Next.js Web App │ ─────▶│  NestJS API       │ ─────▶│  PostgreSQL      │
│  (React Flow UI) │◀───── │  (REST + Auth)    │◀───── │  (Prisma ORM)    │
└─────────────────┘        └────────┬─────────┘        └─────────────────┘
                                     │
                                     ▼
                            ┌──────────────────┐
                            │  BullMQ Queue     │
                            │  (Redis-backed)   │
                            └────────┬─────────┘
                                     │
                                     ▼
                            ┌──────────────────┐
                            │  Worker Process   │
                            │  Workflow Engine  │
                            │  (Node Executors) │
                            └────────┬─────────┘
                                     │
                     ┌───────────────┼───────────────┐
                     ▼               ▼               ▼
              ┌───────────┐  ┌──────────────┐  ┌─────────────┐
              │ LLM Node   │  │ Action Node  │  │ Approval     │
              │ (Gemini)   │  │ (Slack/HTTP) │  │ Node (Human) │
              └───────────┘  └──────────────┘  └─────────────┘
```

**Key principle:** The API layer never executes a workflow directly inside an HTTP request. It enqueues a job; a separate worker process executes it. This is what makes the system resilient, scalable, and realistic.

---

## 3. Repository Structure

```
ai-workflow-platform/
├── apps/
│   ├── web/                     # Next.js frontend
│   │   ├── app/
│   │   ├── components/
│   │   └── lib/
│   └── api/                     # NestJS backend (API + Worker)
│       ├── src/
│       │   ├── workflows/
│       │   ├── runs/
│       │   ├── engine/
│       │   ├── nodes/
│       │   ├── queue/
│       │   ├── ai/
│       │   └── main.ts
├── packages/
│   └── shared-types/            # Shared TypeScript interfaces
├── prisma/
│   └── schema.prisma
├── docker-compose.yml            # Local Postgres + Redis
├── .env.example
└── README.md
```

Use **npm workspaces** or **Turborepo** so `apps/web` and `apps/api` can import shared types from `packages/shared-types`. This ensures the workflow JSON schema used by the frontend builder and backend engine is always in sync.

---

## Phase 0 — Environment & Project Setup

**Goal:** Get a working skeleton running locally with all core tools wired together, before writing any business logic.

### Tasks

1. Initialize monorepo with npm workspaces (or Turborepo).
2. Scaffold `apps/web` with `npx create-next-app@latest` (TypeScript, App Router, Tailwind).
3. Scaffold `apps/api` with `nest new api` (TypeScript).
4. Set up `docker-compose.yml` with two services: `postgres` and `redis`, for local development.
5. Install and configure Prisma inside `apps/api`; point `DATABASE_URL` at the local Postgres container.
6. Install BullMQ + ioredis inside `apps/api`.
7. Create `.env.example` listing all required environment variables (see below).
8. Verify: NestJS boots, connects to Postgres via Prisma, connects to Redis via BullMQ health check.
9. Push repo to GitHub with a clear initial README (placeholder — will be expanded in Phase 5).

### Environment Variables (`.env.example`)

```
DATABASE_URL=postgresql://user:password@localhost:5432/workflow_db
REDIS_URL=redis://localhost:6379
GEMINI_API_KEY=your_key_here
JWT_SECRET=change_me
PORT=3001
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Exit Criteria
- `docker-compose up` starts Postgres + Redis locally.
- NestJS app runs on `localhost:3001` and returns a healthcheck `200 OK`.
- Next.js app runs on `localhost:3000` and can successfully call the healthcheck endpoint.
- Prisma `migrate dev` runs successfully against local Postgres.

---

## Phase 1 — Core Workflow Engine

**Goal:** Build the heart of the project — a backend service that takes a JSON-defined workflow (a DAG of nodes) and executes it step by step, including at least one real LLM call. No UI, no queue, no persistence yet. Prove the engine works via direct API calls or unit tests.

### 1.1 Define the Workflow Schema (in `packages/shared-types`)

This schema is the contract the entire system is built around. Example shape:

```typescript
interface WorkflowDefinition {
  id: string;
  name: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[]; // defines execution order / branching
}

interface WorkflowNode {
  id: string;
  type: 'trigger' | 'llm' | 'condition' | 'action' | 'approval';
  config: Record<string, any>; // node-specific settings (prompt, model, url, etc.)
}

interface WorkflowEdge {
  source: string;      // node id
  target: string;       // node id
  condition?: string;   // optional condition for branching edges
}
```

### 1.2 Build Node Executors

Create one executor class per node type, all implementing a common interface:

```typescript
interface NodeExecutor {
  execute(input: any, config: any, context: ExecutionContext): Promise<NodeResult>;
}
```

Executors to build in this phase:
- **TriggerNode** — pass-through, marks the start of the flow (real trigger wiring comes later).
- **LlmNode** — calls Gemini API with a configurable prompt template; injects upstream data into the prompt; parses structured JSON output.
- **ConditionNode** — evaluates a simple expression against the current data to decide which outgoing edge to follow.
- **ActionNode** — performs a simple side effect (start with: HTTP POST to a URL, or console log for testing).

### 1.3 Build the AI Provider Abstraction

Create a small abstraction so the LLM call isn't hardcoded to one model:

```typescript
interface AiProvider {
  complete(prompt: string, options: AiOptions): Promise<AiResponse>;
}
```

Implement `GeminiProvider` using the Google AI SDK (`@google/generative-ai`). Support passing `model` through `AiOptions` — e.g. a fast/cheap tier like `gemini-2.5-flash` vs a stronger reasoning tier like `gemini-2.5-pro` (check the current Gemini model lineup when you build this, since naming/versions update over time). This sets up the tiered-model feature in Phase 4.

### 1.4 Build the Workflow Engine Core

The `WorkflowEngineService`:
1. Accepts a `WorkflowDefinition` and an initial input payload.
2. Performs a topological traversal of nodes based on `edges`.
3. For each node, resolves the correct `NodeExecutor`, runs it, stores the output in an in-memory execution context.
4. Passes each node's output forward to connected downstream nodes.
5. Returns a final execution trace (array of `{ nodeId, input, output, status }`).

### 1.5 Testing

- Write one hardcoded workflow JSON: **Trigger → LLM (classify text as "urgent"/"normal") → Condition → Action (log result)**.
- Trigger it via a simple NestJS controller endpoint (`POST /engine/test-run`) with a sample payload.
- Verify the full trace prints correctly, including real Gemini output.

### Exit Criteria
- You can POST a JSON payload to a test endpoint and see the engine execute all four node types in sequence, with a real Gemini API call happening in the middle, and get back a full step-by-step trace.

---

## Phase 2 — Persistence & Async Execution

**Goal:** Move workflow execution off the synchronous request/response cycle. Add durability, retries, and full history tracking. This phase is what makes the project "production-shaped" rather than a script.

### 2.1 Prisma Schema

Define and migrate the core tables (full schema in [Section 10](#10-data-model-reference)):
- `Workflow`
- `WorkflowRun`
- `RunStep`
- `Approval`

### 2.2 Wire Up BullMQ

1. Create a `workflow-execution` queue.
2. `POST /workflows/:id/run` — API endpoint that:
   - Creates a `WorkflowRun` row (status: `pending`).
   - Enqueues a job with `{ runId, workflowId, input }`.
   - Returns the `runId` immediately (does **not** wait for execution).
3. Create a separate **worker process** (`apps/api` can run in two modes — `api` and `worker` — via a CLI flag or separate entry file) that:
   - Listens to the `workflow-execution` queue.
   - Loads the workflow definition and calls `WorkflowEngineService`.
   - After each node executes, writes a `RunStep` row (input, output, latency, token usage, status).
   - Updates `WorkflowRun.status` to `completed` or `failed` at the end.

### 2.3 Retry & Fallback Logic

- Configure BullMQ job options: `attempts: 3`, exponential `backoff`.
- Inside `LlmNode`, wrap the Gemini call in a retry-aware wrapper: on failure, retry up to N times; if still failing, optionally fall back to a different model tier.
- Log every retry attempt as a `RunStep` entry with `status: 'retrying'` so it's visible in the future dashboard.

### 2.4 Cost & Latency Tracking

- Gemini API responses include a `usageMetadata` object — capture `promptTokenCount` / `candidatesTokenCount` per call.
- Compute approximate cost per call using published per-model pricing (store a small pricing config, not hardcoded per-call).
- Store `latency_ms`, `tokens_used`, `cost_usd` on each `RunStep`.

### 2.5 API Endpoints for History

- `GET /workflows/:id/runs` — list runs for a workflow.
- `GET /runs/:id` — full run detail including all steps.

### Exit Criteria
- Calling `POST /workflows/:id/run` returns instantly with a `runId`.
- The worker picks up the job asynchronously and executes it.
- `GET /runs/:id` shows a full step-by-step trace with latency, tokens, and cost per step.
- Killing/restarting the worker mid-development does not lose queued jobs (Redis persistence).

---

## Phase 3 — Frontend Visual Flow Builder

**Goal:** Build the UI that lets a user visually construct the same `WorkflowDefinition` JSON your engine already knows how to run.

### 3.1 Canvas Setup

- Install `react-flow` (a.k.a. `@xyflow/react`) in `apps/web`.
- Build a canvas page with a node palette sidebar (Trigger, LLM, Condition, Action, Approval) that users can drag onto the canvas.
- Each node on canvas maps 1:1 to a `WorkflowNode` from your shared type.

### 3.2 Node Configuration Panels

- Clicking a node opens a side panel to configure it:
  - **LLM node:** prompt template (with variable insertion from upstream nodes), model selector (Flash/Pro), output schema (for structured JSON output).
  - **Condition node:** simple expression builder (field, operator, value).
  - **Action node:** action type dropdown (HTTP, Slack, Email) + relevant fields.
- Store all node configs in Zustand state, keyed by node ID.

### 3.3 Save / Load Workflows

- "Save" button serializes the current canvas (nodes + edges + configs) into a `WorkflowDefinition` JSON and `POST`s it to `/workflows`.
- "Load" fetches a saved workflow and reconstructs the canvas from JSON on page load.

### 3.4 Run & Watch

- "Run" button triggers `POST /workflows/:id/run`.
- Poll (or use a websocket/SSE if you want to go further) `GET /runs/:id` and visually highlight each node on the canvas as it executes — green for success, red for failure, yellow for in-progress.

### Exit Criteria
- A user can drag nodes onto a canvas, configure them, save the workflow, click Run, and watch the execution progress visually node-by-node in real time (or near real time via polling).

---

## Phase 4 — Differentiator Features

**Goal:** These are the features that separate this from a generic "Zapier clone" tutorial project and make it genuinely impressive in an interview.

### 4.1 Confidence-Based Branching

- Update the LLM node's structured output schema to always include a `confidence` field (0–1), instructed via the prompt (e.g., "Return your classification and a confidence score reflecting your certainty").
- Add a special edge type: `confidence_threshold`, so a Condition node can branch based on whether `confidence > threshold` — routing high-confidence results to auto-processing and low-confidence results to human review.

### 4.2 Human-in-the-Loop Approval Node

- `ApprovalNode` execution pauses the workflow run (`status: 'awaiting_approval'`) and creates an `Approval` row.
- Sends a notification (Slack message via webhook, or email via a provider like Resend) containing Approve/Reject links, each hitting a callback endpoint: `POST /approvals/:id/resolve`.
- On resolution, the worker resumes the paused run from where it left off, continuing down the appropriate edge.

**This is the single most impressive feature to demo** — it proves you can build stateful, resumable, long-running workflows, not just fire-and-forget scripts.

### 4.3 Tiered Model Fallback

- In the `LlmNode` executor, implement logic: try `gemini-2.5-flash` first (cheap/fast); if confidence is below a threshold or the call fails, escalate to `gemini-2.5-pro`.
- Log which tier was used per step — this becomes a great chart on your dashboard ("X% of calls resolved on the cheap tier (Flash)").

### 4.4 Cost & Observability Dashboard

- Build a `/dashboard` page in the frontend showing, per workflow:
  - Total runs, success rate, average cost per run, average latency.
  - A simple chart (Recharts) of runs over time and cost breakdown by node.
- This turns raw log data into something a non-technical hiring manager can glance at and understand instantly.

### Exit Criteria
- You can run a workflow where a low-confidence AI decision automatically pauses for human approval via Slack, and resuming after approval correctly continues execution.
- The dashboard shows real cost/latency/success metrics pulled from actual run data.

---

## Phase 5 — Polish, Templates & Deployment

**Goal:** Make the project easy for a recruiter or hiring manager to understand and try in under two minutes.

### 5.1 Pre-Built Templates

Ship 3–4 ready-made workflow JSON templates, loadable with one click:
1. **Support ticket triage** — classify incoming ticket text by urgency/category, auto-route or escalate to human.
2. **Meeting notes summarizer** — summarize input text, post summary to a Slack webhook.
3. **Invoice data extractor** — extract structured fields (amount, vendor, date) from raw text, write to a mock "sheet" endpoint.
4. **Lead qualifier** — classify a form submission as hot/warm/cold lead, route accordingly.

### 5.2 Authentication (lightweight)

- Simple JWT-based auth (NestJS `@nestjs/jwt`) or a magic-link email login — just enough to make it feel like a real multi-user product, and to scope workflows per user.

### 5.3 Deployment

1. **Database + Redis:** Provision on Railway (or Neon for Postgres + Upstash for Redis).
2. **Backend (API + Worker):** Deploy `apps/api` to Railway as two services (or one service with two start commands) — one for the HTTP API, one for the BullMQ worker.
3. **Frontend:** Deploy `apps/web` to Vercel, pointing `NEXT_PUBLIC_API_URL` at the Railway backend.
4. Set all environment variables in each platform's dashboard.
5. Smoke test the full flow end-to-end on the live deployment.

### 5.4 Documentation

Write a strong `README.md` including:
- One-paragraph project summary + live demo link.
- Architecture diagram (reuse the one from Section 2).
- Feature list with a short GIF or screenshot per major feature (builder, dashboard, approval flow).
- Local setup instructions.
- "Design decisions" section — briefly explain *why* you used a queue, why confidence-based routing matters, why you built an AI provider abstraction. This section is what turns a browsing recruiter into someone who thinks "this person understands systems."

### 5.5 Demo Video

Record a 2–3 minute walkthrough: build a workflow live, run it, show the approval flow pausing and resuming, show the dashboard. Link it at the top of the README and in your resume/portfolio.

### Exit Criteria
- Live, publicly accessible URL.
- README that lets a stranger understand and evaluate the project in under 2 minutes without cloning it.
- At least one end-to-end demo video.

---

## 10. Data Model Reference

```prisma
model Workflow {
  id          String   @id @default(uuid())
  userId      String
  name        String
  definition  Json      // full WorkflowDefinition (nodes + edges)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  runs        WorkflowRun[]
}

model WorkflowRun {
  id          String   @id @default(uuid())
  workflowId  String
  workflow    Workflow  @relation(fields: [workflowId], references: [id])
  status      String    // pending | running | awaiting_approval | completed | failed
  input       Json
  startedAt   DateTime  @default(now())
  finishedAt  DateTime?
  totalCostUsd Float?
  steps       RunStep[]
  approvals   Approval[]
}

model RunStep {
  id          String   @id @default(uuid())
  runId       String
  run         WorkflowRun @relation(fields: [runId], references: [id])
  nodeId      String
  nodeType    String
  input       Json
  output      Json?
  status      String    // success | failed | retrying
  latencyMs   Int?
  tokensUsed  Int?
  costUsd     Float?
  createdAt   DateTime  @default(now())
}

model Approval {
  id          String   @id @default(uuid())
  runId       String
  run         WorkflowRun @relation(fields: [runId], references: [id])
  nodeId      String
  status      String    // pending | approved | rejected
  payload     Json
  createdAt   DateTime  @default(now())
  resolvedAt  DateTime?
}
```

---

## 11. Final Resume & Portfolio Checklist

Before calling this project "done," confirm you have:

- [ ] Live deployed URL (frontend + backend both reachable)
- [ ] Public GitHub repo, clean commit history, no secrets committed
- [ ] README with architecture diagram, feature list, and design-decisions section
- [ ] Demo video (2–3 minutes)
- [ ] At least one workflow demonstrating: LLM step, condition branching, confidence-based routing, and human approval, end to end
- [ ] Dashboard showing real cost/latency/success data
- [ ] 2–3 resume bullet points drafted from this project (see below)

**Suggested resume bullets:**
- *"Designed and built a full-stack AI workflow automation platform (Next.js, NestJS, BullMQ, PostgreSQL) featuring a visual DAG-based workflow builder and an async execution engine with confidence-based routing between AI and human review steps."*
- *"Implemented fault-tolerant, resumable job orchestration using Redis-backed queues with retry and multi-tier LLM fallback logic, reducing failed automation runs by X% in testing."*
- *"Built an observability dashboard tracking per-workflow cost, latency, and success rate across AI-driven automation steps, using real token-usage data from the Gemini API."*

---

*End of implementation plan.*
