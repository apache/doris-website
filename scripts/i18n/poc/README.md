# Japanese PoC validation

Japanese is disabled unless `DORIS_ENABLE_JA=true` is set at build time. No
translation service runs in the browser or in the website deployment workflows.
The existing production workflows still build only English and Chinese.

For local debugging, generate the usual inputs, then build all three locales in
independent Node processes in one sequential job. The T02 run confirmed a
system OOM when earlier language heaps accumulated; the original same-process
command remains available only for historical comparison. Limiting documentation versions is useful for debugging, but does
not provide full CI memory evidence:

```bash
yarn key-features:generate
DORIS_ENABLE_JA=true DORIS_ASSET_ORIGIN= DOCS_VERSIONS=current \
  PWA_SERVICE_WORKER_URL=https://doris.apache.org/sw.js \
  yarn build:locales
```

An empty `DORIS_ASSET_ORIGIN` makes JS and CSS load from the output's own origin.
Leaving it unset preserves the production CDN. Worker chunks always use the
resolved same-origin language base URL, including single-locale previews.
A multi-locale output is required to validate the production `/ja/` routes.

`Japanese PoC` supports `workflow_dispatch` after merge and a read-only
`pull_request` entry for branches beginning with `feat/japanese-i18n-poc` before
merge. It builds the PR's base as the two-language baseline, then the PR head as
three languages on the same Ubuntu runner, Node 20, 8192 MiB Node heap and 8 GiB
additional swap. Each build keeps every active version and content/search
plugin. The workflow never deploys or uses deployment secrets.

Both dependency installations apply the same small upstream React 18.3.1 SSR
fix from [React PR #26228](https://github.com/react/react/pull/26228).
The original renderer can insert NUL bytes at UTF-8 buffer boundaries, corrupting
CJK IDs and link URLs when markup shifts. The patch flushes only written bytes;
it does not upgrade React or change document content. The PoC applies it through
`postinstall`; the workflow explicitly applies it to the original baseline too.
Evidence records both installed renderer file hashes to verify this parity.
The browser verifier rejects NUL bytes and compares all URLs exactly, without
discarding corrupted anchors. Remove the patch when upgrading to React 19.

The artifact contains the actual source SHAs, lock hashes, environment, commands,
per-language times, exit codes, GNU time output, sampled system/process memory,
cgroup metrics when readable, build logs, browser results and the new static
site. Process Max RSS and summed process RSS do not establish whole-runner memory
use. A failed or timed-out build cannot count as an OOM-free completed build.
Memory availability, swap availability, pressure and kernel/cgroup OOM counters
are also emitted to the job log every minute. On SIGTERM/SIGINT the observer
stops its own build process group and persists final counters where possible.
This keeps evidence visible when artifact upload is skipped; SIGKILL cannot be
handled, and a partial log cannot establish an OOM-free completed build.

The browser check uses Playwright installed separately from the website's
locked dependencies:

```bash
NODE_PATH=/path/to/browser/node_modules node scripts/i18n/poc/verify-static.cjs \
  --site build --output /tmp/japanese-poc-browser --expect-ja \
  --baseline /path/to/baseline/signatures.json
```

Use `--cdn-to-local` only when capturing an unmodified baseline whose original
configuration hard-codes CDN assets. The check intercepts that CDN and serves the
baseline's own files. Japanese validation uses real same-origin network requests.
For a local Dev build, add `--dev-only` to the browser command. It skips 4.x
routes and validates the Dev locale switch instead. Full 4.x and other active
versions are validated by CI; keep local builds limited to Dev.
In that preview only, the validator aliases `/docs/dev/search-index*.json` to
the same locale's own Dev index at its root, and records every alias. The
existing SearchBar assumes the stable version is included. Full CI uses the
production index layout without this preview adaptation.

Homepage message IDs are permanent. The numbered IDs are assigned once; do not
renumber them when reordering content or changing English wording. English
messages remain the fallback, and the new IDs have no Chinese overrides.
Japanese links to ordinary pages beyond the homepage use explicit English targets
and labels. Docs, community, courses and releases use the normal localized
content-plugin routes, with English fallback notices when no Japanese file exists.

The initial Japanese content consists of Dev/4.x Doris overviews, the Dev MDX
getting-started page, and the community joining page. Their heading IDs match
English. Intentional untranslated content: product/customer/brand/theme names,
SQL and example result titles, numbers and units, legal/license notices, and text
embedded in existing diagram images and the documentation overview illustration.
The homepage's owned news announcements and HTML illustration captions are
translated. Japanese search, complete translation status/SEO, and public launch
remain later tasks; passing this PoC does not authorize enabling Japanese in
production.

Use `measure-build.py --separate-locales --japanese` for the isolated full three-language probe. It preserves the complete version/plugin scope and records each child PID. Production cron/manual use the same launcher while Japanese remains disabled.
