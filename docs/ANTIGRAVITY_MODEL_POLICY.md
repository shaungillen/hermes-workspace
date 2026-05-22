# Antigravity Model Policy

**Last Updated:** 2026-05-22  
**Status:** Canonical Model Routing Directive  
**Owner:** Antigravity UI & Governance Seat

---

## 🧭 Core Model Policy

Model routing across the Hermes Workspace and Worker Node Federation is divided into **four tiers** to balance local latency, inference cost, reasoning depth, and data privacy. 

All automated model transitions must respect these tier boundaries and require a human greenlight when shifting security contexts.

---

## 📊 Model Tiers & Assignments

### 1. Reasoning Tier (Local Ollama)
*   **Assigned Model:** `deepseek-r1:8b` (or `llama3:70b` for heavy reasoning if needed).
*   **Workers:** `orchestrator`, `strategist`, `researcher`.
*   **Purpose:** Complex task decomposition, planning, logic synthesis, and read-only architecture audits. These tasks require deep logical coherence and context sorting.

### 2. Instruction Tier (Local Ollama)
*   **Assigned Model:** `hermes3:8b`.
*   **Workers:** `builder`, `reviewer`, `qa`, `ops-watch`, `maintainer`, `inbox-triage`, `km-agent`.
*   **Purpose:** Actionable instruction-following, mechanical file editing, smoke-test scripting, status reporting, and routine knowledge curation.

### 3. Federated Code Tier (Remote Bounded)
*   **Assigned Model:** `DeepSeek Coder 8B` (via Drew's remote node).
*   **Workers:** Bounded programming and isolated code generation jobs.
*   **Purpose:** Stateless code output generation against strict specs.

### 4. Cloud Escalation Tier (API Target)
*   **Assigned Model:** `Claude 3.5 Sonnet` / `Claude 3 Opus` (or `GPT-5.5` when active via cloud provider).
*   **Trigger Conditions:** 
    *   Failure of local reasoning models to resolve logic loops after 2 attempts.
    *   Large multi-file refactoring tasks affecting critical architecture files.
    *   Security-sensitive cryptography, payment, or auth implementation.
    *   Final sanity checking of high-risk releases.

---

## 📈 Target Local Upgrade Path

When local computing resources permit, Ollama should pull and cache the following targets:

1.  **Instruction & Code Consolidation:** Pull `qwen3.5:9b` (or `unsloth/Qwen3.5-9B-GGUF` equivalents).
2.  **Roster Re-assignment:** 
    *   Replace `hermes3:8b` with `qwen3.5:9b` for the instruction tier.
    *   Replace `deepseek-r1:8b` with `qwen3.5:9b` for the orchestrator, strategist, and researcher to unify context size and command capability.

---

## 🛡️ Context Length & Fallback Guards

*   **Context Window**: Local models must be configured with a minimum context window of **32,768 tokens** (in `~/.hermes/config.yaml`) to prevent truncation and tool-call formatting failures.
*   **Automatic Fallback**: If `deepseek-r1:8b` is unresponsive, local agents must degrade safely to `hermes3:8b` or `llama3.2` and alert the operator instead of silently escalating to expensive cloud APIs.
