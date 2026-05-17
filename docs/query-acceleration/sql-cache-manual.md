---
{
    "title": "SQL Cache Query Cache Guide",
    "sidebar_label": "SQL Cache",
    "language": "en",
    "description": "How do you enable SQL Cache in Doris? How do you troubleshoot cache misses and invalidation? This guide covers the principles, configuration, monitoring, and troubleshooting.",
    "keywords": ["Doris SQL Cache", "query cache", "query acceleration", "cache hit", "cache invalidation", "enable_sql_cache", "T+1 query optimization"]
}
---

<!-- Knowledge type: concept + how-to guide -->
<!-- Applicable scenario: users who want to accelerate repeated queries by caching query results -->

SQL Cache is the query result caching mechanism provided by Doris. It caches query results keyed by metadata such as the SQL text and data version, so that subsequent identical queries are returned directly from the cache. This significantly reduces the overhead of repeated computation.

## Pre-reading checklist

Before reading this guide, confirm that you understand or have prepared the following:

- Whether your query scenario is a good fit for caching (for example, T+1 offline analytics or data with low update frequency)
- Whether your current Doris version supports viewing SQL Cache via `explain plan` (2.1.3+ recommended)
- Whether you understand that SQL Cache only supports OlapTable internal tables and Hive external tables
- Whether you understand that nondeterministic functions (such as `now()` and `random()`) affect the cache hit rate
- Whether you have permission to modify FE/BE configuration (used for memory control and the global switch)

Before deciding whether to enable SQL Cache, check item by item that your queries meet the following conditions:

- The SQL statements are **executed repeatedly** at high frequency
- The data is **updated infrequently** (high cache hit rate)
- The queries **do not contain** random functions (such as `random()`)
- The **metric fields are consistent** across each query (no dynamic addition or removal)

## 1. Concept introduction

<!-- Knowledge type: concept -->
<!-- Applicable scenario: first-time understanding of how SQL Cache works -->

SQL Cache is suitable for query scenarios where the **data is updated infrequently**. It avoids repeated computation by caching query results.

### Key factors for cache hits

SQL Cache uniquely identifies a piece of cached data based on the combination of the following factors:

| Key factor                            | Description                                          |
| ------------------------------------- | ---------------------------------------------------- |
| SQL text                              | An exactly identical SQL string                      |
| View definition                       | The DDL definition of any views involved             |
| Table and partition versions          | Whether the data has been changed                    |
| User variables and their values       | The current values of variables referenced in the SQL |
| Nondeterministic functions and their results | The computed results of functions such as `now()` and `random()` |
| Row policy definition                 | Row Policy configuration                             |
| Data masking definition               | Data Masking configuration                           |

> If any factor changes (such as SQL rewrites, different query fields or conditions, or version changes caused by data updates), the cache will not be hit. For multi-table Join queries, an update to **any one of the tables** changes the partition ID or version number, which makes the cache unable to hit.

### Applicable scenarios

- **Strongly recommended**: T+1 update scenarios. The data is updated overnight; the first query fetches the result from BE and writes it to the cache, and subsequent identical queries are returned directly from the cache.
- **Optional**: Real-time updated data. You can still enable SQL Cache, but the hit rate will be low.
- **Supported scope**: Currently supports OlapTable internal tables and Hive external tables.

## 2. Limitations

<!-- Knowledge type: limitation -->
<!-- Applicable scenario: optimizing the cache hit rate when writing SQL -->

### Impact of nondeterministic functions

**Definition**: A nondeterministic function is a function whose result has no fixed relationship with its input parameters.

| Function       | Behavior                                                  | Can it use the cache             |
| -------------- | --------------------------------------------------------- | -------------------------------- |
| `now()`        | Returns the current second-level time, changes once per second | Reusable within the same second |
| `date(now())`  | Converts second-level time to day-level granularity       | Reusable within the same day (recommended) |
| `random()`     | Returns a different result on every call                  | Almost never hits the cache      |

**Optimization tip**: Convert fine-grained time to coarse-grained time. For example, use `select * from tbl where dt = date(now())` instead of `select * from tbl where dt = now()`, so that all queries within the same day can hit the cache. Avoid using strongly nondeterministic functions such as `random()` in queries.

### Impact of metric field expansion

SQL Cache caches results strictly by the queried fields. It **does not support** satisfying a "more metrics" query with a "fewer metrics" cache.

