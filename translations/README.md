# Documentation translation state

A locale under translation stays opt-in. `DORIS_ENABLE_LOCALES` lists the ones a
build should serve, and a developer can switch a single one on with its own
`DORIS_ENABLE_<LANG>` flag instead. Both are read by `config/i18n.js`, which is
also where a new locale's code, label, `htmlLang` and opt-in state are declared;
`docusaurus.config.js` and the render path read that registry rather than naming
a language. Builds are static and never contact a translation service. English
and Chinese retain their existing native content selection when no managed locale
is enabled.

`config.json` declares the source policy for every managed locale. English is
the default source. A `sourceOverrides` entry identifies `pluginId`, `version`,
`docId` and `sourceLocale` (`en` or `zh-CN`). Overrides apply only to nodes
registered by the English docs plugin. A Chinese-only file is reported as
`unsupported_source_route`; setting an override does not create its route.
`searchContextLabels` maps a search context path (`docs/dev`, `docs/4.x`,
`community`) to the label that locale's search page shows; a locale without it
shows the raw context path.

The translation workflow's `validate` mode selects one exact source page for a
live check. Normal `generate` runs produce at most 10 target pages per batch,
including any reused Dev/4.x partner; the planner can consider up to 20 tasks.
Automated PRs receive the `translate-<locale>` repository label, such as
`translate-ja`. Create that label before enabling publication for a new locale.

Build Check installs dependencies and runs the i18n unit tests before the
translation gate. The gate checks source metadata and state without a site
build; the scoped website build and static-page verification run afterward.

## Russian documentation launch

Russian is an optional, docs-first locale. Enable it with `DORIS_ENABLE_RU=true`
or use `DORIS_ENABLE_LOCALES=ja,ko,ru` for all managed languages. The deployment
workflows explicitly enable all three; default local builds still serve English
and Chinese. Ordinary Russian pages link to English until individually registered.
Russian generation has a manual-only workflow, described below. Product landing
pages and a Russian generation schedule remain outside this launch.

The [initial Russian inventory](inventory/ru/2026-10-20/batches.md) records 1,674 Dev,
1,619 4.x and 51 community documents, excluding two drafts. Four launch samples
have independent state shards and machine review status. They have not received
human Russian proofreading. The historical baseline has zero merged translations;
use a fresh audit on merged master to report published coverage.

```bash
I18N_LOCALE=ru node scripts/i18n/audit-coverage.cjs --source-ref HEAD --output /tmp/ru-coverage.json
node scripts/i18n/verify-doc-navigation.cjs --site build --locale ru --manifest .i18n-build/manifests/ru.json
node scripts/i18n/verify-search.cjs --site build --locale ru --manifest .i18n-build/manifests/ru.json --source-locales en,zh-CN --themes
```

Russian search uses the English and Russian Lunr analyzers together so ASCII
identifiers survive trimming. Indexing and the UI worker boundary share
length-preserving punctuation and `ё`/`е` normalization. Case and representative
inflections are supported by the analyzers; this is not synonym expansion or
transliteration, and arbitrary Russian word forms are not guaranteed to match.
Displayed documents retain their original spelling and highlight positions.
Japanese and Korean keep their existing analyzer choices. The browser check
exercises actual workers and all three Russian contexts; local `--dev-only`
results cannot establish full-version validation.

Deployments retain `build:publish` and strict static verification of every enabled
managed locale before replacing the public artifact. Search changes select all
five locales and all active versions in Build Check. A successful PR check does
not establish deployment or public URL acceptance. After merge, verify the
production source/deploy SHAs, `/ru/docs/`, Dev/4.x samples and fallbacks,
`/ru/community/`, search, language/version switches, query/hash, mobile themes,
canonical/alternate links and noindex/sitemap behavior. To roll back public
Russian routes, remove only `DORIS_ENABLE_RU` from both deployment workflows and
rebuild through the existing process; retain source translations and state.

## Russian manual translation

`.github/workflows/russian-translation.yml` calls the existing
`translation-run.yml` with `locale: ru` and the `russian-translation` workspace.
It only accepts manual dispatch and defaults to `dry-run`, which discovers
pending work without calling a model. Japanese, Korean and Russian runs share
the whole-run `docs-translation` lock, including discovery and validation.
Japanese and Korean schedules keep their existing behavior.

The shared workflow runs only on Apache `master` and checks out `master` again
before generation. Merge the Russian configuration and workflow before running
these commands; dispatching an unmerged feature branch skips discovery.

```bash
gh workflow run russian-translation.yml --repo apache/doris-website --ref master -f mode=dry-run
gh workflow run russian-translation.yml --repo apache/doris-website --ref master \
  -f mode=validate -f path=community/how-to-contribute/how-to-share-blogs.md
gh workflow run russian-translation.yml --repo apache/doris-website --ref master \
  -f mode=generate \
  -f 'paths=["community/subscribe-mail-list.md","community/how-to-contribute/contribute-to-doris.mdx"]'
```

