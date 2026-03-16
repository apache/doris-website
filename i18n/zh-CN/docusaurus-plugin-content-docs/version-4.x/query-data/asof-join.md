---
{
    "title": "ASOF JOIN",
    "language": "zh-CN",
    "description": "ASOF JOIN 基于日期时间条件，将左表的每一行与右表中满足条件的最近一行进行匹配，常用于时序数据分析场景。"
}
---

## 概述

:::info
此功能自 Apache Doris 4.0.5 和 4.1.0 版本起支持。
:::

ASOF JOIN 是一种专为基于日期时间列的时序查询设计的特殊 JOIN 类型。与常规的等值 JOIN 不同，ASOF JOIN 不要求精确匹配，而是根据 `MATCH_CONDITION` 指定的方向，为左表中的每一行选择右表中满足条件的最近一行。

ASOF JOIN 的“最近”并不是指按时间差绝对值查找最近一行，而是指在 `MATCH_CONDITION` 指定方向上满足条件的最近一行。

一个典型的应用场景：给定一张股票交易表和一张行情报价表，需要为每笔交易找到交易发生时刻最近的报价。如果使用普通 JOIN，需要借助复杂的子查询和窗口函数来实现，而 ASOF JOIN 可以用一条简洁的语句完成。

ASOF JOIN 支持两种子类型：

- **ASOF JOIN**（ASOF LEFT JOIN）：对左表的每一行，根据 `MATCH_CONDITION` 的方向，在右表中查找满足条件的最近匹配行。如果未找到匹配，右侧列填充 NULL。
- **ASOF INNER JOIN**：匹配逻辑相同，但左表中没有匹配的行会从结果中被排除。

## 语法

```sql
SELECT <select_list>
FROM <left_table>
ASOF [LEFT | INNER] JOIN <right_table>
    MATCH_CONDITION(<left_datetime_expr> <comparison_operator> <right_datetime_expr>)
    { ON <left_table.col> = <right_table.col> [AND ...]
    | USING (<column_name> [, ...]) }
```

**说明：**

- `ASOF JOIN` 或 `ASOF LEFT JOIN`：左外 ASOF JOIN。左表中没有匹配的行，右侧列填充 NULL。
- `ASOF INNER JOIN`：内 ASOF JOIN。左表中没有匹配的行会被丢弃。
- `<comparison_operator>`：`>=`、`>`、`<=`、`<` 四种比较运算符之一。

## 参数说明

| 参数 | 是否必须 | 说明 |
|------|----------|------|
| `left_table` | 是 | 左表（探测表）。该表的所有行都会被评估。 |
| `right_table` | 是 | 右表（构建表）。用于查找最接近的匹配。 |
| `MATCH_CONDITION` | 是 | 定义最近匹配规则。两侧必须引用左右表的列，且两侧列的类型必须为 `DATEV2`、`DATETIMEV2` 或 `TIMESTAMPTZ`；允许使用表达式。支持的运算符：`>=`、`>`、`<=`、`<`。 |
| `ON` / `USING` 子句 | 是 | 定义一个或多个等值键。作为分组键——匹配仅在同一组内进行。`ON` 支持一个或多个等值（`=`）条件以及表达式（例如 `SUBSTRING(l.code, 1, 3) = r.prefix`）；`USING` 支持一个或多个同名列。 |

## ASOF JOIN 匹配规则

匹配规则取决于 `MATCH_CONDITION` 中的比较运算符：

| 运算符 | 匹配行为 | 典型使用场景 |
|--------|---------|-------------|
| `>=` | 对左表的每一行，查找右表中**最大的**且**小于等于**左侧值的行。 | 查找事件发生时刻或之前的最新快照/报价。 |
| `>` | 对左表的每一行，查找右表中**最大的**且**严格小于**左侧值的行。 | 查找严格早于事件时刻的最新快照/报价。 |
| `<=` | 对左表的每一行，查找右表中**最小的**且**大于等于**左侧值的行。 | 查找当前时刻或之后的下一个事件/快照。 |
| `<` | 对左表的每一行，查找右表中**最小的**且**严格大于**左侧值的行。 | 查找严格晚于当前时刻的下一个事件/快照。 |

**关键规则：**

