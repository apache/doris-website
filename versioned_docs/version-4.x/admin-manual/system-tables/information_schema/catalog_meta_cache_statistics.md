---
{
    "title": "catalog_meta_cache_statistics",
    "language": "en",
    "description": "View External Catalog metadata-cache configuration, activity, and memory-governance statistics on FE nodes."
}
---

## Overview

`catalog_meta_cache_statistics` shows one row for each FE, External Catalog, metadata-cache engine, and cache entry visible to the current user. It includes cache configuration and Caffeine activity, together with retained-memory limits, estimated usage, eviction weight, and admission rejections introduced in Doris 4.1.4.

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
| `INVALIDATE_COUNT` | BIGINT | Number of explicit invalidations. |
| `LAST_LOAD_SUCCESS_TIME` | STRING | Time of the most recent successful load. |
| `LAST_LOAD_FAILURE_TIME` | STRING | Time of the most recent failed load. |
| `LAST_ERROR` | STRING | Most recent load error; empty when none is recorded. |
| `WEIGHT_BOUNDED` | BOOLEAN | Whether this entry is governed by an applicable FE, Catalog, or entry memory limit. |
| `MAX_WEIGHT` | BIGINT | Effective entry memory limit in bytes. |
| `ESTIMATED_WEIGHT` | BIGINT | Current reserved estimated weight of this entry in bytes. |
| `EVICTION_WEIGHT` | BIGINT | Cumulative estimated bytes released by automatic and local-budget eviction. |
| `WEIGHT_REJECT_COUNT` | BIGINT | Number of cache admissions rejected by incomplete estimation or insufficient weight budget. |
| `CATALOG_MAX_WEIGHT` | BIGINT | Catalog memory limit in bytes. |
| `CATALOG_ESTIMATED_WEIGHT` | BIGINT | Current reserved estimated weight across managed entries in this Catalog. |
| `GLOBAL_MAX_WEIGHT` | BIGINT | FE-wide external metadata-cache memory limit in bytes. |
| `GLOBAL_ESTIMATED_WEIGHT` | BIGINT | Current reserved estimated weight across managed external metadata caches on the FE. |
| `LAST_WEIGHT_REJECT_REASON` | STRING | Most recent weight-admission rejection reason. |

For count-bounded entries or an unconfigured parent limit, weight-related numeric columns use `-1` when the value is not applicable.

## Usage Example

Inspect memory-governed entries and their most recent admission result:

```sql
SELECT fe_host, catalog_name, engine_name, entry_name,
       max_weight, estimated_weight, eviction_weight,
       weight_reject_count, last_weight_reject_reason,
       catalog_max_weight, catalog_estimated_weight,
       global_max_weight, global_estimated_weight
FROM information_schema.catalog_meta_cache_statistics
WHERE weight_bounded = true
ORDER BY fe_host, catalog_name, engine_name, entry_name;
```

Inspect cache effectiveness and load failures for one Catalog:

```sql
SELECT engine_name, entry_name, effective_enabled,
       estimated_size, request_count, hit_rate,
       load_failure_count, last_error
FROM information_schema.catalog_meta_cache_statistics
WHERE catalog_name = 'iceberg_ctl'
ORDER BY engine_name, entry_name;
```