The latter two commands call the Codex provider when eligible pages and external
configuration are available, and can create regular PRs carrying `translate-ru`.
The paths above illustrate bounded selection; refresh the native plan and all
open master PRs before choosing a live sample or batch. `validate` requires one
exact source file. `generate` considers up to 20 planned targets and produces
up to 10 target pages, counting eligible Dev/4.x copies separately.

Russian uses its own scope, glossary, initial inventory and page state shards.
Offline fixtures verify Cyrillic prose, inflected glossary terms, MDX labels,
whole-document feedback, cross-version copies, open-PR exclusion and hash/human
ownership protection. Preferred Russian terms permit grammatical inflection;
technical identifiers still require preservation. Offline Codex process fixtures
do not establish live provider access or merged coverage. Generated pages keep
machine ownership and review status, with retry history and warnings available
for review. The workflow does not merge PRs or enable automatic Russian runs.

## Korean preview and inventory

Korean is registered as an optional documentation locale. Enable it locally with
`DORIS_ENABLE_KO=true`, or enable both managed languages with
`DORIS_ENABLE_LOCALES=ja,ko`. Production deployment enables both Japanese and Korean.
Korean ordinary pages use the existing English fallback.

The initial Korean native inventory is pinned to the merged source commit in
[inventory/ko/2026-10-18/summary.json](inventory/ko/2026-10-18/summary.json).
It covers Dev, 4.x and community documentation. Its four current PoC pages have
machine review status; the snapshot is a historical baseline rather than a
live coverage count. Category and domain labels live in the three matching
Korean plugin dictionaries; technical labels retained in English have explicit
per-key reasons in `scope/ko.json`.

Translation commands must select their locale explicitly now that both `ja`
and `ko` are configured, for example `I18N_LOCALE=ko`. The site build flags
select rendered languages; they do not select the translation pipeline locale.

## Korean toolchain and script-driven execution

Korean uses its own `scope/ko.json`, `glossary/ko.json`, inventory and page state.
Select the pipeline explicitly with `I18N_LOCALE=ko`; rendering flags do not
select a translation pipeline. A loop can recount and plan from the current
committed checkout without fixed batch registration:

```bash
I18N_LOCALE=ko node scripts/i18n/audit-coverage.cjs --source-ref HEAD --output /tmp/ko-coverage.json
I18N_LOCALE=ko node scripts/i18n/plan-translations.cjs --source-ref HEAD --limit 10 \
  --active-candidates /tmp/ko-active-candidates.json --output /tmp/ko-plan.json
```

The active-candidates file must come from the current open PR scan. A standalone
plan without it does not establish cross-PR deduplication. Replan after source,
target/state, HEAD or active PR changes; use the selected native task IDs rather
than historical inventory batch IDs. Reports on a local feature-branch commit
can include local candidates; merged coverage is recounted on merged master.
The loop is implemented separately in its own worktree.

The trusted-master Codex workflow translates whole documents or eligible changed
blocks, with at most three attempts and cumulative feedback. A third-attempt
candidate can retain content warnings: inspect `generation.acceptedWithWarnings`,
`generation.warnings` and `generation.history` before publication. This is a
review candidate, not a language/technical quality pass. Review status remains
machine until actual human proofreading.

The independent `translate-docs.cjs --provider openai` entry uses protected text
units and its own validation; it is not the Codex workflow. It stages live bytes
for explicit application. The locale selector also applies to that step:

```bash
I18N_LOCALE=ko node scripts/i18n/translate-docs.cjs \
  --apply-staged .i18n-build/<reviewed-stage> --plan /tmp/ko-plan.json
```

Application binds current HEAD, source bytes, reviewed target bytes, state and
ownership. Manual staging manifests use schema version 2 and freeze the original
target, effective state file and shard-layout marker hashes before generation.
Application refuses a newer matching target/state pair as well as inconsistent
edits. Regenerate older version-1 stages before applying them; page state and
Codex workflow artifact schemas remain version 1.

Korean starts with the page-record marker and writes independent
shards. Legacy records remain readable and existing shards retain precedence.
Human-owned targets, edited target/state bytes, path drift and symlinks require
review. Dev/4.x reuse requires the same doc ID, relative filename and full source
hash; an existing partner is updated against its own baseline, not overwritten
by a copy. Each reused target still receives its own link/state admission checks.

Generation and admission retain visible front matter and keyword entries, and
check any declared `language` against the target locale. These checks leave the
existing source/technical hash algorithms unchanged. Offline Korean fixtures
exercise these boundaries without real credentials or model calls; actual
single-page generation is a separate validation step.

