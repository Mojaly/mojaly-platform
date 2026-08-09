import { query } from '../../db/postgres.js'

export type WebhookSource = 'RAFIKI' | 'GRIFFIN' | 'MTN' | 'SAFARICOM' | 'KCB'
export type WebhookHandlingStatus = 'RECEIVED' | 'HANDLED' | 'FAILED' | 'IGNORED'

export type SaveWebhookEventInput = {
  source: WebhookSource
  eventType: string
  externalEventId?: string | undefined
  paymentIntentId?: string | undefined
  partnerPayoutId?: string | undefined
  signatureVerified: boolean
  payload: unknown
  handlingStatus?: WebhookHandlingStatus | undefined
  failureReason?: string | undefined
}

export async function saveWebhookEvent(input: SaveWebhookEventInput): Promise<void> {
  await query(
    `
      INSERT INTO webhook_events (
        source,
        event_type,
        external_event_id,
        payment_intent_id,
        partner_payout_id,
        signature_verified,
        payload,
        handled_at,
        handling_status,
        failure_reason
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10)
      ON CONFLICT (source, external_event_id) DO UPDATE SET
        event_type = EXCLUDED.event_type,
        payment_intent_id = EXCLUDED.payment_intent_id,
        partner_payout_id = EXCLUDED.partner_payout_id,
        signature_verified = EXCLUDED.signature_verified,
        payload = EXCLUDED.payload,
        handled_at = EXCLUDED.handled_at,
        handling_status = EXCLUDED.handling_status,
        failure_reason = EXCLUDED.failure_reason
    `,
    [
      input.source,
      input.eventType,
      input.externalEventId ?? null,
      toUuidOrNull(input.paymentIntentId),
      toUuidOrNull(input.partnerPayoutId),
      input.signatureVerified,
      JSON.stringify(input.payload),
      input.handlingStatus && input.handlingStatus !== 'RECEIVED'
        ? new Date().toISOString()
        : null,
      input.handlingStatus ?? 'RECEIVED',
      input.failureReason ?? null
    ]
  )
}

function toUuidOrNull(value: string | undefined): string | null {
  if (!value) {
    return null
  }

  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
    ? value
    : null
}
