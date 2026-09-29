/**
 * Client application store (framework-free). React binds to it through
 * `useSyncExternalStore` in `lib/store/react.tsx`.
 *
 * Owns the background scoring queue: a FIFO processed one item at a time with
 * a staged "Opportunity Analysis" presentation. The score itself is computed
 * instantly by the deterministic engine; the stage delays are presentation only.
 */
import { todayISO } from "@/lib/dates";
import type {
  Opportunity,
  Project,
  ScoreResult,
  ScoringContext,
  Settings,
  TeamMember,
} from "@/lib/domain/types";
import type { Repositories } from "@/lib/data/repositories";
import { scoreOpportunity } from "@/lib/scoring/engine";

export const ANALYSIS_STAGES = [
  "Reading opportunity",
  "Checking team capacity",
  "Comparing timelines",
  "Classifying match",
] as const;

export interface QueueState {
  /** Ids waiting to be scored, in order (excludes the active one). */
  pending: string[];
  activeId: string | null;
  /** Index into ANALYSIS_STAGES for the active item. */
  activeStage: number;
  /** Items finished in the current batch (resets when the queue drains). */
  completedInBatch: number;
  /** Items in the current batch (active + pending + completed). */
  batchSize: number;
}

export interface AppState {
  hydrated: boolean;
  members: TeamMember[];
  projects: Project[];
  opportunities: Opportunity[];
  settings: Settings;
  queue: QueueState;
}

export type OpportunityInput = Omit<Opportunity, "id" | "createdAt" | "source" | "scoring">;

export interface ScoreCompleteEvent {
  opportunity: Opportunity;
  result: ScoreResult;
}

type Listener = () => void;
type CompleteListener = (e: ScoreCompleteEvent) => void;

const EMPTY_QUEUE: QueueState = { pending: [], activeId: null, activeStage: 0, completedInBatch: 0, batchSize: 0 };

export interface AppStoreOptions {
  /** Delay per analysis stage, in ms. */
  stageDelayMs?: number;
  sleep?: (ms: number) => Promise<void>;
  now?: () => Date;
  idFactory?: () => string;
}

const defaultSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export class AppStore {
  private state: AppState;
  private listeners = new Set<Listener>();
  private completeListeners = new Set<CompleteListener>();
  private repos: Repositories | null = null;
  private processing = false;
  /** Bumped by reset: a running queue loop from an older generation stops at its next await. */
  private generation = 0;
  private readonly stageDelayMs: number;
  private readonly sleep: (ms: number) => Promise<void>;
  private readonly now: () => Date;
  private readonly idFactory: () => string;

  constructor(opts: AppStoreOptions = {}) {
    this.stageDelayMs = opts.stageDelayMs ?? 560;
    this.sleep = opts.sleep ?? defaultSleep;
    this.now = opts.now ?? (() => new Date());
    this.idFactory =
      opts.idFactory ??
      (() =>
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? `o-${crypto.randomUUID().slice(0, 8)}`
          : `o-${Math.random().toString(36).slice(2, 10)}`);
    this.state = {
      hydrated: false,
      members: [],
      projects: [],
      opportunities: [],
      settings: {
        minBudget: 10_000,
        restrictedSectors: [],
        preferredTags: [],
        capacityGateRatio: 0.8,
        stageFit: { full_build: 10, prototype: 9, recovery: 6 },
      },
      queue: EMPTY_QUEUE,
    };
  }

  // ------------------------------------------------------------ subscription

  subscribe = (listener: Listener) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getState = () => this.state;

  onScoreComplete(listener: CompleteListener) {
    this.completeListeners.add(listener);
    return () => this.completeListeners.delete(listener);
  }

  private set(patch: Partial<AppState>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((l) => l());
  }

  private setOpportunities(opportunities: Opportunity[], persist = true) {
    this.set({ opportunities });
    if (persist) this.repos?.opportunities.saveAll(opportunities);
  }

  // ------------------------------------------------------------ lifecycle

  hydrate(repos: Repositories) {
    this.repos = repos;
    const opportunities = repos.opportunities.list();
    // Items persisted mid-queue (queued/scoring) are resumed in the background.
    const resume = opportunities.filter((o) => o.scoring.status === "queued" || o.scoring.status === "scoring");
    this.set({
      hydrated: true,
      members: repos.team.list(),
      projects: repos.projects.list(),
      settings: repos.settings.get(),
      opportunities,
    });
    if (resume.length > 0) this.enqueue(resume.map((o) => o.id));
  }

  context(): ScoringContext {
    return {
      members: this.state.members,
      projects: this.state.projects,
      settings: this.state.settings,
      today: todayISO(this.now()),
    };
  }

  // ------------------------------------------------------------ opportunities

  addOpportunity(input: OpportunityInput, opts: { scoreNow?: boolean } = {}): Opportunity {
    const opp: Opportunity = {
      ...input,
      id: this.idFactory(),
      createdAt: this.now().toISOString(),
      source: "manual",
      scoring: { status: "unscored" },
    };
    this.setOpportunities([opp, ...this.state.opportunities]);
    if (opts.scoreNow) this.enqueue([opp.id]);
    return opp;
  }

  updateOpportunity(id: string, input: OpportunityInput, opts: { scoreNow?: boolean } = {}) {
    this.setOpportunities(
      this.state.opportunities.map((o) =>
        o.id === id
          ? {
              ...o,
              ...input,
              scoring: o.scoring.result ? { ...o.scoring, stale: true } : o.scoring,
            }
          : o,
      ),
    );
    if (opts.scoreNow) this.enqueue([id]);
  }

  deleteOpportunity(id: string) {
    const q = this.state.queue;
    if (q.pending.includes(id)) {
      this.set({ queue: { ...q, pending: q.pending.filter((p) => p !== id), batchSize: q.batchSize - 1 } });
    }
    this.setOpportunities(this.state.opportunities.filter((o) => o.id !== id));
  }

  // ------------------------------------------------------------ settings & data

  updateSettings(patch: Partial<Settings>) {
    const settings = { ...this.state.settings, ...patch };
    this.set({ settings });
    this.repos?.settings.save(settings);
    this.markAllStale();
  }

  resetDemoData() {
    if (!this.repos) return;
    const seed = this.repos.resetDemoData();
    this.generation++;
    this.processing = false;
    this.set({
      members: seed.members,
      projects: seed.projects,
      settings: seed.settings,
      opportunities: seed.opportunities,
      queue: EMPTY_QUEUE,
    });
  }

  private markAllStale() {
    this.setOpportunities(
      this.state.opportunities.map((o) => (o.scoring.result ? { ...o, scoring: { ...o.scoring, stale: true } } : o)),
    );
  }

  // ------------------------------------------------------------ queue

  /** Adds ids to the background queue (deduplicated) and starts processing. */
  enqueue(ids: string[]) {
    const q = this.state.queue;
    const known = new Set(this.state.opportunities.map((o) => o.id));
    const fresh = ids.filter((id) => known.has(id) && id !== q.activeId && !q.pending.includes(id));
    if (fresh.length === 0) return;
    const freshSet = new Set(fresh);
    this.set({
      queue: {
        ...q,
        pending: [...q.pending, ...fresh],
        batchSize: (q.activeId || q.pending.length ? q.batchSize : 0) + fresh.length,
        completedInBatch: q.activeId || q.pending.length ? q.completedInBatch : 0,
      },
    });
    this.setOpportunities(
      this.state.opportunities.map((o) => (freshSet.has(o.id) ? { ...o, scoring: { ...o.scoring, status: "queued" } } : o)),
      false,
    );
    void this.process();
  }

  scoreAllUnscored() {
    this.enqueue(this.state.opportunities.filter((o) => o.scoring.status === "unscored").map((o) => o.id));
  }

  rescoreStale() {
    this.enqueue(this.state.opportunities.filter((o) => o.scoring.stale).map((o) => o.id));
  }

  private async process() {
    if (this.processing) return;
    this.processing = true;
    const gen = this.generation;
    const current = () => gen === this.generation;
    try {
      while (current() && this.state.queue.pending.length > 0) {
        const [id, ...rest] = this.state.queue.pending;
        this.set({ queue: { ...this.state.queue, pending: rest, activeId: id, activeStage: 0 } });
        this.patchScoring(id, { status: "scoring" }, false);

        for (let stage = 0; stage < ANALYSIS_STAGES.length; stage++) {
          if (!this.exists(id)) break;
          this.set({ queue: { ...this.state.queue, activeStage: stage } });
          await this.sleep(this.stageDelayMs);
          if (!current()) return; // data was reset while we waited
        }

        const opp = this.state.opportunities.find((o) => o.id === id);
        if (opp) {
          try {
            const result = scoreOpportunity(opp, this.context());
            const scored: Opportunity = {
              ...opp,
              scoring: { status: "scored", result, scoredAt: this.now().toISOString(), stale: false },
            };
            this.setOpportunities(this.state.opportunities.map((o) => (o.id === id ? scored : o)));
            this.completeListeners.forEach((l) => l({ opportunity: scored, result }));
          } catch {
            this.patchScoring(id, { status: "error" });
          }
        }
        const q = this.state.queue;
        this.set({
          queue: { ...q, activeId: null, completedInBatch: Math.min(q.batchSize, q.completedInBatch + 1) },
        });
      }
    } finally {
      if (current()) {
        this.processing = false;
        const q = this.state.queue;
        if (!q.activeId && q.pending.length === 0) {
          // Keep the final "done" count so the header can show completion.
          this.set({ queue: { ...EMPTY_QUEUE, completedInBatch: q.completedInBatch, batchSize: q.batchSize } });
        }
      }
    }
  }

  private exists(id: string) {
    return this.state.opportunities.some((o) => o.id === id);
  }

  private patchScoring(id: string, patch: Partial<Opportunity["scoring"]>, persist = true) {
    this.setOpportunities(
      this.state.opportunities.map((o) => (o.id === id ? { ...o, scoring: { ...o.scoring, ...patch } } : o)),
      persist,
    );
  }
}
