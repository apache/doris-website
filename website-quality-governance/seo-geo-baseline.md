# SEO and GEO Baseline

This runbook records the standing policy for Apache Doris website SEO and generative-engine optimization checks.

## Static Entry Points

- `static/robots.txt` allows Google and Bing search crawlers.
- `static/robots.txt` allows search-style AI crawlers for public documentation retrieval.
- `static/robots.txt` allows training-style AI crawlers for public documentation access, including GPTBot, CCBot, and Google-Extended.
- `static/llms.txt` lists curated Overview, Getting Started, SQL Manual, Load, Lakehouse, AI, Admin, Release Notes, and Community entry points.
- `static/llms-full-docs.txt` is intentionally a compact topic index, not a full content dump.

## Localized Indexing

- A section that only repeats the default locale's content is kept out of the index. A locale's blog routes are `noindex` until that locale holds a translated post (`hasBlogTranslations` in `config/i18n.js`), and an untranslated docs page is `noindex` with a canonical to the default locale (`src/theme/DocItem/Metadata`).
- The sitemap plugin skips noindex routes, so those URLs leave the locale's sitemap as well. A localized page that should rank needs a real translation, not an indexable English copy.
- `static/robots.txt` declares every locale's sitemap (`/zh-CN/sitemap.xml`, `/ja/sitemap.xml`). Each locale builds its own sitemap, and Google retired the sitemap ping endpoint, so a new locale also needs its sitemap submitted in Search Console.
- Sitemaps carry `lastmod` from each file's last commit, so a deploy has to check out full history (`fetch-depth: 0`).

## Structured Data Plan

- Blog pages should use `BlogPosting` schema with headline, description, date, author, and canonical URL.
- Documentation pages should use `TechArticle` when the page is technical reference or procedural content; otherwise use `Article`.
- Documentation pages should include `BreadcrumbList` structured data derived from sidebar or route hierarchy.
- Structured data should be added through Docusaurus theme components or a shared SEO component so locale and version metadata remain consistent.

## Search Console and Bing Webmaster Plan

Collect these fields weekly after site verification is available:

- Search impressions by page and query.
- Search clicks by page and query.
- Indexing errors, including excluded and crawled-but-not-indexed URLs.
- Top query per major section: docs, blog, community, releases, and localized pages.
- 404 URLs and their referrers where available.

Store exports under `website-quality-governance/generated/` or the team analytics system. Do not commit raw private account exports unless the project has agreed they are safe to publish.

## Review Cadence

- Review SEO lint findings during PR checks with `yarn docs:lint:changed`.
- Review full-site SEO drift before major releases with `yarn docs:seo`.
- Keep PR checks changed-only until historical SEO debt is reduced. Full-site scans should run as scheduled audits or release-readiness checks, not as an immediate full-site PR gate.
- Revisit AI crawler policy when ASF or Apache Doris community guidance changes.
