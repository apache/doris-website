# Week 1 Baseline Audit

This audit captures the current automation baseline for Apache Doris website documentation governance. It is intentionally scoped to Week 1: identify current capabilities, gaps, reusable scripts, and risks. It does not change CI or site behavior.

## Repository Structure

Primary content roots:

- `docs/`: English current docs.
- `versioned_docs/`: English versioned docs, including active and archived versions.
- `i18n/zh-CN/docusaurus-plugin-content-docs/`: Chinese localized main docs.
- `community/`: English community docs.
- `i18n/zh-CN/docusaurus-plugin-content-docs-community/`: Chinese localized community docs.
- `releasenotes/`: English release notes.
- `i18n/zh-CN/docusaurus-plugin-content-docs-releases/`: Chinese localized release notes.
- `blog/`: Blog posts.
- `ja-source/`: Japanese source content for the current Japanese flow.
- `ja-build/`: Built Japanese output used by deploy workflows.

Current active versions from `versions.json`:

- `4.x`
- `3.x`
- `2.1`
- `current`

Observed file count baseline from local filesystem:

- `docs/`: 1493 Markdown/MDX files.
- `versioned_docs/`: 5698 Markdown/MDX files.
- `i18n/zh-CN/docusaurus-plugin-content-docs/`: 7225 Markdown/MDX files.
- `community`, `releasenotes`, `blog`, and `ja-source` combined: 6002 Markdown/MDX files.

These counts include files already present in the local workspace. They should be regenerated in CI when formal metrics are added.

## Existing Docusaurus Configuration

Relevant findings:

- `docusaurus.config.js` defines locales `en`, `zh-CN`, and `ja`.
- `versions.json` drives active Docusaurus docs versions.
- `DEFAULT_VERSION` is currently `4.x` in `src/constant/version.ts`.
- `DOCS_VERSIONS` can scope Docusaurus builds by version.
- Sitemap generation exists and excludes search pages.
- Search local indexing is configured for English, Chinese, and Japanese docs routes.
- `@docusaurus/plugin-client-redirects` is configured for selected old paths.
- `onBrokenLinks` and `onBrokenMarkdownLinks` are both set to `ignore`. This is a quality risk because build can pass while broken links remain.

Implication:

The site has enough metadata to build a reliable manifest, but current build settings are too permissive for long-term governance.

## Existing CI and Workflow Coverage

### Build Check

File: `.github/workflows/build-check.yml`

Current capabilities:

- Runs on pull requests.
- Checks out PR head with full history.
- Runs Python move detection through `check_move.py`.
- Runs Node changed-file link checker through `scripts/check_move.js`.
- Detects changed docs versions and locales.
- Runs scoped Docusaurus build using `DOCS_VERSIONS`.

Gaps:

- Broken link behavior is weakened by Docusaurus config using `ignore`.
- The link checker focuses on changed commit files and does not provide a unified manifest-level view.
- The workflow distinguishes versions and locales with shell path rules duplicated from Docusaurus config.
- `NEED_BUILD` is assigned for blog/community changes but the workflow later uses `NEED_FULL_BUILD`, so this path should be reviewed in Week 3.
- There is no front matter, SEO, SQL doc structure, sidebar orphan, or multilingual sync check.

### OpenCode Review

File: `.github/workflows/opencode-review.yml`

Current capabilities:

- Manual `/review` trigger from PR comments.
- Reads `AGENTS.md` as the review guide.
- Can inspect git history, diffs, run validations, and comment on PRs.

Gaps:

- Review prompt is general and not split by doc governance concern.
- Output does not require structured JSON findings.
- No manifest context is provided, so the reviewer must rediscover counterpart versions, locales, sidebars, and owners.
- It is not connected to labels or high-risk path triggers.

### Manual Japanese Translation

File: `.github/workflows/manual-i18n-translate-workflow.yaml`

Current capabilities:

- Manual workflow dispatch.
- Collects source Markdown files.
- Converts Markdown to intermediate JSON.
- Translates natural language with Claude through AWS API.
- Restores Markdown and creates a PR.

Gaps:

- It is manual, not tied to changed files or sync groups.
- It targets `i18n/ja` by default, while the current repo also uses `ja-source` and `ja-build`.
- It does not integrate with a shared terminology file.
- It does not validate translated output with doc governance rules.

## Existing Script Inventory

### Keep and Integrate

- `scripts/i18n/prepare.js`: Good basis for safe translatable segmentation. It preserves code blocks and maps source paths to i18n targets.
- `scripts/i18n/translate-claude.js`: Reusable translation backend, but prompts and terminology should be externalized.
- `scripts/i18n/post-process.js`: Reusable Markdown restore step.
- `scripts/i18n/collect-files.js`: Reusable file collection utility.
- `scripts/i18n/sync-deletions.js`: Useful concept for propagating deletion to localized content and sidebars.
- `scripts/i18n/compare_version_dirs_md5.py`: Useful for report-only version consistency auditing.
- `scripts/check_dead_links.py`: Useful global internal link check logic, especially skipping code blocks and not auto-modifying files.
- `scripts/check_move.js`: Useful changed-file local link checker logic.
- `check_move.py`: Useful rename/delete impact concept, but it currently mutates files and should be refactored into read-only reporting for CI.

