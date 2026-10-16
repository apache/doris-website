# Japanese PoC validation

Japanese is enabled when `DORIS_ENABLE_JA=true` is set at build time. The
production cron and manual workflows build English, Chinese, and Japanese.
No translation service runs in the browser or in website deployment workflows.

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

The launch was validated by the full-build and document-scope jobs in
[PR #4211](https://github.com/apache/doris-website/pull/4211). Those temporary
workflows have been removed after launch. Keep these scripts for local or
explicitly arranged full-matrix checks. For an Ubuntu comparison, build the
English/Chinese base and the three-language candidate on the same runner with
Node 20, an 8192 MiB Node heap, 8 GiB additional swap, every active version,
and the original content/search plugins. The scripts do not deploy or use
deployment secrets.

Both dependency installations apply the same small upstream React 18.3.1 SSR
fix from [React PR #26228](https://github.com/react/react/pull/26228).
The original renderer can insert NUL bytes at UTF-8 buffer boundaries, corrupting
CJK IDs and link URLs when markup shifts. The patch flushes only written bytes;
it does not upgrade React or change document content. `postinstall` applies the
patch to local builds; when comparing an older base, apply the same patch there
and record both installed renderer file hashes to verify parity.
The browser verifier rejects NUL bytes and compares all URLs exactly, without
discarding corrupted anchors. Remove the patch when upgrading to React 19.

`measure-build.py` records the actual source SHAs, lock hashes, environment, commands,
per-language times, exit codes, GNU time output, sampled system/process memory,
cgroup metrics when readable, and build logs. The browser verifier records its
own results and screenshots. Process Max RSS and summed process RSS do not establish whole-runner memory
use. A failed or timed-out build cannot count as an OOM-free completed build.
Memory availability, swap availability, pressure and kernel/cgroup OOM counters
are also emitted to stdout every minute. On SIGTERM/SIGINT the observer
stops its own build process group and persists final counters where possible.
This keeps evidence visible when an artifact upload is skipped; SIGKILL cannot be
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
existing SearchBar assumes the stable version is included. A full build uses
the production index layout without this preview adaptation.

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
translated. Japanese search and per-page translation status/SEO are live after
T05; untranslated documentation displays the same-version English source with
a Japanese notice. Translation coverage remains incomplete and is tracked by
the coverage audit.

Use `measure-build.py --separate-locales --japanese` for an isolated full
three-language probe. It preserves the complete version/plugin scope and
records each child PID. Production cron/manual use the same locale launcher
with Japanese enabled.
