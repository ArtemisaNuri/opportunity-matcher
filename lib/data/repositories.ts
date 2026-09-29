/**
 * Repository layer. UI and store code read and write data only through these
 * interfaces. Today they are backed by one versioned JSON document in browser
 * storage; later they can be backed by an API without touching the UI.
 */
import type { Opportunity, Project, Settings, TeamMember } from "@/lib/domain/types";
import { buildSeed, DEFAULT_SETTINGS, type SeedData } from "@/lib/data/seed";
import type { StorageAdapter } from "@/lib/data/adapters/storage";
import { isValidISODate } from "@/lib/dates";

export const STORAGE_KEY = "opportunity-matcher:data";
export const SCHEMA_VERSION = 1;

interface StoredDocument extends SeedData {
  schemaVersion: number;
  savedAt: string;
}

export interface OpportunityRepository {
  list(): Opportunity[];
  saveAll(items: Opportunity[]): void;
}
export interface TeamRepository {
  list(): TeamMember[];
}
export interface ProjectRepository {
  list(): Project[];
}
export interface SettingsRepository {
  get(): Settings;
  save(settings: Settings): void;
}

export interface Repositories {
  opportunities: OpportunityRepository;
  team: TeamRepository;
  projects: ProjectRepository;
  settings: SettingsRepository;
  /** Restores the sample data and returns it. */
  resetDemoData(): SeedData;
  /** True when the data came from a fresh seed (first visit, reset, or unreadable storage). */
  readonly seededThisSession: boolean;
}

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const isStr = (v: unknown): v is string => typeof v === "string";

function isValidOpportunity(v: unknown): v is Opportunity {
  if (!isObj(v) || !isStr(v.id) || !isStr(v.title) || !isStr(v.sector) || !isObj(v.scoring)) return false;
  if (!isNum(v.clientBudget) || !isNum(v.costToBuild) || !Array.isArray(v.profileTags)) return false;
  const r = v.requirements;
  return (
    isObj(r) &&
    isNum(r.hoursPerWeek) &&
    isNum(r.durationWeeks) &&
    isNum(r.teamSize) &&
    isStr(r.preferredStart) &&
    isValidISODate(r.preferredStart) &&
    Array.isArray(r.roles)
  );
}

function isValidMember(v: unknown): v is TeamMember {
  return isObj(v) && isStr(v.id) && isStr(v.name) && isNum(v.weeklyHours) && Array.isArray(v.skills);
}

function isValidProject(v: unknown): v is Project {
  return (
    isObj(v) &&
    isStr(v.id) &&
    isStr(v.name) &&
    isStr(v.start) &&
    isStr(v.launch) &&
    Array.isArray(v.assignments) &&
    v.assignments.every((a) => isObj(a) && isStr(a.memberId) && isNum(a.hoursPerWeek) && isStr(a.start) && isStr(a.end))
  );
}

/** Field-by-field merge over the defaults: bad or missing values fall back to the default. */
export function sanitizeSettings(raw: unknown): Settings {
  const d = DEFAULT_SETTINGS;
  if (!isObj(raw)) return JSON.parse(JSON.stringify(d)) as Settings;
  const strList = (v: unknown, fallback: string[]) =>
    Array.isArray(v) && v.every(isStr) ? (v as string[]) : [...fallback];
  const stage = isObj(raw.stageFit) ? raw.stageFit : {};
  const fit = (k: keyof Settings["stageFit"]) => (isNum(stage[k]) ? Math.max(0, Math.min(10, stage[k] as number)) : d.stageFit[k]);
  return {
    minBudget: isNum(raw.minBudget) && raw.minBudget >= 0 ? raw.minBudget : d.minBudget,
    restrictedSectors: strList(raw.restrictedSectors, d.restrictedSectors),
    preferredTags: strList(raw.preferredTags, d.preferredTags),
    capacityGateRatio:
      isNum(raw.capacityGateRatio) && raw.capacityGateRatio > 0 && raw.capacityGateRatio <= 1
        ? raw.capacityGateRatio
        : d.capacityGateRatio,
    stageFit: { full_build: fit("full_build"), prototype: fit("prototype"), recovery: fit("recovery") },
  };
}

function isValidDocument(value: unknown): value is StoredDocument {
  if (!isObj(value)) return false;
  const v = value as Partial<StoredDocument>;
  return (
    v.schemaVersion === SCHEMA_VERSION &&
    Array.isArray(v.members) &&
    v.members.every(isValidMember) &&
    Array.isArray(v.projects) &&
    v.projects.every(isValidProject) &&
    Array.isArray(v.opportunities) &&
    v.opportunities.every(isValidOpportunity) &&
    isObj(v.settings)
  );
}

export function createRepositories(adapter: StorageAdapter, now: () => Date = () => new Date()): Repositories {
  let seeded = false;

  const load = (): StoredDocument => {
    const raw = adapter.read(STORAGE_KEY);
    if (raw) {
      try {
        const parsed: unknown = JSON.parse(raw);
        if (isValidDocument(parsed)) {
          return { ...parsed, settings: sanitizeSettings(parsed.settings) };
        }
      } catch {
        /* corrupt → fall through to seed */
      }
    }
    seeded = true;
    const doc: StoredDocument = { ...buildSeed(now()), schemaVersion: SCHEMA_VERSION, savedAt: now().toISOString() };
    adapter.write(STORAGE_KEY, JSON.stringify(doc));
    return doc;
  };

  let doc = load();

  const persist = () => {
    doc = { ...doc, savedAt: now().toISOString() };
    adapter.write(STORAGE_KEY, JSON.stringify(doc));
  };

  return {
    get seededThisSession() {
      return seeded;
    },
    opportunities: {
      list: () => doc.opportunities,
      saveAll: (items) => {
        doc = { ...doc, opportunities: items };
        persist();
      },
    },
    team: { list: () => doc.members },
    projects: { list: () => doc.projects },
    settings: {
      get: () => doc.settings,
      save: (settings) => {
        doc = { ...doc, settings };
        persist();
      },
    },
    resetDemoData: () => {
      adapter.remove(STORAGE_KEY);
      seeded = true;
      doc = { ...buildSeed(now()), schemaVersion: SCHEMA_VERSION, savedAt: now().toISOString() };
      adapter.write(STORAGE_KEY, JSON.stringify(doc));
      return { members: doc.members, projects: doc.projects, opportunities: doc.opportunities, settings: doc.settings };
    },
  };
}