### Keep With Caution

- `scripts/verify-links.sh`: Uses `markdown-link-check`, but installs dependencies during execution and contains old TiDB-specific instructions. It should be replaced or rewritten before becoming governance CI.
- `scripts/verify-link-anchors.sh`: Uses remark anchor tooling, but installs dependencies during execution and depends on a PingCAP-specific plugin. It can inspire anchor checks but should not be the final Doris governance path.
- `scripts/addDescriptionFromContent_fixed.js`: Useful for historical autofix batches, but not as a PR gate. It writes files and has heuristic description extraction.
- `scripts/fix-duplicate-titles.js`: Useful for historical batches, but it writes files and may create titles that are mechanically unique but not necessarily good SEO.
- `scripts/fix_title_in_content.py`: Has hard-coded commit hash and writes files. It should not be reused as-is.
- `scripts/add_sidebar_label.py`: Useful idea, but should become part of controlled autofix, not CI.

### Deprecate or Avoid As Governance Base

- `check_docs_version_diff.py`: Uses stale paths such as `sidebars.json` and contains a typo path `ii18n`. Replace with manifest-based sync checks.
- `modify-deadlink.py`: Produces sed suggestions and is useful for ad hoc debugging, but governance should use structured reports and safe autofix PRs.
- `scripts/merge_md.js`, `scripts/merge_by_toc.py`: PDF or merge workflows, not core governance.

## Current Automation Gaps

### Manifest and Identity

There is no shared representation of `doc_id`, route, locale, version, sidebar source, owner, and sync group. Each script currently infers paths independently.

Required next step:

- Implement `scripts/docs-governance/manifest.js` in Week 2.

### SEO and GEO

Current sitemap generation exists, but there is no automated enforcement for:

- Unique and useful page titles.
- Page descriptions.
- Canonical route selection.
- Hreflang consistency.
- Robots policy.
- `llms.txt`.
- Structured data.

Required next step:

- Implement SEO policy checks after manifest exists.

### Multilingual and Version Consistency

Current CI detects changed locales for build scope, but it does not enforce whether a changed English page requires a Chinese or Japanese counterpart update.

Required next step:

- Use `sync_group_id` to find missing or stale counterparts.

### Dead Links and Navigation

There are multiple link-related scripts, but no unified policy that covers:

- Markdown links.
- MDX links.
- Absolute Docusaurus routes.
- Relative file paths.
- Heading anchors.
- Images.
- Sidebars.
- Redirects.
- Moved or deleted files across all roots.

Required next step:

- Consolidate link checks into `scripts/docs-governance/lint-links.js`.

### AI Review

AI Review exists, but it is not structured by concern and does not receive manifest context.

Required next step:

- Split prompts by agent role and require structured findings.

## Week 1 Design Decisions

- The manifest is the source of truth for all future governance checks.
- Active versions from `versions.json` are blocking scope: `4.x`, `3.x`, `2.1`, and `current`.
- Archived versions are report-only unless directly modified.
- English and Chinese are blocking locales for active docs.
- Japanese is report-only until the publishing flow is unified.
- Every exception must have owner, reason, and expiration.
- Owner routing is managed in `.docs-governance/owners.yml` before expanding CODEOWNERS.
- Week 2 scripts should be read-only. Autofix belongs to later historical cleanup phases.

## Risks

### Large Sidebar Parsing

`sidebars.ts` is large and TypeScript-based. Direct parsing may be brittle.

Mitigation:

- Start with targeted extraction and compare against Docusaurus generated metadata.
- For JSON sidebars, use normal JSON parsing.
- Treat sidebar parser failures as reportable findings, not silent success.

### Legacy Debt Blocking PRs

If all existing debt becomes blocking immediately, normal contribution will stop.

Mitigation:

- Start with changed files and active docs.
- Use warning mode first for new rule families.
- Use scheduled full scans for legacy debt.

### Japanese Publishing Flow

Japanese content currently involves `ja-source` and `ja-build`, not only Docusaurus i18n.

Mitigation:

- Keep Japanese report-only.
- Add Japanese checks after ownership and source-of-truth paths are clarified.

### AI Hallucination

AI Review can invent feature behavior when docs are unclear.

Mitigation:

- Require evidence and file/line references.
- Mark unverifiable behavior as `needs_human_verification`.
- Do not let AI-only findings block CI in early rollout.

## Week 2 Entry Criteria

Week 2 can begin when the following files exist:

- `.docs-governance/rules.yml`
- `.docs-governance/exceptions.yml`
- `.docs-governance/owners.yml`
- `website-quality-governance/manifest-design.md`
- `website-quality-governance/baseline-audit.md`

These files now define the governance contract for implementation.

