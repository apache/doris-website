---
{
    "title": "ASOF JOIN for Time-Series Nearest-Neighbor Matching",
    "language": "en",
    "description": "ASOF JOIN performs nearest-neighbor matching on time-series data. For each row in the left table, it finds the row in the right table that is closest in time along a specified direction, without requiring window functions.",
    "keywords": [
        "ASOF JOIN",
        "time-series JOIN",
        "nearest-neighbor matching",
        "MATCH_CONDITION",
        "point-in-time query",
        "Doris time-series query",
        "as of join"
    ]
}
---

<!-- Knowledge type: Capability definition + Operational example -->
<!-- Applicable scenarios: Time-series data analysis / Quote-trade matching / Event snapshot alignment -->

When analyzing time-series data, you often need to find the record in another table that is "closest in time" to a given event. For example:

- Find the latest quote at the time each stock trade occurred.
- Match each order with the price or inventory snapshot in effect at the moment the order was placed.
- Associate each event log entry with the previous or next state change.

Implementing such queries with a regular JOIN typically requires subqueries and window functions (such as `ROW_NUMBER()`), which makes the SQL complex and the execution costly. **ASOF JOIN** is a dedicated JOIN type that Doris provides for this kind of "time-series nearest-neighbor matching" scenario, allowing you to express the query in a single concise statement.

ASOF JOIN matches based on a datetime column. Unlike a regular equi-JOIN, it does not require exact equality. Instead, for each row in the left table, it picks the closest qualifying row from the right table according to the direction specified by `MATCH_CONDITION`.

> "Closest" here does not mean the smallest absolute time difference. It means the closest row that satisfies the condition in the direction specified by `MATCH_CONDITION`.

ASOF JOIN provides two subtypes:

| Type | Description | Handling of unmatched rows |
| --- | --- | --- |
| `ASOF JOIN` / `ASOF LEFT JOIN` | Left outer ASOF JOIN | Right-side columns are filled with NULL |
| `ASOF INNER JOIN` | Inner ASOF JOIN | The row is excluded from the result |

## Syntax

<!-- Knowledge type: Syntax reference -->

```sql
SELECT <select_list>
FROM <left_table>
ASOF [LEFT | INNER] JOIN <right_table>
    MATCH_CONDITION(<left_datetime_expr> <comparison_operator> <right_datetime_expr>)
    { ON <left_table.col> = <right_table.col> [AND ...]
    | USING (<column_name> [, ...]) }
```

Key points:

- `ASOF JOIN` is equivalent to `ASOF LEFT JOIN`. Rows in the left table without a match are kept, and the right-side columns are filled with NULL.
- `ASOF INNER JOIN` discards rows in the left table that have no match.
- `<comparison_operator>` must be one of `>=`, `>`, `<=`, or `<`.

## Parameters

<!-- Knowledge type: Parameter reference -->

| Parameter | Required | Description |
| --- | --- | --- |
| `left_table` | Yes | The left table (probe table). Every row in this table is evaluated. |
| `right_table` | Yes | The right table (build table). Used to look up the closest match. |
| `MATCH_CONDITION` | Yes | Defines the nearest-neighbor matching rule. Each side must reference a column from the corresponding table, and both columns must be of type `DATEV2`, `DATETIMEV2`, or `TIMESTAMPTZ`. Expressions are allowed. Supported operators: `>=`, `>`, `<=`, `<`. |
| `ON` / `USING` clause | Yes | Defines one or more equi-keys used as grouping keys. Matching is performed only within the same group. `ON` supports one or more equality (`=`) conditions and expressions (such as `SUBSTRING(l.code, 1, 3) = r.prefix`). `USING` supports one or more columns with the same name. |

## Matching Rules

<!-- Knowledge type: Behavior rules -->

The matching direction is determined by the comparison operator in `MATCH_CONDITION`:

| Operator | Matching behavior | Typical use case |
| --- | --- | --- |
| `>=` | For each row in the left table, find the **largest** row in the right table that is **less than or equal to** the left value | Find the latest snapshot or quote at or before the event time |
| `>` | For each row in the left table, find the **largest** row in the right table that is **strictly less than** the left value | Find the latest snapshot or quote strictly before the event time |
| `<=` | For each row in the left table, find the **smallest** row in the right table that is **greater than or equal to** the left value | Find the next event or snapshot at or after the current time |
| `<` | For each row in the left table, find the **smallest** row in the right table that is **strictly greater than** the left value | Find the next event or snapshot strictly after the current time |

Pay special attention to the following rules:

1. The columns in `MATCH_CONDITION` must be of type `DATEV2`, `DATETIMEV2`, or `TIMESTAMPTZ`.
2. Expressions are allowed inside `MATCH_CONDITION`, for example `MATCH_CONDITION(l.ts >= r.ts + INTERVAL 1 HOUR)` or `MATCH_CONDITION(l.ts >= DATE_ADD(r.ts, INTERVAL 3 HOUR))`.
3. The equi-key clause can be written as `ON` or `USING`. When using `ON`, only equality (`=`) conditions joined by `AND` are allowed. Inequality conditions (such as `>`, `OR`) and literal comparisons (such as `l.grp = 1`) are not allowed in the `ON` clause.
4. NULL values in the matching column or in the equi-key columns do not produce a match. If a left-table row has NULL in the matching column, or if no qualifying right-table row exists in the same group, the right-side columns are filled with NULL (LEFT JOIN) or the row is discarded (INNER JOIN).
5. When multiple rows in the right table share the same grouping key and the same value in the matching column, and they all satisfy the matching condition, one of them is returned (the result is non-deterministic).

