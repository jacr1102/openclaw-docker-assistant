# Server deployment

This repo includes **`docker-compose.prod.yml`**: same idea as digital-message-platform — image published to **GHCR**, `pull` on the server, then `up -d`. You do not need to clone OpenClaw on the VPS or build there.

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
5. **`.env.prod`** in that same directory (template: [`env.prod.example`](./env.prod.example)) with at least `OPENCLAW_CONFIG_DIR` and `OPENCLAW_WORKSPACE_DIR` as absolute paths.

6. **OpenClaw onboarding** (token, channels, etc.): do it once with a local image or with `docker compose run --rm openclaw-cli …` on the server after the first `up`, per the [official docs](https://openclaw.im/docs/install/docker).

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

## Workflow branch

Deploy runs on **push to `main` or `master`**. To use another branch, edit `.github/workflows/deploy.yml`.

## OpenClaw upstream branch / version

By default the official repo’s **`main`** branch is built. To pin another branch or tag, change `OPENCLAW_UPSTREAM_REF` in the workflow or add a `workflow_dispatch` input (if you need reproducibility).
