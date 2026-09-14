---
{
    "title": "Table Stream Advanced",
    "language": "en",
    "description": "Advanced Doris Table Stream usage: partition-level consumption offsets and consuming partition by partition, @snapshot() snapshot reads and @reset(), joining dimension tables, multiple Streams and concurrent consumption, how base table schema changes / partition changes / table drops affect Streams, monitoring and recovery, and a list of common errors."
}
---

<!-- Knowledge type: Operations guide + Operations manual -->
<!-- Use cases: Consuming large tables partition by partition / Incremental joins with dimension tables / Rebuilding downstream / Operating consumption pipelines -->

This page assumes you have read [Table Stream Basics](table-stream.md); the examples reuse its `orders` table and `orders_stream`.

## Partition-level consumption offsets

Stream offsets are kept per partition of the base table, and every row of `information_schema.table_stream_consumption` corresponds to one partition:

```sql
SELECT UNIT, CONSUMPTION_STATUS, LAG, LAST_CONSUMPTION_TIME
FROM information_schema.table_stream_consumption
WHERE DB_NAME = 'demo' AND STREAM_NAME = 'orders_stream'
ORDER BY UNIT;
```

```text
+-----------+--------------------+-----------+-----------------------+
| UNIT      | CONSUMPTION_STATUS | LAG       | LAST_CONSUMPTION_TIME |
+-----------+--------------------+-----------+-----------------------+
| p20260912 | 469015470080000000 | 0         |         1789180806000 |
| p20260913 | 469041123123200000 | 0         |         1789267206000 |
| p20260914 | 469067681628160003 | 262144000 |         1789351206000 |
| p20260915 | N/A                | 0         |                    -1 |
+-----------+--------------------+-----------+-----------------------+
```

| Column | Description |
|---|---|
| `UNIT` | The consumption unit, i.e. the partition name. A table without explicit partitions has a single partition named after the table |
| `CONSUMPTION_STATUS` | The commit timestamp (TSO) the partition has been consumed up to. `N/A` means the partition has never been consumed |
| `LAG` | The difference between the latest committed TSO of the partition and the consumed TSO. `0` means no backlog; `N/A` means the partition has data but has never been consumed |
| `LAST_CONSUMPTION_TIME` | The time of the most recent consumption of the partition (millisecond timestamp); `-1` means never consumed |

The high bits of a TSO are physical time in milliseconds and the low 18 bits are a logical counter, so `LAG` divided by 262144 (2 to the power of 18) is roughly the backlog in milliseconds. In the example above, `p20260914` is about 1 second behind.

### Consuming by partition

When the changes of a large table concentrate in a few active partitions, use the `PARTITION` clause to consume only those partitions; only the offsets of the consumed partitions advance:

```sql
INSERT INTO dwd_orders
SELECT order_id, status, amount
FROM orders_stream PARTITION (p20260914)
WHERE __DORIS_STREAM_CHANGE_TYPE_COL__ IN ('APPEND', 'UPDATE_AFTER');
```

Multiple references to different partitions of the same Stream in one statement are merged into a single offset update.

In the compute-storage decoupled mode, one `INSERT` cannot consume more partitions than the FE configuration `cloud_table_stream_max_partitions_per_insert` (default 10000). Exceeding it fails with `Cloud Table Stream consumes N partitions, exceeding cloud_table_stream_max_partitions_per_insert=...`; consume in batches with `PARTITION`.

### Adding and removing partitions

- Partitions added after the Stream is created (including those created by dynamic partitioning and auto partitioning) have all their data emitted as changes; the first consumption of such a partition reads it from the beginning.
- After a partition is dropped, its offset record is cleaned up periodically by the FE (`table_stream_partition_offset_cleanup_interval_second`, default 3600 seconds); no manual action is needed. Unconsumed changes in the dropped partition disappear with it.

## Snapshot reads @snapshot()

`<stream>@snapshot()` returns the image of the base table at the **current consumption offset** of the Stream, that is, what the base table looked like before the changes pending in this round happened:

```sql
SELECT order_id, status, amount FROM orders_stream@snapshot() ORDER BY order_id;
```

