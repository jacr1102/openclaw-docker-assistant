# OpenClaw in Docker (deployment kit)

This repository is a small wrapper around the official [OpenClaw](https://github.com/openclaw/openclaw) project so you can run the **containerized gateway** with data stored next to the repo instead of only under `$HOME/.openclaw`.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose v2
- `git` and `openssl` (or `python3`) for the first-time clone and token generation

## Quick start

From the repository root:

```bash
chmod +x scripts/*.sh
./scripts/docker-setup.sh
```

What this does:

1. Clones (or updates) the upstream OpenClaw tree into `./upstream/` (ignored by git).
2. Sets `OPENCLAW_CONFIG_DIR` and `OPENCLAW_WORKSPACE_DIR` to `./data/config` and `./data/workspace` unless you already exported them.
3. Runs the upstream `./docker-setup.sh` (build image, interactive onboarding, start gateway).

Then open the Control UI at [http://127.0.0.1:18789/](http://127.0.0.1:18789/) and paste the gateway token from the setup output (also in `./upstream/.env` after setup).

## Configuration

See [`.env.example`](./.env.example) for optional environment variables. Official Docker documentation: [Docker | OpenClaw Docs](https://openclaw.im/docs/install/docker).

## Compose from the repo root (optional)

If `upstream/` is already present, you can also run Compose from the **repository root**; the root `docker-compose.yml` includes the official file under `upstream/`:

```bash
docker compose up -d
```

Set `OPENCLAW_CONFIG_DIR` and `OPENCLAW_WORKSPACE_DIR` (and other variables) via your environment or a `.env` file next to this README. For a local template without GHCR, see [`deploy/vps.env.example`](./deploy/vps.env.example).

## Production (GHCR + server deploy)

- **`docker-compose.prod.yml`** — uses an image from GitHub Container Registry; no build on the VPS.
- **`.github/workflows/deploy.yml`** — builds OpenClaw from the official upstream, pushes to `ghcr.io/<org>/<repo>/openclaw:latest`, copies the compose file to the server, and runs `pull` + `up -d`.
- On the server you need **`.env.prod`** with absolute paths to data; template: [`deploy/env.prod.example`](./deploy/env.prod.example). Full guide: [`deploy/README.md`](./deploy/README.md) (includes **first Control UI login** behind HTTPS: permissions, `allowedOrigins`, token, device pairing).
- Optional **Slack** channel: [`deploy/SLACK.md`](./deploy/SLACK.md) (app, Bot scopes, events, Socket Mode, env, pairing).
- **GitHub / `gh`:** not bundled in the server image — run **`gh` on an OpenClaw node** (e.g. Mac): [`deploy/AUTOMATION.md`](./deploy/AUTOMATION.md).

## Day-to-day commands

All `docker compose` commands can run from **`./upstream/`** (that is where the official `docker-compose.yml` lives) or from the repo root as above. After setup, the upstream script prints a `docker compose ...` hint you can reuse.

Examples (run inside `./upstream`):

```bash
docker compose logs -f openclaw-gateway
docker compose run --rm openclaw-cli channels login
```

## Create this project on GitHub

```bash
git init
git add .
git commit -m "Add OpenClaw Docker deployment wrapper"
gh repo create openclaw-docker-assistant --public --source=. --remote=origin --push
```

Replace the repo name and visibility as needed. If you do not use GitHub CLI, create an empty repository in the browser and `git remote add origin …` then `git push -u origin main`.

## License

This wrapper repository is MIT licensed. OpenClaw itself is licensed under its upstream repository.
