---
{
    "title": "ASOF连接（ASOF-JOIN）",
    "language": "zh-CN"
}


---

## ASOF JOIN

**时序匹配连接（ASOF JOIN）** 操作会基于**前后相邻**或**完全匹配**的时间戳值，对两个表中的行进行合并。对于左表中的每一行，该连接会在右表中找到一行**时间戳最接近**的记录。右表中符合条件的行即为最匹配项，根据指定的比较运算符，该行的时间戳可能与左表行的时间戳**相等**、**早于**或**晚于**左表行的时间戳。

### 语法

```SQL
FROM <left_table> ASOF [INNER|LEFT] JOIN <right_table>
  MATCH_CONDITION ( <left_table.timecol> <comparison_operator> <right_table.timecol> )
  [ ON <table.col> = <table.col> [ AND ... ] | USING ( <column_list> ) ]
```

### 参数说明

`FROM` 子句中指定的左表，其记录的时间戳被假定为与右表记录的时间戳**时序衔接**、**早于**或**完全同步**。当左表中的某一行在右表中无匹配项时，如果是ASOF INNER JOIN则过滤掉该行，如果是ASOF LEFT JOIN，则保留左表行且右表对应的列会填充为 `NULL`。

```
MATCH_CONDITION ( <left_table.timecol> <comparison_operator> <right_table.timecol> )
```

该条件用于指定两个表中需要进行比较的**时间戳列**。

1. 比较运算符**仅支持以下四种**：`>=`、`<=`、`>`、`<`。
2. 支持的时间相关数据类型包括：`DATE`、`DATETIME`、`TIMESTAMP_TZ`。
3. 两个匹配列的数据类型**无需完全一致**，但必须**相互兼容**。

```
ON <table.col> = <table.col> [ AND ... ] | USING ( <column_list> ) 
```

可选的 `ON` 或 `USING` 子句用于定义两个表之间的一个或多个**等值条件**，目的是对查询结果进行逻辑分组。

适用于 `ASOF JOIN` 的特殊说明如下：

1. `ON` 子句中的比较运算符**必须为等号** **`=`**。
2. `ON` 子句中**不允许包含逻辑或（`OR`）连接的条件**，仅支持逻辑与（`AND`）连接的条件。
3. 每个条件的两侧**只能分别引用连接中的两个表之一**。

### 样例

```SQL
CREATE TABLE asof_trades (
    trade_id INT,
    symbol VARCHAR(10),
    trade_time DATETIME,
    price DECIMAL(10, 2),
    quantity INT
) DISTRIBUTED BY HASH(trade_id) BUCKETS 3
PROPERTIES("replication_num" = "1");

CREATE TABLE asof_quotes (
    quote_id INT,
    symbol VARCHAR(10),
    quote_time DATETIME,
    bid_price DECIMAL(10, 2),
    ask_price DECIMAL(10, 2)
) DISTRIBUTED BY HASH(quote_id) BUCKETS 3
PROPERTIES("replication_num" = "1");

INSERT INTO asof_trades VALUES
(1, 'AAPL', '2024-01-01 10:00:05', 150.50, 100),
(2, 'AAPL', '2024-01-01 10:00:15', 151.00, 200),
(3, 'AAPL', '2024-01-01 10:00:25', 150.75, 150),
(4, 'GOOG', '2024-01-01 10:00:10', 2800.00, 50),
(5, 'GOOG', '2024-01-01 10:00:20', 2805.00, 75),
(6, 'MSFT', '2024-01-01 10:00:08', 380.00, 120);

INSERT INTO asof_quotes VALUES
(1, 'AAPL', '2024-01-01 10:00:00', 150.00, 150.10),
(2, 'AAPL', '2024-01-01 10:00:10', 150.40, 150.60),
(3, 'AAPL', '2024-01-01 10:00:20', 150.90, 151.10),
(4, 'GOOG', '2024-01-01 10:00:05', 2795.00, 2800.00),
(5, 'GOOG', '2024-01-01 10:00:15', 2802.00, 2808.00),
(6, 'MSFT', '2024-01-01 10:00:00', 378.00, 380.00),
(7, 'MSFT', '2024-01-01 10:00:10', 379.50, 381.00);

-- ASOF LEFT JOIN
SELECT t.trade_id, t.symbol, t.trade_time, t.price,
       q.quote_id, q.quote_time, q.bid_price
FROM asof_trades t
ASOF LEFT JOIN asof_quotes q
MATCH_CONDITION(t.trade_time <= q.quote_time)
ON t.symbol = q.symbol
ORDER BY t.trade_id;
+----------+--------+---------------------+---------+----------+---------------------+-----------+
| trade_id | symbol | trade_time          | price   | quote_id | quote_time          | bid_price |
+----------+--------+---------------------+---------+----------+---------------------+-----------+
|        1 | AAPL   | 2024-01-01 10:00:05 |  150.50 |        2 | 2024-01-01 10:00:10 |    150.40 |
|        2 | AAPL   | 2024-01-01 10:00:15 |  151.00 |        3 | 2024-01-01 10:00:20 |    150.90 |
|        3 | AAPL   | 2024-01-01 10:00:25 |  150.75 |     NULL | NULL                |      NULL |
|        4 | GOOG   | 2024-01-01 10:00:10 | 2800.00 |        5 | 2024-01-01 10:00:15 |   2802.00 |
|        5 | GOOG   | 2024-01-01 10:00:20 | 2805.00 |     NULL | NULL                |      NULL |
|        6 | MSFT   | 2024-01-01 10:00:08 |  380.00 |        7 | 2024-01-01 10:00:10 |    379.50 |
+----------+--------+---------------------+---------+----------+---------------------+-----------+
6 rows in set (0.04 sec)

-- ASOF INNER JOIN
SELECT t.trade_id, t.symbol, t.trade_time, t.price,
               q.quote_id, q.quote_time, q.bid_price
FROM asof_trades t
ASOF INNER JOIN asof_quotes q
MATCH_CONDITION(t.trade_time <= q.quote_time)
ON t.symbol = q.symbol
ORDER BY t.trade_id;
+----------+--------+---------------------+---------+----------+---------------------+-----------+
| trade_id | symbol | trade_time          | price   | quote_id | quote_time          | bid_price |
+----------+--------+---------------------+---------+----------+---------------------+-----------+
|        1 | AAPL   | 2024-01-01 10:00:05 |  150.50 |        2 | 2024-01-01 10:00:10 |    150.40 |
|        2 | AAPL   | 2024-01-01 10:00:15 |  151.00 |        3 | 2024-01-01 10:00:20 |    150.90 |
|        4 | GOOG   | 2024-01-01 10:00:10 | 2800.00 |        5 | 2024-01-01 10:00:15 |   2802.00 |
|        6 | MSFT   | 2024-01-01 10:00:08 |  380.00 |        7 | 2024-01-01 10:00:10 |    379.50 |
+----------+--------+---------------------+---------+----------+---------------------+-----------+
4 rows in set (0.04 sec)

```