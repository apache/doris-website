---
name: add-release
description: Update the Apache Doris website for a new release of Doris core or a Doris ecosystem component. Use when a release manager asks to add or update website release information, download links, release notes, all-release indexes, release sidebar entries, or ecosystem release pages for versions such as Doris 4.0.7, Flink Connector 26.1.1, Spark Connector 26.0.0, Kafka Connector 26.0.0, Doris Operator 25.8.0, Doris CLI, Doris MCP Server, Doris Skills, or Streamloader. Always confirm which component is being published before editing because core releases and ecosystem component releases touch different files.
---

# Add Doris Release

Use this skill to update the Apache Doris website after a Doris core or ecosystem component release is ready. The goal is to publish the right release content in `/download/` and `/releases/` without accidentally applying the Doris core workflow to an ecosystem component, or the reverse.

Work from the `doris-website` repository root.

## Component Confirmation Gate

Before editing any file, identify the release component and ask the release manager to confirm it interactively.

If the user already names a component, restate it and ask for confirmation before proceeding. If the component is ambiguous, ask one concise question with the likely choices.

Use these canonical component IDs:

| Component ID | Website area | Typical release artifact area |
| --- | --- | --- |
| `doris-core` | Core release notes, `/download/` core packages, all-release indexes | `https://downloads.apache.org/doris/<series>/<version>/` |
| `doris-flink-connector` | Ecosystem release page and `TOOL_VERSIONS` Flink entry | `https://downloads.apache.org/doris/flink-connector/<version>/` |
| `doris-spark-connector` | Ecosystem release page and `TOOL_VERSIONS` Spark entry | `https://downloads.apache.org/doris/spark-connector/<version>/` |
| `doris-kafka-connector` | Ecosystem release page and `TOOL_VERSIONS` Kafka entry | `https://downloads.apache.org/doris/kafka-connector/<version>/` |
| `doris-streamloader` | Ecosystem release page and `TOOL_VERSIONS` Streamloader entry when applicable | Confirm artifact location from nearby entries or the release manager |
| `doris-operator` | Ecosystem release page; image/chart links when applicable | Confirm image/chart/source locations from the release manager |
| `doris-mcp-server` | Ecosystem release page | Confirm artifact or package locations from the release manager |
| `doris-skills` | Ecosystem release page | Confirm artifact or package locations from the release manager |
| `doris-cli` | Ecosystem release page | Confirm artifact or package locations from the release manager |
| `other-ecosystem` | New or less common ecosystem release page | Confirm page path, sidebar entry, and artifact locations |

Do not infer `doris-core` only because the version looks numeric. Connector and operator versions also look numeric.

## Required Inputs from the Release Manager

Ask for any missing item before editing if it cannot be discovered safely from public release artifacts.

Required for every component:

- **Component**: one of the component IDs above, confirmed by the release manager.
- **Version**: full component version, for example `4.0.7`, `26.1.1`, or `25.8.0`.
- **Release note source**: usually a GitHub issue, PR, Markdown body, or upstream release page.
- **Release date**: prefer the official Apache download directory timestamp, package publication date, or announcement date. Do not use issue creation time unless the release manager confirms it.
- **Localization expectation**: by default, update both English and zh-CN release pages when both mirrors already exist.
- **Scope of download updates**: confirm whether this release should update `/download/`, only `/releases/`, or both.

Additional for `doris-core`:

- **Release series**: major/minor line used in Apache dist paths, for example `4.0` for `4.0.7`.
- **Source package location**: usually `https://downloads.apache.org/doris/<series>/<version>/apache-doris-<version>-src.tar.gz` and matching `.asc` / `.sha512`.
- **Binary package locations**: confirm all supported binary tarballs exist on the configured binary CDN:
    - `https://download.selectdb.com/apache-doris-<version>-bin-x64.tar.gz`
    - `https://download.selectdb.com/apache-doris-<version>-bin-x64-noavx2.tar.gz`
    - `https://download.selectdb.com/apache-doris-<version>-bin-arm64.tar.gz`
    - matching `.asc` and `.sha512` files
