+++
title = "Project structure"
date = 2026-10-28
description = "What content/, templates/, static/, dist/ and .agno-cache/ do, which files a build produces, and how source paths map to URLs."
summary = "Every directory, the generated outputs, and how content files map to URLs."
weight = 30
extra = { chapter = "03" }
+++

A site is five directories. Only `content/` is required; the rest have defaults.

```text
site/
├── agno.toml              # site configuration (optional)
├── content/               # Markdown sources (required)
│   ├── _index.md          # home page
│   ├── about.md
│   └── blog/
│       ├── _index.md      # blog section landing page
│       └── first-post.md
├── templates/             # MiniJinja templates (optional)
├── static/                # copied verbatim (optional)
├── dist/                  # build output (generated)
└── .agno-cache/           # incremental build state (generated)
```

## `content/`

Markdown sources live here. Extensions are `.md` or `.markdown`, case-insensitive: `POST.MD` and `Index.md` are both discovered.

A directory that directly contains pages becomes a **section** and gets a listing at its own URL. A directory that only holds subdirectories is not a section by itself; add an `_index.md` if you want a landing page there.

A file named `index.md` turns its directory into a **page bundle**:

```text
content/blog/hello/index.md  →  /blog/hello/
content/blog/hello/cover.png →  /blog/hello/cover.png
```

## `templates/`

MiniJinja templates. A file here shadows the embedded default of the same name. If the directory is missing, or a template is absent, agno continues with the embedded version and the site still builds.

## `static/`

Copied verbatim into the root of `dist/`. `static/style.css` → `/style.css`, `static/robots.txt` → `/robots.txt`. Subdirectories are preserved.

If a static file lands on the same output path as a generated page, the build fails with a collision error instead of silently overwriting one with the other.

## `dist/`

The build output. It is entirely generated; do not edit it by hand. `output_dir` can change it, but the path must stay inside the site root and must not overlap `content/`, `templates/` or `static/`.

A typical tree:

```text
dist/
├── index.html
├── 404.html
├── rss.xml
├── sitemap.xml
├── robots.txt
├── search-index.json     # when search_index = true
├── style.css
├── about/index.html
├── blog/
│   ├── index.html
│   ├── first-post/index.html
│   ├── page/2/index.html  # when paginate_by is set
│   └── ...
├── tags/
│   ├── index.html
│   └── agno/index.html
└── categories/
    └── ...
```

## `.agno-cache/`

Incremental build state. Two kinds of file:

| File | Contents |
| --- | --- |
| `fingerprints.bin` | Per-page and per-list fingerprints; decides what must be rendered again |
| `outputs-<hash>.json` | Manifest for one output directory: which files were written, so stale outputs can be removed |

The directory can be deleted safely; the next build is simply a cold build. Do not commit it. `agno clean` removes both `dist/` and `.agno-cache/`.

<div class="callout tip">
<p class="callout-title">Is the cache portable?</p>
<p>No. Fingerprints depend on templates, site context and the renderer version. Do not try to carry the cache into CI; run a cold build on every job. Cold builds are already fast.</p>
</div>

## URL mapping

| Source | URL |
| --- | --- |
| `content/_index.md` | `/` |
| `content/about.md` | `/about/` |
| `content/blog/_index.md` | `/blog/` |
| `content/blog/first-post.md` | `/blog/first-post/` |
| `content/blog/hello/index.md` | `/blog/hello/` |
| `content/2026-10-28-announcement.md` | `/announcement/` (date is not part of the URL) |
| `content/docs/01-installation.md` | `/docs/01-installation/` |

URL segments are slugified. `slug` overrides the last segment; `url` overrides the whole path.

## Generated pages

A build does more than render content pages. It also produces:

- Section listings, including pagination (`/blog/page/2/`)
- Tag and category term pages plus taxonomy overviews
- `rss.xml`, `sitemap.xml` and `robots.txt`
- `404.html`
- `search-index.json` when `search_index = true`
- Meta-refresh redirects for every `aliases` entry

## Next

With the layout understood, [Content & Markdown](/docs/content/) covers the content model itself.
