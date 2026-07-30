# Bruno Collections

Manual API collections for testing Mojaly endpoints will live here.

Planned collections:

- admin operations
- fintech API gateway
- onboarding and KYB
- partner management
- payment flow
- webhook testing
# Bruno Collection

Open `C:\Users\maste\mojaly-platform\bruno` as a Bruno collection.

Useful variables:

- `paymentIntentId`: copy from the Open Payments client output or Core list response.
- `adapterPayoutId`: copy from the Partner Adapter payout response.

Main folders:

- `Core`: destination resolution, payment intent lookup, and payout callback.
- `Partner Adapter`: payout inspection.
- `Rafiki`: settlement wallet address checks.
