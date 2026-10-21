# Russian inventory baseline

Source commit: `82ccae858254f24b1b3a85f181ec289e386d33ae` (Apache master).

| Group | Required | Merged/current at baseline | Pending at baseline | Drafts |
| --- | ---: | ---: | ---: | ---: |
| DEV | 1674 | 0 | 1674 | 1 |
| 4X | 1619 | 0 | 1619 | 1 |
| COMMUNITY | 51 | 0 | 51 | 0 |

This is the single initial native inventory, generated before adding Russian
sample targets. The source files and native routes were reconciled against the
commit above without version or plugin trimming. Russian registration was a
working-tree addition during this enumeration, as registration, navigation,
search and launch configuration are delivered together. The routing hashes in
`summary.json` describe that enumeration; they are historical evidence, not a
requirement that later configuration retain those bytes.

The four machine-reviewed sample targets in the launch PR do not count as merged
coverage here. Recount from clean merged master after the PR merges:

```bash
I18N_LOCALE=ru node scripts/i18n/audit-coverage.cjs --source-ref HEAD --output /tmp/ru-coverage.json
```

The JSON batch IDs are historical sidebar ordering metadata. Select actual work
from the dynamic planner and current open PRs; they are not preassigned execution
batches, PR boundaries or ownership. Keep this snapshot, and let the audit discover
new, changed, moved and deleted native nodes.

All three source groups have zero unregistered or underscore-prefixed Markdown
files. Drafts are excluded from the required denominator; unlisted pages remain
required and retain their native noindex behavior. `summary.json` records the
native reports, including Chinese-only unsupported source routes outside this
translation scope. No whole-document English exceptions are granted. Technical
sidebar labels have individual reasons in `translations/scope/ru.json`.

`key-feature-priority.json` maps the actual Key Features generator inputs to Dev
identities for T09 and T12. These are document dependencies, not fixed translation
batches. No Russian product page is registered by this PR.
