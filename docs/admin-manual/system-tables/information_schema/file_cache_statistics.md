---
{
    "title": "file_cache_statistics",
    "language": "en",
    "description": "Used to view the metric information related to data cache on each BE node."
}
---

## Overview

Used to view the metric information related to data cache on each BE node. The metric information is sourced from the monitoring metrics related to BE's data cache.

:::tip Tip
This system table is supported from versions 2.1.6 and 3.0.2.
:::

## Database

`information_schema`

## Table Information

| Column Name | Type | Description |
|---|---|---|
| BE_ID | BIGINT | BE node ID |
| BE_IP | STRING | BE node IP |
| CACHE_PATH | STRING | BE node cache path |
| METRIC_NAME | STRING | Metric name |
| METRIC_VALUE | STRING | Text representation of the metric value; cast explicitly for numeric comparisons or calculations |

:::info Note

Doris different version may have different metrics

:::

### 2.1.x Metrics

> Only important metrics are listed.

- `normal_queue_curr_elements`

    Number of File Blocks currently in the cache.

- `normal_queue_max_elements`

    Maximum number of File Blocks allowed in the cache.

- `normal_queue_curr_size`

    Current cache size.

- `normal_queue_max_size`

    Maximum cache size allowed.

- `hits_ratio`

    Overall cache hit ratio since BE startup. Range 0-1.

- `hits_ratio_5m`

    Cache hit ratio in the last 5 minutes. Range 0-1.

- `hits_ratio_1h`

    Cache hit ratio in the last 1 hour. Range 0-1.

### 3.0.x Metrics

TODO

### Metric Changes in Version 4.1.5

Since version 4.1.5, the following two `METRIC_NAME` values are available. They accumulate separately for each BE and cache path from process startup:

| METRIC_NAME | Unit | Meaning |
| --- | --- | --- |
| `evict_not_downloaded_size` | Bytes | Cumulative logical range size of cache blocks removed before download completion, excluding blocks currently downloading; does not represent physical eviction of downloaded data |
| `evict_not_downloaded_num` | Blocks | Cumulative number of these removed cache blocks |

Since the same version, `total_removed_size` counts only the bytes of fully downloaded cache blocks that are removed. Blocks that have not been downloaded use the new metrics separately. Marking a downloading block for deletion does not increase these counters.

The corresponding brpc `/vars` names are `file_cache_evict_not_downloaded_size` and `file_cache_evict_not_downloaded_num`, each prefixed with its cache path. See [File Cache Monitoring](../../../compute-storage-decoupled/file-cache/file-cache.md#cache-space-and-hit-rate-metrics). The system table's `METRIC_NAME` has no path prefix; the path appears in `CACHE_PATH`.

For example, query the new metrics and the cumulative removal volume of downloaded data:

```sql
SELECT BE_ID, CACHE_PATH, METRIC_NAME, CAST(METRIC_VALUE AS DOUBLE) AS metric_value
FROM information_schema.file_cache_statistics
WHERE METRIC_NAME IN ('total_removed_size', 'evict_not_downloaded_size', 'evict_not_downloaded_num')
ORDER BY BE_ID, CACHE_PATH, METRIC_NAME;
```

The query returns the metrics for each cache path on each BE. Values change with cache activity.

## Examples

1. Query all cache metrics

    ```sql
    mysql> select * from information_schema.file_cache_statistics;
    +-------+---------------+----------------------------+----------------------------+--------------------+
    | BE_ID | BE_IP         | CACHE_PATH                 | METRIC_NAME                | METRIC_VALUE       |
    +-------+---------------+----------------------------+----------------------------+--------------------+
    | 10003 | 172.20.32.136 | /mnt/output/be/file_cache/ | normal_queue_curr_elements |               1392 |
    | 10003 | 172.20.32.136 | /mnt/output/be/file_cache/ | normal_queue_curr_size     |          248922234 |
    | 10003 | 172.20.32.136 | /mnt/output/be/file_cache/ | normal_queue_max_elements  |             102400 |
    | 10003 | 172.20.32.136 | /mnt/output/be/file_cache/ | normal_queue_max_size      |        21474836480 |
    | 10003 | 172.20.32.136 | /mnt/output/be/file_cache/ | hits_ratio                 | 0.8539634687001242 |
    | 10003 | 172.20.32.136 | /mnt/output/be/file_cache/ | hits_ratio_1h              |                  0 |
    | 10003 | 172.20.32.136 | /mnt/output/be/file_cache/ | hits_ratio_5m              |                  0 |
    +-------+---------------+----------------------------+----------------------------+--------------------+
    ```

2. Query cache hit ratio and sort by hit ratio

    ```sql
    select * from information_schema.file_cache_statistics where METRIC_NAME = "hits_ratio" order by cast(METRIC_VALUE as double) desc;
    ```
