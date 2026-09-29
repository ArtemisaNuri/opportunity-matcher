import { test } from "node:test";
import assert from "node:assert/strict";
import { AppStore } from "@/lib/store/app-store";
import { MemoryAdapter } from "@/lib/data/adapters/storage";
import { createRepositories } from "@/lib/data/repositories";

const NOW = new Date("2026-09-25T10:00:00Z");

function makeStore() {
  const adapter = new MemoryAdapter();
  const store = new AppStore({ stageDelayMs: 0, sleep: () => Promise.resolve(), now: () => NOW });
  store.hydrate(createRepositories(adapter, () => NOW));
  return { store, adapter };
}

const drain = async (store: AppStore) => {
  for (let i = 0; i < 200 && (store.getState().queue.activeId || store.getState().queue.pending.length); i++) {
    await new Promise((r) => setTimeout(r, 0));
  }
};

test("queue processes unscored items in order and fires completion events", async () => {
  const { store } = makeStore();
  const unscored = store.getState().opportunities.filter((o) => o.scoring.status === "unscored").map((o) => o.id);
  assert.ok(unscored.length >= 4);
  const done: string[] = [];
  store.onScoreComplete((e) => done.push(e.opportunity.id));
  store.scoreAllUnscored();
  assert.equal(store.getState().queue.batchSize, unscored.length);
  await drain(store);
  assert.deepEqual(done, unscored);
  assert.ok(store.getState().opportunities.every((o) => o.scoring.status === "scored"));
});

test("re-scoring an item that is already queued does not duplicate it", async () => {
  const { store } = makeStore();
  const ids = store.getState().opportunities.slice(0, 3).map((o) => o.id);
  store.enqueue(ids);
  store.enqueue([ids[1], ids[2]]);
  const q = store.getState().queue;
  const all = [q.activeId, ...q.pending].filter(Boolean);
  assert.equal(new Set(all).size, all.length);
  assert.equal(all.length, 3);
  await drain(store);
});

test("add with Score Now queues then scores; changes persist across reloads", async () => {
  const { store, adapter } = makeStore();
  const template = store.getState().opportunities[0];
  const { id: _id, createdAt: _c, source: _s, scoring: _sc, ...input } = template;
  const created = store.addOpportunity({ ...input, title: "Brand new" }, { scoreNow: true });
  assert.notEqual(store.getState().opportunities.find((o) => o.id === created.id)!.scoring.status, "unscored");
  await drain(store);
  assert.equal(store.getState().opportunities.find((o) => o.id === created.id)!.scoring.status, "scored");

  const reloaded = new AppStore({ stageDelayMs: 0, sleep: () => Promise.resolve(), now: () => NOW });
  reloaded.hydrate(createRepositories(adapter, () => NOW));
  const again = reloaded.getState().opportunities.find((o) => o.id === created.id);
  assert.equal(again?.scoring.status, "scored");
});

test("changing settings marks scored results stale; reset restores the seed", async () => {
  const { store } = makeStore();
  store.updateSettings({ minBudget: 50_000 });
  assert.ok(store.getState().opportunities.filter((o) => o.scoring.result).every((o) => o.scoring.stale));
  store.addOpportunity({ ...store.getState().opportunities[0], title: "Temp" });
  store.resetDemoData();
  assert.ok(!store.getState().opportunities.some((o) => o.title === "Temp"));
  assert.equal(store.getState().settings.minBudget, 10_000);
});

test("reset during an in-flight analysis stops the old loop and restores the seed exactly", async () => {
  const adapter = new MemoryAdapter();
  let release: () => void = () => {};
  const gate = () => new Promise<void>((r) => (release = r));
  const store = new AppStore({ stageDelayMs: 0, sleep: gate, now: () => NOW });
  store.hydrate(createRepositories(adapter, () => NOW));
  const completed: string[] = [];
  store.onScoreComplete((e) => completed.push(e.opportunity.id));
  store.enqueue(["o-relay", "o-solace"]);
  store.resetDemoData();
  release(); // the old loop wakes up after the reset
  await new Promise((r) => setTimeout(r, 0));
  assert.deepEqual(completed, []);
  assert.equal(store.getState().opportunities.find((o) => o.id === "o-relay")!.scoring.status, "unscored");
  assert.equal(store.getState().queue.activeId, null);
});
