// Explanations use validated inputs and completed model outputs, never forecasts.
const n = (x) =>
  Number(x).toLocaleString("en-US", { maximumFractionDigits: 2 });
export function controlHints(id, p) {
  switch (id) {
    case "orderbook":
      return {
        size: `Your order is ${n(p.size / p.depth)}× the typical quantity at one level. Actual depth varies with the seed.`,
        depth: `About ${n(p.depth)} shares per level; the book has 20 levels on each side.`,
        spread: `The best ${p.side ? "ask" : "bid"} starts at $${n(100 + ((p.side ? 1 : -1) * p.spread) / 2)}. This is a quote for limited quantity.`,
        side: p.side
          ? "Buying consumes asks, from the lowest price upward."
          : "Selling consumes bids, from the highest price downward.",
      };
    case "amm":
      return {
        reserve: `Initial reserves: ${n(p.reserve)} A and ${n(100 * p.reserve)} B. The starting spot price stays 100 B/A.`,
        trade: `This trade is ${n((100 * p.trade) / p.reserve)}% of the initial A reserve. Larger relative trades move further along the curve.`,
        fee: `${n((p.trade * p.fee) / 100)} A is retained as the swap fee. The full input enters reserves.`,
        ratio:
          p.ratio === 1
            ? "No external price change: the fee-free LP benchmark equals holding."
            : `A is repriced to ${n(p.ratio)}× its initial price. This separate LP comparison excludes swap fees.`,
      };
    case "hedge":
      return {
        implied: `${n(p.implied)}% volatility prices the option and determines the hedge delta.`,
        realized:
          p.implied === p.realized
            ? "Pricing and path volatilities agree. Discrete trading and costs still leave hedge error."
            : `Path volatility is ${p.realized > p.implied ? "higher" : "lower"} than pricing volatility. The hedge is using a mismatched model.`,
        steps: `A rebalance every ${n(365 / p.steps)} calendar days in this one-year model. Different frequencies do not use paired stock paths.`,
        cost:
          p.cost === 0
            ? "Trading is free in this scenario. Discrete replication error remains."
            : `Each $1,000 of stock turnover costs $${n(p.cost / 10)}. More trading can accumulate more fees.`,
      };
    case "risk": {
      const b = ((100 - p.equity) * p.bond) / 100;
      return {
        equity: `Allocation: ${n(p.equity)}% equity, ${n(b)}% bonds and ${n(100 - p.equity - b)}% gold.`,
        bond: `Bonds receive ${n(b)}% of the total portfolio; gold receives the remaining ${n(100 - p.equity - b)}%.`,
        corr: `Equity–bond correlation is ${n(p.corr / 100)}. Gold has zero linear correlation with each; this does not imply independence under Student-t shocks.`,
        tails: p.tails
          ? "A shared Student-t scale adds joint tail dependence while preserving analytic covariance."
          : "Gaussian shocks use the same stated mean and covariance as the heavy-tail alternative.",
      };
    }
    case "contagion":
      return {
        topology: [
          "A directed ring sends each bank’s interbank obligation to the next bank.",
          "Complete connectivity spreads each bank’s interbank claims across seven counterparties.",
          "The hub concentrates exposure. Equal system totals do not imply equal bank-level exposure.",
        ][p.topology],
        exposure: `Total interbank liabilities are ${n(8 * p.exposure)} units under every topology. Each bank also owes society 100.`,
        capital: `External assets start at 100 plus a seeded buffer around ${n(p.capital)}. This is an asset buffer, not a regulatory capital ratio.`,
        shock:
          p.shock === 0
            ? "No external asset loss at Bank 1. The constructed networks begin solvent."
            : `Bank 1 loses ${n(p.shock)} external asset units. Clearing then determines who can pay.`,
      };
    case "auctions":
      return {
        bidders: `${p.bidders} risk-neutral bidders draw independent values on [0,100]. ${p.reserve === 0 ? `The no-reserve equilibrium bid is ${n((100 * (p.bidders - 1)) / p.bidders)}% of value.` : "The first-price equilibrium formula accounts for the reserve."}`,
        reserve:
          p.reserve === 0
            ? "No reserve: the highest-valued bidder is eligible to win."
            : `Values below $${p.reserve} do not participate in the equilibrium. A positive-value item can remain unsold.`,
        shade:
          p.shade === 100
            ? "100% uses reserve-aware equilibrium first-price bids."
            : `${p.shade}% is an off-equilibrium counterfactual. ${p.shade > 100 ? "Bids can exceed values." : "Underbidding may fail the reserve."} This is not a newly solved equilibrium.`,
      };
  }
  return {};
}
export function resultNotes(id, p, r) {
  const m = r.metrics.map((x) => x.value);
  switch (id) {
    case "orderbook":
      return {
        title:
          m[1] > 0
            ? "The book runs out before the order does."
            : "The quote is only the first step.",
        text: `${n(m[0])} shares fill${m[1] > 0 ? ` and ${n(m[1])} remain unfilled` : ""}. Execution VWAP is $${n(m[2])}; cost versus the $100 midpoint is ${n(m[3])} bps. The fill ledger explains the cost one price level at a time.`,
        watch:
          "Keep the spread fixed and change order size to isolate the effect of depth.",
      };
    case "amm":
      return {
        title:
          p.trade === 0
            ? "No swap. The LP question is separate."
            : "A bigger pool cushions the same trade.",
        text: `The swap receives ${n(m[0])} B with ${n(m[1])}% shortfall against the initial spot quote. At an external price ratio of ${n(p.ratio)}, the separate fee-free LP-versus-holding return is ${n(m[2])}%. These are two different comparisons.`,
        watch:
          "Scale the reserve and trade together: their ratio, and therefore proportional impact, stays the same.",
      };
    case "hedge":
      return {
        title:
          p.implied === p.realized
            ? "Matching volatility does not mean a perfect hedge."
            : "The hedge and the path disagree about volatility.",
        text: `Across 600 paths, mean hedge P&L is $${n(m[1])}, with $${n(m[2])} sample dispersion. The fifth-percentile path outcome is $${n(m[3])}. A narrow interval for the mean is not a guarantee about a single path.`,
        watch:
          "Change costs while keeping seed, volatilities and frequency fixed to compare the same stock paths.",
      };
    case "risk":
      return {
        title: p.tails
          ? "Same covariance. A different tail mechanism."
          : "Diversification depends on co-movement.",
        text: `Analytic volatility is ${n(m[1])}%. The simulated 95% loss threshold is ${n(m[2])}%, while mean loss in the worst 5% is ${n(m[3])}%. Expected shortfall describes severity beyond the threshold.`,
        watch:
          "Switch distributions with weights and correlation fixed. Heavy tails do not have to increase every percentile.",
      };
    case "contagion":
      return {
        title:
          m[1] > 0
            ? "A local loss reaches other balance sheets."
            : m[0] > 0
              ? "Defaults occur without secondary contagion."
              : "The network clears without a default.",
        text: `${n(m[0])} of eight banks pay less than promised; ${n(m[1])} are secondary defaults. Outside creditors lose ${n(m[3])} units. The ${r.raw.iterations} iterations are numerical updates, not days in a bank run.`,
        watch:
          "Compare topologies with exposure fixed. The aggregate liability total stays the same, but concentration changes.",
      };
    case "auctions":
      return {
        title:
          p.shade === 100
            ? "Different rules, strategically different bids."
            : "You are testing a deviation from equilibrium.",
        text: `First-price mean revenue is $${n(m[0])}; second-price mean revenue is $${n(m[1])}. The paired difference is $${n(m[2])}, using the same 10,000 value draws. The first-price sale rate is ${n(m[3])}%.`,
        watch:
          p.shade === 100
            ? "Revenue equivalence concerns expected revenue under assumptions; an individual auction can have different payments."
            : "Return the multiplier to 100% before interpreting the comparison as an equilibrium illustration.",
      };
  }
}

// Mark completed scenario values on the AMM's existing sampled curves.
// No kernel output is mutated or inferred from interpolated pixels.
export function annotatedCharts(id, p, r) {
  if (id !== "amm") return r.charts;
  return r.charts.map((c, i) => ({
    ...c,
    notice:
      i === 0 && p.trade > p.reserve
        ? "The curve samples trades up to the initial A reserve. Your current trade is beyond that range; its exact output appears in the metrics and ledger."
        : "",
    series: [
      ...c.series,
      ...(i === 0
        ? p.trade <= p.reserve
          ? [
              {
                name: "Your swap",
                scatter: true,
                points: [[p.trade, r.raw.out]],
              },
            ]
          : []
        : [
            {
              name: "Your price ratio",
              scatter: true,
              points: [[p.ratio, r.metrics[2].value]],
            },
          ]),
    ],
  }));
}
