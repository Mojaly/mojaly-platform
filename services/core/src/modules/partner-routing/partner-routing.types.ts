export type RoutingStatus = 'ACTIVE' | 'INACTIVE'
export type DestinationType = 'mobile_money' | 'bank_account'
export type WalletPurpose = 'SETTLEMENT'

export interface RoutingPartner {
  id: string
  code: string
  name: string
  status: RoutingStatus
  rafikiTenantId: string
  adapterCode: string
}

export interface PartnerCapability {
  id: string
  partnerId: string
  country: string
  destinationType: DestinationType
  network?: string
  assetCode: string
  status: RoutingStatus
}

export interface PartnerWalletAddress {
  id: string
  partnerId: string
  capabilityId: string
  walletAddressUrl: string
  purpose: WalletPurpose
  status: RoutingStatus
}

export type PartnerAccountType = 'bank_account' | 'mobile_money'

export interface PartnerSupportedAsset {
  id: string
  partnerId: string
  partnerCode: string
  partnerName: string
  assetCode: string
  assetScale: number
  rafikiAssetId: string
  accountType: PartnerAccountType
  status: RoutingStatus
}

export interface PartnerAccountLinkOptionAsset {
  assetCode: string
  assetScale: number
  label: string
}

export interface PartnerAccountLinkOption {
  partnerCode: string
  partnerName: string
  accountType: PartnerAccountType
  assets: PartnerAccountLinkOptionAsset[]
  fields: Array<{
    name: string
    label: string
    placeholder: string
    required: boolean
  }>
}

export interface PartnerRoute {
  partner: RoutingPartner
  capability: PartnerCapability
  walletAddress: PartnerWalletAddress
}
