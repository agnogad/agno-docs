+++
title = "CLI reference"
date = 2026-10-28
description = "Every agno command and flag: new, build, dev, check and clean, with output examples and exit codes."
summary = "Complete command and flag reference for agno 0.3.7."
weight = 120
extra = { chapter = "12" }
+++

```text
agno <COMMAND>
```

Commands: `new`, `build`, `dev`, `check`, `clean`. Running `agno` without a command prints help.

## `agno new`

Scaffold a site.

```sh
agno new <PATH> [--force]
```

| Argument / flag | Description |
| --- | --- |
| `<PATH>` | Target directory |
| `--force` | Write into a non-empty directory |

```sh
agno new blog
```

```text
Created blog

  cd blog
  agno dev
```

Without `--force`, a non-empty directory is refused and left untouched.

## `agno build`

Build the site into `dist/`.

```sh
agno build [--drafts] [--stats] [--clean] [--minify] [--root <DIR>]
```

| Flag | Description |
| --- | --- |
| `--drafts` | Include pages with `draft = true` |
| `--stats` | Print per-phase timings |
| `--clean` | Delete the output directory and rebuild everything |
| `--minify` | Collapse HTML whitespace and strip comments |
| `-r`, `--root <DIR>` | Operate on another site directory |

```sh
agno build
# Built 42 pages in 31 ms → ./dist
```

```sh
agno build --stats
#   content 8 ms · pages 14 ms · lists+feeds 3 ms
# Built 42 pages in 31 ms → ./dist
```

Builds are incremental by default. Unchanged pages are skipped using the fingerprints in `.agno-cache/`, and files that no longer belong to any page are removed through the manifest. `--clean` throws both away.

<div class="callout note">
<p class="callout-title">Deprecated flag</p>
<p><code>--no-clean</code> is still accepted for compatibility but is hidden from help. Incremental builds are the default, so the flag has no effect.</p>
</div>

## `agno dev`

Build, serve and rebuild on changes.

```sh
agno dev [-p <PORT>] [--drafts] [-r <DIR>]
```

| Flag | Default | Description |
| --- | --- | --- |
| `-p`, `--port <PORT>` | `1111` | Port to listen on |
| `--drafts` | off | Include draft pages |
| `-r`, `--root <DIR>` | current directory | Another site directory |

```sh
agno dev
# agno dev → http://localhost:1111  (42 pages, 31 ms)
```

The server watches `content/`, `templates/` and `static/`, rebuilds incrementally and reloads the browser. It serves `dist/`; there is no separate in-memory mode.

## `agno check`

Validate content and internal links.

```sh
agno check [--drafts] [-r <DIR>]
```

| Flag | Description |
| --- | --- |
| `--drafts` | Check draft pages too |
| `-r`, `--root <DIR>` | Another site directory |

```sh
agno check
# Checked 42 pages and 318 internal links: no problems
```

Failure looks like this:

```text
error: ./content/blog/hello.md:12: broken link /blog/nope/ (resolves to /blog/nope/index.html)

1 error(s) across 42 pages (318 internal links checked)
```

What is checked:

- Internal Markdown links and images resolve to files the build will produce.
- `#fragment` targets resolve to heading IDs. `#top` always resolves.
- A page's `template` exists.
- Pages have a date.

Exit code is `1` when any error is found, so it can gate CI.

## `agno clean`

Remove the output directory and the cache.

```sh
agno clean [-r <DIR>]
```

```sh
agno clean
# Cleaned ./dist
```

This removes both `dist/` and `.agno-cache/`. The next build is a cold build.

## Global flags

| Flag | Description |
| --- | --- |
| `-h`, `--help` | Print help for the command |
| `-V`, `--version` | Print the version |

```sh
agno --version
# agno 0.3.7
```

`--help` works on subcommands too:

```sh
agno build --help
```

## `--root` semantics

`build`, `dev`, `check` and `clean` accept `-r` / `--root`. The value must be an existing directory; agno refuses to create a typo'd path and build an empty site inside it.

```sh
agno build --root ../site-a
agno dev -r /srv/site-b -p 3000
agno check -r ../site-a
```

## Exit codes

| Code | Meaning |
| --- | --- |
| `0` | Success |
| `1` | Build, configuration, template or check failure |

When a build fails, the error names the file and the reason. Nothing is written for the failing page, and the process stops before reporting success.

## Environment

agno reads no environment variables for configuration. Everything lives in `agno.toml` and command-line flags. That keeps local, CI and production builds identical.

## Next

For how the pipeline is put together, continue with [Architecture](/docs/architecture/).
