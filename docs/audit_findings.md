# JoSAA audit findings

The contribution here is an inspectable implementation and paired multi-round counterfactuals. Applicant-proposing deferred acceptance is already known to satisfy DSIC in the standard single-round setting; finite tests do not prove that theorem.

## Published results

- Static: 60 synthetic applicants, 17 programs, 1,080 tested deviations, zero profitable deviations. This enumerates selected truncations and two swaps per applicant, not every possible preference report.
- Dynamic: 80 synthetic applicants; applicant_005 initially holds IIT Delhi CSE. Across 50 paired trials with seed 1337 and one upstream withdrawal per trial, Float upgrades and Freeze retains its first seat in all 50. There are only four possible upstream withdrawal sets, repeatedly sampled. One initial selection plus two rounds in two worlds per trial gives 201 matching runs.
- The retained-match bookkeeping regression exposed by the benchmark has a dedicated test. Reservation tests are separate from the OPEN-only benchmark cohort.

## Data and limits

The sample cutoff CSV has no documented official URL/year. Preferences and utilities are generated, not observed. The model omits many official rules, costs and behavioral responses. These results are not estimates of how many real students lose seats, quota clearing effects, or advice about a particular counselling round.

Inspect [static JSON](../evidence/josaa-static.json), [dynamic JSON](../evidence/josaa-dynamic.json), [the three-page note](../site/artifacts/josaa-technical-note.pdf), [tests](../tests/) and [audit scripts](../scripts/). The JSON includes source hashes and trial-level evidence.
