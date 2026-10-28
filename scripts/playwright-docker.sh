#!/usr/bin/env bash
# Roda o Playwright dentro da imagem oficial (mesma versão do lockfile) para que as capturas de tela
# não dependam de fontes e renderização do sistema operacional local. Usado pela CI e pelos devs.
#   scripts/playwright-docker.sh -c playwright.visual.config.ts [--update-snapshots]
set -euo pipefail

VERSION=$(node -p "require('@playwright/test/package.json').version")
PNPM_VERSION=$(node -p "require('./package.json').packageManager.split('@')[1]")
IMAGE="mcr.microsoft.com/playwright:v${VERSION}-noble"
ARGS=$(printf '%q ' "$@")

docker run --rm --ipc=host \
  -e CI=1 \
  -v "$PWD":/work \
  -v kurio-playwright-node-modules:/work/node_modules \
  -v kurio-playwright-pnpm-store:/pnpm-store \
  -e npm_config_store_dir=/pnpm-store \
  -w /work \
  "$IMAGE" \
  bash -c "npx -y pnpm@${PNPM_VERSION} install --frozen-lockfile --config.confirmModulesPurge=false >/dev/null \
    && npx -y pnpm@${PNPM_VERSION} exec playwright test ${ARGS}; status=\$?; \
    chown -R $(id -u):$(id -g) tests public dist storybook-static test-results playwright-report .features-gen 2>/dev/null; exit \$status"
