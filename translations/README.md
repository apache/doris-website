# Documentation translation state

Japanese remains opt-in (`DORIS_ENABLE_JA=true`). Builds are static and never
contact a translation service. English and Chinese retain their existing native
content selection when Japanese is disabled.

`config.json` declares the source policy. English is the default. A
`sourceOverrides` entry identifies `pluginId`, `version`, `docId` and
`sourceLocale` (`en` or `zh-CN`). Overrides apply only to nodes registered by the
English docs plugin. A Chinese-only file is reported as
`unsupported_source_route`; setting an override does not create its route.

## State schema, version 1

`state/ja/docs.json` is the legacy shared ledger. New Japanese records can live
in independent files at `state/ja/pages/<pluginId>/<version>/<docId>.json`.
Each file contains `{"schemaVersion":1,"page":<record>}`. The loader combines
both locations; a page file supersedes a legacy entry with the same identity.
The path must match the record's native identity, so independent translation PRs
modify distinct state files. `state/ja/shards.schema.json` marks the repository
as ready for page files. Each record contains these fields:

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
node scripts/i18n/plan-translations.cjs --source-ref HEAD \
  --limit 20 --token-budget 50000 --output /tmp/japanese-plan.json
```

The source ref must match the checked-out source, routing files, Japanese state
and targets. The scanner fails on mismatches instead of counting a working-tree
candidate as merged coverage. It needs no model credential, network or GitHub
write permission. Without `--output`, JSON goes to stdout; a compact count goes
to stderr. `--locale ja`, `--plugin default`, `--version current` and
`--path docs/install/` filter visible tasks after the full recount. The limit
cannot exceed `translations/scope/ja.json`'s `maxBatchPages` (20). The token
budget uses an approximate source length of four characters per token, so a
generation tool must check its actual model budget again.

`counts` cover the full managed scope. `tasks` list pending work, while
`selected` holds the next eligible task IDs within the page and token limits.
Stable numeric IDs derive from the page identity, task kind and source hash;
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

Use `--active-candidates /path/to/open-prs.json`. A matching source hash marks
the task as active and removes it from `selected`, but does not add coverage.
A source change makes the PR candidate stale and requeues the page. The planner
does not query GitHub: a caller that wants complete PR deduplication must supply
all active candidate PRs, including manually opened T09 PRs.

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
node scripts/i18n/translate-docs.cjs --plan /tmp/japanese-plan.json \
  --task '<selected-task-id>' --stage-dir .i18n-build/translation-candidates
```

The first command produces a complete, read-only plan. The second produces
`manifest.json` and candidate Markdown/MDX only under `.i18n-build/`.
Review the candidate and manifest, then apply those **same bytes** without
another model call:

```bash
node scripts/i18n/translate-docs.cjs \
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
review are required before T08 enables automatic generation.

## Asynchronous Japanese discovery and generation

`.github/workflows/japanese-translation.yml` runs a read-only scan after
relevant master source pushes, each day, and on manual dispatch. It recounts
the current native Dev, 4.x and community documents, reads every open master
PR's changed files, and checks Japanese target files against that PR's state
records. Each run uploads `plan.json`, `coverage.json`,
`active-candidates.json` and `open-pr-reconciliation.json` and writes a short
job summary. Open PR candidates stay pending until merged. A changed source
hash makes an older PR candidate stale and queues the page again. A PR whose
candidate cannot be verified blocks that target from robot generation and
appears in the exception report.

Manual dispatch defaults to `dry-run` and accepts optional plugin, version and
source path filters. `validate` mode requires one exact English source path
ending in `.md` or `.mdx`; it can call the model and create a draft PR for one
page with a 30,000-token Codex usage budget while ongoing automation remains
disabled. It is the first live acceptance path after OSS model access is
available. With OSS access but no GitHub write credential, `validate` still
writes the candidate to the generation artifact and makes no GitHub write.
Pushes are checked against the current registered source
identities before any generation. The daily full scan recovers missed or
cancelled pushes. Japanese target or state-only commits do not trigger the
push listener. The workflow does not participate in website builds or release
deployment.

Ongoing generation stays off unless both repository variables
`I18N_AUTO_TRANSLATE_ENABLED=true` and `I18N_LIVE_VERIFIED=true` are set. The
workflow uses the same verified Codex CLI package and numbered ChatGPT auth
snapshots in OSS as the Apache Doris code-review runner. The repository's
`OSS_AK` and `OSS_SK` secrets must be able to read those objects and update the
selected auth snapshot if Codex refreshes it. `I18N_CODEX_MODEL` is optional
and defaults to `gpt-6-sol`. A direct OpenAI API key is not used by this
workflow; the separate T07 manual tool still supports the Responses API.
To open a draft PR, configure one GitHub write identity. The preferred App path
uses `I18N_GITHUB_APP_ID` and `I18N_GITHUB_APP_PRIVATE_KEY`; install the App on
`apache/doris-website` with repository Contents and Pull requests write
permissions. If an App cannot be installed, a maintainer with repository write
access can use a personal token in the `I18N_GITHUB_PAT` Actions secret. Grant
a fine-grained token access to this repository with Contents and Pull requests
write permissions, subject to organization token policy. A repository admin
must store the secret. The resulting commits and PR use that person's identity.
When both credentials are present, the App takes precedence. The workflow
does not use `GITHUB_TOKEN` to create PRs because those PR checks can require
manual approval. Set the enablement variables only after a one-page `validate`
run and its App- or PAT-created draft PR have passed the required checks.
Missing write credentials leave manual validation as an artifact-only run;
missing OSS credentials leave discovery available without model calls.

When enabled, one run processes at most two pages with a configured
60,000-token Codex usage budget. The planner separately uses a 20,000-token
estimate for source text selection. A local one-page, two-unit Codex probe
reported 19,009 tokens, so CLI usage must not be estimated from document
length alone. The Codex adapter constrains the final answer with a JSON
schema, rejects tool calls, checks reported token usage and rejects an overage.
It runs in an isolated temporary directory with read-only sandboxing and no
GitHub or OSS credentials in the model process. Refreshed auth is uploaded
only if its OSS source has not changed since download.
The generator calls the model once for exact Dev/4.x pairs whose doc ID,
relative source path and normalized source hash match. It writes two separate
state records. Human-owned or changed targets, moves, deletions and other
protected tasks stay in the manual queue. The robot opens a draft PR with
machine review status and never merges it. It keeps one active robot batch PR;
if its source becomes stale and its head still matches the robot's recorded
commit, the next run closes that stale draft and opens a fresh batch. A human
commit on the branch stops replacement and is reported for manual handling.
The PR body lists the source commit, source links, source hashes, model,
glossary version, failures and validation. The normal PR checks remain the
merge gate.

## Validation

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
