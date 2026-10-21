# Hosting and migration

The static portfolio is maintained in `site/` and published from the separate public `thetarocks/yourcatalyst-site` repository. The Python and browser lab remains in `thetarocks/catalyst-lab` at `lab.yourcatalyst.in`.

- Main site: HTML, CSS, JavaScript ES modules and SVG; no application server, analytics or WordPress runtime.
- DNS remains with the existing WordPress nameservers. Apex A records point to the four GitHub Pages addresses; www aliases thetarocks.github.io. The lab CNAME is unchanged.
- WordPress content and subscription are retained as a backup. The unrelated salt-from-seawater post was set to Private.
- The former apex used WordPress-managed A records and www aliased yourcatalyst.in. WordPress DNS actions can restore its default A records if a rollback is required. Do not change nameservers or mail records as part of a website update.
- Publish changes by running the portfolio generator in this repository, reviewing locally and copying `site/` contents into the hosting checkout. Preserve its CNAME and `.nojekyll`. PDF regeneration requires reportlab.
- A matching copy of the browser model kernel lives in `site/assets/lab-models.mjs`; copy from `experiments/models.mjs` when model code changes, then verify the previews and seeded evidence.
