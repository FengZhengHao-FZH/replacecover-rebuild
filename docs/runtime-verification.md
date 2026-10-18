# Runtime verification - rebuild vs shipped site

Evidence producer: REA (`rea-agents@6.5.0`) MCP, session bundle
[rea-session-bundle.json](../replacecover/rea-session-bundle.json) - 37 records, 0 residual unknowns,
6,705,439 bytes as exported on 2026-10-18.

Both sides were captured by the same provider (`rea-playwright-browser-scenario`, Chromium
155.0.8059.40) under the same deterministic environment (en-US, UTC, light, reduced motion,
service workers blocked), so the only variables are the origin and the application code:

| side | server | URL |
| --- | --- | --- |
| shipped specimen | `replacecover/serve.js` (mirror of the Wayback capture, byte-identical to `raw/`) | `http://127.0.0.1:8765` |
| this rebuild | `vite preview` on `rebuild/dist` | `http://127.0.0.1:4173` |

## Per-route comparison

Reproduce with `node replacecover/compare-captures.js` (add `--dump` for the normalized trees).

| scenario | viewport | original settle | rebuild settle | original evidence | rebuild evidence | accessibility digest | normalized `#root` diff |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/changelog` | 1280x720 | 4.5 s | 1.5 s | `ev_a50e760e…` | `ev_de2aca6e…` | identical `7f239de89f1121e3…` | 3 lines |
| `/about` | 1280x720 | 4.5 s | 4.5 s | `ev_e31b6da3…` | `ev_48cf716b…` | identical `b82333443a09308e…` | 3 lines |
| `/` | 1280x720 | 4.5 s | 4.5 s | `ev_6508139e…` | `ev_5030552b…` | identical `2a9f4bae784970df…` | 6 lines |
| `/` (below-fold grid) | 1280x200 | 6 s | 6 s | `ev_337d668a…` | `ev_12b9d0a3…` | identical `58c8adf8933e9db6…` | 6 lines |

The accessibility digest is the full serialization produced by the browser (names, roles,
values) hashed with SHA-256 by REA, not a count. Equal digests mean the two trees are
byte-identical, which is the strongest equivalence this evidence class can establish.

DOM node counts inside `#root` are 53/50, 146/143, 447/444 - the constant -3 is the Typekit
script pair plus its inline loader function, which the rebuild does not ship (see below).

### Capture timing is part of the protocol

The first `/` capture at 1280x200 produced different accessibility trees. Cause: while
`<html>` still carries `wf-loading`, Blink prunes the text-bearing nodes that Typekit has not
laid out yet, so the original's tree is truncated. The shipped loader gives up after
`scriptTimeout: 3000` ms and swaps in `wf-inactive`; captures must therefore settle for at
least ~4.5 s before the trees are comparable. The settled recapture (6 s) hashes identically.
Any future comparison that shows an accessibility mismatch on the original side should check
`<html class>` in the DOM artifact first.

## Remaining deltas, all deliberate

1. **Typekit → @fontsource Poppins.** The shipped pages inject `https://use.typekit.net/szh8xsx.js`
   (Adobe-licensed kit). The rebuild self-hosts Poppins 400/500/600/700 woff2 from
   `node_modules/@fontsource/poppins`, so `dist/index.html` contains no third-party script and no
   FOUT window. Consequences: the 3 `-3` node delta above, and the autosizing title textarea
   measures 132 px where the shipped page measured 123 px (different font metrics for the same
   60 px size). Text is not pixel-identical; layout is not claimed to be.
2. **react-tabs 6 vs shipped v3.** Generated ids/ARIA wiring differ (`tab:r0:0` /
   `panel:r0:0` / `data-rttab` vs `react-tabs-0…3` / `data-tabs`). Roles, selection state,
   labels and tab-order behaviour match, which is why the accessibility digests agree. The
   rebuild keeps v6 rather than pinning an eight-year-old major.
3. **react-ga removed.** No GA init, no pageview, no `download` event. The recovered About and
   Changelog trees keep the rendered `pageview()` return value as a `pageviewChild` marker that
   `RichNode` renders as nothing, preserving the shipped DOM exactly while dropping the network
   calls. Obligations B18/B19 are therefore out of scope for this rebuild, not unverified.
