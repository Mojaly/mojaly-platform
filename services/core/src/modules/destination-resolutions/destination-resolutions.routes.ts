import { createPublicKey, verify } from 'node:crypto'
import type { FastifyPluginAsync } from 'fastify'
import { canonicalize } from 'json-canonicalize'
import { getActiveDeveloperKeyContextById } from '../developer-keys/developer-keys.store.js'
import type { DeveloperKeyContext } from '../developer-keys/developer-keys.types.js'
import { createDestinationResolutionSchema } from './destination-resolutions.schemas.js'
import {
  createDestinationResolution,
  mapDestinationResolutionError
} from './destination-resolutions.service.js'

const SIGNATURE_TOLERANCE_MS = 5 * 60 * 1000

class DeveloperKeyAuthError extends Error {
  constructor(
    public readonly code: string,
    message: string
  ) {
    super(message)
    this.name = 'DeveloperKeyAuthError'
  }
}

function getHeaderValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

function parseTimestamp(value: string): number {
  if (/^\d+$/.test(value)) {
    return Number(value)
  }

  return Date.parse(value)
}

async function verifyDeveloperKeyRequest(input: {
  keyId: string
  timestamp: string
  signature: string
  body: unknown
}): Promise<DeveloperKeyContext> {
  const timestampMs = parseTimestamp(input.timestamp)

  if (!Number.isFinite(timestampMs)) {
    throw new DeveloperKeyAuthError(
      'INVALID_DEVELOPER_KEY_TIMESTAMP',
      'Invalid developer key signature timestamp'
    )
  }

  if (Math.abs(Date.now() - timestampMs) > SIGNATURE_TOLERANCE_MS) {
    throw new DeveloperKeyAuthError(
      'EXPIRED_DEVELOPER_KEY_SIGNATURE',
      'Expired developer key signature'
    )
  }

  const keyContext = await getActiveDeveloperKeyContextById(input.keyId)

  if (!keyContext) {
    throw new DeveloperKeyAuthError(
      'DEVELOPER_KEY_NOT_FOUND',
      'Active developer key not found'
    )
  }

  const payload = `${input.timestamp}.${canonicalize(input.body)}`
  const publicKey = createPublicKey(keyContext.publicKey)
  const valid = verify(
    null,
    Buffer.from(payload),
    publicKey,
    Buffer.from(input.signature, 'base64')
  )

  if (!valid) {
    throw new DeveloperKeyAuthError(
      'INVALID_DEVELOPER_KEY_SIGNATURE',
      'Invalid developer key signature'
    )
  }

  return keyContext
}

export const destinationResolutionRoutes: FastifyPluginAsync = async (app) => {
  app.post('/destination-resolutions', async (request, reply) => {
    const result = createDestinationResolutionSchema.safeParse(request.body)

    if (!result.success) {
      return reply.code(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid destination resolution request',
          details: result.error.flatten()
        }
      })
    }

    try {
      const keyId = getHeaderValue(request.headers['x-api-key-id'])?.trim()
      const timestamp = getHeaderValue(
        request.headers['x-signature-timestamp']
      )?.trim()
      const signature = getHeaderValue(request.headers['x-signature'])?.trim()
      const developerKey =
        keyId && timestamp && signature
          ? await verifyDeveloperKeyRequest({
              keyId,
              timestamp,
              signature,
              body: request.body
            })
          : undefined

      const intent = await createDestinationResolution(result.data, {
        ...(developerKey ? { developerKey } : {})
      })

      return reply.code(201).send({
        data: {
          id: intent.id,
          walletAddress: intent.walletAddress,
          metadata: {
            paymentReference: intent.id
          },
          expiresAt: intent.expiresAt
        }
      })
    } catch (error) {
      if (error instanceof DeveloperKeyAuthError) {
        return reply.code(401).send({
          error: {
            code: error.code,
            message: error.message
          }
        })
      }

      const mappedError = mapDestinationResolutionError(error)

      if (!mappedError) {
        throw error
      }

      return reply.code(mappedError.statusCode).send({
        error: {
          code: mappedError.code,
          message: mappedError.message,
          details: mappedError.details
        }
      })
    }
  })
}