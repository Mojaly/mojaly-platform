import type { PartnerAdapter } from './partner.types.js'

const partners = new Map<string, PartnerAdapter>()

export function registerPartner(adapter: PartnerAdapter): void {
  partners.set(adapter.code.toUpperCase(), adapter)
}

export function getPartner(code: string): PartnerAdapter | undefined {
  return partners.get(code.toUpperCase())
}

export function listPartnerCodes(): string[] {
  return Array.from(partners.keys())
}