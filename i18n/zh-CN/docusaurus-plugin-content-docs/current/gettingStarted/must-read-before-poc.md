---
{
    "title": "POC 前必读",
    "language": "zh-CN",
    "description": "了解 Apache Doris 建表时的四个关键决策——数据模型、排序键、分区和分桶——以及它们为什么对 POC 性能至关重要。",
    "sidebar_label": "POC 前必读"
}
---

# POC 前必读

在 Doris 中建表涉及四个影响导入和查询性能的决策。其中一些（如数据模型）建表后无法更改。理解每个决策**为什么**存在，可以帮助你一次做对。

:::tip 最简建表语句

```sql
CREATE TABLE my_table
(
    id          INT,
    name        VARCHAR(100),
    created_at  DATETIME,
    amount      DECIMAL(10,2)
);
```

这是最简语法——Doris 默认使用 Duplicate Key 模型、单分区和 Random 分桶。它可以运行，但**在大多数 POC 场景中性能不佳。**请阅读以下四个决策，了解需要调整什么以及为什么。

:::

## 1. 数据模型

**为什么重要：**数据模型决定 Doris 是保留每一行、按主键只保留最新行，还是在写入时预聚合数据。

**如何选择：**问自己一个问题——*我需要更新数据吗？*

| 数据特征 | 使用 | 原因 |
|---|---|---|
| 仅追加（日志、事件、事实表） | **[Duplicate Key](../table-design/data-model/duplicate)**（默认——直接省略） | 保留所有行。查询性能最好。最安全的默认选择。 |
| 按主键更新（CDC 同步、用户画像） | **[Unique Key](../table-design/data-model/unique)** | 新行按相同 Key 替换旧行。 |
| 预聚合指标（PV、UV、收入汇总） | **[Aggregate Key](../table-design/data-model/aggregate)** | 写入时按 SUM/MAX/MIN 合并行。 |

POC 阶段，**Duplicate Key 适用于大多数场景**。只有在明确需要更新或预聚合时才切换。详细对比见[数据模型概述](../table-design/data-model/overview)。

## 2. 排序键

**为什么重要：**排序键决定数据在磁盘上的**物理排列顺序**。Doris 会在排序键的前 36 字节上自动构建[前缀索引](../table-design/index/prefix-index)，使基于这些列的过滤查询显著加速。但当遇到 `VARCHAR` 列时，前缀索引会立即截断——后续列不会被包含。因此，请将定长列（INT、BIGINT、DATE）放在 VARCHAR 前面，以最大化索引覆盖范围。

**如何选择：**将最常用于过滤的列放在最前面，定长类型在 VARCHAR 类型之前。之后可以为需要快速过滤的列添加[倒排索引](../table-design/index/inverted-index)。

## 3. 分区

**为什么重要：**分区将数据拆分为独立的管理单元。当查询的 WHERE 条件包含分区列时，Doris 只扫描相关分区——即**分区裁剪**，可以跳过绝大部分数据。

**如何选择：**

- **有时间列？** → 使用 `AUTO PARTITION BY RANGE(date_trunc(time_col, 'day'))`。分区在导入时自动创建，无需手动管理。
- **无时间列，数据 < 50 GB？** → 直接跳过分区。Doris 默认创建单分区。
- **无时间列，数据 > 50 GB？** → 考虑 `AUTO PARTITION BY LIST(category_col)` 按类别维度分区。

完整语法和高级选项见 [Auto Partition](../table-design/data-partitioning/auto-partitioning)。

## 4. 分桶

**为什么重要：**每个分桶存储为一个或多个 **tablet**（每个副本一个）。一个 tablet 位于单个 BE 节点上，因此扫描一个 tablet 只能使用那一个 BE。对于单个查询，并行度由 `分区数 × 分桶数` 决定——副本不会同时参与。对于并发查询，不同副本可以服务不同查询，因此总 tablet 数 `分区数 × 分桶数 × 副本数` 决定集群整体吞吐量。

