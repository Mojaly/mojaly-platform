import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4020),
  CORE_API_URL: z.string().url().default('http://localhost:4010')
})

export type Env = z.infer<typeof envSchema>
export const env: Env = envSchema.parse(process.env)
