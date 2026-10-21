const range = (key, label, min, max, step, value, help = "") => ({
  key,
  label,
  min,
  max,
  step,
  value,
  help,
});
const select = (key, label, options, value, help = "") => ({
  key,
  label,
  options,
  value,
  help,
});
export const experiments = {
  orderbook: {
    no: "01",
    area: "MARKET MICROSTRUCTURE",
    title: "The price of immediacy",
    subtitle: "A limit-order book and execution-cost experiment",
    question: "Why does a large trade pay more than the price on the screen?",
    intro:
      "A quote is a promise about a quantity. Sweep through the available liquidity and that promise runs out. This experiment makes every fill visible, from the best price to the last available share.",
    tags: ["Price–time priority", "Matching engine", "Execution quality"],
    controls: [
      range("size", "Market order (shares)", 10, 6000, 10, 1200),
      range("depth", "Typical shares per level", 20, 500, 10, 120),
      range("spread", "Quoted spread ($)", 0.02, 2, 0.02, 0.2),
      select(
        "side",
        "Order side",
        [
          [1, "Buy"],
          [0, "Sell"],
        ],
        1,
      ),
    ],
    presets: [
      ["A small order", { size: 50, depth: 120 }],
      ["Walk the book", { size: 1800, depth: 100 }],
      ["Liquidity runs out", { size: 6000, depth: 30 }],
    ],
    story: [
      [
        "Start with the queue",
        "The book begins with 20 price levels on each side of a $100 midpoint. Quantity at each level is seeded synthetic data. Buy orders match the lowest ask; sell orders match the highest bid. Earlier order IDs win ties at the same price.",
      ],
      [
        "Follow the money",
        "Each fill happens at the resting order’s price. VWAP divides the total execution notional by filled shares. The shortfall compares this average price with the midpoint just before trading, so it includes both half the spread and walking through worse prices.",
      ],
      [
        "Read the empty space",
        "An oversized market order may only fill partly. The remaining quantity is reported explicitly and discarded; it does not turn into a limit order. Increasing depth can improve execution without changing the initial quoted spread.",
      ],
    ],
    formula:
      "VWAP = Σ(price × filled quantity) / Σ(filled quantity)\nBuy shortfall (bps) = 10,000 × (VWAP − midpoint) / midpoint",
    worked:
      "If 100 shares fill at $100.10 and another 100 at $100.20, VWAP is $100.15. Against a $100 midpoint, the cost is 15 basis points, even though the original quoted spread was only $0.20.",
    try: [
      "Hold the spread fixed and double order size. Which part of the cost comes from depth?",
      "Choose “Liquidity runs out”. Compare requested quantity with actual fills before interpreting VWAP.",
    ],
    limits:
      "This is a static single-venue book, not an agent-based price forecast. There are no cancellations, hidden orders, new arrivals, exchange fees or latency. The kernel also supports crossing limit orders and FIFO tie-breaking; the interface isolates one market-order sweep.",
    engineering:
      "A pure matching kernel mutates an explicit book and returns a complete fill ledger. Tests check FIFO ties, partial fills, resting limits, uncrossed books and quantity conservation.",
    sources: [
      [
        "CME Group · A Trader’s Guide to Futures",
        "https://www.cmegroup.com/education/files/a-traders-guide-to-futures.pdf",
      ],
      [
        "CME Group · Market by Order",
        "https://www.cmegroup.com/articles/faqs/market-by-order-mbo.html",
      ],
    ],
  },
  amm: {
    no: "02",
    area: "DECENTRALIZED FINANCE",
    title: "Liquidity has a curve",
    subtitle: "Constant-product swaps, fees and divergence loss",
    question: "What does an automated market maker charge for a large trade?",
    intro:
      "An AMM replaces an order book with a rule. The rule is simple; its consequences for traders and liquidity providers are less obvious. Follow a swap through the reserves, then compare providing liquidity with holding the same tokens.",
    tags: ["Constant product", "Slippage", "LP economics"],
    controls: [
      range(
        "reserve",
        "Initial token A reserve",
        100,
        20000,
        100,
        5000,
        "Token B reserve is 100 × A reserve.",
      ),
      range("trade", "Token A sold into pool", 0, 10000, 50, 1000),
      range("fee", "Swap fee (%)", 0, 1, 0.05, 0.3),
      range("ratio", "External A price / initial price", 0.1, 5, 0.1, 2),
    ],
    presets: [
      ["Small swap", { trade: 50, reserve: 5000 }],
      ["Thin pool", { trade: 3000, reserve: 1000 }],
      ["A price doubles", { ratio: 2 }],
    ],
    story: [
      [
        "The invariant is a trading rule",
        "For reserves x and y, the no-fee rule holds x × y constant. Selling A into the pool increases x and reduces y. With a fee, only the effective input is used to calculate output, but the full input enters the reserve. The product therefore grows.",
      ],
      [
        "Spot price is not execution price",
        "The initial marginal price is y/x = 100 B per A. A finite swap averages over progressively worse marginal prices. Execution shortfall here includes the fee and price movement caused by the swap. The dashed comparison is what you would receive at the initial spot price with unlimited liquidity.",
      ],
      [
        "LP returns need a benchmark",
        "The second chart is a separate, fee-free scenario. Arbitrage adjusts a 50/50 pool to a new external relative price. Its value is compared with holding the original token quantities. A negative relative return does not necessarily mean the LP lost money in absolute terms.",
      ],
    ],
    formula:
      "Effective input = Δx × (1 − fee)\nToken B out = y × effective input / (x + effective input)\nLP / hold − 1 = 2√r / (1 + r) − 1",
    worked:
      "If A doubles in external price, holding the starting tokens grows to 3 times the initial B reserve. A rebalanced constant-product position is worth 2√2 times that reserve. The LP underperforms holding by about 5.72%, before fee income.",
    try: [
      "Set the fee to zero: the reserve product should remain constant after a swap.",
      "Compare a 1,000 A trade in a 5,000 A pool with the same trade in a 1,000 A pool.",
    ],
    limits:
      "A two-token constant-product model with continuous arithmetic. It excludes gas, integer rounding, concentrated liquidity, MEV, fee-on-transfer tokens and arbitrage timing. The LP comparison excludes fees and is independent of the one-swap scenario.",
    engineering:
      "Closed-form execution with reserve accounting. Tests verify zero-fee conservation, fee-driven invariant growth, positive reserves and the no-price-change LP benchmark.",
    sources: [
      [
        "Adams, Zinsmeister & Robinson · Uniswap v2 Core (2020)",
        "https://app.uniswap.org/whitepaper.pdf",
      ],
    ],
  },
  hedge: {
    no: "03",
    area: "DERIVATIVES & NUMERICAL METHODS",
    title: "A hedge is a process",
    subtitle: "Discrete delta hedging under costs and model error",
    question:
      "If an option can be replicated, why does a real hedge still lose money?",
    intro:
      "The Black–Scholes argument trades continuously in a frictionless model. This experiment trades at intervals, charges for those trades, and lets the model volatility be wrong. The gap appears as a distribution of hedge outcomes.",
    tags: ["Monte Carlo", "Black–Scholes", "Self-financing hedge"],
    controls: [
      range("implied", "Pricing volatility (%)", 5, 60, 1, 20),
      range("realized", "Path volatility (%)", 5, 60, 1, 20),
      select(
        "steps",
        "Rebalances per year",
        [
          [12, "12 · monthly"],
          [26, "26 · fortnightly"],
          [52, "52 · weekly"],
          [126, "126 · twice weekly"],
          [252, "252 · daily"],
        ],
        52,
      ),
      range("cost", "Trading cost (bps of notional)", 0, 30, 1, 2),
    ],
    presets: [
      [
        "Textbook approximation",
        { implied: 20, realized: 20, steps: 252, cost: 0 },
      ],
      ["Trading is expensive", { cost: 20, steps: 252 }],
      ["Volatility is wrong", { implied: 15, realized: 35, cost: 2 }],
    ],
    story: [
      [
        "Sell the call; build the hedge",
        "One European call on a $100 stock, with strike $100 and one year to expiry, is sold at the model premium. Delta shares are purchased. The remaining cash can be negative and earns or pays the same continuously compounded 4% rate. Initial transaction costs are paid from this account.",
      ],
      [
        "Rebalance without adding money",
        "At each date, the stock follows geometric Brownian motion with 4% drift and the chosen path volatility. Cash accrues interest, then finances the delta adjustment and its proportional fee. The call is repriced using the original pricing volatility and remaining maturity.",
      ],
      [
        "Settle every path",
        "At expiry the shares are liquidated, a final trading fee is charged and the call payoff is paid. The remaining cash is the short-call hedge P&L. Its mean, standard deviation and lower percentile describe different things: average bias, dispersion and a tail outcome.",
      ],
    ],
    formula:
      "S(t + Δt) = S(t) exp[(r − σpath²/2)Δt + σpath√Δt Z]\nC = S Φ(d₁) − K exp(−rT) Φ(d₂); delta = Φ(d₁)\nTerminal P&L = cash + delta × stock − payoff − liquidation fee",
    worked:
      "If delta rises from 0.50 to 0.60 at a stock price of $100, the hedge buys $10 of stock per option. A 10 bps trading cost deducts $0.01 from cash, in addition to the $10 purchase.",
    try: [
      "Compare the textbook preset with expensive daily trading. Does more trading always improve net results?",
      "Raise path volatility while holding pricing volatility fixed. A short option was sold using which volatility?",
    ],
    limits:
      "600 risk-neutral GBM paths, constant rate, no dividends, no jumps and no volatility surface. Monte Carlo intervals quantify uncertainty in the simulated mean, not model validity or a prediction interval. Runs with different step counts use different discretizations; individual paths are not paired across those runs.",
    engineering:
      "Analytic option Greeks plus a self-financing cash ledger. The same paths track a cost-free counterfactual. Tests cover an external numerical pricing benchmark, expiry payoff, zero-volatility handling and path-by-path cost monotonicity.",
    sources: [
      [
        "Scholes · Nobel Lecture: Derivatives in a Dynamic Environment",
        "https://www.nobelprize.org/uploads/2018/06/scholes-lecture.pdf",
      ],
    ],
  },
  risk: {
    no: "04",
    area: "PORTFOLIO THEORY & STATISTICS",
    title: "Beyond the tidy frontier",
    subtitle: "Diversification, correlation and portfolio tail risk",
    question:
      "Can two models agree on volatility and disagree on how bad losses get?",
    intro:
      "Mean and variance compress a distribution into two numbers. Keep those two numbers fixed and switch from Gaussian shocks to a heavy-tailed model. The portfolio still occupies the same point in mean–variance space, but its worst outcomes can change.",
    tags: ["Covariance", "Expected shortfall", "Heavy tails"],
    controls: [
      range("equity", "Equity weight (%)", 0, 100, 1, 60),
      range(
        "bond",
        "Bonds: share of remaining weight (%)",
        0,
        100,
        1,
        75,
        "Gold receives the rest. This keeps weights nonnegative and summing to 100%.",
      ),
      range(
        "corr",
        "Equity–bond correlation (×100)",
        -80,
        80,
        5,
        -20,
        "Gold has zero linear correlation with the other two assets.",
      ),
      select(
        "tails",
        "Shock distribution",
        [
          [0, "Gaussian"],
          [1, "Student-t · 5 degrees of freedom"],
        ],
        0,
      ),
    ],
    presets: [
      ["Conventional mix", { equity: 60, bond: 75, corr: -20, tails: 0 }],
      ["Correlation breaks", { corr: 80, tails: 0 }],
      ["Heavy-tail stress", { tails: 1 }],
    ],
    story: [
      [
        "Declare assumptions before optimizing",
        "Annual arithmetic means are 8% equity, 4% bonds and 5% gold. Volatilities are 20%, 7% and 15%. These are teaching inputs, not estimates from historical prices. Only the equity–bond correlation is variable, which keeps the covariance matrix positive definite over the allowed range.",
      ],
      [
        "Build comparable distributions",
        "The heavy-tail model scales a correlated Gaussian vector by √(3/χ²₅). The Student-t distribution has been standardized to unit variance, preserving the chosen covariance. Its shared scale also produces joint tail dependence even for pairs with zero linear correlation.",
      ],
      [
        "Keep frontier and tail measures separate",
        "The chart enumerates every long-only weight combination on a 2 percentage-point grid. The highlighted frontier retains points that improve expected return as volatility rises. The selected portfolio may lie between grid points. The loss quantile is the 95th percentile; expected shortfall averages losses at or beyond it.",
      ],
    ],
    formula:
      "Expected return = wᵀμ\nVariance = wᵀΣw\nVaR₉₅ = 95th percentile of loss; ES₉₅ = mean(loss ≥ VaR₉₅)",
    worked:
      "For a 60/30/10 portfolio, expected return is 0.6×8% + 0.3×4% + 0.1×5% = 6.5%. With equity–bond correlation −0.2, variance includes a negative covariance term. Switching the tail model does not change that analytic calculation.",
    try: [
      "Move correlation from −0.8 to +0.8 with fixed weights. Watch the selected point move horizontally.",
      "Switch only the shock distribution. Compare expected shortfall while analytic volatility stays fixed.",
    ],
    limits:
      "12,000 synthetic one-year arithmetic-return draws; no rebalancing, estimation error, leverage, taxes or transaction costs. Arithmetic Gaussian and Student-t returns can fall below −100%, so this is a distributional risk experiment, not a model of limited-liability asset prices. The frontier is a grid approximation.",
    engineering:
      "Explicit correlated sampling, covariance-preserving Student-t scaling and a nondominated grid search. Tests check pure-asset cases, weight conservation, analytic covariance and deterministic tail behavior.",
    sources: [
      [
        "Markowitz · Portfolio Selection (1952)",
        "https://onlinelibrary.wiley.com/doi/abs/10.1111/j.1540-6261.1952.tb01525.x",
      ],
      [
        "Boyd · Markowitz portfolio construction",
        "https://web.stanford.edu/~boyd/papers/pdf/markowitz.pdf",
      ],
    ],
  },
  contagion: {
    no: "05",
    area: "NETWORKS & SYSTEMIC RISK",
    title: "When one balance sheet breaks",
    subtitle: "An interbank clearing and contagion experiment",
    question:
      "How can a loss at one bank reach a bank that never held the damaged asset?",
    intro:
      "A bank’s asset can be another bank’s promise. When that promise cannot be paid, balance sheets must be solved together. Trace a shock through eight banks and compare the payment shortfalls produced by different network structures.",
    tags: ["Fixed-point algorithms", "Network topology", "Limited liability"],
    controls: [
      select(
        "topology",
        "Interbank network",
        [
          [0, "Directed ring"],
          [1, "Fully connected"],
          [2, "Hub and spokes"],
        ],
        0,
      ),
      range("exposure", "Network exposure scale", 20, 400, 10, 200),
      range(
        "capital",
        "External asset buffer",
        0,
        60,
        1,
        10,
        "External assets = 100 + seeded buffer. Each network has total interbank liabilities of 8 × the exposure scale.",
      ),
      range("shock", "External asset loss at Bank 1", 0, 180, 5, 100),
    ],
    presets: [
      ["A local shock", { topology: 0, shock: 30, capital: 20 }],
      [
        "A fragile ring",
        { topology: 0, shock: 100, capital: 5, exposure: 300 },
      ],
      [
        "Spread the exposure",
        { topology: 1, shock: 100, capital: 5, exposure: 300 },
      ],
    ],
    story: [
      [
        "Write down the liabilities",
        "Every bank owes 100 units to outside creditors (“society”). All networks have total interbank liabilities equal to eight times the exposure scale, and each bank’s incoming and outgoing interbank totals balance. Ring and complete networks split exposure equally across banks. In a hub, each direction of a hub–spoke link carries 4/7 of the scale, concentrating four times the scale at the hub. The network diagram shows only interbank edges; the outside creditor is implicit.",
      ],
      [
        "Clear simultaneously",
        "Begin by assuming every bank pays in full. Recompute each payment as the smaller of its promise and available assets plus incoming payments. A bank in default pays all creditors proportionally. Repeating this step from full payments finds the greatest clearing fixed point.",
      ],
      [
        "Separate the first loss from contagion",
        "An initial default is a bank unable to pay even if all its peers pay in full after the asset shock. A secondary default is solvent under that assumption but fails at the clearing solution. Total unpaid liabilities includes interbank claims; losses to outside creditors isolate the amount society does not receive.",
      ],
    ],
    formula:
      "pᵢ = min(p̄ᵢ, external assetsᵢ + Σⱼ Πⱼᵢ pⱼ)\nΠⱼᵢ = liabilities from j to i / total liabilities of j\nEquityᵢ = assets availableᵢ − paymentsᵢ",
    worked:
      "If a bank owes 100 to peers and 100 to society but has only 150 available, it pays 75% of every claim. Peers receive 75 in total and society receives 75. The peers then recalculate their own ability to pay.",
    try: [
      "Compare the fragile ring and spread-exposure presets with the same seed and balance-sheet parameters.",
      "Increase the external buffer. Does the shock produce fewer secondary defaults, smaller losses, or both?",
    ],
    limits:
      "An Eisenberg–Noe style static proportional-clearing model. Outside liabilities make the system regular. No bankruptcy costs, seniority, collateral, fire-sale feedback, maturity mismatch, behavioral runs or rescue policy. Iteration count is an algorithm diagnostic, not elapsed days.",
    engineering:
      "A deterministic fixed-point solver with an explicit convergence tolerance and residual checks. Tests verify limited liability, pro-rata conservation, full payment without shocks, and monotonic payments as external assets increase.",
    sources: [
      [
        "Eisenberg & Noe · Systemic Risk in Financial Systems (2001)",
        "https://pubsonline.informs.org/doi/10.1287/mnsc.47.2.236.9835",
      ],
    ],
  },
  auctions: {
    no: "06",
    area: "MECHANISM DESIGN",
    title: "Who pays for the winning bid?",
    subtitle: "First-price and second-price auctions under the same values",
    question: "Can different payment rules raise the same expected revenue?",
    intro:
      "A second-price winner pays someone else’s bid. A first-price winner pays their own, and has a reason to shade it. Compare both mechanisms on identical value draws, then change the reserve or push bidding away from equilibrium.",
    tags: ["Bayesian equilibrium", "Paired simulation", "Revenue equivalence"],
    controls: [
      range("bidders", "Number of bidders", 2, 15, 1, 5),
      range("reserve", "Seller reserve ($)", 0, 80, 1, 0),
      range(
        "shade",
        "First-price equilibrium bid multiplier (%)",
        50,
        130,
        1,
        100,
        "100% uses equilibrium bids; other values are deliberate deviations, not a solved new equilibrium.",
      ),
    ],
    presets: [
      ["Revenue equivalence", { bidders: 5, reserve: 0, shade: 100 }],
      ["A binding reserve", { reserve: 60, shade: 100 }],
      ["Over-shading bids", { reserve: 30, shade: 65 }],
    ],
    story: [
      [
        "Use the same auction twice",
        "Each of 10,000 auctions draws independent private values uniformly from $0 to $100. Bidders are symmetric and risk neutral. Both payment rules use these same values, so differences can be measured with a paired estimator rather than comparing unrelated random samples.",
      ],
      [
        "Solve the first-price bid",
        "Without a reserve, the symmetric equilibrium bid is (n−1)/n times value. With reserve R, a participating type v bids ((n−1)v + R(R/v)ⁿ⁻¹)/n. Types below the reserve do not participate. In the second-price auction, truthful bidding pays the larger of reserve and the runner-up value.",
      ],
      [
        "Test a prediction, then break an assumption",
        "At a 100% multiplier, both mechanisms share the same reserve and equilibrium allocation rule, so expected revenues should agree. Individual auctions still differ. Moving the multiplier is an off-equilibrium counterfactual, and sufficiently low bids can fail the reserve. The paired confidence interval measures Monte Carlo uncertainty in the mean difference.",
      ],
    ],
    formula:
      "No-reserve first-price bid: b(v) = (n − 1)v/n\nWith reserve R: b(v) = [(n − 1)v + R(R/v)ⁿ⁻¹]/n, v ≥ R\nNo-reserve expected revenue = 100 × (n − 1)/(n + 1)",
    worked:
      "With five bidders and a $90 value, the no-reserve first-price equilibrium bid is $72. A second-price winner with that value pays the runner-up’s value. Across many auctions, both expected revenues are $66.67; they need not match on a single auction.",
    try: [
      "Keep reserve zero and bids at equilibrium, then change bidder count. Compare the no-reserve benchmark in the ledger.",
      "Use a reserve of $60, then reduce the first-price multiplier. Inspect both seller revenue and the sale rate.",
    ],
    limits:
      "Independent uniform private values, symmetric risk-neutral bidders, a seller with zero value for keeping the item, and no entry costs or collusion. Bid multipliers are behavioral stress tests. They are not equilibrium predictions for risk aversion, correlated values or asymmetric bidders.",
    engineering:
      "Reserve-aware equilibrium bids and common random numbers for a paired revenue comparison. Tests compare the analytic no-reserve benchmark, reserve-adjusted theory, zero-sale cases and deterministic replay.",
    sources: [
      [
        "Jonathan Levin · Auction Theory (Stanford, 2004)",
        "https://web.stanford.edu/~jdlevin/Econ%20286/Auctions.pdf",
      ],
    ],
  },
};