| Scenario                                                       | Behavior                                                  | Impact                                                  |
| -------------------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------- |
| The result of 2 metrics has been cached, and a new query requests 3 metrics | The cache cannot be reused, and the query must be re-executed | The hit rate drops, and the new result is written to a new cache entry |

**Optimization tip**: Keep the metric fields of business-side reports and query templates stable. If you need to add metrics, modify the query template instead of expanding it ad hoc, so that the cache is not made unusable.

## 3. Implementation principles

<!-- Knowledge type: principle -->
<!-- Applicable scenario: understanding cache hit behavior and locating anomalies -->

### FE implementation

The processing flow after FE receives a query request:

1. **Metadata lookup**: Look up metadata in memory using the SQL string as the key (the metadata contains the table/partition versions).
2. **Version comparison**: If the metadata is unchanged, the data has not been changed and the cache can be reused.
3. **Skip parsing**: Skip the SQL parsing and optimization process, and locate the corresponding BE based on consistent hashing.
4. **Result return**:
    - Cache hit on BE: Return the result directly to the client.
    - Cache miss: Execute the full SQL parsing, optimization, and computation flow.
5. **Result write-back**: After BE finishes the computation, FE stores the result on the corresponding BE and records the metadata in its own memory for reuse by the next query.

> Special optimization: If the SQL optimization phase determines that the result contains only 0 or 1 row, FE saves the result directly in its own memory to accelerate subsequent identical queries.

### BE implementation

- A BE is selected via **consistent hashing** to store the result. The result is stored in BE memory in a **HashMap** structure.
- When reading from or writing to the cache, a digest of metadata such as the SQL string is used as the key to quickly retrieve the result data.

## 4. Quick start

<!-- Knowledge type: how-to guide -->
<!-- Applicable scenario: enabling SQL Cache and verifying cache hits -->

### Step 1: Enable or disable SQL Cache

**Purpose**: Enable SQL Cache at the session or global level (disabled by default).

```sql
-- Turn on SQL Cache in the current session; it is off by default
set enable_sql_cache=true;
-- Turn off SQL Cache in the current session
set enable_sql_cache=false;

-- Turn on SQL Cache globally; it is off by default
set global enable_sql_cache=true;
-- Turn off SQL Cache globally
set global enable_sql_cache=false;
```

**Notes**: Session-level configuration only takes effect for the current session. Global configuration takes effect for all newly created sessions.

### Step 2: Check whether a query hits the SQL Cache

#### Method A: Use `explain plan` (applicable to Doris 2.1.3+)

**Purpose**: Determine whether the cache is hit using the query plan.
**Command**: Run `explain plan <your SQL>`.
**Notes**: When a `LogicalSqlCache` or `PhysicalSqlCache` node appears in the query plan tree, the query has hit the SQL Cache.

```sql
> explain plan select * from t2;

+------------------------------------------------------------------------------------------------------------+
| Explain String(Nereids Planner)                                                                            |
+------------------------------------------------------------------------------------------------------------+
| ========== PARSED PLAN (time: 28ms) ==========                                                             |
| LogicalSqlCache[1] ( queryId=711dea740e4746e6-8bc11afe08f6542c )                                           |
| +--PhysicalResultSink[39] ( outputExprs=[id#0, name#1] )                                                   |
|    +--PhysicalOlapScan[t2]@0 ( stats=12 )                                                                  |
|                                                                                                            |
| ========== ANALYZED PLAN  ==========                                                                       |
| LogicalSqlCache[1] ( queryId=711dea740e4746e6-8bc11afe08f6542c )                                           |
| +--PhysicalResultSink[39] ( outputExprs=[id#0, name#1] )                                                   |
|    +--PhysicalOlapScan[t2]@0 ( stats=12 )                                                                  |
|                                                                                                            |
| ========== REWRITTEN PLAN  ==========                                                                      |
| LogicalSqlCache[1] ( queryId=711dea740e4746e6-8bc11afe08f6542c )                                           |
| +--PhysicalResultSink[39] ( outputExprs=[id#0, name#1] )                                                   |
|    +--PhysicalOlapScan[t2]@0 ( stats=12 )                                                                  |
|                                                                                                            |
| ========== OPTIMIZED PLAN  ==========                                                                      |
| PhysicalSqlCache[3] ( queryId=711dea740e4746e6-8bc11afe08f6542c, backend=192.168.126.3:9051, rowCount=12 ) |
| +--PhysicalResultSink[39] ( outputExprs=[id#0, name#1] )                                                   |
|    +--PhysicalOlapScan[t2]@0 ( stats=12 )                                                                  |
+------------------------------------------------------------------------------------------------------------+
```

