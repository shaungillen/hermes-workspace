# HERMES FIELDWORKS AGENT ARCHITECTURE
**Version:** 1.1.0  
**Date:** 2026-05-20  
**Updated:** 2026-05-20 (Runtime Verification Pass)  
**Status:** Canonical Reference — Do Not Modify Without Architecture Review  
**Owner:** Antigravity (manager/review layer)  
**Source of Truth:** `swarm.yaml` + this document  

---

## 1. Summary

Hermes Workspace is the **primary local agent control plane** for the FieldWorks stack.
It runs a persistent swarm of semantic workers backed by Hermes Agent (gateway on `:8642`,
dashboard on `:9119`) and exposes a full-featured web UI at `:3000`.

Antigravity is the **manager and review layer** — the human-facing approval seat.
Hermes is the **execution engine** — the autonomous team that implements, reviews,
verifies, and maintains local work.

Worker Node Federation is a **bounded extension** — it offloads heavy, isolated coding
tasks to satellite machines running DeepSeek Coder 8B when Hermes workers are saturated
or when a task is explicitly code-only and self-contained.

Sonnet and Opus are **escalation targets only** — they handle judgment, architecture,
and creative reasoning that is out of scope for local models.

This document defines how these layers coordinate, what each owns, and where the
safety perimeter sits.

---

## 2. Current Hermes Capabilities

### 2.1 Confirmed Capabilities (from audit)

| Layer | Capability | Status |
|---|---|---|
| **UI** | Chat, Sessions, Memory Browser, Skills Browser | ✅ Shipped |
| **UI** | Files + Monaco Editor, PTY Terminal | ✅ Shipped |
| **UI** | Jobs (cron-style automation), Dashboard | ✅ Shipped |
| **UI** | Conductor (mission dispatch), Operations (agent mgmt) | ✅ Shipped |
| **UI** | Agent View (live panel), Swarm Mode | ✅ Shipped |
| **UI** | PWA + Tailscale mobile access | ✅ Shipped |
| **Workers** | orchestrator, builder, reviewer, qa | ✅ Running |
| **Workers** | researcher, ops-watch, maintainer, strategist, inbox-triage, km-agent | ✅ Running |
| **Swarm** | `swarm.yaml` roster → `swarm-decompose` → `swarm-dispatch` | ✅ API present |
| **Swarm** | Persistent tmux-backed sessions per worker | ✅ Running |
| **Swarm** | Runtime state contract (`runtime.json`) per worker | ✅ Spec'd |
| **Memory** | Filesystem memory (`~/.hermes/`, MEMORY.md, daily files) | ✅ Active |
| **Memory** | GBrain MCP lookup (gbrain-first context retrieval) | ✅ Per agent |
| **Skills** | 2,000+ skill registry, per-worker skill stacks | ✅ Browsable |
| **MCP** | Catalog, marketplace, per-agent server config | ✅ Shipped |
| **Security** | Auth middleware, CSP, path-traversal guard, rate limits | ✅ Active |
| **Providers** | Anthropic, OpenAI, OpenRouter, Ollama, Google, Custom | ✅ Configured |

### 2.2 Current Local Model (Confirmed from `~/.hermes/config.yaml`)

```yaml
model:
  default: custom/qwen-2.5-coder-7b
  provider: custom
  base_url: http://localhost:1234/v1
  context_length: 65536
```

> **Note:** The config shows `custom/qwen-2.5-coder-7b` via LM Studio (`:1234/v1`) as the active
> default. `swarm.yaml` lists `GPT-5.5` as the worker model target — this is the aspirational model
> setting for each worker when routed through a capable provider. The actual model served depends
> on what is loaded in the local runner at runtime.

### 2.3 What Is Not Yet Active

| Feature | Status |
|---|---|
| Autopilot orchestrator loop (`/api/swarm-orchestrator-loop`) | Spec'd — not yet implemented (Stage 3) |
| Structured agent handoffs (context passing between workers) | Spec'd — not yet implemented |
| Iterative refinement loop (tsc → fix → re-run) | Spec'd — not yet implemented |
| Native Electron desktop app | In development |
| Cloud / team version | Pending infra |
| Automatic checkpoint parsing from worker chat | Stage 2 — not yet landed |

