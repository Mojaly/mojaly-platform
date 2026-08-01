import { type KeyObject } from 'node:crypto'
import {
  Alg,
  Crv,
  Kty,
  type Jwk,
  type JwkInput
} from '../modules/rafiki/backend/generated/graphql.js'

export const generateJwk = (
  publicKey: KeyObject,
  keyId: string
): JwkInput => {
  if (!keyId.trim()) {
    throw new Error('keyId cannot be empty')
  }

  const jwk = publicKey.export({
    format: 'jwk'
  })

  if (jwk.crv !== 'Ed25519' || jwk.kty !== 'OKP' || !jwk.x) {
    throw new Error('Key is not EdDSA-Ed25519')
  }

  return {
    alg: Alg.EdDsa,
    kid: keyId,
    kty: Kty.Okp,
    crv: Crv.Ed25519,
    x: jwk.x
  }
}

export const validateJwk = (jwk: Jwk): JwkInput => {
  if (jwk.crv !== 'Ed25519' || jwk.kty !== 'OKP' || !jwk.x) {
    throw new Error('Key is not EdDSA-Ed25519')
  }

  return {
    alg: Alg.EdDsa,
    kid: jwk.kid,
    kty: Kty.Okp,
    crv: Crv.Ed25519,
    x: jwk.x
  }
}