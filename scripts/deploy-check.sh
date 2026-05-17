#!/usr/bin/env bash
# Run before pushing — installs, lints, tests, and builds the web app.
# Exits non-zero on the first failure.

set -euo pipefail
cd "$(dirname "$0")/.."

echo "▶ Node $(node --version) / npm $(npm --version)"

echo "▶ npm install"
npm ci --silent

echo "▶ Lint"
npm run lint

echo "▶ Test"
npm test

echo "▶ Build"
npx next build

echo "✅ All checks passed."
