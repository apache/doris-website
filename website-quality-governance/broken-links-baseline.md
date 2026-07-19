# Broken Links Baseline

Week 3 introduces read-only internal link governance for Markdown/MDX content, image references, source-file references, Docusaurus routes, same-page/file anchors, and moved or deleted document impacts.

## Baseline Snapshot

Generated locally on 2026-04-24 with:

```bash
yarn docs:links --output /tmp/doris-docs-links-full-week3-main.json
```

Summary:

| Severity | Count | Meaning |
| --- | ---: | --- |
| error | 1,288 | Internal links, images, routes, or anchors that the checker cannot resolve. |
| info | 26,242 | External links classified for scheduled audit only; no network fetch is performed. |

Internal error breakdown:

| Rule | Count | Primary fix |
| --- | ---: | --- |
| `link-missing-target` | 653 | Update the target path, add redirects, restore the target page, or mark an intentional exception. |
| `link-missing-anchor` | 635 | Update the anchor, add an explicit heading ID, or rewrite the link to the page without the stale anchor. |

Internal error distribution by content root:

| Content root | Missing target | Missing anchor | Total |
| --- | ---: | ---: | ---: |
| `ja-source/` | 126 | 376 | 502 |
| `i18n/` | 270 | 126 | 396 |
| `versioned_docs/` | 191 | 97 | 288 |
| `docs/` | 28 | 36 | 64 |
| `releasenotes/` | 21 | 0 | 21 |
| `community/` | 9 | 0 | 9 |
| `blog/` | 8 | 0 | 8 |

Representative internal errors from the first full scan:

| Path | Rule | Example |
| --- | --- | --- |
| `docs/admin-manual/auth/authentication-and-authorization.md` | `link-missing-target` | `./ldap.md`, `./ranger.md` |
| `community/developer-guide/docker-dev.md` | `link-missing-target` | `/docs/install/source-install/compilation`, `/docs/install/install-deploy` |
| `blog/release-note-2.1.6.md` | `link-missing-target` | `../../admin-manual/cluster-management/upgrade` |
| `ja-source/` pages | `link-missing-anchor` | localized anchors that no longer match the target heading slug |
| `i18n/` pages | `link-missing-target` and `link-missing-anchor` | localized or versioned links that drifted from current routes |

## Current Policy

- Internal broken links in changed files are blocking scope for PRs through `docs:links:changed --fail-on-errors`.
- Docusaurus broken-link behavior is controlled by `DORIS_DOCUSAURUS_BROKEN_LINKS` and `DORIS_DOCUSAURUS_BROKEN_MARKDOWN_LINKS`. The default remains `warn` until the historical baseline is reduced enough to safely enable `throw` for all PR builds.
- External links are report-only in PR checks. The checker classifies them but does not fetch network resources, so transient remote failures cannot block a pull request.
- Moved, renamed, deleted, or slug-changed Markdown/MDX files require redirect and inbound-link review. The checker reports the issue but does not edit redirects or content.
- All checks are read-only. Historical cleanup should be handled through explicit follow-up PRs.

## Commands

Generate the changed-file governance report:

```bash
yarn docs:lint:changed --output website-quality-governance/generated/docs-governance-report.json
```

Run only the link checker against changed files:

```bash
yarn docs:links:changed --output website-quality-governance/generated/docs-links-report.json
```

Run the full link checker:

```bash
yarn docs:links --output website-quality-governance/generated/docs-links-full-report.json
```

## Rollout Plan

1. Block new internal broken links through `docs:links:changed --fail-on-errors`, which only fails on `error` findings and keeps external links report-only.
2. Use `docs:lint:changed` for PR annotations covering links that Docusaurus may not fully explain, especially moved/deleted files and redirect-review needs.
3. Keep Docusaurus build at `warn` for now because `DOCS_VERSIONS=current DORIS_DOCUSAURUS_BROKEN_LINKS=throw DORIS_DOCUSAURUS_BROKEN_MARKDOWN_LINKS=throw yarn build` currently fails on existing tracked broken links.
4. Run full `docs:links` on a scheduled job or manually to identify historical issues without blocking ordinary PRs.
5. Batch-fix historical internal dead links by area: active English docs first, active Chinese localized docs second, then community/releases/blog and archived versions.
6. Enable Docusaurus `throw` in PR builds only after the full baseline is clean or reduced to an explicitly accepted exception list.
7. Keep external link availability as a scheduled report-only audit that can create issues, not as a PR gate.

## Historical Cleanup Priority

1. Fix active English docs under `docs/` first because these are the highest-traffic canonical pages and should become the quality reference for localized and versioned docs.
2. Fix active localized docs under `i18n/zh-CN/` and `ja-source/` next, using the corresponding English page as the source of truth when route or anchor drift is caused by translation lag.
3. Fix active versioned docs under `versioned_docs/version-4.x/` and `versioned_docs/version-3.x/`, especially links that point to moved install, ecosystem, admin, and table-design pages.
4. Fix community and release-note pages after canonical docs are stable. These pages often contain older route patterns and should be corrected without changing release semantics.
5. Keep external links out of PR blocking. A scheduled workflow should fetch them with retry and create an issue that groups failures by domain and owner.

## Baseline Maintenance

- Refresh this snapshot after each historical cleanup batch by running `yarn docs:links --output /tmp/doris-docs-links-full.json` and updating the count tables above.
- Do not commit the full JSON report unless a release manager explicitly wants an auditable artifact; it is large and better suited to CI artifacts or issue attachments.
- A PR should only be blocked by new or changed internal link errors. Existing historical errors stay tracked by this baseline until the relevant cleanup batch fixes them.
