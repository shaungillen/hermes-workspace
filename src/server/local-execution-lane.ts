import { spawn } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

export const LOCAL_EXECUTION_REPORT_ROOT =
  '/Users/shaungillen/BaseOS/OPS/REPORTS/2026-06-28__hermes_local_execution_lane_v0_2/execution-receipts'
export const HERMES_WORKSPACE_PATH = '/Users/shaungillen/hermes-workspace'
export const REPORT_FOLDER_INVENTORY_PATH =
  '/Users/shaungillen/BaseOS/OPS/REPORTS/2026-06-28__hermes_local_execution_lane_v0_1'

const LOCAL_EXECUTION_TIMEOUT_MS = 30_000
const MAX_CAPTURE_CHARS = 40_000

type ApprovedLocalActionId =
  | 'local_execution_smoke_test'
  | 'local_report_folder_inventory'

type ApprovedLocalAction = {
  id: ApprovedLocalActionId
  label: string
  description: string
  mode: 'smoke-test' | 'read-only-inventory'
}

type LocalExecutionOptions = {
  receiptRoot?: string
  workspacePath?: string
  inventoryRoot?: string
  now?: () => Date
}

type LocalExecutionSuccess = {
  ok: true
  runId: string
  actionId: ApprovedLocalActionId
  label: string
  operatorLabel: string
  startedAt: string
  completedAt: string
  exitCode: number | null
  stdout: string
  stderr: string
  receiptPath: string
}

type LocalExecutionFailure = {
  ok: false
  status: 400
  error: string
}

export type LocalExecutionResult = LocalExecutionSuccess | LocalExecutionFailure

const ALLOWED_REQUEST_KEYS = new Set(['actionId', 'operatorLabel'])

const APPROVED_LOCAL_ACTIONS: Record<ApprovedLocalActionId, ApprovedLocalAction> = {
  local_execution_smoke_test: {
    id: 'local_execution_smoke_test',
    label: 'Local Execution Smoke Test',
    description:
      'Dry-run local job that prints timestamp, working directory, and Hermes workspace path.',
    mode: 'smoke-test',
  },
  local_report_folder_inventory: {
    id: 'local_report_folder_inventory',
    label: 'Local Report Folder Inventory',
    description:
      'Read-only inventory of a fixed backend-owned Hermes local execution report folder.',
    mode: 'read-only-inventory',
  },
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function sanitizeFilePart(value: string): string {
  return value
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96)
}

function sanitizeOperatorLabel(value: unknown): string {
  const text = readString(value)
  if (!text) return 'local-operator'
  return text.replace(/[\r\n]+/g, ' ').slice(0, 120)
}

function timestampForFile(date: Date): string {
  return date.toISOString().replace(/[:.]/g, '-')
}

function appendCaptured(existing: string, chunk: Buffer | string): string {
  const next = existing + chunk.toString()
  if (next.length <= MAX_CAPTURE_CHARS) return next
  return next.slice(0, MAX_CAPTURE_CHARS) + '\n[output truncated]\n'
}

function smokeScript(): string {
  return [
    "const workspacePath = process.env.HERMES_WORKSPACE_PATH || '';",
    "console.log('action_id=local_execution_smoke_test');",
    'console.log(`timestamp=${new Date().toISOString()}`);',
    'console.log(`cwd=${process.cwd()}`);',
    'console.log(`hermes_workspace_path=${workspacePath}`);',
    'process.exit(0);',
  ].join('\n')
}

function reportFolderInventoryScript(): string {
  return String.raw`
const fs = require('node:fs');
const path = require('node:path');

const root = process.env.REPORT_FOLDER_INVENTORY_PATH || '';
const maxDepth = 2;

function isDirectory(value) {
  try {
    return Boolean(value) && fs.existsSync(value) && fs.statSync(value).isDirectory();
  } catch {
    return false;
  }
}

function walkBounded(dir, depth, state) {
  if (depth > maxDepth) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      state.totalDirectories += 1;
      if (depth < maxDepth) walkBounded(fullPath, depth + 1, state);
    } else if (entry.isFile()) {
      state.totalFiles += 1;
    }
  }
}

try {
  const timestamp = new Date().toISOString();
  const exists = isDirectory(root);
  const state = {
    totalFiles: 0,
    totalDirectories: 0,
    topLevelEntries: [],
    executionReceiptCount: 0,
    latestExecutionReceiptPath: '',
  };

  if (exists) {
    state.topLevelEntries = fs
      .readdirSync(root, { withFileTypes: true })
      .map((entry) => entry.name)
      .sort((a, b) => a.localeCompare(b));
    walkBounded(root, 1, state);

    const receiptDir = path.join(root, 'execution-receipts');
    if (isDirectory(receiptDir)) {
      const receiptFiles = fs
        .readdirSync(receiptDir, { withFileTypes: true })
        .filter((entry) => entry.isFile())
        .map((entry) => entry.name)
        .sort((a, b) => a.localeCompare(b));
      state.executionReceiptCount = receiptFiles.length;
      if (receiptFiles.length > 0) {
        state.latestExecutionReceiptPath = path.join(
          receiptDir,
          receiptFiles[receiptFiles.length - 1],
        );
      }
    }
  }

  console.log('action_id=local_report_folder_inventory');
  console.log('timestamp=' + timestamp);
  console.log('folder_path=' + root);
  console.log('folder_exists=' + (exists ? 'yes' : 'no'));
  console.log('bounded_depth=' + maxDepth);
  console.log('total_files=' + state.totalFiles);
  console.log('total_directories=' + state.totalDirectories);
  console.log('top_level_entries=' + state.topLevelEntries.join(','));
  console.log('execution_receipt_count=' + state.executionReceiptCount);
  console.log('latest_execution_receipt_path=' + state.latestExecutionReceiptPath);
  process.exit(0);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
`
}

