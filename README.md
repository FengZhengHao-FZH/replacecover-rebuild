# Replace Cover — React reconstruction

简体中文版本：[README.zh-CN.md](README.zh-CN.md)

A clean-room rebuild of [replacecover.com](https://replacecover.com) — a browser-only tool for
making album/playlist cover art — restored from the **shipped artifact** rather than from the
original source, which was never published. The live site and its Adobe Fonts kit both went
away; this project was recovered from a Wayback Machine snapshot of the production bundle plus
runtime evidence, and rebuilt as a modern Vite + React app.

This is a research reconstruction, **not** an official fork and not affiliated with the
original author. See [License and asset notice](#license-and-asset-notice) before deploying it
publicly.

## How it was recovered

The rebuild is driven by the Reverse Engineering Assistant (REA, `rea-agents@6.5.0`). Everything
here is traceable to that evidence:

- **Specimen** — `../replacecover/site/` holds the archived production bundle, kept
  byte-identical and served unmodified on `127.0.0.1:8765` as the comparison baseline. It is an
  analysand, never edited, and not part of this deployable.
- **Extraction** — minified module graph, class-name inventory, and the four data tables
  (themes, stickers, default copy, text sizes) were pulled out of the bundle and emitted as
  ES modules under `src/data/`.
- **Runtime proof** — original and rebuild were captured in the same Chromium, same
  deterministic environment, and compared route by route. Results and the timing protocol the
  comparison needs: [docs/runtime-verification.md](docs/runtime-verification.md).

## Status

| route | viewport | accessibility digest | normalized `#root` diff |
| --- | --- | --- | --- |
| `/changelog` | 1280×720 | identical | 3 lines (all explained) |
| `/about` | 1280×720 | identical | 3 lines |
| `/` | 1280×720 | identical | 6 lines |
| `/` below-the-fold grid | 1280×200 | identical | 6 lines |

The digest is a SHA-256 over the full browser-produced accessibility serialization, so equal
digests mean the two trees are byte-identical — the strongest claim this evidence class
supports. The deltas are the three Typekit `<script>` nodes the rebuild intentionally drops,
plus react-tabs' generated `id` scheme. No pixel-level equivalence is claimed; the substitute
font changes text metrics.

Locally reproducible checks:

```
npm test        # 8 files, 106 tests, all passing
npm run build   # 162 modules, ~428 kB JS (~121 kB gzip), ~32 kB CSS
```

## Features

Everything the shipped site did, on the same 600×600 canvas:

- **Theme grid** — 15 background/text/contrast triads; the chosen triad drives the canvas
  background, title colour and pill colour.
- **Sticker grid** — 61 objects, lazily mounted as cells scroll into view. The original used
  `react-lazyload`; that package depends on the removed `findDOMNode`, so `src/lib/`
  reimplements the same visible-area behaviour on `IntersectionObserver`.
- **Shuffle** — one click randomises copy, theme and sticker together.
- **Text size / alignment / author + title editing** — autosizing textarea, alignment decides
  the pill's `align-self`.
- **JPEG export** — `html2canvas` rasterises `#canvasPreview` and downloads it as a `.jpeg`;
  no server, no account, no network calls at runtime.
- **`/about`, `/changelog`** — real paths, client-routed, deep-linkable.

## Stack

Vite 5 · React 18.3 · Redux 4 + react-redux 8 · react-router-dom 5 (kept on v5 because the
shipped app used its `render=` route API) · react-tabs 6 · react-textarea-autosize 8 ·
html2canvas 1 · @fontsource/poppins 5 · Vitest 2 + Testing Library 16 + jsdom 25.

## Layout

```
rebuild/
├── index.html          # document shell recovered from the shipped HTML, including its
│                       # pre-hydration animated loader
├── public/             # static assets served verbatim (stickers, favicons, PWA manifest,
│                       # og image, svg logos) — ~12 MB, copied to dist untouched
├── src/
│   ├── App.jsx         # providers + three routes + the shipped Tab-focus quirk
│   ├── components/     # Home, Editor, CanvasPreview, ThemesGrid, ThingsGrid, tools, pages
│   ├── data/           # generated: themes, things, playlist names, defaults, page trees
│   ├── lib/            # lazy mounting, progressive images, device detection, analytics stub
│   ├── store/          # redux actions + reducer
│   └── styles/         # original.css — the shipped stylesheet, class names preserved
├── tests/              # per-obligation suites (canvas, download, shuffle, lazy grid, routes)
├── scripts/            # evidence→source generators (see below)
└── docs/               # runtime-verification.md
```

Class names are deliberately not modernised: `src/styles/original.css` is the shipped
stylesheet, so the markup keeps names like `c-canvasPreview--pill`. Two of the original's own
defects are preserved on purpose — the `s-convasContainer` typo and a literal `"false"` class —
because the goal was fidelity to the artifact, not a cleanup.

## Regenerating data from the artifact

`src/data/*.js` and `index.html` are generated, not hand-written:

```
node scripts/emit-data.js         # bundle  → src/data/{themes,things,playlistNames,defaults,pageTrees}
node scripts/emit-index-html.mjs  # HTML    → index.html
node scripts/substitute-font.mjs  # installs the Poppins @fontsource import
```

## Running it

```
npm ci
npm run dev        # http://localhost:5173
npm run preview    # serves dist/ after npm run build
```

Development needs Node 18+ (Vite 5's floor). `netlify.toml` pins Node 20; `vercel.json` does not
pin a Node version, so add `"engines": { "node": "20.x" }` to `package.json` if you want the
same version on both hosts.

## Deploying

Both configs are committed and both only need the usual "single-page app" rewrite, which they
already contain, because `/about` and `/changelog` must not 404.

| host | file | build command | output | rewrite |
| --- | --- | --- | --- | --- |
| Vercel | `vercel.json` | `npm run build` | `dist` | `/(.*) → /index.html` |
| Netlify | `netlify.toml` | `npm run build` | `dist` | `/* → /index.html` (200), Node 20 |

**Project root.** This directory (`rebuild/`) is the app root. If you connect a repository that
also contains the `replacecover/` specimen, set the framework's root directory to `rebuild/`
(Vercel: *Root Directory*; Netlify: *Build settings → Base directory*) — otherwise the build
never finds `package.json`.

Deploy without a git remote (this working copy is not a repository yet):

```
npx vercel --prod          # or: npx netlify deploy --prod
```

There are no environment variables, secrets, or server functions: the site is fully static, so
the deploy is just the `dist/` bundle plus the `public/` assets.

## Deliberate differences from the original

1. **Font.** The shipped site loaded `canada-type-gibson` through Adobe Typekit (kit `szh8xsx`).
   That family is commercially licensed and the kit was domain-allowlisted to the original
   owner's Adobe account, so it cannot be reused or self-hosted. Poppins (SIL OFL) is bundled
   instead. Consequence: a two-line 60 px title block is ~136 px tall instead of ~130 px.
2. **Analytics removed.** `react-ga` and the Google tracking IDs are gone; `src/lib/analytics.js`
   is a no-op.
3. **No third-party requests at all** — no Typekit, no fonts CDN, no analytics endpoint.
4. **react-tabs 6** generates tab/panel `id`s differently from the version the original bundled;
   roles and names are unchanged.
5. **Two REA closure gates could not be satisfied on this Windows host** —
   `verify_reconstruction` rejects the comparison evidence it produces itself
   (`authority: "analyst-inference"`, `environment: null`), and `capture_process_scenario`
   refuses Windows PTY captures, so `npm test` output cannot become REA-grade evidence here.
   Both are documented rather than worked around; the equivalence claims above rest on
   browser-captured digests, which this host can produce.

## License and asset notice

The stickers, copy strings, favicons, PWA icons and the `og:image` were copied verbatim from
the archived artifact for analysis. They are someone else's creative work, and the original
source carries no license grant. **Confirm you have the right to redistribute them — or replace
them — before making this deployment public.** The reconstruction's own code (this directory's
`.jsx`, `.js`, `.css`, docs) is what was written here.
