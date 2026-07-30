# Rafiki's Role

Rafiki is the Interledger/Open Payments engine Mojaly runs and administers. Mojaly does not reimplement wallet addresses, GNAP authorization, ILP packet routing, or payment-state machines — it drives Rafiki through its Admin GraphQL API and consumes its webhooks. This document describes what Rafiki actually does for Mojaly today, based on `infrastructure/rafiki` and `services/core/src/modules/rafiki`.

## What Mojaly runs

`infrastructure/rafiki/docker-compose.yml` stands up a self-hosted Rafiki instance:

- `rafiki-backend` — Open Payments resource server, ILP connector, and the Admin GraphQL API Mojaly talks to. Backed by Postgres, Redis, and TigerBeetle (TigerBeetle here is Rafiki's own packet-level ledger — see the note in [scope.md](../01-foundation/scope.md), Mojaly's own business data does not live in it).
- `rafiki-auth` — the GNAP authorization server (grant requests, continuation, introspection).
- `rafiki-frontend` — Rafiki's own operator UI (not Mojaly's developer/admin console, which is a separate, unbuilt app).
- `kratos` — identity provider backing the auth server's interactive grant flow (see [open-payments-flow.md](open-payments-flow.md)).
- `nginx` — TLS-terminating edge exposing the stack under `mojaly.local`, `auth.mojaly.local`, `ilp.mojaly.local`, and `admin.mojaly.local`.

Everything else Mojaly owns — fintech-facing API, partner routing, payout execution, settlement tracking — is deliberately kept out of the Rafiki codebase so the Rafiki images can keep tracking upstream.

## How Core talks to Rafiki

`services/core/src/modules/rafiki` is a typed client over Rafiki's Admin GraphQL schema (generated types in `backend/generated/graphql.ts` and `auth/generated/graphql.ts`, request builders under `backend/request/*.ts` and `auth/request/grant.request.ts`).

- `rafiki.factory.ts` builds the client; `rafiki-client.ts` (`RafikiClient`) wraps mutations/queries for assets, wallet addresses (+ keys), receivers, quotes, outgoing payments (create/cancel), and liquidity deposit/withdraw.
- `clients/signed-graphql-client.ts` signs every request: it canonicalizes the GraphQL body, HMACs it with `RAFIKI_ADMIN_API_SECRET`, and sets `signature` and `tenant-id` headers — the same scheme Rafiki's Admin API expects from its operators. `auth/service.ts` (`RafikiAuthService`) does the same for the GNAP auth server's Admin GraphQL (grants list/get/revoke).
- Only one route is currently wired up in `app.ts`: `GET /internal/rafiki/assets` (`rafiki.routes.ts`), which lists Rafiki assets. It exists mainly as a smoke-test endpoint for the Admin GraphQL connection.

**`controller.ts`, `service.ts`, and `kratos.service.ts` in this module are not wired into `app.ts` and are not imported anywhere in the codebase.** They're leftover reference code from a different Rafiki-based wallet project (imports like `@/gatehub/client`, `@wallet/shared`, `@/socket/messageType` don't exist in this repo) and describe a GateHub-backed wallet webhook flow Mojaly does not use. The webhook handler Mojaly actually runs lives in `services/core/src/modules/rafiki-webhooks/`, described below and in [open-payments-flow.md](open-payments-flow.md).

## Multi-tenancy: one Rafiki tenant per partner

Each partner Mojaly settles through is modeled as its own Rafiki tenant. `services/core/src/modules/partner-routing/partner-routing.store.ts` pairs a `RoutingPartner` with a `rafikiTenantId` (e.g. Griffin and MTN Uganda each have their own tenant ID) and a settlement `PartnerWalletAddress` hosted on Rafiki (`https://mojaly.local/griffin/settlement`, `https://mojaly.local/mtn-ug/settlement`). Resolving a payment destination resolves to one of these wallet addresses — Rafiki receives funds on that wallet address, Mojaly's partner-adapter turns that into a real-world payout.

## What Rafiki is used for vs. what it isn't

| Concern | Handled by |
| --- | --- |
| Wallet addresses, GNAP grants, quotes, ILP packet settlement, receiver/incoming/outgoing payment lifecycle | Rafiki |
| Deciding which partner/country/asset a payment routes to | Mojaly Core (`partner-routing` — a static capability lookup today, not Rafiki) |
| Turning settled funds into a bank transfer or mobile-money payout | Mojaly `partner-adapter` (Griffin, KCB vendor clients) |
| Fintech-facing API, KYB, API keys | Not built yet (see [scope.md](../01-foundation/scope.md)) |

Rafiki is the funding leg of a Mojaly payment: it gets value from a sender's wallet into one of Mojaly's hosted settlement wallet addresses. Everything after that — matching the funded payment back to a payout, and executing that payout — is Mojaly/partner-adapter logic, not Rafiki.