function scriptForAction(actionId: ApprovedLocalActionId): string {
  if (actionId === 'local_report_folder_inventory') {
    return reportFolderInventoryScript()
  }
  return smokeScript()
}

function buildReceipt(result: Omit<LocalExecutionSuccess, 'receiptPath'>): string {
  return [
    '# Local Execution Receipt',
    '',
    `Run ID: ${result.runId}`,
    `Action ID: ${result.actionId}`,
    `Action Label: ${result.label}`,
    `Operator: ${result.operatorLabel}`,
    `Started At: ${result.startedAt}`,
    `Completed At: ${result.completedAt}`,
    `Exit Code: ${result.exitCode ?? 'null'}`,
    `Execution Mode: allowlisted-local-${APPROVED_LOCAL_ACTIONS[result.actionId].mode}`,
    'Arbitrary Command Accepted: no',
    '',
    '## Stdout',
    '',
    '```text',
    result.stdout.trimEnd(),
    '```',
    '',
    '## Stderr',
    '',
    '```text',
    result.stderr.trimEnd(),
    '```',
    '',
  ].join('\n')
}

function validatePayload(payload: Record<string, unknown>): LocalExecutionFailure | null {
  for (const key of Object.keys(payload)) {
    if (!ALLOWED_REQUEST_KEYS.has(key)) {
      return {
        ok: false,
        status: 400,
        error: `Unsupported request field: ${key}`,
      }
    }
  }

  const actionId = readString(payload.actionId)
  if (!Object.prototype.hasOwnProperty.call(APPROVED_LOCAL_ACTIONS, actionId)) {
    return { ok: false, status: 400, error: 'Action is not allowlisted' }
  }

  return null
}

export function listApprovedLocalActions(): Array<ApprovedLocalAction> {
  return Object.values(APPROVED_LOCAL_ACTIONS).map((action) => ({ ...action }))
}

export async function executeApprovedLocalAction(
  payload: Record<string, unknown>,
  options: LocalExecutionOptions = {},
): Promise<LocalExecutionResult> {
  const validation = validatePayload(payload)
  if (validation) return validation

  const actionId = readString(payload.actionId) as ApprovedLocalActionId
  const action = APPROVED_LOCAL_ACTIONS[actionId]
  const runId = randomUUID()
  const now = options.now ?? (() => new Date())
  const startedAtDate = now()
  const startedAt = startedAtDate.toISOString()
  const operatorLabel = sanitizeOperatorLabel(payload.operatorLabel)
  const workspacePath = options.workspacePath ?? HERMES_WORKSPACE_PATH
  const receiptRoot = options.receiptRoot ?? LOCAL_EXECUTION_REPORT_ROOT
  const inventoryRoot = options.inventoryRoot ?? REPORT_FOLDER_INVENTORY_PATH

  let stdout = ''
  let stderr = ''
  let exitCode: number | null = null

  await new Promise<void>((resolve) => {
    const child = spawn(process.execPath, ['-e', scriptForAction(actionId)], {
      cwd: workspacePath,
      env: {
        HERMES_WORKSPACE_PATH: workspacePath,
        REPORT_FOLDER_INVENTORY_PATH: inventoryRoot,
      },
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    const timeout = setTimeout(() => {
      stderr = appendCaptured(stderr, 'Local execution timed out; process was terminated.\n')
      child.kill('SIGTERM')
    }, LOCAL_EXECUTION_TIMEOUT_MS)

    child.stdout.on('data', (chunk) => {
      stdout = appendCaptured(stdout, chunk)
    })
    child.stderr.on('data', (chunk) => {
      stderr = appendCaptured(stderr, chunk)
    })
    child.on('error', (error) => {
      stderr = appendCaptured(stderr, `${error.message}\n`)
      exitCode = 1
    })
    child.on('close', (code) => {
      clearTimeout(timeout)
      exitCode = exitCode ?? code
      resolve()
    })
  })

  const completedAt = now().toISOString()
  const withoutReceiptPath: Omit<LocalExecutionSuccess, 'receiptPath'> = {
    ok: true,
    runId,
    actionId,
    label: action.label,
    operatorLabel,
    startedAt,
    completedAt,
    exitCode,
    stdout,
    stderr,
  }

  await mkdir(receiptRoot, { recursive: true })
  const receiptPath = join(
    receiptRoot,
    `${timestampForFile(startedAtDate)}__${sanitizeFilePart(actionId)}__${runId}.md`,
  )
  await writeFile(receiptPath, buildReceipt(withoutReceiptPath), 'utf8')

  return { ...withoutReceiptPath, receiptPath }
}
