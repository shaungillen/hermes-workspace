import {
  existsSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
  mkdirSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import {
  executeApprovedLocalAction,
  listApprovedLocalActions,
} from './local-execution-lane'

let tempRoot = ''
let tempWorkspace = ''
let tempInventoryRoot = ''

beforeEach(() => {
  tempRoot = mkdtempSync(join(tmpdir(), 'hermes-local-execution-receipts-'))
  tempWorkspace = mkdtempSync(join(tmpdir(), 'hermes-local-execution-workspace-'))
  tempInventoryRoot = mkdtempSync(join(tmpdir(), 'hermes-local-execution-inventory-'))
})

afterEach(() => {
  rmSync(tempRoot, { recursive: true, force: true })
  rmSync(tempWorkspace, { recursive: true, force: true })
  rmSync(tempInventoryRoot, { recursive: true, force: true })
})

describe('local execution lane', () => {
  it('lists only safe metadata for allowlisted local actions', () => {
    expect(listApprovedLocalActions()).toEqual([
      expect.objectContaining({
        id: 'local_execution_smoke_test',
        label: 'Local Execution Smoke Test',
      }),
      expect.objectContaining({
        id: 'local_report_folder_inventory',
        label: 'Local Report Folder Inventory',
      }),
    ])
    expect(JSON.stringify(listApprovedLocalActions())).not.toContain('command')
    expect(JSON.stringify(listApprovedLocalActions())).not.toContain('/Users/')
  })

  it('runs the allowlisted smoke action and writes stdout stderr exit code receipt', async () => {
    const result = await executeApprovedLocalAction(
      {
        actionId: 'local_execution_smoke_test',
        operatorLabel: 'FieldWorks operator',
      },
      {
        receiptRoot: tempRoot,
        workspacePath: tempWorkspace,
        now: () => new Date('2026-06-28T22:30:00.000Z'),
      },
    )

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.actionId).toBe('local_execution_smoke_test')
    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('action_id=local_execution_smoke_test')
    expect(result.stdout).toContain(`cwd=${realpathSync(tempWorkspace)}`)
    expect(result.stdout).toContain(`hermes_workspace_path=${tempWorkspace}`)
    expect(result.stderr).toBe('')
    expect(result.receiptPath.startsWith(tempRoot)).toBe(true)
    expect(existsSync(result.receiptPath)).toBe(true)

    const receipt = readFileSync(result.receiptPath, 'utf8')
    expect(receipt).toContain('Action ID: local_execution_smoke_test')
    expect(receipt).toContain('Operator: FieldWorks operator')
    expect(receipt).toContain('Exit Code: 0')
    expect(receipt).toContain('action_id=local_execution_smoke_test')
  })

  it('rejects unknown actions and raw command fields without writing a receipt', async () => {
    const unknown = await executeApprovedLocalAction(
      { actionId: 'rm_everything' },
      { receiptRoot: tempRoot, workspacePath: tempWorkspace },
    )
    expect(unknown).toEqual({
      ok: false,
      status: 400,
      error: 'Action is not allowlisted',
    })

    const rawCommand = await executeApprovedLocalAction(
      {
        actionId: 'local_execution_smoke_test',
        command: 'pwd',
      },
      { receiptRoot: tempRoot, workspacePath: tempWorkspace },
    )
    expect(rawCommand).toEqual({
      ok: false,
      status: 400,
      error: 'Unsupported request field: command',
    })

    const frontendPath = await executeApprovedLocalAction(
      {
        actionId: 'local_report_folder_inventory',
        path: '/tmp',
      },
      { receiptRoot: tempRoot, workspacePath: tempWorkspace },
    )
    expect(frontendPath).toEqual({
      ok: false,
      status: 400,
      error: 'Unsupported request field: path',
    })
  })

  it('inventories the fixed backend-owned report folder and writes a receipt', async () => {
    mkdirSync(join(tempInventoryRoot, 'execution-receipts'), { recursive: true })
    mkdirSync(join(tempInventoryRoot, 'nested'), { recursive: true })
    writeFileSync(join(tempInventoryRoot, 'top-level.md'), '# top\n', 'utf8')
    writeFileSync(join(tempInventoryRoot, 'nested', 'child.txt'), 'child\n', 'utf8')
    writeFileSync(
      join(tempInventoryRoot, 'execution-receipts', '2026-06-29T00-01-00Z__old.md'),
      'old\n',
      'utf8',
    )
    writeFileSync(
      join(tempInventoryRoot, 'execution-receipts', '2026-06-29T00-02-00Z__new.md'),
      'new\n',
      'utf8',
    )

    const result = await executeApprovedLocalAction(
      {
        actionId: 'local_report_folder_inventory',
        operatorLabel: 'FieldWorks operator',
      },
      {
        receiptRoot: tempRoot,
        workspacePath: tempWorkspace,
        inventoryRoot: tempInventoryRoot,
        now: () => new Date('2026-06-29T01:30:00.000Z'),
      },
    )

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.actionId).toBe('local_report_folder_inventory')
    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('action_id=local_report_folder_inventory')
    expect(result.stdout).toContain(`folder_path=${tempInventoryRoot}`)
    expect(result.stdout).toContain('folder_exists=yes')
    expect(result.stdout).toContain('total_files=4')
    expect(result.stdout).toContain('total_directories=2')
    expect(result.stdout).toContain('top_level_entries=execution-receipts,nested,top-level.md')
    expect(result.stdout).toContain('execution_receipt_count=2')
    expect(result.stdout).toContain(
      `latest_execution_receipt_path=${join(
        tempInventoryRoot,
        'execution-receipts',
        '2026-06-29T00-02-00Z__new.md',
      )}`,
    )
    expect(result.stderr).toBe('')
    expect(existsSync(result.receiptPath)).toBe(true)

    const receipt = readFileSync(result.receiptPath, 'utf8')
    expect(receipt).toContain('Action ID: local_report_folder_inventory')
    expect(receipt).toContain('Operator: FieldWorks operator')
    expect(receipt).toContain('Exit Code: 0')
    expect(receipt).toContain('folder_exists=yes')
  })
})
