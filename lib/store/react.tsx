"use client";

import * as React from "react";
import { AppStore, type AppState } from "@/lib/store/app-store";
import { createRepositories } from "@/lib/data/repositories";
import { LocalStorageAdapter } from "@/lib/data/adapters/storage";
import type { Opportunity, ScoringContext } from "@/lib/domain/types";
import { todayISO } from "@/lib/dates";

/** One store per browser tab; it outlives route changes so the queue keeps running. */
const store = new AppStore();

const StoreContext = React.createContext<AppStore>(store);

/** Minimum time the first-load skeleton stays up, so the transition reads as intentional. */
const MIN_SKELETON_MS = 450;

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    if (store.getState().hydrated) return;
    const t = window.setTimeout(() => {
      if (store.getState().hydrated) return;
      const repos = createRepositories(new LocalStorageAdapter());
      try {
        store.hydrate(repos);
      } catch {
        // Stored data passed the schema guard but is unusable: fall back to the sample data.
        repos.resetDemoData();
        store.hydrate(repos);
      }
    }, MIN_SKELETON_MS);
    return () => window.clearTimeout(t);
  }, []);
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useAppStore(): AppStore {
  return React.useContext(StoreContext);
}

/**
 * Subscribe to a slice of state. The selector MUST return a value that is
 * referentially stable when nothing changed (e.g. `s => s.opportunities`), not
 * a freshly built array/object. Derive with `useMemo` in the component instead.
 */
export function useAppState<T>(selector: (s: AppState) => T): T {
  const s = useAppStore();
  return React.useSyncExternalStore(
    s.subscribe,
    () => selector(s.getState()),
    () => selector(s.getState()),
  );
}

export function useOpportunity(id: string | undefined): Opportunity | undefined {
  const opportunities = useAppState((s) => s.opportunities);
  return React.useMemo(() => opportunities.find((o) => o.id === id), [opportunities, id]);
}

/** Members + projects + settings + today, memoized for chart and scoring helpers. */
export function useScoringContext(): ScoringContext {
  const members = useAppState((s) => s.members);
  const projects = useAppState((s) => s.projects);
  const settings = useAppState((s) => s.settings);
  return React.useMemo(() => ({ members, projects, settings, today: todayISO() }), [members, projects, settings]);
}