The `Korean translation discovery` workflow runs at 04:43 and 16:43 UTC daily
and on manual dispatch. Like the Japanese workflow, it calls the shared
`.github/workflows/translation-run.yml`, here with the locale fixed to `ko` and
its own `korean-translation-*` artifacts; both workflows hold the same
`docs-translation` lock. The schedule starts twenty minutes after the Japanese
one, so a Korean run waits while a Japanese run is still in progress. A scheduled run generates a
batch when eligible Korean documents are pending, with the same limits as a
manual `generate` run: the planner considers at most 20 targets and a batch has
at most 10 pages. It opens a normal labeled PR that maintainers review and merge
like any other; nothing is merged automatically. With nothing pending, a
scheduled run only scans and makes no model call. Manual dispatch defaults to a
read-only dry run. To run discovery on master:

```bash
gh workflow run korean-translation.yml --repo apache/doris-website --ref master -f mode=dry-run
```

For a bounded real validation, select one eligible English file from the plan
and provide its exact repository-relative `.md` or `.mdx` path with
`-f mode=validate -f path=<exact-source-file>`. Validation sets the page limit
to one and rechecks active PRs before calling Codex. Generation checks the
`translate-ko` label before loading auth, then uses the existing verified
runtime and auth pool. A write credential enables a normal labeled PR after
shared admission checks; otherwise a successful one-page validation remains
an artifact and does not establish the PR publication path. Inspect generation
warnings and normal PR checks before merging.

## Search, navigation and four-language validation

`check-configuration.cjs --all` validates each managed locale's scope and glossary
without loading Docusaurus, an inventory or a model. Build Check runs it even
for scope/glossary-only changes. The Korean coverage workflow is read-only and
reports pending translations without blocking an English source change merely
because Korean content is missing.

The navigation and browser search checks accept `--locale ja` or `--locale ko`.
They read the current build's translation manifest; the inventory is a historical
comparison, not a route allowlist. Generated inventory batch IDs are historical
metadata, and execution batches are selected dynamically.

```bash
node scripts/i18n/verify-doc-navigation.cjs --site build --locale ko \
  --manifest .i18n-build/manifests/ko.json --dev-only
node scripts/i18n/verify-search.cjs --site build --locale ko \
  --manifest .i18n-build/manifests/ko.json --dev-only \
  --source-locales en,zh-CN --themes --output /tmp/korean-search-check.json
```

These commands require a build made with Korean enabled. Local website builds
use `DOCS_VERSIONS=current`; `--dev-only` records that 4.x was not built. Complete
CI validation omits both flags and builds all four locales with `build:publish`,
then verifies the shared resources, native routes, contexts and browser workers.
Build and browser measurements are retained as the publish artifact measurements.
Playwright/Chromium are installed in a separate tools directory in CI; local
checks can use the same approach and set `NODE_PATH` to that directory's
`node_modules`.

SearchBar and SearchPage derive source-language index locations from the actual
native version metadata. The native last version uses the locale root; other
versions use their registered paths. This also works when a scoped build makes
Dev the last version. Managed locales keep their own three context indexes at
the locale root, including empty contexts; the empty root index is not a duplicate
union. Korean verification covers Hangul, SQL, identifiers, IME composition,
no-results/source links, mobile layout and every registered brand theme, including
the embedded animation's theme-token bridge.

## State schema, version 1

`state/ja/docs.json` is the legacy shared ledger. New Japanese records can live
in independent files at `state/ja/pages/<pluginId>/<version>/<docId>.json`.
Each file contains `{"schemaVersion":1,"page":<record>}`. The loader combines
both locations; a page file supersedes a legacy entry with the same identity.
The path must match the record's native identity, so independent translation PRs
modify distinct state files. `state/ja/shards.schema.json` marks the repository
as ready for page files. The manual and automated translation tools read the
same merged state as the site, with page files taking precedence over legacy
entries. Once the marker is present, updates and new translations write their
own page files and leave the legacy ledger unchanged. Repositories without the
marker retain legacy writes, while existing page files are always updated in
place. Generation records the exact state path for each candidate so publication
can stage only its translation and corresponding state. Before applying a batch,
the tools check the original target and state bytes and reject concurrent edits;
a failed write rolls back all files already written by that batch.

Each record contains these fields:

| Field | Meaning |
| --- | --- |
| `pluginId`, `version`, `docId`, `locale` | Identity from the native docs plugin. `current` is a version identity; its route is `/docs/dev/`. Identical IDs in other plugins or versions are separate pages. |
| `sourceLocale`, `sourcePath` | The selected fact source and its repository-relative filename. |
| `sourceCommit` | Full Git commit at which the translation source was recorded. Freshness uses hashes, not commit ancestry. |
| `sourceHash` | SHA-256 of the entire source file, normalizing only CRLF to LF. Includes code, MDX, front matter, headings and whitespace. No timestamp field is silently discarded. |
| `sourceTechnicalHash` | SHA-256 of the conservative structural projection described below. Used only as an additional guard for an explicit prose exception. |
| `targetPath`, `targetHash` | Repository-relative translation filename and the same full-file SHA-256 rule. These refer to committed content, before temporary heading alignment. |
| `reviewStatus` | `machine`, `human` or `unverified`. Identifies the review of the recorded target, independently of freshness. `human` must be set only after actual human proofreading. |
| `ownership` | `machine` or `human`. Records who maintains the target; a changed target hash always prevents automatic selection, regardless of ownership. |
| `translatedAt` | ISO-8601 translation time. Displayed separately from the source's content-update date. |
| `glossaryVersion` | Terminology revision, initially `"0"`. |
| `safeSourceChange` | Optional human-reviewed prose exception, bound to the exact revisions below. |

