import { createAuthenticatedClient } from '@interledger/open-payments'
import { env } from './config.js'

function required(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`${name} is required`)
  }

  return value
}

async function main() {
  const walletAddressUrl = required(
    env.DEVELOPER_WALLET_ADDRESS,
    'DEVELOPER_WALLET_ADDRESS'
  )
  const privateKey = required(
    env.DEVELOPER_PRIVATE_KEY_PATH,
    'DEVELOPER_PRIVATE_KEY_PATH'
  )
  const keyId = required(env.DEVELOPER_KEY_ID, 'DEVELOPER_KEY_ID')
  const targetWalletAddress =
    env.DEVELOPER_TARGET_WALLET_ADDRESS ?? walletAddressUrl

  console.log('Creating authenticated Open Payments client...')
  console.log('Client wallet address:', walletAddressUrl)
  console.log('Target wallet address:', targetWalletAddress)

  const client = await createAuthenticatedClient({
    walletAddressUrl,
    privateKey,
    keyId
  })

  const walletAddress = await client.walletAddress.get({
    url: targetWalletAddress
  })

  console.log('\nWallet address resolved successfully:')
  console.log(JSON.stringify(walletAddress, null, 2))
}

main().catch((error: unknown) => {
  console.error('\nDeveloper key verification failed')
  console.error(error)
  process.exitCode = 1
})