import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5080),
  RAFIKI_AUTH_DOMAIN: z.url().default('https://auth.mojaly.local'),
  RAFIKI_AUTH_IDENTITY_SERVER_SECRET: z
    .string()
    .min(1, 'RAFIKI_AUTH_IDENTITY_SERVER_SECRET is required')
})

export type Env = z.infer<typeof envSchema>

export const env: Env = envSchema.parse(process.env)