The initial PoC records keep `reviewStatus: machine`. Reviewing a PR is not
assumed to mean that a human has proofread its Japanese translation.

### Freshness and content selection

Missing targets use the framework's per-file English fallback. Targets without a
record, with conflicting identity, or with a changed target hash also display
English with an explicit unverified notice. Valid records with matching source
and target hashes display Japanese. Unverified records remain excluded from
indexing even when their hashes match.

A changed source displays its latest original unless a reviewer adds:

```json
{
  "safeSourceChange": {
    "kind": "prose",
    "fromSourceHash": "<recorded sourceHash>",
    "toSourceHash": "<current sourceHash>",
    "targetHash": "<unchanged targetHash>",
    "reviewedBy": "<reviewer>",
    "reviewedAt": "<ISO-8601 time>"
  }
}
```

This exception retains Japanese with a stale notice and excludes it from
indexing. A changed technical projection overrides the exception. The projection
includes code blocks and their options, inline code, numbers, link destinations,
heading IDs/order/depth, raw HTML, MDX imports, expressions and component
attributes, and all front matter except `title`, `description` and
`sidebar_label`. AST positions are excluded. Equal projections alone do **not**
prove a change is prose: a parameter name in plain text could have changed, so
an explicit human decision is still required. Unsupported parsing cannot approve
an exception and conservatively selects English.

For an explicit Chinese source, the registered English identity and slug must
remain valid. Its Chinese original must exist and match that identity/slug;
otherwise the build reports a source problem and displays English. Japanese
heading IDs still follow the current English page.

Untranslated and unsafe pages always use the native English fallback, including
pages configured with a Chinese translation source. That setting controls the
translation's freshness and source-update time; its Chinese original remains
available through a separate link. Fallback body, assets and relative imports
come from the registered English node without mixing localization directories.

### Build adapter and SEO

`scripts/i18n/docs-plugin.cjs` wraps Docusaurus 3.6.3's native docs plugin, retaining
its name, option validation, version parsing, sidebar generation and routes. For
Japanese only, it copies localized inputs into the ignored
`.i18n-build/ja/docusaurus-plugin-content-docs[-<pluginId>]/` tree. Its depth
matches the committed localization tree, preserving project-relative MDX
imports. It aligns usable translations' heading IDs
with the native English heading transform. It omits unsafe targets so the
framework selects English. Committed translations are neither overwritten nor
deleted. Source deletion removes the route through native enumeration; orphan
targets and stale records appear in the report.

Relative Markdown links resolve through aliases for both the source and the
temporary view, including links between Japanese and English fallback pages.
Content reloads recompute hashes. Simultaneous builds of the same locale in one
checkout are unsupported; use separate worktrees.

The adapter emits actual framework permalinks and state into each doc's metadata.
The UI, body `lang`, `noindex`, canonical URL and alternate eligibility use that
state. Fallback pages canonicalize to their registered English node. Stale Japanese keeps
its Japanese canonical URL but is `noindex`. Native sitemap and local-search
parsers honor `noindex`; the single `SiteMetadata` alternate emitter excludes
Japanese for those pages. Current translations receive reciprocal en/zh-CN/ja
links, using actual localized slugs.

The source parser's explicit date, history map or Git history supplies content
update metadata. The temporary file's creation time and translation commit do
not replace it. Generated route/state reports are written to
`.i18n-build/manifests/<build-locale>.json`; they are not published as site pages.

## First-delivery scope

The candidate scope covers all formal Dev, 4.x and community documents. See
[scope configuration and snapshot instructions](scope/README.md) and the
[initial complete batch ledger](inventory/ja/2026-10-12/batches.md). Scope limits
translation candidates, not the native website build or existing fallback routes.

## Offline Japanese task planner

The planner recounts the native Dev, 4.x and community pages at the checked-out
commit. The 2026-10-12 inventory is only a comparison baseline. New registered
pages enter the plan even when they have never appeared in that inventory.

```bash
I18N_LOCALE=ja node scripts/i18n/plan-translations.cjs --source-ref HEAD \
  --limit 20 --output /tmp/japanese-plan.json
```

