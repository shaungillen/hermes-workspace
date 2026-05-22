# Hermes Current State

**Last Updated:** 2026-05-22  
**Status:** Runtime Active / Connected  
**Worktree:** `~/WORKTREES/hermes-state-docs`

---

## 🖥️ Active Services & Port Status

| Service | Host/Port | PID | Status | Notes |
|---|---|---|---|---|
| **Hermes Workspace UI** | `localhost:3000` | 6853 | ✅ **RUNNING** | Node/Vite, serving main dashboard & chat interface |
| **Hermes UI (Second Dev)** | `localhost:3001` | 7594 | ✅ **RUNNING** | Second Vite dev instance |
| **Hermes Dashboard** | `localhost:9119` | 6653 | ✅ **RUNNING** | Responding to API probes at `/api/status` |
| **Hermes Gateway** | `localhost:8642` | — | ✅ **RUNNING** | Active background process, HTTP listener enabled |
| **Ollama Backend** | `localhost:11434` | — | ✅ **RUNNING** | Exposes local inference with 8 available models |
| **LM Studio Backend** | `localhost:1234` | — | ❌ **DOWN** | Custom Qwen-Coder-7B server is suspended |
| **BaseOS Dashboard Bridge** | `localhost:5001` | 1265 | ✅ **RUNNING** | Exposes `dashboard_bridge.py` endpoints |
| **Worker Poller** | — | 1295 | ✅ **RUNNING** | Active background poller running `worker_poller.py` |

---

## 🎉 Primary Blocker Resolved: UI Connection Status

> [!TIP]
> The Hermes Workspace UI connection is now fully established.

**Status:**
*   `API_SERVER_ENABLED=true` has been successfully injected into `~/.hermes/.env`.
*   The gateway was restarted and is listening on port `8642`.
*   Workspace UI is connected to the gateway API backend, enabling swarm orchestration, streaming, and full chatbot functionality.

---

## 🧠 Active Models & Roster

The local Ollama instance contains `hermes3:8b` (4.7 GB) and `deepseek-r1:8b` (5.2 GB). 
All 10 semantic workers from **[swarm.yaml](file:///Users/shaungillen/WORKTREES/hermes-state-docs/swarm.yaml)** are loaded:
*   **Orchestrator** (DeepSeek-R1-8B) — safety gates configured: `destructive`, `external-write`, `external-send`, `merge`, `push`, `source-of-record-change`, `mission-start`, `worker-dispatch`.
*   **KM Agent** (Hermes3-8B) — Knowledge Steward.
*   **Builder** (Hermes3-8B) — Implementer.
*   **Reviewer** (Hermes3-8B) — Quality Gate.
*   **QA** (Hermes3-8B) — Verification.
*   **Researcher** (DeepSeek-R1-8B) — Read-only.
*   **Ops Watch** (Hermes3-8B) — Infrastructure.
*   **Maintainer** (Hermes3-8B) — Hygiene.
*   **Strategist** (DeepSeek-R1-8B) — Planning.
*   **Inbox Triage** (Hermes3-8B) — Routing.
