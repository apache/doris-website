---
{
    "title": "MAX_BY",
    "language": "en"
}
---


## Description

The MAX_BY function returns the associated value based on the maximum value of the specified column.

## Syntax

```sql
MAX_BY(<expr1>, <expr2>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<expr1>` | The expression for the associated value, supports types: Bool, TinyInt, SmallInt, Int, BigInt, LargeInt, Float, Double, Decimal, String, Date, Datetime. |
| `<expr2>` | The expression for the maximum value, supports types: Bool, TinyInt, SmallInt, Int, BigInt, LargeInt, Float, Double, Decimal, String, Date, Datetime. |

## Return Value

Returns the same data type as <expr1>.
Returns NULL if there is no valid data in the group.

## Example

```sql
-- setup
create table tbl(
    k1 int,
    k2 int,
    k3 int,
    k4 int
) distributed by hash(k1) buckets 1
properties ("replication_num"="1");
insert into tbl values
    (0, 3, 2, 100),
    (1, 2, 3, 4),
    (4, 3, 2, 1),
    (3, 4, 2, 1);
```

```sql
select max_by(k1, k4) from tbl;
```

```text
+--------------------+
| max_by(`k1`, `k4`) |
+--------------------+
|                  0 |
+--------------------+ 
```

```sql
select max_by(k1, k4) from tbl where k1 is null;
```

```text
+----------------+
| max_by(k1, k4) |
+----------------+
|           NULL |
+----------------+
```
