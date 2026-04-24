# Week 1 Manifest Design

This document defines the first version of the documentation manifest for the Apache Doris website. The manifest is the shared fact table used by future lint scripts, CI checks, AI Review, translation workflows, and scheduled audits.

## Purpose

The website currently stores official content across multiple roots: `docs/`, `versioned_docs/`, `i18n/zh-CN/`, `community/`, `releasenotes/`, `blog/`, `ja-source/`, and `ja-build/`. A PR that changes one Markdown file can affect routes, sidebars, localized pages, active versions, redirects, search, and SEO metadata. Without a manifest, every script has to rediscover those relationships independently.

The manifest solves that by mapping every source file to a stable document identity, route, version, locale, sidebar source, owner, and sync group.

## Non-Goals

- Do not change Docusaurus behavior in Week 1.
- Do not implement lint scripts in Week 1.
- Do not auto-fix content in Week 1.
- Do not make Japanese docs blocking until the publishing flow is unified.

## Manifest Output

Future scripts should generate `website-quality-governance/generated/docs-manifest.json`. The generated file should not be committed by default unless the team wants reviewable snapshots. CI can generate it as an artifact.

Recommended top-level shape:

```json
{
  "schema_version": 1,
  "generated_at": "2026-04-24T00:00:00Z",
  "source_commit": "<git-sha>",
  "rules_file": ".docs-governance/rules.yml",
  "entries": []
}
```

## Entry Schema

Each manifest entry represents one source page or content file.

```json
{
  "doc_id": "sql-manual/sql-functions/scalar-functions/string-functions/concat",
  "sync_group_id": "main_docs:sql-manual/sql-functions/scalar-functions/string-functions/concat",
  "source_path": "docs/sql-manual/sql-functions/scalar-functions/string-functions/concat.md",
  "content_root": "docs",
  "plugin": "main_docs",
  "locale": "en",
  "version": "current",
  "route_path": "/docs/dev/sql-manual/sql-functions/scalar-functions/string-functions/concat",
  "canonical_route_path": "/docs/4.x/sql-manual/sql-functions/scalar-functions/string-functions/concat",
  "sidebar_source": "sidebars.ts",
  "title": "CONCAT",
  "description": "Concatenates multiple strings and returns the combined string.",
  "slug": null,
  "keywords": [],
  "tags": [],
  "sidebar_label": null,
  "sidebar_position": null,
  "doc_type": "sql_function",
  "owner": "@zclllyybb",
  "is_archived": false,
  "blocking_level": "blocking",
  "front_matter_format": "yaml",
  "source_counterpart": null,
  "localized_counterparts": [],
  "version_counterparts": [],
  "route_aliases": [],
  "heading_anchors": [],
  "inbound_links": [],
  "outbound_links": [],
  "exceptions": []
}
```

## Field Definitions

- `doc_id`: Stable identity of the page independent of locale and version. For main docs, it is the canonical relative path without `.md` or `.mdx`.
- `sync_group_id`: Stable grouping key across versions and locales. Prefix with plugin name to avoid collisions, for example `main_docs:...` or `community:...`.
- `source_path`: Repo-relative file path using POSIX separators.
- `content_root`: Logical root from `.docs-governance/rules.yml`, for example `docs`, `versioned_docs`, `zh_current_docs`, `community`.
- `plugin`: Docusaurus content plugin, for example `main_docs`, `community`, `releases`, or `blog`.
- `locale`: `en`, `zh-CN`, or `ja`.
- `version`: `current`, `4.x`, `3.x`, `2.1`, `2.0`, `1.2`, or `null` for non-versioned content.
- `route_path`: Derived URL path for the specific source file.
- `canonical_route_path`: Preferred canonical URL for SEO. For active docs, this normally points to the default version, currently `4.x`, unless the page only exists in current.
- `sidebar_source`: Sidebar file that controls navigation, or `null` for content that is not sidebar-driven.
- `title`: Parsed front matter title, falling back to the first H1 only for reporting.
- `description`: Parsed front matter description. Future SEO lint should require it for indexable pages.
- `slug`: Parsed front matter slug if present.
- `keywords`: Parsed front matter keywords if present.
- `tags`: Parsed tags for blog or docs where applicable.
- `sidebar_label`: Parsed front matter sidebar label if present.
- `sidebar_position`: Parsed front matter sidebar position if present.
- `doc_type`: Detected type from ordered rules in `.docs-governance/rules.yml`.
- `owner`: Owner matched from `.docs-governance/owners.yml`.
- `is_archived`: True when version is outside `versions.json` active versions.
- `blocking_level`: `blocking`, `warning`, or `report_only`, derived from version, locale, root, and rule rollout status.
- `front_matter_format`: `yaml`, `json`, `none`, or `invalid`.
- `source_counterpart`: Canonical English source file for localized entries.
- `localized_counterparts`: Existing localized files in the same sync group.
- `version_counterparts`: Existing active and archived version files in the same sync group.
- `route_aliases`: Redirects or legacy routes found in Docusaurus redirect config.
- `heading_anchors`: H2/H3 anchors extracted for anchor link validation.
- `inbound_links`: Source paths that link to this entry.
- `outbound_links`: Links found in this entry, including status and target classification.
- `exceptions`: Matching exception IDs from `.docs-governance/exceptions.yml`.

