import { test } from "node:test";
import assert from "node:assert/strict";
import { MemoryAdapter } from "@/lib/data/adapters/storage";
import { createRepositories, STORAGE_KEY } from "@/lib/data/repositories";
import { buildSeed } from "@/lib/data/seed";

const NOW = new Date("2026-09-25T10:00:00Z");
const clock = () => NOW;

test("first load seeds and persists", () => {
  const adapter = new MemoryAdapter();
  const repos = createRepositories(adapter, clock);
  assert.equal(repos.seededThisSession, true);
  assert.ok(adapter.read(STORAGE_KEY));
  assert.equal(repos.opportunities.list().length, buildSeed(NOW).opportunities.length);
});

test("added opportunities survive a reload; reset restores the seed exactly", () => {
  const adapter = new MemoryAdapter();
  const repos = createRepositories(adapter, clock);
  const extra = { ...repos.opportunities.list()[0], id: "o-new", title: "New one" };
  repos.opportunities.saveAll([...repos.opportunities.list(), extra]);

  const reloaded = createRepositories(adapter, clock);
  assert.equal(reloaded.seededThisSession, false);
  assert.ok(reloaded.opportunities.list().some((o) => o.id === "o-new"));

  const seed = reloaded.resetDemoData();
  assert.deepEqual(seed.opportunities, buildSeed(NOW).opportunities);
  assert.ok(!createRepositories(adapter, clock).opportunities.list().some((o) => o.id === "o-new"));
});

test("corrupt or outdated storage falls back to the seed", () => {
  const adapter = new MemoryAdapter();
  adapter.write(STORAGE_KEY, "{not json");
  assert.equal(createRepositories(adapter, clock).seededThisSession, true);
  adapter.write(STORAGE_KEY, JSON.stringify({ schemaVersion: 0, members: [] }));
  assert.equal(createRepositories(adapter, clock).seededThisSession, true);
});

test("malformed records fall back to the seed; bad settings fields fall back to defaults", () => {
  const adapter = new MemoryAdapter();
  const good = JSON.parse(JSON.stringify({ ...buildSeed(NOW), schemaVersion: 1, savedAt: NOW.toISOString() }));
  adapter.write(STORAGE_KEY, JSON.stringify({ ...good, opportunities: [null] }));
  assert.equal(createRepositories(adapter, clock).seededThisSession, true);

  adapter.write(STORAGE_KEY, JSON.stringify({ ...good, settings: { minBudget: "abc", stageFit: { full_build: 10 } } }));
  const repos = createRepositories(adapter, clock);
  assert.equal(repos.seededThisSession, false);
  assert.equal(repos.settings.get().minBudget, 10_000);
  assert.deepEqual(repos.settings.get().stageFit, { full_build: 10, prototype: 9, recovery: 6 });
});
