---
{
    "title": "SHOW WORKLOAD GROUPS",
    "language": "zh-CN",
    "description": "该语句用于展示当前用户有权限查看的 Workload Group。"
}
---

## 描述

该语句用于展示当前用户有权限查看的 Workload Group。支持使用 `LIKE` 按名称进行模糊匹配。要查看某个 Workload Group，用户需要拥有该 Workload Group 上的 `USAGE_PRIV`，或者拥有全局 `ADMIN_PRIV`。

## 语法

```sql
SHOW WORKLOAD GROUPS [LIKE "<pattern>"];
```

## 示例

### 示例 1：展示所有资源组

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

### 示例 2：使用 LIKE 模糊匹配

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

## 字段说明

返回当前用户可见的 Workload Group 列表。常见返回字段说明如下：

| 字段 | 说明 |
| --- | --- |
| `Id` | Workload Group 的 ID。 |
| `Name` | Workload Group 名称。 |
| `min_cpu_percent` | CPU 最低保障比例。 |
| `max_cpu_percent` | CPU 使用上限比例。 |
| `min_memory_percent` | 内存最低保障比例。 |
| `max_memory_percent` | 内存使用上限比例。 |
| `max_concurrency` | 最大并发查询数。 |
| `max_queue_size` | 查询排队队列长度上限。 |
| `queue_timeout` | 查询在队列中的最大等待时间，单位为毫秒。 |
| `scan_thread_num` | 当前 Workload Group 使用的本地扫描线程数。 |
| `max_remote_scan_thread_num` | 读取远程数据源时允许使用的最大扫描线程数。 |
| `min_remote_scan_thread_num` | 读取远程数据源时允许使用的最小扫描线程数。 |
| `memory_low_watermark` | 内存低水位阈值。 |
| `memory_high_watermark` | 内存高水位阈值。 |
| `compute_group` | Workload Group 所属的 compute group。存算一体模式下通常显示默认 resource group/tag，例如 `default`。 |
| `read_bytes_per_second` | 读取 Doris 内表时的 IO 吞吐限制，单位为字节每秒；`-1` 表示不限制。 |
| `remote_read_bytes_per_second` | 读取远程数据源时的 IO 吞吐限制，单位为字节每秒；`-1` 表示不限制。 |
| `slot_memory_policy` | Query slot 的内存分配策略。 |
| `running_query_num` | 当前正在该 Workload Group 中运行的查询数。 |
| `waiting_query_num` | 当前在该 Workload Group 队列中等待的查询数。 |

## 注意事项

1. 该语句仅支持 `LIKE` 过滤，不支持 `WHERE` 子句。
2. 该语句用于简单展示 Workload Group 信息；如需更复杂的查询或筛选，可参考 TVF `workload_groups()`。
3. 返回结果会按当前用户权限过滤；要查看某个 Workload Group，用户需要拥有该 Workload Group 上的 `USAGE_PRIV`，或者拥有全局 `ADMIN_PRIV`。授权示例：

   ```sql
   GRANT USAGE_PRIV ON WORKLOAD GROUP 'g1' TO 'user_1'@'%';
   ```

4. 当前实现中，默认 Workload Group `normal` 出于兼容性通常无需额外授权也可见。
