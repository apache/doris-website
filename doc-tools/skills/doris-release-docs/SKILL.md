---
name: doris-release-docs
description: Audit and update the user documentation for an Apache Doris release from the commit diff between two refs (for example 4.1.3..4.1.4-rc04). Extract the hard user-facing surface (FE/BE/MS configs, session variables, grammar, functions, system tables, HTTP endpoints, metrics, shipped conf files, dependency versions), classify every commit with parallel subagents, then add, fix or create docs under three iron rules — anything a user can perceive needs a doc, every new feature or behavior change carries a "since version X.Y.Z" note, and every feature commit needs a documented home or a question to the user. Write the Chinese version of ONE doc branch first (ask which one: dev or 4.x), open a PR, and only after the user approves it sync to the other branches and to English (dev documents master, so build a master-vs-tag difference table first). Use when asked to "check the docs for 4.1.5", "update docs from the commit history", "what docs need to change for X.Y.Z", or "sync the 4.x doc changes to dev and English". Not for writing release notes and not for building the site (static checks only).
---

# Release docs from the commit diff

Goal: given `FROM_REF..TO_REF` (for example `4.1.3..4.1.4-rc04`), make sure that **every user-perceivable
change has documentation, every new feature or behavior change is version-annotated, and every feature
commit has a documented home**, then report the result to the user in three buckets: done, needs your
decision, deliberately skipped.

Paths used below (confirm at the start):

| Variable | Meaning |
| --- | --- |
| `DORIS` | a local `apache/doris` clone, read-only, with the release tags and an `upstream` remote for `master` |
| `SITE` | this repository (doris-website) |
| `ZH` | the Chinese doc tree the user chose: `4.x` -> `$SITE/i18n/zh-CN/docusaurus-plugin-content-docs/version-4.x`, `dev` -> `.../current` (**ask first, never assume**) |
| `OUT` | a scratch directory for diffs, batches and subagent reports |

Scripts live in `doc-tools/skills/doris-release-docs/scripts/`, references in `references/`.

```bash
S=doc-tools/skills/doris-release-docs/scripts
$S/surface-diff.sh          $DORIS 4.1.3 4.1.4-rc04 $OUT/surface     # hard user-facing surface
$S/split-commits.sh         $DORIS 4.1.3 4.1.4-rc04 $OUT/commits 30   # production vs test-only, batches
$S/check-version-claims.py  $DORIS --tags 4.0.7 4.0.8 4.1.3 4.1.4-rc04 -- <id>...   # before writing any version note
$S/compare-refs.py          $DORIS 4.1.4-rc04 upstream/master --from-file $OUT/surface/identifiers.txt  # before syncing dev
$S/validate-docs.py         $SITE --base upstream/master --forbidden $OUT/forbidden.txt   # before every commit
```

---

## 0. Iron rules

1. **A commit that adds a capability must have a documented home.** A subject tagged `feat` / `feature`,
   or a diff that introduces a new user-facing surface (new syntax, new endpoint, a new group of configs,
   a new data source, a new runtime mechanism such as cross-compute-group peer cache reads) gets
   documentation: a new section on an existing page, or a new page. If there is no obvious home, or you
   are not sure where it belongs, **ask the user** — never silently park it in a "no location found" list.
2. **New features, behavior changes, default changes and removals are always version-annotated**
   ("Supported since version 4.1.4"). Every version number must be checked against the tags with
   `check-version-claims.py`; a change that shipped on several release lines (4.0.x and 4.1.x) is
   annotated for each line.
3. **Anything a user can perceive needs a doc**: configs, session variables, SQL syntax, functions, system
   table / SHOW columns, HTTP endpoints, metrics and profile counters, error messages, privilege
   requirements, type mappings, support matrices, dependency versions, and the shipped `conf/` files,
   start scripts and jar directory names. Pure refactors, logging and optimizations with no interface
   change are not documented.
4. **Facts come only from the code at `TO_REF`** — not from commit messages, PR titles, subagent
   reports or the existing docs. Default values, mutability, gating conditions, error strings, column
   names, privilege checks and counting semantics are verified with `git show` / `git grep` before they
   are written (see `references/doc-conventions.md` §7).
