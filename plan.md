# Keycard Console & CLI — Implementation Plan

## Project Overview

Build a **Keycard-inspired control plane** for managing AI agent access to tools, APIs, and data. The project has two primary surfaces:

1. **Web Console** (React/Next.js) — where humans set policy, investigate agent sessions, and monitor access decisions in real time.
2. **CLI** (Go) — where agents and developers onboard, authenticate, manage configuration, and interact with the platform programmatically.

The guiding principle: **both humans and programs are first-class users.** Every capability exposed in the console should have a CLI/API equivalent. The CLI isn't a wrapper around the web UI — it's a peer interface designed for machines.

---

## Domain Model

Before building anything, define the core entities the system manages:

| Entity | Description |
|---|---|
| **Organization** | Top-level tenant. Owns policies, agents, and audit logs. |
| **User** | A human identity (federated via OAuth/OIDC). Sets policy, reviews events. |
| **Agent** | A machine identity (workload ID, API key, or SPIFFE-based). Acts on behalf of a user or autonomously. |
| **Policy** | A rule set that governs what agents can access. Evaluated at credential issuance time. |
| **Tool / Service** | An external integration (GitHub, Linear, Datadog, etc.) that agents request access to. |
| **Session** | A bounded execution context — tracks every tool call, credential exchange, and policy decision an agent makes during a task. |
| **Credential** | A short-lived, task-scoped token issued by the system. Identity-bound, resource-scoped, auto-expiring. |
| **Audit Event** | An immutable log entry for every access request, approval, denial, and escalation. |

---

## Part 1 — Web Console (React / Next.js)

### Tech Stack

- **Framework:** Next.js 14+ (App Router, Server Components, Server Actions)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS + a custom component library (shadcn/ui as a starting point)
- **State:** React Server Components for data fetching; client-side state with Zustand for interactive views
- **Data Viz:** Recharts for charts, D3 for the session graph/timeline views
- **Auth:** NextAuth.js (or a custom OAuth flow) for user login; JWT validation for API auth
- **API Layer:** Next.js Route Handlers as the BFF (backend-for-frontend), calling internal services

### Pages & Features

#### 1. Dashboard (`/`)

The landing page after login. At a glance: is the system healthy, and is anything unusual happening?

- **Metrics cards:** Total agents, requests today, success rate, auto-approval percentage
- **Approval breakdown:** Donut or stacked bar — auto-approved vs. user-approved vs. denied
- **Recent denials:** A short table of the last 5–10 blocked actions with agent, resource, and reason
- **Activity sparkline:** Request volume over the last 24h

#### 2. Sessions (`/sessions`)

The investigative view. "What did this agent actually do?"

- **Session list:** Filterable table — agent name, user, status (running/completed/failed), duration, tool call count
- **Session detail (`/sessions/[id]`):**
  - **Timeline:** A vertical, time-ordered list of every event in the session — tool calls, credential exchanges, policy evaluations, denials. Each event shows the tool/service, the action, the outcome (allow/deny/escalate), and latency.
  - **Identity sidebar:** The composite identity for this session — who (user), what (agent), where (device), why (task description).
  - **Credential panel:** Every credential issued during the session — scope, TTL, revocation status.

#### 3. Agents (`/agents`)

Registry of all machine identities.

- **Agent list:** Name, type (coding agent, service bot, etc.), status (active/revoked), last active, sessions count
- **Agent detail (`/agents/[id]`):**
  - Configuration (allowed tools, default policies)
  - Recent sessions
  - Credential history
  - Revoke / rotate controls

#### 4. Policies (`/policies`)

Where humans define the rules.

- **Policy list:** Name, version, status (active/observe/archived), last modified, attached agents/scopes
- **Policy editor (`/policies/[id]`):**
  - Code editor (Monaco) for policy rules — Cedar-like syntax or JSON
  - **Observe mode toggle:** Test a policy against live traffic without enforcing it
  - **Diff view:** Compare active version vs. draft
  - **Simulation panel:** Paste a hypothetical request and see if it would be allowed or denied

#### 5. Tools & Services (`/tools`)

Catalog of integrations agents can request access to.

- **Tool catalog:** Grid or list of connected services (GitHub, Linear, Datadog, AWS, etc.)
- **Per-tool detail:** Which agents have access, recent usage, scoping rules
- **Department filtering:** Tools scoped by team (Engineering, Sales, Marketing)

#### 6. Audit Log (`/audit`)

The compliance view. Immutable, queryable, exportable.

- **Event stream:** Real-time (via SSE or WebSocket) feed of every access event
- **Filters:** By agent, user, tool, outcome (allow/deny/escalate), time range
- **Export:** CSV/JSON export for SIEM integration

#### 7. Settings (`/settings`)

