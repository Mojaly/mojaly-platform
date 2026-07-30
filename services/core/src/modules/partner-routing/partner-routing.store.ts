import type {
  PartnerCapability,
  PartnerRoute,
  PartnerWalletAddress,
  RoutingPartner
} from './partner-routing.types.js'

const partners = new Map<string, RoutingPartner>([
  [
    'partner_mtn_ug',
    {
      id: 'partner_mtn_ug',
      code: 'MTN_UG',
      name: 'MTN Uganda',
      status: 'ACTIVE',
      rafikiTenantId: 'f854ad9b-1e81-4d5d-8a4e-fd63fa277f10',
      adapterCode: 'MTN_UG'
    }
  ],
  [
    'partner_griffin',
    {
      id: 'partner_griffin',
      code: 'GRIFFIN',
      name: 'Griffin',
      status: 'ACTIVE',
      rafikiTenantId: '12d0d40f-0f7c-4a51-974b-d04debfe6a20',
      adapterCode: 'GRIFFIN'
    }
  ],
  [
    'partner_safaricom_ke',
    {
      id: 'partner_safaricom_ke',
      code: 'SAFARICOM_KE',
      name: 'Safaricom M-Pesa Kenya',
      status: 'ACTIVE',
      rafikiTenantId: 'replace-with-safaricom-tenant-id',
      adapterCode: 'SAFARICOM_KE'
    }
  ]
])

const capabilities = new Map<string, PartnerCapability>([
  [
    'capability_mtn_ug_mobile_money_ugx',
    {
      id: 'capability_mtn_ug_mobile_money_ugx',
      partnerId: 'partner_mtn_ug',
      country: 'UG',
      destinationType: 'mobile_money',
      network: 'MTN',
      assetCode: 'UGX',
      status: 'ACTIVE'
    }
  ],
  [
    'capability_griffin_bank_gbp',
    {
      id: 'capability_griffin_bank_gbp',
      partnerId: 'partner_griffin',
      country: 'GB',
      destinationType: 'bank_account',
      assetCode: 'GBP',
      status: 'ACTIVE'
    }
  ],
  [
    'capability_safaricom_ke_mobile_money_kes',
    {
      id: 'capability_safaricom_ke_mobile_money_kes',
      partnerId: 'partner_safaricom_ke',
      country: 'KE',
      destinationType: 'mobile_money',
      network: 'SAFARICOM',
      assetCode: 'KES',
      status: 'ACTIVE'
    }
  ]
])

const walletAddresses = new Map<string, PartnerWalletAddress>([
  [
    'wallet_mtn_ug_settlement',
    {
      id: 'wallet_mtn_ug_settlement',
      partnerId: 'partner_mtn_ug',
      capabilityId: 'capability_mtn_ug_mobile_money_ugx',
      walletAddressUrl: 'https://mojaly.local/mtn-ug/settlement',
      purpose: 'SETTLEMENT',
      status: 'ACTIVE'
    }
  ],
  [
    'wallet_griffin_settlement',
    {
      id: 'wallet_griffin_settlement',
      partnerId: 'partner_griffin',
      capabilityId: 'capability_griffin_bank_gbp',
      walletAddressUrl: 'https://mojaly.local/griffin/settlement',
      purpose: 'SETTLEMENT',
      status: 'ACTIVE'
    }
  ],
  [
    'wallet_safaricom_ke_settlement',
    {
      id: 'wallet_safaricom_ke_settlement',
      partnerId: 'partner_safaricom_ke',
      capabilityId: 'capability_safaricom_ke_mobile_money_kes',
      walletAddressUrl: 'https://mojaly.local/safaricom-ke/settlement',
      purpose: 'SETTLEMENT',
      status: 'ACTIVE'
    }
  ]
])

export function listRoutingPartners(): RoutingPartner[] {
  return Array.from(partners.values())
}

export function listPartnerCapabilities(): PartnerCapability[] {
  return Array.from(capabilities.values())
}

export function listPartnerWalletAddresses(): PartnerWalletAddress[] {
  return Array.from(walletAddresses.values())
}

export function findPartnerRoute(input: {
  country: string
  destinationType: string
  network?: string
  assetCode: string
}): PartnerRoute | undefined {
  for (const capability of capabilities.values()) {
    if (capability.status !== 'ACTIVE') continue
    if (capability.country !== input.country) continue
    if (capability.destinationType !== input.destinationType) continue
    if (capability.assetCode !== input.assetCode) continue

    if (capability.network && capability.network !== input.network) continue

    const partner = partners.get(capability.partnerId)

    if (!partner || partner.status !== 'ACTIVE') continue

    const walletAddress = Array.from(walletAddresses.values()).find(
      (item) =>
        item.partnerId === partner.id &&
        item.capabilityId === capability.id &&
        item.status === 'ACTIVE' &&
        item.purpose === 'SETTLEMENT'
    )

    if (!walletAddress) continue

    return {
      partner,
      capability,
      walletAddress
    }
  }

  return undefined
}
