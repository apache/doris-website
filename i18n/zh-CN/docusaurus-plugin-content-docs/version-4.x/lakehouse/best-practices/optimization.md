---
{
    "title": "数据湖查询调优",
    "language": "zh-CN",
    "description": "本文档主要介绍在针对湖上数据（Hive、Iceberg、Paimon 等）查询的优化手段和优化策略。"
}
---

本文档主要介绍在针对湖上数据（Hive、Iceberg、Paimon 等）查询的优化手段和优化策略。

## 分区裁剪

通过在查询中指定分区列条件，能够裁减掉不必要的分区，减少需要读取的数据量。

可以通过 `EXPLAIN <SQL>` 来查看 `XXX_SCAN_NODE` 的 `partition` 部分，可以查看分区裁剪是否生效，以及本次查询需要扫描多少分区。

如：

```
0:VPAIMON_SCAN_NODE(88)
    table: paimon_ctl.db.table
    predicates: (user_id[#4] = 431304818)
    inputSplitNum=15775, totalFileSize=951754154566, scanRanges=15775
    partition=203/0
```

## 本地数据缓存

数据缓存（Data Cache）通过缓存最近访问的远端存储系统（HDFS 或对象存储）的数据文件到本地磁盘上，加速后续访问相同数据的查询。

缓存功能默认是关闭的，请参阅 [数据缓存](../data-cache.md) 文档配置并开启。

自 4.0.2 版本开始支持缓存预热功能，可以进一步主动利用数据缓存提升查询性能。

## HDFS 读取优化

可参考 [HDFS 文档](../storages/hdfs.md) 中 **HDFS IO 优化** 部分。

## Split 数量限制

当查询外部表（Hive、Iceberg、Paimon 等）时，Doris 会将文件拆分成多个 split 进行并行处理。在某些场景下，尤其是存在大量小文件时，可能会生成过多的 split，导致：

1. 内存压力：过多的 split 会消耗 FE 大量内存
2. OOM 问题：split 数量过多可能导致 OutOfMemoryError
3. 性能下降：管理过多 split 会增加查询规划开销

可以通过 `max_file_split_num` 会话变量来限制每个 table scan 允许的最大 split 数量（该参数自 4.0.4 版本支持）：

- 类型：`int`
- 默认值：`100000`
- 说明：在非 batch 模式下，每个 table scan 最大允许的 split 数量，防止产生过多 split 导致 OOM。

使用示例：

```sql
-- 设置最大 split 数量为 50000
SET max_file_split_num = 50000;

-- 禁用该限制（设置为 0 或负数）
SET max_file_split_num = 0;
```

当设置了该限制后，Doris 会动态计算最小的 split 大小，以确保 split 数量不超过设定的上限。

## File Scanner V2

> 自 4.1.4 版本开始支持。

File Scanner V2 是外表文件扫描的新执行引擎，覆盖 Parquet、ORC、CSV、JSON 格式，以及 Hive、Iceberg、Paimon、Hudi 等表格式的读取。相比旧版扫描器，它在裁剪能力、并发切分和内存使用上都做了优化。

由会话变量 `enable_file_scanner_v2` 控制：

- 类型：`boolean`
- 默认值：`true`（默认开启）
- 说明：开启后，`FileScanNode` 在支持的查询场景下使用 File Scanner V2。JDBC Catalog、Iceberg 系统表等场景仍走旧的扫描路径。

如果怀疑某个查询的问题与新扫描器相关，可以临时关闭后对比：

```sql
SET enable_file_scanner_v2 = false;
```

### 数据裁剪行为

File Scanner V2 会**始终执行安全的分区裁剪与表达式 ZoneMap 裁剪**，不再受下列会话变量控制。这两个变量只影响仍然遵循它们的旧扫描器：

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `enable_runtime_filter_partition_prune` | `true` | 是否启用 Runtime Filter 分区裁剪。File Scanner V2 始终启用安全的分区裁剪，设置为 `false` 对其无效 |
| `enable_expr_zonemap_filter` | `false` | 是否启用表达式 ZoneMap 过滤。File Scanner V2 始终启用安全的表达式 ZoneMap 过滤 |

### BE 侧细粒度 Split 切分

> 自 4.1.4 版本开始支持。

开启 File Scanner V2 后，FE 只做粗粒度的文件切分，BE 再按 Parquet 的 Row Group / ORC 的 Stripe 做二次细分，并在同一个 Scan Instance 内并发执行。相邻的 Row Group / Stripe 会被合并到接近目标大小。

| 会话变量 | 默认值 | 说明 |
| --- | --- | --- |
| `file_split_size_on_fe` | `536870912`（512MB） | 支持 BE 二次切分时，FE 粗粒度文件分片的目标大小，单位为字节 |
| `file_split_size_on_be` | `67108864`（64MB） | BE 上细粒度文件分片的目标大小，单位为字节 |

适用范围：Hive、Iceberg、原生 Paimon RawFile 以及文件类 TVF 产生的原生 Parquet / ORC 分片，且开启了 File Scanner V2、至少有两个 Scanner 可以消费生成的任务。

