#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
npm install >&2 2>&1
npm run build >&2 2>&1
exec node dist/index.js
