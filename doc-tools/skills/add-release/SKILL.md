---
name: add-release
description: Publish a new Apache Doris Core or Doris ecosystem release on the Doris website. Use when updating download data, bilingual release notes, the Doris Core release index, release navigation, or ecosystem release pages. Confirm the component and release metadata first because Core and ecosystem releases use different files and validation paths.
---

# Add Doris Release

Publish release information to /download/ and /releases/ from the doris-website repository root. Keep the change focused, preserve user work already in the tree, and do not commit unless the release manager asks.

## Operating Rules

- Treat the current repository structure, AGENTS.md, sidebarsReleases.json, and src/constant/download.data.ts as authoritative. If an example in this skill conflicts with the repository, follow the repository and report the drift.
- Inspect nearby releases for the same component before editing. Match their paths, frontmatter, ordering, terminology, and data shape.
- Confirm public artifacts rather than deriving filenames only from the public version.
- Update English and zh-CN together whenever both website mirrors exist, unless the release manager explicitly narrows the locale scope.
- Keep release-note issue references and section structure aligned between languages.
- Do not run yarn typecheck or yarn build when the release manager says no compile, no compilation, or equivalent. Still run the non-compilation checks.

## Preflight

Read these sources before choosing a workflow:

- AGENTS.md
- src/constant/download.data.ts
- sidebarsReleases.json
- releasenotes/all-release.md
- releasenotes/core.md
- i18n/zh-CN/docusaurus-plugin-content-docs-releases/current/all-release.md
- i18n/zh-CN/docusaurus-plugin-content-docs-releases/current/core.md
- One recent release for the same component in both locales
- Recent git history for the same files when repository intent remains unclear

Also run git status --short before editing. Existing unrelated modifications and untracked files belong to the user and must remain untouched.

## Confirmation Gate

Collect all missing release decisions in one concise confirmation instead of asking one field at a time. Do not ask again for values the user has already supplied.

Use this template:

    Please confirm:
    - Component: <canonical component ID>
    - Public release version: <version shown on the website>
    - Release date: <YYYY-MM-DD>
    - Release-note source: <GitHub issue, PR, Markdown, or upstream page>
    - Website scope: </download/, /releases/, or both>
    - Locales: <English, zh-CN, or both>
    - Position: <Latest, Prev, Earlier, or historical>
    - Source filename version: <plain version or RC-suffixed version>
    - Source directory and binary origin: <URLs, if nonstandard>

Canonical component IDs:

| Component ID | Website surface | Typical artifact directory |
| --- | --- | --- |
| doris-core | Core downloads, per-version notes, Core index, release sidebar | https://dist.apache.org/repos/dist/release/doris/<series>/<version>/ |
| doris-flink-connector | Flink ecosystem page and TOOL_VERSIONS when present | https://downloads.apache.org/doris/flink-connector/<version>/ |
| doris-spark-connector | Spark ecosystem page and TOOL_VERSIONS when present | https://downloads.apache.org/doris/spark-connector/<version>/ |
| doris-kafka-connector | Kafka ecosystem page and TOOL_VERSIONS when present | https://downloads.apache.org/doris/kafka-connector/<version>/ |
| doris-streamloader | Streamloader ecosystem page and download data when present | Verify from the release directory |
| doris-operator | Operator ecosystem page, images, and charts when applicable | Verify from the release announcement |
| doris-mcp-server | MCP Server ecosystem page | Verify package locations |
| doris-skills | Doris Skills ecosystem page | Verify package locations |
| doris-cli | Doris CLI ecosystem page | Verify package locations |
| other-ecosystem | A new or less common ecosystem page | Confirm page, sidebar, and artifact locations |

Never infer doris-core only because a version has three numeric segments.

## Choose the Workflow

- Use the Doris Core workflow only for doris-core.
- Use the ecosystem workflow for every other component.
- If the component has no established website surface, stop after discovery and ask the release manager to confirm the intended page, navigation, and download behavior.

## Doris Core Workflow

### Distinguish the Two Version Values

Keep these values separate throughout the change:

- Public release version: the version shown in titles, links, VersionEnum, labels, sidebar IDs, binary filenames, and release-note paths, such as 4.1.3.
- Source filename version: the segment used by the published source tarball, which may include an RC suffix such as 4.1.3-rc02.

The version field inside each architecture row in download.data.ts controls the source filename rendered by the download UI. Never replace an RC-suffixed source filename with the public version unless that exact plain source tarball exists.

### Discover and Verify Artifacts

Inspect the official release directory before editing. Prefer the stable dist.apache.org release repository when downloads.apache.org has not synchronized yet:

    https://dist.apache.org/repos/dist/release/doris/<series>/<public-version>/

Record the exact source tarball filename and derive the source filename version from it. Verify this complete matrix:

