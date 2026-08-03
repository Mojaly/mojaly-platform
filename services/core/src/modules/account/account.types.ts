export type AccountStatus = 'ACTIVE' | 'INACTIVE'

export type Account = {
  id: string
  fintechId: string
  name: string
  partnerCode: string
  externalPartnerAccountId: string
  rafikiAssetId?: string
  assetCode: string
  assetScale: number
  status: AccountStatus
  createdAt: string
  updatedAt: string
}

export type CreateAccountInput = {
  fintechId: string
  name: string
  partnerCode: string
  externalPartnerAccountId: string
  rafikiAssetId?: string | undefined
  assetCode: string
  assetScale: number
}