**优先增加分区，再增加分桶。**分区和分桶都会增加 tablet 数量，但分区还能启用裁剪且更易管理（添加/删除）。需要更多并行度时，优先增加分区，其次才增加分桶数。

**如何选择分桶数：**遵循以下四条规则：

1. **设为 BE 数量的整数倍**——确保数据均匀分布在各节点上。
2. **尽可能少**——更少的分桶意味着更大的 tablet，可以提升扫描效率并减少元数据开销。在生产环境中，大表通常有很多分区，查询往往涉及多个分区，因此整体并行度主要来自分区——性能对分桶数并不敏感。
3. **每个分桶的压缩后数据大小不应超过 20 GB**（Unique Key 表不超过 **10 GB**）——可通过 `SHOW TABLETS FROM your_table` 查看。
4. **每个分区的分桶数不应超过 128**——如果需要更多，应优先考虑对表进行分区。

**默认是 Random 分桶** ——可以完全省略 `DISTRIBUTED BY` 子句。对于 Duplicate Key 表，推荐使用 Random 分桶，因为它支持 `load_to_single_tablet`，降低导入内存使用并提高导入吞吐。

**何时使用 Hash 分桶：**如果频繁按某列过滤或 JOIN，`DISTRIBUTED BY HASH(该列)` 可以启用**分桶裁剪**——Doris 跳过无关的分桶，比扫描全部分桶更快。

```sql
-- 默认：Random 分桶（省略该子句，或显式写出）
DISTRIBUTED BY RANDOM BUCKETS 10

-- 适合频繁按特定列过滤的查询
DISTRIBUTED BY HASH(user_id) BUCKETS 10
```

Hash 与 Random 分桶的详细对比见[数据分桶](../table-design/data-partitioning/data-bucketing)。

## 关键注意事项

新用户常踩的坑。建表前请务必阅读。

:::caution

**数据模型不可更改。**建表后无法从 Duplicate 改为 Unique 或 Aggregate。选错的唯一补救是新建表并重新导入数据。

:::

**STRING 类型不能作为 Key 列或分区列。**请使用 `VARCHAR` 代替。`STRING` 仅适用于存储大文本的 Value 列。对于 Key 列，`VARCHAR(65533)` 与 `VARCHAR(255)` 在存储相同数据时性能完全一致，所以放心使用较大的长度。完整类型参考见[数据类型](../table-design/data-type)。

**Aggregate Key 表不能很好地支持 `count(*)`。**因为值已预聚合，`count(*)` 无法简单计数。解决方法是添加一个列如 `row_count BIGINT SUM DEFAULT '1'`，查询时使用 `SELECT SUM(row_count)` 代替。

**已有分区的分桶数不可更改。**只能调整**新分区**的分桶数。请参考上方分桶章节的三条规则来选择合适的分桶数。

## 典型使用场景

常见 POC 场景的建表模板，可直接使用。

### 日志 / 事件分析

仅追加数据，按时间范围和关键词查询。

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

- 默认 **Duplicate Key** ——日志不更新，Random 分桶获得最佳导入吞吐
- **按天自动分区** ——时间范围查询跳过无关天数
- **message 倒排索引** ——支持全文检索（[详情](../table-design/index/inverted-index)）

### 实时看板与 Upsert（CDC）

从 MySQL/PostgreSQL 同步数据，按主键保留最新状态。

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

- **Unique Key** ——按 `user_id` 新行替换旧行，支持 [CDC 同步](../data-operate/import/data-source/migrate-data-from-other-oltp)
- **无分区** ——维度表，数据量小且非时序

### 指标聚合

写入时预计算 SUM/MAX，加速看板查询。

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

- **Aggregate Key** ——PV 自动求和，UV 取最大值（[详情](../table-design/data-model/aggregate)）
- **按天自动分区** ——按日汇总，自动创建分区