| Artifact | Required files |
| --- | --- |
| Source | apache-doris-<source-version>-src.tar.gz, .asc, .sha512 |
| x64 binary | apache-doris-<public-version>-bin-x64.tar.gz, .asc, .sha512 |
| x64 no-AVX2 binary | apache-doris-<public-version>-bin-x64-noavx2.tar.gz, .asc, .sha512 |
| ARM64 binary | apache-doris-<public-version>-bin-arm64.tar.gz, .asc, .sha512 |

This is twelve URLs: three source artifacts and nine binary artifacts. A directory listing alone is insufficient. Check every URL and follow redirects. A small ranged GET may be used when a server rejects HEAD.

If the canonical downloads mirror is delayed but dist.apache.org already serves the official release, use the working dist.apache.org directory in download.data.ts and record that choice in the handoff.

### Files to Update

A normal bilingual Core release that updates both website surfaces touches:

    src/constant/download.data.ts
    releasenotes/v<series>/release-<public-version>.md
    i18n/zh-CN/docusaurus-plugin-content-docs-releases/current/v<series>/release-<public-version>.md
    releasenotes/core.md
    i18n/zh-CN/docusaurus-plugin-content-docs-releases/current/core.md
    sidebarsReleases.json

releasenotes/all-release.md and its zh-CN mirror are project indexes. They route readers to Doris Core and ecosystem pages. Do not add individual Core versions to them and do not modify them for a routine Core patch release.

### Update Download Data

Edit src/constant/download.data.ts.

Update VersionEnum only as confirmed:

- Latest: the headline current release.
- Prev: the stable previous release line shown beside Latest.
- Earlier: the older supported line.
- Historical: no VersionEnum change.

Add the public version to both structures:

- DORIS_VERSIONS drives the quick-download selector.
- ALL_VERSIONS drives the all-releases form.

In both structures, add x64, x64-noavx2, and arm64 rows. Each row must contain the binary gz, asc, sha512, source directory, and exact source filename version.

Keep patch releases newest-first within their series. Audit the entire target series in both arrays, not only the new entry. Every target-series version in DORIS_VERSIONS must exist in ALL_VERSIONS and vice versa. Fix a discovered omission when it is clearly a data drift in the requested release scope; mention it explicitly in the handoff.

Do not broadly reformat download.data.ts.

### Add Bilingual Release Notes

Create:

    releasenotes/v<series>/release-<public-version>.md
    i18n/zh-CN/docusaurus-plugin-content-docs-releases/current/v<series>/release-<public-version>.md

Use the repository JSON-inside-dashes frontmatter shape. At minimum:

- title contains the public version
- language is en or zh-CN as appropriate
- description contains the public version

Use the approved release-note source as the content authority. Preserve its section order, heading levels, bullet order, issue numbers, code spans, and acknowledgments. Remove only source-page navigation that is not part of the release itself, such as a backlink telling GitHub readers to visit a previous release. Make only small, obvious whitespace or Markdown corrections; do not invent features or rewrite technical claims.

For the translation:

- Translate prose and headings, not product names, code, SQL, configuration keys, paths, or issue numbers.
- Preserve the issue-reference sequence exactly.
- Preserve the heading-level sequence and bullet count.
- Check that every English item has one corresponding zh-CN item.
- Keep frontmatter valid JSON and remove trailing whitespace.

### Update the Core Index

Edit both Core history pages:

    releasenotes/core.md
    i18n/zh-CN/docusaurus-plugin-content-docs-releases/current/core.md

In each file:

- Update the relevant tip entry when the release is Latest, Prev, or Earlier.
- Add the dated per-version link to the chronological list.
- Use the confirmed YYYY-MM-DD release date.
- Keep the chronological list reverse-sorted by date.
- Keep English and zh-CN links, dates, and positioning aligned.

### Update Release Navigation

Edit sidebarsReleases.json:

- Find Doris Core and the matching v<series> category.
- Add v<series>/release-<public-version>.
- Place the new patch version first in its series.
- Add a new series category only when it does not already exist.
- Preserve valid JSON and unrelated ordering.

## Ecosystem Component Workflow

The bundled validator currently targets Doris Core. Use this workflow and the manual checklist for ecosystem components.

Most established ecosystem releases update:

    releasenotes/ecosystem/<component-page>.md
    i18n/zh-CN/docusaurus-plugin-content-docs-releases/current/ecosystem/<component-page>.md

Some also update src/constant/download.data.ts. Update sidebarsReleases.json only when adding a new ecosystem page; individual ecosystem versions normally remain sections within one component page.

Do not update Core per-version notes, releasenotes/core.md, its zh-CN mirror, or Core VersionEnum values for an ecosystem release unless the release manager explicitly requests a cross-surface change.

Component profiles:

