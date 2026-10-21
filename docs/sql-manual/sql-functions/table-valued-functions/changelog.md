---
{
    "title": "CHANGELOG",
    "language": "en",
    "description": "Table function that returns the raw row-level change records of an internal table with changelog enabled, for inspecting change records."
}
---

## Description

The table function returns the raw row-level change records of an internal table with [changelog](../../../data-operate/incremental/changelog) enabled. Each record contains the visible columns of the base table (values after the change), the operation type, the commit timestamp, the sequence number within the transaction, and optionally the values before the change.

The function reads the stored raw records without folding or filtering.

:::caution
`changelog()` is mainly for internal debugging and is not recommended in production data pipelines. Its output format and parameters may change between versions; use [Table Stream](../../../data-operate/incremental/table-stream) or [`@incr` incremental queries](../../../data-operate/incremental/incremental-query) for real incremental consumption.
:::

This feature is available since version 5.0.0 and is experimental. Earlier development builds named this function `binlog()`.

## Syntax

```sql
CHANGELOG(
    "table" = "<table_name>"
    [, "db" = "<db_name>"]
    [, "partition" = "<partition_name>[, ...]"]
    [, "tablet" = "<tablet_id>[, ...]"]
)
```

## Required Parameters

| Field | Description |
|---|---|
| **`<table_name>`** | The table name. The table must be an internal table with changelog enabled (`"changelog.enable" = "true"`) |

## Optional Parameters

| Field | Description |
|---|---|
| **`<db_name>`** | The database name; defaults to the current database |
| **`<partition_name>`** | Read only the given partitions, separated by commas; defaults to all partitions |
| **`<tablet_id>`** | Read only the given tablets, separated by commas; defaults to all tablets |

## Return Value

| Field | Type | Description |
|---|---|---|
| Visible columns of the base table | Same as the base table | Values after the change. For delete records they are the values before deletion when `changelog.need_historical_value` is enabled, otherwise only the key columns have values |
| `__DORIS_CHANGELOG_OP__` | BIGINT | Operation type: `0` insert, `1` update, `2` delete |
| `__DORIS_CHANGELOG_TSO__` | BIGINT | Commit timestamp (TSO) |
| `__DORIS_CHANGELOG_LSN__` | BIGINT | Sequence number within the transaction |
| `__DORIS_CHANGELOG_BEFORE_<column>__` | Same as the original column | Value before the change, one per non-key column. Present only when `changelog.need_historical_value` is enabled on the base table; NULL in insert records |

`SELECT *` returns the visible columns of the base table and, when `changelog.need_historical_value` is enabled, the `__DORIS_CHANGELOG_BEFORE_<column>__` columns; list the other hidden columns explicitly. All hidden and before-image column names start with the reserved prefix `__DORIS_`, which a view, a CTAS table or a materialized view cannot use as a column name. To define one of them on `changelog()`, list the columns and give these columns aliases.

## Examples

Show the full change history of order 1 in `demo.orders`:

```sql
SELECT __DORIS_CHANGELOG_OP__ AS op, __DORIS_CHANGELOG_TSO__ AS tso,
       order_id, status, amount,
       __DORIS_CHANGELOG_BEFORE_status__ AS before_status,
       __DORIS_CHANGELOG_BEFORE_amount__ AS before_amount
FROM CHANGELOG("db" = "demo", "table" = "orders")
WHERE order_id = 1
ORDER BY __DORIS_CHANGELOG_TSO__, __DORIS_CHANGELOG_LSN__;
```

```text
+------+--------------------+----------+---------+--------+---------------+---------------+
| op   | tso                | order_id | status  | amount | before_status | before_amount |
+------+--------------------+----------+---------+--------+---------------+---------------+
|    0 | 469067680972800000 |        1 | created | 100.00 | NULL          |          NULL |
|    1 | 469067681287372800 |        1 | paid    | 100.00 | created       |        100.00 |
|    2 | 469067681628160003 |        1 | paid    | 100.00 | paid          |        100.00 |
+------+--------------------+----------+---------+--------+---------------+---------------+
```

Count the changes of one partition only:

```sql
SELECT __DORIS_CHANGELOG_OP__, COUNT(*)
FROM CHANGELOG("table" = "orders", "partition" = "p20260914")
GROUP BY __DORIS_CHANGELOG_OP__;
```

A table without changelog fails with:

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = changelog is not enabled for table=orders
```
