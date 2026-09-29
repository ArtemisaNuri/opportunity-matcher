#!/usr/bin/env bash
# Collects every lucide-react icon the app imports and emits (1) typings for tsc and (2) a runtime shim for the preview.
cd "$(dirname "$0")/.."
icons=$(grep -rhoz 'import[^;]*from "lucide-react"' app components lib 2>/dev/null | tr '\0' '\n' | tr -d '\n' | grep -o '{[^}]*}' | tr -d '{}' | tr ',' '\n' | sed 's/^ *//; s/ *$//; s/^type //' | grep -v '^LucideIcon$' | grep -v '^$' | sed 's/ as .*//' | sort -u)
{
  echo 'declare module "lucide-react" {'
  echo '  import type { FC } from "react";'
  echo '  export type LucideProps = { className?: string; size?: number | string; strokeWidth?: number; [k: string]: any };'
  echo '  export type LucideIcon = FC<LucideProps>;'
  for i in $icons; do echo "  export const $i: LucideIcon;"; done
  echo '}'
} > dev/types/lucide.d.ts
mkdir -p dev/shims
{
  echo 'import { makeIcon } from "./icon-base";'
  for i in $icons; do echo "export const $i = makeIcon(\"$i\");"; done
} > dev/shims/lucide.tsx
echo "$icons" | wc -l
