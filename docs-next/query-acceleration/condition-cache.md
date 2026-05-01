---
title: Condition Cache Accelerates Repeated Filter Queries
sidebar_label: Condition Cache
description: How does Doris Condition Cache accelerate repeated condition queries by caching Segment filter results? This article explains the principles, configuration, and hit-rate monitoring in detail.
keywords:
    - Doris Condition Cache
    - condition cache
    - query acceleration
    - repeated filter optimization
    - Segment filter cache
    - LRU cache
    - OLAP high-concurrency query
    - enable_condition_cache
---

<!-- Knowledge type: capability definition / configuration parameter / performance tuning -->
<!-- Applicable scenario: high-frequency repeated condition queries / query performance optimization -->

**Condition Cache** is a query acceleration mechanism in Apache Doris designed for repeated condition queries. It caches the result of a specific filter condition on a given Segment as a compressed bit vector. When a subsequent query hits the cache, the result can be reused directly, avoiding repeated scans and filtering. This reduces CPU and IO overhead and shortens query latency.

In large-scale analytical scenarios, queries often contain repeated filter conditions, for example:

```sql
SELECT * FROM orders WHERE region = 'ASIA';
SELECT count(*) FROM orders WHERE region = 'ASIA';
```

Such queries repeatedly execute the same filter logic on the same data shards (Segments), causing **redundant CPU and IO overhead**. Condition Cache reuses filter results to **reduce unnecessary scans and filtering**, significantly lowering query latency.

## Working Principle

<!-- Knowledge type: architectural principle -->

The core idea of Condition Cache is: **the same filter condition on the same data shard produces the same result**.

1. Doris generates a **64-bit digest** from "filter expression + Key Range" as the unique identifier for the cache.
2. Each Segment can use this digest to look up an existing filter result in the cache.
3. The cached result is stored as a compressed **bit vector (`std::vector<bool>`)**.

The semantics of the bit vector are as follows:

| Bit value | Meaning                                                       |
| --------- | ------------------------------------------------------------- |
| `0`       | The row range does not satisfy the condition and can be skipped |
| `1`       | The range may contain rows that satisfy the condition and needs further scanning |

In this way, Doris can quickly eliminate invalid data blocks at a coarse granularity and apply precise filtering only when necessary.

## Applicable Scenarios

<!-- Knowledge type: architecture selection decision -->

### Recommended Scenarios

Condition Cache is most effective in the following scenarios:

| Scenario             | Description                                                                            |
| -------------------- | -------------------------------------------------------------------------------------- |
| **Repeated conditions** | The same or similar filter conditions are used frequently                              |
| **Relatively stable data** | Data inside a Segment is generally immutable (INSERT/Compaction generates new Segments, and old caches are naturally evicted) |
| **High selectivity** | The condition retains only a few rows after filtering, which maximizes scan reduction  |

### Scenarios Where Condition Cache Does Not Apply

Condition Cache does not take effect in the following scenarios:

- The query contains a **Delete condition** (delete markers must guarantee correctness, so the cache is disabled).
- A **TopN Runtime Filter** generated at runtime (not yet supported).

## Configuration and Management

<!-- Knowledge type: configuration parameter -->

### Enable and Disable

- **Purpose**: Enable Condition Cache at the session level.
- **Command**:

    ```sql
    set enable_condition_cache = true;
    ```

- **Description**: This parameter controls whether the current session uses Condition Cache.

### Memory Management

The memory usage of Condition Cache follows these rules:

| Item              | Description                                                          |
| ----------------- | -------------------------------------------------------------------- |
| Eviction policy   | **LRU (Least Recently Used)**, evicts the least recently used entries automatically once the capacity limit is exceeded |
| Capacity parameter | `condition_cache_limit`, in MB, default `1024`                       |
| Configuration location | `be.conf`                                                       |
| Natural expiration | After a Segment goes through Compaction, old cache entries are naturally evicted by LRU |

Example of modifying the capacity limit:

```properties
# be.conf
condition_cache_limit = 1024
```

## Cache Statistics and Monitoring

<!-- Knowledge type: operational steps -->

Doris provides rich statistical metrics for observing the effectiveness of Condition Cache. You can use these metrics to evaluate cache benefits and hit rates.

### Profile-Level Metrics

The following metrics are visible in the query execution plan (Profile):

| Metric name                    | Meaning                          |
| ------------------------------ | -------------------------------- |
| `ConditionCacheSegmentHit`     | Number of Segments that hit the cache |
| `ConditionCacheFilteredRows`   | Number of rows directly filtered out by the cache |

### System Metrics

View these metrics through the monitoring system or the `metrics` interface:

| Metric name                     | Meaning           |
| ------------------------------- | ----------------- |
| `condition_cache_search_count`  | Number of cache lookups |
| `condition_cache_hit_count`     | Number of cache hits   |

## Usage Example

### Typical Scenario

Suppose you have the following query:

```sql
SELECT order_id, amount
FROM orders
WHERE region = 'ASIA' AND order_date >= '2023-01-01';
```

Execution flow:

1. **First execution**: A full scan and condition evaluation are required. Condition Cache stores the result in the LRU cache.
2. **Subsequent identical queries**: The cache is used directly to skip most invalid row ranges, scanning only the parts that may satisfy the condition.

When multiple queries share the same filter condition (for example, `region = 'ASIA' AND order_date >= '2023-01-01'`), they can also reuse Condition Cache among each other, reducing overall overhead.

## Notes

- **The cache is not persisted**: Condition Cache is cleared after Doris restarts.
- **Delete operations disable the cache**: Segments involving delete markers must guarantee strong consistency, so Condition Cache is not used.

## FAQ

**Q1: What is the difference between Condition Cache and Query Cache?**

Condition Cache caches "the hit status of a filter condition on a Segment" (a bit vector). Its granularity is finer and it can be reused across different queries. It is an optimization mechanism at the query execution layer.

**Q2: Why is the query not faster after enabling Condition Cache?**

You can investigate from the following angles:

- The query condition contains a Delete marker or a TopN Runtime Filter, so the cache does not take effect.
- Data is written frequently. After Compaction, old Segments are replaced by new ones, and the cache is evicted.
- The condition has low selectivity, and many rows are still retained after filtering, so the benefit is limited.
- Use `condition_cache_hit_count` / `condition_cache_search_count` to check whether the hit rate is low.

**Q3: How can I confirm whether a query hits Condition Cache?**

Check the `ConditionCacheSegmentHit` and `ConditionCacheFilteredRows` metrics in the Profile. If the values are greater than 0, the cache was hit and produced filtering benefits.

**Q4: Do I need to restart after adjusting `condition_cache_limit`?**

`condition_cache_limit` is configured in `be.conf`. After modification, you need to restart the BE for it to take effect.

## Summary

Condition Cache is an optimization mechanism in Doris for **repeated condition queries**. Its advantages are:

- It avoids redundant computation and reduces CPU/IO consumption.
- It works transparently and automatically, with no user intervention required.
- It uses little memory, and the effect is significant when hit rate and filter rate are high.

By making good use of Condition Cache, you can achieve faster response times in high-frequency OLAP query scenarios.
