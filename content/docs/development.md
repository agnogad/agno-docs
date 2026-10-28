+++
title = "Development"
date = 2026-10-28
description = "Build agno from source, run the test and lint suite, understand the source layout, and reproduce the benchmarks."
summary = "Local setup, the CI check set, source layout, tests and benchmark prerequisites."
weight = 170
extra = { chapter = "17" }
+++

This chapter is for working on agno itself, not on a site built with it.

## Prerequisites

- Rust **1.88+** with `rustfmt` and `clippy`
- A C toolchain (`cc`, MSVC, or Xcode command-line tools) for Oniguruma
- Python 3 for the benchmark suite, if you need it

```sh
git clone https://github.com/agnogad/agno.git
cd agno
cargo build --release
./target/release/agno --version
```

The release profile uses fat LTO, one codegen unit, `panic = "abort"` and symbol stripping. The first release build takes a few minutes; incremental debug builds are much faster.

## The check set

CI runs these, and a pull request should pass them locally:

```sh
cargo fmt --all --check
cargo clippy --all-targets --all-features -- -D warnings
cargo test --locked

cargo check --all-targets --no-default-features --features fancy
cargo doc --no-deps --all-features
```

| Command | Why it exists |
| --- | --- |
| `cargo fmt --all --check` | Formatting is not a matter of taste in CI |
| `cargo clippy … -D warnings` | Warnings are errors |
| `cargo check … --features fancy` | The musl build uses the pure-Rust regex engine; without this it is never compiled |
| `cargo doc …` | Broken intra-doc links fail the build |
| `cargo test --locked` | Tests run against the committed lockfile |

Set `RUSTDOCFLAGS="-D warnings"` for the doc job, as CI does.

## Source layout

| File | Responsibility |
| --- | --- |
| `src/main.rs` | CLI parsing and dispatch |
| `src/config.rs` | `agno.toml` loading and validation |
| `src/content.rs` | Discovery, frontmatter, URLs, dates, sections |
| `src/markdown.rs` | CommonMark/GFM rendering, TOC, highlighting |
| `src/render.rs` | MiniJinja environment and template lookup |
| `src/site.rs` | Parallel build orchestration and output writing |
| `src/cache.rs` | Fingerprints and manifests |
| `src/minify.rs` | Conservative HTML minifier |
| `src/check.rs` | Internal link resolution |
| `src/serve.rs` | Dev server and file watcher |
| `src/scaffold.rs` | `agno new` starter site |
| `src/theme.rs` | Embedded templates and stylesheet |
| `tests/` | End-to-end build, output and CLI behaviour |

The embedded theme lives under `theme/` and is compiled into the binary with `include_str!`. If you change a default template, the change affects every site that has not overridden it.

## Tests

```sh
cargo test
```

The suite includes end-to-end tests that scaffold a site, build it, inspect the output and run `check`. There are also fuzz-style input tests for frontmatter and path handling. When you change behaviour, add a test at the level where the behaviour lives:

- Parsing or path rules → unit test beside the module or an end-to-end fixture.
- Template context → a fixture site that renders the variable.
- CLI output or exit codes → an integration test that invokes the binary.

A useful smoke test is the same one CI runs on each platform:

```sh
target/release/agno new /tmp/agno-smoke
cd /tmp/agno-smoke
target/release/agno build --stats
target/release/agno check
test -f dist/index.html
target/release/agno clean
test ! -d dist
```

## Benchmarks

Build the release binary first, then point the suite at the other generators:

```sh
cargo build --release
HUGO_BIN=/path/to/hugo ZOLA_BIN=/path/to/zola python3 bench/suite.py
```

The suite writes `results.json` and `REPORT.md`. For a single scenario:

```sh
python3 bench/run.py --count 1000 --runs 5 --profile code
```

Useful tools:

| Script | Purpose |
| --- | --- |
| `bench/ab.py` | Interleaves two agno binaries with a same-binary control |
| `bench/incremental.py` | Cold vs no-op vs single-edit rebuilds |
| `bench/search_index.py` | Cost and size of the search index |
| `bench/sections.py` | Section-heavy documentation corpus |
| `bench/zola_compare.py` | Focused Zola head-to-head |

`ab.py` is the tool for a claim like "this branch is faster". It measures the noise floor by running the same binary twice and refuses to declare a winner inside that floor. Do not compare two builds from separate runs and trust the difference.

Prerequisites, fixtures and environment variables are in `bench/README.md`; results and caveats are in `bench/REPORT.md` and `bench/ZOLA.md`.

## CI jobs

| Job | What it checks |
| --- | --- |
| `lint` | fmt, clippy, pure-Rust engine build, docs |
| `build` | Release build and tests on Ubuntu, macOS and Windows; smoke test of the binary |
| `msrv` | `cargo check --locked` on Rust 1.88.0 |
| `audit` | Dependency advisories on a schedule |
| `release` | Tagged `v*` builds and publishes platform archives |

The MSRV job is a promise to anyone building from source: `rust-version` in `Cargo.toml` must actually work with the committed lockfile.

## Making a change

1. Open an issue for anything beyond a typo or a small fix.
2. Keep the diff focused; avoid unrelated formatting churn.
3. Add or update a test when behaviour changes.
4. Run the check set above.
5. If the change affects performance, include before/after numbers from `bench/ab.py`, not a single run.

For changes to the embedded theme, note that they reach every site without a local override. Visual changes should be checked against a scaffolded site, not only against the tests.

## Release profile

```toml
[profile.release]
lto = "fat"
codegen-units = 1
panic = "abort"
strip = true
```

Those settings explain the 4.2 MB binary and the slow first compile. Do not "optimise" them for developer convenience; release artifacts are built by CI from this profile.

## Licence

MIT. By contributing you agree that your contribution is licensed under the same terms.

## Next

That is the handbook. Return to the [documentation index](/docs/) or start again at [Installation](/docs/installation/).
