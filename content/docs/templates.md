+++
title = "Templates"
date = 2026-10-28
description = "The MiniJinja template system: overriding the embedded theme, site and page context, filters, autoescaping and listing pages."
summary = "MiniJinja context, variables, filters, autoescaping and overriding the embedded theme."
weight = 60
extra = { chapter = "06" }
+++

Templates use [MiniJinja](https://docs.rs/minijinja) and live in `templates/`. A file here shadows the embedded default of the same name. When a template is missing, agno falls back to the embedded version, so a site builds without a `templates/` directory at all.

## Default templates

| Template | Used for |
| --- | --- |
| `base.html` | The shell other templates extend |
| `index.html` | Home-page listing |
| `page.html` | Regular pages |
| `section.html` | Section listings |
| `taxonomy.html` | `/tags/` and `/categories/` overviews |
| `404.html` | Error page |
| `tag.html` | Tag term pages (optional) |
| `category.html` | Category term pages (optional) |

Template selection:

- **Home:** `template` in `_index.md`, otherwise `index.html`.
- **Page:** the page's `template` field, otherwise `page.html`.
- **Section:** `template` in `_index.md`, otherwise `section.html`.
- **Tag term:** `tag.html` → `section.html`.
- **Category term:** `category.html` → `tag.html` → `section.html`.

## Base shell

```html
<!doctype html>
<html lang="{{ site.language }}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{{ page.title }} · {{ site.title }}</title>
  {% if page.description %}<meta name="description" content="{{ page.description }}">{% endif %}
  <link rel="stylesheet" href="/style.css">
</head>
<body>
  <header>
    <a href="/">{{ site.title }}</a>
    <nav>
      {% for item in site.menu %}<a href="{{ item.url }}">{{ item.title }}</a>{% endfor %}
    </nav>
  </header>
  <main>{% block content %}{% endblock %}</main>
  <footer>© {{ site.year }} {{ site.title }}</footer>
</body>
</html>
```

A page template:

```html
{% extends "base.html" %}
{% block content %}
<article>
  <h1>{{ page.title }}</h1>
  {% if page.date %}<time datetime="{{ page.datetime }}">{{ page.date_display }}</time>{% endif %}
  <div class="content">{{ page.content|safe }}</div>
</article>
{% endblock %}
```

Use `{% include "partial.html" %}` to share fragments. This documentation site uses includes such as `_sidebar.html` and `_logo.html`.

## Site context

Every template receives a `site` object:

| Variable | Contents |
| --- | --- |
| `site.title` | Title from `agno.toml` |
| `site.description` | Site description |
| `site.base_url` | Canonical base URL |
| `site.language` | Language code (`en`, `tr`, …) |
| `site.author` | Author |
| `site.menu` | `[[menu]]` items: `title`, `url` |
| `site.year` | Build year |
| `site.post_count` | Number of content pages |
| `site.tags[]` | Tags: `name`, `url`, `count`, `latest_title`, `latest_url` |
| `site.categories[]` | Categories, same shape |
| `site.sections[]` | Top-level sections: `title`, `url`, `count` |

`site.sections` lists top-level sections only; use page listings for nested sections.

## Page context

On regular pages:

| Variable | Contents |
| --- | --- |
| `page.title` | Title |
| `page.url` | URL (`/docs/installation/`) |
| `page.slug` | Slug |
| `page.date` | Raw date (`2026-10-28`) |
| `page.date_display` | Date formatted for the configured language |
| `page.datetime` | RFC 3339 timestamp |
| `page.updated`, `page.updated_display` | Update date |
| `page.reading_minutes` | Estimated reading time |
| `page.words` | Word count |
| `page.description` | Meta description |
| `page.content` | Rendered HTML |
| `page.tags`, `page.categories` | String lists |
| `page.section` | Section key the page belongs to |
| `page.extra` | Frontmatter map |
| `page.toc` | Heading tree: `level`, `id`, `title`, `children` |
| `page.toc_html` | The same tree rendered as `<ul>` |
| `page.prev`, `page.next` | Neighbours in the section, or `null` |
| `page.paginator` | Pagination state on section pages |

Section and home-page templates also get:

| Variable | Contents |
| --- | --- |
| `pages[]` | Cards: `title`, `url`, `date`, `date_display`, `datetime`, `reading_minutes`, `summary`, `tags`, `section` |
| `page.terms[]` | Taxonomy overviews only: `name`, `url`, `count` |

`page.extra` carries all frontmatter. It is the place for custom fields:

```html
{% if page.extra.difficulty %}
<span class="badge">{{ page.extra.difficulty }}</span>
{% endif %}
```

## Table of contents

`page.toc` is populated when a page has at least two headings. The tree looks like this:

```text
[
  { level: 2, id: "setup", title: "Setup", children: [
      { level: 3, id: "gnu-and-musl", title: "gnu and musl", children: [] }
  ]}
]
```

Print the ready-made HTML:

```html
{% if page.toc|length > 1 %}
<aside class="toc">
  <h2>On this page</h2>
  {{ page.toc_html|safe }}
</aside>
{% endif %}
```

To draw your own tree, use a recursive macro:

```html
{% macro toc(items) %}
<ul>
  {% for item in items %}
  <li>
    <a href="#{{ item.id }}">{{ item.title }}</a>
    {% if item.children %}{{ toc(item.children) }}{% endif %}
  </li>
  {% endfor %}
</ul>
{% endmacro %}
{{ toc(page.toc) }}
```

## Pagination

A section with `paginate_by` exposes `page.paginator`:

| Field | Contents |
| --- | --- |
| `current` | Current page number |
| `total` | Total number of pages |
| `page_size` | Cards per page |
| `item_count` | Total cards |
| `prev_url`, `next_url` | Neighbour URLs, or `null` |
| `first_url`, `last_url` | First and last page |
| `links[]` | `number`, `url`, `current` |

```html
{% if page.paginator %}
<nav class="pagination">
  {% if page.paginator.prev_url %}<a href="{{ page.paginator.prev_url }}">← Newer</a>{% endif %}
  {% for link in page.paginator.links %}
  <a href="{{ link.url }}"{% if link.current %} aria-current="page"{% endif %}>{{ link.number }}</a>
  {% endfor %}
  {% if page.paginator.next_url %}<a href="{{ page.paginator.next_url }}">Older →</a>{% endif %}
</nav>
{% endif %}
```

## Neighbours

```html
{% if page.prev %}<a rel="prev" href="{{ page.prev.url }}">← {{ page.prev.title }}</a>{% endif %}
{% if page.next %}<a rel="next" href="{{ page.next.url }}">{{ page.next.title }} →</a>{% endif %}
```

Each neighbour is `{ title, url, date_display }` and follows the section's own order. Changing the order, adding a page or renaming one re-renders the pages whose neighbours changed on the next build.

## Autoescaping

HTML autoescaping is on. It escapes only the characters that are special in text or in a quoted attribute (`&`, `<`, `>`, `"`, `'`), leaving `/` alone. Paths stay readable and JSON-LD or a canonical URL is not mangled.

```html
<a href="{{ page.url }}">{{ page.title }}</a>
```

`page.content` is already rendered HTML, so it needs `|safe`:

```html
<div class="content">{{ page.content|safe }}</div>
```

<div class="callout warn">
<p class="callout-title">Security</p>
<p>Use <code>|safe</code> only for content you produced yourself. Printing user-supplied values through <code>safe</code> leaves the door open to HTML injection.</p>
</div>

## Filters

agno adds two filters:

| Filter | Example | Result |
| --- | --- | --- |
| `slugify` | `{{ "First Post"|slugify }}` | `first-post` |
| `starts_with` | `{% if page.url|starts_with("/docs/") %}` | bool |

MiniJinja's built-in filters are also available: `length`, `default`, `join`, `upper`, `lower`, `replace`, `first`, `last`, `sort`, `reverse`, `tojson` and more.

## Theme tips

- Put only the files you want to change in `templates/`; let the rest fall back to the embedded theme.
- Prefix shared fragments with `_` (`_header.html`) so they do not look like pages.
- Define `{% block head %}` and `{% block content %}` in `base.html`; pages fill in only what they need.
- Put CSS and JS in `static/` and reference them with absolute paths such as `/style.css`.
- Leave everything escaped except `{{ page.content|safe }}`.

## Next

For site-wide settings, continue with [Configuration](/docs/configuration/).
