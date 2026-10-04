
# Catalyst Lab: Computational Mechanism Design & Allocation Testbed

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

Catalyst Lab is an open-source research testbed auditing the strategy-proofness and stability of India's **Joint Seat Allocation Authority (JoSAA)** mechanism.

## The Research Question
In standard microeconomic theory, student-proposing **Deferred Acceptance (Gale-Shapley, 1962)** guarantees stability and strategy-proofness. JoSAA introduces sequential rounds with dynamic commitment actions (`Freeze`, `Float`, `Slide`) alongside exogenous dropouts. We audit whether multi-round dynamics break textbook incentive guarantees.

## Repository Architecture
- `core/deferred_acceptance.py`: Baseline student-proposing Gale-Shapley engine.
- `core/josaa_engine.py`: Multi-round state transitions (Freeze, Float, Slide).
- `core/agents.py`: Strategic deviation profiles & utility auditors.
- `core/market_builder.py`: Empirical cutoff parser & revealed preference calibrator.
- `data/raw/`: Verified JoSAA reference cutoffs.
- `tests/`: Automated invariant tests.

## Running Tests
```bash
python3 -m pytest tests/ -v



