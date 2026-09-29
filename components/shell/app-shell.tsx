"use client";

import * as React from "react";
import { MenuIcon, PlusIcon } from "lucide-react";
import { Sidebar, SidebarNav } from "@/components/shell/sidebar";
import { Brand } from "@/components/shell/brand";
import { ThemeToggle } from "@/components/shell/theme-toggle";
import { ScoringIndicator } from "@/components/shell/scoring-indicator";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { useOpportunitySheet } from "@/components/opportunities/opportunity-sheet-context";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const { openSheet } = useOpportunitySheet();
  return (
    <div className="flex min-h-dvh">
      <Sidebar />
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 bg-sidebar px-3 py-4 sm:max-w-72">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SheetDescription className="sr-only">Main navigation</SheetDescription>
          <Brand className="px-2 pb-6" />
          <SidebarNav onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur-md sm:px-6">
          <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open navigation" onClick={() => setMobileOpen(true)}>
            <MenuIcon />
          </Button>
          <Brand className="min-w-0 md:hidden [&>div:last-child]:hidden min-[420px]:[&>div:last-child]:flex" />
          <div className="ml-auto flex items-center gap-2">
            <ScoringIndicator />
            <Button size="sm" onClick={() => openSheet()} className="gap-1.5">
              <PlusIcon className="size-4" />
              <span className="hidden sm:inline">New opportunity</span>
            </Button>
            <ThemeToggle />
          </div>
        </header>
        <main className="relative isolate flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
