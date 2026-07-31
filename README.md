# Mojaly Platform

Mojaly is a payment infrastructure platform for fintechs that want one integration for cross-border payments across Interledger-enabled routes, banks, and mobile-money partners.

Mojaly uses Rafiki for Open Payments and Interledger capabilities, while Mojaly services handle business routing, partner adapters, destination resolution, and operational workflows.

## Documentation

| Document | Purpose |
| --- | --- |
| [Project overview](docs/01-foundation/project%20overview.md) | Explains the problem Mojaly solves, the target users, and the product direction. |
| [Scope](docs/01-foundation/scope.md) | Defines what is currently in scope, what has been built, what is pending, and what Mojaly will not own. |
| [Architecture overview](docs/01-foundation/architecture%20overview.md) | Describes the high-level system architecture and how the major pieces fit together. |
| [Core service](docs/core-service.md) | Documents the Mojaly Core service, its role, and its boundaries. |
| [Partner adapters](docs/partner-adapters.md) | Explains how Mojaly connects to external banks, mobile-money providers, and payout partners. |
| [Rafiki integration](docs/rafiki-integration.md) | Explains how Mojaly integrates with Rafiki, Open Payments, wallet addresses, and webhooks. |
| [Architecture diagram](docs/assets/diagrams/mojaly_system_architecture.png) | Visual architecture diagram for the full Mojaly platform. |
| [Use-case diagram](docs/assets/diagrams/mojaly-usecase-diagram.png) | Shows the main actors and system use cases. |
| [Sequence diagram](docs/assets/diagrams/mojaly-sequence-diagrame.png) | Shows the main payment flow between fintechs, Mojaly, Rafiki, and partners. |

## Repository Layout

```text
apps/             User-facing applications such as console, docs, and admin UI
services/         Backend services such as API gateway, core, partner adapter, webhooks, ledger, and settlement
packages/         Shared libraries, types, config, and utilities
integrations/     External platform integration work, including Open Payments and Rafiki client experiments
infrastructure/   Docker, database, deployment, and local development infrastructure
docs/             Architecture, scope, service documentation, diagrams, and system analysis material
bruno/            API collections for manual testing
```

## Main Components

| Component | Location | Role |
| --- | --- | --- |
| API Gateway | `services/api-gateway` | Public entry point for fintech-facing APIs. |
| Core Service | `services/core` | Owns Mojaly business state, destination resolution, payment intent tracking, and Rafiki coordination. |
| Partner Adapter | `services/partner-adapter` | Connects Mojaly to partner APIs such as Griffin, MTN, and Safaricom. |
| Webhook Service | `services/webhook-service` | Handles outbound webhook delivery and event notification workflows. |
| Ledger Service | `services/ledger-service` | Placeholder for Mojaly ledger/accounting workflows. |
| Settlement Service | `services/settlement-service` | Placeholder for settlement and reconciliation workflows. |
| Rafiki Infrastructure | `infrastructure/rafiki` | Local Rafiki deployment used by Mojaly for Open Payments and Interledger integration. |

## Local Development

Install dependencies:

```bash
pnpm install
```

Run an individual service:

```bash
pnpm --filter core dev
pnpm --filter partner-adapter dev
pnpm --filter api-gateway dev
```

Run Rafiki infrastructure from its folder:

```bash
cd infrastructure/rafiki
docker compose up --build
```

## Project Status

Mojaly is still under active development. The current build focuses on proving the architecture:

- Rafiki can run as Mojaly's Open Payments and Interledger layer.
- Mojaly Core can resolve destinations and coordinate payment intent state.
- Partner adapters can execute payouts through external provider APIs.
- The architecture separates Mojaly business logic from Rafiki core so Rafiki can continue to be updated independently.

For the exact current scope, see [Mojaly Scope](docs/01-foundation/scope.md).
