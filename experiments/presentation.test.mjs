import test from "node:test";
import assert from "node:assert/strict";
import { experiments } from "./content.mjs";
import { models } from "./models.mjs";
import { controlHints, resultNotes, annotatedCharts } from "./live-notes.mjs";
import { chart } from "./charts.mjs";
import { networkView } from "./network-view.mjs";
const defaults = (id) => ({
  seed: 42,
  ...Object.fromEntries(experiments[id].controls.map((c) => [c.key, c.value])),
});
for (const id of Object.keys(experiments))
  test(`${id}: every scenario has finite chart geometry and result-backed explanations`, () => {
    const e = experiments[id];
    for (const p of [
      defaults(id),
      ...e.presets.map(([, overrides]) => ({ ...defaults(id), ...overrides })),
    ]) {
      const r = models[id](p),
        notes = resultNotes(id, p, r),
        hints = controlHints(id, p);
      assert.ok(notes.title && notes.text && notes.watch);
      assert.doesNotMatch(JSON.stringify(notes), /NaN|undefined|Infinity/);
      for (const c of e.controls)
        assert.ok(
          hints[c.key]?.length > 20,
          `missing explanation for ${c.key}`,
        );
      r.charts.forEach((c, i) => {
        const html = chart(c, i);
        assert.doesNotMatch(html, /NaN|Infinity|undefined/);
        assert.match(html, /type="range"/);
        assert.match(html, /Read chart data/);
      });
    }
  });
test("staged allocation explanation preserves total weights and distinguishes dependence from correlation", () => {
  const hints = controlHints("risk", {
    ...defaults("risk"),
    equity: 20,
    bond: 25,
    tails: 1,
    corr: 0,
  });
  assert.match(hints.equity, /20% equity, 20% bonds and 60% gold/);
  assert.match(hints.corr, /does not imply independence/);
  assert.match(hints.tails, /preserving analytic covariance/);
});
test("mechanism explanations handle price identity, zero turnover and off-equilibrium bids", () => {
  assert.match(
    controlHints("amm", { ...defaults("amm"), ratio: 1 }).ratio,
    /equals holding/,
  );
  assert.match(
    controlHints("hedge", { ...defaults("hedge"), cost: 0 }).cost,
    /Trading is free/,
  );
  assert.match(
    controlHints("auctions", { ...defaults("auctions"), shade: 130 }).shade,
    /off-equilibrium/,
  );
  assert.match(
    controlHints("auctions", { ...defaults("auctions"), shade: 130 }).shade,
    /exceed values/,
  );
  const p = { ...defaults("orderbook"), size: 6000, depth: 30 },
    r = models.orderbook(p);
  assert.match(resultNotes("orderbook", p, r).title, /runs out/);
  assert.ok(
    resultNotes("orderbook", p, r).text.includes(
      r.raw.remaining.toLocaleString("en-US"),
    ),
  );
});
test("chart labels escape markup and constant axes remain finite", () => {
  const html = chart(
    {
      title: '<img onerror="x">',
      x: "<x>",
      y: "<y>",
      series: [{ name: "<script>", points: [[1, 1]] }],
    },
    0,
  );
  assert.ok(!html.includes("<img"));
  assert.ok(!html.includes("<script>"));
  assert.match(html, /&lt;img/);
  assert.doesNotMatch(html, /NaN|Infinity/);
});
test("network diagrams account for real liabilities without inventing outside graph edges", () => {
  const r = models.contagion(defaults("contagion")),
    html = networkView(r);
  assert.equal((html.match(/data-bank="/g) || []).length, 8);
  assert.equal(
    (html.match(/data-from="/g) || []).length,
    r.network.L.flat().filter((v) => v > 0).length,
  );
  assert.match(html, /Outside claims are included/);
  assert.doesNotMatch(html, /NaN|undefined/);
});

test("AMM markers use exact completed outputs and respect the sampled domain", () => {
  const p = defaults("amm"),
    r = models.amm(p),
    original = JSON.stringify(r.charts),
    view = annotatedCharts("amm", p, r);
  assert.deepEqual(view[0].series.at(-1).points, [[p.trade, r.raw.out]]);
  assert.deepEqual(view[1].series.at(-1).points, [
    [p.ratio, r.metrics[2].value],
  ]);
  assert.equal(JSON.stringify(r.charts), original);
  const large = { ...p, reserve: 100, trade: 10000 },
    outside = annotatedCharts("amm", large, models.amm(large));
  assert.match(outside[0].notice, /beyond that range/);
  assert.equal(outside[0].series.length, 2);
});
