# The experiment notebook

Six browser-based educational experiments extend the JoSAA allocation lab. They are implementations of established models, not claims of original empirical research.

| Experiment | Computational work | Question |
| --- | --- | --- |
| Order-book execution | Price-time matching, fill ledger, partial fills, VWAP | What does immediacy cost as depth runs out? |
| Constant-product AMM | Fee-aware reserve accounting and LP/hold benchmark | How do trade size and relative price affect traders and LPs? |
| Delta hedging | Black–Scholes Greeks, GBM Monte Carlo, self-financing cash ledger | How do discretization, costs and volatility misspecification affect replication? |
| Portfolio tail risk | Correlated Gaussian and standardized multivariate Student-t draws, grid frontier, VaR/ES | What does mean–variance analysis leave out? |
| Interbank contagion | Regular proportional-liability network, greatest clearing fixed point | When does a local shock create secondary defaults? |
| Auction comparison | Reserve-aware first-price equilibrium, truthful second-price bids, paired estimators | Which assumptions make revenue equivalence hold? |

## Run locally

From the repository root:

```sh
python3 -m http.server 8765
# Open http://localhost:8765/experiments/
node --test experiments/models.test.mjs
```

Node 22+ runs the numerical tests with its built-in test runner. The browser app has no npm dependencies and no build step. Serve over HTTP; ES modules do not work reliably from file://. Optional Google Fonts have system-font fallbacks; the models do not call any API.

## Reproducibility

The URL hash records model name, all controls and a 32-bit seed. Each run reconstructs a Mulberry32 PRNG; Gaussian samples use Box–Muller. JSON exports contain model version, parameters, metrics and full underlying simulation outputs. CSV exports contain parameters, metrics, ledger and plotted data in long format. Exports always describe the **last completed run**. A changed control does not silently overwrite the displayed result.

`models.mjs` contains pure kernels; `content.mjs` contains controls and method notes; `app.mjs` renders the interface and accessible SVG charts. Every chart has a numerical data table. No output is sent to a server.

## Numerical conventions

- Annual rates and volatilities enter kernels as percentages where indicated in controls. Internal formulas use decimals. Display values use at most three decimals; exported values retain numerical precision.
- Hedging uses 600 risk-neutral paths at r = 4%, S = K = 100 and T = 1 year. Initial, rebalance and liquidation fees are charged. A zero-cost ledger uses exactly the same paths. Standard-error intervals refer to the Monte Carlo mean, not future outcomes. Changing step count does not preserve paired paths.
- Portfolio assumptions are synthetic: means [8%, 4%, 5%], volatilities [20%, 7%, 15%] for equity/bonds/gold. Only equity–bond correlation varies. A common chi-squared scale preserves covariance and introduces Student-t tail dependence. The frontier uses a 2% weight grid; it is not a continuous optimizer. Arithmetic tails can produce returns below −100%.
- Bank networks have eight banks and an outside creditor. Total interbank liabilities are 8 × exposure scale for all three topologies. Incoming and outgoing interbank totals balance at each bank before the shock. The hub concentrates exposure. Clearing starts at full payments, uses absolute tolerance 1e-10, and stops after at most 10,000 iterations. No default haircut or fire-sale feedback is modeled.
- Auctions draw 10,000 iid U[0,100] private-value vectors. The same draws feed both payment rules. The first-price reserve equilibrium is b(v) = [(n−1)v + R(R/v)^(n−1)]/n for v ≥ R. A bid multiplier other than 100% is an off-equilibrium stress experiment. Unsold items contribute zero revenue and zero realized welfare.
- AMM LP divergence is a separate fee-free arbitrage scenario, not a continuation of the displayed swap.

## Verification scope

The automated suite checks pricing benchmarks, exact small examples, conservation, monotonicity, fixed-point residuals, analytic auction revenue, seeds, presets and allowed parameter endpoints. Stochastic tolerances are declared in the tests. Statistical checks use fixed seeds, so they are reproducible but do not validate a real market distribution. The methods, limitations, equations and primary references are also visible inside each experiment.

## Attribution and authorship

Original models are attributed in the interface. This extension was developed with AI coding assistance. The notebook keeps the kernels, assumptions and intermediate quantities inspectable for review and further development.

## Maths and code companion

[Read the companion guide](https://lab.yourcatalyst.in/experiments/learn.html) for step-by-step derivations, hand-worked examples, kernel walkthroughs, computational complexity, validation scope and questions for further study. `learn.html` is self-contained and can also be read offline. `topics.mjs` supplies the subject-led navigation labels shared by the notebook index and experiment headers.

The index includes a live order-book preview powered by the same `orderbook()` kernel as the full simulator. Search and category filters run locally. The interface respects reduced-motion preferences, keeps chart data available in tables and supports horizontal chart scrolling on small screens.
