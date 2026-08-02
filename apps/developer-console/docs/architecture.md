# Frontend Architecture

## Stack

- Next.js App Router
- React
- TypeScript
- Refine Core
- Tailwind CSS
- shadcn/ui with Base UI
- Ory Kratos
- Ky
- React Hook Form
- Zod

## Responsibilities

### Next.js

- Routing
- Layouts
- Server and client component boundaries
- Route protection integration
- Rendering

### Refine

- Resource definitions
- Data fetching
- Caching
- Mutations
- Authentication-provider integration
- Access-control integration
- Notifications

Refine must remain headless and must not dictate the visual design.

### Ory Kratos

- Login
- Registration
- Logout
- Verification
- Recovery
- Account settings
- Authentication sessions

### Mojaly backend

- Organizations
- Permissions
- Payments
- Payouts
- Accounts
- Settlements
- API keys
- Webhooks
- Audit logs

## Architecture rules

- Do not store session tokens in localStorage.
- Use cookie-based Kratos browser sessions.
- Use Ky for backend API requests.
- Keep API calls outside page components.
- Keep route files small.
- Keep domain functionality in feature folders.
- Do not use floating-point arithmetic for money.