---
{
    "title": "Release 4.1.3",
    "language": "en",
    "description": "Here's the Apache Doris 4.1.3 release notes:"
}
---

# New Features

## Query & Execution
- Support Python UDF/UDAF/UDTF (#63387)
- Support remote scan bytes breaker in workload policy (#64649)
- Add username-based backend workload policy support (#60559)
- Add `is_valid_utf8` function (#62515)

## Cloud Native
- Add table-level event-driven warm up (#63832)

## Load
- Support zstd stream load compression (#64711)

## Index & Search
- Add ANN TopN small-candidate fallback to brute-force search (#64555)

# Improvement

## Query & Execution
- Treat `inactive_file` as available memory to avoid false query cancellations in cgroup environments (#64347)
- Set default profile level to 2 to print more detail query profile by default (#64378)
- Add configurable return mode for insert publish timeout in ETL scenarios (#64583)

## Load
- Make from-to streaming task timeout progress-aware (#64301)
- Add zero-row hint for Kafka read_committed load and delay zero-row retries (#64585)
- Refresh routine load lag metrics more timely (#63654)

## Cloud Native
- Add rate limit for BE to Meta-Service RPC (#64396)
- Add virtual compute group switch metric (#63036)

# Bugfix

## Index & Search
- Handle truncated sparse path stats when reading Variant (#64205)
- Preserve JSON object when casting JSONB to Variant (#63792)
- Return raw string for `element_at` on scalar-string Variant (#64103)
- Escape JSONB path member control characters (#63517)

## Query & Execution
- Fix `SimplifyAggGroupBy` should verify injectivity (#64335)
- Fix partition TopN optimization requiring window function partition key to be subset of co-located keys (#65073)
- Fix sorted merge continuing when sender queue is ready (#65004)
- Fix TopN merge with child prefix order keys (#64685)
- Fix nullable aggregate visitor dispatch (#64885)
- Fix incorrect aggregate merge with duplicate aliases (#65025)
- Fix timeout checker stopping after an exception (#65040)
- Restrict auto salt join rewrite to avoid incorrect results (#64518)
- Fix handling of generated columns in delete partial update (#64884)
- Guard `Count(*)` child access with arity check in `PushDownAggThroughJoinOnPkFk` (#64848)
- Fix cloud query retry setting `version_cache_ttl` temporarily to 0 on error -230 (#63721)
- Fix recursive CTE blocks not sent to every scan instance (#64964)
- Fix SHOW PROCESSLIST returning unexpected result in FULL mode (#64631)
- Fix `isNull` parser placement under primaryExpression (#63619)
- Fix subquery eliminating null-aware anti-join incorrectly (#64639)
- Skip TopN lazy materialization when `light_schema_change=false` (#64441)
- Fix `copy into select` not binding file column placeholders (#64591)
- Clamp merged limit of MERGE_TOP_N by parent offset (#64306)
- Prevent cast project pushdown through UNION DISTINCT (#64080)
- Disable row-store lazy fetch for shared base columns (#62864)
- Fix self-deadlock in FragmentMgr on query context map clear (#64552)
- Fix month nullable datetimev2 literal binding (#64459)
- Remove incorrect topN-to-MAX optimizer rewrite (#63519)
- Fix local runtime filter merge deadlock (#65102)
- Return error status from materialization operator row-ID fetcher (#62513)
- Normalize aggregate order-by pushdown (#64787)
- Fix NereidsCoordinator not created in proxy flow due to missing parsedStatement (#64363)
- Reject more than 1 argument in COUNT DISTINCT window function (#64783)
- Avoid incorrect `convert_tz` partition pruning across DST transitions (#63853)
- Fix `MAKE_SET` constant folding not clearing prior result (#64907)
- Prevent SIGFPE in `int_divide` for signed minimum value (#64828)
- Fix `nth_value` for upper-bounded windows (#64864)
- Return NaN for `avg_weighted` when sum of weights is zero (#64333)
- Stabilize conjunct cost ordering (#64637)
- Stop extra operator work after cancellation (#64077)
- Fix `array_first`/`array_last` boolean cast (#64847)
- Validate `array_sort` lambda arity (#64825)
- Limit `retention` param count to 32 to avoid BE heap overflow (#64521)
- Fix `concat_ws` nullable array handling (#64703)
- Fix `split_by_delimiter` missing backslash escape handling (#61995)
- Normalize v1 date string cast result (#64575)
- Fix SIGSEGV in `bvar::take_sample` under high EPS due to AgentCombiner/TLS race (#64040)
- Validate sequence pattern event numbers (#64930)
- Catch standard exceptions in pipeline scheduler (#65019)
- Catch block serialization exceptions to avoid coredump (#64852)
- Validate task executor scan handles (#65054)
- Initialize thread context on AsyncIO worker threads (#64846)
- Fix sliced FixedSizeBinary Arrow string reads (#64829)
- Avoid mutable nullable CRC32C hashing (#64944)
- Preserve DateTimeV2 scale in OUTFILE CSV export (#64344)
- Reject invalid IPv4 default value at CREATE TABLE time (#62906)
- Harden Arrow Flight split source error path to avoid BE crash on external scan (#64797)

## Storage & Compaction
- Fix group commit block queue unavailability (#63722)
- Fix lost rows when prepared statement reuses plan with same load_id in group commit (#64362)
- Fix shared delta writer state lifetime (#64504)
- Fix tablet writer map lookup race in load channel (#64604)
- Prevent EMPTY_CUMULATIVE / BASE-CUMU races on same tablet in cloud compaction (#64619)
- Persist update time for sub-transaction commit (#64739)
- Make S3 rate limiter config take effect dynamically in cloud mode (#64554)
- Use snapshot read for table version to avoid transaction conflict (#64647)
- Recycle empty rowsets without resource ID (#64630)
- Fix double assignment in recycler_service that caused recycler malfunction (#64168)
- Avoid false-positive leaked delete bitmaps for unexpired job tmp rowsets (#64313)
- Refresh base tablet before schema change V1 (#64312)
- Forbid restoring table with `light_schema_change=false` in cloud mode (#62914)
- Rewrite table properties and partition info during cloud restore (#64466)
- Make sync file cache clear use safe removal (#64578)
- Disable sync file cache clear in HTTP API (#64321)
- Exclude warmup reads from file cache hit ratio metrics (#63394)
- Force drop partition in INSERT OVERWRITE (#62510)
- Add null-safety to `getBaseViewsOneLevel` for MTMV backward compatibility (#64412)
- Fix MTMV mutating excluded trigger tables (#62984)
- Avoid finalized pipeline task submit crash (#64953)

## Load
- Serialize audit loader batch assembly to fix race (#65107)
- Lock routine load task renew on submit failure (#65007)
- Fix stream load IPv6 host parsing (#64147)
- Replace tablet writer close polling with event wakeup (#64221)
- Fix empty statistics for forwarded INSERT (#64439)
- Fix `load_to_single_tablet` routing for auto partition (#64356)
- Record per-query SET_VAR hint session variables in audit log (#64569)
- Fix AVRO JNI reader coredump with null pointer during TVF function (#64699)

## Lakehouse
- Fix NPE in Iceberg COUNT(*) pushdown when snapshot summary omits total-* counters (#64648)
- Fix Iceberg binary columns written with wrong Arrow types (#64949)
- Add LZ4 compression support for Iceberg/Hive Parquet/ORC writers (#64723)
- Allow disabling REST catalog view operations (#63320)
- Preserve empty text records when reading Hive text files (#64671)
- Estimate MaxCompute write block size from Arrow buffers instead of per-row serialization (#64612)
- Push SQL Server/Oracle boolean predicates as 1/0 instead of TRUE/FALSE in JDBC (#64757)
- Fetch table comment PROP from Iceberg table metadata (#64263)
- Avoid blocking external meta cache refresh on slow miss load (#64705)

## Security & Authentication
- Add auth check for manager node and query error REST APIs (#65080)
