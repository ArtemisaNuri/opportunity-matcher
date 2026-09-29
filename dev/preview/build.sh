#!/usr/bin/env bash
# Builds the offline preview into dev/.out: real app code + real Tailwind CSS, with stand-ins for uninstallable packages.
set -e
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
OUT="${PREVIEW_OUT:-$ROOT/dev/.out}"; mkdir -p "$OUT"
NODE_MODULES=/home/claude/.npm-global/lib/node_modules
ESBUILD=$NODE_MODULES/tsx/node_modules/@esbuild/linux-x64/bin/esbuild
TW=${TAILWIND_BIN:-/tmp/claude-0/-home-claude/f5f0ad7d-bd51-5e80-a70c-da2a69e5d134/scratchpad/tw}
./dev/gen-icons.sh >/dev/null
./dev/gen-recharts.sh
S=dev/shims
NODE_PATH=$NODE_MODULES "$ESBUILD" dev/preview/main.tsx --bundle --format=iife --jsx=automatic \
  --tsconfig=dev/tsconfig.stubs.json --outfile="$OUT/bundle.js" --log-level=warning \
  --define:process.env.NODE_ENV='"development"' \
  --alias:next/link=./$S/next-link.tsx --alias:next/navigation=./$S/next-navigation.ts \
  --alias:next-themes=./$S/next-themes.tsx --alias:motion/react=./$S/motion.tsx \
  --alias:radix-ui=./$S/radix.tsx --alias:recharts=./$S/recharts.tsx --alias:lucide-react=./$S/lucide.tsx \
  --alias:sonner=./$S/sonner.tsx --alias:class-variance-authority=./$S/cva.ts --alias:clsx=./$S/clsx.ts \
  --alias:tailwind-merge=./$S/tailwind-merge.ts
"$TW" -i app/globals.css -o "$OUT/app.css" 2>&1 | grep -v "^≈" | grep -v "^$" || true
cp dev/preview/index.html "$OUT/index.html"
echo "built $OUT"
