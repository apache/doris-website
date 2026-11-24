# Publication artifacts

`yarn build:publish` builds the enabled locales in separate, sequential Node
processes, then optimizes and verifies their assembled output before replacing
the previous artifact. Cron and manual deployment use this entry point. Normal
`yarn build`, `yarn build:locales`, development servers and locale-only checks
retain their existing asset layout.

## What changes

- The bundler generates shared root asset URLs before calculating bundle hashes.
  Image, font and download loaders use content hashes instead of source names.
  The assembler merges the locale asset directories, rejecting any filename
  collision with different contents. JavaScript and CSS are never rewritten
  after hashing. Search workers load from the same-origin root; their indexes
  remain language-specific.
- Identical static images, fonts and downloads share one file. Old public URLs
  use non-cacheable temporary redirects to their canonical resource, so an
  updated image cannot be pinned to an older content hash. Distinct compiled asset filenames stay
  present because the asset CDN does not interpret Apache rules.
- Exact Docusaurus client-redirect templates become HTTP 301 rules. Large
  `.html`/`.htm`, 3.x and release-note alias families use guarded prefix rules;
  other aliases are grouped by destination and split into directives of at most
  8,000 UTF-8 bytes, below Apache's 8,190-byte `.htaccess` line limit. The bound
  includes escaped paths, redirect targets and flags. Real files retain priority,
  missing destinations do not redirect through a generic rule, and query/fragment
  forwarding follows the original template. Custom HTML such as the tracked
  Slack redirect remains a page.
  Binary compatibility rules live in their static-resource directories, so
  normal pages and compiled asset requests do not parse the image alias tables.
- Brand-theme and course-rail initialization use content-addressed blocking
  head scripts during publication, preserving their before-paint behavior.
  The cropped navbar logo is a shared SVG image with the same artwork and size.

Document versions, translations, canonical URLs, heading IDs, navigation,
search contents and search ranking do not change. The existing gzip delivery
is retained. This does not delete historical objects from the OSS bucket;
the existing incremental upload policy continues to preserve old cached assets.

The optimized HTML site requires Apache with `mod_rewrite` and the generated
root `.htaccess`, as used by the ASF website. The CDN serves actual compiled
files at their new root URLs; it does not need to implement the compatibility
redirects. An OSS object endpoint alone is not a replacement for the HTML host.
Use `yarn serve:publish --site build --port 3000` for a local preview that
understands the redirect manifest. A generic file server cannot reproduce
removed legacy paths. `.publish/redirects.json` describes those redirects for
preview and validation; it contains public URLs only.

## Validation and memory

Run the small real three-language fixture first. It exercises CSS/font/image
loaders, language-specific bundles, lazy chunks, search workers, resources,
redirect destinations and the default/subset assembly behavior:

```bash
node --test scripts/publish/__tests__/*.test.cjs
NODE_OPTIONS=--max-old-space-size=2048 node scripts/publish/verify-fixture.cjs
```

The fixture uses `https://assets-cdn.selectdb.com/site` and serves those
requests from the artifact under test, exercising the real CDN directory prefix.
Use `--same-origin-assets` for the local-only asset variant.
With Playwright available separately through `NODE_PATH`, add `--browser`.
`--apache` also checks the generated rules against a temporary loopback-only
Apache instance. `--compare` builds an unoptimized fixture for size comparison;
`--verify-existing` repeats HTTP/browser checks without rebuilding it.
The fixture defaults to the site's Rspack mode; `--webpack` also verifies the
non-faster Docusaurus build path.
`DORIS_TEST_APACHE=true` enables the Apache regression test, including Unicode
paths, query/fragment behavior, extension aliases and legacy version prefixes.

Local website validation should stay within Dev, with bounded heap and SSR
concurrency. Do not run concurrent builds in the same checkout:

```bash
yarn key-features:generate
DOCS_VERSIONS=current DORIS_ENABLE_JA=true DORIS_ASSET_ORIGIN='' \
  NODE_OPTIONS=--max-old-space-size=4096 DOCUSAURUS_SSR_CONCURRENCY=2 \
  yarn build:publish --out-dir .i18n-build/dev-publish
node scripts/publish/verify.cjs .i18n-build/dev-publish
yarn serve:publish --site .i18n-build/dev-publish
```

`.i18n-build/publish-result.json` records before/after bytes, file counts,
redirect pages, rule counts and verification. `.i18n-build/build-result.json`
also records per-locale timing and build success. Counts describe raw files,
not compressed network transfer or Git pack size. Source changes, invalid
redirects, oversized Apache control lines (including continued lines and
static-resource controls), resource verification failures and asset collisions
preserve the previous complete output.

Changes to publication infrastructure make Build Check build every active
version and enabled locale using the optimized mode on CI, with the existing
8 GiB heap/swap configuration. It verifies localized metadata and uploads
the measurement reports, without deploying the PR.

## Website OSS publication

Production asset URLs use `https://assets-cdn.selectdb.com/site`. The automatic
and manual website deploy jobs read `WEBSITE_ASSET_BASE_URL`, `WEBSITE_OSS_BUCKET`,
`WEBSITE_OSS_REGION`, `WEBSITE_OSS_ENDPOINT`, `ALIYUN_OIDC_PROVIDER_ARN` and
`ALIYUN_WEBSITE_ROLE_ARN` from repository Actions variables. The verified role
can read and write only `site/` in the private Beijing bucket. Both workflows
publish only master; the manual workflow rejects another branch before building.

Initially keep both `WEBSITE_ASSET_UPLOAD_ENABLED` and `WEBSITE_PUBLISH_ENABLED`
false. Set the upload variable true to exercise the new upload and CDN checks
without publishing HTML. Set `WEBSITE_PUBLISH_ENABLED=true` only after validating
the complete build, CDN and remaining recovery gaps. While the publication
variable is false, the ASF publication step is skipped. With both variables
false, the deployment jobs are skipped and builds still produce reviewable
artifacts. The deployment timeout stays below the one-hour STS session.
No GitHub Environment or permanent OSS access key is used.

The local `upload-website-assets` action prepares a public copy without Apache
controls, Git metadata, environment files or CI reports. The original artifact
retains its ASF controls. Symlinks and sample artifacts are rejected, and every
locale reported by the build job must have its entry page and prefixed assets.
ossutil 2.4.1 uploads this copy to `site/` with request retries and one-hour cache
headers. This initial migration uploads the public copy in full; it never uses
delete synchronization or changes `media/` or `downloads/`.

Before ASF publication, verify exact CDN bytes and CORS for the entry scripts,
styles, search contexts and a unique run probe. A file/checksum receipt is retained
with the publishing measurements. Upload or delivery errors prevent publishing
the HTML. Historical asset objects remain available in the versioned bucket.

Deploy jobs download the successful build's artifact ID, so rerunning only a
deployment does not look for a new artifact under the retry's run-attempt name.
This behavior applies to runs created with the artifact-ID workflow changes.

The archived PDF workflow exports repository snapshots and uses a separate
role restricted to `apache-doris-downloads/doris-website/docs/archived/`; see
[`scripts/docs-pdf/README.md`](../docs-pdf/README.md). Distribution packages
use the public-read release mirror. Complete and check the bucket replication
before deploying the endpoint change. The catalog and recovery procedure are documented in
[`download-recovery.md`](download-recovery.md).
