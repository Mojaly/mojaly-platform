import { findPartnerRoute } from './partner-routing.store.js'
import type { PartnerRoute } from './partner-routing.types.js'

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

export async function resolvePartnerRoute(
  input: ResolvePartnerRouteInput
): Promise<PartnerRoute> {
  const route = await findPartnerRoute(input)

  if (!route) {
    throw new PartnerRouteNotFoundError(input)
  }

  return route
}
