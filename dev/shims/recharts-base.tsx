import * as React from "react";

/** Preview-only: Recharts cannot be installed here, so charts render as labeled placeholders. */
export function ResponsiveContainer({ width = "100%", height = 240, children }: any) {
  const kids = React.Children.toArray(children) as any[];
  const chart = kids[0];
  const name = chart?.type?.displayName ?? "Chart";
  const series = React.Children.toArray(chart?.props?.children ?? []).filter((c: any) => c?.type?.isSeries).length;
  return (
    <div
      data-recharts-placeholder
      style={{ width, height: typeof height === "number" ? height : 240 }}
      className="flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-primary/40 bg-[repeating-linear-gradient(45deg,transparent_0_8px,color-mix(in_oklab,var(--primary)_7%,transparent)_8px_16px)] text-xs text-muted-foreground"
    >
      <span className="font-medium text-foreground">Recharts {name}</span>
      <span>{series} series · {chart?.props?.data?.length ?? 0} data points · preview placeholder</span>
    </div>
  );
}
export function makeChart(name: string) {
  const C = ({ children }: any) => <>{children}</>;
  (C as any).displayName = name;
  return C;
}
export function makePart(name: string, isSeries = false) {
  const C = () => null;
  (C as any).displayName = name;
  (C as any).isSeries = isSeries;
  return C;
}
