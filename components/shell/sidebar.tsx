"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { NAV_ITEMS, isActive } from "@/components/shell/nav";
import { Brand } from "@/components/shell/brand";
import { useAppState } from "@/lib/store/react";
import { cn } from "@/lib/utils";

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname() ?? "/";
  const opportunities = useAppState((s) => s.opportunities);
  const unscored = React.useMemo(
    () => opportunities.filter((o) => o.scoring.status === "unscored").length,
    [opportunities],
  );
  return (
    <nav className="flex flex-col gap-1" aria-label="Main">
      {NAV_ITEMS.map((item) => {
        const active = isActive(item, pathname);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex h-9 items-center gap-2.5 rounded-lg px-3 text-sm font-medium transition-colors",
              active ? "text-foreground" : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-foreground",
            )}
          >
            {active ? (
              <motion.span
                layoutId="nav-active"
                className="absolute inset-0 rounded-lg bg-sidebar-accent"
                transition={{ type: "spring", stiffness: 500, damping: 40 }}
              />
            ) : null}
            <Icon className={cn("relative size-4", active && "text-primary")} />
            <span className="relative">{item.label}</span>
            {item.href === "/" && unscored > 0 ? (
              <span className="relative ml-auto rounded-full bg-primary/12 px-1.5 text-[11px] font-semibold text-primary tabular">
                {unscored}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar px-3 py-4 md:flex">
      <Brand className="px-2 pb-6" />
      <SidebarNav />
      <div className="mt-auto rounded-xl border bg-card/60 p-3 text-xs text-muted-foreground">
        <p className="font-medium text-foreground">Smart Scoring</p>
        <p className="mt-1 leading-relaxed">
          Deterministic scores from your team&apos;s capacity, budgets and timelines. Every result explains itself.
        </p>
      </div>
    </aside>
  );
}
