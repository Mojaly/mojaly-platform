import { randomUUID } from 'node:crypto'
import {
  getKybSubmission,
  getWorkspaceById,
  listWorkspaces,
  saveKybSubmission,
  saveWorkspace
} from './workspace.store.js'
import type {
  CreateWorkspaceInput,
  SubmitKybInput,
  Workspace,
  WorkspaceKybSubmission
} from './workspace.types.js'

export function createWorkspace(input: CreateWorkspaceInput): Workspace {
  const now = new Date().toISOString()

  const workspace: Workspace = {
    id: randomUUID(),
    businessName: input.businessName,
    businessType: input.businessType,
    country: input.country.toUpperCase(),
    ownerEmail: input.ownerEmail,
    status: 'PENDING',
    kybStatus: 'NOT_SUBMITTED',
    createdAt: now,
    updatedAt: now
  }

  if (input.tradingName) {
    workspace.tradingName = input.tradingName
  }

  return saveWorkspace(workspace)
}

export function getWorkspace(id: string): Workspace | undefined {
  return getWorkspaceById(id)
}

export function getWorkspaces(): Workspace[] {
  return listWorkspaces()
}

export function submitWorkspaceKyb(
  workspaceId: string,
  input: SubmitKybInput
): { workspace: Workspace; kyb: WorkspaceKybSubmission } {
  const workspace = requireWorkspace(workspaceId)

  if (workspace.status === 'REJECTED') {
    throw new Error('WORKSPACE_REJECTED')
  }

  if (workspace.status === 'SUSPENDED') {
    throw new Error('WORKSPACE_SUSPENDED')
  }

  const now = new Date().toISOString()
  const kyb = saveKybSubmission({
    workspaceId,
    submittedAt: now,
    registrationNumber: input.registrationNumber,
    registeredAddress: input.registeredAddress,
    operatingCountries: input.operatingCountries.map((country) =>
      country.toUpperCase()
    ),
    contactName: input.contactName,
    contactEmail: input.contactEmail
  })

  if (input.taxId) {
    kyb.taxId = input.taxId
  }

  if (input.website) {
    kyb.website = input.website
  }

  const updated = saveWorkspace({
    ...workspace,
    kybStatus: 'SUBMITTED',
    updatedAt: now
  })

  return { workspace: updated, kyb }
}

export function getWorkspaceKyb(
  workspaceId: string
): WorkspaceKybSubmission | undefined {
  requireWorkspace(workspaceId)
  return getKybSubmission(workspaceId)
}

export function approveWorkspace(workspaceId: string): Workspace {
  const workspace = requireWorkspace(workspaceId)

  if (workspace.kybStatus !== 'SUBMITTED') {
    throw new Error('KYB_NOT_SUBMITTED')
  }

  const now = new Date().toISOString()

  return saveWorkspace({
    ...workspace,
    status: 'ACTIVE',
    kybStatus: 'APPROVED',
    approvedAt: now,
    updatedAt: now
  })
}

export function rejectWorkspace(workspaceId: string, reason: string): Workspace {
  const workspace = requireWorkspace(workspaceId)
  const now = new Date().toISOString()

  return saveWorkspace({
    ...workspace,
    status: 'REJECTED',
    kybStatus: 'REJECTED',
    rejectionReason: reason,
    rejectedAt: now,
    updatedAt: now
  })
}

export function suspendWorkspace(workspaceId: string): Workspace {
  const workspace = requireWorkspace(workspaceId)
  const now = new Date().toISOString()

  return saveWorkspace({
    ...workspace,
    status: 'SUSPENDED',
    suspendedAt: now,
    updatedAt: now
  })
}

function requireWorkspace(workspaceId: string): Workspace {
  const workspace = getWorkspaceById(workspaceId)

  if (!workspace) {
    throw new Error('WORKSPACE_NOT_FOUND')
  }

  return workspace
}
