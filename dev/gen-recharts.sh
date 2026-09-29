#!/usr/bin/env bash
cd "$(dirname "$0")/.."
names=$(grep -rhoz 'import[^;]*from "recharts"' app components lib 2>/dev/null | tr '\0' '\n' | tr -d '\n' | grep -o '{[^}]*}' | tr -d '{}' | tr ',' '\n' | sed 's/^ *//; s/ *$//; s/^type //; s/ as .*//' | grep -v '^$' | sort -u)
{
  echo 'import { ResponsiveContainer, makeChart, makePart } from "./recharts-base";'
  echo 'export { ResponsiveContainer };'
  for n in $names; do
    case "$n" in
      ResponsiveContainer) ;;
      *Chart) echo "export const $n = makeChart(\"$n\");" ;;
      Area|Bar|Line|Scatter|Pie|Radar|RadialBar|Funnel) echo "export const $n = makePart(\"$n\", true);" ;;
      *Props|TooltipProps|LegendProps|*Type) echo "export type $n = any;" ;;
      *) echo "export const $n = makePart(\"$n\");" ;;
    esac
  done
} > dev/shims/recharts.tsx
