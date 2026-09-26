---
{
    "title": "Release 4.0.8",
    "language": "en",
    "description": "Apache Doris 4.0.8 release notes: a 4.0 maintenance release focused on compute-storage decoupled deployments, load and transaction stability, File Cache behavior, security hardening of internal endpoints, and Lakehouse compatibility."
}
---

# Overview

Apache Doris 4.0.8 is a maintenance release in the 4.0 series. It focuses on compute-storage decoupled deployments, load and transaction stability, File Cache behavior, security hardening of internal endpoints, and Lakehouse compatibility. All 4.0.x users are advised to upgrade.

Highlights of this release include:

- Security hardening: authentication and a configuration gate for the BE `_stream_load_forward` endpoint, an internal auth token for FE meta-service HTTP calls, auth checks on manager REST APIs, and masking of Kafka Routine Load credentials.
- Cloud enhancements: rendezvous hashing for colocate tablet placement, snapshot reads of the table version to avoid transaction conflicts, a bthread-aware tablet header lock, and a new mode that writes only index content into File Cache.
- Upgrade behavior: clusters upgrading from 3.x now enable the Nereids distribute planner instead of silently keeping the legacy one.
- Many correctness and stability fixes covering Group Commit, transactions, Routine Load, Paimon and Iceberg reads, File Cache, memory tracking, and several BE crash and deadlock paths.

> Before upgrading, read the Behavior Changes section below.

# Behavior Changes

