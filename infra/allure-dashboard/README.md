# Allure Dashboard (allure-docker-service)

A persistent Allure dashboard for viewing daily regression results across runs — no more digging through per-run CI artifacts.

- **Dashboard UI:** `http://<host>:5252`
- **API (upload endpoint):** `http://<host>:5050`

Two containers:

| Service     | Image                                   | Port |
| ----------- | --------------------------------------- | ---- |
| `allure`    | `frankescobar/allure-docker-service`    | 5050 |
| `allure-ui` | `frankescobar/allure-docker-service-ui` | 5252 |

History and generated reports persist in `./data/projects/` (gitignored).

---

## Phase 1 — Host locally to preview the dashboard

Prereqs: Docker + Docker Compose installed.

```bash
cd infra/allure-dashboard
cp .env.example .env         # defaults are fine for local
docker compose up -d
```

Check both containers are running:

```bash
docker compose ps
```

### Send some results

Run a regression locally the way you normally would, e.g.:

```bash
npm run test:local
```

Then upload the results to the local server:

```bash
ALLURE_SERVER_URL=http://localhost:5050 \
ALLURE_PROJECT_ID=bahmni-regression-ui \
  npm run allure:upload
```

The server auto-generates the report within a few seconds (`CHECK_RESULTS_EVERY_SECONDS=3`).

### View the dashboard

Open `http://localhost:5252` in a browser. Pick the project (e.g. `bahmni-regression-ui`) from the dropdown to see:

- Overview + pass/fail trends across runs
- Categories (failure grouping)
- Suites, graphs, timeline
- History for each test

Upload results a second time and refresh — you should see the run-over-run history populate.

### Stop / reset

```bash
docker compose down            # stop, keep data
docker compose down -v         # stop and drop volumes
rm -rf data/projects           # nuke history (docker compose down first)
```

---

## Phase 2 — Host on the shared AWS server

Once the local preview looks good, deploy the same compose file to your existing AWS host.

### Server-side setup

1. **SSH to the shared AWS host** and ensure Docker + Docker Compose are installed.
2. **Copy** the `infra/allure-dashboard/` directory over (or clone this repo on the host).
3. **Create `.env`** on the host from `.env.example` and update:
   ```env
   ALLURE_DOCKER_PUBLIC_API_URL=http://<ec2-public-ip>:5050
   SECURITY_ENABLED=1
   SECURITY_USER=<pick-a-user>
   SECURITY_PASS=<pick-a-strong-password>
   ```
4. **Open ports** in the EC2 security group:
   - `5050` — API (POST results, GET history)
   - `5252` — UI (dashboard)
   - Restrict source to your team's VPN / office IPs if possible.
5. **Start** the stack:
   ```bash
   docker compose up -d
   ```

### GitHub Actions setup (for auto-upload after regression)

Add these repository secrets under **Settings → Secrets and variables → Actions**:

| Secret               | Value                                |
| -------------------- | ------------------------------------ |
| `ALLURE_SERVER_URL`  | `http://<ec2-public-ip>:5050`        |
| `ALLURE_SERVER_USER` | value of `SECURITY_USER` from `.env` |
| `ALLURE_SERVER_PASS` | value of `SECURITY_PASS` from `.env` |

The `ui-regression.yml` and `api-regression.yml` workflows already contain an upload step that:

- Runs after Allure results are generated
- Skips silently if `ALLURE_SERVER_URL` is not set (so nothing breaks before Phase 2)
- Uploads to project IDs `bahmni-regression-ui` and `bahmni-regression-api` respectively

Once the secrets are set, the next nightly run will populate the dashboard automatically.

### Recommended hardening (before public exposure)

- Put an nginx / Traefik reverse proxy in front with TLS (Let's Encrypt) so the dashboard is reachable over HTTPS.
- Front-line the UI with basic auth or SSO in the reverse proxy — the built-in auth only covers write endpoints.
- Restrict security group ingress to trusted IPs.

---

## Troubleshooting

**UI loads but shows "Cannot connect to API"**
`ALLURE_DOCKER_PUBLIC_API_URL` in `.env` must be reachable _from the browser_, not just from inside Docker. For local, that's `http://localhost:5050`; for AWS, use the public IP or hostname.

**Upload returns 401 after enabling auth**
Pass `ALLURE_SERVER_USER` / `ALLURE_SERVER_PASS` env vars to the upload script (see `scripts/upload-allure-results.sh`).

**History disappeared**
Check that `./data/projects/` on the host still exists and wasn't wiped by a `docker compose down -v`.

**Disk fills up**
Reports and result blobs accumulate under `data/projects/<project-id>/`. Tune `KEEP_HISTORY_LATEST` in `docker-compose.yml` (default 60) to bound retention.