1. `MATCH_CONDITION` 中的列必须为 `DATEV2`、`DATETIMEV2` 或 `TIMESTAMPTZ` 类型。
2. `MATCH_CONDITION` 中允许使用表达式，例如：`MATCH_CONDITION(l.ts >= r.ts + INTERVAL 1 HOUR)` 或 `MATCH_CONDITION(l.ts >= DATE_ADD(r.ts, INTERVAL 3 HOUR))`。
3. 等值键子句可以写成 `ON` 或 `USING`。使用 `ON` 时，只允许使用等值（`=`）条件并用 `AND` 连接；`ON` 子句中不允许使用不等式条件（如 `>`、`OR`）或字面量比较（如 `l.grp = 1`）。
4. 匹配列或等值列中的 NULL 值不会产生匹配。如果左表行的匹配列为 NULL，或者在同组内没有符合条件的右表行，则右侧列填充 NULL（LEFT JOIN）或该行被丢弃（INNER JOIN）。
5. 当右表中多行具有相同的分组键且在匹配列上具有相同的值，并且都满足匹配条件时，返回其中一行（不确定性）。

## 示例

### 数据准备

创建交易表和报价表：

```sql
CREATE TABLE trades (
    trade_id INT,
    symbol VARCHAR(10),
    trade_time DATETIME,
    price DECIMAL(10, 2),
    quantity INT
) DISTRIBUTED BY HASH(trade_id) BUCKETS 3
PROPERTIES("replication_num" = "1");

CREATE TABLE quotes (
    quote_id INT,
    symbol VARCHAR(10),
    quote_time DATETIME,
    bid_price DECIMAL(10, 2),
    ask_price DECIMAL(10, 2)
) DISTRIBUTED BY HASH(quote_id) BUCKETS 3
PROPERTIES("replication_num" = "1");

INSERT INTO trades VALUES
(1, 'AAPL', '2024-01-01 10:00:05', 150.50, 100),
(2, 'AAPL', '2024-01-01 10:00:15', 151.00, 200),
(3, 'AAPL', '2024-01-01 10:00:25', 150.75, 150),
(4, 'GOOG', '2024-01-01 10:00:10', 2800.00, 50),
(5, 'GOOG', '2024-01-01 10:00:20', 2805.00, 75),
(6, 'MSFT', '2024-01-01 10:00:08', 380.00, 120);

INSERT INTO quotes VALUES
(1, 'AAPL', '2024-01-01 10:00:00', 150.00, 150.10),
(2, 'AAPL', '2024-01-01 10:00:10', 150.40, 150.60),
(3, 'AAPL', '2024-01-01 10:00:20', 150.90, 151.10),
(4, 'GOOG', '2024-01-01 10:00:05', 2795.00, 2800.00),
(5, 'GOOG', '2024-01-01 10:00:15', 2802.00, 2808.00),
(6, 'MSFT', '2024-01-01 10:00:00', 378.00, 380.00),
(7, 'MSFT', '2024-01-01 10:00:10', 379.50, 381.00);
```

### 示例 1：为每笔交易找到最近的报价 (>=)

对每笔交易，在相同 `symbol` 中查找 `quote_time` 小于等于 `trade_time` 的最新报价。

```sql
SELECT t.trade_id, t.symbol, t.trade_time, t.price,
       q.quote_id, q.quote_time, q.bid_price, q.ask_price
FROM trades t
ASOF LEFT JOIN quotes q
    MATCH_CONDITION(t.trade_time >= q.quote_time)
    ON t.symbol = q.symbol
ORDER BY t.trade_id;
```

```text
+----------+--------+---------------------+--------+----------+---------------------+-----------+-----------+
| trade_id | symbol | trade_time          | price  | quote_id | quote_time          | bid_price | ask_price |
+----------+--------+---------------------+--------+----------+---------------------+-----------+-----------+
|        1 | AAPL   | 2024-01-01 10:00:05 | 150.50 |        1 | 2024-01-01 10:00:00 |    150.00 |    150.10 |
|        2 | AAPL   | 2024-01-01 10:00:15 | 151.00 |        2 | 2024-01-01 10:00:10 |    150.40 |    150.60 |
|        3 | AAPL   | 2024-01-01 10:00:25 | 150.75 |        3 | 2024-01-01 10:00:20 |    150.90 |    151.10 |
|        4 | GOOG   | 2024-01-01 10:00:10 | 2800.00 |        4 | 2024-01-01 10:00:05 |   2795.00 |   2800.00 |
|        5 | GOOG   | 2024-01-01 10:00:20 | 2805.00 |        5 | 2024-01-01 10:00:15 |   2802.00 |   2808.00 |
|        6 | MSFT   | 2024-01-01 10:00:08 | 380.00 |        6 | 2024-01-01 10:00:00 |    378.00 |    380.00 |
+----------+--------+---------------------+--------+----------+---------------------+-----------+-----------+
```