Org configuration, identity provider setup, API key management, SIEM/webhook destinations.

### Console Architecture Notes

```
┌─────────────────────────────────────────────────┐
│                  Next.js App                     │
│                                                  │
│  ┌──────────────┐  ┌─────────────────────────┐  │
│  │ Server       │  │ Client Components        │  │
│  │ Components   │  │                           │  │
│  │ (data fetch) │  │ - Policy editor (Monaco)  │  │
│  │              │  │ - Session timeline (D3)   │  │
│  │              │  │ - Real-time event stream  │  │
│  │              │  │ - Interactive filters     │  │
│  └──────┬───────┘  └────────────┬──────────────┘  │
│         │                       │                │
│  ┌──────┴───────────────────────┴──────────────┐ │
│  │          Route Handlers (BFF)               │ │
│  │  /api/agents, /api/sessions, /api/policies  │ │
│  └──────────────────┬──────────────────────────┘ │
└─────────────────────┼────────────────────────────┘
                      │
              ┌───────┴────────┐
              │  Backend API   │
              │  (shared with  │
              │   CLI / SDKs)  │
              └────────────────┘
```

Key principle: the Route Handlers call the **same backend API** that the CLI and SDKs call. The console never has a privileged path — if something can't be done via the API, it can't be done in the console either.

---

## Part 2 — CLI (Go)

### Why Go

- Single static binary — no runtime dependencies, trivial to distribute
- Excellent cross-compilation (`GOOS`/`GOARCH`)
- Strong concurrency primitives for streaming logs/events
- First-class in the infrastructure/DevOps ecosystem (agents will run in containers, CI, etc.)

### Tech Stack

- **CLI framework:** Cobra + Viper (command structure + config management)
- **HTTP client:** Standard `net/http` with a thin wrapper for auth, retries, and JSON marshaling
- **Output formatting:** `text/tabwriter` for tables, `encoding/json` for `--output json`
- **Auth:** Device authorization flow (OAuth 2.0 Device Code grant) for interactive login; API keys/tokens for CI/agent use
- **Config:** `~/.keycard/config.yaml` for persistent settings (org, default output format, API endpoint)

### Command Structure

```
keycard
├── auth
│   ├── login              # Interactive OAuth device flow
│   ├── logout             # Revoke local tokens
│   ├── status             # Show current identity (user + org)
│   └── token              # Print current access token (for piping)
│
├── agents
│   ├── list               # List registered agents
│   ├── create             # Register a new agent identity
│   ├── get <id>           # Show agent details
│   ├── update <id>        # Modify agent config
│   ├── revoke <id>        # Revoke an agent's credentials
│   └── sessions <id>      # List sessions for an agent
│
├── policies
│   ├── list               # List all policies
│   ├── get <id>           # Show policy details + rules
│   ├── create             # Create from file (--file policy.cedar)
│   ├── update <id>        # Push new version
│   ├── diff <id>          # Diff active vs. draft
│   ├── simulate           # Test a request against a policy
│   └── activate <id>      # Promote draft to active
│
├── sessions
│   ├── list               # List recent sessions
│   ├── get <id>           # Full session detail + event timeline
│   └── events <id>        # Stream events for a session (--follow)
│
├── tools
│   ├── list               # List available tool integrations
│   ├── get <id>           # Tool details + connected agents
│   └── install <name>     # Connect a new tool/service
│
├── audit
│   ├── stream             # Real-time event stream (--follow)
│   ├── search             # Query audit log (--agent, --tool, --outcome, --since)
│   └── export             # Export to file (--format json|csv)
│
├── run <command>          # Execute a command under Keycard governance
│   │                      # (inject creds, enforce policy, audit everything)
│   ├── --agent <name>     # Which agent identity to assume
│   └── --policy <id>      # Which policy to enforce
│
├── config
│   ├── set <key> <value>  # Set config (org, api-url, output format)
│   ├── get <key>          # Read config value
│   └── init               # Interactive setup wizard
│
└── version                # Print CLI version + API compatibility
```

### Key CLI Design Principles

1. **Machine-readable by default.** Every command supports `--output json` (and `-o json` shorthand). The default is human-friendly tables, but agents will always use JSON.

2. **Scriptable.** Commands return proper exit codes. `keycard auth token` prints a bare token for piping. `keycard audit stream --output json` emits newline-delimited JSON for processing.

3. **`keycard run` is the killer feature.** It wraps any command (e.g., `keycard run --agent cursor -- cursor .`) to inject credentials into the environment, enforce policy, and audit every action the wrapped process takes. This mirrors Keycard's actual `keycard run` product.

4. **Config-as-code.** Agents onboard via `keycard.yaml` files in their repos, not by clicking through a web UI:

