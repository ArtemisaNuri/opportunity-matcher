/**
 * Realistic sample data. Dates are generated relative to "today" so the demo
 * always shows a live-looking pipeline. Replace with real data (see
 * knowledge/action-items.md) once the roster and projects are provided.
 */
import { addMonths, addWeeks, monthKey, monthStart, todayISO, type ISODate } from "@/lib/dates";
import type {
  Assignment,
  Opportunity,
  Project,
  Settings,
  TeamMember,
} from "@/lib/domain/types";
import { scoreOpportunity } from "@/lib/scoring/engine";

export const DEFAULT_SETTINGS: Settings = {
  minBudget: 10_000,
  restrictedSectors: ["Healthcare"],
  preferredTags: ["Web App", "Dashboard", "Mobile", "Next.js", "SaaS", "Marketplace", "Fintech", "Data"],
  capacityGateRatio: 0.8,
  stageFit: { full_build: 10, prototype: 9, recovery: 6 },
};

export interface SeedData {
  members: TeamMember[];
  projects: Project[];
  opportunities: Opportunity[];
  settings: Settings;
}

const members: TeamMember[] = [
  { id: "m-ana", name: "Ana Ruiz", role: "Senior Engineer", weeklyHours: 40, skills: ["Next.js", "Node", "Postgres"] },
  { id: "m-marcus", name: "Marcus Lee", role: "Engineer", weeklyHours: 40, skills: ["React", "TypeScript"] },
  { id: "m-priya", name: "Priya Shah", role: "Product Designer", weeklyHours: 32, skills: ["Designer", "Figma", "UX research"] },
  { id: "m-daniel", name: "Daniel Okafor", role: "Senior Engineer", weeklyHours: 40, skills: ["Mobile", "React Native", "AWS"] },
  { id: "m-elena", name: "Elena Kovač", role: "Engineer", weeklyHours: 40, skills: ["Python", "Data", "APIs"] },
  { id: "m-sam", name: "Sam Rivera", role: "QA Engineer", weeklyHours: 30, skills: ["QA", "Playwright", "Test plans"] },
  { id: "m-lina", name: "Lina Hoxha", role: "Engineer", weeklyHours: 40, skills: ["React", "Tailwind", "Frontend"] },
  { id: "m-theo", name: "Theo Grant", role: "Project Manager", weeklyHours: 24, skills: ["Delivery", "Scoping"] },
];

const a = (memberId: string, hoursPerWeek: number, start: ISODate, end: ISODate): Assignment => ({
  memberId,
  hoursPerWeek,
  start,
  end,
});

