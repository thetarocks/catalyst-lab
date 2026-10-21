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

## Research and evidence

- **JoSAA:** 0 profitable deviations across **1,080** finite preference perturbations (60 synthetic applicants, 17 programs). DSIC for applicant-proposing DA in a single round is established theory; this is an implementation check, not a new proof.
- **Multi-round contribution:** for one selected applicant, freezing forfeits an upgrade in **50/50 paired trials**, with one upstream withdrawal per trial. These repeatedly sample only four possible withdrawal sets; this is not a population estimate. The audit performs 201 matching runs.
- **Data:** synthetic preferences and utilities generated from `data/raw/sample_josaa_cutoffs.csv`. Its official source/year are not documented; it must not be treated as verified real JoSAA data or actual submitted preferences.
- **DAO paper:** [Arbitrum governance counterfactuals on SSRN](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=7103878). This preprint concerns fixed-vote square-root reweighting. The [Sybil follow-on](https://github.com/thetarocks/dao-sybil-resilience) is a separate analytical model; complete raw ballots are not archived here.

Read the [three-page JoSAA technical note](site/artifacts/josaa-technical-note.pdf), [two-page Sybil model note](site/artifacts/sybil-technical-note.pdf), [static evidence](evidence/josaa-static.json), [paired-trial evidence](evidence/josaa-dynamic.json), and [methods and limitations](docs/methods_and_limitations.md).

## Explore the repository

- [Static portfolio source](site/) — Home, Projects, About, previews, PDFs and evidence; published through [yourcatalyst-site](https://github.com/thetarocks/yourcatalyst-site)
- [Python matching kernels](core/), [benchmark scripts](scripts/) and [Python tests](tests/)
- [Browser model kernels](experiments/models.mjs) and [numerical tests](experiments/models.test.mjs)
- [Live explanations](experiments/live-notes.mjs), [interactive charts](experiments/charts.mjs) and [presentation checks](experiments/presentation.test.mjs)
- [Finance notebook documentation](experiments/README.md) and [maths/code guide](experiments/learn.html)
- [Legacy WordPress markup](wordpress/) — retained as a migration backup

## Run and verify

No npm installation or build step is required for the browser notebook. Node 22+ runs the JavaScript checks.

```sh
python3 -m http.server 8765
# Visit http://localhost:8765/experiments/
node --test experiments/*.test.mjs
python -m pip install pytest
python -m pytest -q
```

The validation workflow runs 43 JavaScript checks and 14 Python tests. Passing checks support implementation correctness under the stated assumptions; coverage has not been measured. They do not validate a market forecast or establish a new economic theorem.

[![Validate models](https://github.com/thetarocks/catalyst-lab/actions/workflows/validate.yml/badge.svg)](https://github.com/thetarocks/catalyst-lab/actions/workflows/validate.yml)

Reproduce the audited results and portfolio:

```sh
python -m scripts.benchmark_manipulability --json evidence/josaa-static.json
python -m scripts.audit_dynamic_strategies --json evidence/josaa-dynamic.json
cp evidence/josaa-*.json site/evidence/
python scripts/build_portfolio.py
python3 -m http.server 8766 --directory site
# Visit http://localhost:8766/
# Optional PDF regeneration: pip install reportlab, then
python scripts/build_technical_notes.py
```

The Python DA implementation uses program-side sorting and a list queue; it is an inspectable small-market implementation, not an optimized national-scale allocator. Quota fixtures test the implemented vertical-quota rules; they do not establish equivalence to every official JoSAA rule. The browser sandbox has its own synthetic illustrative inputs, distinct from the Python benchmark cohorts. See the PDFs for exact scope and limitations.

The portfolio uses coding assistance; the intent is to make the equations, source, tests and evidence inspectable enough to explain and challenge. No real user testimonial, mentor endorsement or competition outcome is claimed without a verifiable source.
