# Mojaly Use Case Diagram

```mermaid
flowchart LR
  Fintech["Fintech Developer / Business"]
  MojalyAdmin["Mojaly Admin / Operations"]
  Partner["Bank or Mobile Money Partner"]
  ILPPeer["Interledger / Open Payments Peer"]
  WebhookReceiver["Fintech Webhook Receiver"]

  subgraph Mojaly["Mojaly Platform"]
    SignUp["Sign up / create workspace"]
    SubmitKYB["Submit KYB information"]
    ApproveKYB["Approve workspace"]
    CreateKey["Create API key"]
    ViewCorridors["View corridors"]
    ViewBalances["View balances"]
    CreateQuote["Create quote"]
    ExecutePayment["Execute payment"]
    TrackPayment["Track payments and quotes"]
    ManageWebhooks["Manage webhook endpoints"]
    ReceiveEvents["Receive payment events"]
    OnboardPartner["Onboard payout partner"]
    ConfigurePartner["Configure partner account and liquidity"]
    RoutePayment["Route payment"]
    Settle["Track settlement obligations"]
    Reconcile["Reconcile partner reports"]
    UseRafiki["Route through Rafiki / Open Payments"]
    HostedAdapter["Execute through hosted partner adapter"]
  end

  Fintech --> SignUp
  Fintech --> SubmitKYB
  Fintech --> CreateKey
  Fintech --> ViewCorridors
  Fintech --> ViewBalances
  Fintech --> CreateQuote
  Fintech --> ExecutePayment
  Fintech --> TrackPayment
  Fintech --> ManageWebhooks

  MojalyAdmin --> ApproveKYB
  MojalyAdmin --> OnboardPartner
  MojalyAdmin --> ConfigurePartner
  MojalyAdmin --> Settle
  MojalyAdmin --> Reconcile

  ExecutePayment --> RoutePayment
  CreateQuote --> RoutePayment
  RoutePayment --> UseRafiki
  RoutePayment --> HostedAdapter

  Partner --> ConfigurePartner
  Partner --> HostedAdapter
  Partner --> Reconcile

  ILPPeer --> UseRafiki

  ManageWebhooks --> ReceiveEvents
  ReceiveEvents --> WebhookReceiver
```

## Main Actors

- **Fintech Developer / Business**: integrates with Mojaly, creates API keys, creates quotes, executes payments, and monitors activity.
- **Mojaly Admin / Operations**: approves KYB, configures partners, monitors settlement, and runs reconciliation.
- **Bank or Mobile Money Partner**: provides local payout capability, liquidity/capacity, and settlement reports.
- **Interledger / Open Payments Peer**: connects through Rafiki/Open Payments when the route is Interledger-enabled.
- **Fintech Webhook Receiver**: receives signed payment and settlement events from Mojaly.

## Main Use Cases

- Onboard a fintech workspace.
- Approve KYB and unlock API keys.
- Discover available corridors and balances.
- Create a quote.
- Execute a payment.
- Route through Rafiki/Open Payments or hosted partner adapters.
- Track transactions, quotes, request logs, and settlement.
- Send webhooks to the fintech.
- Reconcile partner settlement reports.


# Mojaly Simple Use Case Diagram

```mermaid
flowchart LR
  Fintech["Fintech"]
  Admin["Mojaly Admin"]
  Partner["Bank / Mobile Money Partner"]
  ILP["Interledger / Open Payments Network"]

  subgraph Mojaly["Mojaly"]
    Onboard["Onboard fintech"]
    APIKey["Issue API key"]
    Quote["Create quote"]
    Pay["Execute payment"]
    Route["Route payment"]
    Monitor["Monitor transactions"]
    Settle["Settle and reconcile"]
  end

  Fintech --> Onboard
  Fintech --> APIKey
  Fintech --> Quote
  Fintech --> Pay
  Fintech --> Monitor

  Admin --> Onboard
  Admin --> Settle

  Pay --> Route
  Route --> Partner
  Route --> ILP
  Partner --> Settle
```

## Short Explanation

Fintechs integrate once with Mojaly, get an API key, create quotes, execute payments, and monitor transactions.

Mojaly routes each payment either through a local bank/mobile-money partner or through Interledger/Open Payments when the route supports it.

Mojaly Admin handles onboarding approval, partner operations, settlement, and reconciliation.

