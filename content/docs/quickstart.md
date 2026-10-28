+++
title = "Quickstart"
date = 2026-10-28
description = "Scaffold a new agno site in two commands, edit it with live reload, and produce a production build."
summary = "Scaffold with agno new, preview with agno dev, build with agno build."
weight = 20
extra = { chapter = "02" }
+++

This chapter assumes agno is installed. Creating a site, previewing it and building it for production takes about two minutes.

## 1. Scaffold a site

```sh
agno new blog
cd blog
agno dev
```

You should see:

```text
Created blog

  cd blog
  agno dev

agno dev → http://localhost:1111  (2 pages, 12 ms)
```

Open <http://localhost:1111> in a browser. `agno new` writes a working starter site: a home page, an about page, a blog post, the default templates, a stylesheet and `agno.toml`.

<div class="callout note">
<p class="callout-title">Non-empty directory</p>
<p><code>agno new</code> refuses to write into a directory that already contains files and leaves it untouched. To overwrite what is there, pass <code>--force</code>: <code>agno new blog --force</code>.</p>
</div>

## 2. Edit with live reload

While the dev server runs, edit anything under `content/`, `templates/` or `static/`. agno notices the change, rebuilds only the affected pages and reloads the browser.

```sh
agno dev --port 3000
```

The default port is `1111`. If it is taken, change it with `--port`.

<div class="callout tip">
<p class="callout-title">First edit</p>
<p>Open <code>content/blog/hello-world.md</code>, change the title and save. The heading updates after a reload. Incremental builds mean only that page is rendered again.</p>
</div>

## 3. Build for production

```sh
agno build
# Built 2 pages in 9 ms → ./dist
```

The output is in `dist/` and is self-contained: HTML, CSS, JavaScript, RSS, sitemap, `robots.txt` and, if enabled, the search index. Upload it to any static host.

```sh
agno build --clean      # ignore dist/ and the cache, rebuild everything
agno build --minify     # collapse HTML whitespace and strip comments
agno build --drafts     # include pages with draft = true
agno build --stats      # print per-phase timings
```

## 4. Check the result

```sh
agno check
# Checked 2 pages and 2 internal links: no problems
```

`agno check` resolves every internal link and image against the files the build will produce. A broken link, a missing template or a page without a date exits with code `1`, so it works as a CI gate.

## What the starter contains

`agno new` writes:

```text
blog/
├── agno.toml
├── .gitignore
├── content/
│   ├── _index.md
│   ├── about.md
│   └── blog/
│       └── hello-world.md
├── templates/
│   ├── 404.html
│   ├── base.html
│   ├── index.html
│   ├── page.html
│   ├── section.html
│   └── taxonomy.html
└── static/
    └── style.css
```

Every one of those files is yours to change or delete. `templates/` and `static/` are optional; agno falls back to the embedded defaults.

## Command cheat sheet

| Goal | Command |
| --- | --- |
| Dev server | `agno dev` |
| Different port | `agno dev --port 3000` |
| Production build | `agno build` |
| Clean full build | `agno build --clean` |
| Minified HTML | `agno build --minify` |
| Preview drafts | `agno dev --drafts` |
| Check links | `agno check` |
| Remove output and cache | `agno clean` |

## Ship it

Upload `dist/` as-is. Netlify, Vercel, Cloudflare Pages, GitHub Pages or any web server will do. See [Deployment](/docs/deployment/) for caching, CI and host-specific notes.

<div class="callout warn">
<p class="callout-title">base_url</p>
<p>Before deploying, change <code>base_url</code> in <code>agno.toml</code> to your real address. Canonical links, the sitemap and RSS are built from it, and a value that does not start with <code>http(s)://</code> stops the build.</p>
</div>

## Next

- [Project structure](/docs/project-structure/) — what each directory does
- [Content & Markdown](/docs/content/) — sections, bundles, drafts
- [Templates](/docs/templates/) — build your own design
