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

## Day-to-day commands

All `docker compose` commands run from **`./upstream/`** (that is where the official `docker-compose.yml` lives). After setup, the upstream script prints a `docker compose ...` hint you can reuse.

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
