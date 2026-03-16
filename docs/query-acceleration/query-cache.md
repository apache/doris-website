# Query Cache

## Introduction

In analytical workloads, the same aggregation query is often executed repeatedly on data that has not changed, for example:

```sql
SELECT region, SUM(revenue) FROM orders WHERE dt = '2024-01-01' GROUP BY region;
SELECT region, SUM(revenue) FROM orders WHERE dt = '2024-01-01' GROUP BY region;
```

Each execution re-scans identical tablets and re-computes identical aggregation results, wasting CPU and I/O resources.

To address this, Apache Doris provides a **Query Cache** mechanism. It caches the intermediate aggregation results produced inside the pipeline execution engine and serves them directly to subsequent queries that share the same execution context, significantly reducing query latency.

:::caution Important Limitations
- Query Cache applies **only to aggregation queries** on **internal OLAP tables**. Non-aggregation queries (plain scans, joins, sorts, etc.) do not use Query Cache.
- Query Cache **does not work on external tables** (Hive, JDBC, Iceberg, Hudi, Paimon, etc.).
:::

## Working Principle

### Applicable Query Patterns

Query Cache is designed for aggregation queries. Specifically, only fragments whose plan tree matches one of the following patterns are eligible:

- `AggregationNode → OlapScanNode` (single-phase aggregation directly on a scan)
- `AggregationNode → AggregationNode → OlapScanNode` (two-phase aggregation on a scan)

Intermediate nodes such as `FilterNode` and `ProjectNode` are allowed between the aggregation and scan nodes. However, the plan tree must **not** contain `JoinNode`, `SortNode`, `UnionNode`, `WindowNode`, or `ExchangeNode` within the cache-eligible subtree.

### Cache Key

The cache key is composed of three parts:

1. **SQL Digest** — A SHA-256 hash computed from the normalized plan tree (aggregation functions, grouping expressions, non-partition filter predicates, projections, and result-affecting session variables). The normalization process assigns canonical IDs to all internal identifiers, so two semantically identical queries produce the same digest even if they have different internal plan node / slot IDs.

2. **Tablet IDs** — The sorted list of tablet IDs assigned to the current pipeline instance.

