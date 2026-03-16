---
{
    "title": "ASOF JOIN",
    "language": "en",
    "description": "ASOF JOIN matches each row of the left table to the nearest qualifying row in the right table based on a date/time condition, commonly used in time-series analysis."
}
---

## Overview

:::info
This feature is supported since Apache Doris versions 4.0.5 and 4.1.0.
:::

ASOF JOIN is a special type of JOIN designed for time-series lookups on date/time columns. Unlike regular equality JOIN, ASOF JOIN does not require an exact match. Instead, for each left-table row, it finds the nearest right-table row that satisfies the directional comparison in `MATCH_CONDITION`.

ASOF JOIN does **not** mean "the absolutely closest row by time difference". The returned row is the nearest row in the direction specified by `MATCH_CONDITION`.

A typical use case: given a table of stock trades and a table of stock quotes, for each trade, find the most recent quote that was available at the time of the trade. With regular JOIN, this requires complex subqueries and window functions, while ASOF JOIN accomplishes it in a single, clear statement.

ASOF JOIN supports two sub-types:

- **ASOF JOIN** (ASOF LEFT JOIN): For each row in the left table, find the nearest qualifying match in the right table according to `MATCH_CONDITION`. If no match is found, the right-side columns are filled with NULL.
- **ASOF INNER JOIN**: Same matching logic, but rows from the left table that have no match are excluded from the result.

## Syntax

```sql
SELECT <select_list>
FROM <left_table>
ASOF [LEFT | INNER] JOIN <right_table>
    MATCH_CONDITION(<left_datetime_expr> <comparison_operator> <right_datetime_expr>)
    { ON <left_table.col> = <right_table.col> [AND ...]
    | USING (<column_name> [, ...]) }
```

**Where:**

- `ASOF JOIN` or `ASOF LEFT JOIN`: Left outer ASOF JOIN. Left table rows without a match produce NULL on the right side.
- `ASOF INNER JOIN`: Inner ASOF JOIN. Left table rows without a match are discarded.
- `<comparison_operator>`: One of `>=`, `>`, `<=`, `<`.

## Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `left_table` | Yes | The left (probe) table. All rows from this table are evaluated. |
| `right_table` | Yes | The right (build) table. Used to find the closest match. |
| `MATCH_CONDITION` | Yes | Defines the nearest-match rule. Both sides must reference columns from both tables, and the columns on both sides must be of type `DATEV2`, `DATETIMEV2`, or `TIMESTAMPTZ`. Expressions are allowed. Supported operators: `>=`, `>`, `<=`, `<`. |
| `ON` / `USING` clause | Yes | Defines one or more equality keys. Acts as the grouping key — matching is only performed within the same group. `ON` supports one or more equality (`=`) conditions and expressions (e.g., `SUBSTRING(l.code, 1, 3) = r.prefix`). `USING` supports one or more shared column names. |

## How ASOF JOIN Matching Works

The matching rule depends on the comparison operator in `MATCH_CONDITION`:

| Operator | Matching Behavior | Typical Use Case |
|----------|------------------|-----------------|
| `>=` | For each left row, find the right row with the **largest** value that is **less than or equal to** the left value. | Find the most recent snapshot/quote before or at the event time. |
| `>` | For each left row, find the right row with the **largest** value that is **strictly less than** the left value. | Find the most recent snapshot/quote strictly before the event time. |
| `<=` | For each left row, find the right row with the **smallest** value that is **greater than or equal to** the left value. | Find the next event/snapshot at or after the current time. |
| `<` | For each left row, find the right row with the **smallest** value that is **strictly greater than** the left value. | Find the next event/snapshot strictly after the current time. |

**Key rules:**

1. `MATCH_CONDITION` columns must be of type `DATEV2`, `DATETIMEV2`, or `TIMESTAMPTZ`.
2. Expressions are allowed in `MATCH_CONDITION`, for example: `MATCH_CONDITION(l.ts >= r.ts + INTERVAL 1 HOUR)` or `MATCH_CONDITION(l.ts >= DATE_ADD(r.ts, INTERVAL 3 HOUR))`.
3. The equality key clause can be written with either `ON` or `USING`. In `ON`, only equality (`=`) conjuncts are allowed. Non-equality conditions (such as `>`, `OR`) or literal comparisons (such as `l.grp = 1`) are not allowed in the `ON` clause.
4. NULL values in the match column or the equality column never produce a match. If the left row's match column is NULL, or if no matching right row exists within the group, the right side is filled with NULL (for LEFT JOIN) or the row is discarded (for INNER JOIN).
5. When multiple right-side rows in the same group have the same match value and satisfy the match condition, one of them is returned (non-deterministic).

## Examples

### Preparation

Create a trades table and a quotes table:

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

### Example 1: Find the Most Recent Quote for Each Trade (>=)

