---
{
    "title": "主键模型",
    "language": "zh-CN",
    "description": "Doris 主键模型（Unique Key Model）保证 Key 列唯一性，支持 UPSERT 与去重，适用于高频更新、维度同步、画像标签等数据更新场景。"
}
---

主键模型（Unique Key Model）保证 Key 列的唯一性：插入或更新一行数据时，新数据会覆盖具有相同 Key 的已有行，从而确保记录始终为最新版本。当数据需要按主键频繁更新时，使用该模型。

<!-- 知识类型: 数据模型 -->
<!-- 适用场景: 数据更新 / 高频写入 / 主键去重 -->

## 适用场景

主键模型主要适用于以下三类场景：

1. **高频数据更新**：上游 OLTP 数据库中的维度表实时同步，需要高效执行 UPSERT 操作。
2. **数据高效去重**：在广告投放、客户关系管理（CRM）等系统中，按用户 ID 对记录去重。
3. **部分列更新**：在画像标签场景中动态标签频繁变化，或在订单场景中交易状态变化，只需更新受影响的列。

## 创建主键表

使用 `UNIQUE KEY` 关键字声明主键。写时合并为默认实现，适用于几乎所有场景，因此无需额外设置属性：

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
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

每一行由 `(user_id, user_name)` 唯一标识。写入一行时，若其 Key 已存在则覆盖该行，否则插入新行。

## 写入数据（Upsert）

使用标准 `INSERT` 语句写入数据。Key 已存在的记录会被更新，Key 不存在的记录会被插入。Key 列同时用于排序和去重。

![unique-key-model-insert](/images/table-desigin/unique-key-model-insert.png)

下面的示例中，原表有 4 行。以已存在的 Key 重新写入 2 行后，它们被就地更新：

```sql
-- 写入原始数据
INSERT INTO example_tbl_unique VALUES
(101, 'Tom', 'BJ', 26, 1),
(102, 'Jason', 'BJ', 27, 1),
(103, 'Juice', 'SH', 20, 2),
(104, 'Olivia', 'SZ', 22, 2);

-- 以相同 Key 重新写入新值
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

在整行 `UPSERT` 语义下，即使 `INSERT INTO` 只指定了部分列，Doris 也会用 NULL 或默认值填充未指定的列。

## 仅更新部分列

如需只修改少量字段而不重写整行，使用部分列更新。它要求采用写时合并实现（默认），并通过参数开启。详见[部分列更新](../../data-operate/update/update-of-unique-model)。

## 选择实现方式

主键模型有两种存储实现：**写时合并**（默认，推荐用于大多数场景）与**读时合并**（适合写多读少的场景）。实现方式在建表时确定，之后无法通过 schema change 修改。

关于两种实现的工作原理、性能权衡，以及如何启用读时合并，见[写时合并](./merge-on-write)。

## 注意事项

使用主键模型时，请注意以下限制：

1. **实现方式不可更改**：写时合并或读时合并只能在建表时指定，无法通过 schema change 修改。
2. **整行 UPSERT 填充默认值**：即使 `INSERT INTO` 只指定部分列，Doris 也会用 NULL 或默认值填充未指定的列。
3. **部分列更新需要写时合并**：如需只更新部分列，必须使用写时合并实现，并通过特定参数开启部分列更新支持。详见[部分列更新](../../data-operate/update/update-of-unique-model)。
4. **分区列必须是 Key 列的子集**：为保证数据唯一性，分区列必须是 Key 列的子集。
