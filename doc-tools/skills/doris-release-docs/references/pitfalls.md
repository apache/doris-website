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