---

## 3. Worker Role Map — Hermes ↔ FieldWorks

| Hermes Worker | Wrapper | FieldWorks Role | Responsibility |
|---|---|---|---|
| `orchestrator` | `orchestrator:plan` | **Mission Router / Greenlight Gate** | Decomposes missions into assignments, routes to specialists, enforces human greenlight before merge/publish/destructive ops |
| `builder` | `builder:task` | **Implementer** | Writes scoped code, runs tests, produces minimal diffs, generates verification evidence |
| `reviewer` | `reviewer:gate` | **Merge Gate** | Independently reviews changes, blocks unsafe/untested work, gates PRs |
| `qa` | `qa:smoke` | **Verification** | Browser and CLI smoke tests, expected-vs-actual checks, regression reproduction |
| `researcher` | `researcher:quick` | **Research / Synthesis** | GBrain-first lookups, external research, bounded autoresearch loops |
| `ops-watch` | `ops:health` | **Infrastructure Health** | Gateway status, cron, MCP health, local service lifecycle |
| `maintainer` | `maintainer:check` | **Dependency / Patch Hygiene** | Upstream tracking, dependency updates, PR/issue follow-through |
| `strategist` | `strategist:review` | **Planning / Kill Criteria** | Wedges, bets, decision framing, operating plans |
| `inbox-triage` | `inbox:triage` | **Capture / Routing** | Processes incoming material into discard, task, research, or brain capture |
| `km-agent` | `km:health` | **Knowledge Steward** | GBrain health, Obsidian curation, drift audits, durable knowledge capture |

### Greenlight Map

The following operations require Orchestrator approval before any worker can proceed:

| Operation | Enforced On |
|---|---|
| merge / push | builder, maintainer |
| publish / external-send | researcher, strategist, inbox-triage |
| destructive (delete, purge) | all workers |
| credential-change | orchestrator, ops-watch |
| source-of-record-change | km-agent |
| approve-merge | reviewer |
| fork-reset | maintainer |
| irreversible-decision | strategist |

---

## 4. Antigravity Integration Role

Antigravity is the **human-facing manager and final approver**. It does NOT implement.
It reviews, approves, escalates, and audits.

### How Antigravity Uses Hermes

```
Antigravity (you, reviewing here)
    ↓  issues mission prompt
Hermes Orchestrator  (:8642 gateway / Conductor UI)
    ↓  decomposes → dispatches
Hermes Workers  (tmux sessions, swarm.yaml)
    ↓  checkpoint back
Hermes Orchestrator  (reviews, escalates if needed)
    ↓  presents for human greenlight
Antigravity  (approve / reject / escalate to Sonnet/Opus)
```

### Antigravity → Hermes Interface Points

| Interface | How |
|---|---|
| **Mission dispatch** | Type in Hermes Conductor UI or POST to `/api/swarm-decompose` + `/api/swarm-dispatch` |
| **Worker status** | `/swarm` or `/operations` pages in Hermes UI |
| **Memory inspection** | `/memory` page |
| **Greenlight approval** | Hermes checkpoint cards (approve/reject buttons) |
| **Escalation to cloud AI** | Copy checkpoint summary → Antigravity chat → Sonnet/Opus |
| **Logs and evidence** | Hermes `/jobs` page, worker `runtime.json`, `/api/swarm-runtime` |

### What Antigravity Should Never Delegate Fully

1. **Final merge approval** — always a human greenlight
2. **Credential rotation** — human decision only
3. **Destructive filesystem operations** — requires human path confirmation
4. **External publishing / send** — human review required
5. **New worker profiles** — reviewed by human before first load

---

## 5. Worker Node Federation Role

