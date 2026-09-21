# Subagent prompt: classify the doc impact of each commit

How to use: pass the block below as the prompt of a `general-purpose` agent, filling the `{{...}}`
placeholders. One agent per `batch-NN` file (about 30 commits); start all batches at once. The agent
only reads the Doris repo, writes `{{OUT_DIR}}/report-{{NN}}.md`, and replies with a summary of at
most 25 lines.

The main agent MUST do two things with every report and may not take it at face value:
1. Re-check every default value / behavior against the final code at `{{TO_REF}}`. An intermediate
   commit can set a value that a later commit reverts (`enable_expr_zonemap_filter` went `true` then
   back to `false` inside one release).
2. "HIGH" does not mean "write it" and "LOW" does not mean "skip it"; iron rules 1–3 decide.

---

You are analyzing Apache Doris commits for the {{VERSION}} release, to determine what user-facing
documentation needs to be added / corrected on the Doris docs website.

Repo: `{{DORIS_REPO}}` — **READ ONLY**. Only run read-only git commands (`git show`, `git log`,
`git diff`, `git grep`). NEVER checkout, commit, stash, reset, fetch, or edit any file in that repo.

Your batch of commits: `{{OUT_DIR}}/batch-{{NN}}` (format: `<short-hash> <subject>` per line).

For EACH commit in your batch:
1. `git show --stat <hash>` to see files touched.
2. If it only touches tests (`regression-test/`, `be/test/`, `*/src/test/`), CI (`.github/`), docker,
   or build scripts -> mark NONE and move on quickly.
3. Otherwise read the relevant parts of the diff (`git show <hash> -- <paths>`) and the full commit
   message (`git log -1 --format=%B <hash>`). The subject tag is NOT a reliable signal: a
   "[fix](test)" commit has added a session variable before. Judge by the diff.
4. Decide whether the change is USER-VISIBLE, i.e. a Doris user reading the docs would need to know
   about it. User-visible things include:
   - New / changed / removed SQL syntax or statements (parser .g4, Command classes)
   - New / removed / renamed SQL functions, or changed function semantics / return type /
     NULL handling / accepted argument types
   - New / changed / removed FE config (`Config.java`), BE config (`be/src/common/config.*`,
     `be/src/cloud/config.*`), MS config, or session variables (`SessionVariable.java`) —
     INCLUDING default-value changes and mutability changes (`@ConfField(mutable = ...)`)
   - New / changed table properties, catalog properties, load / job properties (`PROPERTIES(...)` keys)
   - Observable behavior changes: different query results, error messages users hit, privilege
     requirements, type-support matrices, supported data source / file format capability
   - New / removed system tables, information_schema columns, SHOW statement output columns,
     HTTP API endpoints, metrics, profile counters
   - Limits / restrictions added or lifted (e.g. "now supports X on Y table type")
   - Deprecations / removals
   - Shipped config files (`conf/fe.conf`, `conf/be.conf`), start scripts, module / jar renames,
     dependency version bumps that docs quote (Paimon, Iceberg, Hive shade, Arrow ...)
   - Bug fixes where the OLD documented behavior is now wrong, or where the doc should state a
     version-specific difference
5. Pure internal refactors, logging, memory / perf optimizations with no observable interface change,
   and flaky-test fixes -> NONE.

For every non-NONE commit, ALSO record verbatim from the diff (not paraphrased):
   - exact identifier names and their default values as they stand at the END of the commit
   - exact error-message strings (copy the string literal; note if it is concatenated across lines)
   - the exact gating condition of any "on upgrade" / "when enabled" behavior (e.g. a
     `variable_version < 400` check means it only fires for 3.x -> 4.x upgrades)
   - whether the PR checklist says "Does this need documentation" and whether it links a doc PR
   - anything the PR text says is NOT included in the open-source build (e.g. "OSS no-op")

Output: write a markdown report to `{{OUT_DIR}}/report-{{NN}}.md` with one section per non-NONE
commit:

```
## <hash> <subject>
- **PR**: #<number(s)>
- **Impact**: HIGH | MEDIUM | LOW
- **What changed (user-visible)**: <precise description with exact names / defaults / strings>
- **Doc action**: ADD | FIX | NEW-PAGE | NOTE — <what the doc should say>
- **Likely doc area**: <e.g. lakehouse/catalogs/iceberg-catalog, admin-manual/config/fe-config, ...>
- **Flags**: <"feature commit — needs a doc home", "PR says no docs needed", "OSS no-op", "unsure">
```

End the report with:
```
## NONE (no doc impact)
<hash> <subject>
...one line each
```

Be precise and factual — quote exact identifier names, default values and error strings from the
diff. Do not speculate about docs you have not read; your job is only to characterize the code change.

Finally, reply with a SHORT summary (<= 25 lines): counts of HIGH / MEDIUM / LOW / NONE, then a
bullet list of only the HIGH and MEDIUM items (hash + one-line what changed), then any Flags.
