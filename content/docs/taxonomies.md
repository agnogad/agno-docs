+++
title = "Taxonomies"
date = 2026-10-28
description = "How tags and categories become term pages, overview pages and template variables."
summary = "tags and categories: term pages, overviews, slug rules and the template context."
weight = 80
extra = { chapter = "08" }
+++

`tags` and `categories` are the two built-in taxonomies. Every distinct value gets a **term page** listing the pages that carry it, and each taxonomy also gets an **overview page** listing its terms.

```text
/tags/                     all tags, with counts
/tags/rust/                pages tagged "Rust"
/categories/               all categories
/categories/architecture/  pages in "Architecture"
```

These behave like Hugo's and Zola's taxonomy pages and need no extra configuration.

## Usage

```toml
+++
title = "Incremental builds"
date = 2026-10-28
tags = ["performance", "cache", "rust"]
categories = ["architecture", "builds"]
+++
```

The same values in YAML:

```yaml
---
tags:
  - performance
  - cache
categories: [architecture, builds]
---
```

## Slugs and case

Terms are slugified and lowercased. `Rust`, `rust` and `RUST` share the same `/tags/rust/` page.

Turkish characters are transliterated:

| Tag | URL |
| --- | --- |
| `Cache` | `/tags/cache/` |
| `Security` | `/tags/security/` |
| `İçerik` | `/tags/icerik/` |
| `Çoklu Ortam` | `/tags/coklu-ortam/` |

A term that slugifies to nothing, such as a value made only of punctuation, gets no page and is skipped.

## Templates

| Page | Candidate templates |
| --- | --- |
| `/tags/` overview | `taxonomy.html` |
| `/categories/` overview | `taxonomy.html` |
| Tag term | `tag.html` → `section.html` |
| Category term | `category.html` → `tag.html` → `section.html` |

On an overview, `page.terms` has this shape:

```html
<ul>
  {% for term in page.terms %}
  <li>
    <a href="{{ term.url }}">{{ term.name }}</a>
    <span>{{ term.count }}</span>
  </li>
  {% endfor %}
</ul>
```

A term page has the normal listing context: `pages[]`, `page.title` (the term name) and `page.url`. `page.content` is empty, because term pages have no Markdown body.

```html
{% extends "base.html" %}
{% block content %}
<h1>{{ page.title }}</h1>
<p>{{ pages|length }} pages</p>
<ul>
  {% for item in pages %}
  <li><a href="{{ item.url }}">{{ item.title }}</a></li>
  {% endfor %}
</ul>
{% endblock %}
```

## Taxonomies in the site context

`site.tags` and `site.categories` are available in every template:

| Field | Contents |
| --- | --- |
| `name` | Display name (the first spelling encountered) |
| `url` | Term page |
| `count` | Number of pages |
| `latest_title` | Title of the newest page |
| `latest_url` | URL of the newest page |

That is enough for a "popular tags" sidebar or a "latest" block:

```html
<aside>
  <h2>Tags</h2>
  {% for tag in site.tags %}
  <a href="{{ tag.url }}">{{ tag.name }} <span>{{ tag.count }}</span></a>
  {% endfor %}
</aside>
```

The order of the terms is based on where they were first seen. Sort explicitly in the template if you need predictable ordering.

## Term listings

On a term page, `pages[]` contains the pages carrying that term. The cards have the usual fields: `title`, `url`, `date`, `date_display`, `datetime`, `reading_minutes`, `summary`, `tags`, `section`.

## What is not supported

- **Custom taxonomies.** Only `tags` and `categories` are recognised. For a third classification, add a custom frontmatter field and filter it in templates; no term pages are generated automatically.
- **Hierarchical taxonomies.** Tags are a flat list; values such as `rust/async` do not produce nested term pages.
- **Markdown bodies for term pages.** Term pages are shaped only by templates.
- **Pagination.** Term listings are a single page. For very large tag sets, build your own paging in the template.

## Practical advice

- Keep tags narrow: 5–15 tags is plenty for a documentation site.
- Use categories broadly and tags specifically.
- Do not mix languages in the same tag; the slug will match but `name` keeps the first spelling seen.
- You usually do not need term pages in the menu; the `/tags/` overview is enough.

## Next

For menus, neighbours and pagination, continue with [Navigation](/docs/navigation/).
