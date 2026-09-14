---
{
    "title": "Incremental Query and Time Travel",
    "language": "en",
    "description": "Read the row-level changes of a Doris internal table by time window with @incr (APPEND_ONLY / MIN_DELTA / DETAIL modes) without creating a Table Stream, and query the image of a table at a past point in time with FOR TIME AS OF / FOR VERSION AS OF."
}
---

<!-- Knowledge type: Operations guide + Syntax description -->
<!-- Use cases: Ad-hoc incremental reads by time range / External systems managing their own positions / Viewing data as of a point in time / Troubleshooting accidental operations -->

On a table with [Row Binlog](row-binlog.md) enabled, besides consuming changes through a [Table Stream](table-stream.md), you can also read changes or historical states directly in a query:

- **Incremental query `@incr`**: read the changes of a table within a time window, without creating any object or recording a consumption offset.
- **Time travel `FOR TIME AS OF`**: query the image of a table at a past point in time.

Both are stateless, ordinary queries and can be combined freely with WHERE, JOIN, aggregation, and so on.

:::caution Experimental feature
This feature is available since version 5.0.0 and is experimental. Use `@incr` and time travel in the integrated storage-compute mode for now; support in the compute-storage decoupled mode is still being completed.
:::

## Incremental query @incr

### Differences from Table Stream

| | `@incr` incremental query | Table Stream |
|---|---|---|
| Object to create | No | Yes |
| Read range | A time window you specify | From the last consumption offset to now |
| Who tracks the position | You (for example an external scheduler records the last window) | Doris, per partition, advanced atomically with the consuming transaction |
| Repeated reads | The same window can be read again and again | Consumed changes are not returned again |
| Best for | Ad-hoc analysis, looking back at changes in a period, external systems with their own position management | Continuous incremental ETL that must be exactly-once |

### Syntax

```sql
SELECT ... FROM <table_name>@incr(
    ["startTimestamp" = "<datetime>",]
    ["endTimestamp"   = "<datetime>",]
    ["incrementType"  = "<APPEND_ONLY | MIN_DELTA | DETAIL>"]
) [PARTITION (<partition_name>, ...)] [<alias>]
[WHERE ...]
```

| Parameter | Default | Description |
|---|---|---|
| `startTimestamp` | unbounded | Optional. Start of the window, format `yyyy-MM-dd HH:mm:ss`, parsed in the session `time_zone`. Changes whose commit time is **greater than or equal to** the start are returned |
| `endTimestamp` | unbounded | Optional. End of the window, same format. Changes whose commit time is **less than** the end are returned |
| `incrementType` | `MIN_DELTA` | Optional. Incremental mode, see below |

All three parameters can be omitted; `t@incr()` reads the entire change history in `MIN_DELTA` mode. The window is a left-closed, right-open interval `[startTimestamp, endTimestamp)`; a start later than the end, or a start in the future, returns an empty result.

The result contains the visible columns of the base table plus the following hidden columns:

| Hidden column | Description |
|---|---|
| `__DORIS_BINLOG_OP__` | Change type: `0` insert (APPEND), `1` delete (DELETE), `2` before update (UPDATE_BEFORE), `3` after update (UPDATE_AFTER) |
| `__DORIS_BINLOG_TSO__` | Commit timestamp of the change |
| `__DORIS_BINLOG_LSN__` | Sequence number within the transaction, used for ordering together with the TSO |

### The three incremental modes

| Mode | Output | Base table requirements |
|---|---|---|
| `APPEND_ONLY` | Rows inserted within the window. Updates and deletes are not emitted | Row Binlog enabled |
| `MIN_DELTA` | The net change of each key within the window: absent at the start and present at the end → one APPEND; present at both ends and modified in between → one UPDATE_BEFORE (value at the start) + one UPDATE_AFTER (value at the end); present at the start and absent at the end → one DELETE; absent at both ends → nothing | MoW tables must have `binlog.need_historical_value` enabled |
| `DETAIL` | Every change within the window; an update is split into an UPDATE_BEFORE row and an UPDATE_AFTER row | Row Binlog enabled |

On Duplicate Key tables the three modes return the same result: Duplicate Key tables only have inserts, so there is nothing to fold.

