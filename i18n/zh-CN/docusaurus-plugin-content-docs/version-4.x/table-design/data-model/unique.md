---
{
    "title": "主键模型",
    "language": "zh-CN",
    "description": "Doris 主键模型（Unique Key Model）保证 Key 列唯一性，支持 UPSERT 与去重，适用于高频更新、维度同步、画像标签等数据更新场景。"
}
---

主键模型（Unique Key Model）适用于需要数据更新的业务场景。该模型保证 Key 列的唯一性：插入或更新数据时，新数据会覆盖具有相同 Key 的旧数据，从而确保数据记录始终为最新版本。

<!-- 知识类型: 数据模型 -->
<!-- 适用场景: 数据更新 / 高频写入 / 主键去重 -->

## 适用场景

主键模型主要适用于以下三类业务场景：

1. **高频数据更新**：上游 OLTP 数据库中的维度表实时同步，需要高效执行 UPSERT 操作；
2. **数据高效去重**：在广告投放、客户关系管理（CRM）等系统中，基于用户 ID 进行高效去重；
3. **部分列更新**：在画像标签场景中变更频繁改动的动态标签，或在消费订单场景中改变交易状态，可通过主键模型的部分列更新能力完成。

## 核心特性

主键模型具备以下核心特性：

| 特性 | 说明 |
| --- | --- |
| 基于主键 UPSERT | 主键重复的数据会被更新；主键不存在的记录会被插入 |
| 基于主键去重 | Key 列具有唯一性，根据主键列对数据进行去重 |
| 高频数据更新 | 支持高频更新场景，平衡数据更新性能与查询性能 |

## 工作原理

Doris 主键模型提供两种实现方式，对比如下：

| 实现方式 | 默认开启版本 | 合并时机 | 查询性能 | 谓词下推 | 适用场景 |
| --- | --- | --- | --- | --- | --- |
| 写时合并（merge-on-write） | 1.2 版本起默认 | 写入时立即合并 | 高 | 支持 | 大多数场景，兼顾查询与写入性能 |
| 读时合并（merge-on-read） | 1.2 版本前默认 | 查询或 Compaction 时合并 | 较低 | 不支持 | 写多读少场景 |

- **写时合并**：数据在写入时立即合并相同 Key 的记录，确保存储的始终是最新数据。该模式兼顾查询和写入性能，避免多个版本的数据合并，并支持谓词下推到存储层，**大多数场景推荐使用此模式**。
- **读时合并**：数据在写入时并不进行合并，以增量方式被追加存储，在 Doris 内保留多个版本。查询或 Compaction 时，会对相同 Key 的版本进行合并。该模式适合写多读少的场景，但在查询时需要进行多版本合并，谓词无法下推，可能影响查询速度。

## 更新语义

Doris 主键模型支持两种更新语义：

| 更新语义 | 说明 | 实现要求 |
| --- | --- | --- |
| 整行更新 | Unique Key 模型默认的 UPSERT 语义：Key 存在则更新整行，不存在则插入 | 默认支持 |
| 部分列更新 | 仅更新指定字段，保留未指定字段的原值 | 必须使用写时合并，并通过参数开启 |

说明：

- 在整行 `UPSERT` 语义下，即使使用 `INSERT INTO` 指定部分列写入，Doris 也会在 Planner 中将未提供的列填充为 NULL 或默认值。
- 部分列更新的使用方式请参阅 [部分列更新](../../data-operate/update/update-of-unique-model)。

## 建表示例

在建表时使用 `UNIQUE KEY` 关键字指定主键表，并通过 `enable_unique_key_merge_on_write` 属性控制实现方式。

### 写时合并

自 Doris 2.1 版本起，默认开启写时合并：

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

### 读时合并

在 Doris 2.1 版本之前，默认开启读时合并；2.1 版本起需通过显式关闭 `enable_unique_key_merge_on_write` 属性指定：

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

## 数据插入与存储

在主键表中，Key 列不仅用于排序，还用于去重；插入数据时，相同 Key 的记录会被覆盖。

![unique-key-model-insert](/images/table-desigin/unique-key-model-insert.png)

如下示例所示，原表中有 4 行数据，插入 2 行后，新数据基于主键完成更新：

```sql
-- 插入原始数据
INSERT INTO example_tbl_unique VALUES
(101, 'Tom', 'BJ', 26, 1),
(102, 'Jason', 'BJ', 27, 1),
(103, 'Juice', 'SH', 20, 2),
(104, 'Olivia', 'SZ', 22, 2);

-- 基于 Key 进行更新
INSERT INTO example_tbl_unique VALUES
(101, 'Tom', 'BJ', 27, 1),
(102, 'Jason', 'SH', 28, 1);

-- 查询更新后的数据
SELECT * FROM example_tbl_unique;
+---------+-----------+------+------+------+
| user_id | user_name | city | age  | sex  |
+---------+-----------+------+------+------+
| 101     | Tom       | BJ   |   27 |    1 |
| 102     | Jason     | SH   |   28 |    1 |
| 104     | Olivia    | SZ   |   22 |    2 |
| 103     | Juice     | SH   |   20 |    2 |
+---------+-----------+------+------+------+
```

## 注意事项

使用主键模型时，请注意以下限制：

1. **实现方式不可变更**：Unique 表的实现方式（写时合并 / 读时合并）只能在建表时指定，无法通过 schema change 修改；
2. **整行 UPSERT 会填充缺省值**：在整行 `UPSERT` 语义下，即使使用 `INSERT INTO` 指定部分列写入，Doris 也会在 Planner 中将未提供的列填充为 NULL 或默认值；
3. **部分列更新需启用写时合并**：如需更新部分字段，必须使用写时合并实现，并通过特定参数开启部分列更新支持，详见 [部分列更新](../../data-operate/update/update-of-unique-model)；
4. **分区键必须包含在 Key 列内**：为保证数据的唯一性，分区键必须是 Key 列的子集。
