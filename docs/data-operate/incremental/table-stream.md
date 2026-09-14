---
{
    "title": "Table Stream Basics",
    "language": "en",
    "description": "Doris Table Stream guide: creating, viewing, and dropping Streams, the semantics and comparison of the append_only / min_delta / detail consumption types, what show_initial_rows means, the transactional semantics of reading versus consuming, virtual columns, and usage limitations."
}
---

<!-- Knowledge type: Operations guide + Feature description -->
<!-- Use cases: Incremental ETL / Downstream table sync / Change auditing / Exactly-once consumption of table changes -->

A Table Stream (Stream below) is a change consumption object built on top of [Row Binlog](row-binlog.md). It remembers how far you have consumed: each read returns only the changes of the base table since the last consumption, and the consumption offset advances in the same transaction that writes the changes into the target table, so nothing is skipped or consumed twice.

:::caution Experimental feature
This feature is available since version 5.0.0 and is experimental. It requires `enable_feature_binlog = true` and `enable_table_stream = true` in the FE configuration.
:::

## Basic concepts

- **Base table**: the table a Stream tracks; it must have Row Binlog enabled. One base table can have multiple Streams, each consuming independently.
- **Consumption offset**: for every partition of the base table, the Stream records the commit timestamp (TSO) consumed so far. Reading a Stream returns, for each partition, the changes between its offset and the latest commit at the time the statement starts.
- **Change type**: `APPEND` (insert), `UPDATE_BEFORE` (value before an update), `UPDATE_AFTER` (value after an update), `DELETE` (delete, carrying the value before deletion).
- **Consumption type**: the `type` given when the Stream is created; it decides at what granularity changes are emitted, see [Consumption types](#consumption-types).
- **Reading versus consuming**: a plain `SELECT` only reads changes and never advances the offset; `INSERT INTO ... SELECT ... FROM <stream>` advances the offset when the write succeeds, see [Reading and consuming](#reading-and-consuming).

## Creating and managing Streams

### Creating a Stream

```sql
CREATE STREAM [IF NOT EXISTS] [<db_name>.]<stream_name>
ON TABLE [<db_name>.]<table_name>
[COMMENT '<comment>']
[PROPERTIES (
    "type" = "<append_only | min_delta | detail>",
    "show_initial_rows" = "<true | false>"
)]
```

| Property | Default | Description |
|---|---|---|
| `type` | `min_delta` | Consumption type. `min_delta` and `detail` require the base table to be a Unique Key MoW table with `binlog.need_historical_value` enabled; on Duplicate Key tables `min_delta` degrades to `append_only` |
| `show_initial_rows` | `false` | Whether the data that already exists when the Stream is created is emitted as changes. See [Initial rows](#initial-rows) |

Example:

```sql
CREATE STREAM orders_stream ON TABLE orders
COMMENT 'sync order changes to dwd'
PROPERTIES (
    "type" = "min_delta",
    "show_initial_rows" = "false"
);
```

Creating a Stream requires:

- Row Binlog enabled on the base table, otherwise `Base Olap table ... need to enable row binlog for table stream`.
- For `type = min_delta`, a MoW base table with `binlog.need_historical_value` enabled, otherwise `MIN_DELTA table stream requires base mow table to enable binlog.need_historical_value=true`.
- `CREATE_PRIV` on the database of the Stream and `SELECT_PRIV` on the base table.

The Stream and its base table can live in different databases. A Stream cannot share a name with a table or view. `CREATE OR REPLACE STREAM` is not supported yet.

### Viewing Streams

```sql
-- List the Streams in the current database
SHOW STREAMS;
SHOW STREAMS FROM demo LIKE 'orders%';

-- Show the CREATE STREAM statement
SHOW CREATE STREAM orders_stream;

-- Show the columns of the Stream (the same as the current visible columns of the base table)
DESC orders_stream;
```

```text
mysql> SHOW CREATE STREAM orders_stream\G
*************************** 1. row ***************************
       Stream: orders_stream
Create Stream: CREATE STREAM `orders_stream`
ON TABLE internal.demo.orders
COMMENT 'sync order changes to dwd'
PROPERTIES (
"type" = "MIN_DELTA",
"show_initial_rows" = "false"
);
```

`information_schema.table_streams` lists all Streams and their states; `information_schema.table_stream_consumption` shows the consumption offset and backlog of each partition:

```sql
SELECT STREAM_NAME, CONSUME_TYPE, BASE_TABLE_DB, BASE_TABLE_NAME, ENABLED, IS_STALE, STALE_REASON
FROM information_schema.table_streams
WHERE DB_NAME = 'demo';
```

```text
+---------------+--------------+---------------+-----------------+---------+----------+--------------+
| STREAM_NAME   | CONSUME_TYPE | BASE_TABLE_DB | BASE_TABLE_NAME | ENABLED | IS_STALE | STALE_REASON |
+---------------+--------------+---------------+-----------------+---------+----------+--------------+
| orders_stream | MIN_DELTA    | demo          | orders          |       1 |        0 | N/A          |
+---------------+--------------+---------------+-----------------+---------+----------+--------------+
```

The full column descriptions of the two system tables are in [table_streams](../../admin-manual/system-tables/information_schema/table_streams) and [table_stream_consumption](../../admin-manual/system-tables/information_schema/table_stream_consumption).

### Modifying a Stream

Only the comment can be modified at the moment:

```sql
ALTER STREAM orders_stream SET COMMENT 'new comment';
```

The consumption type and `show_initial_rows` cannot be changed after creation; drop and recreate the Stream instead.

### Dropping a Stream

```sql
DROP STREAM [IF EXISTS] [<db_name>.]<stream_name> [FORCE];
```

- Dropping a Stream does not affect the base table or its Row Binlog.
- A Stream whose base table has been dropped stays in the catalog; drop it with `FORCE`.
- In the compute-storage decoupled mode, `DROP STREAM ... FORCE` is mandatory.
- Running `DROP TABLE` on a Stream fails with a hint to use `DROP STREAM`.

## Consumption types

The three consumption types are compared below on the same data. The base table `orders` is a Unique Key MoW table with the before image enabled, and the following statements run after the Stream is created:

```sql
INSERT INTO orders VALUES (1, 'paid', 100.00);      -- update existing order 1
DELETE FROM orders WHERE order_id = 2;              -- delete existing order 2
INSERT INTO orders VALUES (4, 'created', 400.00);   -- new order 4
INSERT INTO orders VALUES (5, 'created', 500.00);   -- new order 5
DELETE FROM orders WHERE order_id = 5;              -- delete order 5 again
```

Then run:

```sql
SELECT order_id, status, amount, __DORIS_STREAM_CHANGE_TYPE_COL__ AS change_type
FROM <stream>
ORDER BY __DORIS_STREAM_SEQUENCE_COL__, __DORIS_STREAM_LSN_COL__;
```

### append_only

Only inserted rows are emitted; updates and deletes are not. Suitable for append-only logs and event tables, or when downstream only cares about new data.

```text
+----------+---------+--------+-------------+
| order_id | status  | amount | change_type |
+----------+---------+--------+-------------+
|        4 | created | 400.00 | APPEND      |
|        5 | created | 500.00 | APPEND      |
+----------+---------+--------+-------------+
```

- The update of order 1 and the deletion of order 2 are filtered out.
- The insert of order 5 is emitted; its later deletion does not cancel it.
- On MoW tables only writing a key that does not exist counts as an insert; writing an existing key is an update and is not emitted.

### min_delta (default)

All changes between two consumptions are folded per key and only the net change is emitted:

| Key exists at the consumption start | Exists now | Output |
|---|---|---|
| No | Yes | One `APPEND` with the current value |
| Yes | Yes (modified in between) | One `UPDATE_BEFORE` (value at the start) + one `UPDATE_AFTER` (current value) |
| Yes | No | One `DELETE` with the value at the start |
| No | No | Nothing |

```text
+----------+---------+--------+---------------+
| order_id | status  | amount | change_type   |
+----------+---------+--------+---------------+
|        1 | created | 100.00 | UPDATE_BEFORE |
|        1 | paid    | 100.00 | UPDATE_AFTER  |
|        2 | created | 200.00 | DELETE        |
|        4 | created | 400.00 | APPEND        |
+----------+---------+--------+---------------+
```

- Order 5 was inserted and then deleted; its net change is empty, so nothing is emitted.
- A key updated several times between two consumptions produces a single `UPDATE_BEFORE` / `UPDATE_AFTER` pair; intermediate values are folded away.
- Folding starts at the current consumption offset of the partition. If order 4 is modified again after this consumption, the `UPDATE_BEFORE` in the next read is the value at the time of this consumption.

`min_delta` is the most common type for keeping a downstream table in sync: downstream writes `APPEND` / `UPDATE_AFTER` rows and deletes on `DELETE` rows, stays consistent with the base table, and handles the fewest rows.

### detail

Every change is emitted row by row; an update is split into an `UPDATE_BEFORE` row and an `UPDATE_AFTER` row, and nothing is folded. Suitable for auditing, replay, and any scenario that needs the complete modification trail.

```text
+----------+---------+--------+---------------+
| order_id | status  | amount | change_type   |
+----------+---------+--------+---------------+
|        1 | created | 100.00 | UPDATE_BEFORE |
|        1 | paid    | 100.00 | UPDATE_AFTER  |
|        2 | created | 200.00 | DELETE        |
|        4 | created | 400.00 | APPEND        |
|        5 | created | 500.00 | APPEND        |
|        5 | created | 500.00 | DELETE        |
+----------+---------+--------+---------------+
```

### Behavior on Duplicate Key tables

Duplicate Key tables only record inserts, so the three types produce the same output: every written row is one `APPEND`, multiple writes of the same key are not merged, and rows removed by `DELETE` statements are not emitted (see [Row Binlog](row-binlog.md#duplicate-key-tables)). A `min_delta` Stream created on a Duplicate Key table is automatically handled as `append_only`.

## Initial rows

`show_initial_rows` decides whether the data that already exists when the Stream is created is emitted:

| Value | Behavior |
|---|---|
| `false` (default) | The consumption offset is initialized to the latest commit of each partition at creation time; only changes after creation are emitted |
| `true` | The first read emits the full current data of the base table as `APPEND` rows (the `__DORIS_STREAM_SEQUENCE_COL__` of each row is the commit timestamp of its partition); after that consumption the Stream switches to incremental |

`show_initial_rows = true` fits the pattern "sync the existing data first, then keep syncing increments" without a separate full load. Note that the first read returns the full image **as of the time of the read**: changes that happen between the creation of the Stream and its first consumption are reflected in that image rather than emitted as separate changes.

Regardless of the value, partitions added after the Stream is created have all their data emitted as changes.

## Reading and consuming

### Reads do not advance the offset

A plain `SELECT` on a Stream returns, for each partition, the changes between its consumption offset and the latest commit at the time the statement starts. The offset does not move, and repeating the query returns the same result (as long as the base table receives no new writes in between). Writes that land between two queries appear in the later query.

A Stream can be used like an ordinary table with WHERE, JOIN, aggregation, CTEs, and so on:

```sql
-- Only deletes
SELECT order_id FROM orders_stream
WHERE __DORIS_STREAM_CHANGE_TYPE_COL__ = 'DELETE';

-- Count the pending changes
SELECT __DORIS_STREAM_CHANGE_TYPE_COL__, COUNT(*)
FROM orders_stream GROUP BY 1;
```

### INSERT ... SELECT advances the offset

`INSERT INTO <target> SELECT ... FROM <stream>` advances the consumption offsets of the partitions involved to the upper bound of this read when the write transaction commits:

```sql
INSERT INTO dwd_orders
SELECT order_id, status, amount
FROM orders_stream
WHERE __DORIS_STREAM_CHANGE_TYPE_COL__ IN ('APPEND', 'UPDATE_AFTER');
```

Consumption semantics:

- **Atomicity**: writing the target table and advancing the offset happen in one transaction. If the statement fails or is cancelled, the offset stays unchanged and the next consumption reads the same batch again.
- **No duplicates**: once consumed, a batch of changes is never returned again. When two sessions consume the same partition of the same Stream at the same time, the transaction that commits later fails (`target offset already consumed`) and rolls back, so nothing is consumed twice.
- **Filtered means skipped**: the offset advances by read range, regardless of whether the SELECT filtered out some rows with WHERE. In the example above, the filtered `UPDATE_BEFORE` and `DELETE` rows will not appear again; if downstream also needs the deletes, write them in the same statement or consume them through a separate Stream.
- **Empty results also advance**: when the read returns no rows, the offset still advances to the upper bound of this read.
- **One statement can consume multiple Streams**, and all their offsets advance. A Stream referenced several times in one statement (aliases, CTEs, subqueries) advances only once, and every reference sees the same data.

The target table must be a Doris internal table. In the compute-storage decoupled mode, the consuming statement must be a plain `INSERT INTO ... SELECT`; running it inside an explicit transaction (`BEGIN ... COMMIT`) or with Group Commit fails with `Cloud Table Stream consumption only supports a normal INSERT into a local OLAP table`.

### A typical consumption pattern

Sync `min_delta` changes into a Unique Key target table: write inserts and post-update values directly, and apply deletes through the delete sign.

```sql
CREATE TABLE dwd_orders (
    order_id BIGINT,
    status   VARCHAR(16),
    amount   DECIMAL(10, 2)
)
UNIQUE KEY(order_id)
DISTRIBUTED BY HASH(order_id) BUCKETS 8
PROPERTIES ("enable_unique_key_merge_on_write" = "true");

INSERT INTO dwd_orders (order_id, status, amount, __DORIS_DELETE_SIGN__)
SELECT order_id, status, amount,
       CASE WHEN __DORIS_STREAM_CHANGE_TYPE_COL__ = 'DELETE' THEN 1 ELSE 0 END
FROM orders_stream
WHERE __DORIS_STREAM_CHANGE_TYPE_COL__ IN ('APPEND', 'UPDATE_AFTER', 'DELETE');
```

Run this statement on a schedule (for example with the Doris [Job Scheduler](../../admin-manual/workload-management/job-scheduler) or an external scheduler) and you have the simplest incremental sync pipeline. Writing into a Unique Key target table is naturally idempotent, so even if a run fails after committing but before the scheduler records its state and is re-executed, no incorrect data is produced.

## Virtual columns

The columns of a Stream are the current visible columns of the base table (synchronized automatically after `ADD COLUMN` / `DROP COLUMN` on the base table), plus three virtual columns. Virtual columns are not included in `SELECT *` and must be listed explicitly:

| Virtual column | Type | Description |
|---|---|---|
| `__DORIS_STREAM_CHANGE_TYPE_COL__` | STRING | Change type: `APPEND` / `UPDATE_BEFORE` / `UPDATE_AFTER` / `DELETE` |
| `__DORIS_STREAM_SEQUENCE_COL__` | BIGINT | Commit timestamp (TSO) of the change. Changes of one transaction share the same value; it can be used in `FOR VERSION AS OF` time travel, see [Incremental Query and Time Travel](incremental-query.md#time-travel) |
| `__DORIS_STREAM_LSN_COL__` | BIGINT | Sequence number of the change within its transaction. `ORDER BY __DORIS_STREAM_SEQUENCE_COL__, __DORIS_STREAM_LSN_COL__` is the order in which the changes happened |

`<stream>@snapshot()` and `<stream>@reset()` read table images rather than changes and provide no virtual columns; see [Table Stream Advanced](table-stream-advanced.md).

## Limitations

- The base table must be an internal table with Row Binlog enabled; supported table models and column type restrictions are listed in [Row Binlog](row-binlog.md#supported-scope-and-limitations).
- A Stream reads only the base index of the base table; rollups / materialized views cannot be specified, and the `TABLET (...)` clause is not supported.
- A Stream cannot be the target of `INSERT`, `UPDATE`, or `DELETE`.
- The consumption type and `show_initial_rows` cannot be changed after creation.
- The current version never cleans up Row Binlog data, so a Stream that is not consumed for a long time loses no changes. Once automatic cleanup is available, a Stream left unconsumed for too long may be unable to continue because its change records were cleaned up; this will be flagged through `IS_STALE` / `STALE_REASON` in `information_schema.table_streams`.
- The effect of dropping the base table, dropping or replacing partitions, and similar operations on a Stream is described in [Table Stream Advanced](table-stream-advanced.md#effect-of-base-table-changes).