The source ref must match the checked-out source, routing files, Japanese state
and targets. The scanner fails on mismatches instead of counting a working-tree
candidate as merged coverage. It needs no model credential, network or GitHub
write permission. Without `--output`, JSON goes to stdout; a compact count goes
to stderr. `--locale ja`, `--plugin default`, `--version current` and
`--path docs/install/` filter visible tasks after the full recount. The limit
cannot exceed `translations/scope/ja.json`'s `maxBatchPages` (20). The optional
`--token-budget` applies only to an explicitly bounded manual planning run;
the T08 workflow does not set a token budget.

`counts` cover the full managed scope. `tasks` list pending work, while
`selected` holds the next eligible task IDs within the page limit and any
explicitly requested manual token limit. Stable numeric IDs derive from the
page identity, task kind and source hash;
they do not renumber existing T09 batches. Updates, deletion and moves precede
historical backlog. Formatting-only changes still require review of the exact
new source hash. Target edits, invalid state, missing sources and unsupported
routes are reported as protected tasks and never enter `selected`. Move tasks
include old/new paths and a reference checklist; `reuseTarget` is true only
when the old target's content hash matches its recorded hash. No plan changes
translation state or declares a page translated.

To avoid assigning work already in an open human or bot PR, pass a local JSON
file with the reviewed PR candidates:

```json
{
  "schemaVersion": 1,
  "candidates": [
    {
      "pluginId": "default",
      "version": "current",
      "docId": "getting-started/what-is-apache-doris",
      "locale": "ja",
      "sourcePath": "docs/getting-started/what-is-apache-doris.md",
      "sourceHash": "<64 lowercase hex digits>",
      "pr": "#1234"
    }
  ]
}
```

Use `--active-candidates /path/to/open-prs.json`. An open candidate reserves its
document identity and removes it from `selected`, but does not add coverage.
A changed source hash or path reports a stale candidate and keeps the document
reserved until the PR is merged or closed. The input may also include a
`blockedTargets` array; those paths are excluded before the batch limit is
applied. The planner does not query GitHub: a caller that wants complete PR
deduplication must supply all active candidate PRs, including manually opened
T09 PRs.

The plan also reports `zh_only_change` exceptions when a committed Chinese
counterpart changed since the T03 baseline while its English fact source did
not. These are consistency checks, never Japanese translation candidates.

After a deletion cleanup PR has removed or checked the Japanese target, state,
links, sidebars and redirects, record the completed task in
`state/ja/resolved-deletions.json` with its ID, source hash, source path,
`reviewedBy`, ISO `resolvedAt` and PR `evidence`. This separate schema 1 ledger
prevents the fixed T03 baseline from reopening an already reviewed deletion.
The live docs adapter reads the combined legacy and page-file state. A
reintroduced page returns to normal native enumeration.

## Choosing the locale a pipeline run works on

The translation pipeline works on one locale per run. `scripts/i18n/state.cjs`
exposes `pipelineLocale(root)`: a configuration that declares a single locale
needs no selector and behaves exactly as before, and `I18N_LOCALE` picks one as
soon as several are managed. An absent or unconfigured selector then fails
before discovery or generation. The Japanese coverage audit always
selects `ja`. The language workflows accept no locale input: Japanese passes
`ja`, Korean `ko`, and Russian `ru` to the shared run.

Build Check runs PR admission for every configured translation locale, including
locales disabled for the site build, when a shared input changes. Otherwise it
runs only the locales whose own translation inputs changed, so a Korean-only PR
does not pay for the Japanese inventory load and an English-only docs PR skips
both admission gates. The selection lives in the `Translation gate for changed
locales` step of `.github/workflows/build-check.yml`; shared inputs are
`scripts/i18n/`, `translations/config.json`, `config/i18n.js`,
`docusaurus.config.js`, `versions.json`, the site sidebars, and
`versioned_sidebars/`.

Without `--all`, `managed-locales.cjs` lists only enabled managed locales for
publication checks. The publisher passes its selected locale to PR admission.
Native inventory returns only that selected locale's pages and reports, plus
repository-wide reports and all configured plugin/version metadata. SEO groups
merge indexable translations by native plugin, version and doc ID, preserving
actual source-language slugs and excluding stale or disabled translations.

Run the offline native-metadata regression with
`node --test scripts/i18n/__tests__/multi-locale.test.cjs`. For small real builds
with both managed locales and with Korean disabled, run
`node scripts/i18n/verify-multi-locale-fixture.cjs`; add `--browser` when
Playwright and Chromium are installed. These fixtures use their own minimal
locale registration and do not enable a production deployment.

Each locale also declares, in `translations/config.json`:

- `languageName` — the language's English name, which the pipeline weaves into
  the model prompt, the bot identity, the automation branch prefix, the PR
  ownership marker and the generated titles. It stays declared rather than
  derived, because changing it orphans every branch and open PR already in
  flight; see `scripts/i18n/automation-naming.cjs`.
- `scriptPattern` — the script a finished translation must contain. A model that
  answers in the source language is rejected instead of published.