- **Source filename version suffix**: determine whether the source tarball uses plain `<version>` or an RC-style suffix such as `<version>-rc02`. In `download.data.ts`, the `version` field controls the source tarball filename rendered by the download UI.
- **Release positioning**: whether the release becomes `VersionEnum.Latest`, `VersionEnum.Prev`, or only an entry in historical/all-release data.

Additional for ecosystem components:

- **Ecosystem page path**: usually `releasenotes/ecosystem/<component>.md` and the matching zh-CN mirror.
- **Download data target**: whether `src/constant/download.data.ts` has an existing `TOOL_VERSIONS` entry for this component.
- **Source artifact URL**: usually under `https://downloads.apache.org/doris/<component-artifact-dir>/<version>/`.
- **Binary/package URLs**: Maven coordinates, Docker images, Helm charts, npm/PyPI packages, or other official distribution links as applicable.
- **Compatibility matrix**: required for components with per-runtime variants, such as Flink or Spark connector versions.

## Choose the Workflow

After confirming the component, use only the matching workflow.

- Use **Doris Core Workflow** for `doris-core`.
- Use **Ecosystem Component Workflow** for all other component IDs.

If the confirmed component does not fit either workflow, stop and ask the release manager for the intended website surface before editing.

## Doris Core Workflow

### Files to Update

Update these files for a core release:

```text
src/constant/download.data.ts
releasenotes/v<series>/release-<version>.md
i18n/zh-CN/docusaurus-plugin-content-docs-releases/current/v<series>/release-<version>.md
releasenotes/all-release.md
i18n/zh-CN/docusaurus-plugin-content-docs-releases/current/all-release.md
sidebarsReleases.json
```

### Download Page Data

Edit `src/constant/download.data.ts`.

Update `VersionEnum`:

- If the new release is the newest headline version, update `Latest`.
- If it is the stable previous series shown beside Latest, update `Prev`.
- Leave `Earlier` alone unless the stable older line changes.

Add the new version in both data structures:

- `DORIS_VERSIONS`: drives the quick-download version selector.
- `ALL_VERSIONS`: drives the all-releases download form.

For each supported architecture, add:

- `gz`: binary tarball URL using `ORIGIN`.
- `asc`: binary signature URL using `ORIGIN`.
- `sha512`: binary checksum URL using `ORIGIN`.
- `source`: official Apache source directory, typically `https://dist.apache.org/repos/dist/release/doris/<series>/<version>/` or `https://downloads.apache.org/doris/<series>/<version>/`, matching nearby conventions.
- `version`: the source tarball filename version segment. Use plain `4.0.7` only if `apache-doris-4.0.7-src.tar.gz` exists; use an RC suffix only if the source tarball filename includes it.

Keep entries sorted newest-first inside their series.

### Core Release Notes

Add English:

```text
releasenotes/v<series>/release-<version>.md
```

Add zh-CN:

```text
i18n/zh-CN/docusaurus-plugin-content-docs-releases/current/v<series>/release-<version>.md
```

Use the existing JSON-inside-`---` frontmatter style. Preserve the release-note source structure where possible:

- `# Overview`
- `# Behavior Changes`
- `# New Features & Improvements`
- `# Important Bug Fixes`
- `# Acknowledgments` when provided

If the source issue already contains polished Markdown, copy it carefully, adapt only the frontmatter/title/overview wording needed for website consistency, and avoid inventing release content.

### Core Index and Sidebar

Update both all-release indexes:

```text
releasenotes/all-release.md
i18n/zh-CN/docusaurus-plugin-content-docs-releases/current/all-release.md
```

In each file:

- Update the relevant tip block entry for that release line.
- Add a bullet link near the top of the chronological list.
- Keep the list in reverse chronological order by release date.
- Use the official release date.

Update `sidebarsReleases.json`:

- Add the new release note ID under the matching core version category, for example `v4.0/release-4.0.7`.
- Place it newest-first, before the previous patch release.
- Validate that the JSON remains parseable.

