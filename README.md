# agno docs

The documentation site for [agno](https://github.com/agnogad/agno), built with agno itself.

**Live:** <https://agno-docs.pages.dev>

## Local development

```sh
agno dev
```

Open <http://localhost:1111>.

## Production build

```sh
agno build --clean --minify
```

The static output is written to `dist/` and can be deployed to any static host.

## Structure

- `content/` — Markdown sources
- `templates/` — MiniJinja templates
- `static/` — CSS, JavaScript and icon
- `agno.toml` — site configuration

## Deployment

The site is deployed to Cloudflare Pages as a static site. Build command:

```sh
agno build --clean --minify
```

Output directory: `dist`.
