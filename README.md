# AI-Powered Workflow Automation Platform

> A full-stack, distributed AI workflow execution engine with visual DAG flow builder, confidence-based AI routing, and Human-in-the-Loop (HITL) state machine orchestration.

---

## 🏗️ Monorepo Architecture

```
ai-workflow-platform/
├── apps/
│   ├── web/                     # Next.js 14 App Router, React Flow visual canvas, Tailwind CSS
│   └── api/                     # NestJS REST Gateway, BullMQ Queue Driver & Prisma ORM Engine
├── packages/
│   └── shared-types/            # Shared TypeScript data models, contracts & execution interfaces
├── prisma/
│   └── schema.prisma            # Prisma schema (Workflows, Runs, RunSteps, Approvals)
├── docker-compose.yml           # PostgreSQL 16 + Redis 7 local services
├── .env.example                 # Environment configuration template
└── README.md
```

---

## ⚡ Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Local Infrastructure
```bash
docker compose up -d
```

### 3. Database Migration & Client Generation
```bash
npm run db:migrate --workspace=apps/api
```

### 4. Run Development Servers
```bash
# Start API (NestJS REST Gateway - Port 3001)
npm run dev:api

# Start Web (Next.js App Router - Port 3000)
npm run dev:web
```

---

## 📊 Health Check Endpoint

- **API Health:** `GET http://localhost:3001/health`
```json
{
  "status": "ok",
  "timestamp": "2026-08-11T16:41:30.000Z",
  "postgres": "connected",
  "redis": "connected"
}
```
