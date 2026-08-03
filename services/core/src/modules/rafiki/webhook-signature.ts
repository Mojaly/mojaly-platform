import { createHmac, timingSafeEqual } from 'node:crypto'
import type { FastifyRequest } from 'fastify'
import { canonicalize } from 'json-canonicalize'
import { env } from '../../config/env.js'

const RAFIKI_SIGNATURE_HEADER = 'rafiki-signature'
const SIGNATURE_TOLERANCE_SECONDS = 5
const SIGNATURE_PATTERN = /t=(\d+),\s*v1=([a-f0-9]+)/

export type SignatureVerificationResult =
  | { valid: true }
  | { valid: false; reason: string }

export function verifyRafikiWebhookSignature(
  request: FastifyRequest
): SignatureVerificationResult {
  const signatureHeader = request.headers[RAFIKI_SIGNATURE_HEADER]

  if (typeof signatureHeader !== 'string') {
    return { valid: false, reason: 'Missing Rafiki signature header' }
  }

  const match = signatureHeader.match(SIGNATURE_PATTERN)

  if (!match) {
    return { valid: false, reason: 'Invalid Rafiki signature header format' }
  }

  const [, timestamp, digest] = match

  if (!timestamp || !digest) {
    return { valid: false, reason: 'Invalid Rafiki signature header values' }
  }

  const timestampSeconds = Number(timestamp)
  const nowSeconds = Math.round(Date.now() / 1000)

  if (!Number.isFinite(timestampSeconds)) {
    return { valid: false, reason: 'Invalid Rafiki signature timestamp' }
  }

  if (Math.abs(nowSeconds - timestampSeconds) > SIGNATURE_TOLERANCE_SECONDS) {
    return { valid: false, reason: 'Expired Rafiki signature timestamp' }
  }

  const payload = `${timestamp}.${canonicalize(request.body)}`
  const expectedDigest = createHmac(
    'sha256',
    env.RAFIKI_WEBHOOK_SIGNATURE_SECRET
  )
    .update(payload)
    .digest('hex')

  if (!safeEqualHex(expectedDigest, digest)) {
    return { valid: false, reason: 'Invalid Rafiki signature digest' }
  }

  return { valid: true }
}

function safeEqualHex(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left, 'hex')
  const rightBuffer = Buffer.from(right, 'hex')

  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  )
}
