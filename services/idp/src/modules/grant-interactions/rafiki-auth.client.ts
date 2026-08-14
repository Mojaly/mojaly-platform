import axios from 'axios'
import type { Env } from '../../config/env.js'

export class RafikiAuthClient {
  constructor(private readonly env: Env) {}

  async getGrantByInteraction(interactionId: string, nonce: string) {
    const response = await axios.get(
      `${this.env.RAFIKI_AUTH_DOMAIN}/grant/${interactionId}/${nonce}`,
      {
        headers: {
          'x-idp-secret': this.env.RAFIKI_AUTH_IDENTITY_SERVER_SECRET
        }
      }
    )

    return response.data as unknown
  }

  async setInteractionResponse(
    interactionId: string,
    nonce: string,
    response: 'accept' | 'reject'
  ) {
    const result = await axios.post(
      `${this.env.RAFIKI_AUTH_DOMAIN}/grant/${interactionId}/${nonce}/${response}`,
      {},
      {
        headers: {
          'x-idp-secret': this.env.RAFIKI_AUTH_IDENTITY_SERVER_SECRET
        }
      }
    )

    return result.data as unknown
  }
}
