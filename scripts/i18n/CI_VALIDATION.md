# Pull request validation

`Build Check` uses `ci-plan.cjs` to select validation from the merge-base diff.
The required check keeps the same job name. The plan and measurements are
uploaded even when a later check fails.
Dependency installation uses `yarn --frozen-lockfile` so it cannot rewrite the
committed lockfile after source planning. Source snapshot checks remain enabled.

| Change | Validation |
| --- | --- |
| README, planning or review notes only | Configuration, move/link and workflow security checks; no dependency installation or site build |
| CI and tooling | Unit tests, five-language native compilation fixture and publishing/Apache/Chromium fixture |
| Shared UI, routing, SEO, localization or sidebars | Representative real documents in five languages and every active version; native content fixtures for content/locale implementations, publishing fixtures for delivery/host implementations |
| Documentation or assets | Changed documents and import dependants, plus representative real documents; English source changes select all five languages, localized changes select English and the affected locales |
| Dependencies, active versions or unclassified inputs | Full five-language publication build and verification |
| `ci/full` PR label or manual `validation=full` | Full five-language publication build and verification |

Manual `validation=sample` requests representative samples, but cannot downgrade
dependency/version changes or unknown inputs from full validation. Removing a
`ci/full` label runs the automatic policy again. Scheduled and manual deployment
workflows still build complete publication artifacts; this PR check never deploys.

## What a sample proves

The CI adapter first loads native Docusaurus metadata for **all documents and
all active versions**, including IDs, front matter, routes, sidebars, source and
translation state. Optional locales remain enabled during metadata collection.
It then removes unselected document modules from the generated route registry
before bundling and static rendering. Ordinary pages remain in the build.
When no blog body or blog translation state changed, blog articles and their
native lists/tags are sampled too. Blog metadata and logical link targets remain
complete. The production build does not load this adapter.

Every document plugin/version contributes its native main document and available
examples of MDX/imports, SQL, math and media/relative links. A greedy selection
reuses rich documents across requirements while keeping each version's entry.
Real translated bodies
and English fallbacks are sampled where available. Changed document bodies and
translation-state records are mandatory. Local MDX/JavaScript imports are followed
transitively when an imported file changes; dynamic or unparseable imports select
their owners conservatively. A selection above 500 documents fails with a request
for `ci/full`, rather than silently dropping affected documents.

The blog sample covers a recent article, lead/featured cards, MDX, code blocks and available real/fallback
bodies. Explicit changed imports and uncertain dependencies add their owners.
Lists, tags and neighboring-post links are rebuilt from selected articles before
the native route generator runs, so an aggregate cannot import every omitted body.
Edited blog bodies/state retain the complete native blog build.

Locale processes still run sequentially on one runner. During a sample build,
content-addressed Markdown structures and aligned headings are shared through a
fresh temporary directory owned by that build. Keys include all parser inputs;
translation decisions and route/verification results are always computed anew.
Only a bounded memory cache is retained, and it is released before bundling.
The cache is removed with the build stage, so cold builds need no external cache.

Links from rendered pages use the complete native route graph, generated redirect
aliases and existing static files. Anchors on rendered destinations receive the
normal Docusaurus check. Anchors on omitted destinations cannot be verified and
are counted explicitly. Unselected document bodies are not compiled, rendered or
checked for body syntax/anchors. Existing Docusaurus warning/error policies still
apply; sample success is not full-site compilation success.

Styles-only changes (`.css`, `.scss`, `.sass`) skip rendered link checking and
report `linkCheckMode=skipped-style-only`. Content, code, routes, redirects and
resource changes keep the normal path/anchor checks. The CI adapter indexes fixed
routes and reuses native matching results, including invalid paths, rather than
scanning tens of thousands of logical routes for every repeated bad link.

Selected pages receive HTML/canonical checks, managed-translation SEO checks and a
Chromium hydration smoke test per language. The separate publishing fixture tests
resource delivery, redirects, language 404s and optimized artifacts on a small site.
It does not claim to validate every real page's search/navigation behavior; that
coverage remains in full validation and deployment.

