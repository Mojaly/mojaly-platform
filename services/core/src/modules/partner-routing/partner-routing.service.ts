import {
  findPartnerRoute,
  findPartnerSupportedAsset,
  listPartnerSupportedAssets
} from './partner-routing.store.js'
import type {
  PartnerAccountLinkOption,
  PartnerRoute,
  PartnerSupportedAsset
} from './partner-routing.types.js'

export interface ResolvePartnerRouteInput {
  country: string
  destinationType: string
  network?: string
  assetCode: string
}

export class PartnerRouteNotFoundError extends Error {
  constructor(input: ResolvePartnerRouteInput) {
    super(
      `No active partner route found for ${input.country} ${input.destinationType} ${input.network ?? ''} ${input.assetCode}`.trim()
    )

    this.name = 'PartnerRouteNotFoundError'
  }
}

export class PartnerSupportedAssetNotFoundError extends Error {
  constructor(input: { partnerCode: string; assetCode: string }) {
    super(`No active supported asset found for ${input.partnerCode} ${input.assetCode}`)
    this.name = 'PartnerSupportedAssetNotFoundError'
  }
}

export async function resolvePartnerRoute(
  input: ResolvePartnerRouteInput
): Promise<PartnerRoute> {
  const route = await findPartnerRoute(input)

  if (!route) {
    throw new PartnerRouteNotFoundError(input)
  }

  return route
}

export async function resolvePartnerSupportedAsset(input: {
  partnerCode: string
  assetCode: string
}): Promise<PartnerSupportedAsset> {
  const asset = await findPartnerSupportedAsset(input)

  if (!asset) {
    throw new PartnerSupportedAssetNotFoundError(input)
  }

  return asset
}

export async function getPartnerAccountLinkOptions(): Promise<
  PartnerAccountLinkOption[]
> {
  const assets = await listPartnerSupportedAssets()
  const optionsByPartner = new Map<string, PartnerAccountLinkOption>()

  for (const asset of assets) {
    const existing = optionsByPartner.get(asset.partnerCode)

    if (existing) {
      existing.assets.push({
        assetCode: asset.assetCode,
        assetScale: asset.assetScale,
        label: `${asset.assetCode} account`
      })
      continue
    }

    optionsByPartner.set(asset.partnerCode, {
      partnerCode: asset.partnerCode,
      partnerName: asset.partnerName,
      accountType: asset.accountType,
      assets: [
        {
          assetCode: asset.assetCode,
          assetScale: asset.assetScale,
          label: `${asset.assetCode} account`
        }
      ],
      fields: getAccountLinkFields(asset.partnerCode)
    })
  }

  return Array.from(optionsByPartner.values())
}

function getAccountLinkFields(partnerCode: string): PartnerAccountLinkOption['fields'] {
  if (partnerCode === 'GRIFFIN') {
    return [
      {
        name: 'externalPartnerAccountId',
        label: 'Griffin bank account ID',
        placeholder: 'ba.xxxxx',
        required: true
      }
    ]
  }

  return [
    {
      name: 'externalPartnerAccountId',
      label: 'Partner account ID',
      placeholder: 'Enter partner account reference',
      required: true
    }
  ]
}
