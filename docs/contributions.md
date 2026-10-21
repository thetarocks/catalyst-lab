# My contributions, research development and validation

I’m Sharvina Srivastava. This record explains my original research, how my questions developed, and which later portfolio components were developed with Codex assistance.

## My research

- **DAO governance:** I researched and wrote the [SSRN preprint](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=7103878), accompanied by the [collection and reweighting pipeline](https://github.com/thetarocks/arbitrum-quadratic-voting-simulation). My initial inquiry concerned quadratic voting. Fixed-vote reweighting changed the winning choice in 4 of 15 selected proposals. I treat that as a counterfactual with observed votes held fixed, not a prediction of how voters would behave under new rules.
- **Sybil follow-up:** I pursued the [equal-split identity model](https://github.com/thetarocks/dao-sybil-resilience) after editorial criticism. I studied how splitting one balance changes square-root voting weight. This model does not resolve endogenous capital concentration, identity costs or voter behaviour.
- **JoSAA:** the JEE admissions race around me in India made me curious about counselling fairness. I developed the original project around the matching engine, quota rules, round actions and audit framework. My [repository history](https://github.com/thetarocks/catalyst-lab/commits/main/) records those stages before the later portfolio extensions. My aim was to connect established matching theory to computational checks, not to claim a new proof of applicant DSIC.

## Where I used Codex assistance

For the later portfolio extensions, I used Codex to:

- Develop the six educational finance browser implementations, seeded kernels, live explanations, charts, numerical checks, exports and maths/code guide. I present these as one teaching laboratory implementing established models with synthetic inputs, not six original research papers.
- Build the current allocation teaching interface, deterministic examples, executable browser fixture inspector and associated tests.
- Repair the dynamic audit to use the current engine and fix inconsistent applicant/program assignment state after a higher-priority displacement. The regression is in `tests/test_da.py`.
- Correct the static audit count to 1,080 perturbations, generate the current benchmark evidence and local runtime records, and prepare the project-hosted technical notes.
- Write and refine the current portfolio copy, documentation and interface code, and migrate the landing site to static GitHub Pages hosting.

I attribute the current benchmark findings to the published implementation and workload. I do not claim that I personally discovered the Codex-assisted regression or independently coded every later browser component.

## How my research questions changed

**DAO:** I started with quadratic voting and compared outcomes with observed votes held fixed. Editorial feedback challenged both the novelty of changed outcomes and the assumption that capital concentration would stay fixed under new rules. That led me to the Sybil study, where I explored identity splitting as one possible response. I still regard that extension as narrower than a complete equilibrium model.

**JoSAA:** I started with counselling fairness and built an explicit matching and multi-round model. The distinction I now emphasize is between established single-round incentives and irreversible decisions when later vacancies appear. My current 50/50 result concerns one synthetic applicant and repeatedly sampled withdrawals; I do not present it as an estimate for real students.

## Feedback and validation

I received editorial feedback on a rejected submission. The editor questioned the novelty of outcome changes under square-root weighting and the assumption that capital concentration stays fixed after a rule change. I paraphrase that criticism on the site; I have not published the private correspondence for independent verification. I treat it as external criticism that shaped my next question, not as an endorsement or completed peer review.

My SSRN paper is a public preprint, not a peer-reviewed acceptance. I use internal CI and browser fixtures to support reproducibility within their stated scope, and the hosted technical notes to document the projects. I do not claim an independently verified user study, external replication, mentor endorsement or publication acceptance.
