# Services

Backend services live here. Each service should own one clear responsibility.

Planned services:

- `api-gateway` - public fintech API, authentication, request validation, and API versioning.
- `core` - quotes, route selection, payment orchestration, and business rules.
- `partner-adapter` - hosted adapters for bank and mobile-money partners that do not run Rafiki.
- `webhook-service` - webhook endpoint management and event delivery.
- `settlement-service` - settlement batches, partner settlement tracking, and reconciliation workflow.
- `ledger-service` - future TigerBeetle integration for account and transfer operations.