#### Method B: View the Profile (applicable to versions before Doris 2.1.3)

**Purpose**: Confirm cache hits in versions that do not support `explain plan`.
**Command**: Enable Profile and view the Execution Summary.
**Notes**: If the `Is Cached:` field shows `Yes`, the query has hit the SQL Cache.

```sql
Execution  Summary:
      -  Parse  SQL  Time:  18ms
      -  Nereids  Analysis  Time:  N/A
      -  Nereids  Rewrite  Time:  N/A
      -  Nereids  Optimize  Time:  N/A
      -  Nereids  Translate  Time:  N/A
      -  Workload  Group:  normal
      -  Analysis  Time:  N/A
      -  Wait  and  Fetch  Result  Time:  N/A
      -  Fetch  Result  Time:  0ms
      -  Write  Result  Time:  0ms
      -  Doris  Version:  915138e801
      -  Is  Nereids:  Yes
      -  Is  Cached:  Yes
      -  Total  Instances  Num:  0
      -  Instances  Num  Per  BE:  
      -  Parallel  Fragment  Exec  Instance  Num:  1
      -  Trace  ID:  
      -  Transaction  Commit  Time:  N/A
      -  Nereids  Distribute  Time:  N/A
```

## 5. Metric monitoring

<!-- Knowledge type: observability -->
<!-- Applicable scenario: monitoring cache usage and evaluating optimization effects -->

### FE monitoring metrics

**Endpoint**: `http://${FE_IP}:${FE_HTTP_PORT}/metrics`
**Notes**: Metric statistics are **monotonically increasing**. After an FE restart, the count starts again from 0.

```Plain
# 1 SQL has been written to the cache
doris_fe_cache_added{type="sql"} 1

# The SQL Cache has been hit 2 times
doris_fe_cache_hit{type="sql"} 2
```

### BE monitoring metrics

**Endpoint**: `http://${BE_IP}:${BE_HTTP_PORT}/metrics`
**Notes**: Different caches may be stored on different BEs. You must collect metrics from **all BEs** to get the complete picture.

```Plain
# There are currently 1205 caches in the memory of this BE
doris_be_query_cache_sql_total_count 1205

# All caches currently take up about 44KB of BE memory
doris_be_query_cache_memory_total_byte 44101
```

## 6. Memory control

<!-- Knowledge type: parameter configuration -->
<!-- Applicable scenario: limiting the memory used by SQL Cache -->

### FE memory control

The cache metadata in FE uses **weak references**: when FE is short on memory, the least recently used metadata is automatically released. The following parameters are also supported for limiting memory usage:

| Parameter                          | Default value   | Description                                                            |
| ---------------------------------- | --------------- | ---------------------------------------------------------------------- |
| `sql_cache_manage_num`             | 100             | Upper bound on the number of metadata entries; the least recently used entry is automatically released when exceeded |
| `expire_sql_cache_in_fe_second`    | 300             | Metadata expiration time (seconds); automatically released if not accessed within this time |
| `cache_result_max_row_count`       | 3000            | Upper bound on the number of result rows; if exceeded, no SQL Cache is created |
| `cache_result_max_data_size`       | 31457280 (30MB) | Upper bound on the result size (in bytes); if exceeded, no SQL Cache is created |

**Configuration commands** (take effect in real time, must be configured on every FE; for persistence, write them into `fe.conf`):

```sql
-- Store at most 100 cache metadata entries
ADMIN SET FRONTEND CONFIG ('sql_cache_manage_num'='100');

-- Automatically release a cache metadata entry that has not been accessed for 300 seconds
ADMIN SET FRONTEND CONFIG ('expire_sql_cache_in_fe_second'='300');

-- Do not create SQL Cache when the result has more than 3000 rows by default
ADMIN SET FRONTEND CONFIG ('cache_result_max_row_count'='3000');

-- Do not create SQL Cache when the result is larger than 30MB by default
ADMIN SET FRONTEND CONFIG ('cache_result_max_data_size'='31457280');
```

### BE memory control

| Parameter                          | Default value (example) | Description                                                            |
| ---------------------------------- | ----------------------- | ---------------------------------------------------------------------- |
| `query_cache_max_size_mb`          | 256                     | The stable upper limit of memory used by the cache                     |
| `query_cache_elasticity_size_mb`   | 128                     | Elastic expansion space; eviction is triggered when usage exceeds max + elasticity, until usage drops below max |

