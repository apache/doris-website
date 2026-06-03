---
{
    "title": "Release 4.0.6",
    "language": "en",
    "description": "Apache Doris 4.0.6 release notes: in compute-storage decoupled mode, Compaction adds read-write separation, scheduling, and memory optimizations; new operations capabilities include Compaction task tracking, a data lineage SPI, and a dynamic enable_recycler switch; and many query-correctness, load-data-loss, crash, hang, and resource-leak issues are fixed. It includes several behavior changes related to default values and privileges, so be sure to read them before upgrading."
}
---

# Overview

Apache Doris 4.0.6 is a maintenance release in the 4.0 series. It focuses on stability and operational experience. All 4.0.x users are advised to upgrade, and users running the compute-storage decoupled (cloud) mode benefit the most.

Highlights of this release include:

- **Compute-storage decoupling enhancements**: support read-write separation for Compaction, optimize Tablet scheduling and FE-side memory usage, and reduce RPC pressure on the Meta Service.
- **Operational observability**: add Compaction task tracking (System Table and HTTP API), a dynamic `enable_recycler` switch, online adjustment of the memtable flush thread pool, and several brpc / bvar metrics.
- **Data lineage**: introduce a Lineage SPI collection framework.
- **Many correctness and stability fixes**: cover incorrect query results, load data loss (such as Broker Load loading only the first file, and PostgreSQL DML being silently dropped), crashes, hangs, and resource leaks.

> Before upgrading, read the **Behavior Changes** section below, which contains several adjustments to default values and privileges.

# Behavior Changes

