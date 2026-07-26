import axios from 'axios'
import { env } from '../config/env.js'

export const coreClient = axios.create({
  baseURL: env.CORE_API_URL,
  timeout: 10_000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  }
})

export async function createDestinationResolution(payload: unknown) {
  const response = await coreClient.post('/destination-resolutions', payload)
  return response.data
}

