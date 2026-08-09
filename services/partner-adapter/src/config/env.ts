import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),

  PORT: z.coerce.number().int().positive().default(5070),

  DATABASE_URL: z
    .string()
    .default('postgres://mojaly:mojaly_change_me@localhost:5433/mojaly'),

  MOJALY_CORE_URL: z
    .url()
    .default('http://localhost:5050'),

  PARTNER_ADAPTER_INTERNAL_API_KEY: z
    .string()
    .default('dev_partner_adapter_internal_key'),

  KCB_BASE_URL: z
    .url()
    .default('https://uat.buni.kcbgroup.com/fundstransfer/1.0.0'),

  KCB_AUTH_URL: z
    .url()
    .default('https://accounts.buni.kcbgroup.com/oauth2'),

  KCB_CONSUMER_KEY: z.string().optional(),
  KCB_CONSUMER_SECRET: z.string().optional(),
  KCB_COMPANY_CODE: z.string().optional(),
  KCB_DEBIT_ACCOUNT_NUMBER: z.string().optional(),
  KCB_TRANSACTION_TYPE: z.string().optional(),
  KCB_CURRENCY: z.string().default('KES'),
  KCB_CALLBACK_URL: z.string().url().optional(),

  // griffin
  GRIFFIN_BASE_URL: z.string().url().default('https://api.griffin.com'),
  GRIFFIN_API_KEY: z.string().optional(),
  GRIFFIN_LEGAL_PERSON_ID: z.string().optional(),
  GRIFFIN_BANK_ACCOUNT_ID: z.string().optional(),
  GRIFFIN_PAYMENT_SCHEME: z.enum(['fps', 'book-transfer']).default('fps'),
  GRIFFIN_VERIFY_WEBHOOK_SIGNATURES: z
    .enum(['true', 'false'])
    .default('true')
    .transform((value) => value === 'true'),

  MTN_BASE_URL: z.string().url().default('https://sandbox.momodeveloper.mtn.com'),
  MTN_SUBSCRIPTION_KEY: z.string().optional(),
  MTN_API_USER: z.string().optional(),
  MTN_API_KEY: z.string().optional(),
  MTN_TARGET_ENVIRONMENT: z.string().default('sandbox'),
  MTN_CALLBACK_URL: z.string().url().optional(),
  MTN_TRANSFER_TYPE: z.string().optional(),

  SAFARICOM_BASE_URL: z
    .string()
    .url()
    .default('https://sandbox.safaricom.co.ke'),
  SAFARICOM_CONSUMER_KEY: z.string().optional(),
  SAFARICOM_CONSUMER_SECRET: z.string().optional(),
  SAFARICOM_INITIATOR_NAME: z.string().optional(),
  SAFARICOM_SECURITY_CREDENTIAL: z.string().optional(),
  SAFARICOM_SHORTCODE: z.string().optional(),
  SAFARICOM_B2C_COMMAND_ID: z
    .enum(['SalaryPayment', 'BusinessPayment', 'PromotionPayment'])
    .default('BusinessPayment'),
  SAFARICOM_RESULT_URL: z.string().url().optional(),
  SAFARICOM_TIMEOUT_URL: z.string().url().optional()
})

export type Env = z.infer<typeof envSchema>

export const env: Env = envSchema.parse(process.env)

