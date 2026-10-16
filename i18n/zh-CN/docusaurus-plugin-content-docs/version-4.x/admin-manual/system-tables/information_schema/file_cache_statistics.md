---
{
    "title": "file_cache_statistics",
    "language": "zh-CN",
    "description": "用于查看各个 BE 节点 数据缓存 相关的指标信息。"
}
---

## 概述

用于查看各个 BE 节点 [数据缓存](../../../lakehouse/file-analysis.md) 相关的指标信息。

指标信息来源于 BE 的数据缓存相关监控指标。

:::tip 提示
该系统表自 2.1.6 和 3.0.2 版本支持。
:::

## 所属数据库

`information_schema`

## 表信息

| 列名 | 类型 | 说明 |
|---|---|---|
| BE_ID | BIGINT  | BE 节点 ID  | 
| BE_IP | STRING | BE 节点 IP |
| CACHE_PATH | STRING | BE 节点缓存路径 |
| METRIC_NAME | STRING | 指标名称 |
| METRIC_VALUE | STRING | 指标值的文本表示，进行数值比较或计算时需显式转换类型 |

:::info 备注

Doris 不同版本可能包含不同的指标信息。

:::

### 2.1.x 版本指标说明

> 仅列举重要指标。

- `normal_queue_curr_elements`

    当前缓存中 File Block 的个数。

- `normal_queue_max_elements`

    缓存允许的 File Block 最大个数。

- `normal_queue_curr_size`

    当前缓存大小

- `normal_queue_max_size`

    缓存允许的最大大小

- `hits_ratio`

    自 BE 启动后的缓存总命中率。范围 0-1。

- `hits_ratio_5m`

    最近 5 分钟的缓存命中率。范围 0-1。

- `hits_ratio_1h`

    最近 1 小时的缓存命中率。范围 0-1。

### 3.0.x 版本指标说明

TODO

### 4.1.5 版本指标变化

自 4.1.5 版本起，新增以下两项 `METRIC_NAME`。指标按 BE 和缓存路径分别累计，数值自进程启动后计数：

| METRIC_NAME | 单位 | 含义 |
| --- | --- | --- |
| `evict_not_downloaded_size` | 字节 | 移除尚未下载完成的缓存块时累计的逻辑范围大小；不包含正在下载的块，不代表已下载数据的物理淘汰量 |
| `evict_not_downloaded_num` | 块 | 上述缓存块被移除的累计个数 |

同一版本起，`total_removed_size` 仅累计已下载完成的缓存块被移除的字节数。尚未下载的块使用上述新指标单独统计，正在下载的块标记为待删除时不增加这些计数。

这些指标在 brpc `/vars` 接口中对应带缓存路径前缀的 `file_cache_evict_not_downloaded_size` 和 `file_cache_evict_not_downloaded_num`，详见 [文件缓存监控](../../../compute-storage-decoupled/file-cache/file-cache.md#缓存空间与命中率指标)。系统表中的 `METRIC_NAME` 不带路径前缀，路径由 `CACHE_PATH` 列给出。

例如，查询新指标以及已下载数据的累计移除量：

```sql
SELECT BE_ID, CACHE_PATH, METRIC_NAME, CAST(METRIC_VALUE AS DOUBLE) AS metric_value
FROM information_schema.file_cache_statistics
WHERE METRIC_NAME IN ('total_removed_size', 'evict_not_downloaded_size', 'evict_not_downloaded_num')
ORDER BY BE_ID, CACHE_PATH, METRIC_NAME;
```

每个 BE 的每条缓存路径分别返回对应指标值，结果随缓存活动变化。

## 示例

1. 查询所有缓存指标

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

2. 查询缓存命中率，并按命中率排序

    ```sql
    select * from information_schema.file_cache_statistics where METRIC_NAME = "hits_ratio" order by cast(METRIC_VALUE as double) desc;
    ```
