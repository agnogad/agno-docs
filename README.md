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

Every push to `main` runs [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml),
which installs the latest agno release, builds the site and uploads `dist/` to
Cloudflare Pages with `wrangler pages deploy`. The build is not run on Cloudflare:
its build image has no Rust.

Two repository secrets are required:

```sh
gh secret set CLOUDFLARE_API_TOKEN -R agnogad/agno-docs   # Account → Cloudflare Pages → Edit
gh secret set CLOUDFLARE_ACCOUNT_ID -R agnogad/agno-docs
```

Both are on the Cloudflare dashboard: the token under *My Profile → API Tokens*,
the account ID in the account's URL or `npx wrangler whoami`. Manual deploy, if
ever needed:

```sh
agno build --clean --minify
npx wrangler pages deploy dist --project-name=agno-docs
```
