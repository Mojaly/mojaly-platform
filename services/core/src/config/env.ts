import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),

  PORT: z.coerce.number().int().positive().default(4010),

  PARTNER_ADAPTER_URL: z
    .url()
    .default('http://localhost:4005')
})

export type Env = z.infer<typeof envSchema>

export const env: Env = envSchema.parse(process.env)