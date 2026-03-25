---
{
    "title": "POC 前必读",
    "language": "zh-CN",
    "description": "Apache Doris POC 前必读：涵盖建表设计（数据模型、排序键、分区、分桶）、数据导入最佳实践、查询调优以及数据湖（Hive、Iceberg、Paimon）查询优化，帮助新用户快速完成 POC 验证。",
    "sidebar_label": "POC 前必读"
}
---

本文档汇总了新用户常见的问题，旨在加速 POC 进程。内容按照 POC 的典型流程组织：

1. **建表设计** — 选择数据模型、排序键、分区与分桶策略。
2. **数据导入** — 选择合适的导入方式，避免常见陷阱。
3. **查询调优** — 排查慢查询，优化分桶与索引配置。
4. **数据湖查询** — 针对 Lakehouse 场景的额外优化要点。

## 建表设计

在 Doris 中建表涉及四个影响导入和查询性能的决策：数据模型、排序键、分区和分桶。

### 数据模型

根据数据写入方式选择合适的模型：

| 数据特征 | 推荐模型 | 原因 |
|---|---|---|
| 仅追加（日志、事件、事实表） | **Duplicate Key**（默认） | 保留所有行，查询性能最好 |
| 按主键更新（CDC、Upsert） | **Unique Key** | 新行按相同 Key 替换旧行 |
| 预聚合指标（PV、UV、汇总） | **Aggregate Key** | 写入时按 SUM/MAX/MIN 合并行 |

**Duplicate Key 适用于大多数场景。**详见[数据模型概述](../table-design/data-model/overview)。

### Sort Key（排序键）

Doris 在排序键的前 36 字节上构建[前缀索引](../table-design/index/prefix-index)，设置排序键时注意以下原则：

- **高频过滤列优先**：将最常用于 WHERE 条件的列放在最前面。
- **定长类型优先**：INT、BIGINT、DATE 等定长类型放在 VARCHAR 之前，因为遇到 VARCHAR 时前缀索引会立即截断。
- **补充倒排索引**：前缀索引覆盖不到的列，可添加[倒排索引](../table-design/index/inverted-index/overview)加速过滤。

### 分区

如果有时间列，使用 `AUTO PARTITION BY RANGE(date_trunc(time_col, 'day'))` 启用[分区裁剪](../table-design/data-partitioning/auto-partitioning)。Doris 会自动跳过无关分区。

### 分桶

默认是 **Random 分桶**（推荐用于 Duplicate Key 表）。如果频繁按某列过滤或 JOIN，使用 `DISTRIBUTED BY HASH(该列)`。详见[数据分桶](../table-design/data-partitioning/data-bucketing)。

**如何选择分桶数：**

| 原则 | 说明 |
|---|---|
| 设为 BE 数量的整数倍 | 确保数据均匀分布。后续扩容 BE 时，查询通常涉及多个分区，性能不会受影响 |
| 尽可能少 | 避免产生小文件 |
| 每个分桶压缩后数据 ≤ 20 GB | Unique Key 表 ≤ 10 GB。可通过 `SHOW TABLETS FROM your_table` 查看 |
| 每个分区不超过 128 个分桶 | 需要更多时优先考虑增加分区。极端情况下上限为 1024，但生产环境中很少需要 |

### 建表模板

#### 日志 / 事件分析

```sql
CREATE TABLE app_logs
(
    log_time      DATETIME    NOT NULL,
    log_level     VARCHAR(10),
    service_name  VARCHAR(50),
    trace_id      VARCHAR(64),
    message       STRING,
    INDEX idx_message (message) USING INVERTED PROPERTIES("parser" = "unicode")
)
AUTO PARTITION BY RANGE(date_trunc(`log_time`, 'day'))
()
DISTRIBUTED BY RANDOM BUCKETS 10;
```

#### 实时看板与 Upsert（CDC）

