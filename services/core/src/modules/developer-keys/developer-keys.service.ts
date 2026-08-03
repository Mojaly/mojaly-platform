import { generateKeyPairSync, randomUUID } from 'node:crypto'
import { createRafikiClient } from '../rafiki/rafiki.factory.js'
import { getWalletAddress } from '../wallet-addresses/wallet-address.service.js'
import { generateJwk } from '../../utils/jwk.js'
import {
  getDeveloperKeyById,
  listDeveloperKeysByWorkspace,
  saveDeveloperKey,
  updateDeveloperKey
} from './developer-keys.store.js'
import type {
  CreateDeveloperKeyInput,
  CreateDeveloperKeyResult,
  DeveloperKey,
  RevokeDeveloperKeyInput
} from './developer-keys.types.js'

export async function createDeveloperKey(
  input: CreateDeveloperKeyInput
): Promise<CreateDeveloperKeyResult> {
  const walletAddress = assertWalletAddressBelongsToWorkspace(
    input.walletAddressId,
    input.workspaceId
  )
  const keyId = randomUUID()
  const now = new Date().toISOString()

  const { publicKey, privateKey } = generateKeyPairSync('ed25519')

  const publicKeyPem = publicKey
    .export({ type: 'spki', format: 'pem' })
    .toString()

  const privateKeyPem = privateKey
    .export({ type: 'pkcs8', format: 'pem' })
    .toString()

  const rafikiClient = createRafikiClient()

  const rafikiKey = await rafikiClient.createRafikiWalletAddressKey(
    generateJwk(publicKey, keyId),
    walletAddress.id
  )

  const developerKey: DeveloperKey = {
    id: keyId,
    name: input.name,
    workspaceId: input.workspaceId,
    walletAddressId: walletAddress.id,
    rafikiId: rafikiKey.id,
    publicKey: publicKeyPem,
    status: 'ACTIVE',
    createdAt: now,
    updatedAt: now
  }

  saveDeveloperKey(developerKey)

  return {
    key: developerKey,
    privateKey: privateKeyPem,
    publicKey: publicKeyPem,
    keyId,
    walletAddressUrl: walletAddress.url
  }
}

export function listDeveloperKeys(workspaceId: string): DeveloperKey[] {
  return listDeveloperKeysByWorkspace(workspaceId)
}

export function listDeveloperKeysForWallet(
  workspaceId: string,
  walletAddressId: string
): DeveloperKey[] {
  assertWalletAddressBelongsToWorkspace(walletAddressId, workspaceId)

  return listDeveloperKeysByWorkspace(workspaceId).filter(
    (key) => key.walletAddressId === walletAddressId
  )
}

export async function revokeDeveloperKey(
  input: RevokeDeveloperKeyInput
): Promise<DeveloperKey | undefined> {
  assertWalletAddressBelongsToWorkspace(input.walletAddressId, input.workspaceId)

  const key = getDeveloperKeyById(input.keyId)

  if (
    !key ||
    key.workspaceId !== input.workspaceId ||
    key.walletAddressId !== input.walletAddressId
  ) {
    return undefined
  }

  if (key.status === 'REVOKED') {
    return key
  }

  const rafikiClient = createRafikiClient()
  await rafikiClient.revokeWalletAddressKey(key.rafikiId)

  return updateDeveloperKey(key.id, {
    status: 'REVOKED'
  })
}

function assertWalletAddressBelongsToWorkspace(
  walletAddressId: string,
  workspaceId: string
) {
  const walletAddress = getWalletAddress(walletAddressId)

  if (!walletAddress) {
    throw new Error('WALLET_ADDRESS_NOT_FOUND')
  }

  if (walletAddress.fintechId !== workspaceId) {
    throw new Error('WALLET_ADDRESS_WORKSPACE_MISMATCH')
  }

  if (walletAddress.status !== 'ACTIVE') {
    throw new Error('WALLET_ADDRESS_INACTIVE')
  }

  return walletAddress
}