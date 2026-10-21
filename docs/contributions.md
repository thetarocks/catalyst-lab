# Contributions, research development and validation

This record separates Sharvina Srivastava’s account of her original projects from the later Codex-assisted portfolio work. A commit history records development, not independently verified unaided authorship.

## Sharvina’s research

- **DAO governance:** Sharvina researched and wrote the [SSRN preprint](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=7103878), with the [collection and reweighting pipeline](https://github.com/thetarocks/arbitrum-quadratic-voting-simulation). Her initial inquiry concerned quadratic voting. Fixed-vote reweighting changed the winning choice in 4 of 15 selected proposals; that is a counterfactual with observed votes held fixed, not a behavioural prediction.
- **Sybil follow-up:** Sharvina pursued the [equal-split identity model](https://github.com/thetarocks/dao-sybil-resilience) after editorial criticism. This asks how splitting one balance changes square-root voting weight. It does not resolve endogenous capital concentration, identity costs or voter behaviour.
- **JoSAA:** motivated by the JEE admissions race in India, Sharvina developed the original counselling-fairness project: the matching engine, quota rules, round actions and audit framework. The [history](https://github.com/thetarocks/catalyst-lab/commits/main/) includes those stages before the subsequent portfolio extensions. The project connects established matching theory to explicit computational checks; it does not offer a new proof of applicant DSIC.

The owner reports these roles. This record does not certify absence of earlier tools or assistance not otherwise documented.

## Codex-assisted extensions and repairs

During the current portfolio work, Codex:

- Developed the six educational finance browser implementations, seeded kernels, live explanations, charts, numerical checks, exports and maths/code guide. These implement established models with synthetic inputs; they are one teaching laboratory, not six original research papers.
- Built the current allocation teaching interface, deterministic examples, executable browser fixture inspector and associated tests.
- Repaired the dynamic audit to use the current engine and fixed inconsistent applicant/program assignment state after a higher-priority displacement. The regression is in `tests/test_da.py`.
- Corrected the static audit count to 1,080 perturbations, generated inspectable current benchmark evidence and local runtime records, and prepared the project-hosted technical notes.
- Wrote and refined current portfolio copy, documentation and interface code, and migrated the landing site to static GitHub Pages hosting.

The generated benchmark findings should be attributed to the published implementation and workload. Do not imply that Sharvina personally discovered the assisted regression or independently coded every later browser component.

## What changed in the research question

**DAO:** initial quadratic-voting inquiry → fixed-vote outcome comparison → editorial objection that changed outcomes are unsurprising and concentration can respond to new rules → separate Sybil study of one possible response. The equal-split extension is narrower than a complete equilibrium model.

**JoSAA:** counselling fairness → explicit matching and multi-round model → distinguish established single-round incentives from irreversible decisions under later vacancies. The current 50/50 result conditions on one synthetic applicant and repeatedly sampled withdrawals; it is not an estimate for real students.

## Independent feedback and validation status

Sharvina supplied private editorial correspondence about a rejected submission. The editor questioned the novelty of outcome changes under square-root weighting and the assumption that capital concentration stays fixed after a rule change. The site paraphrases this as **author-reported editorial feedback**; correspondence is not published for independent verification. Rejection feedback is external criticism, not endorsement or completed peer review.

The SSRN item is a public preprint, not a peer-reviewed acceptance. Internal CI and browser fixtures support reproducibility within their scope. Hosted technical notes are project documentation. No independently verified user study, external replication, mentor endorsement or publication acceptance is claimed here.