## Identity Rules

The manifest generator should normalize each path into `doc_id` using these rules:

1. Convert path separators to `/`.
2. Remove locale and version root prefixes.
3. Remove `.md` or `.mdx`.
4. Apply plugin prefix only to `sync_group_id`, not to the main docs `doc_id`.
5. For non-main docs, prefix `doc_id` with the plugin to avoid collisions.

Examples:

```text
docs/gettingStarted/what-is-apache-doris.md
doc_id: gettingStarted/what-is-apache-doris
sync_group_id: main_docs:gettingStarted/what-is-apache-doris

versioned_docs/version-4.x/gettingStarted/what-is-apache-doris.md
doc_id: gettingStarted/what-is-apache-doris
sync_group_id: main_docs:gettingStarted/what-is-apache-doris

i18n/zh-CN/docusaurus-plugin-content-docs/current/gettingStarted/what-is-apache-doris.md
doc_id: gettingStarted/what-is-apache-doris
sync_group_id: main_docs:gettingStarted/what-is-apache-doris

community/join-community.md
doc_id: community:join-community
sync_group_id: community:join-community
```

## Version and Locale Policy

Active versions are read from `versions.json`: `4.x`, `3.x`, `2.1`, and `current`. Archived versions currently include `2.0` and `1.2`.

Blocking policy:

- English and Chinese active docs are blocking scope.
- Japanese is report-only until `ja-source` and `ja-build` are unified with Docusaurus i18n.
- Archived versions are report-only unless a PR directly modifies them.
- `current` and `4.x` should usually stay close. If a feature only exists in dev, the PR should explain the version boundary.
- `3.x` and `2.1` require localized consistency when modified, but do not require automatic backports for new features.

## Sidebar Policy

The manifest should track which sidebar controls each page:

- `sidebars.ts` controls current docs.
- `versioned_sidebars/version-{version}-sidebars.json` controls versioned docs.
- `sidebarsCommunity.json` controls community docs.
- `sidebarsReleases.json` controls release notes.

For Week 2 implementation, sidebar parsing can start with a pragmatic text/JSON extraction approach:

- Parse JSON sidebars directly.
- For `sidebars.ts`, extract string doc IDs and `type: 'doc'` or `id` values with a targeted parser.
- Later, replace the parser with Docusaurus generated metadata if direct parsing proves brittle.

## Route Policy

Routes are derived from Docusaurus config:

- English current docs: `/docs/dev/{doc_id}`.
- English versioned docs: `/docs/{version}/{doc_id}`.
- Chinese current docs: `/zh-CN/docs/dev/{doc_id}`.
- Chinese versioned docs: `/zh-CN/docs/{version}/{doc_id}`.
- Community: `/community/{doc_id_without_plugin}` and localized counterpart under `/zh-CN/community/`.
- Releases: `/releases/{relative_path}` and localized counterpart under `/zh-CN/releases/`.
- Blog: `/blog/{slug_or_path}`.

If front matter defines `slug`, the generator must record both the derived path and slug-derived route, then mark any mismatch for future linting.

## Exception Policy

Exceptions live in `.docs-governance/exceptions.yml`. Every exception must include:

- `id`
- `type`
- `scope`
- `reason`
- `owner`
- `expires`

Valid exception types are defined in `.docs-governance/rules.yml`. Scheduled checks should fail expired exceptions. PR checks should report expired exceptions as blocking once the relevant rule is enabled.

## Owner Policy

Owner routing uses `.docs-governance/owners.yml`.

Resolution order:

1. Most specific path match wins.
2. If multiple owners match, prefer matching `doc_type`.
3. If nothing matches, use `default_owner`.

The owner value is used for reports and issue routing. It does not replace GitHub CODEOWNERS unless the project later chooses to sync them.

## Week 2 Implementation Notes

The first manifest generator should be read-only and deterministic. It should:

- Use `gray-matter` for front matter.
- Never rewrite Markdown.
- Produce stable sorting by `source_path`.
- Support `--changed-only` by accepting a list of paths from `git diff --name-only`.
- Emit both JSON and human-readable summary.
- Treat parse failures as manifest entries with `front_matter_format: invalid` instead of crashing the full run.

## Open Questions

- Whether generated manifest snapshots should be committed or only uploaded as CI artifacts.
- Whether `ja-build` should be indexed as source content or treated only as build output.
- Whether `2.1` should remain blocking for all doc quality checks or only for links, build, and localized consistency.
- Whether the community wants to allow training-purpose AI crawlers in `robots.txt`.

