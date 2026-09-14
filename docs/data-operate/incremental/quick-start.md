---
{
    "title": "Quick Start",
    "language": "en",
    "description": "A 10-minute walkthrough of change data consumption in Doris: create a table with Row Binlog enabled, create a Table Stream, write a few batches, view the changes, consume them into a downstream table, and check the consumption offset."
}
---

<!-- Knowledge type: Operations guide -->
<!-- Use cases: First use of Row Binlog / Table Stream -->

This page walks through the basic usage of Row Binlog and Table Stream with an orders table. All you need is a MySQL client and about 10 minutes.

## Step 1: Enable the feature

Add the following to `fe.conf` on every FE and restart the FEs:

```text
enable_feature_binlog = true
enable_table_stream = true
```

## Step 2: Create a table with Row Binlog enabled

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

## Step 3: Create a Table Stream

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

## Step 4: Write the second batch of changes

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

## Step 5: View the changes

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

Compared with the operations in step 4:

- The update of order 1 is emitted as an `UPDATE_BEFORE` (value before the update) and an `UPDATE_AFTER` (value after the update) pair.
- The deletion of order 2 is emitted as a `DELETE` carrying the value before deletion.
- Order 4 is a new key and is emitted as `APPEND`.
- Order 5 was inserted and then deleted between two consumptions; its net change is empty, so `min_delta` emits nothing.

Run the same query again and you get exactly the same result: **a plain SELECT only reads the changes and never advances the consumption offset.**

## Step 6: Consume the changes

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

## Step 7: Check the consumption progress

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

- `UNIT`: the consumption unit, i.e. a partition of the base table. `orders` has no explicit partitions, so it has a single partition named after the table.
- `CONSUMPTION_STATUS`: the TSO the partition has been consumed up to.
- `LAG`: the difference between the latest committed TSO of the partition and the consumed TSO; `0` means no backlog.
- `LAST_CONSUMPTION_TIME`: the time of the most recent consumption (millisecond timestamp); `-1` means never consumed.

Run the `INSERT INTO orders_changes SELECT ...` from step 6 again and `LAG` goes back to `0`.

## Clean up

```sql
DROP STREAM orders_stream;
DROP TABLE orders_changes;
DROP TABLE orders;
```

## Next steps

- The differences between the three consumption types, the meaning of `show_initial_rows`, and the transactional semantics of reading versus consuming: [Table Stream Basics](table-stream.md)
- Consuming partition by partition, snapshot reads, joining dimension tables, and the effect of base table DDL on Streams: [Table Stream Advanced](table-stream-advanced.md)
- Row Binlog properties, supported scope, and limitations: [Row Binlog](row-binlog.md)
- Reading changes by time window without creating a Stream: [Incremental Query and Time Travel](incremental-query.md)
