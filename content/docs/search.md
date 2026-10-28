+++
title = "Search"
date = 2026-10-28
description = "Generate search-index.json and wire a fast client-side search UI with no server and no dependencies."
summary = "search-index.json, its shape, a dependency-free client implementation and the build cost."
weight = 100
extra = { chapter = "10" }
+++

agno does not ship a search runtime. It can emit a JSON index, and the browser does the rest. That keeps the site static and the binary free of a search server.

## Enable the index

```toml
search_index = true
```

The build writes `dist/search-index.json`. Each entry has this shape:

```json
[
  {
    "title": "Installation",
    "url": "/docs/installation/",
    "date": "2026-10-28T00:00:00Z",
    "description": "Install agno from a prebuilt binary, crates.io or source…",
    "summary": "Prebuilt binaries, crates.io or building from source…",
    "tags": []
  }
]
```

<div class="callout warn">
<p class="callout-title">Only dated pages</p>
<p>The index contains only regular pages with a <code>date</code>. Section landing pages and pages without a date are not indexed. This is the most common reason a docs page is missing from results.</p>
</div>

## Build cost

The index is optional and off by default. On the benchmark corpus, toggling it costs:

| Posts | Lists+feeds off | On | Delta | Output off | On | `search-index.json` |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1,000 | 9.0 ms | 9.0 ms | **+0.0 ms** | 3.50 MB | 3.87 MB | 0.37 MB |
| 10,000 | 84.0 ms | 110.0 ms | **+26.0 ms** | 34.90 MB | 38.61 MB | 3.71 MB |

The delta isolates the index from content loading and page rendering; whole-build wall-clock differences stayed within run-to-run noise.

## A minimal client

The pattern is: fetch once on first open, normalise, score, render. No framework required.

```js
let entries = null;

async function loadIndex() {
  if (entries) return entries;
  const response = await fetch("/search-index.json");
  entries = response.ok ? await response.json() : [];
  return entries;
}

function normalize(value) {
  return (value || "")
    .toLocaleLowerCase("en")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function search(entries, query) {
  const q = normalize(query.trim());
  if (!q) return [];

  return entries
    .map((entry) => {
      const title = normalize(entry.title);
      const text = normalize(entry.description + " " + entry.summary);
      const tags = (entry.tags || []).map(normalize);

      let score = 0;
      if (title === q) score = 100;
      else if (title.startsWith(q)) score = 80;
      else if (title.includes(q)) score = 60;
      else if (tags.some((tag) => tag.includes(q))) score = 40;
      else if (text.includes(q)) score = 20;
      return { entry, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 12)
    .map((item) => item.entry);
}
```

Render results with `textContent`, not `innerHTML`, so titles and descriptions cannot inject markup:

```js
const results = document.querySelector("#search-results");

function render(matches) {
  results.replaceChildren();
  for (const entry of matches) {
    const link = document.createElement("a");
    link.href = entry.url;
    link.className = "search-result";

    const title = document.createElement("h3");
    title.textContent = entry.title;
    link.append(title);

    if (entry.description) {
      const p = document.createElement("p");
      p.textContent = entry.description;
      link.append(p);
    }

    results.append(link);
  }
}
```

## Wiring the dialog

A practical dialog adds four behaviours:

1. Open on `⌘K` / `Ctrl+K` and on a search button.
2. Fetch the index lazily, the first time the dialog opens.
3. Support `↑`, `↓`, `Enter` and `Esc`.
4. Move focus into the input and restore it on close.

```js
const dialog = document.querySelector("#search-modal");
const input = document.querySelector("#search-input");

async function open() {
  dialog.hidden = false;
  input.focus();
  const index = await loadIndex();
  render(search(index, input.value));
}

input.addEventListener("input", () => {
  render(search(entries || [], input.value));
});

document.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    open();
  }
  if (event.key === "Escape") dialog.hidden = true;
});
```

This documentation site uses exactly this approach in `static/app.js`, with an added keyboard selection state.

## Improving relevance

The snippet above is deliberately small. For a larger corpus:

- **Weight fields separately.** Title matches should outrank body matches by a wide margin.
- **Boost tags and headings.** A tag hit is a stronger signal than prose.
- **Normalise diacritics.** `NFD` plus combining-mark removal makes `cafe` match `café`; add language-specific folding if needed.
- **Cap the result list.** Twelve results is plenty for a docs site; more is slower and rarely used.
- **Show a snippet.** Prefer `description` over `summary` for the card, since it is written for scanning.

<div class="callout tip">
<p class="callout-title">No stemming, no index format</p>
<p>The JSON is a flat list of pages, not a token index. Matching happens in the browser. That is fast enough for hundreds of pages and avoids shipping a search engine; at several thousand pages, consider building a token index at build time.</p>
</div>

## Limitations

- No server-side search, no query API.
- No stemming, fuzzy matching or typo tolerance out of the box.
- Only page-level entries; no per-heading deep links.
- The whole index is downloaded on first search. At 10,000 posts, that is roughly 3.7 MB before compression.

## Next

For hosting, caching and CI, continue with [Deployment](/docs/deployment/).
