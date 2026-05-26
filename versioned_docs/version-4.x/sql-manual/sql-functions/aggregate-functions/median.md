---
{
    "title": "MEDIAN",
    "language": "en",
    "description": "The MEDIAN function returns the median of the expression, equivalent to percentile(expr, 0.5)."
}
---

## Description

The MEDIAN function returns the median of the expression, equivalent to percentile(expr, 0.5).

## Syntax

```sql
MEDIAN(<expr>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<expr>` | The expression to calculate, supports types: Double, Float, LargeInt, BigInt, Int, SmallInt, TinyInt. |

## Return Value

Returns the same data type as the input expression.
Returns NULL if there is no valid data in the group.

## Example

```sql
-- setup
create table log_statis(
    datetime datetime,
    scan_rows int
) distributed by hash(datetime) buckets 1
properties ("replication_num"="1");
insert into log_statis values
    ('2025-08-25 10:00:00', 10),
    ('2025-08-25 10:00:00', 50),
    ('2025-08-25 10:00:00', 100),
    ('2025-08-25 11:00:00', 20),
    ('2025-08-25 11:00:00', 30),
    ('2025-08-25 11:00:00', 40);
```

```sql
select datetime, median(scan_rows) from log_statis group by datetime;
```

```text
select datetime, median(scan_rows) from log_statis group by datetime;
+---------------------+-------------------+
| datetime            | median(scan_rows) |
+---------------------+-------------------+
| 2025-08-25 10:00:00 |                50 |
| 2025-08-25 11:00:00 |                30 |
+---------------------+-------------------+
```

```sql
select median(scan_rows) from log_statis group by datetime;
```

```text
select median(scan_rows) from log_statis where scan_rows is null;
+-------------------+
| median(scan_rows) |
+-------------------+
|              NULL |
+-------------------+
```