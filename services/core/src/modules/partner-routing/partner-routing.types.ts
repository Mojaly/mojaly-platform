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

export interface PartnerRoute {
  partner: RoutingPartner
  capability: PartnerCapability
  walletAddress: PartnerWalletAddress
}