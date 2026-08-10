# Mojaly Backend Deployment

Docker runtime configuration is controlled from this folder.

Use one active `.env` file with `mojaly-backend.compose.yml`:

- local Docker: copy `.env.local` or `.env.local.example` to `.env`
- production VM: copy your production env file to `.env`

The compose file does not read `services/*/.env`; those files are only for direct `pnpm dev` runs.

## Local Docker

```powershell
Copy-Item infrastructure\deployment\.env.local infrastructure\deployment\.env -Force

docker build -f services/core/Dockerfile -t mojaly-core:local .
docker build -f services/partner-adapter/Dockerfile -t mojaly-partner-adapter:local .
docker build -f services/api-gateway/Dockerfile -t mojaly-api-gateway:local .

docker compose --env-file infrastructure\deployment\.env -f infrastructure\deployment\mojaly-backend.compose.yml down -v
docker compose --env-file infrastructure\deployment\.env -f infrastructure\deployment\mojaly-backend.compose.yml up -d
```

## Production

```bash
cp infrastructure/deployment/.env.production infrastructure/deployment/.env

docker compose --env-file infrastructure/deployment/.env -f infrastructure/deployment/mojaly-backend.compose.yml pull
docker compose --env-file infrastructure/deployment/.env -f infrastructure/deployment/mojaly-backend.compose.yml up -d
```