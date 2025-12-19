---
{
    "title": "Condition Cache",
    "language": "en",
    "description": "In large-scale analytical workloads, queries often include repeated filtering conditions (Conditions)"
}
---

## Introduction

In large-scale analytical workloads, queries often include **repeated filtering conditions (Conditions)**, for example:

```
SELECT * FROM orders WHERE region = 'ASIA';
SELECT count(*) FROM orders WHERE region = 'ASIA';
```

Such queries repeatedly execute the same filtering logic on identical data segments, leading to **redundant CPU and I/O overhead**.

To address this, **Apache Doris introduces the Condition Cache mechanism**.
 It caches the filtering results of specific conditions on a given segment, allowing subsequent queries to **reuse those results directly**, thereby **reducing unnecessary scans and filtering operations** and significantly lowering query latency.

## Working Principle

The core concept of the Condition Cache is:

- **The same filtering condition produces the same result on the same data segment.**
- Doris generates a **64-bit digest** from the combination of “condition expression + key range,” which serves as a unique cache identifier.
- Each segment can then look up existing filtering results in the cache using this digest.

Cached results are stored as compressed **bit vectors (`std::vector<bool>`)**:

- **0** indicates that the row range does not meet the condition and can be skipped directly;
- **1** indicates that the range may contain matching data and needs further scanning.

Through this mechanism, Doris can quickly eliminate irrelevant data blocks at a coarse granularity, performing fine-grained filtering only when necessary.

## Applicable Scenarios

Condition Cache is most effective in the following cases:

- **Repeated conditions**: Identical or similar filter conditions are frequently used.
- **Relatively stable data**: Data inside a segment is typically immutable (new segments are generated after INSERT/Compaction, naturally invalidating old caches).
- **High selectivity**: When filters leave only a small subset of rows, it maximizes scan reduction.

Condition Cache will **not** be used in the following situations:

- Queries containing **delete predicates** (to ensure correctness, caching is disabled).
- **TopN runtime filters** generated at runtime (currently unsupported).

## Configuration and Management

### Enable or Disable

```
SET enable_condition_cache = true;
```

### Memory Management

- Condition Cache uses an **LRU policy** for cache eviction.
- When exceeding `condition_cache_limit`, the least recently used entries are automatically cleared.

You can modify the memory limit in `be.conf`:

```
condition_cache_limit = 1024  # Unit: MB
```

- After segment compaction, old cache entries are naturally invalidated through LRU eviction.

## Cache Statistics

Doris provides comprehensive metrics to help users monitor the effectiveness of Condition Cache:

- **Profile-level metrics** (visible in query execution plans)
  - `ConditionCacheSegmentHit`: Number of segments that hit the cache
  - `ConditionCacheFilteredRows`: Number of rows skipped directly by cached results
- **System metrics** (viewable via the monitoring system or `/metrics`)
  - `condition_cache_search_count`: Total cache lookup count
  - `condition_cache_hit_count`: Number of successful cache hits

These metrics help evaluate the cache’s benefit and hit ratio.

## Usage Example

### Typical Scenario

Consider the following query:

```
SELECT order_id, amount
FROM orders
WHERE region = 'ASIA' AND order_date >= '2023-01-01';
```

- **First execution**: The query performs a full scan and evaluates the filter; the Condition Cache stores the result in the LRU cache.
- **Subsequent identical queries**: They reuse the cached results, skipping most irrelevant row ranges and scanning only potential matches.

When multiple queries share the same filtering condition (e.g., `region = 'ASIA' AND order_date >= '2023-01-01'`), they can reuse each other’s Condition Cache entries, reducing overall workload.

## Notes

- **Cache is not persistent**: The Condition Cache is cleared upon Doris restart.
- **Delete operations disable caching**: Segments with delete markers require strict consistency and thus do not use the cache.

## Summary

Condition Cache is an optimization mechanism in Doris designed for **repeated conditional queries**. Its advantages include:

- Avoiding redundant computation and reducing CPU/I/O overhead
- Automatically and transparently effective without user intervention
- Lightweight in memory consumption and highly efficient when hit and filter rates are high

By leveraging the Condition Cache effectively, users can achieve significantly faster response times in high-frequency OLAP query scenarios.
