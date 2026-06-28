import { useState, useEffect, type CSSProperties } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  CheckmarkCircle01Icon,
  CancelCircleIcon,
  TimeHalfPassIcon,
  AlertCircleIcon,
  ArrowRight01Icon,
  EyeIcon,
  File01Icon,
  Shield01Icon,
  UserMultipleIcon,
  SlidersVerticalIcon,
  ComputerTerminal01Icon,
  CheckListIcon,
} from '@hugeicons/core-free-icons'
import { cn } from '@/lib/utils'

// ─────────────────────────────────────────────────────────────────────────────
// Theme tokens — matches the existing THEME_STYLE pattern in conductor.tsx
// ─────────────────────────────────────────────────────────────────────────────
const THEME: CSSProperties = {
  ['--theme-bg' as string]: 'var(--color-surface)',
  ['--theme-card' as string]: 'var(--color-primary-50)',
  ['--theme-card2' as string]: 'var(--color-primary-100)',
  ['--theme-border' as string]: 'var(--color-primary-200)',
  ['--theme-text' as string]: 'var(--color-ink)',
  ['--theme-muted' as string]: 'var(--color-primary-700)',
  ['--theme-accent' as string]: 'var(--color-accent-500)',
  ['--theme-danger' as string]: 'var(--color-red-600, #dc2626)',
  ['--theme-warning' as string]: 'var(--color-amber-600, #d97706)',
  ['--theme-success' as string]: '#16a34a',
}

// ─────────────────────────────────────────────────────────────────────────────
// Static mock data — reflects the real gate pipeline run completed today
// No backend wiring. Replace with API calls when backend is ready.
// ─────────────────────────────────────────────────────────────────────────────

type GateStatus = 'PASS' | 'FAIL' | 'PENDING_OPERATOR' | 'HOLD' | 'NOT_STARTED'

interface GateItem {
  id: string
  phase: number
  name: string
  status: GateStatus
  timestamp: string
  summary: string
  reportPath: string
  rawOutputPath: string
  verdict: string
}

const GATE_ITEMS: GateItem[] = [
  {
    id: 'gate-1',
    phase: 1,
    name: 'Intake Complete Gate',
    status: 'PASS',
    timestamp: '2026-06-28 15:44 EDT',
    summary:
      'All goals, audience, scope, and constraints captured. Font licensing resolved (system fonts only). Claim verified via preflight report. Tracking protocol established.',
    reportPath:
      '/Users/shaungillen/BaseOS/OPS/REPORTS/2026-06-28__fieldworks_production_lead_intake_gate_pilot/INTAKE_GATE_REVIEW_REPORT_RERUN_001.md',
    rawOutputPath:
      '/Users/shaungillen/BaseOS/OPS/REPORTS/2026-06-28__fieldworks_production_lead_intake_gate_pilot/RAW_HERMES_OUTPUT_RERUN_001.txt',
    verdict: 'INTAKE_GATE_PASS',
  },
  {
    id: 'gate-5',
    phase: 5,
    name: 'Design Gate',
    status: 'PASS',
    timestamp: '2026-06-28 15:54 EDT',
    summary:
      'Console purpose, primary user, screen sections, operator model, evidence display, MVB scope, and risks all clearly defined. Build-readiness confirmed.',
    reportPath:
      '/Users/shaungillen/BaseOS/OPS/REPORTS/2026-06-28__fieldworks_review_console_design_gate/DESIGN_GATE_REPORT.md',
    rawOutputPath:
      '/Users/shaungillen/BaseOS/OPS/REPORTS/2026-06-28__fieldworks_review_console_design_gate/RAW_AGENT_OUTPUT.txt',
    verdict: 'DESIGN_GATE_PASS',
  },
  {
    id: 'gate-7',
    phase: 7,
    name: 'Build Gate',
    status: 'PENDING_OPERATOR',
    timestamp: '2026-06-28 16:00 EDT',
    summary:
      'MVP built; awaiting operator verification before next phase. Review Console screen built and running at /fieldworks.',
    reportPath:
      '/Users/shaungillen/BaseOS/OPS/REPORTS/2026-06-28__fieldworks_review_console_mvp_build/IMPLEMENTATION_RECEIPT.md',
    rawOutputPath:
      '/Users/shaungillen/BaseOS/OPS/REPORTS/2026-06-28__fieldworks_review_console_mvp_build/TEST_RESULTS.md',
    verdict: 'MVP_BUILD_PENDING',
  },
  {
    id: 'gate-8',
    phase: 8,
    name: 'QA Gate',
    status: 'NOT_STARTED',
    timestamp: '—',
    summary: 'Not started. Requires Build Gate operator approval first.',
    reportPath: '',
    rawOutputPath: '',
    verdict: 'NOT_STARTED',
  },
]

