# WordPress integration

The main domain is hosted by WordPress.com; the interactive lab is served by GitHub Pages. These files version the content published to WordPress alongside the model source.

- `front-page.html`: replace the Front Page template's HTML in the Site Editor code editor. It is a fragment, with inline styles for the existing theme. UTF-8 source; the WordPress document supplies the charset and viewport.
- `projects.blocks.html`: the Gutenberg code-editor content of the Projects page, at `/projects/`.

The homepage links to the existing `/aboutme/` page. The previous `/about` and `/projects` links did not resolve when inspected. The new Projects page makes all six experiments and both existing research repositories discoverable.

Simulation scripts stay on the lab subdomain. No WordPress plugin, account permissions, hosting plan or domain configuration needs to change.
