# ReportPortal — Local Stack

Local ReportPortal deployment for testing the reporting dashboard before moving to AWS.

Source: official [reportportal/reportportal](https://github.com/reportportal/reportportal) compose file. Image versions are pinned by upstream and must be upgraded together.

## Prerequisites

- Docker + Docker Compose (Docker Desktop is fine on macOS)
- ~4 vCPU, 8 GB RAM free
- Ports free on host: `8080` (UI), `8081` (Traefik dashboard), `443`

## Bring the stack up

```bash
docker compose -f infra/reportportal/docker-compose.yml up -d
```

First boot pulls ~4 GB of images and initializes Postgres/OpenSearch — expect 2–3 minutes before the UI is reachable.

Check status:

```bash
docker compose -f infra/reportportal/docker-compose.yml ps
```

Open the UI: <http://localhost:8080>

Default admin login: `superadmin` / `erebus` — change immediately from the UI (Profile → Password).

## First-time setup inside the RP UI

1. Log in as `superadmin`.
2. **Administrate → Projects → Create Project** → name `bahmni` → Type: `INTERNAL`.
3. **Profile → API Keys → Generate** → copy the token. This is the value for `RP_API_KEY`.
4. Export the values used by the Playwright reporter:

   ```bash
   export RP_ENDPOINT=http://localhost:8080/api/v2
   export RP_API_KEY=<paste-token-here>
   export RP_PROJECT=bahmni
   ```

Add these to your shell profile or a local (gitignored) `.env` if you want them to persist.

## Stop the stack

```bash
docker compose -f infra/reportportal/docker-compose.yml down
```

Add `-v` to also wipe the Postgres/OpenSearch/storage volumes:

```bash
docker compose -f infra/reportportal/docker-compose.yml down -v
```

## Tail logs

```bash
docker compose -f infra/reportportal/docker-compose.yml logs -f api uat ui
```
