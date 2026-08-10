import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),

  PORT: z.coerce.number().int().positive().default(5050),

  DATABASE_URL: z
    .url(),
  PARTNER_ADAPTER_URL: z
    .url()
    .default('http://localhost:5070'),

  PARTNER_ADAPTER_INTERNAL_API_KEY: z
    .string()
    .default('dev_partner_adapter_internal_key'),

  MOJALY_WALLET_ADDRESS_BASE_URL: z
    .url()
    .default('https://pay.mojaly.local'),

  RAFIKI_BACKEND_GRAPHQL_URL: z
    .url()
    .default('https://mojaly.local/graphql'),

  RAFIKI_AUTH_GRAPHQL_URL: z
    .url()
    .default('https://auth.mojaly.local/graphql'),

  RAFIKI_ADMIN_API_SECRET: z
    .string()
    .default('secret-key'),

  RAFIKI_OPERATOR_TENANT_ID: z
    .string()
    .default('replace-me'),

  RAFIKI_ADMIN_SIGNATURE_VERSION: z
    .string()
    .default('1'),

  RAFIKI_AUTH_DOMAIN: z
    .url()
    .default('https://auth.mojaly.local'),

  RAFIKI_AUTH_IDENTITY_SERVER_SECRET: z
    .string()
    .default('dev_identity_server_secret'),

  RAFIKI_WEBHOOK_SIGNATURE_SECRET: z
    .string()
    .default('dev_rafiki_webhook_signature_secret'),

  MOJALY_OPEN_PAYMENTS_HOST: z
    .url()
    .default('https://mojaly.local'),

  KRATOS_PUBLIC_URL: z
    .url()
    .default('http://localhost:4433'),

  KRATOS_ADMIN_URL: z
    .url()
    .default('http://localhost:4434')
})

export type Env = z.infer<typeof envSchema>

export const env: Env = envSchema.parse(process.env)