交易 #1（AAPL，10:00:05）匹配到报价 #1（AAPL，10:00:00），因为这是同一 symbol 中在交易时间或之前的最近报价。

### 示例 2：查找每笔交易之后的下一个报价 (<=)

```sql
SELECT t.trade_id, t.symbol, t.trade_time, t.price,
       q.quote_id, q.quote_time, q.bid_price
FROM trades t
ASOF LEFT JOIN quotes q
    MATCH_CONDITION(t.trade_time <= q.quote_time)
    ON t.symbol = q.symbol
ORDER BY t.trade_id;
```

```text
+----------+--------+---------------------+--------+----------+---------------------+-----------+
| trade_id | symbol | trade_time          | price  | quote_id | quote_time          | bid_price |
+----------+--------+---------------------+--------+----------+---------------------+-----------+
|        1 | AAPL   | 2024-01-01 10:00:05 | 150.50 |        2 | 2024-01-01 10:00:10 |    150.40 |
|        2 | AAPL   | 2024-01-01 10:00:15 | 151.00 |        3 | 2024-01-01 10:00:20 |    150.90 |
|        3 | AAPL   | 2024-01-01 10:00:25 | 150.75 |     NULL | NULL                |      NULL |
|        4 | GOOG   | 2024-01-01 10:00:10 | 2800.00 |        5 | 2024-01-01 10:00:15 |   2802.00 |
|        5 | GOOG   | 2024-01-01 10:00:20 | 2805.00 |     NULL | NULL                |      NULL |
|        6 | MSFT   | 2024-01-01 10:00:08 | 380.00 |        7 | 2024-01-01 10:00:10 |    379.50 |
+----------+--------+---------------------+--------+----------+---------------------+-----------+
```

交易 #3（AAPL，10:00:25）之后没有报价数据，因此右侧返回 NULL。

### 示例 3：ASOF INNER JOIN — 排除无匹配的行

```sql
SELECT t.trade_id, t.symbol, t.trade_time, t.price,
       q.quote_id, q.quote_time, q.bid_price
FROM trades t
ASOF INNER JOIN quotes q
    MATCH_CONDITION(t.trade_time >= q.quote_time)
    ON t.symbol = q.symbol
ORDER BY t.trade_id;
```

```text
+----------+--------+---------------------+--------+----------+---------------------+-----------+
| trade_id | symbol | trade_time          | price  | quote_id | quote_time          | bid_price |
+----------+--------+---------------------+--------+----------+---------------------+-----------+
|        1 | AAPL   | 2024-01-01 10:00:05 | 150.50 |        1 | 2024-01-01 10:00:00 |    150.00 |
|        2 | AAPL   | 2024-01-01 10:00:15 | 151.00 |        2 | 2024-01-01 10:00:10 |    150.40 |
|        3 | AAPL   | 2024-01-01 10:00:25 | 150.75 |        3 | 2024-01-01 10:00:20 |    150.90 |
|        4 | GOOG   | 2024-01-01 10:00:10 | 2800.00 |        4 | 2024-01-01 10:00:05 |   2795.00 |
|        5 | GOOG   | 2024-01-01 10:00:20 | 2805.00 |        5 | 2024-01-01 10:00:15 |   2802.00 |
|        6 | MSFT   | 2024-01-01 10:00:08 | 380.00 |        6 | 2024-01-01 10:00:00 |    378.00 |
+----------+--------+---------------------+--------+----------+---------------------+-----------+
```

在本数据集中，所有交易都有匹配的报价，因此结果与示例 1 相同。如果有交易没有匹配的报价，该行会被排除。

### 示例 4：多个等值条件

同时按 `product_id` 和 `region` 进行分组匹配：

```sql
SELECT o.order_id, o.product_id, o.region, o.order_time,
       p.price, p.effective_time
FROM orders o
ASOF LEFT JOIN prices p
    MATCH_CONDITION(o.order_time >= p.effective_time)
    ON o.product_id = p.product_id AND o.region = p.region
ORDER BY o.order_id;
```

对每个订单，查找相同产品、相同区域中最近生效的价格。

### 示例 5：MATCH_CONDITION 中使用表达式

查找右侧时间戳至少比左侧早 1 小时的匹配行：

