import { z } from 'zod'

export const griffinWebhookEventSchema = z.object({
  'event-url': z.string().min(1),
  'event-type': z.string().min(1),
  'event-payload': z.record(z.string(), z.unknown()),
  'created-at': z.string().optional()
})

export type GriffinWebhookEvent = z.infer<typeof griffinWebhookEventSchema>
