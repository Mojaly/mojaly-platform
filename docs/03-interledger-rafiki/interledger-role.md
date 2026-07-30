# Interledger's Role

Interledger (ILP) is the value-transfer protocol Mojaly uses to move funds from a sender's wallet into one of Mojaly's own hosted settlement wallets. It is the mechanism underneath the Open Payments API described in [open-payments-flow.md](open-payments-flow.md) — this document focuses on what ILP specifically contributes and how it maps onto Mojaly's partner model.

## What ILP actually moves

ILP transfers value packet by packet (STREAM) between wallet addresses, converting currency at each hop according to a quote. In the code, a quote (`services/core/src/modules/rafiki/backend/request/quote.request.ts`, types in `rafiki.types.ts`) captures exactly this:

```text
Quote
  paymentType        FixedSend | FixedDelivery
  debitAmount        what leaves the sender's wallet
  receiveAmount       what arrives at the receiver's wallet
  minExchangeRate
  lowEstimatedExchangeRate / highEstimatedExchangeRate
  maxPacketAmount
```

Rafiki (as Mojaly's ILP connector) uses this quote to fulfil the payment across however many ILP hops are needed. Mojaly itself never touches ILP packets directly — it only ever calls Rafiki's Admin/Open Payments APIs and reacts to the resulting webhook.

## Mojaly as an ILP connector/provider, not just a client

Externally, the Interledger network sees Mojaly — not the bank or mobile-money partner actually receiving the money. This is the "hosted ILP" idea from [project overview.md](../01-foundation/project%20overview.md): a partner that doesn't run Rafiki or any ILP connector is still represented on the network through a Mojaly-hosted wallet address.

Concretely, `services/core/src/modules/partner-routing/partner-routing.store.ts` gives each partner a settlement wallet address under Mojaly's own domain:

```text
GRIFFIN  -> https://mojaly.local/griffin/settlement   (bank_account, GB, GBP)
MTN_UG   -> https://mojaly.local/mtn-ug/settlement     (mobile_money, UG, UGX, network MTN)
```

An ILP sender pays that wallet address exactly as it would pay any other Open Payments receiver. It never integrates with Griffin or MTN directly, and Griffin/MTN never need to run ILP.

## Partner types and where ILP applies

From the partner model (`docs/01-foundation/project overview.md`, mirrored in [scope.md](../01-foundation/scope.md)):

```text
ILP_PEER            -> partner runs Rafiki or another ILP connector; Mojaly peers directly over ILP
HOSTED_ILP_RAIL      -> non-ILP partner represented through Mojaly's hosted wallet address (the pattern above)
BANK_ADAPTER         -> bank reached via banking API/settlement file/dashboard, no ILP involved
MOBILE_MONEY_ADAPTER -> mobile-money provider reached via payout/collection API, no ILP involved
SETTLEMENT_PARTNER   -> used to settle obligations, may or may not be the payout destination
```

Today, both partners actually wired into the routing store (Griffin, MTN Uganda) are `HOSTED_ILP_RAIL` + adapter-executed: the sender pays over ILP, but the payout to the real bank/mobile-money account happens through `services/partner-adapter`, not over ILP. There is no `ILP_PEER` partner configured yet — that would be a partner running its own Rafiki/ILP connector that Mojaly peers with directly, which the current partner-routing store doesn't model.

## Where ILP's responsibility ends

ILP's job stops the moment funds land in Mojaly's settlement wallet address (an `incoming_payment.completed` event, handled in `services/core/src/modules/rafiki-webhooks`). From there, everything is Mojaly-side orchestration:

```text
ILP settles into Mojaly's wallet
  -> Core matches the incoming payment to a payment intent (via metadata.paymentReference)
  -> Core calls services/partner-adapter to execute the real-world payout
  -> Partner (Griffin/KCB/etc.) moves the money the rest of the way
```

So ILP solves the "get value across the network into Mojaly" problem; it does not solve "get value into a Ugandan mobile-money wallet" or "get value into a UK bank account" — that last mile is the partner-adapter's job, described in [partner-integration-model.md](../07-api-and-integration/partner-integration-model.md).
