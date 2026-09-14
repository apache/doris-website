---
{
    "title": "Incremental Query",
    "language": "en",
    "description": "Read row-level changes of a Doris table by time window with @incr, without a Table Stream: syntax, examples and limits of APPEND_ONLY, MIN_DELTA, DETAIL.",
    "keywords": [
        "@incr",
        "Doris incremental query",
        "incremental query",
        "startTimestamp",
        "endTimestamp",
        "incrementType",
        "APPEND_ONLY",
        "MIN_DELTA",
        "DETAIL",
        "changes by time window",
        "stateless incremental read",
        "__DORIS_BINLOG_OP__",
        "Row Binlog query",
        "external scheduler incremental ETL",
        "INCR query requires ROW binlog enabled on base table",
        "Table Stream vs @incr"
    ]
}
---

<!-- Knowledge type: Operations guide + Syntax description -->
<!-- Use cases: Ad-hoc incremental reads by time range / External systems managing their own positions -->

On a table with [Row Binlog](row-binlog) enabled, besides consuming changes through a [Table Stream](table-stream), you can read the changes of the table within a time window directly in a query with `@incr`, without creating any object or recording a consumption offset. It is a stateless, ordinary query and can be combined freely with WHERE, JOIN, aggregation, and so on.

:::caution Experimental feature
This feature is available since version 5.0.0 and is experimental. Use `@incr` in the integrated storage-compute mode for now; support in the compute-storage decoupled mode is still being completed.
:::

## Differences from Table Stream

<!-- Knowledge type: Comparison + Selection guide -->

| | `@incr` incremental query | Table Stream |
|---|---|---|
| Object to create | No | Yes |
| Read range | A time window you specify | From the last consumption offset to now |
| Who tracks the position | You (for example an external scheduler records the last window) | Doris, per partition, advanced atomically with the consuming transaction |
| Repeated reads | The same window can be read again and again | Consumed changes are not returned again |
| Best for | Ad-hoc analysis, looking back at changes in a period, external systems with their own position management | Continuous incremental ETL that must be exactly-once |

## Prerequisites

<!-- Knowledge type: Environment requirements -->

- Doris 5.0.0 or later, with `enable_feature_binlog = true` on the FE.
- Row Binlog enabled on the base table, otherwise the query fails with `INCR query requires ROW binlog enabled on base table.`.
- For `MIN_DELTA` mode, a Unique Key MoW base table with `binlog.need_historical_value` enabled.
- The integrated storage-compute mode for now.

## Syntax

<!-- Knowledge type: Syntax reference -->

```sql
SELECT ... FROM <table_name>@incr(
    ["startTimestamp" = "<datetime>",]
    ["endTimestamp"   = "<datetime>",]
    ["incrementType"  = "<APPEND_ONLY | MIN_DELTA | DETAIL>"]
) [PARTITION (<partition_name>, ...)] [<alias>]
[WHERE ...]
```

### Parameters

<!-- Knowledge type: Parameter reference -->

| Parameter | Default | Description |
|---|---|---|
| `startTimestamp` | unbounded | Optional. Start of the window, format `yyyy-MM-dd HH:mm:ss`, parsed in the session `time_zone`. Changes whose commit time is **greater than or equal to** the start are returned |
| `endTimestamp` | unbounded | Optional. End of the window, same format. Changes whose commit time is **less than** the end are returned |
| `incrementType` | `MIN_DELTA` | Optional. Incremental mode, see [The three incremental modes](#the-three-incremental-modes) |

All three parameters can be omitted; `t@incr()` reads the entire change history in `MIN_DELTA` mode. The window is a left-closed, right-open interval `[startTimestamp, endTimestamp)`; a start later than the end, or a start in the future, returns an empty result.

### Result columns

The result contains the visible columns of the base table plus the following hidden columns:

| Hidden column | Description |
|---|---|
| `__DORIS_BINLOG_OP__` | Change type: `0` insert (APPEND), `1` delete (DELETE), `2` before update (UPDATE_BEFORE), `3` after update (UPDATE_AFTER) |
| `__DORIS_BINLOG_TSO__` | Commit timestamp of the change |
| `__DORIS_BINLOG_LSN__` | Sequence number within the transaction, used for ordering together with the TSO |

## The three incremental modes

<!-- Knowledge type: Behavior rules + Selection guide -->

| Mode | Output | Base table requirements |
|---|---|---|
| `APPEND_ONLY` | Rows inserted within the window. Updates and deletes are not emitted | Row Binlog enabled |
| `MIN_DELTA` | The net change of each key within the window; see the folding rules below | MoW tables must have `binlog.need_historical_value` enabled |
| `DETAIL` | Every change within the window; an update is split into an UPDATE_BEFORE row and an UPDATE_AFTER row | Row Binlog enabled |

`MIN_DELTA` compares the state of each key at the start and at the end of the window:

| Key exists at the window start | Key exists at the window end | Output |
|---|---|---|
| No | Yes | One APPEND |
| Yes | Yes, and modified in between | One UPDATE_BEFORE (value at the start) + one UPDATE_AFTER (value at the end) |
| Yes | No | One DELETE |
| No | No | Nothing |

On Duplicate Key tables the three modes return the same result: Duplicate Key tables only have inserts, so there is nothing to fold.

## Examples

<!-- Knowledge type: Operational examples -->
<!-- Use cases: Comparing the output of the three modes on the same batch of changes -->

### Data preparation

The examples use the `orders` table from the [Quick Start](quick-start) (Unique Key MoW with the before image enabled). Assume the two batches were written at the following times:

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

### MIN_DELTA: net changes between 10:03 and 10:10

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

### APPEND_ONLY: rows inserted within the same window

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

### DETAIL: every change within the same window

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

### No window: net changes since the table was created

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

## Recommendations

<!-- Knowledge type: Usage recommendations -->
<!-- Use cases: Periodic increments driven by an external scheduler -->

- When an external scheduler drives the increments, use the previous `endTimestamp` as the next `startTimestamp`; the left-closed, right-open window guarantees no gaps and no duplicates. Note that windows are defined by commit time: a transaction that is still running does not appear in the current window and shows up in the window that contains its commit.
- If only the latest values matter and the values before an update are not needed, keep only the rows with `__DORIS_BINLOG_OP__ IN (0, 1, 3)`.
- An `@incr` query reads all change records within the window; the larger the window, the more it reads. Specify the window whenever possible.

## Limitations and common errors

<!-- Knowledge type: Troubleshooting -->

| Limitation | Error message | Action |
|---|---|---|
| The base table must have Row Binlog enabled | `INCR query requires ROW binlog enabled on base table.` | Recreate the base table with `binlog.enable` + `binlog.format = ROW`, see [Row Binlog](row-binlog#enabling-row-binlog) |
| `MIN_DELTA` requires a Unique Key MoW table with `binlog.need_historical_value` enabled | `MIN_DELTA INCR query requires base table to be UNIQUE KEY with enable_unique_key_merge_on_write=true` or `... requires base table to enable binlog.need_historical_value=true` | Recreate the base table accordingly, or use `APPEND_ONLY` / `DETAIL` |
| Only the base index can be read | - | Materialized views and rollups cannot be specified |
| The `PREAGGOPEN` hint is not supported | - | Remove the hint |
| Only `startTimestamp`, `endTimestamp`, and `incrementType` are accepted | `Unsupported parameter in incr query` | Check the spelling of the parameter names |
