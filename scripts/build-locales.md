# Sequential locale builds

Use `yarn build` or `yarn build:locales` for complete website builds. The launcher
reads the actual enabled locales from the site configuration and builds each in
an independent Node process, sequentially. Locales still being introduced stay
disabled unless `DORIS_ENABLE_LOCALES` lists them (CI) or their own
`DORIS_ENABLE_<LANG>` flag is set (a developer, and every publishing workflow);
no translation or deployment service is called. Both the locale list and each
locale's label and `htmlLang` come from `config/i18n.js`.

Publishing workflows use `yarn build:publish`, which shares binary resources
and webpack assets and compacts legacy redirects after assembly. See
[publication artifacts](publish/README.md) for hosting requirements, previews,
bounded local checks and size reports. Ordinary builds retain their layout.

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

## Publishing job measurements

The cron and manual publishing workflows retain separate
`publish-build-measurements-<run>-<attempt>` and
`publish-deploy-measurements-<run>-<attempt>` artifacts for 14 days. These reports
stay outside `build/` and are uploaded after failures as well as successes.
Hard job timeouts or runner loss can prevent this final upload; retain the
Actions jobs JSON and logs when that happens.

The build job has a temporary 180-minute limit, matching the existing deploy
limit. This is a budget change, not a measured speedup. Both job summaries show
elapsed time through reporting and a provisional `ceil(elapsed * 1.3 / 60)`
budget in minutes. Accept a budget only after a successful complete run,
including the final telemetry upload and cleanup steps. A failed or incomplete
run cannot establish a successful publishing baseline.

The reports contain the resolved source SHA separately from the trusted
workflow/checkout SHA, runner image and hardware context, active versions,
locale switches, cache policy, per-step timings, output file counts/bytes and
site artifact archive size/digest. The build and strict verification commands
also retain GNU `time -v` output, including maximum RSS. Ten-second samples
capture system memory availability and workspace/`/mnt` disk use for each step.
These are sampled extrema, not continuous disk peaks or process RSS. Artifact,
OSS and asf-site process RSS and exact network bytes are not measured; use
archive/output sizes and the transfer action logs without calling them billed
network traffic. GNU time reports command RSS, not the sum of every concurrent
process's memory.

Compare runs only after checking their source SHA (including generated-input
diff/build stamps), runner image, CPU/memory, versions, locales and cache
conditions. The publishing workflows retain their uncached install behavior.
The manual build reads measurement code from the trusted workflow SHA, so an
older protected source branch does not need to contain the measurement script.
The reporting token has only the job's existing contents permission plus
`actions: read`; no publishing secrets enter the build job or reports.

To preserve the final timing and queue evidence for an existing run:

```bash
gh api repos/apache/doris-website/actions/runs/RUN_ID > run.json
gh api repos/apache/doris-website/actions/runs/RUN_ID/attempts/ATTEMPT/jobs > jobs.json
gh run download RUN_ID --repo apache/doris-website --pattern 'publish-*-measurements-*'
```

Use `run.json` creation time, job start/end times and the report's resolved
source SHA together. The workflow run's head SHA can differ from the source
resolved by the protected-branch job. Separate queue/dependency waits from
runner execution; preserve failed/cancelled attempts rather than merging them
into successful timing samples. After matching the uploaded and downloaded
artifact identities and successful OSS/asf-site steps, record the complete
build/deploy durations and require about 30% budget margin for each job.
