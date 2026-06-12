# AGENT START HERE

> [!WARNING]
> ## DO NOT REDISCOVER KNOWN CONTEXT.
> Read the state docs first. Do not run broad repository scans, recursive grep, web searches, MCP debugging, or architecture rediscovery unless explicitly requested.

> [!IMPORTANT]
> ## Worker Node Federation is Phase 2 or later.
> Do not activate, debug, or route tasks to Worker Node Federation until Phase 0 and Phase 1 local read-only Hermes pilots are complete and Shaun explicitly approves.

---

## 🗺️ Workspace Navigation Map

For quick context alignment, check these reference paths:

*   **[HERMES_FIELDWORKS_AGENT_ARCHITECTURE.md](file:///Users/shaungillen/WORKTREES/hermes-state-docs/docs/HERMES_FIELDWORKS_AGENT_ARCHITECTURE.md)**: Canonical system and worker role blueprint.
*   **[HERMES_CURRENT_STATE.md](file:///Users/shaungillen/WORKTREES/hermes-state-docs/docs/HERMES_CURRENT_STATE.md)**: Port status, active local models, and blockers.
*   **[HERMES_RUNTIME_AND_CONTINUITY_AUDIT.md](file:///Users/shaungillen/WORKTREES/hermes-state-docs/docs/HERMES_RUNTIME_AND_CONTINUITY_AUDIT.md)**: Verified runtime state audit details.
*   **[HERMES_STACK_RUNBOOK.md](file:///Users/shaungillen/WORKTREES/hermes-state-docs/docs/HERMES_STACK_RUNBOOK.md)**: The canonical runbook for starting, checking, stopping, and recovering the Hermes stack. Contains standard sequence for commands like "Run Hermes".
*   **[WORKER_NODE_FEDERATION_STATE.md](file:///Users/shaungillen/WORKTREES/hermes-state-docs/docs/WORKER_NODE_FEDERATION_STATE.md)**: Details on Drew's remote node and timing guidelines.
*   **[ANTIGRAVITY_MODEL_POLICY.md](file:///Users/shaungillen/WORKTREES/hermes-state-docs/docs/ANTIGRAVITY_MODEL_POLICY.md)**: Routing guidelines and model switching rules.
*   **[swarm.yaml](file:///Users/shaungillen/WORKTREES/hermes-state-docs/swarm.yaml)**: Swarm worker roster and active safety perimeter configuration.

### 🔄 Continuity Logs
*   **[ARTIFACTS.md](file:///Users/shaungillen/WORKTREES/hermes-state-docs/docs/ARTIFACTS.md)**: Mapped documentation and system artifacts.
*   **[DECISIONS.md](file:///Users/shaungillen/WORKTREES/hermes-state-docs/docs/DECISIONS.md)**: Architectural and governance decisions.
*   **[OPEN_LOOPS.md](file:///Users/shaungillen/WORKTREES/hermes-state-docs/docs/OPEN_LOOPS.md)**: Unresolved tasks and unverified services.
*   **[HANDOFFS.md](file:///Users/shaungillen/WORKTREES/hermes-state-docs/docs/HANDOFFS.md)**: Summary of current task handoffs.
*   **[NEXT_AGENT_PROMPT.md](file:///Users/shaungillen/WORKTREES/hermes-state-docs/docs/NEXT_AGENT_PROMPT.md)**: Hand-coded next prompt to resume operations.

---

## ⚙️ Operating Guidelines for Incoming Agents

When performing actions in this workspace, you must adhere to the following safety and governance rules:

1.  **Do Not Touch Production Directly**: Never write files or run commands directly in the `~/hermes-workspace` path. Use your dedicated worktree (e.g., `~/WORKTREES/hermes-state-docs`) for all work.
2.  **No Unapproved Destructive Actions**: Any deletion, purging, or source-of-record updates require human confirmation.
3.  **Greenlight Enforcement**: The `orchestrator` has strict `greenlightRequiredFor` gates enabled. Do not attempt to bypass these.
4.  **Log All Significant Actions**: Every time you create a new file or make a structural modification, you **MUST** record it in the Global Ledger at **[AGENT_CREATION_LOG.md](file:///Users/shaungillen/Documents/Antigravity/AGENT_CREATION_LOG.md)**.

---

## ⚡ Development & Launch Commands

If you need to verify or run local services, use the unified shell scripts inside `scripts/`:

*   **Start the Stack**: `/Users/shaungillen/WORKTREES/hermes-state-docs/scripts/start-hermes-stack.sh` (or tell the agent **"Run Hermes"**)
*   **Check Status**: `/Users/shaungillen/WORKTREES/hermes-state-docs/scripts/status-hermes-stack.sh` (or tell the agent **"Check Hermes"**)
*   **Stop the Stack**: `/Users/shaungillen/WORKTREES/hermes-state-docs/scripts/stop-hermes-stack.sh` (or tell the agent **"Stop Hermes"**)

*Note: The main UI Dev Server is launched from `/Users/shaungillen/hermes-workspace`. Do not start the runtime server inside the `~/WORKTREES/hermes-state-docs` documentation worktree.*

---

*Last verified: 2026-06-02*  
*Verification status: Verified for Mac-side Hermes runtime (Gateway, Dashboard, and Workspace UI verified UP). Drew worker remains offline / unverified.*