type AgentStatus = 'ACTIVE' | 'IDLE' | 'STAGED' | 'HOLD'

interface AgentRosterItem {
  id: string
  name: string
  role: string
  status: AgentStatus
  note: string
  isActivated: boolean
}

const AGENT_ROSTER: AgentRosterItem[] = [
  {
    id: 'production-lead',
    name: 'FieldWorks Production Lead',
    role: 'Orchestrator / Gate Reviewer',
    status: 'ACTIVE',
    note: 'Activated 2026-06-28. Visible to Hermes CLI. Profile: fieldworks-production-lead.',
    isActivated: true,
  },
  {
    id: 'frontend-builder',
    name: 'Frontend Builder',
    role: 'UI Component Implementation',
    status: 'STAGED',
    note: 'Staged in HYPERAGENT_PACKAGES. Manual import required to activate.',
    isActivated: false,
  },
  {
    id: 'qa-reviewer',
    name: 'QA Reviewer',
    role: 'Test & Verification',
    status: 'STAGED',
    note: 'Staged in HYPERAGENT_PACKAGES. Manual import required to activate.',
    isActivated: false,
  },
  {
    id: 'design-director',
    name: 'Design Director',
    role: 'Visual & UX Direction',
    status: 'STAGED',
    note: 'Staged in HYPERAGENT_PACKAGES. Manual import required to activate.',
    isActivated: false,
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: GateStatus | AgentStatus }) {
  const config = {
    PASS: { label: 'PASS', color: '#16a34a', bg: 'rgba(22,163,74,0.12)', icon: CheckmarkCircle01Icon },
    FAIL: { label: 'FAIL', color: '#dc2626', bg: 'rgba(220,38,38,0.12)', icon: CancelCircleIcon },
    PENDING_OPERATOR: { label: 'PENDING OPERATOR', color: '#d97706', bg: 'rgba(217,119,6,0.12)', icon: TimeHalfPassIcon },
    HOLD: { label: 'HOLD', color: '#7c3aed', bg: 'rgba(124,58,237,0.12)', icon: AlertCircleIcon },
    NOT_STARTED: { label: 'NOT STARTED', color: 'var(--color-primary-500)', bg: 'var(--color-primary-100)', icon: TimeHalfPassIcon },
    ACTIVE: { label: 'ACTIVE', color: '#16a34a', bg: 'rgba(22,163,74,0.12)', icon: CheckmarkCircle01Icon },
    IDLE: { label: 'IDLE', color: 'var(--color-primary-500)', bg: 'var(--color-primary-100)', icon: TimeHalfPassIcon },
    STAGED: { label: 'STAGED', color: '#7c3aed', bg: 'rgba(124,58,237,0.12)', icon: AlertCircleIcon },
  }[status] ?? { label: status, color: 'var(--color-primary-500)', bg: 'var(--color-primary-100)', icon: TimeHalfPassIcon }

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold tracking-wide"
      style={{ color: config.color, background: config.bg }}
    >
      <HugeiconsIcon icon={config.icon} size={11} />
      {config.label}
    </span>
  )
}

function SectionHeader({ icon, label }: { icon: typeof EyeIcon; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <HugeiconsIcon icon={icon} size={15} style={{ color: 'var(--theme-accent)' }} />
      <span className="text-[10px] font-bold tracking-widest uppercase opacity-60">{label}</span>
    </div>
  )
}

