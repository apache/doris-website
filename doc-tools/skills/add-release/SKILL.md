---
name: add-release
description: Update the Apache Doris website for a new Doris core release. Use when a release manager asks to add or update website release information, download links, release notes, all-release indexes, or release sidebar entries for a Doris version such as 4.0.7, 4.1.3, 3.1.5, etc. This skill covers what release managers must prepare, which files to edit in doris-website, how to mirror English and Chinese release notes, how to update download.data.ts, and what validations and release-date/link caveats to check.
---

# Add Doris Release

Use this skill to update the Apache Doris website after a Doris core release is ready. The goal is to make `/download/` and `/releases/` show the new version with correct download links, release notes, navigation, and localized mirrors.

## Required Inputs from the Release Manager

Ask for any missing item before editing if it cannot be discovered safely from public release artifacts.

- **Version**: full version, for example `4.0.7`.
- **Release series**: major/minor line used in Apache dist paths, for example `4.0` for `4.0.7`.
- **Release note source**: usually a GitHub issue or Markdown body, for example `https://github.com/apache/doris/issues/65399`.
- **Release date**: prefer the official Apache download directory timestamp or release announcement date, not the release-note issue creation date. If uncertain, verify against `https://downloads.apache.org/doris/<series>/<version>/`.
- **Source package location**: usually `https://downloads.apache.org/doris/<series>/<version>/apache-doris-<version>-src.tar.gz` and matching `.asc` / `.sha512`.
- **Binary package locations**: confirm all supported binary tarballs exist on the configured binary CDN:
    - `https://download.selectdb.com/apache-doris-<version>-bin-x64.tar.gz`
    - `https://download.selectdb.com/apache-doris-<version>-bin-x64-noavx2.tar.gz`
    - `https://download.selectdb.com/apache-doris-<version>-bin-arm64.tar.gz`
    - matching `.asc` and `.sha512` files
- **Source filename version suffix**: determine whether the source tarball uses plain `<version>` or an RC-style suffix such as `<version>-rc02`. In `download.data.ts`, the `version` field controls the source tarball filename rendered by the download UI.
- **Release positioning**: whether the release becomes `VersionEnum.Latest`, `VersionEnum.Prev`, or only an entry in historical/all-release data.
- **Localization expectation**: by default, add both English and zh-CN release notes and update both all-release indexes.

## Files to Update

Work from the `doris-website` repository root.

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

### English Release Notes

Add:

```text
releasenotes/v<series>/release-<version>.md
```

Example:

```text
releasenotes/v4.0/release-4.0.7.md
```

Use frontmatter in the existing JSON-inside-`---` style:

```markdown
---
{
    "title": "Release 4.0.7",
    "language": "en",
    "description": "Apache Doris 4.0.7 release notes: ..."
}
---
```

Preserve the release-note source structure where possible:

- `# Overview`
- `# Behavior Changes`
- `# New Features & Improvements`
- `# Important Bug Fixes`
- `# Acknowledgments` when provided

If the source issue already contains polished English Markdown, copy it carefully, adapt only the frontmatter/title/overview wording needed for website consistency, and avoid inventing release content.

### Chinese Release Notes

Add the zh-CN mirror:

```text
i18n/zh-CN/docusaurus-plugin-content-docs-releases/current/v<series>/release-<version>.md
```

Use frontmatter:

```markdown
---
{
    "title": "Release 4.0.7",
    "language": "zh-CN",
    "description": "Apache Doris 4.0.7 版本发布说明：..."
}
---
```

Keep the Chinese file structurally aligned with the English file. Translate user-visible content faithfully; do not add new technical claims that are not in the English release note or source issue.

### Release Index Pages

Update both:

```text
releasenotes/all-release.md
i18n/zh-CN/docusaurus-plugin-content-docs-releases/current/all-release.md
```

In each file:

- Update the relevant tip block entry for that release line, for example replace the previous `4.0.6` summary with `4.0.7`.
- Add a bullet link near the top of the chronological list.
- Keep the list in reverse chronological order by release date.
- Use the official release date. If the Apache download directory shows a newer date than the release-note issue, prefer the official download/announcement date.

### Release Sidebar

Update:

```text
sidebarsReleases.json
```

Add the new release note ID under the matching version category:

```json
"v4.0/release-4.0.7"
```

Place it newest-first, before the previous patch release. Validate that the JSON remains parseable.

## Validation Checklist

Do not rely on visual inspection only. Run lightweight checks unless the user explicitly asks not to run commands. If the user says not to compile, do not run Docusaurus build.

Verify package links:

```shell
curl -sI https://downloads.apache.org/doris/<series>/<version>/apache-doris-<version>-src.tar.gz
curl -sI https://download.selectdb.com/apache-doris-<version>-bin-x64.tar.gz
curl -sI https://download.selectdb.com/apache-doris-<version>-bin-x64-noavx2.tar.gz
curl -sI https://download.selectdb.com/apache-doris-<version>-bin-arm64.tar.gz
```

Also spot-check representative `.asc` and `.sha512` URLs. Treat `200` as good. If HEAD behaves unexpectedly, retry with `curl -sIL` or GET before declaring a link broken.

Validate changed files:

```shell
git diff --check
node -e "JSON.parse(require('fs').readFileSync('sidebarsReleases.json','utf8')); console.log('sidebarsReleases.json ok')"
rg -n "<version>|release-<version>|apache-doris-<version>" src/constant/download.data.ts releasenotes i18n/zh-CN/docusaurus-plugin-content-docs-releases/current sidebarsReleases.json
```

When build validation is allowed and appropriate, run the repository's normal Docusaurus validation/build command. If the release manager explicitly says not to compile, report that build was intentionally skipped.

## Common Pitfalls

- **Wrong release date**: GitHub issue creation/update time is not always the official release date. Check Apache downloads or the announcement.
- **Missing `sidebarsReleases.json` update**: the page can exist but not appear in release navigation.
- **Only updating English**: mirror zh-CN release notes and all-release index unless the release manager explicitly scopes the task to English only.
- **Wrong source tarball suffix**: the UI constructs source URLs from `source + apache-doris-${version}-src.tar.gz`; the `version` field must match the actual source filename.
- **Updating only `DORIS_VERSIONS`**: quick download and all-releases use separate structures. Update both `DORIS_VERSIONS` and `ALL_VERSIONS`.
- **Confusing `docs/` with release docs**: current release notes are served by the releases docs plugin from `releasenotes/`, with zh-CN content under `i18n/zh-CN/docusaurus-plugin-content-docs-releases/current/`.
- **Forgetting signatures/checksums**: binary `.asc` and `.sha512` links should be present for every architecture.
- **Changing unrelated versions**: keep the diff focused on the new release.

## Final Response

Summarize:

- Release version added.
- Download data updated, including which quick-download enum changed.
- English and zh-CN release-note files created or updated.
- `all-release.md` and `sidebarsReleases.json` updated.
- Validation performed, including package-link checks and whether build was skipped.
