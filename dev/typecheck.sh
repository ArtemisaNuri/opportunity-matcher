#!/usr/bin/env bash
# Offline type-check of the app's own code against dev/types stubs.
cd "$(dirname "$0")" && /home/claude/.npm-global/lib/node_modules/typescript/bin/tsc -p tsconfig.stubs.json "$@"
