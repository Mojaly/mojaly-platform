# Mojaly Testing Strategy and Evaluation

## 1. Testing Objectives
Explain what we are proving.

## 2. Scope
What is included:
- API Gateway
- Core service
- Partner Adapter
- Rafiki webhook flow
- Destination resolution
- Partner payout execution

What is excluded for now:
- Real production settlement
- Real KYC verification
- Full Rafiki production deployment

## 3. Testing Levels

### Unit Testing
Purpose:
Test individual functions in isolation.

Examples:
- destination resolver chooses correct partner
- payment intent store creates and updates records
- partner payout payload mapping
- Rafiki webhook parser extracts payment reference

Tools:
- Vitest or Jest
- TypeScript

Pass criteria:
- all expected outputs match
- invalid inputs fail safely

### Integration Testing
Purpose:
Test service-to-service communication.

Examples:
- API Gateway -> Core
- Core -> Partner Adapter
- Partner Adapter -> Griffin sandbox/mock vendor

Tools:
- Bruno
- curl
- service logs

Pass criteria:
- correct HTTP status codes
- correct JSON responses
- no unhandled exceptions

### System Testing
Purpose:
Test the full Mojaly payment flow.

Flow:
1. Fintech resolves bank/mobile destination.
2. Core creates internal payment intent.
3. Core returns partner wallet address.
4. Rafiki sends `incoming_payment.completed`.
5. Core marks intent funded.
6. Core calls Partner Adapter.
7. Partner Adapter creates payout.

Pass criteria:
- payment reaches final status
- partner payout reference exists
- no manual database modification needed

### Acceptance Testing
Purpose:
Check that the product meets user/business needs.

Acceptance criteria:
- fintech can access cross-border payout using one API
- fintech does not integrate directly with each bank
- Mojaly can route to hosted partner adapter
- system produces traceable transaction status