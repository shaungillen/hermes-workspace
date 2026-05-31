# Worker Node Federation State

**Last Updated:** 2026-05-22  
**Status:** Inactive (Awaiting Phase 2+)  
**Target Node:** `25.4.90.63:8000` (Drew's Node)

---

## 🌐 Overview & Core Principles

> [!WARNING]
> **Worker Node Federation is inactive and off-limits until Phase 2 or later.**  
> It must not be used for live task execution, install work, MCP debugging, or compute delegation until Phase 0 and Phase 1 local Hermes validation are complete and Shaun gives explicit approval.

Worker Node Federation is a **bounded, stateless execution extension** designed to offload heavy, isolated coding tasks to satellite machines running DeepSeek Coder 8B. 

This model ensures that resource-intensive execution or long-running generation tasks do not saturate the primary local Hermes control plane.

### 🛡️ Safety & Perimeter Hard Rules

*   **No Credentials**: Remote federation nodes are never passed API keys, passwords, or cloud credentials.
*   **Execution Isolation**: Federation nodes operate inside isolated sandboxes. They cannot publish, write to production branches, or trigger external network calls.
*   **Review Required**: All output returned from a federation node is considered untrusted and **must** be verified by the local Hermes `reviewer` and `qa` workers before a human greenlight is requested.
*   **LunaFederation Bridge**: The connection is mediated exclusively via the `LunaFederation` MCP server.

---

## 📊 Federation Decision Matrix

| Task Characteristics | Routed To | Model Used |
|---|---|---|
| Isolated function creation with spec | **Federated Node** | Remote DeepSeek Coder 8B |
| Bounded refactor of a single file | **Federated Node** | Remote DeepSeek Coder 8B |
| Non-interactive code generation | **Federated Node** | Remote DeepSeek Coder 8B |
| Multi-file changes requiring local repo context | **Local Hermes Builder** | Local `hermes3:8b` |
| Tasks involving session memory or history | **Local Hermes Builder** | Local `hermes3:8b` |
| Research, QA, or Merge Gates | **Local Hermes Swarm** | Local `deepseek-r1:8b` / `hermes3:8b` |

---

## ⏱️ DeepSeek Timing & Kill Policy

To prevent remote processes from hanging indefinitely during reasoning, the following timing guidelines are strictly enforced:

### 1. Hard Boundaries & Allowances
*   **Standard Bounded Task**: Maximum **60 minutes**.
*   **Large-scale Overhaul**: Maximum **90 minutes**.
*   **Hard Stop Timeout**: Maximum **120 minutes** (kill process, escalate to human).

### 2. Progress Monitoring
*   Workers must emit a structured checkpoint **every 10 minutes** (`STATE`, `FILES_CHANGED`, `COMMANDS_RUN`, `RESULT`, `NEXT_ACTION`).
*   If no checkpoint is received in 10 minutes, the orchestrator will ping the worker.
*   If no response to the ping within 5 minutes, the task is marked as `STALLED` and escalated.

### 3. Kill Criteria
Do **not** terminate a federated worker unless **all three** of the following conditions are met for **20 consecutive minutes**:
1.  No console output (stdout/stderr is silent).
2.  No active CPU or GPU consumption detected on the remote PID.
3.  No workspace file mutations or timestamp modifications.

### 4. Recovery & Restart
*   After a process is killed, wait **2 minutes** before attempting a restart.
*   Feed the previous partial run logs back into the model to preserve progress.
*   Limit tasks to a maximum of **2 restarts** before returning to the human operator for task decomposition.
