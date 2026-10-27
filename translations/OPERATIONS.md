# Documentation translation operations

This runbook covers managed documentation maintenance, version changes and recovery. Use the native audit and the checked-out commit as the source of truth. A successful generation run, a translation PR, a merge and a public deployment are separate events.

## Ownership and scope

| Responsibility | Maintainer role | Evidence required |
| --- | --- | --- |
| Version support, native routes, sidebars and redirects | Website and release maintainers | Reviewed source/configuration PR and native navigation checks |
| Terminology and manual prose changes | Reviewer for the affected language | Reviewed source/target revisions; retain machine status until human proofreading actually occurs |
| Scheduled discovery, provider access and automation credentials | Translation workflow maintainers | Run URL, source SHA, mode, failure stage and sanitized diagnostics |
| Publishing and public rollback | Website deployment maintainers | Production source SHA, immutable asf-site SHA and public content/resource checks |

These are operational roles, not assignments of human proofreading to a named person. Confirm the current people responsible during handoff. Set response expectations from observed queue, generation, review and deployment times; this repository does not promise an automatic merge or a fixed translation SLA.

| Input | Authority and effect |
| --- | --- |
| `versions.json`, `docusaurus.config.js`, `versioned_docs/`, `versioned_sidebars/` | Native versions, source files, explicit paths and navigation |
| `config/i18n.js` and deployment build flags | Which site languages are served; independent of generation |
| `translations/config.json` | Managed languages, source overrides and search context labels |
| `translations/scope/<locale>.json` → `groups` | Registered audit and maintenance identities |
| The same file → `automaticGroups` | Groups permitted to generate; `[]` pauses the entire language |
| `scripts/i18n/docs-language-policy.cjs` | Explicit English/Chinese-only legacy versions; currently 3.x and 2.1 |
| `translations/state/<locale>/pages/` and legacy `docs.json` | Exact source/target revisions, freshness and ownership; a page shard supersedes its legacy entry |
| `translations/release-notes-baseline.json` | Fixed historical release-note boundary; never advance it to hide work |

Course UI, weekly report source groups, landing pages and blog batches remain outside scheduled documentation generation unless explicitly admitted. The user's historical blog backfill is a separate manual batch. A registered supplemental group is not automatically a required generation backlog.

## Daily read-only checks

Use a clean dedicated checkout of merged Apache `master`, installed dependencies and complete Git history. A partial clone with complete commit history is supported. Confirm `git rev-parse HEAD`, `git status --short` and `git rev-parse --is-shallow-repository`; a candidate checkout is not a merged-coverage baseline.

```bash
node scripts/i18n/check-configuration.cjs --all --release-history
I18N_LOCALE=ru node scripts/i18n/audit-coverage.cjs \
  --source-ref HEAD --output /tmp/ru-coverage.json
```

The audit reads native metadata and source files. It does not build the website or call a model. For an actionable local plan, reconcile all open PRs first, including human PRs without a translation label:

```bash
# Use the remote that points to apache/doris-website, not a personal fork.
I18N_LOCALE=ru I18N_PR_REMOTE=upstream-apache \
  node scripts/i18n/workflow-prs.cjs /tmp/ru-active
I18N_LOCALE=ru node scripts/i18n/plan-translations.cjs \
  --source-ref HEAD --active-candidates /tmp/ru-active/active-candidates.json \
  --output /tmp/ru-plan.json --audit-output /tmp/ru-audit.json
```

Refresh discovery after a source merge, a target edit, a candidate merge/closure or a scope change. Do not generate from a saved plan just because its task IDs still exist. The scheduled workflow performs this reconciliation itself.

For trusted-main discovery without provider calls or PR writes:

```bash
gh workflow run russian-translation.yml --repo apache/doris-website \
  --ref master -f mode=dry-run
# Narrow an RN check without changing the authoritative coverage scope:
gh workflow run russian-translation.yml --repo apache/doris-website \
  --ref master -f mode=dry-run -f plugin=releases -f version=current
```

Use the matching Japanese or Korean workflow for those languages. `validate` and `generate` are live provider modes; the default manual mode is `generate`. A read-only check must explicitly select `dry-run`. The separate weekly coverage-audit workflows use read permissions and do not run on ordinary PRs.

