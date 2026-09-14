---
{
    "title": "BINLOG",
    "language": "en",
    "description": "Table function that returns the raw row-level change records of an internal table with Row Binlog enabled, for inspecting change records."
}
---

## Description

The table function returns the raw row-level change records of an internal table with Row Binlog enabled. Each record contains the visible columns of the base table (values after the change), the operation type, the commit timestamp, the sequence number within the transaction, and optionally the values before the change.

The function reads the stored raw records without folding or filtering and is mainly for troubleshooting. For everyday incremental consumption use [Table Stream](../../../data-operate/incremental/table-stream) or [`@incr` incremental queries](../../../data-operate/incremental/incremental-query).

This feature is available since version 5.0.0 and is experimental.

## Syntax

```sql
BINLOG(
    "table" = "<table_name>"
    [, "db" = "<db_name>"]
    [, "partition" = "<partition_name>[, ...]"]
    [, "tablet" = "<tablet_id>[, ...]"]
)
```

## Required Parameters

| Field | Description |
|---|---|
| **`<table_name>`** | The table name. The table must be an internal table with Row Binlog enabled (`"binlog.enable" = "true"`, `"binlog.format" = "ROW"`) |

## Optional Parameters

| Field | Description |
|---|---|
| **`<db_name>`** | The database name; defaults to the current database |
| **`<partition_name>`** | Read only the given partitions, separated by commas; defaults to all partitions |
| **`<tablet_id>`** | Read only the given tablets, separated by commas; defaults to all tablets |

## Return Value

| Field | Type | Description |
|---|---|---|
| Visible columns of the base table | Same as the base table | Values after the change. For delete records they are the values before deletion when `binlog.need_historical_value` is enabled, otherwise only the key columns have values |
| `__DORIS_BINLOG_OP__` | TINYINT | Operation type: `0` insert, `1` update, `2` delete |
| `__DORIS_BINLOG_TSO__` | BIGINT | Commit timestamp (TSO) |
| `__DORIS_BINLOG_LSN__` | BIGINT | Sequence number within the transaction |
| `__BEFORE__<column>__` | Same as the original column | Value before the change, one per non-key column. Present only when `binlog.need_historical_value` is enabled on the base table; NULL in insert records |

## Examples

Show the full change history of order 1 in `demo.orders`:

```sql
SELECT __DORIS_BINLOG_OP__ AS op, __DORIS_BINLOG_TSO__ AS tso,
       order_id, status, amount, __BEFORE__status__, __BEFORE__amount__
FROM BINLOG("db" = "demo", "table" = "orders")
WHERE order_id = 1
ORDER BY __DORIS_BINLOG_TSO__, __DORIS_BINLOG_LSN__;
```

```text
+------+--------------------+----------+---------+--------+--------------------+--------------------+
| op   | tso                | order_id | status  | amount | __BEFORE__status__ | __BEFORE__amount__ |
+------+--------------------+----------+---------+--------+--------------------+--------------------+
|    0 | 469067680972800000 |        1 | created | 100.00 | NULL               |               NULL |
|    1 | 469067681287372800 |        1 | paid    | 100.00 | created            |             100.00 |
|    2 | 469067681628160003 |        1 | paid    | 100.00 | paid               |             100.00 |
+------+--------------------+----------+---------+--------+--------------------+--------------------+
```

Count the changes of one partition only:

```sql
SELECT __DORIS_BINLOG_OP__, COUNT(*)
FROM BINLOG("table" = "orders", "partition" = "p20260914")
GROUP BY __DORIS_BINLOG_OP__;
```

A table without Row Binlog fails with:

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = binlog<row> is not enabled for table=orders
```
