+++
title = "Benchmarks"
date = 2026-10-28
description = "Cold builds, rebuilds, memory and install size against Hugo, Zola and Astro, with methodology, caveats and reproduction steps."
summary = "Full benchmark tables, Zola head-to-head, search-index and incremental costs, plus caveats."
weight = 140
extra = { chapter = "14" }
+++

All numbers below come from the repository's benchmark suite. Treat them as a starting point, not a promise about your machine: filesystem, CPU and corpus shape move the result.

## Environment

- Intel i5-13420H, 12 threads
- CachyOS, Linux 7.2
- The output directory is removed before every timed run
- Process startup is included
- Times are medians of multiple runs

`code` adds one syntax-highlighted code block per post. `heavy` adds three code blocks, a table and a footnote.

## Cold builds

| Scenario | agno | Hugo | Zola | Astro |
| --- | ---: | ---: | ---: | ---: |
| 100 posts, plain | **22.9 ms** | 212.2 ms | 191.7 ms | 3,685 ms |
| 1,000 posts, plain | **106.4 ms** | 501.3 ms | 250.7 ms | 5,546 ms |
| 1,000 posts, code | **136.0 ms** | 516.3 ms | 437.8 ms | 4,787 ms |
| 1,000 posts, heavy | **207.7 ms** | 1,892.6 ms | 1,080.0 ms | 5,407 ms |
| 3,000 posts, heavy | **636.9 ms** | 5,757.0 ms | 2,248.4 ms | 7,425 ms |
| 10,000 posts, code | **1,308 ms** | 4,006 ms | 3,236 ms | — |

At 10,000 posts agno sustains about **7,642 pages/s**, compared with 2,496 pages/s for Hugo and 3,090 for Zola.

## Other situations

| Situation | agno | Hugo | Zola | Astro |
| --- | ---: | ---: | ---: | ---: |
| Single-edit rebuild, 1,000 posts | **32.8 ms** | 691.4 ms | 485.7 ms | — |
| 2-page site, cold build | **12.1 ms** | 102.5 ms | 113.5 ms | 2,497 ms |
| CLI startup | **1.9 ms** | 79.1 ms | 13.4 ms | 114.7 ms |
| Peak RSS, 1,000 posts/code | **21.7 MB** | 168.1 MB | 76.3 MB | 613.2 MB |
| Peak RSS, 3,000 posts/heavy | **51.2 MB** | 558.8 MB | 170.7 MB | 688.3 MB |
| Install footprint | **4.3 MB binary** | 95.1 MB binary | 50.8 MB binary | 121 MB `node_modules` |

Astro is missing from the rebuild row on purpose: its rebuild empties the output directory before rendering, and that deletion dominates the run on this filesystem (36 s against a 4.8 s cold build at 1,000 posts). The number would measure the disk, not the generator.

## Zola head-to-head

Zola is the closest Rust neighbour, so it gets a dedicated run: the same corpus built twice with equivalent templates, tag pages, a feed, a sitemap and highlighting. The two generators alternate inside every scenario so a load spike hits both. Medians of 7 runs, agno 0.3.2 against Zola 0.23.6.

| Posts | Profile | Cold build | Ratio | Rebuild | Ratio |
| ---: | --- | ---: | ---: | ---: | ---: |
| 1,000 | plain | **100 ms** / 233 ms | 2.3× | **21 ms** / 353 ms | 17× |
| 1,000 | code | **124 ms** / 433 ms | 3.5× | **30 ms** / 546 ms | 18× |
| 1,000 | heavy | **227 ms** / 1,285 ms | 5.7× | **32 ms** / 1,318 ms | 41× |
| 3,000 | heavy | **608 ms** / 2,389 ms | 3.9× | **85 ms** / 2,764 ms | 32× |
| 10,000 | code | **1,304 ms** / 3,405 ms | 2.6× | **187 ms** / 4,990 ms | 27× |

Zola has no incremental mode: `zola build` deletes the output directory and renders everything, so its rebuild costs as much as a cold build. agno keeps fingerprints per page and rewrites only what changed.

## bongo head-to-head

bongo is a TypeScript generator that runs on Node or Bun and bundles with Rolldown and LightningCSS. Same corpus and the same interleaved method: the stock `agno new` and `bun create bongo` scaffolds, agno 0.3.7 against bongo 1.2.0, medians of 5 runs at 1,000 posts and 3 at 10,000.

bongo is measured twice: with the scaffold's defaults (`bongo build` on Node, Shiki highlighting) and with its fastest setup here (`bun --bun run build`, Sugar High). The two runtimes cannot share a site, because bongo keys its build cache on the runtime.

| Posts | Scenario | agno | bongo (Node, Shiki) | bongo (Bun, Sugar High) | agno vs best bongo |
| ---: | --- | ---: | ---: | ---: | ---: |
| 1,000 | Cold build | **129 ms** | 1,839 ms | 1,079 ms | **8.4× faster** |
| 1,000 | No-op rebuild | **22 ms** | 581 ms | 381 ms | **17× faster** |
| 1,000 | Single-edit rebuild | **23 ms** | 586 ms | 384 ms | **17× faster** |
| 10,000 | Cold build | **1,488 ms** | 10,903 ms | 6,172 ms | **4.1× faster** |
| 10,000 | No-op rebuild | **225 ms** | 1,473 ms | 932 ms | **4.2× faster** |
| 10,000 | Single-edit rebuild | **221 ms** | 1,520 ms | 935 ms | **4.2× faster** |

