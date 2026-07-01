/**
 * POST /api/fieldworks/decision
 *
 * Inserts a gate approval/rejection into the Supabase `decision` table via
 * db_query_helper.py, then stages an OKF audit document automatically.
 *
 * Body (JSON):
 *   { runId?: string, gateId: string, status: "APPROVED"|"REJECTED"|"HOLD"|"ESCALATED",
 *     operator: string, notes?: string, supersedes?: string }
 *
 * Loopback + auth-gated. Credentials come from MIGRATE_POSTGRES_URL in the
 * server process environment — never from request payload.
 *
 * OKF staging is best-effort: if the okf-stage script fails, the decision is
 * still committed and the response includes a `okfStageWarning` field.
 */
import { spawn } from 'node:child_process'
import { join } from 'node:path'

import { json } from '@tanstack/react-start'
import { createFileRoute } from '@tanstack/react-router'

import { getRequestIp, isAuthenticated } from '../../../server/auth-middleware'
import { requireJsonContentType } from '../../../server/rate-limit'

const LOOPBACK_IPS = new Set(['127.0.0.1', '::1', 'localhost', '::ffff:127.0.0.1'])
const LOOPBACK_HOSTS = new Set(['127.0.0.1', '::1', 'localhost'])

const FIELDWORKS_REPO = '/Users/shaungillen/BaseOS/fieldworks-contextlayer'
const OKF_ROOT = '/Users/shaungillen/BaseOS/KNOWLEDGE/OKF'
const PYTHON_HELPER = join(FIELDWORKS_REPO, 'scripts/migration/db_query_helper.py')
const PYTHON_BIN = join(FIELDWORKS_REPO, '.venv/bin/python')
const OKF_STAGE_BIN = join(OKF_ROOT, 'bin/okf-stage')
const TIMEOUT_MS = 20_000

const VALID_STATUSES = new Set(['APPROVED', 'REJECTED', 'HOLD', 'ESCALATED'])

function isLoopbackRequest(request: Request): boolean {
  const host = new URL(request.url).hostname
  return LOOPBACK_IPS.has(getRequestIp(request)) && LOOPBACK_HOSTS.has(host)
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return Boolean(v) && typeof v === 'object' && !Array.isArray(v)
}

function readStr(v: unknown, maxLen = 500): string {
  return typeof v === 'string' ? v.trim().slice(0, maxLen) : ''
}

