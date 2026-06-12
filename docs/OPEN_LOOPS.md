# Open Loops and Verification Tasks

*Last verified: 2026-06-02*  
*Verification status: Verified for Mac-side Hermes runtime (Gateway, Dashboard, and Workspace UI verified UP). Drew worker remains offline / unverified.*  
*Note: The phrase “Run Hermes” now means following the standard startup sequence documented in **[HERMES_STACK_RUNBOOK.md](file:///Users/shaungillen/WORKTREES/hermes-state-docs/docs/HERMES_STACK_RUNBOOK.md)**.*

---

## ⚠️ High-Priority Open Loops

### 1. Drew Worker Verification (OFFLINE / UNVERIFIED)
*   **Context:** Drew's remote node exists at Tailscale IP `100.109.186.26`. However, current ping and network checks verify it is offline or unreachable from this network context.
*   **Last Seen:** Tailscale admin panel indicates Drew was last active on May 31, 6:31 PM EDT.
*   **Next Steps:**
    *   Once Drew's node returns online, verify port `8000` is open via Tailscale: `nc -z -w 3 100.109.186.26 8000`.
    *   Confirm the remote `LunaFederation` SSE bridge is responsive.
    *   Conduct a remote model inventory check (`DeepSeek Coder 8B`).

### 2. Model Upgrade Pulls (PENDING)
*   **Context:** Swarm models are currently bounded to local `hermes3:8b` and `deepseek-r1:8b`. The upgrade path requires pulling larger model weights for advanced reasoning.
*   **Next Steps:**
    *   Once local resources permit, pull `unsloth/Qwen3.5-9B-GGUF` or Qwen-Coder-7B equivalents via Ollama.
    *   Validate slots configuration inside `~/.hermes/config.yaml`.

---

## 🎉 Closed / Resolved Loops

### 1. Boot Workspace UI on Port 3000 (RESOLVED)
*   **Context:** The node/Vite dev server for the Workspace UI has been successfully started and verified active.
*   **Resolution:** Started from `/Users/shaungillen/hermes-workspace` via `pnpm dev`. Local URL `http://localhost:3000/` and Tailscale/network URL `http://100.98.144.126:3000/` are both responsive and successfully pair with the gateway backend at `http://127.0.0.1:8642`.

---

## 🔍 Verification Checklist

- [x] Mac Tailscale Connection (`100.98.144.126`)
- [x] API Server Environment (`API_SERVER_ENABLED=true` in `~/.hermes/.env`)
- [x] Hermes Gateway Active (`PID 95213`, Listening on port `8642`)
- [x] Gateway Health Check Response (`{"status":"ok","platform":"hermes-agent"}`)
- [x] Hermes Dashboard Active (Port `9119`, responding at `/api/status`)
- [x] Workspace UI Active (Port `3000`)
- [ ] Drew Remote Worker Connectivity (Tailscale `100.109.186.26`) - **OFFLINE**
