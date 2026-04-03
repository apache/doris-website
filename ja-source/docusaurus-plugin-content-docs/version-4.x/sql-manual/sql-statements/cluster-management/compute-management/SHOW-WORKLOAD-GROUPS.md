---
{
  "title": "SHOW WORKLOAD GROUPS",
  "description": "この文は、現在のユーザーがusageprivの権限を持つリソースグループを表示するために使用されます。",
  "language": "ja"
}
---
## デスクリプション

このステートメントは、現在のユーザーがusage_priv権限を持つリソースグループを表示するために使用されます。

## Syntax

```sql
SHOW WORKLOAD GROUPS [LIKE "<pattern>"];
```
## 使用上の注意

このステートメントはワークロードグループの簡単な表示のみを行います。より複雑な表示については、tvf workload_groups()を参照してください。

## 例

1. すべてのワークロードグループを表示する：

    ```sql
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
2. パターンを使用してワークロードグループを表示する

    ```sql
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
