---
{
    "title": "Quick Start",
    "language": "en",
    "description": "10-minute walkthrough of Doris Row Binlog and Table Stream: create a table with Row Binlog, create a Stream, write data, view changes, consume them downstream.",
    "keywords": [
        "Doris Table Stream quick start",
        "Row Binlog example",
        "CREATE STREAM",
        "binlog.enable",
        "binlog.format ROW",
        "binlog.need_historical_value",
        "min_delta",
        "show_initial_rows",
        "__DORIS_STREAM_CHANGE_TYPE_COL__",
        "__DORIS_STREAM_SEQUENCE_COL__",
        "INSERT INTO SELECT from stream",
        "table_stream_consumption",
        "consumption offset LAG",
        "incremental consumption tutorial",
        "Doris CDC example"
    ]
}
---

<!-- Knowledge type: Operations guide -->
<!-- Use cases: First use of Row Binlog / Table Stream -->

This page walks through the basic usage of Row Binlog and Table Stream with an orders table: record the inserts, updates, and deletes of the orders, then consume them exactly-once into a downstream table. All you need is a MySQL client and about 10 minutes.

## Prerequisites

<!-- Knowledge type: Environment requirements -->

- Doris 5.0.0 or later.
- Add the following to `fe.conf` on every FE and restart the FEs (neither is a dynamic configuration):

    ```text
    enable_feature_binlog = true
    enable_table_stream = true
    ```

- A MySQL client that can connect to Doris.

## Overview of the steps

1. Create the `orders` table with Row Binlog enabled and write the first batch of data.
2. Create a `min_delta` Table Stream on `orders`.
3. Write a second batch containing an update, a delete, and inserts.
4. View the changes through the Stream and understand the change type of each row.
5. Consume the changes into a downstream table with `INSERT INTO ... SELECT`.
6. Check the consumption progress in `information_schema.table_stream_consumption`.

## Step 1: Create a table with Row Binlog enabled

<!-- Knowledge type: Operational steps -->

Row Binlog can only be enabled at table creation. Create a Unique Key Merge-on-Write table and turn on `binlog.need_historical_value`, so that updates and deletes also record the values before the change:

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

Write the first batch:

```sql
INSERT INTO orders VALUES
    (1, 'created', 100.00),
    (2, 'created', 200.00),
    (3, 'created', 300.00);
```

## Step 2: Create a Table Stream

<!-- Knowledge type: Operational steps -->

Create a Stream on the `orders` table; the changes of `orders` are read and consumed through it from now on:

```sql
CREATE STREAM orders_stream ON TABLE orders
PROPERTIES (
    "type" = "min_delta",
    "show_initial_rows" = "false"
);
```

- `type = min_delta`: emit the net change of each key between two consumptions.
- `show_initial_rows = false`: the 3 rows that already exist are not emitted as changes; only changes after this point matter.

Querying the Stream returns nothing at this point:

```sql
SELECT * FROM orders_stream;
```

```text
Empty set
```

## Step 3: Write the second batch of changes

<!-- Knowledge type: Operational steps -->

This batch covers four cases: an update, a delete, an insert, and an insert followed by a delete:

```sql
-- Update order 1 (writing the same key into a Unique Key table is an update)
INSERT INTO orders VALUES (1, 'paid', 100.00);
-- Delete order 2
DELETE FROM orders WHERE order_id = 2;
-- New order 4
INSERT INTO orders VALUES (4, 'created', 400.00);
-- New order 5, deleted right after
INSERT INTO orders VALUES (5, 'created', 500.00);
DELETE FROM orders WHERE order_id = 5;
```

## Step 4: View the changes

<!-- Knowledge type: Operational steps + Result interpretation -->

Query through the Stream with two virtual columns: `__DORIS_STREAM_CHANGE_TYPE_COL__` is the change type and `__DORIS_STREAM_SEQUENCE_COL__` is the commit timestamp (TSO) of the change. Virtual columns are not included in `SELECT *` and must be listed explicitly.

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

Compared with the operations in step 3:

| Operation in step 3 | Output of the Stream |
|---|---|
| Update order 1 | An `UPDATE_BEFORE` (value before the update) and an `UPDATE_AFTER` (value after the update) pair |
| Delete order 2 | One `DELETE` carrying the value before deletion |
| Insert order 4 | One `APPEND` (a new key) |
| Insert order 5, then delete it | The net change between two consumptions is empty, so `min_delta` emits nothing |

Run the same query again and you get exactly the same result: **a plain SELECT only reads the changes and never advances the consumption offset.**

## Step 5: Consume the changes

<!-- Knowledge type: Operational steps -->

Use `INSERT INTO ... SELECT ... FROM <stream>` to write the changes into a downstream table. This statement advances the consumption offset in the same transaction as the write:

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

After consuming, the Stream has no pending changes:

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

Write more changes and the Stream only returns what happened after that consumption:

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

## Step 6: Check the consumption progress

<!-- Knowledge type: Operational steps + Operations monitoring -->

`information_schema.table_stream_consumption` shows the consumption offset and backlog of each Stream per partition:

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

| Column | Meaning |
|---|---|
| `UNIT` | The consumption unit, i.e. a partition of the base table. `orders` has no explicit partitions, so it has a single partition named after the table |
| `CONSUMPTION_STATUS` | The TSO the partition has been consumed up to |
| `LAG` | The difference between the latest committed TSO of the partition and the consumed TSO; `0` means no backlog |
| `LAST_CONSUMPTION_TIME` | The time of the most recent consumption (millisecond timestamp); `-1` means never consumed |

Run the `INSERT INTO orders_changes SELECT ...` from step 5 again and `LAG` goes back to `0`.

## Clean up

```sql
DROP STREAM orders_stream;
DROP TABLE orders_changes;
DROP TABLE orders;
```

## FAQ

<!-- Knowledge type: Troubleshooting -->

| Problem | Cause and action |
|---|---|
| Creating the Stream fails with `Table Stream is experimental. Please set enable_table_stream=true to enable it.` | `enable_table_stream` is not enabled on the FE, or the FE was not restarted after editing `fe.conf`. Follow [Prerequisites](#prerequisites) |
| The Stream is empty right after creation | With `show_initial_rows = false`, the data that already exists when the Stream is created is not emitted as changes. Write new changes and query again |
| `SELECT * FROM orders_stream` shows no change type | Virtual columns are not included in `SELECT *`; list `__DORIS_STREAM_CHANGE_TYPE_COL__` and `__DORIS_STREAM_SEQUENCE_COL__` explicitly |
| The same changes keep coming back on every query | A plain `SELECT` only reads changes and never advances the offset. They stop coming back once consumed with `INSERT INTO ... SELECT ... FROM orders_stream` |
| Enabling Row Binlog on an existing table | Row Binlog can only be enabled at table creation; create a new table with Row Binlog enabled and reload the data, see [Row Binlog](row-binlog#enabling-row-binlog) |
| `LAST_CONSUMPTION_TIME` shows `-1` | The partition has never been consumed |

## Next steps

- The differences between the three consumption types, the meaning of `show_initial_rows`, and the transactional semantics of reading versus consuming: [Table Stream Basics](table-stream)
- Consuming partition by partition, snapshot reads, joining dimension tables, and the effect of base table DDL on Streams: [Table Stream Advanced](table-stream-advanced)
- Row Binlog properties, supported scope, and limitations: [Row Binlog](row-binlog)
- Reading changes by time window without creating a Stream: [Incremental Query](incremental-query)
