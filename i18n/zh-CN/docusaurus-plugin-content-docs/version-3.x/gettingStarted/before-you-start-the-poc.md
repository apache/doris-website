---
{
    "title": "POC 前必读",
    "language": "zh-CN",
    "description": "新用户在 Apache Doris 建表设计、数据导入和查询调优中常见的问题。",
    "sidebar_label": "POC 前必读"
}
---

# POC 前必读

本文档汇总了新用户常见的问题，旨在加速 POC 进程。

## 建表设计

在 Doris 中建表涉及四个影响导入和查询性能的决策。

### 数据模型

| 数据特征 | 使用 | 原因 |
|---|---|---|
| 仅追加（日志、事件、事实表） | **Duplicate Key**（默认） | 保留所有行。查询性能最好。 |
| 按主键更新（CDC、Upsert） | **Unique Key** | 新行按相同 Key 替换旧行。 |
| 预聚合指标（PV、UV、汇总） | **Aggregate Key** | 写入时按 SUM/MAX/MIN 合并行。 |

**Duplicate Key 适用于大多数场景。**详见[数据模型概述](../table-design/data-model/overview)。

### Sort Key（排序键）

将最常用于过滤的列放在最前面，定长类型（INT、BIGINT、DATE）放在 VARCHAR 之前。Doris 在排序键的前 36 字节上构建[前缀索引](../table-design/index/prefix-index)，但遇到 VARCHAR 会立即截断。其他需要快速过滤的列可添加[倒排索引](../table-design/index/inverted-index)。

### 分区

如果有时间列，使用 `AUTO PARTITION BY RANGE(date_trunc(time_col, 'day'))` 启用[分区裁剪](../table-design/data-partitioning/auto-partitioning)。Doris 会自动跳过无关分区。

### 分桶

默认是 **Random 分桶**（推荐用于 Duplicate Key 表）。如果频繁按某列过滤或 JOIN，使用 `DISTRIBUTED BY HASH(该列)`。详见[数据分桶](../table-design/data-partitioning/data-bucketing)。

**如何选择分桶数：**

1. **设为 BE 数量的整数倍**，确保数据均匀分布。后续扩容 BE 时，查询通常涉及多个分区，性能不会受影响。
2. **尽可能少**，避免小文件。
3. **每个分桶的压缩后数据 ≤ 20 GB**（Unique Key 表 ≤ 10 GB）。可通过 `SHOW TABLETS FROM your_table` 查看。
4. **每个分区不超过 128 个分桶。**需要更多时优先考虑分区。极端情况下上限为 1024，但生产环境中很少需要。

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

## 性能陷阱

### 导入

- **批量数据不要用 `INSERT INTO VALUES`。**请使用 [Stream Load](../data-operate/import/import-way/stream-load-manual) 或 [Broker Load](../data-operate/import/import-way/broker-load-manual)。详见[导入概述](../data-operate/import/load-manual)。
- **优先在客户端合并写入。**高频小批次导入导致版本堆积。如不可行，使用 [Group Commit](../data-operate/import/group-commit-manual)。
- **将大型导入拆分为小批次。**长时间运行的导入失败后必须从头重试。使用 INSERT INTO SELECT 配合 S3 TVF 实现增量导入。
- **Random 分桶的 Duplicate Key 表启用 `load_to_single_tablet`**，减少写放大。

详见[导入最佳实践](../data-operate/import/load-best-practices)。

### 查询

- **避免数据倾斜。**通过 `SHOW TABLETS` 检查 tablet 大小。差异明显时切换为 Random 分桶或选择基数更高的分桶列。
- **不要分桶过多。**过多的小 tablet 会产生调度开销，查询性能最多可下降 50%。参见[分桶](#分桶)了解分桶数选择。
- **不要分桶过少。**过少的 tablet 会限制 CPU 并行度。参见[分桶](#分桶)了解分桶数选择。
- **正确设置排序键。**与 PostgreSQL 等系统不同，Doris 仅对排序键的前 36 字节建立索引，且遇到 VARCHAR 会立即截断。超出前缀范围的列无法从排序键受益，需添加[倒排索引](../table-design/index/inverted-index)。参见 [Sort Key（排序键）](#sort-key排序键)。

诊断慢查询请使用 [Query Profile](../admin-manual/open-api/fe-http/query-profile-action)。
