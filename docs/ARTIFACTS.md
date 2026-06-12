# Continuity Artifacts Map

*Last verified: 2026-06-02*  
*Verification status: Verified for Mac-side Hermes runtime where noted. Drew worker remains offline / unverified.*

---

## 📑 Core Documentation Artifacts

The following documentation artifacts track the Hermes Workspace system architecture, security policies, and federation rules:

### 1. [AGENT_START_HERE.md](file:///Users/shaungillen/WORKTREES/hermes-state-docs/AGENT_START_HERE.md)
*   **Purpose:** Landing page and orientation guide for all incoming AI agents.
*   **Key Contents:** Warning against context rediscovery, phase boundaries, workspace map, and development commands.

### 2. [HERMES_FIELDWORKS_AGENT_ARCHITECTURE.md](file:///Users/shaungillen/WORKTREES/hermes-state-docs/docs/HERMES_FIELDWORKS_AGENT_ARCHITECTURE.md)
*   **Purpose:** The canonical architecture definition for the Hermes swarm.
*   **Key Contents:** Detailed breakdown of the 10 worker roles, safety boundaries, local model tasks, and Sonnet/Opus escalation policies.

### 3. [HERMES_CURRENT_STATE.md](file:///Users/shaungillen/WORKTREES/hermes-state-docs/docs/HERMES_CURRENT_STATE.md)
*   **Purpose:** Live tracker of port bindings, running services, and local models.
*   **Key Contents:** Blocker resolution history, port status list, active local backend models, and swarm worker assignments.

### 4. [HERMES_RUNTIME_AND_CONTINUITY_AUDIT.md](file:///Users/shaungillen/WORKTREES/hermes-state-docs/docs/HERMES_RUNTIME_AND_CONTINUITY_AUDIT.md)
*   **Purpose:** Verified diagnostic record of the active Mac-side control plane.
*   **Key Contents:** Tailscale parameters, Gateway health check outputs, Dashboard API states, and the offline Drew worker diagnosis.

### 5. [WORKER_NODE_FEDERATION_STATE.md](file:///Users/shaungillen/WORKTREES/hermes-state-docs/docs/WORKER_NODE_FEDERATION_STATE.md)
*   **Purpose:** Tracks Drew's remote federation node state and safety rules.
*   **Key Contents:** DeepSeek execution timers, kill triggers, checkpoint policies, and the remote decision matrix.

### 6. [ANTIGRAVITY_MODEL_POLICY.md](file:///Users/shaungillen/WORKTREES/hermes-state-docs/docs/ANTIGRAVITY_MODEL_POLICY.md)
*   **Purpose:** Defines routing rules and strict context length policies.
*   **Key Contents:** Four-tier model assignments, local upgrade targets, and the manual model switching rule.

---

## 🛠️ System Configuration Artifacts

### 1. [swarm.yaml](file:///Users/shaungillen/WORKTREES/hermes-state-docs/swarm.yaml)
*   **Purpose:** Configuration blueprint for the 10-agent semantic worker swarm.
*   **Key Contents:** Worker role descriptions, toolsets, skills, and orchestrator greenlight rules.

### 2. [config.yaml](file:///Users/shaungillen/.hermes/config.yaml)
*   **Purpose:** Global config file for the local Hermes instance.
*   **Key Contents:** Default model parameters (`hermes3:8b` via Ollama) and local skill search directories.

### 3. [.env](file:///Users/shaungillen/.hermes/.env)
*   **Purpose:** Environment file for secrets and server configuration.
*   **Key Contents:** `API_SERVER_ENABLED=true` and platform integration keys (redacted in reports).

### 4. [AGENT_CREATION_LOG.md](file:///Users/shaungillen/Documents/Antigravity/AGENT_CREATION_LOG.md)
*   **Purpose:** The Global Ledger documenting all new files and significant structural modifications.