## Ecosystem Component Workflow

Use this workflow for connector, operator, CLI, MCP, skills, streamloader, and other ecosystem releases.

### Files to Update

Most ecosystem releases update:

```text
releasenotes/ecosystem/<component-page>.md
i18n/zh-CN/docusaurus-plugin-content-docs-releases/current/ecosystem/<component-page>.md
```

Some ecosystem releases also update:

```text
src/constant/download.data.ts
sidebarsReleases.json
```

Update `sidebarsReleases.json` only when adding a new ecosystem page. Existing ecosystem pages are listed once under `Doris Ecosystem`; individual component versions are usually sections inside the component page, not separate sidebar items.

Do not update core `releasenotes/v<series>/...` files or core all-release indexes for ecosystem component releases unless the release manager explicitly asks for that cross-link.

### Component Profiles

#### Flink Connector

- Page: `releasenotes/ecosystem/doris-flink-connector.md`
- zh-CN page: `i18n/zh-CN/docusaurus-plugin-content-docs-releases/current/ecosystem/doris-flink-connector.md`
- Download data: `ToolsEnum.Flink` inside `TOOL_VERSIONS`
- Source URL pattern: `https://downloads.apache.org/doris/flink-connector/<version>/apache-doris-flink-connector-<version>-src.tgz` for newer releases, but verify exact suffix from Apache downloads.
- Binary URLs usually vary by Flink runtime, for example `flink-doris-connector-<flink-version>/<connector-version>/flink-doris-connector-<flink-version>-<connector-version>.jar`.
- Confirm supported Flink versions before editing.

#### Spark Connector

- Page: `releasenotes/ecosystem/doris-spark-connector.md`
- zh-CN page: `i18n/zh-CN/docusaurus-plugin-content-docs-releases/current/ecosystem/doris-spark-connector.md`
- Download data: `ToolsEnum.Spark` inside `TOOL_VERSIONS`
- Source URL pattern: `https://downloads.apache.org/doris/spark-connector/<version>/apache-doris-spark-connector-<version>-src.tgz` for newer releases, but verify exact suffix.
- Binary URLs usually vary by Spark/Scala runtime. Confirm supported variants before editing.

#### Kafka Connector

- Page: `releasenotes/ecosystem/doris-kafka-connector.md`
- zh-CN page: `i18n/zh-CN/docusaurus-plugin-content-docs-releases/current/ecosystem/doris-kafka-connector.md`
- Download data: `ToolsEnum.Kafka` inside `TOOL_VERSIONS`
- Source URL pattern: `https://downloads.apache.org/doris/kafka-connector/<version>/apache-doris-kafka-connector-<version>-src.tgz` for newer releases, but verify exact suffix.
- Binary URL is usually Maven Central or Apache repository coordinates for `doris-kafka-connector`.

#### Streamloader

- Page: `releasenotes/ecosystem/doris-streamloader.md`
- zh-CN page: `i18n/zh-CN/docusaurus-plugin-content-docs-releases/current/ecosystem/doris-streamloader.md`
- Download data: `ToolsEnum.StreamLoader` inside `TOOL_VERSIONS` when the component has downloadable website artifacts.
- Confirm source and binary URL patterns from nearby entries or the release manager before editing.

#### Operator

- Page: `releasenotes/ecosystem/doris-operator.md`
- zh-CN page: `i18n/zh-CN/docusaurus-plugin-content-docs-releases/current/ecosystem/doris-operator.md`
- Download data: usually not `TOOL_VERSIONS` unless the website has a concrete download entry for this component.
- Include image, Helm, or chart information only when the release manager provides official links or nearby page conventions already show them.

#### MCP Server, Skills, CLI, and Other Ecosystem Components

- Use the existing ecosystem page if present.
- If adding a new ecosystem page, create both English and zh-CN pages and add one sidebar item under `Doris Ecosystem`.
- Confirm whether `/download/` should expose the component. If not, update release notes only.
- Use official artifact URLs only. Do not invent package registry links.

### Ecosystem Release Note Format

