# Mojaly Scope

This document defines what the initial Mojaly build covers, what it deliberately excludes, and the constraints the implementation has to work within. It should be read alongside `project_overview.md` (what Mojaly is and why) and the architecture decision notes (how it's built).

## Goal

Mojaly aims to simplify the entire cross-border payment infrastructure for fintechs by providing a single, unified API that connects them to a pool of Account Servicing Entities (ASEs), enabling multi-currency payments without the need for multiple accounts, integrations, or pre-funded liquidity positions.

## Objectives

- Enable fintechs to operate across multiple payment corridors using just a single settlement partner (i.e. one bank account)
- Provide real-time access to a pool of ASEs that hold multiple currency assets
- Automatically route each payment through the ASE offering the best available exchange rate
- Eliminate the need for fintechs to manage individual relationships with multiple liquidity providers
- Reduce the technical burden by replacing multiple API integrations with a single Mojaly API

## In Scope

### Built

- Payment routing core: a fintech-facing payment destination is resolved to a partner route by country, destination type, network, and asset code, then executed as a payout through a partner adapter and tracked through status callbacks (`services/core`, `services/partner-adapter`)
- Hosted Open Payments/Interledger layer via Rafiki — wallet addresses, quotes, receivers, incoming/outgoing payments, and admin GraphQL access, so non-ILP partners are reachable through the same infrastructure without running Rafiki or an ILP connector themselves (`services/core/src/modules/rafiki`)
- Partner adapter framework with two working vendor integrations: Griffin (mobile money) and KCB (bank, including auth and settlement callback handling) (`services/partner-adapter/src/vendors`)
- A thin API gateway that forwards fintech-facing requests to Core (`services/api-gateway`)

### Planned for the initial build (not yet started)

- Real-time exchange rate comparison across ASEs — routing today is a deterministic capability lookup (country + destination type + network + asset code), not rate-based selection
- Compliance and Know Your Business (KYB) onboarding for fintechs — no onboarding flow, developer console, or API key issuance exists yet (`apps/developer-console`, `apps/admin-console` are placeholders only)
- Settlement instruction management and reporting/reconciliation tools for fintechs and ASEs — only per-payment status callbacks exist today; `services/settlement-service` and `services/webhook-service` are unimplemented placeholders

```text
ILP_PEER            -> partner runs Rafiki or another ILP connector; Mojaly peers directly
HOSTED_ILP_RAIL      -> non-ILP partner represented through Mojaly's Open Payments layer
BANK_ADAPTER         -> bank connected via banking API, settlement file, or dashboard
MOBILE_MONEY_ADAPTER -> mobile money provider/aggregator via payout/collection API
SETTLEMENT_PARTNER   -> used mainly to settle obligations, even if not the payout destination
```

## Out of Scope (Initial Phase)

- Direct licensing on behalf of fintechs (Mojaly will not hold licenses in every market at launch)
- Consumer-facing payment products or wallets
- Cryptocurrency or blockchain settlement (unless specified in a future phase)
- Persistent storage: the current build keeps payment intents, partner routing, and payouts in in-memory stores (plain `Map`s) as a working prototype. PostgreSQL is the intended system of record for Mojaly's own business/relational data (fintechs, partners, corridors, quotes, payments, liquidity reservations, settlement obligations/batches, reconciliation, event outbox), but that wiring — and `packages/shared-db` — has not been built yet.
- TigerBeetle as a Mojaly-owned data store — not wired into the current codebase and not planned for Mojaly's own schema. TigerBeetle only applies, if adopted later, inside Rafiki's own ILP packet-level accounting.

## Constraints

| Constraint        | Description                                                                                                                                                                                                                                   |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Regulatory        | Mojaly must ensure ASEs in its network are properly licensed in their respective markets. Mojaly itself may need to be regulated as a payment service infrastructure provider depending on the legal framework of the markets it operates in. |
| FX Risk           | Exchange rate volatility between quote and settlement must be managed carefully.                                                                                                                                                              |
| Settlement Timing | Differences in settlement windows across ASEs and banks may affect payment speed.                                                                                                                                                             |
| Liquidity Depth   | ASEs must hold sufficient assets to fulfil payment volumes in each corridor.                                                                                                                                                                  |
| Data Privacy      | All payment data must comply with relevant data protection regulations (e.g. GDPR, local laws).                                                                                                                                               |
