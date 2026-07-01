/**
 * GET /api/fieldworks/data
 *
 * Calls the Python db_query_helper.py to fetch live data from Supabase.
 * Returns skill_run rows, decision rows, and open_loop rows.
 *
 * Loopback + auth-gated — same security model as /api/local-execution.
 * Credentials are never stored here; the Python helper reads MIGRATE_POSTGRES_URL
 * from the server process environment.
 */
import { spawn } from 'node:child_process'
import { join } from 'node:path'

import { json } from '@tanstack/react-start'
import { createFileRoute } from '@tanstack/react-router'

import { getRequestIp, isAuthenticated } from '../../../server/auth-middleware'

const LOOPBACK_IPS = new Set(['127.0.0.1', '::1', 'localhost', '::ffff:127.0.0.1'])
const LOOPBACK_HOSTS = new Set(['127.0.0.1', '::1', 'localhost'])

// Absolute path to the fieldworks-contextlayer repo
const FIELDWORKS_REPO = '/Users/shaungillen/BaseOS/fieldworks-contextlayer'
const PYTHON_HELPER = join(FIELDWORKS_REPO, 'scripts/migration/db_query_helper.py')
const PYTHON_BIN = join(FIELDWORKS_REPO, '.venv/bin/python')
const TIMEOUT_MS = 15_000
const MAX_CHARS = 100_000

function isLoopbackRequest(request: Request): boolean {
  const host = new URL(request.url).hostname
  return LOOPBACK_IPS.has(getRequestIp(request)) && LOOPBACK_HOSTS.has(host)
}

function runPythonHelper(subcommand: string): Promise<{ stdout: string; stderr: string; code: number | null }> {
  return new Promise((resolve) => {
    let stdout = ''
    let stderr = ''
    let code: number | null = null

    const child = spawn(PYTHON_BIN, [PYTHON_HELPER, subcommand], {
      cwd: FIELDWORKS_REPO,
      env: {
        ...process.env,
        PATH: process.env.PATH,
      },
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    const timer = setTimeout(() => {
      stderr += '\n[Timeout: helper process killed after 15s]'
      child.kill('SIGTERM')
    }, TIMEOUT_MS)

    child.stdout.on('data', (chunk: Buffer) => {
      stdout = (stdout + chunk.toString()).slice(0, MAX_CHARS)
    })
    child.stderr.on('data', (chunk: Buffer) => {
      stderr = (stderr + chunk.toString()).slice(0, MAX_CHARS)
    })
    child.on('close', (c) => {
      clearTimeout(timer)
      code = c
      resolve({ stdout, stderr, code })
    })
    child.on('error', (err) => {
      clearTimeout(timer)
      stderr += `\n[spawn error: ${err.message}]`
      code = 1
      resolve({ stdout, stderr, code })
    })
  })
}

async function fetchTable(table: 'list-runs' | 'list-decisions' | 'list-open-loops') {
  const result = await runPythonHelper(table)
  if (result.code !== 0) {
    return { ok: false as const, error: result.stderr.trim() || `Helper exited ${result.code}` }
  }
  try {
    return JSON.parse(result.stdout) as { ok: boolean; rows: unknown[]; count: number }
  } catch {
    return { ok: false as const, error: 'Helper returned non-JSON output' }
  }
}

export const Route = createFileRoute('/api/fieldworks/data')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!isLoopbackRequest(request)) {
          return json({ ok: false, error: 'Loopback only' }, { status: 403 })
        }
        if (!isAuthenticated(request)) {
          return json({ ok: false, error: 'Unauthorized' }, { status: 401 })
        }

        if (!process.env.MIGRATE_POSTGRES_URL) {
          return json(
            { ok: false, error: 'MIGRATE_POSTGRES_URL not set in server environment' },
            { status: 503 },
          )
        }

        const [runs, decisions, openLoops] = await Promise.all([
          fetchTable('list-runs'),
          fetchTable('list-decisions'),
          fetchTable('list-open-loops'),
        ])

        return json({
          ok: true,
          runs,
          decisions,
          openLoops,
        })
      },
    },
  },
})