```yaml
# keycard.yaml — checked into repo root
agent:
  name: "deploy-bot"
  type: "ci"
tools:
  - github:contents:read
  - github:contents:write
  - linear:issues:write
policy: "ci-deploy-standard"
```

`keycard agents create --from keycard.yaml` reads this and registers everything.

5. **Progressive disclosure.** `keycard agents list` shows a clean table. `keycard agents list -o json` gives full detail. `keycard agents list --verbose` shows extra columns. New users see simplicity; power users get depth.

---

## Part 3 — Shared Backend API

Both the console and the CLI are clients of the same REST API. This is critical — no feature should exist in only one surface.

### API Design

- **Base URL:** `https://api.keycard.local/v1`
- **Auth:** Bearer tokens (JWT) for all requests
- **Format:** JSON request/response bodies
- **Pagination:** Cursor-based (`?cursor=xxx&limit=50`)
- **Filtering:** Query params (`?agent=abc&outcome=deny&since=2026-01-01`)
- **Streaming:** SSE endpoint for real-time events (`/v1/audit/stream`)

### Core Endpoints

```
POST   /v1/auth/device-code          # Initiate device auth flow
POST   /v1/auth/token                # Exchange code for token

GET    /v1/agents                    # List agents
POST   /v1/agents                    # Create agent
GET    /v1/agents/:id                # Get agent
PATCH  /v1/agents/:id                # Update agent
DELETE /v1/agents/:id                # Revoke agent

GET    /v1/policies                  # List policies
POST   /v1/policies                  # Create policy
GET    /v1/policies/:id              # Get policy (specific version)
PUT    /v1/policies/:id              # Update / new version
POST   /v1/policies/:id/simulate     # Test request against policy
POST   /v1/policies/:id/activate     # Promote to active

GET    /v1/sessions                  # List sessions
GET    /v1/sessions/:id              # Get session detail
GET    /v1/sessions/:id/events       # Get session events

GET    /v1/tools                     # List tool integrations
POST   /v1/tools                     # Connect a tool
GET    /v1/tools/:id                 # Get tool detail

GET    /v1/audit/events              # Query audit log
GET    /v1/audit/stream              # SSE real-time stream (Accept: text/event-stream)

GET    /v1/stats/dashboard           # Aggregated metrics for console dashboard
```

---

## Part 4 — Implementation Phases

### Phase 1: Foundation (Weeks 1–3)

**Goal:** Skeleton apps, auth flow, and a single entity working end-to-end.

- [ ] **Backend:** Set up API server (Node.js/Express or Go — your choice). Implement `/auth` and `/agents` endpoints with an in-memory store or SQLite.
- [ ] **Console:** Scaffold Next.js app. Implement login flow (NextAuth.js with a mock OAuth provider). Build the Agents list page and Agent detail page.
- [ ] **CLI:** Scaffold Go project with Cobra. Implement `keycard auth login`, `keycard auth status`, `keycard agents list`, `keycard agents create`.
- [ ] **Shared:** Define TypeScript types and Go structs for all domain entities. Establish API contract (OpenAPI spec).

**Milestone:** A user can log in via the console OR the CLI, create an agent, and see it in both interfaces.

### Phase 2: Policy Engine & Sessions (Weeks 4–6)

**Goal:** The core value prop — policies that govern agent access, and sessions that track what agents do.

- [ ] **Backend:** Implement `/policies` and `/sessions` endpoints. Build a simple policy evaluation engine (if/then rules on agent, tool, resource attributes). Implement session creation and event logging.
- [ ] **Console:** Build the Policy editor page (Monaco code editor, observe mode toggle, simulation panel). Build the Sessions list and Session detail (timeline view with D3).
- [ ] **CLI:** Implement `keycard policies create/list/simulate` and `keycard sessions list/get/events`.

**Milestone:** A user can write a policy, simulate a request against it, and view a session timeline that shows allow/deny decisions.

### Phase 3: `keycard run` & Credential Injection (Weeks 7–9)

**Goal:** The agent-native interaction — wrapping a process with Keycard governance.

- [ ] **CLI:** Implement `keycard run`. This is the most complex CLI feature:
  - Fork/exec the child process with modified environment (inject credentials)
  - Intercept and log tool calls (via environment hooks or a local proxy)
  - Enforce policy in real time
  - Stream events to the backend
- [ ] **Console:** Build the "live session" view — watch a `keycard run` session's events stream in real time via SSE.
- [ ] **Backend:** Implement credential issuance endpoint (`/v1/credentials/exchange`) — short-lived, scoped tokens.

**Milestone:** `keycard run --agent my-bot -- python deploy.py` injects scoped AWS credentials, logs every action, and the session appears live in the console.

