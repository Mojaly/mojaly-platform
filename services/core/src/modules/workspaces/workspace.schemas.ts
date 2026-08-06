import { z } from 'zod'

export const createWorkspaceSchema = z.object({
  businessName: z.string().min(2),
  tradingName: z.string().min(2).optional(),
  businessType: z.string().min(2),
  country: z.string().length(2),
  ownerEmail: z.string().email()
})

export const workspaceIdParamsSchema = z.object({
  id: z.string().min(1)
})

export const submitKybSchema = z.object({
  registrationNumber: z.string().min(2),
  taxId: z.string().min(2).optional(),
  registeredAddress: z.string().min(5),
  operatingCountries: z.array(z.string().length(2)).min(1),
  website: z.string().url().optional(),
  contactName: z.string().min(2),
  contactEmail: z.string().email()
})

export const rejectWorkspaceSchema = z.object({
  reason: z.string().min(3)
})
