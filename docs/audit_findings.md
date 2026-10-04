# Algorithmic Audit of Joint Seat Allocation (JoSAA): Mechanism Design, Invariant Verification, and Strategic Regret

**Author:** Sharvina Srivastava  
**Project:** Catalyst Lab (`lab.yourcatalyst.in`)  
**Code Repository:** `github.com/thetarocks/catalyst-lab`  

---

## 1. Abstract

We evaluate the structural mechanism governing undergraduate technical education admissions in India (JoSAA). While one-shot Student-Proposing Deferred Acceptance (DA) guarantees dominant-strategy incentive compatibility (DSIC) and eliminates justified envy, JoSAA executes across discrete sequential rounds with candidate state actions (`Freeze`, `Float`, `Slide`) alongside exogenous dropouts. We computationally model this multi-round state space, calibrate cohorts against historical opening/closing rank distributions, and audit the interaction between dynamic vacancy chains and vertical reservation interleaving under the *Indra Sawhney* / *Sönmez-Yenmez* framework.

---

## 2. Core Invariants & Mathematical Guarantees

### 2.1 Static Dominant-Strategy Incentive Compatibility (DSIC)
In static DA, candidate utility is invariant to strategic manipulations such as preference truncation or non-truthful rank swapping:
$$\mu(s \mid P_s) \succeq_s \mu(s \mid P'_s) \quad \forall P'_s \neq P_s$$

* **Empirical Audit:** Across $N = 600$ evaluated strategic deviations (preference truncations and top-$k$ choice permutations) on a calibrated 60-student market, the empirical violation rate was **$0.00\%$**, confirming strategy-proofness in the static limit.

### 2.2 Vertical Reservation Interleaving
Under Supreme Court mandates, reserved-category candidates ($c \in \{\text{OBC, SC, ST, EWS}\}$) compete unconditionally for $\text{OPEN}$ merit capacity according to their Common Rank List (CRL) score:
1. Candidate $s$ attempts allocation to $\text{OPEN}$ capacity.
2. If displaced by a higher-ranked CRL candidate, $s$ falls back to category-reserved capacity $q_c$.
3. **Property:** Lower-ranked general category applicants are displaced before any category quota is consumed, preserving reserved seats for lower-ranked category peers.

---

## 3. Dynamic Sequential Allocation & Strategic Regret

### 3.1 The Freeze vs. Float Dilemma
While static preference submission is strategy-proof, dynamic round choices introduce a timing game under stochastic seat surrender:
* Let $V_t$ be the set of vacant seats created at round $t$ via exogenous withdrawal (e.g., admissions to alternate institutions).
* A candidate selecting `FREEZE` locks their current match $\mu_{t}(s)$ and forfeits consideration for any $v \in V_{t+1}$.
* A candidate selecting `FLOAT` retains $\mu_{t}(s)$ as an insurance baseline while weakly expanding the accessible match set to $\mu_{t+1}(s) \succeq_s \mu_{t}(s)$.

### 3.2 Regret Analysis
Under non-zero withdrawal probability $p_{\text{withdraw}} > 0$ upstream:
$$\mathbb{E}[U(\text{Float})] \ge \mathbb{E}[U(\text{Freeze})]$$

Simulations across 50 independent market shock trials reveal that premature freezing incurs measurable welfare losses, forfeiting upgrades when upstream vacancies cascade through the preference chain.

---

## 4. Software Architecture & Reproducibility

* **Engine:** Python 3.9+ (`core/deferred_acceptance.py`, `core/josaa_engine.py`, `core/reservation_engine.py`)
* **Test Harness:** Complete pytest coverage enforcing stability, zero justified-envy, and vertical reservation invariants.
* **Audit Scripts:** Automated perturbation scripts for DSIC verification (`scripts/benchmark_manipulability.py`) and dynamic regret computation (`scripts/audit_dynamic_strategies.py`).
