// Pure, deterministic model kernels. No DOM, network, market data or dependencies.
export function rng(seed = 42) {
  let s = seed >>> 0;
  return () => {
    s += 0x6d2b79f5;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function normal(r) {
  return (
    Math.sqrt(-2 * Math.log(Math.max(r(), 1e-12))) * Math.cos(2 * Math.PI * r())
  );
}
export const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
export const sd = (a) => {
  const m = mean(a);
  return Math.sqrt(
    a.reduce((s, x) => s + (x - m) ** 2, 0) / Math.max(1, a.length - 1),
  );
};
export const quantile = (a, p) => {
  const b = [...a].sort((x, y) => x - y),
    i = (b.length - 1) * p,
    l = Math.floor(i);
  return b[l] + (b[Math.ceil(i)] - b[l]) * (i - l);
};
export function histogram(a, n = 24) {
  let lo = Math.min(...a),
    hi = Math.max(...a);
  if (hi === lo) {
    lo -= 0.5;
    hi += 0.5;
  }
  const bins = Array.from({ length: n }, (_, i) => [
    lo + ((i + 0.5) * (hi - lo)) / n,
    0,
  ]);
  for (const x of a)
    bins[Math.min(n - 1, Math.floor(((x - lo) / (hi - lo)) * n))][1]++;
  return bins;
}
function metric(label, value, unit = "", note = "") {
  return { label, value, unit, note };
}
function series(name, points) {
  return { name, points };
}
export function amm(p) {
  const { reserve, trade, fee, ratio } = p,
    x = reserve,
    y = reserve * 100,
    f = fee / 100,
    net = trade * (1 - f),
    out = (y * net) / (x + net),
    newX = x + trade,
    newY = y - out;
  const impact = trade ? 100 * (1 - out / trade / 100) : 0,
    il = (2 * Math.sqrt(ratio)) / (1 + ratio) - 1;
  const curve = Array.from({ length: 101 }, (_, i) => {
    const t = (reserve * i) / 100,
      dy = (y * t * (1 - f)) / (x + t * (1 - f));
    return [t, dy];
  });
  const lp = Array.from({ length: 101 }, (_, i) => {
    const r = 0.1 + i * 0.049;
    return [r, 100 * ((2 * Math.sqrt(r)) / (1 + r) - 1)];
  });
  return {
    metrics: [
      metric("Token B received", out, "B"),
      metric(
        "Execution shortfall",
        impact,
        "%",
        "Against the initial 100 B/A spot price; includes fee.",
      ),
      metric(
        "LP vs holding",
        100 * il,
        "%",
        "Price-ratio scenario, before fees.",
      ),
      metric(
        "Invariant growth",
        100 * ((newX * newY) / (x * y) - 1),
        "%",
        "Fees stay in the pool.",
      ),
    ],
    charts: [
      {
        title: "Trade size changes the execution price",
        x: "Token A in",
        y: "Token B out",
        series: [
          series("Constant-product execution", curve),
          series(
            "Initial spot-price quote",
            curve.map(([t]) => [t, 100 * t]),
          ),
        ],
      },
      {
        title: "A pool can grow in value and still underperform holding",
        x: "External price / initial price",
        y: "LP relative return (%)",
        series: [series("Divergence loss (no fees)", lp)],
      },
    ],
    rows: [
      ["A reserve before", x],
      ["B reserve before", y],
      ["Fee retained in A", trade * f],
      ["A reserve after", newX],
      ["B reserve after", newY],
      ["Spot B/A after", newY / newX],
      ["LP value at new external price", 2 * Math.sqrt(ratio) * y],
      ["Hold value at new external price", (1 + ratio) * y],
    ],
    insight: `A ${trade.toLocaleString()} A swap removes ${out.toFixed(2)} B. The next trader faces a different marginal price (${(newY / newX).toFixed(2)} B/A). The separate LP scenario assumes arbitrage resets the pool to an external price ratio of ${ratio.toFixed(2)}; swap fees are excluded from that comparison.`,
    raw: { ...p, out, newX, newY, il },
  };
}
// Price-time priority. Incoming orders execute at the resting order's limit.
export function match(book, order) {
  let remaining = order.qty,
    notional = 0;
  const fills = [],
    opposite = order.side === "buy" ? book.asks : book.bids;
  opposite.sort(
    (a, b) =>
      (order.side === "buy" ? a.price - b.price : b.price - a.price) ||
      a.id - b.id,
  );
  while (
    remaining > 0 &&
    opposite.length &&
    (order.type === "market" ||
      (order.side === "buy"
        ? opposite[0].price <= order.price
        : opposite[0].price >= order.price))
  ) {
    const o = opposite[0],
      q = Math.min(remaining, o.qty);
    fills.push({ price: o.price, qty: q, maker: o.id });
    remaining -= q;
    o.qty -= q;
    notional += q * o.price;
    if (o.qty === 0) opposite.shift();
  }
  if (remaining > 0 && order.type !== "market") {
    const target = order.side === "buy" ? book.bids : book.asks;
    target.push({ ...order, qty: remaining });
  }
  return { fills, remaining, notional, filled: order.qty - remaining };
}
export function orderbook(p) {
  const r = rng(p.seed),
    book = { bids: [], asks: [] },
    mid = 100,
    half = p.spread / 2;
  let id = 0;
  for (let level = 0; level < 20; level++) {
    const qty = () => Math.round(p.depth * (0.6 + r() * 0.8));
    book.bids.push({
      id: id++,
      price: +(mid - half - level * 0.1).toFixed(2),
      qty: qty(),
    });
    book.asks.push({
      id: id++,
      price: +(mid + half + level * 0.1).toFixed(2),
      qty: qty(),
    });
  }
  const bids = structuredClone(book.bids),
    asks = structuredClone(book.asks),
    snapshot = structuredClone(book),
    side = p.side === 1 ? "buy" : "sell";
  const result = match(book, { id: id++, side, type: "market", qty: p.size });
  let cumulative = 0;
  const sweep = result.fills.map((f) => {
    cumulative += f.qty;
    return [cumulative, f.price];
  });
  const vwap = result.filled ? result.notional / result.filled : mid,
    shortfall = ((side === "buy" ? vwap - mid : mid - vwap) / mid) * 1e4;
  const depth = (a) => {
    let q = 0;
    return a
      .map((o) => {
        q += o.qty;
        return [o.price, q];
      })
      .sort((a, b) => a[0] - b[0]);
  };
  return {
    metrics: [
      metric("Filled quantity", result.filled, "shares"),
      metric(
        "Unfilled quantity",
        result.remaining,
        "shares",
        "Market orders do not rest in this model.",
      ),
      metric("Execution VWAP", vwap, "$"),
      metric(
        "Cost vs midpoint",
        shortfall,
        "bps",
        "Positive means a worse execution price.",
      ),
    ],
    charts: [
      {
        title: "Displayed depth before the order",
        x: "Limit price ($)",
        y: "Cumulative shares",
        series: [series("Bids", depth(bids)), series("Asks", depth(asks))],
      },
      {
        title: "One market order, several execution prices",
        x: "Shares filled so far",
        y: "Resting execution price ($)",
        series: [
          series("Sweep", [
            [0, side === "buy" ? asks[0].price : bids[0].price],
            ...sweep,
          ]),
        ],
      },
    ],
    rows: result.fills.map((f, i) => [
      `Fill ${i + 1}: ${f.qty} shares at $${f.price.toFixed(2)}`,
      f.qty * f.price,
    ]),
    insight: `The ${side} order consumes ${result.fills.length} price levels. ${result.remaining ? `${result.remaining} shares cannot execute because the displayed book is exhausted.` : "All shares execute."} A quoted spread describes a small trade; depth determines what a larger trade actually pays.`,
    raw: { parameters: p, before: snapshot, after: book, ...result },
  };
}
const cdf = (x) => {
  const sign = x < 0 ? -1 : 1,
    z = Math.abs(x) / Math.sqrt(2),
    t = 1 / (1 + 0.3275911 * z);
  const erf =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) *
      t +
      0.254829592) *
      t *
      Math.exp(-z * z);
  return 0.5 * (1 + sign * erf);
};
export function call(S, K, T, r, v) {
  if (T <= 0)
    return {
      price: Math.max(S - K, 0),
      delta: S > K ? 1 : S < K ? 0 : 0.5,
      gamma: 0,
      vega: 0,
    };
  if (v === 0) {
    const k = K * Math.exp(-r * T);
    return {
      price: Math.max(S - k, 0),
      delta: S > k ? 1 : 0,
      gamma: 0,
      vega: 0,
    };
  }
  const d1 = (Math.log(S / K) + (r + (v * v) / 2) * T) / (v * Math.sqrt(T)),
    d2 = d1 - v * Math.sqrt(T),
    pdf = Math.exp((-d1 * d1) / 2) / Math.sqrt(2 * Math.PI);
  return {
    price: S * cdf(d1) - K * Math.exp(-r * T) * cdf(d2),
    delta: cdf(d1),
    gamma: pdf / (S * v * Math.sqrt(T)),
    vega: (S * pdf * Math.sqrt(T)) / 100,
  };
}
export function hedge(p) {
  const r = rng(p.seed),
    T = 1,
    rate = 0.04,
    K = 100,
    S0 = 100,
    model = p.implied / 100,
    real = p.realized / 100,
    dt = T / p.steps,
    stats = call(S0, K, T, rate, model),
    pnl = [],
    free = [],
    stockPath = [],
    deltaPath = [];
  let totalCost = 0;
  for (let path = 0; path < 600; path++) {
    let S = S0,
      d = stats.delta,
      cash = stats.price - d * S,
      cost = (Math.abs(d * S) * p.cost) / 1e4;
    cash -= cost;
    let noCost = stats.price - d * S;
    for (let j = 1; j <= p.steps; j++) {
      if (path === 0 && j === 1) {
        stockPath.push([0, S]);
        deltaPath.push([0, d]);
      }
      S *= Math.exp(
        (0.04 - (real * real) / 2) * dt + real * Math.sqrt(dt) * normal(r),
      );
      cash *= Math.exp(rate * dt);
      noCost *= Math.exp(rate * dt);
      if (j < p.steps) {
        const nd = call(S, K, T - j * dt, rate, model).delta,
          trade = (nd - d) * S;
        const fee = (Math.abs(trade) * p.cost) / 1e4;
        cash -= trade + fee;
        noCost -= trade;
        cost += fee;
        d = nd;
      }
      if (path === 0) {
        stockPath.push([j / p.steps, S]);
        deltaPath.push([j / p.steps, d]);
      }
    }
    const closeFee = (Math.abs(d * S) * p.cost) / 1e4;
    cash -= closeFee;
    cost += closeFee;
    const payoff = Math.max(S - K, 0);
    pnl.push(cash + d * S - payoff);
    free.push(noCost + d * S - payoff);
    totalCost += cost;
  }
  const m = mean(pnl),
    s = sd(pnl),
    ci = (1.96 * s) / Math.sqrt(pnl.length);
  return {
    metrics: [
      metric(
        "Call premium",
        stats.price,
        "$",
        "European call, S = K = 100, T = 1 year, r = 4%.",
      ),
      metric(
        "Mean hedge P&L",
        m,
        "$",
        `Monte Carlo 95% mean interval: ${(m - ci).toFixed(3)} to ${(m + ci).toFixed(3)}.`,
      ),
      metric(
        "Hedge P&L dispersion",
        s,
        "$",
        "Sample standard deviation across 600 paths.",
      ),
      metric(
        "5th percentile P&L",
        quantile(pnl, 0.05),
        "$",
        "A path outcome, not a confidence bound.",
      ),
    ],
    charts: [
      {
        title: "Hedge outcomes across 600 stock paths",
        x: "Terminal short-call hedge P&L ($)",
        y: "Number of paths",
        kind: "histogram",
        series: [series("After trading costs", histogram(pnl))],
      },
      {
        title: "One seeded stock path",
        x: "Time (years)",
        y: "Stock price ($)",
        series: [series("Underlying", stockPath)],
      },
      {
        title: "Delta adjusts as the path unfolds",
        x: "Time (years)",
        y: "Shares held per short call",
        series: [series("Delta hedge", deltaPath)],
      },
    ],
    rows: [
      ["Initial delta (shares)", stats.delta],
      ["Initial gamma (per $)", stats.gamma],
      ["Initial vega ($ per volatility point)", stats.vega],
      ["Mean P&L without trading costs", mean(free)],
      ["Mean nominal trading fees", totalCost / 600],
      ["Monte Carlo standard error of mean", s / Math.sqrt(600)],
    ],
    insight: `The hedge starts with the model premium and purchases delta shares. Cash earns 4%; every rebalance and final liquidation incurs the chosen cost. ${p.implied === p.realized ? "The pricing and path volatilities agree, but discrete trading still leaves replication error." : "The pricing volatility differs from the path volatility: the hedge is deliberately misspecified."} Increasing trading frequency can reduce discretization error while increasing fees.`,
    raw: { parameters: p, pnl, noCostPnl: free, stockPath, deltaPath },
  };
}
export function risk(p) {
  const r = rng(p.seed),
    w = p.equity / 100,
    b = ((1 - w) * p.bond) / 100,
    g = 1 - w - b,
    c = p.corr / 100,
    returns = [],
    rows = [],
    cloud = [];
  const mu = [0.08, 0.04, 0.05],
    v = [0.2, 0.07, 0.15];
  for (let i = 0; i < 12000; i++) {
    const z = normal(r),
      z2 = c * z + Math.sqrt(1 - c * c) * normal(r),
      z3 = normal(r);
    let scale = 1;
    if (p.tails === 1) {
      let chi = 0;
      for (let j = 0; j < 5; j++) chi += normal(r) ** 2;
      scale = Math.sqrt(3 / Math.max(chi, 1e-12));
    }
    const a = [
      mu[0] + v[0] * z * scale,
      mu[1] + v[1] * z2 * scale,
      mu[2] + v[2] * z3 * scale,
    ];
    returns.push(w * a[0] + b * a[1] + g * a[2]);
  }
  const loss = returns.map((x) => -x * 100),
    threshold = quantile(loss, 0.95),
    es = mean(loss.filter((x) => x >= threshold)),
    expected = w * mu[0] + b * mu[1] + g * mu[2],
    vol = Math.sqrt(
      w * w * v[0] ** 2 +
        b * b * v[1] ** 2 +
        g * g * v[2] ** 2 +
        2 * w * b * c * v[0] * v[1],
    );
  // Exhaustive long-only grid. Frontier is a grid approximation, not an optimizer claim.
  for (let e = 0; e <= 100; e += 2)
    for (let bond = 0; bond <= 100 - e; bond += 2) {
      const x = e / 100,
        y = bond / 100,
        z = 1 - x - y;
      cloud.push([
        100 *
          Math.sqrt(
            x * x * v[0] ** 2 +
              y * y * v[1] ** 2 +
              z * z * v[2] ** 2 +
              2 * x * y * c * v[0] * v[1],
          ),
        100 * (x * mu[0] + y * mu[1] + z * mu[2]),
      ]);
    }
  const sorted = [...cloud].sort((a, b) => a[0] - b[0]),
    front = [];
  let best = -Infinity;
  for (const pt of sorted)
    if (pt[1] > best + 1e-8) {
      front.push(pt);
      best = pt[1];
    }
  rows.push(
    ["Equity weight (%)", w * 100],
    ["Bond weight (%)", b * 100],
    ["Gold weight (%)", g * 100],
    ["Analytic annual mean (%)", expected * 100],
    ["Analytic annual volatility (%)", vol * 100],
    ["Simulated annual mean (%)", mean(returns) * 100],
    ["Simulated annual volatility (%)", sd(returns) * 100],
  );
  return {
    metrics: [
      metric(
        "Expected return",
        expected * 100,
        "%",
        "Assumed one-year arithmetic mean.",
      ),
      metric(
        "Portfolio volatility",
        vol * 100,
        "%",
        "Analytic standard deviation under the stated covariance.",
      ),
      metric(
        "95% loss quantile",
        threshold,
        "%",
        "Loss is negative return; negative values represent a gain.",
      ),
      metric(
        "Expected shortfall",
        es,
        "%",
        "Mean loss in the worst 5% of 12,000 simulated outcomes.",
      ),
    ],
    charts: [
      {
        title: "Same covariance, different tail risk",
        x: "One-year portfolio loss (%)",
        y: "Number of outcomes",
        kind: "histogram",
        series: [
          series(
            p.tails === 1 ? "Student-t (5 df)" : "Gaussian",
            histogram(loss, 32),
          ),
        ],
      },
      {
        title: "What diversification buys under these assumptions",
        x: "Annual volatility (%)",
        y: "Expected return (%)",
        series: [
          { ...series("Long-only grid", cloud), scatter: true },
          series("Nondominated grid frontier", front),
          {
            ...series("Your portfolio", [[vol * 100, expected * 100]]),
            scatter: true,
          },
        ],
      },
    ],
    rows,
    insight: `The weights are ${(w * 100).toFixed(0)}% equity, ${(b * 100).toFixed(1)}% bonds and ${(g * 100).toFixed(1)}% gold. ${p.tails === 1 ? "Student-t shocks share a random scale; this keeps the specified covariance while creating joint tail dependence." : "Gaussian shocks have thin tails."} Changing the tail model leaves the analytic mean and covariance unchanged, but can change expected shortfall substantially.`,
    raw: { parameters: p, returns, weights: [w, b, g], frontier: front },
  };
}
export function clearNetwork(L, assets, tolerance = 1e-10) {
  const n = L.length,
    owed = L.map((a) => a.reduce((s, x) => s + x, 0));
  let payments = [...owed],
    iterations = 0,
    converged = false;
  const history = [];
  for (; iterations < 10000; iterations++) {
    const next = owed.map((o, i) =>
      Math.min(
        o,
        assets[i] +
          L.reduce(
            (s, row, j) => s + (owed[j] ? (row[i] / owed[j]) * payments[j] : 0),
            0,
          ),
      ),
    );
    history.push([...next]);
    const error = Math.max(...next.map((x, i) => Math.abs(x - payments[i])));
    payments = next;
    if (error < tolerance) {
      converged = true;
      iterations++;
      break;
    }
  }
  const incoming = assets.map((_, i) =>
    L.reduce(
      (s, row, j) => s + (owed[j] ? (row[i] / owed[j]) * payments[j] : 0),
      0,
    ),
  );
  return {
    payments,
    owed,
    equity: assets.map((a, i) => a + incoming[i] - payments[i]),
    defaults: payments.map((x, i) => x < owed[i] - 1e-7),
    iterations,
    converged,
    history,
  };
}
export function contagion(p) {
  const n = 8,
    L = Array.from({ length: n }, () => Array(n).fill(0)),
    r = rng(p.seed),
    exposure = p.exposure;
  for (let i = 0; i < n; i++) {
    if (p.topology === 0) {
      L[i][(i + 1) % n] = exposure;
    } else if (p.topology === 1) {
      for (let j = 0; j < n; j++) {
        if (i !== j) L[i][j] = exposure / (n - 1);
      }
    } else if (i === 0) {
      for (let j = 1; j < n; j++) L[i][j] = (n * exposure) / (2 * (n - 1));
    } else {
      L[i][0] = (n * exposure) / (2 * (n - 1));
    }
  }
  // Add society as an outside creditor to make the clearing system regular.
  const full = L.map((row) => [...row, 100]),
    assets = Array.from(
      { length: n },
      () => 100 + p.capital * (0.9 + 0.2 * r()),
    );
  assets[0] = Math.max(0, assets[0] - p.shock);
  full.push(Array(n + 1).fill(0));
  assets.push(0);
  const result = clearNetwork(full, assets),
    initial = full
      .slice(0, n)
      .map(
        (row, i) =>
          assets[i] + L.reduce((s, a) => s + a[i], 0) <
          row.reduce((s, x) => s + x, 0),
      ),
    defaults = result.defaults.slice(0, n),
    totalUnpaid = result.owed
      .slice(0, n)
      .reduce((s, o, i) => s + o - result.payments[i], 0),
    societyLoss = result.owed
      .slice(0, n)
      .reduce((s, o, i) => s + 100 * (1 - result.payments[i] / o), 0);
  return {
    metrics: [
      metric(
        "Banks in default",
        defaults.filter(Boolean).length,
        "/ 8",
        "A default means less than full promised payment.",
      ),
      metric(
        "Secondary defaults",
        defaults.filter((x, i) => x && !initial[i]).length,
        "banks",
        "Defaulting at clearing but solvent if peers paid in full.",
      ),
      metric(
        "Total unpaid liabilities",
        totalUnpaid,
        "units",
        "Includes interbank and society claims.",
      ),
      metric(
        "Loss to outside creditors",
        societyLoss,
        "units",
        "Bank liabilities include 100 each to society.",
      ),
    ],
    charts: [
      {
        title: "Payment shortfalls propagate until clearing",
        x: "Fixed-point iteration",
        y: "Fraction of promised payment (%)",
        series: Array.from({ length: n }, (_, i) =>
          series(`Bank ${i + 1}`, [
            [0, 100],
            ...result.history.map((a, j) => [
              j + 1,
              (100 * a[i]) / result.owed[i],
            ]),
          ]),
        ),
      },
    ],
    network: { L, defaults },
    rows: Array.from({ length: n }, (_, i) => [
      `Bank ${i + 1}: ${defaults[i] ? "default" : "pays in full"}`,
      (result.payments[i] / result.owed[i]) * 100,
    ]),
    insight: `${p.topology === 2 ? "The hub concentrates bilateral exposure: it owes and is owed four times the network exposure scale. Total system interbank liabilities match the ring and complete networks." : "Each bank has the same total interbank liabilities, so topology changes who bears a missed payment."} Bank 1 loses ${p.shock} external asset units. Pro-rata clearing converged in ${result.iterations} iterations. The model has limited liability and no bankruptcy haircut, fire sales or bailout.`,
    raw: { parameters: p, liabilities: full, assets, ...result },
  };
}
export function auctions(p) {
  const r = rng(p.seed),
    n = p.bidders,
    res = p.reserve / 100,
    N = 10000,
    rev1 = [],
    rev2 = [],
    diff = [],
    running1 = [],
    running2 = [];
  let sold1 = 0,
    sold2 = 0,
    welfare1 = 0,
    welfare2 = 0,
    optimal = 0;
  for (let t = 0; t < N; t++) {
    const values = Array.from({ length: n }, () => r()).sort((a, b) => b - a),
      v = values[0],
      runner = values[1],
      eligible = v >= res;
    // Symmetric risk-neutral equilibrium for iid U[0,1] with common reserve r.
    const bid = eligible
        ? ((((n - 1) * v + res * (res / v) ** (n - 1)) / n) * p.shade) / 100
        : 0,
      first = eligible && bid >= res,
      second = eligible;
    rev1.push(first ? 100 * bid : 0);
    rev2.push(second ? 100 * Math.max(res, runner) : 0);
    diff.push(rev1[t] - rev2[t]);
    sold1 += first;
    sold2 += second;
    welfare1 += first ? 100 * v : 0;
    welfare2 += second ? 100 * v : 0;
    optimal += 100 * v;
    if (t % 100 === 99) {
      running1.push([t + 1, mean(rev1)]);
      running2.push([t + 1, mean(rev2)]);
    }
  }
  const gap = mean(diff),
    se = sd(diff) / Math.sqrt(N),
    bench = (100 * (n - 1)) / (n + 1);
  return {
    metrics: [
      metric(
        "First-price revenue",
        mean(rev1),
        "$",
        "Mean per auction, including unsold items.",
      ),
      metric(
        "Second-price revenue",
        mean(rev2),
        "$",
        "Truthful bids and the same reserve.",
      ),
      metric(
        "Paired revenue difference",
        gap,
        "$",
        `Monte Carlo 95% mean interval: ${(gap - 1.96 * se).toFixed(3)} to ${(gap + 1.96 * se).toFixed(3)}.`,
      ),
      metric("First-price sale rate", (100 * sold1) / N, "%"),
    ],
    charts: [
      {
        title: "Revenue equivalence is an expectation",
        x: "Auctions simulated",
        y: "Running mean seller revenue ($)",
        series: [
          series("First price", running1),
          series("Second price", running2),
        ],
      },
      {
        title: "The same values can produce different payments",
        x: "First minus second price revenue ($)",
        y: "Auctions",
        kind: "histogram",
        series: [series("Paired difference", histogram(diff, 30))],
      },
    ],
    rows: [
      ["Auctions simulated", N],
      ["No-reserve equilibrium revenue benchmark ($)", bench],
      ["Second-price sale rate (%)", (100 * sold2) / N],
      [
        "First-price welfare / no-reserve efficient welfare (%)",
        (100 * welfare1) / optimal,
      ],
      [
        "Second-price welfare / no-reserve efficient welfare (%)",
        (100 * welfare2) / optimal,
      ],
      ["Paired-difference standard error ($)", se],
    ],
    insight: `Both formats face exactly the same ${N.toLocaleString()} value draws. ${p.shade === 100 ? "First-price bids use the symmetric equilibrium formula for the chosen reserve." : "The first-price bid multiplier is an off-equilibrium experiment, so revenue equivalence is no longer predicted."} Revenue equivalence needs independent private values, risk neutrality and matching allocation/payment boundary conditions. A reserve can leave a valuable item unsold.`,
    raw: {
      parameters: p,
      firstPriceRevenue: rev1,
      secondPriceRevenue: rev2,
      pairedDifference: diff,
    },
  };
}
export const models = { orderbook, amm, hedge, risk, contagion, auctions };