## Report interpretation

| Field or state | Meaning |
| --- | --- |
| `groups[].counts.registered` | Native registered identities, including separately reported drafts/history |
| `required`, `current`/`mergedCurrent`, `pending` | Required identities and usable reviewed targets at the pinned merged commit; candidates never count as current |
| `automaticCounts` | Only enabled automatic groups; use this denominator for generation operations |
| `automaticLabels` | Required sidebar labels for the same admitted groups and eligible RN labels |
| Raw `labels`, supplemental groups | Wider registered coverage; report separately from automatic backlog |
| Active candidates / blocked targets | Open PR reservations and ambiguous or manually edited candidate targets; not additional merged coverage |
| English fallback / stale / unverified | Existing routes may render English; inspect canonical/noindex and target ownership |
| Historical RN exclusion | Preserved history outside the new-only policy, not untranslated required work |
| 3.x/2.1 fallback | English/Chinese-only versions, not missing ja/ko/ru translations |

Record each report's source SHA, capture time, enabled groups, active PR snapshot and exceptions. For delivery latency, retain source change time, run creation/start/end, PR creation/merge and the first verified public artifact. If a deployment or future note has not occurred, leave that interval pending. Do not substitute a successful PR build for public evidence.

## Source and target lifecycle

| Change | Expected handling |
| --- | --- |
| New registered source | Native audit discovers it; planner emits a new task if admitted and not reserved |
| Source update | Existing hashes become stale; docs fall back to English unless an exact supported prose approval applies; generation compares against the recorded source revision |
| Same docId moved to another file | Reconcile source/target paths and state; planner includes old/new link, sidebar, anchor and redirect checks |
| Unique byte-identical rename | A verified target may be reused; preserve its review/ownership identity and check every old URL/reference |
| Ambiguous rename, or rename with changed facts | Review the identity and facts before changing files/state; a matching filename alone is insufficient |
| Source deletion | Human-reviewed cleanup task; reconcile targets, shards, inbound links and redirects before recording its resolution |
| Manual target edit | Hash mismatch or human ownership blocks automatic replacement; review the actual edited bytes |
| Source changes during generation | Drop affected pages and their dependent copies; configuration/tooling/native-sidebar changes invalidate the batch |
| Human/bot PR already open | Reserve the identity or block its target until reconciliation; closing/merging the PR triggers a fresh scan |

Do not repair freshness by updating a hash without reviewing the corresponding bytes. Do not change `ownership` to machine to bypass a human edit. Prose approvals must bind the old source hash, new source hash and unchanged target hash; protected technical content is still checked.

For reviewed deletion cleanup, copy the exact task identity, source path and source hash from the current plan into `translations/state/<locale>/resolved-deletions.json`, with actual `reviewedBy`, `resolvedAt` and evidence. Do not invent a reviewer or resolve a different revision. The schema is enforced by `validateResolved` in the planner.

RN history uses Git lineage as well as IDs, paths and hashes. Historical moves, copies, re-registration and ambiguous delete/add pairs must not become new model work. Genuine post-cutoff notes and their later updates follow ordinary incremental maintenance. If no new note exists, an empty successful scan is correct; the first real future note remains an observation item.

## Add a supported stable version

Use a future `5.x` only as a rehearsal until release maintainers actually create it. This task must not create real release content in advance.

1. Create the native English source/sidebars and the expected Chinese counterparts using the normal release process. Add the version to `versions.json` and set its label, `path` and default-version behavior in `docusaurus.config.js`. Keep existing version paths explicit: Docusaurus can otherwise place a new last version at `/docs/` and move expected URLs.
2. Add a distinct group such as `5X` to each intended locale scope, with `pluginId: default`, `version: 5.x` and its real source root. Keep `DEV` registered. Add `5X` to `automaticGroups` only after admission and representative checks pass. Do not add 3.x/2.1.
3. Add localized sidebar labels, retained technical-label reasons and `searchContextLabels['docs/5.x']`. Managed search contexts and source fingerprints read the active native version configuration; the shared domain navigation reads the same versions and legacy policy.
4. Recount native identities and confirm stable doc IDs, source overrides, target paths and independent state records. Existing translations in two versions must be updated against their own baselines. Exact initial Dev/4.x copies may share one verified model result; another version can generate independently.
5. Check English/Chinese plus ja/ko/ru routes, version and language switches, query/hash, sidebar selection, missing-page fallback, search contexts, index admission and SEO. Rehearse in the small native fixture before requesting the applicable PR/production checks.
6. After merge, record production source/asf-site identities and public routes. Retain old URLs and redirects required by the release policy.