3. **Tablet Range** — The effective scan range for each tablet, derived from partition predicates (see [Partition and Filter Behavior](#partition-and-filter-behavior)).

### Cache Invalidation

A cache entry becomes invalid when any of the following occurs:

- **Data changes**: INSERT, DELETE, UPDATE, or Compaction causes the tablet version to increment. On the next query, the tablet version is compared against the cached version; a mismatch means a cache miss.
- **Schema changes**: ALTER TABLE operations change the table structure, which changes the plan and thus the digest.
- **LRU eviction**: When the cache memory exceeds the configured limit, least recently used entries are evicted. The cache uses an LRU-K (K=2) algorithm — a new entry must be accessed at least twice before it is admitted into the cache when the cache is full.
- **Stale sweep**: Entries older than 24 hours are automatically removed by periodic pruning.
- **Force refresh**: When `query_cache_force_refresh = true`, cached results are ignored and the query re-executes.

### Execution Flow

**First execution (cache miss)**:

1. The scan operator reads data from tablets normally.
2. The aggregation operator computes results.
3. The results are sent to the downstream consumer and simultaneously accumulated for cache insertion.
4. On completion, if the accumulated result does not exceed the per-entry size/row limits, the result is inserted into the cache.

**Subsequent execution (cache hit)**:

1. The scan operator detects a cache hit and skips adding any scan ranges — no tablet data is read.
2. The aggregation operator produces nothing (no input data).
3. The cache source operator serves the cached blocks directly.
4. If the column order differs from the cached entry (e.g., `SELECT a, b` vs. `SELECT b, a` with the same digest), columns are reordered automatically.

## Partition and Filter Behavior

Understanding how partition predicates and filter expressions interact with Query Cache is essential for achieving good hit rates.

### Partition Predicates

For tables with **single-column RANGE partitioning**, partition predicates receive special treatment:

- The partition predicate is **extracted from the digest**. Instead, the effective range (the intersection of the predicate range with each partition's actual range boundary) is computed and appended to the cache key as the tablet range string.
- This means two queries that differ **only** in their partition filter range can share cache entries for the tablets they have in common.

**Example:**

Consider a table `orders` partitioned by `dt` with daily partitions:

```sql
-- Query A
SELECT region, SUM(revenue) FROM orders
WHERE dt >= '2024-01-01' AND dt < '2024-01-03' GROUP BY region;

-- Query B
SELECT region, SUM(revenue) FROM orders
WHERE dt >= '2024-01-02' AND dt < '2024-01-04' GROUP BY region;
```

- Query A scans tablets from partitions `2024-01-01` and `2024-01-02`.
- Query B scans tablets from partitions `2024-01-02` and `2024-01-03`.
- The tablets for partition `2024-01-02` have the same digest and the same tablet range, so **Query B can reuse Query A's cache for the `2024-01-02` partition**. Only partition `2024-01-03` needs to be computed fresh.

For **multi-column RANGE partitioning**, **LIST partitioning**, or **UNPARTITIONED** tables, partition predicates cannot be extracted and are included directly in the digest. In this case, even minor differences in partition predicates produce different digests and cache misses.

### Non-Partition Filter Expressions

Non-partition filter expressions (e.g., `WHERE status = 'active'`) are included in the normalized plan digest. Two queries can share a cache entry only when their non-partition filter expressions are semantically identical after normalization.

- `WHERE status = 'active'` and `WHERE status = 'active'` — same digest, cache hit.
- `WHERE status = 'active'` and `WHERE status = 'inactive'` — different digest, cache miss.
- `WHERE status = 'active' AND region = 'ASIA'` and `WHERE region = 'ASIA' AND status = 'active'` — the normalization process sorts conjuncts, so they produce the same digest and can hit the cache.

### Session Variables

Session variables that affect query results (such as `time_zone`, `sql_mode`, `sql_select_limit`, etc.) are included in the digest. Changing any of these variables between queries produces a different cache key and causes a cache miss.

### Conditions That Disable Query Cache

The following conditions cause the planner to skip Query Cache entirely for a fragment:

| Condition | Reason |
|-----------|--------|
| Fragment is a target of runtime filters | Runtime filter values are dynamic and unknown at plan time; caching would produce incorrect results |
| Non-deterministic expressions (`rand()`, `now()`, `uuid()`, UDFs, etc.) | Results vary across executions even with identical input |
| Plan contains JOIN, SORT, UNION, or WINDOW nodes in the cache subtree | Only aggregation-over-scan patterns are supported |
| Scan node is not `OlapScanNode` (e.g., external table scan) | Cache depends on tablet IDs and versions, which do not exist for external tables |

## Why Query Cache Does Not Work on External Tables

Query Cache relies on three properties unique to internal OLAP tables:

1. **Tablet-based data organization** — The cache key includes tablet IDs and per-tablet scan ranges. External tables store data in external systems (HDFS, S3, JDBC, etc.) and have no tablet concept.

2. **Version-based invalidation** — Each internal tablet has a monotonically increasing version number that changes on data modification. The cache uses this version to detect staleness. External tables do not expose such versioning to Doris.

3. **OlapScanNode requirement** — The plan normalization logic only recognizes `OlapScanNode` as a valid scan node beneath the aggregation cache point. External table scan nodes are not recognized.

For caching needs on external tables, consider using [SQL Cache](./sql-cache-manual.md) instead.

## Configuration

### Session Variables (FE)

| Parameter | Description | Default |
|-----------|-------------|---------|
| `enable_query_cache` | Master switch to enable or disable Query Cache | `false` |
| `query_cache_force_refresh` | When `true`, ignores cached results and re-executes the query; the new result is still written to cache | `false` |
| `query_cache_entry_max_bytes` | Maximum size (in bytes) of a single cache entry. If the aggregation result exceeds this limit, caching is abandoned for that fragment | `5242880` (5 MB) |
| `query_cache_entry_max_rows` | Maximum number of rows for a single cache entry. If the aggregation result exceeds this limit, caching is abandoned for that fragment | `500000` |

### BE Configuration (be.conf)

| Parameter | Description | Default |
|-----------|-------------|---------|
| `query_cache_size` | Total memory capacity of the Query Cache on each BE, in MB | `512` |

:::note
The parameters `query_cache_max_size_mb` and `query_cache_elasticity_size_mb` in `be.conf` control the older SQL Result Cache, not the pipeline-level Query Cache described here. Do not confuse the two.
:::

## Usage Example

### Enable Query Cache

```sql
SET enable_query_cache = true;
```

### Typical Scenario

```sql
-- First execution: cache miss, results are computed and cached
SELECT region, SUM(revenue), COUNT(*)
FROM orders
WHERE dt = '2024-01-15' AND status = 'completed'
GROUP BY region;

-- Second execution: cache hit, results are served directly from cache
SELECT region, SUM(revenue), COUNT(*)
FROM orders
WHERE dt = '2024-01-15' AND status = 'completed'
GROUP BY region;
```

### Verify Cache Hit in Profile

After executing a query, examine the query profile. Look for the `CacheSourceOperator` section:

- `HitCache: true` — The query served results from the cache.
- `HitCache: false`, `InsertCache: true` — The query missed the cache but successfully inserted results.
- `HitCache: false`, `InsertCache: false` — The query missed the cache and the result was too large to cache.

The profile also shows `CacheTabletId` to indicate which tablets were involved.

### Force Refresh

```sql
-- Force the next query to bypass cache and re-compute results
SET query_cache_force_refresh = true;

SELECT region, SUM(revenue) FROM orders WHERE dt = '2024-01-15' GROUP BY region;

-- Reset
SET query_cache_force_refresh = false;
```

## Applicable Scenarios

Query Cache is most effective in the following cases:

- **Repeated aggregation queries**: Dashboard queries, reporting queries, or BI tools that issue the same aggregation SQL repeatedly.
- **T+1 reporting**: Data is loaded once daily; subsequent queries on the same day hit the cache.
- **Partition-based queries with overlapping ranges**: Queries on overlapping date ranges can partially share cache entries at the partition/tablet level.

Query Cache is **not** suitable for:

- **Non-aggregation queries**: Plain SELECT scans, JOINs, SORT, WINDOW functions.
- **External tables**: Hive, JDBC, Iceberg, Hudi, Paimon, etc.
- **Frequently updated tables**: High ingestion rates cause tablet versions to change rapidly, reducing cache hit rates.
- **Queries with non-deterministic functions**: `now()`, `rand()`, `uuid()`, and UDFs disable caching.
- **Queries that depend on runtime filters**: Joins that produce runtime filters for the scan fragment disable caching on that fragment.

## Notes

- **Cache is not persistent**: Query Cache resides in BE memory and is cleared on BE restart.
- **Memory consumption**: Cached blocks consume BE memory. Monitor usage and adjust `query_cache_size` as needed.
- **LRU-K admission**: When the cache is full, a new entry must be accessed at least twice to be admitted (LRU-K with K=2), which prevents low-frequency queries from polluting the cache.

## Summary

Query Cache is a pipeline-level optimization mechanism in Doris that caches intermediate aggregation results per tablet. Its key characteristics:

- Applies **only to aggregation queries** on **internal OLAP tables**
- Uses tablet version for automatic cache invalidation
- Intelligently separates partition predicates from the cache digest, enabling cache sharing across queries with overlapping partition ranges
- Provides per-entry size and row limits to prevent oversized results from consuming cache memory
- Uses LRU-K eviction to maintain a high-quality cache
