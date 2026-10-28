+++
title = "Architecture"
date = 2026-10-28
description = "The build pipeline, source modules, parallel execution, fingerprints, the manifest and the safety rules behind incremental builds."
summary = "Pipeline stages, source modules, Rayon parallelism, caching and output safety."
weight = 130
extra = { chapter = "13" }
+++

agno keeps the pipeline small on purpose. There is no plugin stage, no asset graph and no persistent process.

```text
content/ Markdown
      │
      ▼
parse frontmatter ──► discover pages, sections, bundles, taxonomies
      │
      ▼
Markdown + syntax highlighting ──► HTML, summary, TOC, word count
      │
      ▼
MiniJinja templates ──► pages, listings, term pages, 404
      │
      ▼
write ──► dist/: HTML, RSS, sitemap, robots.txt, search index
      │
      ▼
dev server (tiny_http) + live reload
```

## Source modules

| File | Responsibility |
| --- | --- |
| `src/content.rs` | Discovers Markdown files, parses frontmatter, derives URLs, dates and sections |
| `src/markdown.rs` | Renders CommonMark/GFM with `pulldown-cmark`, builds the TOC, highlights with `syntect` |
| `src/render.rs` | Renders MiniJinja templates with the embedded theme as fallback |
| `src/site.rs` | Runs the parallel build, writes pages and feeds, cleans stale output |
| `src/cache.rs` | Stores per-page fingerprints so unchanged pages can be skipped |
| `src/minify.rs` | The conservative HTML minifier behind `--minify` |
| `src/check.rs` | Resolves internal links for `agno check` |
| `src/serve.rs` | Serves `dist/` with `tiny_http` and rebuilds on filesystem changes |
| `src/scaffold.rs` | Creates the starter site |
| `src/config.rs` | Loads and validates `agno.toml` |
| `src/theme.rs` | Embeds the default templates and stylesheet |

## Build phases

A build reports three phases under `--stats`:

```text
content 8 ms · pages 14 ms · lists+feeds 3 ms
```

1. **Content.** Walk `content/`, parse frontmatter, derive URLs and dates, count words, discover assets and taxonomies.
2. **Pages.** Render each page that is not up to date: Markdown, highlighting, TOC, template, write.
3. **Lists and feeds.** Section listings, term pages, pagination, RSS, sitemap, `robots.txt`, search index, static copies, manifest.

Every stage that can run per item does so with [Rayon](https://docs.rs/rayon): parsing, rendering, output writing and cleanup are parallel.

## Incremental builds

Incremental builds are the default. `agno build` keeps `dist/` and only re-renders what changed.

Two hashes make the decision:

- **Header hash** — the renderer version, an internal render revision, `highlight`, `minify`, `language`, the serialised site context, and every template file (embedded and local) with its contents. If any of these change, all pages are re-rendered.
- **Page key** — the page source plus the inputs unique to that page, including its section neighbours. A title change here re-renders only this page and the pages whose previous/next labels changed.

A page is skipped when its key matches the stored fingerprint **and** the output file still exists. Otherwise Markdown, highlighting, templating and the write all run.

<div class="callout note">
<p class="callout-title">The output file is the cache</p>
<p>The rendered file in <code>dist/</code> doubles as the cache. If someone deletes a page from <code>dist/</code> by hand, the next build notices the missing file and renders it again even though the fingerprint matches.</p>
</div>

### Manifest and stale output

Each output directory gets a manifest in `.agno-cache/outputs-<hash>.json`. It records what the build wrote. On the next run, files that no longer belong to any page are removed, so a deleted Markdown file does not leave a stale HTML file behind.

The manifest is keyed by output path, which means switching `output_dir` and switching back does not lose the record of what the earlier build wrote.

<div class="callout warn">
<p class="callout-title">Cache invalidation</p>
<p>The header hash is intentionally broad. Editing any template re-renders every page, even if only one template is used by a subset. That is conservative and correct; a narrower dependency graph would be faster on huge sites but easier to get wrong.</p>
</div>

## Output safety

Before anything is deleted or written, agno validates the configuration:

- `base_url` must be an absolute `http(s)` URL (or empty).
- `output_dir` cannot be the site root, escape it, be a symlink, or overlap `content_dir`, `templates_dir` or `static_dir`.
- Two outputs cannot claim the same URL; the build fails with both sources named.
- A static file cannot collide with a generated page.

`agno build --clean` removes the output directory. These checks are what make that safe to expose as a flag.

## Rendering and escaping

Templates are MiniJinja with autoescaping on. agno customises the HTML escaper so `/` is not escaped; browsers decode it either way, but escaping slashes triples the size of every printed path and mangles canonical URLs and JSON-LD. Only `&`, `<`, `>`, `"` and `'` are escaped.

If a local template exists, it shadows the embedded one. If a template is missing entirely, the embedded theme fills the gap; a site without `templates/` still builds.

## Dev server

The dev server is deliberately simple:

- Builds into `dist/` like a production build.
- Serves `dist/` with `tiny_http`.
- Watches the filesystem with `notify`.
- Rebuilds incrementally and reloads the browser.

Because it serves the real output, a broken link behaves the same way it will in production. There is no virtual filesystem that can hide path mistakes.

## Design scope

agno is deliberately a **content-first** static site generator. It does not aim to replace application frameworks:

- No JavaScript islands or component framework
- No bundler or asset pipeline
- No plugin system
- No image optimisation pipeline
- No i18n framework or theme marketplace

Static `<script>` tags, plain CSS and the `static/` directory are the extension points. Keeping that surface small is what keeps the binary portable and the build fast.

## Next

For the numbers behind the design, see [Benchmarks](/docs/benchmark/).