function buildProjects(t: ISODate): Project[] {
  const M = (n: number) => addMonths(t, n);
  const W = (n: number) => addWeeks(t, n);

  const harbor = { start: M(-3), launch: addWeeks(M(2), 1) };
  const fieldnote = { start: M(-1), launch: addWeeks(M(2), 2) };
  const crescent = { start: M(-2), launch: M(5) };
  const atlas = { start: addWeeks(M(1), 2), launch: M(11) };
  const northwind = { start: M(3), launch: M(7) };

  return [
    {
      id: "p-harbor",
      name: "Harborline Portal",
      client: "Harborline Logistics",
      colorSlot: 0,
      stage: "full_build",
      start: harbor.start,
      launch: harbor.launch,
      milestones: [
        { label: "Beta", date: M(1) },
        { label: "Launch", date: harbor.launch },
      ],
      assignments: [
        a("m-ana", 32, harbor.start, harbor.launch),
        a("m-marcus", 36, harbor.start, harbor.launch),
        a("m-priya", 12, harbor.start, W(6)),
        a("m-lina", 16, M(1), harbor.launch),
        a("m-sam", 14, M(-1), harbor.launch),
        a("m-theo", 6, harbor.start, harbor.launch),
      ],
    },
    {
      id: "p-fieldnote",
      name: "Fieldnote Mobile",
      client: "Fieldnote Studio",
      colorSlot: 1,
      stage: "prototype",
      start: fieldnote.start,
      launch: fieldnote.launch,
      milestones: [
        { label: "Usability test", date: M(1) },
        { label: "Prototype handoff", date: fieldnote.launch },
      ],
      assignments: [
        a("m-daniel", 32, fieldnote.start, fieldnote.launch),
        a("m-priya", 14, fieldnote.start, fieldnote.launch),
        a("m-lina", 20, fieldnote.start, fieldnote.launch),
      ],
    },
    {
      id: "p-crescent",
      name: "Crescent Recovery",
      client: "Crescent Credit Union",
      colorSlot: 2,
      stage: "recovery",
      start: crescent.start,
      launch: crescent.launch,
      milestones: [
        { label: "Stabilized", date: M(2) },
        { label: "Relaunch", date: crescent.launch },
      ],
      assignments: [
        a("m-elena", 34, crescent.start, crescent.launch),
        a("m-daniel", 8, M(1), crescent.launch),
        a("m-sam", 10, crescent.start, crescent.launch),
        a("m-theo", 6, crescent.start, crescent.launch),
      ],
    },
    {
      id: "p-atlas",
      name: "Atlas Commerce",
      client: "Atlas Outfitters",
      colorSlot: 3,
      stage: "full_build",
      start: atlas.start,
      launch: atlas.launch,
      milestones: [
        { label: "Design sign-off", date: M(3) },
        { label: "MVP", date: M(7) },
        { label: "Launch", date: atlas.launch },
      ],
      assignments: [
        a("m-ana", 30, atlas.start, atlas.launch),
        a("m-marcus", 32, atlas.start, atlas.launch),
        a("m-priya", 18, atlas.start, M(6)),
        a("m-lina", 26, M(2), atlas.launch),
        a("m-daniel", 14, M(3), M(8)),
        a("m-sam", 12, M(5), atlas.launch),
        a("m-theo", 8, atlas.start, atlas.launch),
      ],
    },
    {
      id: "p-northwind",
      name: "Northwind Insights",
      client: "Northwind Analytics",
      colorSlot: 4,
      stage: "prototype",
      start: northwind.start,
      launch: northwind.launch,
      milestones: [{ label: "Demo day", date: northwind.launch }],
      assignments: [
        a("m-elena", 30, northwind.start, northwind.launch),
        a("m-daniel", 18, northwind.start, northwind.launch),
        a("m-priya", 8, northwind.start, northwind.launch),
        a("m-sam", 8, northwind.start, northwind.launch),
      ],
    },
  ];
}

type OppSeed = Omit<Opportunity, "createdAt" | "source" | "scoring"> & { preScored: boolean; createdDaysAgo: number };