### Examples

The examples use the `orders` table from the [Quick Start](quick-start.md) (Unique Key MoW with the before image enabled). Assume the two batches were written at the following times:

```sql
-- 10:00, first batch
INSERT INTO orders VALUES (1, 'created', 100.00), (2, 'created', 200.00), (3, 'created', 300.00);

-- 10:05, second batch
INSERT INTO orders VALUES (1, 'paid', 100.00);      -- update order 1
DELETE FROM orders WHERE order_id = 2;              -- delete order 2
INSERT INTO orders VALUES (4, 'created', 400.00);   -- new order 4
INSERT INTO orders VALUES (5, 'created', 500.00);   -- new order 5
DELETE FROM orders WHERE order_id = 5;              -- delete order 5 again
```

**MIN_DELTA: net changes between 10:03 and 10:10**

```sql
SELECT order_id, status, amount, __DORIS_BINLOG_OP__ AS op
FROM orders@incr(
    "startTimestamp" = "2026-09-14 10:03:00",
    "endTimestamp"   = "2026-09-14 10:10:00",
    "incrementType"  = "MIN_DELTA"
)
ORDER BY order_id, op;
```

```text
+----------+---------+--------+------+
| order_id | status  | amount | op   |
+----------+---------+--------+------+
|        1 | created | 100.00 |    2 |
|        1 | paid    | 100.00 |    3 |
|        2 | created | 200.00 |    1 |
|        4 | created | 400.00 |    0 |
+----------+---------+--------+------+
```

Order 5 was inserted and deleted within the window; its net change is empty, so it is not emitted.

**APPEND_ONLY: rows inserted within the same window**

```sql
SELECT order_id, status, amount, __DORIS_BINLOG_OP__ AS op
FROM orders@incr(
    "startTimestamp" = "2026-09-14 10:03:00",
    "endTimestamp"   = "2026-09-14 10:10:00",
    "incrementType"  = "APPEND_ONLY"
)
ORDER BY order_id;
```

```text
+----------+---------+--------+------+
| order_id | status  | amount | op   |
+----------+---------+--------+------+
|        4 | created | 400.00 |    0 |
|        5 | created | 500.00 |    0 |
+----------+---------+--------+------+
```

The update of order 1 and the deletion of order 2 are filtered out; the insert of order 5 is emitted, and its later deletion does not cancel that insert record.

**DETAIL: every change within the same window**

```sql
SELECT order_id, status, amount, __DORIS_BINLOG_OP__ AS op
FROM orders@incr(
    "startTimestamp" = "2026-09-14 10:03:00",
    "endTimestamp"   = "2026-09-14 10:10:00",
    "incrementType"  = "DETAIL"
)
ORDER BY __DORIS_BINLOG_TSO__, __DORIS_BINLOG_LSN__, op;
```

```text
+----------+---------+--------+------+
| order_id | status  | amount | op   |
+----------+---------+--------+------+
|        1 | created | 100.00 |    2 |
|        1 | paid    | 100.00 |    3 |
|        2 | created | 200.00 |    1 |
|        4 | created | 400.00 |    0 |
|        5 | created | 500.00 |    0 |
|        5 | created | 500.00 |    1 |
+----------+---------+--------+------+
```

**No window: net changes since the table was created**

```sql
SELECT order_id, status, amount, __DORIS_BINLOG_OP__ AS op
FROM orders@incr()
ORDER BY order_id;
```

```text
+----------+---------+--------+------+
| order_id | status  | amount | op   |
+----------+---------+--------+------+
|        1 | paid    | 100.00 |    0 |
|        3 | created | 300.00 |    0 |
|        4 | created | 400.00 |    0 |
+----------+---------+--------+------+
```

Counting from table creation, every key is absent at the start, so every key that still exists is emitted as APPEND with its latest value, and the deleted orders 2 and 5 are not emitted.

### Recommendations