5. **Unreleased capabilities are not documented, but they are recorded.** Signals: the PR says the
   open-source build only ships a framework / no-op, the user names the feature, or it is visibly
   half-finished. For a large new capability area, **ask the user before writing** — writing a whole
   chapter and then pulling it is wasted work.
6. **The dev trees describe `master`, not `TO_REF`.** Before syncing to dev, run `compare-refs.py` and
   build a difference table; master can lack backported variables, use different defaults, dependency
   versions, module names and error strings. Record the master SHA the table was built from.
7. **Sidebars are shared between locales.** While only the Chinese tree is written, a new page is not
   added to the sidebar (the English site would fail to build); link to it from an existing page and add
   the sidebar entry once every tree has the file.
8. **Never delete a page.** A removed feature keeps its page, rewritten as a removal notice plus a
   migration mapping plus the historical usage.
9. **No `yarn build`.** The only verification is `validate-docs.py` (front matter, relative links, bare
   JSX-like tags in `.mdx`, Chinese text in English trees, forbidden identifiers, table column counts).
10. **First question, before touching anything: which doc branch gets the Chinese version** (dev / 4.x /
    3.x ...). The cadence is fixed: **write that one Chinese branch -> open a PR -> the user reviews and
    approves -> then sync to the other branches and to English.** The sync scope is confirmed with the
    user at review time (for example whether a 4.x change also goes to dev or 3.x). Every PR description
    states the current sync status.
11. **Subagents only read the Doris repo** and only write their own report file. The main agent
    aggregates, verifies facts and writes the docs (or dispatches per-file batches, see §6).

---

## 1. Preflight

```bash
cd $DORIS && git fetch upstream master --tags
git tag -l '4.1.*'                       # both FROM and TO must exist
git log --oneline FROM..TO | wc -l
```

**Ask the user two things before extracting anything** (one question, all at once):

1. Which doc branch gets the Chinese version: `4.x` (`versioned_docs/version-4.x` +
   `i18n/.../version-4.x`), `dev` (`docs/` + `i18n/.../current`) or another active version
   (`versions.json` lists them). This sets `$ZH` and decides which release line version notes refer to.
2. Which branches and locales to sync to after approval (default: the same version in English plus dev in
   both locales; the user may add or remove).

Restate the commit range, the target version and the active version list in the question so a wrong
assumption is easy to spot. Put every topic the user says "not yet" to into `$OUT/forbidden.txt` (one
identifier or regex per line) for `validate-docs.py`.

## 2. Extract the hard surface (deterministic, no judgment involved)

```bash
$S/surface-diff.sh $DORIS FROM TO $OUT/surface
less $OUT/surface/summary.txt
```

Read the `fe-config` / `session-var` / `be-config` / `ms-config` / `grammar` / `functions` /
`schema-tables` / `conf-files` / `deps` sections and list, directly from the `+`/`-` lines: additions,
removals, default changes, mutability changes, grammar additions and removals, function / TVF additions
and removals, system-table columns, shipped conf lines, dependency versions. This is the **baseline
list** — subagent reports can add to it but never override it.

`$OUT/surface/identifiers.txt` holds the config and variable names found in the diffs; feed it to
`check-version-claims.py` and `compare-refs.py` with `--from-file`.

## 3. Classify every commit (parallel subagents)

```bash
$S/split-commits.sh $DORIS FROM TO $OUT/commits 30     # splits by touched PATHS, never by [subject tag]
```

Start one `general-purpose` subagent per `batch-NN`, all at once, with the prompt in
`references/classify-agent-prompt.md`. Each writes `$OUT/commits/report-NN.md` and replies with a short
summary. When all are in:

```bash
for f in $OUT/commits/report-*.md; do awk '/^## NONE/{exit} /^## /{print} /Impact|Likely doc area|Flags/{print}' $f; done
```

gives a HIGH / MEDIUM / LOW index. **Re-check every default in the reports against `summary.txt`** —
an intermediate commit can set a value that a later commit reverts.

