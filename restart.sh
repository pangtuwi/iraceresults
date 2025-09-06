#!/usr/bin/env bash
set -euo pipefail

# Install/update production deps (skip dev deps)
if command -v npm >/dev/null 2>&1; then
  if [ -f package-lock.json ]; then
    npm ci --omit=dev
  else
    npm install --omit=dev
  fi
fi

# Fall back to restarting all PM2 processes
pm2 restart all
