+++
title = "Content & Markdown"
date = 2026-10-28
description = "Sections, page bundles, drafts, slug and date rules, plus every supported Markdown extension and heading-ID behaviour."
summary = "Sections, page bundles, drafts, slug/date rules and Markdown extensions."
weight = 40
extra = { chapter = "04" }
+++

agno's content model rests on one idea: **the directory structure is the URL structure**. Every Markdown file is a page; every directory that directly contains pages is a section.

## Files and extensions

- `.md` and `.markdown` are accepted case-insensitively.
- Frontmatter can be TOML (`+++`) or YAML (`---`).
- Frontmatter is entirely optional. Without it, the whole file is the body.
- Any field not recognised by agno reaches templates as `page.extra`.

```markdown
+++
title = "Hello, agno"
date = 2026-10-28
tags = ["announcement"]
+++

The body is written in **Markdown**.
```

The same page in YAML:

```markdown
---
title: Hello, agno
date: 2026-10-28
tags:
  - announcement
---

The body is written in **Markdown**.
```

## Sections

A directory that directly contains pages is a section and gets a listing at its own URL. Nested sections are supported.

```text
content/
├── _index.md
├── blog/
│   ├── _index.md        → /blog/
│   ├── first-post.md    → /blog/first-post/
│   └── second-post.md   → /blog/second-post/
└── docs/
    ├── _index.md        → /docs/
    └── guide/
        └── setup.md     → /docs/guide/setup/
```

`_index.md` is the section's landing page. Its Markdown body renders above the listing, and it accepts these extra fields:

| Field | Effect |
| --- | --- |
| `title` | Section title |
| `description` | Meta description for the listing |
| `paginate_by` | Split the listing into pages of that many cards |
| `sort_by` | `date`, `weight` or `title` |
| `template` | Render the section with a different template |

```toml
+++
title = "Blog"
paginate_by = 10
sort_by = "date"
template = "blog.html"
+++
```

A directory that only holds subdirectories is not a section by itself. Add an `_index.md` if you want a landing page there; otherwise the child pages are still published at their own URLs.

## Page bundles

A file named `index.md` turns its directory into a page bundle. Other files in the bundle are the page's assets and are copied with their URLs preserved.

```text
content/projects/agno/index.md   →  /projects/agno/
content/projects/agno/logo.png   →  /projects/agno/logo.png
```

This is the cleanest way to keep a post's images beside the post:

```markdown
![agno logo](logo.png)
```

## Dates and slugs

A filename may start with a date:

```text
2026-10-28-announcement.md  →  /announcement/   (date is 2026-10-28)
```

The date does not enter the URL; it only sets the page's `date`. A `date` in frontmatter wins.

URL segments are produced by `slugify`. Non-ASCII letters are transliterated, including Turkish characters: `ç→c`, `ğ→g`, `ı→i`, `ö→o`, `ş→s`, `ü→u`, `â→a`. Uppercase is folded to lowercase, non-alphanumeric characters become hyphens, and leading/trailing hyphens are trimmed.

| Filename | URL |
| --- | --- |
| `First Post.md` | `/first-post/` |
| `2026-10-28-announcement.md` | `/announcement/` |
| `C++ Notes.md` | `/c-notes/` |

`slug` overrides the last segment; `url` overrides the whole path:

```toml
slug = "hello-agno"       # /blog/hello-agno/
url = "/intro/"           # exact path
```

<div class="callout warn">
<p class="callout-title">URL collisions</p>
<p>If two pages resolve to the same URL, the build fails. <code>agno check</code> catches this before you deploy; agno never lets one page silently clobber another.</p>
</div>

## Drafts

Pages with `draft = true` are skipped by a normal build. To preview them:

```sh
agno build --drafts
agno dev --drafts
agno check --drafts
```

Draft pages are also excluded from RSS, the sitemap and the search index.

## Aliases

`aliases` emits lightweight HTML files that redirect to the page with a meta refresh:

```toml
aliases = ["/old-hello/", "/2019/hello/"]
```

This works on static hosts with no server-side redirect configuration. If you need a permanent 301, use the host's redirect rules instead.

## Ordering

`sort_by` has three values:

| Value | Order |
| --- | --- |
| `date` | Newest first (default) |
| `weight` | `weight` ascending, then date, then title — documentation order |
| `title` | A–Z by title |

An invalid value stops the build and names the file, so a typo cannot silently fall back to date order. Pages without a `weight` count as `0`, and pages without a date sort after dated pages of the same weight.

Neighbours inside a section are exposed as `page.prev` and `page.next`; the order follows the section's own order.

## Supported Markdown

agno renders CommonMark through `pulldown-cmark` with these GFM extensions:

- Tables
- Footnotes
- Strikethrough (`~~deleted~~`)
- Task lists (`- [x]`)
- Smart punctuation
- Heading attributes

```markdown
| Field | Value |
| --- | --- |
| Speed | 106 ms |

- [x] Install
- [ ] Deploy

A claim.[^1]

[^1]: The footnote text.
```

Raw HTML is not stripped; an HTML block in the Markdown is passed through as-is. That is useful for callouts, `<details>` or custom components — but if the content comes from untrusted sources, sanitise it yourself.

## Heading IDs and the table of contents

Every heading gets a slugified `id`:

```markdown
## Setup steps
```

```html
<h2 id="setup-steps">Setup steps</h2>
```

Duplicate headings get a numeric suffix. Links to `#setup-steps` work out of the box.

If a page has at least two headings, `page.toc` is populated; `page.toc_html` gives the same tree as nested `<ul>` elements. The default `page.html` template renders it in a "Contents" box.

## Syntax highlighting

Fenced code blocks are highlighted with `syntect`:

````markdown
```rust
fn main() {
    println!("fast");
}
```
````

Set `highlight = false` to turn highlighting off. Blocks without a language render as plain `<pre><code>`.

## Link checking

`agno check` resolves every internal Markdown link and image against the files the build will produce:

```sh
agno check
# Checked 42 pages and 318 internal links: no problems
```

- `#fragment` targets are followed to the heading IDs they name.
- `#top` always resolves, because browsers scroll to the top for it.
- A `template` that does not exist and pages without a date are reported.
- The exit code is `1` when anything is wrong.

## Next

For the full field list and how it reaches templates, continue with [Frontmatter](/docs/frontmatter/).
