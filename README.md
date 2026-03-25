# Keycard Console

A control plane for managing AI agent access to tools, APIs, and data. Keycard provides two interfaces — a **web console** for humans and a **CLI** for machines — both backed by the same API.

## What It Does

Keycard governs what AI agents can do. It answers questions like:
- Which tools can this agent access?
- Should this action be allowed or denied?
- What did this agent do during its session?

### Core Concepts

| Entity | Description |
|--------|-------------|
| **Agent** | A machine identity (coding agent, CI bot, service worker) that acts on behalf of a user or autonomously |
| **Policy** | A rule set governing what agents can access, evaluated at request time |
| **Session** | A bounded execution context tracking every tool call, credential exchange, and policy decision |
| **Tool** | An external integration (GitHub, Linear, Datadog, AWS, Slack) that agents request access to |
| **Audit Event** | An immutable log entry for every access request, approval, denial, and escalation |

## Architecture

```
┌──────────────────────┐     ┌──────────────────────┐
│   Web Console        │     │   CLI (Go)           │
│   Next.js :3000      │     │   keycard <command>  │
└──────────┬───────────┘     └──────────┬───────────┘
           │                            │
           └────────────┬───────────────┘
                        │
              ┌─────────┴─────────┐
              │   Backend API     │
              │   Express :3001   │
              │   SQLite (local)  │
              └───────────────────┘
```

Both the console and CLI are clients of the same REST API (`/v1/*`). No feature exists in only one surface.

## Project Structure

```
Keycard-Console/
├── api/                    # Backend API (Node.js/Express/SQLite)
│   └── src/
│       ├── index.ts        # Server entry point
│       ├── db/             # Database schema and seeding
│       ├── middleware/      # JWT auth
│       └── routes/         # REST endpoints
├── apps/
│   └── console/            # Web Console (Next.js 14)
│       └── src/
│           ├── app/        # Pages (dashboard, agents, sessions, policies, tools, audit, settings)
│           ├── components/  # Shared UI (sidebar, tables, badges, charts)
│           └── lib/        # API client
├── cli/                    # CLI (Go/Cobra)
│   ├── cmd/                # Command definitions
│   └── internal/           # API client, config, output formatting
└── packages/
    └── api-types/          # Shared TypeScript type definitions
```

## Quick Start

### Prerequisites

- Node.js 18+
- Go 1.22+ (for the CLI)

### 1. Start the API

```bash
cd api
npm install
npm run dev
```

The API starts on **http://localhost:3001**. On first run it creates a SQLite database and seeds it with demo data: 4 agents, 2 policies, 5 tools, 10 sessions, and 38 audit events.

### 2. Start the Web Console

```bash
cd apps/console
npm install
npm run dev
```

The console starts on **http://localhost:3000**. Open it in your browser. It connects to the API on port 3001 using a pre-configured demo token (no login required for development).

### 3. Build the CLI (optional)

```bash
cd cli
go mod tidy
go build -o keycard .
./keycard --help
```

## Web Console Pages

### Dashboard (`/dashboard`)
Overview of system health: total agents, request volume, success rate, active sessions. Includes a 24-hour activity chart, approval breakdown pie chart, recent denials table, and top agents by activity.

### Agents (`/agents`)
Registry of all machine identities. Create, view, and revoke agents. Each agent detail page shows its configuration, type, status, and recent sessions.

### Sessions (`/sessions`)
Investigative view into what agents have done. Each session shows the agent, task description, status, and a timeline of every event — tool calls, policy evaluations, and their outcomes (allow/deny/escalate).

### Policies (`/policies`)
Access control rules. Each policy contains rules that map tool + action combinations to allow/deny outcomes. Supports simulation to test whether a request would be permitted.

### Tools (`/tools`)
Catalog of connected integrations (GitHub, Linear, Datadog, AWS, Slack). Shows each tool's category, description, and how many agents are connected.

### Audit Log (`/audit`)
Complete, immutable record of every access event. Filterable by agent, tool, outcome, and time. Each entry shows the agent, action, resource, outcome, and reason.

### Settings (`/settings`)
Organization configuration (placeholder).

## CLI Commands

```
keycard auth login          # Authenticate via device code flow
keycard auth status         # Show current user/org
keycard agents list         # List all agents
keycard agents create       # Register a new agent
keycard sessions list       # List sessions
keycard policies list       # List policies
keycard policies simulate   # Test a request against a policy
keycard audit search        # Query audit events
keycard tools list          # List connected tools
keycard run                 # Execute a command under Keycard governance (coming soon)
```

All commands support `--output json` (`-o json`) for machine-readable output.

## API Endpoints

Base URL: `http://localhost:3001/v1`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/device-code` | Initiate device auth flow |
| POST | `/auth/token` | Exchange device code for JWT |
| GET | `/auth/me` | Current user info |
| GET | `/agents` | List agents |
| POST | `/agents` | Create agent |
| GET | `/agents/:id` | Get agent detail |
| PATCH | `/agents/:id` | Update agent |
| DELETE | `/agents/:id` | Revoke agent |
| GET | `/agents/:id/sessions` | Agent's sessions |
| GET | `/policies` | List policies |
| POST | `/policies` | Create policy |
| POST | `/policies/:id/simulate` | Simulate a request |
| GET | `/sessions` | List sessions |
| GET | `/sessions/:id` | Session detail |
| GET | `/sessions/:id/events` | Session events |
| GET | `/tools` | List tools |
| GET | `/audit/events` | Query audit log |
| GET | `/audit/stream` | SSE event stream |
| GET | `/stats/dashboard` | Dashboard metrics |

## Development

The API uses a local SQLite database stored at `api/data/keycard.db`. Delete this file and restart the API to reset all data to the demo seed.

The console uses a hardcoded JWT token for development. In production, this would be replaced with a proper OAuth/OIDC flow via NextAuth.js.








https://github.com/user-attachments/assets/88da1d02-0024-4ccf-a73c-1c7e13098efc

