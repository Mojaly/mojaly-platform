# Fintech Console API Contract

This document defines the API contract for the Mojaly fintech console only.

The fintech console is used by fintech teams to onboard, manage their workspace, view balances, create developer keys, view payment activity, and manage webhook configuration. It should not expose Mojaly admin operations or internal system actions.

## Base URLs

| Service | Local URL | Console usage |
| --- | --- | --- |
| Core | `http://localhost:5050` | Workspace, KYB, accounts, balances, wallet addresses, developer keys, payments, transactions |
| API Gateway | `http://localhost:5060` | Fintech-facing payment API testing and docs integration |

The console should not call the Partner Adapter directly.

## Response Format

Single resource:

```json
{
  "data": {}
}
```

List:

```json
{
  "data": []
}
```

Error:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request",
    "details": {}
  }
}
```

## 1. Session And Current Workspace

Authentication is not finalized yet. For the minimal console, the selected `workspaceId` can be stored in local app state or local storage after onboarding.

Later, this should be replaced by real identity/session handling through the chosen auth provider.

### Get Current Workspace

`GET /workspaces/:workspaceId`

Used by:

- Home page
- Sidebar workspace switcher
- Onboarding status banner
- Settings page

Response:

```json
{
  "data": {
    "id": "workspace-id",
    "businessName": "JanjaPay Limited",
    "tradingName": "JanjaPay",
    "businessType": "fintech",
    "country": "KE",
    "ownerEmail": "founder@janjapay.test",
    "status": "ACTIVE",
    "kybStatus": "APPROVED",
    "createdAt": "2026-08-08T00:00:00.000Z",
    "updatedAt": "2026-08-08T00:00:00.000Z"
  }
}
```

## 2. Onboarding

The fintech console owns the self-service onboarding flow.

### Create Workspace

`POST /workspaces`

Used when a fintech starts onboarding.

Request:

```json
{
  "businessName": "JanjaPay Limited",
  "tradingName": "JanjaPay",
  "businessType": "fintech",
  "country": "KE",
  "ownerEmail": "founder@janjapay.test"
}
```

Response:

```json
{
  "data": {
    "id": "workspace-id",
    "businessName": "JanjaPay Limited",
    "tradingName": "JanjaPay",
    "businessType": "fintech",
    "country": "KE",
    "ownerEmail": "founder@janjapay.test",
    "status": "PENDING",
    "kybStatus": "NOT_SUBMITTED",
    "createdAt": "2026-08-08T00:00:00.000Z",
    "updatedAt": "2026-08-08T00:00:00.000Z"
  }
}
```

### Submit KYB

`POST /workspaces/:workspaceId/submit-kyb`

Used when the fintech submits business verification details.

Request:

```json
{
  "registrationNumber": "PVT-123456",
  "taxId": "A123456789B",
  "registeredAddress": "Westlands, Nairobi",
  "operatingCountries": ["KE", "UG"],
  "website": "https://janjapay.test",
  "contactName": "Jane Founder",
  "contactEmail": "founder@janjapay.test"
}
```

Response:

```json
{
  "data": {
    "workspaceId": "workspace-id",
    "registrationNumber": "PVT-123456",
    "taxId": "A123456789B",
    "registeredAddress": "Westlands, Nairobi",
    "operatingCountries": ["KE", "UG"],
    "website": "https://janjapay.test",
    "contactName": "Jane Founder",
    "contactEmail": "founder@janjapay.test",
    "status": "SUBMITTED",
    "submittedAt": "2026-08-08T00:00:00.000Z"
  }
}
```

### Get KYB Status

`GET /workspaces/:workspaceId/kyb`

Used by the onboarding page to show whether the fintech is still pending review or approved.

## 3. Home Summary

The home page should compose a summary from workspace, account, balance, payment, and transaction endpoints.

### Required Calls

| Data | Endpoint |
| --- | --- |
| Workspace status | `GET /workspaces/:workspaceId` |
| Accounts | `GET /workspaces/:workspaceId/accounts` |
| Wallet addresses | `GET /workspaces/:workspaceId/wallet-addresses` |
| Developer keys | `GET /workspaces/:workspaceId/developer-keys` |
| Recent payments | `GET /payment-intents` |
| Recent transactions | `GET /transactions` |

The frontend should filter global activity by workspace where the backend response contains workspace/account/wallet identifiers. A workspace-scoped activity endpoint should be added later.

## 4. Accounts And Balances

Accounts represent fintech balances backed by partner accounts.

### List Workspace Accounts

`GET /workspaces/:workspaceId/accounts`

Used by:

- Balances page
- Account selector
- Wallet address creation flow

Response:

```json
{
  "data": [
    {
      "id": "account-id",
      "workspaceId": "workspace-id",
      "fintechId": "workspace-id",
      "name": "JanjaPay Griffin GBP",
      "partnerCode": "GRIFFIN",
      "externalPartnerAccountId": "ba.O3MN5dnrUBmCdfMbJcHS0w",
      "assetCode": "GBP",
      "assetScale": 2,
      "rafikiAssetId": "c69e69bf-5d39-4ca0-a955-26301aaf01ac",
      "status": "ACTIVE",
      "createdAt": "2026-08-08T00:00:00.000Z",
      "updatedAt": "2026-08-08T00:00:00.000Z"
    }
  ]
}
```

### Get Account

`GET /accounts/:accountId`

Used by account detail pages.

### Get Account Balance

`GET /accounts/:accountId/balance`

Used by the balances page.

Response:

```json
{
  "data": {
    "partnerCode": "GRIFFIN",
    "externalAccountId": "ba.O3MN5dnrUBmCdfMbJcHS0w",
    "assetCode": "GBP",
    "assetScale": 2,
    "available": "99995000",
    "rawResponse": {}
  }
}
```

## 5. Wallet Addresses

Wallet addresses are the fintech's Open Payments-facing identities.

### Create Wallet Address

`POST /workspaces/:workspaceId/accounts/:accountId/wallet-addresses`

Used when a fintech creates an Open Payments wallet address for an account.

Request:

```json
{
  "walletAddressName": "janjapay-gbp",
  "publicName": "JanjaPay GBP"
}
```

Response:

```json
{
  "data": {
    "id": "wallet-address-id",
    "workspaceId": "workspace-id",
    "accountId": "account-id",
    "address": "https://mojaly.local/janjapay-gbp",
    "publicName": "JanjaPay GBP",
    "status": "ACTIVE",
    "createdAt": "2026-08-08T00:00:00.000Z",
    "updatedAt": "2026-08-08T00:00:00.000Z"
  }
}
```

### List Workspace Wallet Addresses

`GET /workspaces/:workspaceId/wallet-addresses`

Used by:

- Developer settings
- API key creation
- Open Payments setup guide

### List Account Wallet Addresses

`GET /accounts/:accountId/wallet-addresses`

Used by account detail pages.

### Get Wallet Address

`GET /wallet-addresses/:walletAddressId`

Used by wallet address detail pages.

## 6. Developer Keys

Developer keys let a fintech use the Open Payments SDK with a Mojaly wallet address.

### Create Developer Key

`POST /workspaces/:workspaceId/wallet-addresses/:walletAddressId/developer-keys`

Used by the API keys page.

Request:

```json
{
  "name": "Production key"
}
```

Response:

```json
{
  "data": {
    "key": {
      "id": "developer-key-id",
      "name": "Production key",
      "status": "ACTIVE",
      "createdAt": "2026-08-08T00:00:00.000Z"
    },
    "privateKey": "-----BEGIN PRIVATE KEY-----...",
    "publicKey": {},
    "keyId": "keyid-example",
    "walletAddressUrl": "https://mojaly.local/janjapay-gbp"
  }
}
```

Frontend rule:

- Show `privateKey` only once.
- Encourage the fintech to download or copy it immediately.
- Store/display `keyId` and `walletAddressUrl` for SDK setup.

### List Workspace Developer Keys

`GET /workspaces/:workspaceId/developer-keys`

Used by the API keys page.

### List Wallet Developer Keys

`GET /workspaces/:workspaceId/wallet-addresses/:walletAddressId/developer-keys`

Used by wallet address detail pages.

### Revoke Developer Key

`POST /workspaces/:workspaceId/wallet-addresses/:walletAddressId/developer-keys/:keyId/revoke`

Used by the API keys page.

## 7. Payments

The fintech console should display payments. It should not be the primary place where fintechs create payments manually. Payment creation should happen programmatically through Mojaly APIs.

### List Payments

`GET /payment-intents`

Used by the payments page.

Response:

```json
{
  "data": [
    {
      "id": "payment-intent-id",
      "fintechId": "workspace-id",
      "destination": {
        "type": "bank_account",
        "country": "GB",
        "account": "35890906",
        "bankCode": "000000",
        "name": "John Doe"
      },
      "amount": {
        "value": "1000",
        "assetCode": "GBP",
        "assetScale": 2
      },
      "partnerCode": "GRIFFIN",
      "walletAddress": "https://mojaly.local/griffin/settlement",
      "status": "RESOLVED",
      "reference": "invoice-001",
      "createdAt": "2026-08-08T00:00:00.000Z",
      "updatedAt": "2026-08-08T00:00:00.000Z"
    }
  ]
}
```

### Get Payment

`GET /payment-intents/:paymentIntentId`

Used by payment details.

## 8. Quotes

For the current minimal build, quotes are represented by resolved payment intents.

The quotes page should show:

- Destination
- Source asset
- Destination country/network
- Chosen partner
- Resolved wallet address
- Expiry time
- Status

### List Quotes

`GET /payment-intents`

Frontend should render this as quote/resolution history when used on the quotes tab.

### Get Quote

`GET /payment-intents/:paymentIntentId`

Used by quote details.

## 9. Transactions

Transactions show account-level activity.

### List Account Transactions

`GET /accounts/:accountId/transactions`

Used by:

- Balances page
- Transactions page
- Account detail page

Response:

```json
{
  "data": [
    {
      "id": "transaction-id",
      "paymentId": "payment-id",
      "accountId": "account-id",
      "walletAddressId": "wallet-address-id",
      "paymentIntentId": "payment-intent-id",
      "assetCode": "GBP",
      "assetScale": 2,
      "value": "1000",
      "type": "OUTGOING",
      "status": "COMPLETED",
      "source": "PARTNER",
      "description": "Partner confirmed payout",
      "partnerReference": "partner-reference",
      "createdAt": "2026-08-08T00:00:00.000Z",
      "updatedAt": "2026-08-08T00:00:00.000Z"
    }
  ]
}
```

### Get Transaction

`GET /transactions/:transactionId`

Used by transaction details.

## 10. Webhooks

The fintech console should let fintechs manage webhook endpoints and inspect delivery history.

These endpoints are part of the expected console contract, but the current minimal backend still needs the console-facing routes to be exposed.

### List Webhook Endpoints

`GET /workspaces/:workspaceId/webhook-endpoints`

Expected response:

```json
{
  "data": [
    {
      "id": "webhook-endpoint-id",
      "workspaceId": "workspace-id",
      "url": "https://api.janjapay.test/mojaly/webhooks",
      "events": ["payment.completed", "payment.failed"],
      "status": "ACTIVE",
      "createdAt": "2026-08-08T00:00:00.000Z",
      "updatedAt": "2026-08-08T00:00:00.000Z"
    }
  ]
}
```

### Create Webhook Endpoint

`POST /workspaces/:workspaceId/webhook-endpoints`

Expected request:

```json
{
  "url": "https://api.janjapay.test/mojaly/webhooks",
  "events": ["payment.completed", "payment.failed"]
}
```

### Update Webhook Endpoint

`PATCH /workspaces/:workspaceId/webhook-endpoints/:webhookEndpointId`

Expected request:

```json
{
  "url": "https://api.janjapay.test/mojaly/webhooks",
  "events": ["payment.completed", "payment.failed"],
  "status": "ACTIVE"
}
```

### Delete Webhook Endpoint

`DELETE /workspaces/:workspaceId/webhook-endpoints/:webhookEndpointId`

### List Webhook Events

`GET /workspaces/:workspaceId/webhook-events`

Expected response:

```json
{
  "data": [
    {
      "id": "webhook-event-id",
      "workspaceId": "workspace-id",
      "source": "RAFIKI",
      "eventType": "payment.completed",
      "status": "HANDLED",
      "relatedPaymentIntentId": "payment-intent-id",
      "createdAt": "2026-08-08T00:00:00.000Z"
    }
  ]
}
```

## 11. Developer Docs Try-It Flow

The developer docs can use the Gateway endpoint to simulate how fintech developers resolve destinations.

### Resolve Destination

`POST /v1/payment-destinations/resolve`

Gateway URL: `http://localhost:5060`

