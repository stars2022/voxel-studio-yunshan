#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
node -e 'if(Number(process.versions.node.split(".")[0]) < 24) throw Error("Use Node.js 24 or newer; migration was verified with Node.js 24")'
npm ci
npm run build
if [[ "${1:-}" == "--browser" ]]; then
  if [[ "$(uname -s)" == "Linux" ]]; then
    npx playwright install --with-deps chromium
  else
    npx playwright install chromium
  fi
fi
if [[ -f cloud/manifest.json ]]; then npm run cloud:check; fi
printf '%s\n' 'Setup complete. Run npm run test:cloud, then npm run cloud:start.'
