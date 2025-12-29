---
{
    "title": "主键模型",
    "language": "zh-CN",
    "description": "当需要更新数据时，可以选择主键模型（Unique Key Model）。该模型保证 Key 列的唯一性，插入或更新数据时，新数据会覆盖具有相同 Key 的旧数据，确保数据记录为最新。与其他数据模型相比，主键模型适用于数据的更新场景，在插入过程中进行主键级别的更新覆盖。"
}
---

当需要更新数据时，可以选择主键模型（Unique Key Model）。该模型保证 Key 列的唯一性，插入或更新数据时，新数据会覆盖具有相同 Key 的旧数据，确保数据记录为最新。与其他数据模型相比，主键模型适用于数据的更新场景，在插入过程中进行主键级别的更新覆盖。

主键模型有以下特点：

* **基于主键进行 UPSERT**：在插入数据时，主键重复的数据会更新，主键不存在的记录会插入；

* **基于主键进行去重**：主键模型中的 Key 列具有唯一性，会对根据主键列对数据进行去重操作；

* **高频数据更新**：支持高频数据更新场景，同时平衡数据更新性能与查询性能。

## 使用场景

* **高频数据更新**：适用于上游 OLTP 数据库中的维度表，实时同步更新记录，并高效执行 UPSERT 操作；

* **数据高效去重**：如广告投放和客户关系管理系统中，使用主键模型可以基于用户 ID 高效去重；

* **需要部分列更新**：如画像标签场景需要变更频繁改动的动态标签，消费订单场景需要改变交易的状态。通过主键模型部分列更新能力可以完成某几列的变更操作。

## 实现方式

在 Doris 中主键模型有两种实现方式：

* **写时合并**（merge-on-write）：自 1.2 版本起，Doris 默认使用写时合并模式，数据在写入时立即合并相同 Key 的记录，确保存储的始终是最新数据。写时合并兼顾查询和写入性能，避免多个版本的数据合并，并支持谓词下推到存储层。大多数场景推荐使用此模式；

* **读时合并**（merge-on-read）：在 1.2 版本前，Doris 中的主键模型默认使用读时合并模式，数据在写入时并不进行合并，以增量的方式被追加存储，在 Doris 内保留多个版本。查询或 Compaction 时，会对数据进行相同 Key 的版本合并。读时合并适合写多读少的场景，在查询时需要进行多个版本合并，谓词无法下推，可能会影响到查询速度。

在 Doris 中基于主键模型更新有两种语义：

* **整行更新**：Unique Key 模型默认的更新语义为整行`UPSERT`，即 UPDATE OR INSERT，该行数据的 Key 如果存在，则进行更新，如果不存在，则进行新数据插入。在整行 `UPSERT` 语义下，即使用户使用 Insert Into 指定部分列进行写入，Doris 也会在 Planner 中将未提供的列使用 NULL 值或者默认值进行填充。

* **部分列更新**：如果用户希望更新部分字段，需要使用写时合并实现，并通过特定的参数来开启部分列更新的支持。请查阅文档[部分列更新](../../data-operate/update/update-of-unique-model)。

## 写时合并

在建表时，使用 `UNIQUE KEY` 关键字可以指定主键表。通过显示开启 `enable_unique_key_merge_on_write` 属性可以指定写时合并模式。自 Doris 2.1 版本以后，默认开启写时合并：

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

## 读时合并

在建表时，使用 `UNIQUE KEY` 关键字可以指定主键表。通过显示关闭 `enable_unique_key_merge_on_write` 属性可以指定读时合并模式。在 Doris 2.1 版本之前，默认开启读时合并：

```sql
CREATE TABLE IF NOT EXISTS example_tbl_unique
(
    user_id         LARGEINT        NOT NULL,
    username        VARCHAR(50)     NOT NULL,
    city            VARCHAR(20),
    age             SMALLINT,
    sex             TINYINT
)
UNIQUE KEY(user_id, username)
DISTRIBUTED BY HASH(user_id) BUCKETS 10
PROPERTIES (
    "enable_unique_key_merge_on_write" = "false"
);
```

## 数据插入与存储

在主键表中，Key 列不仅用于排序，还用于去重，插入数据时，相同 Key 的记录会被覆盖。

![unique-key-model-insert](/images/table-desigin/unique-key-model-insert.png)

如上例所示，原表中有 4 行数据，插入 2 行后，新插入的数据基于主键进行了更新：

```sql
-- insert into raw data
INSERT INTO example_tbl_unique VALUES
(101, 'Tom', 'BJ', 26, 1),
(102, 'Jason', 'BJ', 27, 1),
(103, 'Juice', 'SH', 20, 2),
(104, 'Olivia', 'SZ', 22, 2);

-- insert into data to update by key
INSERT INTO example_tbl_unique VALUES
(101, 'Tom', 'BJ', 27, 1),
(102, 'Jason', 'SH', 28, 1);

-- check updated data
SELECT * FROM example_tbl_unique;
+---------+----------+------+------+------+
| user_id | username | city | age  | sex  |
+---------+----------+------+------+------+
| 101     | Tom      | BJ   |   27 |    1 |
| 102     | Jason    | SH   |   28 |    1 |
| 104     | Olivia   | SZ   |   22 |    2 |
| 103     | Juice    | SH   |   20 |    2 |
+---------+----------+------+------+------+
```

## 注意事项

* Unique 表的实现方式只能在建表时确定，无法通过 schema change 进行修改；

* 在整行 `UPSERT` 语义下，即使用户使用 insert into 指定部分列进行写入，Doris 也会在 Planner 中将未提供的列使用 NULL 值或者默认值进行填充；

* 部分列更新。如果用户希望更新部分字段，需要使用写时合并实现，并通过特定的参数来开启部分列更新的支持。请查阅文档[部分列更新](../../data-operate/update/update-of-unique-model)获取相关使用建议；

* 使用 Unique 表时，为了保证数据的唯一性，分区键必须包含在 Key 列内。

