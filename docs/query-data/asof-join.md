---
{ 'title': 'ASOF Join', 'language': 'en' }
---

## ASOF JOIN

**ASOF JOIN** operation merges rows from two tables based on **adjacent** or **exact matching** timestamp values. For each row in the left table, the join finds a row in the right table with the **closest** timestamp. The qualifying row in the right table is the best match, and its timestamp may be **equal to**, **earlier than**, or **later than** the timestamp of the row in the left table, depending on the specified comparison operator.

### Syntax

```SQL
FROM <left_table> ASOF [INNER|LEFT] JOIN <right_table>
  MATCH_CONDITION ( <left_table.timecol> <comparison_operator> <right_table.timecol> )
  [ ON <table.col> = <table.col> [ AND ... ] | USING ( <column_list> ) ]
```

### Parameter Description

The left table specified in the `FROM` clause is assumed to have timestamps that are **chronologically connected**, **earlier than**, or **completely synchronized** with the timestamps of records in the right table. When a row in the left table has no matching row in the right table, if it is an ASOF INNER JOIN, the row is filtered out; if it is an ASOF LEFT JOIN, the left table row is retained and the corresponding columns in the right table are filled with `NULL`.

```
MATCH_CONDITION ( <left_table.timecol> <comparison_operator> <right_table.timecol> )
```

This condition is used to specify the **timestamp columns** to be compared in the two tables.

1. Only the following four **comparison operators** are supported: `>=`, `<=`, `>`, `<`.
2. Supported time-related data types include: `DATE`, `DATETIME`, `TIMESTAMP_TZ`.
3. The data types of the two matching columns **do not need to be exactly the same**, but they must be **mutually compatible**.

```
ON <table.col> = <table.col> [ AND ... ] | USING ( <column_list> ) 
```

The optional `ON` or `USING` clause is used to define one or more **equality conditions** between the two tables, aiming to logically group the query results.

Special notes applicable to `ASOF JOIN` are as follows:

1. The comparison operator in the `ON` clause **must be the equal sign** **`=`**.
2. The `ON` clause **does not allow conditions connected by logical OR (`OR`)**, only conditions connected by logical AND (`AND`) are supported.
3. Each side of each condition **can only reference one of the two tables in the join** respectively.

### Examples

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