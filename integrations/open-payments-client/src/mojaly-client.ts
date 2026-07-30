import axios from 'axios'
import { env } from './config.js'

export interface DestinationResolution {
  paymentIntentId: string
  walletAddress: string
  paymentReference: string
  partnerCode: string
  status: string
  expiresAt: string
}

export async function createMojalyResolution(): Promise<DestinationResolution> {
  const destination: {
    type: 'bank_account' | 'mobile_money'
    country: string
    account: string
    bankCode?: string
    network?: string
    name?: string
  } = {
    type: env.RECEIVER_DESTINATION_TYPE,
    country: env.RECEIVER_COUNTRY,
    account: env.RECEIVER_ACCOUNT
  }

  if (env.RECEIVER_BANK_CODE) {
    destination.bankCode = env.RECEIVER_BANK_CODE
  }

  if (env.RECEIVER_NETWORK) {
    destination.network = env.RECEIVER_NETWORK
  }

  if (env.RECEIVER_NAME) {
    destination.name = env.RECEIVER_NAME
  }

  const response = await axios.post<{ data: DestinationResolution }>(
    `${env.CORE_URL}/destination-resolutions`,
    {
      fintechId: 'janjapay-01',
      destination,
      amount: {
        value: env.PAYMENT_AMOUNT,
        assetCode: env.RECEIVER_ASSET_CODE,
        assetScale: env.RECEIVER_ASSET_SCALE
      },
      reference: `real-rafiki-${Date.now()}`
    },
    {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      timeout: 10_000
    }
  )

  return response.data.data
}
