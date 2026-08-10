import type { FastifyRequest } from 'fastify'
import { createWorkspace } from '../workspaces/workspace.service.js'
import type { CreateWorkspaceInput } from '../workspaces/workspace.types.js'
import { getKratosSession, KratosAuthError } from './kratos.client.js'
import {
  ensureOwnerMembershipsForEmail,
  listUserMemberships,
  saveWorkspaceMembership,
  upsertUser
} from './auth.store.js'
import type { AuthenticatedUserContext } from './auth.types.js'

function readSessionToken(request: FastifyRequest): string | undefined {
  const directToken = request.headers['x-session-token']

  if (typeof directToken === 'string' && directToken.trim()) {
    return directToken.trim()
  }

  const authorization = request.headers.authorization
  if (!authorization) {
    return undefined
  }

  const [scheme, token] = authorization.split(' ')
  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return undefined
  }

  return token.trim()
}

export async function getAuthenticatedUser(
  request: FastifyRequest
): Promise<AuthenticatedUserContext> {
  const sessionInput: { cookie?: string; sessionToken?: string } = {}
  const sessionToken = readSessionToken(request)

  if (request.headers.cookie) {
    sessionInput.cookie = request.headers.cookie
  }

  if (sessionToken) {
    sessionInput.sessionToken = sessionToken
  }

  const kratosSession = await getKratosSession(sessionInput)

  const email = kratosSession.identity.traits?.email
  if (!email) {
    throw new KratosAuthError('Kratos identity has no email trait')
  }

  const userInput: {
    kratosIdentityId: string
    email: string
    name?: string
  } = {
    kratosIdentityId: kratosSession.identity.id,
    email
  }

  const name = kratosSession.identity.traits?.name
  if (name) {
    userInput.name = name
  }

  const user = await upsertUser(userInput)
  await ensureOwnerMembershipsForEmail({ userId: user.id, email: user.email })

  const memberships = await listUserMemberships(user.id)

  return {
    user,
    kratosSession,
    memberships
  }
}

export async function createAuthenticatedWorkspace(
  request: FastifyRequest,
  input: Omit<CreateWorkspaceInput, 'ownerEmail'> & { ownerEmail?: string }
) {
  const context = await getAuthenticatedUser(request)

  const workspaceInput: CreateWorkspaceInput = {
    businessName: input.businessName,
    businessType: input.businessType,
    country: input.country,
    ownerEmail: context.user.email
  }

  if (input.tradingName) {
    workspaceInput.tradingName = input.tradingName
  }

  const workspace = await createWorkspace(workspaceInput)
  await saveWorkspaceMembership({
    workspaceId: workspace.id,
    userId: context.user.id,
    role: 'OWNER'
  })

  return {
    workspace,
    user: context.user
  }
}