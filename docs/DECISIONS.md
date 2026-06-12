# Architectural and Governance Decisions

*Last verified: 2026-06-02*  
*Verification status: Verified for Mac-side Hermes runtime where noted. Drew worker remains offline / unverified.*

---

## 🧭 Core Architectural Decisions

### 1. Manual Model Switching (Antigravity Policy)
*   **Decision:** Incoming AI agents cannot change the active Antigravity model programmatically.
*   **Rationale:** Changing models has cost, latency, and context-length implications that must be greenlit by the human operator.
*   **Implementation:** If the active model is inadequate or failing, the agent must output `MODEL SWITCH NEEDED` with the recommended target and halt execution for Shaun to adjust via the UI.

### 2. Orchestrator Greenlight Gates
*   **Decision:** Add back and strictly enforce human verification gates on the Orchestrator worker block in `swarm.yaml`.
*   **Rationale:** Keeps the agent from executing unchecked destructive actions, commits, or remote dispatches without developer approval.
*   **Enforced Gates:**
    *   `destructive`
    *   `external-write`
    *   `external-send`
    *   `merge`
    *   `push`
    *   `source-of-record-change`
    *   `mission-start`
    *   `worker-dispatch`

### 3. Context Length Constraint
*   **Decision:** Force a minimum context window of **32,768 tokens** for local models in `~/.hermes/config.yaml`.
*   **Rationale:** Prevents context truncation errors and tool-calling format violations commonly encountered with complex reasoning loops.

### 4. Phase-Bounded Swarm Operations
*   **Decision:** Bounded Phase 0 (read-only verification) and Phase 1 (local read-only pilots) must run entirely on local resources before Drew's remote node is integrated.
*   **Rationale:** Prevents network routing issues, remote agent hangs, and API leakage during early validation phases.

---

## 📊 Model Routing Tiers

| Tier | Target Workers | Assigned Backend | Model | Key Decision |
|---|---|---|---|---|
| **1. Reasoning** | orchestrator, strategist, researcher | Local Ollama | `deepseek-r1:8b` | Use local reasoning models for task decomposition. |
| **2. Instruction** | builder, reviewer, qa, km-agent, etc. | Local Ollama | `hermes3:8b` | Maintain quick local latency for mechanical tasks. |
| **3. Federated** | satellite code runners | Remote Worker | `DeepSeek Coder 8B` | Restrict drew worker to stateless spec implementation. |
| **4. Cloud** | escalations / complex refactors | Cloud APIs | `Claude 3.5 Sonnet` | Escalation only; no silent API defaults. |
