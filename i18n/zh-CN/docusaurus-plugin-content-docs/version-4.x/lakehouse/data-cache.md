---
{
    "title": "数据缓存",
    "language": "zh-CN",
    "description": "数据缓存（Data Cache）通过缓存最近访问的远端存储系统（HDFS 或对象存储）的数据文件到本地磁盘上，加速后续访问相同数据的查询。在频繁访问相同数据的查询场景中，Data Cache 可以避免重复的远端数据访问开销，提升热点数据的查询分析性能和稳定性。"
}
---

数据缓存（Data Cache）通过缓存最近访问的远端存储系统（HDFS 或对象存储）的数据文件到本地磁盘上，加速后续访问相同数据的查询。在频繁访问相同数据的查询场景中，Data Cache 可以避免重复的远端数据访问开销，提升热点数据的查询分析性能和稳定性。

## 适用场景

数据缓存功能仅作用于 Hive、Iceberg、Hudi、Paimon 表的查询。对内表查询，或非文件的外表查询（如 JDBC、Elasticsearch）等无效果。

数据缓存是否能提升查询效率，取决于多方面因素，下面给出数据缓存的适用场景：

* 高速本地磁盘

  建议使用高速本地磁盘，如 SSD 或 NVME 介质的本地磁盘作为数据缓存目录。不建议使用机械硬盘作为数据缓存目录。本质上，需确保本地磁盘的 IO 带宽和 IOPS 显著高于网络带宽、源端存储系统的 IO 带宽和 IOPS，才可能带来明显的性能提升。

* 足够的缓存空间大小

  数据缓存使用 LRU 策略作为缓存淘汰策略。如果查询的数据并没有明显的冷热区分，则缓存数据有可能处于频繁的更新和汰换过程中，反而可能降低查询性能。推荐查询模式有明显冷热区分（如大部分查询只访问当天的数据，几乎不访问历史数据），并且缓存空间足够存储热数据的场景下开启数据缓存。

* 远端存储的 IO 延迟不稳定

  这种情况通常出现在 HDFS 存储上。多数企业中不同的业务部门会共用同一套 HDFS，因此可能导致高峰期 HDFS 的 IO 延迟非常不稳定。这种情况下，如需确保 IO 延迟稳定，建议开启数据缓存。但仍需考虑前两种情况。

## 开启数据缓存

数据缓存功能是默认关闭的，需要在 FE 和 BE 中设置相关参数进行开启。

### BE 配置

首先，需要在 `be.conf` 中配置缓存路径信息，并重启 BE 节点让配置生效。

| 参数                  | 必选项 | 说明                                     |
| ------------------- | --- | -------------------------------------- |
| `enable_file_cache` | 是   | 是否启用 Data Cache，默认 false               |
| `file_cache_path`   | 是   | 缓存目录的相关配置，json 格式。                      |
| `clear_file_cache`  | 否   | 默认 false。如果为 true，则当 BE 节点重启时，会清空缓存目录。 |

`file_cache_path` 的配置示例：

```sql
file_cache_path=[{"path": "/path/to/file_cache1", "total_size":53687091200},{"path": "/path/to/file_cache2", "total_size":53687091200},{"path": "/path/to/file_cache3", "total_size":53687091200}]
```

`path` 是缓存的保存路径，可以配置一个或多个。建议同一块磁盘只配置一个路径。

`total_size` 是缓存的空间大小上限。单位是字节。超过缓存空间后，会通过 LRU 策略进行缓存数据的淘汰。

### FE 配置

单个会话中开启 Data Cache:

```sql
SET enable_file_cache = true;
```

全局开启 Data Cache:

```sql
SET GLOBAL enable_file_cache = true;
```

注意，如果没有开启 `enable_file_cache`，即使 BE 配置了缓存目录，也不会使用缓存。同样，如果 BE 没有配置缓存目录，即使开启 `enable_file_cache`，也不会使用缓存。

## 缓存可观测性

### 查看缓存命中情况

执行 `set enable_profile=true` 打开会话变量，可以在 FE 的 web 页面的 `Queris` 标签中查看到作业的 Profile。数据缓存相关的指标如下：

```sql
-  FileCache:  0ns
    -  BytesScannedFromCache:  2.02  GB
    -  BytesScannedFromRemote:  0.00  
    -  BytesWriteIntoCache:  0.00  
    -  LocalIOUseTimer:  2s723ms
    -  NumLocalIOTotal:  444
    -  NumRemoteIOTotal:  0
    -  NumSkipCacheIOTotal:  0
    -  RemoteIOUseTimer:  0ns
    -  WriteCacheIOUseTimer:  0ns
```

