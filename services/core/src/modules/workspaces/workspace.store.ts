import { query } from '../../db/postgres.js'
import type { Workspace, WorkspaceKybSubmission } from './workspace.types.js'

type WorkspaceRow = {
  id: string
  business_name: string
  trading_name: string | null
  business_type: string
  country: string
  owner_email: string
  status: Workspace['status']
  kyb_status: Workspace['kybStatus']
  approved_at: Date | string | null
  rejected_at: Date | string | null
  suspended_at: Date | string | null
  rejection_reason: string | null
  created_at: Date | string
  updated_at: Date | string
}

type KybSubmissionRow = {
  workspace_id: string
  registration_number: string
  tax_id: string | null
  registered_address: string
  operating_countries: string[]
  website: string | null
  contact_name: string
  contact_email: string
  submitted_at: Date | string
}

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value
}

function optionalIso(value: Date | string | null): string | undefined {
  if (!value) {
    return undefined
  }

  return toIso(value)
}

function mapWorkspace(row: WorkspaceRow): Workspace {
  const workspace: Workspace = {
    id: row.id,
    businessName: row.business_name,
    businessType: row.business_type,
    country: row.country,
    ownerEmail: row.owner_email,
    status: row.status,
    kybStatus: row.kyb_status,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at)
  }

  if (row.trading_name) {
    workspace.tradingName = row.trading_name
  }

  const approvedAt = optionalIso(row.approved_at)
  if (approvedAt) {
    workspace.approvedAt = approvedAt
  }

  const rejectedAt = optionalIso(row.rejected_at)
  if (rejectedAt) {
    workspace.rejectedAt = rejectedAt
  }

  const suspendedAt = optionalIso(row.suspended_at)
  if (suspendedAt) {
    workspace.suspendedAt = suspendedAt
  }

  if (row.rejection_reason) {
    workspace.rejectionReason = row.rejection_reason
  }

  return workspace
}

function mapKybSubmission(row: KybSubmissionRow): WorkspaceKybSubmission {
  const submission: WorkspaceKybSubmission = {
    workspaceId: row.workspace_id,
    registrationNumber: row.registration_number,
    registeredAddress: row.registered_address,
    operatingCountries: row.operating_countries,
    contactName: row.contact_name,
    contactEmail: row.contact_email,
    submittedAt: toIso(row.submitted_at)
  }

  if (row.tax_id) {
    submission.taxId = row.tax_id
  }

  if (row.website) {
    submission.website = row.website
  }

  return submission
}

export async function saveWorkspace(workspace: Workspace): Promise<Workspace> {
  const result = await query<WorkspaceRow>(
    `
      INSERT INTO workspaces (
        id,
        business_name,
        trading_name,
        business_type,
        country,
        owner_email,
        status,
        kyb_status,
        approved_at,
        rejected_at,
        suspended_at,
        rejection_reason,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      ON CONFLICT (id) DO UPDATE SET
        business_name = EXCLUDED.business_name,
        trading_name = EXCLUDED.trading_name,
        business_type = EXCLUDED.business_type,
        country = EXCLUDED.country,
        owner_email = EXCLUDED.owner_email,
        status = EXCLUDED.status,
        kyb_status = EXCLUDED.kyb_status,
        approved_at = EXCLUDED.approved_at,
        rejected_at = EXCLUDED.rejected_at,
        suspended_at = EXCLUDED.suspended_at,
        rejection_reason = EXCLUDED.rejection_reason,
        updated_at = EXCLUDED.updated_at
      RETURNING *
    `,
    [
      workspace.id,
      workspace.businessName,
      workspace.tradingName ?? null,
      workspace.businessType,
      workspace.country,
      workspace.ownerEmail,
      workspace.status,
      workspace.kybStatus,
      workspace.approvedAt ?? null,
      workspace.rejectedAt ?? null,
      workspace.suspendedAt ?? null,
      workspace.rejectionReason ?? null,
      workspace.createdAt,
      workspace.updatedAt
    ]
  )

  return mapWorkspace(result.rows[0]!)
}

export async function getWorkspaceById(
  id: string
): Promise<Workspace | undefined> {
  const result = await query<WorkspaceRow>(
    'SELECT * FROM workspaces WHERE id = $1',
    [id]
  )

  const row = result.rows[0]
  return row ? mapWorkspace(row) : undefined
}

export async function listWorkspaces(): Promise<Workspace[]> {
  const result = await query<WorkspaceRow>(
    'SELECT * FROM workspaces ORDER BY created_at DESC'
  )

  return result.rows.map(mapWorkspace)
}

export async function saveKybSubmission(
  submission: WorkspaceKybSubmission
): Promise<WorkspaceKybSubmission> {
  const result = await query<KybSubmissionRow>(
    `
      INSERT INTO workspace_kyb_submissions (
        workspace_id,
        registration_number,
        tax_id,
        registered_address,
        operating_countries,
        website,
        contact_name,
        contact_email,
        submitted_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now())
      ON CONFLICT (workspace_id) DO UPDATE SET
        registration_number = EXCLUDED.registration_number,
        tax_id = EXCLUDED.tax_id,
        registered_address = EXCLUDED.registered_address,
        operating_countries = EXCLUDED.operating_countries,
        website = EXCLUDED.website,
        contact_name = EXCLUDED.contact_name,
        contact_email = EXCLUDED.contact_email,
        submitted_at = EXCLUDED.submitted_at,
        updated_at = now()
      RETURNING *
    `,
    [
      submission.workspaceId,
      submission.registrationNumber,
      submission.taxId ?? null,
      submission.registeredAddress,
      submission.operatingCountries,
      submission.website ?? null,
      submission.contactName,
      submission.contactEmail,
      submission.submittedAt
    ]
  )

  return mapKybSubmission(result.rows[0]!)
}

export async function getKybSubmission(
  workspaceId: string
): Promise<WorkspaceKybSubmission | undefined> {
  const result = await query<KybSubmissionRow>(
    'SELECT * FROM workspace_kyb_submissions WHERE workspace_id = $1',
    [workspaceId]
  )

  const row = result.rows[0]
  return row ? mapKybSubmission(row) : undefined
}
