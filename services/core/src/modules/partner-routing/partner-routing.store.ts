import { query } from '../../db/postgres.js'
import type {
  PartnerCapability,
  PartnerRoute,
  PartnerSupportedAsset,
  PartnerWalletAddress,
  RoutingPartner
} from './partner-routing.types.js'

type RoutingPartnerRow = {
  id: string
  code: string
  name: string
  status: RoutingPartner['status']
  rafiki_tenant_id: string
  adapter_code: string
}

type PartnerCapabilityRow = {
  id: string
  partner_id: string
  country: string
  destination_type: PartnerCapability['destinationType']
  network: string | null
  asset_code: string
  status: PartnerCapability['status']
}

type PartnerWalletAddressRow = {
  id: string
  partner_id: string
  capability_id: string
  wallet_address_url: string
  purpose: PartnerWalletAddress['purpose']
  status: PartnerWalletAddress['status']
}

type PartnerSupportedAssetRow = {
  id: string
  partner_id: string
  partner_code: string
  partner_name: string
  asset_code: string
  asset_scale: number
  rafiki_asset_id: string
  account_type: PartnerSupportedAsset['accountType']
  status: PartnerSupportedAsset['status']
}

type PartnerRouteRow = RoutingPartnerRow &
  PartnerCapabilityRow &
  PartnerWalletAddressRow & {
    partner_id: string
    partner_code: string
    partner_name: string
    partner_status: RoutingPartner['status']
    capability_id: string
    capability_status: PartnerCapability['status']
    wallet_address_id: string
    wallet_address_status: PartnerWalletAddress['status']
  }

function mapPartner(row: RoutingPartnerRow): RoutingPartner {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    status: row.status,
    rafikiTenantId: row.rafiki_tenant_id,
    adapterCode: row.adapter_code
  }
}

function mapCapability(row: PartnerCapabilityRow): PartnerCapability {
  const capability: PartnerCapability = {
    id: row.id,
    partnerId: row.partner_id,
    country: row.country,
    destinationType: row.destination_type,
    assetCode: row.asset_code,
    status: row.status
  }

  if (row.network) {
    capability.network = row.network
  }

  return capability
}

function mapWalletAddress(row: PartnerWalletAddressRow): PartnerWalletAddress {
  return {
    id: row.id,
    partnerId: row.partner_id,
    capabilityId: row.capability_id,
    walletAddressUrl: row.wallet_address_url,
    purpose: row.purpose,
    status: row.status
  }
}

function mapSupportedAsset(row: PartnerSupportedAssetRow): PartnerSupportedAsset {
  return {
    id: row.id,
    partnerId: row.partner_id,
    partnerCode: row.partner_code,
    partnerName: row.partner_name,
    assetCode: row.asset_code,
    assetScale: row.asset_scale,
    rafikiAssetId: row.rafiki_asset_id,
    accountType: row.account_type,
    status: row.status
  }
}

export async function listRoutingPartners(): Promise<RoutingPartner[]> {
  const result = await query<RoutingPartnerRow>(
    'SELECT * FROM routing_partners ORDER BY created_at DESC'
  )

  return result.rows.map(mapPartner)
}

export async function findRoutingPartnerByAdapterCode(
  adapterCode: string
): Promise<RoutingPartner | undefined> {
  const result = await query<RoutingPartnerRow>(
    `
      SELECT * FROM routing_partners
      WHERE adapter_code = $1 AND status = 'ACTIVE'
      LIMIT 1
    `,
    [adapterCode]
  )

  const row = result.rows[0]
  return row ? mapPartner(row) : undefined
}

export async function listPartnerCapabilities(): Promise<PartnerCapability[]> {
  const result = await query<PartnerCapabilityRow>(
    'SELECT * FROM partner_capabilities ORDER BY created_at DESC'
  )

  return result.rows.map(mapCapability)
}

export async function listPartnerWalletAddresses(): Promise<PartnerWalletAddress[]> {
  const result = await query<PartnerWalletAddressRow>(
    'SELECT * FROM partner_wallet_addresses ORDER BY created_at DESC'
  )

  return result.rows.map(mapWalletAddress)
}

