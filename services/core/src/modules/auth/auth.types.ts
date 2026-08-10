import type { Workspace } from '../workspaces/workspace.types.js'

export type MojalyUserStatus = 'ACTIVE' | 'DISABLED'
export type WorkspaceMemberRole = 'OWNER' | 'ADMIN' | 'MEMBER'
export type WorkspaceMembershipStatus = 'ACTIVE' | 'DISABLED'

export type KratosSessionIdentity = {
  id: string
  traits?: {
    email?: string
    name?: string
  }
}

export type KratosSession = {
  id: string
  active?: boolean
  identity: KratosSessionIdentity
}

export type MojalyUser = {
  id: string
  kratosIdentityId: string
  email: string
  status: MojalyUserStatus
  createdAt: string
  updatedAt: string
  name?: string
}

export type WorkspaceMembership = {
  id: string
  workspaceId: string
  userId: string
  role: WorkspaceMemberRole
  status: WorkspaceMembershipStatus
  createdAt: string
  updatedAt: string
  workspace?: Workspace
}

export type AuthenticatedUserContext = {
  user: MojalyUser
  kratosSession: KratosSession
  memberships: WorkspaceMembership[]
}