- Upgrading to 4.0 now enables the Nereids distribute planner. A cluster whose variable version is below 400 previously restored a persisted `enable_nereids_distribute_planner=false` from its image and kept using the legacy distribute planner after the upgrade; the variable-version-400 migration now enables it (#66604).
- Compaction is no longer paused on high memory by default. Pausing made high-Compaction-Score tablets harder to merge, which reinforced the metadata and memory backlog it was meant to relieve (#61288).
- The BE `_stream_load_forward` endpoint is now registered only when the new BE configuration `enable_group_commit_streamload_be_forward` is enabled (default `false`), and it now requires authentication. Deployments that rely on Group Commit Stream Load forwarding must enable the configuration on both FE and BE (#64935).
- `autobucket_min_buckets` now defaults to 3 instead of 1, so the auto bucket strategy no longer computes a bucket count too small for reasonable parallelism and data distribution (#63729).
- The Recycler no longer enables `enable_mark_delete_rowset_before_recycle` or `enable_abort_txn_and_job_for_delete_rowset_before_recycle` by default, because the feature currently carries a performance cost (#66150).
- S3 `SlowDown` retry handling is configurable again and now differs by role: rate-limited retries remain enabled for BE clients and are disabled for the Recycler, refining the change made in 4.0.7 (#65508).
- The unused session variable `plan_nereids_dump` has been removed. It only applied to minidump replay and is now an internal flag set by `MinidumpUtils`, so `PLAY '<dumpfile>'` continues to work (#66371).
- In Cloud mode, tablet data size is consistently reported as remote size, so `SHOW TABLETS` and `information_schema.partitions` no longer diverge from `information_schema.backend_tablets` (#60887).
- In Cloud mode, `SHOW PROC '/colocation_group/{GroupId}'` now reports `ReplicaAllocation` as `NULL`, and `SHOW PROC '/cluster_health/tablet_health'` no longer reports `UNRECOVERABLE` because of local-mode health checks (#60944).

# New Features & Improvements

## Compute-Storage Decoupling

- Support writing only index content into File Cache through the new BE configuration `enable_file_cache_write_index_file_only` (default `false`). Rowset writes and Compaction outputs then protect Inverted Index files and Segment index and footer ranges, instead of polluting a limited local cache with large data pages (#64995).
- Use rendezvous hashing for colocate tablet placement (#64638).
- Add an option to skip File Cache writes during TopN lazy materialization (#65021).
- Use snapshot reads for the table-version hint in `commit_txn`, `commit_partition`, `commit_index` and `drop_partition`, removing the read-conflict range that made concurrent commits on the same table fail with `KV_TXN_CONFLICT` (#64647).
- Increase the get-version timeout to 30 seconds (#65625).
- Support multiple configuration files in `start.sh` (#63924).
- Add an HTTP API to synchronize and export Cloud FE metadata, allowing metadata backup across FE and FDB (#60739).

## Security & Access Control

- Add `fe_meta_auth_token` for FE meta-service internal HTTP authentication (#65551).
- Add auth checks for the manager node and query-error REST APIs (#65042).
- Mask sensitive Kafka properties of Routine Load jobs (#64786).
- Reset `skipAuth` on all `INSERT OVERWRITE` exit paths (#66383).

## Observability & Operations

- Show the first error message of a Routine Load job (#65553).
- Record the task finish time when a scheduled job execution fails (#66232).
- Add a virtual compute group switch metric (#63036).
- Add queue time for delete bitmap tasks (#65248).
- Show warm-up timestamps with the date (#64606).
- Report the root cause of a failed Iceberg metadata commit instead of the misleading `Self-suppression not permitted` message (#66417).
- Stop wrapping data and expression errors in a misleading "storage reader" message (#64755).
- Upgrade third-party dependencies (#62858, #64196, #64208).

## Performance

- Optimize the `information_schema.tables` status scan for large OLAP tables: BE now passes the required columns to FE, so lightweight queries no longer pay for tablet-derived status fields (#64933).
- Push down expandable S3 glob prefixes (#64684).
- Speed up the File Cache LRU restore path during BE startup (#65174).
- Cache the credentials provider in `ConfigurationAWSCredentialsProvider` for Glue catalogs (#65165).
- Reuse a single Ranger Doris access controller, so a metadata checkpoint no longer leaks two `PolicyRefresher` threads (#65570).

# Important Bug Fixes

## Query Result Correctness

- Verify injectivity before `SimplifyAggGroupBy` rewrites a `GROUP BY` expression (#64335).
- Reject a mismatched compare plan in `PullUpJoinFromUnionAll` (#65472).
- Guard `UniqueFunction` in the filter and TopN pushdown rules (#62742).
- Require the window function partition key chosen by the Partition TopN optimization to be a subset of the co-located keys (#64764).
- Fix missing precision and scale when reading legacy decimal data (#65419).
- Correct `from_base64` and `to_base64` output buffer sizing and invalid input handling (#65141).

## Load & Transactions

- Fix a lost row when a prepared statement reuses its plan and Group Commit shares one `load_id` (#64362).
- Avoid aborting a newer transaction that carries the same label (#64939).
- Fail fast when a Backend restarts during an INSERT (#65525).
- Handle generated columns in delete partial update (#64884).
- Fix Arrow Stream Load with uppercase column names (#65127).
- Support Compute Groups in FE Stream Load routing and planning (#65571).
- Skip decommissioning Backends when assigning load work (#65049).
- Let only load source scanners update load counters (#63781).
- Isolate schemas for CDC snapshot splits in streaming jobs (#65645).

## Compute-Storage Decoupling

- Exclude decommissioning Backends from Cloud replica routing, Routine Load assignment, and Kafka proxy selection (#65221).
- Prevent urgent load from preempting the Schema Change lock (#66082).
- Use a bthread-aware shared mutex for the tablet header lock. The write lock can be held across a suspending warm-up call, and a migrating bthread would otherwise unlock a `pthread_rwlock_t` from a different worker thread (#64574).
- Temporarily set `version_cache_ttl` to 0 when retrying a query that failed with -230 (#63721).
- Inspect and abort failed conflicting transactions while `CloudUpgradeMgr` waits (#60830).
- Preserve resource IDs when recycling empty Rowsets (#65862).
- Skip packed slice deletion while recycling Rowsets (#63295).
- Set `requestTimeoutMs` on the Recycler S3 client to avoid curl-28 errors on slow `DeleteObjects` calls (#64758).
- Make the S3 rate limiter configuration take effect dynamically in Cloud mode (#64554).
- Cancel rebuilt virtual compute group warm-up jobs when the group is dropped (#65426).
- Clear the warm-up error message after a successful retry (#64813).
- Fix the colocate replica allocation edit log (#65457).
- Resolve conflicting default replica properties, which could leave a stale `default.replication_num` in table metadata and make `SHOW CREATE TABLE` report the wrong default allocation (#65836).
- Fix a `SchemaVariablesScanner` crash caused by an incomplete FE response (#65994).

## File Cache & Storage

- Fix File Cache queue evict size metrics (#64897).
- Bound the LRU recorder shadow queue size (#64798).
- Handle asynchronous task submission failures in the S3 file writer (#64779).

## Lakehouse & External Data Sources

- Preserve Paimon partition metadata across splits. Partition metadata was generated only when runtime partition pruning was enabled, so count, native and JNI splits reached BE without stable partition values, and the reused prune block was corrupted by inserted replacement columns (#65583).
- Use the split file format for Iceberg scans (#65760).
- Preserve external table column name case for Iceberg and Paimon (#65094).
- Support an IOManager for Paimon JNI reads, and add Paimon JNI scanner observability (#65332, #65354).
- Validate task executor scan handles (#65054).
- Fix an Avro JNI reader crash on a null pointer (#64699).

## Memory & Stability

- Avoid a local Runtime Filter merge deadlock (#64866).
- Catch block serialization exceptions instead of letting BE core dump (#64852).
- Make secondary brpc package aliases non-owning, avoiding a double free during `brpc::Server` shutdown (#65777).
- Disable the SSL BIO buffer in brpc (#64962).
- Force a refresh of the Workload Group configuration when its memory limit changes (#65542).
- Update memory statistics more quickly when the user changes the cgroup limit directly (#65695).

## Protocol & Observability

- Fix FE memory issues in Arrow Flight SQL: close the temporary `VectorSchemaRoot` in `createPreparedStatement` (#65311), fix the remaining off-heap leaks (#66437), and keep the coordinator alive across `GetFlightInfo` and `DoGet` for external table scans (#64799).
- Serve `information_schema.routine_load_jobs` from the master FE, so `FIRST_ERROR_MSG` and `ERROR_LOG_URLS` are no longer empty when the query lands on a non-master FE (#65942).
- Guard execution profile access with the profile manager read lock (#65353).
- Fix the queued task count reported by the time-sharing executor (#63568).
- Fix a `-parameters` error thrown by the node action REST API, caused by a `PathVariable` annotation without a declared value (#59708).

> These notes focus on user-visible and operations-visible changes. Test-only commits, CI adjustments, external Docker environment work, release version updates, and purely internal changes without external symptoms are omitted. Refer to the complete 4.0.7 to 4.0.8-rc02 comparison for the full commit history.

# Acknowledgments

Thanks to all contributors whose pull requests are included in this release:

@0AyanamiRei @924060929 @BiteTheDDDDt @bobhan1 @CalvinKirs @deardeng @freemandealer @Gabriel39 @gavinchou @GJ100 @heguanhui @hello-stephen @hubgeter @jacktengg @JNSimba @Jungzhang @liaoxin01 @luwei16 @morningman @Mryange @mymeiyi @shuke987 @sollhui @stevenpall @suxiaogang223 @w41ter @wyxxxcat @xylaaaaa @yiguolei @yujun777 @zgxme @zhangstar333
