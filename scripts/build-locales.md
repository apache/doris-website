# Sequential locale builds

Use `yarn build` or `yarn build:locales` for complete website builds. The launcher
reads the actual enabled locales from the site configuration and builds each in
an independent Node process, sequentially. Japanese remains disabled unless
`DORIS_ENABLE_JA=true`; no translation or deployment service is called.

```bash
# Local development: only the actual Dev docs version.
DOCS_VERSIONS=current DORIS_ASSET_ORIGIN='' yarn build:locales
DORIS_ENABLE_JA=true DOCS_VERSIONS=current DORIS_ASSET_ORIGIN='' \
  yarn build:locales --out-dir .i18n-build/preview
# Check one locale without rebuilding the others.
DORIS_ENABLE_JA=true DOCS_VERSIONS=current yarn build:locales --locales ja
```

`--locales` accepts a comma-separated selection of configured locales. The
selection keeps the configured order, so a list containing the default locale
still builds it first. A selection without the default locale is a locale-only
subset: nothing owns the root, and every built locale stays beneath its own
prefix. An unknown, empty or duplicated selection fails before any build starts.
Omitting the option keeps the previous behaviour and builds every enabled
locale, which is what publishing requires.

The adapter calls the installed Docusaurus 3.6.3 `buildLocale` implementation
without the single-locale CLI path override. Every child therefore retains all
configured language alternatives, its native base URL (`/`, `/zh-CN/`, `/ja/`)
and its localized output directory. Moving a root-path single-locale build into
`ja/` would produce incorrect resource URLs and is not used.

The default locale is built first. All child outputs are prepared in one
adjacent temporary directory. After every child succeeds, the launcher moves
those outputs into the complete tree: root control files belong to the default
locale, and later locales only populate their own prefix. When the default
locale was not selected the launcher assembles an empty root instead, so the
result is a valid locale-only subset rather than a site with one language
promoted to the root. A failed child or a changed Git commit/tracked source diff
leaves the previous complete output untouched. Cron and manual deployment upload
only after this command succeeds. Assembly uses renames, avoiding a second full
copy of all generated site files.

A subset artifact is a compile and content check, not something to publish: the
cross-locale assertions of `scripts/i18n/verify-static.cjs` need the English and
Chinese counterparts, so pull-request checks pass `--partial` to report those as
skipped. Publishing always builds every locale and verifies without `--partial`,
where a missing counterpart is still a failure.

The source stamp, per-locale PID, base URL and timings are recorded in
`.i18n-build/build-result.json`. The memory observer can run the same entry point
with `--separate-locales` and records system/cgroup OOM counters, memory and swap
along with those process boundaries. A whole-job OOM may kill the runner before
artifact upload; periodic JSON log records preserve the diagnosis.

This adapter is pinned to Docusaurus 3.6.3. Revalidate its internal build API,
paths and artifact assembly before upgrading. Simultaneous builds in the same
checkout are unsupported because Docusaurus shares `.docusaurus`; use separate
checkouts.

`node --test scripts/__tests__/build-locales.test.cjs` verifies assembly,
disabled Japanese, failures, source changes and invalid output prefixes.
`node scripts/i18n/verify-fixture.cjs --browser` exercises the actual native
three-language build and browser routing. Full active-version and OOM evidence
comes from GitHub CI; local website verification uses `DOCS_VERSIONS=current`.