## Manual Japanese translation candidates

`scripts/i18n/translate-docs.cjs` consumes **selected** task IDs from a T06
plan for the checked-out HEAD. It handles new and source-updated Dev, 4.x and
community documents. Deletions, moves, formatting review, conflicting state and
human-edited targets remain manual cleanup tasks. The website build never calls
the model. The generator has no GitHub access and does not create a PR.

The live provider is the [OpenAI Responses API](https://developers.openai.com/api/reference/resources/responses/methods/create)
with [structured JSON output](https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=responses).
Set `OPENAI_API_KEY` and an explicit `I18N_MODEL` model identifier in the shell.
There is no fallback model. Each request has a 120-second timeout, a 30,000
estimated input-token cap, a 6,000 output-token cap, one retry for transient
transport/server failures, and a 50,000 actual-token batch cap by default.
Limits are configurable with `--timeout-ms`, `--max-input-tokens`,
`--max-output-tokens`, `--token-budget`, `--max-document-chars` and
`--max-chunk-chars`. The character-to-token estimate is conservative routing,
not a tokenizer; the returned API usage is checked against the batch cap.
The tool processes one task at a time and at most 20 explicit IDs per invocation.

```bash
node scripts/i18n/plan-translations.cjs --source-ref HEAD \
  --output /tmp/japanese-plan.json
export OPENAI_API_KEY='<secret>'
export I18N_MODEL='<explicit-model-id>'
I18N_LOCALE=ja node scripts/i18n/translate-docs.cjs --plan /tmp/japanese-plan.json \
  --task '<selected-task-id>' --stage-dir .i18n-build/translation-candidates
```

The first command produces a complete, read-only plan. The second produces
`manifest.json` and candidate Markdown/MDX only under `.i18n-build/`.
Review the candidate and manifest, then apply those **same bytes** without
another model call:

```bash
I18N_LOCALE=ja node scripts/i18n/translate-docs.cjs \
  --apply-staged .i18n-build/translation-candidates \
  --plan /tmp/japanese-plan.json
```

The apply step rechecks HEAD, source/target hashes, managed paths, code, links,
numbers, MDX, headings and state identity. It refuses an existing target whose
recorded hash changed. Live generation also requires at least one changed text
unit containing Japanese characters. A failure leaves managed targets and state untouched;
successful output has `reviewStatus: machine` and must be reviewed in a normal
translation PR. Do not mark it `human` without actual Japanese proofreading.
Translation candidates are not counted as merged coverage until that PR merges.

The tool sends the full source document as context for each bounded group of
translatable text units. It extracts visible Markdown text, simple front matter
scalars and keyword lists, image alt text and allowlisted MDX/HTML attributes.
SQL, code, inline code, link targets, import/expressions, routes and other
technical content are reconstructed from the source, never accepted from model
output. Number and explicit-anchor placeholders must survive unchanged. Long
documents are grouped around section boundaries; unchanged units may be reused
from a target only when its recorded hash and historical source hash still match.
Complex unsupported front matter or an overlong unit fails safely for manual
handling. The [Japanese glossary](glossary/ja.json) has a version stored in each
new state record; product names in text units are checked after generation.

For offline tests, `--provider mock --mock-file <json>` maps each masked unit
text to a replacement string and stages a fixture candidate. Mock output cannot
be applied to managed translation files. The offline fixture does not establish
live model quality, latency, cost or availability. A real limited call and
review are recommended before running batch generation.

## Asynchronous discovery and generation

`.github/workflows/japanese-translation.yml` runs at 04:23 and 16:23 UTC daily
and on manual dispatch; `.github/workflows/korean-translation.yml` runs twenty
minutes later. Each sets only its triggers, manual defaults and the lock, then
calls `.github/workflows/translation-run.yml` with its locale and artifact
prefix. The manual-only Russian wrapper uses the same steps and lock. None has
a push trigger. The description below uses Japanese; the other languages differ
in locale, label, artifact names, triggers and manual default. Every run first recounts
the current native Dev, 4.x and community documents, reads every open master
PR's changed files, and checks Japanese target files against that PR's state
records. Each run uploads `plan.json`, `coverage.json`,
`active-candidates.json` and `open-pr-reconciliation.json` and writes a short
job summary. Open PR candidates stay pending until merged. A changed source
hash makes an older PR candidate stale, but that document remains reserved
until its PR is merged or closed. The workflow reports it for maintainer
attention and neither closes nor overwrites the existing PR. A PR whose
candidate cannot be verified blocks that target from robot generation and
appears in the exception report.

Japanese manual dispatch defaults to `generate` (Korean and Russian to `dry-run`) and
accepts optional plugin, version and source path prefix filters, or an exact
`paths` list. `validate` mode requires one exact English source path
ending in `.md` or `.mdx`; it can call the model and create a regular PR for one
page. It provides a single-page live check after OSS model access is available.
With OSS access but no GitHub write credential, `validate` still writes the
candidate to the generation artifact and makes no GitHub write.
`dry-run` remains available for read-only discovery. Full scans recover
pending work from new or changed source documents and earlier failed runs.
One concurrency group, `docs-translation`, covers all three language workflows, every
trigger and every mode. Rename it only while no translation run is queued or
running; otherwise the run in flight and the next one hold different locks.
Only one complete run can execute at a time; `cancel-in-progress: false`
preserves it when another run is requested. `queue: max` lets up to 100
pending runs wait instead of replacing the previous pending run; see
[GitHub's concurrency documentation](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency).
Each queued run takes a fresh master checkout and recounts pending documents.
The generation job checks out master again instead of the discovery commit,
because it can wait for a runner long after discovery, then reconciles open PRs
and replans. When master and the open-PR reservations are unchanged since
discovery, it reuses the discovery plan instead of recounting every native
document. Translation PR merges do not trigger this workflow. It does not participate in website
builds or release deployment.

The mode controls generation directly: manual `generate` runs and scheduled
runs generate batches when eligible documents are pending, while `dry-run`
only scans. No repository enablement variables are required. The workflow
uses the same verified Codex CLI package and numbered ChatGPT auth
snapshots in OSS as the Apache Doris code-review runner. The repository's
`OSS_AK` and `OSS_SK` secrets must be able to read those objects and update the
selected auth snapshot if Codex refreshes it. `I18N_CODEX_MODEL` is optional
and defaults to `gpt-6-sol`, with `xhigh` reasoning effort. A direct OpenAI API
key is not used by this workflow; the separate T07 manual tool still supports
the Responses API.
To open a PR, configure one GitHub write identity. The preferred App path
uses `I18N_GITHUB_APP_ID` and `I18N_GITHUB_APP_PRIVATE_KEY`; install the App on
`apache/doris-website` with repository Contents and Pull requests write
permissions. If an App cannot be installed, a maintainer with repository write
access can use a personal token in the `I18N_GITHUB_PAT` Actions secret. Grant
a fine-grained token access to this repository with Contents and Pull requests
write permissions, subject to organization token policy. A repository admin
must store the secret. The resulting commits and PR use that person's identity.
When both credentials are present, the App takes precedence. The workflow
does not use `GITHUB_TOKEN` to create PRs because those PR checks can require
manual approval. Use a one-page `validate` run to check model access and the
App- or PAT-created PR before running a full batch.
Missing write credentials leave manual validation as an artifact-only run;
missing OSS credentials leave discovery available without model calls.

In `generate` mode, one run produces at most 10 target page candidates. The T08 planner
and Codex adapter do not reject work based on an estimated or accumulated
token allowance. The adapter still records actual usage for the run summary.
Each model request translates one complete Markdown/MDX document. The automated
workflow has no document-length or chunk-size limit and does not reuse individual
text units. Each request has a ten-minute timeout; the generation job has a
120-minute timeout. The model's own context and output limits still apply.
The adapter constrains the final answer with a JSON schema,
rejects tool calls and checks that Codex reports token usage.
It runs in an isolated temporary directory with read-only sandboxing and no
GitHub or OSS credentials in the model process. Refreshed auth is uploaded
only if its OSS source has not changed since download.
The generator calls the model once for exact Dev/4.x pairs whose doc ID,
relative source path and normalized source hash match. It writes two separate
state records. Human-owned or changed targets, moves, deletions and other
protected tasks stay in the manual queue. The robot opens a regular PR with
machine review status and the `translate-ja` label, and never merges it. The
run checks that the label exists before loading Codex auth, because the
publisher applies it only after the model calls and the branch push.
Maintainers review and merge PRs when ready. Multiple batches can remain open:
their documents are excluded, while unrelated pending documents can form the
next batch. This exclusion includes stale candidates and manually edited
branches; unresolved target/state records block their targets before the
planner applies its batch limit. Generation rechecks PR reservations for both
primary and reused Dev/4.x targets. Each batch writes separate page state
shards where enabled, so different documents do not rewrite a shared ledger.
The PR body lists the source commit, source links, source hashes, model,
glossary version, failures and validation. The normal PR checks remain the
merge gate.

Each document gets at most three total attempts. A retry receives the validation
errors from all earlier attempts, including details of changed protected content
and broken internal links. Checks match product names as complete Latin words,
case-insensitively, and permit localized prose-number formatting. Code, links,
component attributes, technical metadata and heading IDs remain checked.
MDX compilation follows Docusaurus by removing front matter first.

If the third response still has content issues, the generator keeps that response
as a candidate with warnings. The state record binds its attempt history and
warnings to the exact source and target hashes. The PR translation gate recognizes
that recorded fallback, and the PR body lists its warnings for review. Three
requests that return no usable document remain an operational failure.

Master usually moves while a batch waits for a runner or for the model.
Generation checks it before the first model call, before each page and after the
last one, and the publisher checks it again before pushing
(`scripts/i18n/master-drift.cjs`). A merge that touches none of the batch's files
leaves the batch valid: the PR branch stays on the source commit, the PR body
notes the newer master, and the normal PR checks run against current master. A
merge that changes a batch page's English source, target or state shard drops
that page, which stays pending for the next run; the publisher stops instead.
A merge that changes translation configuration, routing identity or the
pipeline itself discards the batch before any further model call: the
locale's scope, glossary, protection exceptions, inventory or top-level state
files, `translations/config.json`, `config/i18n.js`, `docusaurus.config.js`,
`versions.json` or `scripts/i18n/`. So does a master that no longer contains
the source commit.

Before pushing, the publisher runs `scripts/i18n/pr-preflight.cjs`, the same entry
point used by the PR build workflow. It checks translation state, Markdown/MDX
syntax and internal links using the PR link checker's resolver. Invalid syntax
or broken links block publication even when the generator retained the third
response. The full production build and human proofreading remain required
before merging.

### Local T08 simulation

From a checkout with dependencies installed, run:

```bash
node scripts/i18n/simulate-workflow.cjs /tmp/doris-ja-workflow-sim

# Retain all ten third-attempt candidates with warnings.
I18N_SIM_PAGES=10 I18N_SIM_SCENARIO=fallback \
  node scripts/i18n/simulate-workflow.cjs /tmp/doris-ja-ten-page-sim

# Translate a real page exceeding the former 60,000-character limit in one request.
I18N_SIM_SOURCE_PATH=docs/admin-manual/config/be-config.md I18N_SIM_SCENARIO=success \
  node scripts/i18n/simulate-workflow.cjs /tmp/doris-ja-long-page-sim

# A merge lands on master after discovery: unrelated, to the selected page,
# or to the Japanese glossary.
I18N_SIM_MASTER_DRIFT=unrelated node scripts/i18n/simulate-workflow.cjs /tmp/doris-ja-drift-sim
```

The output directory must be empty. The simulator copies the current scripts,
including uncommitted edits, into a disposable clone. For a single page, it makes
the selected Dev source pending only in that clone. Ten-page runs add isolated
source fixtures there. Real open-PR reconciliation and full planning run against
a GitHub CLI mock, followed by the production engine and a schema-shaped Codex
mock. `I18N_SIM_SCENARIO` accepts `success` (one attempt), `retry` (two attempts,
the default), or `fallback` (three attempts retained with warnings).
`I18N_SIM_MASTER_DRIFT` pushes one more commit to the local remote after
discovery: `unrelated` publishes normally and records the newer master in the PR
body, `page` skips the selected page without a model request, and `config` stops
the batch before any model request.

The simulator also verifies three empty responses, token accounting, the shared
PR admission checks, and publication of only managed Japanese targets/state to
a local bare Git repository. Each local step has a 20-minute timeout for the
full native scan. `report.json` and step logs remain in the output directory.
No real model call or GitHub write occurs.

## Validation

### Selecting an exact manual batch

All three language workflows take an optional `paths` input on manual dispatch.
It accepts a JSON array of 1–20 exact English source files, so a bounded
batch can select documents from different folders without including every page
under a shared prefix:

```bash
gh workflow run korean-translation.yml --repo apache/doris-website --ref master \
  -f mode=dry-run \
  -f 'paths=["community/subscribe-mail-list.md","community/how-to-contribute/contribute-to-doris.mdx"]'
```

Use `paths` or the existing `path` prefix, not both. The same list is used in the
fresh scan immediately before generation. `validate` still requires one exact
`path`; use `generate` for a regular batch. The planner considers at most 20
targets and generation still produces at most 10. Exact selection preserves
full coverage counts, current-page and active-PR exclusion, human ownership,
scope/version checks, and protection against relevant master changes. Unknown, duplicate,
malformed or out-of-scope source paths fail before model calls. Scheduled runs
do not use this input; they plan from the full scope.

The planner CLI exposes the same filter as `--paths '<JSON array>'`.

### Validation commands

```bash
node --test scripts/i18n/__tests__/*.test.cjs scripts/i18n/poc/*.test.cjs
node scripts/i18n/verify-fixture.cjs
DORIS_ENABLE_JA=true DOCS_VERSIONS=current DORIS_ASSET_ORIGIN='' \
  yarn build:locales
node scripts/i18n/verify-static.cjs --site build \
  --manifest .i18n-build/manifests/ja.json
```

The fixture builds a small real three-language site, covering stale SQL, unknown
changes, approved prose, manual target edits, source deletion, unsupported
Chinese-only nodes, independent versions/plugins, links and source timestamps.
Full active-version and memory validation runs in the read-only Japanese CI
workflow. Local website builds use only `DOCS_VERSIONS=current`.
