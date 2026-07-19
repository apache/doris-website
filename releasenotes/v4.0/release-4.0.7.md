---
{
    "title": "Release 4.0.7",
    "language": "en",
    "description": "Apache Doris 4.0.7 release notes: a 4.0 maintenance release focused on query correctness, load stability, compute-storage decoupled deployments, File Cache reliability, object storage access, observability, and external data source compatibility."
}
---

# Overview

Apache Doris 4.0.7 is a maintenance release in the 4.0 series. It focuses on query correctness, load stability, compute-storage decoupled deployments, File Cache reliability, and external data source compatibility. All 4.0.x users are advised to upgrade.

Highlights of this release include:

- Cloud enhancements: add table-level event-driven cache warmup, enable Packed File and empty Rowset optimizations by default, and fix several Recycler, Schema Change, Compaction, and File Cache issues.
- Object storage improvements: support S3 Storage Vault credential providers without a Role ARN, and allow deterministic S3 paths to be accessed without `ListBucket` permission.
- Better observability: add FE connection-limit metrics, per-job Routine Load metrics, File Cache queue metrics, and Compute Group information for MTMV refresh tasks.
- Many correctness and stability fixes covering TopN, joins, materialized view rewriting, Stream Load, Routine Load, external catalogs, File Cache crashes, and memory usage.

> Before upgrading, read the Behavior Changes section below.

# Behavior Changes

