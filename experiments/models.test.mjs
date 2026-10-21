import test from "node:test";
import assert from "node:assert/strict";
import {
  rng,
  normal,
  mean,
  sd,
  quantile,
  histogram,
  match,
  call,
  clearNetwork,
  models,
} from "./models.mjs";
import { experiments } from "./content.mjs";
const defaults = (id) =>
  Object.fromEntries([
    ["seed", 42],
    ...experiments[id].controls.map((c) => [c.key, c.value]),
  ]);
const near = (a, b, e = 1e-8) =>
  assert.ok(Math.abs(a - b) < e, `${a} not within ${e} of ${b}`);
test("PRNG replays exactly and remains inside [0,1)", () => {
  const a = rng(17),
    b = rng(17);
  for (let i = 0; i < 1000; i++) {
    const v = a();
    assert.equal(v, b());
    assert.ok(v >= 0 && v < 1);
  }
});
test("normal sampler has approximately unit first two moments", () => {
  const r = rng(99),
    a = Array.from({ length: 30000 }, () => normal(r));
  near(mean(a), 0, 0.025);
  near(sd(a), 1, 0.025);
});
test("quantile interpolates and histogram conserves counts, including constant data", () => {
  near(quantile([4, 1, 3, 2], 0.5), 2.5);
  assert.equal(
    histogram([1, 1, 1]).reduce((s, a) => s + a[1], 0),
    3,
  );
  assert.equal(
    histogram([0, 2, 4, 6], 2).reduce((s, a) => s + a[1], 0),
    4,
  );
});
test("FIFO within price, best price before earlier worse-priced order", () => {
  const book = {
    bids: [],
    asks: [
      { id: 1, price: 101, qty: 7 },
      { id: 3, price: 100, qty: 5 },
      { id: 2, price: 100, qty: 5 },
    ],
  };
  const r = match(book, { side: "buy", type: "market", qty: 12 });
  assert.deepEqual(
    r.fills.map((f) => f.maker),
    [2, 3, 1],
  );
  assert.equal(r.notional, 1202);
  assert.equal(book.asks[0].qty, 5);
});
test("partial limit order rests only its unfilled remainder", () => {
  const book = {
    bids: [],
    asks: [
      { id: 0, price: 100, qty: 3 },
      { id: 1, price: 102, qty: 4 },
    ],
  };
  const r = match(book, {
    id: 2,
    side: "buy",
    type: "limit",
    price: 101,
    qty: 9,
  });
  assert.equal(r.filled, 3);
  assert.equal(book.bids[0].qty, 6);
  assert.equal(book.asks[0].price, 102);
});
test("market order exhaustion neither invents liquidity nor rests remainder", () => {
  const book = { bids: [{ id: 0, price: 99, qty: 3 }], asks: [] },
    r = match(book, { side: "sell", type: "market", qty: 8 });
  assert.equal(r.filled, 3);
  assert.equal(r.remaining, 5);
  assert.equal(book.asks.length, 0);
  assert.equal(book.bids.length, 0);
});
test("uncrossed limit leaves opposite side unchanged", () => {
  const book = { bids: [], asks: [{ id: 0, price: 102, qty: 8 }] };
  match(book, { id: 1, side: "buy", type: "limit", price: 100, qty: 5 });
  assert.equal(book.asks[0].qty, 8);
  assert.equal(book.bids[0].qty, 5);
});
test("AMM known zero-fee swap and invariant", () => {
  const r = models.amm({
    ...defaults("amm"),
    reserve: 100,
    trade: 100,
    fee: 0,
  });
  near(r.raw.out, 5000);
  near(r.raw.newX * r.raw.newY, 1000000);
});
test("AMM fees grow k, preserve positive reserves and reduce output", () => {
  const p = defaults("amm"),
    a = models.amm({ ...p, fee: 0 }),
    b = models.amm(p);
  assert.ok(b.raw.newX * b.raw.newY > p.reserve ** 2 * 100);
  assert.ok(b.raw.out < a.raw.out);
  assert.ok(b.raw.newY > 0);
});
test("AMM no swap and unchanged relative price give zero losses", () => {
  const r = models.amm({ ...defaults("amm"), trade: 0, ratio: 1 });
  near(r.raw.out, 0);
  near(r.raw.il, 0);
  near(r.metrics[1].value, 0);
});
test("AMM divergence loss at doubled price and reciprocal symmetry", () => {
  near(
    models.amm({ ...defaults("amm"), ratio: 2 }).raw.il,
    -0.05719095841793653,
  );
  near(
    models.amm({ ...defaults("amm"), ratio: 0.5 }).raw.il,
    models.amm({ ...defaults("amm"), ratio: 2 }).raw.il,
  );
});
test("Black–Scholes numerical benchmark (S=K=100, r=5%, vol=20%, T=1)", () => {
  const c = call(100, 100, 1, 0.05, 0.2);
  near(c.price, 10.450583572185565, 2e-5);
  near(c.delta, 0.6368306511756191, 1e-6);
  near(c.gamma, 0.018762017345846895, 1e-8);
  near(c.vega, 0.3752403469169379, 1e-7);
});
test("option expiry, zero volatility and price bounds", () => {
  near(call(110, 100, 0, 0.04, 0.2).price, 10);
  near(call(90, 100, 0, 0.04, 0.2).price, 0);
  near(call(100, 100, 1, 0.04, 0).price, 100 - 100 * Math.exp(-0.04));
  for (const S of [20, 100, 500]) {
    const c = call(S, 100, 1, 0.04, 0.2);
    assert.ok(c.price >= Math.max(0, S - 100 * Math.exp(-0.04)) - 1e-5);
    assert.ok(c.price <= S);
  }
});
test("transaction costs cannot improve any paired hedge outcome", () => {
  const p = { ...defaults("hedge"), cost: 10 },
    r = models.hedge(p);
  assert.equal(r.raw.pnl.length, 600);
  r.raw.pnl.forEach((v, i) => assert.ok(v <= r.raw.noCostPnl[i] + 1e-10));
  assert.ok(mean(r.raw.pnl) < mean(r.raw.noCostPnl));
});
test("matched-volatility cost-free hedge mean is near zero", () => {
  const r = models.hedge({ ...defaults("hedge"), steps: 252, cost: 0 });
  assert.ok(Math.abs(mean(r.raw.pnl)) < (4 * sd(r.raw.pnl)) / Math.sqrt(600));
});
test("portfolio weights sum to one and remain long-only", () => {
  for (const equity of [0, 40, 100])
    for (const bond of [0, 50, 100]) {
      const r = models.risk({ ...defaults("risk"), equity, bond });
      near(
        r.raw.weights.reduce((s, x) => s + x, 0),
        1,
      );
      assert.ok(r.raw.weights.every((x) => x >= -1e-10));
    }
});
test("pure equity analytic mean and volatility", () => {
  const r = models.risk({ ...defaults("risk"), equity: 100 });
  near(r.metrics[0].value, 8);
  near(r.metrics[1].value, 20);
});
test("60/30/10 covariance agrees with explicit independent calculation", () => {
  const r = models.risk(defaults("risk"));
  near(r.metrics[0].value, 6.5);
  near(
    r.metrics[1].value,
    100 *
      Math.sqrt(
        0.6 ** 2 * 0.2 ** 2 +
          0.3 ** 2 * 0.07 ** 2 +
          0.1 ** 2 * 0.15 ** 2 +
          2 * 0.6 * 0.3 * -0.2 * 0.2 * 0.07,
      ),
  );
});
test("tail model preserves analytic covariance but changes empirical tail", () => {
  const p = defaults("risk"),
    a = models.risk(p),
    b = models.risk({ ...p, tails: 1 });
  near(a.metrics[1].value, b.metrics[1].value);
  assert.ok(b.metrics[3].value > a.metrics[3].value);
  near(sd(b.raw.returns), b.metrics[1].value / 100, 0.012);
});
test("clearing hand-calculated chain with outside creditor", () => {
  const r = clearNetwork(
    [
      [0, 100, 100],
      [0, 0, 100],
      [0, 0, 0],
    ],
    [100, 0, 0],
  );
  near(r.payments[0], 100);
  near(r.payments[1], 50);
  assert.ok(r.converged);
});
test("greater external assets cannot reduce clearing payments", () => {
  const L = [
      [0, 50, 100],
      [50, 0, 100],
      [0, 0, 0],
    ],
    a = clearNetwork(L, [30, 30, 0]),
    b = clearNetwork(L, [60, 30, 0]);
  a.payments.forEach((v, i) => assert.ok(v <= b.payments[i] + 1e-8));
});
test("all three network topologies start solvent without a shock and match total exposure", () => {
  for (const topology of [0, 1, 2]) {
    const r = models.contagion({
      ...defaults("contagion"),
      topology,
      shock: 0,
    });
    assert.ok(r.raw.defaults.every((x) => !x));
    near(
      r.raw.liabilities
        .slice(0, 8)
        .reduce((s, row) => s + row.slice(0, 8).reduce((a, b) => a + b, 0), 0),
      1600,
    );
  }
});
test("clearing respects limited liability and fixed-point residual", () => {
  const r = models.contagion({
    ...defaults("contagion"),
    capital: 0,
    shock: 180,
    exposure: 400,
  }).raw;
  assert.ok(r.converged);
  for (let i = 0; i < r.payments.length; i++) {
    assert.ok(r.payments[i] >= 0 && r.payments[i] <= r.owed[i] + 1e-8);
    const inc = r.liabilities.reduce(
      (s, row, j) => s + (r.owed[j] ? (row[i] * r.payments[j]) / r.owed[j] : 0),
      0,
    );
    near(r.payments[i], Math.min(r.owed[i], r.assets[i] + inc), 1e-8);
    assert.ok(r.equity[i] >= -1e-8);
  }
});
test("no-reserve auctions recover analytic equilibrium revenue", () => {
  const r = models.auctions(defaults("auctions"));
  near(r.metrics[0].value, (100 * 4) / 6, 0.6);
  near(r.metrics[1].value, (100 * 4) / 6, 0.6);
  near(r.metrics[2].value, 0, 0.6);
});
test("reserve-adjusted first-price equilibrium and truthful second price have matching expected revenue", () => {
  const r = models.auctions({ ...defaults("auctions"), reserve: 60 });
  const expected = 100 * ((4 / 6) * (1 - 0.6 ** 6) + 0.6 ** 5 * (1 - 0.6));
  near(r.metrics[0].value, expected, 0.7);
  near(r.metrics[1].value, expected, 0.7);
  near(r.metrics[2].value, 0, 0.6);
});
test("off-equilibrium underbidding can cause unsold items", () => {
  const r = models.auctions({
    ...defaults("auctions"),
    reserve: 80,
    shade: 50,
  });
  near(r.metrics[0].value, 0);
  near(r.metrics[3].value, 0);
  assert.ok(r.metrics[1].value > 0);
});
for (const id of Object.keys(models))
  test(`${id}: finite outputs, deterministic replay, all UI presets and parameter extremes`, () => {
    const p = defaults(id),
      a = models[id](p);
    assert.deepEqual(a, models[id](p));
    const scenarios = experiments[id].presets.map(([, s]) => ({ ...p, ...s }));
    for (const c of experiments[id].controls)
      for (const v of c.options ? c.options.map(([v]) => v) : [c.min, c.max])
        scenarios.push({ ...p, [c.key]: v });
    for (const s of scenarios) {
      const r = models[id](s);
      assert.ok(r.metrics.every((m) => Number.isFinite(m.value)));
      for (const chart of r.charts)
        assert.ok(
          chart.series.every((line) =>
            line.points.every((pt) => pt.every(Number.isFinite)),
          ),
        );
    }
  });