## Examples

<!-- Knowledge type: Operational example -->
<!-- Applicable scenarios: Quote-trade matching / Order-price matching / Multi-table time-series alignment -->

### Data Preparation

The examples below revolve around a common scenario: a `trades` table and a `quotes` table, grouped by `symbol` and matched by time proximity.

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

Scenario: For each trade, find the latest quote within the same `symbol` whose `quote_time` is less than or equal to the `trade_time`.

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

For example, trade #1 (AAPL, 10:00:05) is matched with quote #1 (AAPL, 10:00:00) because that is the most recent quote within the same `symbol` at or before the trade time.

### Example 2: Find the Next Quote After Each Trade (<=)

Scenario: Reverse the matching direction and find the next quote that occurs after each trade.

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

There is no quote data after trade #3 (AAPL, 10:00:25), so the right side returns NULL.

### Example 3: Use INNER JOIN to Exclude Unmatched Rows

Scenario: Only the trades that have a match are of interest, and NULL rows should not propagate to downstream processing.

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

In this dataset, every trade has a matching quote, so the result is the same as Example 1. If a trade had no matching quote, that row would be excluded.

### Example 4: Group by Multiple Equality Conditions

Scenario: Group matching by both `product_id` and `region`, and for each order find the most recent effective price for the same product and region.

```sql
SELECT o.order_id, o.product_id, o.region, o.order_time,
       p.price, p.effective_time
FROM orders o
ASOF LEFT JOIN prices p
    MATCH_CONDITION(o.order_time >= p.effective_time)
    ON o.product_id = p.product_id AND o.region = p.region
ORDER BY o.order_id;
```

### Example 5: Use Expressions in MATCH_CONDITION

Scenario: A match is allowed only when the right-side timestamp is at least 1 hour earlier than the left-side timestamp.

```sql
SELECT l.id, l.ts, r.id AS rid, r.ts AS rts, r.data
FROM left_table l
ASOF LEFT JOIN right_table r
    MATCH_CONDITION(l.ts >= r.ts + INTERVAL 1 HOUR)
    ON l.grp = r.grp
ORDER BY l.id;
```

Datetime functions are also supported:

```sql
MATCH_CONDITION(l.ts >= DATE_ADD(r.ts, INTERVAL 3 HOUR))
MATCH_CONDITION(DATE_SUB(l.ts, INTERVAL 1 HOUR) >= r.ts)
```

### Example 6: Multi-Level ASOF JOIN

ASOF JOIN can be chained with other ASOF JOINs or with regular JOINs.

Associate each order with both the effective price and the inventory snapshot:

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

ASOF JOIN can also be mixed with regular JOIN:

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

Scenario: Count trades per `symbol` and compute the average bid price of their matched quotes.

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

### Example 8: Bidirectional Matching to Find Records Before and After

Scenario: For each order, find both the previous and the next effective price.

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

ASOF JOIN searches only in the direction specified by `MATCH_CONDITION`. **It does not compare the absolute time differences between left- and right-side records.**

Search "before":

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

Although `10:00:08` is only 2 seconds away from the left-side time and `10:00:00` is 6 seconds away, `MATCH_CONDITION(l.event_time >= r.ref_time)` only allows matching right-table records at or before the left-side timestamp, so the result is `10:00:00`.

Searching "after" works the opposite way:

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

### Example 10: Duplicate Matching Values Lead to Non-Deterministic Results

When multiple rows in the right table share the same grouping key and the same matching value, ASOF JOIN may return any one of them. This applies to the `TIMESTAMPTZ` type as well.

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

The query may also return `right_id = 2` with `tag = snapshot_b`. If your business logic requires deterministic results, deduplicate or pre-aggregate the right table before performing the ASOF JOIN.

## Equivalent Rewrite Using Window Functions

<!-- Knowledge type: Comparison -->

ASOF JOIN is semantically equivalent to the following `LEFT JOIN` + `ROW_NUMBER()` pattern, but its execution performance is significantly better:

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

<!-- Knowledge type: Usage recommendations -->

- **Prefer it for point-in-time queries on time-series data.** When you need to find the most recent (or nearest) record in a reference table for each row in a fact table, ASOF JOIN is the most natural and efficient approach.
- **Add appropriate equi-keys for grouping.** Include grouping keys in the `ON` or `USING` clause. The more precise the grouping, the smaller the search space and the better the performance.
- **Choose the right comparison operator.** Use `>=` when matches with identical timestamps should be included, and `>` when rows with identical timestamps should be strictly excluded. The same applies in the reverse direction.
- **Prefer `ASOF INNER JOIN` when unmatched rows are not needed.** This avoids producing NULL rows and simplifies downstream processing.
- **Deduplicate the right table when deterministic results are required.** If the right table contains multiple rows with the same grouping key and matching column value, ASOF JOIN may return any one of them.
- **Use expressions for time-offset matching.** For example, `MATCH_CONDITION(l.ts >= r.ts + INTERVAL 1 HOUR)` requires a gap of at least 1 hour.