```bash
node --test scripts/i18n/__tests__/lifecycle.test.cjs
```

The fixture introduces temporary 5.x/legacy native metadata, language routes and search grouping without creating a real repository version or compiling the full website.

## Pause, retire and resume

To retire a version from automatic maintenance, remove its group ID from `automaticGroups` in the affected language scope. Keep its registered group, translations, state, native version and sidebars so published routes and valid indexes remain available. Removing a native version is a separate URL migration requiring redirects and public acceptance.

To pause one language's generation, commit an explicit `"automaticGroups": []`. To pause RN generation only, remove `RELEASES` from that list. Keep the fixed RN policy/baseline and all published files. Omitting `automaticGroups` is the legacy allow-all behavior and is not a pause operation.

Restore the reviewed list to resume, then run configuration validation and a fresh `dry-run`. Verify the automatic denominator, pending states, PR reservations and selected task IDs before using a live mode. Pausing generation does not disable a website locale. Changing deployment locale flags is a separate publication operation.

For an immediate workflow-trigger pause, maintainers can disable the affected workflow through GitHub Actions. This stops future triggers; an existing queued or running job remains a separate operation. All three languages hold the shared `docs-translation` lock for discovery through publication, so queue delay is not a provider failure.

## Failure recovery

| Failure stage | Recovery and completion check |
| --- | --- |
| GitHub PR pagination, HTTP 429/5xx or connection failure | Complete paginated reads retry twice; after exhaustion rerun discovery. Never use a partial PR list to free reservations |
| GitHub/provider authentication or authorization | Repair the responsible secret/installation permission; rerun from current trusted master. Authentication failures are not empty-success scans |
| Provider timeout or translation/technical validation failure | Keep the reported failure pending, inspect attempt diagnostics, reconcile targets and retry the exact current source. No manual hash refresh |
| Human target/state changed during generation | Preserve that edit; reconcile ownership and get a reviewer decision before any new candidate |
| Source, configuration or sidebar moved on master | Discard stale work as reported and scan the new commit; do not force-publish the old plan |
| Target/state write failure | Verify rollback restored every affected target and shard before retrying; atomic rollback cases are covered by the workflow tests |
| Shared-lock queue or delayed review/merge | Inspect the predecessor or open PR; do not start a duplicate provider run for the same identity |
| PR build failure | Repair the candidate with the normal checks; rebuild success still does not establish public delivery |
| Deployment delay/failure | Keep merge and public states separate; inspect build, upload and asf-site identity before retrying deployment |

Run the focused offline protection suite after maintenance changes:

```bash
node --test scripts/i18n/__tests__/configuration.test.cjs \
  scripts/i18n/__tests__/planner.test.cjs \
  scripts/i18n/__tests__/state.test.cjs \
  scripts/i18n/__tests__/workflow.test.cjs \
  scripts/i18n/__tests__/github-pr-read.test.cjs \
  scripts/i18n/__tests__/release-policy.test.cjs \
  scripts/i18n/__tests__/lifecycle.test.cjs
```

## Content and publication rollback

For a bad translation, revert its target and matching page state together through a reviewed PR, or quarantine it so native English fallback applies. Verify actual target/state hashes, ownership, canonical/noindex and search exclusion. Do not remove a public language just to hide one bad page.

For a generation-policy regression, pause the affected groups and revert the policy/tooling change while preserving source content and the RN historical boundary. A pause does not undo a batch already merged.

For a whole-site publication regression, deployment maintainers select a known complete immutable asf-site artifact and its source identity, restore it through the established publishing procedure, then verify representative routes, locale roots, assets, aliases and search. Do not deploy a PR sample artifact or assume that an old source checkout reproduces its previously generated inputs. Any actual public rollback requires a separate deployment record; offline rehearsals prove only the tested state/file behavior.