Take the data in [Table Stream Basics](table-stream.md#consumption-types) as an example: the base table has orders 1, 2, and 3 when the Stream is created, then order 1 is updated, order 2 is deleted, and order 4 is inserted, and nothing has been consumed yet. `@snapshot()` still returns orders 1 (before the update), 2, and 3, while a plain read returns those changes. The relationship is: **snapshot + pending changes = current state of the base table**.

Characteristics of `@snapshot()`:

- It does not advance the offset, not even when its result is written into another table with `INSERT INTO ... SELECT FROM <stream>@snapshot()`.
- It returns a table image and provides no `__DORIS_STREAM_*` virtual columns.
- The image is taken per partition, each at its own consumption offset.
- For a Stream with `show_initial_rows = true`, partitions that have never been consumed have an empty snapshot (consumption starts from "nothing", and the existing data all belongs to the pending changes).

Typical uses:

- **Reconciliation**: before consuming, compare the result of `@snapshot()` with the downstream table to confirm downstream matches the base table state after the previous consumption, then consume this round of changes.
- **Rebuilding downstream**: when the downstream table is damaged, restore it from `@snapshot()` to the state corresponding to the consumption offset, then continue consuming normally; changes after the offset are neither skipped nor processed twice.
- **The "before" image in incremental joins**: see [Joining dimension tables](#joining-dimension-tables) below.

## Reset @reset()

`<stream>@reset()` returns the **current** full image of the base table. Reading it with a plain `SELECT` only shows the data; consuming it with `INSERT INTO ... SELECT FROM <stream>@reset()` advances the offsets of all partitions of the Stream to the current point, after which the Stream only emits changes that happen after this consumption:

```sql
-- Clear downstream, reload it in full, and advance the offset to now
TRUNCATE TABLE dwd_orders;
INSERT INTO dwd_orders
SELECT order_id, status, amount FROM orders_stream@reset();

-- Continue with incremental consumption
SELECT COUNT(*) FROM orders_stream;   -- 0
```

Typical uses:

- Downstream needs another full sync and then continues incrementally from the current point.
- The Stream was created with `show_initial_rows = false`, and the existing data needs to be synced after all.
- The Stream has accumulated too much backlog and downstream no longer needs the historical changes; jump straight to the current point.

Like `@snapshot()`, `@reset()` provides no `__DORIS_STREAM_*` virtual columns.

## Joining dimension tables

A Stream can be joined with other tables directly; the dimension table is read in its current state:

```sql
INSERT INTO dwd_orders_wide
SELECT o.order_id, o.status, o.amount, u.user_name, u.city
FROM orders_stream AS o
JOIN users AS u ON o.user_id = u.user_id
WHERE o.__DORIS_STREAM_CHANGE_TYPE_COL__ IN ('APPEND', 'UPDATE_AFTER');
```

If the dimension table itself changes and you need its state aligned with the consumption cadence, create a Stream on the dimension table too and use it in the same consumption job:

- `users_stream@snapshot()`: the image of the dimension table at the previous consumption.
- `users_stream`: the changes of the dimension table since the previous consumption.
- `users_stream@reset()`: the current image of the dimension table.

For example, join order changes with the user information as of the previous consumption, and handle the changes of the users table separately:

```sql
INSERT INTO dwd_orders_wide
SELECT o.order_id, o.status, o.amount, u.user_name, u.city
FROM orders_stream AS o
JOIN users_stream@snapshot() AS u ON o.user_id = u.user_id
WHERE o.__DORIS_STREAM_CHANGE_TYPE_COL__ IN ('APPEND', 'UPDATE_AFTER');
```

This statement advances only the offset of `orders_stream`; the offset of `users_stream` is advanced by the statement that consumes `users_stream`. The consumption cadence of the two Streams is up to your job orchestration.

## Multiple Streams and concurrent consumption

- **Multiple Streams on one base table**: each Stream keeps its own offsets and they do not affect each other. Different downstream systems can each create a Stream and consume at their own pace.
- **One statement consuming multiple Streams**: for example, UNION the changes of two tables into one target table; the offsets of all Streams involved advance in the same transaction.
- **Multiple consumers on one Stream**: when two sessions consume the same partition of the same Stream at the same time, the transaction that commits later fails and rolls back with `target offset already consumed`. Make sure each partition of a Stream has only one consumer at a time; for parallelism, split the job by partition or create a separate Stream per consumer.
- **Consumption concurrent with writes**: the base table can be written normally while a Stream is being consumed. The consuming statement reads the changes committed when it starts; writes committed later are left for the next round.

## Effect of base table changes

| Base table operation | Effect on the Stream |
|---|---|
| `ADD COLUMN` / `DROP COLUMN` | The columns of the Stream are synchronized automatically. New columns carry actual values in subsequent change records; dropped columns are no longer emitted |
| `ADD PARTITION`, dynamic partitioning, auto partitioning | The new partition is consumed from the beginning; all of its data is emitted as changes |
| `DROP PARTITION` | Unconsumed changes of the partition disappear with it; the offset record is cleaned up periodically by the FE |
| `TRUNCATE TABLE` / `TRUNCATE PARTITION` | The truncated partitions get new partition IDs, and data written afterwards is emitted as changes from the beginning; unconsumed changes before the truncation disappear. Other partitions are unaffected |
| `REPLACE PARTITION` (temporary partition replacement) | The replacing partition is consumed from the beginning; unconsumed changes of the replaced partition disappear |
| `RENAME` table or partition | No effect; the Stream references the base table by ID |
| `REPLACE WITH TABLE` | The Stream keeps pointing at the original table object (the one that now carries the other name), which is usually not what you want. Drop and recreate the Stream after replacing the base table |
| `DROP TABLE` on the base table | The Stream stays but can no longer be read. Drop it with `DROP STREAM ... FORCE` |
| `DROP DATABASE` | Streams in that database are dropped with it. Streams in other databases whose base tables were in the dropped database stay and also need `FORCE` to drop |

DDL that is not allowed on a base table with Row Binlog (such as `MODIFY COLUMN`) is listed in [Row Binlog](row-binlog.md#ddl-restrictions).

## Monitoring and recovery

### Monitoring

- **Backlog**: query `LAG` in `information_schema.table_stream_consumption` regularly and alert on partitions where it stays non-zero or keeps growing.
- **State**: `ENABLED`, `IS_STALE`, and `STALE_REASON` in `information_schema.table_streams` show whether a Stream is usable. The current version never cleans up Row Binlog, so a Stream does not become unusable by being left unconsumed; once automatic cleanup is available, a Stream whose change records were cleaned up will be marked stale and must be re-aligned with `@reset()`.
- **Consumption history**: `LAST_CONSUMPTION_TIME` tells whether the consumption job runs as scheduled.

### Recovery

- **The consuming statement failed**: the offset is unchanged; simply rerun it and no change is skipped.
- **Consumption succeeded but the scheduler did not record it**: a rerun reads the next batch of changes and does not consume the previous batch again. To make repeated runs completely free of side effects, use a Unique Key model for the target table (writes by primary key are naturally idempotent).
- **Downstream data is wrong and must be rebuilt**: restore the state corresponding to the consumption offset with `@snapshot()` and continue incremental consumption, or reload in full with `@reset()` which also advances the offset to the current point.
- **FE restart or master switch**: offsets are persisted in the metadata and consumption continues after a restart.

## Common errors

- `Table Stream is experimental. Please set enable_table_stream=true to enable it.`

    Cause: `enable_table_stream` is not enabled on the FE. Action: Update `fe.conf` and restart the FE.

- `Insert plan with Table stream failed. should enable binlog feature in FE config.`

    Cause: `enable_feature_binlog` is not enabled on the FE. Action: Update `fe.conf` and restart the FE.

- `Base Olap table ... need to enable row binlog for table stream`

    Cause: Row Binlog is not enabled on the base table. Action: Recreate the base table with `binlog.enable` + `binlog.format = ROW`.

- `MIN_DELTA table stream requires base mow table to enable binlog.need_historical_value=true`

    Cause: `min_delta` (the default type) needs before images. Action: Enable `binlog.need_historical_value` on the base table, or use `append_only`.

- `not supported type: xxx`

    Cause: Invalid `type` value. Action: Use `append_only` / `min_delta` / `detail`.

- `target offset already consumed`

    Cause: Concurrent consumption of the same partition; the offset was advanced before this transaction committed. Action: Rerun to read the next batch; avoid concurrent consumers.

- `Cloud Table Stream consumption only supports a normal INSERT into a local OLAP table`

    Cause: In the decoupled mode, consuming inside an explicit transaction or with Group Commit, or the target is not an internal table. Action: Use a plain `INSERT INTO ... SELECT`.

- `Cloud Table Stream consumes N partitions, exceeding cloud_table_stream_max_partitions_per_insert=...`

    Cause: Too many partitions in one statement. Action: Consume in batches with `PARTITION`, or raise the configuration.

- `Cloud Table Stream only supports DROP STREAM ... FORCE`

    Cause: `DROP STREAM` without `FORCE` in the decoupled mode. Action: Use `DROP STREAM ... FORCE`.

- `Unknown column '__DORIS_STREAM_CHANGE_TYPE_COL__' ...`

    Cause: A virtual column referenced on `@snapshot()` / `@reset()`. Action: Image reads provide no virtual columns.
