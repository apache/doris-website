---
{
    "title": "写时合并",
    "language": "zh-CN",
    "description": "Doris 主键模型如何保证 Key 列唯一性：写时合并与读时合并两种实现、它们的性能权衡，以及如何选择。"
}
---

**写时合并（merge-on-write）**与**读时合并（merge-on-read）**是[主键模型](./unique)用于保证 Key 列唯一性的两种存储实现。两者返回相同的查询结果，但在**何时**消解重复 Key 上有所不同，这决定了它们的读写性能。写时合并是默认实现，推荐用于大多数场景。

<!-- 知识类型: 概念 -->
<!-- 适用场景: 选择主键模型的实现方式 -->

## 对比

| 实现 | 合并时机 | 写入性能 | 查询性能 | 适用场景 |
| --- | --- | --- | --- | --- |
| 写时合并（默认） | 写入时 | 适中 | 高 | 大多数场景，兼顾查询与写入性能 |
| 读时合并 | 查询或 Compaction 时 | 高 | 较低 | 写多读少场景 |

## 写时合并的工作原理

采用写时合并时，Doris 在数据写入时消解相同 Key 的记录。对于每一条写入的数据，Doris 会检查该 Key 是否已存在，并在 delete bitmap 中将其旧版本标记为删除。查询时借助该 bitmap 跳过被标记的行，因此只读取最新版本。这些旧行在 Compaction 时才从磁盘物理删除。

由于重复在写入时消解：

- 查询每个 Key 只需读取单个版本，无需在读取时合并。
- 过滤谓词可以下推到存储层，从而跳过无关数据。
- 读取性能不会随历史更新的累积而下降。

代价在写入侧：每次 upsert 都需要一次主键查找来定位并标记旧版本，相比读时合并增加了一定的写入开销。对绝大多数场景而言这一权衡是值得的，因此写时合并是默认实现。

## 读时合并的工作原理

采用读时合并时，写入只追加数据。Doris 内部保留同一 Key 的多个版本，并在查询时或 Compaction 时合并，保留最新版本。

由于重复在读取时消解：

- 写入很轻量，写入时无需主键查找。
- 每次查询都必须合并同一 Key 的多个版本，且谓词无法下推，因此查询更慢。
- 随着两次 Compaction 之间版本的累积，查询延迟会上升。

该实现适合写多读少、写入吞吐比查询延迟更重要的场景。

## 如何选择

- **使用写时合并（默认）**：适用于绝大多数场景，包括实时更新、维度同步，以及任何对查询性能有要求的场景。它还支持部分列更新等能力。
- **使用读时合并**：仅当写入量远大于读取量、且需要尽量降低写入开销时。

实现方式在建表时确定，**之后无法通过 schema change 修改**，因此请在建表前选定。

## 启用各实现

实现由 `enable_unique_key_merge_on_write` 表属性控制。

写时合并（默认）：

```sql
CREATE TABLE IF NOT EXISTS example_tbl_unique
(
    user_id         LARGEINT        NOT NULL,
    user_name       VARCHAR(50)     NOT NULL,
    city            VARCHAR(20),
    age             SMALLINT,
    sex             TINYINT
)
UNIQUE KEY(user_id, user_name)
DISTRIBUTED BY HASH(user_id) BUCKETS 10
PROPERTIES (
    "enable_unique_key_merge_on_write" = "true"
);
```

读时合并（将该属性设为 `false`）：

```sql
CREATE TABLE IF NOT EXISTS example_tbl_unique
(
    user_id         LARGEINT        NOT NULL,
    user_name       VARCHAR(50)     NOT NULL,
    city            VARCHAR(20),
    age             SMALLINT,
    sex             TINYINT
)
UNIQUE KEY(user_id, user_name)
DISTRIBUTED BY HASH(user_id) BUCKETS 10
PROPERTIES (
    "enable_unique_key_merge_on_write" = "false"
);
```

## 依赖写时合并的能力

[部分列更新](../../data-operate/update/update-of-unique-model) 依赖写时合并实现：仅更新部分列而无需重写整行。

## 相关文档

- [主键模型](./unique)
- [部分列更新](../../data-operate/update/update-of-unique-model)
