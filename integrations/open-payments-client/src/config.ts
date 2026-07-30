import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  CORE_URL: z.url().default('http://localhost:5050'),
  GATEWAY_URL: z.url().default('http://localhost:5060'),

  RAFIKI_ADMIN_GRAPHQL_URL: z.url().default('https://mojaly.local/graphql'),
  RAFIKI_ADMIN_TENANT_ID: z
    .string()
    .default('11111111-1111-4111-8111-111111111111'),
  RAFIKI_ADMIN_API_SECRET: z
    .string()
    .default('mojaly-backend-admin-secret-change-me'),
  RAFIKI_SIGNATURE_VERSION: z.string().default('1'),

  SENDER_WALLET_ADDRESS: z
    .url()
    .default('https://mojaly.local/griffin/sender'),
  SENDER_PUBLIC_NAME: z.string().default('Demo Sender'),
  SENDER_ASSET_CODE: z.string().default('GBP'),
  SENDER_ASSET_SCALE: z.coerce.number().int().min(0).default(2),

  RECEIVER_DESTINATION_TYPE: z
    .enum(['bank_account', 'mobile_money'])
    .default('bank_account'),
  RECEIVER_COUNTRY: z.string().default('GB'),
  RECEIVER_NETWORK: z.string().optional(),
  RECEIVER_ACCOUNT: z.string().default('35890906'),
  RECEIVER_BANK_CODE: z.string().optional().default('000000'),
  RECEIVER_NAME: z.string().default('John Doe'),
  RECEIVER_ASSET_CODE: z.string().default('GBP'),
  RECEIVER_ASSET_SCALE: z.coerce.number().int().min(0).default(2),
  PAYMENT_AMOUNT: z.string().regex(/^\d+$/).default('1000')
})

export const env = envSchema.parse(process.env)
