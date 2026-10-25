# Product-page translation verification

The seven product pages use the global content identity, navigation and fallback
contract. Their existing Japanese, Korean and Russian translations are reused;
page components are shared across languages. Chinese keeps its language URL and
navigation while displaying the complete English body, with English canonical
and `noindex`, as declared by `pages/registry.json`.

| Identity | English route |
| --- | --- |
| P02 | `/why-doris/compare/` |
| P03 | `/why-doris/benchmarks/` |
| P04 | `/why-doris/key-features/` |
| P06 | `/use-cases/customer-facing-analytics/` |
| P07 | `/use-cases/data-warehousing/` |
| P08 | `/use-cases/observability/` |
| P09 | `/use-cases/ai/` |

`pages/state.json` records the published source and target dependencies. A
`machine` review records machine review and checks; it does not assert human
language proofreading. Preserve the previous publication digests when source
changes need review. Run the manual drift report before publishing an update:

```bash
yarn key-features:generate
node scripts/i18n/manual-report.cjs
```

The product-page verifier consumes the native manifests and a real build. It
checks five language routes, SSR metadata, Chinese fallback, sitemap inclusion,
page links, 1440/390 layouts under all eight brand themes, SVG text bounds,
keyboard menus, language switching with query/hash, comparison tabs and cases,
benchmark tabs/details, feature search and clearing, and use-case expansion.
Key Features is enumerated from the actual generator inputs: the initial T10
review has 47 cards. Each card's title and visible description are compared with
the document body selected by the native manifest, including its state and
review identity. A front-matter-only file cannot satisfy this check.

```bash
NODE_PATH=/path/to/playwright/node_modules \
node scripts/i18n/verify-product-pages.cjs \
  --site /absolute/path/to/site \
  --manifests /absolute/path/to/content-manifests \
  --output .i18n-build/product-pages.json
```

The default check requires current, reviewed Japanese/Korean/Russian documents
behind every card. `--allow-document-fallback` is an explicit baseline-audit
option. Its report retains every document gap and sets `contentComplete: false`;
such a run cannot close the content task. It does not change page publication or
silently remove a card from the denominator.

To verify a production release, download that run's complete site artifact and
native manifests, confirm its source/asf-site identities, and add
`--origin https://doris.apache.org`. Public mode compares every product HTML
response and requested compiled/media resource with that artifact. Resource
lookup follows the artifact's own optimized redirect and asset-prefix mappings.
The five manifests must have the same source. A partial CI build cannot establish
public acceptance; the site and its publication identity must be verified first.

The October 25, 2026 baseline reuses production source
`e083e9d28695878be58f6e69aeb8f8b6106bd448` from
[run 40140944703](https://github.com/apache/doris-website/actions/runs/40140944703).
Its seven page bodies, dictionaries, media and generated cards are unchanged at
T10 baseline `2faa3720f5e2725b04113197b0120e598e25f529`. There are 884 reachable
body messages per target language. The older 885-key marketing dictionaries
also contain the legacy `marketing.pageLanguage` label, which the global
language entry has replaced. Official names, technical terms, units and
placeholder-only templates retain their intended spelling.

Two document dependencies remain separate from the existing page translations:
the renamed Changelog / Table Stream documents in Japanese and Korean. Korean
current/4.x candidates already belong to
[#4501](https://github.com/apache/doris-website/pull/4501); Japanese current/4.x
generation is restricted to those exact source files in
[run 40153250578](https://github.com/apache/doris-website/actions/runs/40153250578).
Use the normal complete-document translation and review flow. Do not duplicate
active candidates or create metadata stubs. After those changes merge, regenerate
cards, review the resulting P04 source drift and repeat the default verifier and
production acceptance before declaring all 21 translated page units complete.
