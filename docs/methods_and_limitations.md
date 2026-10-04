# JoSAA Mechanism Design Audit: Methods & Theoretical Foundations

## 1. Mechanism Overview
The Joint Seat Allocation Authority (JoSAA) allocates seats across IITs, NITs, and IIITs. While standard Gale-Shapley Deferred Acceptance (DA) guarantees weak dominant-strategy incentive compatibility (DSIC) in single-round settings, JoSAA operates dynamically across multiple rounds with:
- **Freeze**: Candidate permanently locks into assigned seat and exits subsequent matching.
- **Float**: Candidate accepts tentative match but upgrades if any higher-ranked choice across any institute opens up.
- **Slide**: Candidate accepts tentative match but restricts upgrades strictly to choices within the same institute.
- **Withdrawal**: Candidate forfeits seat, injecting an exogenous vacancy.

## 2. Invariant & Strategy-Proofness Findings
- **Static Baseline**: Under standard DA, truncation or rank-swapping cannot strictly improve a student's assigned utility.
- **Dynamic Float vs Freeze**: Under stochastic seat surrenders (e.g. students exiting for state counselling, BITS, or foreign programs), floating weakly dominates freezing for monotonic preference lists.
- **Slide Inefficiency**: Slide acts as a constrained search heuristic, mitigating relocation risk but introducing artificial blocking pairs relative to unconstrained stable matchings.

## 3. Methodological Limitations
1. **Unobserved Individual Preferences**: JoSAA publishes aggregate opening and closing ranks (OR/CR), not submitted preference vectors. Synthetic student cohorts are generated using revealed preference heuristics based on closing rank spreads.
2. **Reservation Quota Partitioning**: The simulation currently isolates vertical quotas (OPEN, OBC-NCL, SC, ST) and abstracts complex horizontal/supernumerary allocations.