- When an external scheduler drives the increments, use the previous `endTimestamp` as the next `startTimestamp`; the left-closed, right-open window guarantees no gaps and no duplicates. Note that windows are defined by commit time: a transaction that is still running does not appear in the current window and shows up in the window that contains its commit.
- If only the latest values matter and the values before an update are not needed, keep only the rows with `__DORIS_BINLOG_OP__ IN (0, 1, 3)`.
- An `@incr` query reads all change records within the window; the larger the window, the more it reads. Specify the window whenever possible.

### Limitations

- The base table must have Row Binlog enabled, otherwise the query fails with `INCR query requires ROW binlog enabled on base table.`.
- `MIN_DELTA` requires a Unique Key MoW table with `binlog.need_historical_value` enabled, otherwise it fails with `MIN_DELTA INCR query requires base table to be UNIQUE KEY with enable_unique_key_merge_on_write=true` or `... requires base table to enable binlog.need_historical_value=true`.
- Only the base index can be read; materialized views and rollups cannot be specified.
- The `PREAGGOPEN` hint is not supported.
- Keys other than the parameters above fail with `Unsupported parameter in incr query`.

## Time travel

Time travel returns the image of a table at a past point in time. It is used exactly like querying an ordinary table, with `FOR TIME AS OF` or `FOR VERSION AS OF` appended after the table name.

### Syntax

```sql
SELECT ... FROM <table_name> FOR TIME AS OF '<yyyy-MM-dd HH:mm:ss>' [<alias>] ...
SELECT ... FROM <table_name> FOR VERSION AS OF <tso> [<alias>] ...
```

- `FOR TIME AS OF`: returns the data committed by that time, parsed in the session `time_zone`.
- `FOR VERSION AS OF`: uses a commit timestamp (TSO) as the target and returns the data whose commit TSO is less than or equal to that value. A TSO can be obtained from the hidden base table column `__DORIS_COMMIT_TSO_COL__`, the Table Stream column `__DORIS_STREAM_SEQUENCE_COL__`, or `information_schema.table_stream_consumption`, which makes it possible to align exactly with a specific commit.

### Base table requirements

| Table model | Requirement |
|---|---|
| Duplicate Key | Row Binlog enabled |
| Unique Key MoW | Row Binlog enabled and `binlog.need_historical_value = true`, otherwise the query fails with `FOR VERSION/TIME AS OF on merge-on-write table requires binlog.need_historical_value=true` |
| Others | Not supported, fails with `FOR VERSION/TIME AS OF is only supported on duplicate or unique merge-on-write tables` |

A table without Row Binlog fails with `FOR VERSION/TIME AS OF requires row binlog`.

### Examples

Using the same `orders` table, query the image at 10:03 (the first batch is committed, the second has not happened yet):

```sql
SELECT order_id, status, amount
FROM orders FOR TIME AS OF '2026-09-14 10:03:00'
ORDER BY order_id;
```

```text
+----------+---------+--------+
| order_id | status  | amount |
+----------+---------+--------+
|        1 | created | 100.00 |
|        2 | created | 200.00 |
|        3 | created | 300.00 |
+----------+---------+--------+
```

Order 1 shows the value before its update, the deleted order 2 is still present, and orders 4 and 5 do not exist yet.

Align exactly with a commit by TSO:

```sql
SET show_hidden_columns = true;
SELECT MAX(__DORIS_COMMIT_TSO_COL__) FROM orders;
-- 469067680972800000

SELECT order_id, status FROM orders FOR VERSION AS OF 469067680972800000 ORDER BY order_id;
```

A time-travel relation can take part in joins like an ordinary table. For example, compare the current orders table with its image one hour ago to find orders whose status changed:

```sql
SELECT now.order_id, past.status AS old_status, now.status AS new_status
FROM orders AS now
JOIN orders FOR TIME AS OF '2026-09-14 09:00:00' AS past
  ON now.order_id = past.order_id
WHERE now.status <> past.status;
```

### Limitations

- A target time earlier than the table creation time, or earlier than the range covered by Row Binlog, returns an empty result; a very large value in `FOR VERSION AS OF` is equivalent to querying the current data.
- Only the base table is supported; time travel on materialized views or rollups is not.
- The current version never cleans up Row Binlog data, so any point in time since table creation can be queried. Once automatic cleanup is available, the reachable range will be bounded by the retention policy.
