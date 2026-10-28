+++
title = "FAQ"
date = 2026-10-28
description = "Short answers about what agno is, how it differs from other generators, and which features it deliberately leaves out."
summary = "Quick answers on scope, comparisons, JavaScript, i18n, plugins, images and deployment."
weight = 160
extra = { chapter = "16" }
+++

## What is agno?

A fast, content-first static site generator written in Rust. It turns Markdown and MiniJinja templates into a static site from a single 4.2 MB binary.

## Is this the AI agent framework called Agno?

No. This is **agno, the static site generator** (the `agno` crate). An unrelated AI agent framework shares the name. This documentation covers only the static site generator in the `agnogad/agno` repository.

## How is it different from Hugo or Zola?

All three are static site generators. agno's differences:

- Incremental builds are the default; unchanged pages are skipped.
- MiniJinja templates instead of Go templates or Tera.
- A smaller feature surface: no shortcodes, no asset pipeline, no plugin system.
- A single small binary with batteries included (RSS, sitemap, taxonomies, search index, link checker, dev server).

See [Benchmarks](/docs/benchmark/) for measured differences.

## Do I need Rust to use it?

No. Prebuilt binaries exist for Linux, macOS and Windows. Rust 1.88+ is only needed for `cargo install` or building from source.

## Can I use JavaScript?

Yes, as plain `<script>` tags from `static/` or inline in templates. There are no JavaScript islands, no hydration and no component framework. Client-side search, analytics or a comment widget work fine; a React app as the site framework does not.

## Can I use React, Vue or Svelte?

Not as a build-time component system. agno does not bundle or compile components. You can ship a prebuilt SPA in `static/`, but at that point agno is only serving files.

## Is there a plugin system?

No, by design. The extension points are templates, `static/` and the content model. A plugin API would grow the surface and slow the binary down.

## Does it support i18n?

No built-in i18n framework. `language` controls date formatting and the `lang` attribute. For a multilingual site, use separate sections or separate sites and link between them manually.

## Can I define custom taxonomies?

No. Only `tags` and `categories` are built in. For a third classification, add a custom frontmatter field and filter pages in a template; no term pages are generated.

## Is search server-side?

No. `search_index = true` emits a JSON file; the browser searches it. See [Search](/docs/search/) for a dependency-free implementation.

## Why is my page not in the search index?

It has no `date`. Only regular pages with a date are indexed, and section landing pages are never included. Add a date and rebuild.

## Can I add comments?

Yes, with a third-party client-side widget (for example Giscus or utterances) embedded in `page.html`. agno itself stores no data and has no comment backend.

## Can I add analytics?

Yes. Put the script tag in `base.html`. Keep it out of local development if you care about clean numbers.

## Does it optimise images?

No. agno copies images and page-bundle assets as-is. Optimise before committing, or add your own build step. This is part of the deliberate scope: no asset pipeline.

## Does it support Sass, PostCSS or a bundler?

No. Write plain CSS, or run your own tool and place the output in `static/`. agno copies static files verbatim.

## Can I use my existing Markdown?

Usually. Frontmatter must be TOML or YAML; Hugo and Zola frontmatter is close but not identical. Shortcodes and generator-specific syntax are not interpreted. Relative links work, and `agno check` will tell you what is broken.

## Is the build cache safe to commit?

No. `.agno-cache/` is local state keyed by templates, site context and the renderer version. Add it to `.gitignore` (the scaffold already does) and let CI run a cold build.

## Can I preview drafts?

```sh
agno dev --drafts
agno build --drafts
agno check --drafts
```

## Can the home page paginate?

No. Pagination is a section feature. The home page accepts `sort_by` and `template`, but not `paginate_by`.

## How do I update agno?

- Prebuilt binary: download the new archive and replace the old binary.
- crates.io: `cargo install agno`
- Source: `git pull && cargo install --path .`

After a version change, run `agno clean && agno build` once so the fingerprint cache is rebuilt against the new renderer.

## Does it work on Windows?

Yes. A `.zip` archive is published for `x86_64-pc-windows-msvc`. Use PowerShell or Windows Terminal; paths in `agno.toml` use forward slashes.

## Can one repository hold multiple sites?

Yes. Each site needs its own `agno.toml` and content root. Run commands with `--root`:

```sh
agno build -r sites/blog
agno build -r sites/docs
```

## Is the output SEO-friendly?

It includes canonical links, meta descriptions, `sitemap.xml`, `rss.xml` and `robots.txt`. Titles and descriptions come from frontmatter. There is no automatic Open Graph or JSON-LD; add those in `base.html`.

## Why does `agno check` fail on a link that works in the browser?

The browser may be resolving a directory without a trailing slash, or the link may point at a file that is created at deploy time. agno resolves links against the files the build will produce; make the target explicit, for example `/blog/post/` rather than `/blog/post`.

## Is there a theme marketplace?

No. The embedded theme is a starting point, and `templates/` plus `static/` are the theme system. Copy a theme by copying those two directories.

## What licence is agno under?

MIT.

## How can I contribute?

Open an issue or a pull request on [GitHub](https://github.com/agnogad/agno). Keep changes focused, add a test when behaviour changes, and run the checks in [Development](/docs/development/).
