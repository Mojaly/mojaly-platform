import { createHash, createPublicKey, createVerify } from 'node:crypto'
import axios from 'axios'
import type { FastifyRequest } from 'fastify'
import { env } from '../../config/env.js'

interface GriffinJwk extends JsonWebKey {
  kid?: string
}

interface GriffinPublicKeySet {
  keys: GriffinJwk[]
}

interface SignatureInput {
  label: string
  coveredComponents: string[]
  parameters: string
  keyId: string
  created?: number
  expires?: number
}

const publicKeys = new Map<string, GriffinJwk>()

export class GriffinWebhookSignatureError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'GriffinWebhookSignatureError'
  }
}

export async function verifyGriffinWebhookSignature(
  request: FastifyRequest
): Promise<void> {
  if (!env.GRIFFIN_VERIFY_WEBHOOK_SIGNATURES) return

  const rawBody = request.rawBody

  if (!rawBody) {
    throw new GriffinWebhookSignatureError('Missing raw webhook body')
  }

  const signatureInputHeader = getHeader(request, 'signature-input')
  const signatureHeader = getHeader(request, 'signature')
  const contentDigest = getHeader(request, 'content-digest')

  if (!signatureInputHeader || !signatureHeader || !contentDigest) {
    throw new GriffinWebhookSignatureError('Missing signature headers')
  }

  verifyContentDigest(rawBody, contentDigest)

  const signatureInput = parseSignatureInput(signatureInputHeader)
  verifySignatureTimeWindow(signatureInput)

  const signature = parseSignature(signatureHeader, signatureInput.label)
  const signatureBase = buildSignatureBase(request, signatureInput)
  const jwk = await getPublicKey(signatureInput.keyId)
  const publicKey = createPublicKey({ key: jwk, format: 'jwk' })
  const verifier = createVerify('SHA512')

  verifier.update(signatureBase)
  verifier.end()

  const valid = verifier.verify(publicKey, signature)

  if (!valid) {
    throw new GriffinWebhookSignatureError('Invalid Griffin webhook signature')
  }
}

function verifyContentDigest(rawBody: Buffer, contentDigest: string): void {
  const expected = `sha-512=:${createHash('sha512').update(rawBody).digest('base64')}:`

  if (contentDigest.trim() !== expected) {
    throw new GriffinWebhookSignatureError('Invalid content-digest')
  }
}

function parseSignatureInput(header: string): SignatureInput {
  const equalsIndex = header.indexOf('=')

  if (equalsIndex === -1) {
    throw new GriffinWebhookSignatureError('Invalid signature-input header')
  }

  const label = header.slice(0, equalsIndex).trim()
  const value = header.slice(equalsIndex + 1).trim()
  const closeIndex = value.indexOf(')')

  if (!label || !value.startsWith('(') || closeIndex === -1) {
    throw new GriffinWebhookSignatureError('Invalid signature-input value')
  }

  const componentList = value.slice(1, closeIndex)
  const parameters = value.slice(closeIndex + 1)
  const coveredComponents = Array.from(componentList.matchAll(/"([^"]+)"/g))
    .map((match) => match[1])
    .filter((component): component is string => Boolean(component))
  const keyId = getSignatureParameter(parameters, 'keyid')

  if (!keyId) {
    throw new GriffinWebhookSignatureError('Missing keyid in signature-input')
  }

  const input: SignatureInput = {
    label,
    coveredComponents,
    parameters,
    keyId
  }

  const created = getNumericSignatureParameter(parameters, 'created')
  const expires = getNumericSignatureParameter(parameters, 'expires')

  if (created !== undefined) input.created = created
  if (expires !== undefined) input.expires = expires

  return input
}

function verifySignatureTimeWindow(input: SignatureInput): void {
  const now = Math.floor(Date.now() / 1000)

  if (input.created && input.created > now + 300) {
    throw new GriffinWebhookSignatureError('Webhook signature created in future')
  }

  if (input.expires && input.expires < now) {
    throw new GriffinWebhookSignatureError('Webhook signature expired')
  }
}

function parseSignature(header: string, label: string): Buffer {
  const pattern = new RegExp(`${escapeRegExp(label)}=:(?<signature>[^:]+):`)
  const match = header.match(pattern)
  const signature = match?.groups?.signature

  if (!signature) {
    throw new GriffinWebhookSignatureError('Invalid signature header')
  }

  return Buffer.from(signature, 'base64')
}

function buildSignatureBase(
  request: FastifyRequest,
  signatureInput: SignatureInput
): string {
  const lines = signatureInput.coveredComponents.map((component) => {
    return `"${component}": ${getCoveredComponentValue(request, component)}`
  })

  lines.push(`"@signature-params": (${signatureInput.coveredComponents.map((component) => `"${component}"`).join(' ')})${signatureInput.parameters}`)

  return lines.join('\n')
}

function getCoveredComponentValue(
  request: FastifyRequest,
  component: string
): string {
  if (component === '@method') return request.method.toUpperCase()

  if (component === '@path') {
    const authority = getHeader(request, 'host') ?? 'localhost'
    return new URL(request.url, `https://${authority}`).pathname
  }

  if (component === '@authority') {
    const authority = getHeader(request, 'host')
    if (!authority) {
      throw new GriffinWebhookSignatureError('Missing host header')
    }

    return authority
  }

  const header = getHeader(request, component)

  if (!header) {
    throw new GriffinWebhookSignatureError(`Missing signed header: ${component}`)
  }

  return header
}

async function getPublicKey(keyId: string): Promise<GriffinJwk> {
  const cachedKey = publicKeys.get(keyId)

  if (cachedKey) return cachedKey

  await loadPublicKeys()

  const loadedKey = publicKeys.get(keyId)

  if (!loadedKey) {
    throw new GriffinWebhookSignatureError(
      `Unknown Griffin webhook key id: ${keyId}`
    )
  }

  return loadedKey
}

async function loadPublicKeys(): Promise<void> {
  const response = await axios.get<GriffinPublicKeySet>(
    `${env.GRIFFIN_BASE_URL}/v0/security/public-keys`,
    {
      headers: {
        Accept: 'application/json'
      },
      timeout: 10_000
    }
  )

  for (const key of response.data.keys) {
    if (typeof key.kid === 'string') {
      publicKeys.set(key.kid, key)
    }
  }
}

function getHeader(request: FastifyRequest, name: string): string | undefined {
  const value = request.headers[name.toLowerCase()]

  if (Array.isArray(value)) return value.join(', ')
  return value
}

function getSignatureParameter(
  parameters: string,
  name: string
): string | undefined {
  return parameters.match(new RegExp(`${name}="([^"]+)"`))?.[1]
}

function getNumericSignatureParameter(
  parameters: string,
  name: string
): number | undefined {
  const value = parameters.match(new RegExp(`${name}=([0-9]+)`))?.[1]
  return value ? Number(value) : undefined
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