### Phase 4: Audit, Tools Catalog & Dashboard (Weeks 10–12)

**Goal:** Polish the operational views — audit log, tool management, and the dashboard.

- [ ] **Console:** Build the Audit Log page (real-time SSE stream, filters, export). Build the Tools catalog. Build the Dashboard with metrics cards, charts, and denial feed.
- [ ] **CLI:** Implement `keycard audit stream/search/export` and `keycard tools list/install`.
- [ ] **Backend:** Implement aggregation queries for dashboard stats. Build the SSE streaming endpoint for audit events.

**Milestone:** Full operational visibility — a security team can watch agent activity in real time, filter by any dimension, and export for compliance.

### Phase 5: Config-as-Code & Agent Onboarding (Weeks 13–14)

**Goal:** Agents onboard without clicking through web UIs.

- [ ] **CLI:** Implement `keycard agents create --from keycard.yaml`. Validate config files, register agents, attach policies.
- [ ] **Console:** Build a "Getting Started" wizard that generates `keycard.yaml` files and shows CLI commands.
- [ ] **Docs:** Write onboarding guides for both human (console) and agent (CLI/config) paths.

**Milestone:** An agent can be onboarded entirely via a YAML file and CLI commands — zero console interaction required.

---

## Part 5 — Design Principles (Throughout)

### UX for Humans

- **Progressive disclosure:** Dashboard → drill into sessions → drill into events. Don't dump everything at once.
- **Real-time where it matters:** Live session views and audit streams use SSE. Static lists use standard fetch.
- **Clarity over cleverness:** A denied request should say *why* in plain language, not just show a policy ID.

### UX for Machines

- **Structured output everywhere:** Every CLI command and API response returns parseable JSON.
- **Stable contracts:** API versioning (`/v1/`) from day one. Don't break agent workflows.
- **Meaningful exit codes:** `0` = success, `1` = error, `2` = auth failure, `3` = policy denial. Agents need to branch on these.
- **Quiet mode:** `--quiet` suppresses all output except the essential result. Agents don't need progress bars.

### Shared

- **API-first:** The console and CLI are both API clients. If a feature can't be done via the API, it doesn't ship.
- **Consistency:** The same data model, the same terminology, the same behavior — whether you're in a browser or a terminal.
- **Auditability:** Every mutation is logged. Every access decision has a trace. Trust is built on visibility.

---

## Repo Structure

```
keycard-project/
├── apps/
│   └── console/                 # Next.js app
│       ├── app/                 # App Router pages
│       │   ├── (auth)/          # Login, callback
│       │   ├── dashboard/
│       │   ├── agents/
│       │   ├── policies/
│       │   ├── sessions/
│       │   ├── tools/
│       │   ├── audit/
│       │   └── settings/
│       ├── components/          # Shared UI components
│       ├── lib/                 # API client, auth helpers, utils
│       └── package.json
│
├── cli/                         # Go CLI
│   ├── cmd/                     # Cobra commands
│   │   ├── root.go
│   │   ├── auth.go
│   │   ├── agents.go
│   │   ├── policies.go
│   │   ├── sessions.go
│   │   ├── audit.go
│   │   ├── tools.go
│   │   └── run.go
│   ├── internal/
│   │   ├── api/                 # HTTP client for backend API
│   │   ├── config/              # Config file management
│   │   ├── output/              # Table/JSON formatters
│   │   └── auth/                # Token storage, device flow
│   ├── go.mod
│   └── main.go
│
├── packages/
│   └── api-types/               # Shared TypeScript types (used by console)
│       ├── src/
│       └── package.json
│
├── api/                         # Backend API (Node.js or Go)
│   ├── routes/
│   ├── services/
│   ├── middleware/
│   └── openapi.yaml             # API specification
│
├── docs/
│   ├── onboarding-human.md
│   ├── onboarding-agent.md
│   └── api-reference.md
│
└── README.md
```

---

## Success Criteria

When the project is complete, you should be able to demo the following workflow:

1. **Human logs into the console**, creates an organization, and writes a policy that says "coding agents can read GitHub repos but cannot delete anything."
2. **From a terminal**, run `keycard auth login` and authenticate as that same user.
3. Run `keycard agents create --name "my-bot" --type coding-agent` to register an agent.
4. Run `keycard policies simulate --agent my-bot --tool github --action contents:read` and see **ALLOW**.
5. Run `keycard policies simulate --agent my-bot --tool github --action repo:delete` and see **DENY** with the reason.
6. Run `keycard run --agent my-bot -- ./my-script.sh` and watch the session appear **live** in the console with every action logged.
7. Open the **Audit Log** in the console and see every event, filterable and exportable.

That's the demo. Both interfaces, same system, both humans and agents served well.
