---
{
    "title": "SHOW WORKLOAD GROUPS",
    "language": "zh-CN",
    "description": "该语句用于展示当前用户具有 usagepriv 权限的资源组。"
}
---

## 描述


该语句用于展示当前用户具有 usage_priv 权限的资源组。


## 语法

```sql
SHOW WORKLOAD GROUPS [LIKE "<pattern>"];
```

## 注意事项

该语句仅做资源组简单展示，更复杂的展示可参考 tvf workload_groups().

## 示例

1. 展示所有资源组：
    
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

2. 使用 LIKE 模糊匹配：
    

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