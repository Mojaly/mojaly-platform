import type { WalletAddress } from './wallet-address.types.js'

const walletAddresses = new Map<string, WalletAddress>()

export function saveWalletAddress(walletAddress: WalletAddress): WalletAddress {
  walletAddresses.set(walletAddress.id, walletAddress)
  return walletAddress
}

export function getWalletAddressById(id: string): WalletAddress | undefined {
  return walletAddresses.get(id)
}

export function getWalletAddressByUrl(url: string): WalletAddress | undefined {
  return Array.from(walletAddresses.values()).find(
    (walletAddress) => walletAddress.url === url
  )
}

export function listWalletAddresses(): WalletAddress[] {
  return Array.from(walletAddresses.values())
}

export function listWalletAddressesByAccount(accountId: string): WalletAddress[] {
  return listWalletAddresses().filter(
    (walletAddress) => walletAddress.accountId === accountId
  )
}

export function listWalletAddressesByWorkspace(
  workspaceId: string
): WalletAddress[] {
  return listWalletAddresses().filter(
    (walletAddress) => walletAddress.workspaceId === workspaceId
  )
}

export function listWalletAddressesByFintech(fintechId: string): WalletAddress[] {
  return listWalletAddresses().filter(
    (walletAddress) => walletAddress.fintechId === fintechId
  )
}
