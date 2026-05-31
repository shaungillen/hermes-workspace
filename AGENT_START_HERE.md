# AGENT START HERE

> [!WARNING]
> **DO NOT REDISCOVER KNOWN CONTEXT.**  
> Read the state docs first. Do not run broad repository scans, recursive grep, web searches, MCP debugging, or architecture rediscovery unless explicitly requested.

> [!IMPORTANT]
> **Worker Node Federation is Phase 2 or later.**  
> Do not activate, debug, or route tasks to Worker Node Federation until Phase 0 and Phase 1 local read-only Hermes pilots are complete and Shaun explicitly approves.

Welcome to the **Hermes Workspace & state-docs worktree**. This workspace is the primary local agent control plane for the FieldWorks stack, running a persistent swarm of semantic workers coordinate by the Hermes Agent runtime.

This document serves as the entrypoint for any agent landing in this workspace.

---

## 🗺️ Workspace Navigation Map

For quick context alignment, check these primary reference paths:

*   **[HERMES_FIELDWORKS_AGENT_ARCHITECTURE.md](file:///Users/shaungillen/WORKTREES/hermes-state-docs/docs/HERMES_FIELDWORKS_AGENT_ARCHITECTURE.md)**: The canonical system and worker role blueprint.
*   **[HERMES_CURRENT_STATE.md](file:///Users/shaungillen/WORKTREES/hermes-state-docs/docs/HERMES_CURRENT_STATE.md)**: Current runtime, port status, and available local models.
*   **[WORKER_NODE_FEDERATION_STATE.md](file:///Users/shaungillen/WORKTREES/hermes-state-docs/docs/WORKER_NODE_FEDERATION_STATE.md)**: Details on Drew's remote node, the LunaFederation bridge, and DeepSeek timing limits.
*   **[ANTIGRAVITY_MODEL_POLICY.md](file:///Users/shaungillen/WORKTREES/hermes-state-docs/docs/ANTIGRAVITY_MODEL_POLICY.md)**: Routing guidelines for Local, Federated, and Cloud models.
*   **[swarm.yaml](file:///Users/shaungillen/WORKTREES/hermes-state-docs/swarm.yaml)**: Swarm worker roster and active safety perimeter configuration.

---

## ⚙️ Operating Guidelines for Incoming Agents

When performing actions in this workspace, you must adhere to the following safety and governance rules:

1.  **Do Not Touch Production Directly**: Never write files or run commands directly in the `~/hermes-workspace` path. Use your dedicated worktree (e.g. `~/WORKTREES/hermes-state-docs`) for all work.
2.  **No Unapproved Destructive Actions**: Any deletion, purging, or source-of-record updates require human confirmation.
3.  **Greenlight Enforcement**: The `orchestrator` has strict `greenlightRequiredFor` gates enabled. Do not attempt to bypass these.
4.  **Log All Significant Actions**: Every time you create a new file or make a structural modification, you **MUST** record it in the Global Ledger at **[AGENT_CREATION_LOG.md](file:///Users/shaungillen/Documents/Antigravity/AGENT_CREATION_LOG.md)**.

---

## ⚡ Development & Launch Commands

If you need to verify or run local services:

*   **List packages / workspace nodes**: `pnpm list`
*   **Start UI Dev Server**: `pnpm dev` (port 3000)
*   **Check Dashboard status**: `curl http://127.0.0.1:9119/api/status`
