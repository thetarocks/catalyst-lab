# Methods and limitations

## Established baseline

Applicant-proposing deferred acceptance satisfies DSIC under the standard single-round assumptions of fixed priorities and responsive program choice. This project does not claim a new proof. The static benchmark tests selected preference changes in one synthetic market.

## Multi-round model

Freeze retains the assigned seat and stops upgrades; Float permits better choices; Slide restricts upgrades to the same institute. The paired audit compares Float and Freeze for the same selected applicant under identical withdrawals. Utility is generated from a synthetic ordering, and excludes relocation costs, risk preferences and deadlines. A model-level upgrade is not a comprehensive welfare claim.

## Data

`data/raw/sample_josaa_cutoffs.csv` contains sample opening/closing ranks without a recorded official URL or year. OPEN round-one rows generate capacities and synthetic preferences. The audit does not use actual submitted JoSAA preference lists and is not a validated reproduction of official allocation results.

## Limits

The static search is finite. Dynamic trials condition on one selected applicant and repeat four possible withdrawal sets; 50/50 is not a real-student incidence estimate. Vertical-quota fixtures are separate from the OPEN-only benchmark. Horizontal, home-state, supernumerary and other detailed rules are not fully modeled. Source hashes improve reproducibility, but cannot establish input provenance. CI passing does not establish complete test coverage.

See [audit findings](audit_findings.md) and the [technical note](../site/artifacts/josaa-technical-note.pdf) for exact counts, implementation complexity and reproduction commands.
