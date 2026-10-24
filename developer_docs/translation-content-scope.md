# Automated translation content scope

The Japanese, Korean and Russian pipelines use `translations/scope/<locale>.json`
to discover source additions, edits and removals. All three languages run twice
daily and support manual dispatch. Japanese runs at 04:23 and 16:23 UTC, Korean
at 04:43 and 16:43 UTC, and Russian at 05:03 and 17:03 UTC. The shared
`docs-translation` lock queues discovery and generation across all three languages.
Scheduled runs and default manual runs use `generate`; select `dry-run` explicitly
to inspect pending work without model calls.

In addition to Dev, 4.x and community documentation, each scope includes:

| Content | Source | Translation group |
| --- | --- | --- |
| Doris 101 lessons | `course/` | `COURSE` |
| Release notes | `releasenotes/` | `RELEASES` |
| Course landing page, lesson controls and Hackathon tasks | `src/components/course/`, `src/pages/course/` | `COURSEUI` |
| Weekly report bodies and exported metadata | `src/pages/community-report/_reports/` | `REPORT` |
| Weekly report interface | `src/components/community-report-next/`, `src/pages/community-report/` | `REPORTUI` |

`COURSE` and `RELEASES` use native Docusaurus document identities and sidebars.
The other groups describe source modules or MDX partials, rather than new public
routes. Templates, tests and declaration files are excluded. TypeScript modules
without visible prose do not create translation tasks.

Course props, JSX text and the static `label`, `week`, `stats` and `report` exports
contain prose inside executable source. These groups use extracted text units.
The model receives text values; the pipeline escapes and inserts translations
into the original source. Code, property names, URLs, IDs, numbers and code samples
remain protected. Unchanged text units reuse the previous translation.

Targets use the existing `i18n/<locale>/docusaurus-plugin-content-docs-<plugin>/current/`
layout and page state records. Open-PR reservations, source hashes, ownership and
publication checks apply to these targets too. At build time, the content loader
uses only a current, reviewed target and checks protected content again before
compilation. Imports resolve relative to the original source module. Missing or
stale targets use the current English source.

Course and Hackathon ordinary pages are advertised as translated after the
course interface group is current. The weekly report page requires both its
interface and report groups to be current. Until then, the existing English
fallback routing and SEO behavior continue to apply. Individual translated
lessons use the native document translation status independently.

To inspect a specific source without generating translations, choose `dry-run`
in a language's discovery workflow and set `path`, or supply an exact JSON list
in `paths`. These filters accept Markdown, MDX, TypeScript and TSX source files;
TypeScript files must belong to a configured `code` group. Scheduled runs scan
the entire current scope, including newly added source files.

Validation:

```sh
node scripts/i18n/check-configuration.cjs --all
node --test scripts/i18n/__tests__/*.test.cjs
I18N_VERIFY_CONTENT_BUILD=true node --test --test-name-pattern='production builds render' scripts/i18n/__tests__/expanded-scope.test.cjs
```
