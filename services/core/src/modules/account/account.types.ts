export type AccountStatus = 'ACTIVE' | 'INACTIVE'

export type Account = {
  id: string
  workspaceId: string
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
  workspaceId?: string | undefined
  fintechId?: string | undefined
  name: string
  partnerCode: string
  externalPartnerAccountId: string
  rafikiAssetId?: string | undefined
  assetCode: string
  assetScale?: number | undefined
}
