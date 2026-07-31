# Mojaly Scope

This document defines what the initial Mojaly build covers, what it deliberately excludes, and the constraints the implementation has to work within. It should be read alongside `project_overview.md` and the architecture decision notes.

## Goal

Mojaly aims to simplify cross-border payment infrastructure for fintechs by providing a single API that connects them to partner Account Servicing Entities, banks, mobile-money providers, and Interledger-enabled routes.

The goal is not for every fintech or partner to run Rafiki. Mojaly runs the Open Payments and Interledger layer, then connects non-ILP partners through hosted partner routes and adapters.

## Objectives

- Enable fintechs to operate across multiple payment corridors through one Mojaly integration
- Reduce the need for fintechs to build separate partner integrations per country
- Represent partner-backed payout capability through Mojaly routes and wallet addresses
- Keep Rafiki responsible for Open Payments and Interledger protocol behavior
- Keep partner-specific API logic inside partner adapters
- Provide a foundation for settlement, reconciliation, and liquidity visibility

## In Scope

### Built

- Payment routing core: a fintech-facing destination is resolved to a partner route by country, destination type, network, and asset code (`services/core`)
- Payment intent tracking: resolved destinations are stored as payment intents and later updated through partner payout callbacks (`services/core`)
- Signed Rafiki Admin GraphQL access: Core can make signed operator requests to Rafiki and list configured Rafiki assets (`services/core/src/modules/rafiki`)
- Partner adapter framework: Core sends normalized payout instructions to adapter implementations instead of containing vendor-specific API logic (`services/partner-adapter`)
- Griffin adapter: bank-account payout path implemented for Griffin, including payee creation, payment creation, payment submission, webhook-first status handling, HTTP signature verification for Griffin webhooks, and callback notification to Core
- MTN Uganda adapter: mobile-money disbursement path implemented with OAuth token handling, transfer creation, MTN callback handling, and transaction-status fallback because MTN callbacks are one-shot
- Safaricom Daraja adapter: M-Pesa B2C payout path implemented with OAuth token handling, B2C request creation, result callback handling, timeout callback handling, and transaction-status fallback

### Planned for the initial build

- Full Open Payments payment lifecycle through Rafiki: wallet resolution, grants, quotes, incoming/outgoing payments, and Rafiki payment webhook handling are not complete yet
- Automatic partner payout after confirmed Rafiki funding: partner adapters exist, but the complete Rafiki-funded-to-partner-payout chain is still being wired
- Real-time exchange rate comparison across ASEs: routing today is a deterministic capability lookup, not rate-based route optimization
- Compliance and Know Your Business onboarding for fintechs
- Developer console production workflow: API key issuance, workspace approval, and dashboard views need to be connected to the final backend model
- Settlement instruction management, reconciliation, and reporting tools for fintechs and partners
- Persistent storage for Core and Partner Adapter state

## Core Service Scope

| Area | Current status | Scope note |
| --- | --- | --- |
| Destination resolution | Done | Core resolves a fintech-facing destination by country, destination type, network, and asset code. |
| Partner route lookup | Done | Core selects a Mojaly route definition that can serve the requested destination. |
| Payment intent tracking | Done | Core creates and tracks payment intents as the internal business object for a payment request. |
| Partner payout callbacks | Done | Core receives normalized payout results from partner adapters and updates payment intent state. |
| Rafiki funding trigger | Partially done | Core has funding-confirmed handling, but the full Rafiki-funded-to-partner-payout chain is not complete. |
| Rafiki Admin integration | Partially done | Core can read operator-level configuration from Mojaly's Rafiki instance. Full Open Payments lifecycle integration is still pending. |
| Persistent storage | Not done yet | Payment intents, partner capabilities, wallet routes, and event history still need durable storage. |
| Open Payments lifecycle | Not done yet | Grants, quotes, incoming payments, outgoing payments, and Rafiki webhook correlation still need to be completed. |
| Idempotency | Not done yet | Core still needs duplicate-event protection for callbacks and Rafiki webhooks. |
| Settlement capacity checks | Not done yet | Core still needs to check partner capacity before approving or executing payouts. |
| Pricing and route scoring | Not done yet | Core still needs route pricing, rate selection, and partner liquidity scoring. |
| Reconciliation | Not done yet | Settlement batches, reconciliation, and operational reporting still need to be implemented. |
| Workspace and KYB integration | Not done yet | Production workspace approval, KYB, and API-key workflows still need to connect to Core. |
| Vendor API execution | Not Core responsibility | Griffin, MTN, Safaricom, KCB, and other vendor-specific API calls belong in partner adapters. |
| Open Payments protocol internals | Not Core responsibility | GNAP grants, ILP routing, and Rafiki connector internals belong to Rafiki. |
| Ledger accounting | Not Core responsibility | Protocol-level ledger accounting belongs to Rafiki and TigerBeetle where applicable. |
| Custody of customer funds | Not Core responsibility | Core coordinates Mojaly business state and partner execution; it does not directly hold customer funds. |

## Partner Route Types

```text
ILP_PEER            -> partner runs Rafiki or another ILP connector; Mojaly peers directly
HOSTED_ILP_RAIL      -> non-ILP partner represented through Mojaly's Open Payments layer
BANK_ADAPTER         -> bank connected through a banking API, settlement file, or dashboard
MOBILE_MONEY_ADAPTER -> mobile-money provider or aggregator connected through payout APIs
SETTLEMENT_PARTNER   -> used mainly to settle obligations, even if not the payout destination
```

## Current Partner Coverage

| Partner | Route type | Current status |
| --- | --- | --- |
| Griffin | Bank adapter | Implemented for GBP bank-account payouts, webhook-first status updates, and signed webhook verification |
| MTN Uganda | Mobile-money adapter | Implemented for mobile-money disbursement, callback handling, and status-query fallback |
| Safaricom Daraja | Mobile-money adapter | Implemented for M-Pesa B2C payout, result/timeout callbacks, and transaction-status fallback |

The adapters are credential-ready. Live operation still depends on valid sandbox or production credentials, provider onboarding, callback URLs, and partner-specific approval.

## Out of Scope

- Direct licensing on behalf of fintechs
- Consumer-facing wallets or consumer payment products
- Cryptocurrency or blockchain settlement unless specified in a future phase
- Persistent storage is not complete: the current Core and Partner Adapter paths still keep payment intents, partner routing, and payouts in in-memory stores. PostgreSQL is the intended system of record for Mojaly's own business and relational data, but that wiring is not complete.
- TigerBeetle as a Mojaly-owned data store is not wired into the current codebase. If adopted later, it should be used for ledger-style transfer accounting, not as a replacement for relational Mojaly business data.

## Constraints

| Constraint | Description |
| --- | --- |
| Regulatory | Mojaly must ensure partners are properly licensed in their respective markets. Mojaly may also need regulatory approval depending on the markets and services offered. |
| Partner access | Real payouts depend on approved partner credentials, whitelisted accounts, callback URLs, and sandbox or production access. |
| FX risk | Exchange-rate movement between quote, funding, payout, and settlement must be controlled. |
| Settlement timing | Partner settlement windows may differ across banks, mobile-money providers, and countries. |
| Liquidity depth | Partners must have sufficient capacity for the corridors they support. |
| Data privacy | Payment and customer data must comply with relevant local and international data protection laws. |
