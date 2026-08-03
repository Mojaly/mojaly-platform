export type DeveloperKeyStatus = 'ACTIVE' | 'REVOKED'

export type DeveloperKey = {
  id: string
  name: string
  workspaceId: string
  walletAddressId: string
  rafikiId: string
  publicKey: string
  status: DeveloperKeyStatus
  createdAt: string
  updatedAt: string
}

export type CreateDeveloperKeyInput = {
  workspaceId: string
  walletAddressId: string
  name: string
}

export type CreateDeveloperKeyResult = {
  key: DeveloperKey
  privateKey: string
  publicKey: string
  keyId: string
  walletAddressUrl: string
}

export type RevokeDeveloperKeyInput = {
  workspaceId: string
  walletAddressId: string
  keyId: string
}
