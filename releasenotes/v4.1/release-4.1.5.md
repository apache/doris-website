---
{
    "title": "Release 4.1.5",
    "language": "en",
    "description": "Here's the Apache Doris 4.1.5 release notes:"
}
---

## New Features

### Lakehouse

- Support static partition overwrite for Hive tables. ([#68181](https://github.com/apache/doris/pull/68181))

### AI and Search

- Support `ik_smart` and `ik_max_word` tokenizers in custom inverted-index analyzers. ([#68550](https://github.com/apache/doris/pull/68550))
- Add a `norms` index property and a BE configuration for skipping norms on VARIANT paths. ([#68140](https://github.com/apache/doris/pull/68140))
- Support dedicated embedding properties in AI RESOURCE. ([#68384](https://github.com/apache/doris/pull/68384))

### Cloud and Job Management

- Allow Routine Load jobs and asynchronous materialized views to bind explicitly to a compute group through the `compute_group` property. ([#67010](https://github.com/apache/doris/pull/67010))
- Add dry-run mode for FE-to-MetaService and BE-to-MetaService RPC rate limiting. ([#67421](https://github.com/apache/doris/pull/67421), [#67240](https://github.com/apache/doris/pull/67240))

## Improvements

### Lakehouse and Cloud

- Batch Hive Metastore partition access to reduce metadata requests. ([#68197](https://github.com/apache/doris/pull/68197))
- Support lazy HDFS file opening for Iceberg and propagate delete-file sizes. ([#67842](https://github.com/apache/doris/pull/67842))
- Reduce object allocations and reuse boxed IDs in cloud tablet indexes; release scheduling indexes after balancing. ([#67278](https://github.com/apache/doris/pull/67278), [#67248](https://github.com/apache/doris/pull/67248), [#67290](https://github.com/apache/doris/pull/67290))
- Optimize deletion of delete bitmap keys during rowset recycling. ([#67854](https://github.com/apache/doris/pull/67854), [#67936](https://github.com/apache/doris/pull/67936))
- Register the watershed transaction ID only once when a BE enters the decommissioning state. ([#67632](https://github.com/apache/doris/pull/67632))

### Ingestion and Storage

- Improve write performance through better backpressure control. ([#67728](https://github.com/apache/doris/pull/67728))
- Skip redundant `createLocation` operations in the Group Commit Stream Load sink. ([#63685](https://github.com/apache/doris/pull/63685))
- Adjust CDC request timeout and snapshot split batch defaults. ([#67684](https://github.com/apache/doris/pull/67684))
- Avoid copying segment key bounds during primary-key lookups and release unused storage-path memory earlier. ([#67698](https://github.com/apache/doris/pull/67698), [#67956](https://github.com/apache/doris/pull/67956))

### Query and Execution

- Optimize the join orientation for `MERGE INTO` by placing the target table on the probe side. ([#67279](https://github.com/apache/doris/pull/67279))
- Improve mark-join slot inference to eliminate redundant mark joins. ([#67280](https://github.com/apache/doris/pull/67280))
- Add a dictionary fast path for day and week arithmetic. ([#67233](https://github.com/apache/doris/pull/67233))
- Optimize `pow` for squares while preserving exact integer results. ([#68443](https://github.com/apache/doris/pull/68443))
- Avoid redundant partition version requests during SQL cache validation. ([#67415](https://github.com/apache/doris/pull/67415))
- Support row-ID fetch in FileScannerV2. ([#67922](https://github.com/apache/doris/pull/67922))

### Operations and Diagnostics

- Include usernames in HTTP request logs for auditing. ([#67319](https://github.com/apache/doris/pull/67319))
- Improve audit logs for S3 streaming insert jobs. ([#67756](https://github.com/apache/doris/pull/67756))
- Reduce duplicate query cancellation logs and avoid per-file-descriptor `stat` calls when collecting process file descriptor counts. ([#67548](https://github.com/apache/doris/pull/67548), [#68046](https://github.com/apache/doris/pull/68046))

## Bug Fixes

### Query Optimization and Correctness

- Fix join amplification caused by WinMagic subquery rewrites. ([#67288](https://github.com/apache/doris/pull/67288))
- Retain sliding-window rows until they can be safely evicted and respect window frames when simplifying window functions. ([#67329](https://github.com/apache/doris/pull/67329), [#67743](https://github.com/apache/doris/pull/67743))
- Preserve nullability in DISTINCT window rewrites and cast comparisons, and preserve session guards during common expression extraction. ([#67721](https://github.com/apache/doris/pull/67721), [#67843](https://github.com/apache/doris/pull/67843), [#67863](https://github.com/apache/doris/pull/67863))
- Preserve weighted averages when eliminating GROUP BY and correct participation checks in aggregate inference. ([#67832](https://github.com/apache/doris/pull/67832), [#68175](https://github.com/apache/doris/pull/68175))
- Normalize projected COUNT slots before NULL-safety checks. ([#68068](https://github.com/apache/doris/pull/68068))
- Prevent runtime filters from being pushed below Repeat when the target slot is absent from any grouping set. ([#67992](https://github.com/apache/doris/pull/67992))
- Reject storage-level `MIN` and `MAX` pushdown through unsafe casts. ([#67980](https://github.com/apache/doris/pull/67980))
- Fix partial TopN pushdown through joins, preserve required slots during TopN lazy materialization, and disable TopN lazy materialization for tables without light schema change. ([#68235](https://github.com/apache/doris/pull/68235), [#68072](https://github.com/apache/doris/pull/68072), [#67928](https://github.com/apache/doris/pull/67928))
- Preserve UNION constant rows across rewrites and retain Generate child outputs required by subqueries. ([#68172](https://github.com/apache/doris/pull/68172), [#68173](https://github.com/apache/doris/pull/68173))
- Resolve correlated qualified columns before dereference expressions. ([#68062](https://github.com/apache/doris/pull/68062))
- Hide internal HAVING helper columns from query output. ([#68075](https://github.com/apache/doris/pull/68075))
- Preserve duplicate output column positions in table-valued functions. ([#67829](https://github.com/apache/doris/pull/67829))
- Align constant folding and interval folding with BE execution. ([#68071](https://github.com/apache/doris/pull/68071), [#68174](https://github.com/apache/doris/pull/68174))
- Track user variables in the SQL cache and apply `sql_select_limit` to materialized CTE results. ([#68069](https://github.com/apache/doris/pull/68069), [#68077](https://github.com/apache/doris/pull/68077))
- Propagate constants out of one-row relations to enable partition pruning. ([#67400](https://github.com/apache/doris/pull/67400))
- Improve error messages for unsupported subqueries. ([#67693](https://github.com/apache/doris/pull/67693))

### Functions and Data Types

- Fix execution of `topn_array` and `topn_weighted` on BOOLEAN inputs while preserving BOOLEAN array result types. ([#68409](https://github.com/apache/doris/pull/68409))
- Fix candidate loss in `topn`, `topn_array`, and `topn_weighted` when `space_expand_rate` is zero. Non-positive values now allow unlimited intermediate candidate retention; `top_num` still limits the final result. ([#68545](https://github.com/apache/doris/pull/68545))
- Return NULL from `TRY_CAST` on arithmetic overflow. ([#67985](https://github.com/apache/doris/pull/67985))
- Fix overflow, batch integer output, and NULL-argument row handling in `array_range`. ([#67689](https://github.com/apache/doris/pull/67689), [#68644](https://github.com/apache/doris/pull/68644))
- Fix nested `array_map` lambda captures, appending to constant NULL arrays, and array functions operating on outer-NULL containers with hidden nested data. ([#68471](https://github.com/apache/doris/pull/68471), [#68442](https://github.com/apache/doris/pull/68442), [#68696](https://github.com/apache/doris/pull/68696))
- Preserve the leading NULLs of each row in `array_cum_sum`. ([#68605](https://github.com/apache/doris/pull/68605))
- Fix Decimal rounding with zero decimal places and rounding overflow at scale boundaries. ([#68412](https://github.com/apache/doris/pull/68412), [#68415](https://github.com/apache/doris/pull/68415))
- Fix `LIKE` matches with extra trailing characters and avoid using NGram Bloom Filter indexes when patterns may contain escapes. ([#68159](https://github.com/apache/doris/pull/68159), [#68319](https://github.com/apache/doris/pull/68319))
- Fix empty constant regular expression patterns, UTF-8 splitting with an empty regular expression, and extended regular expression fallback for non-constant patterns. ([#68179](https://github.com/apache/doris/pull/68179), [#68417](https://github.com/apache/doris/pull/68417), [#68591](https://github.com/apache/doris/pull/68591))
- Fix argument-count validation for `json_set`, `json_insert`, and `json_replace`, and fix constant nullable JSON path evaluation. ([#67914](https://github.com/apache/doris/pull/67914), [#68525](https://github.com/apache/doris/pull/68525))
- Prevent JSON text from being truncated at `U+0000` inside a string and preserve NUL bytes in count-by-enum keys. ([#68735](https://github.com/apache/doris/pull/68735), [#68419](https://github.com/apache/doris/pull/68419))
- Preserve NULL propagation in date floor functions and account for microseconds in week floor and ceil operations. ([#68423](https://github.com/apache/doris/pull/68423), [#68416](https://github.com/apache/doris/pull/68416))
- Fix range checks for oversized Unix timestamps and correct the aliases of `next_day` and `previous_day`. ([#68364](https://github.com/apache/doris/pull/68364), [#68542](https://github.com/apache/doris/pull/68542))
- Fix odd-byte IPv6 truncation and zero-address IPv4 CIDR handling. ([#68414](https://github.com/apache/doris/pull/68414), [#68420](https://github.com/apache/doris/pull/68420))
- Fix NULL handling in `parse_data_size` and `MAKE_SET`. ([#68413](https://github.com/apache/doris/pull/68413), [#68411](https://github.com/apache/doris/pull/68411))
- Fix BIGINT overflow during base conversion in `conv`. ([#68424](https://github.com/apache/doris/pull/68424))
- Preserve all samples when merging percentile states, align NULL ordering in complex aggregates, and restore BOOLEAN support in `linear_histogram`. ([#68475](https://github.com/apache/doris/pull/68475), [#68422](https://github.com/apache/doris/pull/68422), [#68676](https://github.com/apache/doris/pull/68676))
- Fix crashes when reading zero-length serialized BITMAP, HLL, or QuantileState cells. ([#68497](https://github.com/apache/doris/pull/68497))

### Lakehouse Reads and External Metadata

- Fix historical Iceberg scans after schema evolution, V2 reads across nested schema evolution, and schema binding for historical scans. ([#67479](https://github.com/apache/doris/pull/67479), [#67690](https://github.com/apache/doris/pull/67690), [#68568](https://github.com/apache/doris/pull/68568))
- Support fractional timestamps correctly in Iceberg time travel. ([#67704](https://github.com/apache/doris/pull/67704))
- Fix planning failures for Iceberg VARIANT subpaths and preserve nullability in schema metadata. ([#68121](https://github.com/apache/doris/pull/68121), [#67856](https://github.com/apache/doris/pull/67856))
- Report errors for missing Iceberg snapshot files and invalid name mappings instead of returning incorrect data. ([#68143](https://github.com/apache/doris/pull/68143), [#68003](https://github.com/apache/doris/pull/68003))
- Fix equality-delete key matching after schema type promotion and preserve file partition specifications when tables evolve to an unpartitioned layout. ([#68383](https://github.com/apache/doris/pull/68383), [#68481](https://github.com/apache/doris/pull/68481))
- Run Iceberg execute actions in the corresponding catalog authentication context. ([#67695](https://github.com/apache/doris/pull/67695))
- Preserve Paimon CAST predicate semantics, estimate row counts from snapshot metadata, and invalidate the SDK cache on metadata refresh. ([#67933](https://github.com/apache/doris/pull/67933), [#68155](https://github.com/apache/doris/pull/68155), [#68238](https://github.com/apache/doris/pull/68238))
- Scope Hive file cache entries by table and fix name and row-count cache invalidation after external metadata changes. ([#68575](https://github.com/apache/doris/pull/68575), [#67417](https://github.com/apache/doris/pull/67417), [#68196](https://github.com/apache/doris/pull/68196))
- Release Iceberg FileIO and Hudi fsView resources on cache eviction. ([#66913](https://github.com/apache/doris/pull/66913))
- Align Parquet and ORC timestamp semantics and fix external binary and timestamp mappings and binary value ownership. ([#68441](https://github.com/apache/doris/pull/68441), [#68532](https://github.com/apache/doris/pull/68532), [#68297](https://github.com/apache/doris/pull/68297))
- Preserve safe predicate ordering for Parquet VARIANT metadata pruning and enforce a Parquet metadata size limit. ([#68144](https://github.com/apache/doris/pull/68144), [#68047](https://github.com/apache/doris/pull/68047))
- Fix lost and duplicate rows when splitting CSV and JSON files using multi-character line delimiters. ([#68600](https://github.com/apache/doris/pull/68600))
- Clamp HTTP range reads to the file size and keep S3 response streams usable when an error body exceeds the read buffer. ([#67683](https://github.com/apache/doris/pull/67683), [#68544](https://github.com/apache/doris/pull/68544))
- Fix BE access to AWS in EKS Pod Identity environments. ([#67555](https://github.com/apache/doris/pull/67555))
- Select Lance vector indexes compatible with the requested distance metric and fix Lance JNI compatibility with glibc 2.17. ([#67553](https://github.com/apache/doris/pull/67553), [#67862](https://github.com/apache/doris/pull/67862))

### Arrow Flight SQL and Client Protocols

- Prevent Arrow Flight connections from using the point-query short-circuit path or replaying MySQL SQL cache results. ([#67557](https://github.com/apache/doris/pull/67557), [#67556](https://github.com/apache/doris/pull/67556))
- Release Flight coordinators promptly after query completion and cancel queries when result streams close early. ([#67558](https://github.com/apache/doris/pull/67558), [#68630](https://github.com/apache/doris/pull/68630))
- Deduplicate parallel result endpoints by backend. ([#68642](https://github.com/apache/doris/pull/68642))
- Validate Arrow result arrays before publishing batches and reject out-of-range timestamps. ([#68596](https://github.com/apache/doris/pull/68596), [#68604](https://github.com/apache/doris/pull/68604))
- Fix year-zero DATE conversion, preserve nested logical type metadata, and return analyzed query schemas and table type metadata. ([#68649](https://github.com/apache/doris/pull/68649), [#68614](https://github.com/apache/doris/pull/68614), [#68631](https://github.com/apache/doris/pull/68631))
- Fix MySQL Connector/J cursor fetches hanging on empty results. ([#68064](https://github.com/apache/doris/pull/68064))

### Ingestion and Job Lifecycle

- Handle incomplete WAL records during replay and stop rejecting WAL data containing VARIANT columns as an unsupported file format. ([#67420](https://github.com/apache/doris/pull/67420), [#68242](https://github.com/apache/doris/pull/68242))
- Fix Group Commit routing for virtual compute groups. ([#67590](https://github.com/apache/doris/pull/67590))
- Return transactional INSERT execution errors to clients. ([#67925](https://github.com/apache/doris/pull/67925))
- Fix strict-load crashes when direct slot mappings are absent. ([#67953](https://github.com/apache/doris/pull/67953))
- Use the streaming job creator's identity for CDC operations. ([#67937](https://github.com/apache/doris/pull/67937))
- Preserve active export jobs and label mappings during history cleanup. ([#67833](https://github.com/apache/doris/pull/67833))
- Fix `SET_VAR` settings leaking into subsequent statements after INSERT audit logging. ([#68108](https://github.com/apache/doris/pull/68108))

### Materialized Views and Metadata

- Prevent snapshot reads from using current materialized views. ([#67729](https://github.com/apache/doris/pull/67729))
- Fix compensation for invalid partition buckets in partitioned rollup rewrites. ([#68067](https://github.com/apache/doris/pull/68067))
- Avoid unnecessary full refreshes of asynchronous materialized views when a base table adds a partition without an existing snapshot. ([#68249](https://github.com/apache/doris/pull/68249))
- Preserve the original statement in asynchronous materialized view refresh tasks. ([#68272](https://github.com/apache/doris/pull/68272))
- Restore rollup display state after metadata reload and keep rollup jobs waiting when aborting a conflicting transaction fails. ([#67596](https://github.com/apache/doris/pull/67596), [#68055](https://github.com/apache/doris/pull/68055))
- Skip dangling views when querying `information_schema.view_dependency` and fix quoting of view column names and comments in exported DDL. ([#67377](https://github.com/apache/doris/pull/67377), [#67398](https://github.com/apache/doris/pull/67398), [#68076](https://github.com/apache/doris/pull/68076))
- Treat invalid column statistics as UNKNOWN instead of failing the entire ANALYZE job, and fix null-pointer errors when querying a missing ANALYZE job ID. ([#68061](https://github.com/apache/doris/pull/68061), [#68493](https://github.com/apache/doris/pull/68493))
- Commit FE type state only after the transition completes. ([#68325](https://github.com/apache/doris/pull/68325))

### Storage and Compaction

- Treat unparseable or reversed zone map bounds as invalid, preserve every byte of STRING and VARCHAR bounds, and fix NaN handling for legacy FLOAT and DOUBLE zone maps. ([#67528](https://github.com/apache/doris/pull/67528), [#67550](https://github.com/apache/doris/pull/67550), [#67998](https://github.com/apache/doris/pull/67998), [#68102](https://github.com/apache/doris/pull/68102))
- Fix cumulative point advancement during parallel cumulative compaction and correct compaction thread accounting. ([#67425](https://github.com/apache/doris/pull/67425), [#67662](https://github.com/apache/doris/pull/67662))
- Keep the latest 10 versions unmerged during schema change and release exhausted segment contexts promptly during vertical compaction. ([#67589](https://github.com/apache/doris/pull/67589), [#67599](https://github.com/apache/doris/pull/67599))
- Classify cumulative compaction tasks by row count, avoid repeatedly compacting large rowsets, and include empty rowsets in approximate compaction scores. ([#66938](https://github.com/apache/doris/pull/66938), [#65601](https://github.com/apache/doris/pull/65601), [#66656](https://github.com/apache/doris/pull/66656))
- Persist empty inverted-index files and stop writing orphan index files. ([#68082](https://github.com/apache/doris/pull/68082))
- Preserve VARIANT subpath order and prevent integer `element_at` indexes from being interpreted as subcolumn paths. ([#68284](https://github.com/apache/doris/pull/68284), [#68041](https://github.com/apache/doris/pull/68041))
- Do not cache failures to load segment row counts in BetaRowset, allowing subsequent retries. ([#68683](https://github.com/apache/doris/pull/68683))
- Fix concurrent access to the rowset map in the backend tablets scanner. ([#68316](https://github.com/apache/doris/pull/68316))

### File Cache and Cloud

- Keep File Cache monitoring off the LRU recorder lock and count evicted bytes only for blocks that were actually downloaded. ([#67495](https://github.com/apache/doris/pull/67495), [#68157](https://github.com/apache/doris/pull/68157))
- Unify File Cache TTL deadlines, restore TTL block types when an expired TTL is extended, and set TTL on cloud schema change output. ([#68313](https://github.com/apache/doris/pull/68313), [#68092](https://github.com/apache/doris/pull/68092), [#67686](https://github.com/apache/doris/pull/67686))
- Preserve tablet IDs during synchronous File Cache writes. ([#68347](https://github.com/apache/doris/pull/68347))
- Trigger periodic cloud checkpoints through edit log rolls. ([#67422](https://github.com/apache/doris/pull/67422))
- Fix warm-up job scheduling starvation, release destinations on initialization failure, and restore destination locks after FE recovery. ([#67643](https://github.com/apache/doris/pull/67643), [#68107](https://github.com/apache/doris/pull/68107), [#68105](https://github.com/apache/doris/pull/68105))
- Avoid conflicts when recycling transactions with the same label and return the existing rowset for concurrent commits. ([#67478](https://github.com/apache/doris/pull/67478), [#67660](https://github.com/apache/doris/pull/67660))
- Exclude stale rowsets from temporary cloud schema change tablets and exclude covered rowsets from compaction minimum timestamps. ([#67383](https://github.com/apache/doris/pull/67383), [#67751](https://github.com/apache/doris/pull/67751))
- Refresh metadata for continuously ingested tablets and repair tablet indexes missing `db_id` during transaction commit. ([#68044](https://github.com/apache/doris/pull/68044), [#68127](https://github.com/apache/doris/pull/68127))
- Invalidate version caches on visible transaction commit retries. ([#68650](https://github.com/apache/doris/pull/68650))
- Respect recycle types when deleting partial-update rowsets and preserve clone source mappings for deleted instances. ([#68665](https://github.com/apache/doris/pull/68665), [#68570](https://github.com/apache/doris/pull/68570))
- Fix packed-slice location lifetimes, guard rowset statistics synchronization with task context, and decode transaction IDs safely through Versionstamp. ([#67973](https://github.com/apache/doris/pull/67973), [#67964](https://github.com/apache/doris/pull/67964), [#67954](https://github.com/apache/doris/pull/67954))
- Correct the FDB size limit configuration for delete bitmap V2 and fix lookup of prepared transactions by coordinator. ([#67938](https://github.com/apache/doris/pull/67938), [#68059](https://github.com/apache/doris/pull/68059))

### Authentication and Authorization

- Unify `driver_url` validation across JDBC, Iceberg JDBC, and Paimon JDBC catalogs, including ALTER CATALOG operations. ([#68164](https://github.com/apache/doris/pull/68164))
- Mask sensitive configuration values in `SHOW FRONTEND CONFIG`. ([#67920](https://github.com/apache/doris/pull/67920))
- Apply consistent checks to HTTP Basic and cookie requests on `/rest/v1`. ([#68635](https://github.com/apache/doris/pull/68635))
- Treat only `root@'%'` as the root identity in `SET PASSWORD` and `ALTER USER`. ([#68634](https://github.com/apache/doris/pull/68634))
- Check the grantor's column privileges in GRANT and REVOKE, and reject privilege object names with more than three parts. ([#68629](https://github.com/apache/doris/pull/68629), [#68682](https://github.com/apache/doris/pull/68682))
- Restrict AI resource creation by user identity and modifications to AI resources created by root. ([#68265](https://github.com/apache/doris/pull/68265), [#67782](https://github.com/apache/doris/pull/67782))

### Stability and Platform Compatibility

- Allocate a fresh StatementContext for each prepared-statement execution to prevent unbounded FE memory growth in long-lived prepared statements. ([#67926](https://github.com/apache/doris/pull/67926))
- Fix ReadListener leaks when workers reject tasks and prevent concurrent historical profile loaders. ([#67990](https://github.com/apache/doris/pull/67990), [#67069](https://github.com/apache/doris/pull/67069))
- Fix runtime filter RPC callback reuse and memory release, and resolve an AutoReleaseClosure data race. ([#67912](https://github.com/apache/doris/pull/67912), [#67340](https://github.com/apache/doris/pull/67340))
- Fix bvar sampling access to freed thread-local objects, timer callback destruction races, and races between adaptive flush callbacks and thread-pool teardown. ([#68045](https://github.com/apache/doris/pull/68045), [#68523](https://github.com/apache/doris/pull/68523), [#68326](https://github.com/apache/doris/pull/68326))
- Initialize the bthread context key before first use and avoid repeated peer connection failures. ([#67722](https://github.com/apache/doris/pull/67722), [#67647](https://github.com/apache/doris/pull/67647))
- Prevent BE crashes on malformed AI adapter responses and correctly extract final text from Responses API output. ([#68333](https://github.com/apache/doris/pull/68333), [#67795](https://github.com/apache/doris/pull/67795))
- Fix double-free errors during PHDR unwinding under ASAN and `getentropy` crashes on glibc 2.17 under ASAN. ([#68229](https://github.com/apache/doris/pull/68229), [#67849](https://github.com/apache/doris/pull/67849))
- Upgrade libunwind to 1.8.3 to fix aarch64 BE startup crashes on Linux systems with 64 KiB memory pages. ([#68339](https://github.com/apache/doris/pull/68339))
- Fix dyld cache crashes with large BE binaries on macOS and stop background workers before exiting on startup failure. ([#68218](https://github.com/apache/doris/pull/68218), [#68653](https://github.com/apache/doris/pull/68653))
- Update dependencies including Thrift, AWS SDK, Nimbus, and gRPC, and remove unused LZ4 dependencies. ([#67356](https://github.com/apache/doris/pull/67356), [#67554](https://github.com/apache/doris/pull/67554), [#67847](https://github.com/apache/doris/pull/67847), [#68060](https://github.com/apache/doris/pull/68060), [#67148](https://github.com/apache/doris/pull/67148), [#68557](https://github.com/apache/doris/pull/68557))