```sql
CREATE TABLE user_profiles
(
    user_id       BIGINT      NOT NULL,
    username      VARCHAR(50),
    email         VARCHAR(100),
    status        TINYINT,
    updated_at    DATETIME
)
UNIQUE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

#### 指标聚合

```sql
CREATE TABLE site_metrics
(
    dt            DATE        NOT NULL,
    site_id       INT         NOT NULL,
    pv            BIGINT      SUM DEFAULT '0',
    uv            BIGINT      MAX DEFAULT '0'
)
AGGREGATE KEY(dt, site_id)
AUTO PARTITION BY RANGE(date_trunc(`dt`, 'day'))
()
DISTRIBUTED BY HASH(site_id) BUCKETS 10;
```

## 数据导入

选择合适的导入方式并遵循以下最佳实践，可以有效避免常见的性能问题：

- **批量数据不要用 `INSERT INTO VALUES`。**请使用 [Stream Load](../data-operate/import/import-way/stream-load-manual) 或 [Broker Load](../data-operate/import/import-way/broker-load-manual)。详见[导入概述](../data-operate/import/load-manual)。
- **优先在客户端合并写入。**高频小批次导入导致版本堆积。如不可行，使用 [Group Commit](../data-operate/import/group-commit-manual)。
- **将大型导入拆分为小批次。**长时间运行的导入失败后必须从头重试。使用 [INSERT INTO SELECT 配合 S3 TVF](../data-operate/import/streaming-job/streaming-job-tvf) 实现增量导入。
- **Random 分桶的 Duplicate Key 表启用 `load_to_single_tablet`**，减少写放大。

详见[导入最佳实践](../data-operate/import/load-best-practices)。

## 查询调优

### 分桶相关

分桶数直接影响查询并行度和调度开销，需要在两者之间取得平衡：

- **不要分桶过多。**过多的小 tablet 会产生调度开销，查询性能最多可下降 50%。
- **不要分桶过少。**过少的 tablet 会限制 CPU 并行度。
- **避免数据倾斜。**通过 `SHOW TABLETS` 检查 tablet 大小。差异明显时切换为 Random 分桶或选择基数更高的分桶列。

参见[分桶](#分桶)了解分桶数选择。

### 索引相关

- **正确设置排序键。**与 PostgreSQL 等系统不同，Doris 仅对排序键的前 36 字节建立索引，且遇到 VARCHAR 会立即截断。超出前缀范围的列无法从排序键受益，需添加[倒排索引](../table-design/index/inverted-index/overview)。参见 [Sort Key（排序键）](#sort-key排序键)。

### 诊断工具

诊断慢查询请使用 [Query Profile](../query-acceleration/query-profile)。

## 数据湖查询

如果 POC 涉及通过 Doris 查询 Hive、Iceberg、Paimon 等湖上数据（即 Lakehouse 场景），以下几点对测试结果影响最大。

### 确保分区裁剪生效

湖上表往往有海量数据，查询时务必在 WHERE 条件中包含分区列，使 Doris 只扫描必要的分区。可通过 `EXPLAIN <SQL>` 查看 `partition` 字段确认裁剪是否生效：

```
0:VPAIMON_SCAN_NODE(88)
    partition=203/0          -- 203 个分区被裁剪，实际扫描 0 个
```

如果分区数远大于预期，检查查询的 WHERE 条件是否正确匹配分区列。

### 开启 Data Cache

远端存储（HDFS/对象存储）的 IO 延迟比本地磁盘高出数倍。Data Cache 将最近访问的远端数据缓存到 BE 本地磁盘，**重复查询同一批数据时可获得接近内表的查询性能**。

- 缓存默认关闭，请参阅 [数据缓存](../lakehouse/data-cache) 文档进行配置。
- 自 4.0.2 版本起支持**缓存预热**，可在 POC 测试前主动加载热数据。

:::tip
POC 中建议先执行一次查询完成缓存加载，再以第二次查询的延迟作为基准。这样可以更准确地评估生产环境的常态性能。
:::

### 治理小文件

湖上数据常存在大量小文件。小文件会被拆分为大量 Split，导致 FE 内存压力增大甚至 OOM，查询规划开销上升。

- **从源头治理（推荐）：**在 Hive/Spark 侧定期合并小文件，使每个文件保持在 128 MB 以上。
- **Doris 侧兜底：**通过 `SET max_file_split_num = 50000;`（4.0.4 起支持）限制每次扫描的最大 Split 数量，防止 OOM。

### 使用 Query Profile 诊断

湖上查询的瓶颈通常在 IO 而非计算。[Query Profile](../query-acceleration/query-profile) 可以定位慢查询根因，重点关注：

- **Split 数量和数据量**：判断是否扫描了过多数据。
- **MergeIO 指标**：若 `MergedBytes` 远大于 `RequestBytes`，说明读放大严重，可通过调小 `merge_io_read_slice_size_bytes`（默认 8 MB）来缓解。
- **Cache 命中率**：确认 Data Cache 是否在有效工作。

更多优化手段请参阅[数据湖查询调优](../lakehouse/best-practices/optimization)。
