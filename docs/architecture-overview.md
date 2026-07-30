# Architecture Overview

Mojaly is structured as a platform around one public fintech API and multiple execution paths.

```mermaid
flowchart LR
  fintech["Fintech Platform"]
  console["Mojaly Console"]
  docs["Mojaly Documentation"]

  subgraph mojaly["Mojaly Platform"]
    gateway["API Gateway"]
    core["Mojaly Core"]
    resolver["Destination Resolution"]
    capacity["Settlement Capacity"]
    intents["Payment Intents"]
    webhooks["Webhook Service"]
    postgres[("PostgreSQL")]
    tigerbeetle[("TigerBeetle")]
  end

  subgraph rafiki["Rafiki / Open Payments"]
    opapi["Open Payments APIs"]
    auth["Auth Server"]
    connector["ILP Connector"]
    walletAddresses["Wallet Addresses"]
  end

  subgraph partners["Partner Institutions"]
    griffin["Griffin / Bank Partner"]
    mtn["MTN / Mobile Money Partner"]
    futurePartner["Other ASE / Rail Partner"]
  end

  recipient["End Recipient"]

  fintech -->|"API requests"| gateway
  console -->|"workspace, KYB, keys"| gateway
  docs -.->|"integration guidance"| fintech

  gateway --> core
  core --> resolver
  core --> capacity
  core --> intents
  core --> postgres
  capacity --> tigerbeetle

  resolver -->|"select partner wallet address"| walletAddresses
  core -->|"signed admin calls"| opapi
  core -->|"grant / token flow"| auth
  opapi --> connector
  connector -->|"ILP value movement"| partners

  partners -->|"partner APIs / callbacks"| core
  core -->|"payout instruction"| griffin
  core -->|"payout instruction"| mtn
  core -->|"payout instruction"| futurePartner

  griffin --> recipient
  mtn --> recipient
  futurePartner --> recipient

  core --> webhooks
  webhooks -->|"payment events"| fintech
```

## Main Components

### API Gateway

Receives fintech API requests, authenticates API keys, validates payloads, and forwards valid requests to Mojaly Core.

### Mojaly Core

Handles quotes, route selection, payment orchestration, and business rules.

### Rafiki Integration

Provides Mojaly's Open Payments and Interledger execution path.

### Partner Adapter

Connects non-Rafiki partners such as banks and mobile-money providers to Mojaly's internal payment flow.

### Settlement Service

Tracks settlement batches, reconciliation, partner reports, and settlement status.

### Webhook Service

Delivers payment and settlement events back to fintechs.

### Ledger Service

Future service for TigerBeetle account and transfer operations.
