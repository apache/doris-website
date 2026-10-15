# Subagent prompt: sync the approved Chinese branch to the other branches and to English

How to use: fill the placeholders and save the block below as `{{OUT_DIR}}/sync-context.md`. Then
start subagents in file batches (5–10 files each; large files such as `upgrade.md`,
`iceberg-catalog.mdx`, `fe-config.md` + `be-config.md` get a batch of their own). Each batch prompt
only needs "Read sync-context.md in full first, then handle these files: ..." plus batch-specific hints.

The source and target trees come from the answer to SKILL.md §1 — do not assume the source is 4.x:
- source = Chinese 4.x -> targets are usually English 4.x, Chinese dev, English dev
- source = Chinese dev -> targets are usually English dev, Chinese 4.x, English 4.x (then it is the
  SOURCE that describes master, and rule 4 must verify against the 4.x tag instead)
The table below is written for source = 4.x; swap the rows for a dev source and replace "master" in
rule 4 with the release tag.

**Before starting any subagent the main agent runs** `scripts/compare-refs.py` and pastes the result
into "Verified differences". The subagents' own checks supplement it; they do not replace it.

---

# Doris {{VERSION}} doc sync — shared context

## Goal

The Chinese {{SOURCE_LABEL}} docs have been updated for the Doris {{VERSION}} release and approved by
the user. Port each change to the other doc trees.

Repo: `{{WEBSITE_REPO}}` (branch `{{BRANCH}}`).

| Tree | Path prefix | Language |
| --- | --- | --- |
| **SOURCE** {{SOURCE_LABEL}} (reviewed and approved) | `{{SOURCE_PREFIX}}` | Chinese |
| target {{TARGET1_LABEL}} | `{{TARGET1_PREFIX}}` | English |
| target {{TARGET2_LABEL}} | `{{TARGET2_PREFIX}}` | Chinese |
| target {{TARGET3_LABEL}} | `{{TARGET3_PREFIX}}` | English |

(Path prefixes: 4.x English `versioned_docs/version-4.x/`, 4.x Chinese
`i18n/zh-CN/docusaurus-plugin-content-docs/version-4.x/`, dev English `docs/`, dev Chinese
`i18n/zh-CN/docusaurus-plugin-content-docs/current/`.)

For each file in your batch, get the change to port with:

```
git diff {{BASE_REF}} -- {{SOURCE_PREFIX}}<FILE>
```

Then apply the equivalent change to the target paths.

## Rules

1. **Do not blind-patch.** The target files have diverged: different wording, section order, extra
   or missing sections. Read the target, find the equivalent place, adapt. If the section does not
   exist in a target, add it where it fits that file's structure — or skip and report if it
   genuinely does not apply. The other trees may already document the topic in a better or different
   way (dev did for `parse_to_variant` and the schema-change pages): reuse, don't duplicate.
2. **English must read like the surrounding English doc.** Match existing terminology (e.g.
   "compute-storage decoupled mode"), heading style, admonition style (`:::caution Behavior change
   (X.Y.Z)`), table format. Do not translate literally. Keep front matter valid; `"language": "en"`
   in English files, `"language": "zh-CN"` in Chinese files.
3. **Version annotations stay.** Dev docs carry the same "Since version X" notes as the versioned
   docs, in the phrasing the target file already uses for similar notes.
4. **The dev trees document `master`, not {{VERSION}}.** Before porting a factual claim (default
   value, "since version", whether a feature exists, an error string, a dependency version) into
   `docs/` or `i18n/zh-CN/.../current/`, check it on master in `{{DORIS_REPO}}` — READ ONLY:
   `git grep <pattern> {{MASTER_REF}}` / `git show {{MASTER_REF}}:<path>`. Never checkout / commit /
   edit / fetch there. Master has been refactored (e.g. `fe/fe-connector/...`), so do NOT narrow
   `git grep` with pathspecs — search the whole tree and drop `regression-test` hits. Verified
   differences are listed below; verify anything else yourself.
5. **Never introduce these topics into any tree** — deliberately undocumented for now:
   {{EXCLUDED_TOPICS}}
   If a target already contains such content, leave it; just don't add more.
6. Do not reformat or restructure anything the change does not touch.
7. Do not touch sidebar files.
8. If you find an error in the SOURCE file — wrong default, wrong claim, a table broken by a
   mid-table insert, a typo in an identifier — fix the source too, and flag it prominently in your
   report. Verify against `{{TO_REF}}` first.

## Verified master-vs-{{VERSION}} differences

(paste the `compare-refs.py {{TO_REF}} {{MASTER_REF}}` table here, plus feature-presence findings)

| Item | {{VERSION}} | master (dev) | What to do in dev docs |
| --- | --- | --- | --- |
| ... | ... | ... | omit / state master value / reword |

Master SHA used for this table: `{{MASTER_SHA}}`. Master moves; if you fetch, say so.

## Reporting

When done, reply with a short report: for each file, one line per target tree saying `ported`,
`already present`, `adapted (how)` or `skipped (why)`. List every claim you verified on master and
every SOURCE error you fixed. Flag anything you were unsure about.
