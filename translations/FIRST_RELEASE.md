# First public release verification

A pull request can establish candidate readiness. Public acceptance requires the
merged source, the successful complete production artifact and the actual site.
Keep T09 and milestone M1 pending until that evidence exists. Never combine
locale outputs from different commits to construct a release.

Before review, run the translation unit tests, workflow security checks, manual
report, native fixtures and homepage/browser checks. The T06–T09 PR uses the `ci/full` label to request a complete five-language
publication build. Ordinary shared changes keep the existing layered sample
policy; the label is specific to this initial acceptance.
Its first-release verifier checks all active versions, English/Japanese/Korean/
Russian homepage bodies and the intentional Chinese English-body fallback,
SSR SEO/sitemap reciprocity, English fallback, 404, navigation and all eight
brand themes at widths 1440, 1280, 900 and 390. Candidate screenshots and JSON reports are
uploaded with the existing measurements artifact. Local `--landing-only` checks
explicitly exclude docs/blog/community and cannot establish a release.

After merge, record the production Actions run, source SHA, site artifact digest,
asf-site SHA and the build/verification/artifact/deploy timing and resource
measurements. Download that run's complete `site-build-*` artifact and
`publish-build-measurements-*` artifact without mixing runs. They contain the
native manifests, build result, coverage and manual-drift reports. With Playwright
installed as in `build-check.yml`, repeat against the public origin:

```bash
node scripts/i18n/verify-first-release.cjs \
  --site /absolute/path/to/downloaded/site \
  --manifests /absolute/path/to/downloaded/content-manifests \
  --build-report /absolute/path/to/downloaded/build-result.json \
  --source-sha <production-source-sha> \
  --asf-sha <verified-asf-site-sha> \
  --run-url https://github.com/apache/doris-website/actions/runs/<run-id> \
  --origin https://doris.apache.org \
  --output .i18n-build/first-public-release.json
```

The public mode requires a clean, successful five-language build report and the
same source in all native manifests. It compares the five public homepage HTML
responses and their fetched compiled JS/CSS against the downloaded artifact.
The run/asf-site identities must also be confirmed from the production workflow
and branch history; passing arbitrary SHA strings to the verifier is not proof
of deployment. Retain the production metrics and review remaining English-body
pages alongside the browser report; an HTTP 200 or PR check alone is insufficient.

If compilation, admission or verification fails, keep the previous complete site.
The deployment jobs consume only their successful build job's complete artifact.
To roll back while the previous run's complete artifact is still retained,
identify that successful run's deployment job ID with
`gh run view <run-id> --repo apache/doris-website --json jobs`, then rerun only
that original job with
`gh run rerun <run-id> --job <deploy-job-id> --repo apache/doris-website`. Verify
the job still resolves the original artifact/source before publication. If the
artifact has expired, revert this PR on master through the normal review flow
and let the full production workflow rebuild that single source snapshot.
Record the resulting source/asf-site identities and verify the restored release.
A rollback to a release without the agreed homepage language policy withdraws M1; its
first-release readiness check should fail rather than claim unchanged coverage. Do not roll back only one locale
or edit state hashes to disguise a damaged translation. A content-only rollback
may mark one homepage locale `missing`, while shared navigation remains localized.
