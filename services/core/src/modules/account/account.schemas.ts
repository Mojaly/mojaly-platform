import { z } from 'zod'

const createAccountBaseSchema = z.object({
  name: z.string().min(1).max(120),
  partnerCode: z.string().min(1).max(40),
  externalPartnerAccountId: z.string().min(1),
  rafikiAssetId: z.string().min(1).optional(),
  assetCode: z.string().min(3).max(12),
  assetScale: z.coerce.number().int().min(0).max(18)
})

const createWorkspaceAccountBaseSchema = z.object({
  name: z.string().min(1).max(120),
  partnerCode: z.string().min(1).max(40),
  externalPartnerAccountId: z.string().min(1),
  assetCode: z.string().min(3).max(12)
})

export const createAccountSchema = createAccountBaseSchema
  .extend({
    workspaceId: z.string().min(1).optional(),
    fintechId: z.string().min(1).optional()
  })
  .refine((value) => value.workspaceId || value.fintechId, {
    message: 'workspaceId is required',
    path: ['workspaceId']
  })

export const createWorkspaceAccountSchema = createWorkspaceAccountBaseSchema

export const accountIdParamsSchema = z.object({
  id: z.string().min(1)
})

export const fintechAccountsParamsSchema = z.object({
  fintechId: z.string().min(1)
})

export const workspaceAccountsParamsSchema = z.object({
  workspaceId: z.string().min(1)
})