function GateCard({ item, isSelected, onClick }: { item: GateItem; isSelected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left p-3.5 rounded-xl border transition-all duration-150 cursor-pointer shadow-sm',
        isSelected
          ? 'border-[color:var(--theme-accent)] bg-[color-mix(in_srgb,var(--theme-accent)_8%,transparent)] shadow-[0_4px_12px_rgba(0,0,0,0.03)]'
          : 'border-[color:var(--theme-border)] bg-[color:var(--theme-card)] hover:border-[color:var(--theme-accent)] hover:bg-[color:var(--theme-card2)]',
      )}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[9px] font-bold uppercase tracking-wider opacity-40">Phase {item.phase}</span>
        <StatusBadge status={item.status} />
      </div>
      <div className="text-xs font-semibold mb-1" style={{ color: 'var(--theme-text)' }}>
        {item.name}
      </div>
      <div className="text-[10px] opacity-40 font-mono">{item.timestamp}</div>
    </button>
  )
}

function PipelineStepper({ activePhase }: { activePhase: number }) {
  const steps = [
    { phase: 1, label: 'Intake', status: 'PASS' },
    { phase: 5, label: 'Design', status: 'PASS' },
    { phase: 7, label: 'Build', status: 'PENDING' },
    { phase: 8, label: 'QA', status: 'NOT_STARTED' },
  ]

  return (
    <div className="mb-4 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-card)] p-3">
      <div className="text-[9px] font-bold uppercase tracking-widest opacity-40 mb-2">Gate Status Pipeline</div>
      <div className="flex flex-wrap items-center justify-between gap-y-2">
        {steps.map((step, idx) => {
          const isPassed = step.status === 'PASS'
          const isPending = step.status === 'PENDING'
          const isCurrent = step.phase === activePhase

          return (
            <div key={step.phase} className="flex-1 min-w-[100px] flex items-center">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex size-5 items-center justify-center rounded-full text-[9px] font-bold transition-all",
                    isPassed && "bg-green-500/20 text-green-600 border border-green-500/30",
                    isPending && "bg-amber-500/20 text-amber-600 border border-amber-500/30 animate-pulse",
                    step.status === 'NOT_STARTED' && "bg-[var(--theme-card2)] text-[var(--theme-muted)] border border-[var(--theme-border)]"
                  )}
                >
                  {isPassed ? '✓' : step.phase}
                </div>
                <div className="flex flex-col">
                  <span className={cn("text-xs font-semibold leading-none", isCurrent ? "text-[var(--theme-text)]" : "text-[var(--theme-muted)]")}>
                    {step.label}
                  </span>
                  <span className="text-[8px] opacity-40 leading-none mt-0.5">{step.status}</span>
                </div>
              </div>
              {idx < steps.length - 1 && (
                <div className="flex-1 mx-2 h-px bg-[var(--theme-border)] min-w-[8px]" />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function DetailPanel({ item }: { item: GateItem }) {
  const [tab, setTab] = useState<'summary' | 'raw'>('summary')
  const [simulatedAction, setSimulatedAction] = useState<'approved' | 'rejected' | null>(null)

  // Reset simulated state when selected gate item changes
  useEffect(() => {
    setSimulatedAction(null)
  }, [item.id])

  return (
    <div className="flex flex-col h-full">
      {/* Pipeline Stepper at the top of Center Panel */}
      <PipelineStepper activePhase={item.phase} />

      {/* Panel header */}
      <div className="flex items-start justify-between mb-4 bg-[var(--theme-card)] p-4 rounded-xl border border-[var(--theme-border)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] opacity-40 font-bold uppercase tracking-wider">Phase {item.phase}</span>
            <StatusBadge status={item.status} />
          </div>
          <h2 className="text-base font-bold" style={{ color: 'var(--theme-text)' }}>
            {item.name}
          </h2>
          <div className="text-xs opacity-40 mt-0.5">{item.timestamp}</div>
        </div>
        <span
          className="px-2.5 py-1 rounded-md text-xs font-mono font-bold tracking-wide shadow-sm"
          style={{ background: 'var(--theme-card2)', color: 'var(--theme-muted)' }}
        >
          {item.verdict}
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-3 p-1 rounded-xl" style={{ background: 'var(--theme-card2)' }}>
        {(['summary', 'raw'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer',
              tab === t
                ? 'bg-[color:var(--theme-card)] shadow-sm text-[color:var(--theme-text)]'
                : 'text-[color:var(--theme-muted)] hover:text-[color:var(--theme-text)]',
            )}
          >
            {t === 'summary' ? 'Summary Report' : 'Raw Output'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 rounded-xl p-4 overflow-y-auto text-sm space-y-4 shadow-inner" style={{ background: 'var(--theme-card2)' }}>
        {tab === 'summary' ? (
          <div className="space-y-3">
            <p className="leading-relaxed opacity-85 text-xs sm:text-sm">{item.summary}</p>
            {item.reportPath && (
              <div className="mt-4 pt-3 border-t border-[var(--theme-border)]">
                <div className="text-[10px] font-bold opacity-40 uppercase tracking-wider mb-1.5">Report Path</div>
                <code className="text-[10px] break-all opacity-70 font-mono block bg-[var(--theme-card)] p-2 rounded-lg border border-[var(--theme-border)]">{item.reportPath}</code>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {item.rawOutputPath ? (
              <div>
                <div className="text-[10px] font-bold opacity-40 uppercase tracking-wider mb-1.5">Raw Output Path</div>
                <code className="text-[10px] break-all opacity-70 font-mono block bg-[var(--theme-card)] p-2 rounded-lg border border-[var(--theme-border)] mb-4">{item.rawOutputPath}</code>
                <div className="text-xs opacity-50 italic bg-[var(--theme-card)] p-3 rounded-lg border border-[var(--theme-border)]">
                  ℹ️ Raw output preserved on disk. No implementation changes are triggered dynamically from this console.
                </div>
              </div>
            ) : (
              <div className="text-xs opacity-50 italic">No raw output — gate not yet started.</div>
            )}
          </div>
        )}
      </div>

      {/* Operator Actions Panel */}
      <div className="mt-4 bg-[var(--theme-card)] p-4 rounded-xl border border-[var(--theme-border)]">
        <div className="text-[10px] font-bold opacity-40 uppercase tracking-wider mb-2">Operator Actions (Verification Review)</div>
        
        {simulatedAction ? (
          <div className="space-y-3">
            {simulatedAction === 'approved' ? (
              <div className="p-3 rounded-lg border border-green-500/30 bg-green-500/10 text-green-600 text-xs font-semibold">
                ✓ Simulated Only: Pipeline Approval Registered (Simulated). Manual script execution required for real gate transition.
              </div>
            ) : (
              <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-500 text-xs font-semibold">
                ✕ Simulated Only: Pipeline Rejection Registered (Simulated). Manual script execution required for real gate transition.
              </div>
            )}
            <button
              onClick={() => setSimulatedAction(null)}
              className="w-full py-1.5 rounded-lg text-xs font-semibold border border-[var(--theme-border)] bg-[var(--theme-card2)] hover:bg-[var(--theme-border)] transition-colors cursor-pointer text-center"
            >
              Reset Review Action
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {item.status === 'PENDING_OPERATOR' ? (
              <>
                <div className="flex gap-2">
                  <button
                    className="flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer text-center bg-green-600/10 text-green-600 border border-green-500/30 hover:bg-green-600/20 active:scale-[0.98]"
                    onClick={() => setSimulatedAction('approved')}
                  >
                    ✓ Simulate Approve Gate
                  </button>
                  <button
                    className="flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer text-center bg-red-600/10 text-red-500 border border-red-500/30 hover:bg-red-600/20 active:scale-[0.98]"
                    onClick={() => setSimulatedAction('rejected')}
                  >
                    ✕ Simulate Reject Gate
                  </button>
                </div>
                 <p className="text-[10px] text-center opacity-40 mt-1 font-mono">
                  ⚠️ Action buttons are visually present and simulated only; they do not execute real gate-transition scripts yet. Manual script execution required for real gate transition.
                </p>
              </>
            ) : (
              <div
                className="py-2.5 rounded-lg text-xs text-center opacity-50 font-semibold"
                style={{ background: 'var(--theme-card2)', border: '1px solid var(--theme-border)' }}
              >
                {item.status === 'NOT_STARTED'
                  ? 'Gate not yet started — awaiting prior gate approval'
                  : 'Gate closed — no action required'}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function AgentCard({ agent }: { agent: AgentRosterItem }) {
  return (
    <div
      className={cn(
        'p-3.5 rounded-xl border transition-all shadow-sm',
        agent.isActivated
          ? 'border-[color:var(--theme-border)] bg-[color:var(--theme-card)]'
          : 'border-dashed border-[color:var(--theme-border)] bg-[color:var(--theme-card)]/30 opacity-60',
      )}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-semibold" style={{ color: 'var(--theme-text)' }}>
          {agent.name}
        </span>
        <StatusBadge status={agent.status} />
      </div>
      <div className="text-[10px] opacity-50 mb-1.5 leading-normal">{agent.role}</div>
      <div className="text-[10px] opacity-40 italic leading-normal border-t border-[var(--theme-border)] pt-1.5 mt-1.5">{agent.note}</div>
      {!agent.isActivated && (
        <div
          className="mt-2.5 text-[10px] text-center py-1 rounded-md font-semibold"
          style={{ background: 'rgba(124,58,237,0.08)', color: '#7c3aed' }}
        >
          Activation Pending — Manual import required
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Governance / Warnings Panel
// ─────────────────────────────────────────────────────────────────────────────
function GovernancePanel() {
  const rules = [
    { ok: true, text: 'No global Hermes runtime config modified.' },
    { ok: true, text: 'No swarm.yaml edited during MVP build.' },
    { ok: true, text: 'No Drew/Luna worker delegation performed.' },
    { ok: true, text: 'No deployment or publish performed.' },
    { ok: true, text: 'Raw output preserved alongside all summary reports.' },
    { ok: false, text: 'Build Gate (Phase 7) awaiting operator approval — no implementation beyond MVP screen.' },
    { ok: null, text: 'Phases 2–4 and 6–11 are not started. Require sequential gate approvals.' },
  ]

  return (
    <div className="space-y-2.5">
      {rules.map((r, i) => (
        <div key={i} className="flex items-start gap-2 text-[11px] leading-normal">
          <span className="mt-0.5 shrink-0" style={{ color: r.ok === true ? '#16a34a' : r.ok === false ? '#d97706' : 'var(--color-primary-500)' }}>
            {r.ok === true ? '✓' : r.ok === false ? '⚠' : '○'}
          </span>
          <span className="opacity-75">{r.text}</span>
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main FieldWorks Review Console screen
// ─────────────────────────────────────────────────────────────────────────────
export function FieldWorksReviewConsole() {
  const [selectedGateId, setSelectedGateId] = useState<string>('gate-7')
  const [copiedPath, setCopiedPath] = useState<string | null>(null)
  const selectedGate = GATE_ITEMS.find((g) => g.id === selectedGateId)!

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{ ...THEME, background: 'var(--theme-bg)', color: 'var(--theme-text)' }}
    >
      {/* ── Status Header ── */}
      <div
        className="shrink-0 flex flex-wrap items-center justify-between gap-2 px-4 py-2 border-b text-[11px] font-semibold"
        style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-card)' }}
      >
        <div className="flex items-center gap-2">
          <HugeiconsIcon icon={CheckListIcon} size={14} style={{ color: 'var(--theme-accent)' }} />
          <span className="font-bold tracking-wide" style={{ color: 'var(--theme-text)' }}>
            FieldWorks Review Console
          </span>
        </div>
        
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 opacity-70">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block animate-pulse" />
            Production Lead: ACTIVE
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block animate-pulse" />
            Build Gate: PENDING VERIFICATION
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 inline-block" />
            3 agents staged
          </div>
        </div>
        
        <div className="text-[10px] opacity-40 font-mono hidden sm:block">
          No implementation started unless explicitly approved
        </div>
      </div>

      {/* ── Main 3-column layout ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── LEFT: Work Queue ── */}
        <div
          className="hidden md:flex w-64 shrink-0 flex-col border-r overflow-hidden"
          style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-card)' }}
        >
          <div className="p-4 border-b" style={{ borderColor: 'var(--theme-border)' }}>
            <SectionHeader icon={File01Icon} label="Work Queue" />
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {GATE_ITEMS.map((item) => (
              <GateCard
                key={item.id}
                item={item}
                isSelected={item.id === selectedGateId}
                onClick={() => setSelectedGateId(item.id)}
              />
            ))}
          </div>
        </div>

        {/* ── CENTER: Selected Item Detail ── */}
        <div className="flex-1 flex flex-col overflow-hidden p-4 sm:p-6">
          {/* Mobile Gate Selector (visible only on mobile) */}
          <div className="md:hidden mb-4 bg-[var(--theme-card)] p-3 rounded-xl border border-[var(--theme-border)]">
            <label className="text-[9px] font-bold uppercase tracking-widest opacity-40 mb-1 block">Select Pipeline Gate</label>
            <select
              value={selectedGateId}
              onChange={(e) => setSelectedGateId(e.target.value)}
              className="w-full p-2 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-card2)] text-xs font-semibold"
            >
              {GATE_ITEMS.map((g) => (
                <option key={g.id} value={g.id}>
                  Phase {g.phase}: {g.name}
                </option>
              ))}
            </select>
          </div>

          <DetailPanel item={selectedGate} />
        </div>

        {/* ── RIGHT: Roster + Governance ── */}
        <div
          className="hidden xl:flex w-72 shrink-0 flex-col border-l overflow-hidden"
          style={{ borderColor: 'var(--theme-border)' }}
        >
          {/* Future Agents Roster */}
          <div
            className="p-4 border-b shrink-0"
            style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-card)' }}
          >
            <SectionHeader icon={UserMultipleIcon} label="Future Agents" />
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3" style={{ background: 'var(--theme-card)' }}>
            {AGENT_ROSTER.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>

          {/* Governance panel */}
          <div
            className="border-t p-4 shrink-0"
            style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-card2)' }}
          >
            <SectionHeader icon={Shield01Icon} label="Governance" />
            <GovernancePanel />
          </div>
        </div>
      </div>

      {/* ── Bottom: Evidence / Receipts strip ── */}
      <div
        className="shrink-0 border-t px-4 py-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]"
        style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-card2)' }}
      >
        <div className="flex items-center gap-1">
          <HugeiconsIcon icon={ComputerTerminal01Icon} size={13} style={{ color: 'var(--theme-accent)' }} />
          <span className="opacity-50">Evidence:</span>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          {[
            { label: 'Intake Pilot Folder', path: '/BaseOS/OPS/REPORTS/2026-06-28__fieldworks_production_lead_intake_gate_pilot/' },
            { label: 'Design Gate Folder', path: '/BaseOS/OPS/REPORTS/2026-06-28__fieldworks_review_console_design_gate/' },
            { label: 'MVP Build Folder', path: '/BaseOS/OPS/REPORTS/2026-06-28__fieldworks_review_console_mvp_build/' },
            { label: 'Drift Patterns', path: '/BaseOS/OPS/LEARNING/shared/TEACHER_STUDENT_COMMON_DRIFT_PATTERNS.md' },
          ].map((ev) => (
            <button
              key={ev.path}
              onClick={() => {
                void navigator.clipboard?.writeText(ev.path).catch(() => undefined);
                setCopiedPath(ev.path);
                setTimeout(() => setCopiedPath(null), 2000);
              }}
              className="px-2 py-0.5 rounded font-mono text-[10px] cursor-pointer transition-colors border hover:bg-[var(--theme-card2)] active:scale-[0.98]"
              style={{
                background: copiedPath === ev.path ? 'rgba(22,163,74,0.12)' : 'var(--theme-card)',
                borderColor: copiedPath === ev.path ? '#16a34a' : 'var(--theme-border)',
                color: copiedPath === ev.path ? '#16a34a' : 'var(--theme-muted)'
              }}
              title={ev.path}
            >
              {copiedPath === ev.path ? 'Copied Path!' : ev.label}
            </button>
          ))}
        </div>
        
        <div className="ml-auto flex items-center gap-1 opacity-45 text-[10px]">
          <HugeiconsIcon icon={SlidersVerticalIcon} size={11} />
          <span>MVP — Static preview. Triggers are simulated.</span>
        </div>
      </div>
    </div>
  )
}
