# Doris docs/ audit findings & backlog

Audit date: 2026-05-18. Scope: `docs/` (latest/next English docs, 1548 files).
Coverage: 9 of 1548 files deep-read (first pass only). External links NOT checked
(network was blocked). Many more passes needed for full coverage.

---

## DONE

- **#1 + #2** — `table-design/data-model/aggregate.md` column-name errors.
  Fixed across 9 files (EN next+2.0/2.1/3.x/4.x, ZH next+2.1/3.x/4.x).
  PR: https://github.com/apache/doris-website/pull/3670
- **#6 + #466 + #157** (note: #6/#466 are the same issue; #157 is a separate file) — handled:
  - **#6 / #466** — `table-design/data-model/unique.md` `user_name`/`username` inconsistency,
    unified to `user_name` across 9 files (EN next+2.0/2.1/3.x/4.x, ZH next+2.1/3.x/4.x).
    PR: https://github.com/apache/doris-website/pull/3673
  - **#157** — `query-acceleration/distinct-counts/bitmap-precise-deduplication.md` `DISTINCT pv`
    (issue #62827 class). Fixed across 6 files (EN next+4.x, ZH next+2.1/3.x/4.x).
    PR: https://github.com/apache/doris-website/pull/3659
- **#7 + #296 + #297** (same issue) — `ip-functions/ipv4-string-to-num.md` &
  `ipv4-string-to-num-or-default.md` garbled "the the" return-value sentences.
  Reworded across 4 files (EN next+4.x; ZH and EN 2.1/3.x were already fine).
  PR: https://github.com/apache/doris-website/pull/3674
- **#8** — `lakehouse/best-practices/doris-onelake.md` doubled word "and and" (3 files);
  **#9** — `window-functions/overview.md` prose `ORDER BY dateid` → `date_time` (4 files).
  PR: https://github.com/apache/doris-website/pull/3675
- **#14 + #15** — `admin-manual/maint-monitor/metrics.md` `doris_fe_txn_counter`:
  `succes` label typo + `begin` row wrongly described as "committed". Verified
  against FE source MetricRepo.java. Fixed across 6 files (EN next+4.x, ZH next+2.1/3.x/4.x).
  PR: https://github.com/apache/doris-website/pull/3676
- **#16** — `admin-manual/log-management/be-log.md` `RuntimeLogger` prefix mapped to
  non-existent `be.log`; corrected to `be.INFO` across 5 files (EN next+2.1/4.x, ZH next+4.x).
  PR: https://github.com/apache/doris-website/pull/3677
- **#18 + #19** — `admin-manual/open-api/be-http/compaction-run.md` was overwritten with
  the Disk Capacity Management doc in EN next + 4.x; restored the correct "Manually
  Trigger Compaction" content from the 3.x version. #19 (param-name inconsistency in the
  wrong content) is moot — that content is gone. PR: https://github.com/apache/doris-website/pull/3679
- **#20** — `admin-manual/data-admin/ccr/config.md` FE-config example showed
  `restore_reset_index_id = true`, contradicting the rest of the doc and the FE default
  `false` (verified vs Config.java). Changed example to `false` across 8 files (EN+ZH next/2.1/3.x/4.x).
  PR: https://github.com/apache/doris-website/pull/3680
- **#21** — `admin-manual/open-api/be-http/meta.md` curl example joined query param with
  `&` instead of `?`; fixed across 8 files (EN+ZH next/2.1/3.x/4.x).
  PR: https://github.com/apache/doris-website/pull/3681
- **#22** — `admin-manual/open-api/be-http/metrics.md` Response example used full-width
  commas `，，，` as omission placeholder; replaced with `...` across 8 files.
  PR: https://github.com/apache/doris-website/pull/3682
- **#23 + #24** — `admin-manual/open-api/fe-http/query-profile-action.md`: endpoint
  summary `trace/{trace_id}` → `trace_id/{trace_id}` (12 files, all versions); orphan
  closing code fence after the running-queries table removed (4 files, next+4.x EN+ZH).
  PR: https://github.com/apache/doris-website/pull/3683
- Note: PR #3681 (#21) also got a 2nd commit fixing 4-space-indented code fences in
  `be-http/meta.md` (fences were rendering as literal text). 8 files.
- **#25 + #26** — `admin-manual/open-api/fe-http/get-ddl-stmt-action.md`: missing closing
  `"` in Response JSON `create_table` value; doubled `GET` in example request. Fixed
  across 12 files (EN+ZH, all versions). PR: https://github.com/apache/doris-website/pull/3684
- **#27 + #28** — `admin-manual/open-api/fe-http/check-decommission-action.md`: same BE
  address duplicated in the Response sample and the example request. Used a distinct
  second node + made the example response consistent. 12 files. PR: https://github.com/apache/doris-website/pull/3685
- **#29 + #30** — `admin-manual/open-api/fe-http/meta-info-action.md`: stray `?` in schema
  example URL (`with_mv?=1`); H1 heading wrongly `# Meta Action` (should be Meta Info Action).
  `?` fix in 12 files; H1 fix in 7 (6 EN + ZH 1.2). PR: https://github.com/apache/doris-website/pull/3686
- **#31** — `admin-manual/open-api/fe-http/get-wal-size-action.md` English-tree doc was
  entirely Chinese (never translated); translated the 4 EN-tree copies to English. Also
  fixed example-2 curl missing `host_ports=`. PR: https://github.com/apache/doris-website/pull/3687
- **#32-#38** (one PR, 36 files) — open-api/system-tables batch: #32 table_privileges.md
  language frontmatter; #33 statistic-action.md untranslated Chinese; #34 statement-execution-action.md
  untranslated Chinese + `sql`→`stmt`; #35 same file undocumented `<ns_name>` param; #36
  show-meta-info-action.md `无`→`None`; #37 upload-action.md missing JSON comma (EN+ZH);
  #38 column_statistics.md broken anchor. PR: https://github.com/apache/doris-website/pull/3689
- **#39** — `admin-manual/system-tables/information_schema/parameters.md` had a corrupted
  garbage column row `DATA_TYPEDTD_IDENDS` after `ROUTINE_TYPE`; removed it across 8 files.
  PR: https://github.com/apache/doris-website/pull/3690
  (Note: doc also missing standard column `CHARACTER_MAXIMUM_LENGTH` — separate gap, not fixed.)