* `BytesScannedFromCache`：从本地缓存中读取的数据量。

* `BytesScannedFromRemote`：从远端读取的数据量。

* `BytesWriteIntoCache`：写入缓存的数据量。

* `LocalIOUseTimer`：本地缓存的 IO 时间。

* `RemoteIOUseTimer`：远端读取的 IO 时间。

* `NumLocalIOTotal`：本地缓存的 IO 次数。

* `NumRemoteIOTotal`：远端 IO 次数。

* `WriteCacheIOUseTimer`：写入缓存的 IO 时间。

如果 `BytesScannedFromRemote` 为 0，表示全部命中缓存。

### 监控指标

用户可以通过系统表 [`file_cache_statistics`](../admin-manual/system-tables/information_schema/file_cache_statistics) 查看各个 Backend 节点的缓存统计指标。

## 缓存预热

Data Cache 提供缓存“预热（Warmup）”功能，允许将外部数据提前加载到 BE 节点的本地缓存中，从而提升后续首次查询的命中率和查询性能。

> 该功能自 4.0.2 版本支持。

### 语法

```sql
WARM UP SELECT <select_expr_list>
FROM <table_reference>
[WHERE <boolean_expression>]
```

使用限制：

* 支持：

  * 单表查询（仅允许一个 table_reference）
  * 指定列的简单 SELECT
  * WHERE 过滤（支持常规谓词）

* 不支持：

  * JOIN、UNION、子查询、CTE
  * GROUP BY、HAVING、ORDER BY
  * LIMIT
  * INTO OUTFILE
  * 多表 / 复杂查询计划
  * 其它复杂语法

### 示例

1. 预热整张表

  ```sql
  WARM UP SELECT * FROM hive_db.tpch100_parquet.lineitem;
  ```

2. 根据分区预热部分列

  ```sql
  WARM UP SELECT l_orderkey, l_shipmode
  FROM hive_db.tpch100_parquet.lineitem
  WHERE dt = '2025-01-01';
  ```
3. 根据过滤条件预热部分列

  ```sql
  WARM UP SELECT l_shipmode, l_linestatus
  FROM hive_db.tpch100_parquet.lineitem
  WHERE l_orderkey = 123456;
  ```

### 执行返回结果

执行 `WARM UP SELECT` 后，FE 会下发任务至各 BE。BE 扫描远端数据并写入 Data Cache。

系统会直接返回各 BE 的扫描与缓存写入统计信息（注意：统计信息基本准确，但会有一定误差）。例如：

```
+---------------+-----------+-------------+---------------------------+----------------------------+---------------------+
| BackendId     | ScanRows  | ScanBytes   | ScanBytesFromLocalStorage | ScanBytesFromRemoteStorage | BytesWriteIntoCache |
+---------------+-----------+-------------+---------------------------+----------------------------+---------------------+
| 1755134092928 | 294744184 | 11821864798 | 538154009                 | 11283717130                | 11899799492         |
| 1755134092929 | 305293718 | 12244439301 | 560970435                 | 11683475207                | 12332861380         |
| TOTAL         | 600037902 | 24066304099 | 1099124444                | 22967192337                | 24232660872         |
+---------------+-----------+-------------+---------------------------+----------------------------+---------------------+
```

字段解释

* ScanRows：扫描读取行数。
* ScanBytes：扫描读取数据量。
* ScanBytesFromLocalStorage：从本地缓存扫描读取的数据量。
* ScanBytesFromRemoteStorage：从远端存储扫描读取的数据量。
* BytesWriteIntoCache：本次预热写入 Data Cache 的数据量。

## 附录

### 原理

数据缓存将访问的远程数据缓存到本地的 BE 节点。原始的数据文件会根据访问的 IO 大小切分为 Block，Block 被存储到本地文件 `cache_path/hash(filepath).substr(0, 3)/hash(filepath)/offset` 中，并在 BE 节点中保存 Block 的元信息。当访问相同的远程文件时，doris 会检查本地缓存中是否存在该文件的缓存数据，并根据 Block 的 offset 和 size，确认哪些数据从本地 Block 读取，哪些数据从远程拉起，并缓存远程拉取的新数据。BE 节点重启的时候，扫描 `cache_path` 目录，恢复 Block 的元信息。当缓存大小达到阈值上限的时候，按照 LRU 原则清理长久未访问的 Block。
