import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),

  PORT: z.coerce.number().int().positive().default(4005),

  KCB_BASE_URL: z
    .string()
    .url()
    .default('https://uat.buni.kcbgroup.com/fundstransfer/1.0.0'),

  KCB_AUTH_URL: z
    .string()
    .url()
    .default('https://accounts.buni.kcbgroup.com/oauth2'),

  KCB_CONSUMER_KEY: z.string().optional(),
  KCB_CONSUMER_SECRET: z.string().optional(),
  KCB_COMPANY_CODE: z.string().optional(),
  KCB_DEBIT_ACCOUNT_NUMBER: z.string().optional(),
  KCB_TRANSACTION_TYPE: z.string().optional(),
  KCB_CURRENCY: z.string().default('KES'),
  KCB_CALLBACK_URL: z.string().url().optional(),

  // graffin 
  GRIFFIN_BASE_URL: z.string().url().default('https://api.griffin.com'),
  GRIFFIN_API_KEY: z.string().optional(),
  GRIFFIN_LEGAL_PERSON_ID: z.string().optional(),
  GRIFFIN_BANK_ACCOUNT_ID: z.string().optional(),
  GRIFFIN_PAYMENT_SCHEME: z.enum(['fps', 'book-transfer']).default('fps')
})

export type Env = z.infer<typeof envSchema>

export const env: Env = envSchema.parse(process.env)