For each trade, find the latest quote whose `quote_time` is less than or equal to the trade's `trade_time`, within the same `symbol`.

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

Trade #1 (AAPL, 10:00:05) is matched with quote #1 (AAPL, 10:00:00) because that is the closest quote at or before the trade time for the same symbol.

### Example 2: Find the Next Quote After Each Trade (<=)

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

Trade #3 (AAPL, 10:00:25) has no subsequent quote, so the right side returns NULL.

### Example 3: ASOF INNER JOIN — Exclude Unmatched Rows

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

All trades have a matching quote in this dataset, so the result is the same as Example 1. If any trade had no matching quote, it would be excluded from the result.

### Example 4: Multiple Equality Conditions

Match on multiple grouping keys (`product_id` and `region`) simultaneously:

```sql
SELECT o.order_id, o.product_id, o.region, o.order_time,
       p.price, p.effective_time
FROM orders o
ASOF LEFT JOIN prices p
    MATCH_CONDITION(o.order_time >= p.effective_time)
    ON o.product_id = p.product_id AND o.region = p.region
ORDER BY o.order_id;
```

This finds, for each order, the most recent price that was effective for the same product in the same region.

### Example 5: Expression in MATCH_CONDITION

Find the matching right-side row whose timestamp is at least 1 hour before the left row's timestamp:

```sql
SELECT l.id, l.ts, r.id AS rid, r.ts AS rts, r.data
FROM left_table l
ASOF LEFT JOIN right_table r
    MATCH_CONDITION(l.ts >= r.ts + INTERVAL 1 HOUR)
    ON l.grp = r.grp
ORDER BY l.id;
```

Date/time functions are also supported:

```sql
MATCH_CONDITION(l.ts >= DATE_ADD(r.ts, INTERVAL 3 HOUR))
MATCH_CONDITION(DATE_SUB(l.ts, INTERVAL 1 HOUR) >= r.ts)
```

### Example 6: Multi-level ASOF JOIN

ASOF JOIN can be chained with other ASOF JOINs or regular JOINs:

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

Mixing ASOF JOIN with regular JOIN is also supported:

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

### Example 7: ASOF JOIN with Aggregation

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

### Example 8: Bidirectional ASOF JOIN — Finding Surrounding Records

Find both the preceding and the following price for each order:

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

### Example 9: Directional Matching, Not Absolute Nearest

ASOF JOIN only searches in the direction specified by `MATCH_CONDITION`. It does not compare absolute time distance across both sides.

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

Even though `10:00:08` is only 2 seconds away and `10:00:00` is 6 seconds away, `MATCH_CONDITION(l.event_time >= r.ref_time)` only allows rows at or before the left-side timestamp, so the result is `10:00:00`.

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

### Example 10: Duplicate Match Values Can Be Non-deterministic

When multiple right-side rows share the same grouping key and the same match value, ASOF JOIN may return any one of them. This also applies to `TIMESTAMPTZ`.

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

The query may also return `right_id = 2` and `tag = snapshot_b`. If deterministic output is required, deduplicate or pre-aggregate the right-side rows before the ASOF JOIN.

## Equivalent Rewrite

ASOF JOIN is semantically equivalent to the following `LEFT JOIN` + `ROW_NUMBER()` pattern, but with significantly better performance:

```sql
-- Equivalent to: ASOF LEFT JOIN ... MATCH_CONDITION(l.ts >= r.ts)
SELECT id, rid, val FROM (
    SELECT l.id, r.id AS rid, r.val,
           ROW_NUMBER() OVER (PARTITION BY l.id ORDER BY r.ts DESC) AS rn
    FROM left_table l
    LEFT JOIN right_table r
        ON l.grp = r.grp AND l.ts >= r.ts
) t
WHERE rn = 1;
```

## Best Practices

- **Use ASOF JOIN for time-series point-in-time lookups.** If you need to find the latest (or nearest) record in a reference table for each row in a fact table, ASOF JOIN is the most natural and efficient approach.
- **Add appropriate equality keys in the `ON` clause or `USING` clause.** The equality keys act as a partitioning key. The more specific the grouping, the smaller the search space, and the better the performance.
- **Choose the right comparison operator.** Use `>=` when you want to include exact-time matches; use `>` when you need to strictly exclude same-timestamp rows.
- **Prefer ASOF INNER JOIN when unmatched rows are not needed.** This avoids producing NULL rows and simplifies downstream processing.
- **Deduplicate right-side candidates when deterministic results matter.** If multiple right-side rows share the same grouping key and match value, ASOF JOIN may return any one of them.
- **Use expressions in MATCH_CONDITION for time-offset matching.** For example, `MATCH_CONDITION(l.ts >= r.ts + INTERVAL 1 HOUR)` to require at least a 1-hour gap.
