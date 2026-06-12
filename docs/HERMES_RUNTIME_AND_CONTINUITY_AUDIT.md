# Hermes Runtime & Continuity Audit

*Last verified: 2026-06-02*  
*Verification status: Verified for Mac-side Hermes runtime (Gateway, Dashboard, and Workspace UI verified UP). Drew worker remains offline / unverified.*

---

## 🔍 Verified Mac-Side Runtime State

The following local parameters have been verified and validated on the host machine:

### 1. Tailscale Connection
*   **Status:** Connected
*   **Mac Tailscale IP:** `100.98.144.126`

### 2. Environment Settings
*   **Path:** `/Users/shaungillen/.hermes/.env`
*   **Parameters:** `API_SERVER_ENABLED=true` is present and active.

### 3. Hermes Gateway Service
*   **Status:** Active & Listening
*   **PID:** `95213`
*   **Health Check Endpoint:** `http://127.0.0.1:8642/health`
*   **Response Payload:**
    ```json
    {
      "status": "ok",
      "platform": "hermes-agent"
    }
    ```

### 4. Hermes Dashboard Service
*   **Status:** Active & Listening
*   **Dashboard URL:** `http://127.0.0.1:9119`
*   **API Status URL:** `http://127.0.0.1:9119/api/status`
*   **Version:** `0.13.0`
*   **Parameters:**
    *   `gateway_running=true`
    *   `gateway_platforms.telegram.state=connected`
    *   `gateway_platforms.api_server.state=connected`
    *   `active_sessions=0`

### 5. Workspace UI Service
*   **Status:** Active & Listening (Vite dev server started from `/Users/shaungillen/hermes-workspace` via `pnpm dev`)
*   **Local URL:** `http://localhost:3000/`
*   **Tailscale/Network URL:** `http://100.98.144.126:3000/`
*   **Verification:** Successfully resolves and pairs with the gateway backend at `http://127.0.0.1:8642`.

---

## ⚠️ Unverified / Offline Remote Node State

### 1. Drew Worker Node
*   **Tailscale IP:** `100.109.186.26`
*   **Status:** **OFFLINE / UNVERIFIED** (ping and port checks unsuccessful)
*   **Last Seen:** May 31, 6:31 PM EDT (per Tailscale admin panel)
*   **Note:** Drew's offline status is not a blocker for Mac-side local testing or Phase 0/1 pilots.

---

## 🛠️ Stack Management Interface

The stack services listed in this audit are controlled and monitored via the following scripts:
*   **Startup:** `scripts/start-hermes-stack.sh`
*   **Shutdown:** `scripts/stop-hermes-stack.sh`
*   **Status Check:** `scripts/status-hermes-stack.sh`

Detailed runtime recovery processes are documented in **[HERMES_STACK_RUNBOOK.md](file:///Users/shaungillen/WORKTREES/hermes-state-docs/docs/HERMES_STACK_RUNBOOK.md)**.