Add the new version section near the top of the component page, directly below the intro and above the previous version.

Use this structure when the source supports it:

```markdown
## <version>

Source: [Release Notes <version>](<source-url>)

<one short summary paragraph when the source provides enough context>

### Features and Improvements

- ...

### Bug Fixes

- ...

### Downloads

- ...

### Thanks

- ...
```

Keep zh-CN structurally aligned with English. Translate faithfully and do not add technical claims that are not in the source.

### Ecosystem Download Data

When updating `src/constant/download.data.ts`:

- Update only the matching `ToolsEnum.*` component section.
- Add the new version newest-first.
- Preserve existing object shape. Some tools use flat entries; Flink and Spark use nested runtime compatibility entries.
- For repeated source URLs across runtime variants, follow nearby constants such as `FLINK_SAME_SOURCE_*` or `SPARK_SAME_SOURCE_*`.
- Verify whether source files use `.tar.gz` or `.tgz`. Do not normalize suffixes.

## Validation Checklist

Do not rely on visual inspection only. Run lightweight checks unless the user explicitly asks not to run commands. If the user says not to compile, do not run Docusaurus build.

For core release package links:

```shell
curl -sI https://downloads.apache.org/doris/<series>/<version>/apache-doris-<version>-src.tar.gz
curl -sI https://download.selectdb.com/apache-doris-<version>-bin-x64.tar.gz
curl -sI https://download.selectdb.com/apache-doris-<version>-bin-x64-noavx2.tar.gz
curl -sI https://download.selectdb.com/apache-doris-<version>-bin-arm64.tar.gz
```

For ecosystem links:

```shell
curl -sI <source-artifact-url>
curl -sI <representative-binary-or-package-url>
```

Also spot-check representative `.asc` and `.sha512` URLs for Apache source artifacts when they exist. Treat `200` as good. If HEAD behaves unexpectedly, retry with `curl -sIL` or GET before declaring a link broken.

Validate changed files:

```shell
git diff --check
node -e "JSON.parse(require('fs').readFileSync('sidebarsReleases.json','utf8')); console.log('sidebarsReleases.json ok')"
rg -n "<version>|release-<version>|apache-doris-<version>|<component>" src/constant/download.data.ts releasenotes i18n/zh-CN/docusaurus-plugin-content-docs-releases/current sidebarsReleases.json
```

When build validation is allowed and appropriate, run the repository's normal Docusaurus validation/build command. If the release manager explicitly says not to compile, report that build was intentionally skipped.

## Common Pitfalls

- **Skipping component confirmation**: core and ecosystem releases use different files and URL patterns. Confirm the component first.
- **Wrong release date**: GitHub issue creation/update time is not always the official release date. Check Apache downloads, package publication, or the announcement.
- **Updating core indexes for an ecosystem release**: ecosystem releases usually live under `releasenotes/ecosystem/*.md`, not `releasenotes/all-release.md`.
- **Missing `sidebarsReleases.json` update for a new ecosystem page**: existing ecosystem pages do not need a new sidebar item per version, but new component pages do.
- **Only updating English**: mirror zh-CN release notes when a zh-CN mirror already exists unless the release manager explicitly scopes the task to English only.
- **Wrong source tarball suffix**: source artifacts may use `.tar.gz` or `.tgz`. Verify the actual Apache download URL.
- **Updating only `DORIS_VERSIONS` for core**: quick download and all-releases use separate structures. Update both `DORIS_VERSIONS` and `ALL_VERSIONS`.
- **Changing unrelated components**: keep the diff focused on the confirmed component and version.
- **Inventing links**: use official Apache downloads, Apache repository, Maven Central, image registry, or release-manager-provided links only.

## Final Response

Summarize:

- Confirmed component and version.
- Release pages created or updated, including English and zh-CN status.
- Download data updated, including whether core quick-download enums or ecosystem `TOOL_VERSIONS` changed.
- `all-release.md` and `sidebarsReleases.json` updates, or why they were not needed.
- Validation performed, including package-link checks and whether build was skipped.