- **#40-#42, #44-#48, #50-#53** (one PR, 76 files) — Batch 4 trouble-shooting/workload:
  audit_log typos; triggers.md description; props_priv.md→procs_priv.md rename (12 files
  + 4 sidebars); memory-log/jemalloc/metadata value & garble fixes; load-memory backticks;
  spill-disk watermark defaults; stray `**` on FAQ headings. PR: https://github.com/apache/doris-website/pull/3691
  (#43 and #49 excluded per user — still pending.)
- **#56** — `compute-storage-decoupled/file-cache/file-cache.md`: "WARM-UP SQL documentation"
  links were `(#)` placeholders; pointed them to the WARM UP statement doc. 10 links / 6 files.
  PR: https://github.com/apache/doris-website/pull/3692
- **#57** — `compute-storage-decoupled/managing-compute-cluster.md`: wrong FE config key.
  NOTE: the finding was inverted — the real config is `cloud_warm_up_for_rebalance_type`
  (verified vs Config.java); the doc's `cloud_default_rebalance_type` (lines 224/267) was
  the typo, not line 271. Fixed across 4 files. PR: https://github.com/apache/doris-website/pull/3693
- **#58 + #59** — `compute-storage-decoupled/recycler.md`: two nonexistent metric names
  (`recycler_instance_last_recycle_duration`→`...last_round_recycle_duration`,
  `recycler_instance_last_success_ts`→`...recycle_last_success_ts`), verified vs cloud
  source bvars.cpp. Also fixed the same error in the metrics table & v3.x example. 6 files.
  PR: https://github.com/apache/doris-website/pull/3695

## SKIPPED (decided not to fix)
- **#10** — auth doc GRANT scope `ON .` — user discarded the change, revisit later.
- **#11** — auth doc "SHOW ALL GRANTS" wording imprecision — minor, undecided.
- **#12 + #13** — `restore.md` snapshot-name/timestamp inconsistencies — pervasive;
  needs a real-cluster BACKUP/RESTORE run to regenerate examples. Not fixing via text edits.

---

## PENDING — review and pick what to do next

### #3 — HLL doc: wrong column in sample-load comment
- File: `docs/query-acceleration/distinct-counts/hll-approximate-deduplication.md:127`
- Type: code example error · Confidence: high (verified)
- The "Sample load result" curl comment uses `pv=hll_hash(id)`, but the actual
  stream-load command (line ~121) and the table use `uv`. No `pv` column exists.
- Fix: `pv=hll_hash(id)` -> `uv=hll_hash(id)`.
- Likely also in ZH current + versioned versions — check before fixing.

### #4 — HLL doc: wrong "equivalent form" query (same class as issue #62827)
- File: `docs/query-acceleration/distinct-counts/hll-approximate-deduplication.md:~170`
- Type: code example error · Confidence: high (verified)
- `HLL_UNION_AGG(uv)` "Equivalent form" is given as `SELECT COUNT(DISTINCT uv) FROM test_hll`.
  `uv` is the HLL column (built from `hll_hash(id)`); HLL columns can't be queried directly.
- Fix: `COUNT(DISTINCT uv)` -> `COUNT(DISTINCT id)`, and result header
  `count(DISTINCT uv)` -> `count(DISTINCT id)`.
- Likely also in ZH current + versioned versions — check before fixing.
- Note: #3 and #4 are in the same file -> can be one PR.

### #5 — quick-start: unfinished placeholder links
- File: `docs/getting-started/quick-start.mdx:260-262`
- Type: broken link · Confidence: high
- Three `NEXT-TODO` placeholder links with no URL targets.
- Fix: supply real link targets, or remove the placeholders. Needs an editorial
  decision on what they should point to.

### #6 — unique model doc: inconsistent column name  [DONE — PR #3673, = #466]
- File: `docs/table-design/data-model/unique.md:~67-133`
- Type: inconsistency · Confidence: medium · NOT YET VERIFIED
- Table `example_tbl_unique` appears to use `user_name` in the merge-on-write block
  but `username` in the merge-on-read block + query output.
- Action: verify first, then decide which name is canonical.

### #7 — IP-function docs: doubled word + garbled sentence  [DONE — PR #3674, = #296/#297]
- Files: `docs/sql-manual/.../ipv4-string-to-num.md:12,26,36`
  and `.../ipv4-string-to-num-or-default.md:12,26,36`
- Type: typo/grammar · Confidence: high
- Doubled "the the" plus a garbled return-value sentence.
- Fix: reword. Check other ipv4/ipv6 function docs for the same copy-paste error.

### #8 — onelake doc: doubled word  [DONE — PR #3675]
- File: `docs/lakehouse/best-practices/doris-onelake.md:283`
- Type: typo · Confidence: high
- "and and" -> "and".

### #9 — window-functions overview: prose/example column mismatch  [DONE — PR #3675]
- File: `docs/sql-manual/sql-functions/window-functions/overview.md:81`
- Type: inconsistency · Confidence: medium
- Prose says `ORDER BY dateid`; the column in the example is `date_time`.
- Action: verify, then align prose to the example (or vice versa).

---

## Minor nits (not tracked as findings)
- `replication_num = 1` unquoted in aggregate overview (`overview.md:89`).
- Some CSV/shell code blocks mislabeled as ```sql.
- Image directory consistently misspelled `table-desigin` (consistent, links work).

## Suggested grouping for PRs
- #3 + #4 -> one PR (same HLL file).
- #7 -> one PR (IP-function typos, possibly several files).
- #8 -> trivial, could fold into another typo PR.
- #5, #6, #9 -> need verification / an editorial decision before a PR.

---

# Batch findings (loop audit)

Progress: batch 1 done. ~59/1551 files audited.

## Batch 1 — admin-manual (50 files) — 11 findings

### #10 — auth doc: malformed GRANT resource scope
- `docs/admin-manual/auth/authentication-and-authorization.md:341` — code example error — high
- `GRANT ALTER_PRIV ON . TO user1@'ip1';` — resource scope `.` is malformed.
- Fix: `ON .` -> `ON *.*.*` (consistent with preceding `GRANT SELECT_PRIV ON *.*`).

### #11 — auth doc: imprecise SHOW ALL GRANTS wording
- `docs/admin-manual/auth/authentication-and-authorization.md:48` — inconsistency — medium
- Text says view "all created users" with `SHOW ALL GRANTS`; it shows grants, not a user list. Line 120 of same doc labels it correctly.
- Fix: reword to "view all users' permissions with `SHOW ALL GRANTS`".

### #12 — restore doc: SHOW RESTORE output label mismatch  [SKIPPED — needs real-cluster BACKUP/RESTORE run to regenerate the whole example; text-only edits won't fix it]
- `docs/admin-manual/data-admin/backup-restore/restore.md:148-185` — code example error — high
- `SHOW RESTORE\G` output shows `Label: snapshot_label1`, but all `RESTORE SNAPSHOT` statements use `restore_label1`.
- Fix: change `snapshot_label1` -> `restore_label1` in the output (Label + RestoreObjs name).

### #13 — restore doc: prose/SQL mismatch in Option 4  [SKIPPED — same restore.md, same reason as #12: pervasive snapshot-name/timestamp inconsistency, needs real-cluster verification]
- `docs/admin-manual/data-admin/backup-restore/restore.md:118-131` — inconsistency — medium
- Prose says snapshot `snapshot_2`, timestamp `2018-05-04-17-11-01`; SQL uses `restore_label1`, `2022-04-08-15-55-43`.
- Fix: align prose with the SQL.

### #14 — metrics doc: typo "succes"  [DONE — PR #3676]
- `docs/admin-manual/maint-monitor/metrics.md:152` — typo — high
- Label `{type="succes"}` -> `{type="success"}`.

### #15 — metrics doc: wrong description for txn "begin"  [DONE — PR #3676]
- `docs/admin-manual/maint-monitor/metrics.md:149` — code example error — medium
- `{type="begin"}` described as "Number of committed transactions"; `begin` = started, not committed.
- Fix: "Number of started (begun) transactions".

### #16 — be-log doc: wrong BE log file name  [DONE — PR #3677]
- `docs/admin-manual/log-management/be-log.md:166-167` — inconsistency — high
- "Log Prefix" table maps `RuntimeLogger` -> `be.log`, but BE runtime log is `be.INFO` everywhere else.
- Fix: `be.log` -> `be.INFO`.

### #17 — auto-start doc: supervisor program name mismatch  [SKIPPED — user holding off]
- `docs/admin-manual/maint-monitor/automatic-service-start.md:413` — code example error — high
- `supervisorctl stop doris-be` but program is declared `[program:doris_be]` (underscore).
- Fix: `doris-be` -> `doris_be`.

### #18 — be-http compaction-run.md: wrong file content  [DONE — PR #3679]
- `docs/admin-manual/open-api/be-http/compaction-run.md` — inconsistency — high
- File is named compaction-run but its title is "Disk Capacity Management" and body is duplicated disk-capacity content.
- Fix: replace with the real compaction-run API doc. (Needs editorial/source check.)

### #19 — compaction-run.md: inconsistent BE parameter names  [DONE via PR #3679 — wrong content removed by #18 restore]
- `docs/admin-manual/open-api/be-http/compaction-run.md:63-67` — inconsistency — medium
- Params listed as `capacity_used_percent_flood_stage` / `capacity_min_left_bytes_flood_stage`, but the sentence below uses `storage_flood_stage_usage_percent` / `storage_flood_stage_left_capacity_bytes`.
- Fix: use one consistent set. (Same file as #18 — may be moot if #18 replaces the file.)

### #20 — ccr config doc: restore_reset_index_id default vs recommendation  [DONE — PR #3680]
- `docs/admin-manual/data-admin/ccr/config.md:67` — inconsistency — medium, NEEDS VERIFY
- Description says set to `false` for inverted/bitmap indexes, but default is also listed `false` — recommendation equals default.
- Action: verify whether the intended default should be `true`.

## Batch 2 — admin-manual/open-api (50 files) — 11 findings

### #21 — be-http meta.md: malformed query string in curl example  [DONE — PR #3681]
- `docs/admin-manual/open-api/be-http/meta.md:52` — code example error — high
- `curl ".../api/meta/header/148193&amp;byte_to_base64=true"` joins query param with `&amp;` instead of `?`.
- Fix: `.../api/meta/header/148193?byte_to_base64=true`.

### #22 — be-http metrics.md: full-width commas as placeholder  [DONE — PR #3682]
- `docs/admin-manual/open-api/be-http/metrics.md:40` — typo/formatting — high
- Response example contains `，，，` (full-width Chinese commas) as omission placeholder.
- Fix: replace with `...`.

### #23 — query-profile-action.md: endpoint summary mismatch  [DONE — PR #3683]
- `docs/admin-manual/open-api/fe-http/query-profile-action.md:16` — inconsistency — high
- Summary lists `/rest/v2/manager/query/trace/{trace_id}`; actual section + body use `/rest/v2/manager/query/trace_id/{trace_id}`.
- Fix: change line 16 to `trace_id/{trace_id}`.

### #24 — query-profile-action.md: orphan code fence  [DONE — PR #3683]
- `docs/admin-manual/open-api/fe-http/query-profile-action.md:509` — markdown formatting — high
- Stray closing ``` corrupts rendering of rest of file.
- Fix: remove orphan fence at line 509.

### #25 — get-ddl-stmt-action.md: missing closing quote in JSON  [DONE — PR #3684]
- `docs/admin-manual/open-api/fe-http/get-ddl-stmt-action.md:45` — markdown/JSON — high
- `"create_table": ["CREATE TABLE \`tbl1\` ...]` missing closing `"`.
- Fix: add closing quote before `]`.

### #26 — get-ddl-stmt-action.md: doubled GET  [DONE — PR #3684]
- `docs/admin-manual/open-api/fe-http/get-ddl-stmt-action.md:57` — typo — high
- `GET GET /api/_get_ddl?...`.
- Fix: remove duplicate `GET`.

### #27 — check-decommission-action.md: duplicate node in response sample  [DONE — PR #3685]
- `docs/admin-manual/open-api/fe-http/check-decommission-action.md:43` — code example error — medium
- `data` lists `["192.168.10.11:9050", "192.168.10.11:9050"]` (same node twice).
- Fix: use two distinct nodes or a single entry.

### #28 — check-decommission-action.md: duplicate BE in request example  [DONE — PR #3685]
- `docs/admin-manual/open-api/fe-http/check-decommission-action.md:53` — code example error — medium
- `host_ports=192.168.10.11:9050,192.168.10.11:9050`.
- Fix: use two distinct host:port values.

### #29 — meta-info-action.md: stray `?` in query string  [DONE — PR #3686]
- `docs/admin-manual/open-api/fe-http/meta-info-action.md:173` — code example error — high
- `...schema?with_mv?=1` has an extra `?`.
- Fix: `...schema?with_mv=1`.

### #30 — meta-info-action.md: wrong H1 heading  [DONE — PR #3686]
- `docs/admin-manual/open-api/fe-http/meta-info-action.md:10` — inconsistency — medium
- H1 is `# Meta Action` but title/sidebar/purpose is "Meta Info Action" (separate `meta-action.md` is the real Meta Action).
- Fix: H1 -> `# Meta Info Action`.

### #31 — get-wal-size-action.md: English doc is entirely Chinese  [DONE — PR #3687]
- `docs/admin-manual/open-api/fe-http/get-wal-size-action.md` — localization — medium
- File is in the English docs tree but its content is fully Chinese (`language: "zh-CN"`).
- Action: needs an English translation (or maintainer routing decision).
- (Low-confidence extra: `be-http/version-info.md` filename convention differs from FE `fe-version-info-action.md` — likely intentional, not tracked.)

## Batch 3 — open-api + system-tables (50 files) — 8 findings

### #32 — table_privileges.md: wrong language frontmatter  [DONE — PR #3689]
- `docs/admin-manual/system-tables/information_schema/table_privileges.md:4` — inconsistency — high
- `"language": "zh-CN"` but title/filename/content all English.
- Fix: `"language": "en"`.

### #33 — statistic-action.md: untranslated Chinese in English doc  [DONE — PR #3689]
- `docs/admin-manual/open-api/fe-http/statistic-action.md:5,17,21,25,29` — inconsistency — high
- English doc but description/Description section/param values are Chinese ("获取集群统计信息...", "无").
- Fix: translate to English.

### #34 — statement-execution-action.md: untranslated Chinese + wrong field name  [DONE — PR #3689]
- `docs/admin-manual/open-api/fe-http/statement-execution-action.md:40,44` — inconsistency — high
- Chinese text "sql 字段为具体的 SQL" / "返回结果集"; also references field `sql` but request body uses `stmt`.
- Fix: translate + correct field name to `stmt`.

### #35 — statement-execution-action.md: undocumented path param  [DONE — PR #3689]
- `docs/admin-manual/open-api/fe-http/statement-execution-action.md:15,22-26` — inconsistency — medium
- Path `POST /api/query/<ns_name>/<db_name>` has 2 params; only `<db_name>` documented.
- Fix: document `<ns_name>`.

### #36 — show-meta-info-action.md: Chinese "无" instead of "None"  [DONE — PR #3689]
- `docs/admin-manual/open-api/fe-http/show-meta-info-action.md:21` — typo — high
- Path parameters value is "无".
- Fix: "无" -> "None".

### #37 — upload-action.md: invalid JSON in response example  [DONE — PR #3689]
- `docs/admin-manual/open-api/fe-http/upload-action.md:62` — code example error — high
- `"absPath": "..."` missing trailing comma before next field.
- Fix: add comma after the `absPath` value.

### #38 — column_statistics.md: broken anchor link  [DONE — PR #3689]
- `docs/admin-manual/system-tables/information_schema/column_statistics.md:14` — broken link — medium
- Link to `statistics#viewing-statistics`; that anchor doesn't exist.
- Fix: point to an existing anchor (e.g. `#viewing-column-statistics`).

### #39 — parameters.md: corrupted column name  [DONE — PR #3690]
- `docs/admin-manual/system-tables/information_schema/parameters.md:38` — typo — medium
- Column named `DATA_TYPEDTD_IDENDS` — corrupted/concatenated, likely `DTD_IDENTIFIER`.
- Action: verify against actual schema and correct.

## Batch 4 — trouble-shooting + workload-management (50 files) — 14 findings

### #40 — audit_log.md: typo "booean"  [DONE — PR #3691]
- `docs/admin-manual/system-tables/internal_schema/audit_log.md:43` — typo — high
- `is_nereids` type `booean` -> `boolean`.

### #41 — audit_log.md: typo "decouped"  [DONE — PR #3691]
- `docs/admin-manual/system-tables/internal_schema/audit_log.md:50` — typo — medium
- "decouped" -> "decoupled".

### #42 — triggers.md: wrong frontmatter description  [DONE — PR #3691]
- `docs/admin-manual/system-tables/information_schema/triggers.md:5` — inconsistency — high
- `description` is "Stores all table information." (copied from tables.md); file documents `triggers`.
- Fix: describe trigger information.

### #43 — system-tables/overview.md: wrong language frontmatter
- `docs/admin-manual/system-tables/overview.md:4` — inconsistency — high
- `language: "zh-CN"` but English doc. Fix: `"en"`.

### #44 — props_priv.md: filename typo  [DONE — PR #3691]
- `docs/admin-manual/system-tables/mysql/props_priv.md:3` — inconsistency — medium
- File named `props_priv.md` but table/title is `procs_priv`. Filename likely typo of `procs_priv`.
- Action: rename file (needs sidebar/link check).

### #45 — memory-log-analysis.md: MB value doesn't match byte count  [DONE — PR #3691]
- `docs/admin-manual/trouble-shooting/memory-management/memory-analysis/memory-log-analysis.md:47` — code example error — high
- `Used=114.80 MB(726799124 B)` — 726799124 B ≈ 693 MB, not 114.80 MB.

### #46 — jemalloc-memory-analysis.md: corrupted sample value  [DONE — PR #3691]
- `docs/admin-manual/trouble-shooting/memory-management/memory-analysis/jemalloc-memory-analysis.md:64` — code example error — low/medium
- `extents` table: size class 114688, ntotal 17, total `185139` looks corrupted (should be ~1949696).

### #47 — metadata-memory-analysis.md: garbled bvar name  [DONE — PR #3691]
- `docs/admin-manual/trouble-shooting/memory-management/memory-analysis/metadata-memory-analysis.md:35` — typo — high
- `doris_pk/index_reader_pagindex_reader_pk_pageses` — mangled string, copy/paste corruption.

### #48 — load-memory-analysis.md: unbalanced inline-code backticks  [DONE — PR #3691]
- `docs/admin-manual/trouble-shooting/memory-management/memory-analysis/load-memory-analysis.md:29` — markdown — high
- `` ``Label=AllMemTableMemory` `` opens with 2 backticks, closes with 1.

### #49 — analysis-diagnosis.md: ORDER BY DESC applies to last column only
- `docs/admin-manual/workload-management/analysis-diagnosis.md:102` — code example error — high
- `ORDER BY memory_usage_bytes, cpu_usage_percent, local_scan_bytes_per_second DESC` — DESC only on last col.
- Fix: add `DESC` to each column.

### #50 — spill-disk.md: wrong watermark defaults  [DONE — PR #3691]
- `docs/admin-manual/workload-management/spill-disk.md:63-64` — inconsistency — medium
- Says `memory_low_watermark` default 80%, `memory_high_watermark` 95%; other docs (workload-group.md, concurrency-control) show 50% / 80%.
- Fix: correct to 50% / 80%.

### #51 — concurrency-control-and-queuing.md: orphan ** in FAQ headings  [DONE — PR #3691]
- `docs/admin-manual/workload-management/concurrency-control-and-queuing.md:123,127,131,135` — markdown — high
- Four FAQ subheadings end with stray `**`. Fix: remove.

### #52 — compute-group.md: orphan ** in FAQ headings  [DONE — PR #3691]
- `docs/admin-manual/workload-management/compute-group.md:115,119` — markdown — high
- FAQ subheadings end with stray `**`. Fix: remove.

### #53 — workload-group.md: orphan ** in FAQ headings  [DONE — PR #3691]
- `docs/admin-manual/workload-management/workload-group.md:690,696,700` — markdown — high
- FAQ subheadings end with stray `**`. Fix: remove.
- (Note, low-confidence, not tracked: workload-group.md:265 `min_cpu_percent`='2048' is out of percentage range — possibly intentional version-transition behavior.)

## Batch 5 — compute-storage-decoupled + connection-integration + delete (50 files) — 14 findings

### #54 — data-integration intro.mdx: broken link ./spark-load  [SKIPPED — user holding off]
- `docs/connection-integration/data-integration/intro.mdx:142` — broken link — high
- Links `./spark-load`; no such file (actual is `spark-doris-connector.md`).

### #55 — data-integration intro.mdx: broken link ./apache-superset  [SKIPPED — user holding off]
- `docs/connection-integration/data-integration/intro.mdx:21` — broken link — high
- Links `./apache-superset`; file is `superset.md`. Fix: `./superset`.

### #56 — file-cache.md: placeholder (#) links  [DONE — PR #3692]
- `docs/compute-storage-decoupled/file-cache/file-cache.md:164,396` — broken link — high
- Two "WARM-UP SQL documentation" links are placeholder `[...](#)`.

### #57 — managing-compute-cluster.md: wrong config key  [DONE — PR #3693 — note: finding was inverted; real config is cloud_warm_up_for_rebalance_type]
- `docs/compute-storage-decoupled/managing-compute-cluster.md:271` — code example error — high
- Uses `cloud_warm_up_for_rebalance_type`; correct key is `cloud_default_rebalance_type` (used at lines 221/237/267).

### #58 — recycler.md: wrong metric name  [DONE — PR #3695]
- `docs/compute-storage-decoupled/recycler.md:262` — code example error — medium
- FAQ uses `recycler_instance_last_success_ts`; table defines `recycler_instance_recycle_last_success_ts`.

### #59 — recycler.md: inconsistent recycle-duration metric name  [DONE — PR #3695]
- `docs/compute-storage-decoupled/recycler.md:261` — inconsistency — low
- FAQ metric `recycler_instance_last_recycle_duration` matches neither table variable nor metric name.

### #60 — managing-storage-vault.md: vault name mismatch  [SKIPPED — user holding off]
- `docs/compute-storage-decoupled/managing-storage-vault.md:133,149` — inconsistency — medium
- Examples create `hdfs_vault_demo`/`s3_vault_demo` but later reference `hdfs_demo_vault`.

### #61 — doris-streamloader.md: contradictory `workers` default
- `docs/connection-integration/data-integration/doris-streamloader.md:251` — inconsistency — high
- Best Practices says default = CPU core count; param table (line 140) says default `0` (automatic).

### #62 — beats.md: wrong label prefix in example  [DONE — PR #3696]
- `docs/connection-integration/data-integration/beats.md:216` — code example error — medium
- Response example label starts `logstash_` (copied from Logstash doc); should be `beats_`.

### #63 — flink-doris-connector.md: wrong default read protocol claim
- `docs/connection-integration/data-integration/flink-doris-connector.md:80` — inconsistency — medium
- Claims ADBC is default read protocol since 2.1; tables show Thrift is default, ArrowFlightSQL is opt-in.

### #64 — langfuse.md: wrong MinIO port  [DONE — PR #3696]
- `docs/connection-integration/data-integration/langfuse.md:49` — inconsistency — medium
- Component table lists MinIO port `9090`; actual service port is `9000`.

### #65 — datax.md: example log from a different job
- `docs/connection-integration/data-integration/datax.md:254,269` — inconsistency — low
- Run log references table `dwd_universal_tb_task`; job config uses `employees_1`/`all_employees_info`.

### #66 — delete-overview.md: duplicate keyword  [DONE — PR #3696]
- `docs/data-operate/delete/delete-overview.md:10-11` — typo — low
- `keywords` list has `delete sign` twice.

### #67 — vector.md (+ reused in beats/fluentbit/logstash/loongcollector/opentelemetry): sample timestamp mismatch
- `docs/connection-integration/data-integration/vector.md:309` — inconsistency — low
- JSON sample said to be for 2024-01-01 15:00 but `created_at` is `2024-04-01T23:00:00Z`.

## Batch 6 — data-operate export + import (50 files) — 24 findings

### #68 — export-manual.md: SHOW EXPORT sample describes different table
- `docs/data-operate/export/export-manual.md:138` — inconsistency — medium
- `TaskInfo` JSON shows `db:tpch1,tbl:lineitem` but Quick Start job exports `tbl`.

### #69 — export-manual.md: missing comma in Kerberos example  [DONE — PR #3696]
- `docs/data-operate/export/export-manual.md:213-214` — code example error — high
- `dfs.namenode.kerberos.principal` line missing trailing comma.

### #70 — outfile.md: missing comma in Kerberos example  [DONE — PR #3696]
- `docs/data-operate/export/outfile.md:189-190` — code example error — high
- Same missing-comma bug as #69.

### #71 — variant.md: github_events vs test_variant table name
- `docs/data-operate/import/complex-types/variant.md:222,242` — inconsistency — medium
- Steps 1-4 use `test_variant`; Step 5 uses `desc github_events`.

### #72 — variant.md: FAQ wrong CSV separator  [DONE — PR #3696]
- `docs/data-operate/import/complex-types/variant.md:293,296` — code example error — high
- FAQ says CSV uses `column_separator:,`; actual example uses `:|`.

### #73 — variant.md: JSON verification output mismatch
- `docs/data-operate/import/complex-types/variant.md:143,211` — code example error — medium
- JSON input `created_at: 2020-11-13T18:00:00Z` but verification shows `2020-11-14 02:00:00`.

### #74 — bigquery.md: missing semicolon before INSERT  [DONE — PR #3696]
- `docs/data-operate/import/data-source/bigquery.md:65-75` — code example error — high
- `CREATE OR REPLACE TABLE ... PARTITION BY order_date` lacks terminating `;`.

### #75 — bigquery.md: LOAD label vs SHOW LOAD label mismatch
- `docs/data-operate/import/data-source/bigquery.md:145,167` — code example error — high
- Submits `sales_data_2025_04_08`; SHOW LOAD queries `label_sales_data_2025_04_08`.

### #76 — bigquery.md: broken anchor ./amazon-s3.md#load-with-tvf  [DONE — PR #3696]
- `docs/data-operate/import/data-source/bigquery.md:33,136,263` — broken link — high
- Anchor should be `#method-2-load-with-tvf-synchronous`.

### #77 — redshift.md: missing semicolon before INSERT  [DONE — PR #3696]
- `docs/data-operate/import/data-source/redshift.md:71-80` — code example error — high
- `CREATE TABLE ... DISTSTYLE AUTO` lacks terminating `;`.

### #78 — redshift.md: LOAD label mismatch
- `docs/data-operate/import/data-source/redshift.md:159,181` — code example error — high
- Same label mismatch as #75.

### #79 — redshift.md: broken anchor ./amazon-s3.md#load-with-tvf  [DONE — PR #3696]
- `docs/data-operate/import/data-source/redshift.md:33,153,154,266,304` — broken link — high
- Anchor should be `#method-2-load-with-tvf-synchronous`.

### #80 — snowflake.md: LOAD label mismatch
- `docs/data-operate/import/data-source/snowflake.md:169,191` — code example error — high
- Same label mismatch as #75.

### #81 — snowflake.md: broken anchor ./amazon-s3.md#load-with-tvf  [DONE — PR #3696]
- `docs/data-operate/import/data-source/snowflake.md:158,282,304` — broken link — high
- Anchor should be `#method-2-load-with-tvf-synchronous`.

### #82 — kafka.md: result column id vs user_id  [DONE — PR #3696]
- `docs/data-operate/import/data-source/kafka.md:164,171` — code example error — high
- Result tables show column `id`; tables created with `user_id`.

### #83 — kafka.md: broken Chinese anchor  [DONE — PR #3696]
- `docs/data-operate/import/data-source/kafka.md:180,475` — broken link — high
- `routine-load-manual.md#kafka-安全认证` should be `#kafka-security-authentication`.

### #84 — migrate-data-from-other-oltp.md: wrong source catalog  [DONE — PR #3696]
- `docs/data-operate/import/data-source/migrate-data-from-other-oltp.md:64-71` — code example error — medium
- Creates `mysql_catalog` but INSERT/CTAS selects `FROM iceberg_catalog...`.

### #85 — migrate-data-from-other-oltp.md: broken Chinese anchors  [DONE — PR #3696]
- `docs/data-operate/import/data-source/migrate-data-from-other-oltp.md:74,188,216` — broken link — high
- Chinese anchors `#数据导入`/`#整库同步`/`#批量写入` in English doc; need English anchors.

### #86 — migrate-data-from-other-oltp.md: Flink SQL comma errors  [DONE — PR #3696]
- `docs/data-operate/import/data-source/migrate-data-from-other-oltp.md:87-98` — code example error — medium
- Missing comma after `age INT`; stray trailing comma before closing paren.

### #87 — file-format/json.md: contradictory read_json_by_line default
- `docs/data-operate/import/file-format/json.md:117,129,192` — inconsistency — high
- Matrix + tip say default `true`; detailed description says `false`.

### #88 — file-format/json.md: Example 1 result contradicts the rule
- `docs/data-operate/import/file-format/json.md:248-280` — code example error — medium
- Example 1 result `k1=2,k2=1` contradicts Example 2 and the stated mapping rule.

### #89 — spark-load.md: typo in label "hvie"  [DONE — PR #3696]
- `docs/data-operate/import/import-way/spark-load.md:263` — typo — high
- `spark-load-test-hvie` should be `spark-load-test-hive`.

### #90 — spark-load.md: "5 stages" but list has 7  [DONE — PR #3696]
- `docs/data-operate/import/import-way/spark-load.md:38` — inconsistency — medium
- Text says 5 stages; numbered list has 7 items.

### #91 — spark-load.md: hadoop/hadoopProperties + doris_tb1/doris_t1
- `docs/data-operate/import/import-way/spark-load.md:342-344,466` — inconsistency — medium
- Table names param `hadoop`; examples use `hadoopProperties`. Also `doris_tb1` vs created `doris_t1`.

### #92 — mysql-load + local-file: "6 row affected"
- `docs/data-operate/import/import-way/mysql-load-manual.md:126`, `docs/data-operate/import/data-source/local-file.md:244` — typo — medium
- `Query OK, 6 row affected` -> `6 rows affected`.

### #93 — mysql-load-manual.md: LINE vs LINES TERMINATED BY
- `docs/data-operate/import/import-way/mysql-load-manual.md:173` — inconsistency — medium
- Table says `LINE TERMINATED BY`; syntax/examples use `LINES TERMINATED BY`.

### #94 — continuous-load-mysql-database.md: job name mismatch
- `docs/data-operate/import/import-way/streaming-job/continuous-load-mysql-database.md:62,94` — inconsistency — medium
- Creates `multi_table_sync`; sample result shows `mysql_db_sync`.

### #95 — continuous-load-s3.md: job name mismatch
- `docs/data-operate/import/import-way/streaming-job/continuous-load-s3.md:63,84` — inconsistency — medium
- Creates `my_job`; sample result shows `my_job1`.

### #96 — broken anchor #load-configuration-parameters
- `docs/data-operate/import/import-way/streaming-job/continuous-load-postgresql-table.md:115`, `continuous-load-s3.md:179,231` — broken link — high
- `insert-into-manual.md#load-configuration-parameters`; correct anchor `#import-configuration-parameters`.

## Batch 7 — update + faq + features-architecture + getting-started + install (50 files) — 18 findings

### #97 — group-commit-manual.md: non-standard port 9087
- `docs/data-operate/import/load-best-practices/group-commit-manual.md:242` — code example error — medium
- JDBC example uses `PORT = 9087`; should be `9030`.

### #98 — group-commit-manual.md: non-standard port 9038
- `docs/data-operate/import/load-best-practices/group-commit-manual.md:308` — code example error — low
- Golang example uses `port = 9038`; should be `9030`.

### #99 — transaction.md: wrong "0 rows affected"
- `docs/data-operate/transaction.md:346-368` — code example error — high
- `INSERT ... WHERE id = 7` reports `0 rows affected` but result shows the row was written. Should be `1 row affected`.

### #100 — transaction.md: typo "Alexande"
- `docs/data-operate/transaction.md:365` — typo — high
- Result shows `Alexande` for id=4; should be `Alexander`.

### #101 — unique-update-concurrent-control.md: missing comparison operator
- `docs/data-operate/update/unique-update-concurrent-control.md:221` — code example error — high
- `WHERE k1  100 and ...` missing operator between `k1` and `100`.

### #102 — update-of-aggregate-model.md: broken Chinese anchor
- `docs/data-operate/update/update-of-aggregate-model.md:24,43` — broken link — high
- `partial-column-update.md#聚合模型的列更新`; correct anchor `#column-update-on-the-aggregate-key-model`.

### #103 — update-of-unique-model.md: wrong anchor
- `docs/data-operate/update/update-of-unique-model.md:43` — broken link — medium
- Anchor `#column-update-for-the-unique-model`; correct `#column-update-on-the-unique-key-model`.

### #104 — sql-faq.md: duplicate Q5 section  [DONE — PR #3698]
- `docs/faq/sql-faq.md:52-70` — inconsistency — high
- Two consecutive `### Q5` with same title/content; renumber or dedupe.

### #105 — install-faq.md: Q-numbering skips Q14  [DONE — PR #3698]
- `docs/faq/install-faq.md:266,280` — inconsistency — medium
- Jumps Q13 -> Q15.

### #106 — load-faq.md: PR link text/URL mismatch  [DONE — PR #3698]
- `docs/faq/load-faq.md:86` — broken link — medium
- Text `#3727` but URL is `pull/40728`.

### #107 — features-architecture/intro.mdx: broken link feature-overview
- `docs/features-architecture/intro.mdx:37` — broken link — high
- Links `/docs/features-architecture/feature-overview`; no such file.

### #108 — what-is-apache-doris.md: invalid SELECT * with GROUP BY
- `docs/getting-started/what-is-apache-doris.md:131-136` — code example error — medium
- `SELECT * FROM products ... GROUP BY brand` is invalid SQL.

### #109 — integrated-storage-compute-deploy-manually.md: unclosed code fence  [DONE — PR #3699]
- `docs/install/deploy-manually/integrated-storage-compute-deploy-manually.md:307-328` — markdown — high
- SQL code block from line 307 never closed.

### #110 — separating-storage-compute-deploy-manually.md: orphan :::  [DONE — PR #3699]
- `docs/install/deploy-manually/separating-storage-compute-deploy-manually.md:212` — markdown — high
- Stray `:::` after a closed `:::tip` block.

### #111 — separating-storage-compute-deploy-manually.md: step numbering skips 2  [DONE — PR #3701]
- `docs/install/deploy-manually/separating-storage-compute-deploy-manually.md:294-327` — inconsistency — medium
- Step 7 sub-steps numbered 1,3,4,5 (no 2).

### #112 — separating-storage-compute-deploy-manually.md: typo PROTERTIES  [DONE — PR #3701]
- `docs/install/deploy-manually/separating-storage-compute-deploy-manually.md:318` — typo — high
- `[PROTERTIES propertires]` -> `[PROPERTIES properties]`.

### #113 — cluster-operation.md: "upgrade BE" in Upgrade FE section
- `docs/install/deploy-on-kubernetes/integrated-storage-compute/cluster-operation.md:220` — inconsistency — high
- Upgrade FE section says "apply this modification to upgrade BE".

### #114 — install-config-cluster.md: misspelled FE config keys  [DONE — PR #3701]
- `docs/install/deploy-on-kubernetes/integrated-storage-compute/install-config-cluster.md:162-164` — code example error — medium
- `syg_level`/`syg_mode` should be `sys_log_level`/`sys_log_mode`.

## Batch 8 — install k8s + key-features (50 files) — 13 findings

### #115 — integrated-storage-compute/intro.mdx: link with .md extension  [DONE — PR #3701]
- `docs/install/deploy-on-kubernetes/integrated-storage-compute/intro.mdx:23` — broken link — medium
- Card link `install-config-cluster.md` keeps `.md` while siblings are extensionless.

### #116 — config-cg.md: broken Chinese anchor
- `docs/install/deploy-on-kubernetes/separating-storage-compute/config-cg.md:86,231` — broken link — high
- `install-doris-cluster.md#3-配置-dorisdisaggregatedcluster-资源` — Chinese anchor not in English file.

### #117 — config-ms.md: broken Chinese anchors
- `docs/install/deploy-on-kubernetes/separating-storage-compute/config-ms.md:108,178` — broken link — high
- Same Chinese anchor `#3-配置-dorisdisaggregatedcluster-资源`.

### #118 — config-ms.md: broken Chinese anchor to install-fdb  [DONE — PR #3701]
- `docs/install/deploy-on-kubernetes/separating-storage-compute/config-ms.md:60` — broken link — high
- `install-fdb.md#获取包含-foundationdb-访问信息的-configmap`; correct `#get-the-configmap-that-contains-foundationdb-access-information`.

### #119 — config-cluster.md: broken Chinese anchor #权限类型  [DONE — PR #3701]
- `docs/install/deploy-on-kubernetes/separating-storage-compute/config-cluster.md:21,237` — broken link — high
- `authentication-and-authorization#权限类型` — Chinese anchor in English doc.

### #120 — config-fe.md: broken same-page Chinese anchor
- `docs/install/deploy-on-kubernetes/separating-storage-compute/config-fe.md:111` — broken link — high
- `config-fe#自定义启动配置`; correct `#custom-startup-configuration` (used correctly at line 362).

### #121 — install-doris-cluster.md: mismatched fdb anchor  [DONE — PR #3701]
- `docs/install/deploy-on-kubernetes/separating-storage-compute/install-doris-cluster.md:193` — broken link — medium
- `install-fdb.md#get-the-configmap-containing-foundationdb-access-information` doesn't match heading anchor.

### #122 — config-fe.md: wrong FE service hostname  [DONE — PR #3701]
- `docs/install/deploy-on-kubernetes/separating-storage-compute/config-fe.md:197` — code example error — medium
- `mysql -h doriscluster-sample-fe-service`; actual service is `doriscluster-sample-fe`.

### #123 — llm-sql-functions.mdx: "Eleven" but list has ten
- `docs/key-features/llm-sql-functions.mdx:36,41` — inconsistency — high
- Text says eleven scalar functions; list has ten `AI_*`.

### #124 — query-cache.mdx: "four" overlapping days but range is three
- `docs/key-features/query-cache.mdx:67,83` — code example error — high
- Says "four overlapping days (2024-01-05 through 2024-01-07)"; that range is three days.

### #125 — binlog-table-stream.mdx: inconsistent view columns
- `docs/key-features/binlog-table-stream.mdx:83-97` — inconsistency — medium
- Expected-result columns of `table_stream_consumption` don't match the documented schema; `STALE_REASON` never defined. (Doc is "preview".)

### #126 — data-compaction.mdx: unexplained TABLE_ID placeholder
- `docs/key-features/data-compaction.mdx:87` — code example error — low
- Query uses `TABLE_ID = ...` but example identified table by name.

### #127 — os-checking.md: VMA section references wrong error
- `docs/install/preparation/os-checking.md:75` — inconsistency — medium
- `vm.max_map_count` section says it prevents "Too many open files" (an fd/ulimit error, not VMA).

## Batch 9 — key-features + lakehouse best-practices + catalogs (50 files) — 18 findings

### #128 — spill-to-disk.mdx: wrong link target  [DONE — PR #3701]
- `docs/key-features/spill-to-disk.mdx:107` — broken link — high
- Link text `backend_active_tasks` but target is `workload_groups`. Fix target to `backend_active_tasks`.

### #129 — doris-aws-s3tables.md: SWITCH to non-existent catalog
- `docs/lakehouse/best-practices/doris-aws-s3tables.md:71` — code example error — high
- `SWITCH iceberg_s3;` but catalogs created are `aws_s3_tables`/`glue_s3`.

### #130 — doris-hudi.md: swapped login-script comments  [DONE — PR #3701]
- `docs/lakehouse/best-practices/doris-hudi.md:72-76` — inconsistency — high
- `-- Doris` above `login-spark.sh` and `-- Spark` above `login-doris.sh`.

### #131 — doris-iceberg.md: wrong "6 rows affected"
- `docs/lakehouse/best-practices/doris-iceberg.md:132-134` — code example error — high
- CTAS reports `6 rows affected` but `taxis` has 4 rows at that point.

### #132 — doris-paimon.md: Chinese comment in English doc  [DONE — PR #3701]
- `docs/lakehouse/best-practices/doris-paimon.md:143` — inconsistency — high
- `-- 已创建，无需执行` should be English.

### #133 — doris-onelake.md: broken oauth2 credential property
- `docs/lakehouse/best-practices/doris-onelake.md:95` — code example error — high
- Misplaced quotes in `iceberg.rest.oauth2.credential` value.

### #134 — doris-onelake.md: typo "talent_id"  [DONE — PR #3701]
- `docs/lakehouse/best-practices/doris-onelake.md:94,101` — typo — medium
- `<talent_id>` should be `<tenant_id>`.

### #135 — doris-polaris.md: -test vs -demo resource names
- `docs/lakehouse/best-practices/doris-polaris.md:226-228` — inconsistency — high
- Creates `polaris-doris-demo` resources; later uses `polaris-doris-test`.

### #136 — jdbc-catalog-overview.md: double equals in syntax  [DONE — PR #3701]
- `docs/lakehouse/catalogs/jdbc-catalog-overview.md:44` — code example error — high
- `'type' =='jdbc'` -> `'type' = 'jdbc'`.

### #137 — jdbc-catalog-overview.md: wrong DB links  [DONE — PR #3701]
- `docs/lakehouse/catalogs/jdbc-catalog-overview.md:28-31` — broken link — high
- PostgreSQL/Oracle/SQL Server/DB2 rows all link to `jdbc-mysql-catalog.md`.

### #138 — jdbc-ibmdb2-catalog.md: wrong language frontmatter  [DONE — PR #3701]
- `docs/lakehouse/catalogs/jdbc-ibmdb2-catalog.md:4` — inconsistency — high
- `language: "zh-CN"` but English content. Fix: `"en"`.

### #139 — jdbc-saphana-catalog.md: typo "smalling"  [DONE — PR #3701]
- `docs/lakehouse/catalogs/jdbc-saphana-catalog.md:54` — typo — high
- `| smalling | smalling |` -> `| smallint | smallint |`.

### #140 — hudi-catalog.md: typo "SKD"  [DONE — PR #3701]
- `docs/lakehouse/catalogs/hudi-catalog.md:275` — typo — high
- "Java SKD" -> "Java SDK".

### #141 — hive-catalog.mdx: unclosed Glue IAM-role code block  [DONE — PR #3701]
- `docs/lakehouse/catalogs/hive-catalog.mdx:610-617` — markdown — high
- Glue IAM-role example missing `);` and closing code fence.

### #142 — hive/iceberg/kerberos: trailing space in property key  [DONE — PR #3701]
- `docs/lakehouse/catalogs/hive-catalog.mdx:260,330,363,485`, `docs/lakehouse/best-practices/kerberos.md:236,257`, `docs/lakehouse/catalogs/iceberg-catalog.mdx:312,375,544` — code example error — medium
- `'hive.metastore.sasl.enabled '` has a trailing space inside quotes.

### #143 — iceberg-catalog.mdx: duplicated keytab path segment  [DONE — PR #3701]
- `docs/lakehouse/catalogs/iceberg-catalog.mdx:411` — typo — medium
- `/keytabs/keytabs/hive-presto-master.keytab` has duplicate `keytabs/`.

### #144 — iceberg-catalog.mdx: missing comma in CREATE CATALOG template  [DONE — PR #3701]
- `docs/lakehouse/catalogs/iceberg-catalog.mdx:36-37` — code example error — medium
- `'warehouse' = '<warehouse>' --optional` missing trailing comma.

### #145 — catalog-overview.md: SHOW CATALOGS wrong type  [DONE — PR #3701]
- `docs/lakehouse/catalog-overview.md:187` — inconsistency — medium
- `iceberg_catalog` shown with Type `hms`; created with `'type'='iceberg'`.

## Batch 10 — lakehouse metastores/storages + observability + query-acceleration (50 files) — 20 findings

### #146 — parquet.md: wrong language frontmatter  [DONE — PR #3701]
- `docs/lakehouse/file-formats/parquet.md:5` — inconsistency — high — `language: "zh-CN"` but English. Fix: `"en"`.

### #147 — text.md: wrong language frontmatter  [DONE — PR #3701]
- `docs/lakehouse/file-formats/text.md:5` — inconsistency — high — `language: "zh-CN"` but English. Fix: `"en"`.

### #148 — storages/gcs.md: wrong language frontmatter  [DONE — PR #3701]
- `docs/lakehouse/storages/gcs.md:4` — inconsistency — high — `language: "zh-CN"` but English. Fix: `"en"`.

### #149 — metastores/filesystem.md: doc ends mid-sentence
- `docs/lakehouse/metastores/filesystem.md:11` — typo/grammar — high — Sentence incomplete; doc is a stub.

### #150 — iceberg-rest.md: table row missing a cell
- `docs/lakehouse/metastores/iceberg-rest.md:14,23` — markdown — high — `nested-namespace-enabled` row has 5 cells, header has 6; Default Value cell missing.

### #151 — lakehouse/statistics.md: broken Chinese anchor  [DONE — PR #3701]
- `docs/lakehouse/statistics.md:14` — broken link — high — `statistics#外表收集` Chinese anchor in English doc.

### #152 — storages/minio.md: duplicated legacy name  [DONE — PR #3701]
- `docs/lakehouse/storages/minio.md:30` — table error — high — `minio.connection.request.timeout` legacy name `s3.connection.timeout`; should be `s3.connection.request.timeout`.

### #153 — storages/minio.md: sentence ends abruptly
- `docs/lakehouse/storages/minio.md:61` — typo/grammar — medium — "...avoid connection" incomplete.

### #154 — storages/tencent-cos.md: duplicated legacy name  [DONE — PR #3701]
- `docs/lakehouse/storages/tencent-cos.md:28` — table error — medium — `cos.connection.request.timeout` legacy name should be `s3.connection.request.timeout`.

### #155 — observability/log.md: malformed quoted string
- `docs/observability/log.md:390` — markdown — high — Logstash `http_hosts` third element has misplaced closing quote.

### #156 — observability/log.md: routine load columns mismatch
- `docs/observability/log.md:511` — code example error — medium — `COLUMNS(ts,clientip,request,status,size)` but `log_table` has `ts,host,path,message`.

### #157 — bitmap-precise-deduplication.md: DISTINCT pv (= issue #62827)  [DONE — PR #3659]
- `docs/query-acceleration/distinct-counts/bitmap-precise-deduplication.md:143` — code example error — high
- Fixed in PR #3659 across 6 files (EN next+4.x, ZH next+2.1/3.x/4.x).

### #158 — hll-approximate-deduplication.md: pv in sample comment (= original #3)
- `docs/query-acceleration/distinct-counts/hll-approximate-deduplication.md:127` — code example error — medium
- Duplicate of finding #3.

### #159 — hll-approximate-deduplication.md: COUNT(DISTINCT uv) (= original #4)
- `docs/query-acceleration/distinct-counts/hll-approximate-deduplication.md:170` — code example error — medium
- Duplicate of finding #4. Should be `COUNT(DISTINCT id)`.

### #160 — async-mv overview.md: "DELETE TABLE" not a real statement  [DONE — PR #3701]
- `docs/query-acceleration/materialized-view/async-materialized-view/overview.md:244` — code/terminology — high
- "DELETE TABLE" should be "DROP TABLE".

### #161 — async-mv faq.md: year mismatch 2024 vs 2025
- `docs/query-acceleration/materialized-view/async-materialized-view/faq.md:242,279` — inconsistency — medium
- CREATE uses STARTS '2024-12-01...'; mv_infos output shows '2025-12-01...'.

### #162 — async-mv use-guide.md: duplicate MV name mv_1_1
- `docs/query-acceleration/materialized-view/async-materialized-view/use-guide.md:265,284` — code example error — high
- Example 2 and Example 3 both create `mv_1_1`.

### #163 — async-mv use-guide.md: malformed INSERT  [DONE — PR #3701]
- `docs/query-acceleration/materialized-view/async-materialized-view/use-guide.md:305-311` — code example error — high
- INSERT ends with trailing comma + no `;`.

### #164 — async-mv use-guide.md: missing comma in SELECT list  [DONE — PR #3701]
- `docs/query-acceleration/materialized-view/async-materialized-view/use-guide.md:557,594` — code example error — medium
- `l_extendedprice * (1 - l_discount)` and `o_shippriority` not comma-separated.

### #165 — async-mv: Chinese anchors in English links  [DONE — PR #3701]
- `docs/query-acceleration/materialized-view/async-materialized-view/faq.md:119,372`, `functions-and-demands.md:151,252` — broken link — medium
- Chinese anchors `#可选参数`/`#透明改写能力`/`#q12构建分区物化视图报错` won't resolve.

## Batch 11 — query-acceleration + query-data + sql-manual basic-element (50 files) — 13 findings

### #166 — numeric-literal.md: integer range table exponents doubled
- `docs/sql-manual/basic-element/literal/numeric-literal.md:17-23` — code/data error — high
- TINYINT listed `-2^8..2^8-1`, should be `-2^7..2^7-1`; every exponent doubled. Halve all.

### #167 — asof-join.md: stray XML/tool tags at EOF  [DONE — PR #3701]
- `docs/query-data/asof-join.md:446-447` — markdown — high
- Orphan `</content>` and `</invoke>` tags. Delete.

### #168 — python-user-defined-function.md: missing comma after id  [DONE — PR #3701]
- `docs/query-data/udf/python-user-defined-function.md:628-632` — code example error — high
- `SELECT id a, b, ...` — `id` aliased as `a`; should be `SELECT id, a, b, ...`.

### #169 — window-function.md: stream load missing "columns:" prefix  [DONE — PR #3701]
- `docs/query-data/window-function.md:782` — code example error — high
- 4th curl `-H "ca_address_sk,..."` missing `columns: ` prefix.

### #170 — java-user-defined-function.md: hyphenated function name  [DONE — PR #3701]
- `docs/query-data/udf/java-user-defined-function.md:430` — code example error — high
- DDL `java-utdf` (hyphen, invalid); invoked as `java_utdf`.

### #171 — data-skew-handling.md: description contradicts leading hint
- `docs/query-acceleration/tuning/tuning-execution/data-skew-handling.md:143` — inconsistency — high
- `/*+leading(orders customer)*/` but text says forces `customer join orders`.

### #172 — reordering-join-with-leading-hint.md: SELECT missing select list  [DONE — PR #3701]
- `docs/query-acceleration/tuning/tuning-plan/reordering-join-with-leading-hint.md:53` — code example error — high
- `explain shape plan select from t1 join t2 ...` missing `*`.

### #173 — controlling-hints-with-cbo-rule.md: spurious filter node in plan
- `docs/query-acceleration/tuning/tuning-plan/controlling-hints-with-cbo-rule.md:103` — code example error — medium
- Plan shows `filter(experiment_id=73.0)`; SQL has no such column/WHERE.

### #174 — mysql-compatibility.md: "MySQL supports" should be "Doris"  [DONE — PR #3701]
- `docs/query-data/mysql-compatibility.md:159` — inconsistency — medium
- Bullet about bitmap/inverted/N-Gram indexes says "MySQL supports"; these are Doris features.

### #175 — runtime-filter.md: invalid RuntimeFilterState value
- `docs/query-acceleration/optimization-technology-principle/runtime-filter.md:326` — inconsistency — medium
- `RuntimeFilterState = false`; valid values are `READY`/`NOT_READY`.

### #176 — query-profile.md: nonexistent metric DependencyWaitTime
- `docs/query-acceleration/query-profile.md:469` — inconsistency — medium
- `DependencyWaitTime` not used elsewhere; real metrics `ExecTime`/`WaitForDependency`.

### #177 — tuning-execution/parallelism-tuning.md: ProbeRows value mismatch
- `docs/query-acceleration/tuning/tuning-execution/parallelism-tuning.md:180` — code example error — medium
- `1.4662330332B (1462330332)` — readable value should be `1.462330332B`.

### #178 — string-literal.md: malformed NUL notation + unclosed backtick
- `docs/sql-manual/basic-element/literal/string-literal.md:24,39` — typo/markdown — medium
- `'X'00'` malformed; line 39 missing closing backtick.

## Batch 12 — sql-manual basic-element operators + data-types (50 files) — 16 findings

### #179 — pattern-matching-operators.md: LIKE/REGEXP description inverted
- `docs/sql-manual/basic-element/operators/conditional-operators/pattern-matching-operators.md:17-18` — inconsistency — high
- Says returns TRUE when char1 does NOT match; should be matches.

### #180 — arithmetic-operators.mdx: `*` described as multiply/divide
- `docs/sql-manual/basic-element/operators/arithmetic-operators.mdx:55-56` — typo/inconsistency — medium
- `*` row conflates `*` and `/`.

### #181 — AGG-STATE.md: missing closing `>` in agg_state type  [DONE — PR #3701]
- `docs/sql-manual/basic-element/sql-data-types/aggregate/AGG-STATE.md:30` — code example error — high
- `agg_state<group_concat(string) generic` missing `>`.

### #182 — QUANTILE-STATE.md: copy-paste from HLL doc
- `docs/sql-manual/basic-element/sql-data-types/aggregate/QUANTILE-STATE.md:16` — inconsistency — high
- References "HLL type"/"HLL_UNION"; should be QUANTILE_STATE/QUANTILE_UNION.

### #183 — datetime-conversion.md: lower bound 7 fractional digits
- `docs/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion.md:11` — inconsistency — medium
- `0000-01-01 00:00:00.0000000` has 7 digits; max precision is 6.

### #184 — datetime-conversion.md: wrong month in result
- `docs/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion.md:201` — code example error — high
- Input Jan 5 shows result `2023-10-05` (October).

### #185 — datetime-conversion.md: wrong seconds in result
- `docs/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion.md:208` — code example error — high
- Input `1920Z` (no seconds) shows `:20` seconds; should be `:00`.

### #186 — datetime-conversion.md: wrong minute in result
- `docs/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion.md:221` — code example error — high
- `20120102030405` -> `03:05:05`; should be `03:04:05`.

### #187 — datetime-conversion.md: missing time component
- `docs/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion.md:224` — inconsistency — medium
- `2024/05/01` result lacks `00:00:00.000000`.

### #188 — datetime-conversion.md: DATETIME(3) vs DATETIME(6)
- `docs/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion.md:436` — inconsistency — medium
- Text says DATETIME(3); table header/results are DATETIME(6).

### #189 — cast-to-string.md: wrong "scientific notation" comment
- `docs/sql-manual/basic-element/sql-data-types/conversion/cast-to-string.md:86` — inconsistency — medium
- Result is decimal but comment says scientific notation.

### #190 — struct-conversion.md: contradictory cast result
- `docs/sql-manual/basic-element/sql-data-types/conversion/struct-conversion.md:184-193` — code example error — medium
- Same query shown succeeding then failing; first result wrong.

### #191 — DATE.md: doc refers to "TIME type"  [DONE — PR #3701]
- `docs/sql-manual/basic-element/sql-data-types/date-time/DATE.md:24` — inconsistency — high
- DATE doc says "TIME type does not store time zone"; should say DATE.

### #192 — LARGEINT.md: keywords lists BIGINT  [DONE — PR #3701]
- `docs/sql-manual/basic-element/sql-data-types/numeric/LARGEINT.md:15` — inconsistency — high
- `### keywords` lists `BIGINT`; should be `LARGEINT`.

### #193 — DECIMAL.md: typo "elect" for "select"  [DONE — PR #3701]
- `docs/sql-manual/basic-element/sql-data-types/numeric/DECIMAL.md:327` — typo — high
- Example begins `elect f1, f2, ...`.

### #194 — ARRAY.md: trailing comma in CREATE TABLE  [DONE — PR #3701]
- `docs/sql-manual/basic-element/sql-data-types/semi-structured/ARRAY.md:248` — code example error — low
- Trailing comma after last column definition.

## Batch 13 — semi-structured/string types + aggregate-functions (50 files) — 19 findings

### #195 — GEO.md: malformed CREATE TABLE (missing/full-width paren)
- `docs/sql-manual/basic-element/sql-data-types/semi-structured/GEO.md:113` (+135,176,179,198,201,221,224,242,245,265,268,292) — code example error — high
- `create table ...(id int, wkt VARCHAR(255);` missing closing `)`; recurs throughout file (some use full-width `）`).

### #196 — GEO.md: Chinese comments + invalid WKT
- `docs/sql-manual/basic-element/sql-data-types/semi-structured/GEO.md:269` — inconsistency — medium
- Chinese inline comments in English doc; MULTIPOLYGON literal broken.

### #197 — GEO.md: x/y latitude/longitude reversed
- `docs/sql-manual/basic-element/sql-data-types/semi-structured/GEO.md:151` — inconsistency — medium
- Heading says "x for latitude, y for longitude"; convention is x=longitude.

### #198 — JSON.md: Chinese section heading  [DONE — PR #3701]
- `docs/sql-manual/basic-element/sql-data-types/semi-structured/JSON.md:96` — inconsistency — high
- `## JSON 的分组支持` in English doc.

### #199 — JSON.md: prose says TINYINT, output says int
- `docs/sql-manual/basic-element/sql-data-types/semi-structured/JSON.md:155` — inconsistency — medium
- Text "second 123 is TINYINT"; json_type output shows `int`.

### #200 — JSON.md: grammar "28% of rows is invalid"  [DONE — PR #3701]
- `docs/sql-manual/basic-element/sql-data-types/semi-structured/JSON.md:451,482` — typo — low
- "is" should be "are".

### #201 — STRING.md: STRING shown with length param (M)
- `docs/sql-manual/basic-element/sql-data-types/string-type/STRING.md:11` — markdown — medium
- `STRING (M)` — STRING takes no length parameter.

### #202 — variables.md: inconsistent version_comment formats
- `docs/sql-manual/basic-element/variables.md:112` — inconsistency — medium
- Value `doris0.0.0--...` vs Default_Value `doris-0.0--...`.

### #203 — ai-agg.md: typo "default_ai_resoure"
- `docs/sql-manual/sql-functions/aggregate-functions/ai-agg.md:110` — typo — high
- `default_ai_resoure` -> `default_ai_resource`.

### #204 — array-agg.md: orphan table row
- `docs/sql-manual/sql-functions/aggregate-functions/array-agg.md:70` — markdown — high
- Stray table row after a closed code block.

### #205 — bitmap-agg.md: BIGINT value out of range
- `docs/sql-manual/sql-functions/aggregate-functions/bitmap-agg.md:48-49` — code example error — medium
- INSERT `18446744073709551616` into a BIGINT column (exceeds BIGINT max).

### #206 — bitmap-agg.md: query/header mismatch + duplicate block
- `docs/sql-manual/sql-functions/aggregate-functions/bitmap-agg.md:91-99` — inconsistency — high
- Query `bitmap_agg(k5)` but header `bitmap_agg(cast(k5 as BIGINT))`; duplicate of earlier example.

### #207 — bitmap-intersect.md: duplicate "## Example" heading
- `docs/sql-manual/sql-functions/aggregate-functions/bitmap-intersect.md:30-31` — markdown — high

### #208 — bool-or.md: wrong return-value description
- `docs/sql-manual/sql-functions/aggregate-functions/bool-or.md:31` — inconsistency — high
- Says TRUE "when all non-NULL values exist"; should be "when at least one is TRUE".

### #209 — covar-samp.md: orphan rows after code fence
- `docs/sql-manual/sql-functions/aggregate-functions/covar-samp.md:76-80` — markdown — high
- Stray table rows + extra ``` outside the fence.

### #210 — histogram.md: lower/upper bound descriptions swapped
- `docs/sql-manual/sql-functions/aggregate-functions/histogram.md:129-130` — inconsistency — high
- "lower: Upper bound" / "upper: Lower bound".

### #211 — map-agg.md: example output not producible from setup data
- `docs/sql-manual/sql-functions/aggregate-functions/map-agg.md:81-93` — code example error — high
- 3rd example references nations/regions absent from the 4-row setup table; query also outside code fence.

### #212 — median.md: query block doesn't match shown result
- `docs/sql-manual/sql-functions/aggregate-functions/median.md:46-52` — inconsistency — medium
- ```sql block shows `group by datetime`; result block shows a different `where ... is null` query.

### #213 — JSON.md: duplicated "CAST(string AS JSON):" bullets
- `docs/sql-manual/basic-element/sql-data-types/semi-structured/JSON.md:314` — typo — low
- Two consecutive bullets begin identically.

## Batch 14 — aggregate-functions + ai-functions (50 files) — 9 findings

### #214 — percentile_reservoir.md: example uses percentile() instead
- `docs/sql-manual/sql-functions/aggregate-functions/percentile_reservoir.md:79` — code example error — high
- 3rd example query + header use `percentile(...)`; copy-paste from percentile.md.

### #215 — retention.md: INSERT doesn't match displayed table
- `docs/sql-manual/sql-functions/aggregate-functions/retention.md:96,101-108` — code example error — high
- INSERT `(0,false,false),(1,true,NULL)` contradicts the SELECT * result and examples 5-7.

### #216 — stddev.md: says "sample" but doc is population stddev
- `docs/sql-manual/sql-functions/aggregate-functions/stddev.md:32` — inconsistency — high
- Return Value says "sample standard deviation"; STDDEV/STDDEV_POP is population.

### #217 — inner-product-approximate.md: duplicate param label array1
- `docs/sql-manual/sql-functions/ai-functions/distance-functions/inner-product-approximate.md:24` — typo — high
- 2nd parameter row labeled `<array1>`; should be `<array2>`.

### #218 — inner-product.md: duplicate param label array1
- `docs/sql-manual/sql-functions/ai-functions/distance-functions/inner-product.md:24` — typo — high
- 2nd parameter row labeled `<array1>`; should be `<array2>`.

### #219 — inner-product-approximate.md: example calls wrong function
- `docs/sql-manual/sql-functions/ai-functions/distance-functions/inner-product-approximate.md:62` — code example error — high
- Example query calls `L2_distance_approximate(...)`; should be `INNER_PRODUCT_APPROXIMATE`.

### #220 — ai-summarize.md: typo "resourse_name"
- `docs/sql-manual/sql-functions/ai-functions/ai-summarize.md:68` — typo — medium
- `'resourse_name'` -> `'resource_name'`.

### #221 — ai-translate.md: typo "resourse_name"
- `docs/sql-manual/sql-functions/ai-functions/ai-translate.md:57` — typo — medium
- `'resourse_name'` -> `'resource_name'`.

### #222 — ai-classify.md: typo "useage" in sample data
- `docs/sql-manual/sql-functions/ai-functions/ai-classify.md:58` — typo — low
- `'useage'` -> `'usage'` (sample label).

## Batch 15 — combinators + array-functions (50 files) — 14 findings

### #223 — combinators/union.md: example may be copy of state.md
- `docs/sql-manual/sql-functions/combinators/union.md:20` — code example error — medium
- Example is verbatim copy of state.md; doesn't demonstrate `_union`.

### #224 — array-avg.md: NULL example calls array_max
- `docs/sql-manual/sql-functions/scalar-functions/array-functions/array-avg.md:155-157` — code example error — high
- "Array is NULL" example calls `array_max(NULL)`; copy-paste from array-max.md.

### #225 — array-count.md: unclosed <version> tag
- `docs/sql-manual/sql-functions/scalar-functions/array-functions/array-count.md:11-15` — markdown — high
- `<version since="2.0.0">` never closed.

### #226 — array-cross-product.md: duplicate param label array1
- `docs/sql-manual/sql-functions/scalar-functions/array-functions/array-cross-product.md:23` — typo — high
- 2nd parameter row labeled `<array1>`; should be `<array2>`.

### #227 — array-product.md: wrong example result
- `docs/sql-manual/sql-functions/scalar-functions/array-functions/array-product.md:62-67` — code example error — high
- `array_product([1.1,2.2,3.3,4.4,5.5])` shows `190.8`; actual ≈193.26.

### #228 — array-reverse-split.md: malformed result brackets
- `docs/sql-manual/sql-functions/scalar-functions/array-functions/array-reverse-split.md:47` — code example error — high
- Result `[[1,[NULL,3]]` mismatched brackets; should be `[[1, NULL, 3]]`.

### #229 — array-split.md: malformed result brackets
- `docs/sql-manual/sql-functions/scalar-functions/array-functions/array-split.md:47` — code example error — high
- Result `[[1,[NULL,3]]` mismatched brackets; should be `[[1, NULL, 3]]`.

### #230 — array-union.md: header doesn't match query
- `docs/sql-manual/sql-functions/scalar-functions/array-functions/array-union.md:89-94` — code example error — high
- Query has `ARRAY('hello','world','hello')`; header shows `ARRAY('hello','world')`.

### #231 — array-sortby.md: wrong example result
- `docs/sql-manual/sql-functions/scalar-functions/array-functions/array-sortby.md:44` — code example error — medium
- Keys `[true,false,false]` should sort `[1,2,3]` to `[2,3,1]`, not `[1,2,3]`.

### #232 — array-filter.md: misaligned table border
- `docs/sql-manual/sql-functions/scalar-functions/array-functions/array-filter.md:99` — markdown — high
- Bottom border shorter than table width.

### #233 — array-shuffle.md: empty bullet
- `docs/sql-manual/sql-functions/scalar-functions/array-functions/array-shuffle.md:32` — markdown — medium
- Orphan empty `- ` list item.

### #234 — array-distinct.md: missing SELECT statements
- `docs/sql-manual/sql-functions/scalar-functions/array-functions/array-distinct.md:106-121` — code example error — medium
- Empty/NULL examples show result tables without the `SELECT` query.

### #235 — array-first.md: swapped error captions
- `docs/sql-manual/sql-functions/scalar-functions/array-functions/array-first.md:139-148` — inconsistency — low
- Two error-example captions are swapped.

### #236 — array-apply.md: "binary operator" misnomer
- `docs/sql-manual/sql-functions/scalar-functions/array-functions/array-apply.md:5,18` — inconsistency — low
- `op` called "binary operator"; it's a comparison operator.

## Batch 16 — array/binary/bitmap/bitwise/conditional functions (50 files) — 11 findings

### #237 — arrays-overlap.md: placeholder char "◊" in description
- `docs/sql-manual/sql-functions/scalar-functions/array-functions/arrays-overlap.md:5,11` — typo — high
- "is used to ◊ whether two arrays" — missing verb (determine).

### #238 — array.md: full-width colon in parameter line
- `docs/sql-manual/sql-functions/scalar-functions/array-functions/array.md:30` — typo — high
- Full-width `：` instead of ASCII `:`. (Also `language: "en-US"` vs `"en"` at line 4 — low.)

### #239 — from_hex.md: confusing/contradictory description
- `docs/sql-manual/sql-functions/scalar-functions/binary-functions/from_hex.md:5,10,31` — inconsistency — high
- Description wording contradicts Return Value + examples.

### #240 — to_hex.md: description contradicts Return Value
- `docs/sql-manual/sql-functions/scalar-functions/binary-functions/to_hex.md:5,10,31` — inconsistency — high
- Description says "convert string into hex byte sequence"; function decodes hex into VARBINARY.

### #241 — to-base64-binary.md: "empty string" for VARBINARY input
- `docs/sql-manual/sql-functions/scalar-functions/binary-functions/to-base64-binary.md:30` — inconsistency — medium
- Return Value says "empty string" but input is VARBINARY.

### #242 — bitmap-hash.md: result header is "res"
- `docs/sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-hash.md:79-83` — code example error — high
- Query has no alias but header shows `res`.

### #243 — bit-length.md: entire English doc is Chinese
- `docs/sql-manual/sql-functions/scalar-functions/bitwise-functions/bit-length.md:1-48` — inconsistency — high
- `language: "en"` but whole body (headings + text) is Chinese.

### #244 — bit-length.md: description missing `*` operator
- `docs/sql-manual/sql-functions/scalar-functions/bitwise-functions/bit-length.md:5` — typo — high
- Frontmatter description "字节数 8"; body has "字节数 * 8".

### #245 — bitshiftright.md: wrong language frontmatter
- `docs/sql-manual/sql-functions/scalar-functions/bitwise-functions/bitshiftright.md:4` — inconsistency — high
- `language: "zh-CN"` but English content.

### #246 — xor.md: wrong language frontmatter
- `docs/sql-manual/sql-functions/scalar-functions/bitwise-functions/xor.md:4` — inconsistency — high
- `language: "zh-CN"` but English content.

### #247 — conditional-functions: broken relative link (one ../ short)
- `docs/sql-manual/sql-functions/scalar-functions/conditional-functions/coalesce.md:30`, `greatest.md:30` (likely `least.md` too) — broken link — medium
- `../../../basic-element/...` resolves wrong; needs `../../../../`. Verify build behavior.

## Batch 17 — conditional + date-time functions (50 files) — 14 findings

### #248 — not-null-or-empty.md: stray semicolons in example
- `docs/sql-manual/sql-functions/scalar-functions/conditional-functions/not-null-or-empty.md:28` — code example error — high
- `not_null_or_empty("");, ...` embedded `;` makes SQL invalid.

### #249 — null-or-empty.md: inverted description
- `docs/sql-manual/sql-functions/scalar-functions/conditional-functions/null-or-empty.md:11` — inconsistency — high
- Description says returns true when NOT null/empty (copy-paste from not_null_or_empty).

### #250 — null-or-empty.md: stray semicolons in example
- `docs/sql-manual/sql-functions/scalar-functions/conditional-functions/null-or-empty.md:28` — code example error — high
- Same embedded `;` bug.

### #251 — conditional overview.md: misaligned result table
- `docs/sql-manual/sql-functions/scalar-functions/conditional-functions/overview.md:55-59` — markdown — medium
- Short-circuit example result table borders/data misaligned.

### #252 — convert-tz.md: DATEV2 leaks into example header
- `docs/sql-manual/sql-functions/scalar-functions/date-time-functions/convert-tz.md:65` — inconsistency — medium
- Header shows `CAST(... AS DATEV2)`; query uses `AS DATE`.

### #253 — date-ceil.md: 5-year example copy-pasted from 5-month
- `docs/sql-manual/sql-functions/scalar-functions/date-time-functions/date-ceil.md:118-125` — code example error — high
- Header `month_ceil(...)` + result `2023-12-01` copied; year ceiling should be a Jan-1 boundary.

### #254 — date-ceil.md: QUARTER in type list vs date-floor.md
- `docs/sql-manual/sql-functions/scalar-functions/date-time-functions/date-ceil.md:36` — inconsistency — low
- date-ceil lists QUARTER, date-floor doesn't; verify which is right.

### #255 — date-ceil.md: example headers expose rewritten fn names
- `docs/sql-manual/sql-functions/scalar-functions/date-time-functions/date-ceil.md:77,103,113,123` — inconsistency — low
- Headers like `minute_ceil(...)` don't echo the issued `date_ceil(...)` query.

### #256 — date-sub.md: orphan closing code fence at EOF
- `docs/sql-manual/sql-functions/scalar-functions/date-time-functions/date-sub.md:183` — markdown — high

### #257 — date-trunc.md: parameter name mismatch
- `docs/sql-manual/sql-functions/scalar-functions/date-time-functions/date-trunc.md:24` — inconsistency — low
- Table labels first param `<date_or_time_part>`; syntax uses `<datetime>`.

### #258 — millisecond-timestamp.md: result is microsecond value
- `docs/sql-manual/sql-functions/scalar-functions/date-time-functions/millisecond-timestamp.md:69-74` — code example error — high
- Shows `-315619200000000` (microseconds); millisecond value is `-315619200000`.

### #259 — maketime.md: result table has unselected id column
- `docs/sql-manual/sql-functions/scalar-functions/date-time-functions/maketime.md:39` — code example error — medium
- Query selects 4 cols; result table shows 5 (extra `id`).

### #260 — microsecond-timestamp.md: misaligned result table
- `docs/sql-manual/sql-functions/scalar-functions/date-time-functions/microsecond-timestamp.md:71` — markdown — low

### #261 — from-iso8601-date.md: typo'd format notation in comments
- `docs/sql-manual/sql-functions/scalar-functions/date-time-functions/from-iso8601-date.md:68,84` — typo — low
- `YYY-MMM` in comments vs documented `YYYY-Www`.
- (Note: add-time.md:23 has inconsistent relative link depth — low-confidence broken link.)

## Batch 18 — date-time functions cont. (50 files) — 19 findings

### #262 — minute-ceil.md: Chinese link label
- `docs/sql-manual/sql-functions/scalar-functions/date-time-functions/minute-ceil.md:37` — typo — high
- Link label `timestamptz的转换` in English doc.

### #263 — minute-floor.md: Chinese link label
- `docs/sql-manual/sql-functions/scalar-functions/date-time-functions/minute-floor.md:36` — typo — high
- Same `timestamptz的转换`.

### #264 — minute-floor.md: inconsistent result precision
- `docs/sql-manual/sql-functions/scalar-functions/date-time-functions/minute-floor.md:69-71` — code example error — medium
- Result `.000` vs siblings' `.000000`.

### #265 — minute-floor.md: mixed-case MINUTE_floor
- `docs/sql-manual/sql-functions/scalar-functions/date-time-functions/minute-floor.md:131` — inconsistency — low

### #266 — minutes-sub.md: error message says minutes_add
- `docs/sql-manual/sql-functions/scalar-functions/date-time-functions/minutes-sub.md:95` — inconsistency — medium

### #267 — month-floor.md: example calls MINUTE_FLOOR
- `docs/sql-manual/sql-functions/scalar-functions/date-time-functions/month-floor.md:139` — code example error — high
- "Period non-positive" example calls `MINUTE_FLOOR`; should be `MONTH_FLOOR`.

### #268 — months-sub.md: error message says months_add
- `docs/sql-manual/sql-functions/scalar-functions/date-time-functions/months-sub.md:98,101` — inconsistency — medium

### #269 — period-diff.md: description wrongly says "absolute"
- `docs/sql-manual/sql-functions/scalar-functions/date-time-functions/period-diff.md:11` — inconsistency — high
- Returns signed difference; examples show negative results.

### #270 — period-add.md: 2nd arg missing angle brackets
- `docs/sql-manual/sql-functions/scalar-functions/date-time-functions/period-add.md:23` — typo — low
- `PERIOD_ADD(<period>, month)` should be `<month>`.

### #271 — previous-day.md: missing description + type contradiction
- `docs/sql-manual/sql-functions/scalar-functions/date-time-functions/previous-day.md:1-6` — inconsistency — medium
- No `description` frontmatter; description says TIMESTAMPTZ supported, params table says DATE/DATETIME.

### #272 — quarters-add.md: error message says month_add
- `docs/sql-manual/sql-functions/scalar-functions/date-time-functions/quarters-add.md:107,110` — inconsistency — medium

### #273 — sec-to-time.md: wrong valid range value
- `docs/sql-manual/sql-functions/scalar-functions/date-time-functions/sec-to-time.md:30,85` — inconsistency — medium
- Says `3023999`; 838:59:59 = 3020399 seconds.

### #274 — second-ceil/floor.md: param name mismatch in Return Value
- `docs/sql-manual/sql-functions/scalar-functions/date-time-functions/second-ceil.md:43`, `second-floor.md:42` — typo — low
- `<date_or_time_expr>` vs param `<datetime>`.

### #275 — second-ceil/floor.md: Chinese link label
- `docs/sql-manual/sql-functions/scalar-functions/date-time-functions/second-ceil.md:34`, `second-floor.md:33` — typo — high
- `timestamptz的转换`.

### #276 — sub-time.md: malformed relative link path
- `docs/sql-manual/sql-functions/scalar-functions/date-time-functions/sub-time.md:23` — broken link — medium
- `../../../../../docs/sql-manual/...` malformed.

### #277 — time-format.md: orphan code fence
- `docs/sql-manual/sql-functions/scalar-functions/date-time-functions/time-format.md:128-129` — markdown — high

### #278 — timestampadd.md: wrong example comment
- `docs/sql-manual/sql-functions/scalar-functions/date-time-functions/timestampadd.md:96-98` — inconsistency — high
- Comment "Unit not supported" but error is out-of-range.

### #279 — timestampdiff.md: references MySQL date_diff instead of timestampdiff
- `docs/sql-manual/sql-functions/scalar-functions/date-time-functions/timestampdiff.md:14` — inconsistency — medium

### #280 — to-days / unix-timestamp / utc-time: misaligned result tables
- `docs/sql-manual/sql-functions/scalar-functions/date-time-functions/to-days.md:42-54`, `unix-timestamp.md:56-61`, `utc-time.md:40` — markdown — medium
- ASCII result-table borders misaligned; utc-time top border missing leading `+`.

## Batch 19 — date-time + encrypt-digest + hll + ip functions (50 files) — 24 findings

### #281 — week-floor.md: typo "RROR 1105"
- `docs/sql-manual/sql-functions/scalar-functions/date-time-functions/week-floor.md:120` — typo — high
- Error message missing leading `E`.

### #282 — week.md: mode table trapped in code fence
- `docs/sql-manual/sql-functions/scalar-functions/date-time-functions/week.md:16-26` — markdown — high
- Mode table wrapped in ```sql fence, renders as raw code (yearweek.md is correct).

### #283 — week/weekday/weekofyear.md: param name mismatch
- `docs/sql-manual/sql-functions/scalar-functions/date-time-functions/week.md:40`, `weekday.md:35`, `weekofyear.md:25` — inconsistency — medium
- Param table uses `<datetime_or_date>`; syntax uses `<date_or_time_expr>`.

### #284 — weekofyear.md: "next Sunday" should be "next Monday"
- `docs/sql-manual/sql-functions/scalar-functions/date-time-functions/weekofyear.md:31` — inconsistency — medium
- Function uses Monday-start weeks.

### #285 — year-ceil.md / year-floor.md: <period> described as seconds
- `docs/sql-manual/sql-functions/scalar-functions/date-time-functions/year-ceil.md:36`, `year-floor.md:35` — inconsistency — high
- Period unit described as "seconds"/"1 second"; should be years (copy-paste).

### #286 — weeks-sub / years-sub: error message names wrong operation
- `docs/sql-manual/sql-functions/scalar-functions/date-time-functions/weeks-sub.md:89`, `years-sub.md:93,97`, `quarters-add.md` (cf #272) — inconsistency — medium
- Error says `weeks_add`/`year_add`; verify against engine.

### #287 — multiple result tables misaligned (date-time)
- `week-floor.md:70-75`, `weeks-diff.md:107-110`, `year-ceil.md:97-102`, `year-floor.md:70-75` — markdown — high/medium
- ASCII result-table borders narrower than content.

### #288 — aes-encrypt.md: "bits" should be "bytes"
- `docs/sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/aes-encrypt.md:15` — typo — medium
- Key-padding text says "bits"; should be "bytes".

### #289 — aes-decrypt/encrypt.md: frontmatter missing underscores
- `docs/sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/aes-decrypt.md:5`, `aes-encrypt.md:5` — typo — low
- `AESDECRYPT`/`AES128ECB` in description.

### #290 — murmur-hash3-32.md: full-width period + bad bullet
- `docs/sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/murmur-hash3-32.md:13` — markdown — high
- `。` instead of `.`; `-Note:` missing space.

### #291 — murmur-hash3-64-v2.md: typo "singed"
- `docs/sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/murmur-hash3-64-v2.md:9` — typo — high
- "singed" -> "signed".

### #292 — murmur-hash3-u64-v2.md: "unsigned" should be "signed"
- `docs/sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/murmur-hash3-u64-v2.md:11` — inconsistency — high
- Says "unsigned version refer to murmur_hash3_64_v2"; that's the signed one.

### #293 — xxhash-32.md / xxhash-64.md: self-referential recommendation
- `docs/sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/xxhash-32.md:13`, `xxhash-64.md:13` — inconsistency — high
- Note recommends using xxhash instead of xxhash (copy-paste from murmur docs).

### #294 — encrypt-digest: `-Note:` bullets missing space
- `murmur-hash3-32.md:13`, `murmur-hash3-64.md:15`, `xxhash-32.md:13`, `xxhash-64.md:13` — markdown — medium

### #295 — crc32.md: h3 headings should be h2
- `docs/sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/crc32.md:9,13` — markdown — medium
- `### Description`/`### Syntax` vs h2 elsewhere.

### #296 — ipv4-string-to-num.md: doubled "the the" + garbled sentence  [DONE — PR #3674, = #7]
- `docs/sql-manual/sql-functions/scalar-functions/ip-functions/ipv4-string-to-num.md:12,26,36` — typo — high
- (= original finding #7) garbled return-value sentence.

### #297 — ipv4-string-to-num-or-default.md: doubled "the" + garbled  [DONE — PR #3674, = #7]
- `docs/sql-manual/sql-functions/scalar-functions/ip-functions/ipv4-string-to-num-or-default.md:12,26,36` — typo — high
- (= original finding #7).

### #298 — ipv6-cidr-to-range.md: /48 max address missing ffff group
- `docs/sql-manual/sql-functions/scalar-functions/ip-functions/ipv6-cidr-to-range.md:55` — code example error — medium
- /48 max shows 4 ffff groups; should be 5 (`2001:db8:1:ffff:ffff:ffff:ffff:ffff`).

### #299 — ipv4-cidr-to-range / ipv6-cidr-to-range: misaligned JSON result tables
- `ipv4-cidr-to-range.md:42-56`, `ipv6-cidr-to-range.md:41-57` — markdown — high

### #300 — ipv6-num-to-string.md: incomplete example IPv4 fragment
- `docs/sql-manual/sql-functions/scalar-functions/ip-functions/ipv6-num-to-string.md:14` — typo — medium
- `::ffff:111.222.33` only 3 octets.

### #301 — ipv6-string-to-num.md: redundant NULL bullets
- `docs/sql-manual/sql-functions/scalar-functions/ip-functions/ipv6-string-to-num.md:27-28` — inconsistency — medium

### #302 — ipv6-string-to-num*: frontmatter "IPv6NumToString" no underscores
- `ipv6-string-to-num.md:5`, `ipv6-string-to-num-or-default.md:5`, `ipv6-string-to-num-or-null.md:5` — typo — low

### #303 — murmur-hash3-32 / u64-v2: misaligned result tables
- `murmur-hash3-32.md:43`, `murmur-hash3-u64-v2.md:41-44` — markdown — medium

### #304 — ip-functions: redundant lowercase `## func_name` headings
- `cut-ipv6.md:9` + 8 other ip-function files — markdown — low
- Redundant lowercase heading above `## Description`.

## Batch 20 — ip + json + map functions (50 files) — 11 findings

### #305 — is-ipv4-compat.md: usage note says "IPv4-Mapped"
- `docs/sql-manual/sql-functions/scalar-functions/ip-functions/is-ipv4-compat.md:31` — inconsistency — high
- Note references "IPv4-Mapped" definition; doc is about IPv4-Compatible (copy-paste).

### #306 — json-array.md: duplicated parameter/return sections
- `docs/sql-manual/sql-functions/scalar-functions/json-functions/json-array.md:16-27` — inconsistency — high
- `## Arguments`/`## Returns` then duplicate `## Parameters`/`## Return Value`.

### #307 — json-array.md: misaligned result table
- `docs/sql-manual/sql-functions/scalar-functions/json-functions/json-array.md:91` — markdown — medium

### #308 — json-array-ignore-null.md: typo "ingored"
- `docs/sql-manual/sql-functions/scalar-functions/json-functions/json-array-ignore-null.md:27` — typo — high
- "ingored" -> "ignored".

### #309 — json-extract.md: query path vs header mismatch
- `docs/sql-manual/sql-functions/scalar-functions/json-functions/json-extract.md:91-96` — code example error — high
- Query uses `'$[2]'`; result header shows `'$.[2]'`.

### #310 — json-parse.md: error_to_null example has extra argument
- `docs/sql-manual/sql-functions/scalar-functions/json-functions/json-parse.md:53-62` — code example error — high
- `json_parse_error_to_null(...,'{}')` — function takes 1 arg; header shows 1.

### #311 — json-parse.md: JSONB_ alias prefix inconsistency
- `docs/sql-manual/sql-functions/scalar-functions/json-functions/json-parse.md:39` — inconsistency — medium
- Usage note uses `JSONB_PARSE...`; rest of doc uses `JSON_PARSE...`.

### #312 — json-type.md: result headers show jsonb_type
- `docs/sql-manual/sql-functions/scalar-functions/json-functions/json-type.md:50-53,62-65` — inconsistency — medium
- Query `JSON_TYPE(...)`; headers show `jsonb_type(cast(... as JSON), ...)`.

### #313 — strip-null-value.md: CREATE TABLE column missing type
- `docs/sql-manual/sql-functions/scalar-functions/json-functions/strip-null-value.md:30` — code example error — high
- `create table my_test(id, v json)` — `id` has no type.

### #314 — strip-null-value.md: "1 row in set" but 5 rows shown
- `docs/sql-manual/sql-functions/scalar-functions/json-functions/strip-null-value.md:49` — code example error — medium

### #315 — deduplicate-map.md: malformed heading "Syntaxntax"
- `docs/sql-manual/sql-functions/scalar-functions/map-functions/deduplicate-map.md:16` — typo — high
- `## Syntaxntax` -> `## Syntax`.
- (Note: map-contains-key.md:39 sentence ends abruptly "...different from" — low confidence.)

## Batch 21 — map + numeric functions (50 files) — 8 findings

### #316 — gcd.md: query/header sign mismatch
- `docs/sql-manual/sql-functions/scalar-functions/numeric-functions/gcd.md:66-75` — code example error — high
- Query `gcd(-17, 31)`; result header `gcd(17,31)`.

### #317 — ln.md: special-case text contradicts example
- `docs/sql-manual/sql-functions/scalar-functions/numeric-functions/ln.md:35` — inconsistency — high
- Says +inf returns NULL; example `ln(inf)` returns Infinity.

### #318 — random.md: <b> must be "less than" lower bound
- `docs/sql-manual/sql-functions/scalar-functions/numeric-functions/random.md:35` — inconsistency — high
- Upper bound described as "less than the lower bound"; should be "greater than".

### #319 — log10.md: "natural logarithm ... base 10"
- `docs/sql-manual/sql-functions/scalar-functions/numeric-functions/log10.md:1,5,11` — inconsistency — medium
- Base-10 log called "natural logarithm"; drop "natural".

### #320 — log2.md: "natural logarithm ... base 2"
- `docs/sql-manual/sql-functions/scalar-functions/numeric-functions/log2.md:1,5,11` — inconsistency — medium
- Same as #319.

### #321 — log.md: syntax/param order contradicts 1-arg behavior
- `docs/sql-manual/sql-functions/scalar-functions/numeric-functions/log.md:16,21-24,37` — inconsistency — medium
- Syntax `LOG(<b>[,<x>])` but `log(3)` returns ln(3) (single arg = x).

### #322 — asinh.md: result blocks fenced as ```sql
- `docs/sql-manual/sql-functions/scalar-functions/numeric-functions/asinh.md:44-110` — markdown — high
- Six output blocks use ```sql; should be ```text.

### #323 — numeric: misaligned result tables
- `even.md:61-90`, `lcm.md:82-87`, `atan2.md:116-201` — markdown — low

## Batch 22 — numeric + other + quantile + spatial functions (50 files) — 18 findings

### #324 — signbit.md: inconsistent boolean output representation
- `docs/sql-manual/sql-functions/scalar-functions/numeric-functions/signbit.md:91-96` — code example error — high
- First examples show `true`/`false`; last shows `0`/`1`.

### #325 — spatial docs: misspelled headings "Sytax" / "Retuen Value"
- ~18 `st-*.md` files (st-angle-sphere, st-angle, st-area-square-km, st-asbinary, st-astext, st-azimuth, st-circle, st-contains, st-disjoint, st-distance-sphere, st-intersects, st-linefromtext, st-point, st-polygon, st-touches, st-x, st-y, ...) — typo — high
- `## Sytax` -> `## Syntax`; `## Retuen Value` -> `## Return Value`.

### #326 — st-angle-sphere.md: Chinese heading `## 参数`
- `docs/sql-manual/sql-functions/scalar-functions/spatial-functions/st-angle-sphere.md:21` — inconsistency — high

### #327 — st-astext.md: H1 `# Parameters` instead of H2
- `docs/sql-manual/sql-functions/scalar-functions/spatial-functions/st-astext.md:25` — markdown — high

### #328 — st-area-square-km.md: capital K in result headers
- `docs/sql-manual/sql-functions/scalar-functions/spatial-functions/st-area-square-km.md:147-156,166` — inconsistency — medium
- `st_area_square_Km(...)` should be lowercase.

### #329 — st-circle.md: wrong latitude range [-180,180]
- `docs/sql-manual/sql-functions/scalar-functions/spatial-functions/st-circle.md:23` — inconsistency — high
- `<center_lat>` range should be `[-90,90]`.

### #330 — st-distance-sphere.md: shuffled parameter descriptions
- `docs/sql-manual/sql-functions/scalar-functions/spatial-functions/st-distance-sphere.md:23-26` — inconsistency — high
- Param names/descriptions mismatched (y_lng described as "Latitude of X", etc.).

### #331 — st-angle-sphere.md: parameter rows out of order
- `docs/sql-manual/sql-functions/scalar-functions/spatial-functions/st-angle-sphere.md:25-28` — inconsistency — medium

### #332 — st-distance.md: result header doesn't match query
- `docs/sql-manual/sql-functions/scalar-functions/spatial-functions/st-distance.md:45-50` — code example error — high
- Query uses `ST_GeometryFromText`; header shows `ST_Point`.

### #333 — st-distance-sphere.md: wrong example label
- `docs/sql-manual/sql-functions/scalar-functions/spatial-functions/st-distance-sphere.md:39` — inconsistency — high
- Labeled "Two identical points (returns 0)"; query uses different points, result 7336m.

### #334 — st-linefromtext.md: binary garbage in example output
- `docs/sql-manual/sql-functions/scalar-functions/spatial-functions/st-linefromtext.md:74-84` — code example error — high
- Result dumps raw binary geometry; needs `ST_AsText` wrapping; label also wrong.

### #335 — st-linefromtext.md: WKT keyword "LINE" should be "LINESTRING"
- `docs/sql-manual/sql-functions/scalar-functions/spatial-functions/st-linefromtext.md:27-29` — inconsistency — medium

### #336 — st-touches/contains/intersects/point/asbinary: full-width punctuation
- `st-touches.md:42`, `st-contains.md:26`, `st-intersects.md:27-28`, `st-point.md:24`, `st-asbinary.md:43` — typo — high
- Full-width `。`/`）` characters.

### #337 — st-area-square-km.md: type list typo + mismatch
- `docs/sql-manual/sql-functions/scalar-functions/spatial-functions/st-area-square-km.md:11,24` — inconsistency — medium
- "GeoMuitiPolygon" typo; `GeoMultiCircle` vs `GeoMultiPolygon` mismatch.

### #338 — st-disjoint.md: result block missing closing table border
- `docs/sql-manual/sql-functions/scalar-functions/spatial-functions/st-disjoint.md:74-79` — markdown — high

### #339 — xor.md: inconsistent title format + unsplit code block
- `docs/sql-manual/sql-functions/scalar-functions/numeric-functions/xor.md:3,22-29` — markdown — medium
- Title `"XOR | Numeric Functions"` vs siblings; SQL+result in one ```sql fence.

### #340 — truncate.md: typo "litera"
- `docs/sql-manual/sql-functions/scalar-functions/numeric-functions/truncate.md:40` — typo — high
- "litera" -> "literal".

### #341 — to-quantile-state.md: missing comma in syntax
- `docs/sql-manual/sql-functions/scalar-functions/quantile-functions/to-quantile-state.md:16` — code example error — high
- `TO_QUANTILE_STATE(<raw_data> <compression>)` missing comma.

## Batch 23 — string functions (50 files) — 14 findings

### #342 — ascii.md: truncated description frontmatter
- `docs/sql-manual/sql-functions/scalar-functions/string-functions/ascii.md:5` — inconsistency — medium
- `description` cut off mid-sentence.

### #343 — count_substrings.md: duplicate list number 7
- `docs/sql-manual/sql-functions/scalar-functions/string-functions/count_substrings.md:124` — markdown — high
- Two example items numbered `7.`.

### #344 — char.md: query missing USING clause vs header
- `docs/sql-manual/sql-functions/scalar-functions/string-functions/char.md:43-73` — code example error — medium
- Queries `CHAR(68,...)`; headers show `char('utf8', 68,...)`.

### #345 — is-uuid.md: header missing curly braces
- `docs/sql-manual/sql-functions/scalar-functions/string-functions/is-uuid.md:55-64` — code example error — high
- Query has `{...}`; header omits braces.

### #346 — mask-last-n.md: query/header/output mismatch
- `docs/sql-manual/sql-functions/scalar-functions/string-functions/mask-last-n.md:147-154` — code example error — high
- Query `mask_last_n('Helloṭṛ123',9)`; header+output use `Hello你好123`.

### #347 — parse-url.md: Chinese section in English doc
- `docs/sql-manual/sql-functions/scalar-functions/string-functions/parse-url.md:59-61` — inconsistency — high
- `## 相关命令` + Chinese body.

### #348 — protocol.md: Chinese heading + full-width period
- `docs/sql-manual/sql-functions/scalar-functions/string-functions/protocol.md:57-59` — inconsistency — medium

### #349 — position.md: duplicated doc sections
- `docs/sql-manual/sql-functions/scalar-functions/string-functions/position.md:167-208` — markdown — high
- Second copy of Description/Syntax/Parameters appended.

### #350 — quote.md: contradictory escape note
- `docs/sql-manual/sql-functions/scalar-functions/string-functions/quote.md:33` — inconsistency — medium
- Says both `\` -> `\\` and `\\` -> `\`.

### #351 — quote.md: example output not escaped
- `docs/sql-manual/sql-functions/scalar-functions/string-functions/quote.md:51-59` — code example error — medium
- `quote("It's a test")` output shows unescaped `'`.

### #352 — parse-data-size.md: unit list vs table mismatch
- `docs/sql-manual/sql-functions/scalar-functions/string-functions/parse-data-size.md:30,38-46` — inconsistency — medium
- Prose lists ZB/YB; table stops at EB.

### #353 — hamming_distance / levenshtein.md: old frontmatter, no language
- `docs/sql-manual/sql-functions/scalar-functions/string-functions/hamming_distance.md:1-3`, `levenshtein.md:1-3` — inconsistency — medium

### #354 — string functions: misaligned result tables
- `ascii.md`, `concat-ws.md`, `concat.md`, `find-in-set.md`, `format.md`, `format-number.md`, `make-set.md` — markdown — low

### #355 — string functions: truncated description frontmatter (multiple)
- `auto-partition-name.md:5`, `char-length.md:5`, `cut-to-first-significant-subdomain.md:5`, `format-number.md:5`, `length.md:5`, `ngram-search.md:5`, `parse-data-size.md:5` — inconsistency — low

## Batch 24 — string + struct + system functions (50 files) — 17 findings

### #356 — repeat.md: duplicated doc body
- `docs/sql-manual/sql-functions/scalar-functions/string-functions/repeat.md:164-211` — inconsistency — high
- Second full Description/Syntax/Parameters/Examples block.

### #357 — reverse.md: duplicated doc body
- `docs/sql-manual/sql-functions/scalar-functions/string-functions/reverse.md:159-205` — inconsistency — high

### #358 — regexp-count.md: quadruple backslash escaping
- `docs/sql-manual/sql-functions/scalar-functions/string-functions/regexp-count.md:60,65` — code example error — medium

### #359 — regexp-count.md: typo "is n the total count"
- `docs/sql-manual/sql-functions/scalar-functions/string-functions/regexp-count.md:27` — typo — high

### #360 — regexp-count.md: typo "paratemer" / "usr"
- `docs/sql-manual/sql-functions/scalar-functions/string-functions/regexp-count.md:29,31` — typo — high

### #361 — regexp-extract-or-null.md: query pattern vs error message mismatch
- `docs/sql-manual/sql-functions/scalar-functions/string-functions/regexp-extract-or-null.md:259-260` — code example error — high

### #362 — regexp.md: example uses REGEXP_EXTRACT instead of REGEXP
- `docs/sql-manual/sql-functions/scalar-functions/string-functions/regexp.md:294` — inconsistency — high

### #363 — regexp.md: orphan `~` artifact
- `docs/sql-manual/sql-functions/scalar-functions/string-functions/regexp.md:10` — markdown — medium
- Stray `~` line + leading `~` in description.

### #364 — soundex.md: example numbering skips 8
- `docs/sql-manual/sql-functions/scalar-functions/string-functions/soundex.md:131` — markdown — medium

### #365 — database.md: result header shows database() twice
- `docs/sql-manual/sql-functions/scalar-functions/system-functions/database.md:39-43` — code example error — high
- `select database(),schema()` shows both headers as `database()`.

### #366 — url-decode/url-encode.md: result blocks fenced ```sql
- `docs/sql-manual/sql-functions/scalar-functions/string-functions/url-decode.md:33-39`, `url-encode.md:37-43` — markdown — medium
- Also url-encode.md:20-21 duplicate `## Required Parameters` heading.

### #367 — struct funcs: language "en-US" vs "en"
- `named-struct.md:4`, `struct-element.md:4`, `struct.md:4` — inconsistency — medium

### #368 — regexp-extract-all.md: truncated description
- `docs/sql-manual/sql-functions/scalar-functions/string-functions/regexp-extract-all.md:5` — inconsistency — medium

### #369 — string funcs: description frontmatter missing underscores / truncated
- `regexp-extract-or-null.md:5`, `regexp-replace-one.md:5`, `replace-empty.md:5`, `split-by-regexp.md:5` + others — inconsistency — low
- Function names without underscores (REGEXPEXTRACTALL etc.).

### #370 — unhex.md: inconsistent example numbering
- `docs/sql-manual/sql-functions/scalar-functions/string-functions/unhex.md:50-132` — markdown — low

### #371 — regexp-count.md: misaligned result tables
- `docs/sql-manual/sql-functions/scalar-functions/string-functions/regexp-count.md:106-235` — markdown — low

### #372 — string funcs: misaligned result tables (strleft/strright/rpad/to-base64/regexp-extract)
- multiple files — markdown — low

## Batch 25 — table-functions + table-valued-functions + window (50 files) — 14 findings

### #373 — explode-bitmap.md: description copy-pasted from -outer
- `docs/sql-manual/sql-functions/table-functions/explode-bitmap.md:12` — inconsistency — high

### #374 — explode-outer.md: hyphenated title
- `docs/sql-manual/sql-functions/table-functions/explode-outer.md:3` — inconsistency — high
- `"EXPLODE-OUTER"` -> `"EXPLODE_OUTER"`.

### #375 — explode-outer.md: syntax/examples use explode instead of explode_outer
- `docs/sql-manual/sql-functions/table-functions/explode-outer.md:14,17,41,56` — inconsistency — high

### #376 — explode-json-array-int-outer.md: refers to explode not explode_outer
- `docs/sql-manual/sql-functions/table-functions/explode-json-array-int-outer.md:10` — inconsistency — medium

### #377 — explode-map.md: examples 1-2 call explode_map_outer
- `docs/sql-manual/sql-functions/table-functions/explode-map.md:38,51` — code example error — high

### #378 — explode-json-array-json.md: "abc" expands to NULL (contradicts -outer)
- `docs/sql-manual/sql-functions/table-functions/explode-json-array-json.md:46` — code example error — medium

### #379 — unnest.md: example 3 ord/tag columns swapped + ordinals start at 0
- `docs/sql-manual/sql-functions/table-functions/unnest.md:111-127` — code example error — high

### #380 — unnest.md: example 7 ordering review
- `docs/sql-manual/sql-functions/table-functions/unnest.md:191-207` — code example error — low

### #381 — unnest.md: language "en-US"
- `docs/sql-manual/sql-functions/table-functions/unnest.md:4` — inconsistency — medium

### #382 — hdfs.md: entire file is a copy of local.md
- `docs/sql-manual/sql-functions/table-valued-functions/hdfs.md` — inconsistency — high
- Title/heading/syntax/content all describe LOCAL, not HDFS.

### #383 — frontends.md: Return Value table missing CurrentConnected field
- `docs/sql-manual/sql-functions/table-valued-functions/frontends.md:25-44` — inconsistency — medium

### #384 — numbers.md: syntax uses placeholder for const_value key
- `docs/sql-manual/sql-functions/table-valued-functions/numbers.md:17` — code example error — high
- `[, "<const_value>" = "<const_value>"]` — key should be literal `const_value`.

### #385 — local.md: stray table fragment + orphan fence
- `docs/sql-manual/sql-functions/table-valued-functions/local.md:108` — markdown — high

### #386 — query.md: result block fence missing text hint
- `docs/sql-manual/sql-functions/table-valued-functions/query.md:83` — markdown — low

## Batch 26 — window-functions + account/catalog/charset/cluster statements (50 files) — 14 findings

### #387 — CREATE-WORKLOAD-POLICY.md: entire file documents CREATE WORKLOAD GROUP
- `docs/sql-manual/sql-statements/cluster-management/compute-management/CREATE-WORKLOAD-POLICY.md` — inconsistency — high
- Title/H1/syntax/keywords all CREATE WORKLOAD GROUP.

### #388 — ALTER-WORKLOAD-POLICY.md: description says "Workload Group"
- `docs/sql-manual/sql-statements/cluster-management/compute-management/ALTER-WORKLOAD-POLICY.md:5,11` — inconsistency — high

### #389 — REVOKE-FROM.md: access-control note says "GRANT operation"
- `docs/sql-manual/sql-statements/account-management/REVOKE-FROM.md:107` — inconsistency — high

### #390 — ALTER-USER.md: garbled "give over supports"
- `docs/sql-manual/sql-statements/account-management/ALTER-USER.md:80` — typo — high

### #391 — ALTER-USER / CREATE-USER.md: full-width pipe `｜`
- `docs/sql-manual/sql-statements/account-management/ALTER-USER.md:24`, `CREATE-USER.md:25` — markdown — high

### #392 — ALTER/CREATE-WORKLOAD-GROUP.md: full-width comma
- `docs/sql-manual/sql-statements/cluster-management/compute-management/ALTER-WORKLOAD-GROUP.md:27`, `CREATE-WORKLOAD-GROUP.md:30` — markdown — high

### #393 — CREATE-RESOURCE.md: parameter header labeled <type> but describes <property>
- `docs/sql-manual/sql-statements/cluster-management/compute-management/CREATE-RESOURCE.md:26` — inconsistency — medium

### #394 — ADD-BROKER.md: malformed quoting in syntax
- `docs/sql-manual/sql-statements/cluster-management/instance-management/ADD-BROKER.md:16` — code example error — medium
- `"host>:<ipc_port>"` missing opening `<`.

### #395 — ADD-BROKER.md: example omits broker_name
- `docs/sql-manual/sql-statements/cluster-management/instance-management/ADD-BROKER.md:42` — code example error — medium

### #396 — ADD-BACKEND.md: duplicate list number 3
- `docs/sql-manual/sql-statements/cluster-management/instance-management/ADD-BACKEND.md:51-52` — markdown — low

### #397 — SHOW-COMPUTE-GROUPS.md: example intro doesn't match query
- `docs/sql-manual/sql-statements/cluster-management/compute-management/SHOW-COMPUTE-GROUPS.md:30` — inconsistency — medium

### #398 — DROP-USER.md: placeholder quoted inconsistently
- `docs/sql-manual/sql-statements/account-management/DROP-USER.md:16` — inconsistency — low

### #399 — ALTER-WORKLOAD-POLICY.md: code fence tagged Java
- `docs/sql-manual/sql-statements/cluster-management/compute-management/ALTER-WORKLOAD-POLICY.md:41` — markdown — low

### #400 — SHOW-COMPUTE-GROUPS.md: misaligned result table
- `docs/sql-manual/sql-statements/cluster-management/compute-management/SHOW-COMPUTE-GROUPS.md:39-43` — markdown — low

## Batch 27 — cluster/storage management + data-governance + backup-restore + DML (50 files) — 14 findings

### #401 — MODIFY-BACKEND.md: Chinese table header
- `docs/sql-manual/sql-statements/cluster-management/instance-management/MODIFY-BACKEND.md:13-14` — inconsistency — high
- Table header `属性`/`影响`.

### #402 — MODIFY-FRONTEND-HOSTNAME.md: typo "NOD_PRIV"
- `docs/sql-manual/sql-statements/cluster-management/instance-management/MODIFY-FRONTEND-HOSTNAME.md:32` — typo — high
- `NOD_PRIV` -> `NODE_PRIV`.

### #403 — ADD/DROP-FOLLOWER/OBSERVER.md: missing spaces around link
- `ADD-FOLLOWER.md:41`, `ADD-OBSERVER.md:40`, `DROP-FOLLOWER.md:41`, `DROP-OBSERVER.md:39` — markdown — medium
- `use[link]command` no spaces; DROP-FOLLOWER also drops verb.

### #404 — DROP-BROKER.md: example ends with period
- `docs/sql-manual/sql-statements/cluster-management/instance-management/DROP-BROKER.md:46` — typo — high
- `... broker_name.` should end with `;`.

### #405 — ALTER-STORAGE-POLICY.md: typo "PROPERTIE"
- `docs/sql-manual/sql-statements/cluster-management/storage-management/ALTER-STORAGE-POLICY.md:15,25` — typo — high
- `PROPERTIE` -> `PROPERTIES`.

### #406 — ALTER-STORAGE-VAULT.md: "prohibited" should be "allowed"
- `docs/sql-manual/sql-statements/cluster-management/storage-management/ALTER-STORAGE-VAULT.md:33` — inconsistency — medium

### #407 — CREATE-STORAGE-POLICY.md: full-width punctuation in syntax
- `docs/sql-manual/sql-statements/cluster-management/storage-management/CREATE-STORAGE-POLICY.md:19-20` — markdown — high
- Full-width `，` and `｜`.

### #408 — CANCEL-WARM-UP.md: syntax has JOB, example omits it
- `docs/sql-manual/sql-statements/cluster-management/storage-management/CANCEL-WARM-UP.md:16,47` — inconsistency — high

### #409 — SHOW-CACHE-HOTSPOT.md: unclosed :::info admonition
- `docs/sql-manual/sql-statements/cluster-management/storage-management/SHOW-CACHE-HOTSPOT.md:14-20` — markdown — high

### #410 — WARM-UP.md: FORCE mandatory in syntax, omitted in example
- `docs/sql-manual/sql-statements/cluster-management/storage-management/WARM-UP.md:18,49` — inconsistency — medium

### #411 — CREATE-ROW-POLICY.md: duplicate policy name test_row_policy_3
- `docs/sql-manual/sql-statements/data-governance/CREATE-ROW-POLICY.md:67-70` — code example error — high

### #412 — CREATE-ROW-POLICY.md: description is leftover Explain fragment
- `docs/sql-manual/sql-statements/data-governance/CREATE-ROW-POLICY.md:5,11` — inconsistency — high
- "Explain can view the rewritten execution plan."

### #413 — CREATE-SQL_BLOCK_RULE.md: error message rule name mismatch
- `docs/sql-manual/sql-statements/data-governance/CREATE-SQL_BLOCK_RULE.md:84` — code example error — medium
- Creates `test_rule`; error references `order_analysis_rule`.

### #414 — SHOW-SQL_BLOCK_RULE.md: misaligned result tables + stray pipe
- `docs/sql-manual/sql-statements/data-governance/SHOW-SQL_BLOCK_RULE.md:21,39-57` — markdown — low

## Batch 28 — DML + load-export + query + database + function + job + plugin + recycle (50 files) — 18 findings

### #415 — MERGE-INTO.md: stray pilcrow in heading
- `docs/sql-manual/sql-statements/data-modification/DML/MERGE-INTO.md:115` — typo — high
- `### Duplicate join behavior¶` stray `¶`.

### #416 — SHOW-LAST-INSERT.md: typo "LASR" in keywords
- `docs/sql-manual/sql-statements/data-modification/DML/SHOW-LAST-INSERT.md:50` — typo — high
- `SHOW, LASR ,INSERT` -> `SHOW, LAST, INSERT`.

### #417 — SHOW-LAST-INSERT.md: informal lowercase section markers
- `docs/sql-manual/sql-statements/data-modification/DML/SHOW-LAST-INSERT.md:13,19,31,47` — inconsistency — medium
- `grammar:`/`illustrate:` instead of `## Syntax` etc.; empty Example section.

### #418 — CREATE-ROUTINE-LOAD.md: broken anchor
- `docs/sql-manual/sql-statements/data-modification/load-and-export/CREATE-ROUTINE-LOAD.md:13` — broken link — high
- Anchor `#Example-of-importing-Json-format-data`; actual `#import-json-data`.

### #419 — CREATE-ROUTINE-LOAD.md: truncated description
- `docs/sql-manual/sql-statements/data-modification/load-and-export/CREATE-ROUTINE-LOAD.md:5` — inconsistency — high

### #420 — CREATE-ROUTINE-LOAD.md: max_batch_rows default suspect
- `docs/sql-manual/sql-statements/data-modification/load-and-export/CREATE-ROUTINE-LOAD.md:163-164` — inconsistency — medium

### #421 — ALTER/PAUSE/RESUME/STOP/SHOW-CREATE ROUTINE-LOAD: access-control note says "SHOW ROUTINE LOAD"
- `ALTER-ROUTINE-LOAD.md:73`, `PAUSE-ROUTINE-LOAD.md:37`, `RESUME-ROUTINE-LOAD.md:37`, `STOP-ROUTINE-LOAD.md:34`, `SHOW-CREATE-ROUTINE-LOAD.md:39` — inconsistency — high
- Each says "SHOW ROUTINE LOAD requires..." regardless of actual statement.

### #422 — CANCEL-LOAD.md: STATE value list mismatch
- `docs/sql-manual/sql-statements/data-modification/load-and-export/CANCEL-LOAD.md:18,37` — inconsistency — high
- Param list includes FINISHED/CANCELLED; syntax+notes allow only PENDING/ETL/LOADING.

### #423 — CANCEL-LOAD.md: LIKE example without %
- `docs/sql-manual/sql-statements/data-modification/load-and-export/CANCEL-LOAD.md:65-71` — code example error — medium
- `LABEL like "example_"` won't "contain"-match.

### #424 — SHOW-LOAD.md: "LOAD =" should be "STATE ="
- `docs/sql-manual/sql-statements/data-modification/load-and-export/SHOW-LOAD.md:42` — typo — medium

### #425 — EXPLAIN.md: duplicated Operator Descriptions sections
- `docs/sql-manual/sql-statements/data-query/EXPLAIN.md:174-545` — inconsistency — high
- NESTED LOOP JOIN / scan-node sections each appear twice.

### #426 — SELECT.md: typos + invalid ORDER BY + broken numbering
- `docs/sql-manual/sql-statements/data-query/SELECT.md:213,215,230,287` — typo — medium
- "JOIN Exampel", "ome additional knowledge", `ORDER by LIMIT 10`, duplicate list `2.`.

### #427 — SHOW-DATABASES.md: Chinese heading `## 示例`
- `docs/sql-manual/sql-statements/database/SHOW-DATABASES.md:41` — inconsistency — high

### #428 — SHOW-DATABASE-ID.md: h3 Description + title/syntax keyword mismatch
- `docs/sql-manual/sql-statements/database/SHOW-DATABASE-ID.md:9` — markdown — medium

### #429 — DROP-FUNCTION.md: syntax missing FUNCTION keyword
- `docs/sql-manual/sql-statements/function/DROP-FUNCTION.md:16` — code example error — high
- `DROP [GLOBAL] <function_name>(...)` missing `FUNCTION`.

### #430 — CREATE-FUNCTION.md: "TABLES FUNCTION" keyword
- `docs/sql-manual/sql-statements/function/CREATE-FUNCTION.md:18,116` — inconsistency — medium
- Plural `TABLES FUNCTION`; verify against actual keyword.

## Batch 29 — security + session + statistics + async-MV + data-status-management (50 files) — 14 findings

### #431 — CREATE-ENCRYPTKEY.md: malformed AES_DECRYPT result table
- `docs/sql-manual/sql-statements/security/CREATE-ENCRYPTKEY.md:80-84` — markdown — high

### #432 — CREATE-ENCRYPTKEY.md: wrong access-control note (User/Role)
- `docs/sql-manual/sql-statements/security/CREATE-ENCRYPTKEY.md:39-41` — inconsistency — high
- Note copy-pasted from a user/role grant statement.

### #433 — CREATE-FILE.md: duplicated/orphan parameter heading
- `docs/sql-manual/sql-statements/security/CREATE-FILE.md:24-26` — markdown — high

### #434 — DROP-FILE.md: lowercase `## grammar:` heading
- `docs/sql-manual/sql-statements/security/DROP-FILE.md:13` — markdown — medium

### #435 — SHOW-FILE.md: FileId vs Id column name mismatch
- `docs/sql-manual/sql-statements/security/SHOW-FILE.md:54,67` — code example error — medium

### #436 — CLEAN-ALL-PROFILE.md: wrong access-control privilege
- `docs/sql-manual/sql-statements/session/queries/CLEAN-ALL-PROFILE.md:23-25` — inconsistency — medium

### #437 — KILL-QUERY.md: wrong access-control privilege
- `docs/sql-manual/sql-statements/session/queries/KILL-QUERY.md:45-47` — inconsistency — medium

### #438 — PLAN-REPLAYER-DUMP.md: duplicated table header
- `docs/sql-manual/sql-statements/session/queries/PLAN-REPLAYER-DUMP.md:58-63` — code example error — high

### #439 — PLAN-REPLAYER-DUMP.md: orphan code fence
- `docs/sql-manual/sql-statements/session/queries/PLAN-REPLAYER-DUMP.md:79` — markdown — high

### #440 — PLAN-REPLAYER-PLAY.md: full-width semicolons
- `docs/sql-manual/sql-statements/session/queries/PLAN-REPLAYER-PLAY.md:16,32` — typo — high

### #441 — SET-VARIABLE.md: user variable wrongly described as `@@`
- `docs/sql-manual/sql-statements/session/variable/SET-VARIABLE.md:27-28,68` — inconsistency — high
- User variables use single `@`; `@@` is system variables.

### #442 — SHOW-VARIABLES.md: inconsistent privilege token "Any_PRIV"
- `docs/sql-manual/sql-statements/session/variable/SHOW-VARIABLES.md:34` — typo — medium

### #443 — ANALYZE.md: unclosed code fence
- `docs/sql-manual/sql-statements/statistics/ANALYZE.md:72-74` — markdown — high

### #444 — DROP-STATS.md: doubled `## ##` heading
- `docs/sql-manual/sql-statements/statistics/DROP-STATS.md:27` — markdown — high

### #445 — DIAGNOSE-TABLET.md: contradictory mode statements
- `docs/sql-manual/sql-statements/table-and-view/data-and-status-management/DIAGNOSE-TABLET.md:11,14` — inconsistency — high
- Line 14 "not supported in compute-storage coupled mode" contradicts line 11; should be "separation".

## Batch 30 — table-and-view statements (50 files) — 15 findings

### #446 — SHOW-DATA.md: corrupted result table (stray `=`)
- `docs/sql-manual/sql-statements/table-and-view/data-and-status-management/SHOW-DATA.md:156-162` — code example error — high

### #447 — SHOW-REPLICA-DISTRIBUTION.md: Chinese example headers
- `docs/sql-manual/sql-statements/table-and-view/data-and-status-management/SHOW-REPLICA-DISTRIBUTION.md:92,109` — inconsistency — high

### #448 — SHOW-TABLET-STORAGE-FORMAT.md: Return Value mixes two output shapes
- `docs/sql-manual/sql-statements/table-and-view/data-and-status-management/SHOW-TABLET-STORAGE-FORMAT.md:28-34` — inconsistency — high

### #449 — CANCEL-BUILD-INDEX.md: Chinese `其中：`
- `docs/sql-manual/sql-statements/table-and-view/index/CANCEL-BUILD-INDEX.md:20` — inconsistency — high

### #450 — ALTER-TABLE-COLUMN.md: dangling "see example 8"
- `docs/sql-manual/sql-statements/table-and-view/table/ALTER-TABLE-COLUMN.md:183` — inconsistency — medium

### #451 — ALTER-TABLE-COMMENT.md: full-width colon in `grammar：`
- `docs/sql-manual/sql-statements/table-and-view/table/ALTER-TABLE-COMMENT.md:13,21,29` — typo — medium

### #452 — ALTER-TABLE-PROPERTY.md: duplicated + diverging operation lists
- `docs/sql-manual/sql-statements/table-and-view/table/ALTER-TABLE-PROPERTY.md:114-122,226-230` — inconsistency — medium

### #453 — ALTER-TABLE-ROLLUP.md: orphan empty heading + "4. Keywords"
- `docs/sql-manual/sql-statements/table-and-view/table/ALTER-TABLE-ROLLUP.md:108-110` — markdown — high

### #454 — CANCEL-ALTER-TABLE.md: placeholder example 4
- `docs/sql-manual/sql-statements/table-and-view/table/CANCEL-ALTER-TABLE.md:93-97` — inconsistency — medium
- "(To be implemented...)" + unrelated "ALTER CLUSTER".

### #455 — CREATE-TABLE.md: unclosed Plain code fence
- `docs/sql-manual/sql-statements/table-and-view/table/CREATE-TABLE.md:680-703` — markdown — high

### #456 — DESC-TABLE.md: unclosed code fence at EOF
- `docs/sql-manual/sql-statements/table-and-view/table/DESC-TABLE.md:100-101` — markdown — high

### #457 — SHOW-PARTITION.md vs SHOW-PARTITION-ID.md: duplicate statement
- `docs/sql-manual/sql-statements/table-and-view/table/SHOW-PARTITION.md` — inconsistency — medium

### #458 — SHOW-PARTITION.md: result block fenced ```sql
- `docs/sql-manual/sql-statements/table-and-view/table/SHOW-PARTITION.md:39` — markdown — low

### #459 — SHOW-DYNAMIC-PARTITION-TABLES.md: Return Value vs example columns
- `docs/sql-manual/sql-statements/table-and-view/table/SHOW-DYNAMIC-PARTITION-TABLES.md:34-65` — inconsistency — medium

### #460 — SHOW-DYNAMIC-PARTITION-TABLES.md: "1rd to 28rd" + MONTH/DAY typo
- `docs/sql-manual/sql-statements/table-and-view/table/SHOW-DYNAMIC-PARTITION-TABLES.md:36` — typo — low
- Also line 13 full-width colon, line 22 "pecify"; SHOW-TABLE-ID.md:9 h3 Description.

## Batch 31 — transaction + types statements + table-design (51 files) — 17 findings

### #461 — ROLLBACK.md: doubled word + full-width parens in heading
- `docs/sql-manual/sql-statements/transaction/ROLLBACK.md:13` — typo — high
- `## Syntax（Syntax）`.

### #462 — SHOW-TYPECAST.md: wrong language frontmatter
- `docs/sql-manual/sql-statements/types/SHOW-TYPECAST.md:4` — inconsistency — high
- `language: "zh-CN"` but English content.

### #463 — SHOW-TYPECAST.md: truncated description
- `docs/sql-manual/sql-statements/types/SHOW-TYPECAST.md:5` — inconsistency — medium

### #464 — SHOW-VIEW.md: lowercase "grammar:" + empty Best Practice
- `docs/sql-manual/sql-statements/table-and-view/view/SHOW-VIEW.md:13,31` — markdown — medium

### #465 — SHOW-DATA-TYPES.md: example output missing DECIMAL256
- `docs/sql-manual/sql-statements/types/SHOW-DATA-TYPES.md:37-69` — inconsistency — low

### #466 — unique.md: user_name vs username across examples  [DONE — PR #3673, = #6]
- `docs/table-design/data-model/unique.md:69-132` — code example error — high
- (= original finding #6) MoW example uses `user_name`, MoR + query use `username`.
- Fixed in PR #3673: unified to `user_name` across 9 files (EN next+2.0/2.1/3.x/4.x, ZH next+2.1/3.x/4.x).

### #467 — data-type.md: malformed `<ul>` closing tag
- `docs/table-design/data-type.md:24` — markdown — high
- DECIMAL row closes list with `<ul>` instead of `</ul>`.

### #468 — prefix-index.md: duplicate keywords
- `docs/table-design/index/prefix-index.md:6-15` — markdown — low

### #469 — ngram-bloomfilter-index.md: query any() vs header any_value()
- `docs/table-design/index/ngram-bloomfilter-index.md:263,287` — code example error — medium

### #470 — custom-analyzer.md: stray </content></invoke> tags at EOF
- `docs/table-design/index/inverted-index/custom-analyzer.md:506` — markdown — high

### #471 — custom-analyzer.md: param table min_ngram/max_ngram vs examples min_gram/max_gram
- `docs/table-design/index/inverted-index/custom-analyzer.md:94-95` — inconsistency — high

### #472 — custom-analyzer.md: duplicate keyword
- `docs/table-design/index/inverted-index/custom-analyzer.md:7-8` — markdown — low

### #473 — hnsw.md: "1.2x" memory contradicts 1.3 formula
- `docs/table-design/index/vector-index/hnsw.md:421-423` — inconsistency — medium

### #474 — hnsw.md: P99 Latency row identical to Avg Latency row
- `docs/table-design/index/vector-index/hnsw.md:461` — code example error — medium

### #475 — ivf.md: "1.02x" memory contradicts 496 MB figure
- `docs/table-design/index/vector-index/ivf.md:386-398` — inconsistency — medium

### #476 — vector-index/overview.md: FROM l2_distance_approximate (function as table)
- `docs/table-design/index/vector-index/overview.md:480-483` — code example error — high

### #477 — table-design/overview.mdx: 3 broken links
- `docs/table-design/overview.mdx:108,184,244-245` — broken link — high
- `./data-partitioning/data-distribution`, `../ai/vector-search/hnsw`, `./best-practice` — none exist.

---

# AUDIT COMPLETE

All 1548 files in `docs/` audited across 31 batches (2026-05-18).
Total findings: **477** (numbered #1-#477; some entries cover multiple files/occurrences).

By rough category:
- Code example errors (wrong columns/results/syntax): ~140
- Inconsistencies (copy-paste, contradictions, wrong language, content/filename mismatch): ~160
- Markdown formatting (unclosed fences, misaligned tables, orphan markers): ~120
- Typos / grammar: ~80
- Broken links (internal only — external links NOT checked, network was blocked): ~25

Known limitations:
- External http link liveness was never verified (no network). A separate `lychee`/`markdown-link-check` run is still needed.
- Audit covered `docs/` (latest EN) only; `versioned_docs/`, `i18n/` not audited — many findings likely also exist in Chinese/older versions.
- #1-#4 were the original manual sample; #1-#2 already fixed in PR #3670.

## Batch 32 — external link check (683 URLs, done 2026-05-18) — 9 findings

Method: main session has network (sub-agents were sandboxed). 683 real external
URLs checked. 593 OK. Excluded as NOT broken: 403 (bot-blocked: mvnrepository,
bcebos, oss/cos, s3.amazonaws, portal.azure, platform.openai), 401 (auth-required
APIs: openai/deepseek/onelake/databricks), 429 (rate-limited: wikipedia/youtu.be),
000/502 placeholders (`host:port`, `fe1:8630`, `minio:9000`, `bucket.endpoint`...),
AWS glue/s3tables API endpoints. The `www.apache.org/docs/gettingStarted/...` 404 in
`domain.md`/`domain-without-www.md` is sample input data for the `domain()` function — NOT a broken link, excluded.

### #478 — jdbc-catalog-overview.md: dead doris.apache.org link
- `docs/lakehouse/catalogs/jdbc-catalog-overview.md` — broken link — high
- `doris.apache.org/community/how-to-contribute/jdbc-catalog-developer-guide` → 404.

### #479 — multiple lakehouse docs: dead trino-connector-developer-guide link
- `docs/lakehouse/lakehouse-overview.md`, `catalogs/kudu-catalog.md`, `kafka-catalog.md`, `bigquery-catalog.md`, `delta-lake-catalog.md` (+more) — broken link — high
- `doris.apache.org/community/how-to-contribute/trino-connector-developer-guide` → 404.

### #480 — upgrade.md: dead release-versioning link
- `docs/admin-manual/cluster-management/upgrade.md` — broken link — high
- `doris.apache.org/community/release-versioning` → 404.

### #481 — install-config-cluster.md: dead github link (old docs path)
- `docs/install/deploy-on-kubernetes/integrated-storage-compute/install-config-cluster.md` — broken link — high
- `github.com/apache/doris/blob/master/docs/zh-CN/community/developer-guide/debug-tool.md` → 404 (path removed from apache/doris).

### #482 — bigquery.md: malformed Google Cloud URL
- `docs/data-operate/import/data-source/bigquery.md` — broken link — high
- `cloud.google.com/bigquerydocs/exporting-data` → 404; should be `cloud.google.com/bigquery/docs/exporting-data`.

### #483 — lance.md: dead lancedb docs link
- `docs/lakehouse/file-formats/lance.md` — broken link — medium
- `lancedb.github.io/lance/` → 404.

### #484 — data-lineage.mdx: dead openlineage link
- `docs/key-features/data-lineage.mdx` — broken link — medium
- `openlineage.io/docs/spec/overview/` → 404.

### #485 — 5 files: dead mysql-connector driver download
- `docs/lakehouse/catalog-overview.md`, `sql-manual/.../CREATE-RESOURCE.md`, `job/CREATE-STREAMING-JOB.md`, `catalog/CREATE-CATALOG.md`, `table-valued-functions/cdc-stream.md` — broken link — high
- `doris-community-test-1308700295.cos.ap-hongkong.myqcloud.com/jdbc_driver/mysql-connector-java-8.0.25.jar` → 404 (dead bucket).

### #486 — jdbc-catalog-overview.md: maven URL over http
- `docs/lakehouse/catalogs/jdbc-catalog-overview.md` — broken link — low
- `http://repo1.maven.org/maven2/com/mysql/...` → 501; should be `https://`.

(Total findings now #1-#486.)

Recommended high-priority PR groups (high-confidence, mechanical fixes):
- Whole-file copy-paste bugs: #18 (compaction-run.md), #382 (hdfs.md=local.md copy), #387 (CREATE-WORKLOAD-POLICY.md)
- Wrong `language` frontmatter (zh-CN on English docs): #32, #43, #138, #146-148, #245, #246, #462
- English docs with Chinese content: #31, #33, #34, #243, #347, #427, #447, #449
- Unclosed/orphan code fences: #24, #109, #141, #277, #322, #443, #455, #456, #470
- `pv`/HLL equivalent-query bugs (same class as #62827): #3, #4, #157-159