```sql
SELECT l.id, l.ts, r.id AS rid, r.ts AS rts, r.data
FROM left_table l
ASOF LEFT JOIN right_table r
    MATCH_CONDITION(l.ts >= r.ts + INTERVAL 1 HOUR)
    ON l.grp = r.grp
ORDER BY l.id;
```

也支持日期时间函数：

```sql
MATCH_CONDITION(l.ts >= DATE_ADD(r.ts, INTERVAL 3 HOUR))
MATCH_CONDITION(DATE_SUB(l.ts, INTERVAL 1 HOUR) >= r.ts)
```

### 示例 6：多级 ASOF JOIN

ASOF JOIN 可以与其他 ASOF JOIN 或普通 JOIN 链式组合使用：

```sql
SELECT o.order_id, o.order_time,
       p.price, p.effective_time AS price_time,
       i.stock_level, i.snapshot_time AS inv_time
FROM orders o
ASOF LEFT JOIN prices p
    MATCH_CONDITION(o.order_time >= p.effective_time)
    ON o.product_id = p.product_id AND o.region = p.region
ASOF LEFT JOIN inventory i
    MATCH_CONDITION(o.order_time >= i.snapshot_time)
    ON o.product_id = i.product_id AND o.region = i.region
ORDER BY o.order_id;
```

也支持 ASOF JOIN 与普通 JOIN 混合使用：

```sql
SELECT o.order_id, prod.product_name,
       o.order_time, p.price
FROM orders o
INNER JOIN products prod ON o.product_id = prod.product_id
ASOF LEFT JOIN prices p
    MATCH_CONDITION(o.order_time >= p.effective_time)
    ON o.product_id = p.product_id AND o.region = p.region
ORDER BY o.order_id;
```

### 示例 7：ASOF JOIN 配合聚合

```sql
SELECT t.symbol,
       COUNT(*) AS trade_count,
       AVG(q.bid_price) AS avg_bid
FROM trades t
ASOF LEFT JOIN quotes q
    MATCH_CONDITION(t.trade_time >= q.quote_time)
    ON t.symbol = q.symbol
GROUP BY t.symbol
ORDER BY t.symbol;
```

### 示例 8：双向 ASOF JOIN — 查找前后记录

为每个订单同时查找前一个和后一个价格：

```sql
SELECT o.order_id, o.order_time,
       p_before.price AS price_before,
       p_before.effective_time AS time_before,
       p_after.price AS price_after,
       p_after.effective_time AS time_after
FROM orders o
ASOF LEFT JOIN prices p_before
    MATCH_CONDITION(o.order_time >= p_before.effective_time)
    ON o.product_id = p_before.product_id AND o.region = p_before.region
ASOF LEFT JOIN prices p_after
    MATCH_CONDITION(o.order_time <= p_after.effective_time)
    ON o.product_id = p_after.product_id AND o.region = p_after.region
ORDER BY o.order_id;
```

### 示例 9：方向性匹配，而不是绝对最近

ASOF JOIN 只会沿 `MATCH_CONDITION` 指定的方向查找，不会比较左右两侧记录的绝对时间差。

```sql
WITH left_events AS (
    SELECT 1 AS event_id, 'AAPL' AS symbol, CAST('2024-01-01 10:00:06' AS DATETIME) AS event_time
),
right_events AS (
    SELECT 1 AS right_id, 'AAPL' AS symbol, CAST('2024-01-01 10:00:00' AS DATETIME) AS ref_time
    UNION ALL
    SELECT 2 AS right_id, 'AAPL' AS symbol, CAST('2024-01-01 10:00:08' AS DATETIME) AS ref_time
)
SELECT l.event_id, l.event_time, r.right_id, r.ref_time
FROM left_events l
ASOF LEFT JOIN right_events r
    MATCH_CONDITION(l.event_time >= r.ref_time)
    ON l.symbol = r.symbol;
```

```text
+----------+---------------------+----------+---------------------+
| event_id | event_time          | right_id | ref_time            |
+----------+---------------------+----------+---------------------+
|        1 | 2024-01-01 10:00:06 |        1 | 2024-01-01 10:00:00 |
+----------+---------------------+----------+---------------------+
```

虽然 `10:00:08` 与左侧时间只差 2 秒，而 `10:00:00` 差 6 秒，但 `MATCH_CONDITION(l.event_time >= r.ref_time)` 只允许匹配左侧时间点及之前的右表记录，因此结果是 `10:00:00`。

