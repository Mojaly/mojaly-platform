# Mojaly Kratos Infrastructure

This folder runs the standalone Mojaly identity service using Ory Kratos and its own Postgres database.

Kratos owns human authentication: registration, login, recovery, verification, settings, and browser sessions.
Mojaly Core owns workspaces, memberships, KYB, API keys, accounts, wallet addresses, and payment data.

## Local start

Copy the example environment file:

```powershell
Copy-Item .env.example .env
```

Update secrets in `.env`, then start:

```powershell
docker compose --env-file .env -f compose.yml up -d
```

Open local email UI at:

`powershell
http://localhost:4436
` 

Useful checks:

```powershell
curl.exe http://localhost:4433/self-service/login/browser
curl.exe http://localhost:4433/sessions/whoami
```

`/sessions/whoami` should return `401` before login and a session object after login.