function runProcess(
  bin: string,
  args: string[],
  opts: { cwd: string; env?: NodeJS.ProcessEnv; timeoutMs?: number },
): Promise<{ stdout: string; stderr: string; code: number | null }> {
  return new Promise((resolve) => {
    let stdout = ''
    let stderr = ''
    let code: number | null = null

    const child = spawn(bin, args, {
      cwd: opts.cwd,
      env: opts.env ?? process.env,
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    const timer = setTimeout(() => {
      stderr += '\n[Timeout]'
      child.kill('SIGTERM')
    }, opts.timeoutMs ?? TIMEOUT_MS)

    child.stdout.on('data', (c: Buffer) => { stdout = (stdout + c.toString()).slice(0, 100_000) })
    child.stderr.on('data', (c: Buffer) => { stderr = (stderr + c.toString()).slice(0, 100_000) })
    child.on('close', (c) => { clearTimeout(timer); code = c; resolve({ stdout, stderr, code }) })
    child.on('error', (err) => {
      clearTimeout(timer)
      stderr += `\n[spawn error: ${err.message}]`
      code = 1
      resolve({ stdout, stderr, code })
    })
  })
}

async function stageOkfUpdate(gateId: string, status: string, operator: string, decisionId: string): Promise<string | null> {
  // Write a temp source file for okf-stage, then clean up
  const { writeFile, unlink } = await import('node:fs/promises')
  const { randomUUID } = await import('node:crypto')
  const tmpFile = join(OKF_ROOT, `inbox/_tmp_decision_${randomUUID()}.md`)
  const content = [
    '---',
    'type: decision',
    `id: decision.${decisionId}`,
    `title: Gate ${gateId} — ${status}`,
    'status: active',
    `owner: ${operator}`,
    'canonical: false',
    'review_status: generated',
    `created: ${new Date().toISOString().slice(0, 10)}`,
    `updated: ${new Date().toISOString().slice(0, 10)}`,
    'source_of_truth: fieldworks-console-decision-api',
    'confidence: high',
    'related: [project.fieldworks]',
    'supersedes: []',
    'tags: [decision, fieldworks, gate-review]',
    'agent_permissions: [READ]',
    '---',
    '',
    `# Gate ${gateId}: ${status}`,
    '',
    `**Decision ID:** ${decisionId}`,
    `**Gate:** ${gateId}`,
    `**Status:** ${status}`,
    `**Operator:** ${operator}`,
    `**Decided At:** ${new Date().toISOString()}`,
    '',
    '> This document was auto-staged by the FieldWorks Review Console. Promote with `./bin/okf-promote` after review.',
  ].join('\n')

  try {
    await writeFile(tmpFile, content, 'utf8')
    const result = await runProcess(
      OKF_STAGE_BIN,
      [tmpFile, 'decisions/', `Gate ${gateId} decision ${status.toLowerCase()}`],
      { cwd: OKF_ROOT, timeoutMs: 10_000 },
    )
    await unlink(tmpFile).catch(() => undefined)
    if (result.code !== 0) {
      return `okf-stage exited ${result.code}: ${result.stderr.trim()}`
    }
    return null
  } catch (err) {
    await unlink(tmpFile).catch(() => undefined)
    return err instanceof Error ? err.message : String(err)
  }
}

export const Route = createFileRoute('/api/fieldworks/decision')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!isLoopbackRequest(request)) {
          return json({ ok: false, error: 'Loopback only' }, { status: 403 })
        }
        if (!isAuthenticated(request)) {
          return json({ ok: false, error: 'Unauthorized' }, { status: 401 })
        }
        const csrfCheck = requireJsonContentType(request)
        if (csrfCheck) return csrfCheck

        if (!process.env.MIGRATE_POSTGRES_URL) {
          return json(
            { ok: false, error: 'MIGRATE_POSTGRES_URL not set in server environment' },
            { status: 503 },
          )
        }

        let body: unknown
        try { body = await request.json() } catch {
          return json({ ok: false, error: 'JSON body required' }, { status: 400 })
        }
        if (!isRecord(body)) {
          return json({ ok: false, error: 'JSON object required' }, { status: 400 })
        }

        const gateId = readStr(body.gateId, 80)
        const statusVal = readStr(body.status, 20).toUpperCase()
        const operator = readStr(body.operator, 120) || 'operator'
        const notes = readStr(body.notes, 2000)
        const runId = readStr(body.runId, 80)
        const supersedes = readStr(body.supersedes, 80)

        if (!gateId) {
          return json({ ok: false, error: 'gateId is required' }, { status: 400 })
        }
        if (!VALID_STATUSES.has(statusVal)) {
          return json(
            { ok: false, error: `status must be one of: ${[...VALID_STATUSES].join(', ')}` },
            { status: 400 },
          )
        }

        // Build CLI args for create-decision
        const helperArgs = [
          PYTHON_HELPER,
          'create-decision',
          '--gate-id', gateId,
          '--status', statusVal,
          '--operator', operator,
          '--notes', notes,
        ]
        if (runId) helperArgs.push('--run-id', runId)
        if (supersedes) helperArgs.push('--supersedes', supersedes)

        const dbResult = await runProcess(PYTHON_BIN, helperArgs, {
          cwd: FIELDWORKS_REPO,
          env: { ...process.env },
        })

        if (dbResult.code !== 0) {
          return json(
            { ok: false, error: dbResult.stderr.trim() || `Helper exited ${dbResult.code}` },
            { status: 500 },
          )
        }

        let decision: Record<string, unknown> = {}
        try {
          const parsed = JSON.parse(dbResult.stdout) as { ok: boolean; decision: Record<string, unknown> }
          decision = parsed.decision ?? {}
        } catch {
          return json({ ok: false, error: 'Helper returned non-JSON output' }, { status: 500 })
        }

        // Best-effort OKF staging — never blocks the response
        const decisionId = String(decision.id ?? 'unknown')
        const okfWarn = await stageOkfUpdate(gateId, statusVal, operator, decisionId)

        return json({
          ok: true,
          decision,
          okfStaged: okfWarn === null,
          okfStageWarning: okfWarn ?? undefined,
        })
      },
    },
  },
})
