import { env } from '../../config/env.js'
import { createBackendGraphQLClient } from './clients/signed-graphql-client.js'
import { RafikiClient } from './rafiki-client.js'


export function createRafikiClient() {
  const backendGraphqlClient = createBackendGraphQLClient(env)

  return new RafikiClient(backendGraphqlClient)
}