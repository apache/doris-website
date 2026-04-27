# I18n Sync Policy

This policy defines the Week 6 MVP for multi-version and multi-language documentation sync checks. It applies to `plugin: main_docs` entries in the governance manifest and intentionally excludes blog, community, and release-note content from this linter.

## Sync scope

The i18n sync gate only covers English, Chinese, and Japanese docs for `current`, `4.x`, and `3.x`. Versions `2.1` and earlier are intentionally ignored by this linter.

- `docs/**` is the English current source and maps to `versioned_docs/version-4.x/**` for the 4.x counterpart.
- `i18n/zh-CN/docusaurus-plugin-content-docs/current/**` is the Chinese current counterpart for `docs/**`.
- `i18n/zh-CN/docusaurus-plugin-content-docs/version-4.x/**` is the Chinese 4.x counterpart for `versioned_docs/version-4.x/**`.
- `versioned_docs/version-3.x/**` is a non-blocking candidate when the same `sync_group_id` exists and the feature is supported in 3.x.
- `ja-source/docusaurus-plugin-content-docs/**` is report-only and should be treated as candidate translation input until the Japanese publishing path is unified.

## Changed-only gate

`scripts/docs-governance/lint-i18n-sync.js --changed` limits findings to the `sync_group_id` values touched by the PR. This avoids flooding a PR with historical sync debt. A finding should point at the changed file and include the unsynced counterpart in `related_paths` when the counterpart exists or can be predicted.

Default severities:

- `warning`: current and 4.x English counterpart exists but was not changed.
- `warning`: current or 4.x English counterpart is missing for a changed strongly synchronized doc.
- `warning`: Chinese current or 4.x counterpart exists but was not changed.
- `warning`: Chinese-only current or 4.x change has an English source counterpart that was not changed.
- `info`: Chinese counterpart is missing and should be handled by a companion translation PR or PR description note.
- `info`: 3.x counterpart exists or is missing and should be reviewed as a candidate, but it is not blocking.
- `info`: Japanese candidate translation should be generated from changed files and reviewed manually before merge.

## Exceptions

Use `.docs-governance/exceptions.yml` for durable exceptions. Every exception should include an owner, reason, expiration date, and scope such as `doc_id`, `sync_group_id`, `locale`, `version`, or `path`.

Short-lived PR-only exceptions can be documented in the PR description when the change is intentionally version-specific or locale-specific. The linter messages should ask the author to explain those cases rather than silently ignoring them.

## Companion PR draft

When a PR changes English docs only:

1. Run `yarn docs:i18n-sync:changed`.
2. Use `i18n-sync-locale-counterpart` and `i18n-sync-locale-missing` findings to prepare a Chinese companion PR.
3. Use `i18n-sync-locale-candidate` findings to prepare a Japanese candidate translation PR.
4. Mark the companion PR as generated or candidate translation and require human review before merge.

When a PR changes Chinese docs only:

1. Run `yarn docs:i18n-sync:changed`.
2. Review every `i18n-sync-source-counterpart` finding.
3. Either update the English source in the same PR or explain why the Chinese-only update is valid.

## Japanese candidate workflow draft

The existing manual Japanese translation workflow should remain conservative. A future workflow can add a changed-files entry point without adding new secrets:

- Trigger on `workflow_dispatch` with an optional comma-separated `changed_files` input, or on PR label after maintainers opt in.
- Collect only changed English main docs from the manifest.
- Generate Japanese candidate output as an artifact or draft PR.
- Require human review before merge.
- Reuse `website-quality-governance/translation-glossary.yml` so product terms remain stable.
