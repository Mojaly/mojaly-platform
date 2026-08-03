export type WalletAddressStatus = 'ACTIVE' | 'INACTIVE'

export type WalletAddress = {
  id: string
  accountId: string
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
  walletAddressName: string
  publicName: string
}