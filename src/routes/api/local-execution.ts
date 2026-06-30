import { json } from '@tanstack/react-start'
import { createFileRoute } from '@tanstack/react-router'

import {
  executeApprovedLocalAction,
  listApprovedLocalActions,
} from '../../server/local-execution-lane'
import {
  getRequestIp,
  isAuthenticated,
} from '../../server/auth-middleware'
import { requireJsonContentType } from '../../server/rate-limit'

const LOOPBACK_IPS = new Set(['127.0.0.1', '::1', 'localhost', '::ffff:127.0.0.1'])
const LOOPBACK_HOSTS = new Set(['127.0.0.1', '::1', 'localhost'])

function isLoopbackRequest(request: Request): boolean {
  const requestHost = new URL(request.url).hostname
  return LOOPBACK_IPS.has(getRequestIp(request)) && LOOPBACK_HOSTS.has(requestHost)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

export const Route = createFileRoute('/api/local-execution')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!isLoopbackRequest(request)) {
          return json({ ok: false, error: 'Local execution is loopback-only' }, { status: 403 })
        }
        if (!isAuthenticated(request)) {
          return json({ ok: false, error: 'Unauthorized' }, { status: 401 })
        }

        return json({
          ok: true,
          actions: listApprovedLocalActions(),
        })
      },
      POST: async ({ request }) => {
        if (!isLoopbackRequest(request)) {
          return json({ ok: false, error: 'Local execution is loopback-only' }, { status: 403 })
        }
        if (!isAuthenticated(request)) {
          return json({ ok: false, error: 'Unauthorized' }, { status: 401 })
        }

        const csrfCheck = requireJsonContentType(request)
        if (csrfCheck) return csrfCheck

        let payload: unknown
        try {
          payload = await request.json()
        } catch {
          return json({ ok: false, error: 'JSON body required' }, { status: 400 })
        }

        if (!isRecord(payload)) {
          return json({ ok: false, error: 'JSON object body required' }, { status: 400 })
        }

        const result = await executeApprovedLocalAction(payload)
        return json(result, { status: result.ok ? 200 : result.status })
      },
    },
  },
})
