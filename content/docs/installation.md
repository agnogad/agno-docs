+++
title = "Installation"
date = 2026-10-28
description = "Install agno from a prebuilt binary, crates.io or source, and choose between the gnu and musl Linux builds."
summary = "Prebuilt binaries, crates.io or building from source; choosing between gnu and musl on Linux."
weight = 10
extra = { chapter = "01" }
+++

agno is a single static binary. You do not need Rust to build a site; Rust is only required when compiling from source.

## Requirements

| Install path | Requirement |
| --- | --- |
| Prebuilt binary | None. Unpack the archive and put it on your `PATH`. |
| `cargo install` | Rust **1.88+** (edition 2024) |
| Build from source | Rust **1.88+** and a C toolchain (`cc`, MSVC, or Xcode command-line tools) |

The C toolchain is a build-time requirement only: the syntax highlighter bundles Oniguruma into the binary. There is no shared library to install alongside the result.

<div class="callout note">
<p class="callout-title">Release note</p>
<p>agno is published on <a href="https://crates.io/crates/agno">crates.io</a>, and every tagged release ships prebuilt binaries for Linux, macOS (Intel and Apple silicon) and Windows on the releases page. The crates.io version can lag a release by a few days; the binaries do not.</p>
</div>

## Install a prebuilt binary

No Rust needed. Take the archive for your platform from the [latest release](https://github.com/agnogad/agno/releases/latest), unpack it, and put `agno` somewhere on your `PATH`.

The script below resolves the newest tag first, then downloads this platform's archive. The tag is resolved rather than hardcoded because the version is part of every archive name: a fixed `/latest/download/agno-<version>-...` URL would work until the next release and then return 404.

```sh
tag=$(curl -sIL -o /dev/null -w '%{url_effective}' \
  https://github.com/agnogad/agno/releases/latest | sed 's|.*/tag/||')

curl -L "https://github.com/agnogad/agno/releases/download/$tag/agno-${tag#v}-x86_64-unknown-linux-gnu.tar.gz" \
  | tar -xz

sudo install "agno-${tag#v}-x86_64-unknown-linux-gnu/agno" /usr/local/bin/
```

Swap the target for your platform:

| Platform | Archive target |
| --- | --- |
| Linux x86_64 (glibc) | `x86_64-unknown-linux-gnu` |
| Linux x86_64 (static) | `x86_64-unknown-linux-musl` |
| macOS Apple silicon | `aarch64-apple-darwin` |
| macOS Intel | `x86_64-apple-darwin` |
| Windows x86_64 | `x86_64-pc-windows-msvc` (`.zip`) |

Archives are built by CI on each platform rather than cross-compiled from a laptop.

### Linux: gnu or musl?

The two archives differ in libc, allocator and regex engine. 3,000 posts, twelve threads, speed relative to gnu:

| | `x86_64-unknown-linux-gnu` | `x86_64-unknown-linux-musl` |
| --- | --- | --- |
| No code | 1.0× · 38 MB | 1.2–1.3× slower · 69–120 MB |
| One code block per post | 1.0× · 41 MB | 1.5–1.6× slower · 94–159 MB |
| Three code blocks per post | 1.0× · 51 MB | 1.7–1.8× slower · 160–226 MB |
| Runs on | glibc 2.34+ (Ubuntu 22.04, Debian 12, RHEL 9) | Any x86_64 Linux, fully static |
| Allocator | System | mimalloc |
| Regex engine | Oniguruma (C) | fancy-regex (Rust) |

Take **gnu** unless it will not start: it is faster on every site, with or without code, and uses between a quarter and a half of the memory. Take **musl** for Alpine, a `scratch` container, or anything older than glibc 2.34, where the gnu archive fails at startup with `GLIBC_2.34 not found`.

<div class="callout tip">
<p class="callout-title">Why the difference?</p>
<p>musl's allocator does not scale under contention, so the static build uses mimalloc. Oniguruma serialises on a global lock that glibc's adaptive mutex absorbs, so the static build compiles against syntect's pure-Rust engine instead. The rendered HTML is byte-identical in both builds.</p>
</div>

## Install from crates.io

```sh
cargo install agno
```

## Install from GitHub

```sh
cargo install --git https://github.com/agnogad/agno
```

## Build from source

```sh
git clone https://github.com/agnogad/agno.git
cd agno
cargo install --path .
```

The release profile uses `lto = "fat"`, `codegen-units = 1`, `panic = "abort"` and `strip = true`, so the first build can take a few minutes.

## Verify the install

```sh
agno --version
# agno 0.3.7
```

If the command is not found, `~/.cargo/bin` (or wherever you put the binary) is not on your `PATH`:

```sh
echo 'export PATH="$HOME/.cargo/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

## Next

```sh
agno new blog
cd blog
agno dev
```

Those three commands scaffold a site, serve it on `http://localhost:1111`, and rebuild as files change. Continue with [Quickstart](/docs/quickstart/).
