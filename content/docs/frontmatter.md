+++
title = "Frontmatter"
date = 2026-10-28
description = "The complete reference for page, section and home-page frontmatter: title, date, tags, weight, slug, aliases, template and extras."
summary = "Every page, section and home-page frontmatter field, with types and examples."
weight = 50
extra = { chapter = "05" }
+++

Frontmatter is the metadata block at the top of a Markdown file. agno accepts TOML (`+++`) and YAML (`---`). Without a block, the entire file is treated as the body.

## Page fields

| Field | Type | Purpose |
| --- | --- | --- |
| `title` | string | Page title. Defaults to a humanised filename. |
| `date` | date | Publication date; used for sorting, RSS and the sitemap. |
| `updated` | date | Modification date; feeds sitemap `<lastmod>` and `page.updated_display`. |
| `description` | string | Meta description; used in listings and feeds. |
| `summary` | string | Explicit summary. Defaults to text extracted from the first paragraph. |
| `draft` | bool | When `true`, skipped unless `--drafts` is passed. |
| `weight` | integer | Order inside a section with `sort_by = "weight"`; lower comes first. |
| `tags` | string list | Tags; each value gets a term page. |
| `categories` | string list | Categories; same treatment. |
| `template` | string | Template name for this page (for example `post.html`). |
| `slug` | string | Overrides the last URL segment. |
| `url` | string | Overrides the whole URL path. |
| `aliases` | string list | Extra URLs that redirect here with a meta refresh. |
| *anything else* | any | Available to templates as `page.extra`. |

## Full example

```toml
+++
title = "How incremental builds work"
date = 2026-10-28
updated = 2026-10-29
description = "A short explanation of which pages the fingerprint cache re-renders."
summary = "When templates and site context are unchanged, the page is not redrawn."
tags = ["performance", "cache"]
categories = ["architecture"]
draft = false
weight = 20
template = "post.html"
slug = "incremental-builds"
url = "/notes/incremental-builds/"
aliases = ["/old/incremental-builds/"]
author = "team"
+++

The body starts here.
```

The same file in YAML:

```yaml
---
title: How incremental builds work
date: 2026-10-28
updated: 2026-10-29
description: A short explanation of the fingerprint cache.
tags:
  - performance
  - cache
weight: 20
draft: false
---
```

## Dates

`date` and `updated` accept any of these forms:

```text
2026-10-28
2026-10-28 14:30:00
2026-10-28T14:30:00
2026-10-28T14:30:00.123
2026-10-28T14:30:00+03:00
```

Without a timezone the value is treated as UTC. An invalid date stops the build and names the file; it is never silently ignored.

`date_display` is formatted according to `language` in `agno.toml`. `tr` produces Turkish month names, `en` produces English ones.

<div class="callout warn">
<p class="callout-title">Dates and search</p>
<p><code>search-index.json</code> only contains regular pages that have a <code>date</code>; section landing pages are not included. A documentation page without a date is still published but will not appear in search. Give every docs page a date as a habit.</p>
</div>

## Summary and description

The two fields complement each other:

- `description` goes into the meta tag, the RSS description and cards.
- `summary` is the text used on listing cards; when empty, agno extracts plain text from the rendered first paragraph.

Most sites only need `description`. If your opening paragraph is long, use `summary` to shorten the card text.

## `page.extra`

Every field beyond the recognised ones is available as `page.extra.<name>`. With the example above, `author = "team"` becomes:

```html
<p class="byline">{{ page.extra.author }}</p>
```

This is how you carry page-specific data without changing a schema: cover images, difficulty, version labels, authors, publication state.

<div class="callout note">
<p class="callout-title">Note</p>
<p><code>page.extra</code> contains the entire frontmatter map, including recognised fields. For readability, use the direct fields (<code>page.title</code>) for known values and <code>page.extra</code> for custom ones.</p>
</div>

## Section fields

`_index.md` files accept the page fields plus:

| Field | Type | Purpose |
| --- | --- | --- |
| `paginate_by` | integer | Splits the listing into pages of that many cards. `0` or absent disables pagination. |
| `sort_by` | string | `date`, `weight` or `title`. |
| `template` | string | Template for the section (default `section.html`). |

`paginate_by` only applies to sections; the home page does not paginate. Page 1 stays at the section URL, later pages live at `/section/page/2/`, `/section/page/3/` and so on.

## Home-page fields

`content/_index.md` accepts:

| Field | Purpose |
| --- | --- |
| `title` | Home-page title instead of the site title |
| `description` | Home-page meta description |
| `sort_by` | Order of pages listed on the home page |
| `template` | Home template (for example `home.html`) |
| `date`, `updated` | Sitemap `<lastmod>` values |

## Template overrides

`template = "post.html"` affects only that page. If the template is absent from `templates/`, the build stops with an error naming the source file. `agno check` reports it earlier.

```sh
agno check
# error: ./content/blog/post.md: template "post.html" not found
```

## Validation rules

The build stops when:

- `date` or `updated` cannot be parsed.
- `sort_by` is not one of the three known values.
- `url` is empty, absolute (`https://…`), contains `?`, `#` or `\`, or has `.`/`..` segments.
- Two pages resolve to the same output path.
- `output_dir` escapes the site root or overlaps an input directory.

These failures are intentional. A bad value never falls back to a default silently.