以下场景不适用，会回退到 FE 的旧切分策略（此时由 `file_split_size`、`max_initial_file_split_size`、`max_file_split_size`、`max_file_split_num` 控制）：

- 非 Parquet / ORC 格式；
- 关闭了 File Scanner V2；
- `max_file_scanners_concurrency = 1`，或小 LIMIT 查询下 BE 只使用一个 Scanner；
- 事务型（Full ACID）Hive 表扫描；
- 表级元数据 COUNT 优化的扫描；
- 携带 Delete File 的 Iceberg 数据文件；
- 序列化的逻辑 / JNI Paimon Split；
- `file_split_size_on_fe` 或 `file_split_size_on_be` 被设置为非正数。

:::tip 注意
Row Group 和 Stripe 是不可再分的最小单位，因此单个分片的实际大小可能超过 `file_split_size_on_be` 设置的目标值。
:::

## 外表扫描任务复用

> 自 4.1.4 版本开始支持。

同一条 SQL 中如果多次引用同一张外表（例如自连接、CTE 多次引用），这些等价的扫描节点可以复用同一份已生成的 Split，避免 FE 重复做切分规划。

由会话变量 `enable_external_scan_task_reuse` 控制：

- 类型：`boolean`
- 默认值：`true`
- 说明：是否复用同一语句中相同外表扫描节点生成的 Split。适用于 Hive、Hudi、Iceberg、Paimon。

## Merge IO 优化

针对 HDFS、对象存储等远端存储系统，Doris 会通过 Merge IO 技术来优化 IO 访问。Merge IO 技术，本质上是将多个相邻的小 IO 请求，合并成一个大 IO 请求，这样可以减少 IOPS，增加 IO 吞吐。

比如原始请求需要读取文件 `file1` 的 [0, 10] 和 [20, 50] 两部分数据：

```
Request Range: [0, 10], [20, 50]
```

通过 Merge IO，会合并成一个请求：

```
Request Range: [0, 50]
```

在这个示例中，两次 IO 请求合并为了一次，但同时也多读了一部分数据（10-20 之间的数据）。因此，Merge IO 在降低 IO 次数的同时，可能带来潜在的读放大问题。

通过 Query Profile 可以查看 MergeIO 的具体情况：

```
- MergedSmallIO:
    - MergedBytes: 3.00 GB
    - MergedIO: 424
    - RequestBytes: 2.50 GB
    - RequestIO: 65.555K (65555)
```

其中 `RequestBytes` 和 `RequestIO` 标识原始请求的数据量和请求次数。`MergedBytes` 和 `MergedIO` 标识合并和的请求数据量和请求次数。

如果发现 `MergedBytes` 数据量远大于 `RequestBytes`，则说明读放大比较严重，可以通过下面的参数调整修改：

- `merge_io_read_slice_size_bytes`

    会话变量，自 3.1.3 版本支持。默认为 8MB。如果发现读放大严重，可以将此参数调小，如 64KB。并观察修改后的 IO 请求和查询延迟是否有提升。

## Parquet Page Cache

:::info
自 4.1.0 版本支持。
:::

Parquet Page Cache 是针对 Parquet 文件的页级缓存机制。该功能与 Doris 现有的 Page Cache 框架集成，通过在内存中缓存解压后（或压缩的）数据页，显著提升查询性能。

### 主要特性

1. **统一的 Page Cache 集成**
    - 与 Doris 内表使用的 `StoragePageCache` 共享同一个基础框架
    - 共享内存池和淘汰策略
    - 复用现有的缓存统计和 RuntimeProfile 进行统一的性能监控

2. **智能缓存策略**
    - **压缩比感知**：根据 `parquet_page_cache_decompress_threshold` 参数自动选择缓存压缩数据还是解压后的数据
    - **灵活的存储方式**：当 `解压后大小 / 压缩大小 ≤ 阈值` 时缓存解压后的数据，否则根据 `enable_parquet_cache_compressed_pages` 决定是否缓存压缩数据
    - **缓存键设计**：使用 `file_path::mtime::offset` 作为缓存键，确保文件修改后缓存的一致性

### 相关配置参数

以下为 BE 配置参数：

- `enable_parquet_page_cache`

    是否启用 Parquet Page Cache 功能。默认为 `false`。

- `parquet_page_cache_decompress_threshold`

    控制缓存压缩数据还是解压数据的阈值。默认为 `1.5`。当 `解压后大小 / 压缩大小` 的比值小于或等于该阈值时，会缓存解压后的数据；否则会根据 `enable_parquet_cache_compressed_pages` 的设置决定是否缓存压缩数据。

- `enable_parquet_cache_compressed_pages`

    当压缩比超过阈值时，是否缓存压缩的数据页。默认为 `true`。

### 性能监控

通过 Query Profile 可以查看 Parquet Page Cache 的使用情况：

```
ParquetPageCache:
    - PageCacheHitCount: 1024
    - PageCacheMissCount: 128
```

其中 `PageCacheHitCount` 表示缓存命中次数，`PageCacheMissCount` 表示缓存未命中次数。
