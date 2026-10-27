# Japanese document scope

For current multi-language maintenance and version changes, use the
[operations runbook](../OPERATIONS.md). The snapshot and first-delivery examples
below describe the historical Japanese rollout.

`ja.json` is the candidate allowlist for the first delivery: the native `default`
docs plugin's `current` and `4.x` versions, and the `community` plugin's `current`
version. It does not filter a website build. All other active versions/plugins
remain configured and use the existing localization/fallback behavior.

English is the default fact source. Explicit source overrides still come from
`translations/config.json`; native source conflicts are reported, never hidden.
A `retainEnglish` exception must identify a registered page and explain why its
body may stay English. The initial scope has no such exception. Drafts are
reported individually. Unlisted pages are included because they have a static
route, even though they are excluded from indexing.

Generate an offline snapshot from a checkout whose source docs match a reviewed,
merged commit. Use a new output directory to preserve existing batch assignments:

```bash
node scripts/i18n/inventory.cjs \
  --source-ref 2b158c2eff9a3cc12c872ac673698b007223a3ce \
  --output /tmp/japanese-scope-new
```

Leave `DOCS_VERSIONS`, `LANDING_ONLY` and docs `SKIP_*` variables unset. The tool
loads metadata from every configured native docs plugin/version, including
sidebars and drafts. It does not compile the full website or contact a model.
It verifies that each scope source hash matches the supplied commit. The caller
must use an actually merged commit; a feature-branch SHA is not a coverage baseline.

Each snapshot contains:

- `summary.json`: source SHA, routing input hashes, all native plugin/version
  identities, group counts, individual exceptions and in/out-of-scope reports.
- `dev.json`, `4x.json`, `community.json`: group counts, entry shard filenames,
  batch IDs, pending review/PR status and remaining counts.
- Group entry shards: exact plugin/version/doc IDs, source/target paths, native
  permalinks, hashes, native state, review status, disposition and batch ID.
- `batches.md`: all independent T09 instances, exact source files/hashes, priority,
  dependencies and acceptance criteria. Each initial batch has at most 20 pages.
- `sidebar-labels.json`: native message keys for document categories and explicit
  sidebar labels in the scoped versions. Ordinary page labels are outside scope.

`mergedCurrent` requires a usable current target and valid matching state at the
supplied merged commit. Working-tree candidates, stale translations, unverified
records and English fallback routes do not count. Machine and human review counts
are separate. The four PoC translations remain machine-reviewed; no human
Japanese proofreading is inferred from their PR merge.

The initial audit baseline is [2026-10-12](../inventory/ja/2026-10-12/batches.md).
Start with T09-DEV-001, then T09-4X-001 and T09-COMMUNITY-001 after T03/T04 merge.
These IDs belong to that snapshot. Record actual PRs, review results and merge
SHAs as batches finish; generate future snapshots separately and reconcile new,
moved or changed pages explicitly. Do not renumber active assignments by
regenerating over this directory. T06 will supply incremental planning.

## Continuous coverage audit (T04)

Run `node scripts/i18n/audit-coverage.cjs --source-ref HEAD --output /tmp/ja-coverage.json`
from a clean checkout of the commit being checked. The audit loads the native
plugins and sidebars again; the T03 snapshot is a comparison baseline only.
It verifies source and routing inputs against that exact commit, then reports
new, changed, moved and removed source nodes, current translations, pending
translations, draft/unregistered exceptions, and every scoped sidebar message
key. `retainSidebarLabels` in `ja.json` records technical names that remain
English, with an explicit reason per plugin and version. A new sidebar key is
never exempt just because it was absent from the T03 snapshot.

The read-only `Japanese coverage audit` workflow runs weekly and supports
manual dispatch; ordinary source PRs do not trigger this full audit. Pending
Japanese work does not fail source PRs. Use `--fail-on-pending` only for the
final T05 coverage gate. Source SHA and routing hashes in each report identify
the exact checkout; after a failed or cancelled workflow, rerun it manually
on current master. No model or bot credential is needed.