export async function listPartnerSupportedAssets(): Promise<PartnerSupportedAsset[]> {
  const result = await query<PartnerSupportedAssetRow>(
    `
      SELECT
        asset.id,
        asset.partner_id,
        partner.code AS partner_code,
        partner.name AS partner_name,
        asset.asset_code,
        asset.asset_scale,
        asset.rafiki_asset_id,
        asset.account_type,
        asset.status
      FROM partner_supported_assets asset
      JOIN routing_partners partner ON partner.id = asset.partner_id
      WHERE asset.status = 'ACTIVE'
        AND partner.status = 'ACTIVE'
      ORDER BY partner.name ASC, asset.asset_code ASC
    `
  )

  return result.rows.map(mapSupportedAsset)
}

export async function findPartnerSupportedAsset(input: {
  partnerCode: string
  assetCode: string
}): Promise<PartnerSupportedAsset | undefined> {
  const result = await query<PartnerSupportedAssetRow>(
    `
      SELECT
        asset.id,
        asset.partner_id,
        partner.code AS partner_code,
        partner.name AS partner_name,
        asset.asset_code,
        asset.asset_scale,
        asset.rafiki_asset_id,
        asset.account_type,
        asset.status
      FROM partner_supported_assets asset
      JOIN routing_partners partner ON partner.id = asset.partner_id
      WHERE partner.code = $1
        AND asset.asset_code = $2
        AND asset.status = 'ACTIVE'
        AND partner.status = 'ACTIVE'
      LIMIT 1
    `,
    [input.partnerCode, input.assetCode]
  )

  const row = result.rows[0]
  return row ? mapSupportedAsset(row) : undefined
}

export async function findPartnerRoute(input: {
  country: string
  destinationType: string
  network?: string
  assetCode: string
}): Promise<PartnerRoute | undefined> {
  const result = await query<PartnerRouteRow>(
    `
      SELECT
        partner.id,
        partner.code,
        partner.name,
        partner.status,
        partner.rafiki_tenant_id,
        partner.adapter_code,
        partner.id AS partner_id,
        partner.code AS partner_code,
        partner.name AS partner_name,
        partner.status AS partner_status,
        capability.id AS capability_id,
        capability.country,
        capability.destination_type,
        capability.network,
        capability.asset_code,
        capability.status AS capability_status,
        wallet.id AS wallet_address_id,
        wallet.wallet_address_url,
        wallet.purpose,
        wallet.status AS wallet_address_status
      FROM partner_capabilities capability
      JOIN routing_partners partner ON partner.id = capability.partner_id
      JOIN partner_wallet_addresses wallet
        ON wallet.partner_id = partner.id
       AND wallet.capability_id = capability.id
      WHERE capability.country = $1
        AND capability.destination_type = $2
        AND capability.asset_code = $3
        AND capability.status = 'ACTIVE'
        AND partner.status = 'ACTIVE'
        AND wallet.status = 'ACTIVE'
        AND wallet.purpose = 'SETTLEMENT'
        AND (capability.network IS NULL OR capability.network = $4)
      ORDER BY capability.created_at ASC
      LIMIT 1
    `,
    [input.country, input.destinationType, input.assetCode, input.network ?? null]
  )

  const row = result.rows[0]

  if (!row) {
    return undefined
  }

  return {
    partner: {
      id: row.partner_id,
      code: row.partner_code,
      name: row.partner_name,
      status: row.partner_status,
      rafikiTenantId: row.rafiki_tenant_id,
      adapterCode: row.adapter_code
    },
    capability: {
      id: row.capability_id,
      partnerId: row.partner_id,
      country: row.country,
      destinationType: row.destination_type,
      ...(row.network ? { network: row.network } : {}),
      assetCode: row.asset_code,
      status: row.capability_status
    },
    walletAddress: {
      id: row.wallet_address_id,
      partnerId: row.partner_id,
      capabilityId: row.capability_id,
      walletAddressUrl: row.wallet_address_url,
      purpose: row.purpose,
      status: row.wallet_address_status
    }
  }
}
