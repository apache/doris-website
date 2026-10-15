# doris-website writing conventions for release docs

The existing wording in the repository takes precedence over this file. This file pins down the
things that came up repeatedly in the 4.1.4 round and are easy to get wrong.

## 1. Version notes (how iron rule 2 is written)

| Situation | Chinese | English |
| --- | --- | --- |
| New feature / config / variable / column | `自 4.1.4 版本起支持。` or, in a table, `4.1.4 新增` | `Supported since version 4.1.4.` / `Added in 4.1.4` |
| Default value changed | `默认值：8（4.1.4 之前为 4）` plus one sentence on why | `Default: 8 (4 before 4.1.4)` |
| Behavior changed / old doc described behavior that was a bug | `:::caution 版本行为变更（4.1.4）` block stating before -> after and the affected scope | `:::caution Behavior change (4.1.4)` |
| Shipped on several release lines | `Doris 4.0 系列自 4.0.8 版本起、4.1 系列自 4.1.4 版本起` | `in version 4.0.8 in the Doris 4.0 series and in version 4.1.4 in the 4.1 series` |
| Removal | keep the page; top `:::caution` with the removal, the error users now see, the replacement and a migration mapping table; add "(before 4.1.4)" to the historical headings | same |
| Experimental | `4.1.4 新增（实验性）` | `Added in 4.1.4 (experimental)` |

Run `scripts/check-version-claims.py` before writing a version number; check every active release
line. The X in "since X" is **the first official release on each line that contains the change**, not
the date the PR merged to master.

Audit the notes already on the page too. In the 4.1.4 round `require_partition_filter` was
documented as "4.1 series since 4.1.2" but was not in 4.1.2 or 4.1.3; multimodal EMBED said 4.1.5
but shipped in 4.1.4; six "since 4.0.8" notes only reached the 4.1 line in 4.1.4.

## 2. Config entry formats

**fe-config.md (English)**
```
#### `config_name`

Default: false

Is it possible to dynamically configure: true

Is it a configuration item unique to the Master FE node: true

Added in 4.1.4. <one-sentence purpose>

<value semantics, example, caveats>
```
"dynamically configure" comes from `@ConfField(mutable = true)`, "Master only" from `masterOnly = true`.
A bare `@ConfField` is NOT dynamically configurable. Chinese: `默认值：` / `是否可以动态配置：` /
`是否为 Master FE 节点独有的配置项：`.

**be-config.md (English)**
```
#### `config_name`

* Type: int32
* Description: Added in 4.1.4. <purpose>
* Default value: 10
```
A `DEFINE_m*` prefix (`mInt32`, `mBool`) means the value can be changed at runtime; say so in the
description. Chinese: `* 类型：` / `* 描述：` / `* 默认值：`.

Both files are **curated, not exhaustive** (BE documented 205 of 749 configs at 4.1.4). Document what
users tune; pure internal knobs (pool sizes, shard counts) may be left out but must be listed in the
report so the user can decide.

Put a new entry in its section (`### Metadata and cluster management` / `### Service` /
`### Query engine` / `### Load and export` / `### Storage` / `### External table` /
`### Compute-storage decoupled mode` ...) next to related entries; do not append everything to the end.

## 3. Session variables

The 4.x docs had no complete session-variable reference; the 4.1.4 round created
`sql-manual/basic-element/session-variables.md` with an "under construction" notice at the top and
only the variables that release touched. Later releases append to it in this format:

```
### `variable_name`

| Item | Value |
| --- | --- |
| Type | Boolean |
| Default | `true` |
| Version | Added in 4.1.4 |

<description>
```
plus a "What changed in X.Y.Z" overview table (added / default or semantics changed / removed) and a
"Removed variables" table. A variable also goes into its owning feature page (runtime filter variables
into runtime-filter.md, and so on), with links both ways.

## 4. Removed features, endpoints, syntax

- **Never delete the page** (sidebars are shared across locales; a missing id breaks the build). Turn
  it into: removal notice + migration mapping + historical usage.
- Pages that used it in examples or tutorials switch to the replacement and note "before 4.1.4 you
  could also use X".
- Add a row to the upgrade guide.

## 5. New pages

- `versioned_sidebars/version-4.x-sidebars.json` and `sidebars.ts` are shared by both locales:
  **no sidebar entry while the English page does not exist**, or the English build fails. During the
  Chinese-first phase create only the Chinese page, link to it from an existing page, and list it in
  the report as "awaiting sidebar"; add the entry when syncing English.
- When the id goes into the sidebar, all four trees (zh 4.x / en 4.x / zh dev / en dev) must have the
  file.
- One statement per page is the convention, but a small derived statement (`ADMIN COMPACT TABLET`
  next to `COMPACT TABLE`) can share the parent page; say so in the report.

## 6. Docusaurus / MDX constraints

- Front matter is JSON (a few key-features / community pages use YAML); `"language"` is `zh-CN` in
  Chinese files and `en` in English files.
- `markdown.format: 'detect'`: `.md` is CommonMark, `.mdx` is MDX. **In `.mdx`, any `<xxx>` outside
  a code fence or inline code is parsed as JSX** — placeholders go in backticks or fenced blocks.
- Relative links work with or without the extension; anchors are heading slugs (Chinese headings keep
  the Chinese: `#支持的运算与-cast-规则`).
- Never put a blockquote or blank line between table rows — it splits the table (the MaxCompute
  property table broke this way); append rows at the end or keep the version order.
- Admonitions: `:::caution Title`, `:::info Title`, `:::tip Title`, with a blank line before and after.
- No `yarn build`; `scripts/validate-docs.py` is the static check.

## 7. Where facts come from (iron rule 4)

Before writing any claim, verify it in the Doris repo at the **final tag**:

| Claim | How to verify |
| --- | --- |
| Default value | `git show <tag>:<file>`, read the field initializer; never trust the commit message |
| Dynamically configurable | `@ConfField(mutable = ...)`; BE: the `DEFINE_m*` prefix |
| "What happens on upgrade" | find the gating condition (e.g. `variable_version < 400`) before concluding |
| Error message | copy the string literal; join fragments concatenated across lines |
| Column names / count | the definition (`SchemaTable.java`, `InsertJob.SCHEMA`, ...) |
| Privileges | the `checkGlobalPriv` / `checkTblPriv` call sites |
| Counting semantics | the call arguments (`getAllClusterBackends(false)` is ALL backends, not the live ones) |
| Dependency version | `<xxx.version>` in `fe/pom.xml` |
| Property name | copy from the code constant, never retype (`mc.enable.namespace.schema` was once written with underscores) |

## 8. Examples must match the rule

When a rule changes (for example the floating-point output format), recompute or replace the examples
already on the page; an example that contradicts the rule it sits under is worse than no example.