- `INSERT OVERWRITE` now permanently removes replaced partitions instead of placing them in the Recycle Bin. This reduces Recycle Bin pressure, but these partitions can no longer be recovered from it (#62510).
- Cloud mode now enables `enable_packed_file` and `skip_writing_empty_rowset_metadata` by default (#63475).
- The BE `/api/file_cache?op=clear` API no longer supports synchronous clearing. Requests with `sync=true` now run asynchronously and return a warning (#64321).
- Object storage clients no longer retry S3 `SlowDown` or Azure HTTP 429 responses inside the SDK retry policy, avoiding additional delays before higher-level handling takes effect (#63776).
- `COM_RESET_CONNECTION` now resets connection-scoped state consistently with MySQL (#63884).
- In Cloud mode, `SHOW PARTITIONS` now reports `StorageMedium` as `OBJECT_STORAGE` and `ReplicaAllocation` as `NULL` (#60871).

# New Features & Improvements

## Compute-Storage Decoupling

- Add table-level filtering through `ON TABLES` for event-driven cache warmup (#63832).
- Add a dynamic Recycler instance filter configuration (#63822).
- Cache the Compute Group ID per query and remove redundant locks from the Backend selection hot path (#63636).
- Skip waiting for asynchronous Rowset warmup to reduce write latency (#63877).

## Object Storage & External Data Sources

- Support using an S3 Storage Vault credential provider without specifying a Role ARN (#64766).
- Use HEAD requests for deterministic S3 paths, allowing access with only `s3:GetObject` permission and without `s3:ListBucket` (#60414).
- Fill the Hive metadata cache while estimating table row counts to avoid duplicate HMS access during planning (#63470).

## Observability & Operations

- Add `doris_fe_connection_max` and per-user `doris_fe_user_connection_max` metrics (#64742).
- Add per-job Routine Load metrics and refresh Routine Load lag more promptly (#63576, #63654).
- Add partition-filter conditions to SQL Block Rules (#62196).
- Show the Compute Group used by MTMV refresh tasks (#63206).
- Include scan-node IDs in Nereids physical plans (#62509).
- Record session variables set by per-query `SET_VAR` hints in Audit Logs (#64569).
- Improve password masking for `CREATE USER` and `ALTER USER` statements in Audit Logs (#62141).
- Add support for LDAP default roles (#63411).

## Memory & Performance

- Treat reclaimable `inactive_file` page cache as available memory in cgroup environments, reducing unnecessary query cancellation (#64347).
- Add a BE-level cache for Tablet schemas used during load (#64581).
- Reduce Row Store MemTable flush memory usage (#63342).
- Truncate Segment key bounds without retaining complete backing buffers (#63469).
- Aggregate non-MOW Segment key bounds to reduce metadata size (#64305).
- Release Packed File writer buffers immediately after flush (#63967).
- Use Segment footer `raw_data_bytes` to improve first-time Compaction batch-size estimation (#62263).
- Bound File Cache LRU replay queues and add queue backlog metrics (#64381).

# Important Bug Fixes

## Query Result Correctness

- Fix incorrect Set Operation rewriting caused by using CTE-producer output in place of the regular child output (#64908).
- Remove an unsafe TopN-to-Max rewrite that could produce incorrect results (#63519).
- Fix incorrect row counts when merging nested TopN operators with an outer `OFFSET` (#64306).
- Preserve deterministic ordering when merging TopN operators whose order keys have a prefix relationship (#64685).
- Fix TopN Runtime Filter activation (#63969).
- Reject TopN expressions in correlated scalar subqueries instead of generating an invalid plan (#64251).
- Fix aggregate `ORDER BY` expression pushdown for window functions and scalar subqueries (#64787).
- Fix Cast Project pushdown through `UNION DISTINCT`, which could change deduplication semantics (#64080).
- Fix incorrect elimination of Null-Aware predicates in subqueries (#64639).
- Fix pre-aggregation context leaking between Join branches (#63357).
- Fix Runtime Filter handling for Outer Joins (#64157).
- Align Legacy Planner literal comparison semantics with Nereids (#63481).
- Fix missing query result packets during an FE Master switch, which could leave clients waiting until timeout (#62721).
- Fix MTMV rewriting for multi-hop Outer Joins and null-reject compensation (#62492, #63268).
- Fix mutation of excluded trigger tables while processing MTMV refresh triggers (#62984).
- Fix View queries failing after the schema of an underlying external table changes (#64007).

## Functions & Types

- Fix `convert_tz` constant folding and partition pruning across Daylight Saving Time transitions (#63853, #64029).
- Preserve the sign of negative sub-hour TIMESTAMPTZ offsets (#62823).
- Fix `datediff` constant folding with zero dates (#64084).
- Fix `json_contains` returning false for duplicate elements in candidate arrays (#63301).
- Support Boolean casts in `array_first` and `array_last` (#64847).
- Validate the Lambda arity accepted by `array_sort` (#64825).
- Reject invalid multi-argument `COUNT(DISTINCT ...)` Window Functions during analysis (#64783).
- Limit `retention()` to its supported maximum of 32 arguments, preventing out-of-bounds memory access (#64521).
- Reject `COUNT(DISTINCT variant)` with a clear unsupported-type error instead of a BE internal error (#63479).
- Reject Lucene-syntax search on columns without an Inverted Index (#63857).
- Reject invalid IPv4 default values during `CREATE TABLE` analysis (#62906).
- Fix parsing of `ISNULL` expressions by placing them under `primaryExpression` (#63619).

## Load & Transactions

- Fix truncated input when inferring schemas from compressed files through `http_stream` (#64769).
- Fix Stream Load failures caused by integer overflow while comparing large Backend IDs (#63565).
- Replace Tablet Writer close polling with event-based wakeup to reduce waiting and scheduling overhead (#64221).
- Fix a Broken Pipe risk when redirecting Stream Load requests without consuming the request body (#64303).
- Fix `load_to_single_tablet` routing for Auto Partition tables (#64356).
- Fix `COPY INTO ... SELECT` failing to bind file-column placeholders (#64395).
- Keep shared Delta Writer state independent of the Runtime State belonging to its original sink (#64349).
- Fix `enable_insert_strict` incorrectly changing the semantics of `enable_strict_cast` (#63794).
- Delay `INSERT OVERWRITE` partition routing until incremental open (#63209).
- Select the transaction INSERT Backend from the current Compute Group (#63634).
- Avoid quorum stalls when Delete Push tasks fail (#61647).
- Fix an NPE when an Auto Partition is concurrently dropped during creation (#65357).
- Keep load row-count metrics monotonic when Auto Partition creates new partitions (#64109).
- Fix an NPE in force-finished Publish tasks (#63069).

## Routine Load

- Serialize Routine Load task renewal when task submission fails (#64731).
- Improve Kafka `read_committed` zero-row diagnostics and delay retries for zero-row batches (#63664, #64046).

## Compute-Storage Decoupling

- Refresh the base Tablet before retrying Cloud Schema Change V1 to avoid repeated Compaction conflicts caused by stale versions (#64312).
- Fix races between Empty Cumulative Compaction and Base/Cumulative Compaction on the same Tablet (#64619).
- Fix reading Packed Inverted Index files after a File Cache miss (#64383).
- Validate Recycle Rowset key state during `commit_rowset` to preserve idempotency and prevent invalid commits (#63985).
- Recycle empty Rowsets without requiring a Resource ID (#64630).
- Prevent Tablet KV metadata leaks after a partially failed recycle operation (#63377).
- Deduplicate pending one-shot Cache Warmup jobs (#62384).
- Fix Azure resource persistence across FE restart and replay (#65052).
- Avoid false Tablet diagnosis alarms in Cloud mode (#60805).

## File Cache & Storage

- Fix a race while scanning Backend Tablet Rowset maps (#65288).
- Initialize Thread Context on asynchronous IO worker threads (#64846).
- Fix incorrect fallback reads after a partial File Cache hit, and move LRU updates off the query read path (#61083).
- Fix crashes when delayed File Cache holders reference an already-removed cache cell (#62437).
- Fix crashes when a finalized scan cannot find its local File Cache writer (#62389).
- Fix File Cache percentage overflow when clearing the cache immediately after a BE restart (#63410).
- Make synchronous internal File Cache removal safe (#64578).
- Fix duplicate File Cache metric accumulation in `NewOlapScanner` (#61072).
- Exclude Cache Warmup reads from File Cache hit-ratio metrics (#63394).
- Fix a finalized Pipeline task being submitted again and crashing BE (#64946).

## Lakehouse & External Data Sources

- Fix Iceberg `COUNT(*)` pushdown throwing an NPE when snapshot summary counters are absent (#64648).
- Fix unsupported mapping of Iceberg `varint` types (#64331).
- Fix format detection for migrated Iceberg tables (#64134).
- Fix Parquet Reader failures or BE crashes when a previous Row Group used Dictionary Filtering (#63168).
- Normalize HDFS default paths and OSS bucket endpoint paths across external catalogs (#63476, #64943).
- Push SQL Server and Oracle Boolean predicates as `1` and `0` instead of unsupported `TRUE` and `FALSE` literals (#64760).
- Correctly recognize Doris-compatible targets in MySQL JDBC Catalogs (#64389).
- Fix a MaxCompute Scanner memory leak and improve large-field writes (#61245).

## Metadata, Protocol & Observability

- Fix remote Arrow Flight SQL result receiver initialization (#63136).
- Fix `SHOW PROCESSLIST FULL` returning unexpected results (#64631).
- Fix persisted-variable output in `SHOW VARIABLES` (#63734).
- Support `$` in MySQL-compatible pattern matching (#64259).
- Preserve Histogram metric labels when exporting Prometheus metrics (#63485).
- Skip dropped columns during Follower FE statistics synchronization (#63882).

> These notes focus on user-visible and operations-visible changes. Test-only commits, CI adjustments, release version updates, and purely internal changes without external symptoms are omitted. Refer to the complete 4.0.6-rc02 to 4.0.7-rc02 comparison for the full commit history.

# Acknowledgments

Thanks to all contributors whose pull requests are included in this release:

@924060929 @airborne12 @BiteTheDDDDt @bobhan1 @CalvinKirs @csun5285 @dataroaring @deardeng @eldenmoon @englefly @feiniaofeiafei @felixwluo @foxtail463 @freemandealer @Gabriel39 @gavinchou @Hastyshell @HonestManXin @iaorekhov-1980 @jacktengg @Jungzhang @liaoxin01 @liutang123 @morningman @morrySnow @mrhhsg @Mryange @raghav-reglobe @seawinde @sollhui @starocean999 @suxiaogang223 @wyxxxcat @yiguolei @yoock @yujun777 @Yukang-Lian @zclllyybb @zhangrq5 @zhangstar333 @zhaorongsheng
