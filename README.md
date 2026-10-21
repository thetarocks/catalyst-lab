# Catalyst Lab — markets, risk & mechanism design

An open-source notebook connecting economic rules to inspectable algorithms, interactive counterfactuals and numerical checks.

**[Run the experiments](https://lab.yourcatalyst.in/experiments/) · [Read the maths & code guide](https://lab.yourcatalyst.in/experiments/learn.html) · [Visit Your Catalyst](https://yourcatalyst.in/)**

![Interactive notebook with a live trading preview](docs/images/notebook-desktop.jpg)

| Experiment | Mathematics & code | Try it |
| --- | --- | --- |
| Order-book execution | Price–time matching, partial fills, VWAP | [Simulator](https://lab.yourcatalyst.in/experiments/#orderbook) · [Explanation](https://lab.yourcatalyst.in/experiments/learn.html#orderbook) |
| Automated market makers | Constant-product swaps, reserve invariants, LP divergence | [Simulator](https://lab.yourcatalyst.in/experiments/#amm) · [Explanation](https://lab.yourcatalyst.in/experiments/learn.html#amm) |
| Discrete delta hedging | Black–Scholes, GBM paths, a self-financing ledger | [Simulator](https://lab.yourcatalyst.in/experiments/#hedge) · [Explanation](https://lab.yourcatalyst.in/experiments/learn.html#hedge) |
| Portfolio tail risk | Correlated sampling, standardized Student-t shocks, VaR/ES | [Simulator](https://lab.yourcatalyst.in/experiments/#risk) · [Explanation](https://lab.yourcatalyst.in/experiments/learn.html#risk) |
| Interbank contagion | Directed liabilities, proportional clearing, fixed-point iteration | [Simulator](https://lab.yourcatalyst.in/experiments/#contagion) · [Explanation](https://lab.yourcatalyst.in/experiments/learn.html#contagion) |
| Auction design | Reserve-aware equilibrium bids and paired Monte Carlo | [Simulator](https://lab.yourcatalyst.in/experiments/#auctions) · [Explanation](https://lab.yourcatalyst.in/experiments/learn.html#auctions) |

The browser models use synthetic inputs and established theory. Each includes assumptions, a worked example, primary references, numerical exports and validation. The [companion guide](experiments/learn.html) also covers algorithms, complexity, interpretation and possible extensions. [Implementation and reproducibility notes](experiments/README.md) describe the kernels and the use of coding assistance.

The experiment workspaces include debounced live controls, contextual explanations, pinned metric baselines, animated charts, mouse/touch/keyboard inspection, series toggles and selectable bank obligations. Live mode can be paused; exports always describe completed runs. Baselines and chart-visibility choices remain in browser memory and reset on a new visit.

![Experiment controls, exact scenario markers and an inspectable chart](docs/images/workbench-desktop.jpg)

The interface uses original SVG studies of each mechanism, a working order-book preview, searchable experiment collections and a companion guide with section tracking and reading progress. Motion respects reduced-motion preferences. The illustrations are visual identities, separate from the numerical charts.

## Explore the repository

- [Model kernels](experiments/models.mjs) and [numerical tests](experiments/models.test.mjs)
- [Interactive index](experiments/app.mjs), [live trading preview](experiments/quick-preview.mjs), and [styles](experiments/style.css)
- [Live explanations](experiments/live-notes.mjs), [interactive charts](experiments/charts.mjs), [bank inspection](experiments/network-view.mjs) and [presentation checks](experiments/presentation.test.mjs)
- [WordPress homepage, Projects, About and page-template source](wordpress/)
- [Existing JoSAA simulator](https://lab.yourcatalyst.in/) and the original Python audit below

## Run and verify

No npm installation or build step is required for the browser notebook. Node 22+ runs the JavaScript checks.

```sh
python3 -m http.server 8765
# Visit http://localhost:8765/experiments/
node --test experiments/*.test.mjs
python -m pip install pytest
python -m pytest -q
```

The validation workflow runs 43 JavaScript numerical and presentation tests and 10 Python JoSAA tests. Passing checks support implementation correctness under the stated assumptions; they do not validate a market forecast or establish a new economic theorem.

---

## Original JoSAA audit

[![Pytest Suite](https://img.shields.io/badge/pytest-10%2F10%20passing-brightgreen)](#)
[![Live Demo](https://img.shields.io/badge/demo-lab.yourcatalyst.in-blue)](https://lab.yourcatalyst.in)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

An algorithmic testbed and game-theoretic audit of India's **Joint Seat Allocation Authority (JoSAA)** admission mechanism. 

The project formalizes and evaluates the interaction between **Gale-Shapley Student-Proposing Deferred Acceptance**, sequential multi-round clearing under dynamic candidate actions (`Freeze`, `Float`, `Slide`), and Supreme Court-mandated vertical reservation interleaving (*Indra Sawhney* / *Sönmez-Yenmez*).

🌐 **Interactive Sandbox:** [https://lab.yourcatalyst.in](https://lab.yourcatalyst.in)

---

## Key Findings

1. **Static Dominant-Strategy Incentive Compatibility (DSIC):**
   * Evaluated across $N = 600$ strategic perturbations (choice truncations and rank-inversion deviations) on a calibrated 60-applicant market.
   * **Result:** $0.00\%$ profitable deviations, empirically confirming strategy-proofness in the one-shot static limit.
2. **Dynamic Regret in Multi-Round Clearing:**
   * While static preference submission is strategy-proof, sequential rounds introduce a timing game under exogenous upstream dropouts.
   * Prematurely selecting `FREEZE` is strictly weakly dominated by `FLOAT`, with simulations showing significant welfare losses when upstream seats open up.
3. **Merit-First Quota Interleaving:**
   * Verified that reserved-category candidates consume OPEN merit seats first by Common Rank List (CRL) merit before touching category quotas, preserving affirmative action capacity.

---

## Repository Architecture

```text
catalyst-lab/
├── core/
│   ├── deferred_acceptance.py      # Gale-Shapley (1962) student-proposing DA
│   ├── josaa_engine.py             # Multi-round dynamic clearing (Freeze/Float/Slide)
│   ├── reservation_engine.py       # Indra Sawhney vertical quota interleaving
│   └── market_builder.py           # Revealed-preference cohort calibration
├── data/
│   └── raw/sample_josaa_cutoffs.csv # Opening and closing rank empirical benchmarks
├── docs/
│   ├── methods_and_limitations.md  # Formal assumptions and boundary conditions
│   └── audit_findings.md           # Theoretical proofs and empirical audit findings
├── scripts/
│   ├── benchmark_manipulability.py # Automated DSIC perturbation audit (600 tests)
│   └── audit_dynamic_strategies.py # Dynamic Freeze vs. Float regret simulator
├── tests/                          # 100% passing pytest invariant test suite
├── index.html                      # Interactive web sandbox deployed to root
└── CNAME                           # Custom domain routing (lab.yourcatalyst.in)
```
