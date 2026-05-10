---
{
    "title": "catalog_meta_cache_statistics",
    "language": "en",
    "description": "View the metadata cache information of the External Catalog in the currently connected FE."
}
---

## Overview

View the metadata cache information of the External Catalog in the currently connected FE.

## Database


`information_schema`


## Table Information

One row represents one cache entry on one FE for one external catalog.

| Column Name | Type | Description |
| ------------ | ---- | ----------- |
| FE_HOST | text | FE host that reports the stats |
| CATALOG_NAME | text | Catalog name |
| ENGINE_NAME | text | Meta cache engine name, such as `hive`, `iceberg`, `paimon` |
| ENTRY_NAME | text | Cache entry name inside the engine, such as `schema`, `file`, `manifest` |
| EFFECTIVE_ENABLED | boolean | Whether the cache is effectively enabled after evaluating `enable` / `ttl-second` / `capacity` |
| CONFIG_ENABLED | boolean | Raw `enable` flag from the cache config |
| AUTO_REFRESH | boolean | Whether async refresh-after-write is enabled for this entry |
| TTL_SECOND | bigint | TTL in seconds. `0` means disabled; `-1` means no expiration |
| CAPACITY | bigint | Max entry count |
| ESTIMATED_SIZE | bigint | Estimated current cache size |
| REQUEST_COUNT | bigint | Total requests |
| HIT_COUNT | bigint | Cache hits |
| MISS_COUNT | bigint | Cache misses |
| HIT_RATE | double | Hit rate |
| LOAD_SUCCESS_COUNT | bigint | Successful loads |
| LOAD_FAILURE_COUNT | bigint | Failed loads |
| TOTAL_LOAD_TIME_MS | bigint | Total load time in milliseconds |
| AVG_LOAD_PENALTY_MS | double | Average load time in milliseconds |
| EVICTION_COUNT | bigint | Evicted entries |
| INVALIDATE_COUNT | bigint | Explicit invalidations |
| LAST_LOAD_SUCCESS_TIME | text | Last successful load time |
| LAST_LOAD_FAILURE_TIME | text | Last failed load time |
| LAST_ERROR | text | Latest load error message |


## Usage Example

```sql
SELECT catalog_name, engine_name, entry_name,
       effective_enabled, ttl_second, capacity,
       estimated_size, hit_rate, last_error
FROM information_schema.catalog_meta_cache_statistics
ORDER BY catalog_name, engine_name, entry_name;
```

Typical usage:

- Use `ENGINE_NAME` + `ENTRY_NAME` to identify one logical cache entry.
- Use `EFFECTIVE_ENABLED`, `TTL_SECOND`, and `CAPACITY` to confirm the applied cache policy.
- Use `HIT_RATE`, `ESTIMATED_SIZE`, `LOAD_FAILURE_COUNT`, and `LAST_ERROR` to diagnose behavior.