function buildOpportunities(t: ISODate): OppSeed[] {
  // Anchored to today (not the month start) so no preferred start lands in the past.
  const M = (n: number) => addMonths(t, n);
  const W = (n: number) => addWeeks(t, n);
  return [
    {
      id: "o-lumen",
      title: "Customer Energy Portal",
      client: "Lumen Energy",
      sector: "Energy",
      profile:
        "Self-serve portal where commercial customers track usage, download invoices and manage sites. Replaces a legacy PHP app; needs SSO and a usage dashboard.",
      profileTags: ["Web App", "Dashboard", "Next.js"],
      stage: "full_build",
      clientBudget: 85_000,
      costToBuild: 58_000,
      requirements: {
        hoursPerWeek: 56,
        durationWeeks: 14,
        preferredStart: M(3),
        teamSize: 3,
        roles: ["Senior Engineer", "Engineer", "Designer"],
        startFlexibilityWeeks: 3,
      },
      deadline: M(7),
      milestones: [
        { label: "Discovery done", date: addWeeks(M(3), 2) },
        { label: "Usage dashboard", date: addWeeks(M(3), 8) },
      ],
      preScored: true,
      createdDaysAgo: 9,
    },
    {
      id: "o-vela",
      title: "Travel Booking Platform",
      client: "Vela Journeys",
      sector: "Travel",
      profile:
        "Mobile-first booking platform for boutique tours with a partner availability dashboard. Strong fit, but it wants to start while Harborline and Atlas overlap.",
      profileTags: ["Mobile", "Marketplace", "SaaS"],
      stage: "full_build",
      clientBudget: 48_000,
      costToBuild: 30_000,
      requirements: {
        hoursPerWeek: 36,
        durationWeeks: 14,
        preferredStart: W(1),
        teamSize: 2,
        roles: ["Engineer", "Designer"],
        startFlexibilityWeeks: 2,
      },
      deadline: W(19),
      milestones: [{ label: "Investor demo", date: W(11) }],
      preScored: true,
      createdDaysAgo: 4,
    },
    {
      id: "o-medtrack",
      title: "Patient Intake Platform",
      client: "MedTrack Clinics",
      sector: "Healthcare",
      profile:
        "Digital intake forms and appointment dashboard for a 12-clinic group. Stores patient records, so HIPAA compliance is required.",
      profileTags: ["Web App", "Dashboard", "SaaS"],
      stage: "full_build",
      clientBudget: 120_000,
      costToBuild: 70_000,
      requirements: {
        hoursPerWeek: 50,
        durationWeeks: 16,
        preferredStart: M(4),
        teamSize: 3,
        roles: ["Senior Engineer", "Designer"],
        startFlexibilityWeeks: 4,
      },
      deadline: M(10),
      milestones: [],
      preScored: true,
      createdDaysAgo: 14,
    },
    {
      id: "o-kite",
      title: "Payments Dashboard Rescue",
      client: "Kite Pay",
      sector: "Fintech",
      profile:
        "Previous agency left a half-built merchant dashboard with failing tests. Stabilize, finish reporting, hand back to their in-house team.",
      profileTags: ["Fintech", "Dashboard"],
      stage: "recovery",
      clientBudget: 42_000,
      costToBuild: 34_000,
      requirements: {
        hoursPerWeek: 44,
        durationWeeks: 10,
        preferredStart: M(2),
        teamSize: 2,
        roles: ["Senior Engineer", "QA"],
        startFlexibilityWeeks: 2,
      },
      deadline: M(5),
      milestones: [{ label: "Tests green", date: addWeeks(M(2), 3) }],
      preScored: true,
      createdDaysAgo: 6,
    },
    {
      id: "o-orchard",
      title: "Loyalty App Prototype",
      client: "Orchard Grocers",
      sector: "Retail",
      profile: "Clickable loyalty and coupons prototype to test with shoppers in two pilot stores.",
      profileTags: ["Mobile", "Retail"],
      stage: "prototype",
      clientBudget: 16_000,
      costToBuild: 13_000,
      requirements: {
        hoursPerWeek: 36,
        durationWeeks: 6,
        preferredStart: M(2),
        teamSize: 2,
        roles: ["Designer", "Engineer"],
        startFlexibilityWeeks: 4,
      },
      deadline: M(4),
      milestones: [],
      preScored: true,
      createdDaysAgo: 11,
    },
    {
      id: "o-pinecone",
      title: "Donor CRM",
      client: "Pinecone Foundation",
      sector: "Nonprofit",
      profile: "Lightweight donor tracking with Mailchimp sync. Small board-approved budget.",
      profileTags: ["CRM"],
      stage: "full_build",
      clientBudget: 8_000,
      costToBuild: 18_000,
      requirements: {
        hoursPerWeek: 30,
        durationWeeks: 10,
        preferredStart: W(2),
        teamSize: 2,
        roles: ["Engineer"],
        startFlexibilityWeeks: 6,
      },
      milestones: [],
      preScored: true,
      createdDaysAgo: 20,
    },
    {
      id: "o-relay",
      title: "Freight Tracking Platform",
      client: "Relay Freight",
      sector: "Logistics",
      profile:
        "Real-time shipment tracking for shippers and carriers with a data pipeline from telematics providers and a customer-facing dashboard.",
      profileTags: ["Web App", "Data", "Dashboard"],
      stage: "full_build",
      clientBudget: 140_000,
      costToBuild: 96_000,
      requirements: {
        hoursPerWeek: 100,
        durationWeeks: 20,
        preferredStart: M(1),
        teamSize: 4,
        roles: ["Senior Engineer", "Engineer", "Designer", "QA"],
        startFlexibilityWeeks: 6,
      },
      deadline: M(8),
      milestones: [{ label: "Pilot with 3 carriers", date: M(4) }],
      preScored: false,
      createdDaysAgo: 2,
    },
    {
      id: "o-solace",
      title: "Wellness Class Marketplace",
      client: "Solace Studios",
      sector: "Fitness",
      profile: "Marketplace for yoga and pilates studios to list classes and take bookings with Stripe payouts.",
      profileTags: ["Marketplace", "Web App"],
      stage: "full_build",
      clientBudget: 34_000,
      costToBuild: 29_000,
      requirements: {
        hoursPerWeek: 40,
        durationWeeks: 12,
        preferredStart: M(5),
        teamSize: 2,
        roles: ["Engineer", "Designer"],
        startFlexibilityWeeks: 4,
      },
      deadline: M(9),
      milestones: [],
      preScored: false,
      createdDaysAgo: 1,
    },
    {
      id: "o-ninth",
      title: "Brand Site Refresh",
      client: "Studio Ninth",
      sector: "Media",
      profile: "Marketing site rebuild with a CMS. Content is ready; mostly design and front-end.",
      profileTags: ["Website", "CMS"],
      stage: "prototype",
      clientBudget: 12_000,
      costToBuild: 9_000,
      requirements: {
        hoursPerWeek: 24,
        durationWeeks: 5,
        preferredStart: M(2),
        teamSize: 2,
        roles: ["Designer", "Engineer"],
        startFlexibilityWeeks: 4,
      },
      milestones: [],
      preScored: false,
      createdDaysAgo: 3,
    },
    {
      id: "o-ledger",
      title: "Invoice Automation SaaS",
      client: "Ledgerly",
      sector: "Fintech",
      profile:
        "B2B SaaS that reads supplier invoices, matches them to POs and pushes to QuickBooks. Founder has design files; needs an MVP team.",
      profileTags: ["SaaS", "Fintech", "Web App"],
      stage: "full_build",
      clientBudget: 95_000,
      costToBuild: 64_000,
      requirements: {
        hoursPerWeek: 60,
        durationWeeks: 16,
        preferredStart: M(4),
        teamSize: 3,
        roles: ["Senior Engineer", "Engineer"],
        startFlexibilityWeeks: 4,
      },
      deadline: M(9),
      milestones: [{ label: "MVP", date: addWeeks(M(4), 12) }],
      preScored: false,
      createdDaysAgo: 0,
    },
  ];
}

/** Anchor date for generated data: the first of the current month keeps month grids tidy. */
export function seedAnchor(now: Date = new Date()): ISODate {
  return monthStart(monthKey(todayISO(now)));
}

export function buildSeed(now: Date = new Date()): SeedData {
  const today = todayISO(now);
  const t = seedAnchor(now);
  const projects = buildProjects(t);
  const settings: Settings = structuredCloneSafe(DEFAULT_SETTINGS);
  const ctx = { members, projects, settings, today };
  const opportunities: Opportunity[] = buildOpportunities(today).map(({ preScored, createdDaysAgo, ...o }) => {
    const created = new Date(now.getTime() - createdDaysAgo * 86_400_000).toISOString();
    const base: Opportunity = { ...o, createdAt: created, source: "seed", scoring: { status: "unscored" } };
    if (!preScored) return base;
    return {
      ...base,
      scoring: { status: "scored", result: scoreOpportunity(base, ctx), scoredAt: created },
    };
  });
  return { members: structuredCloneSafe(members), projects, opportunities, settings };
}

function structuredCloneSafe<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}
