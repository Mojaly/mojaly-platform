# Mojaly Sequence Diagram

```mermaid
sequenceDiagram
  autonumber
  actor Fintech
  participant Console as Mojaly Console
  participant Gateway as API Gateway
  participant Core as Mojaly Core
  participant Router as Routing Layer
  participant Rafiki as Rafiki / Open Payments
  participant Partner as Bank / Mobile Partner
  participant Webhook as Webhook Service

  Fintech->>Console: Complete onboarding / KYB
  Console->>Gateway: Submit workspace and KYB
  Gateway->>Core: Provision fintech rail account
  Core-->>Gateway: Workspace ready
  Gateway-->>Console: Workspace approved

  Fintech->>Console: Create API key
  Console->>Gateway: Request API key
  Gateway->>Gateway: Authorize approved workspace
  Gateway->>Gateway: Generate, hash, and bind key
  Gateway-->>Console: Return API key once

  Fintech->>Gateway: POST /v1/quotes
  Gateway->>Gateway: Authenticate API key
  Gateway->>Core: Create quote request
  Core->>Router: Check corridor and price route
  Router-->>Core: Route, fees, and expiry
  Core-->>Gateway: Quote
  Gateway-->>Fintech: Quote response

  Fintech->>Gateway: POST /v1/payments with quoteId
  Gateway->>Gateway: Authenticate API key
  Gateway->>Core: Execute payment
  Core->>Router: Select route

  alt Open Payments / ILP route
    Router->>Rafiki: Create outgoing payment
    Rafiki-->>Core: Handoff status
  else Hosted local partner route
    Router->>Partner: Send payout request
    Partner-->>Core: Payout status
  end

  Core->>Core: Track settlement obligation
  Core->>Webhook: Publish payment event
  Webhook-->>Fintech: Signed webhook callback
  Core-->>Gateway: Payment status
  Gateway-->>Fintech: Payment response

  Partner->>Core: Settlement report
  Core->>Core: Reconcile report
```

## Presentation Summary

The fintech only sees Mojaly's API Gateway. Behind that, Mojaly authenticates the API key, checks the allowed corridor, prices the route, chooses either Rafiki/Open Payments or a hosted partner adapter, executes the payment, tracks settlement, and sends webhook events back to the fintech.

