+++
title = "Troubleshooting"
date = 2026-10-28
description = "Fixes for the most common agno errors: glibc, configuration validation, broken links, missing templates, dates and search."
summary = "Common build, install, link, template and search failures with concrete fixes."
weight = 150
extra = { chapter = "15" }
+++

Every build error names the file and the reason. Start from the message, then find it below.

<div class="callout tip">
<p class="callout-title">First move</p>
<p>When a build behaves strangely after a template or configuration change, run <code>agno clean &amp;&amp; agno build</code>. If the problem disappears, it was stale incremental state; if it persists, it is real.</p>
</div>

## Installation and startup

### `agno: command not found`

The binary is not on `PATH`.

```sh
which agno
echo "$PATH"
```

For `cargo install`, add `~/.cargo/bin` to your shell profile. For a manual binary, move it to `/usr/local/bin` or add its directory.

### `GLIBC_2.34 not found`

The gnu build requires glibc 2.34 or newer (Ubuntu 22.04, Debian 12, RHEL 9). On older systems, Alpine or a `scratch` container, use the musl archive.

```sh
# check the installed glibc
ldd --version | head -1

# then download the musl archive instead
# agno-<version>-x86_64-unknown-linux-musl.tar.gz
```

### The binary is slower or uses more memory than expected

You are probably on musl. musl uses mimalloc and a pure-Rust regex engine; the gnu build is faster and uses roughly a quarter to a half of the memory. Switch to gnu unless you need a fully static binary.

### `error: linker 'cc' not found` when building from source

The syntax highlighter compiles C code. Install a toolchain:

```sh
# Debian / Ubuntu
sudo apt install build-essential

# Fedora
sudo dnf install gcc gcc-c++ make

# macOS
xcode-select --install
```

### `package agno requires rustc 1.88` or newer

Update Rust:

```sh
rustup update stable
```

## Configuration

### `base_url must be an absolute http(s) URL`

Include the scheme:

```toml
base_url = "https://example.com"   # correct
base_url = "example.com"           # rejected
```

### `output_dir must stay inside the site root`

The output directory cannot escape the site:

```toml
output_dir = "dist"        # correct
output_dir = "../public"   # rejected
```

### `output_dir must not be the site root`

Do not set `output_dir = "."`; a clean build would remove the site.

### Output overlaps an input directory

`output_dir` cannot equal or contain `content_dir`, `templates_dir` or `static_dir`. Pick a dedicated directory such as `dist`.

### `site root ... does not exist`

`--root` must point at an existing directory. agno refuses to create a misspelled path and build an empty site there.

### A configuration value has no effect

Check the spelling. Unknown keys are ignored silently:

```toml
search_index = true    # correct
searchIndex = true     # ignored
```

## Content

### `invalid sort_by "..." ... expected "date", "weight" or "title"`

Only those three values are accepted. Fix the section's `_index.md`:

```toml
sort_by = "weight"
```

### `invalid date "..." ... expected YYYY-MM-DD or an RFC 3339 timestamp`

Use an accepted form:

```toml
date = 2026-10-28
date = 2026-10-28T14:30:00+03:00
```

### `template "post.html" not found for page ...`

The page asks for a template that does not exist in `templates/`. Either add it or remove the `template` field to fall back to `page.html`.

```sh
agno check
```

reports this before a full build.

### Two pages produce the same URL

Two files resolve to one output path, usually through `slug`, `url` or a filename collision. The error names both sources. Rename one, or add an explicit `slug`.

### A page is missing from the build

Common causes:

- `draft = true` and `--drafts` was not passed.
- The file does not end in `.md` or `.markdown`.
- The directory or file starts with `.`; hidden entries are skipped.
- The file is inside `templates/` or `static/`, not `content/`.

### A page is missing from a listing

Sections list pages that belong to them. A page nested deeper lives in a child section. Check where the file sits and whether the child section has its own `_index.md`.

### A static file overwrites a page, or the build reports a collision

`static/` and generated pages share the output namespace. Rename the static file or move it under a subdirectory.

## Links and check

### `broken link /blog/nope/ (resolves to /blog/nope/index.html)`

The target does not exist at build time. Fix the path, add the page, or add an `aliases` entry on the real page. Remember that agno URLs end with a slash.

### A `#fragment` link fails

The fragment must match the heading's slugified ID. For `## Setup steps`, the ID is `setup-steps`, not `Setup steps`. `#top` is always valid.

### `agno check` reports a page without a date

Add `date` to the frontmatter. It is required for sorting, feeds and the search index, and `check` treats its absence as a problem.

## Development server

### `Address already in use`

Another process owns port `1111`:

```sh
agno dev --port 3000
```

### Changes do not appear

- Confirm the dev server is running in the site root (or pass `-r`).
- Confirm you edited `content/`, `templates/` or `static/`, not `dist/`.
- Hard-reload the browser once; the live-reload script may have been interrupted.
- On very large trees, the OS may run out of inotify watches:

```sh
cat /proc/sys/fs/inotify/max_user_watches
sudo sysctl fs.inotify.max_user_watches=524288
```

### A page keeps rendering old content

Run `agno clean && agno dev`. If it still happens, the page is being served from a proxy or browser cache.

## Search

### The index exists but results are empty

The most common cause is a missing `date`. Only dated pages enter `search-index.json`. Add a date and rebuild.

### `search-index.json` returns 404

Set `search_index = true` in `agno.toml` and rebuild. The file is written to the output root.

### Search results are stale after a deploy

The index is cached like any other file. Send `Cache-Control: no-cache` for `search-index.json`, or version the filename.

## Output and deployment

### `404.html` is not used by the host

The file exists at the output root, but the host must be told to serve it. For Nginx:

```nginx
error_page 404 /404.html;
```

For Netlify, add a `_redirects` rule:

```text
/* /404.html 404
```

### Canonical URLs point at localhost

`base_url` is still the default. Set it to the production domain and rebuild.

### RSS or sitemap contains relative URLs

Same cause: `base_url` is empty or invalid. It must be absolute.

### Styles are missing after deploy

Check that `static/style.css` exists and that templates reference `/style.css` with a leading slash. A relative `style.css` breaks on nested URLs such as `/docs/installation/`.

## Getting more detail

- Run `agno build --stats` to see which phase is slow.
- Run `agno check` for content problems before a full build.
- Set `RUST_BACKTRACE=1` for a backtrace on unexpected failures.
- When reporting a bug, include the agno version, OS, the failing command and the full error.

## Next

For conceptual questions, see the [FAQ](/docs/faq/).
