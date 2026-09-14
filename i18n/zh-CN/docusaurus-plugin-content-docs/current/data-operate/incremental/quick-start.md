---
{
    "title": "快速上手",
    "language": "zh-CN",
    "description": "10 分钟走通 Doris 变更数据消费的完整流程：建一张开启 Row Binlog 的表，创建 Table Stream，写入几批数据，查看变更，把变更消费到下游表并观察消费位点。"
}
---

<!-- 知识类型: 操作指南 -->
<!-- 适用场景: 第一次使用 Row Binlog / Table Stream -->

本文用一张订单表演示 Row Binlog 与 Table Stream 的基本用法。全程只需要一个 MySQL 客户端，大约 10 分钟。

## 第 1 步：开启功能

在所有 FE 的 `fe.conf` 中加入以下配置并重启 FE：

```text
enable_feature_binlog = true
enable_table_stream = true
```

## 第 2 步：创建开启 Row Binlog 的表

Row Binlog 只能在建表时开启。这里创建一张 Unique Key Merge-on-Write 表，并打开 `binlog.need_historical_value`，这样更新和删除时会记录变更前的值：

```sql
CREATE DATABASE IF NOT EXISTS demo;
USE demo;

CREATE TABLE orders (
    order_id BIGINT,
    status   VARCHAR(16),
    amount   DECIMAL(10, 2)
)
UNIQUE KEY(order_id)
DISTRIBUTED BY HASH(order_id) BUCKETS 1
PROPERTIES (
    "replication_num" = "1",
    "enable_unique_key_merge_on_write" = "true",
    "binlog.enable" = "true",
    "binlog.format" = "ROW",
    "binlog.need_historical_value" = "true"
);
```

写入第一批数据：

```sql
INSERT INTO orders VALUES
    (1, 'created', 100.00),
    (2, 'created', 200.00),
    (3, 'created', 300.00);
```

## 第 3 步：创建 Table Stream

```sql
CREATE STREAM orders_stream ON TABLE orders
PROPERTIES (
    "type" = "min_delta",
    "show_initial_rows" = "false"
);
```

- `type = min_delta`：输出两次消费之间每个 key 的净变化。
- `show_initial_rows = false`：创建 Stream 之前已经存在的 3 行不作为变更输出，只关心之后的变化。

此时查询 Stream 没有任何数据：

```sql
SELECT * FROM orders_stream;
```

```text
Empty set
```

## 第 4 步：写入第二批变更

```sql
-- 订单 1 状态更新（Unique Key 表写入同 key 即更新）
INSERT INTO orders VALUES (1, 'paid', 100.00);
-- 订单 2 删除
DELETE FROM orders WHERE order_id = 2;
-- 新订单 4
INSERT INTO orders VALUES (4, 'created', 400.00);
-- 新订单 5，随后又被删除
INSERT INTO orders VALUES (5, 'created', 500.00);
DELETE FROM orders WHERE order_id = 5;
```

## 第 5 步：查看变更

通过 Stream 查询，并带上两个虚拟列：`__DORIS_STREAM_CHANGE_TYPE_COL__` 表示变更类型，`__DORIS_STREAM_SEQUENCE_COL__` 表示这次变更的提交时间戳（TSO）。虚拟列不包含在 `SELECT *` 中，需要显式写出。

```sql
SELECT order_id, status, amount,
       __DORIS_STREAM_CHANGE_TYPE_COL__ AS change_type,
       __DORIS_STREAM_SEQUENCE_COL__ AS change_tso
FROM orders_stream
ORDER BY order_id, change_type DESC;
```

```text
+----------+---------+--------+---------------+--------------------+
| order_id | status  | amount | change_type   | change_tso         |
+----------+---------+--------+---------------+--------------------+
|        1 | created | 100.00 | UPDATE_BEFORE | 469067680972800000 |
|        1 | paid    | 100.00 | UPDATE_AFTER  | 469067680972800000 |
|        2 | created | 200.00 | DELETE        | 469067681287372800 |
|        4 | created | 400.00 | APPEND        | 469067681628160003 |
+----------+---------+--------+---------------+--------------------+
```