**Configuration file**: `be.conf` (BE must be restarted after modification).

```conf
-- When the cache memory usage exceeds query_cache_max_size_mb + query_cache_elasticity_size_mb,
-- release the least recently used cache entries until the memory usage drops below query_cache_max_size_mb.
query_cache_max_size_mb = 256
query_cache_elasticity_size_mb = 128
```

## 7. Troubleshooting: investigating cache invalidation

<!-- Knowledge type: troubleshooting -->
<!-- Applicable scenario: locating the cause when a query does not hit the SQL Cache -->

The following table summarizes common causes of cache misses or invalidation, along with the corresponding investigation directions:

| No. | Cause of invalidation             | Typical operation                                                | Investigation tip                                  |
| --- | --------------------------------- | ---------------------------------------------------------------- | -------------------------------------------------- |
| 1   | Table or view structure change    | `drop table`, `replace table`, `alter table`, `alter view`       | Check recent DDL history of tables and views      |
| 2   | Table data change                 | `insert`, `delete`, `update`, `truncate`                         | Check ingestion and change logs to confirm whether the data version has changed |
| 3   | User permissions revoked          | `revoke`                                                         | Check permission changes for the query account    |
| 4   | Use of nondeterministic functions | `select random()`, `select now()`, etc.                          | Switch to coarse-grained functions or constant parameters |
| 5   | Variable value change             | `select * from tbl where dt = @dt_var`                           | Check whether the session variable values are consistent |
| 6   | Row Policy / Data Masking change  | Row policy or masking policy was adjusted                        | Check the recent change records of the policy    |
| 7   | Result row count exceeds the limit | Exceeds `cache_result_max_row_count` (3000 rows by default)     | Adjust the threshold or narrow the result set     |
| 8   | Result size exceeds the limit     | Exceeds `cache_result_max_data_size` (30MB by default)          | Adjust the threshold or reduce the returned fields |

## 8. FAQ

<!-- Knowledge type: FAQ -->
<!-- Applicable scenario: answering common questions during use -->

**Q1: Is SQL Cache enabled by default?**
A: It is disabled by default. Enable it at the session level with `set enable_sql_cache=true`, or globally with `set global enable_sql_cache=true`.

**Q2: Which table types does SQL Cache support?**
A: It currently supports OlapTable internal tables and Hive external tables.

**Q3: Can SQL Cache be used for real-time updated data?**
A: Yes, but every data update changes the partition version, which invalidates the cache. The hit rate is low. SQL Cache is more suitable for T+1 offline analytics scenarios.

**Q4: How is the cache invalidated for multi-table Join queries?**
A: As soon as **any one of the tables** in the Join has a data change, the partition ID or version number changes, and the entire query cache cannot be hit.

**Q: Two metrics were cached previously. Can the cache be reused for a query that now requests three metrics?**
A: No. SQL Cache caches results strictly by the queried fields. The cache of fewer metrics cannot satisfy a query request for more metrics, and the query must be re-executed.

**Q5: Does the `now()` function completely invalidate the cache?**
A: No, it does not completely invalidate the cache. `now()` returns a second-level time, and identical queries within the same second can reuse the cache. To extend the cache hit window, use `date(now())` to convert it to day-level granularity.

**Q6: Where is the cached data stored?**
A: The vast majority of results are stored in BE memory (in a HashMap structure). When the result contains only 0 or 1 row, FE stores it directly in its own memory.

**Q7: Is the cache still available after an FE restart?**
A: The metadata in FE is lost, and the monitoring metrics are also reset to 0. Results in BE memory are also invalidated after a restart.

## 9. Comparison and further reading

<!-- Knowledge type: comparison -->
<!-- Applicable scenario: choosing an appropriate caching strategy -->

| Dimension          | SQL Cache                               | Partition Cache (where applicable)            |
| ------------------ | --------------------------------------- | --------------------------------------------- |
| Cache granularity  | The result set of an entire SQL         | Caches intermediate results by partition      |
| Applicable update pattern | T+1, low-frequency updates       | Some partitions are updated frequently while others remain stable |
| Hit condition      | The SQL text and all dependent metadata are unchanged | The versions of the involved partitions are unchanged |
| Invalidation granularity | A change in any dependency invalidates the entire cache | Only partitions that miss the cache need to be recomputed |

> Note: The Partition Cache column in this table is for comparison reference only. Actual availability depends on the features of the current Doris version.
