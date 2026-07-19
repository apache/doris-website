---
{
    "title": "High-Concurrency Point Query",
    "language": "en",
    "description": "How to enable high-concurrency point queries in Doris? Significantly improve primary-key point-query QPS and response latency through row store, short-circuit path, PreparedStatement, and row cache.",
    "keywords": [
        "Doris high-concurrency point query",
        "primary-key point-query optimization",
        "PreparedStatement",
        "row store store_row_column",
        "Merge-On-Write point query",
        "SHORT-CIRCUIT short path",
        "row cache",
        "FE high CPU point-query bottleneck"
    ]
}
---

<!-- Knowledge type: Capability definition / Configuration parameter / Performance tuning -->
<!-- Applicable scenarios: High-concurrency primary-key point queries, KV-style queries, low-latency online services -->

## What Is a High-Concurrency Point Query

A high-concurrency point query is a dedicated optimization capability in Doris for **primary-key equality query** scenarios. In high-concurrency service scenarios, users want to fetch a whole row of data from the system by primary key. However, Doris's default columnar storage format and query planning path are not well suited to this kind of KV-style request.

To address this, Doris applies optimizations at the following layers:

| Optimization | Problem solved |
| -------------------- | ----------------------------------------------------------- |
| Row Store | Columnar storage amplifies random IO when reading whole rows of wide tables; row store reduces IO overhead |
| Short-Circuit query path (SHORT-CIRCUIT) | FE query planning and parsing is too heavy for simple queries; the short-circuit path bypasses the regular planning flow |
| PreparedStatement | SQL parsing and expression evaluation consume FE CPU; caching the plan and expressions reduces overhead |
| Row Cache | The Page Cache is easily evicted by large queries; a dedicated row cache improves hit rate |

## Quick Enablement Checklist

Before using high-concurrency point queries, confirm that all of the following conditions are met:

- The table uses the **Unique Key model** with `enable_unique_key_merge_on_write = true` enabled
- `store_row_column = true` is set at table creation to enable row store
- `light_schema_change = true` is enabled at table creation
- The query contains only **equality conditions on Key columns**, with no joins or nested subqueries
- The JDBC URL has `useServerPrepStmts=true` enabled to use PreparedStatement
- (Optional) BE configuration `disable_storage_row_cache = false` is set to enable row cache
- Use `EXPLAIN` to verify that the execution plan contains the `SHORT-CIRCUIT` marker

## Row Store

<!-- Knowledge type: Configuration parameter -->

Row store mode is used to reduce the random IO overhead when reading whole rows of wide tables. The current implementation encodes a row of data and stores it in a separate column.

- It can only be enabled **at table creation** and cannot be modified afterwards.
- Specify the following property in the `PROPERTIES` of the `CREATE TABLE` statement:

```sql
"store_row_column" = "true"
```

- Enabling row store causes space inflation. **Starting from Doris 3.0**, if only some columns need to be queried, it is recommended to use `row_store_columns` to include only the required columns in the row store:

```sql
"row_store_columns" = "key,v1,v2"
```

Queries only need to access these columns, for example:

```sql
SELECT k1, v1, v2 FROM tbl_point_query WHERE k1 = 1;
```

## Point-Query Optimization Under the Unique Model

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Primary-key point-query table creation -->

After both Merge-On-Write and row store are enabled on the Unique model, primary-key point queries automatically take the **short-circuit path**, optimizing SQL execution so that only one RPC is required to complete the query.

### Table Creation Example

```sql
CREATE TABLE `tbl_point_query` (
    `k1` int(11) NULL,
    `v1` decimal(27, 9) NULL,
    `v2` varchar(30) NULL,
    `v3` varchar(30) NULL,
    `v4` date NULL,
    `v5` datetime NULL,
    `v6` float NULL,
    `v7` datev2 NULL
) ENGINE=OLAP
UNIQUE KEY(`k1`)
COMMENT 'OLAP'
DISTRIBUTED BY HASH(`k1`) BUCKETS 1
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1",
    "enable_unique_key_merge_on_write" = "true",
    "light_schema_change" = "true",
    "store_row_column" = "true"
);
```

### Key Constraints and Notes

