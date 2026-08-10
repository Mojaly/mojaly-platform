import { query } from '../../db/postgres.js'
import type { MojalyUser, WorkspaceMembership } from './auth.types.js'

 type UserRow = {
  id: string
  kratos_identity_id: string
  email: string
  name: string | null
  status: MojalyUser['status']
  created_at: Date | string
  updated_at: Date | string
}

type MembershipRow = {
  id: string
  workspace_id: string
  user_id: string
  role: WorkspaceMembership['role']
  status: WorkspaceMembership['status']
  created_at: Date | string
  updated_at: Date | string
  business_name: string | null
  trading_name: string | null
  business_type: string | null
  country: string | null
  owner_email: string | null
  workspace_status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED' | null
  kyb_status: 'NOT_SUBMITTED' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | null
  approved_at: Date | string | null
  rejected_at: Date | string | null
  suspended_at: Date | string | null
  rejection_reason: string | null
  workspace_created_at: Date | string | null
  workspace_updated_at: Date | string | null
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

function mapUser(row: UserRow): MojalyUser {
  const user: MojalyUser = {
    id: row.id,
    kratosIdentityId: row.kratos_identity_id,
    email: row.email,
    status: row.status,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at)
  }

  if (row.name) {
    user.name = row.name
  }

  return user
}

function mapMembership(row: MembershipRow): WorkspaceMembership {
  const membership: WorkspaceMembership = {
    id: row.id,
    workspaceId: row.workspace_id,
    userId: row.user_id,
    role: row.role,
    status: row.status,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at)
  }

  if (
    row.business_name &&
    row.business_type &&
    row.country &&
    row.owner_email &&
    row.workspace_status &&
    row.kyb_status &&
    row.workspace_created_at &&
    row.workspace_updated_at
  ) {
    membership.workspace = {
      id: row.workspace_id,
      businessName: row.business_name,
      businessType: row.business_type,
      country: row.country,
      ownerEmail: row.owner_email,
      status: row.workspace_status,
      kybStatus: row.kyb_status,
      createdAt: toIso(row.workspace_created_at),
      updatedAt: toIso(row.workspace_updated_at)
    }

    if (row.trading_name) {
      membership.workspace.tradingName = row.trading_name
    }

    const approvedAt = optionalIso(row.approved_at)
    if (approvedAt) {
      membership.workspace.approvedAt = approvedAt
    }

    const rejectedAt = optionalIso(row.rejected_at)
    if (rejectedAt) {
      membership.workspace.rejectedAt = rejectedAt
    }

    const suspendedAt = optionalIso(row.suspended_at)
    if (suspendedAt) {
      membership.workspace.suspendedAt = suspendedAt
    }

    if (row.rejection_reason) {
      membership.workspace.rejectionReason = row.rejection_reason
    }
  }

  return membership
}

export async function upsertUser(input: {
  kratosIdentityId: string
  email: string
  name?: string
}): Promise<MojalyUser> {
  const result = await query<UserRow>(
    `
      INSERT INTO users (kratos_identity_id, email, name)
      VALUES ($1, $2, $3)
      ON CONFLICT (kratos_identity_id) DO UPDATE SET
        email = EXCLUDED.email,
        name = EXCLUDED.name,
        updated_at = now()
      RETURNING *
    `,
    [input.kratosIdentityId, input.email, input.name ?? null]
  )

  return mapUser(result.rows[0]!)
}

export async function ensureOwnerMembershipsForEmail(input: {
  userId: string
  email: string
}): Promise<void> {
  await query(
    `
      INSERT INTO workspace_memberships (workspace_id, user_id, role)
      SELECT w.id, $1, 'OWNER'
      FROM workspaces w
      WHERE lower(w.owner_email) = lower($2)
      ON CONFLICT (workspace_id, user_id) DO UPDATE SET
        role = CASE
          WHEN workspace_memberships.role = 'OWNER' THEN workspace_memberships.role
          ELSE EXCLUDED.role
        END,
        status = 'ACTIVE',
        updated_at = now()
    `,
    [input.userId, input.email]
  )
}

export async function saveWorkspaceMembership(input: {
  workspaceId: string
  userId: string
  role: WorkspaceMembership['role']
}): Promise<WorkspaceMembership> {
  const result = await query<MembershipRow>(
    `
      INSERT INTO workspace_memberships (workspace_id, user_id, role)
      VALUES ($1, $2, $3)
      ON CONFLICT (workspace_id, user_id) DO UPDATE SET
        role = EXCLUDED.role,
        status = 'ACTIVE',
        updated_at = now()
      RETURNING
        workspace_memberships.*,
        NULL::text AS business_name,
        NULL::text AS trading_name,
        NULL::text AS business_type,
        NULL::char(2) AS country,
        NULL::text AS owner_email,
        NULL::text AS workspace_status,
        NULL::text AS kyb_status,
        NULL::timestamptz AS approved_at,
        NULL::timestamptz AS rejected_at,
        NULL::timestamptz AS suspended_at,
        NULL::text AS rejection_reason,
        NULL::timestamptz AS workspace_created_at,
        NULL::timestamptz AS workspace_updated_at
    `,
    [input.workspaceId, input.userId, input.role]
  )

  return mapMembership(result.rows[0]!)
}

export async function listUserMemberships(
  userId: string
): Promise<WorkspaceMembership[]> {
  const result = await query<MembershipRow>(
    `
      SELECT
        wm.*,
        w.business_name,
        w.trading_name,
        w.business_type,
        w.country,
        w.owner_email,
        w.status AS workspace_status,
        w.kyb_status,
        w.approved_at,
        w.rejected_at,
        w.suspended_at,
        w.rejection_reason,
        w.created_at AS workspace_created_at,
        w.updated_at AS workspace_updated_at
      FROM workspace_memberships wm
      LEFT JOIN workspaces w ON w.id = wm.workspace_id
      WHERE wm.user_id = $1
      ORDER BY wm.created_at DESC
    `,
    [userId]
  )

  return result.rows.map(mapMembership)
}