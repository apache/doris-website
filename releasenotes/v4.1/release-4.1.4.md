---
{
    "title": "Release 4.1.4",
    "language": "en",
    "description": "Here's the Apache Doris 4.1.4 release notes:"
}
---

# New Features

## AI & Search
- Support ANN indexes on Merge-on-Write tables (#67155)
- Support multimodal file embedding (#66461)

## Query & Execution
- Add adaptive global runtime filter tree publishing to support large cluster (#65599)
- Push down limits into CTE producers (#63675)
- Add partition-filter SQL block rules (#62196)

## Load & Streaming
- Add adaptive random-bucket load routing (#65450)
- Support forwarding group-commit Stream Load requests (#63594)
- Support compute-group routing and planning for Stream Load (#65571)
- Support OceanBase CDC streaming jobs (#65588)
- Detect PostgreSQL schema changes from Relation events (#64850)
- Support MySQL `ADD` and `DROP` schema changes in streaming jobs (#65325)

## Cloud Native
- Add MetaService RPC rate limiting in FE (#65694)
- Add memory governance for external metadata caches (#66717)
- Support `SHOW COMPUTE GROUPS` in non-cloud mode (#66697)
- Support tablet-level compaction through SQL (#66611)
- Add resource group success-quorum checks (#66751)

## Lakehouse
- Support altering Iceberg and Paimon table properties (#66428)
- Support Alibaba Cloud OSS Tables REST catalog (#66823)

## Security & Authentication
- Add TLS support for internal Doris communication (#64016)
- Add internal HTTP authentication between FE and MetaService (#66090)

## Other
- Add `queue_time_ms` to audit logs (#66641)

# Improvement

## Query & Execution
- Optimize MD5 with an AVX2 batch path (#63484)
- Improve percentile aggregate performance (#62520)
- Optimize hash join probe-side output performance (#65600)
- Optimize shuffle-key selection for Repeat decomposition (#66532)
- Deduplicate grouping scalar functions in Repeat projections (#65880)
- Infer set-operation distinctness from NDV statistics (#64618)
- Avoid underestimating `NOT IN` predicate row counts (#66632)
- Add instance IDs to hash join profiles (#66097)
- Add spill-read deserialization timing (#67041)
- Make random shuffle prefer local channels (#59431)

## Storage & Compaction
- Add remote-index byte metrics for the file cache (#65398)
- Add queue-time metrics for delete-bitmap tasks (#65523)
- Speed up file-cache LRU restoration at startup (#65174)
- Limit the file-cache LRU recorder shadow queue (#64798)
- Skip redundant TTL scans for non-TTL tablets (#65434)
- Add an option to disable file-cache writes during TopN lazy materialization (#66414)
- Disable file-cache writes after a remote-scan threshold is reached (#66479)
- Improve memory-limit refresh when cgroup settings change in serverless mode (#66463)
- Backport nullable-column and projection optimizations (#66586)

## Load & Streaming
- Optimize nullable-string deserialization in CSV and text load (#64476)
- Backpressure asynchronous group commit by per-table WAL count (#65362)

## Cloud Native
- Add S3 rate-limit observability (#64038)
- Add warm-up job count metrics on BE (#66136)
- Use rendezvous hashing for colocate-tablet placement (#64638)
- Add MetaService rate-limit dry-run observability (#66969)
- Add cloud-tablet rebalancer metrics (#66576)
- Presize global cloud-tablet route sets (#66447)
- Skip non-MoW tablets when calculating TopN delete-bitmap scores (#65964)

## Lakehouse
- Cache credentials providers in the Hadoop S3A glue layer (#65165)
- Use credential-aware Hadoop FileSystem cache keys (#65586)
- Accelerate fixed-binary decimal decoding in Parquet (#66379)
- Improve nullable selection planning for fragmented Parquet batches (#66397)

# Bugfix

## AI & Search
- Fix crashes caused by null-query inverted-index predicates (#65138)
- Split bound multi-segment inverted-index readers (#63138)
- Fix CLucene multi-segment `readBlock` handling (#66736)
- Reject inverted-index terms containing embedded NUL bytes (#67179)
- Disable the DSL cache for score queries (#65436)
- Validate nested Variant `MATCH` predicates (#66207)
- Fix index lookup after indexes are removed (#66316)
- Preserve atomicity when appending nested Variant values (#66421)
- Recognize nullable array elements as NestedGroup types (#66196)
- Prefer sparse Variant fields over root values (#65660)
- Serve shredded Variant leaves without rebuilding the root (#66941)
- Preserve NestedGroup access paths through `explode` (#67022)
- Avoid recursion when the ANN IVF-list cache is absent (#67024)

## Query & Execution
- Fix analytic partition keys overflowing before conversion to 64-bit columns (#65240)
- Guard execution-profile access during concurrent teardown (#65442)
- Fix duplicate join nodes produced by `PushDownAggThroughJoinOnPkFk` (#65172)
- Guard `UniqueFunction` handling in filter and TopN pushdown rules (#62742)
- Enable pre-aggregation for multi-argument aggregates with all-key distinct inputs (#65846)
- Fix missing decimal precision and scale for legacy decimal data (#65419)
- Materialize constant columns before block merge (#65770)
- Use serialized hash keys for complex types (#66777)
- Fix blocking-queue waiter accounting (#65827)
- Fix unsafe eager-aggregation nullability conversions (#66208)
- Fix duplicate aggregate functions pushed through projects (#66531)
- Preserve `NULL` in pushed-down CHAR `MIN` and `MAX` (#65952)
- Fix invalid semi-join transpose when the lower join is a mark join (#66574)
- Drop invalid functional dependencies from the outer side of joins (#65982)
- Prevent unsafe CTE runtime-filter pushdown (#65247)
- Suppress invalid unique constraints in scan functional-dependency derivation (#66801)
- Fix TIMESTAMPTZ nullable type equality (#66722)
- Fix TIMESTAMPTZ values in `COALESCE` (#66689)
- Preserve TIMESTAMPTZ user-variable types (#66833)
- Handle DST fallback in timestamp-cast monotonicity (#65903)
- Accept spaced TIMESTAMPTZ offsets in range-partition bounds (#66292)
- Return Arrow and Thrift DATETIME values as naive timestamps (#67027, #67232)
- Correct the Flight SQL `GetTables` schema and TIMESTAMPTZ Arrow reader (#66344)
- Fix `count_substrings` tail overmatching (#63215)
- Avoid ICU default-locale contention in functions (#66440)
- Keep multi-match regex cache ownership alive (#66909)
- Prevent `explode_bitmap` crashes when output size exceeds `INT_MAX` (#66034)
- Skip CHAR payload checks for `NULL` rows (#67043)
- Restore null-literal return-type handling (#66280)
- Stop strict-mode string casts from attaching `NULL` rows to the next value (#66952)
- Materialize constant virtual columns before caching (#67112)
- Handle case-insensitive auto-partition function arguments (#67121)
- Preserve nested paths during lazy row-ID fetch (#67205)
- Handle empty row-ID fetch RPC failures in TopN (#66443)
- Key UDF class caches by function ID and clean them up in cloud mode (#67046)

## Storage & Compaction
- Preserve shortest round-trip representations for FLOAT and DOUBLE ZoneMaps (#65302)
- Fix floating-point equality during Parquet pruning (#66470)
- Fix sparse vertical-compaction destination offsets (#66306)
- Reject transaction preparation on tablets that are shutting down (#66448)
- Clean up spill directories during query teardown (#66458)
- Avoid scan-executor use-after-free during shutdown (#65220)
- Pass tablet IDs explicitly through file-reader and packed-file cache contexts (#61683, #65701)
- Avoid converting segment-cache blocks to index-cache blocks (#65905)
- Fix BE memory leaks after failed schema-change jobs (#56207)
- Fix `PublishVersionDaemon` thread-pool leaks (#60720)
- Make nullable hash-state updates exception-safe (#66517)
- Synchronize access to load error logs (#66250)
- Fix cache lookup failures after an OLAP partition is dropped (#65889)
- Skip file cache for HTTP chunk-response readers (#66932)

## Load & Streaming
- Respect profile levels for load-writer details (#64978)
- Fix Arrow Stream Load with uppercase column names (#65617)
- Fail fast when a backend restarts during INSERT (#65525)
- Skip decommissioning backends during load routing (#65406)
- Correct quorum participants for incremental load streams (#66016)
- Fix stream-receiver leaks racing with `close_load` (#65584)
- Fix broker-load label self-conflicts during pending retries (#66469)
- Recover Broker Load jobs whose transactions are already visible (#66987)
- Clear transaction IDs after aborting Broker Load transactions (#66884)
- Encode CDC Stream Load records as UTF-8 (#66771)
- Prevent MySQL CDC data loss on non-GTID keepalive reconnects (#66998)
- Isolate schemas across CDC snapshot splits (#65645)
- Keep CDC end offsets consistent with current progress (#65688)
- Normalize MySQL JDBC URLs used by streaming jobs (#65647)
- Avoid applying a global BE authentication precheck to Stream Load (#66629)
- Report Stream Load size limits in MiB (#66224)
- Remove the unsupported Workload Policy action that mutates session variables (#64856)

## Cloud Native
- Retry MetaService `too busy` responses (#65378)
- Set a recycler S3 request timeout to avoid slow `DeleteObjects` failures (#64758)
- Preserve resource IDs when recycling empty rowsets (#65862)
- Skip packed-slice deletion while recycling rowsets (#65533)
- Fix local and remote tablet-size semantics in schema views (#60887)
- Normalize storage and replica fields in `SHOW PARTITIONS` (#60871)
- Align colocate proc output and tablet-health reporting in cloud mode (#60944)
- Exclude decommissioning backends from cloud backend selection (#65221)
- Prevent urgent loads from preempting schema-change locks (#66082)
- Skip unnecessary MetaService tablet updates after table-property changes (#65983)
- Prevent older clients from treating unknown MetaService status codes as success (#64148)
- Fail closed on unknown MetaService response codes (#66364)
- Skip rowset promotion for incomplete lazy commits (#66253)
- Track deleted-instance recycling status and retain instance tombstones (#66519, #66870)
- Recycle delete-bitmap packed files with correct blob reads and reference counts (#66728, #66919)
- Only mark prepared rowsets before recycling (#65550)
- Skip versioned delete-bitmap cleanup for non-MoW tablets (#67084)
- Separate HTTP encoding for recycler job and check keys (#67243)
- Drop stale CloudReplica routes after compute groups are deleted (#66984)
- Fix `SchemaVariablesScanner` crashes on incomplete FE responses (#65994)
- Use a bthread-aware shared mutex for tablet-header locks (#66020)
- Fix schema-change alter-version capture in cloud mode (#62506)
- Restrict runtime FE configuration updates to root in cloud mode (#66478)
- Resolve conflicting default replica properties (#65836)
- Exclude zero-size tablets from backend balancing (#66499)
- Inspect and abort failed conflicting transactions during cloud upgrades (#60830)
- Cancel rebuilt virtual-compute-group warm-up jobs when the group is dropped (#65426)
- Fix rollback handling when adding partitions (#64650)

## Lakehouse
- Fix MaxCompute `IN` predicate pushdown polarity (#65083)
- Improve MaxCompute catalog validation (#64119)
- Preserve external partition metadata in multi-catalog queries (#66012)
- Invalidate stale Hive file-cache entries after partition refresh (#65334)
- Safely publish Hadoop catalog properties (#66392)
- Resolve missing remote JDBC table names during schema lookup (#65718)
- Harden JDBC driver URL validation and remove the file-upload HTTP API (#67149)
- Decode ORC timestamps through the standard SerDe path (#64807)
- Preserve nested nullability in Parquet predicate scans (#66799)
- Safely prune nested Parquet columns with Bloom filters (#66471)
- Fix Iceberg Merge-on-Read crashes with row-ID lazy reads (#66506)
- Avoid BE aborts when evaluating Iceberg partition predicates (#66835)
- Use the split file format when scanning Iceberg tables (#65760)
- Delete external data files after failed writes to prevent orphan files (#64678)
- Preserve Paimon partition metadata across splits (#65581)
- Handle special characters in Paimon partition values (#65904)

## Security & Authentication
- Require authorization and an explicit configuration gate for `_stream_load_forward` (#65377)
- Mask Kafka Routine Load sensitive properties (#64786)
- Hide Stream Load tokens and authentication data from BE information endpoints (#60656, #59743)
- Escape audit-log record separators to prevent row forgery (#66580)
- Mask sensitive fields in encryption-key schema tables (#66834)
- Mask private-key passwords in backend configuration (#66836)
- Mask credentials in authentication and Stream Load logs (#66917)
- Stop writing Arrow Flight bearer tokens to `fe.log` (#67146)

## Materialized Views
- Fix scan-materialization pattern-context checks (#65414)
- Distinguish partition compensation from `UNION ALL` rewrite (#66445)
- Reduce master FE CPU usage when serializing MTMV task TVF information (#66792)
- Optimize MTMV partition-lineage checks (#63899)
- Avoid invalid slot casts in MV null-reject compensation (#66613)
- Refresh MTMVs after excluded trigger tables change (#64041)

## Other
- Fix Arrow Flight SQL direct-memory leaks in prepared statements (#65311)
- Fix task finish timestamps when scheduled jobs fail (#66232)
- Guard query-instance metrics before metric repository initialization (#62762)
- Remove query profiles from HDFS file readers (#67293)