## Reports and publication boundary

- `.i18n-build/ci-plan.json`: source SHA, diff hash, changed files, selected mode,
  languages and active versions.
- `.i18n-build/ci-sample/scopes/<locale>.json`: complete metadata count, selected
  document routes with reasons, actual client/server MDX modules compiled,
  metadata loading time, parser-cache counts, blog selection and unverified anchor count.
- `.i18n-build/ci-sample/verification.json`: explicitly reports `mode=sample`,
  `completeDocumentCompilation=false` and `publicationAllowed=false`.
- `.i18n-build/ci-sampling-fixture-proof.json`: proves an omitted broken import
  does not compile, while editing the same document makes compilation fail.

Samples write only under `.i18n-build/ci-sample/`, never `build/`. Their root and
locale outputs carry `.ci-validation.json`; publication optimization and artifact
verification reject that marker. The workflow uploads reports, not the sampled
site. Locale builds also reject a changed source snapshot, preventing mixed-head
artifacts. The adapter is pinned to Docusaurus 3.6.3 and must be revalidated on an
upgrade.

The translation admission gate skips native inventory collection when no target
body or state changed for that language. Its output says `inventorySkipped=true`
and `freshness=null`; protection exceptions are still validated. Edited targets
and state continue through the original native registration and technical checks.

## Local commands

Commit the inputs to validate before planning, so the merge-base diff includes
new files and the evidence refers to a reproducible source snapshot.

```bash
yarn key-features:generate
node scripts/i18n/ci-plan.cjs <merge-base> --sample
DORIS_ENABLE_LOCALES=ja,ko,ru DORIS_OPTIMIZE_PUBLISH=false \
  node scripts/i18n/build-ci-sample.cjs
node scripts/i18n/verify-ci-sample.cjs
```

The verifier needs Playwright/Chromium, installed like the workflow; use
`--no-browser` only for a local static check. The fixture can be run independently
with `node scripts/i18n/verify-ci-sampling-fixture.cjs --browser`.
The CI Build step enables `DOCUSAURUS_PERF_LOGGER=true` to separately log native
plugin loading, bundler configuration/compilation, SSG, post-build hooks and links.

## Manual content impact and drift

`content-impact.cjs` compares both base and head registries/state. Independent English blog prose selects English and actual fallback consumers.
Shared page TSX/CSS/data still renders in translated bodies and selects every
dependent language. Existing
translations enter the manual-sync report. A locale dictionary change renders
that language, and changed manual-state identities render their affected locales
plus English. New/deleted source identities widen to all languages; unknown
dependencies keep the conservative existing policy. Documentation source changes
continue to select all possible fallback consumers and the affected versions.

The build-scope and CI plan share this proof. New shared language contracts/bootstrap inputs select representative real
builds and their applicable native/publishing fixtures, retaining the layered
policy introduced in #4497. The first-release T06–T09 PR uses `ci/full` for
five-language/all-active-version publication validation. Content-only state
edits with an exact proof keep scoped compilation. Partial compilation never claims full alternate reciprocity.
Planning-only changes still skip compilation, while malformed configuration fails
the required check. Fork PRs continue to receive read-only checkout permissions,
without deployment or model credentials.

`manual-report.cjs` runs before compilation and validates declared ready page
messages/digests, declared assets, shared messages and interpolation. It also
checks the actual embedded locale script against the three live frames; new
visible labels must have translations or an explicit technical-name exception. Missing content is allowed;
source drift produces manual work rather than model generation. After compilation,
`manual-report.cjs --coverage` reports native identities by language, family,
plugin and version. Counts separate routes, real translated bodies, English
fallback, stale translations and blocked decisions, retaining exclusions and
source/orphan reports. The JSON schema is version 1. Both reports are artifacts;
production also retains the native content manifests for public acceptance.

See `translations/SHARED_UI.md` for the shared-content inventory and
`translations/FIRST_RELEASE.md` for the candidate/public evidence boundary.