4. **Shipped defects kept.** The `s-convasContainer` misspelling (class *and* SCSS) and the
   `false` string in the loaded-image class list (`concat(isLoading && "loading")`) are
   reproduced as-is and pinned by tests, so a future "fix" has to be a decision, not an accident.
5. **Pixel-level equality is never claimed.** `take_screenshot` against the in-app browser view
   fails with `NATIVE_BROWSER_VIEWPORT_UNAVAILABLE` on this host, so no screenshot artifact is
   part of any pair above.

## Three defects only browser evidence could find

Each was invisible to the test suite and to a static bundle diff, and each is now fixed and
covered:

| defect | how it showed up | fix |
| --- | --- | --- |
| `aria-label` dropped from every emoji span on About/Changelog | extractor in `replacecover/extract-pages.js` only accepted identifier keys, so `{"aria-label":"back"}` was skipped | quoted-key branch in `parseProps` + `aria-label` in `RichNode`'s allow-list; 3 tests |
| canvas image kept a relative `src` after the full asset loaded | the shipped `ProgressiveImage` stores `image.src` (browser-resolved absolute URL) in state, not the authored path | [ProgressiveImage.jsx](../rebuild/src/lib/ProgressiveImage.jsx) now reflects `image.src`; stub models the IDL getter |
| lazy grid rendered the wrong DOM in both states | the 1280x200 capture shows an unrevealed cell as `<span class="" style="display: inline-block;"></span>` and a revealed cell with its children hoisted into the parent | [LazyLoadComponent.jsx](../rebuild/src/lib/LazyLoadComponent.jsx); 6 tests in `tests/lazyGrid.test.jsx` |

## REA-native closure: what this host will not do

Two gates of the native pipeline cannot be satisfied here, and neither failure is a gap in the
rebuild:

* `verify_reconstruction` rejects every claim with `Comparison Evidence identity or authority
  disagrees`. The only path-based comparator, `compare_bundles`, stamps its output
  `authority: "analyst-inference"`, `confidence: "derived"`, `environment: null`; a settled
  scenario capture is `controlled-replay`/`observed` but is an observation, not a comparison.
  The comparators that would produce an authoritative per-artifact verdict
  (`compare_web_captures`) take the complete capture `normalized_result` objects inline, and a
  single one is ~66 KB, so they cannot be driven from this agent. Per-artifact equality is
  therefore established here by `compare-captures.js` over REA's own digests rather than by
  `verify_reconstruction`.
* `build_reconstruction_obligation_ledger` also takes the evidence bundle inline; the accepted
  input [ledger-input.json](../replacecover/ledger-input.json) carries 8 records, 23 obligations
  and 23 bindings (`missing-verifier: 23`, `weak-original-case-authority: 23`). Extending it with
  unit-test evidence is impossible on Windows: `capture_process_scenario` returns
  `capability_unavailable` - "Windows PTY process capture is unavailable… Use Linux (including
  WSL) or macOS" - so a vitest run cannot become REA evidence, and obligations that require
  `unit` fixture/verifier authority stay `blocked` for environmental reasons. Running the ledger
  and coverage evaluation to a `verified` status needs a Linux/WSL session.

`evaluate_reconstruction_coverage` is skipped by design: it requires verifier evidence REA
itself produced, and hand-authored digests would be fabrication.

## Local checks

```
node node_modules/vitest/vitest.mjs run   # 8 files, 106 tests, all passing
node node_modules/vite/bin/vite.js build  # dist/assets/index-Bif0bWKC.js 427.82 kB (gzip 120.92 kB)
                                          # dist/assets/index-DebeAjXK.css 32.05 kB (gzip 7.86 kB)
                                          # 4 Poppins woff2 + 4 woff, no typekit reference
```

Assets: 61 sticker PNGs plus 61 placeholders copied verbatim from the archived site, 7
favicon/PWA files, 2 thumbnails. Licensing of the sticker set and the original Typekit font is
the outstanding question before any public deployment.