| Constraint / Property | Description |
| ---------------------------------- | -------------------------------------------------------------------- |
| `enable_unique_key_merge_on_write` | Must be enabled. The storage engine relies on this property for fast primary-key point queries |
| `light_schema_change` | Must be enabled. Primary-key point queries depend on its `column unique id` to locate columns |
| Query conditions | Only single-table **equality queries** on Key columns are supported. Joins and nested subqueries are not supported |
| Predicate form | The `WHERE` clause must contain **only equality conditions on Key columns**, which can be regarded as a KV-style query |
| Row store space | Enabling row store causes space inflation. From 3.0+, it is recommended to use `row_store_columns` to specify a subset of columns |

For example, `SELECT * FROM tbl_point_query WHERE k1 = 123` meets the conditions and takes the short-circuit optimization path.

## Using PreparedStatement

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: FE CPU becomes the point-query bottleneck -->

To reduce the overhead of SQL parsing and expression evaluation, Doris provides a `PreparedStatement` feature on the FE side that is **fully compatible** with the MySQL protocol (currently only primary-key point queries are supported).

- Once enabled, SQL and expressions are computed in advance and cached in a session-level memory cache.
- Subsequent queries reuse the cached objects directly, avoiding repeated parsing and computation.
- When CPU is the bottleneck for primary-key point queries, enabling `PreparedStatement` can deliver a performance improvement of **more than 4x**.

### Step 1: Enable Server-Side PreparedStatement in the JDBC URL

```text
url = jdbc:mysql://127.0.0.1:9030/ycsb?useServerPrepStmts=true
```

### Step 2: Use PreparedStatement in Code

```java
// use `?` for placement holders, readStatement should be reused
PreparedStatement readStatement = conn.prepareStatement("select * from tbl_point_query where k1 = ?");
...
readStatement.setInt(1, 1234);
ResultSet resultSet = readStatement.executeQuery();
...
readStatement.setInt(1, 1235);
resultSet = readStatement.executeQuery();
...
```

## Enabling Row Cache

<!-- Knowledge type: Configuration parameter -->
<!-- Applicable scenarios: Low row-store hit rate, Page Cache easily evicted -->

By default, Doris provides a **Page-level cache**, where each page stores data for a single column, so the Page Cache is column-oriented. For row store, a row contains multiple columns, and the cache may be flushed by large queries.

To improve the hit rate, Doris introduces a separate **Row Cache** that reuses the LRU Cache mechanism to control memory usage. Enable it through the following BE configurations:

| Configuration | Default | Description |
| ---------------------------- | ---------- | --------------------------------- |
| `disable_storage_row_cache` | `true` (disabled by default) | Whether to disable row cache. Set to `false` to enable |
| `row_cache_mem_limit` | `20%` | Percentage of memory used by the Row Cache |

## Performance Tuning Recommendations

<!-- Knowledge type: Performance tuning -->

After the capabilities above are enabled, you can further improve point-query throughput and stability based on your deployment architecture:

1. **Increase the number of Observer nodes**: Adding more Observers is generally an effective way to improve query-handling capacity.
2. **Query load balancing**: If the FE receiving point-query requests has high CPU usage or slows down, use JDBC Load Balance to distribute requests across multiple nodes. You can also use other solutions such as Nginx or ProxySQL.
3. **Direct point-query requests to Observers**: Reducing the number of point-query requests sent to the FE Master generally alleviates fluctuations in FE Master query latency, leading to better performance and stability.

## FAQs

### Q1: How can I confirm that the configuration is correct and that high-concurrency point queries use the short-circuit optimization?

Run `EXPLAIN`. If `SHORT-CIRCUIT` appears in the execution plan, the short-circuit optimization is in use:

