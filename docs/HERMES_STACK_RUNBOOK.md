# Hermes Stack Runbook

This document details the operational runbook for the local Hermes swarm control plane and the messaging gateway stack.

*Last verified: 2026-06-02*  
*Verification status: Verified for Mac-side Hermes runtime. Drew worker remains offline / unverified.*

---

## 🧭 Operational State Definition

### 1. What Should Be Running
For a fully active development and testing environment on Shaun's Mac, the following local services must be online:
1.  **Tailscale Connection:** Network communication bridge enabling remote node mapping.
2.  **Hermes Gateway:** Foreground process acting as the messaging and API coordinator.
3.  **Hermes Dashboard:** Web interface for managing sessions, skills, and configuration.
4.  **Hermes Workspace UI:** Vite frontend server providing the primary user interface.
5.  **Local Ollama Service:** Exposing model endpoints for `hermes3:8b` and `deepseek-r1:8b`.

---

## 🔌 Port Mapping & Meanings

| Port | Service | Owner | Description |
|---|---|---|---|
| **8642** | Hermes Gateway | Python (Uvicorn/FastAPI) | Exposes the API endpoint for UI/agent pairing and Telegram coordination. |
| **9119** | Hermes Dashboard | Python (FastAPI) | Serving the back-office dashboard and session triages. |
| **3000** | Hermes Workspace UI | Node/Vite (from `~/hermes-workspace`) | Local web interface frontend. |
| **11434** | Ollama | Ollama Daemon | Local model inference provider. |
| **5001** | Dashboard Bridge | Python (`dashboard_bridge.py`) | Operational bridge to BaseOS dashboard. |

---

## ⚡ Quick Command: “Run Hermes”

If Shaun asks an agent to `"Run Hermes"`, `"Get Hermes running"`, `"Start Hermes"`, or `"Bring Hermes back up"`, the agent should follow this standard startup sequence:

### 1. Verification and Launch Sequence
1.  **Confirm Tailscale Connection:** Run `tailscale status` and verify Tailscale is UP.
2.  **Confirm Ollama Backend:** Confirm Ollama is listening on port `11434`.
3.  **Check Gateway Status (8642):**
    *   If port `8642` is closed, start it:
        ```bash
        nohup hermes gateway run > ~/.hermes/logs/gateway-restart.log 2>&1 &
        ```
4.  **Check Dashboard Status (9119):**
    *   If port `9119` is closed, start it:
        ```bash
        nohup hermes dashboard --no-open --port 9119 > ~/.hermes/server.log 2>&1 &
        ```
5.  **Check Workspace UI Status (3000):**
    *   If port `3000` is closed, start it **from the main application repository** (`/Users/shaungillen/hermes-workspace`):
        ```bash
        cd /Users/shaungillen/hermes-workspace && nohup pnpm dev > ~/.hermes/ui.log 2>&1 &
        ```
6.  **Verify Active Endpoints:**
    *   `curl -sS http://127.0.0.1:8642/health` -> Expect `{"status":"ok","platform":"hermes-agent"}`
    *   `curl -sS http://127.0.0.1:9119/api/status` -> Expect JSON payload
    *   `curl -I http://127.0.0.1:3000` -> Expect `HTTP/1.1 200 OK`

---

## ⚙️ Manual Startup & Shutdown Procedures

### Startup After Reboot
To start all services sequentially, Shaun can run the startup script:
```bash
/Users/shaungillen/WORKTREES/hermes-state-docs/scripts/start-hermes-stack.sh
```

### Clean Shutdown
To stop the Workspace UI and Dashboard cleanly without affecting Tailscale or killing arbitrary processes, run:
```bash
/Users/shaungillen/WORKTREES/hermes-state-docs/scripts/stop-hermes-stack.sh
```
*Note: The script leaves the Gateway running by default, as it serves background operations. To stop the Gateway service, run `hermes gateway stop`.*

### Checking Status
To display a status grid of all services, run:
```bash
/Users/shaungillen/WORKTREES/hermes-state-docs/scripts/status-hermes-stack.sh
```

---

## 🔄 Rough Shutdown & Power Loss Recovery

If the host machine experiences a rough shutdown or a reboot:
1.  Check for orphaned locks: If the gateway fails to start with "Gateway runtime lock is already held", check for running instances `ps aux | grep hermes` and if none exist, clear the lock file:
    ```bash
    rm -f ~/.hermes/gateway.lock
    ```
2.  Run the status check script to identify down components.
3.  Execute `scripts/start-hermes-stack.sh` to boot the stack.

---

## 🛡️ Roster & Operational Boundaries

### What NOT to Touch
*   **Production Codebase:** Never run or edit code directly inside `/Users/shaungillen/hermes-workspace` unless starting the dev server. All continuity documentation and runbooks belong exclusively inside `/Users/shaungillen/WORKTREES/hermes-state-docs`.
*   **Tailscale Configurations:** Do not modify tailnet settings or attempt to change ACLs.
*   **Model Store:** Do not move model weights in `~/.cache` or attempt manual downloads.

### Drew Worker Offline Behavior
*   The Drew remote node (`100.109.186.26`) is optional and may be offline.
*   If Drew's node is offline, the local Mac swarm (`hermes3:8b` and `deepseek-r1:8b`) handles all executions. Do not block local testing due to Drew's offline status. Keep it as an open loop.

---

## 🗣️ Shaun's Agent Command Phrases

Shaun can use these short phrases to command any incoming agent:

*   **"Run Hermes"** or **"Get Hermes running"** or **"Start Hermes"**: Start the standard sequence to launch Gateway, Dashboard, and UI.
*   **"Check Hermes"**: Run the status check script to inspect port bindings and Tailscale connection.
*   **"Stop Hermes"**: Stop Workspace UI and Dashboard, leaving Tailscale active, and prompting before stopping Gateway.
*   **"Recover Hermes"**: Perform locks cleanup and execute the start sequence.