## 4. Decide and ask

Merge the index and the baseline list into one table and decide per row: `FIX` an existing page /
`ADD` to an existing page / `NEW` page / `NOTE` a version note only / `SKIP` internal change / `ASK` the
user.

Always `ASK` for: feature commits with no obvious home; large new capability areas; PRs that say the
open-source build has no implementation; anything a subagent flagged. **Collect every ASK into one
question** instead of interrupting repeatedly. Whatever the user declines goes into `forbidden.txt`.

Finding a home: `grep -rln <identifier> $ZH`; failing that, the page for the same topic (configs in
`admin-manual/config/*-config.md`, session variables in `sql-manual/basic-element/session-variables.md`
plus the owning feature page, lakehouse in `lakehouse/catalogs/*`, load in `data-operate/import/*`,
upgrade impact in `admin-manual/cluster-management/upgrade.md`). Before creating a page run
`find $SITE/docs $SITE/i18n -name '<slug>*'` — dev may already have a better version; reuse it and fix
the version note.

## 5. Write the Chinese docs (only the branch chosen in §1, `$ZH`)

Follow `references/doc-conventions.md` (version-note wording, FE/BE config entry formats, the session
variable page, removal pages, MDX constraints, the fact-checking table). The most common mistakes:

- Version numbers: run `check-version-claims.py` first, annotate every release line, and audit the
  existing notes on the page while you are there.
- Claims: read the diff body, not the title; find the gating condition; read the annotation for
  mutability; read the call arguments for counting semantics; copy error strings literally; copy
  property names from the code constants.
- Tables: append new rows at the end; never put a blockquote between table rows.
- When a rule changes, replace the examples on the page that no longer satisfy it.
- Upgrade guide: add an "Upgrading to X.Y.Z" section with three tables — removed interfaces and
  syntax / default and behavior changes / deployment and config-file changes — each row
  `Change | Affected scope | What to do`.
- Session variable page: overview table (added / default or semantics changed / removed), one section
  per variable, a removed-variables table.

Then:

```bash
$S/validate-docs.py $SITE --base upstream/master --forbidden $OUT/forbidden.txt
```

Write the review report from `references/report-template.md` into `plan-doc/doris-<ver>-doc-review.md`
(**not committed to the PR**), create a branch, commit, `gh pr create`. The PR description must contain:
the range and method, the list of statements in the existing docs that were wrong and are now fixed, what
was deliberately left out, new pages awaiting a sidebar entry, and changes with no home.

## 6. After approval: sync to the other branches and to English

Enter this section only when the user says the Chinese version is approved; confirm the sync scope from
§1. The targets are usually the same version in English plus dev in both locales (source 4.x), or dev in
English plus 4.x in both locales (source dev).

1. `cd $DORIS && git fetch upstream master`; note the SHA.
2. `compare-refs.py $DORIS TO upstream/master --from-file $OUT/surface/identifiers.txt`, plus feature
   presence checks (`git grep -l <distinctive string> upstream/master | grep -v regression-test` —
   **no narrow pathspecs**, master has been refactored), assembled into a difference table.
3. Fill `references/port-agent-prompt.md` into `$OUT/sync-context.md` (difference table, forbidden
   topics, master SHA) and start 6–8 file-batch subagents; each ports its files into all target trees;
   large files (`upgrade.md`, `iceberg-catalog.mdx`, `fe-config.md` + `be-config.md`) get a batch of
   their own.
4. The main agent does: the other-language / other-branch versions of new pages (dev versions edited per
   the difference table), sidebar entries, and pages that exist in one branch but not another although
   the feature ships in this version.
5. A subagent reporting "the SOURCE is wrong" means fixing every tree at once; "dev already has a better
   version" means adopting it.
6. Run `validate-docs.py` over everything; re-run `compare-refs.py` right before pushing (master moves);
   update the difference table and the corrections list in the PR description.

## 7. Wrap up

- Append the round's new lessons to `references/pitfalls.md`.
- The report stays in `plan-doc/`, out of the PR.
- Note the PR number, branch, master SHA used for the comparison and the topics the user declined.
