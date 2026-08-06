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

export async function createWorkspace(
  input: CreateWorkspaceInput
): Promise<Workspace> {
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

export async function getWorkspace(id: string): Promise<Workspace | undefined> {
  return getWorkspaceById(id)
}

export async function getWorkspaces(): Promise<Workspace[]> {
  return listWorkspaces()
}

export async function submitWorkspaceKyb(
  workspaceId: string,
  input: SubmitKybInput
): Promise<{ workspace: Workspace; kyb: WorkspaceKybSubmission }> {
  const workspace = await requireWorkspace(workspaceId)

  if (workspace.status === 'REJECTED') {
    throw new Error('WORKSPACE_REJECTED')
  }

  if (workspace.status === 'SUSPENDED') {
    throw new Error('WORKSPACE_SUSPENDED')
  }

  const now = new Date().toISOString()
  const kybInput: WorkspaceKybSubmission = {
    workspaceId,
    submittedAt: now,
    registrationNumber: input.registrationNumber,
    registeredAddress: input.registeredAddress,
    operatingCountries: input.operatingCountries.map((country) =>
      country.toUpperCase()
    ),
    contactName: input.contactName,
    contactEmail: input.contactEmail
  }

  if (input.taxId) {
    kybInput.taxId = input.taxId
  }

  if (input.website) {
    kybInput.website = input.website
  }

  const kyb = await saveKybSubmission(kybInput)

  const updated = await saveWorkspace({
    ...workspace,
    kybStatus: 'SUBMITTED',
    updatedAt: now
  })

  return { workspace: updated, kyb }
}

export async function getWorkspaceKyb(
  workspaceId: string
): Promise<WorkspaceKybSubmission | undefined> {
  await requireWorkspace(workspaceId)
  return getKybSubmission(workspaceId)
}

export async function approveWorkspace(workspaceId: string): Promise<Workspace> {
  const workspace = await requireWorkspace(workspaceId)

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

export async function rejectWorkspace(
  workspaceId: string,
  reason: string
): Promise<Workspace> {
  const workspace = await requireWorkspace(workspaceId)
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

export async function suspendWorkspace(
  workspaceId: string
): Promise<Workspace> {
  const workspace = await requireWorkspace(workspaceId)
  const now = new Date().toISOString()

  return saveWorkspace({
    ...workspace,
    status: 'SUSPENDED',
    suspendedAt: now,
    updatedAt: now
  })
}

async function requireWorkspace(workspaceId: string): Promise<Workspace> {
  const workspace = await getWorkspaceById(workspaceId)

  if (!workspace) {
    throw new Error('WORKSPACE_NOT_FOUND')
  }

  return workspace
}
