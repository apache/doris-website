---
{
    "title": "SHOW WORKLOAD GROUPS",
    "language": "en",
    "description": "This statement displays the workload groups that the current user is allowed to view."
}
---

## Description

This statement displays the workload groups that the current user is allowed to view. You can use `LIKE` for name-based pattern matching. To view a specific workload group, the user must have `USAGE_PRIV` on that workload group or have the global `ADMIN_PRIV`.

## Syntax

```sql
SHOW WORKLOAD GROUPS [LIKE "<pattern>"];
```

## Examples

### Example 1: Show all workload groups

```sql
SHOW WORKLOAD GROUPS;
```

```text
mysql> show workload groups \G;
*************************** 1. row ***************************
                          Id: 1754728930516
                        Name: normal
             min_cpu_percent: 20%
             max_cpu_percent: 30%
          min_memory_percent: 0%
          max_memory_percent: 50%
             max_concurrency: 1
              max_queue_size: 1
               queue_timeout: 0
             scan_thread_num: 16
  max_remote_scan_thread_num: -1
  min_remote_scan_thread_num: -1
        memory_low_watermark: 75%
       memory_high_watermark: 85%
               compute_group: default
       read_bytes_per_second: -1
remote_read_bytes_per_second: -1
          slot_memory_policy: none
           running_query_num: 0
           waiting_query_num: 0
*************************** 2. row ***************************
                          Id: 1754740507946
                        Name: test_group2
             min_cpu_percent: 10%
             max_cpu_percent: 30%
          min_memory_percent: 0%
          max_memory_percent: 3%
             max_concurrency: 2147483647
              max_queue_size: 0
               queue_timeout: 0
             scan_thread_num: -1
  max_remote_scan_thread_num: -1
  min_remote_scan_thread_num: -1
        memory_low_watermark: 75%
       memory_high_watermark: 85%
               compute_group: default
       read_bytes_per_second: -1
remote_read_bytes_per_second: -1
          slot_memory_policy: none
           running_query_num: 0
           waiting_query_num: 0
```

### Example 2: Show workload groups using a pattern

```sql
SHOW WORKLOAD GROUPS LIKE "normal%";
```

```text
mysql> show workload groups like "normal%" \G;
*************************** 1. row ***************************
                          Id: 1754728930516
                        Name: normal
             min_cpu_percent: 20%
             max_cpu_percent: 30%
          min_memory_percent: 0%
          max_memory_percent: 50%
             max_concurrency: 1
              max_queue_size: 1
               queue_timeout: 0
             scan_thread_num: 16
  max_remote_scan_thread_num: -1
  min_remote_scan_thread_num: -1
        memory_low_watermark: 75%
       memory_high_watermark: 85%
               compute_group: default
       read_bytes_per_second: -1
remote_read_bytes_per_second: -1
          slot_memory_policy: none
           running_query_num: 0
           waiting_query_num: 0
```

## Field Descriptions

This statement returns the workload groups visible to the current user. Common output fields are described below:

| Field | Description |
| --- | --- |
| `Id` | The ID of the workload group. |
| `Name` | The workload group name. |
| `min_cpu_percent` | The minimum guaranteed CPU percentage. |
| `max_cpu_percent` | The maximum CPU percentage. |
| `min_memory_percent` | The minimum guaranteed memory percentage. |
| `max_memory_percent` | The maximum memory percentage. |
| `max_concurrency` | The maximum number of concurrent queries. |
| `max_queue_size` | The maximum queue length for waiting queries. |
| `queue_timeout` | The maximum queue wait time in milliseconds. |
| `scan_thread_num` | The number of local scan threads used by the workload group. |
| `max_remote_scan_thread_num` | The maximum number of scan threads for remote data sources. |
| `min_remote_scan_thread_num` | The minimum number of scan threads for remote data sources. |
| `memory_low_watermark` | The low memory watermark. |
| `memory_high_watermark` | The high memory watermark. |
| `compute_group` | The compute group to which the workload group belongs. In non-cloud mode, this usually shows the default resource group/tag, such as `default`. |
| `read_bytes_per_second` | The IO throughput limit for reading Doris internal tables, in bytes per second. `-1` means unlimited. |
| `remote_read_bytes_per_second` | The IO throughput limit for reading remote data sources, in bytes per second. `-1` means unlimited. |
| `slot_memory_policy` | The memory allocation policy for query slots. |
| `running_query_num` | The number of queries currently running in this workload group. |
| `waiting_query_num` | The number of queries currently waiting in this workload group's queue. |

## Usage Notes

1. This statement supports only `LIKE` filtering and does not support a `WHERE` clause.
2. This statement is intended for simple display of workload group information. For more complex querying or filtering, use the TVF `workload_groups()`.
3. Results are filtered by privilege. To view a specific workload group, the user must have `USAGE_PRIV` on that workload group or have the global `ADMIN_PRIV`. Example:

   ```sql
   GRANT USAGE_PRIV ON WORKLOAD GROUP 'g1' TO 'user_1'@'%';
   ```

4. In the current implementation, the default workload group `normal` is usually visible without extra authorization for compatibility reasons.