- **In compute-storage decoupled (cloud) mode, `enable_strict_consistency_dml` is now disabled by default** (#61891). If your workload relies on strict-consistency DML, explicitly enable this configuration after upgrading.
- **The default trigger threshold for Time Series Compaction is changed from 2000 to 1000** (#61979), so Compaction triggers more aggressively.
- **The default value of `segments_key_bounds_truncation_threshold` is changed to 36** (#61984).
- **Cluster Snapshot commands now require root privileges** (#60239).
- **JSONB and Variant columns are no longer allowed as Distribution Columns** (#63211). Such previously-incorrect usage is now rejected at table-creation time.

# New Features & Improvements

## Functions & Types

- Add the `mmhash3_u64_v2` hash function (#61846).
- Add the `json_object_flatten` scalar function for flattening nested JSON (#62825).
- Add a Lambda expression (functor) version of `array_sort` that supports custom sorting logic (#57828).
- The `max` / `min` aggregate functions now support the Array type, and `max_by` / `min_by` support some complex types (#58490, #58736).

## Query Optimization

- Limit the cost of not-null inference to reduce optimizer planning overhead for complex queries (#63318).
- Scale the `num_nulls` column statistic proportionally after partition pruning to improve row-count estimation accuracy (#62265).

## Storage & Compaction

- Add **Compaction task tracking**: query current Compaction tasks through a System Table and an HTTP API (#61696).
- Support adjusting the memtable flush thread pool size online, without restarting BE (#60423).
- Support adaptive Write Buffer sizing (#61810).
- Release unused memory earlier to reduce memory usage during load and write (#62185).

## Compute-Storage Decoupling (Cloud Mode)

- **Support read-write separation for Compaction** (#60310).
- Schedule recently-active Tablets first to improve cache hit rate and scheduling efficiency (#59539, #57200, #61562).
- Reduce `get_tablet_stats` RPC calls to the Meta Service to lower metadata-service pressure (#60543).
- Optimize the memory usage of CloudTabletStatMgr / CloudTabletRebalancer (#59776, #61318).
- Add the `enable_recycler` configuration to dynamically skip the Recycler (#63286).
- Support hot-reloading of File Cache microbench configuration (#58922).

## Lakehouse

- Iceberg supports IAM Role authentication for REST and S3 Tables (#60498).
- Paimon supports Jindo OSS and Token propagation (#62106).
- Support disabling View operations for the Iceberg REST Catalog (#63319).

## Data Lineage

- Introduce a Lineage SPI framework to support data lineage collection (#61004).

## Observability & Operations

- Add the `--drop_backends` parameter to `start_fe.sh` (#63306).
- Add a transaction write-amplification brpc metric for Sub Txn Load (#63545).
- Add bvar metrics for the Recycler Operation Log (#60520).
- Statistics collection now automatically skips overly-long string columns to reduce collection overhead (#62686).
- Remove the class histogram trace from the JDK17 startup parameters to avoid printing large amounts of logs during Full GC (#62422).

## Security & Authentication

- Hide Token and authentication information in BE Info during Stream Load (#60656, #59743).
- Improve the robustness and diagnostics of LDAP authentication (#61673).
- Upgrade dependencies with known security vulnerabilities (#62274).

# Important Bug Fixes

## Query Result Correctness

- Fix `INTERSECT` / `EXCEPT` losing NULL rows during predicate pushdown (#62299).
- Fix `count(null)` being incorrectly treated as `count(*)` (#62548).
- Fix a NoSuchElementException when `count` contains a `MATCH_ALL` expression (#62172).
- Fix incorrect results caused by losing a DateTimeV2 narrowing Cast during IN predicate simplification (#63343).
- Fix loss of the `IN_LIST` Runtime Filter predicate in Key Range scenarios (#62115).
- Fix materialized view rewriting merging partitions that the query does not need, which could cause incorrect results or performance issues (#63081).
- Fix the `no_use_cbo_rule` Hint being silently ignored (#62358).
- Fix FragmentMgr incorrectly canceling queries on a compute-storage decoupled Virtual Cluster (#62135).

## Views

- Fix `ALTER VIEW` definitions not being synchronized to Follower FEs when a COMMENT is specified (#61670).
- Fix incorrect query results caused by a View definition losing Variant subfields (#62907).
- Fix View columns losing colUniqueId under Lazy Materialization (#62533).
- Fix illegal Alias rewriting in View definitions (#63353).

## Functions & Types

- Fix several incorrect results related to TIMESTAMPTZ and Daylight Saving Time (DST): LEAD/LAG not preserving the type, spring-forward gap handling, DST fold branch selection, switching time-difference calculation to UTC semantics, and TopN Runtime Predicate support (#62779, #62945, #63034, #63161, #63220).
- Fix incorrect results for the `allow_zero_date` function (#61900).
- Fix incorrect results when casting a scientific-notation string to Decimal (#63119).
- Fix `from_olap_string` throwing an exception when it fails to parse a datetime; it now returns NULL instead (#63035).
- Fix incorrect integer inference and type resolution for user variables (#62524).

## Variant Type

- Fix Compaction failure when a Variant column has uid=0 in a keyless table (#62656).
- Fix Variant subcolumns being lost after a partial-column update in the Row Store (#62067).
- Fix a normalization issue when reading older-version single-segment dot-key subcolumns (#62409).
- Keep the first occurrence when a Variant JSON Path is duplicated (#63697).
- Optimize VariantStatsCaculator construction by skipping the full footer scan to improve performance (#62819).

## Load & Streaming

**Data Loss / Integrity**

- Fix Broker Load loading only the first file when multiple file paths are specified (#62969).
- Fix PostgreSQL DML being silently dropped after a job restart (#61481).
- Fix loss of S3 Offset and job statistics after an FE Checkpoint restart (#62449).
- Fix incorrect Java type restoration of Split boundaries when reading FE-persisted CDC Offsets (#63219).

**Hangs / Leaks**

- Fix a VNodeChannel `close_wait` hang (#58024).
- Fix a PostgreSQL Replication Slot leak caused by canceling a streaming job during pause/resume (#62010).
- Fix a memory leak caused by an InsertLoadJob being stuck in PENDING (#62890).

**Restart & Metadata**

- Fix streaming job properties not being parsed after an FE restart (#62298).
- Fix a StreamingInsertJob NPE during EditLog Replay (#62416).
- Fix Broker Load storage properties not being correctly rebuilt after Gson Replay (#63094).
- Fix loss of INSERT job statistics in `SHOW LOAD` after an FE restart (#62331).

**Routine Load / Parsing**

- Fix an NPE in Routine Load Kafka Meta requests (#63180).
- Fix an IllegalMonitorStateException in Routine Load when the coordinating BE restarts (#62892).
- Fix incorrect column parsing when a UTF-8 BOM CSV uses enclose (#62092).
- Fix an NPE and load-availability issues when Group Commit selects a Backend (#60652, #61555).
- Fix conflict validation between load properties and table properties for Broker Load / Routine Load (#58054).
- Fix `to_load_error_http_path` returning an incorrect URL in HTTPS mode (#61785).

## Storage & Compaction

- Fix BE crashes caused by Schema Cache concurrency issues related to OlapScanner (#61510, #62327).
- Fix an IOContext use-after-free crash (#59947).
- Fix reading older DecimalV2 Segments that are missing precision / frac (#63569).
- Fix blocking during async close polling of Packed Files (#62938).
- Fix an OpenMP concurrency-budget issue when building ANN vector indexes (#61313).

## Compute-Storage Decoupling (Cloud Mode)

- Fix several correctness issues during Schema Change: delete local Rowsets before `add_rowsets`, fill Version holes before running, normalize the Rowset graph before Delete Bitmap Capture, and add an `SC_COMPACTION_CONFLICT` error code to retry failures across V1 Compaction (#62256, #63443, #63981, #62272).
- Fix several Cache Warmup issues: lack of Packed File support, no retry after errors, NPEs on cancellation/expiration, and cache cleanup (#60375, #62886, #62805, #62839, #62941, #62931).
- Fix a `balanced_tablets_shards` memory leak and a Warmup inflight counting issue (#59093, #60480).
- Fix Recycler OOM caused by too many queued deletion tasks (#59331).
- Fix a race condition between the first dynamic-partition initialization and a concurrent `CREATE MATERIALIZED VIEW` (#62755).
- Fix exposing the internal `KV_TXN_MAYBE_COMMITTED` state to clients (#62244).
- Fix Meta Service logs not being printed in cloud mode (#61766).
- Fix `SHOW PROC` not showing the Cached Version of partitions (#60807).

## Lakehouse & External Data Sources

- Fix loss of predicate filtering when Native and JNI Readers are mixed in FileScanner (#61802).
- Fix a timezone offset issue for the Hive DATE type in external Readers (#61330).
- Fix loss of Query TVF column aliases across JDBC Catalogs (#61939).
- Fix incompatibility between `SHOW PARTITIONS` and the partitions TVF for external Catalogs (#62134).
- Fix an out-of-bounds crash when generating partition columns for Iceberg / Paimon tables (#62177).
- Fix several Parquet read/write issues: int96 Timestamp writing, Page V2 encoding, and conditional checks (#61832, #63779, #63305, #63509).
- Fix preloading Jindo for the Paimon Scanner (#62351).
- Fix a TVF returning an error when the Thrift message exceeds the size limit (#61788).

## File Cache & IO

- Fix a SIGSEGV crash caused by background LRU updates during cache cleanup (#60533).
- Fix temporary TTL expiration time being incorrectly anchored to the Tablet creation time (#62287).
- Fix the file handle cache Key not including the HDFS connection, which could cause connection mismatches (#63516).

## Metadata & Job System

- Fix `CANCEL ALTER` with an empty job list being mistakenly treated as canceling all Rollup jobs (#62712).
- Fix a sessionVariables null pointer after an upgrade (#61959).
- Fix `RestoreCommand` throwing an UnsupportedOperationException (#61890).
- Fix Binlog files still being linked when Binlog is not enabled (#61949).
- Fix auto-partition tables with `retention_count` not being correctly registered with the scheduler after a restart (#61954).
- Fix a Host mismatch when starting FE in `metadata_failure_recovery` mode (#62748).
- Fix being unable to run `SHOW TABLET` when no database is selected (#63280).
- Fix inconsistent column ordering in `SHOW BACKENDS` (#62207).
- Fix system tables returning unknown statistics (#62913).
- Fix Audit Log issues: UnboundAlias digest calculation, and internal query failures being mislabeled as ERR (#62160, #62997).
- Fix fe.out not being generated when using `start_fe.sh --console` (#61807).
- Fix the error message for `INSERT OVERWRITE` (#62555).

## Security & Authentication

- Fix Ranger column-level privileges being bypassed when combined with CTEs (#61741).
- Fix client IP authentication for Arrow Flight (#63506).
- Redact sensitive Headers in Stream Load logs (#62108).

## Stability & Misc

- Fix BE crashes caused by Runtime Filters with a shared Hash table (#63257).
- Fix a core dump caused by the inline static empty message in arrow::Status (#63191).
- Fix Arrow UTF8 / String size limit issues (#63137).
- Fix PartitionRebalancer generating illegal migrations to BEs that lack the required storage medium (#62206).
- Fix `jetty_server_max_http_header_size` not taking effect under Jetty 12 (#61197).
- Fix Prepared Statement QPS metrics not being counted when Audit Log is disabled (#61621).
- Fix the partition-near-limit metric by changing it from a Counter to a Gauge (#61845).
- Fix loading of the JNI log4j2 configuration (#63063).
- Track IO-layer read buffers through MemTrackerLimiter to improve memory observability (#62288).

> These notes focus on user-visible and operations-visible changes, and omit some purely-internal refactoring and fixes with no external symptoms. For the complete commit history, refer to the PR list for 4.0.6 in the apache/doris repository on GitHub.
