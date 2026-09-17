---
{
    "title": "catalog_meta_cache_statistics",
    "language": "en",
    "description": "View External Catalog metadata-cache configuration, activity, and memory-governance statistics on FE nodes."
}
---

## Overview

`catalog_meta_cache_statistics` shows one row for each FE, External Catalog, metadata-cache engine, and cache entry visible to the current user. It includes cache configuration and Caffeine activity, together with the retained-memory limits, estimated usage, and admission rejections introduced in Doris 4.1.4.

## Database

`information_schema`

## Table Information

| Column | Type | Description |
|---|---|---|
| `FE_HOST` | STRING | FE node that reports the row. |
| `CATALOG_NAME` | STRING | External Catalog name. |
| `ENGINE_NAME` | STRING | Metadata-cache engine, such as `hive`, `iceberg`, or `paimon`. |
| `ENTRY_NAME` | STRING | Cache entry within the engine. |
| `EFFECTIVE_ENABLED` | BOOLEAN | Whether the entry is currently effective after evaluating enable, TTL, capacity, and weight settings. |
| `CONFIG_ENABLED` | BOOLEAN | Configured `enable` value. |
| `AUTO_REFRESH` | BOOLEAN | Whether managed automatic refresh is enabled. |
| `TTL_SECOND` | BIGINT | Expiration time in seconds. `-1` means no expiration and `0` disables the entry. |
| `CAPACITY` | BIGINT | Configured count capacity. With `max-weight`, it is not a simultaneous count limit, but `0` still disables the entry. |
| `ESTIMATED_SIZE` | BIGINT | Approximate number of cached mappings. |
| `REQUEST_COUNT` | BIGINT | Total cache lookup requests. |
| `HIT_COUNT` | BIGINT | Cache hits. |
| `MISS_COUNT` | BIGINT | Cache misses. |
| `HIT_RATE` | DOUBLE | Cache hit rate from `0.0` to `1.0`. |
| `LOAD_SUCCESS_COUNT` | BIGINT | Successful cache loads. |
| `LOAD_FAILURE_COUNT` | BIGINT | Failed cache loads. |
| `TOTAL_LOAD_TIME_MS` | BIGINT | Total cache load time in milliseconds. |
| `AVG_LOAD_PENALTY_MS` | DOUBLE | Average load time in milliseconds. |
| `EVICTION_COUNT` | BIGINT | Number of Caffeine and explicit local-budget evictions. |
| `EVICTION_RATE` | DOUBLE | Ratio of `EVICTION_COUNT` to `REQUEST_COUNT`; `0` when there are no requests. |
| `INVALIDATE_COUNT` | BIGINT | Number of explicit invalidations. |
| `LAST_LOAD_SUCCESS_TIME` | STRING | Time of the most recent successful load. |
| `LAST_LOAD_FAILURE_TIME` | STRING | Time of the most recent failed load. |
| `LAST_ERROR` | STRING | Most recent load error; empty when none is recorded. |
| `MAX_WEIGHT` | BIGINT | Effective entry memory limit in bytes. |
| `ESTIMATED_WEIGHT` | BIGINT | Current reserved estimated weight of this entry in bytes. |
| `WEIGHT_REJECT_COUNT` | BIGINT | Cumulative number of cache admissions rejected by incomplete estimation or insufficient weight budget. |
| `LAST_WEIGHT_REJECT_REASON` | STRING | Most recent weight-admission rejection reason. |

For entries without an applicable FE, Catalog, or entry memory limit, `MAX_WEIGHT` is `-1` and `ESTIMATED_WEIGHT` is `0`.

Weight columns have two kinds of time semantics:

- `ESTIMATED_WEIGHT` is a gauge. It reports the reservation at query time.
- `WEIGHT_REJECT_COUNT` and the other count columns are cumulative for the current cache instance. They restart from zero when the cache group is rebuilt after a Catalog property change or an FE restart.

The table does not retain historical samples. Sample it periodically if you need a trend.

## Usage Example

Summarize the reservation of memory-governed entries per Catalog. This is usually the first query during an FE memory investigation:

```sql
SELECT fe_host, catalog_name,
       SUM(estimated_weight) AS estimated_weight,
       SUM(weight_reject_count) AS weight_reject_count
FROM information_schema.catalog_meta_cache_statistics
WHERE max_weight >= 0
GROUP BY fe_host, catalog_name
ORDER BY estimated_weight DESC;
```

Inspect memory-governed entries and their most recent admission result:

```sql
SELECT fe_host, catalog_name, engine_name, entry_name,
       max_weight, estimated_weight,
       weight_reject_count, last_weight_reject_reason
FROM information_schema.catalog_meta_cache_statistics
WHERE max_weight >= 0
ORDER BY fe_host, catalog_name, engine_name, entry_name;
```

Inspect cache effectiveness and load failures for one Catalog:
Inspect cache effectiveness and load failures for one Catalog:

```sql
SELECT engine_name, entry_name, effective_enabled,
       estimated_size, request_count, hit_rate,
       load_failure_count, last_error
FROM information_schema.catalog_meta_cache_statistics
WHERE catalog_name = 'iceberg_ctl'
ORDER BY engine_name, entry_name;
```