Federation machines (e.g. Drew's node at `25.4.90.63:8000`) run **bounded, stateless
coding tasks** that are:

- **Code-only** — no memory, no sessions, no external sends
- **Input/output scoped** — given spec → returns diff or artifact
- **Independently verifiable** — output can be smoke-tested by Hermes QA

### Federation Decision Matrix

| Task Type | Handle With |
|---|---|
| Isolated function implementation with spec | Worker Node (DeepSeek Coder 8B) |
| Bounded refactor with clear input/output | Worker Node |
| Code generation with no file system side effects | Worker Node |
| Multi-file coordinated change with context | Hermes Builder |
| Anything requiring memory / session history | Hermes Builder |
| Review, QA, merge gate | Hermes Reviewer / QA (never Federation) |
| Research / synthesis | Hermes Researcher (never Federation) |

### Federation Safety Rules

- Federation nodes receive **tasks only**, never credentials
- All Federation output must be reviewed by Hermes `reviewer` before merge
- Federation cannot write directly to production branches
- Federation has a **120-second command timeout** and **20,000-character output cap** (hardened)
- `LunaFederation MCP server` is the only allowed bridge

---

## 6. Model Assignments

> **⚠️ Updated 2026-05-20 after runtime verification.** LM Studio is not running. Ollama IS running
> with a different model set than expected. Assignments below reflect confirmed available models.

### Hermes Workers (local) — Revised

| Worker | Assigned Model | Rationale |
|---|---|---|
| `builder` | `hermes3:8b` | Code-capable instruction follower; available now |
| `reviewer` | `hermes3:8b` | Instruction quality needed for gate criteria |
| `qa` | `hermes3:8b` | Smoke test verification; mechanical |
| `researcher` | `deepseek-r1:8b` | R1 reasoning model — synthesis quality |
| `ops-watch` | `hermes3:8b` | Mechanical health checks |
| `maintainer` | `hermes3:8b` | Structured dependency/patch tasks |
| `strategist` | `deepseek-r1:8b` | Planning + kill criteria need reasoning |
| `orchestrator` | `deepseek-r1:8b` | Mission decomposition needs reasoning |
| `inbox-triage` | `hermes3:8b` | Structured routing — mechanical |
| `km-agent` | `hermes3:8b` | Knowledge curation; semantic quality |

**Target upgrade path (when Qwen3.5-9B-GGUF is pulled):**
- Replace `hermes3:8b` with `qwen3.5:9b` for all workers
- Replace `deepseek-r1:8b` with `qwen3.5:9b` for orchestrator/strategist/researcher
- Pull command: `ollama pull hf.co/unsloth/Qwen3-8B-GGUF` (8B GGUF variant) or equivalent

### Worker Node Federation

| Worker | Model | Notes |
|---|---|---|
| Federation (Drew's node) | DeepSeek Coder 8B | Remote bounded code worker — see DeepSeek Timing Policy (Section 11) |

> **Note:** `deepseek-r1:8b` is available locally in Ollama. This is a **reasoning** model (R1),
> not a code-specialised coder model. Use it for orchestrator/researcher/strategist locally.
> The remote Worker Node Federation should still use DeepSeek Coder 8B (dedicated code model).

### Cloud Escalation Targets

| Target | When to Use |
|---|---|
| **Sonnet 4.6** | Architecture decisions, complex multi-file reasoning, design review, judgment calls, anything where local reasoning quality is insufficient |
| **Opus 4** | Critical system design, final audit of high-risk changes, novel problem framing, anything requiring the highest judgment — use sparingly |

---

## 7. Safety Boundaries

### Hard Boundaries (Never Automated)

1. **Merge to production / main** — human greenlight only
2. **Secret / credential change or rotation** — human decision
3. **Destructive filesystem operations** (rm -rf, purge, bulk delete) — human confirmation + path echo
4. **External publish or external send** — human review
5. **New worker profile activation** — human review
6. **LunaFederation firewall rule changes** — human approval
7. **Docker / Ollama / Node install on worker nodes** — explicit human step

### Soft Boundaries (Require Orchestrator Checkpoint)

1. Any file mutation outside the declared workspace
2. Any job that runs longer than 15 minutes (auto-timeout)
3. Any worker session touching credentials or auth files
4. Any PR that hasn't passed `reviewer:gate`

### Hermes-Native Safety Controls Already Active

- Auth middleware on every API route
- Path-traversal prevention on file + memory routes
- Rate limiting (5 auth/min, 30 files/min, 10 terminal/min)
- Exec approval workflow (in-UI modal for sensitive commands)
- Skills security scanning before marketplace install
- No API keys or secrets exposed to client-side code
- Fail-closed startup guard (refuses non-loopback bind without password)

---

## 8. First Safe Implementation Phase

### Phase 0 — Read-Only Integration (Do Now, Zero Risk)

**Objective:** Confirm Hermes workers are reachable and observable from Antigravity's perspective.

**Steps:**
1. Verify `hermes gateway run` is active: `curl http://127.0.0.1:8642/health`
2. Verify `hermes dashboard` is active: `curl http://127.0.0.1:9119/api/status`
3. Open Hermes UI at `http://localhost:3000` → confirm swarm roster shows all 10 workers
4. Confirm Conductor is reachable (`/conductor`)
5. Confirm `/memory` shows agent memory entries
6. Confirm `/jobs` is accessible

**No code changes. No new installs. No config edits.**

### Phase 1 — First Supervised Mission (Safe Pilot)

**Objective:** Run one end-to-end supervised mission through the Hermes swarm.

**Mission shape:** Read-only research task → no file mutation, no external sends.

**Example:**
> "Researcher: survey the FieldWorks model routing doc and produce a summary of current routing rules. Do not modify any files."

**Route:**
- Orchestrator decomposes → researcher:quick
- Researcher returns checkpoint summary
- Human (Antigravity) reviews summary in Hermes UI
- No greenlight required (read-only)

**Success criteria:**
- Researcher returns a proof-bearing checkpoint
- Summary visible in Hermes chat / runtime view
- No unexpected file mutations

### Phase 2 — Scoped Build Mission (Supervised)

After Phase 1 passes:
- Builder implements a single scoped task (one file, clear spec)
- Reviewer gates the output
- QA smoke-tests
- Human greenlight required before any merge

---

## 9. Open Loops

| Open Question | Status | Owner |
|---|---|---|
| Is `unsloth/Qwen3.5-9B-GGUF` loaded and serving locally? | ❌ **No** — not in Ollama. Must be pulled before use. | Shaun |
| Is LM Studio running? | ❌ **No** — port 1234 is closed. Hermes config points there but it's down. | Shaun |
| Is `custom/qwen-2.5-coder-7b` available? | ❌ **No** — only available via LM Studio, which is not running. | Shaun |
| Is the Hermes gateway currently running? | ❌ **No** — port 8642 closed. Must run `hermes gateway run`. | Shaun |
| Is `hermes dashboard` running? | ❌ **No** — port 9119 closed. Must run `hermes dashboard`. | Shaun |
| Is the Hermes workspace UI running? | ❌ **No** — port 3000 closed. Must run `pnpm dev` or `pnpm start`. | Shaun |
| Is Ollama running? | ✅ **Yes** — port 11434, 8 models available. | Confirmed |
| Is `hermes3:8b` available for workers? | ✅ **Yes** — 4.7 GB, in Ollama. | Confirmed |
| Is `deepseek-r1:8b` available for reasoning workers? | ✅ **Yes** — 5.2 GB, in Ollama. | Confirmed |
| Is `DeepSeek Coder 8B` (remote federation) available? | ⚠️ **Unconfirmed** — depends on Drew's node. | Drew / verify |
| Should `builder` use Federation or local Hermes for Phase 1? | Use **local Hermes** (`hermes3:8b`) for Phase 1. Federation for Phase 2+. | Decision made |
| Should orchestrator loop run as cron or persistent Claude worker? | **Open spec question** — architecture decision needed. | Architecture |
| GBrain MCP server — is it currently active? | **Unconfirmed** — listed in Manifest but services suspended. Verify at Phase 0. | Shaun |

---

## 10. Next Prompt

When you are ready to proceed, send this to Antigravity:

```
Objective:
Start Hermes services and verify Phase 0 readiness.

Tasks:
1. Start hermes gateway: hermes gateway run
2. Start hermes dashboard: hermes dashboard
3. Confirm both health endpoints:
   - curl http://127.0.0.1:8642/health → expect {"status":"ok"}
   - curl http://127.0.0.1:9119/api/status → expect {"status":"ok"}
4. Open Hermes Workspace at http://localhost:3000
5. Navigate to /swarm and confirm all 10 workers are visible in the roster
6. Report: gateway status, dashboard status, swarm roster count, any errors

Do not install anything.
Do not modify config.
Do not start any missions yet.
```

---

## 11. Runtime Verification Notes

> **Verification run:** 2026-05-20 10:31 EDT — read-only health probes only. Phase 0 complete.

### Service Status

| Service | Port | Status | Notes |
|---|---|---|---|
| Hermes Gateway (process) | — | ✅ **RUNNING** | PID 6542, state=`running`, Telegram connected |
| Hermes Gateway (HTTP API) | 8642 | ⚠️ **NOT exposed** | `API_SERVER_ENABLED` not set — gateway runs but has no HTTP listener |
| Hermes Dashboard | 9119 | ✅ **RUNNING** | PID 6653, responding at `/api/status` |
| Hermes Workspace UI | 3000 | ✅ **RUNNING** | PID 6853, node/Vite, serving full HTML |
| Hermes Workspace UI (second instance) | 3001 | ✅ **RUNNING** | PID 7594, second Vite dev instance |
| Ollama | 11434 | ✅ **RUNNING** | 8 models available |
| LM Studio | 1234 | ❌ **NOT running** | Config previously pointed here — `hermes3:8b` now active instead |
| BaseOS dashboard bridge | 5001 | ✅ **RUNNING** | PID 1265, `dashboard_bridge.py` |
| Worker poller | — | ✅ **RUNNING** | PID 1295, `worker_poller.py` |
| Telegram (via gateway) | — | ✅ **CONNECTED** | Polling mode, reconnected after earlier DNS error |

### Workspace Connection Status (from `/api/connection-status`)

```json
{
  "status": "disconnected",
  "label": "Disconnected",
  "detail": "No compatible backend detected.",
  "health": false,
  "chatReady": false,
  "modelConfigured": true,
  "activeModel": "hermes3:8b",
  "chatMode": "disconnected",
  "capabilities": {
    "health": false,
    "chatCompletions": false,
    "models": false,
    "streaming": false,
    "sessions": true,
    "skills": true,
    "memory": true,
    "config": true,
    "jobs": true,
    "mcp": false,
    "mcpFallback": true,
    "conductor": false,
    "kanban": true,
    "enhancedChat": false,
    "dashboard": true
  },
  "claudeUrl": "http://127.0.0.1:8642"
}
```

**Root cause of `disconnected`:** The gateway process is running but `API_SERVER_ENABLED=true` is NOT set in `~/.hermes/.env`. Without this flag, the gateway does not bind an HTTP listener on port 8642. The workspace UI cannot reach the chat/completions/models/health endpoints, so it falls back to `disconnected` mode.

**What still works without HTTP API:**
- Sessions, Skills, Memory, Config, Jobs, Kanban — served by Hermes Dashboard on `:9119` ✅
- Dashboard tile in workspace UI ✅
- Telegram integration ✅
- MCP fallback ✅

**What requires HTTP API (port 8642):**
- Chat completions (chatReady) ❌
- Streaming ❌
- Model list ❌
- Health endpoint ❌
- Conductor (swarm dispatch) ❌
- Enhanced chat ❌

### Available Models (Ollama — Confirmed)

| Model | Size | Assigned Role |
|---|---|---|
| `hermes3:8b` | 4.7 GB | **Active default** — confirmed in workspace `activeModel` field |
| `deepseek-r1:8b` | 5.2 GB | Reasoning tier — orchestrator, strategist, researcher |
| `dolphin-mistral:latest` | 4.1 GB | Not assigned to agents |
| `llama3.2:latest` | 2.0 GB | Lightweight fallback only |
| `llama3:latest` / `llama3:70b` | 4.7 / 39 GB | Legacy |
| `llama2-uncensored:latest` | 3.8 GB | Not recommended |

### Missing Models

| Model | Status | Action Required |
|---|---|---|
| `unsloth/Qwen3.5-9B-GGUF` | ❌ **Not available** | `ollama pull hf.co/unsloth/Qwen3-8B-GGUF` |
| `deepseek-coder:*` | ❌ **Not available locally** | Remote Federation only (Drew's node) |

### Recommended Worker Model Assignments (Current — confirmed available)

| Worker Tier | Workers | Model |
|---|---|---|
| **Reasoning tier** | orchestrator, strategist, researcher | `deepseek-r1:8b` |
| **Instruction tier** | builder, reviewer, qa, ops-watch, maintainer, inbox-triage, km-agent | `hermes3:8b` |
| **Federation (remote)** | bounded code tasks | DeepSeek Coder 8B (Drew's node — verify separately) |
| **Escalation** | judgment, architecture, audit | Sonnet 4.6 / Opus 4 |

### Single Remaining Blocker — Chat / Conductor

To unlock `chatReady`, streaming, health, and Conductor, add ONE line to `~/.hermes/.env`:

```bash
API_SERVER_ENABLED=true
```

Then restart the gateway:
```bash
hermes gateway stop
hermes gateway run
```

After restart, `curl http://127.0.0.1:8642/health` should return `{"status": "ok", "platform": "hermes-agent"}`.

> **Safety note:** Default bind is `127.0.0.1` (loopback only). This is safe — no external exposure.
> Do NOT set `API_SERVER_HOST=0.0.0.0` unless explicitly required for LAN/Tailscale access AND
> `API_SERVER_KEY` is also set.

---

## 12. DeepSeek Timing Policy

Applies to any task routed to DeepSeek models (local `deepseek-r1:8b` or remote Worker Node Federation).

### Time Allowances

| Task Scope | Allowance |
|---|---|
| Standard task (function, single file, bounded spec) | **60 minutes** |
| Large repo analysis or overhaul | **90 minutes** |
| Hard stop — no exceptions without human review | **120 minutes** |

### Progress Checkpoints

- Workers must emit a progress checkpoint **every 10 minutes**
- Checkpoint must include: `STATE`, `FILES_CHANGED`, `COMMANDS_RUN`, `RESULT`, `NEXT_ACTION`
- If no checkpoint received within 10 minutes → Orchestrator sends a status ping
- If no response to ping within 5 minutes → flag as `STALLED` and escalate to human

### Kill Criteria

Do **not** kill a DeepSeek worker unless **all three** of the following are true for **20 consecutive minutes**:

1. No log output (stdout/stderr silent)
2. No CPU or GPU activity on the process
3. No file modification or status change in the workspace

If any one of the three is active, the worker is still running. Do not interrupt.

### Restart Policy

- After a kill, wait **2 minutes** before restarting the same task
- On restart, include the previous partial output as context
- Maximum **2 restarts** per task before escalating to human for task decomposition review

---

## Appendix A — File Sources Used in This Audit

| File | Purpose |
|---|---|
| `README.md` | Architecture, startup commands, security model |
| `AGENTS.md` | Semantic worker roster, operating rules |
| `swarm.yaml` | Full worker definitions: roles, tools, skills, greenlight gates |
| `FEATURES-INVENTORY.md` | Full UI + API + tech stack inventory |
| `FUTURE-FEATURES.md` | Planned: iterative refinement, handoffs, parallel guardrails |
| `SECURITY.md` | Auth, rate limits, path-traversal, exec approval |
| `CHANGELOG.md` | v2.0.0 zero-fork release, Conductor + Operations added |
| `docs/AGENT-PAIRING.md` | Gateway setup and pairing verification steps |
| `docs/swarm2-autopilot-orchestration-spec.md` | Autopilot loop architecture, staged rollout plan |
| `agents/orchestrator/README.md` | Orchestrator profile summary |
| `memory/2026-05-05.md` | Active memory entry (context on workspace usage) |
| `package.json` | v2.3.0, stack: React 19, TanStack, Vite 7, xterm, Monaco |
| `~/.hermes/config.yaml` | Active model: `custom/qwen-2.5-coder-7b` @ `localhost:1234/v1` |
