# Server deployment

This repo includes **`docker-compose.prod.yml`**: same idea as digital-message-platform — image published to **GHCR**, `pull` on the server, then `up -d`. You do not need to clone OpenClaw on the VPS or build there.

## Editing config on the server

Use **`vim`** for examples that edit files on the VPS (e.g. `sudo vim /etc/nginx/sites-available/assistant`, `sudo vim "$OPENCLAW_CONFIG_DIR/openclaw.json"`). Substitute another editor if you prefer.

## Example hostnames in `deploy/`

[`nginx-openclaw.https.example.conf`](./nginx-openclaw.https.example.conf) uses **`openclaw.example.com`** (reserved for documentation) for DNS, TLS, Nginx `server_name`, and `gateway.controlUi.allowedOrigins`. Replace it with **your** real domain when you copy configs.

## What the pipeline does (`.github/workflows/deploy.yml`)

1. In GitHub Actions, clones [openclaw/openclaw](https://github.com/openclaw/openclaw) (`main` by default) and builds the official `Dockerfile`.
2. Pushes the image to **`ghcr.io/<your-org>/<your-repo>/openclaw:latest`**.
3. Copies `docker-compose.prod.yml` to the server `DEPLOY_PATH`.
4. Over SSH: writes `IMAGE_OPENCLAW` to `.env`, appends **`.env.prod`** if it exists, runs `docker compose -f docker-compose.prod.yml pull && up -d`.

## On the server (before the first deploy)

1. **Docker** installed and the deploy user in the `docker` group.
2. A **deploy directory**, e.g. `/home/deploy/openclaw`, owned by the deploy user.
3. **Persistent data directories**:

   ```bash
   mkdir -p /home/deploy/openclaw/data/config /home/deploy/openclaw/data/workspace
   ```

4. **`docker-compose.prod.yml`** — the workflow uploads it; you can also copy it manually the first time.
5. **`.env.prod`** in that same directory (template: [`env.prod.example`](./env.prod.example)) with at least `OPENCLAW_CONFIG_DIR` and `OPENCLAW_WORKSPACE_DIR` as absolute paths. If these are missing, `docker compose` will error with `invalid spec: :/home/node/.openclaw` — the deploy job will also fail until `.env.prod` exists on the server with both variables set.

6. **First boot:** the production compose starts the gateway with **`--allow-unconfigured`** so it can run before `openclaw setup` has been completed. Open the Control UI and finish setup, or run `docker compose run --rm openclaw-cli setup` (or `onboard`) per the [official docs](https://openclaw.im/docs/install/docker). If you remove `--allow-unconfigured` from `docker-compose.prod.yml` later, the gateway will require a valid config to start.

## GitHub secrets (Environment: `production`)

| Secret | Purpose |
|--------|---------|
| `SSH_HOST` | VPS IP or hostname |
| `SSH_USER` | SSH user (e.g. `deploy`) |
| `SSH_PRIVATE_KEY` | PEM private key |
| `DEPLOY_PATH` | Absolute path where `docker-compose.prod.yml` and `.env.prod` live (e.g. `/home/deploy/openclaw`) |

Create the **production** environment under *Settings → Environments* and add the secrets.

## Private image on GHCR

If the GHCR package is private, log in once on the server:

```bash
echo YOUR_PAT | docker login ghcr.io -u YOUR_USERNAME --password-stdin
```

(Use a PAT with `read:packages`.)

## Useful commands on the server

```bash
cd /home/deploy/openclaw   # or your DEPLOY_PATH

docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f openclaw-gateway
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml down
```

### `.env` vs `.env.prod` (secrets and `OPENAI_API_KEY`)

Docker Compose reads **`./.env`** in the deploy directory for variable substitution (e.g. `${OPENAI_API_KEY:-}` in `docker-compose.prod.yml`). It does **not** automatically load **`.env.prod`**.

The GitHub Actions deploy job **merges** `.env.prod` into `.env` on each deploy (`IMAGE_OPENCLAW` plus the rest of `.env.prod`). If you add a secret only to **`.env.prod`** and run `docker compose up` locally without redeploying, **`.env` may still omit that variable**, so inside the container `OPENAI_API_KEY` is empty.

**Fix (pick one):**

1. **Regenerate `.env` like CI** (from your deploy directory):

   ```bash
   REPO_LOWER=$(echo "your-org/your-repo" | tr '[:upper:]' '[:lower:]')
   export IMAGE_OPENCLAW="ghcr.io/${REPO_LOWER}/openclaw:latest"
   echo "IMAGE_OPENCLAW=$IMAGE_OPENCLAW" > .env
   grep -v '^IMAGE_OPENCLAW=' .env.prod >> .env
   docker compose -f docker-compose.prod.yml up -d
   ```

2. **Or** load **both** env files: `IMAGE_OPENCLAW` is written to **`.env`** by the deploy job, not to **`.env.prod`**. Using only `--env-file .env.prod` leaves `IMAGE_OPENCLAW` unset and Compose fails (`invalid compose project`). Use **`.env` first**, then **`.env.prod`** so secrets from prod override or supplement:

   ```bash
   docker compose --env-file .env --env-file .env.prod -f docker-compose.prod.yml up -d
   ```

3. **Or** append `OPENAI_API_KEY=...` to **`.env`** (same directory as the compose file), then `docker compose -f docker-compose.prod.yml up -d`.

Verify inside the gateway: `docker compose -f docker-compose.prod.yml exec openclaw-gateway sh -c 'echo "len=${#OPENAI_API_KEY}"'` — you want a non-zero length (do not paste the key in chat logs).

## Nginx reverse proxy (HTTPS)

Example: **`openclaw.example.com`** → `127.0.0.1:18789` (WebSocket-friendly): [`nginx-openclaw.https.example.conf`](./nginx-openclaw.https.example.conf). Add a DNS **A** record for your hostname, install the snippet under `/etc/nginx/sites-available/`, enable the site, run **Certbot** for TLS, then `nginx -t` and reload.

### Control UI: `allowedOrigins` (required behind Nginx + HTTPS)

If logs show:

`non-loopback Control UI requires gateway.controlUi.allowedOrigins …`

the gateway is bound to **`lan`** (see `OPENCLAW_GATEWAY_BIND`) and the Control UI must know your public origin. Edit **`$OPENCLAW_CONFIG_DIR/openclaw.json`** on the host (same dir that is bind-mounted as `/home/node/.openclaw`) and ensure the `gateway` object includes:

```json
"controlUi": {
  "allowedOrigins": ["https://openclaw.example.com"]
}
```

(Replace with your real hostname.) Merge carefully with existing `gateway` keys; keep valid JSON. Then `chown` the file to uid **1000** if needed and restart the gateway:

```bash
docker compose -f docker-compose.prod.yml restart openclaw-gateway
```

**Temporary workaround** (weaker; only if you accept Host-header fallback): set `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback` to **`true`** in the same file — the OpenClaw error message mentions this flag.

**Directory layout:** `OPENCLAW_WORKSPACE_DIR` must be a **sibling** of the config dir (e.g. `data/workspace`), not `data/config/workspace`. Remove an accidental nested `workspace` folder under `data/config` if you created it by mistake.

## First Control UI access (HTTPS + Docker on the VPS)

Typical order when opening the dashboard behind **Nginx + HTTPS** (e.g. `wss://your-domain`). Official detail: [Control UI — device pairing](https://docs.openclaw.ai/web/control-ui), [Pairing](https://docs.openclaw.ai/pairing).

1. **Data dirs exist** and bind mounts in `.env.prod` point to absolute paths. **Ownership:** the image runs as user `node` (uid **1000** on the official image). If logs show `EACCES` on `openclaw.json`, run:
   `sudo chown -R 1000:1000 "$OPENCLAW_CONFIG_DIR" "$OPENCLAW_WORKSPACE_DIR"`
2. **Gateway starts:** `docker-compose.prod.yml` includes **`--allow-unconfigured`** until you have a real config; remove later if you want a stricter boot.
3. **`allowedOrigins`:** with `OPENCLAW_GATEWAY_BIND=lan`, set `gateway.controlUi.allowedOrigins` in **`openclaw.json`** to your HTTPS origin (see section above). **`controlUi` goes under `gateway`**, not at the root of the JSON.
4. **Reverse proxy:** Nginx proxies to `127.0.0.1:18789` with WebSocket headers; avoid duplicate `server { listen 80; }` blocks after Certbot. TLS certificates must exist before the `ssl_certificate` lines load.
5. **Gateway token:** paste the token from **`gateway.auth.token`** in `openclaw.json` into the dashboard (or read with `jq -r '.gateway.auth.token' openclaw.json`). Treat it like a secret.
6. **Optional field “Password (not stored)”** in the UI is not your Linux password; you can usually leave it empty if you only use the gateway token.
7. **Pairing:** remote browsers are not auto-approved (unlike `127.0.0.1`). When the UI shows **pairing required**, run **`devices list`** and approve the **pending** `requestId`:
   ```bash
   docker compose -f docker-compose.prod.yml run --rm openclaw-cli devices list
   docker compose -f docker-compose.prod.yml run --rm openclaw-cli devices approve <requestId>
   ```
   Use the **pending** request id, **not** the “Device” id from the **Paired** table. Trigger **Connect** in the browser, then run `devices list` immediately so a pending row appears.

## Workflow branch

Deploy runs on **push to `main` or `master`**. To use another branch, edit `.github/workflows/deploy.yml`.

## OpenClaw upstream branch / version

By default the official repo’s **`main`** branch is built. To pin another branch or tag, change `OPENCLAW_UPSTREAM_REF` in the workflow or add a `workflow_dispatch` input (if you need reproducibility).
