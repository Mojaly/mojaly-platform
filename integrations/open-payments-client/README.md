# Open Payments Client Integration

This client proves the Mojaly + Rafiki handoff end to end.

It does not replace Rafiki. It acts like an external fintech/Open Payments client:

1. Creates a Mojaly destination resolution in Core.
2. Resolves the sender wallet address and the partner settlement wallet address.
3. Creates an incoming payment on the receiver wallet.
4. Creates a quote and outgoing payment through Rafiki/Open Payments.
5. Deposits outgoing payment liquidity through Rafiki Admin GraphQL for local testing.
6. Lets Rafiki complete the incoming payment and send `incoming_payment.completed` to Mojaly Core.
7. Core submits the final payout to the Partner Adapter.

## Run

Start these first:

```powershell
pnpm --filter core dev
pnpm --filter partner-adapter dev
```

Rafiki should also be running from:

```powershell
cd C:\Users\maste\mojaly-platform\infrastructure\rafiki
docker compose up
```

Then run:

```powershell
cd C:\Users\maste\mojaly-platform
pnpm --filter open-payments-client dev
```

## Expected Result

The script should print:

- Rafiki outgoing payment state: `COMPLETED`
- Rafiki incoming payment state: `COMPLETED`
- A recent `incoming_payment.completed` webhook event
- A Mojaly payment intent that becomes `PAYOUT_SUBMITTED`
- A Partner Adapter payout with status `PENDING`

`PENDING` is normal for a bank payout rail until the partner confirms final settlement.
