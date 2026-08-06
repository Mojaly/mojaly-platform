export type WalletAddressStatus = 'ACTIVE' | 'INACTIVE'

export type WalletAddress = {
  id: string
  accountId: string
  workspaceId: string
  fintechId: string
  url: string
  publicName: string
  assetCode: string
  assetScale: number
  rafikiAssetId: string
  status: WalletAddressStatus
  createdAt: string
  updatedAt: string
}

export type CreateWalletAddressInput = {
  accountId: string
  workspaceId?: string | undefined
  walletAddressName: string
  publicName: string
}
