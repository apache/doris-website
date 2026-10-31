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

| Column Name  | Type | Description             |
| ------------ | ---- | ----------------------- |
| CATALOG_NAME | text | The name of the Catalog |
| CACHE_NAME   | text | The name of the cache   |
| METRIC_NAME  | text | The name of the metric  |
| METRIC_VALUE | text | The value of the metric |


## Usage Example

```text
+----------------------+-----------------------------+----------------------+---------------------+
| CATALOG_NAME         | CACHE_NAME                  | METRIC_NAME          | METRIC_VALUE        |
+----------------------+-----------------------------+----------------------+---------------------+
| hive_iceberg_minio   | iceberg_table_cache         | eviction_count       | 0                   |
| hive_iceberg_minio   | iceberg_table_cache         | hit_ratio            | 0.8235294117647058  |
| hive_iceberg_minio   | iceberg_table_cache         | average_load_penalty | 5.480102048333334E8 |
| hive_iceberg_minio   | iceberg_table_cache         | estimated_size       | 6                   |
| hive_iceberg_minio   | iceberg_table_cache         | hit_count            | 28                  |
| hive_iceberg_minio   | iceberg_table_cache         | read_count           | 34                  |
| hive_iceberg_minio   | iceberg_snapshot_cache      | eviction_count       | 0                   |
| hive_iceberg_minio   | iceberg_snapshot_cache      | hit_ratio            | 0.45454545454545453 |
| hive_iceberg_minio   | iceberg_snapshot_cache      | average_load_penalty | 5.604907246666666E8 |
| hive_iceberg_minio   | iceberg_snapshot_cache      | estimated_size       | 6                   |
| hive_iceberg_minio   | iceberg_snapshot_cache      | hit_count            | 5                   |
| hive_iceberg_minio   | iceberg_snapshot_cache      | read_count           | 11                  |
```

The METRIC_NAME column contains the following Caffeine cache performance metrics:
- eviction_count: The number of entries that have been evicted from the cache
- hit_ratio: The ratio of cache requests which were hits (ranges from 0.0 to 1.0)
- average_load_penalty: The average time spent loading new values (in nanoseconds)
- estimated_size: The approximate number of entries in the cache
- hit_count: The number of times cache lookup methods have returned a cached value
- read_count: The total number of times cache lookup methods have been called