# Mojaly Platform

Mojaly is a payment infrastructure platform that lets fintechs integrate once and access multiple payment routes through Interledger, Rafiki/Open Payments, and hosted partner adapters.

This repository is structured as a clean monorepo. The goal is to keep Mojaly business logic separate from Rafiki core so Rafiki can continue to be updated from the open-source upstream project.

## Core Idea

Fintechs call one Mojaly API. Mojaly normalizes the request into an Interledger-oriented internal flow, selects the best available route, and executes through either:

- Rafiki/Open Payments when the route is Interledger reachable.
- A hosted partner adapter when the final payout is through a local bank or mobile-money API.

## Repository Layout

```text
apps/             User-facing applications such as console, docs, and admin UI
services/         Backend services such as API gateway, core routing, webhooks, and settlement
packages/         Shared libraries, types, config, and utilities
integrations/     External platform integration notes and configuration, starting with Rafiki
infrastructure/   Docker, database, deployment, and local development infrastructure
docs/             Architecture, system analysis, ERD, and project documentation
bruno/            API collections for manual testing
```