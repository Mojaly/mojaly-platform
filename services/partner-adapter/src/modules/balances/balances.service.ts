import { getPartner } from '../partners/partner-registry.js'

export async function getPartnerBalance(input: {
  partnerCode: string
  externalAccountId: string
  assetCode: string
  assetScale: number
}) {
  const partner = getPartner(input.partnerCode)

  if (!partner) {
    throw new Error('PARTNER_NOT_FOUND')
  }

  if (!partner.getBalance) {
    throw new Error('PARTNER_BALANCE_NOT_SUPPORTED')
  }

  return await partner.getBalance({
    externalAccountId: input.externalAccountId,
    assetCode: input.assetCode,
    assetScale: input.assetScale
  })
}