```sql
mysql> explain select * from tbl_point_query where k1 = -2147481418 ;
+-----------------------------------------------------------------------------------------------+
| Explain String(Old Planner)                                                                   |
+-----------------------------------------------------------------------------------------------+
| PLAN FRAGMENT 0                                                                               |
|   OUTPUT EXPRS:                                                                               |
|     `test`.`tbl_point_query`.`k1`                                                             |
|     `test`.`tbl_point_query`.`v1`                                                             |
|     `test`.`tbl_point_query`.`v2`                                                             |
|     `test`.`tbl_point_query`.`v3`                                                             |
|     `test`.`tbl_point_query`.`v4`                                                             |
|     `test`.`tbl_point_query`.`v5`                                                             |
|     `test`.`tbl_point_query`.`v6`                                                             |
|     `test`.`tbl_point_query`.`v7`                                                             |
|   PARTITION: UNPARTITIONED                                                                    |
|                                                                                               |
|   HAS_COLO_PLAN_NODE: false                                                                   |
|                                                                                               |
|   VRESULT SINK                                                                                |
|      MYSQL_PROTOCAL                                                                           |
|                                                                                               |
|   0:VOlapScanNode                                                                             |
|      TABLE: test.tbl_point_query(tbl_point_query), PREAGGREGATION: ON                         |
|      PREDICATES: `k1` = -2147481418 AND `test`.`tbl_point_query`.`__DORIS_DELETE_SIGN__` = 0  |
|      partitions=1/1 (tbl_point_query), tablets=1/1, tabletList=360065                         |
|      cardinality=9452868, avgRowSize=833.31323, numNodes=1                                    |
|      pushAggOp=NONE                                                                           |
|      SHORT-CIRCUIT                                                                            |
+-----------------------------------------------------------------------------------------------+
```

### Q2: How can I confirm that PreparedStatement is in effect?

After sending a request to Doris, find the corresponding query request in `fe.audit.log`. If `Stmt=EXECUTE()` appears, PreparedStatement is in effect:

```text
2024-01-02 11:15:51,248 [query] |Client=192.168.1.82:53450|User=root|Db=test|State=EOF|ErrorCode=0|ErrorMessage=|Time(ms)=49|ScanBytes=0|ScanRows=0|ReturnRows=1|StmtId=51|QueryId=b63d30b908f04dad-ab4a
3ba21d2c776b|IsQuery=true|isNereids=false|feIp=10.16.10.6|Stmt=EXECUTE(-2147481418)|CpuTimeMS=0|SqlHash=eee20fa2ac13a4f93bd4503a87921024|peakMemoryBytes=0|SqlDigest=|TraceId=|WorkloadGroup=|FuzzyVariables=
```

### Q3: Can non-primary-key queries use the special high-concurrency point-query optimization?

No. High-concurrency point queries only target **equality queries on Key columns**, and the query **must not contain joins or nested subqueries**.

### Q4: Is `useServerPrepStmts` useful for ordinary queries?

PreparedStatement currently takes effect **only for primary-key point queries**.

### Q5: Do I need to set the optimizer choice globally?

No. When using PreparedStatement for queries, Doris automatically selects the best-performing query method, with no need to set the optimizer manually.

### Q6: What should I do when the FE becomes the bottleneck?

If FE CPU usage is too high (`%CPU` is high), it is recommended to enable the following load-balancing and caching configurations in the JDBC URL:

```text
jdbc:mysql:loadbalance://[host1][:port],[host2][:port][,[host3][:port]]/${tbl_name}?useServerPrepStmts=true&cachePrepStmts=true&prepStmtCacheSize=500&prepStmtCacheSqlLimit=1024
```

| Parameter | Purpose |
| ----------------------- | ---------------------------------------------------------- |
| `loadbalance` | Ensures multiple FEs can serve requests. The more FEs, the better (deploy one instance per node) |
| `useServerPrepStmts` | Reduces FE parsing and planning overhead |
| `cachePrepStmts` | Caches PreparedStatement on the client side, avoiding frequent prepared requests to the FE |
| `prepStmtCacheSize` | Sets the maximum number of cacheable query templates |
| `prepStmtCacheSqlLimit` | Sets the maximum length of a single cached SQL template |

### Q7: How can I optimize query performance under the storage-compute separation deployment?

You can adjust from the following two directions:

- **Disable snapshot point queries**:

    ```sql
    SET GLOBAL enable_snapshot_point_query = false;
    ```

    Point queries fetching the version from Meta Service incur an extra RPC, and Meta Service can easily become a bottleneck under high QPS. Setting it to `false` speeds up queries but reduces data visibility (**balance performance against visibility**).

- **Enable Base Compaction output cache**: Set the BE parameter `enable_file_cache_keep_base_compaction_output=1` so that the result data after Base Compaction is placed into the cache, avoiding query jitter caused by remote access.