```sql
WITH left_events AS (
    SELECT 1 AS event_id, 'AAPL' AS symbol, CAST('2024-01-01 10:00:06' AS DATETIME) AS event_time
),
right_events AS (
    SELECT 1 AS right_id, 'AAPL' AS symbol, CAST('2024-01-01 10:00:00' AS DATETIME) AS ref_time
    UNION ALL
    SELECT 2 AS right_id, 'AAPL' AS symbol, CAST('2024-01-01 10:00:08' AS DATETIME) AS ref_time
)
SELECT l.event_id, l.event_time, r.right_id, r.ref_time
FROM left_events l
ASOF LEFT JOIN right_events r
    MATCH_CONDITION(l.event_time <= r.ref_time)
    ON l.symbol = r.symbol;
```

```text
+----------+---------------------+----------+---------------------+
| event_id | event_time          | right_id | ref_time            |
+----------+---------------------+----------+---------------------+
|        1 | 2024-01-01 10:00:06 |        2 | 2024-01-01 10:00:08 |
+----------+---------------------+----------+---------------------+
```

### 示例 10：重复匹配值可能导致非确定性结果

当右表中多行具有相同的分组键和相同的匹配值时，ASOF JOIN 可能返回其中任意一行。`TIMESTAMPTZ` 类型同样如此。

```sql
WITH left_events AS (
    SELECT 1 AS event_id, 'AAPL' AS symbol,
           CAST('2024-01-01 10:00:05 +00:00' AS TIMESTAMPTZ) AS event_time
),
right_events AS (
    SELECT 1 AS right_id, 'AAPL' AS symbol,
           CAST('2024-01-01 10:00:00 +00:00' AS TIMESTAMPTZ) AS ref_time, 'snapshot_a' AS tag
    UNION ALL
    SELECT 2 AS right_id, 'AAPL' AS symbol,
           CAST('2024-01-01 10:00:00 +00:00' AS TIMESTAMPTZ) AS ref_time, 'snapshot_b' AS tag
)
SELECT l.event_id, r.right_id, r.ref_time, r.tag
FROM left_events l
ASOF LEFT JOIN right_events r
    MATCH_CONDITION(l.event_time >= r.ref_time)
    ON l.symbol = r.symbol;
```

```text
+----------+----------+---------------------------+------------+
| event_id | right_id | ref_time                  | tag        |
+----------+----------+---------------------------+------------+
|        1 |        1 | 2024-01-01 10:00:00+00:00 | snapshot_a |
+----------+----------+---------------------------+------------+
```

该查询也可能返回 `right_id = 2` 且 `tag = snapshot_b`。如果业务要求结果确定，应该在执行 ASOF JOIN 之前先对右表做去重或预聚合。

## 等价改写

ASOF JOIN 在语义上等价于以下 `LEFT JOIN` + `ROW_NUMBER()` 模式，但性能显著更优：

```sql
-- 等价于：ASOF LEFT JOIN ... MATCH_CONDITION(l.ts >= r.ts)
SELECT id, rid, val FROM (
    SELECT l.id, r.id AS rid, r.val,
           ROW_NUMBER() OVER (PARTITION BY l.id ORDER BY r.ts DESC) AS rn
    FROM left_table l
    LEFT JOIN right_table r
        ON l.grp = r.grp AND l.ts >= r.ts
) t
WHERE rn = 1;
```

## 最佳实践

- **将 ASOF JOIN 用于时序数据的时间点查询。** 如果需要为事实表中的每一行在参考表中查找最新（或最近）的记录，ASOF JOIN 是最自然和高效的方式。
- **在 `ON` 子句或 `USING` 子句中添加适当的等值键。** 等值键作为分组键，分组越精确，搜索空间越小，性能越好。
- **选择合适的比较运算符。** 如果需要包含时间完全相同的匹配，使用 `>=`；如果需要严格排除相同时间戳的行，使用 `>`。
- **不需要无匹配行时，优先使用 ASOF INNER JOIN。** 这可以避免产生 NULL 行，简化下游处理。
- **当结果需要确定性时，先对右表候选行去重。** 如果右表中存在相同分组键且匹配列值相同的多行，ASOF JOIN 可能返回其中任意一行。
- **使用 MATCH_CONDITION 中的表达式进行时间偏移匹配。** 例如 `MATCH_CONDITION(l.ts >= r.ts + INTERVAL 1 HOUR)` 来要求至少 1 小时的间隔。