对照第 4 步的操作：

- 订单 1 的更新输出为一对 `UPDATE_BEFORE`（更新前的值）和 `UPDATE_AFTER`（更新后的值）。
- 订单 2 的删除输出为 `DELETE`，携带删除前的值。
- 订单 4 是新 key，输出为 `APPEND`。
- 订单 5 在两次消费之间先插入后删除，净变化为空，`min_delta` 不输出。

再执行一次同样的查询，结果完全相同：**普通 SELECT 只读取变更，不会推进消费位点。**

## 第 6 步：消费变更

用 `INSERT INTO ... SELECT ... FROM <stream>` 把变更写入下游表，这条语句在写入成功的同时推进消费位点，两者在同一个事务内完成：

```sql
CREATE TABLE orders_changes (
    order_id    BIGINT,
    status      VARCHAR(16),
    amount      DECIMAL(10, 2),
    change_type VARCHAR(16),
    change_tso  BIGINT
)
DUPLICATE KEY(order_id)
DISTRIBUTED BY HASH(order_id) BUCKETS 1
PROPERTIES ("replication_num" = "1");

INSERT INTO orders_changes
SELECT order_id, status, amount,
       __DORIS_STREAM_CHANGE_TYPE_COL__,
       __DORIS_STREAM_SEQUENCE_COL__
FROM orders_stream;
```

消费之后再查询 Stream，已经没有未消费的变更：

```sql
SELECT COUNT(*) FROM orders_stream;
```

```text
+----------+
| count(*) |
+----------+
|        0 |
+----------+
```

继续写入新的变更，Stream 只会返回这次消费之后发生的变化：

```sql
INSERT INTO orders VALUES (4, 'paid', 400.00);

SELECT order_id, status, __DORIS_STREAM_CHANGE_TYPE_COL__ AS change_type
FROM orders_stream ORDER BY change_type DESC;
```

```text
+----------+---------+---------------+
| order_id | status  | change_type   |
+----------+---------+---------------+
|        4 | created | UPDATE_BEFORE |
|        4 | paid    | UPDATE_AFTER  |
+----------+---------+---------------+
```

## 第 7 步：查看消费进度

`information_schema.table_stream_consumption` 按分区展示每个 Stream 的消费位点和积压情况：

```sql
SELECT STREAM_NAME, UNIT, CONSUMPTION_STATUS, LAG, LAST_CONSUMPTION_TIME
FROM information_schema.table_stream_consumption
WHERE DB_NAME = 'demo' AND STREAM_NAME = 'orders_stream';
```

```text
+---------------+--------+--------------------+-----------+-----------------------+
| STREAM_NAME   | UNIT   | CONSUMPTION_STATUS | LAG       | LAST_CONSUMPTION_TIME |
+---------------+--------+--------------------+-----------+-----------------------+
| orders_stream | orders | 469067681628160003 | 262144000 |         1789351206000 |
+---------------+--------+--------------------+-----------+-----------------------+
```

- `UNIT`：消费单元，即基表分区。`orders` 没有显式分区，只有一个与表同名的分区。
- `CONSUMPTION_STATUS`：该分区已消费到的 TSO。
- `LAG`：基表分区最新提交的 TSO 与已消费 TSO 的差值，`0` 表示没有积压。
- `LAST_CONSUMPTION_TIME`：最近一次消费的时间（毫秒时间戳），`-1` 表示尚未消费过。

再执行一次第 6 步的 `INSERT INTO orders_changes SELECT ...`，`LAG` 会回到 `0`。

## 清理

```sql
DROP STREAM orders_stream;
DROP TABLE orders_changes;
DROP TABLE orders;
```

## 下一步

- 三种消费类型的区别、`show_initial_rows` 的含义、查询与消费的事务语义：[Table Stream 基础](table-stream.md)
- 按分区分批消费、快照读取、与维表关联、基表 DDL 对 Stream 的影响：[Table Stream 进阶](table-stream-advanced.md)
- Row Binlog 的属性、支持范围和限制：[Row Binlog](row-binlog.md)
- 不建 Stream，直接按时间窗口读变更：[增量查询](incremental-query.md)
