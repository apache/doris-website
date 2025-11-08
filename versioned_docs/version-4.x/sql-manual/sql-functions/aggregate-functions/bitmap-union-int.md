---
{
    "title": "BITMAP-UNION-INT",
    "language": "en"
}
---

## Description

Counts the number of distinct values in the input expression. The return value is the same as COUNT(DISTINCT expr).

## Syntax

```sql
BITMAP_UNION_INT(<expr>)
```

## Arguments

| Argument | Description |
| -- | -- |
| `<expr>` | The input expression. Supported types: TinyInt, SmallInt, Integer. |

## Return Value

Returns the number of distinct values in the column. If there is no valid data in the group, returns 0.

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