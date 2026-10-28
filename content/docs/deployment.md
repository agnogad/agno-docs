+++
title = "Deployment"
date = 2026-10-28
description = "Build flags, base_url, output contents, static hosts, GitHub Actions, cache headers and a pre-deploy checklist."
summary = "Production builds, static hosts, CI, caching and a deployment checklist."
weight = 110
extra = { chapter = "11" }
+++

A production build is a directory of static files. There is no server process, no database and no runtime to keep alive.

## Build

```sh
agno check
agno build --clean --minify
```

| Flag | Effect |
| --- | --- |
| `--clean` | Ignore `dist/` and the cache, rebuild everything |
| `--minify` | Collapse HTML whitespace and strip comments |
| `--stats` | Print content, page and list/feed timings |
| `--drafts` | Include draft pages (usually not for production) |

`--clean` is the right default in CI: a fresh checkout has no cache anyway, and it removes any doubt about stale output.

<div class="callout warn">
<p class="callout-title">Set base_url first</p>
<p>Canonical links, the sitemap and RSS all use <code>base_url</code>. If it still points at <code>http://localhost:1111</code>, every canonical URL in production will be wrong.</p>
</div>

## What gets uploaded

Upload the contents of `dist/`, not the `dist/` directory itself:

```text
dist/
├── index.html
├── 404.html
├── rss.xml
├── sitemap.xml
├── robots.txt
├── search-index.json
├── style.css
├── favicon.svg
├── docs/
│   └── installation/index.html
├── tags/
└── categories/
```

Never upload `.agno-cache/` or `content/`. They are build inputs, not site output.

## Hosts

| Host | What to configure |
| --- | --- |
| Netlify | Build command `agno build --clean --minify`, publish directory `dist` |
| Vercel | Build command `agno build`, output directory `dist` |
| Cloudflare Pages | Build command `agno build`, output directory `dist` |
| GitHub Pages | A workflow that builds and uploads `dist/` (below) |
| S3 / R2 / GCS | Sync `dist/` to the bucket, enable static website hosting |
| Nginx / Caddy | Point the document root at `dist/`, add a 404 rule |

Hosted build images do not all ship Rust. If `agno` is not available in the build image, build in CI and upload the artifact, or install a prebuilt binary in the build step.

### GitHub Pages

```yaml
name: Deploy

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
      - uses: Swatinem/rust-cache@v2
      - run: cargo install agno
      - run: agno check
      - run: agno build --clean --minify
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

If you prefer a prebuilt binary over `cargo install`, download the release archive in a step and put `agno` on `PATH`; the build itself is identical.

<div class="callout note">
<p class="callout-title">Do not cache .agno-cache in CI</p>
<p>The fingerprints depend on templates, site context and the renderer version. A cold build is fast enough; carrying the cache between jobs adds risk for little gain.</p>
</div>

## Nginx

Because pages are written as `path/index.html`, a directory index and a 404 rule are all you need:

```nginx
server {
    listen 80;
    server_name example.com;
    root /var/www/example/dist;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }

    error_page 404 /404.html;
    location = /404.html {
        internal;
    }
}
```

## Cache headers

agno does not hash asset filenames, so do not mark CSS or JS as `immutable` for a year. A new deploy would keep serving the old file.

| Path | Suggested header |
| --- | --- |
| `*.html`, `rss.xml`, `sitemap.xml`, `search-index.json` | `Cache-Control: no-cache` |
| `*.css`, `*.js`, images | `Cache-Control: public, max-age=86400` |
| 404 | `Cache-Control: no-cache` |

When you need aggressive caching, add a content hash to asset filenames in your own build step and reference the hashed name from templates. agno leaves that decision to you.

## Preview the production build locally

```sh
agno build --clean
python3 -m http.server 8000 --directory dist
```

Open <http://localhost:8000>. This catches path issues that the dev server hides, especially absolute links and 404 handling.

## Checklist

- [ ] `base_url` is the production domain.
- [ ] `agno check` passes with no broken links.
- [ ] `agno build --clean` succeeds.
- [ ] 404 page is served for unknown paths.
- [ ] RSS and sitemap open with absolute URLs.
- [ ] Search index is present if search is enabled.
- [ ] `robots.txt` points at the correct sitemap.
- [ ] Draft pages are excluded.
- [ ] `.agno-cache/` and `content/` are not uploaded.

## Next

For every command and flag, see the [CLI reference](/docs/cli/).