### 湖仓查询（无需建表）

直接查询外部数据（Hive、Iceberg、S3），无需导入，无需建表设计。

```sql
CREATE CATALOG lakehouse PROPERTIES (
    'type' = 'iceberg',
    'iceberg.catalog.type' = 'rest',
    'uri' = 'http://iceberg-rest:8181'
);

SELECT * FROM lakehouse.db.events WHERE dt = '2025-01-01';
```

这是验证 Doris 查询性能最快的方式——直接在现有数据上查询。如需更好性能，之后再创建内部表。详见[湖仓一体概述](../lakehouse/lakehouse-overview)。

## 常见性能陷阱

### 导入

- **大数据量使用 `INSERT INTO VALUES`。**这是最慢的导入方式。批量导入请使用 [Stream Load](../data-operate/import/import-way/stream-load-manual)（HTTP，同步，适合 < 10 GB 文件）或 [Broker Load](../data-operate/import/import-way/broker-load-manual)（异步，适合 S3/HDFS 上的大文件）。`INSERT INTO VALUES` 仅用于小规模测试。选择导入方式详见[导入概述](../data-operate/import/load-manual)。

- **大量小批次导入而不合并。**每次导入都会创建新的数据版本，需要后续 compaction。高频小批次导入导致版本堆积，增加内存和 CPU 压力。优先在客户端进行批量合并——这是最有效的方式。如果客户端合并不可行，可使用 [Group Commit](../data-operate/import/group-commit-manual) 在服务端自动合并小批次写入。

- **过多小 tablet。**总 tablet 数 = `分区数 × 分桶数 × 副本数`。过多小 tablet 导致导入内存压力大、元数据操作慢、产生过多小文件。避免过度分区或分桶数设置过高。事后减少 tablet 代价很大——不如一开始设少，后续按需增加。

- **单次长时间运行的导入语句。**如果一个大型导入中途失败，必须从头重试——恢复代价非常高。将大型导入拆分为小批次，或使用 [INSERT INTO SELECT 配合 S3 TVF](../data-operate/import/import-way/insert-into-manual) 实现增量导入与自动续传。

- **Random 分桶未启用 `load_to_single_tablet`。**对于使用 Random 分桶的 Duplicate Key 表，在导入时设置 `"load_to_single_tablet" = "true"`。每批数据写入单个 tablet，提高吞吐并减少写放大。

更多导入优化建议见[导入最佳实践](../data-operate/import/load-best-practices)。

### 查询

- **数据倾斜。**如果分桶列基数低或分布不均，部分 tablet 的数据量远大于其他。最慢的 tablet 决定整体查询耗时。通过 `SHOW TABLETS FROM your_table` 检查——如果 tablet 大小差异明显，选择基数更高的分桶列或切换为 Random 分桶以均匀分布。

- **排序键顺序不当。**如果最常用的过滤列不在[前缀索引](../table-design/index/prefix-index)中（排序键前 36 字节），查询会退化为扫描所有数据块。将最常过滤的列放在排序键最前面，或为该列添加[倒排索引](../table-design/index/inverted-index)。

- **缺少分区裁剪。**如果查询未在分区列上过滤，Doris 会扫描所有分区。尽可能在 WHERE 条件中包含分区列（通常是时间列）。

- **宽表使用 `SELECT *`。**Doris 是列式存储——只读取请求的列。对多列宽表使用 `SELECT *` 会读取所有列，浪费 I/O。请只查询需要的列。

诊断慢查询请使用 [Query Profile](../query-acceleration/query-profile) 查看耗时分布。

## 选错了怎么办？

POC 阶段，大多数决策都可以通过新建表并执行 `INSERT INTO new_table SELECT * FROM old_table` 来修复——耗时几分钟而非几天。唯一的例外是已有分区的分桶数无法原地修改。从合理的选择开始，观察实际表现，再进行优化。

生产级建表指导见[最佳实践](../table-design/best-practice)。