| Component | Release page | Download data | Extra checks |
| --- | --- | --- | --- |
| Flink Connector | ecosystem/doris-flink-connector.md | ToolsEnum.Flink | Runtime compatibility matrix; exact .tgz or .tar.gz suffix |
| Spark Connector | ecosystem/doris-spark-connector.md | ToolsEnum.Spark | Spark and Scala compatibility; Maven coordinates |
| Kafka Connector | ecosystem/doris-kafka-connector.md | ToolsEnum.Kafka | Kafka Connect compatibility; plugin package layout |
| Streamloader | ecosystem/doris-streamloader.md | ToolsEnum.StreamLoader when present | Platform binaries, checksums, usage examples |
| Doris Operator | ecosystem/doris-operator.md | Usually none | Controller image, Helm chart, CRD compatibility |
| MCP Server | ecosystem/doris-mcp-server.md | Usually none | Package installation and supported Doris versions |
| Doris Skills | ecosystem/doris-skills.md | Usually none | Installation source and supported environments |
| Doris CLI | ecosystem/doris-cli.md | Usually none | Platform packages and install commands |

For an existing page:

- Add the newest version section near the top.
- Preserve the page frontmatter and anchors.
- Update English and zh-CN with matching facts, links, compatibility data, and issue references.
- Verify every official artifact or package link directly.

For a new page:

- Copy the nearest ecosystem page structure.
- Add both locales when expected.
- Add one sidebar entry under Doris Ecosystem.
- Check inbound links, route IDs, frontmatter, and stable URLs.

When updating TOOL_VERSIONS:

- Verify the exact source filename and directory.
- Preserve the existing Option shape.
- Keep versions newest-first.
- Do not add a Core VersionEnum entry.

## Validation

### Tier 0: Always Run

Run the validator tests:

    node --test doc-tools/skills/add-release/scripts/validate-release.test.mjs

For Doris Core, run the bundled validator with the confirmed values:

    node doc-tools/skills/add-release/scripts/validate-release.mjs --component doris-core --version <public-version> --series <series> --source-version <source-version> --release-date <YYYY-MM-DD> --position <latest|prev|earlier|historical> --source-dir <official-source-directory>

The validator checks:

- Both release-note files, JSON frontmatter, and trailing whitespace
- English and zh-CN heading levels, bullet counts, and issue-reference sequences
- Both core.md indexes, release date, link, and reverse chronology
- That both all-release.md project indexes still route to core.md and remain untouched
- sidebarsReleases.json parseability and newest-first placement
- VersionEnum positioning
- Target-series ordering and drift between DORIS_VERSIONS and ALL_VERSIONS
- All six architecture rows, source filename version, source directory, and binary filenames
- The full twelve-artifact URL matrix

Use --skip-links only when external link verification is explicitly out of scope, and disclose the skipped check. --skip-git-routing is intended for isolated test fixtures, not routine release work.

Also run:

    node -e "JSON.parse(require('fs').readFileSync('sidebarsReleases.json', 'utf8'))"
    git diff --check
    git status --short

git diff and git diff --check do not cover untracked release-note files. Inspect every path shown by git status, and ensure the new files are included in the validator run. Review the final tracked diff plus the full contents of every new untracked file.

For ecosystem releases, manually verify:

- Exact changed-file scope for the confirmed component
- English and zh-CN structure and facts
- Frontmatter and route IDs
- Download data ordering and field completeness when touched
- Every source, signature, checksum, package, image, or chart link
- Sidebar JSON when touched
- Untracked new files

### Tier 1: Type Check

When compilation checks are allowed and download data or TypeScript changed, run:

    yarn typecheck

### Tier 2: Full Site Build

When the release manager requests full validation, or routing and rendering risk warrants it, run:

    yarn build

If the release manager says not to compile, skip both Tier 1 and Tier 2. Tier 0 still applies. State exactly which tiers ran and which were skipped.

Do not claim validation passed unless the corresponding command completed successfully in the current worktree.

## Final Review and Handoff

Before reporting completion:

- Re-read the request and compare it with the exact changed-file set.
- Confirm the public version, source filename version, release date, scope, locales, and positioning.
- Confirm all artifact checks and note any mirror choice.
- Confirm DORIS_VERSIONS and ALL_VERSIONS are aligned for the target series.
- Confirm Core history is in core.md, not all-release.md.
- Confirm no unrelated files were modified.

Report:

- Component and version
- Files changed, including newly created untracked files
- Release-note source
- Public version versus source filename version
- Release date, position, website scope, and locales
- Artifact validation result
- Tier 0, Tier 1, and Tier 2 results or explicit skips
- Any repaired pre-existing data drift, such as a missing ALL_VERSIONS entry
- Any remaining limitation or manual follow-up

Do not commit, push, publish externally, or open a pull request unless the release manager asks.
