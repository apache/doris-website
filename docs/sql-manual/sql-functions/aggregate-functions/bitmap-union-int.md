---
{
    "title": "BITMAP-UNION-INT",
    "language": "en",
    "description": "Counts distinct nonnegative integers in the input expression, ignoring negative values and NULLs."
}
---

## Description

Counts distinct nonnegative integers in the input expression, ignoring negative values and NULLs.

For supported integer inputs, this is equivalent to `COUNT(DISTINCT CASE WHEN expr >= 0 THEN expr END)` and to `BITMAP_COUNT(BITMAP_AGG(expr))`. It is equivalent to `COUNT(DISTINCT expr)` only when the input contains no negative values.

## Usage Notes

Ignoring negative values is the behavior of the development version. Earlier releases may count negative values; queries containing negative inputs can therefore return different results after upgrading.

## Syntax

```sql
BITMAP_UNION_INT(<expr>)
```

## Parameters

| Parameter | Description |
| --- | --- |
| `<expr>` | The input expression. Supported types: TinyInt, SmallInt, Integer. |

## Return Value

Returns a BIGINT containing the number of distinct nonnegative integers. NULLs and negative values are ignored. Returns 0 for empty input or a group containing only NULLs and negative values; the result is never NULL.

## Example

```sql
-- setup
CREATE TABLE pv_bitmap (
    dt INT,
    page INT,
    user_id BITMAP
) DISTRIBUTED BY HASH(dt) BUCKETS 1
PROPERTIES ("replication_num" = "1");
INSERT INTO pv_bitmap VALUES
    (1, 100, to_bitmap(100)),
    (1, 100, to_bitmap(200)),
    (1, 100, to_bitmap(300)),
    (1, 300, to_bitmap(300)),
    (2, 200, to_bitmap(300));
```

```text
Query OK, 0 rows affected
Query OK, 5 rows affected
```

```sql
select bitmap_union_int(dt) from pv_bitmap;
```

```text
+----------------------+
| bitmap_union_int(dt) |
+----------------------+
|                    2 |
+----------------------+
```

```sql
select bitmap_union_int(dt) from pv_bitmap where dt is null;
```

```text
+----------------------+
| bitmap_union_int(dt) |
+----------------------+
|                    0 |
+----------------------+
```

Negative integers are excluded while zero is included:

```sql
SELECT bitmap_union_int(x) AS nonnegative_count
FROM (
    SELECT -1 AS x UNION ALL SELECT 0 UNION ALL SELECT 1
    UNION ALL SELECT 1 UNION ALL SELECT NULL
) AS input;
```

```text
+-------------------+
| nonnegative_count |
+-------------------+
|                 2 |
+-------------------+
```

A group with only negative values and NULLs returns zero:

```sql
SELECT bitmap_union_int(x) AS nonnegative_count
FROM (SELECT -1 AS x UNION ALL SELECT -2 UNION ALL SELECT NULL) AS input;
```

```text
+-------------------+
| nonnegative_count |
+-------------------+
|                 0 |
+-------------------+
```