Peak RSS of the cold build is 22 MB against 266 MB (Node) and 192 MB (Bun) at 1,000 posts, and 114 MB against 666 MB and 329 MB at 10,000. CLI startup is 2 ms against 58–65 ms.

agno also writes slightly more per build (tag pages, RSS, `404.html`), so the gap is not a feature-parity artefact. bongo publishes 2.19 s for 10,000 pages on an M1 Max with twinkleplop; on this i5 the same corpus takes 6.17 s with bongo's best options. Method and caveats: `bench/BONGO.md` in the agno repository.

## Search index cost

The search index is optional and off by default. Toggling `search_index` on the same corpus:

| Posts | Lists+feeds off | On | Delta | Output off | On | `search-index.json` |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1,000 | 9.0 ms | 9.0 ms | **+0.0 ms** | 3.50 MB | 3.87 MB | 0.37 MB |
| 10,000 | 84.0 ms | 110.0 ms | **+26.0 ms** | 34.90 MB | 38.61 MB | 3.71 MB |

`lists+feeds` is the build phase that writes the index, so the delta isolates the index from content loading and page rendering. Whole-build wall-clock differences stayed within run-to-run noise.

## Incremental rebuilds

Every build writes a fingerprint per page into `.agno-cache/fingerprints.bin`. A rebuild re-renders a page only when its source, templates or site-wide context changed, so a no-op rebuild is mostly a directory walk and a manifest diff.

| Posts | Cold (`--clean`) | No-op rebuild | One post edited |
| ---: | ---: | ---: | ---: |
| 1,000 | 60 ms | **23 ms** | **23 ms** |
| 10,000 | 2.9 s | **234 ms** | **224 ms** |

Wall-clock on a busy host swings by 30% between runs, so the table below compares CPU time (`user` + `sys`), which does not. It also shows what 0.3.0 changed for full rebuilds, which cannot skip any work:

| Posts | Cold build, 0.2.0 → 0.3.0 | Rebuild, 0.2.0 → 0.3.0 |
| ---: | ---: | ---: |
| 1,000 | 206 → 235 ms (+14%) | 145 → 78 ms (**1.9× less**) |
| 10,000 | 8.8 → 10.0 s (+14%) | 4.8 → 0.74 s (**6.5× less**) |

The 14% cold-build cost is the table of contents, word counts and fingerprint bookkeeping that every page now pays for. Rebuilds are 2–6.5× cheaper because they skip that work. At 10,000 posts a rebuild costs about **1/12** of a cold build.

## Section landing pages

A site with many sections used to pay for every `_index.md` on every build. Section bodies are now rendered on demand, once per section, inside the parallel list phase.

Corpus: 300 sections, each with an `_index.md` containing two code blocks and five pages (1,801 pages). Medians of 5 runs, alternating the 0.3.2 and branch binaries.

| Scenario | 0.3.2 | Branch | Improvement |
| --- | ---: | ---: | ---: |
| Cold build (`--clean`) | 379 ms | **330 ms** | 1.2× faster |
| No-op rebuild | 118 ms | **31 ms** | 3.8× faster |
| Single-edit rebuild | 116 ms | **40 ms** | 2.9× faster |

A blog-shaped corpus without section bodies is unaffected: 3,000 posts rebuild in 40 ms either way.

## Caveats

- **Different runs, different machines.** These are medians on one host. A separate interleaved run differs from the matrix by a few percent.
- **Filesystem matters.** On a Btrfs volume with `compress=zstd`, deleting a 10,000-file output tree can take over a second. Cold builds are partly a disk benchmark.
- **Astro's fixture is optimistic.** It renders Markdown pages only and does not include highlighting, taxonomies, RSS or a sitemap. agno and Hugo both perform real highlighting.
- **Version drift.** Numbers were recorded with agno 0.3.2/0.3.7, Hugo 0.168.0, Zola 0.23.6, Astro 7.4.2, bongo 1.2.0 (Node 26.7.0 / Bun 1.4.0). Rerun the suite for current versions.
- **Absolute times are not stable.** Speed ratios survive a noisy host better than wall-clock milliseconds.

## Reproduce

```sh
python3 bench/suite.py
python3 bench/ab.py
python3 bench/incremental.py --count 10000 --runs 5
python3 bench/sections.py --sections 300 --per-section 5 --runs 7
python3 bench/zola_compare.py --count 1000 --profile code --runs 5
python3 bench/bongo_compare.py --count 1000 --profile code --runs 5
python3 bench/bongo_compare.py --count 10000 --runs 3 --highlighter sugarhigh --runtime bun
```

Prerequisites, fixtures, scenarios and environment variables are documented in `bench/README.md`; the full matrix and raw samples are in `bench/REPORT.md`, `bench/ZOLA.md` and `bench/BONGO.md`.

## Next

If a build misbehaves, [Troubleshooting](/docs/troubleshooting/) lists the errors you are most likely to hit.