Request:

```json
{
  "fintechId": "workspace-id",
  "destination": {
    "type": "bank_account",
    "country": "GB",
    "account": "35890906",
    "bankCode": "000000",
    "name": "John Doe"
  },
  "amount": {
    "value": "1000",
    "assetCode": "GBP",
    "assetScale": 2
  },
  "reference": "invoice-001"
}
```

Response:

```json
{
  "data": {
    "paymentIntentId": "payment-intent-id",
    "walletAddress": "https://mojaly.local/griffin/settlement",
    "paymentReference": "payment-intent-id",
    "partnerCode": "GRIFFIN",
    "status": "RESOLVED",
    "expiresAt": "2026-08-08T00:10:00.000Z"
  }
}
```

## Screen To Endpoint Map

| Console screen | Endpoints |
| --- | --- |
| Onboarding | `POST /workspaces`, `POST /workspaces/:workspaceId/submit-kyb`, `GET /workspaces/:workspaceId`, `GET /workspaces/:workspaceId/kyb` |
| Home | `GET /workspaces/:workspaceId`, `GET /workspaces/:workspaceId/accounts`, `GET /workspaces/:workspaceId/wallet-addresses`, `GET /workspaces/:workspaceId/developer-keys`, `GET /payment-intents` |
| Balances | `GET /workspaces/:workspaceId/accounts`, `GET /accounts/:accountId/balance`, `GET /accounts/:accountId/transactions` |
| Payments | `GET /payment-intents`, `GET /payment-intents/:paymentIntentId` |
| Quotes | `GET /payment-intents`, `GET /payment-intents/:paymentIntentId` |
| API Keys | `GET /workspaces/:workspaceId/developer-keys`, `POST /workspaces/:workspaceId/wallet-addresses/:walletAddressId/developer-keys`, `POST /workspaces/:workspaceId/wallet-addresses/:walletAddressId/developer-keys/:keyId/revoke` |
| Wallet Addresses | `GET /workspaces/:workspaceId/wallet-addresses`, `POST /workspaces/:workspaceId/accounts/:accountId/wallet-addresses` |
| Webhooks | `GET /workspaces/:workspaceId/webhook-endpoints`, `POST /workspaces/:workspaceId/webhook-endpoints`, `PATCH /workspaces/:workspaceId/webhook-endpoints/:webhookEndpointId`, `DELETE /workspaces/:workspaceId/webhook-endpoints/:webhookEndpointId`, `GET /workspaces/:workspaceId/webhook-events` |

## Not For The Fintech Console

Do not expose these as normal fintech console actions:

- Approve, reject, or suspend workspaces.
- Create transactions manually.
- Update transaction status manually.
- Call partner adapter payout endpoints directly.
- Call Rafiki admin endpoints directly.
- Create global partner routes or partner capabilities.
