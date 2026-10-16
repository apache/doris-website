# Lessons from the 4.1.4 round (each maps to a step in SKILL.md)

Recorded as "what went wrong -> how it was caught -> how it is prevented now". Append after every
release.

## A. Classification

1. **Filtering by the `[tag]` in the subject misses changes.** `[fix](test) stabilize the flaky
   shuffle_left_join` added the session variable `bucket_shuffle_downgrade_ratio`;
   `[fix](regression) Adjust large TTL cache regression case` added the upper-bound check on
   `file_cache_ttl_seconds`. -> `split-commits.sh` splits by touched paths only.
2. **A subagent's default value can be an intermediate state.** `enable_expr_zonemap_filter` was
   `true` in `009bcf44b3d` and back to `false` in `5e6f47d7cdc`. -> the main agent re-checks against
   the final diff from `surface-diff.sh` and `compare-refs.py`.
3. **"Does this need documentation: No" in the PR does not mean no docs** (`ADMIN COMPACT TABLET`
   and peer read both had it unchecked), but "the open-source build only ships a no-op" (TLS) is a
   real reason not to write. -> record both signals and let the user decide.
4. **The same identifier can exist once in FE and once in BE.**
   `enable_group_commit_streamload_be_forward` existed as an FE config since 4.0.7; the BE config
   arrived in 4.0.8 / 4.1.4. -> `check-version-claims.py --path` restricts the search to one file.

## B. Writing (factual errors that were made)

5. **Treating the commit title as the conclusion.** `5ea5dd73e13` "replication_num /
   replication_allocation" was documented as "now mutually exclusive"; the code removes the other
   legacy property when one is modified. -> read the diff body before writing a behavior claim.
6. **Missing the gating condition.** The `enable_nereids_distribute_planner` refresh sits inside
   `if (variableVersion < 400)`, i.e. only 3.x -> 4.x upgrades; it was documented as "every
   upgrade". -> conventions §7, "what happens on upgrade".
7. **Mutability inverted twice.** `enable_forward_group_commit_stream_load_to_follower` is
   `mutable = true`; `default_get_version_from_ms_timeout_second` is a bare `@ConfField`. ->
   `compare-refs.py` now prints mutability.
8. **Embellishing a count.** `BackendNum` was described as "live, healthy backends"; the code calls
   `getAllClusterBackends(false)` = all of them. -> read the argument, don't guess.
9. **Rule changed, example kept.** After the shortest-round-trip float format landed, the old
   `cast('12345678' as float) -> 1.234568e+07` example stayed under the new rule and contradicted
   it. -> conventions §8.
10. **A mid-table insert with a blockquote split the table** (MaxCompute properties). ->
    `validate-docs.py` checks column counts; new rows go at the end.
11. **A retyped property name** (`mc.enable_namespace_schema` for `mc.enable.namespace.schema`).
    -> copy from the code constant.
12. **Inherited "since 4.0.8" notes without checking the 4.1 line.** Six of them were 4.1.4 on that
    line; `require_partition_filter` "since 4.1.2" was 4.1.4; multimodal EMBED "4.1.5" was 4.1.4. ->
    every version number goes through `check-version-claims.py`.
13. **Documented unreleased capabilities.** Whole chapters on Paimon writes and Variant V2 were
    written and then withdrawn. -> ask before writing a large new capability area (SKILL.md §4).
14. **Wrote new function pages although dev already had better ones.** The dev `parse_to_variant`
    page was more complete. -> `find` all four trees before creating a page; reuse and fix the
    version note.

## C. Sync

15. **dev is not a copy of 4.x.** master lacked four variables (`enable_external_scan_task_reuse`,
    `file_split_size_on_fe/be`, `external_meta_cache_max_weight`), three defaults differed
    (`enable_expr_zonemap_filter`, `max_scanners_concurrency`, `meta_service_rpc_rate_limit_enabled`),
    Paimon was 1.3.1 vs 1.4.2, `paimon-scanner` was not renamed, Iceberg `ALTER TABLE SET` and the
    database-property matrix did not exist, several error strings differed, `SHOW TABLETS` without
    `ORDER BY` behaved differently. -> run `compare-refs.py` first and paste the table into the port
    prompt.
16. **master moves.** `external_meta_cache_max_weight` was absent from master on sync day and
    landed hours later (#67726). -> record the master SHA in the report / PR; re-run
    `compare-refs.py` before pushing.
17. **Narrow pathspecs miss on master.** Connectors moved to `fe/fe-connector/`; searching
    `fe/fe-core/src/main/java/` for `osstables` returned nothing. -> search the whole tree, then drop
    test hits.
18. **dev had already structured the same topic differently.** Schema change is split into
    `schema-change-mysql.md` / `schema-change-postgresql.md` on dev. -> "find the equivalent place
    and adapt", never paste. Conversely, a page that dev has and 4.x lacks
    (`schema-change-mysql.md`) is ported down when the feature ships in this version.
19. **Sidebars are shared.** Adding an entry in the Chinese-first phase breaks the English build. ->
    link from an existing page first; add the entry when English exists.

## D. Process

20. **Chinese first -> user review -> English + other branches** is the requested cadence; every PR
    description states the sync status.
21. The report file (`plan-doc/doris-<ver>-doc-review.md`) stays out of the PR; its summary goes into
    the PR description.

## E. Lessons from the 4.1.5 round

22. **Surface extraction is a baseline, not a complete inventory.** The BE metric definitions moved
    to `be/src/common/metrics/`; the extractor still searched `be/src/util/`. New system-table metric
    rows also arrived through BE statistics producers without changing `SchemaTable.java`. Check
    every production diff and audit nonproduction batches for shipped dependency/platform changes.
23. **A field initializer does not establish the public option behavior.** `FileFormatProperties`
    defaults timezone mapping to true, but `ExternalFileTableValuedFunction` also consumes the old
    option and forces it true. Setting the option false cannot restore the old mapping. Follow the
    option from parsing through its consumer; the separate binary TVF option remains configurable.
24. **A schema helper can be overridden by the query schema builder.** The generic Arrow helper uses
    UTC for TIMESTAMPTZ, while `FlightSqlQuerySchema` supplies the session timezone. Verify the caller
    before documenting the actual client-visible timezone label.
25. **A privilege helper's owner argument is not necessarily the creator.** Routine Load checks its
    job owner, but current MV refresh runs with a system identity. CREATE/ALTER checks the caller's
    compute-group privilege; creator revocation is not rechecked as that creator during MV refresh.
26. **Inspect implementation timing before describing a bound.** Cloud edit-log time rolling is
    checked when appending a journal, so it is not a strict idle timer. TopN candidate capacity trims
    serialized state and does not impose a hard local aggregation memory cap.
27. **SQL examples need the complete grammar even when no partitions are enumerated.** Hive
    `PARTITION BY LIST (dt, region)` still requires trailing `()` in CREATE TABLE. Static partition
    columns are omitted from implicit INSERT values; verify both forms against final parser/tests.
28. **Reference cleanup can uncover older factual errors.** Check exact FE return signatures and
    string-parser maps: FORMAT_ROUND returns STRING, PARSE_DATA_SIZE returns LARGEINT with
    case-sensitive units, and WEEK rounding defaults to `0001-01-01`, not year zero.
29. **Preserve old heading anchors when normalizing SQL function sections.** Keep compatibility
    anchors for names such as `功能`, `使用说明` and `举例`; also validate new fragments with the
    repository's actual Docusaurus slugger.
