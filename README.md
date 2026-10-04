# Catalyst Lab: Computational Mechanism Design & JoSAA Audit

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
