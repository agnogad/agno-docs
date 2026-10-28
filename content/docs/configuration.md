+++
title = "Configuration"
date = 2026-10-28
description = "Every key in agno.toml, the directory safety rules, menus, language, search and RSS settings."
summary = "All agno.toml keys, validation rules and safe output-directory behaviour."
weight = 70
extra = { chapter = "07" }
+++

`agno.toml` is optional; every key has a default. Without the file, agno builds with defaults.

## Full example

```toml
title = "Our Team"
description = "Notes, documentation and writing."
base_url = "https://example.com"
language = "en"
author = "Our Team"

content_dir = "content"
templates_dir = "templates"
static_dir = "static"
output_dir = "dist"

highlight = true
rss_items = 20
search_index = true
minify = false

[[menu]]
title = "Blog"
url = "/blog/"

[[menu]]
title = "Docs"
url = "/docs/"

[[menu]]
title = "GitHub"
url = "https://github.com/example/project"
```

## Keys

| Key | Default | Description |
| --- | --- | --- |
| `title` | `"My Site"` | Site title. Empty values become `"My Site"`. |
| `description` | `""` | Site description; used for the home-page meta description. |
| `base_url` | `"http://localhost:1111"` | Canonical base URL. Must be an absolute `http(s)` URL. |
| `language` | `"en"` | Language code. Affects date formatting and `<html lang>`. |
| `author` | `""` | Author; exposed as `site.author`. |
| `content_dir` | `"content"` | Markdown source directory. |
| `templates_dir` | `"templates"` | Template directory. |
| `static_dir` | `"static"` | Files copied verbatim. |
| `output_dir` | `"dist"` | Build output. Must stay inside the site root. |
| `highlight` | `true` | Syntax highlighting. Disabling it speeds up builds. |
| `rss_items` | `20` | Number of newest pages in the RSS feed. |
| `search_index` | `false` | Emit `search-index.json`. |
| `minify` | `false` | Collapse HTML whitespace and strip comments. |
| `[[menu]]` | empty | Menu items: `title`, `url`. |

<div class="callout note">
<p class="callout-title">Unknown keys</p>
<p>The configuration is not a strict schema; unrecognised keys are ignored silently. If a setting seems to have no effect, check the spelling first: <code>search_index</code>, not <code>searchIndex</code>.</p>
</div>

## `base_url`

`base_url` is used for:

- `<link rel="canonical">` URLs
- Absolute URLs in `sitemap.xml`
- Channel and item links in `rss.xml`
- The sitemap line in `robots.txt`

It must therefore be an absolute `http://` or `https://` URL. A trailing slash is trimmed automatically. The default `http://localhost:1111` is fine for local preview; set the real domain before deploying.

```toml
base_url = "https://docs.example.com"
```

<div class="callout warn">
<p class="callout-title">Common mistake</p>
<p>A scheme-less value such as <code>base_url = "example.com"</code> stops the build with <code>base_url must be an absolute http(s) URL</code>. That is intentional: otherwise the sitemap and feed would silently fill with relative URLs.</p>
</div>

## Directory safety

`output_dir` obeys these rules:

- It cannot be the site root.
- It cannot escape the site root.
- It cannot overlap `content_dir`, `templates_dir` or `static_dir`.
- It cannot be a symbolic link.

These checks stop a bad configuration from deleting your inputs. `agno build --clean` removes the output directory, so the validation is the guard that ensures the target really is output.

```toml
output_dir = "dist"          # fine
output_dir = "../public"     # rejected: outside the root
output_dir = "content"       # rejected: overlaps an input directory
```

## Menus

`[[menu]]` items reach templates as `site.menu`. Internal and external links can be mixed:

```toml
[[menu]]
title = "Docs"
url = "/docs/"

[[menu]]
title = "GitHub"
url = "https://github.com/agnogad/agno"
```

Items only carry `title` and `url`. Submenus, ordering and icons are the template's job. To mark the active item, compare URLs:

```html
{% for item in site.menu %}
<a href="{{ item.url }}"
   {% if item.url|starts_with("/") and page.url|starts_with(item.url) %}class="active"{% endif %}>
  {{ item.title }}
</a>
{% endfor %}
```

## Language and dates

`language` appears in two places:

- Month names in `page.date_display` and `page.updated_display`
- `site.language` in templates (usually `<html lang="…">`)

`en` produces English month names, `tr` Turkish ones. The dates themselves are always UTC-based.

## Search index

With `search_index = true`, the build writes `dist/search-index.json`. The index contains only pages that have a `date` and each entry has this shape:

```json
[
  {
    "title": "Installation",
    "url": "/docs/installation/",
    "date": "2026-10-28T00:00:00Z",
    "description": "Install agno from…",
    "summary": "Prebuilt binaries…",
    "tags": ["installation"]
  }
]
```

See [Search](/docs/search/) for a client-side implementation. Producing the index adds no measurable cost at 1,000 posts and about 26 ms at 10,000.

## RSS and sitemap

`rss_items` caps the number of newest pages in the feed. The sitemap includes every page, section and taxonomy page; it needs no separate setting.

## CLI overrides

The `minify` value in the configuration can be turned on with `agno build --minify`. `--clean`, `--drafts` and `--stats` affect only that build and are not written back to the file.

To operate on another site root:

```sh
agno build --root ../another-site
agno dev -r ../another-site --port 3000
```

## Next

To create tag and category pages, continue with [Taxonomies](/docs/taxonomies/).
