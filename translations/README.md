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

`state/ja/docs.json` stores a `schemaVersion` and a `pages` array. Each record
contains these fields:

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
an exception and conservatively selects the original.

For an explicit Chinese source, the registered English identity and slug must
remain valid. Its Chinese original must exist and match that identity/slug;
otherwise the build reports a source problem and displays English. Japanese
heading IDs still follow the current English page.

### Build adapter and SEO

`scripts/i18n/docs-plugin.cjs` wraps Docusaurus 3.6.3's native docs plugin, retaining
its name, option validation, version parsing, sidebar generation and routes. For
Japanese only, it copies localized inputs into the ignored
`.i18n-build/views/ja/<pluginId>/` tree. It aligns usable translations' heading IDs
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
state. Fallback pages canonicalize to the displayed original (English by default,
Chinese for an explicitly configured Chinese source). Stale Japanese keeps
its Japanese canonical URL but is `noindex`. Native sitemap and local-search
parsers honor `noindex`; the single `SiteMetadata` alternate emitter excludes
Japanese for those pages. Current translations receive reciprocal en/zh-CN/ja
links, using actual localized slugs.

The source parser's explicit date, history map or Git history supplies content
update metadata. The temporary file's creation time and translation commit do
not replace it. Generated route/state reports are written to
`.i18n-build/manifests/<build-locale>.json`; they are not published as site pages.

## Validation

```bash
node --test scripts/i18n/__tests__/*.test.cjs scripts/i18n/poc/*.test.cjs
node scripts/i18n/verify-fixture.cjs
DORIS_ENABLE_JA=true DOCS_VERSIONS=current DORIS_ASSET_ORIGIN='' \
  yarn docusaurus build --locale en --locale zh-CN --locale ja
node scripts/i18n/verify-static.cjs --site build \
  --manifest .i18n-build/manifests/ja.json
```

The fixture builds a small real three-language site, covering stale SQL, unknown
changes, approved prose, manual target edits, source deletion, unsupported
Chinese-only nodes, independent versions/plugins, links and source timestamps.
Full active-version and memory validation runs in the read-only Japanese CI
workflow. Local website builds use only `DOCS_VERSIONS=current`.
