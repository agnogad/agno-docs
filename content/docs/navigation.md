+++
title = "Navigation"
date = 2026-10-28
description = "Menus, section ordering, previous/next links, pagination, tables of contents and active states."
summary = "Menus, ordering, prev/next, pagination, TOCs and active navigation states."
weight = 90
extra = { chapter = "09" }
+++

agno gives you the raw navigation data; the markup is yours. This chapter covers every piece the templates receive and the patterns this site uses.

## Menus

Menu items come from `agno.toml` and arrive as `site.menu`:

```toml
[[menu]]
title = "Docs"
url = "/docs/"

[[menu]]
title = "CLI"
url = "/docs/cli/"
```

```html
<nav>
  {% for item in site.menu %}
  <a href="{{ item.url }}"
     {% if item.url|starts_with("/") and page.url|starts_with(item.url) %}class="active"{% endif %}>
    {{ item.title }}
  </a>
  {% endfor %}
</nav>
```

`starts_with` keeps external links from ever matching. For the docs entry, `/docs/` matches `/docs/cli/` too, which is usually the behaviour you want for a top-level section.

## Sections

`site.sections` lists top-level sections with a title, URL and page count:

```html
<ul>
  {% for section in site.sections %}
  <li><a href="{{ section.url }}">{{ section.title }}</a> <span>{{ section.count }}</span></li>
  {% endfor %}
</ul>
```

Nested sections are not included. For a full sidebar you either hardcode the chapter list, as this site does in `_sidebar.html`, or generate it from a section listing page.

## Ordering with weight

Documentation reads best in a deliberate order. Put `sort_by = "weight"` in the section's `_index.md` and give each page a `weight`:

```toml
+++
title = "Installation"
weight = 10
+++
```

```toml
+++
title = "Quickstart"
weight = 20
+++
```

Lower weights come first. Equal weights fall back to date, then title. Pages without a weight count as `0`. The same weights drive `page.prev` and `page.next`.

<div class="callout tip">
<p class="callout-title">Numbering</p>
<p>Leaving gaps (10, 20, 30) makes it easy to insert a chapter later without renumbering everything.</p>
</div>

## Previous and next

Inside a section, each page receives its neighbours in that section's order:

```html
<nav class="pager">
  {% if page.prev %}
  <a rel="prev" href="{{ page.prev.url }}">
    <span>← Previous</span>
    <strong>{{ page.prev.title }}</strong>
  </a>
  {% endif %}
  {% if page.next %}
  <a rel="next" href="{{ page.next.url }}">
    <span>Next →</span>
    <strong>{{ page.next.title }}</strong>
  </a>
  {% endif %}
</nav>
```

Each neighbour is `{ title, url, date_display }`. Both are `null` at the ends of the section. Changing the order re-renders the affected neighbours on the next build.

## Pagination

Sections can split their listing:

```toml
+++
title = "Blog"
paginate_by = 10
+++
```

- Page 1 stays at `/blog/`.
- Later pages live at `/blog/page/2/`, `/blog/page/3/`.
- `page.paginator` provides `current`, `total`, `page_size`, `item_count`, `prev_url`, `next_url`, `first_url`, `last_url` and `links[]`.

```html
{% if page.paginator %}
<nav class="pagination">
  {% if page.paginator.prev_url %}
  <a rel="prev" href="{{ page.paginator.prev_url }}">← Newer</a>
  {% endif %}

  {% for link in page.paginator.links %}
  <a href="{{ link.url }}"{% if link.current %} aria-current="page"{% endif %}>{{ link.number }}</a>
  {% endfor %}

  {% if page.paginator.next_url %}
  <a rel="next" href="{{ page.paginator.next_url }}">Older →</a>
  {% endif %}
</nav>
{% endif %}
```

Pagination is a section feature. The home page accepts `sort_by` but does not paginate.

## Tables of contents

`page.toc` is empty when a page has fewer than two headings. When it is populated, `page.toc_html` is ready to print:

```html
{% if page.toc|length > 1 %}
<aside class="toc">
  <h2>On this page</h2>
  {{ page.toc_html|safe }}
</aside>
{% endif %}
```

For a sticky sidebar TOC, wrap it in a positioned element. To highlight the section currently in view, attach a scroll listener or `IntersectionObserver` to the heading IDs; the headings already have slugified `id` attributes.

## Breadcrumbs

There is no built-in breadcrumb object, but `page.section` and `page.url` are enough:

```html
<nav aria-label="Breadcrumb">
  <a href="/docs/">Documentation</a>
  <span>/</span>
  <span>{{ page.title }}</span>
</nav>
```

For multi-level paths, split `page.section` on `/` in the template or keep a lookup of labels.

## Active sidebar links

Exact matching is the simplest reliable approach:

```html
<a href="/docs/installation/"
   {% if page.url == "/docs/installation/" %}class="active" aria-current="page"{% endif %}>
  Installation
</a>
```

For a generated sidebar, compare `page.url` with `item.url`, or use `starts_with` when a parent entry should stay active for child pages.

## RSS, sitemap and 404

These are not navigation data but they belong in the shell:

```html
<link rel="alternate" type="application/rss+xml" href="/rss.xml">
<link rel="canonical" href="{{ site.base_url }}{{ page.url }}">
```

`404.html` is generated at the output root. Most static hosts serve it automatically; on others, point the host's not-found rule at `/404.html`.

## Next

For client-side search, continue with [Search](/docs/search/).
